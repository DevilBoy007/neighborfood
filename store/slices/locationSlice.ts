import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as Location from 'expo-location';
import { Platform, NativeModules } from 'react-native';

type LocationData = {
  coords: Location.LocationObjectCoords | null;
  zipCode: string | null;
  area: string | null;
  loading: boolean;
  error: string | null;
  usesImperialSystem: boolean;
};

const initialState: LocationData = {
  coords: null,
  zipCode: null,
  area: null,
  loading: true,
  error: null,
  usesImperialSystem: true, // Default to imperial
};

// Get device locale for determining distance units
const getDeviceLocale = (): string => {
  if (Platform.OS === 'ios') {
    return (
      NativeModules.SettingsManager?.settings?.AppleLocale ||
      NativeModules.SettingsManager?.settings?.AppleLanguages[0] ||
      'en_US'
    );
  } else if (Platform.OS === 'android') {
    return NativeModules.I18nManager?.localeIdentifier || 'en_US';
  } else {
    return typeof navigator !== 'undefined' ? navigator.language : 'en_US';
  }
};

// Check if user is likely to use miles (US, UK, etc.)
const checkUsesImperialSystem = (): boolean => {
  const locale = getDeviceLocale().toLowerCase();
  return locale.includes('us') || locale.includes('gb') || locale.includes('uk');
};

// Reverse geocoding using Google Maps Geocoding API with address descriptors
const reverseGeocodeWithDescriptors = async (
  latitude: number,
  longitude: number
): Promise<{ zipCode: string | null; area: string | null }> => {
  try {
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key not found');
      return { zipCode: null, area: null };
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&extra_computations=ADDRESS_DESCRIPTORS&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    let zipCode = null;
    let area = null;

    if (data.results && data.results.length > 0) {
      for (const result of data.results) {
        if (result.address_components) {
          for (const component of result.address_components) {
            if (component.types.includes('postal_code')) {
              zipCode = component.short_name;
              break;
            }
          }
        }
        if (zipCode) break;
      }

      if (data.address_descriptor?.areas && data.address_descriptor.areas.length > 0) {
        area = data.address_descriptor.areas[0].display_name?.text || null;
      }
    }

    return { zipCode, area };
  } catch (error) {
    console.error('Error in reverse geocoding with descriptors:', error);
    return { zipCode: null, area: null };
  }
};

export const fetchCurrentLocation = createAsyncThunk(
  'location/fetchCurrentLocation',
  async (_, { rejectWithValue }) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        return rejectWithValue('Permission to access location was denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { zipCode, area } = await reverseGeocodeWithDescriptors(
        location.coords.latitude,
        location.coords.longitude
      );

      return {
        coords: location.coords,
        zipCode,
        area,
        usesImperialSystem: checkUsesImperialSystem(),
      };
    } catch (error) {
      return rejectWithValue('Failed to get current location');
    }
  }
);

export const updateLocationCoords = createAsyncThunk(
  'location/updateLocationCoords',
  async (coords: Location.LocationObjectCoords, { rejectWithValue }) => {
    try {
      const { zipCode, area } = await reverseGeocodeWithDescriptors(
        coords.latitude,
        coords.longitude
      );

      return {
        coords,
        zipCode,
        area,
        usesImperialSystem: checkUsesImperialSystem(),
      };
    } catch (error) {
      return rejectWithValue('Failed to get address from coordinates');
    }
  }
);

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setLocationError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setLocationLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentLocation.fulfilled, (state, action) => {
        state.coords = action.payload.coords;
        state.zipCode = action.payload.zipCode;
        state.area = action.payload.area;
        state.usesImperialSystem = action.payload.usesImperialSystem;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchCurrentLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateLocationCoords.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateLocationCoords.fulfilled, (state, action) => {
        state.coords = action.payload.coords;
        state.zipCode = action.payload.zipCode;
        state.area = action.payload.area;
        state.usesImperialSystem = action.payload.usesImperialSystem;
        state.loading = false;
        state.error = null;
      })
      .addCase(updateLocationCoords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Helper function to format distance (exported for use in components)
export const formatDistance = (distanceInKm: number, usesImperialSystem: boolean): string => {
  if (usesImperialSystem) {
    const miles = distanceInKm * 0.621371;
    if (miles < 0.1) {
      const feet = miles * 5280;
      return `${Math.round(feet)} ft`;
    } else {
      return `${miles.toFixed(1)} mi`;
    }
  } else {
    if (distanceInKm < 1) {
      return `${(distanceInKm * 1000).toFixed(0)} m`;
    } else {
      return `${distanceInKm.toFixed(1)} km`;
    }
  }
};

export const { setLocationError, setLocationLoading } = locationSlice.actions;
export default locationSlice.reducer;

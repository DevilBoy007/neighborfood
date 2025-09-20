import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as Location from 'expo-location';
import { Platform, NativeModules } from 'react-native';

type LocationData = {
  coords?: Location.LocationObjectCoords | null;
  zipCode?: string | null;
  area?: string | null;
  loading: boolean;
  error?: string | null;
  usesImperialSystem: boolean;
};

interface LocationState extends LocationData {}

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
    // Web or other platforms - try to get from navigator
    return navigator.language || 'en_US';
  }
};

// Check if user is likely to use miles (US, UK, etc.)
const usesImperialSystem = (): boolean => {
  const locale = getDeviceLocale().toLowerCase();
  return locale.includes('us') || locale.includes('gb') || locale.includes('uk');
};

const initialState: LocationState = {
  coords: null,
  zipCode: null,
  area: null,
  loading: true,
  error: null,
  usesImperialSystem: usesImperialSystem(),
};

// Reverse geocoding using Google Maps Geocoding API with address descriptors
const reverseGeocodeWithDescriptors = async (
  latitude: number,
  longitude: number
): Promise<{ zipCode: string | null; area: string | null }> => {
  try {
    // Use the Geocoding API directly to get address descriptors
    const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key not found');
      return { zipCode: null, area: null };
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&enable_address_descriptor=true&language=en`
    );

    if (!response.ok) {
      console.error('Geocoding API request failed:', response.status);
      return { zipCode: null, area: null };
    }

    const data = await response.json();
    console.log('Geocoding response:', JSON.stringify(data, null, 2));

    if (data.status !== 'OK' || !data.results?.length) {
      console.error('Geocoding failed:', data.status, data.error_message);
      return { zipCode: null, area: null };
    }

    // Extract zip code from address components
    let zipCode: string | null = null;
    for (const result of data.results) {
      for (const component of result.address_components || []) {
        if (component.types.includes('postal_code')) {
          zipCode = component.long_name;
          break;
        }
      }
      if (zipCode) break;
    }

    // Extract area from address descriptors (new feature)
    let area: string | null = null;
    if (data.plus_code?.compound_code) {
      // Extract area from compound code (e.g., "ABCD+EF City, State, Country")
      const parts = data.plus_code.compound_code.split(',');
      if (parts.length > 1) {
        area = parts[1].trim();
        console.log('Extracted area from compound code:', area);
      }
    }

    // Alternative: try to get area from address descriptors if available
    if (!area && data.address_descriptor?.areas?.length > 0) {
      area = data.address_descriptor.areas[0].display_name?.text || null;
      console.log('Extracted area from address descriptors:', area);
    }

    return { zipCode, area };
  } catch (error) {
    console.error('Error in reverse geocoding with descriptors:', error);
    return { zipCode: null, area: null };
  }
};

// Async thunk to fetch current location
export const fetchCurrentLocation = createAsyncThunk(
  'location/fetchCurrentLocation',
  async (_, { rejectWithValue }) => {
    try {
      // Request location permissions
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return rejectWithValue('Permission to access location was denied');
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = location.coords;
      
      // Get additional location data
      const { zipCode, area } = await reverseGeocodeWithDescriptors(
        coords.latitude,
        coords.longitude
      );

      return {
        coords,
        zipCode,
        area,
        error: null,
      };
    } catch (error) {
      console.error('Error fetching location:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch location');
    }
  }
);

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    updateLocation: (state, action: PayloadAction<Location.LocationObjectCoords>) => {
      state.coords = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
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
        state.error = action.payload.error;
        state.loading = false;
      })
      .addCase(fetchCurrentLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { updateLocation, setLoading, setError } = locationSlice.actions;

// Helper function for formatting distance
export const formatDistance = (distanceInKm: number, usesImperialSystem: boolean): string => {
  if (usesImperialSystem) {
    // Convert to miles
    const miles = distanceInKm * 0.621371;
    if (miles < 0.1) {
      return '< 0.1 mi';
    } else if (miles < 1) {
      return `${miles.toFixed(1)} mi`;
    } else {
      return `${Math.round(miles)} mi`;
    }
  } else {
    // Keep in kilometers
    if (distanceInKm < 0.1) {
      // Show in meters for very short distances
      const meters = Math.round(distanceInKm * 1000);
      return `${meters} m`;
    } else if (distanceInKm < 1) {
      return `${distanceInKm.toFixed(1)} km`;
    } else {
      return `${Math.round(distanceInKm)} km`;
    }
  }
};

export default locationSlice.reducer;
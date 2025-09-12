import React, { createContext, useState, useContext, useEffect } from 'react';
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

type LocationContextType = {
    locationData: LocationData;
    updateLocation: (location: Location.LocationObjectCoords) => void;
    fetchCurrentLocation: () => Promise<void>;
    formatDistance: (distanceInKm: number) => string;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

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

// Reverse geocoding using Google Maps Geocoding API with address descriptors
const reverseGeocodeWithDescriptors = async (latitude: number, longitude: number): Promise<{zipCode: string | null, area: string | null}> => {
  try {
    // Use the Geocoding API directly to get address descriptors
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
      // Extract postal code from address components
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
      
      // Extract area (neighborhood) from address descriptors
      if (data.address_descriptor?.areas && data.address_descriptor.areas.length > 0) {
        // Use the first area which should be the most specific/smallest area
        area = data.address_descriptor.areas[0].display_name?.text || null;
        console.log('Extracted area from address descriptors:', area);
      }
    }
    
    return { zipCode, area };
  } catch (error) {
    console.error('Error in reverse geocoding with descriptors:', error);
    return { zipCode: null, area: null };
  }
};

export const LocationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [locationData, setLocationData] = useState<LocationData>({
        coords: null,
        zipCode: null,
        area: null,
        loading: true,
        error: null,
        usesImperialSystem: usesImperialSystem(),
    });

    // Format distance based on user's locale preference
    const formatDistance = (distanceInKm: number): string => {
        if (locationData.usesImperialSystem) {
            // Convert to miles
            const miles = distanceInKm * 0.621371;
            if (miles < 0.1) {
                // Use feet for very short distances
                const feet = miles * 5280;
                return `${Math.round(feet)} ft`;
            } else {
                return `${miles.toFixed(1)} mi`;
            }
        } else {
            // Keep as kilometers
            if (distanceInKm < 1) {
                return `${(distanceInKm * 1000).toFixed(0)} m`;
            } else {
                return `${distanceInKm.toFixed(1)} km`;
            }
        }
    };

    const updateLocation = async (coords: Location.LocationObjectCoords) => {
        try {
          let zipCode = null;
          let area = null;

          // Use Google Maps Geocoding API with address descriptors for all platforms
          const result = await reverseGeocodeWithDescriptors(coords.latitude, coords.longitude);
          zipCode = result.zipCode;
          area = result.area;
          
          setLocationData({
              coords,
              zipCode,
              area,
              loading: false,
              error: null,
              usesImperialSystem: usesImperialSystem(),
          });
        } catch (error) {
          setLocationData(prev => ({
              ...prev,
              coords,
              loading: false,
              error: 'Failed to get address from coordinates'
          }));
        }
    };

    const fetchCurrentLocation = async () => {
        try {
        setLocationData(prev => ({ ...prev, loading: true }));
        let { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
            setLocationData({
            coords: null,
            zipCode: null,
            area: null,
            loading: false,
            error: 'Permission to access location was denied',
            usesImperialSystem: usesImperialSystem(),
            });
            return;
        }

        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });
        
        await updateLocation(location.coords);
        } catch (error) {
        setLocationData({
            coords: null,
            zipCode: null,
            area: null,
            loading: false,
            error: 'Failed to get current location',
            usesImperialSystem: usesImperialSystem(),
        });
        }
    };

    // Initial location fetch
    useEffect(() => {
        const getLocation = async () => {
            await fetchCurrentLocation();
        };
        getLocation();
    }, []);

    return (
        <LocationContext.Provider value={{ 
            locationData, 
            updateLocation, 
            fetchCurrentLocation,
            formatDistance
        }}>
        {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};
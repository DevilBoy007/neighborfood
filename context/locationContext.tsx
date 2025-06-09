import React, { createContext, useState, useContext, useEffect } from 'react';
import * as Location from 'expo-location';
import { Platform, NativeModules } from 'react-native';
import { useGoogleMaps } from '@/components/GoogleMapsLoader';

// Define the Google Maps Geocoder type for web
declare global {
  interface Window {
    google?: {
      maps: {
        Geocoder: new () => {
          geocode(request: { location: { lat: number, lng: number } }): Promise<{
            results: Array<{
              address_components: Array<{
                short_name: string;
                long_name: string;
                types: string[];
              }>;
              formatted_address: string;
            }>;
          }>;
        };
      };
    };
  }
}

type LocationData = {
    coords?: Location.LocationObjectCoords | null;
    zipCode?: string | null;
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

// Update web reverse geocoding to use the shared Google Maps instance
const webReverseGeocode = async (latitude: number, longitude: number): Promise<string | null> => {
  try {
    // Check if the Google Maps API is loaded
    if (Platform.OS === 'web' && window.google?.maps) {
      const geocoder = new window.google.maps.Geocoder();
      
      const response = await geocoder.geocode({
        location: { lat: latitude, lng: longitude }
      });
      
      if (response.results && response.results.length > 0) {
        // Extract postal code from address components
        for (const result of response.results) {
          for (const component of result.address_components) {
            if (component.types.includes('postal_code')) {
              return component.short_name;
            }
          }
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error in web reverse geocoding:', error);
    return null;
  }
};

export const LocationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const { isLoaded } = useGoogleMaps();
    const [locationData, setLocationData] = useState<LocationData>({
        coords: null,
        zipCode: null,
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

          // Handle reverse geocoding differently based on platform
          if (Platform.OS === 'web') {
            // Only attempt web geocoding if Google Maps is loaded
            if (isLoaded) {
              zipCode = await webReverseGeocode(coords.latitude, coords.longitude);
            }
          } else {
            // Use Expo Location for native platforms
            const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: coords.latitude,
                longitude: coords.longitude,
            });
            zipCode = reverseGeocode[0]?.postalCode || null;
          }
          
          setLocationData({
              coords,
              zipCode,
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
            loading: false,
            error: 'Failed to get current location',
            usesImperialSystem: usesImperialSystem(),
        });
        }
    };

    // Update initial location fetch to consider Google Maps loading status
    useEffect(() => {
        if (Platform.OS === 'web' && !isLoaded) {
            // Wait for Google Maps to load before attempting to get location on web
            return;
        }
        
        const getLocation = async () => {
            await fetchCurrentLocation();
        };
        getLocation();
    }, [isLoaded]);

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
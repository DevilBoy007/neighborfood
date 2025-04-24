import React, { createContext, useState, useContext, useEffect } from 'react';
import * as Location from 'expo-location';
import { Platform, NativeModules } from 'react-native';

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

export const LocationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
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
        // Get ZIP code from coordinates
        const reverseGeocode = await Location.reverseGeocodeAsync({
            latitude: coords.latitude,
            longitude: coords.longitude,
        });
        
        const zipCode = reverseGeocode[0]?.postalCode || null;
        
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

    // Initial location fetch
    useEffect(() => {
        fetchCurrentLocation();
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
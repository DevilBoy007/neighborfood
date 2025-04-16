import React, { createContext, useState, useContext, useEffect } from 'react';
import * as Location from 'expo-location';

type LocationData = {
    coords?: Location.LocationObjectCoords | null;
    zipCode?: string | null;
    loading: boolean;
    error?: string | null;
};

type LocationContextType = {
    locationData: LocationData;
    updateLocation: (location: Location.LocationObjectCoords) => void;
    fetchCurrentLocation: () => Promise<void>;
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [locationData, setLocationData] = useState<LocationData>({
        coords: null,
        zipCode: null,
        loading: true,
        error: null,
    });

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
            error: 'Permission to access location was denied'
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
            error: 'Failed to get current location'
        });
        }
    };

    // Initial location fetch
    useEffect(() => {
        fetchCurrentLocation();
    }, []);

    return (
        <LocationContext.Provider value={{ locationData, updateLocation, fetchCurrentLocation }}>
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
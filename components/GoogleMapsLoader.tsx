import React, { useEffect, useState, createContext, useContext } from 'react';
import { Platform } from 'react-native';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// Create context to track Google Maps loading status
type GoogleMapsContextType = {
  isLoaded: boolean;
  hasError: boolean;
  error: Error | null;
};

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  hasError: false,
  error: null,
});

export const useGoogleMaps = () => useContext(GoogleMapsContext);

export const GoogleMapsLoader: React.FC<{children?: React.ReactNode}> = ({ children }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        // Skip loading on non-web platforms or if already loaded
        if (Platform.OS !== 'web' || window.google?.maps) {
            setIsLoaded(true);
            return;
        }

        // Check if script is already being loaded
        const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
        
        if (existingScript) {
            // If script exists, wait for it to load
            const checkGoogleExists = setInterval(() => {
                if (window.google?.maps) {
                    clearInterval(checkGoogleExists);
                    setIsLoaded(true);
                }
            }, 100);
            
            return () => clearInterval(checkGoogleExists);
        }

        // Load the script if it doesn't exist
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
            console.log('Google Maps script loaded successfully');
            setIsLoaded(true);
        };
        
        script.onerror = (e) => {
            console.error('Error loading Google Maps script:', e);
            setHasError(true);
            setError(new Error('Failed to load Google Maps API'));
        };
        
        document.head.appendChild(script);

        return () => {
            // We don't remove the script on unmount as it needs to be available globally
        };
    }, []);

    return (
        <GoogleMapsContext.Provider value={{ isLoaded, hasError, error }}>
            {children}
        </GoogleMapsContext.Provider>
    );
};
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export const GoogleMapsLoader: React.FC<{children?: React.ReactNode}> = ({ children }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Only load the script on web platform
        if (Platform.OS === 'web' && !window.google?.maps) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            console.log('Google Maps script loaded successfully');
            setIsLoaded(true);
        };
        script.onerror = (error) => {
            console.error('Error loading Google Maps script:', error);
        };
        document.head.appendChild(script);

        return () => {
            // Cleanup script if component is unmounted before script loads
            document.head.removeChild(script);
        };
        } else {
        setIsLoaded(true);
        }
    }, []);

    // On non-web platforms, or if script is loaded, just render children
    return <>{children}</>;
};
import React, { useState, useEffect, Fragment } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps'
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { useLocation } from '@/context/locationContext';

interface MarkerData {
    id: string;
    position: {
        lat: number;
        lng: number;
    };
    title: string;
    description: string;
}

const MapScreenWeb = () => {
    // Use the location context instead of local state
    const { locationData, fetchCurrentLocation } = useLocation();
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [mapKey, setMapKey] = useState(Date.now()); // Add key to force re-render

    useEffect(() => {
        fetchCurrentLocation();
    }, []);

    // Update markers when location changes from context
    useEffect(() => {
        if (locationData.coords) {
            setMarkers([
                {
                    id: '1',
                    position: {
                        lat: locationData.coords.latitude,
                        lng: locationData.coords.longitude
                    },
                    title: "You are here",
                    description: "This is your current location"
                },
                {
                    id: '2',
                    position: {
                        lat: locationData.coords.latitude + 0.001,
                        lng: locationData.coords.longitude + 0.001
                    },
                    title: "You are NOT here",
                    description: "This is NOT your current location"
                },
            ]);
            
            // Force map to re-render when coordinates are available
            setMapKey(Date.now());
        }
    }, [locationData.coords]);

    const handleMarkerClick = (markerId: string) => {
        setSelectedMarkerId(markerId === selectedMarkerId ? null : markerId);
    };

    if (locationData.loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00bfff" />
                <Text style={styles.loadingText}>Loading map...</Text>
            </View>
        );
    }

    if (locationData.error) {
        return <Text style={styles.errorText}>{locationData.error}</Text>;
    }

    if (!locationData.coords) {
        return <Text style={styles.loadingText}>Waiting for location data...</Text>;
    }

    return (
        <APIProvider 
            apiKey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY} 
            key={mapKey} // Use key to force re-render
        >
            <Map
                style={styles.map}
                defaultCenter={{
                    lat: locationData.coords.latitude,
                    lng: locationData.coords.longitude
                }}
                defaultZoom={16}
                mapId={"market"}
            >
                {markers.map(marker => (
                    <Fragment key={marker.id}>
                        <AdvancedMarker
                            position={marker.position}
                            title={marker.title}
                            onClick={() => handleMarkerClick(marker.id)}
                        >
                            <Pin
                                background={'#00bfff'}
                                borderColor={'#006425'}
                                glyphColor={'#b7ffb0'}
                                glyph={'🐰'}
                            />
                        </AdvancedMarker>
                        {selectedMarkerId === marker.id && (
                            <InfoWindow
                                position={marker.position}
                                onCloseClick={() => setSelectedMarkerId(null)}
                            >
                                <div>
                                    <h3>{marker.title}</h3>
                                    <p>{marker.description}</p>
                                </div>
                            </InfoWindow>
                        )}
                    </Fragment>
                ))}
            </Map>
        </APIProvider>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        fontFamily: 'TextMeOne',
        fontSize: 18,
        color: '#333',
        marginTop: 10,
    },
    errorText: {
        color: 'red',
        marginVertical: 2,
        marginHorizontal: 2,
        fontFamily: 'TextMeOne',
        fontSize: 21,
    }
});

export default MapScreenWeb;
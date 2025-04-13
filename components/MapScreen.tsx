import React from 'react';
import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Platform, LogBox, ActivityIndicator } from 'react-native';
import MapView, { PROVIDER_DEFAULT, PROVIDER_GOOGLE, Marker, Callout } from 'react-native-maps';
import { useLocation } from '@/context/locationContext';

interface MarkerData {
    id: string;
    coordinate: {
        latitude: number;
        longitude: number;
    };
    title: string;
    description: string;
}

LogBox.ignoreLogs(['VectorKit']);

const MapScreen = () => {
    // Use the location context instead of local state
    const { locationData, fetchCurrentLocation } = useLocation();
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
    const [mapKey, setMapKey] = useState(Date.now()); // Add key to force re-render

    useEffect(() => {
        fetchCurrentLocation();
    }, []);

    useEffect(() => {
        if (locationData.coords) {
            const newMarkers = [
                {
                    id: '1',
                    coordinate: {
                        latitude: locationData.coords.latitude,
                        longitude: locationData.coords.longitude,
                    },
                    title: 'Your Location',
                    description: 'You are here'
                },
                {
                    id: '2',
                    coordinate: {
                        latitude: (locationData.coords.latitude + 0.002),
                        longitude: (locationData.coords.longitude + 0.002),
                    },
                    title: 'Test Location',
                    description: 'Test marker'
                }
            ];
            setMarkers(newMarkers);

            // Force map to re-render when coordinates are available
            setMapKey(Date.now());
        }
    }, [locationData.coords]);

    const handleMarkerPress = (markerId: string) => {
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
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Waiting for location data...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container} key={mapKey}>
            <MapView
                provider={Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: locationData.coords.latitude,
                    longitude: locationData.coords.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                showsUserLocation={true}
                tintColor='#00bfff'
            >
                {markers.map(marker => (
                    <Marker
                        key={marker.id}
                        coordinate={marker.coordinate}
                        title={marker.title}
                        pinColor="#b7ffb0"
                        onPress={() => handleMarkerPress(marker.id)}
                    >
                        <Callout>
                            <View>
                                <Text>{marker.title}</Text>
                                <Text>{marker.description}</Text>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
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

export default MapScreen;
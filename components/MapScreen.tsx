import React from 'react';
import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Platform, LogBox } from 'react-native';
import * as Location from 'expo-location';
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
        }
    }, [locationData.coords]);

    const handleMarkerPress = (markerId: string) => {
        setSelectedMarkerId(markerId === selectedMarkerId ? null : markerId);
    };

    return (
        <View style={styles.container}>
            {locationData.coords ? (
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
            ) : (
                <Text>Loading map...</Text>
            )}
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
});

export default MapScreen;
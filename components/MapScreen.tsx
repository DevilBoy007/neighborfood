import React from 'react';
import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Platform, LogBox } from 'react-native';
import * as Location from 'expo-location';
import MapView, { PROVIDER_DEFAULT, PROVIDER_GOOGLE, Marker, Callout } from 'react-native-maps';

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
    const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            setLocation(location.coords);
        })();
    }, []);

    useEffect(() => {
        if (location) {
            const newMarkers = [
                {
                    id: '1',
                    coordinate: {
                        latitude: location.latitude,
                        longitude: location.longitude,
                    },
                    title: 'Your Location',
                    description: 'You are here'
                },
                {
                    id: '2',
                    coordinate: {
                        latitude: (location.latitude + 0.002),
                        longitude: (location.longitude + 0.002),
                    },
                    title: 'Test Location',
                    description: 'Test marker'
                }
            ];
            console.log('Setting markers:', newMarkers);
            setMarkers(newMarkers);
        }
    }, [location]);

    const handleMarkerPress = (markerId: string) => {
        setSelectedMarkerId(markerId === selectedMarkerId ? null : markerId);
    };

    return (
        <View style={styles.container}>
            {location ? (
                <MapView
                    provider={Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={{
                        latitude: location.latitude,
                        longitude: location.longitude,
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
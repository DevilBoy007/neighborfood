import React from 'react';
import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, Platform, LogBox, ActivityIndicator } from 'react-native';
import MapView, { PROVIDER_DEFAULT, PROVIDER_GOOGLE, Marker, Callout } from 'react-native-maps';
import { useLocation } from '@/context/locationContext';
import icon from '@/assets/images/rabbit-icon.png'

interface MarkerData {
    id: string;
    location: {
        latitude: number;
        longitude: number;
    };
    title: string;
    description: string;
    image: string;
}

interface Shop {
    id: string;
    name: string;
    description: string;
    location: {
        latitude: number;
        longitude: number;
    };
    backgroundImageUrl: string;
}

interface MapScreenProps {
    shops?: Shop[];
}

LogBox.ignoreLogs(['VectorKit']);

const MapScreen = ({ shops = [] }: MapScreenProps) => {
    const { locationData, fetchCurrentLocation } = useLocation();
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
    const [mapKey, setMapKey] = useState(Date.now()); // Add key to force re-render

    useEffect(() => {
        fetchCurrentLocation();
    }, []);

    useEffect(() => {
        if (locationData.coords) {
            const shopMarkers = shops.map(shop => ({
                id: `shop-${shop.id}`,
                location: {
                    latitude: shop.location.latitude,
                    longitude: shop.location.longitude
                },
                title: shop.name || 'Shop',
                description: shop.description || '',
                image: shop.backgroundImageUrl || ''
            }));
            setMarkers(shopMarkers);

            // Force map to re-render when coordinates are available
            setMapKey(Date.now());
        }
    }, [locationData.coords, shops]);

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
                {markers.map(marker => {
                    return (
                        <Marker
                            key={marker.id}
                            coordinate={{
                                latitude: marker.location.latitude,
                                longitude: marker.location.longitude
                            }}
                            title={marker.title}
                            icon={icon}
                            image={icon}
                            pinColor="#b7ffb0"
                            onPress={() => handleMarkerPress(marker.id)}
                        >
                            <Callout>
                                <View style={{ width: 150, height: 150 }}>
                                    <Image
                                        source={{ uri: marker.image }}
                                        style={{ width: 100, height: 50, borderRadius: 10 }}
                                        resizeMode="cover"
                                    />
                                    <Text style={ styles.calloutTitle }>{marker.title}</Text>
                                    <Text style={ styles.calloutDescription }>{marker.description}</Text>
                                </View>
                            </Callout>
                        </Marker>
                    );
                })}
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
    },
    calloutTitle: {
        fontWeight: 'bold',
    },
    calloutDescription: {
        fontStyle: 'italic',
    },
});

export default MapScreen;
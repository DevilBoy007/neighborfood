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
    image?: string;
}

interface Shop {
    id: string;
    name: string;
    description: string;
    location: {
        latitude: number;
        longitude: number;
    };
    backgroundImageUrl?: string;
}

interface WebMapScreenProps {
    shops?: Shop[];
}

const MapScreenWeb = ({ shops = [] }: WebMapScreenProps) => {

    const { locationData, fetchCurrentLocation } = useLocation();
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
    const [markers, setMarkers] = useState<MarkerData[]>([]);
    const [mapKey, setMapKey] = useState(Date.now()); // Add key to force re-render

    useEffect(() => {
        fetchCurrentLocation();
    }, []);

    useEffect(() => {
        if (locationData.coords) {
            // Create user location marker
            const baseMarkers = [
                {
                    id: 'user-location',
                    position: {
                        lat: locationData.coords.latitude,
                        lng: locationData.coords.longitude
                    },
                    title: "You are here",
                    description: "This is your current location",
                    image: ""
                }
            ];
            
            // Create shop markers
            const shopMarkers = shops.map(shop => ({
                id: `shop-${shop.id}`,
                position: {
                    lat: shop.location.latitude,
                    lng: shop.location.longitude
                },
                title: shop.name,
                description: shop.description,
                image: shop.backgroundImageUrl
            }));
            
            setMarkers([...baseMarkers, ...shopMarkers]);
            
            // Force map to re-render when coordinates are available
            setMapKey(Date.now());
        }
    }, [locationData.coords, shops]);

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
            apiKey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ''} 
            key={mapKey} // Use key to force re-render
        >
            <Map
                style={styles.map}
                defaultCenter={{
                    lat: locationData.coords.latitude,
                    lng: locationData.coords.longitude
                }}
                defaultZoom={12}
                mapId={"market"}
                reuseMaps={true}
            >
                {markers.map(marker => (
                    <Fragment key={marker.id}>
                        <AdvancedMarker
                            position={marker.position}
                            title={marker.title}
                            onClick={() => handleMarkerClick(marker.id)}
                        >
                            <Pin
                                background={marker.id === 'user-location' ? '#00bfff' : '#b7ffb0'}
                                borderColor={'#006425'}
                                glyphColor={'#ffffff'}
                                glyph={marker.id === 'user-location' ? '📍' : '🐰'}
                            />
                        </AdvancedMarker>
                        {selectedMarkerId === marker.id && (
                            <InfoWindow
                                headerContent={<img src={marker.image} style={{height: 75, width: 200}}/>}
                                position={marker.position}
                                onCloseClick={() => setSelectedMarkerId(null)}
                            >
                                <div>
                                    <h3>{marker.title}</h3>
                                    <p><i>{marker.description}</i></p>
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
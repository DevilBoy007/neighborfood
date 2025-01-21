import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps'
import { StyleSheet, Text } from 'react-native';
import * as Location from 'expo-location';

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
    const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

    const [markers, setMarkers] = useState<MarkerData[]>([
        {
            id: '1',
            position: {
                lat: location?.latitude || 0,
                lng: location?.longitude || 0
            },
            title: "You are here",
            description: "This is your current location"
        },
        // Add more markers as needed
    ]);

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

            setMarkers(prev => [
                {
                    ...prev[0],
                    position: {
                        lat: location.coords.latitude,
                        lng: location.coords.longitude
                    }
                },
                ...prev.slice(1)
            ]);
        })();
    }, []);

    const handleMarkerClick = (markerId: string) => {
        setSelectedMarkerId(selectedMarkerId === markerId ? null : markerId);
    };
    
    return (
        <>
            {location?.latitude && location?.longitude &&
                <APIProvider apiKey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY} onLoad={() => console.log('Loaded Google Maps API')}> 
                    <Map
                        style = {{width: '100%', height: '100%', borderRadius: 10}}
                        defaultCenter={{lat: location.latitude, lng: location.longitude}}
                        defaultZoom={16}
                        reuseMaps={true}
                        mapId={"market"}
                    >
                        {markers.map(marker => (
                            <AdvancedMarker
                                key={marker.id}
                                position={marker.position}
                                title={marker.title}
                                onClick={() => handleMarkerClick(marker.id)}
                            >
                                {selectedMarkerId === marker.id && (
                                    <InfoWindow
                                        onCloseClick={() => setSelectedMarkerId(null)}
                                    >
                                        <Text>{marker.description}</Text>
                                    </InfoWindow>
                                )}
                                <Pin
                                    background={'#00bfff'}
                                    borderColor={'#006425'}
                                    glyphColor={'#B7FFB0'}
                                    glyph={'🐰'}
                                />
                            </AdvancedMarker>
                        ))}
                    </Map>
                </APIProvider>
    }
            { errorMsg && <Text style={styles.errorText}>{errorMsg}</Text> }
        </>
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
    errorText: {
        color: 'red',
        marginVertical: 2,
        marginHorizontal: 2,
        fontFamily: 'TextMeOne',
        fontSize: 21,
    }
});

export default MapScreenWeb;
import React, { useState, useEffect, Fragment } from 'react';
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

    const [markers, setMarkers] = useState<MarkerData[]>([]);

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

    // Update markers when location changes
    useEffect(() => {
        if (location) {
            setMarkers([
                {
                    id: '1',
                    position: {
                        lat: location.latitude,
                        lng: location.longitude
                    },
                    title: "You are here",
                    description: "This is your current location"
                },
                {
                    id: '2',
                    position: {
                        lat: location.latitude + 0.001,
                        lng: location.longitude + 0.001
                    },
                    title: "You are NOT here",
                    description: "This is NOT your current location"
                },
            ]);
        }
    }, [location]);

    const handleMarkerClick = (markerId: string) => {
        setSelectedMarkerId(markerId === selectedMarkerId ? null : markerId);
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
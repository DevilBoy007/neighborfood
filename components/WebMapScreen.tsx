import React, {useState, useEffect} from 'react';
import {APIProvider, Map, AdvancedMarker, Pin} from '@vis.gl/react-google-maps'
import { StyleSheet, Text } from 'react-native';
import * as Location from 'expo-location';

const MapScreenWeb = () => {
    const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
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

    return (
        <>
            {location &&
                <APIProvider apiKey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY} onLoad={() => console.log('Loaded Google Maps API')}> 
                    <Map
                        style = {{width: '100%', height: '100%', borderRadius: 10}}
                        defaultCenter={{lat: location.latitude, lng: location.longitude}}
                        defaultZoom={16}
                        reuseMaps={true}
                        mapId={"market"}
                    >
                        <AdvancedMarker
                            position={{lat: location.latitude, lng: location.longitude}}
                            title="You are here"
                        >
                            <Pin
                                background={'#00bfff'}
                                borderColor={'#006425'}
                                glyphColor={'#B7FFB0'}
                            />
                        </AdvancedMarker>
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
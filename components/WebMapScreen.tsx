import React, {useState, useEffect} from 'react';
import { GoogleMap, LoadScript } from '@react-google-maps/api';
import { View, StyleSheet, Text } from 'react-native';
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
        <View style={{ flex: 1 }}>
            {location &&
                <LoadScript googleMapsApiKey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                    mapContainerStyle={styles.map}
                    center={{
                        lat: location?.latitude || 0,
                        lng: location?.longitude || 0
                    }}
                    zoom={15}
                />
            </LoadScript>}
            { errorMsg && <Text style={styles.errorText}>{errorMsg}</Text> }
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
    errorText: {
        color: 'red',
        marginVertical: 2,
        marginHorizontal: 2,
        fontFamily: 'TextMeOne',
        fontSize: 21,
    }
});

export default MapScreenWeb;
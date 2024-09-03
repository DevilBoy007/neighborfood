import React from 'react';
import { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import * as Location from 'expo-location';
import 'mapbox-gl/src/css/mapbox-gl.css';
import MapboxGL from '@rnmapbox/maps';

MapboxGL.setAccessToken('pk.eyJ1IjoiZGJha3IiLCJhIjoiY20wa2llMWplMTloNTJqcTBpcTBoMGZhMiJ9.cr0XwiK22YtOzeSP2bcKwA');
const [location, setLocation] = useState<Location.LocationObject | null>(null);
const [errorMsg, setErrorMsg] = useState<string | null>(null);

useEffect(() => {
    (async () => {

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setErrorMsg('Permission to access location was denied');
            return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
    })();
}, []);

const MapScreen = () => {
    return (
        <View style={styles.container}>
            <MapboxGL.MapView style={styles.map}>
                <MapboxGL.Camera
                    zoomLevel={14}
                    centerCoordinate={location ? [location.coords.longitude, location.coords.latitude] : [-122.4324, 37.78825]}
                />
            </MapboxGL.MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
});

export default MapScreen;
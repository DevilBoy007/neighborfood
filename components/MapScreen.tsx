import React from 'react';
import { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import * as Location from 'expo-location';

const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
const [errorMsg, setErrorMsg] = useState<string | null>(null);

useEffect(() => {
    (async () => {
        let location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
        });
        setLocation(location.coords);
    })();
}, []);

const MapScreen = () => {
    return (
        <View style={styles.container}>
            
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
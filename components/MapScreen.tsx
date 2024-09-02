import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapboxGL from '@rnmapbox/maps';

MapboxGL.setAccessToken('pk.eyJ1IjoiZGJha3IiLCJhIjoiY20wa2llMWplMTloNTJqcTBpcTBoMGZhMiJ9.cr0XwiK22YtOzeSP2bcKwA');

const MapScreen = () => {
    return (
        <View style={styles.container}>
            <MapboxGL.MapView style={styles.map}>
                <MapboxGL.Camera
                    zoomLevel={14}
                    centerCoordinate={[-122.4324, 37.7882]}
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
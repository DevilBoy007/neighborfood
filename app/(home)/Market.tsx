import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Placeholder for the Shop component
const Shop = ({ name }: { name: string }) => (
    <View style={styles.shopItem}>
        <Text style={styles.shopName}>{name}</Text>
        <View style={styles.shopCircles}>
            {[...Array(4)].map((_, i) => (
                <View key={i} style={styles.circle} />
            ))}
        </View>
    </View>
);

const MarketScreen = () => {
    const [isMapView, setIsMapView] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSortOptions, setShowSortOptions] = useState(false);
    
    const shops = [
        "Ben's Beef",
        "Big Baskets",
        "Ann's Apples",
        "Happy Alan's Produce"
    ]; // this is a placeholder for the list of shops which will eventually load from a data source

    const toggleView = () => setIsMapView(!isMapView);
    
    return (
        <>
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>market</Text>
            </View>

            <View style={ styles.searchContainer }>
                <Ionicons name="search" size={ 20 } color="gray" style={ styles.searchIcon } />
                <TextInput
                    style= {styles.searchInput }
                    placeholder="search"
                    placeholderTextColor={ '#999' }
                    value={ searchQuery }
                    onChangeText={ setSearchQuery }
                />
                <TouchableOpacity style={ styles.textButton }>
                    <Text style={{ fontFamily: 'TextMeOne' }}>sort</Text>
                </TouchableOpacity>
                <TouchableOpacity style={ styles.textButton } onPress={ toggleView }>
                    <Text style={{ fontFamily: 'TextMeOne' }}>{ isMapView ? 'list' : 'map' }</Text>
                </TouchableOpacity>
            </View>

            {isMapView ? (
                <View style={ styles.mapContainer }>
                    <Text style={ styles.mapPlaceholder }>MAPBOX</Text>
                </View>
            ) : (
                <FlatList
                    data={ shops }
                    renderItem={({ item }) => <Shop name={ item } />}
                    keyExtractor={ ( item ) => item}
                />
            )}
        </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#B7FFB0',
        minHeight: '100%',
        ...Platform.select({
            web:{
                minWidth: '100%',
            }
        })
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 16,
        marginTop: 40,
    },
    title: {
        fontSize: Platform.select({ios: 30, web: 80}),
        fontWeight: 'bold',
        fontFamily: 'TitanOne',
        color: '#fff',
    },
    profileIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'gray',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 20,
        paddingLeft: 30,
        backgroundColor: 'white',
        color: '#00bfff',
        fontFamily: 'TextMeOne',
    },
    textButton: {
        marginLeft: 8,
        padding: 8,
        backgroundColor: 'white',
        borderRadius: 20,
    },
    mapContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            web: {
                marginTop: 40,
            }
        })
    },
    mapPlaceholder: {
        fontSize: 22,
        color: 'gray',
        backgroundColor: 'white',
        marginBottom: 75,
        borderRadius: 6,
        paddingVertical: Platform.select({ios: 275, web: 240}),
        paddingHorizontal: Platform.select({ios: 140, web: 425})
    },
    editDetailsContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        // Adjust the height as needed
        height: '90%',
    },
    iconButton: {
        padding: 10,
        ...Platform.select({
            web: {
                marginBottom: 20,
            },
        }),
    },
    shopItem: {
        backgroundColor: 'white',
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 8,
    },
    shopName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    shopCircles: {
        flexDirection: 'row',
        marginTop: 8,
    },
    circle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'yellow',
        marginRight: 8,
    },
});

export default MarketScreen;
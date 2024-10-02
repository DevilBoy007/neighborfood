import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import EditDetails from "@/components/EditDetails";

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
    const [showEditDetails, setShowEditDetails] = useState(false);
    const [isMapView, setIsMapView] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSortOptions, setShowSortOptions] = useState(false);
    
    const slideAnim = useRef(new Animated.Value(1000)).current;
    
    const shops = [
        "Ben's Beef",
        "Big Baskets",
        "Ann's Apples",
        "Happy Alan's Produce"
    ]; // this is a placeholder for the list of shops which will eventually load from a data source

    const toggleView = () => setIsMapView(!isMapView);
    const toggleEditDetails = () => {
        if (showEditDetails) {
        // Slide down
        Animated.timing(slideAnim, {
            toValue: 1000,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setShowEditDetails(false));
        } else {
        setShowEditDetails(true);
        // Slide up
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
        }
    };
    return (
        <>
        <View style={styles.container}>
            <View style={styles.header}>
                {Platform.OS !== 'web' && <View />}
                <Text style={styles.title}>market</Text>
                {
                Platform.select({
                    ios: 
                    <TouchableOpacity onPress={ toggleEditDetails } style={styles.profileIcon}>
                        <View style={styles.profileIcon} />
                    </TouchableOpacity>,
                    web:
                    <View/>
                })
                }
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="gray" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="search"
                    placeholderTextColor={'#ccc'}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <TouchableOpacity style={styles.sortButton}>
                    <Text>sort</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.viewToggle} onPress={toggleView}>
                    <Text>{isMapView ? 'LIST' : 'MAP'}</Text>
                </TouchableOpacity>
            </View>

            {isMapView ? (
                <View style={styles.mapContainer}>
                    <Text style={styles.mapPlaceholder}>MAPBOX</Text>
                </View>
            ) : (
                <FlatList
                    data={shops}
                    renderItem={({ item }) => <Shop name={item} />}
                    keyExtractor={(item) => item}
                />
            )}
        </View>
        {showEditDetails && (
        <Animated.View
            style={[
                styles.editDetailsContainer,
                {
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <EditDetails onClose={toggleEditDetails} />
        </Animated.View>
        )}
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
                paddingRight: 175,
            }
        })
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: Platform.select({ ios: 'space-between', web: 'center' }),
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
    },
    sortButton: {
        marginLeft: 8,
        padding: 8,
        backgroundColor: 'white',
        borderRadius: 20,
    },
    viewToggle: {
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
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import MapScreen from '@/components/MapScreen';
import WebMapScreen from '@/components/WebMapScreen';
import ShopCard from '@/components/ShopCard';
import { useUser } from '@/context/userContext';

import tomatoImage from '../../assets/images/tomatoes.png';
import dillImage from '../../assets/images/dill.jpeg';
import bellPepperImage from '../../assets/images/bellPeppers.jpeg';
import breadImage from '../../assets/images/bread.jpeg';
import strawberryImage from '../../assets/images/strawberries.jpeg';

const MarketScreen = () => {
    const [isMapView, setIsMapView] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSortOptions, setShowSortOptions] = useState(false);
    
    // Use the user context instead of managing userData locally
    const { userData } = useUser();

    const shops = [
        {
            id: '1',
            name: "Ben's Beef",
            description: 'Fresh local meats',
            images: [bellPepperImage, dillImage, tomatoImage],
            rating: 4.3,
            address: '123 Butcher St'
        },
        {
            id: '2',
            name: "Big Baskets",
            description: 'Fresh local produce',
            images: [tomatoImage, strawberryImage, bellPepperImage],
            rating: 4.7,
            address: '456 Market Ave'
        },
        {
            id: '3',
            name: "Ann's Apples",
            description: 'Local orchard goods',
            images: [strawberryImage, breadImage, dillImage],
            rating: 4.4,
            address: '789 Orchard Ln'
        },
        {
            id: '4',
            name: "Happy Alan's Produce",
            description: 'Farm fresh vegetables',
            images: [bellPepperImage, tomatoImage, dillImage],
            rating: 4.6,
            address: '321 Farm Rd'
        }
    ];

    // No need for useEffect to load user data since it's provided by context

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

            {/* Display welcome message with user's name if available
            {userData && (
                <Text style={styles.welcomeText}>
                    Welcome, {userData.displayName || userData.first || 'User'}!
                </Text>
            )} */}

            {isMapView ? (
                Platform.OS === 'web' ? (
                    <WebMapScreen/>
                ) : (
                    <MapScreen/>
                )
            ) : (
                <FlatList
                    data={shops}
                    renderItem={({ item }) => (
                        <ShopCard 
                            name={item.name} 
                            itemImages={item.images}
                            key={item.id}
                        />
                    )}
                    keyExtractor={(item) => item.id}
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
    welcomeText: {
        fontSize: 18,
        fontFamily: 'TextMeOne',
        textAlign: 'center',
        color: '#333',
        marginVertical: 10,
    }
});

export default MarketScreen;
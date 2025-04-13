import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import MapScreen from '@/components/MapScreen';
import WebMapScreen from '@/components/WebMapScreen';
import ShopCard from '@/components/ShopCard';
import { useUser } from '@/context/userContext';
import firebaseService from '@/handlers/firebaseService';

const MarketScreen = () => {
    const [isMapView, setIsMapView] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSortOptions, setShowSortOptions] = useState(false);
    const [shops, setShops] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Group items by shop for easy access to item images
    const [shopItemsMap, setShopItemsMap] = useState({});
    
    // Use the user context instead of managing userData locally
    const { userData } = useUser();

    // Fetch shops based on user's ZIP code
    const fetchShopsAndItems = async () => {
        try {
            setLoading(true);
            if (userData?.location?.zip) {
                // Get first 2 digits of ZIP code
                const zipPrefix = userData.location?.zip.substring(0, 2);
                const shopsData = await firebaseService.getShopsByZipCodePrefix(zipPrefix, userData.uid);
                setShops(shopsData || []);
                
                // Create a map of shop IDs to arrays of item images
                const itemsByShop = {};
                
                // Fetch items for each shop
                await Promise.all(shopsData.map(async (shop) => {
                    try {
                        const shopItems = await firebaseService.getItemsForShop(shop.id);
                        if (shopItems && shopItems.length > 0) {
                            const imageUrls = shopItems
                                .filter(item => item.imageUrl)
                                .map(item => item.imageUrl);
                            
                            itemsByShop[shop.id] = imageUrls;
                        }
                    } catch (err) {
                        console.error(`Error fetching items for shop ${shop.id}:`, err);
                    }
                }));
                
                setShopItemsMap(itemsByShop);
            } else {
                // If no user ZIP code, just set empty shops array
                setShops([]);
            }
        } catch (error) {
            console.error("Error fetching shops:", error);
            setShops([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchShopsAndItems();
    }, [userData]);

    const toggleView = () => setIsMapView(!isMapView);
    
    const onRefresh = () => {
        setRefreshing(true);
        fetchShopsAndItems();
    };
    
    const renderContent = () => {
        if (loading && !refreshing) {
            return (
                <View style={styles.centeredContainer}>
                    <ActivityIndicator size="large" color="#333" />
                    <Text style={styles.messageText}>Loading shops...</Text>
                </View>
            );
        }
        
        if (isMapView) {
            return Platform.OS === 'web' ? <WebMapScreen/> : <MapScreen/>;
        }
        
        if (shops.length === 0) {
            return (
                <View style={styles.centeredContainer}>
                    <Text style={styles.messageText}>No shops found in your area</Text>
                </View>
            );
        }
        
        return (
            <FlatList
                contentContainerStyle={{ paddingBottom: 300 }}
                data={shops}
                renderItem={({ item }) => (
                    <ShopCard 
                        name={item.name} 
                        itemImages={shopItemsMap[item.id] || []}
                        key={item.id}
                    />
                )}
                keyExtractor={(item) => item.id}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                    />
                }
            />
        );
    };
    
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

            {renderContent()}
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
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    messageText: {
        fontFamily: 'TextMeOne',
        fontSize: 18,
        color: '#333',
        textAlign: 'center',
        marginTop: 10,
    }
});

export default MarketScreen;
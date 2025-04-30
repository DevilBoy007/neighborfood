'use client';

import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Platform, TouchableOpacity, RefreshControl, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import firebaseService from '@/handlers/firebaseService';
import { useUser } from '@/context/userContext';
import { useItem } from '@/context/itemContext';
import { useShop } from '@/context/shopContext';
import Toast from 'react-native-toast-message';

export default function ManageItems() {
    const { userData } = useUser();
    const { setSelectedItem } = useItem();
    const { shops, setShops } = useShop();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Create a map of shop IDs to shop names for display
    const shopIdToNameMap = {};
    shops.forEach(shop => {
        shopIdToNameMap[shop.id] = shop.name;
    });

    const fetchUserItems = async () => {
        if (!userData?.uid) {
            setLoading(false);
            console.log('No user data found');
            return;
        }
        try {
            setLoading(true);
            
            // First ensure we have the shops data
            if (shops.length === 0) {
                const userShops = await firebaseService.getShopsForUser(userData.uid);
                setShops(userShops);
                userShops.forEach(shop => {
                    shopIdToNameMap[shop.id] = shop.name;
                });
            }
            
            // Then fetch all items for the user
            const userItems = await firebaseService.getAllItemsForUser(userData.uid);
            setItems(userItems);
            console.log('User items:', userItems.length);
        } catch (err) {
            console.error('Error fetching items:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Memoize the fetch function to prevent unnecessary rerenders
    const memoizedFetchUserItems = React.useCallback(fetchUserItems, [userData, shops.length]);

    // Initial data fetch
    useEffect(() => {
        memoizedFetchUserItems();
    }, [memoizedFetchUserItems]);

    // Refresh data when the screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            console.log('ManageItems screen in focus, refreshing data');
            memoizedFetchUserItems();
            return () => {
                // Optional cleanup if needed
            };
        }, [memoizedFetchUserItems])
    );
    
    const handleEditItem = (item) => {
        setSelectedItem(item);
        router.push({
            pathname: '/(home)/(items)/AddItem',
            params: { itemId: item.id }
        });
    };

    const handleDeleteItem = (item) => {
        // Show confirmation dialog
        if (Platform.OS === 'web') {
            if (confirm('Are you sure you want to delete this item?')) {
                deleteItem(item.id);
            }
        } else {
            Alert.alert(
                'Delete Item',
                'Are you sure you want to delete this item?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Delete',
                        onPress: () => deleteItem(item.id),
                        style: 'destructive',
                    },
                ]
            );
        }
    };

    const deleteItem = async (itemId) => {
        try {
            setLoading(true);
            await firebaseService.deleteDocument('items', itemId);
            
            // Update the local state to remove the deleted item
            setItems(prevItems => prevItems.filter(item => item.id !== itemId));
            
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Item deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting item:', error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to delete item'
            });
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return `$${parseFloat(price).toFixed(2)}`;
    };
    
    const router = useRouter();
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>menu</Text>
            </View>
            <View>
                <Text style={styles.title}>
                    Manage Items
                </Text>
            </View>

            <ScrollView style={styles.scrollView} refreshControl={ 
                <RefreshControl
                    refreshing={loading}
                    onRefresh={memoizedFetchUserItems}
                    tintColor={"#00bfff"}
                    title='Fetching items...'
                    titleColor={"#00bfff"}
                    colors={["#00bfff", "#000"]}
                />
            }>
                {!loading && error ? (
                    <Text style={styles.errorText}>Error: {error}</Text>
                ) : !loading && items.length === 0 ? (
                    <Text style={styles.noItemsText}>No items available</Text>
                ) : !loading && (
                    items.map((item) => (
                        <View key={item.id} style={styles.itemCard}>
                            <View style={styles.itemImageContainer}>
                                {item.imageUrl ? (
                                    <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                                ) : (
                                    <View style={styles.noImage}>
                                        <Text style={styles.noImageText}>No Image</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.itemDetails}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemShop}>
                                    {item.shopId && item.shopId.length > 0 && shopIdToNameMap[item.shopId[0]] 
                                        ? `Shop: ${shopIdToNameMap[item.shopId[0]]}` 
                                        : 'No shop assigned'}
                                </Text>
                                <Text style={styles.itemPrice}>
                                    {formatPrice(item.price)} per {item.unit}
                                </Text>
                                <Text style={styles.itemQuantity}>
                                    Quantity: {item.quantity || 0}
                                </Text>
                                {item.negotiable && (
                                    <Text style={styles.negotiableTag}>Negotiable</Text>
                                )}
                            </View>
                            <View style={styles.itemActions}>
                                <TouchableOpacity 
                                    style={styles.editButton} 
                                    onPress={() => handleEditItem(item)}
                                >
                                    <Ionicons name="create-outline" size={24} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={styles.deleteButton} 
                                    onPress={() => handleDeleteItem(item)}
                                >
                                    <Ionicons name="trash-outline" size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
                <TouchableOpacity
                    style={styles.addItemButton}
                    onPress={() => router.push('/(home)/(items)/AddItem')}
                >
                    <Ionicons name="add-circle-outline" size={24} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.addItemButtonText}>Add Item</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#b7ffb0',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        ...Platform.select({
            ios: {
                justifyContent: 'flex-end',
            }
        }),
    },
    title: {
        fontSize: 24,
        alignSelf: 'center',
        fontWeight: '400',
        fontFamily: 'TitanOne',
        color: "#fff",
        ...Platform.select({
            web: {
                fontSize: 32,
            }
        })
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '400',
        fontFamily: 'TitanOne',
        color: "#fff",
        ...Platform.select({
            web: {
                fontSize: 32,
            }
        }),
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    itemCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        marginBottom: 16,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
    },
    itemImageContainer: {
        width: 80,
        height: 80,
        borderRadius: 8,
        overflow: 'hidden',
        marginRight: 15,
    },
    itemImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    noImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noImageText: {
        color: '#999',
        fontSize: 12,
    },
    itemDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    itemName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    itemShop: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    itemPrice: {
        fontSize: 16,
        color: '#333',
        marginBottom: 2,
    },
    itemQuantity: {
        fontSize: 14,
        color: '#666',
    },
    negotiableTag: {
        fontSize: 12,
        color: '#00bfff',
        fontStyle: 'italic',
        marginTop: 4,
    },
    itemActions: {
        justifyContent: 'space-around',
        alignItems: 'flex-end',
    },
    editButton: {
        backgroundColor: '#00bfff',
        padding: 8,
        borderRadius: 5,
        marginBottom: 8,
    },
    deleteButton: {
        backgroundColor: '#ff4d4d',
        padding: 8,
        borderRadius: 5,
    },
    addItemButton: {
        backgroundColor: '#00bfff',
        padding: 16,
        borderRadius: 8,
        marginTop: 16,
        marginBottom: 128,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    addItemButtonText: {
        fontSize: 24,
        color: '#fff',
        fontFamily: 'TextMeOne',
    },
    buttonIcon: {
        marginRight: 8,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
    noItemsText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#555',
    },
});

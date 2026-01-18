'use client';

import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Platform, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import ShopCard from '@/components/ShopCard';
import firebaseService from '@/handlers/firebaseService';
import { useUser } from '@/store/reduxHooks';

export default function Shops() {
    const { userData } = useUser();
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    async function fetchShopsAndItems() {
        if (!userData?.uid) {
            setLoading(false);
            console.log('No user data found');
            return;
        }
        try {
            setLoading(true);
            const { shops, items } = await firebaseService.getShopsAndItemsForUser(userData.uid);
            const shopsWithItems = shops.map(shop => {
                const shopItems = items.filter(item => item.shopId === shop.id);
                return {
                    ...shop,
                    items: shopItems
                };
            });
            setShops(shopsWithItems);
            console.log('Shops with items:', shopsWithItems);
        } catch (err) {
            console.error('Error fetching shops and items:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    // Use React.useCallback to memoize the fetchShopsAndItems function
    const memoizedFetchShopsAndItems = React.useCallback(fetchShopsAndItems, [userData]);

    // Initial data fetch
    useEffect(() => {
        memoizedFetchShopsAndItems();
    }, [memoizedFetchShopsAndItems]);

    // Refresh data when the screen comes into focus
    // useFocusEffect(
    //     React.useCallback(() => {
    //         console.log('Shops screen in focus, refreshing data');
    //         memoizedFetchShopsAndItems();
    //         return () => {
    //             // Optional cleanup if needed
    //         };
    //     }, [memoizedFetchShopsAndItems])
    // );
    
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
                    Available Shops
                </Text>
            </View>

            <ScrollView style={styles.scrollView} refreshControl={ 
                <RefreshControl
                    refreshing={loading}
                    onRefresh={memoizedFetchShopsAndItems}
                    tintColor={"#00bfff"}
                    title='Fetching shops...'
                    titleColor={"#00bfff"}
                    colors={["#00bfff", "#000"]}
                    />
                }>
                {!loading && error ? (
                    <Text style={styles.errorText}>Error: {error}</Text>
                ) : !loading && shops.length === 0 ? (
                    <Text style={styles.noShopsText}>No shops available</Text>
                ) : !loading && (
                    shops.map((shop) => (
                        <ShopCard
                            name={shop.name}
                            shop={shop}
                            key={shop.id}
                        />
                    ))
                )}
                <TouchableOpacity
                    style={ styles.addShopButton }
                    onPress={() => router.push('/AddShop')}
                >
                    <Ionicons name="add-circle-outline" size={24} color="#fff" style={styles.buttonIcon} />
                    <Text style={ styles.addShopButtonText }>Add Shop</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#b7ffb0',
        // backgroundColor: '#c2f7d7', "mint"
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
    addShopButton: {
        backgroundColor: '#00bfff',
        padding: 16,
        borderRadius: 8,
        marginTop: 16,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    addShopButtonText: {
        fontSize: 24,
        color: '#fff',
        fontFamily: 'TextMeOne',
        
    },
    buttonIcon: {
        marginRight: 8,
    },
    loader: {
        marginTop: 20,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
    noShopsText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#555',
    },
});
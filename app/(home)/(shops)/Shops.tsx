'use client';

import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ShopCard from '@/components/ShopCard';
import { useUser } from '@/context/userContext';

import firebaseService from '@/handlers/firebaseService';


export default function Shops() {
    const { userData } = useUser();
    const [shops, setShops] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Group items by shop for easy access to item images
    const [shopItemsMap, setShopItemsMap] = useState({});

    useEffect(() => {
        async function fetchShopsAndItems() {
            if (!userData?.uid) {
                setLoading(false);
                console.log('No user data found');
                return;
            }
            try {
                setLoading(true);
                const { shops, items } = await firebaseService.getShopsAndItemsForUser(userData.uid);
                setShops(shops);
                setItems(items);
                console.log('Shops:', shops);
                console.log('Items:', items);
                // Create a map of shop IDs to arrays of item images
                const itemsByShop = {};
                items.forEach(item => {
                    if (!itemsByShop[item.shopId]) {
                        itemsByShop[item.shopId] = [];
                    }
                    if (item.imageUrl) {
                        itemsByShop[item.shopId].push(item.imageUrl);
                    }
                });
                console.log('Items by shop:', itemsByShop);
                setShopItemsMap(itemsByShop);
            } catch (err) {
                console.error('Error fetching shops and items:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        
        fetchShopsAndItems();
    }, [userData]);
    
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

            <ScrollView style={styles.scrollView}>
                {loading ? (
                    <ActivityIndicator size="large" color="#00bfff" style={styles.loader} />
                ) : error ? (
                    <Text style={styles.errorText}>Error: {error}</Text>
                ) : shops.length === 0 ? (
                    <Text style={styles.noShopsText}>No shops available</Text>
                ) : (
                    shops.map((shop) => (
                        <ShopCard 
                            name={shop.name} 
                            itemImages={shopItemsMap[shop.id] || []} 
                            key={shop.id}
                        />
                    ))
                )}
                <TouchableOpacity
                    style={ styles.addShopButton }
                    onPress={() => router.push('/AddShop')}
                >
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
        padding: 16,
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
    },
    addShopButtonText: {
        fontSize: 24,
        color: '#fff',
        fontFamily: 'TextMeOne',
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
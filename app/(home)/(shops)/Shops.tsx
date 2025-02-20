'use client';

import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ShopCard from '@/components/ShopCard';

import tomatoImage from '../../../assets/images/tomatoes.png';
import dillImage from '../../../assets/images/dill.jpeg';
import bellPepperImage from '../../../assets/images/bellPeppers.jpeg';
import breadImage from '../../../assets/images/bread.jpeg';
import strawberryImage from '../../../assets/images/strawberries.jpeg';


// Mock data - replace with actual data fetching
const mockShops: Array<Object> = [
    {
        id: '1',
        name: 'Veggie Shop',
        description: 'Fresh local produce',
        images: [bellPepperImage, dillImage,tomatoImage, breadImage],
        rating: 4.5,
        address: '123 Main St',
    },
    {
        id: '2',
        name: 'Bread Head',
        description: 'Fresh local produce',
        images: [strawberryImage, dillImage, bellPepperImage, tomatoImage],
        rating: 4.2,
        address: '456 Elm St',
    },
    {
        id: '3',
        name: 'Nothin\' but Nuts',
        description: 'Fresh local produce',
        images: [breadImage, bellPepperImage, strawberryImage, dillImage],
        rating: 4.0,
        address: '789 Oak St',
    },
];

export default function Shops() {
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
                {mockShops.map((shop) => (
                    <ShopCard name={ shop.name } itemImages={shop.images} key={ shop.id }/>
                ))}
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
});
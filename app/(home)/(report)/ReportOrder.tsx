import React from 'react';
import { useRouter } from 'expo-router'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import OrderCard from '@/components/OrderCard';

const OrderHistoryScreen = () => {
    const router = useRouter();
    const orders = [
        {
            date: 'Sun, Oct 20',
            total: '36.90',
            shops: ["Ann's Apples", "Bakr's Baskets"],
            items: 9
        },
        {
            date: 'Mon, April 22',
            total: '120.12',
            shops: ["Ann's Apples", "Bakr's Baskets"],
            items: 27
        },
        {
            date: 'Wed, Nov 27',
            total: '11.50',
            shops: ["Ann's Apples"],
            items: 2
        },
    ];

    const handleOrderPress = (order) => {
        router.setParams({ order });
        router.push('./OrderDetails');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>report</Text>
            </View>
            <Text style={styles.headerTitle}>Which Order?</Text>
            <ScrollView style={styles.scrollView}>
                {orders.map((order, index) => (
                    <OrderCard
                        key={index}
                        order={order}
                        onPress={() => handleOrderPress(order)}
                    />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#b7ffb0',
        // backgroundColor: '#c2f7d7',
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
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '400',
        fontFamily: 'TitanOne',
        color: "#fff",
        paddingLeft: 16,
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
});

export default OrderHistoryScreen;
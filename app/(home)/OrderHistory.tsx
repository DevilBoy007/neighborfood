import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const OrderHistory = () => {
    const orders = [
        {
            date: 'Wed, Nov 27',
            total: 'xxx.xx',
            shops: ["Ann's Apples", "Bakr's Baskets"],
            items: 15
        },
        {
            date: 'Wed, Nov 27',
            total: 'xxx.xx',
            shops: ["Ann's Apples", "Bakr's Baskets"],
            items: 15
        },
        {
            date: 'Wed, Nov 27',
            total: 'xxx.xx',
            shops: ["Ann's Apples", "Bakr's Baskets"],
            items: 15
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>order history</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                {orders.map((order, index) => (
                    <TouchableOpacity key={index} style={styles.orderCard}>
                        <View style={styles.orderHeader}>
                            <Text style={styles.dateText}>{order.date}</Text>
                            <Ionicons name="chevron-forward" size={24} color="black" />
                        </View>

                        <View style={styles.orderDetails}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>total:</Text>
                                <Text style={styles.detailValue}>${order.total}</Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>shops:</Text>
                                <Text style={styles.detailValue}>
                                    {order.shops.join(', ')} ...
                                </Text>
                            </View>

                            <Text style={styles.itemsText}>items: {order.items}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#B7FFB0'
        // backgroundColor: '#c2f7d7',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: 16,
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '400',
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    orderCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateText: {
        fontSize: 24,
        fontWeight: '400',
    },
    orderDetails: {
        gap: 4,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailLabel: {
        fontSize: 16,
        color: '#000',
        width: 60,
    },
    detailValue: {
        fontSize: 16,
        color: '#000',
        flex: 1,
    },
    itemsText: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
    },
});

export default OrderHistory;
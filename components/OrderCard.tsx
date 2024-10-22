import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const OrderCard = ({ order, onPress }) => {
    const { date, total, shops, items } = order;

    return (
        <TouchableOpacity style={styles.orderCard} onPress={onPress}>
            <View style={styles.orderHeader}>
                <Text style={styles.dateText}>{date}</Text>
                <Ionicons name="chevron-forward" size={24} color="black" />
            </View>

            <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>total:</Text>
                    <Text style={styles.detailValue}>${total}</Text>
                </View>

                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>shops:</Text>
                    <Text style={styles.detailValue}>
                        {shops.join(', ')}
                    </Text>
                </View>

                <Text style={styles.itemsText}>items: {items}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
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

export default OrderCard;
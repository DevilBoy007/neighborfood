import React, { useEffect, useState} from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useOrder } from '@/context/orderContext'
import firebaseService from '@/handlers/firebaseService'
import { useUser } from '@/context/userContext';

const OrderCard = ({ order, onPress }) => {
    const { date, total, shops, items } = order;
    const { selectedOrder, setSelectedOrder } = useOrder()
    const { userData } = useUser();

    const [customerName, setCustomerName] = useState<string>('unknown');

    useEffect(() => {
        let isMounted = true;
        if (order.customerId === userData?.uid) {
            setCustomerName('you');
            return;
        }
        firebaseService.getUserById(order.customerId).then((customer) => {
            if (isMounted) setCustomerName(customer?.username || 'unknown');
        });
        return () => { isMounted = false; };
    }, [order.customerId]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return '#FF9800';
            case 'preparing':
                return '#9C27B0';
            case 'ready':
                return '#00bfff';
            case 'in-delivery':
                return 'orchid';
            case 'delivered':
                return '#4CAF50';
            default:
                return '#4f6549ff';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Order Received';
            case 'preparing':
                return 'Being Prepared';
            case 'ready':
                return 'Ready for Pickup';
            case 'in-delivery':
                return 'Out for Delivery';
            case 'completed':
                return 'Delivered';
            default:
                return status;
        }
    };

    const handleStatusPress = (order) => {
        alert(`ORDER TOTAL: $${order.total}`)
        setSelectedOrder(order)
        console.log('selected order: ', selectedOrder)
    }

    return (
        <>
            <TouchableOpacity style={styles.orderCard} onPress={onPress}>
                <View style={styles.orderHeader}>
                    <Text style={styles.dateText}>{date}</Text>
                    <Ionicons name="chevron-forward" size={24} color="black" />
                </View>

                <View style={styles.orderDetails}>
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, styles.itemsText]}>placed by</Text>
                        <Text style={[styles.detailValue, styles.itemsText]}>{customerName}</Text>
                    </View>
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
            <TouchableOpacity style={styles.statusContainer} onPress={()=>{handleStatusPress(order)}}>
                <View style={{ backgroundColor: getStatusColor(order.status) }}>
                    <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                </View>
            </TouchableOpacity>
        </>
    );
};

const styles = StyleSheet.create({
    orderCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 3,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        fontFamily: 'TextMeOne',
    },
    dateText: {
        fontSize: 24,
        fontWeight: 'bold',
        fontFamily: 'TextMeOne',
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
        fontFamily: 'TextMeOne',
        fontWeight: 'bold',
    },
    detailValue: {
        fontSize: 16,
        color: '#000',
        flex: 1,
        fontFamily: 'TextMeOne',
    },
    itemsText: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        fontFamily: 'TextMeOne',
    },
    statusContainer: {
        zIndex: -1,
        marginBottom: 16,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 3,
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
        paddingVertical: 12,
    },
});

export default OrderCard;
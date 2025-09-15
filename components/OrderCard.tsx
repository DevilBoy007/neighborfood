import React, { useEffect, useState} from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useOrder } from '@/context/orderContext'
import firebaseService from '@/handlers/firebaseService'
import { useUser } from '@/context/userContext';
import { useOrderStatus } from '@/hooks/useOrderStatus';
import type { OrderData, OrderStatus } from '@/context/orderContext';

const OrderCard = ({ order, onPress }) => {
    const { date, total, shops, items } = order;
    const { allOrders, selectedOrder, setSelectedOrder, updateOrderStatus } = useOrder()
    const { userData } = useUser();
    const { getStatusColor, getStatusText, buildStatusButtons } = useOrderStatus();

    const [customerName, setCustomerName] = useState<string>('unknown');
    const [isPressed, setIsPressed] = useState(false);

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

    const handleStatusPress = (order) => {
        console.log(order)
        const orderToSet = allOrders.find(o => (o.id === order.id && o.shopName === order.shops[0])) || null;
        setSelectedOrder(orderToSet);
        setIsPressed(prev => !prev);
        console.log('selected order:', orderToSet)
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
            <View style={styles.statusMetaContainer}>
                { isPressed && (
                    <View>
                        {buildStatusButtons(order.status, order.shopOwnerView || false, (newStatus) => {
                            updateOrderStatus(selectedOrder.id, selectedOrder.shopId, newStatus as OrderStatus);
                            setIsPressed(false);
                        }).map((button) => (
                            <TouchableOpacity key={button.key} onPress={button.onPress}>
                                <View style={{ backgroundColor: button.color }}>
                                    <Text style={styles.statusText}>{button.label}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
                <TouchableOpacity
                    style={styles.activeStatusContainer}
                    onPress={handleStatusPress.bind(this, order)}
                >
                    <View style={[{ backgroundColor: getStatusColor(order.status) }, isPressed && { backgroundColor: 'rgba(0, 0, 0, 0.2)' }]}>
                        <Text style={styles.statusText}>{isPressed ? 'Close' : getStatusText(order.status)}</Text>
                    </View>
                </TouchableOpacity>
            </View>
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
    statusMetaContainer: {
        zIndex: -2,
    },
    activeStatusContainer: {
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
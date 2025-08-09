import { v4 as uuidv4 } from 'uuid';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import OrderCard from '@/components/OrderCard';
import { useUser } from '@/context/userContext';
import { useOrder } from '@/context/orderContext';
import firebaseService from '@/handlers/firebaseService';

const OrdersScreen = () => {
    const router = useRouter();
    const { filter } = useLocalSearchParams<{ filter: 'current' | 'history' }>();
    const { userData } = useUser();
    const { currentOrder, setCurrentOrder, orderHistory, setOrderHistory } = useOrder();
    const [orders, setOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Default to 'current' if no filter is provided
    const orderFilter = filter || 'current';

    useEffect(() => {
        const fetchOrders = async () => {
            if (!userData?.uid) return;
            
            try {
                setIsLoading(true);
                const userOrders = await firebaseService.getOrdersForUser(userData.uid);
                
                let filteredOrders;
                if (orderFilter === 'current') {
                    filteredOrders = userOrders.filter(order => 
                        order.status !== 'completed' && order.status !== 'cancelled'
                    );
                    setOrders(filteredOrders);

                    // Set the most recent active order as current order if there's one
                    if (filteredOrders.length > 0 && !currentOrder) {
                        setCurrentOrder(filteredOrders[0]);
                    }
                } else {
                    filteredOrders = userOrders.filter(order => order.status === 'completed');
                    setOrders(filteredOrders);
                    setOrderHistory(filteredOrders);
                }
            } catch (error) {
                console.error(`Error fetching ${orderFilter} orders:`, error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, [userData?.uid, orderFilter]);

    const formatOrderForCard = (order: any) => {
        const date = new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        
        return {
            id: orderFilter === 'current' ? uuidv4() : order.id,
            date,
            total: order.total.toFixed(2),
            shops: [order.shopName],
            items: order.items.length,
            status: order.status,
            originalOrder: order
        };
    };

    const handleOrderPress = (orderCardData: any) => {
        router.setParams({ order: JSON.stringify(orderCardData.originalOrder) });
        router.push('./details');
    };

    // Configuration based on filter type
    const config = {
        current: {
            title: 'current orders',
            loadingText: 'Loading current orders...',
            emptyIcon: 'time-outline' as const,
            emptyText: 'No current orders',
            emptySubtext: 'Your active orders will appear here'
        },
        history: {
            title: 'order history',
            loadingText: 'Loading order history...',
            emptyIcon: 'receipt-outline' as const,
            emptyText: 'No order history',
            emptySubtext: 'Your completed orders will appear here'
        }
    };

    const currentConfig = config[orderFilter];

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{currentConfig.title}</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>{currentConfig.loadingText}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{currentConfig.title}</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                {orders.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name={currentConfig.emptyIcon} size={64} color="#ccc" />
                        <Text style={styles.emptyStateText}>{currentConfig.emptyText}</Text>
                        <Text style={styles.emptyStateSubtext}>{currentConfig.emptySubtext}</Text>
                    </View>
                ) : (
                    orders.map((order, index) => {
                        const formattedOrder = formatOrderForCard(order);
                        return orderFilter === 'current' ? (
                            <View key={order.docId || index} style={styles.orderContainer}>
                                <OrderCard
                                    order={formattedOrder}
                                    onPress={() => handleOrderPress(formattedOrder)}
                                />
                                <View style={styles.statusContainer}>
                                </View>
                            </View>
                        ) : (
                            <OrderCard
                                key={index}
                                order={formattedOrder}
                                onPress={() => handleOrderPress(formattedOrder)}
                            />
                        );
                    })
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#b7ffb0',
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
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 100,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
    orderContainer: {
        marginBottom: 16,
    },
    statusContainer: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1,
    },
});

export default OrdersScreen;
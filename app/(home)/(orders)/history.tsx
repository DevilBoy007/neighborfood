import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import OrderCard from '@/components/OrderCard';
import { useUser } from '@/context/userContext';
import { useOrder } from '@/context/orderContext';
import firebaseService from '@/handlers/firebaseService';

const OrderHistoryScreen = () => {
    const router = useRouter();
    const { userData } = useUser();
    const { orderHistory, setOrderHistory } = useOrder();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrderHistory = async () => {
            if (!userData?.uid) return;
            
            try {
                setIsLoading(true);
                // Get all orders for the user
                const userOrders = await firebaseService.getOrdersForUser(userData.uid);
                
                // Filter only completed orders for history
                const completedOrders = userOrders.filter(order => order.status === 'completed');

                setOrderHistory(completedOrders);
            } catch (error) {
                console.error('Error fetching order history:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrderHistory();
    }, [userData?.uid]);

    const formatOrderForCard = (order: any) => {
        const date = new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        
        return {
            id: order.id,
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

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>order history</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading order history...</Text>
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
                <Text style={styles.headerTitle}>order history</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                {orderHistory.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="receipt-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyStateText}>No order history</Text>
                        <Text style={styles.emptyStateSubtext}>Your completed orders will appear here</Text>
                    </View>
                ) : (
                    orderHistory.map((order, index) => {
                        const formattedOrder = formatOrderForCard(order);
                        return (
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
});

export default OrderHistoryScreen;

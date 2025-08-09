import { v4 as uuidv4 } from 'uuid';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import OrderCard from '@/components/OrderCard';
import { useUser } from '@/context/userContext';
import { useOrder } from '@/context/orderContext';
import firebaseService from '@/handlers/firebaseService';

const CurrentOrdersScreen = () => {
    const router = useRouter();
    const { userData } = useUser();
    const { currentOrder, setCurrentOrder } = useOrder();
    const [currentOrders, setCurrentOrders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCurrentOrders = async () => {
            if (!userData?.uid) return;
            
            try {
                setIsLoading(true);
                // Get all orders for the user
                const userOrders = await firebaseService.getOrdersForUser(userData.uid);
                
                // Filter active orders (not completed)
                const activeOrders = userOrders.filter(order => 
                    order.status !== 'completed' && order.status !== 'cancelled'
                );

                setCurrentOrders(activeOrders);

                // Set the most recent active order as current order if there's one
                if (activeOrders.length > 0 && !currentOrder) {
                    setCurrentOrder(activeOrders[0]);
                }
            } catch (error) {
                console.error('Error fetching current orders:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCurrentOrders();
    }, [userData?.uid]);

    const formatOrderForCard = (order: any) => {
        const date = new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        
        return {
            id: uuidv4(),
            date,
            total: order.total.toFixed(2),
            shops: [order.shopName],
            items: order.items.length,
            status: order.status,
            originalOrder: order
        };
    };

    const handleOrderPress = (orderCardData: any) => {
        console.log('order pressed:', orderCardData.originalOrder)
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
                    <Text style={styles.headerTitle}>current orders</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading current orders...</Text>
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
                <Text style={styles.headerTitle}>current orders</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                {currentOrders.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="time-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyStateText}>No current orders</Text>
                        <Text style={styles.emptyStateSubtext}>Your active orders will appear here</Text>
                    </View>
                ) : (
                    currentOrders.map((order, index) => {
                        const formattedOrder = formatOrderForCard(order);
                        return (
                            <View key={order.docId || index} style={styles.orderContainer}>
                                <OrderCard
                                    order={formattedOrder}
                                    onPress={() => handleOrderPress(formattedOrder)}
                                />
                                <View style={styles.statusContainer}>
                                </View>
                            </View>
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

export default CurrentOrdersScreen;

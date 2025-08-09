// OrderDetailScreen.js
import React, { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOrder } from '@/context/orderContext';

const { height } = Dimensions.get('window');

const ShopSection = ({ shop, items }: { shop: string; items: any[] }) => (
    <View style={styles.shopSection}>
        <Text style={styles.shopName}>{shop}</Text>
        {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemText}>
                        {item.name} x {item.quantity}
                    </Text>
                    <Text style={styles.itemPrice}>@ ${item.price.toFixed(2)}</Text>
                </View>
                <Text style={styles.itemTotal}>${(item.price * item.quantity).toFixed(2)}</Text>
            </View>
        ))}
    </View>
);

const OrderDetailScreen = () => {
    const router = useRouter();
    const { selectedOrder, setSelectedOrder } = useOrder();
    const slideAnim = useRef(new Animated.Value(height)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            })
        ]).start();

        // Clear selected order when component unmounts
        return () => {
            setSelectedOrder(null);
        };
    }, [selectedOrder]);

    const formatOrderData = (order: any) => {
        if (!order) return null;
        
        const date = new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
        
        return {
            date,
            shopName: order.shopName,
            items: order.items,
            total: order.total,
            status: order.status,
            deliveryOption: order.deliveryOption,
            deliveryAddress: order.deliveryAddress
        };
    };

    const formattedOrder = formatOrderData(selectedOrder);

    if (!formattedOrder) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>order details</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>
                        {selectedOrder ? 'Loading order details...' : 'No order selected'}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        // Animate out before navigation
                        Animated.parallel([
                            Animated.timing(slideAnim, {
                                toValue: height,
                                duration: 300,
                                useNativeDriver: true,
                            }),
                            Animated.timing(fadeAnim, {
                                toValue: 0,
                                duration: 300,
                                useNativeDriver: true,
                            })
                        ]).start(() => router.back());
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>order details</Text>
            </View>

            <Animated.ScrollView
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <Text style={styles.dateText}>{formattedOrder.date}</Text>

                <View style={styles.orderContent}>
                    <ShopSection shop={formattedOrder.shopName} items={formattedOrder.items} />

                    <View style={styles.divider} />

                    <View style={styles.totalSection}>
                        <Text style={styles.totalLabel}>total:</Text>
                        <Text style={styles.totalAmount}>${formattedOrder.total.toFixed(2)}</Text>
                    </View>

                    <Text style={styles.itemCount}>
                        items: {formattedOrder.items.length}
                    </Text>
                    
                    <View style={styles.statusSection}>
                        <Text style={styles.statusLabel}>Status:</Text>
                        <Text style={styles.statusValue}>
                            {formattedOrder.status}
                        </Text>
                    </View>
                </View>
            </Animated.ScrollView>
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
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        fontFamily: 'TextMeOne',
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
    content: {
        flex: 1,
        padding: 16,
    },
    dateText: {
        fontSize: 24,
        fontWeight: '400',
        marginBottom: 20,
        fontFamily: 'TextMeOne',
    },
    orderContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    shopSection: {
        marginBottom: 24,
    },
    shopName: {
        fontSize: 18,
        marginBottom: 8,
        fontFamily: 'TextMeOne',
        fontWeight: 'bold',
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    itemInfo: {
        flexDirection: 'row',
        flex: 1,
    },
    itemText: {
        fontSize: 16,
        marginRight: 8,
        fontFamily: 'TextMeOne',
    },
    itemPrice: {
        fontSize: 16,
        color: '#666',
        fontFamily: 'TextMeOne',
    },
    itemTotal: {
        fontSize: 16,
        color: '#40C4FF',
        fontFamily: 'TextMeOne',
    },
    divider: {
        height: 1,
        backgroundColor: '#000',
        marginVertical: 16,
    },
    totalSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    totalLabel: {
        fontSize: 18,
        fontFamily: 'TextMeOne',
        fontWeight: 'bold',
    },
    totalAmount: {
        fontSize: 18,
        fontFamily: 'TextMeOne',
    },
    itemCount: {
        fontSize: 14,
        color: '#999',
        fontFamily: 'TextMeOne',
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
    statusSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    statusLabel: {
        fontSize: 16,
        fontFamily: 'TextMeOne',
        color: '#666',
    },
    statusValue: {
        fontSize: 16,
        fontFamily: 'TextMeOne',
        fontWeight: '600',
    },
});

export default OrderDetailScreen;
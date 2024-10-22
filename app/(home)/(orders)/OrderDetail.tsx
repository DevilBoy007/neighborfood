// OrderDetailScreen.js
import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    Animated,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

const ShopSection = ({ shop, items }) => (
    <View style={styles.shopSection}>
        <Text style={styles.shopName}>{shop}</Text>
        {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemText}>
                        {item.name} x {item.quantity}
                    </Text>
                    <Text style={styles.itemPrice}>@ ${item.price}</Text>
                </View>
                <Text style={styles.itemTotal}>${item.total.toFixed(2)}</Text>
            </View>
        ))}
    </View>
);

const OrderDetailScreen = ({ navigation, route }) => {
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
    }, []);

    // Mock data (in a real app, you'd get this from route.params)
    const orderData = {
        date: 'Wed, Nov 27',
        shops: [
            {
                name: "Ann's Apples",
                items: [
                    { name: 'Apples', quantity: 5, price: 0.33, total: 1.65 },
                    { name: 'Basil', quantity: 1, price: 0.10, total: 0.10 },
                    { name: 'Potatoes', quantity: 3, price: 0.67, total: 2.01 },
                    { name: 'Zucchini', quantity: 2, price: 0.40, total: 0.80 },
                ]
            },
            {
                name: "Bakr's Bread",
                items: [
                    { name: 'Bread', quantity: 2, price: 3, total: 6 },
                    { name: 'Beef (NY Strip)', quantity: 1, price: 9, total: 9 },
                    { name: 'Beef (Filet)', quantity: 1, price: 12, total: 12 },
                ]
            }
        ],
        total: 31.56,
        itemCount: 15
    };

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
                        ]).start(() => navigation.goBack());
                    }}
                >
                    <Ionicons name="chevron-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>order history</Text>
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
                <Text style={styles.dateText}>{orderData.date}</Text>

                <View style={styles.orderContent}>
                    {orderData.shops.map((shop, index) => (
                        <ShopSection
                            key={index}
                            shop={shop.name}
                            items={shop.items}
                        />
                    ))}

                    <View style={styles.divider} />

                    <View style={styles.totalSection}>
                        <Text style={styles.totalLabel}>total:</Text>
                        <Text style={styles.totalAmount}>${orderData.total}</Text>
                    </View>

                    <Text style={styles.itemCount}>
                        items: {orderData.itemCount}
                    </Text>
                </View>
            </Animated.ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#c2f7d7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '400',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    dateText: {
        fontSize: 24,
        fontWeight: '400',
        marginBottom: 20,
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
    },
    itemPrice: {
        fontSize: 16,
        color: '#666',
    },
    itemTotal: {
        fontSize: 16,
        color: '#40C4FF',
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
    },
    totalAmount: {
        fontSize: 18,
    },
    itemCount: {
        fontSize: 14,
        color: '#999',
    },
});

export default OrderDetailScreen;
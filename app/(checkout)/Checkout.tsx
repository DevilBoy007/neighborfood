import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCart } from '@/context/cartContext';
import { useUser } from '@/context/userContext';
import { useOrder } from '@/context/orderContext';
import { useLocation } from '@/context/locationContext';
import firebaseService from '@/handlers/firebaseService';

type DeliveryOption = 'pickup' | 'delivery';
type PaymentMethod = 'cash' | 'card' | 'venmo' | 'paypal';

const Checkout = () => {
    const router = useRouter();
    const { shopCarts, clearCart, calculateTotalSubtotal } = useCart();
    const { userData } = useUser();
    const { addToOrderHistory } = useOrder();
    const { locationData } = useLocation();
    
    const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>('delivery');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    
    const subtotal = calculateTotalSubtotal();
    const deliveryFee = deliveryOption === 'delivery' ? 3.99 : 0;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + deliveryFee + tax;

    useEffect(() => {
        // Initialize with user's saved address and phone
        if (userData?.location?.address) {
            setDeliveryAddress(userData.location.address);
        }
        if (userData?.phone) {
            setContactPhone(userData.phone);
        }
    }, [userData]);

    const handlePlaceOrder = async () => {
        if (!userData) {
            Alert.alert('Error', 'Please log in to place an order');
            return;
        }

        if (deliveryOption === 'delivery' && !deliveryAddress.trim()) {
            Alert.alert('Error', 'Please enter a delivery address');
            return;
        }

        if (!contactPhone.trim()) {
            Alert.alert('Error', 'Please enter a contact phone number');
            return;
        }

        setIsPlacingOrder(true);

        try {
            // Create orders for each shop
            const orderPromises = shopCarts.map(async (shopCart) => {
                const orderData = {
                    userId: userData.uid,
                    shopId: shopCart.shopId,
                    shopName: shopCart.shopName,
                    shopPhotoURL: shopCart.shopPhotoURL || '',
                    items: shopCart.items.map(item => ({
                        ...item,
                        specialInstructions: specialInstructions
                    })),
                    subtotal: shopCart.subtotal,
                    tax: shopCart.subtotal * 0.08,
                    deliveryFee: deliveryOption === 'delivery' ? 3.99 : 0,
                    tip: 0, // Can be added later
                    total: shopCart.subtotal + (shopCart.subtotal * 0.08) + (deliveryOption === 'delivery' ? 3.99 : 0),
                    status: 'pending',
                    createdAt: new Date(),
                    estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
                    paymentMethod,
                    deliveryAddress: deliveryOption === 'delivery' ? deliveryAddress : 'Pickup',
                    contactPhone,
                    deliveryOption,
                    specialInstructions
                };

                const orderId = await firebaseService.addDocument('orders', orderData, null);
                
                return {
                    id: orderId,
                    ...orderData
                };
            });

            const createdOrders = await Promise.all(orderPromises);
            
            // Add orders to order history
            createdOrders.forEach(order => {
                addToOrderHistory(order);
            });

            // Clear the cart
            clearCart();

            Alert.alert(
                'Order Placed!',
                `Your order${createdOrders.length > 1 ? 's have' : ' has'} been placed successfully. You'll receive updates on the status.`,
                [
                    {
                        text: 'View Orders',
                        onPress: () => router.navigate('/(orders)/OrderHistory')
                    }
                ]
            );

        } catch (error) {
            console.error('Error placing order:', error);
            Alert.alert('Error', 'Failed to place order. Please try again.');
        } finally {
            setIsPlacingOrder(false);
        }
    };

    if (shopCarts.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>checkout</Text>
                </View>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Your cart is empty</Text>
                    <TouchableOpacity
                        style={styles.continueShoppingButton}
                        onPress={() => router.navigate('/Market')}
                    >
                        <Text style={styles.continueShoppingText}>Continue Shopping</Text>
                    </TouchableOpacity>
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
                <Text style={styles.headerTitle}>checkout</Text>
            </View>

            <ScrollView style={styles.content}>
                {/* Order Summary */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    {shopCarts.map((shopCart) => (
                        <View key={shopCart.shopId} style={styles.shopOrderSummary}>
                            <Text style={styles.shopName}>{shopCart.shopName}</Text>
                            {shopCart.items.map((item) => (
                                <View key={item.itemId} style={styles.orderItem}>
                                    <Text style={styles.orderItemName}>
                                        {item.quantity}x {item.name}
                                    </Text>
                                    <Text style={styles.orderItemPrice}>
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </Text>
                                </View>
                            ))}
                            <View style={styles.shopSubtotalRow}>
                                <Text style={styles.shopSubtotalLabel}>Shop subtotal:</Text>
                                <Text style={styles.shopSubtotalAmount}>${shopCart.subtotal.toFixed(2)}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Delivery Options */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Delivery Option</Text>
                    <View style={styles.optionGroup}>
                        <TouchableOpacity
                            style={[styles.option, deliveryOption === 'delivery' && styles.selectedOption]}
                            onPress={() => setDeliveryOption('delivery')}
                        >
                            <Ionicons name="bicycle" size={24} color={deliveryOption === 'delivery' ? '#00bfff' : '#666'} />
                            <View style={styles.optionContent}>
                                <Text style={[styles.optionTitle, deliveryOption === 'delivery' && styles.selectedOptionText]}>
                                    Delivery
                                </Text>
                                <Text style={styles.optionSubtitle}>$3.99 delivery fee</Text>
                            </View>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.option, deliveryOption === 'pickup' && styles.selectedOption]}
                            onPress={() => setDeliveryOption('pickup')}
                        >
                            <Ionicons name="storefront" size={24} color={deliveryOption === 'pickup' ? '#00bfff' : '#666'} />
                            <View style={styles.optionContent}>
                                <Text style={[styles.optionTitle, deliveryOption === 'pickup' && styles.selectedOptionText]}>
                                    Pickup
                                </Text>
                                <Text style={styles.optionSubtitle}>No delivery fee</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Delivery Address */}
                {deliveryOption === 'delivery' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Delivery Address</Text>
                        <TextInput
                            style={styles.textInput}
                            value={deliveryAddress}
                            onChangeText={setDeliveryAddress}
                            placeholder="Enter your delivery address"
                            multiline
                        />
                    </View>
                )}

                {/* Contact Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Phone</Text>
                    <TextInput
                        style={styles.textInput}
                        value={contactPhone}
                        onChangeText={setContactPhone}
                        placeholder="Enter your phone number"
                        keyboardType="phone-pad"
                    />
                </View>

                {/* Payment Method */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>
                    <View style={styles.paymentOptions}>
                        {[
                            { key: 'cash', icon: 'cash', label: 'Cash' },
                            { key: 'card', icon: 'card', label: 'Card' },
                            { key: 'venmo', icon: 'logo-venmo', label: 'Venmo' },
                            { key: 'paypal', icon: 'logo-paypal', label: 'PayPal' }
                        ].map((payment) => (
                            <TouchableOpacity
                                key={payment.key}
                                style={[styles.paymentOption, paymentMethod === payment.key && styles.selectedPayment]}
                                onPress={() => setPaymentMethod(payment.key as PaymentMethod)}
                            >
                                <Ionicons 
                                    name={payment.icon as any} 
                                    size={24} 
                                    color={paymentMethod === payment.key ? '#00bfff' : '#666'} 
                                />
                                <Text style={[styles.paymentLabel, paymentMethod === payment.key && styles.selectedPaymentText]}>
                                    {payment.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Special Instructions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Special Instructions</Text>
                    <TextInput
                        style={[styles.textInput, styles.instructionsInput]}
                        value={specialInstructions}
                        onChangeText={setSpecialInstructions}
                        placeholder="Any special requests or instructions..."
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* Order Total */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Order Total</Text>
                    <View style={styles.totalBreakdown}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal:</Text>
                            <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Tax:</Text>
                            <Text style={styles.totalValue}>${tax.toFixed(2)}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Delivery Fee:</Text>
                            <Text style={styles.totalValue}>${deliveryFee.toFixed(2)}</Text>
                        </View>
                        <View style={[styles.totalRow, styles.finalTotalRow]}>
                            <Text style={styles.finalTotalLabel}>Total:</Text>
                            <Text style={styles.finalTotalValue}>${total.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                {/* Place Order Button */}
                <TouchableOpacity
                    style={[styles.placeOrderButton, isPlacingOrder && styles.disabledButton]}
                    onPress={handlePlaceOrder}
                    disabled={isPlacingOrder}
                >
                    <Text style={styles.placeOrderText}>
                        {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
                    </Text>
                </TouchableOpacity>
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
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '400',
        fontFamily: 'TitanOne',
        color: "#fff",
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'TextMeOne',
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    shopOrderSummary: {
        marginBottom: 12,
    },
    shopName: {
        fontSize: 16,
        fontFamily: 'TextMeOne',
        fontWeight: 'bold',
        color: '#00bfff',
        marginBottom: 8,
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    orderItemName: {
        fontSize: 14,
        fontFamily: 'TextMeOne',
        color: '#333',
    },
    orderItemPrice: {
        fontSize: 14,
        fontFamily: 'TextMeOne',
        color: '#666',
    },
    shopSubtotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    shopSubtotalLabel: {
        fontSize: 14,
        fontFamily: 'TextMeOne',
        fontWeight: 'bold',
    },
    shopSubtotalAmount: {
        fontSize: 14,
        fontFamily: 'TextMeOne',
        fontWeight: 'bold',
        color: '#00bfff',
    },
    optionGroup: {
        gap: 12,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#eee',
        backgroundColor: '#f9f9f9',
    },
    selectedOption: {
        borderColor: '#00bfff',
        backgroundColor: '#f0f9ff',
    },
    optionContent: {
        marginLeft: 12,
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontFamily: 'TextMeOne',
        fontWeight: 'bold',
        color: '#333',
    },
    selectedOptionText: {
        color: '#00bfff',
    },
    optionSubtitle: {
        fontSize: 14,
        fontFamily: 'TextMeOne',
        color: '#666',
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        fontFamily: 'TextMeOne',
        backgroundColor: '#f9f9f9',
    },
    instructionsInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    paymentOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#eee',
        backgroundColor: '#f9f9f9',
        minWidth: '45%',
    },
    selectedPayment: {
        borderColor: '#00bfff',
        backgroundColor: '#f0f9ff',
    },
    paymentLabel: {
        marginLeft: 8,
        fontSize: 14,
        fontFamily: 'TextMeOne',
        color: '#333',
    },
    selectedPaymentText: {
        color: '#00bfff',
        fontWeight: 'bold',
    },
    totalBreakdown: {
        gap: 8,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    finalTotalRow: {
        paddingTop: 8,
        borderTopWidth: 2,
        borderTopColor: '#00bfff',
    },
    totalLabel: {
        fontSize: 16,
        fontFamily: 'TextMeOne',
        color: '#333',
    },
    totalValue: {
        fontSize: 16,
        fontFamily: 'TextMeOne',
        color: '#666',
    },
    finalTotalLabel: {
        fontSize: 18,
        fontFamily: 'TextMeOne',
        fontWeight: 'bold',
        color: '#333',
    },
    finalTotalValue: {
        fontSize: 18,
        fontFamily: 'TextMeOne',
        fontWeight: 'bold',
        color: '#00bfff',
    },
    placeOrderButton: {
        backgroundColor: '#00bfff',
        borderRadius: 30,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 32,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    placeOrderText: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'TextMeOne',
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 18,
        fontFamily: 'TextMeOne',
        color: '#666',
        marginBottom: 24,
    },
    continueShoppingButton: {
        backgroundColor: '#00bfff',
        borderRadius: 30,
        padding: 16,
        alignItems: 'center',
        minWidth: 200,
    },
    continueShoppingText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'TextMeOne',
        fontWeight: 'bold',
    },
});

export default Checkout;

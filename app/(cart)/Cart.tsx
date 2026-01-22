import React, { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/store/reduxHooks';
import { SoundTouchableOpacity } from '@/components/SoundTouchableOpacity';

const { height } = Dimensions.get('window');

const ShopSection = ({ shopCart, updateItemQuantity, removeFromCart }) => (
    <View style={styles.shopSection}>
        <View style={styles.shopHeader}>
            <Text style={styles.shopName}>{shopCart.shopName}</Text>
            <SoundTouchableOpacity 
                style={styles.clearShopButton}
                onPress={() => removeFromCart(shopCart.shopId, null, true)}
                soundType="tap"
            >
                <Text style={styles.clearShopText}>Clear</Text>
            </SoundTouchableOpacity>
        </View>
        
        {shopCart.items.map((item) => (
            <View key={item.itemId} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemText}>{item.name}</Text>
                    <Text style={styles.itemPrice}>@ ${item.price.toFixed(2)}</Text>
                </View>
                
                <View style={styles.quantityControls}>
                    <SoundTouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => updateItemQuantity(shopCart.shopId, item.itemId, item.quantity - 1)}
                        soundType="tap"
                    >
                        <Ionicons name="remove" size={18} color="#333" />
                    </SoundTouchableOpacity>
                    
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    
                    <SoundTouchableOpacity 
                        style={styles.quantityButton}
                        onPress={() => updateItemQuantity(shopCart.shopId, item.itemId, item.quantity + 1)}
                        soundType="tap"
                    >
                        <Ionicons name="add" size={18} color="#333" />
                    </SoundTouchableOpacity>
                </View>
                
                <Text style={styles.itemTotal}>${(item.price * item.quantity).toFixed(2)}</Text>
                
                <SoundTouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => removeFromCart(shopCart.shopId, item.itemId)}
                    soundType="tap"
                >
                    <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                </SoundTouchableOpacity>
            </View>
        ))}
        
        <View style={styles.shopSubtotal}>
            <Text style={styles.subtotalLabel}>Shop subtotal:</Text>
            <Text style={styles.subtotalAmount}>${shopCart.subtotal.toFixed(2)}</Text>
        </View>
    </View>
);

const CartScreen = () => {
    const router = useRouter();
    const slideAnim = useRef(new Animated.Value(height)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const { 
        shopCarts, 
        updateItemQuantity, 
        removeFromCart, 
        clearShopCart,
        calculateTotalSubtotal, 
        getItemCount 
    } = useCart();
    
    const totalAmount = calculateTotalSubtotal();
    const itemCount = getItemCount();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleRemoveItem = (shopId: string, itemId: string, clearShop: boolean = false) => {
        if (clearShop) {
            clearShopCart(shopId);
        } else {
            removeFromCart(shopId, itemId);
        }
    };

    const handleCheckout = () => {
        router.navigate('/Checkout');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <SoundTouchableOpacity
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
                    soundType="tap"
                >
                    <Ionicons name="chevron-back" size={24} color="black" />
                </SoundTouchableOpacity>
                <Text style={styles.headerTitle}>your cart</Text>
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
                {shopCarts.length > 0 ? (
                    <View style={styles.cartContent}>
                        {shopCarts.map((shopCart) => (
                            <ShopSection
                                key={shopCart.shopId}
                                shopCart={shopCart}
                                updateItemQuantity={updateItemQuantity}
                                removeFromCart={handleRemoveItem}
                            />
                        ))}

                        <View style={styles.divider} />

                        <View style={styles.totalSection}>
                            <Text style={styles.totalLabel}>total:</Text>
                            <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
                        </View>

                        <Text style={styles.itemCount}>
                            items: {itemCount}
                        </Text>
                    </View>
                    
                ) : (
                    <View style={styles.emptyCartContainer}>
                        <Ionicons name="cart-outline" size={80} color="#999" />
                        <Text style={styles.emptyCartText}>Your cart is empty</Text>
                        <SoundTouchableOpacity
                            style={styles.continueShoppingButton}
                            onPress={() => router.navigate('/Market')}
                            soundType="tap"
                        >
                            <Text style={styles.continueShoppingText}>Continue Shopping</Text>
                        </SoundTouchableOpacity>
                    </View>
                )}
            </Animated.ScrollView>
            {shopCarts.length > 0 &&
            <View style={styles.buttonContainer}>
                <SoundTouchableOpacity
                style={styles.checkoutButton}
                onPress={handleCheckout}
                soundType="tap"
                >
                    <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
                </SoundTouchableOpacity>
            </View>
    }
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#b7ffb0',
        paddingTop: Platform.OS === 'ios' ? 60 : 0,
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
    cartContent: {
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
        marginBottom: 100,
    },
    shopSection: {
        marginBottom: 24,
    },
    shopHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    shopName: {
        fontSize: 18,
        fontFamily: 'TextMeOne',
        fontWeight: 'bold',
        color: '#00bfff',
    },
    clearShopButton: {
        padding: 4,
    },
    clearShopText: {
        color: '#FF6B6B',
        fontFamily: 'TextMeOne',
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingVertical: 4,
    },
    itemInfo: {
        flex: 2,
    },
    itemText: {
        fontSize: 16,
        marginRight: 8,
        fontFamily: 'TextMeOne',
    },
    itemPrice: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'TextMeOne',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1,
        marginRight: 15,
    },
    quantityButton: {
        backgroundColor: '#f0f0f0',
        borderRadius: 15,
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quantityText: {
        fontSize: 16,
        fontFamily: 'TextMeOne',
        paddingHorizontal: 8,
    },
    itemTotal: {
        fontSize: 16,
        color: '#40C4FF',
        fontFamily: 'TextMeOne',
        flex: 1,
        textAlign: 'right',
        marginRight: 10,
    },
    removeButton: {
        padding: 6,
    },
    shopSubtotal: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    subtotalLabel: {
        fontSize: 14,
        fontFamily: 'TextMeOne',
        marginRight: 8,
    },
    subtotalAmount: {
        fontSize: 16,
        fontFamily: 'TextMeOne',
        fontWeight: 'bold',
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
        fontSize: 20,
        fontFamily: 'TextMeOne',
        fontWeight: 'bold',
    },
    totalAmount: {
        fontSize: 20,
        fontFamily: 'TextMeOne',
        fontWeight: 'bold',
        color: '#40C4FF',
    },
    itemCount: {
        fontSize: 14,
        color: '#999',
        fontFamily: 'TextMeOne',
        marginBottom: 24,
    },
    buttonContainer: {
        bottom: 0,
        left: 0,
        right: 0,
        // uncomment if adding checkout to (home) route
        // ...Platform.select({
        //     ios: {
        //         paddingBottom: 30,
        //     }
        // }),
    },
    checkoutButton: {
        width: '100%',
        marginBottom: 0,
        padding: 10,
        paddingBottom: 33,
        backgroundColor: '#00bfff',
    },
    checkoutButtonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 30,
        fontFamily: 'TextMeOne',
    },
    emptyCartContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 32,
        marginTop: 32,
    },
    emptyCartText: {
        fontSize: 18,
        fontFamily: 'TextMeOne',
        marginVertical: 16,
        color: '#666',
    },
    continueShoppingButton: {
        backgroundColor: '#40C4FF',
        borderRadius: 30,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        width: '80%',
    },
    continueShoppingText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'TextMeOne',
        fontWeight: 'bold',
    },
});

export default CartScreen;
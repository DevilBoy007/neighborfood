import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { v4 as uuidv4 } from 'uuid';
import { useCart, useUser, useOrder, useMessage } from '@/store/reduxHooks';
import firebaseService from '@/handlers/firebaseService';
import { SoundTouchableOpacity } from '@/components/SoundTouchableOpacity';

type DeliveryOption = 'pickup' | 'delivery';
type PaymentMethod = 'apple_pay' | 'card' | 'venmo' | 'paypal';

const Checkout = () => {
  const router = useRouter();
  const { shopCarts, clearCart, calculateTotalSubtotal } = useCart();
  const { userData } = useUser();
  const { refreshOrders } = useOrder();
  const { createOrGetThread } = useMessage();

  const [shopDeliveryOptions, setShopDeliveryOptions] = useState<Record<string, DeliveryOption>>(
    {}
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const subtotal = calculateTotalSubtotal();
  const deliveryFee =
    Object.values(shopDeliveryOptions).filter((option) => option === 'delivery').length * 3.99;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + deliveryFee + tax;

  useEffect(() => {
    // Initialize delivery options for each shop
    const initialOptions: Record<string, DeliveryOption> = {};
    shopCarts.forEach((shopCart) => {
      // Default to pickup if available, otherwise delivery
      if (shopCart.allowPickup) {
        initialOptions[shopCart.shopId] = 'pickup';
      } else if (shopCart.localDelivery) {
        initialOptions[shopCart.shopId] = 'delivery';
      }
    });
    setShopDeliveryOptions(initialOptions);

    // Initialize with user's saved address and phone
    if (userData?.location?.address) {
      setDeliveryAddress(userData.location.address);
    }
    if (userData?.phone) {
      setContactPhone(userData.phone);
    }
  }, [shopCarts, userData]);

  const updateShopDeliveryOption = (shopId: string, option: DeliveryOption) => {
    setShopDeliveryOptions((prev) => ({
      ...prev,
      [shopId]: option,
    }));
  };

  const hasDeliveryOrders = Object.values(shopDeliveryOptions).some(
    (option) => option === 'delivery'
  );

  const handlePlaceOrder = async () => {
    if (!userData) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please log in to place an order',
        visibilityTime: 3000,
      });
      return;
    }

    if (hasDeliveryOrders && !deliveryAddress.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a delivery address for delivery orders',
        visibilityTime: 3000,
      });
      return;
    }

    if (!contactPhone.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a contact phone number',
        visibilityTime: 3000,
      });
      return;
    }

    // Check if all shops have a delivery option selected
    const missingOptions = shopCarts.filter((shopCart) => !shopDeliveryOptions[shopCart.shopId]);
    if (missingOptions.length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select a delivery option for all shops',
        visibilityTime: 3000,
      });
      return;
    }

    setIsPlacingOrder(true);
    const orderId = uuidv4();
    try {
      // First, get shop owner information for each shop to create message threads
      const shopOwnerMap = new Map<string, string>(); // shopId -> ownerId

      await Promise.all(
        shopCarts.map(async (shopCart) => {
          const shop = await firebaseService.getDocument('shops', shopCart.shopId);
          if (shop?.userId) {
            shopOwnerMap.set(shopCart.shopId, shop.userId as string);
          }
        })
      );

      // Create orders for each shop using the dedicated createOrder function
      const orderPromises = shopCarts.map(async (shopCart) => {
        const deliveryOption = shopDeliveryOptions[shopCart.shopId];
        const orderData = {
          id: orderId,
          userId: userData.uid,
          shopId: shopCart.shopId,
          shopName: shopCart.shopName,
          shopPhotoURL: shopCart.shopPhotoURL || '',
          items: shopCart.items.map((item) => ({
            ...item,
          })),
          subtotal: shopCart.subtotal,
          tax: shopCart.subtotal * 0.08,
          deliveryFee: deliveryOption === 'delivery' ? 3.99 : 0,
          tip: 0, // TODO: implement later
          total:
            shopCart.subtotal +
            shopCart.subtotal * 0.08 +
            (deliveryOption === 'delivery' ? 3.99 : 0),
          status: 'pending' as const,
          estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
          paymentMethod,
          deliveryAddress: deliveryOption === 'delivery' ? deliveryAddress : 'Pickup',
          contactPhone,
          deliveryOption,
          specialInstructions,
        };

        await firebaseService.createOrder(orderData);

        return orderData;
      });

      const createdOrders = await Promise.all(orderPromises);

      // Create message threads with shop owners (one per unique owner)
      // Group orders by owner to avoid creating duplicate threads
      const ownerOrdersMap = new Map<string, typeof createdOrders>();
      createdOrders.forEach((order) => {
        const ownerId = shopOwnerMap.get(order.shopId);
        if (ownerId && ownerId !== userData.uid) {
          if (!ownerOrdersMap.has(ownerId)) {
            ownerOrdersMap.set(ownerId, []);
          }
          ownerOrdersMap.get(ownerId)!.push(order);
        }
      });

      // Create threads and send order messages
      await Promise.all(
        Array.from(ownerOrdersMap.entries()).map(async ([ownerId, orders]) => {
          try {
            // Use the first order as the initial message
            const firstOrder = orders[0];
            await createOrGetThread([userData.uid, ownerId], {
              type: 'order',
              orderId: firstOrder.id,
              orderData: {
                id: firstOrder.id,
                shopName: firstOrder.shopName,
                shopPhotoURL: firstOrder.shopPhotoURL,
                items: firstOrder.items.map((item) => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price,
                })),
                total: firstOrder.total,
                status: firstOrder.status,
                deliveryOption: firstOrder.deliveryOption,
                deliveryAddress: firstOrder.deliveryAddress,
              },
            });
          } catch (threadError) {
            console.error('Error creating message thread:', threadError);
            // Don't fail the order if thread creation fails
          }
        })
      );

      if (userData?.uid) {
        await refreshOrders(userData.uid);
      }

      clearCart();

      Toast.show({
        type: 'success',
        text1: 'Order Placed!',
        text2: `Your order${createdOrders.length > 1 ? 's have' : ' has'} been placed successfully. You'll receive updates on the status.`,
        visibilityTime: 3000,
      });

      // Navigate to success page, then to menu, then to orders
      router.navigate('/success');
      setTimeout(
        () => {
          router.navigate('/(home)/Menu');
          setTimeout(() => {
            router.navigate('/(home)/(orders)');
          }, 100);
        },
        Platform.OS === 'web' ? 2100 : 2000
      );
    } catch (error) {
      console.error('Error placing order:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to place order. Please try again.',
        visibilityTime: 3000,
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (shopCarts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <SoundTouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            soundType="tap"
          >
            <Ionicons name="chevron-back" size={24} color="black" />
          </SoundTouchableOpacity>
          <Text style={styles.headerTitle}>checkout</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <SoundTouchableOpacity
            style={styles.continueShoppingButton}
            onPress={() => router.navigate('/Market')}
            soundType="tap"
          >
            <Text style={styles.continueShoppingText}>Continue Shopping</Text>
          </SoundTouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SoundTouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          soundType="tap"
        >
          <Ionicons name="chevron-back" size={24} color="black" />
        </SoundTouchableOpacity>
        <Text style={styles.headerTitle}>checkout</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Order Summary with Delivery Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary & Delivery</Text>
          {shopCarts.map((shopCart) => (
            <View key={shopCart.shopId} style={styles.shopOrderSummary}>
              <Text style={styles.shopName}>{shopCart.shopName}</Text>

              {/* Items */}
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

              {/* Delivery Options for this shop */}
              <View style={styles.shopDeliveryOptions}>
                <Text style={styles.deliveryOptionsTitle}>Delivery Option:</Text>
                <View style={styles.optionGroup}>
                  {shopCart.allowPickup && (
                    <SoundTouchableOpacity
                      style={[
                        styles.shopOption,
                        shopDeliveryOptions[shopCart.shopId] === 'pickup' &&
                          styles.selectedShopOption,
                      ]}
                      onPress={() => updateShopDeliveryOption(shopCart.shopId, 'pickup')}
                      soundType="tap"
                    >
                      <Ionicons
                        name="storefront"
                        size={20}
                        color={
                          shopDeliveryOptions[shopCart.shopId] === 'pickup' ? '#00bfff' : '#666'
                        }
                      />
                      <Text
                        style={[
                          styles.shopOptionText,
                          shopDeliveryOptions[shopCart.shopId] === 'pickup' &&
                            styles.selectedShopOptionText,
                        ]}
                      >
                        Pickup
                      </Text>
                    </SoundTouchableOpacity>
                  )}

                  {shopCart.localDelivery && (
                    <SoundTouchableOpacity
                      style={[
                        styles.shopOption,
                        shopDeliveryOptions[shopCart.shopId] === 'delivery' &&
                          styles.selectedShopOption,
                      ]}
                      onPress={() => updateShopDeliveryOption(shopCart.shopId, 'delivery')}
                      soundType="tap"
                    >
                      <Ionicons
                        name="bicycle"
                        size={20}
                        color={
                          shopDeliveryOptions[shopCart.shopId] === 'delivery' ? '#00bfff' : '#666'
                        }
                      />
                      <Text
                        style={[
                          styles.shopOptionText,
                          shopDeliveryOptions[shopCart.shopId] === 'delivery' &&
                            styles.selectedShopOptionText,
                        ]}
                      >
                        Delivery (+$3.99)
                      </Text>
                    </SoundTouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.shopSubtotalRow}>
                <Text style={styles.shopSubtotalLabel}>Shop subtotal:</Text>
                <Text style={styles.shopSubtotalAmount}>${shopCart.subtotal.toFixed(2)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Delivery Address - only show if any shop needs delivery */}
        {hasDeliveryOrders && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TextInput
              style={styles.textInput}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              placeholder="Enter your delivery address"
              placeholderTextColor={'#ddd'}
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
            placeholderTextColor={'#ddd'}
            keyboardType="phone-pad"
          />
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.paymentOptions}>
            {[
              { key: 'apple_pay', icon: 'logo-apple', label: 'Apple Pay' },
              { key: 'card', icon: 'card', label: 'Card' },
              { key: 'venmo', icon: 'logo-venmo', label: 'Venmo' },
              { key: 'paypal', icon: 'logo-paypal', label: 'PayPal' },
            ].map((payment) => (
              <SoundTouchableOpacity
                key={payment.key}
                style={[
                  styles.paymentOption,
                  paymentMethod === payment.key && styles.selectedPayment,
                ]}
                onPress={() => setPaymentMethod(payment.key as PaymentMethod)}
                soundType="tap"
              >
                <Ionicons
                  name={payment.icon as any}
                  size={24}
                  color={paymentMethod === payment.key ? '#00bfff' : '#666'}
                />
                <Text
                  style={[
                    styles.paymentLabel,
                    paymentMethod === payment.key && styles.selectedPaymentText,
                  ]}
                >
                  {payment.label}
                </Text>
              </SoundTouchableOpacity>
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
            placeholderTextColor={'#ddd'}
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
              <Text style={styles.totalLabel}>Delivery Fees:</Text>
              <Text style={styles.totalValue}>${deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={[styles.totalRow, styles.finalTotalRow]}>
              <Text style={styles.finalTotalLabel}>Total:</Text>
              <Text style={styles.finalTotalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      {/* Place Order Button */}
      <View style={styles.buttonContainer}>
        {paymentMethod === 'apple_pay' ? (
          <SoundTouchableOpacity
            style={[styles.applePayButton, isPlacingOrder && styles.disabledButton]}
            onPress={handlePlaceOrder}
            disabled={isPlacingOrder}
            soundType="click"
          >
            <Ionicons name="logo-apple" size={24} color="white" style={styles.applePayIcon} />
            <Text style={styles.applePayText}>
              {isPlacingOrder ? 'Processing...' : 'Pay with Apple Pay'}
            </Text>
          </SoundTouchableOpacity>
        ) : (
          <SoundTouchableOpacity
            style={[styles.placeOrderButton, isPlacingOrder && styles.disabledButton]}
            onPress={handlePlaceOrder}
            disabled={isPlacingOrder}
            soundType="click"
          >
            <Text style={styles.placeOrderText}>
              {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
            </Text>
          </SoundTouchableOpacity>
        )}
      </View>
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
    ...Platform.select({
      ios: {
        justifyContent: 'flex-end',
      },
    }),
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '400',
    fontFamily: 'TitanOne',
    color: '#fff',
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
  placeOrderButton: {
    width: '100%',
    marginBottom: 0,
    padding: 10,
    paddingBottom: 33,
    backgroundColor: '#00bfff',
  },
  placeOrderText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 30,
    fontFamily: 'TextMeOne',
  },
  applePayButton: {
    width: '100%',
    marginBottom: 0,
    padding: 10,
    paddingBottom: 33,
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applePayIcon: {
    marginRight: 8,
  },
  applePayText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 30,
  },
  disabledButton: {
    backgroundColor: '#ccc',
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
  shopDeliveryOptions: {
    marginTop: 12,
    marginBottom: 8,
  },
  deliveryOptionsTitle: {
    fontSize: 14,
    fontFamily: 'TextMeOne',
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
  },
  shopOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    marginRight: 8,
    marginBottom: 4,
  },
  selectedShopOption: {
    borderColor: '#00bfff',
    backgroundColor: '#f0f9ff',
  },
  shopOptionText: {
    marginLeft: 6,
    fontSize: 12,
    fontFamily: 'TextMeOne',
    color: '#333',
  },
  selectedShopOptionText: {
    color: '#00bfff',
    fontWeight: 'bold',
  },
});

export default Checkout;

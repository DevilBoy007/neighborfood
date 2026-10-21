import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { v4 as uuidv4 } from 'uuid';
import { useCart, useUser, useOrder, useMessage } from '@/store/reduxHooks';
import firebaseService from '@/handlers/firebaseService';
import { SoundTouchableOpacity } from '@/components/SoundTouchableOpacity';
import { useAppColors } from '@/hooks/useAppColors';
const IS_WEB = Platform.OS === 'web';

// Conditionally import Stripe PaymentSheet hooks (native only)
let useStripeHook: () => {
  initPaymentSheet: any;
  presentPaymentSheet: any;
} = () => ({ initPaymentSheet: null, presentPaymentSheet: null });
if (!IS_WEB) {
  /* eslint-disable @typescript-eslint/no-require-imports */
  const StripeModule = require('@stripe/stripe-react-native');
  useStripeHook = StripeModule.useStripe;
  /* eslint-enable @typescript-eslint/no-require-imports */
}

type DeliveryOption = 'pickup' | 'delivery';

const Checkout = () => {
  const router = useRouter();
  const { shopCarts, clearCart, calculateTotalSubtotal } = useCart();
  const { userData } = useUser();
  const { refreshOrders } = useOrder();
  const { createOrGetThread } = useMessage();
  const colors = useAppColors();
  const { initPaymentSheet, presentPaymentSheet } = useStripeHook();

  const [shopDeliveryOptions, setShopDeliveryOptions] = useState<Record<string, DeliveryOption>>(
    {}
  );
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentSheetReady, setPaymentSheetReady] = useState(false);
  const [initializingSheet, setInitializingSheet] = useState(false);
  const [checkoutOrderId] = useState(() => uuidv4());
  const paymentIntentIdsRef = useRef<Record<string, string>>({});
  const paidPaymentIntentIdsRef = useRef<Record<string, boolean>>({});
  const initializationRef = useRef<Promise<void> | null>(null);
  const initializationKeyRef = useRef<string | null>(null);
  const readyPaymentKeyRef = useRef<string | null>(null);
  const initializationVersionRef = useRef(0);
  // Track shop owner UIDs for escrow metadata
  const [shopOwnerIds, setShopOwnerIds] = useState<Record<string, string>>({});

  const subtotal = calculateTotalSubtotal();
  const deliveryFee =
    Object.values(shopDeliveryOptions).filter((option) => option === 'delivery').length * 3.99;
  const tax = shopCarts.reduce(
    (sum, shopCart) => sum + Math.round(shopCart.subtotal * 0.08 * 100) / 100,
    0
  );
  const platformFee = shopCarts.reduce(
    (sum, shopCart) => sum + Math.min(Math.round(shopCart.subtotal * 0.1 * 100) / 100, 1),
    0
  );
  const total = subtotal + deliveryFee + tax + platformFee;

  // Look up shop owner UIDs for escrow metadata (sellerId passed to createPaymentSheetParams)
  useEffect(() => {
    const loadShopOwners = async () => {
      const owners: Record<string, string> = {};
      await Promise.all(
        shopCarts.map(async (shopCart) => {
          try {
            const shop = await firebaseService.getDocument('shops', shopCart.shopId);
            if (shop?.userId) {
              owners[shopCart.shopId] = shop.userId as string;
            }
          } catch {
            // owner lookup failure is non-fatal; escrow release will fall back gracefully
          }
        })
      );
      setShopOwnerIds(owners);
    };
    if (shopCarts.length > 0) {
      loadShopOwners();
    }
  }, [shopCarts]);

  // Initialize PaymentSheet (escrow model — platform charge, no stripeAccount header)
  // Pre-initializes for single-shop orders; multi-shop orders init per-shop during checkout.
  const initializePaymentSheet = useCallback(async () => {
    if (!userData?.uid || IS_WEB || total <= 0) return;
    if (shopCarts.length !== 1) {
      setPaymentSheetReady(shopCarts.length > 1);
      return;
    }

    const shopCart = shopCarts[0];
    const deliveryOption = shopDeliveryOptions[shopCart.shopId];
    if (
      !deliveryOption ||
      !contactPhone.trim() ||
      (deliveryOption === 'delivery' && !deliveryAddress.trim())
    ) {
      setPaymentSheetReady(false);
      return;
    }

    const paymentKey = JSON.stringify([
      shopCart.shopId,
      shopCart.items.map(({ itemId, quantity }) => [itemId, quantity]),
      deliveryOption,
      deliveryAddress,
      contactPhone,
      specialInstructions,
    ]);
    if (readyPaymentKeyRef.current === paymentKey && paymentIntentIdsRef.current[shopCart.shopId]) {
      setPaymentSheetReady(true);
      return;
    }
    if (initializationRef.current && initializationKeyRef.current === paymentKey) {
      await initializationRef.current;
      return;
    }

    const version = ++initializationVersionRef.current;
    setPaymentSheetReady(false);
    setInitializingSheet(true);
    const previousInitialization = initializationRef.current;
    const initialization = (async () => {
      if (previousInitialization) await previousInitialization;
      if (version !== initializationVersionRef.current) return;

      const { paymentIntent, paymentIntentId, ephemeralKey, customer, alreadyPaid } =
        await firebaseService.createPaymentSheetParams(
          checkoutOrderId,
          shopCart.shopId,
          shopCart.items.map(({ itemId, quantity }) => ({ itemId, quantity })),
          deliveryOption,
          deliveryAddress,
          contactPhone,
          specialInstructions
        );
      if (version !== initializationVersionRef.current) return;

      if (!alreadyPaid) {
        const { error } = await initPaymentSheet({
          merchantDisplayName: 'Neighborfood',
          customerId: customer,
          customerEphemeralKeySecret: ephemeralKey,
          paymentIntentClientSecret: paymentIntent,
          allowsDelayedPaymentMethods: false,
          returnURL: 'neighborfood://stripe-redirect',
          applePay: { merchantCountryCode: 'US' },
          googlePay: {
            merchantCountryCode: 'US',
            testEnv: (
              process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
              process.env.STRIPE_TEST_KEY ||
              ''
            ).startsWith('pk_test_'),
          },
          defaultBillingDetails: {
            name:
              userData?.first && userData?.last ? `${userData.first} ${userData.last}` : undefined,
            email: userData?.email || undefined,
            phone: userData?.phone || undefined,
          },
        });
        if (version !== initializationVersionRef.current) return;
        if (error) {
          console.error('PaymentSheet init error:', error);
          return;
        }
      }

      paymentIntentIdsRef.current = {
        ...paymentIntentIdsRef.current,
        [shopCart.shopId]: paymentIntentId,
      };
      paidPaymentIntentIdsRef.current[shopCart.shopId] = alreadyPaid;
      readyPaymentKeyRef.current = paymentKey;
      setPaymentSheetReady(true);
    })();
    initializationRef.current = initialization;
    initializationKeyRef.current = paymentKey;
    try {
      await initialization;
    } catch (error) {
      console.error('Error initializing payment sheet:', error);
    } finally {
      if (initializationRef.current === initialization) {
        initializationRef.current = null;
        initializationKeyRef.current = null;
        setInitializingSheet(false);
      }
    }
  }, [
    userData,
    total,
    initPaymentSheet,
    shopCarts,
    shopDeliveryOptions,
    checkoutOrderId,
    deliveryAddress,
    contactPhone,
    specialInstructions,
  ]);

  useEffect(() => {
    if (shopCarts.length > 0 && total > 0) {
      initializePaymentSheet();
    }
  }, [initializePaymentSheet, shopCarts.length, total]);

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
    if (shopDeliveryOptions[shopId] === option) return;
    initializationVersionRef.current += 1;
    setPaymentSheetReady(false);
    setShopDeliveryOptions((prev) => ({
      ...prev,
      [shopId]: option,
    }));
  };

  const hasDeliveryOrders = Object.values(shopDeliveryOptions).some(
    (option) => option === 'delivery'
  );
  const singleShopPaymentKey =
    shopCarts.length === 1 && shopDeliveryOptions[shopCarts[0].shopId]
      ? JSON.stringify([
          shopCarts[0].shopId,
          shopCarts[0].items.map(({ itemId, quantity }) => [itemId, quantity]),
          shopDeliveryOptions[shopCarts[0].shopId],
          deliveryAddress,
          contactPhone,
          specialInstructions,
        ])
      : null;
  const paymentSheetIsCurrent =
    paymentSheetReady &&
    singleShopPaymentKey !== null &&
    readyPaymentKeyRef.current === singleShopPaymentKey &&
    Boolean(paymentIntentIdsRef.current[shopCarts[0]?.shopId]);

  const handlePlaceOrder = async () => {
    if (IS_WEB) {
      Toast.show({
        type: 'error',
        text1: 'Payments unavailable',
        text2: 'Checkout is not available on web yet. Please use the mobile app.',
        visibilityTime: 3000,
      });
      return;
    }

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
    try {
      const completedPayments: string[] = [];
      const getOrderData = (shopCart: (typeof shopCarts)[number]) => {
        const deliveryOption = shopDeliveryOptions[shopCart.shopId];
        const shopPlatformFee = Math.min(shopCart.subtotal * 0.1, 1);
        return {
          id: checkoutOrderId,
          userId: userData.uid,
          shopId: shopCart.shopId,
          shopName: shopCart.shopName,
          shopPhotoURL: shopCart.shopPhotoURL || '',
          items: shopCart.items.map((item) => ({ ...item })),
          subtotal: shopCart.subtotal,
          tax: shopCart.subtotal * 0.08,
          deliveryFee: deliveryOption === 'delivery' ? 3.99 : 0,
          platformFee: shopPlatformFee,
          tip: 0,
          total:
            shopCart.subtotal +
            shopCart.subtotal * 0.08 +
            (deliveryOption === 'delivery' ? 3.99 : 0) +
            shopPlatformFee,
          status: 'pending' as const,
          estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000),
          paymentMethod: 'card',
          paymentIntentId: '',
          escrowStatus: 'held',
          deliveryAddress: deliveryOption === 'delivery' ? deliveryAddress : 'Pickup',
          contactPhone,
          deliveryOption,
          specialInstructions,
        };
      };
      const createdOrders: ReturnType<typeof getOrderData>[] = [];

      const createPaidOrder = async (
        shopCart: (typeof shopCarts)[number],
        paymentIntentId: string
      ) => {
        try {
          await firebaseService.createOrder({ paymentIntentId });
        } catch (error) {
          if (shopCarts.length === 1) {
            readyPaymentKeyRef.current = null;
            setPaymentSheetReady(false);
            void initializePaymentSheet();
          }
          throw error;
        }
        completedPayments.push(shopCart.shopId);
        createdOrders.push({ ...getOrderData(shopCart), paymentIntentId });
      };

      if (shopCarts.length === 1) {
        const shopCart = shopCarts[0];
        if (!paymentSheetIsCurrent) await initializePaymentSheet();
        const paymentIntentId = paymentIntentIdsRef.current[shopCart.shopId];
        if (!paymentIntentId) {
          throw new Error('Payment is still being prepared. Please try again.');
        }
        const { error } = paidPaymentIntentIdsRef.current[shopCart.shopId]
          ? { error: undefined }
          : await presentPaymentSheet();
        if (error) {
          if (error.code !== 'Canceled') {
            Toast.show({
              type: 'error',
              text1: 'Payment Failed',
              text2: error.message || 'Your payment could not be processed.',
              visibilityTime: 3000,
            });
          }
          setPaymentSheetReady(false);
          readyPaymentKeyRef.current = null;
          delete paymentIntentIdsRef.current[shopCart.shopId];
          delete paidPaymentIntentIdsRef.current[shopCart.shopId];
          void initializePaymentSheet();
          return;
        }
        await createPaidOrder(shopCart, paymentIntentId);
      } else {
        for (const shopCart of shopCarts) {
          const deliveryOption = shopDeliveryOptions[shopCart.shopId];
          const { paymentIntent, paymentIntentId, ephemeralKey, customer, alreadyPaid } =
            await firebaseService.createPaymentSheetParams(
              checkoutOrderId,
              shopCart.shopId,
              shopCart.items.map(({ itemId, quantity }) => ({ itemId, quantity })),
              deliveryOption,
              deliveryAddress,
              contactPhone,
              specialInstructions
            );

          if (alreadyPaid) {
            await createPaidOrder(shopCart, paymentIntentId);
            continue;
          }

          const { error: initError } = await initPaymentSheet({
            merchantDisplayName: 'Neighborfood',
            customerId: customer,
            customerEphemeralKeySecret: ephemeralKey,
            paymentIntentClientSecret: paymentIntent,
            allowsDelayedPaymentMethods: false,
            returnURL: 'neighborfood://stripe-redirect',
            applePay: { merchantCountryCode: 'US' },
            googlePay: {
              merchantCountryCode: 'US',
              testEnv: (
                process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
                process.env.STRIPE_TEST_KEY ||
                ''
              ).startsWith('pk_test_'),
            },
            defaultBillingDetails: {
              name:
                userData?.first && userData?.last
                  ? `${userData.first} ${userData.last}`
                  : undefined,
              email: userData?.email || undefined,
              phone: userData?.phone || undefined,
            },
          });
          if (initError) {
            throw new Error(`Failed to prepare payment for ${shopCart.shopName}.`);
          }

          const { error } = await presentPaymentSheet();
          if (error) {
            if (error.code !== 'Canceled') {
              Toast.show({
                type: 'error',
                text1: 'Payment Failed',
                text2:
                  `${error.message || `Payment failed for ${shopCart.shopName}.`} ` +
                  (completedPayments.length
                    ? 'Orders from shops already paid remain placed; you can retry the remaining shops.'
                    : ''),
                visibilityTime: 3000,
              });
            }
            return;
          }

          await createPaidOrder(shopCart, paymentIntentId);
        }
      }

      // shopOwnerMap is already populated via shopOwnerIds state; use it for threads too.
      const shopOwnerMap = new Map<string, string>(Object.entries(shopOwnerIds));

      // Also fetch any owners not yet loaded (e.g. if owner lookup was still in-flight)
      await Promise.all(
        shopCarts
          .filter((shopCart) => !shopOwnerMap.has(shopCart.shopId))
          .map(async (shopCart) => {
            const shop = await firebaseService.getDocument('shops', shopCart.shopId);
            if (shop?.userId) {
              shopOwnerMap.set(shopCart.shopId, shop.userId as string);
            }
          })
      );

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
        IS_WEB ? 2100 : 2000
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <SoundTouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            soundType="tap"
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </SoundTouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textOnPrimary }]}>checkout</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Your cart is empty</Text>
          <SoundTouchableOpacity
            style={[styles.continueShoppingButton, { backgroundColor: colors.buttonPrimary }]}
            onPress={() => router.navigate('/Market')}
            soundType="tap"
          >
            <Text style={[styles.continueShoppingText, { color: colors.textOnPrimary }]}>
              Continue Shopping
            </Text>
          </SoundTouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <SoundTouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          soundType="tap"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </SoundTouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.buttonText }]}>checkout</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Order Summary with Delivery Options */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Order Summary & Delivery
          </Text>
          {shopCarts.map((shopCart) => (
            <View key={shopCart.shopId} style={styles.shopOrderSummary}>
              <Text style={[styles.shopName, { color: colors.primary }]}>{shopCart.shopName}</Text>

              {/* Items */}
              {shopCart.items.map((item) => (
                <View key={item.itemId} style={styles.orderItem}>
                  <Text style={[styles.orderItemName, { color: colors.text }]}>
                    {item.quantity}x {item.name}
                  </Text>
                  <Text style={[styles.orderItemPrice, { color: colors.textMuted }]}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}

              {/* Delivery Options for this shop */}
              <View style={styles.shopDeliveryOptions}>
                <Text style={[styles.deliveryOptionsTitle, { color: colors.textMuted }]}>
                  Delivery Option:
                </Text>
                <View style={styles.optionGroup}>
                  {shopCart.allowPickup && (
                    <SoundTouchableOpacity
                      style={[
                        styles.shopOption,
                        { borderColor: colors.divider, backgroundColor: colors.inputBackground },
                        shopDeliveryOptions[shopCart.shopId] === 'pickup' && {
                          borderColor: colors.primary,
                          backgroundColor: colors.surface,
                        },
                      ]}
                      onPress={() => updateShopDeliveryOption(shopCart.shopId, 'pickup')}
                      soundType="tap"
                    >
                      <Ionicons
                        name="storefront"
                        size={20}
                        color={
                          shopDeliveryOptions[shopCart.shopId] === 'pickup'
                            ? colors.primary
                            : colors.textMuted
                        }
                      />
                      <Text
                        style={[
                          styles.shopOptionText,
                          { color: colors.text },
                          shopDeliveryOptions[shopCart.shopId] === 'pickup' && {
                            color: colors.primary,
                          },
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
                        { borderColor: colors.divider, backgroundColor: colors.inputBackground },
                        shopDeliveryOptions[shopCart.shopId] === 'delivery' && {
                          borderColor: colors.primary,
                          backgroundColor: colors.surface,
                        },
                      ]}
                      onPress={() => updateShopDeliveryOption(shopCart.shopId, 'delivery')}
                      soundType="tap"
                    >
                      <Ionicons
                        name="bicycle"
                        size={20}
                        color={
                          shopDeliveryOptions[shopCart.shopId] === 'delivery'
                            ? colors.primary
                            : colors.textMuted
                        }
                      />
                      <Text
                        style={[
                          styles.shopOptionText,
                          { color: colors.text },
                          shopDeliveryOptions[shopCart.shopId] === 'delivery' && {
                            color: colors.primary,
                          },
                        ]}
                      >
                        Delivery (+$3.99)
                      </Text>
                    </SoundTouchableOpacity>
                  )}
                </View>
              </View>

              <View style={[styles.shopSubtotalRow, { borderTopColor: colors.divider }]}>
                <Text style={[styles.shopSubtotalLabel, { color: colors.text }]}>
                  Shop subtotal:
                </Text>
                <Text style={[styles.shopSubtotalAmount, { color: colors.primary }]}>
                  ${shopCart.subtotal.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Delivery Address - only show if any shop needs delivery */}
        {hasDeliveryOrders && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Delivery Address</Text>
            <TextInput
              style={[
                styles.textInput,
                { backgroundColor: colors.inputBackground, borderColor: colors.divider },
              ]}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              placeholder="Enter your delivery address"
              placeholderTextColor={colors.placeholder}
              multiline
            />
          </View>
        )}

        {/* Contact Information */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Phone</Text>
          <TextInput
            style={[
              styles.textInput,
              { backgroundColor: colors.inputBackground, borderColor: colors.divider },
            ]}
            value={contactPhone}
            onChangeText={setContactPhone}
            placeholder="Enter your phone number"
            placeholderTextColor={colors.placeholder}
            keyboardType="phone-pad"
          />
        </View>

        {/* Payment — handled by PaymentSheet */}
        {!IS_WEB && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment</Text>
            <View style={styles.paymentSheetInfo}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
              <Text style={[styles.paymentSheetText, { color: colors.textMuted }]}>
                Powered by Stripe — Card, Apple Pay, Google Pay, Cash App, PayPal, and more
              </Text>
            </View>
            {initializingSheet && (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
            )}
          </View>
        )}

        {/* Special Instructions */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Special Instructions</Text>
          <TextInput
            style={[
              styles.textInput,
              styles.instructionsInput,
              { backgroundColor: colors.inputBackground, borderColor: colors.divider },
            ]}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            placeholder="Any special requests or instructions..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Order Total */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Total</Text>
          <View style={styles.totalBreakdown}>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Subtotal:</Text>
              <Text style={[styles.totalValue, { color: colors.textMuted }]}>
                ${subtotal.toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Tax:</Text>
              <Text style={[styles.totalValue, { color: colors.textMuted }]}>
                ${tax.toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Delivery Fees:</Text>
              <Text style={[styles.totalValue, { color: colors.textMuted }]}>
                ${deliveryFee.toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Service Fee:</Text>
              <Text style={[styles.totalValue, { color: colors.textMuted }]}>
                ${platformFee.toFixed(2)}
              </Text>
            </View>
            <View
              style={[styles.totalRow, styles.finalTotalRow, { borderTopColor: colors.primary }]}
            >
              <Text style={[styles.finalTotalLabel, { color: colors.text }]}>Total:</Text>
              <Text style={[styles.finalTotalValue, { color: colors.primary }]}>
                ${total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      {/* Place Order Button */}
      <View style={styles.buttonContainer}>
        <SoundTouchableOpacity
          style={[
            styles.placeOrderButton,
            { backgroundColor: colors.buttonPrimary },
            (isPlacingOrder ||
              initializingSheet ||
              IS_WEB ||
              (shopCarts.length === 1 && !paymentSheetIsCurrent)) && {
              opacity: 0.7,
              backgroundColor: colors.buttonDisabled,
            },
          ]}
          onPress={handlePlaceOrder}
          disabled={
            isPlacingOrder ||
            initializingSheet ||
            IS_WEB ||
            (shopCarts.length === 1 && !paymentSheetIsCurrent)
          }
          soundType="click"
        >
          <Text style={[styles.placeOrderText, { color: colors.buttonText }]}>
            {isPlacingOrder
              ? 'Processing Payment...'
              : IS_WEB
                ? 'Mobile checkout required'
                : initializingSheet
                  ? 'Preparing Checkout...'
                  : `Pay $${total.toFixed(2)}`}
          </Text>
        </SoundTouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
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
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
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
  },
  shopOrderSummary: {
    marginBottom: 12,
  },
  shopName: {
    fontSize: 16,
    fontFamily: 'TextMeOne',
    fontWeight: 'bold',
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
  },
  orderItemPrice: {
    fontSize: 14,
    fontFamily: 'TextMeOne',
  },
  shopSubtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
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
  },
  optionGroup: {
    gap: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'TextMeOne',
  },
  instructionsInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  paymentSheetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  paymentSheetText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'TextMeOne',
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
  },
  totalLabel: {
    fontSize: 16,
    fontFamily: 'TextMeOne',
  },
  totalValue: {
    fontSize: 16,
    fontFamily: 'TextMeOne',
  },
  finalTotalLabel: {
    fontSize: 18,
    fontFamily: 'TextMeOne',
    fontWeight: 'bold',
  },
  finalTotalValue: {
    fontSize: 18,
    fontFamily: 'TextMeOne',
    fontWeight: 'bold',
  },
  buttonContainer: {
    bottom: 0,
    left: 0,
    right: 0,
  },
  placeOrderButton: {
    width: '100%',
    marginBottom: 0,
    padding: 10,
    paddingBottom: 33,
  },
  placeOrderText: {
    textAlign: 'center',
    fontSize: 30,
    fontFamily: 'TextMeOne',
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
    marginBottom: 24,
  },
  continueShoppingButton: {
    borderRadius: 30,
    padding: 16,
    alignItems: 'center',
    minWidth: 200,
  },
  continueShoppingText: {
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
    marginBottom: 8,
  },
  shopOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 4,
  },
  shopOptionText: {
    marginLeft: 6,
    fontSize: 12,
    fontFamily: 'TextMeOne',
  },
});

export default Checkout;

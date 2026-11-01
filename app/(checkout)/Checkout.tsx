import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStripe } from '@/components/StripeNative';
import { useCart, useUser, useOrder, useMessage } from '@/store/reduxHooks';
import firebaseService from '@/handlers/firebaseService';
import { SoundTouchableOpacity } from '@/components/SoundTouchableOpacity';
import { useAppColors } from '@/hooks/useAppColors';

type DeliveryOption = 'pickup' | 'delivery';

const Checkout = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ orderId?: string }>();
  const { shopCarts: cartShopCarts, clearCart, calculateTotalSubtotal } = useCart();
  const { userData } = useUser();
  const { refreshOrders, selectedOrder, placedOrders } = useOrder();
  const { createOrGetThread } = useMessage();
  const colors = useAppColors();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [shopDeliveryOptions, setShopDeliveryOptions] = useState<Record<string, DeliveryOption>>(
    {}
  );
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [paymentSheetReady, setPaymentSheetReady] = useState(false);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [hasPaymentIntent, setHasPaymentIntent] = useState(false);
  const [initializingSheet, setInitializingSheet] = useState(false);
  const checkoutIdRef = useRef<string | null>(null);
  checkoutIdRef.current = checkoutId;
  const tradeOrderId = typeof params.orderId === 'string' ? params.orderId : undefined;
  const existingTradeOrder = tradeOrderId
    ? [selectedOrder, ...placedOrders].find(
        (order) =>
          order?.id === tradeOrderId && order.status === 'trade' && order.userId === userData?.uid
      )
    : undefined;
  const shopCarts = useMemo(
    () =>
      tradeOrderId
        ? existingTradeOrder
          ? [
              {
                shopId: existingTradeOrder.shopId,
                shopName: existingTradeOrder.shopName,
                shopPhotoURL: existingTradeOrder.shopPhotoURL,
                allowPickup: true,
                localDelivery: false,
                items: existingTradeOrder.items,
                subtotal: existingTradeOrder.subtotal,
              },
            ]
          : []
        : cartShopCarts,
    [tradeOrderId, existingTradeOrder, cartShopCarts]
  );
  const checkoutSessionKey = useMemo(() => {
    if (!userData?.uid || tradeOrderId) return null;
    const basket = shopCarts
      .map((shopCart) => ({
        shopId: shopCart.shopId,
        items: [...shopCart.items]
          .map(({ itemId, quantity }) => ({ itemId, quantity }))
          .sort((a, b) => a.itemId.localeCompare(b.itemId)),
      }))
      .sort((a, b) => a.shopId.localeCompare(b.shopId));
    return `neighborfood:checkout:${userData.uid}:${JSON.stringify(basket)}`;
  }, [tradeOrderId, shopCarts, userData?.uid]);
  const subtotal = existingTradeOrder ? existingTradeOrder.subtotal : calculateTotalSubtotal();
  const deliveryFee =
    Object.values(shopDeliveryOptions).filter((option) => option === 'delivery').length * 3.99;
  const tax = subtotal * 0.08; // 8% tax
  const platformFee = Math.min(subtotal * 0.1, 1); // lesser of 10% or $1
  const total = subtotal + deliveryFee + tax + platformFee;

  useEffect(() => {
    let active = true;
    setPaymentSheetReady(false);
    setHasPaymentIntent(false);
    const loadCheckoutId = async () => {
      if (tradeOrderId) {
        setCheckoutId(tradeOrderId);
        return;
      }
      if (!checkoutSessionKey) {
        setCheckoutId(null);
        return;
      }
      const savedSession = await AsyncStorage.getItem(checkoutSessionKey);
      if (!active) return;
      let session:
        | {
            id?: string;
            deliveryOptions?: Record<string, DeliveryOption>;
            hasPaymentIntent?: boolean;
          }
        | undefined;
      if (savedSession) {
        try {
          const parsed = JSON.parse(savedSession);
          if (
            parsed &&
            typeof parsed === 'object' &&
            typeof parsed.id === 'string' &&
            /^[0-9a-f-]{36}$/i.test(parsed.id)
          ) {
            session = parsed;
          }
        } catch {
          if (/^[0-9a-f-]{36}$/i.test(savedSession)) session = { id: savedSession };
        }
      }
      const id = session?.id || uuidv4();
      if (session?.deliveryOptions) {
        setShopDeliveryOptions(
          Object.fromEntries(
            Object.entries(session.deliveryOptions).filter(
              ([, option]) => option === 'pickup' || option === 'delivery'
            )
          )
        );
      }
      setHasPaymentIntent(Boolean(session?.hasPaymentIntent));
      if (!session?.id) {
        await AsyncStorage.setItem(
          checkoutSessionKey,
          JSON.stringify({ id, deliveryOptions: {}, hasPaymentIntent: false })
        );
      }
      if (active) setCheckoutId(id);
    };
    loadCheckoutId().catch((error) => console.error('Error loading checkout ID:', error));
    return () => {
      active = false;
    };
  }, [checkoutSessionKey, tradeOrderId]);

  const persistCheckoutSession = useCallback(
    async (id: string, deliveryOptions: Record<string, DeliveryOption>, intentCreated: boolean) => {
      if (!checkoutSessionKey) return;
      await AsyncStorage.setItem(
        checkoutSessionKey,
        JSON.stringify({ id, deliveryOptions, hasPaymentIntent: intentCreated })
      );
    },
    [checkoutSessionKey]
  );

  // Initialize PaymentSheet for single-shop orders
  // Multi-shop orders initialize per-shop during handlePlaceOrder
  const initializePaymentSheet = useCallback(async (): Promise<{
    paymentIntentId: string;
    succeeded: boolean;
  } | null> => {
    if (
      !userData?.uid ||
      !checkoutId ||
      Platform.OS === 'web' ||
      total <= 0 ||
      shopCarts.some((shopCart) => !shopDeliveryOptions[shopCart.shopId])
    ) {
      return null;
    }

    if (shopCarts.length === 1) {
      try {
        setInitializingSheet(true);
        const shopCart = shopCarts[0];
        const deliveryOption = shopDeliveryOptions[shopCart.shopId];
        const {
          paymentIntent,
          paymentIntentId: intentId,
          ephemeralKey,
          customer,
          paymentIntentSucceeded: succeeded,
          testEnv,
        } = await firebaseService.createPaymentSheetParams({
          orderId: checkoutId,
          shopId: shopCart.shopId,
          items: shopCart.items.map(({ itemId, quantity }) => ({ itemId, quantity })),
          deliveryOption,
          deliveryAddress,
          contactPhone,
          specialInstructions,
        });
        if (checkoutIdRef.current !== checkoutId) return null;
        await persistCheckoutSession(checkoutId, shopDeliveryOptions, true);
        setHasPaymentIntent(true);

        if (!succeeded) {
          const { error } = await initPaymentSheet({
            merchantDisplayName: 'Neighborfood',
            customerId: customer,
            customerEphemeralKeySecret: ephemeralKey,
            paymentIntentClientSecret: paymentIntent,
            allowsDelayedPaymentMethods: false,
            returnURL: 'neighborfood://stripe-redirect',
            applePay: { merchantCountryCode: 'US' },
            googlePay: { merchantCountryCode: 'US', testEnv },
            defaultBillingDetails: {
              name:
                userData?.first && userData?.last
                  ? `${userData.first} ${userData.last}`
                  : undefined,
              email: userData?.email || undefined,
              phone: userData?.phone || undefined,
            },
          });

          if (error) {
            console.error('PaymentSheet init error:', error);
            return null;
          }
        }
        if (checkoutIdRef.current !== checkoutId) return null;

        return { paymentIntentId: intentId, succeeded };
      } catch (error) {
        console.error('Error initializing payment sheet:', error);
      } finally {
        setInitializingSheet(false);
      }
    } else {
      setPaymentSheetReady(true);
      return null;
    }
    return null;
  }, [
    userData,
    checkoutId,
    total,
    initPaymentSheet,
    shopCarts,
    shopDeliveryOptions,
    deliveryAddress,
    contactPhone,
    specialInstructions,
    persistCheckoutSession,
  ]);

  useEffect(() => {
    setPaymentSheetReady(
      Platform.OS !== 'web' &&
        Boolean(checkoutId) &&
        total > 0 &&
        shopCarts.length > 0 &&
        shopCarts.every((shopCart) => Boolean(shopDeliveryOptions[shopCart.shopId]))
    );
  }, [checkoutId, shopCarts, shopDeliveryOptions, total]);

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
    setShopDeliveryOptions((previous) => ({
      ...initialOptions,
      ...previous,
    }));

    // Initialize with user's saved address and phone
    if (userData?.location?.address) {
      setDeliveryAddress(userData.location.address);
    }
    if (userData?.phone) {
      setContactPhone(userData.phone);
    }
  }, [shopCarts, userData]);

  const updateShopDeliveryOption = (shopId: string, option: DeliveryOption) => {
    if (
      isPlacingOrder ||
      hasPaymentIntent ||
      tradeOrderId ||
      shopDeliveryOptions[shopId] === option
    ) {
      return;
    }
    const updatedOptions = { ...shopDeliveryOptions, [shopId]: option };
    setShopDeliveryOptions(updatedOptions);
    if (checkoutId) {
      persistCheckoutSession(checkoutId, updatedOptions, false).catch((error) =>
        console.error('Error saving delivery options:', error)
      );
    }
  };

  const hasDeliveryOrders = Object.values(shopDeliveryOptions).some(
    (option) => option === 'delivery'
  );

  const handlePlaceOrder = async () => {
    if (Platform.OS === 'web') {
      Toast.show({
        type: 'error',
        text1: 'Payment Unavailable',
        text2: 'Checkout is only available in the mobile app.',
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

    if (!checkoutId) {
      Toast.show({
        type: 'error',
        text1: 'Checkout Preparing',
        text2: 'Please wait while secure checkout is initialized.',
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
      const newOrderId = checkoutId;
      const paidPaymentIntentIds: Record<string, string> = {};
      if (shopCarts.length === 1) {
        const intent = await initializePaymentSheet();
        if (!intent) {
          throw new Error('Payment is not ready. Please try again.');
        }
        if (!intent.succeeded) {
          const { error } = await presentPaymentSheet();
          if (error) {
            if (error.code !== 'Canceled') {
              Toast.show({
                type: 'error',
                text1: 'Payment Failed',
                text2: error.message || 'Your payment could not be processed.',
                visibilityTime: 3000,
              });
            }
            setIsPlacingOrder(false);
            return;
          }
        }
        paidPaymentIntentIds[shopCarts[0].shopId] = intent.paymentIntentId;
      } else {
        for (const shopCart of shopCarts) {
          const {
            paymentIntent,
            paymentIntentId: intentId,
            ephemeralKey,
            customer,
            paymentIntentSucceeded: succeeded,
            testEnv,
          } = await firebaseService.createPaymentSheetParams({
            orderId: checkoutId,
            shopId: shopCart.shopId,
            items: shopCart.items.map(({ itemId, quantity }) => ({ itemId, quantity })),
            deliveryOption: shopDeliveryOptions[shopCart.shopId],
            deliveryAddress,
            contactPhone,
            specialInstructions,
          });
          await persistCheckoutSession(checkoutId, shopDeliveryOptions, true);
          setHasPaymentIntent(true);

          if (!succeeded) {
            const { error: initError } = await initPaymentSheet({
              merchantDisplayName: 'Neighborfood',
              customerId: customer,
              customerEphemeralKeySecret: ephemeralKey,
              paymentIntentClientSecret: paymentIntent,
              allowsDelayedPaymentMethods: false,
              returnURL: 'neighborfood://stripe-redirect',
              applePay: { merchantCountryCode: 'US' },
              googlePay: { merchantCountryCode: 'US', testEnv },
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
              Toast.show({
                type: 'error',
                text1: 'Payment Error',
                text2: `Failed to prepare payment for ${shopCart.shopName}.`,
                visibilityTime: 3000,
              });
              setIsPlacingOrder(false);
              return;
            }

            const { error } = await presentPaymentSheet();
            if (error) {
              if (error.code !== 'Canceled') {
                Toast.show({
                  type: 'error',
                  text1: 'Payment Failed',
                  text2: error.message || `Payment failed for ${shopCart.shopName}.`,
                  visibilityTime: 3000,
                });
              }
              setIsPlacingOrder(false);
              return;
            }
          }
          paidPaymentIntentIds[shopCart.shopId] = intentId;
        }
      }

      if (existingTradeOrder) {
        const paidPaymentIntentId = paidPaymentIntentIds[existingTradeOrder.shopId];
        if (!paidPaymentIntentId || !tradeOrderId) {
          throw new Error('Payment confirmation is missing. Please try again.');
        }
        await firebaseService.completeTradePurchase(
          existingTradeOrder.id,
          existingTradeOrder.shopId,
          paidPaymentIntentId,
          contactPhone,
          specialInstructions
        );
        if (userData.uid) {
          await refreshOrders(userData.uid);
        }
        Toast.show({
          type: 'success',
          text1: 'Order Placed!',
          text2: 'Your trade offer was converted to a paid order.',
          visibilityTime: 3000,
        });
        router.navigate('/success');
        setTimeout(() => {
          router.navigate('/(home)/Menu');
          setTimeout(() => {
            router.navigate('/(home)/(orders)');
          }, 100);
        }, 2000);
        return;
      }

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
        const shopPlatformFee = Math.min(shopCart.subtotal * 0.1, 1);
        const orderData = {
          id: newOrderId,
          userId: userData.uid,
          shopId: shopCart.shopId,
          paymentIntentId: paidPaymentIntentIds[shopCart.shopId],
          shopName: shopCart.shopName,
          shopPhotoURL: shopCart.shopPhotoURL || '',
          items: shopCart.items.map((item) => ({
            ...item,
          })),
          subtotal: shopCart.subtotal,
          tax: shopCart.subtotal * 0.08,
          deliveryFee: deliveryOption === 'delivery' ? 3.99 : 0,
          platformFee: shopPlatformFee,
          tip: 0, // TODO: implement later
          total:
            shopCart.subtotal +
            shopCart.subtotal * 0.08 +
            (deliveryOption === 'delivery' ? 3.99 : 0) +
            shopPlatformFee,
          status: 'pending' as const,
          estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
          paymentMethod: 'card',
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

      if (checkoutSessionKey) {
        try {
          await persistCheckoutSession(uuidv4(), {}, false);
        } catch (error) {
          console.error('Error clearing checkout ID:', error);
        }
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
      setTimeout(() => {
        router.navigate('/(home)/Menu');
        setTimeout(() => {
          router.navigate('/(home)/(orders)');
        }, 100);
      }, 2000);
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
          <Text style={[styles.headerTitle, { color: colors.textOnPrimary }]}>
            {tradeOrderId && !existingTradeOrder ? 'trade unavailable' : 'checkout'}
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {tradeOrderId && !existingTradeOrder
              ? 'This trade order is no longer available.'
              : 'Your cart is empty'}
          </Text>
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
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment</Text>
          <View style={styles.paymentSheetInfo}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            <Text style={[styles.paymentSheetText, { color: colors.textMuted }]}>
              {Platform.OS === 'web'
                ? 'Secure checkout is currently available in the mobile app only.'
                : 'Secure payment powered by Stripe with cards and supported wallets.'}
            </Text>
          </View>
          {initializingSheet && Platform.OS !== 'web' && (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 8 }} />
          )}
        </View>

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
            (isPlacingOrder || (Platform.OS !== 'web' && !paymentSheetReady) || !checkoutId) && {
              opacity: 0.7,
              backgroundColor: colors.buttonDisabled,
            },
            Platform.OS === 'web' && {
              opacity: 0.7,
              backgroundColor: colors.buttonDisabled,
            },
          ]}
          onPress={handlePlaceOrder}
          disabled={isPlacingOrder || Platform.OS === 'web' || !checkoutId || !paymentSheetReady}
          soundType="click"
        >
          <Text style={[styles.placeOrderText, { color: colors.buttonText }]}>
            {Platform.OS === 'web'
              ? 'Checkout Unavailable'
              : isPlacingOrder
                ? 'Processing Payment...'
                : initializingSheet || !checkoutId
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

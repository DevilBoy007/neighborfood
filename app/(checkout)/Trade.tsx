import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import { v4 as uuidv4 } from 'uuid';
import { useCart, useUser, useOrder, useMessage } from '@/store/reduxHooks';
import firebaseService from '@/handlers/firebaseService';
import { SoundTouchableOpacity } from '@/components/SoundTouchableOpacity';
import { useAppColors } from '@/hooks/useAppColors';
import { ItemData } from '@/store/slices/itemSlice';

type TradeItem = {
  itemId: string;
  name: string;
  imageUrl?: string;
};

const Trade = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    shopId: string;
    orderId?: string;
    preselectedItems?: string;
  }>();
  const { shopCarts, clearShopCart } = useCart();
  const { userData } = useUser();
  const { refreshOrders, selectedOrder, updateOrderStatus } = useOrder();
  const { createOrGetThread } = useMessage();
  const colors = useAppColors();

  const [userItems, setUserItems] = useState<ItemData[]>([]);
  const [selectedUserItems, setSelectedUserItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shopId = params.shopId;
  const orderId = params.orderId;
  const isUpdate = !!orderId;
  const shopCart = shopCarts.find((sc) => sc.shopId === shopId);

  // For updates/counteroffers, use the existing order items
  const cartItems = isUpdate ? (selectedOrder?.items ?? []) : (shopCart?.items ?? []);

  useEffect(() => {
    const loadUserItems = async () => {
      if (!userData?.uid) return;
      try {
        const items = await firebaseService.getAllItemsForUser(userData.uid);
        // Filter out items from the same shop being traded with
        setUserItems(items.filter((item: ItemData) => item.shopId !== shopId));
      } catch (error) {
        console.error('Error loading user items:', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load your items',
          visibilityTime: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserItems();
  }, [userData?.uid, shopId]);

  // Pre-select items if provided (for update/counteroffer)
  useEffect(() => {
    if (params.preselectedItems) {
      try {
        const preselected = JSON.parse(params.preselectedItems) as string[];
        setSelectedUserItems(new Set(preselected));
      } catch {
        // Ignore parse errors
      }
    }
  }, [params.preselectedItems]);

  const toggleItemSelection = useCallback((itemId: string) => {
    setSelectedUserItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const handleSubmitTrade = async () => {
    if (!userData) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please log in to submit a trade',
        visibilityTime: 3000,
      });
      return;
    }

    if (selectedUserItems.size === 0) {
      Toast.show({
        type: 'error',
        text1: 'No Items Selected',
        text2: 'Please select at least one item to offer in trade',
        visibilityTime: 3000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const tradeItemsArray: TradeItem[] = Array.from(selectedUserItems).map((itemId) => {
        const item = userItems.find((i) => i.id === itemId);
        return {
          itemId,
          name: item?.name ?? 'Unknown',
          imageUrl: item?.imageUrl,
        };
      });

      if (isUpdate && orderId && selectedOrder) {
        // Update existing trade order with new trade items
        await firebaseService.updateOrderTradeItems(orderId, selectedOrder.shopId, tradeItemsArray);

        if (userData?.uid) {
          await refreshOrders(userData.uid);
        }

        Toast.show({
          type: 'success',
          text1: 'Trade Updated!',
          text2: 'Your trade offer has been updated.',
          visibilityTime: 3000,
        });
      } else if (shopCart) {
        // Create new trade order
        const newOrderId = uuidv4();

        // Get shop owner for messaging
        const shop = await firebaseService.getDocument('shops', shopId);
        const shopOwnerId = shop?.userId as string | undefined;

        const orderData = {
          id: newOrderId,
          userId: userData.uid,
          shopId: shopCart.shopId,
          shopName: shopCart.shopName,
          shopPhotoURL: shopCart.shopPhotoURL || '',
          items: shopCart.items.map((item) => ({ ...item })),
          subtotal: shopCart.subtotal,
          tax: 0,
          deliveryFee: 0,
          platformFee: 0,
          tip: 0,
          total: 0,
          status: 'trade' as const,
          estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000),
          paymentMethod: 'trade',
          deliveryAddress: userData?.location?.address || 'Pickup',
          contactPhone: userData?.phone || '',
          deliveryOption: 'pickup' as const,
          specialInstructions: '',
          tradeItems: tradeItemsArray,
        };

        await firebaseService.createOrder(orderData);

        // Create message thread with shop owner
        if (shopOwnerId && shopOwnerId !== userData.uid) {
          try {
            await createOrGetThread([userData.uid, shopOwnerId], {
              type: 'order',
              orderId: newOrderId,
              orderData: {
                id: newOrderId,
                shopName: shopCart.shopName,
                shopPhotoURL: shopCart.shopPhotoURL,
                items: shopCart.items.map((item) => ({
                  name: item.name,
                  quantity: item.quantity,
                  price: item.price,
                })),
                total: 0,
                status: 'trade',
                deliveryOption: 'pickup',
                deliveryAddress: userData?.location?.address || 'Pickup',
              },
            });
          } catch (threadError) {
            console.error('Error creating message thread:', threadError);
          }
        }

        if (userData?.uid) {
          await refreshOrders(userData.uid);
        }

        clearShopCart(shopId);

        Toast.show({
          type: 'success',
          text1: 'Trade Submitted! ✨',
          text2: 'Your trade offer has been sent to the shop owner.',
          visibilityTime: 3000,
        });
      }

      // Navigate to success page, then to orders
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
      console.error('Error submitting trade:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to submit trade. Please try again.',
        visibilityTime: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
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
          <Text style={[styles.headerTitle, { color: colors.buttonText }]}>trade ✨</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
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
        <Text style={[styles.headerTitle, { color: colors.buttonText }]}>trade ✨</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Shop Cart Items - What you're getting */}
        <View style={[styles.tradePane, { backgroundColor: colors.surface }]}>
          <View style={styles.paneTitleRow}>
            <Ionicons name="cart" size={22} color={colors.primary} />
            <Text style={[styles.paneTitle, { color: colors.text }]}>
              {isUpdate ? 'Order Items' : 'Items You Want'}
            </Text>
          </View>
          <View style={styles.itemGrid}>
            {cartItems.map((item) => (
              <View key={item.itemId} style={[styles.tradeCard, { borderColor: colors.primary }]}>
                {item.photoURL ? (
                  <Image source={{ uri: item.photoURL }} style={styles.itemImage} />
                ) : (
                  <View style={[styles.itemImagePlaceholder, { backgroundColor: colors.primary }]}>
                    <Ionicons name="leaf" size={28} color={colors.buttonText} />
                  </View>
                )}
                <Text style={[styles.tradeItemName, { color: colors.text }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={[styles.tradeItemQty, { color: colors.textMuted }]}>
                  x{item.quantity}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Trade Arrow Divider */}
        <View style={styles.tradeDivider}>
          <View style={[styles.tradeDividerLine, { backgroundColor: colors.divider }]} />
          <View style={[styles.tradeArrowCircle, { backgroundColor: '#E040FB' }]}>
            <Ionicons name="swap-vertical" size={28} color="#fff" />
          </View>
          <View style={[styles.tradeDividerLine, { backgroundColor: colors.divider }]} />
        </View>

        {/* User's Items - What you're offering */}
        <View style={[styles.tradePane, { backgroundColor: colors.surface }]}>
          <View style={styles.paneTitleRow}>
            <Ionicons name="cube" size={22} color="#E040FB" />
            <Text style={[styles.paneTitle, { color: colors.text }]}>Your Items to Offer</Text>
          </View>
          {userItems.length === 0 ? (
            <View style={styles.emptyItems}>
              <Ionicons name="alert-circle-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyItemsText, { color: colors.textMuted }]}>
                You don&apos;t have any items to trade
              </Text>
            </View>
          ) : (
            <View style={styles.itemGrid}>
              {userItems.map((item) => {
                const isSelected = selectedUserItems.has(item.id);
                return (
                  <SoundTouchableOpacity
                    key={item.id}
                    style={[
                      styles.tradeCard,
                      styles.selectableCard,
                      { borderColor: isSelected ? '#E040FB' : colors.divider },
                      isSelected && styles.selectedCard,
                    ]}
                    onPress={() => toggleItemSelection(item.id)}
                    soundType="tap"
                  >
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark-circle" size={22} color="#E040FB" />
                      </View>
                    )}
                    {item.imageUrl ? (
                      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                    ) : (
                      <View
                        style={[
                          styles.itemImagePlaceholder,
                          { backgroundColor: isSelected ? '#E040FB' : colors.textMuted },
                        ]}
                      >
                        <Ionicons name="leaf" size={28} color="#fff" />
                      </View>
                    )}
                    <Text style={[styles.tradeItemName, { color: colors.text }]} numberOfLines={2}>
                      {item.name}
                    </Text>
                  </SoundTouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Submit Button */}
      <View style={styles.buttonContainer}>
        <SoundTouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: '#E040FB' },
            (isSubmitting || selectedUserItems.size === 0) && {
              opacity: 0.7,
              backgroundColor: colors.buttonDisabled,
            },
          ]}
          onPress={handleSubmitTrade}
          disabled={isSubmitting || selectedUserItems.size === 0}
          soundType="click"
        >
          <Text style={[styles.submitButtonText, { color: '#fff' }]}>
            {isSubmitting
              ? 'Submitting...'
              : isUpdate
                ? `Update Offer (${selectedUserItems.size} item${selectedUserItems.size !== 1 ? 's' : ''})`
                : `Offer Trade (${selectedUserItems.size} item${selectedUserItems.size !== 1 ? 's' : ''})`}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  tradePane: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paneTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  paneTitle: {
    fontSize: 18,
    fontFamily: 'TextMeOne',
    fontWeight: 'bold',
  },
  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tradeCard: {
    width: Platform.OS === 'web' ? 120 : 100,
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
  },
  selectableCard: {
    position: 'relative',
  },
  selectedCard: {
    backgroundColor: 'rgba(224, 64, 251, 0.08)',
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 1,
  },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginBottom: 6,
  },
  itemImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tradeItemName: {
    fontSize: 12,
    fontFamily: 'TextMeOne',
    textAlign: 'center',
  },
  tradeItemQty: {
    fontSize: 11,
    fontFamily: 'TextMeOne',
    marginTop: 2,
  },
  tradeDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  tradeDividerLine: {
    flex: 1,
    height: 2,
  },
  tradeArrowCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  emptyItems: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  emptyItemsText: {
    fontSize: 14,
    fontFamily: 'TextMeOne',
    textAlign: 'center',
  },
  buttonContainer: {
    bottom: 0,
    left: 0,
    right: 0,
  },
  submitButton: {
    width: '100%',
    marginBottom: 0,
    padding: 10,
    paddingBottom: 33,
  },
  submitButtonText: {
    textAlign: 'center',
    fontSize: 30,
    fontFamily: 'TextMeOne',
  },
});

export default Trade;

// OrderDetailScreen.js
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useOrder, useUser } from '@/store/reduxHooks';
import { useOrderStatus } from '@/hooks/useOrderStatus';
import { useAppColors } from '@/hooks/useAppColors';
import firebaseService from '@/handlers/firebaseService';

const { height } = Dimensions.get('window');

const ShopSection = ({ shop, items, colors }: { shop: string; items: any[]; colors: any }) => (
  <View style={styles.shopSection}>
    <Text style={[styles.shopName, { color: colors.text }]}>{shop}</Text>
    {items.map((item, index) => (
      <View key={index} style={styles.itemRow}>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemText, { color: colors.text }]}>
            {item.name} x {item.quantity}
          </Text>
          <Text style={[styles.itemPrice, { color: colors.textMuted }]}>
            @ ${item.price.toFixed(2)}
          </Text>
        </View>
        <Text style={[styles.itemTotal, { color: colors.accent }]}>
          ${(item.price * item.quantity).toFixed(2)}
        </Text>
      </View>
    ))}
  </View>
);

const OrderDetailScreen = () => {
  const router = useRouter();
  const { selectedOrder, setSelectedOrder, refreshOrders } = useOrder();
  const { userData } = useUser();
  const { getStatusColor, getStatusText } = useOrderStatus();
  const colors = useAppColors();
  const slideAnim = useRef(new Animated.Value(height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isReleasingEscrow, setIsReleasingEscrow] = useState(false);

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
      }),
    ]).start();

    // Clear selected order when component unmounts
    return () => {
      setSelectedOrder(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrder]);

  const formatOrderData = (order: any) => {
    if (!order) return null;

    const date = new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    return {
      date,
      shopName: order.shopName,
      items: order.items,
      total: order.total,
      status: order.status,
      deliveryOption: order.deliveryOption,
      deliveryAddress: order.deliveryAddress,
    };
  };

  const formattedOrder = formatOrderData(selectedOrder);

  // Buyer can confirm receipt when order is ready, in-delivery, or completed
  // and escrow has not yet been released
  const canConfirmReceipt =
    selectedOrder &&
    userData?.uid === selectedOrder.userId &&
    ['ready', 'in-delivery', 'completed'].includes(selectedOrder.status) &&
    selectedOrder.escrowStatus === 'held';

  const handleConfirmReceipt = async () => {
    if (!selectedOrder?.id || !selectedOrder?.shopId) return;
    setIsReleasingEscrow(true);
    try {
      await firebaseService.releaseEscrow(selectedOrder.id, selectedOrder.shopId);
      if (userData?.uid) {
        await refreshOrders(userData.uid);
      }
      Toast.show({
        type: 'success',
        text1: 'Receipt Confirmed',
        text2: 'Payment has been released to the seller.',
        visibilityTime: 3000,
      });
    } catch (error) {
      console.error('Error confirming receipt:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not confirm receipt. Please try again.',
        visibilityTime: 3000,
      });
    } finally {
      setIsReleasingEscrow(false);
    }
  };

  if (!formattedOrder) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.icon} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.navText }]}>order details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            {selectedOrder ? 'Loading order details...' : 'No order selected'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
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
              }),
            ]).start(() => router.back());
          }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.icon} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.navText }]}>order details</Text>
      </View>

      <Animated.ScrollView
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={[styles.dateText, { color: colors.text }]}>{formattedOrder.date}</Text>

        <View style={[styles.orderContent, { backgroundColor: colors.card }]}>
          <ShopSection
            shop={formattedOrder.shopName}
            items={formattedOrder.items}
            colors={colors}
          />

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.totalSection}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>total:</Text>
            <Text style={[styles.totalAmount, { color: colors.text }]}>
              ${formattedOrder.total.toFixed(2)}
            </Text>
          </View>

          <Text style={[styles.itemCount, { color: colors.textMuted }]}>
            items: {formattedOrder.items.length}
          </Text>

          <View style={[styles.statusSection, { borderTopColor: colors.divider }]}>
            <View
              style={[
                styles.deliveryOption,
                { borderColor: colors.border, backgroundColor: colors.secondary },
              ]}
            >
              <Text style={{ color: colors.textSecondary }}>{formattedOrder.deliveryOption}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(formattedOrder.status) },
              ]}
            >
              <Text style={styles.statusText}>{getStatusText(formattedOrder.status)}</Text>
            </View>
          </View>

          {/* Confirm Receipt — releases escrow funds to seller */}
          {canConfirmReceipt && (
            <TouchableOpacity
              style={[
                styles.confirmReceiptButton,
                { backgroundColor: colors.buttonPrimary },
                isReleasingEscrow && { opacity: 0.7 },
              ]}
              onPress={handleConfirmReceipt}
              disabled={isReleasingEscrow}
            >
              {isReleasingEscrow ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#fff"
                    style={styles.confirmIcon}
                  />
                  <Text style={styles.confirmReceiptText}>Confirm Receipt</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    fontFamily: 'TextMeOne',
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
    ...Platform.select({
      web: {
        fontSize: 40,
      },
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
    fontFamily: 'TextMeOne',
  },
  itemTotal: {
    fontSize: 16,
    fontFamily: 'TextMeOne',
  },
  divider: {
    height: 1,
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
    textAlign: 'center',
  },
  deliveryOption: {
    marginBottom: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusSection: {
    alignItems: 'flex-end',
    marginTop: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  statusBadge: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statusLabel: {
    fontSize: 16,
    fontFamily: 'TextMeOne',
  },
  statusValue: {
    fontSize: 16,
    fontFamily: 'TextMeOne',
    fontWeight: '600',
  },
  confirmReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 8,
  },
  confirmIcon: {
    marginRight: 4,
  },
  confirmReceiptText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'TextMeOne',
    fontWeight: '600',
  },
});

export default OrderDetailScreen;

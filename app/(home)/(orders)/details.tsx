// OrderDetailScreen.js
import React, { useEffect, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOrder } from '@/store/reduxHooks';
import { useOrderStatus } from '@/hooks/useOrderStatus';
import { useAppColors } from '@/hooks/useAppColors';

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
  const { selectedOrder, setSelectedOrder } = useOrder();
  const { getStatusColor, getStatusText } = useOrderStatus();
  const colors = useAppColors();
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
                styles.statusBadge,
                { backgroundColor: getStatusColor(formattedOrder.status) },
              ]}
            >
              <Text style={styles.statusText}>{getStatusText(formattedOrder.status)}</Text>
            </View>
          </View>
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
        fontSize: 32,
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
});

export default OrderDetailScreen;

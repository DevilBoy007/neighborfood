import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import OrderCard from '@/components/OrderCard';
import { useUser, useOrder } from '@/store/reduxHooks';
import { useAppColors } from '@/hooks/useAppColors';

const OrdersScreen = () => {
  const router = useRouter();
  const { filter } = useLocalSearchParams<{ filter: 'placed' | 'received' | 'history' }>();
  const { userData } = useUser();
  const colors = useAppColors();
  const {
    placedOrders,
    receivedOrders,
    orderHistory,
    setSelectedOrder,
    isLoadingOrders,
    isInitialized,
    initializeOrders,
    refreshOrders,
  } = useOrder();
  const [orders, setOrders] = useState<any[]>([]);

  const orderFilter = filter || 'placed';

  useEffect(() => {
    const loadOrders = async () => {
      if (!userData?.uid) return;

      if (!isInitialized) {
        await initializeOrders(userData.uid);
      }
      if (orderFilter === 'placed') {
        // Show only placed orders (orders the user has made as a customer)
        const currentPlacedOrders = placedOrders.filter(
          (order) => order.status !== 'completed' && order.status !== 'cancelled'
        );
        setOrders(currentPlacedOrders);
      } else if (orderFilter === 'received') {
        // Show only received orders (orders for user's shops)
        const currentReceivedOrders = receivedOrders.filter(
          (order) => order.status !== 'completed' && order.status !== 'cancelled'
        );
        setOrders(currentReceivedOrders);
      } else {
        setOrders(orderHistory);
      }
    };

    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.uid, orderFilter, isInitialized, placedOrders, receivedOrders, orderHistory]);

  const handleRefresh = async () => {
    if (userData?.uid) {
      await refreshOrders(userData.uid);
    }
  };

  const formatOrderForCard = (order: any) => {
    const date = new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const isReceivedOrder = order.shopOwnerView || false;

    return {
      id: order.id,
      date,
      total: order.total.toFixed(2),
      shops: [order.shopName],
      items: order.items.length,
      status: order.status,
      originalOrder: order,
      shopOwnerView: isReceivedOrder,
      orderType: isReceivedOrder ? 'received' : 'placed',
      customerId: isReceivedOrder ? order.userId : userData.uid,
    };
  };

  const handleOrderPress = (orderCardData: any) => {
    setSelectedOrder(orderCardData.originalOrder);
    router.push('./details');
  };

  const config = {
    placed: {
      title: 'orders placed',
      loadingText: 'Loading orders you placed...',
      emptyIcon: 'bag-outline' as const,
      emptyText: 'No orders placed',
      emptySubtext: 'Orders you place as a customer will appear here',
    },
    received: {
      title: 'orders received',
      loadingText: 'Loading orders received...',
      emptyIcon: 'storefront-outline' as const,
      emptyText: 'No orders received',
      emptySubtext: 'Orders for your shops will appear here',
    },
    history: {
      title: 'order history',
      loadingText: 'Loading order history...',
      emptyIcon: 'receipt-outline' as const,
      emptyText: 'No order history',
      emptySubtext: 'Your completed orders will appear here',
    },
  };

  const currentConfig = config[orderFilter];

  if (isLoadingOrders) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <View>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color={colors.icon} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.headerTitle, { color: colors.navText }]}>{currentConfig.title}</Text>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            {currentConfig.loadingText}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.navText }]}>{currentConfig.title}</Text>
        <View>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingOrders}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            title="Pull to refresh orders"
            titleColor={colors.primary}
          />
        }
      >
        {orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name={currentConfig.emptyIcon} size={64} color={colors.iconMuted} />
            <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
              {currentConfig.emptyText}
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.textMuted }]}>
              {currentConfig.emptySubtext}
            </Text>
          </View>
        ) : (
          orders.map((order, index) => {
            const formattedOrder = formatOrderForCard(order);
            return orderFilter === 'history' ? (
              <OrderCard
                key={order.docId || index}
                order={formattedOrder}
                onPress={() => handleOrderPress(formattedOrder)}
              />
            ) : (
              <View key={order.docId || index} style={styles.orderContainer}>
                <OrderCard
                  order={formattedOrder}
                  onPress={() => handleOrderPress(formattedOrder)}
                />
                <View style={styles.statusContainer}></View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    padding: 16,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        justifyContent: 'flex-end',
      },
    }),
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '400',
    fontFamily: 'TitanOne',
    ...Platform.select({
      web: {
        fontSize: 40,
      },
    }),
  },
  backButton: {
    padding: 2,
  },
  scrollView: {
    flex: 1,
    padding: 16,
    marginBottom: 64,
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  orderContainer: {
    marginBottom: 16,
  },
  statusContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
});

export default OrdersScreen;

import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppColors } from '@/hooks/useAppColors';

const OrdersScreen = () => {
  const router = useRouter();
  const colors = useAppColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.navText }]}>orders</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.icon} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, { backgroundColor: colors.card }]}
            onPress={() => router.push('./orders?filter=placed')}
          >
            <View style={styles.tabIcon}>
              <Ionicons name="bag-outline" size={32} color={colors.info} />
            </View>
            <Text style={[styles.tabButtonText, { color: colors.text }]}>Orders Placed</Text>
            <Text style={[styles.tabButtonSubtext, { color: colors.textMuted }]}>
              Active orders you&apos;ve placed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, { backgroundColor: colors.card }]}
            onPress={() => router.push('./orders?filter=received')}
          >
            <View style={styles.tabIcon}>
              <Ionicons name="storefront-outline" size={32} color={colors.success} />
            </View>
            <Text style={[styles.tabButtonText, { color: colors.text }]}>Orders Received</Text>
            <Text style={[styles.tabButtonSubtext, { color: colors.textMuted }]}>
              Orders for your shops
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, { backgroundColor: colors.card }]}
            onPress={() => router.push('./orders?filter=history')}
          >
            <View style={styles.tabIcon}>
              <Ionicons name="receipt-outline" size={32} color={colors.warning} />
            </View>
            <Text style={[styles.tabButtonText, { color: colors.text }]}>Order History</Text>
            <Text style={[styles.tabButtonSubtext, { color: colors.textMuted }]}>
              View completed orders
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
    padding: 16,
    ...Platform.select({
      ios: {
        justifyContent: 'flex-end',
      },
    }),
  },
  backButton: {
    padding: 2,
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
    padding: 20,
  },
  tabContainer: {
    gap: 20,
  },
  tabButton: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  tabIcon: {
    marginBottom: 12,
  },
  tabButtonText: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'TextMeOne',
  },
  tabButtonSubtext: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'TextMeOne',
  },
});

export default OrdersScreen;

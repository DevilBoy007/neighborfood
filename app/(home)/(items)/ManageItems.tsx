'use client';

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import firebaseService from '@/handlers/firebaseService';
import { useUser, useItem, useShop, ItemData } from '@/store/reduxHooks';
import { useAppColors } from '@/hooks/useAppColors';
import Toast from 'react-native-toast-message';
import ItemCard from '@/components/ItemCard';

export default function ManageItems() {
  const { userData } = useUser();
  const { setSelectedItem } = useItem();
  const { shops, setShops } = useShop();
  const colors = useAppColors();
  const [items, setItems] = useState<ItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Create a map of shop IDs to shop names for display
  const shopIdToNameMap = {};
  shops.forEach((shop) => {
    shopIdToNameMap[shop.id] = shop.name;
  });

  const fetchUserItems = async () => {
    if (!userData?.uid) {
      setLoading(false);
      console.log('No user data found');
      return;
    }
    try {
      setLoading(true);

      if (shops.length === 0) {
        const userShops = await firebaseService.getShopsForUser(userData.uid);
        setShops(userShops);
        userShops.forEach((shop) => {
          shopIdToNameMap[shop.id] = shop.name;
        });
      }

      const userItems = await firebaseService.getAllItemsForUser(userData.uid);
      setItems(userItems);
      console.log('User items:', userItems.length);
    } catch (err: unknown) {
      console.error('Error fetching items:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Memoize the fetch function to prevent unnecessary rerenders
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedFetchUserItems = React.useCallback(fetchUserItems, [userData, shops.length]);

  // Initial data fetch
  useEffect(() => {
    memoizedFetchUserItems();
  }, [memoizedFetchUserItems]);

  // Refresh data when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('ManageItems screen in focus, refreshing data');
      memoizedFetchUserItems();
      return () => {
        // Optional cleanup if needed
      };
    }, [memoizedFetchUserItems])
  );

  const handleEditItem = (item) => {
    setSelectedItem(item);
    router.push({
      pathname: '/(home)/(items)/AddItem',
      params: { itemId: item.id },
    });
  };

  const deleteItem = async (item) => {
    try {
      setLoading(true);
      // Use dedicated deleteItem function instead of generic deleteDocument
      await firebaseService.deleteItem(item.id);

      // Update the local state to remove the deleted item
      setItems((prevItems) => prevItems.filter((i) => i.id !== item.id));

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Item deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete item',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.icon} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.navText }]}>menu</Text>
      </View>
      <View>
        <Text style={[styles.title, { color: colors.navText }]}>Manage Items</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={memoizedFetchUserItems}
            tintColor={colors.primary}
            title="Fetching items..."
            titleColor={colors.primary}
            colors={[colors.primary, colors.text]}
          />
        }
      >
        {!loading && error ? (
          <Text style={[styles.errorText, { color: colors.error }]}>Error: {error}</Text>
        ) : !loading && items.length === 0 ? (
          <Text style={[styles.noItemsText, { color: colors.textMuted }]}>No items available</Text>
        ) : (
          !loading &&
          items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              shopName={shopIdToNameMap[item.shopId]}
              isShopOwner={true}
              onEditItem={handleEditItem}
              onDeleteItem={deleteItem}
              showCartControls={false}
            />
          ))
        )}
        <TouchableOpacity
          style={[styles.addItemButton, { backgroundColor: colors.buttonPrimary }]}
          onPress={() => router.push('/(home)/(items)/AddItem')}
        >
          <Ionicons
            name="add-circle-outline"
            size={24}
            color={colors.textOnPrimary}
            style={styles.buttonIcon}
          />
          <Text style={[styles.addItemButtonText, { color: colors.textOnPrimary }]}>Add Item</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    ...Platform.select({
      ios: {
        justifyContent: 'flex-end',
      },
    }),
  },
  title: {
    fontSize: 24,
    alignSelf: 'center',
    fontWeight: '400',
    fontFamily: 'TitanOne',
    ...Platform.select({
      web: {
        fontSize: 32,
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  addItemButton: {
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 128,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  addItemButtonText: {
    fontSize: 24,
    fontFamily: 'TextMeOne',
  },
  buttonIcon: {
    marginRight: 8,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  noItemsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
});

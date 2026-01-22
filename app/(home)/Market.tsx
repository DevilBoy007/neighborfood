import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ShopCard from '@/components/ShopCard';
import { useUser, useLocation, ShopData } from '@/store/reduxHooks';
import firebaseService from '@/handlers/firebaseService';

/* eslint-disable @typescript-eslint/no-require-imports */
const MapScreen =
  Platform.OS === 'web'
    ? require('@/components/WebMapScreen').default
    : require('@/components/MapScreen').default;
/* eslint-enable @typescript-eslint/no-require-imports */

// Extended type for shops with items attached
type ShopWithItems = ShopData & { items?: unknown[] };

const MarketScreen = () => {
  const [isMapView, setIsMapView] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  // TODO: Implement sort options feature
  const [,/* setShowSortOptions */] = useState(false);
  const [shops, setShops] = useState<ShopWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Use both user context and location context
  const { userData } = useUser();
  const { locationData } = useLocation();

  // Track last fetched parameters to avoid redundant calls
  const lastFetchRef = useRef<{ zipPrefix: string | null; userId: string | null }>({
    zipPrefix: null,
    userId: null,
  });

  // Fetch shops based on current location or fallback to user's stored location
  const fetchShopsAndItems = useCallback(
    async (forceRefresh = false) => {
      // Try to use current location's ZIP code first
      let zipToUse = locationData.zipCode;

      // Fall back to user's stored ZIP if current location isn't available
      if (!zipToUse && userData?.location?.zip) {
        zipToUse = userData.location.zip;
      }

      const zipPrefix = zipToUse?.substring(0, 2) || null;
      const userId = userData?.uid || null;

      // Skip if we already fetched with these parameters (unless force refresh)
      if (
        !forceRefresh &&
        lastFetchRef.current.zipPrefix === zipPrefix &&
        lastFetchRef.current.userId === userId &&
        shops.length > 0
      ) {
        return;
      }

      try {
        setLoading(true);

        if (zipPrefix && userId) {
          // Update tracking ref
          lastFetchRef.current = { zipPrefix, userId };

          // Use new batch function that fetches shops with items in a single call
          const shopsWithItems = await firebaseService.getShopsWithItems(zipPrefix, userId);

          setShops((shopsWithItems || []) as ShopWithItems[]);
        } else {
          // If no ZIP code available, set empty shops array
          setShops([]);
        }
      } catch (error) {
        if (error instanceof TypeError && error.message.includes('undefined')) {
          setShops([]);
        } else {
          console.error('Error fetching shops:', error);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [locationData.zipCode, userData?.location?.zip, userData?.uid, shops.length]
  );

  // Only re-fetch when the actual zip code or user ID changes
  useEffect(() => {
    fetchShopsAndItems();
  }, [fetchShopsAndItems]);

  const toggleView = () => setIsMapView(!isMapView);

  const onRefresh = () => {
    setRefreshing(true);
    fetchShopsAndItems(true); // Force refresh
  };

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color="#333" />
          <Text style={styles.messageText}>Fetching shops...</Text>
        </View>
      );
    }

    if (isMapView) {
      return <MapScreen shops={shops} />;
    }

    if (shops.length === 0) {
      return (
        <View style={styles.centeredContainer}>
          <Text style={styles.messageText}>No shops found in your area</Text>
        </View>
      );
    }

    return (
      <View style={styles.listContainer}>
        <FlatList
          contentContainerStyle={styles.flatListContent}
          data={shops}
          renderItem={({ item }) => <ShopCard name={item.name} shop={item} key={item.id} />}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={'#00bfff'}
              title="Fetching shops..."
              titleColor={'#00bfff'}
              colors={['#00bfff', '#000']}
            />
          }
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>market</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="gray" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="search"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.textButton}>
          <Text style={{ fontFamily: 'TextMeOne' }}>sort</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.textButton} onPress={toggleView}>
          <Text style={{ fontFamily: 'TextMeOne' }}>{isMapView ? 'list' : 'map'}</Text>
        </TouchableOpacity>
      </View>

      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#B7FFB0',
    minHeight: '100%',
    ...Platform.select({
      web: {
        minWidth: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    marginTop: 40,
  },
  title: {
    fontSize: Platform.select({ ios: 30, web: 80 }),
    fontWeight: 'bold',
    fontFamily: 'TitanOne',
    color: '#fff',
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'gray',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 20,
    paddingLeft: 30,
    backgroundColor: 'white',
    color: '#00bfff',
    fontFamily: 'TextMeOne',
  },
  textButton: {
    marginLeft: 8,
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 20,
  },
  mapContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        marginTop: 40,
      },
    }),
  },
  mapPlaceholder: {
    fontSize: 22,
    color: 'gray',
    backgroundColor: 'white',
    marginBottom: 75,
    borderRadius: 6,
    paddingVertical: Platform.select({ ios: 275, web: 240 }),
    paddingHorizontal: Platform.select({ ios: 140, web: 425 }),
  },
  editDetailsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // Adjust the height as needed
    height: '90%',
  },
  iconButton: {
    padding: 10,
    ...Platform.select({
      web: {
        marginBottom: 20,
      },
    }),
  },
  welcomeText: {
    fontSize: 18,
    fontFamily: 'TextMeOne',
    textAlign: 'center',
    color: '#333',
    marginVertical: 10,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageText: {
    fontFamily: 'TextMeOne',
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
  },
  listContainer: {
    flex: 1,
    ...Platform.select({
      web: {
        overflow: 'auto',
        height: '100%',
        flex: 1,
      },
    }),
  },
  flatListContent: {
    paddingBottom: 100,
    ...Platform.select({
      web: {
        minWidth: '100%',
      },
    }),
  },
});

export default MarketScreen;

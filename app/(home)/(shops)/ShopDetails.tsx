import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import ItemCard from '@/components/ItemCard';
import firebaseService from '@/handlers/firebaseService';

import { useLocation, useUser, useShop, ItemData } from '@/store/reduxHooks';
import { useAppColors } from '@/hooks/useAppColors';

export default function ShopDetails() {
  const { selectedShop, setSelectedShop } = useShop();
  const { userData } = useUser();
  const { locationData, formatDistance } = useLocation();
  const colors = useAppColors();
  const [items, setItems] = useState<ItemData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [shopOwner, setShopOwner] = useState<any>(null);
  const router = useRouter();

  // Calculate distance between two coordinates in kilometers
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  useEffect(() => {
    async function fetchShopItems() {
      if (!selectedShop) return;

      // Use items already attached to the shop if available (from batch fetch)
      if (selectedShop.items && selectedShop.items.length > 0) {
        console.log('Using pre-loaded items from shop object');
        setItems(selectedShop.items);
        setLoading(false);
        return;
      }

      // Only fetch if items aren't already attached
      try {
        setLoading(true);
        const shopItems = await firebaseService.getItemsForShop(selectedShop.id);
        setItems(shopItems || []);
      } catch (error) {
        console.error('Error fetching items:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchShopItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShop?.id, selectedShop?.items]);

  useEffect(() => {
    async function fetchShopOwner() {
      if (!selectedShop) return;

      try {
        // getUserById now uses caching internally
        const owner = await firebaseService.getUserById(selectedShop.userId);
        if (owner) {
          setShopOwner(owner);
        }
      } catch (error) {
        console.error('Error fetching shop owner:', error);
      }
    }

    fetchShopOwner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShop?.userId]);

  const pickImage = async () => {
    if (!selectedShop || selectedShop.userId !== userData?.uid) {
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to select image',
      });
    }
  };

  const uploadImage = async (uri: string) => {
    if (!selectedShop) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const filename = `shop_${selectedShop.id}_${Date.now()}.png`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const file = new File([blob], filename, { type: blob.type });

      // Use uploadProductImage with 'background' as the itemId for shop background images
      // Storage path: product_images/{shopId}/background/{filename}
      await firebaseService.uploadProductImage(
        file,
        selectedShop.id,
        'background',
        // Progress callback
        (progress) => {
          setUploadProgress(progress);
        },
        // Success callback
        async (downloadURL) => {
          await firebaseService.updateShopDetails(selectedShop.id, {
            backgroundImageUrl: downloadURL,
          });

          setSelectedShop({
            ...selectedShop,
            backgroundImageUrl: downloadURL,
          });

          setUploading(false);
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Shop image has been updated',
          });
        },
        (error) => {
          console.error('Error uploading image:', error);
          setUploading(false);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to upload image',
          });
        }
      );
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploading(false);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to upload image',
      });
    }
  };

  const handleRemoveItemFromShop = async (item) => {
    try {
      // In this case, we only remove the shop ID from the item's shopId array
      const updatedShopIds = item.shopId.filter((id) => id !== selectedShop.id);

      // Update the item with the new shopId array using dedicated function
      await firebaseService.updateItemDetails(item.id, {
        shopId: updatedShopIds,
      });

      // Remove the item from the local state
      setItems((prevItems) => prevItems.filter((i) => i.id !== item.id));

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Item removed from shop',
      });
    } catch (error) {
      console.error('Error removing item from shop:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to remove item',
      });
    }
  };

  if (!selectedShop) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textMuted }]}>Shop not found</Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const HeaderImage = () => (
    <View style={styles.headerImageContainer}>
      <Image
        source={{
          uri:
            selectedShop.backgroundImageUrl === ''
              ? `https://placehold.co/${Platform.OS === 'web' ? 800 : 600}x400/${colors.primary.replace('#', '')}/${colors.textOnPrimary.replace('#', '')}.png`
              : selectedShop.backgroundImageUrl,
        }}
        style={styles.headerImage}
        onError={() => {
          if (selectedShop.backgroundImageUrl.length > 0) {
            setSelectedShop({
              ...selectedShop,
              backgroundImageUrl: '',
            });
          }
        }}
      />

      {selectedShop.userId === userData?.uid && (
        <TouchableOpacity style={styles.uploadImageButton} onPress={pickImage} disabled={uploading}>
          {uploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
              <Text style={[styles.uploadingText, { color: colors.textOnPrimary }]}>
                {Math.round(uploadProgress)}%
              </Text>
            </View>
          ) : (
            <Ionicons name="image-outline" size={24} color={colors.textOnPrimary} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <>
      {/* Sticky back button for mobile */}
      {Platform.OS !== 'web' && (
        <TouchableOpacity
          style={styles.stickyBackButton}
          onPress={() => {
            setSelectedShop(null);
            router.back();
          }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.icon} />
        </TouchableOpacity>
      )}

      <ParallaxScrollView
        headerImage={<HeaderImage />}
        headerBackgroundColor={{ light: colors.background, dark: colors.background }}
      >
        <View style={styles.headerContainer}>
          {/* Only show this back button on web */}
          {Platform.OS === 'web' && (
            <TouchableOpacity
              style={styles.backButtonContainer}
              onPress={() => {
                setSelectedShop(null);
                router.back();
              }}
            >
              <Ionicons name="chevron-back" size={24} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>

        <View style={[styles.shopInfoContainer, { backgroundColor: colors.background }]}>
          <View style={styles.shopHeaderRow}>
            <Text
              style={[
                styles.shopName,
                { color: colors.navText },
                selectedShop.name.length > 17 ? { fontSize: Platform.OS === 'web' ? 40 : 25 } : {},
              ]}
            >
              {selectedShop.name}
            </Text>
            {selectedShop.userId === userData?.uid && (
              <TouchableOpacity
                style={styles.editShopIconButton}
                onPress={() =>
                  router.push({
                    pathname: '/AddShop',
                    params: { shopId: selectedShop.id },
                  })
                }
              >
                <Ionicons name="pencil" size={20} color={colors.iconMuted} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.ownerRow}>
            <Ionicons name="person-outline" size={16} color={colors.iconMuted} />
            <Text style={[styles.ownerText, { color: colors.textMuted }]}>
              {selectedShop.userId === userData?.uid
                ? 'you'
                : shopOwner
                  ? shopOwner.username
                  : 'Loading...'}
            </Text>
          </View>
          <Text style={[styles.shopDescription, { color: colors.text }]}>
            {selectedShop.description}
          </Text>
          <View>
            {selectedShop.type && (
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="briefcase-outline" size={18} color={colors.iconMuted} />
                </View>
                <Text style={[styles.infoText, { color: colors.textMuted }]}>
                  {selectedShop.type}
                </Text>
              </View>
            )}

            {selectedShop.days && selectedShop.days.length > 0 && (
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="calendar-outline" size={18} color={colors.iconMuted} />
                </View>
                <Text style={[styles.infoText, { color: colors.textMuted }]}>
                  Available: {selectedShop.days.join(', ')}
                </Text>
              </View>
            )}

            {selectedShop.seasons && selectedShop.seasons.length > 0 && (
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="flower-outline" size={18} color={colors.iconMuted} />
                </View>
                <Text style={[styles.infoText, { color: colors.textMuted }]}>
                  Seasons:{' '}
                  {selectedShop.seasons.map((season, index) => (
                    <Text key={season}>
                      <Ionicons
                        name={
                          season === 'spring'
                            ? 'rose-outline'
                            : season === 'summer'
                              ? 'sunny-outline'
                              : season === 'fall'
                                ? 'leaf-outline'
                                : 'snow-outline'
                        }
                        size={14}
                        color={colors.iconMuted}
                      />
                      {index < selectedShop.seasons.length - 1 ? ', ' : ''}
                    </Text>
                  ))}
                </Text>
              </View>
            )}

            {selectedShop.openTime && selectedShop.closeTime && (
              <View style={styles.infoRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="time-outline" size={18} color={colors.iconMuted} />
                </View>
                <Text style={[styles.infoText, { color: colors.textMuted }]}>
                  Hours: {selectedShop.openTime} - {selectedShop.closeTime}
                </Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="location-outline" size={18} color={colors.iconMuted} />
              </View>
              <Text style={[styles.infoText, { color: colors.textMuted }]}>
                {locationData.coords && selectedShop.location
                  ? formatDistance(
                      calculateDistance(
                        locationData.coords.latitude,
                        locationData.coords.longitude,
                        selectedShop.location.latitude,
                        selectedShop.location.longitude
                      )
                    ) + ' away'
                  : 'Distance unavailable'}
              </Text>
            </View>
          </View>

          <View style={styles.deliveryInfoContainer}>
            {selectedShop.allowPickup && (
              <View style={[styles.deliveryOption, { backgroundColor: colors.text }]}>
                <Ionicons name="bag-handle-outline" size={18} color={colors.textOnPrimary} />
                <Text style={[styles.deliveryText, { color: colors.textOnPrimary }]}>
                  Pickup available
                </Text>
              </View>
            )}
            {selectedShop.localDelivery && (
              <View style={[styles.deliveryOption, { backgroundColor: colors.text }]}>
                <Ionicons name="bicycle-outline" size={18} color={colors.textOnPrimary} />
                <Text style={[styles.deliveryText, { color: colors.textOnPrimary }]}>
                  Local delivery
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.itemsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Items</Text>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : items.length > 0 ? (
            items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                shopName={selectedShop.name}
                shopPhotoURL={selectedShop.backgroundImageUrl}
                allowPickup={selectedShop.allowPickup}
                localDelivery={selectedShop.localDelivery}
                showCartControls={selectedShop.userId !== userData?.uid}
                isShopOwner={selectedShop.userId === userData?.uid}
                onDeleteItem={
                  selectedShop.userId === userData?.uid ? handleRemoveItemFromShop : undefined
                }
                deleteLabel="Remove"
                deleteConfirmMessage="Are you sure you want to remove this item from your shop? This won't delete the item permanently."
              />
            ))
          ) : (
            <Text style={[styles.noItemsText, { color: colors.textMuted }]}>
              No items available
            </Text>
          )}
          {selectedShop.userId === userData?.uid && (
            <TouchableOpacity
              style={[styles.addItemsButton, { backgroundColor: colors.buttonPrimary }]}
              onPress={() =>
                router.push({
                  pathname: '/AddItem',
                  params: { shopId: selectedShop.id },
                })
              }
            >
              <Ionicons
                name="add-circle-outline"
                size={24}
                color={colors.textOnPrimary}
                style={styles.buttonIcon}
              />
              <Text style={[styles.addItemsButtonText, { color: colors.textOnPrimary }]}>
                Add Items
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ParallaxScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadImageButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  uploadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingText: {
    marginTop: 4,
    fontSize: 12,
  },
  headerContainer: {
    position: Platform.OS === 'web' ? 'absolute' : 'relative',
    top: Platform.OS === 'web' ? 10 : 0,
    left: Platform.OS === 'web' ? 10 : 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButtonContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: 8,
  },
  stickyBackButton: {
    position: 'absolute',
    top: 110,
    left: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: 3,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  shopInfoContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  shopHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ownerText: {
    fontSize: 14,
    fontFamily: 'TextMeOne',
    marginLeft: 4,
  },
  shopName: {
    fontSize: Platform.OS === 'web' ? 40 : 30,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'TitanOne',
  },
  editShopIconButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 15,
    padding: 8,
    marginLeft: 10,
  },
  shopDescription: {
    fontSize: 16,
    marginBottom: 16,
    fontFamily: 'TextMeOne',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  infoText: {
    fontFamily: 'TextMeOne',
    flex: 1,
  },
  deliveryInfoContainer: {
    flexDirection: 'row',
    marginTop: 12,
    flexWrap: 'wrap',
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 10,
    marginBottom: 6,
  },
  deliveryText: {
    marginLeft: 6,
    fontFamily: 'TextMeOne',
  },
  itemsContainer: {
    marginTop: 16,
    paddingBottom: 200,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: 'TitanOne',
  },
  backButton: {
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    fontFamily: 'TextMeOne',
  },
  noItemsText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
    fontFamily: 'TextMeOne',
  },
  addItemsButton: {
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  addItemsButtonText: {
    fontSize: Platform.OS === 'web' ? 30 : 24,
    fontFamily: 'TextMeOne',
  },
  buttonIcon: {
    marginRight: 8,
  },
});

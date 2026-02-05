import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart, useItem, ItemData } from '@/store/reduxHooks';
import { useAppColors } from '@/hooks/useAppColors';

interface ItemCardProps {
  item: ItemData;
  shopName?: string;
  shopPhotoURL?: string;
  allowPickup?: boolean;
  localDelivery?: boolean;
  onPress?: () => void;
  showCartControls?: boolean;
  isShopOwner?: boolean;
  onEditItem?: (item: ItemData) => void;
  onDeleteItem?: (item: ItemData) => void;
  deleteLabel?: string;
  deleteConfirmMessage?: string;
}

const ItemCard = ({
  item,
  shopName = '',
  shopPhotoURL = '',
  allowPickup = true,
  localDelivery = true,
  onPress,
  showCartControls = true,
  isShopOwner = false,
  onEditItem,
  onDeleteItem,
  deleteLabel = 'Delete',
  deleteConfirmMessage = 'Are you sure you want to delete this item?',
}: ItemCardProps) => {
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { setSelectedItem } = useItem();
  const router = useRouter();
  const colors = useAppColors();

  const handleAddToCart = () => {
    if (!item.shopId) return;

    addToCart({
      itemId: item.id,
      shopId: item.shopId,
      shopName,
      shopPhotoURL,
      allowPickup,
      localDelivery,
      name: item.name,
      price: item.price,
      quantity,
      photoURL: item.imageUrl,
    });

    // Reset quantity after adding to cart
    setQuantity(1);
  };

  const incrementQuantity = () =>
    setQuantity((prev) => (prev < item.quantity ? prev + 1 : item.quantity));

  const decrementQuantity = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const handleEdit = () => {
    if (onEditItem) {
      onEditItem(item);
    } else {
      setSelectedItem(item);
      router.push({
        pathname: '/(home)/(items)/AddItem',
        params: { itemId: item.id },
      });
    }
  };

  const handleDelete = () => {
    // Show confirmation dialog
    if (Platform.OS === 'web') {
      if (confirm(deleteConfirmMessage)) {
        onDeleteItem && onDeleteItem(item);
      }
    } else {
      Alert.alert(`${deleteLabel} Item`, deleteConfirmMessage, [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: deleteLabel,
          onPress: () => onDeleteItem && onDeleteItem(item),
          style: 'destructive',
        },
      ]);
    }
  };

  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const useManagerStyle = isShopOwner && onDeleteItem;

  // Render item image - shared between both card types
  const renderItemImage = () => (
    <View style={useManagerStyle ? styles.itemImageContainer : null}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      ) : (
        <View style={[styles.noImage, { backgroundColor: colors.inputBackground }]}>
          <Text style={[styles.noImageText, { color: colors.textMuted }]}>No Image</Text>
        </View>
      )}
    </View>
  );

  // Render item details - shared between both card types
  const renderItemDetails = () => (
    <View style={useManagerStyle ? styles.itemDetails : styles.itemInfo}>
      {!useManagerStyle && (
        <TouchableOpacity onPress={onPress} disabled={!onPress} style={styles.infoContainer}>
          {renderItemContent()}
        </TouchableOpacity>
      )}

      {useManagerStyle && renderItemContent()}

      {showCartControls && !useManagerStyle && renderCartControls()}
    </View>
  );

  // Render common item content
  const renderItemContent = () => (
    <>
      <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>

      {useManagerStyle && deleteLabel === 'Delete' && (
        <Text style={[styles.itemShop, { color: colors.textMuted }]}>
          {item.shopId && item.shopId.length > 0 ? shopName : 'No shop assigned'}
        </Text>
      )}

      {((useManagerStyle && deleteLabel === 'Remove') || !useManagerStyle) && (
        <Text style={[styles.itemDescription, { color: colors.textMuted }]}>
          {item.description || (!useManagerStyle ? '' : 'No description available')}
        </Text>
      )}

      <View style={useManagerStyle ? null : styles.priceRow}>
        <Text style={styles.itemPrice}>
          {formatPrice(item.price)} {item.unit === 'each' ? item.unit : `per ${item.unit}`}
        </Text>
      </View>

      {useManagerStyle && (
        <Text style={[styles.itemQuantity, { color: colors.textMuted }]}>
          Quantity: {item.quantity || 0}
        </Text>
      )}

      {item.negotiable && (
        <Text style={useManagerStyle ? styles.negotiableTag : styles.itemNegotiable}>
          Price negotiable
        </Text>
      )}
    </>
  );

  // Render cart controls
  const renderCartControls = () => (
    <View style={styles.cartControls}>
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          onPress={decrementQuantity}
          style={[styles.quantityButton, { backgroundColor: colors.inputBackground }]}
        >
          <Ionicons name="remove" size={16} color="#00bfff" />
        </TouchableOpacity>
        <Text style={[styles.quantityText, { color: colors.text }]}>
          {Math.min(quantity, item.quantity)}
        </Text>
        <TouchableOpacity
          onPress={incrementQuantity}
          style={[
            styles.quantityButton,
            {
              backgroundColor:
                colors.inputBackground == '#ffffff' ? '#eee' : colors.inputBackground,
            },
          ]}
        >
          <Ionicons name="add" size={16} color="#00bfff" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
        <Ionicons name="cart" size={16} color="white" />
        <Text style={styles.addButtonText}>Add to Cart</Text>
      </TouchableOpacity>
    </View>
  );

  // Render item management actions
  const renderItemActions = () => (
    <View style={styles.itemActions}>
      <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
        <Ionicons name="create-outline" size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View
      style={[
        useManagerStyle ? styles.manageItemCard : styles.itemCard,
        { backgroundColor: colors.surface },
      ]}
    >
      {renderItemImage()}
      {renderItemDetails()}
      {useManagerStyle && renderItemActions()}
    </View>
  );
};

const styles = StyleSheet.create({
  // Base card styles
  itemCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  manageItemCard: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },

  // Image styles
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 15,
  },
  noImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 12,
  },

  // Content styles
  itemInfo: {
    flex: 1,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    marginBottom: 4,
    fontFamily: 'TitanOne',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemPrice: {
    fontSize: 16,
    color: '#00bfff',
    fontWeight: '600',
    marginRight: 4,
    fontFamily: 'TextMeOne',
  },
  itemUnit: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  itemDescription: {
    fontSize: 14,
    fontFamily: 'TextMeOne',
    marginBottom: 4,
  },
  itemShop: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'TextMeOne',
  },
  itemQuantity: {
    fontSize: 14,
    fontFamily: 'TextMeOne',
  },
  itemNegotiable: {
    fontSize: 12,
    color: '#00bfff',
    fontStyle: 'italic',
  },
  negotiableTag: {
    fontSize: 12,
    color: '#00bfff',
    fontStyle: 'italic',
    marginTop: 4,
  },

  // Cart control styles
  cartControls: {
    marginTop: 10,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityButton: {
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#00bfff',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'TextMeOne',
  },

  // Action button styles
  itemActions: {
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  editButton: {
    backgroundColor: '#00bfff',
    padding: 8,
    borderRadius: 5,
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: '#ff4d4d',
    padding: 8,
    borderRadius: 5,
  },
  ownerControls: {
    marginTop: 10,
  },
  deleteActionButton: {
    backgroundColor: '#ff4d4d',
    marginTop: 8,
  },
});

export default ItemCard;

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useShop, ShopData } from '@/store/reduxHooks';
import { useAppColors } from '@/hooks/useAppColors';

interface ShopCardProps {
  name: string;
  shop: ShopData;
}

const ShopCard = ({ name, shop }: ShopCardProps) => {
  const router = useRouter();
  const { setSelectedShop } = useShop();
  const colors = useAppColors();

  const handlePress = () => {
    if (shop) {
      setSelectedShop(shop);
      router.push('/ShopDetails');
    }
  };

  // Extract item images from the shop's items
  const itemImages = shop.items?.filter((item) => item.imageUrl).map((item) => item.imageUrl) || [];

  return (
    <View style={[styles.shopItem, { backgroundColor: colors.surface }]}>
      <TouchableOpacity onPress={handlePress}>
        <Text style={[styles.shopName, { color: colors.text }]}>{name}</Text>
        <View style={styles.shopCircles}>
          {itemImages.length > 0 ? (
            itemImages.map((imageUrl, i) => (
              <Image key={i} source={{ uri: imageUrl }} style={styles.itemImage} />
            ))
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  backgroundColor: colors.inputBackground,
                  borderRadius: 10,
                }}
              />
              <Text style={{ marginLeft: 8, color: colors.textMuted, fontStyle: 'italic' }}>
                No items yet
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  shopItem: {
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  shopName: {
    fontSize: Platform.OS === 'web' ? 30 : 18,
    fontFamily: 'TextMeOne',
  },
  shopCircles: {
    flexDirection: 'row',
    marginTop: 8,
  },
  itemImage: {
    width: Platform.OS === 'web' ? 80 : 20,
    height: Platform.OS === 'web' ? 80 : 20,
    borderRadius: 10,
    marginRight: 8,
  },
});

export default ShopCard;

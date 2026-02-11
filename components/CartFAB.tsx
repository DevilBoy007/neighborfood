import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/store/reduxHooks';
import { SoundTouchableOpacity } from '@/components/SoundTouchableOpacity';
import { useAppColors } from '@/hooks/useAppColors';

interface CartFABProps {
  bottom?: number;
}

const CartFAB: React.FC<CartFABProps> = ({ bottom = 20 }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { getItemCount } = useCart();
  const colors = useAppColors();

  const itemCount = getItemCount();

  // Don't render if there are no items in the cart or if we're on the Cart screen
  if (itemCount <= 0 || pathname.includes('Cart') || pathname.includes('Checkout')) {
    return null;
  }

  const handlePress = () => {
    router.navigate('/(cart)/Cart');
  };

  return (
    <SoundTouchableOpacity
      style={[styles.fabContainer, { bottom }]}
      onPress={handlePress}
      activeOpacity={0.8}
      soundType="tap"
    >
      <View style={[styles.fab, { backgroundColor: colors.buttonPrimary }]}>
        <Ionicons name="cart" size={24} color={colors.buttonText} />
        <Text style={[styles.fabText, { color: colors.buttonText }]}>View Cart</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: colors.accent, borderColor: colors.surface }]}>
        <Text style={[styles.badgeText, { color: colors.text }]}>{itemCount}</Text>
      </View>
    </SoundTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: 20,
    elevation: 5,
    zIndex: 999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
      },
      web: {
        boxShadow: '0px 3px 5px rgba(0, 0, 0, 0.2)',
        borderRadius: 30,
      },
    }),
  },
  fab: {
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  fabText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});

export default CartFAB;

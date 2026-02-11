/**
 * Shared type definitions for Neighborfood
 * Import these types across the application for consistency
 */

// Re-export types from store slices to maintain consistency
export type { ItemData } from '@/store/slices/itemSlice';
export type { ShopData, ShopLocation } from '@/store/slices/shopSlice';
export type { OrderData, OrderStatus } from '@/store/slices/orderSlice';
export type { UserData } from '@/store/slices/userSlice';
export type { ThreadData, MessageData, MessageType } from '@/store/slices/messageSlice';

// Firebase timestamp type
export type FirebaseTimestamp = {
  seconds: number;
  nanoseconds: number;
};

// Cart-related types
export type CartItem = {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  shopId: string;
  shopName: string;
};

export type ShopCart = {
  shopId: string;
  shopName: string;
  items: CartItem[];
};

// Helper function to extract coordinates from ShopLocation
export const getShopCoordinates = (location: {
  coordinates?: { latitude: number; longitude: number };
  latitude?: number;
  longitude?: number;
  _latitude?: number;
  _longitude?: number;
}): { latitude: number; longitude: number } | null => {
  if (location.coordinates) {
    return location.coordinates;
  }
  if (location.latitude !== undefined && location.longitude !== undefined) {
    return { latitude: location.latitude, longitude: location.longitude };
  }
  if (location._latitude !== undefined && location._longitude !== undefined) {
    return { latitude: location._latitude, longitude: location._longitude };
  }
  return null;
};

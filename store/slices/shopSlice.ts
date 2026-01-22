import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ItemData } from './itemSlice';

export type ShopLocation = {
  marketId: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  // Support for direct GeoPoint-style access from Firebase
  latitude?: number;
  longitude?: number;
  _latitude?: number;
  _longitude?: number;
};

export type ShopData = {
  id: string;
  name: string;
  description: string;
  backgroundImageUrl: string;
  userId: string;
  location: ShopLocation;
  createdAt: { seconds: number; nanoseconds: number };
  type: string;
  localDelivery: boolean;
  allowPickup: boolean;
  days: string[];
  seasons: string[];
  openTime: string;
  closeTime: string;
  items?: ItemData[];
};

type ShopState = {
  selectedShop: ShopData | null;
  shops: ShopData[];
  isLoadingShop: boolean;
};

const initialState: ShopState = {
  selectedShop: null,
  shops: [],
  isLoadingShop: false,
};

const shopSlice = createSlice({
  name: 'shop',
  initialState,
  reducers: {
    setSelectedShop: (state, action: PayloadAction<ShopData | null>) => {
      state.selectedShop = action.payload;
    },
    clearSelectedShop: (state) => {
      state.selectedShop = null;
    },
    setShops: (state, action: PayloadAction<ShopData[]>) => {
      state.shops = action.payload;
    },
    setIsLoadingShop: (state, action: PayloadAction<boolean>) => {
      state.isLoadingShop = action.payload;
    },
  },
});

export const { setSelectedShop, clearSelectedShop, setShops, setIsLoadingShop } = shopSlice.actions;
export default shopSlice.reducer;

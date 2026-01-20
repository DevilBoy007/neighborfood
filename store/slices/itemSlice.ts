import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ItemData = {
  id: string;
  shopId: string;
  marketId: string;
  userId: string;
  name: string;
  description: string;
  category: string[];
  imageUrl: string;
  price: number;
  unit: string;
  negotiable: boolean;
  quantity: number;
  createdAt: { seconds: number; nanoseconds: number };
};

type ItemState = {
  selectedItem: ItemData | null;
  isLoadingItem: boolean;
};

const initialState: ItemState = {
  selectedItem: null,
  isLoadingItem: false,
};

const itemSlice = createSlice({
  name: 'item',
  initialState,
  reducers: {
    setSelectedItem: (state, action: PayloadAction<ItemData | null>) => {
      state.selectedItem = action.payload;
    },
    clearSelectedItem: (state) => {
      state.selectedItem = null;
    },
    setIsLoadingItem: (state, action: PayloadAction<boolean>) => {
      state.isLoadingItem = action.payload;
    },
  },
});

export const { setSelectedItem, clearSelectedItem, setIsLoadingItem } = itemSlice.actions;
export default itemSlice.reducer;

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type CartItem = {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  photoURL?: string;
  negotiable?: boolean;
};

export type ShopCart = {
  shopId: string;
  shopName: string;
  shopPhotoURL?: string;
  allowPickup: boolean;
  localDelivery: boolean;
  items: CartItem[];
  subtotal: number;
};

type CartState = {
  shopCarts: ShopCart[];
  isLoadingCart: boolean;
};

const initialState: CartState = {
  shopCarts: [],
  isLoadingCart: true,
};

// Helper to get storage - lazily evaluated with guard for bundling
const getStorage = () => {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      // Return a no-op storage for SSR/bundling
      return {
        getItem: () => Promise.resolve(null),
        setItem: () => Promise.resolve(),
        removeItem: () => Promise.resolve(),
      };
    }
    return localStorage;
  }
  return AsyncStorage;
};

const calculateSubtotalFromItems = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
};

export const loadCart = createAsyncThunk('cart/loadCart', async () => {
  const storage = getStorage();
  const cartData = await storage.getItem('cart');
  if (cartData) {
    return JSON.parse(cartData) as ShopCart[];
  }
  return [];
});

export const saveCart = createAsyncThunk('cart/saveCart', async (shopCarts: ShopCart[]) => {
  const storage = getStorage();
  if (shopCarts.length > 0) {
    await storage.setItem('cart', JSON.stringify(shopCarts));
  } else {
    await storage.removeItem('cart');
  }
  return shopCarts;
});

type AddToCartPayload = Omit<CartItem, 'id'> & {
  shopId: string;
  shopName: string;
  shopPhotoURL?: string;
  allowPickup: boolean;
  localDelivery: boolean;
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<AddToCartPayload>) => {
      const { shopId, shopName, shopPhotoURL, allowPickup, localDelivery, ...itemData } =
        action.payload;

      const shopCartIndex = state.shopCarts.findIndex((cart) => cart.shopId === shopId);

      if (shopCartIndex === -1) {
        // Create new shop cart
        const newShopCart: ShopCart = {
          shopId,
          shopName,
          shopPhotoURL,
          allowPickup,
          localDelivery,
          items: [itemData],
          subtotal: itemData.price * itemData.quantity,
        };
        state.shopCarts.push(newShopCart);
      } else {
        // Update existing shop cart
        const shopCart = state.shopCarts[shopCartIndex];
        const existingItemIndex = shopCart.items.findIndex(
          (cartItem) => cartItem.itemId === itemData.itemId
        );

        if (existingItemIndex >= 0) {
          // Update existing item quantity
          shopCart.items[existingItemIndex].quantity += itemData.quantity;
        } else {
          // Add new item to shop cart
          shopCart.items.push(itemData);
        }

        shopCart.subtotal = calculateSubtotalFromItems(shopCart.items);
      }
    },
    removeFromCart: (state, action: PayloadAction<{ shopId: string; itemId: string }>) => {
      const { shopId, itemId } = action.payload;
      const shopCartIndex = state.shopCarts.findIndex((cart) => cart.shopId === shopId);

      if (shopCartIndex === -1) return;

      const shopCart = state.shopCarts[shopCartIndex];
      const updatedItems = shopCart.items.filter((item) => item.itemId !== itemId);

      if (updatedItems.length === 0) {
        // Remove the entire shop cart if no items left
        state.shopCarts.splice(shopCartIndex, 1);
      } else {
        shopCart.items = updatedItems;
        shopCart.subtotal = calculateSubtotalFromItems(updatedItems);
      }
    },
    updateItemQuantity: (
      state,
      action: PayloadAction<{ shopId: string; itemId: string; quantity: number }>
    ) => {
      const { shopId, itemId, quantity } = action.payload;

      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        const shopCartIndex = state.shopCarts.findIndex((cart) => cart.shopId === shopId);
        if (shopCartIndex === -1) return;

        const shopCart = state.shopCarts[shopCartIndex];
        const updatedItems = shopCart.items.filter((item) => item.itemId !== itemId);

        if (updatedItems.length === 0) {
          state.shopCarts.splice(shopCartIndex, 1);
        } else {
          shopCart.items = updatedItems;
          shopCart.subtotal = calculateSubtotalFromItems(updatedItems);
        }
        return;
      }

      const shopCartIndex = state.shopCarts.findIndex((cart) => cart.shopId === shopId);
      if (shopCartIndex === -1) return;

      const shopCart = state.shopCarts[shopCartIndex];
      const itemIndex = shopCart.items.findIndex((item) => item.itemId === itemId);
      if (itemIndex === -1) return;

      shopCart.items[itemIndex].quantity = quantity;
      shopCart.subtotal = calculateSubtotalFromItems(shopCart.items);
    },
    clearCart: (state) => {
      state.shopCarts = [];
    },
    clearShopCart: (state, action: PayloadAction<string>) => {
      state.shopCarts = state.shopCarts.filter((cart) => cart.shopId !== action.payload);
    },
    setShopCarts: (state, action: PayloadAction<ShopCart[]>) => {
      state.shopCarts = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCart.pending, (state) => {
        state.isLoadingCart = true;
      })
      .addCase(loadCart.fulfilled, (state, action) => {
        state.shopCarts = action.payload;
        state.isLoadingCart = false;
      })
      .addCase(loadCart.rejected, (state) => {
        state.isLoadingCart = false;
      })
      .addCase(saveCart.fulfilled, (state, action) => {
        state.shopCarts = action.payload;
      });
  },
});

// Selector helpers (to be used with useAppSelector)
export const selectTotalSubtotal = (state: { cart?: CartState }): number => {
  return state.cart?.shopCarts.reduce((total, shopCart) => total + shopCart.subtotal, 0) ?? 0;
};

export const selectItemCount = (state: { cart?: CartState }): number => {
  return (
    state.cart?.shopCarts.reduce(
      (count, shopCart) =>
        count + shopCart.items.reduce((itemCount, item) => itemCount + item.quantity, 0),
      0
    ) ?? 0
  );
};

export const selectShopCount = (state: { cart?: CartState }): number => {
  return state.cart?.shopCarts.length ?? 0;
};

export const {
  addToCart,
  removeFromCart,
  updateItemQuantity,
  clearCart,
  clearShopCart,
  setShopCarts,
} = cartSlice.actions;
export default cartSlice.reducer;

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type CartItem = {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  photoURL?: string;
  negotiable?: boolean;
};

type ShopCart = {
  shopId: string;
  shopName: string;
  shopPhotoURL?: string;
  allowPickup: boolean;
  localDelivery: boolean;
  items: CartItem[];
  subtotal: number;
};

interface CartState {
  shopCarts: ShopCart[];
  isLoadingCart: boolean;
}

const initialState: CartState = {
  shopCarts: [],
  isLoadingCart: true,
};

// Helper function to calculate subtotal for a shop cart
const calculateSubtotal = (items: CartItem[]): number => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// Helper function to save cart to storage
const saveCartToStorage = async (shopCarts: ShopCart[]): Promise<void> => {
  try {
    const storage = Platform.OS === 'web' ? localStorage : AsyncStorage;
    await storage.setItem('cart', JSON.stringify(shopCarts));
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
};

// Async thunk to load cart from storage
export const loadCart = createAsyncThunk(
  'cart/loadCart',
  async (_, { rejectWithValue }) => {
    try {
      const storage = Platform.OS === 'web' ? localStorage : AsyncStorage;
      const cartData = await storage.getItem('cart');
      if (cartData) {
        return JSON.parse(cartData) as ShopCart[];
      }
      return [];
    } catch (error) {
      console.error('Error loading cart from storage:', error);
      return rejectWithValue('Failed to load cart');
    }
  }
);

// Async thunk to save cart to storage
export const saveCart = createAsyncThunk(
  'cart/saveCart',
  async (shopCarts: ShopCart[], { rejectWithValue }) => {
    try {
      await saveCartToStorage(shopCarts);
      return shopCarts;
    } catch (error) {
      console.error('Error saving cart:', error);
      return rejectWithValue('Failed to save cart');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<{
      item: Omit<CartItem, 'id'>;
      shopId: string;
      shopName: string;
      shopPhotoURL?: string;
      allowPickup: boolean;
      localDelivery: boolean;
    }>) => {
      const { item, shopId, shopName, shopPhotoURL, allowPickup, localDelivery } = action.payload;
      
      // Find existing shop cart
      let shopCartIndex = state.shopCarts.findIndex(cart => cart.shopId === shopId);
      
      if (shopCartIndex === -1) {
        // Create new shop cart
        const newShopCart: ShopCart = {
          shopId,
          shopName,
          shopPhotoURL,
          allowPickup,
          localDelivery,
          items: [item],
          subtotal: calculateSubtotal([item]),
        };
        state.shopCarts.push(newShopCart);
      } else {
        // Add to existing shop cart
        const shopCart = state.shopCarts[shopCartIndex];
        const existingItemIndex = shopCart.items.findIndex(cartItem => cartItem.itemId === item.itemId);
        
        if (existingItemIndex !== -1) {
          // Update quantity of existing item
          shopCart.items[existingItemIndex].quantity += item.quantity;
        } else {
          // Add new item
          shopCart.items.push(item);
        }
        
        // Recalculate subtotal
        shopCart.subtotal = calculateSubtotal(shopCart.items);
      }
      
      // Save to storage
      saveCartToStorage(state.shopCarts);
    },
    removeFromCart: (state, action: PayloadAction<{ shopId: string; itemId: string }>) => {
      const { shopId, itemId } = action.payload;
      const shopCartIndex = state.shopCarts.findIndex(cart => cart.shopId === shopId);
      
      if (shopCartIndex !== -1) {
        const shopCart = state.shopCarts[shopCartIndex];
        shopCart.items = shopCart.items.filter(item => item.itemId !== itemId);
        
        if (shopCart.items.length === 0) {
          // Remove empty shop cart
          state.shopCarts.splice(shopCartIndex, 1);
        } else {
          // Recalculate subtotal
          shopCart.subtotal = calculateSubtotal(shopCart.items);
        }
        
        // Save to storage
        saveCartToStorage(state.shopCarts);
      }
    },
    updateItemQuantity: (state, action: PayloadAction<{ shopId: string; itemId: string; quantity: number }>) => {
      const { shopId, itemId, quantity } = action.payload;
      const shopCartIndex = state.shopCarts.findIndex(cart => cart.shopId === shopId);
      
      if (shopCartIndex !== -1) {
        const shopCart = state.shopCarts[shopCartIndex];
        const itemIndex = shopCart.items.findIndex(item => item.itemId === itemId);
        
        if (itemIndex !== -1) {
          if (quantity <= 0) {
            // Remove item if quantity is 0 or less
            shopCart.items.splice(itemIndex, 1);
            
            if (shopCart.items.length === 0) {
              // Remove empty shop cart
              state.shopCarts.splice(shopCartIndex, 1);
            } else {
              // Recalculate subtotal
              shopCart.subtotal = calculateSubtotal(shopCart.items);
            }
          } else {
            // Update quantity
            shopCart.items[itemIndex].quantity = quantity;
            // Recalculate subtotal
            shopCart.subtotal = calculateSubtotal(shopCart.items);
          }
          
          // Save to storage
          saveCartToStorage(state.shopCarts);
        }
      }
    },
    clearCart: (state) => {
      state.shopCarts = [];
      saveCartToStorage([]);
    },
    clearShopCart: (state, action: PayloadAction<string>) => {
      const shopId = action.payload;
      state.shopCarts = state.shopCarts.filter(cart => cart.shopId !== shopId);
      saveCartToStorage(state.shopCarts);
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

// Selectors for calculated values
export const selectTotalSubtotal = (state: { cart: CartState }): number => {
  return state.cart.shopCarts.reduce((total, shopCart) => total + shopCart.subtotal, 0);
};

export const selectItemCount = (state: { cart: CartState }): number => {
  return state.cart.shopCarts.reduce((count, shopCart) => 
    count + shopCart.items.reduce((itemCount, item) => itemCount + item.quantity, 0), 0);
};

export const selectShopCount = (state: { cart: CartState }): number => {
  return state.cart.shopCarts.length;
};

export const { 
  addToCart, 
  removeFromCart, 
  updateItemQuantity, 
  clearCart, 
  clearShopCart 
} = cartSlice.actions;

export type { CartItem, ShopCart };
export default cartSlice.reducer;
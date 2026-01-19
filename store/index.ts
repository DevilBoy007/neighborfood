import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import userReducer from './slices/userSlice';
import locationReducer from './slices/locationSlice';
import shopReducer from './slices/shopSlice';
import itemReducer from './slices/itemSlice';
import orderReducer from './slices/orderSlice';
import cartReducer from './slices/cartSlice';

const rootReducer = combineReducers({
  user: userReducer,
  location: locationReducer,
  shop: shopReducer,
  item: itemReducer,
  order: orderReducer,
  cart: cartReducer,
});

// Web storage adapter for redux-persist
const createWebStorage = () => {
  return {
    getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
    setItem: (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
    removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
  };
};

const storage = Platform.OS === 'web' ? createWebStorage() : AsyncStorage;

const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  // Whitelist specific slices to persist
  whitelist: ['user', 'cart'],
  // Location and orders are fetched fresh on app start
  blacklist: ['location', 'order', 'shop', 'item'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        // Ignore paths that may contain Firebase Timestamp, GeoPoint, or DocumentReference objects
        ignoredActionPaths: [
          // User-related paths
          'payload.createdAt',
          'payload.location',
          'payload.location.coords',
          'payload.shops',
          'meta.arg.createdAt',
          'meta.arg.location',
          'meta.arg.location.coords',
          'meta.arg.shops',
          // Order-related paths
          'payload.estimatedDeliveryTime',
          'payload.deliveredAt',
          'meta.arg.estimatedDeliveryTime',
          'meta.arg.deliveredAt',
        ],
        ignoredPaths: [
          // User state paths
          'user.userData.createdAt',
          'user.userData.location',
          'user.userData.location.coords',
          'user.userData.shops',
          // Shop state paths
          'shop.selectedShop.createdAt',
          'shop.selectedShop.location',
          'shop.shops',
          // Item state paths
          'item.selectedItem.createdAt',
          // Order state paths
          'order.placedOrders',
          'order.receivedOrders',
          'order.orderHistory',
          'order.selectedOrder.createdAt',
          'order.selectedOrder.estimatedDeliveryTime',
          'order.selectedOrder.deliveredAt',
        ],
      },
    }),
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

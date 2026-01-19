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
          'payload.createdAt',
          'payload.location.coords',
          'payload.shops',
          'meta.arg.createdAt',
          'meta.arg.location.coords',
          'meta.arg.shops',
        ],
        ignoredPaths: [
          'user.userData.createdAt',
          'user.userData.location.coords',
          'user.userData.shops',
        ],
      },
    }),
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

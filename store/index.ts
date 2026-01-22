import { configureStore, combineReducers, isPlain } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
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

// Custom serializable check that allows Firebase objects (Timestamp, GeoPoint, DocumentReference, DocumentKey, Firestore)
// This is more maintainable than listing every possible path
const isSerializable = (value: unknown): boolean => {
  // Allow standard serializable values
  if (isPlain(value)) return true;

  // Allow Date objects
  if (value instanceof Date) return true;

  // Allow Firebase Timestamp objects (have seconds and nanoseconds properties)
  if (value !== null && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
    return true;
  }

  // Allow Firebase GeoPoint objects (have latitude and longitude properties)
  if (value !== null && typeof value === 'object' && 'latitude' in value && 'longitude' in value) {
    return true;
  }

  // Allow Firebase DocumentReference objects (have id and path properties)
  if (value !== null && typeof value === 'object' && 'id' in value && 'path' in value) {
    return true;
  }

  // Allow Firebase DocumentKey objects (internal Firebase structure with path.segments)
  if (
    value !== null &&
    typeof value === 'object' &&
    'path' in value &&
    typeof (value as { path: unknown }).path === 'object' &&
    (value as { path: { segments?: unknown } }).path !== null &&
    'segments' in (value as { path: object }).path
  ) {
    return true;
  }

  // Allow Firebase internal path objects (have len, offset, segments properties)
  if (
    value !== null &&
    typeof value === 'object' &&
    'segments' in value &&
    'len' in value &&
    'offset' in value
  ) {
    return true;
  }

  // Allow Firebase Firestore instance objects (have app, databaseId, settings properties)
  if (
    value !== null &&
    typeof value === 'object' &&
    'app' in value &&
    'databaseId' in value &&
    'settings' in value
  ) {
    return true;
  }

  // Allow Firebase App objects (have _name, _options, _config properties)
  if (
    value !== null &&
    typeof value === 'object' &&
    '_name' in value &&
    '_options' in value &&
    '_config' in value
  ) {
    return true;
  }

  // Allow Firebase databaseId objects (have database and projectId properties)
  if (value !== null && typeof value === 'object' && 'database' in value && 'projectId' in value) {
    return true;
  }

  // Allow expo-location coords objects
  if (value !== null && typeof value === 'object' && 'accuracy' in value && 'altitude' in value) {
    return true;
  }

  return false;
};

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        // Use custom isSerializable function to handle Firebase objects
        isSerializable,
      },
    }),
});

export const persistor = persistStore(store);

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

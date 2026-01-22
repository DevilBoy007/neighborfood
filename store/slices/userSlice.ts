import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type UserData = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: { seconds: number; nanoseconds: number };
  first: string;
  last: string;
  dob: string;
  phone: string;
  location: {
    address: string;
    city: string;
    coords: {
      latitude: number;
      longitude: number;
    };
    state: string;
    zip?: string;
  };
};

type UserState = {
  userData: UserData | null;
  isLoading: boolean;
};

const initialState: UserState = {
  userData: null,
  isLoading: true,
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

export const loadUserData = createAsyncThunk('user/loadUserData', async () => {
  const storage = getStorage();
  const data = await storage.getItem('userData');
  if (data) {
    return JSON.parse(data) as UserData;
  }
  return null;
});

export const saveUserData = createAsyncThunk('user/saveUserData', async (data: UserData | null) => {
  const storage = getStorage();
  if (data) {
    await storage.setItem('userData', JSON.stringify(data));
  } else {
    await storage.removeItem('userData');
  }
  return data;
});

export const clearUserData = createAsyncThunk('user/clearUserData', async () => {
  const storage = getStorage();
  await storage.removeItem('userData');
  return null;
});

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserData: (state, action: PayloadAction<UserData | null>) => {
      state.userData = action.payload;
    },
    updateUserData: (state, action: PayloadAction<Partial<UserData>>) => {
      if (state.userData) {
        state.userData = { ...state.userData, ...action.payload };
      }
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUserData.fulfilled, (state, action) => {
        state.userData = action.payload;
        state.isLoading = false;
      })
      .addCase(loadUserData.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(saveUserData.fulfilled, (state, action) => {
        state.userData = action.payload;
      })
      .addCase(clearUserData.fulfilled, (state) => {
        state.userData = null;
      });
  },
});

export const { setUserData, updateUserData, setIsLoading } = userSlice.actions;
export default userSlice.reducer;

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type UserData = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  // Additional fields from Firestore
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

interface UserState {
  userData: UserData | null;
  isLoading: boolean;
}

const initialState: UserState = {
  userData: null,
  isLoading: true,
};

// Async thunk to load user data from storage
export const loadUserData = createAsyncThunk(
  'user/loadUserData',
  async (_, { rejectWithValue }) => {
    try {
      const storage = Platform.OS === 'web' ? localStorage : AsyncStorage;
      const data = await storage.getItem('userData');
      if (data) {
        return JSON.parse(data) as UserData;
      }
      return null;
    } catch (error) {
      console.error('Error loading user data:', error);
      return rejectWithValue('Failed to load user data');
    }
  }
);

// Async thunk to save user data to storage
export const saveUserData = createAsyncThunk(
  'user/saveUserData',
  async (userData: UserData | null, { rejectWithValue }) => {
    try {
      const storage = Platform.OS === 'web' ? localStorage : AsyncStorage;
      if (userData) {
        await storage.setItem('userData', JSON.stringify(userData));
      } else {
        await storage.removeItem('userData');
      }
      return userData;
    } catch (error) {
      console.error('Error saving user data:', error);
      return rejectWithValue('Failed to save user data');
    }
  }
);

// Async thunk to update user data
export const updateUserData = createAsyncThunk(
  'user/updateUserData',
  async (newData: Partial<UserData>, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { user: UserState };
      const currentUserData = state.user.userData;
      if (!currentUserData) {
        return rejectWithValue('No user data to update');
      }
      
      const updatedData = { ...currentUserData, ...newData };
      const storage = Platform.OS === 'web' ? localStorage : AsyncStorage;
      await storage.setItem('userData', JSON.stringify(updatedData));
      return updatedData;
    } catch (error) {
      console.error('Error updating user data:', error);
      return rejectWithValue('Failed to update user data');
    }
  }
);

// Async thunk to clear user data
export const clearUserData = createAsyncThunk(
  'user/clearUserData',
  async (_, { rejectWithValue }) => {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem('userData');
      } else {
        await AsyncStorage.removeItem('userData');
      }
      return null;
    } catch (error) {
      console.error('Error clearing user data:', error);
      return rejectWithValue('Failed to clear user data');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load user data
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
      // Save user data
      .addCase(saveUserData.fulfilled, (state, action) => {
        state.userData = action.payload;
      })
      // Update user data
      .addCase(updateUserData.fulfilled, (state, action) => {
        state.userData = action.payload;
      })
      // Clear user data
      .addCase(clearUserData.fulfilled, (state) => {
        state.userData = null;
      });
  },
});

export const { setIsLoading } = userSlice.actions;
export default userSlice.reducer;
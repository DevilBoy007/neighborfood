import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { ThemePresetName, DEFAULT_THEME_PRESET } from '@/constants/Colors';

type ThemeState = {
  currentPreset: ThemePresetName;
  isLoading: boolean;
  // Map of userId to theme preference for multi-user support
  userThemes: Record<string, ThemePresetName>;
};

const initialState: ThemeState = {
  currentPreset: DEFAULT_THEME_PRESET,
  isLoading: false,
  userThemes: {},
};

// Storage key prefix for user-specific theme preferences
const THEME_STORAGE_KEY_PREFIX = 'theme_preset_';
const USER_THEMES_STORAGE_KEY = 'user_themes_map';

// Helper to get storage - lazily evaluated with guard for bundling
const getStorage = () => {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
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

/**
 * Load user themes map from storage
 */
export const loadUserThemes = createAsyncThunk('theme/loadUserThemes', async () => {
  const storage = getStorage();
  const data = await storage.getItem(USER_THEMES_STORAGE_KEY);
  if (data) {
    return JSON.parse(data) as Record<string, ThemePresetName>;
  }
  return {};
});

/**
 * Load theme preference for a specific user
 */
export const loadUserTheme = createAsyncThunk(
  'theme/loadUserTheme',
  async (userId: string | null) => {
    if (!userId) {
      // No user logged in, use default theme
      return { userId: null, preset: DEFAULT_THEME_PRESET };
    }

    const storage = getStorage();
    const key = THEME_STORAGE_KEY_PREFIX + userId;
    const data = await storage.getItem(key);

    if (data) {
      return { userId, preset: data as ThemePresetName };
    }

    return { userId, preset: DEFAULT_THEME_PRESET };
  }
);

/**
 * Save theme preference for a specific user
 */
export const saveUserTheme = createAsyncThunk(
  'theme/saveUserTheme',
  async ({ userId, preset }: { userId: string | null; preset: ThemePresetName }) => {
    const storage = getStorage();

    if (userId) {
      // Save user-specific theme preference
      const key = THEME_STORAGE_KEY_PREFIX + userId;
      await storage.setItem(key, preset);

      // Update user themes map
      const mapData = await storage.getItem(USER_THEMES_STORAGE_KEY);
      const userThemes = mapData ? JSON.parse(mapData) : {};
      userThemes[userId] = preset;
      await storage.setItem(USER_THEMES_STORAGE_KEY, JSON.stringify(userThemes));
    }

    return { userId, preset };
  }
);

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setThemePreset: (state, action: PayloadAction<ThemePresetName>) => {
      state.currentPreset = action.payload;
    },
    setCurrentUserTheme: (
      state,
      action: PayloadAction<{ userId: string | null; preset: ThemePresetName }>
    ) => {
      const { userId, preset } = action.payload;
      state.currentPreset = preset;
      if (userId) {
        state.userThemes[userId] = preset;
      }
    },
    resetToDefaultTheme: (state) => {
      state.currentPreset = DEFAULT_THEME_PRESET;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserThemes.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUserThemes.fulfilled, (state, action) => {
        state.userThemes = action.payload;
        state.isLoading = false;
      })
      .addCase(loadUserThemes.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(loadUserTheme.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadUserTheme.fulfilled, (state, action) => {
        const { userId, preset } = action.payload;
        state.currentPreset = preset;
        if (userId) {
          state.userThemes[userId] = preset;
        }
        state.isLoading = false;
      })
      .addCase(loadUserTheme.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(saveUserTheme.fulfilled, (state, action) => {
        const { userId, preset } = action.payload;
        state.currentPreset = preset;
        if (userId) {
          state.userThemes[userId] = preset;
        }
      });
  },
});

export const { setThemePreset, setCurrentUserTheme, resetToDefaultTheme } = themeSlice.actions;
export default themeSlice.reducer;

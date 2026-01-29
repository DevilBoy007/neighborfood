import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  ThemePresetName,
  DEFAULT_THEME_PRESET,
  ThemePresets,
  getThemePresetNames,
} from '@/constants/Colors';

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
    // Wrap localStorage methods in Promises to match AsyncStorage API
    return {
      getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
      setItem: (key: string, value: string) => {
        localStorage.setItem(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        localStorage.removeItem(key);
        return Promise.resolve();
      },
    };
  }
  return AsyncStorage;
};

/**
 * Validate if a string is a valid theme preset name
 */
const isValidThemePreset = (preset: string | null): preset is ThemePresetName => {
  if (!preset) return false;
  return getThemePresetNames().includes(preset as ThemePresetName);
};

/**
 * Safely parse JSON with error handling
 */
const safeJsonParse = <T>(data: string | null, fallback: T): T => {
  if (!data) return fallback;
  try {
    return JSON.parse(data) as T;
  } catch {
    console.warn('Failed to parse stored theme data, using default');
    return fallback;
  }
};

/**
 * Load user themes map from storage
 */
export const loadUserThemes = createAsyncThunk('theme/loadUserThemes', async () => {
  const storage = getStorage();
  const data = await storage.getItem(USER_THEMES_STORAGE_KEY);
  return safeJsonParse<Record<string, ThemePresetName>>(data, {});
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

    // Validate the loaded preset
    const preset = isValidThemePreset(data) ? data : DEFAULT_THEME_PRESET;

    return { userId, preset };
  }
);

/**
 * Save theme preference for a specific user
 */
export const saveUserTheme = createAsyncThunk(
  'theme/saveUserTheme',
  async ({ userId, preset }: { userId: string | null; preset: ThemePresetName }) => {
    // Validate the preset before saving
    if (!isValidThemePreset(preset)) {
      throw new Error(`Invalid theme preset: ${preset}`);
    }

    const storage = getStorage();

    if (userId) {
      // Save user-specific theme preference
      const key = THEME_STORAGE_KEY_PREFIX + userId;
      await storage.setItem(key, preset);

      // Update user themes map
      const mapData = await storage.getItem(USER_THEMES_STORAGE_KEY);
      const userThemes = safeJsonParse<Record<string, ThemePresetName>>(mapData, {});
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
      })
      .addCase(saveUserTheme.rejected, (state, action) => {
        // Log error but keep current state - UI already shows the selected theme
        console.warn('Failed to save theme preference:', action.error.message);
      });
  },
});

export const { setThemePreset, setCurrentUserTheme, resetToDefaultTheme } = themeSlice.actions;
export default themeSlice.reducer;

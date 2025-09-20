import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { ThemePresets } from '@/constants/Colors';

export type ThemePresetName = keyof typeof ThemePresets;
export type ThemeColors = typeof ThemePresets.default;

interface ThemeContextType {
  currentPreset: ThemePresetName;
  colors: ThemeColors;
  setThemePreset: (preset: ThemePresetName) => void;
  availablePresets: ThemePresetName[];
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@neighborfood_theme_preset';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [currentPreset, setCurrentPreset] = useState<ThemePresetName>('default');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on app start
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedPreset = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedPreset && savedPreset in ThemePresets) {
          setCurrentPreset(savedPreset as ThemePresetName);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  const setThemePreset = async (preset: ThemePresetName) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, preset);
      setCurrentPreset(preset);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const contextValue: ThemeContextType = {
    currentPreset,
    colors: ThemePresets[currentPreset],
    setThemePreset,
    availablePresets: Object.keys(ThemePresets) as ThemePresetName[],
    isDarkMode: systemColorScheme === 'dark',
  };

  // Don't render children until theme is loaded
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper hook to get a specific color with fallback to theme colors
export const useThemeColors = () => {
  const { colors, isDarkMode } = useTheme();
  
  return {
    ...colors,
    // Provide easy access to commonly used colors
    get background() {
      return isDarkMode ? '#151718' : colors.white;
    },
    get text() {
      return isDarkMode ? '#ECEDEE' : '#11181C';
    },
    get border() {
      return isDarkMode ? colors.gray700 : colors.gray300;
    },
    get placeholder() {
      return colors.gray600;
    },
  };
};
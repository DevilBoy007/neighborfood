/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

// Define theme presets with all app colors
export const ThemePresets = {
  default: {
    primary: '#00bfff',        // Main blue color used throughout the app
    primaryLight: '#40C4FF',   // Lighter variant of primary
    secondary: '#b7ffb0',      // Main green background color
    secondaryLight: '#c2f7d7', // Lighter green variant
    success: '#4CAF50',        // Success green
    warning: '#FF9800',        // Warning orange
    error: '#f44336',          // Error red
    danger: '#FF6B6B',         // Danger red variant
    info: '#2196F3',           // Info blue
    // Neutral colors
    white: '#fff',
    black: '#000',
    gray100: '#f9f9f9',
    gray200: '#f0f0f0',
    gray300: '#eee',
    gray400: '#ddd',
    gray500: '#ccc',
    gray600: '#999',
    gray700: '#666',
    gray800: '#555',
    gray900: '#333',
  },
  ocean: {
    primary: '#006994',        // Deep ocean blue
    primaryLight: '#0099CC',   // Lighter ocean blue
    secondary: '#E0F6FF',      // Light ocean background
    secondaryLight: '#F0FAFF', // Very light ocean
    success: '#00A86B',        // Ocean green
    warning: '#FF8C00',        // Ocean orange
    error: '#DC143C',          // Ocean red
    danger: '#FF4500',         // Ocean danger
    info: '#4682B4',           // Steel blue
    // Neutral colors
    white: '#fff',
    black: '#000',
    gray100: '#f8fcff',
    gray200: '#e8f4f8', 
    gray300: '#d4edda',
    gray400: '#c3e6cb',
    gray500: '#b8daff',
    gray600: '#86b7fe',
    gray700: '#4c9ac1',
    gray800: '#2c5f7a',
    gray900: '#1a3f52',
  },
  sunset: {
    primary: '#FF6B35',        // Sunset orange
    primaryLight: '#FF8C69',   // Light sunset orange
    secondary: '#FFF3E0',      // Light sunset background
    secondaryLight: '#FFF8F0', // Very light sunset
    success: '#8BC34A',        // Sunset green
    warning: '#FFC107',        // Sunset yellow
    error: '#E91E63',          // Sunset pink
    danger: '#F44336',         // Sunset red
    info: '#9C27B0',           // Sunset purple
    // Neutral colors
    white: '#fff',
    black: '#000',
    gray100: '#fffaf7',
    gray200: '#fef5f0',
    gray300: '#fed7c5',
    gray400: '#fdc5a3',
    gray500: '#fcb280',
    gray600: '#fa9f5e',
    gray700: '#e8884a',
    gray800: '#cc7136',
    gray900: '#994b28',
  }
};

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // App-specific colors (using default theme)
    primary: ThemePresets.default.primary,
    primaryLight: ThemePresets.default.primaryLight,
    secondary: ThemePresets.default.secondary,
    secondaryLight: ThemePresets.default.secondaryLight,
    success: ThemePresets.default.success,
    warning: ThemePresets.default.warning,
    error: ThemePresets.default.error,
    danger: ThemePresets.default.danger,
    info: ThemePresets.default.info,
    white: ThemePresets.default.white,
    black: ThemePresets.default.black,
    gray100: ThemePresets.default.gray100,
    gray200: ThemePresets.default.gray200,
    gray300: ThemePresets.default.gray300,
    gray400: ThemePresets.default.gray400,
    gray500: ThemePresets.default.gray500,
    gray600: ThemePresets.default.gray600,
    gray700: ThemePresets.default.gray700,
    gray800: ThemePresets.default.gray800,
    gray900: ThemePresets.default.gray900,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // App-specific colors (adapted for dark mode)
    primary: '#40C4FF',
    primaryLight: '#87CEFA',
    secondary: '#2d5a2d',      // Darker green for dark mode
    secondaryLight: '#3d6a3d',
    success: '#66BB6A',
    warning: '#FFB74D',
    error: '#EF5350',
    danger: '#FF8A80',
    info: '#42A5F5',
    white: '#fff',
    black: '#000',
    gray100: '#2a2a2a',
    gray200: '#333333',
    gray300: '#404040',
    gray400: '#4d4d4d',
    gray500: '#5a5a5a',
    gray600: '#808080',
    gray700: '#999999',
    gray800: '#b3b3b3',
    gray900: '#cccccc',
  },
};

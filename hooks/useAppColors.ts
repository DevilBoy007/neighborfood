/**
 * Utility hook for easily accessing app theme colors
 * This hook provides convenient access to theme colors with fallbacks
 * for easy migration from hardcoded colors
 */

import { useThemeColors } from '@/context/themeContext';

export const useAppColors = () => {
  const themeColors = useThemeColors();

  return {
    // Main app colors
    primary: themeColors.primary,           // Replaces: #00bfff
    primaryLight: themeColors.primaryLight, // Replaces: #40C4FF, #87CEFA
    secondary: themeColors.secondary,       // Replaces: #b7ffb0, #B7FFB0
    secondaryLight: themeColors.secondaryLight,
    
    // Status colors
    success: themeColors.success,           // Replaces: #4CAF50
    warning: themeColors.warning,           // Replaces: #FF9800, #FFD166
    error: themeColors.error,               // Replaces: #f44336, #ff4d4d, #ff0000
    danger: themeColors.danger,             // Replaces: #FF6B6B
    info: themeColors.info,                 // Replaces: #2196F3
    
    // Neutral colors
    white: themeColors.white,               // Replaces: #fff, #ffffff, #FFFFFF
    black: themeColors.black,               // Replaces: #000
    
    // Gray scale (most frequently used)
    gray100: themeColors.gray100,           // Replaces: #f9f9f9
    gray200: themeColors.gray200,           // Replaces: #f0f0f0
    gray300: themeColors.gray300,           // Replaces: #eee
    gray400: themeColors.gray400,           // Replaces: #ddd
    gray500: themeColors.gray500,           // Replaces: #ccc
    gray600: themeColors.gray600,           // Replaces: #999
    gray700: themeColors.gray700,           // Replaces: #666
    gray800: themeColors.gray800,           // Replaces: #555
    gray900: themeColors.gray900,           // Replaces: #333, #333333
    
    // Convenience aliases for common use cases
    get backgroundColor() {
      return this.secondary;
    },
    get textColor() {
      return themeColors.text;
    },
    get placeholderColor() {
      return themeColors.placeholder;
    },
    get borderColor() {
      return themeColors.border;
    },
    get buttonColor() {
      return this.primary;
    },
    get buttonTextColor() {
      return this.white;
    },
  };
};

// Color mapping guide for migration
export const ColorMigrationGuide = {
  '#00bfff': 'primary',
  '#40C4FF': 'primaryLight', 
  '#87CEFA': 'primaryLight',
  '#b7ffb0': 'secondary',
  '#B7FFB0': 'secondary',
  '#4CAF50': 'success',
  '#FF9800': 'warning',
  '#FFD166': 'warning',
  '#f44336': 'error',
  '#ff4d4d': 'error',
  '#FF6B6B': 'danger',
  '#2196F3': 'info',
  '#fff': 'white',
  '#ffffff': 'white',
  '#FFFFFF': 'white',
  '#000': 'black',
  '#f9f9f9': 'gray100',
  '#f0f0f0': 'gray200',
  '#eee': 'gray300',
  '#ddd': 'gray400',
  '#ccc': 'gray500',
  '#999': 'gray600',
  '#666': 'gray700',
  '#555': 'gray800',
  '#333': 'gray900',
  '#333333': 'gray900',
} as const;
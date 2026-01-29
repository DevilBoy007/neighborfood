/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

/**
 * Theme Presets for user-switchable appearance settings.
 * Each preset defines a complete color palette for the app.
 */
export type ThemePresetName = 'default' | 'simpleDark' | 'neoModern' | 'midnight' | 'spring';

export interface ThemePreset {
  name: ThemePresetName;
  displayName: string;
  description: string;
  colors: {
    // Primary colors
    primary: string;
    secondary: string;
    accent: string;
    // Background colors
    background: string;
    surface: string;
    card: string;
    // Text colors
    text: string;
    textSecondary: string;
    textMuted: string;
    textOnPrimary: string;
    // State colors
    success: string;
    warning: string;
    error: string;
    info: string;
    // UI elements
    border: string;
    divider: string;
    icon: string;
    iconMuted: string;
    // Interactive elements
    buttonPrimary: string;
    buttonSecondary: string;
    buttonDisabled: string;
    // Input elements
    inputBackground: string;
    inputBorder: string;
    placeholder: string;
  };
}

export const ThemePresets: Record<ThemePresetName, ThemePreset> = {
  default: {
    name: 'default',
    displayName: 'Default',
    description: 'The classic Neighborfood look with vibrant green and blue',
    colors: {
      // Primary colors - original app colors
      primary: '#00bfff',
      secondary: '#b7ffb0',
      accent: '#00bfff',
      // Background colors
      background: '#b7ffb0',
      surface: '#ffffff',
      card: '#ffffff',
      // Text colors
      text: '#000000',
      textSecondary: '#333333',
      textMuted: '#666666',
      textOnPrimary: '#ffffff',
      // State colors
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#ff3b30',
      info: '#2196F3',
      // UI elements
      border: '#000000',
      divider: '#e0e0e0',
      icon: '#000000',
      iconMuted: '#687076',
      // Interactive elements
      buttonPrimary: '#00bfff',
      buttonSecondary: '#b7ffb0',
      buttonDisabled: '#cccccc',
      // Input elements
      inputBackground: '#ffffff',
      inputBorder: '#000000',
      placeholder: '#ffffff',
    },
  },
  simpleDark: {
    name: 'simpleDark',
    displayName: 'Simple Dark',
    description: 'A clean, minimal dark gray theme',
    colors: {
      // Primary colors
      primary: '#6B7280',
      secondary: '#374151',
      accent: '#9CA3AF',
      // Background colors
      background: '#1F2937',
      surface: '#374151',
      card: '#4B5563',
      // Text colors
      text: '#F9FAFB',
      textSecondary: '#E5E7EB',
      textMuted: '#9CA3AF',
      textOnPrimary: '#F9FAFB',
      // State colors
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
      // UI elements
      border: '#4B5563',
      divider: '#4B5563',
      icon: '#E5E7EB',
      iconMuted: '#9CA3AF',
      // Interactive elements
      buttonPrimary: '#6B7280',
      buttonSecondary: '#4B5563',
      buttonDisabled: '#374151',
      // Input elements
      inputBackground: '#374151',
      inputBorder: '#4B5563',
      placeholder: '#9CA3AF',
    },
  },
  neoModern: {
    name: 'neoModern',
    displayName: 'Neo-Modern',
    description: 'Bold, contemporary design with purple accents',
    colors: {
      // Primary colors
      primary: '#8B5CF6',
      secondary: '#F3E8FF',
      accent: '#A78BFA',
      // Background colors
      background: '#FAFAF9',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      // Text colors
      text: '#1C1917',
      textSecondary: '#44403C',
      textMuted: '#78716C',
      textOnPrimary: '#FFFFFF',
      // State colors
      success: '#22C55E',
      warning: '#EAB308',
      error: '#DC2626',
      info: '#0EA5E9',
      // UI elements
      border: '#D6D3D1',
      divider: '#E7E5E4',
      icon: '#44403C',
      iconMuted: '#A8A29E',
      // Interactive elements
      buttonPrimary: '#8B5CF6',
      buttonSecondary: '#F3E8FF',
      buttonDisabled: '#D6D3D1',
      // Input elements
      inputBackground: '#FFFFFF',
      inputBorder: '#D6D3D1',
      placeholder: '#A8A29E',
    },
  },
  midnight: {
    name: 'midnight',
    displayName: 'Midnight',
    description: 'GitHub-inspired dark blue palette',
    colors: {
      // Primary colors - GitHub blue palette
      primary: '#58A6FF',
      secondary: '#1F6FEB',
      accent: '#79C0FF',
      // Background colors
      background: '#0D1117',
      surface: '#161B22',
      card: '#21262D',
      // Text colors
      text: '#F0F6FC',
      textSecondary: '#C9D1D9',
      textMuted: '#8B949E',
      textOnPrimary: '#0D1117',
      // State colors
      success: '#3FB950',
      warning: '#D29922',
      error: '#F85149',
      info: '#58A6FF',
      // UI elements
      border: '#30363D',
      divider: '#21262D',
      icon: '#C9D1D9',
      iconMuted: '#8B949E',
      // Interactive elements
      buttonPrimary: '#238636',
      buttonSecondary: '#21262D',
      buttonDisabled: '#30363D',
      // Input elements
      inputBackground: '#0D1117',
      inputBorder: '#30363D',
      placeholder: '#8B949E',
    },
  },
  spring: {
    name: 'spring',
    displayName: 'Spring',
    description: 'Fresh, warm colors inspired by springtime',
    colors: {
      // Primary colors
      primary: '#FB923C',
      secondary: '#FEF3C7',
      accent: '#F97316',
      // Background colors
      background: '#FFFBEB',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      // Text colors
      text: '#451A03',
      textSecondary: '#78350F',
      textMuted: '#92400E',
      textOnPrimary: '#FFFFFF',
      // State colors
      success: '#84CC16',
      warning: '#FACC15',
      error: '#DC2626',
      info: '#0EA5E9',
      // UI elements
      border: '#FDE68A',
      divider: '#FEF3C7',
      icon: '#78350F',
      iconMuted: '#A16207',
      // Interactive elements
      buttonPrimary: '#FB923C',
      buttonSecondary: '#FEF3C7',
      buttonDisabled: '#FDE68A',
      // Input elements
      inputBackground: '#FFFFFF',
      inputBorder: '#FDE68A',
      placeholder: '#D97706',
    },
  },
};

// Default theme preset
export const DEFAULT_THEME_PRESET: ThemePresetName = 'default';

/**
 * Get a theme preset by name
 */
export function getThemePreset(name: ThemePresetName): ThemePreset {
  return ThemePresets[name] || ThemePresets.default;
}

/**
 * Get all available theme preset names
 */
export function getThemePresetNames(): ThemePresetName[] {
  return Object.keys(ThemePresets) as ThemePresetName[];
}

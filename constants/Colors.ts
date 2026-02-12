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
export type ThemePresetName = 'default' | 'simpleDark' | 'lilac' | 'midnight' | 'fall';

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
    buttonText: string;
    buttonPrimary: string;
    buttonPrimaryAlternate: string;
    buttonSecondary: string;
    buttonDisabled: string;
    // Input elements
    inputBackground: string;
    inputBorder: string;
    placeholder: string;
    // Navigation elements
    navBackground: string;
    navIcon: string;
    navText: string;
    stickyBackButton: string;
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
      textMuted: '#333',
      textOnPrimary: '#00bfff',
      // State colors
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#ff3b30',
      info: '#2196F3',
      // UI elements
      border: '#000000',
      divider: '#ffffff9f',
      icon: '#000000',
      iconMuted: '#687076',
      // Interactive elements
      buttonText: '#ffffff',
      buttonPrimary: '#00bfff',
      buttonPrimaryAlternate: '#87cefa',
      buttonSecondary: '#b7ffb0',
      buttonDisabled: '#cccccc',
      // Input elements
      inputBackground: '#ffffff',
      inputBorder: '#000000',
      placeholder: '#999',
      // Navigation elements
      navBackground: '#87CEFA',
      navIcon: '#000000',
      navText: '#00bfff',
      stickyBackButton: '#ffffffb3',
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
      textMuted: '#3b83f6',
      textOnPrimary: '#fff',
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
      // Interactive elements,
      buttonText: '#F9FAFB',
      buttonPrimary: '#6B7280',
      buttonPrimaryAlternate: '#9CA3AF',
      buttonSecondary: '#4B5563',
      buttonDisabled: '#374151',
      // Input elements
      inputBackground: '#374151',
      inputBorder: '#4B5563',
      placeholder: '#9CA3AF',
      // Navigation elements
      navBackground: '#111827',
      navIcon: '#E5E7EB',
      navText: '#E5E7EB',
      stickyBackButton: '#666666b3',
    },
  },
  lilac: {
    name: 'lilac',
    displayName: 'Lilac',
    description: 'Bold, contemporary design with purple accents',
    colors: {
      // Primary colors
      primary: '#8B5CF6',
      secondary: '#F3E8FF',
      accent: '#A78BFA',
      // Background colors
      background: '#D75CF6',
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
      error: '#673232',
      info: '#0EA5E9',
      // UI elements
      border: '#26066F',
      divider: '#ffffff9f',
      icon: '#44403C',
      iconMuted: '#26066F',
      // Interactive elements
      buttonText: '#FFFFFF',
      buttonPrimary: '#8B5CF6',
      buttonPrimaryAlternate: '#A78BFA',
      buttonSecondary: '#F3E8FF',
      buttonDisabled: '#D6D3D1',
      // Input elements
      inputBackground: '#FFFFFF',
      inputBorder: '#D6D3D1',
      placeholder: '#26066F',
      // Navigation elements
      navBackground: '#A78BFA',
      navIcon: '#44403C',
      navText: '#1C1917',
      stickyBackButton: '#ffffffb3',
    },
  },
  midnight: {
    name: 'midnight',
    displayName: 'Midnight',
    description: 'GitHub-inspired dark blue palette',
    colors: {
      // Primary colors - GitHub blue palette
      primary: '#1F6FEB',
      secondary: '#58A6FF',
      accent: '#79C0FF',
      // Background colors
      background: '#0D1117',
      surface: '#161B22',
      card: '#21262D',
      // Text colors
      text: '#F0F6FC',
      textSecondary: '#C9D1D9',
      textMuted: '#8B949E',
      textOnPrimary: '#fff',
      // State colors
      success: '#3FB950',
      warning: '#D29922',
      error: '#F85149',
      info: '#58A6FF',
      // UI elements
      border: '#1F6FEB',
      divider: '#21262D',
      icon: '#C9D1D9',
      iconMuted: '#8B949E',
      // Interactive elements
      buttonText: '#FFFFFF',
      buttonPrimary: '#1f6feb',
      buttonPrimaryAlternate: '#58A6FF',
      buttonSecondary: '#21262D',
      buttonDisabled: '#30363D',
      // Input elements
      inputBackground: '#1c2430',
      inputBorder: '#30363D',
      placeholder: '#8B949E',
      // Navigation elements
      navBackground: '#010409',
      navIcon: '#58A6FF',
      navText: '#F0F6FC',
      stickyBackButton: '#79C0FFb3',
    },
  },
  fall: {
    name: 'fall',
    displayName: 'Fall',
    description: 'Fresh, warm colors inspired by Autumn',
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
      textOnPrimary: '#451A03',
      // State colors
      success: '#84CC16',
      warning: '#FACC15',
      error: '#DC2626',
      info: '#0EA5E9',
      // UI elements
      border: '#78350F',
      divider: '#FEF3C7',
      icon: '#78350F',
      iconMuted: '#A16207',
      // Interactive elements
      buttonText: '#451A03',
      buttonPrimary: '#FB923C',
      buttonPrimaryAlternate: '#FBBF24',
      buttonSecondary: '#FEF3C7',
      buttonDisabled: '#FDE68A',
      // Input elements
      inputBackground: '#FFFFFF',
      inputBorder: '#FDE68A',
      placeholder: '#D97706',
      // Navigation elements
      navBackground: '#FBBF24',
      navIcon: '#78350F',
      navText: '#451A03',
      stickyBackButton: '#ffffffb3',
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

# NeighborFood Theme System

The NeighborFood app now includes a comprehensive theme system that allows users to easily switch between different color presets and provides developers with a unified approach to colors throughout the app.

## Features

- **Multiple Theme Presets**: Default, Ocean, and Sunset themes
- **User-Controlled**: Users can switch themes through the Settings screen
- **Persistent**: Theme choices are saved locally and restored on app restart
- **Type-Safe**: Full TypeScript support with proper typing
- **Backward Compatible**: Existing code continues to work while new code can opt into the theme system

## Available Theme Presets

### Default Theme
The original NeighborFood colors:
- Primary: `#00bfff` (cyan blue)
- Secondary: `#b7ffb0` (light green)
- Success: `#4CAF50` (green)

### Ocean Theme
A blue-based theme:
- Primary: `#006994` (deep blue)
- Secondary: `#E0F6FF` (very light blue)
- Success: `#00A86B` (ocean green)

### Sunset Theme
A warm orange-based theme:
- Primary: `#FF6B35` (sunset orange)
- Secondary: `#FFF3E0` (warm cream)
- Success: `#8BC34A` (lime green)

## Usage for Developers

### Quick Start

```tsx
import { useAppColors } from '@/hooks/useAppColors';

const MyComponent = () => {
  const colors = useAppColors();
  
  return (
    <View style={{ backgroundColor: colors.secondary }}>
      <Text style={{ color: colors.textColor }}>Hello World</Text>
      <TouchableOpacity 
        style={{ backgroundColor: colors.primary }}
        onPress={() => {}}
      >
        <Text style={{ color: colors.white }}>Button</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### Advanced Usage

```tsx
import { useTheme, useThemeColors } from '@/context/themeContext';

const MyComponent = () => {
  const { currentPreset, setThemePreset } = useTheme();
  const themeColors = useThemeColors();
  
  // Switch themes programmatically
  const switchToOcean = () => setThemePreset('ocean');
  
  return (
    <View style={{ backgroundColor: themeColors.background }}>
      <Text>Current theme: {currentPreset}</Text>
    </View>
  );
};
```

### Available Colors

The theme system provides these color categories:

#### Main App Colors
- `primary` - Main brand color (replaces #00bfff)
- `primaryLight` - Lighter variant (replaces #40C4FF, #87CEFA)
- `secondary` - Background color (replaces #b7ffb0)
- `secondaryLight` - Lighter background variant

#### Status Colors
- `success` - Success states (replaces #4CAF50)
- `warning` - Warning states (replaces #FF9800)
- `error` - Error states (replaces #f44336)
- `danger` - Danger/delete actions (replaces #FF6B6B)
- `info` - Information states (replaces #2196F3)

#### Neutral Colors
- `white` - Pure white (replaces #fff)
- `black` - Pure black (replaces #000)
- `gray100` through `gray900` - Complete gray scale

#### Convenience Properties
- `backgroundColor` - Alias for secondary
- `textColor` - Theme-appropriate text color
- `placeholderColor` - Input placeholder color
- `borderColor` - Theme-appropriate border color
- `buttonColor` - Alias for primary
- `buttonTextColor` - Alias for white

## Migration Guide

### Step 1: Import the hook
```tsx
import { useAppColors } from '@/hooks/useAppColors';
```

### Step 2: Use the hook in your component
```tsx
const colors = useAppColors();
```

### Step 3: Replace hardcoded colors
```tsx
// Before
<View style={{ backgroundColor: '#b7ffb0' }}>

// After  
<View style={{ backgroundColor: colors.secondary }}>
```

### Common Color Mappings
- `#00bfff` → `colors.primary`
- `#b7ffb0` → `colors.secondary` 
- `#fff` → `colors.white`
- `#000` → `colors.black`
- `#999` → `colors.gray600`
- `#666` → `colors.gray700`
- `#333` → `colors.gray900`

## User Experience

Users can access theme switching through:
1. Open the app Settings (gear icon)
2. Scroll to the "App Theme" section
3. Tap on any theme to switch instantly
4. The choice is automatically saved

## Implementation Details

### Theme Context
The `ThemeProvider` wraps the entire app and provides:
- Current theme preset
- Theme switching function
- Available presets list
- Theme persistence via AsyncStorage

### Theme Selector Component
The `ThemeSelector` component provides:
- Visual preview of each theme's colors
- One-tap switching
- Active theme indication
- Responsive design

### Backward Compatibility
- Existing `useThemeColor` hook continues to work
- All existing hardcoded colors continue to function
- Gradual migration is supported

## Best Practices

1. **Use semantic names**: Prefer `colors.primary` over specific color values
2. **Test all themes**: Ensure your components work with all theme presets
3. **Provide fallbacks**: Use the convenience properties when appropriate
4. **Consider accessibility**: All themes maintain good contrast ratios
5. **Document color usage**: When adding new colors, document their purpose

## Adding New Themes

To add a new theme preset:

1. Add the new theme to `ThemePresets` in `constants/Colors.ts`
2. Update the `ThemePresetName` type in `context/themeContext.tsx`
3. Add display name to `ThemeSelector.tsx`
4. Test with existing components

Example:
```tsx
forest: {
  primary: '#2E7D32',
  secondary: '#E8F5E8', 
  // ... other colors
}
```

## Tips for Developers

- Use the `useAppColors` hook for most use cases
- Use `useTheme` when you need theme switching functionality
- Test your components with all available themes
- Consider using dynamic styles instead of static StyleSheet when colors need to be theme-aware
- The theme system automatically handles light/dark mode compatibility
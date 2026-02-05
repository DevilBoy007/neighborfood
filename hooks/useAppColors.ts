/**
 * Hook to access the current theme colors.
 * This provides an easy way to use theme-aware colors throughout the app.
 */

import { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import { ThemePresets, ThemePreset, ThemePresetName } from '@/constants/Colors';

/**
 * Returns the current theme preset's colors
 */
export function useAppColors(): ThemePreset['colors'] {
  const currentPreset = useAppSelector((state) => state.theme?.currentPreset ?? 'default');

  const colors = useMemo(() => {
    return ThemePresets[currentPreset]?.colors ?? ThemePresets.default.colors;
  }, [currentPreset]);

  return colors;
}

/**
 * Returns the current theme preset name and the full preset object
 */
export function useThemePreset(): { presetName: ThemePresetName; preset: ThemePreset } {
  const currentPreset = useAppSelector((state) => state.theme?.currentPreset ?? 'default');

  const preset = useMemo(() => {
    return ThemePresets[currentPreset] ?? ThemePresets.default;
  }, [currentPreset]);

  return { presetName: currentPreset as ThemePresetName, preset };
}

/**
 * Returns just the current theme preset name
 */
export function useCurrentThemePresetName(): ThemePresetName {
  const currentPreset = useAppSelector((state) => state.theme?.currentPreset ?? 'default');
  return currentPreset as ThemePresetName;
}

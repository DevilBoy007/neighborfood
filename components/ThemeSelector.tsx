import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemePresets, ThemePresetName, getThemePresetNames } from '@/constants/Colors';
import { useTheme } from '@/store/reduxHooks';
import { useAppColors } from '@/hooks/useAppColors';

interface ThemePreviewProps {
  presetName: ThemePresetName;
  isSelected: boolean;
  onSelect: (name: ThemePresetName) => void;
}

const ThemePreview: React.FC<ThemePreviewProps> = ({ presetName, isSelected, onSelect }) => {
  const preset = ThemePresets[presetName];
  const colors = useAppColors();

  return (
    <TouchableOpacity
      style={[
        styles.previewCard,
        {
          borderColor: isSelected ? colors.primary : colors.border,
          borderWidth: isSelected ? 3 : 1,
          backgroundColor: preset.colors.surface,
        },
      ]}
      onPress={() => onSelect(presetName)}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${preset.displayName} theme. ${preset.description}`}
      accessibilityState={{ selected: isSelected }}
      accessibilityHint={
        isSelected ? 'Currently selected theme' : 'Double tap to select this theme'
      }
    >
      {/* Color swatches */}
      <View style={styles.swatchRow} accessibilityElementsHidden>
        <View style={[styles.swatch, { backgroundColor: preset.colors.primary }]} />
        <View style={[styles.swatch, { backgroundColor: preset.colors.secondary }]} />
        <View style={[styles.swatch, { backgroundColor: preset.colors.accent }]} />
        <View style={[styles.swatch, { backgroundColor: preset.colors.background }]} />
      </View>

      {/* Theme name and description */}
      <Text style={[styles.previewTitle, { color: preset.colors.text }]}>{preset.displayName}</Text>
      <Text style={[styles.previewDescription, { color: preset.colors.textMuted }]}>
        {preset.description}
      </Text>

      {/* Selected indicator */}
      {isSelected && (
        <View style={[styles.selectedBadge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.selectedText, { color: colors.textOnPrimary }]}>Current</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

/**
 * Props for the ThemeSelector component.
 */
interface ThemeSelectorProps {
  /**
   * Optional callback function called when the user closes the selector.
   * When provided, a "Done" button will be displayed.
   */
  onClose?: () => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onClose }) => {
  const { currentPreset, setThemePreset } = useTheme();
  const colors = useAppColors();
  const presetNames = getThemePresetNames();

  const handleSelectTheme = async (presetName: ThemePresetName) => {
    await setThemePreset(presetName);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]} accessibilityRole="header">
          Appearance
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Choose a color theme for the app
        </Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.themesGrid} accessibilityRole="radiogroup">
          {presetNames.map((presetName) => (
            <ThemePreview
              key={presetName}
              presetName={presetName}
              isSelected={currentPreset === presetName}
              onSelect={handleSelectTheme}
            />
          ))}
        </View>
      </ScrollView>

      {onClose && (
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: colors.buttonPrimary }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Done"
          accessibilityHint="Close the appearance settings"
        >
          <Text style={[styles.closeButtonText, { color: colors.textOnPrimary }]}>Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: 'TitanOne',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'TextMeOne',
  },
  scrollContainer: {
    flex: 1,
  },
  themesGrid: {
    paddingBottom: 20,
  },
  previewCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  swatchRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  previewTitle: {
    fontSize: 20,
    fontFamily: 'TextMeOne',
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 14,
    fontFamily: 'TextMeOne',
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedText: {
    fontSize: 12,
    fontFamily: 'TextMeOne',
    fontWeight: '600',
  },
  closeButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    fontSize: 18,
    fontFamily: 'TextMeOne',
    fontWeight: '600',
  },
});

export default ThemeSelector;

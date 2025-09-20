import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTheme, ThemePresetName } from '@/context/themeContext';
import { ThemePresets } from '@/constants/Colors';

interface ThemeSelectorProps {
  style?: any;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ style }) => {
  const { currentPreset, setThemePreset, availablePresets, colors } = useTheme();

  const themeDisplayNames: Record<ThemePresetName, string> = {
    default: 'Default',
    ocean: 'Ocean',
    sunset: 'Sunset',
  };

  const handleThemeChange = (preset: ThemePresetName) => {
    setThemePreset(preset);
    Alert.alert(
      'Theme Changed',
      `Switched to ${themeDisplayNames[preset]} theme`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.gray100 }, style]}>
      <Text style={[styles.title, { color: colors.gray900 }]}>App Theme</Text>
      <Text style={[styles.subtitle, { color: colors.gray700 }]}>
        Choose your preferred color scheme
      </Text>
      
      <View style={styles.themeGrid}>
        {availablePresets.map((preset) => {
          const presetColors = ThemePresets[preset];
          return (
            <TouchableOpacity
              key={preset}
              style={[
                styles.themeOption,
                { 
                  backgroundColor: colors.white,
                  borderColor: currentPreset === preset ? colors.primary : colors.gray300,
                  borderWidth: currentPreset === preset ? 2 : 1,
                }
              ]}
              onPress={() => handleThemeChange(preset)}
            >
              <View style={styles.colorPreview}>
                <View 
                  style={[
                    styles.colorSwatch, 
                    { backgroundColor: presetColors.primary }
                  ]} 
                />
                <View 
                  style={[
                    styles.colorSwatch, 
                    { backgroundColor: presetColors.secondary }
                  ]} 
                />
                <View 
                  style={[
                    styles.colorSwatch, 
                    { backgroundColor: presetColors.success }
                  ]} 
                />
              </View>
              <Text 
                style={[
                  styles.themeName,
                  { 
                    color: currentPreset === preset ? colors.primary : colors.gray700,
                    fontWeight: currentPreset === preset ? '600' : 'normal'
                  }
                ]}
              >
                {themeDisplayNames[preset]}
              </Text>
              {currentPreset === preset && (
                <Text style={[styles.activeIndicator, { color: colors.primary }]}>
                  ✓ Active
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 12,
    marginVertical: 10,
  },
  title: {
    fontSize: 18,
    fontFamily: 'TextMeOne',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 15,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  themeOption: {
    width: '48%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  colorPreview: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 2,
  },
  themeName: {
    fontSize: 16,
    fontFamily: 'TextMeOne',
    textAlign: 'center',
  },
  activeIndicator: {
    fontSize: 12,
    marginTop: 5,
    fontWeight: '600',
  },
});

export default ThemeSelector;
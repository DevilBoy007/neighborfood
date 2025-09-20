import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppColors } from '@/hooks/useAppColors';
import ThemeSelector from '@/components/ThemeSelector';

export default function ThemeDemo() {
  const colors = useAppColors();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.secondary }]}>
      <Text style={[styles.title, { color: colors.black }]}>Theme System Demo</Text>
      
      {/* Theme Selector */}
      <ThemeSelector />
      
      {/* Color Showcase */}
      <View style={[styles.section, { backgroundColor: colors.white }]}>
        <Text style={[styles.sectionTitle, { color: colors.black }]}>Color Showcase</Text>
        
        <View style={styles.colorRow}>
          <View style={[styles.colorBox, { backgroundColor: colors.primary }]}>
            <Text style={[styles.colorLabel, { color: colors.white }]}>Primary</Text>
          </View>
          <View style={[styles.colorBox, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.colorLabel, { color: colors.white }]}>Primary Light</Text>
          </View>
        </View>
        
        <View style={styles.colorRow}>
          <View style={[styles.colorBox, { backgroundColor: colors.success }]}>
            <Text style={[styles.colorLabel, { color: colors.white }]}>Success</Text>
          </View>
          <View style={[styles.colorBox, { backgroundColor: colors.warning }]}>
            <Text style={[styles.colorLabel, { color: colors.white }]}>Warning</Text>
          </View>
        </View>
        
        <View style={styles.colorRow}>
          <View style={[styles.colorBox, { backgroundColor: colors.error }]}>
            <Text style={[styles.colorLabel, { color: colors.white }]}>Error</Text>
          </View>
          <View style={[styles.colorBox, { backgroundColor: colors.info }]}>
            <Text style={[styles.colorLabel, { color: colors.white }]}>Info</Text>
          </View>
        </View>
      </View>
      
      {/* Gray Scale */}
      <View style={[styles.section, { backgroundColor: colors.white }]}>
        <Text style={[styles.sectionTitle, { color: colors.black }]}>Gray Scale</Text>
        <View style={styles.grayRow}>
          {[100, 200, 300, 400, 500, 600, 700, 800, 900].map(shade => (
            <View 
              key={shade}
              style={[
                styles.grayBox, 
                { backgroundColor: colors[`gray${shade}` as keyof typeof colors] }
              ]}
            >
              <Text style={[
                styles.grayLabel, 
                { color: shade > 500 ? colors.white : colors.black }
              ]}>
                {shade}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'TitanOne',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    padding: 20,
    borderRadius: 12,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'TextMeOne',
    marginBottom: 15,
  },
  colorRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  colorBox: {
    flex: 1,
    height: 60,
    marginHorizontal: 5,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorLabel: {
    fontSize: 12,
    fontFamily: 'TextMeOne',
    textAlign: 'center',
  },
  grayRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  grayBox: {
    width: 60,
    height: 60,
    margin: 5,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grayLabel: {
    fontSize: 10,
    fontFamily: 'TextMeOne',
  },
});
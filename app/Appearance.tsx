import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import ThemeSelector from '@/components/ThemeSelector';
import { useAppColors } from '@/hooks/useAppColors';

const Appearance = () => {
  const colors = useAppColors();

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.dragBar}>
        {Platform.OS !== 'web' && (
          <View style={[styles.dragBarImage, { backgroundColor: colors.textMuted }]} />
        )}
        {Platform.OS === 'web' && (
          <Text onPress={handleClose} style={[styles.closeIcon, { color: colors.text }]}>
            X
          </Text>
        )}
      </View>

      <ThemeSelector onClose={handleClose} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dragBar: {
    width: '100%',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragBarImage: {
    width: 50,
    height: 5,
    borderRadius: 2.5,
  },
  closeIcon: {
    position: 'absolute',
    right: 20,
    fontSize: 24,
    padding: 10,
  },
});

export default Appearance;

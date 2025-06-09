import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface SafeWrapperProps {
  children: React.ReactNode;
  zIndex?: number;
  style?: any;
}

/**
 * A wrapper component that ensures proper z-index handling and text node safety
 * Use this for components that need to overlay other elements (like dropdown menus)
 */
export const SafeWrapper: React.FC<SafeWrapperProps> = ({ 
  children, 
  zIndex = 1,
  style = {} 
}) => {
  // Different platforms handle z-index differently
  const platformStyles = Platform.OS === 'web' 
    ? { 
        zIndex,
        position: 'relative',
        overflow: 'visible' 
      } 
    : { 
        elevation: zIndex,
        zIndex 
      };

  return (
    <View style={[styles.container, platformStyles, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  }
});

export default SafeWrapper;

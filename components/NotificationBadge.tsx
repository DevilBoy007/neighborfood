import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useAppColors } from '@/hooks/useAppColors';

interface NotificationBadgeProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
  position?: 'top-right' | 'top-left' | 'inline';
  testID?: string;
}

/**
 * NotificationBadge - Display unread count bubble
 *
 * @param count - Number of unread items (0-99, shows 99+ for higher values)
 * @param size - Badge size (default: 'medium')
 * @param position - Badge position relative to parent (default: 'top-right')
 */
export default function NotificationBadge({
  count,
  size = 'medium',
  position = 'top-right',
  testID,
}: NotificationBadgeProps) {
  const colors = useAppColors();

  if (count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  const sizeStyles = {
    small: {
      container: styles.containerSmall,
      text: styles.textSmall,
    },
    medium: {
      container: styles.containerMedium,
      text: styles.textMedium,
    },
    large: {
      container: styles.containerLarge,
      text: styles.textLarge,
    },
  };

  const positionStyles = {
    'top-right': styles.positionTopRight,
    'top-left': styles.positionTopLeft,
    inline: styles.positionInline,
  };

  return (
    <View
      style={[
        styles.container,
        sizeStyles[size].container,
        positionStyles[position],
        { backgroundColor: colors.error || '#FF3B30' },
      ]}
      testID={testID}
    >
      <Text style={[styles.text, sizeStyles[size].text, { color: '#FFFFFF' }]} numberOfLines={1}>
        {displayCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: Platform.OS === 'web' ? 2 : 1.5,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  // Sizes
  containerSmall: {
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
  },
  containerMedium: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
  },
  containerLarge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
  },
  // Text
  text: {
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
  textSmall: {
    fontSize: 10,
    lineHeight: 12,
  },
  textMedium: {
    fontSize: 12,
    lineHeight: 14,
  },
  textLarge: {
    fontSize: 14,
    lineHeight: 16,
  },
  // Positions
  positionTopRight: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 10,
  },
  positionTopLeft: {
    position: 'absolute',
    top: -8,
    left: -8,
    zIndex: 10,
  },
  positionInline: {
    position: 'relative',
    marginLeft: 8,
  },
});

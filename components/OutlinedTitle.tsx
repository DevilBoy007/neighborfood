import React, { useState } from 'react';
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';
import { useAppColors } from '@/hooks/useAppColors';

interface OutlinedTitleProps {
  children: string;
  /** The screen's existing title style; font size/family are read from it, the rest is layout. */
  style?: StyleProp<TextStyle>;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

/**
 * Screen title drawn with an outline so light title colors stay legible on light
 * backgrounds. React Native Text can't stroke glyphs, so the visible text is rendered with
 * SVG on top of an invisible Text that provides layout and accessibility.
 */
export function OutlinedTitle({ children, style, fill, stroke, strokeWidth }: OutlinedTitleProps) {
  const colors = useAppColors();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const {
    fontSize = 30,
    fontFamily = 'TitanOne',
    color: _color,
    fontWeight: _fontWeight,
    textAlign: _textAlign,
    ...layout
  } = StyleSheet.flatten(style) ?? {};
  const outline = strokeWidth ?? Math.max(2, Math.round(fontSize / 10));

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== size.width || height !== size.height) setSize({ width, height });
  };

  const textProps = {
    x: size.width / 2,
    y: size.height / 2,
    fontSize,
    fontFamily,
    textAnchor: 'middle' as const,
    alignmentBaseline: 'central' as const,
  };

  return (
    <View style={layout as ViewStyle}>
      <Text
        accessibilityRole="header"
        numberOfLines={1}
        onLayout={onLayout}
        style={[styles.measure, { fontSize, fontFamily, paddingHorizontal: outline }]}
      >
        {children}
      </Text>
      {size.width > 0 && (
        <Svg
          width={size.width}
          height={size.height}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <SvgText
            {...textProps}
            fill={stroke ?? colors.titleStroke}
            stroke={stroke ?? colors.titleStroke}
            strokeWidth={outline * 2}
            strokeLinejoin="round"
          >
            {children}
          </SvgText>
          <SvgText {...textProps} fill={fill ?? colors.titleText}>
            {children}
          </SvgText>
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  measure: {
    color: 'transparent',
    textAlign: 'center',
  },
});

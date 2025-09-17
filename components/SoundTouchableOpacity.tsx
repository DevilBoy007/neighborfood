import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useSound } from '@/hooks/useSound';

interface SoundTouchableOpacityProps extends TouchableOpacityProps {
  enableSound?: boolean;
}

export const SoundTouchableOpacity: React.FC<SoundTouchableOpacityProps> = ({
  onPress,
  enableSound = true,
  ...props
}) => {
  const { playTapSound } = useSound();

  const handlePress = (event: any) => {
    if (enableSound) {
      playTapSound();
    }
    onPress?.(event);
  };

  return <TouchableOpacity {...props} onPress={handlePress} />;
};
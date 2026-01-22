import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { useSound } from '@/hooks/useSound';

interface SoundTouchableOpacityProps extends TouchableOpacityProps {
  enableSound?: boolean;
  soundType?: 'click' | 'tap';
}

export const SoundTouchableOpacity: React.FC<SoundTouchableOpacityProps> = ({
  onPress,
  enableSound = true,
  soundType = 'tap',
  ...props
}) => {
  const { playTapSound, playClickSound } = useSound();

  const handlePress = (event: any) => {
    if (enableSound) {
      if (soundType === 'click') {
        playClickSound();
      } else {
        playTapSound();
      }
    }
    onPress?.(event);
  };

  return <TouchableOpacity {...props} onPress={handlePress} />;
};
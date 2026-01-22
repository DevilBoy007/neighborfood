import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import { useSound } from '@/hooks/useSound';

interface SoundPressableProps extends PressableProps {
  enableSound?: boolean;
  soundType?: 'click' | 'tap';
}

export const SoundPressable: React.FC<SoundPressableProps> = ({
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

  return <Pressable {...props} onPress={handlePress} />;
};

import React from 'react';
import { Pressable, PressableProps } from 'react-native';
import { useSound } from '@/hooks/useSound';

interface SoundPressableProps extends PressableProps {
  enableSound?: boolean;
}

export const SoundPressable: React.FC<SoundPressableProps> = ({
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

  return <Pressable {...props} onPress={handlePress} />;
};
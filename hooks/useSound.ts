import { AudioPlayer, useAudioPlayer } from 'expo-audio';
import { useEffect } from 'react';

import clickSound from '@/assets/sounds/click.mp3';

export const useSound = () => {
  const player = useAudioPlayer(clickSound);

  const playClickSound = () => {
    try {
      player.seekTo(0);
      player.play();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  return { playTapSound: playClickSound };
};
import { useAudioPlayer } from 'expo-audio';
import { useEffect } from 'react';

import clickSound from '@/assets/sounds/click.mp3';
import tapSound from '@/assets/sounds/tap.wav';

export const useSound = () => {

  const clickPlayer = useAudioPlayer(clickSound);
  const tapPlayer = useAudioPlayer(tapSound);

  useEffect(() => {
    clickPlayer.volume = 0.1;
    tapPlayer.volume = 0.1;
  }, []);

  const playClickSound = () => {
    try {
      clickPlayer.seekTo(0);
      clickPlayer.play();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const playTapSound = () => {
    try {
      tapPlayer.seekTo(0);
      tapPlayer.play();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  return { playTapSound, playClickSound };
};
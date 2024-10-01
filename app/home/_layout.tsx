import { Slot, Stack, useRouter } from "expo-router";
import { useFonts } from 'expo-font';
import { View, StyleSheet, Platform, TouchableOpacity, Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import chatIcon from '../../assets/images/chat.png';
import pollsIcon from '../../assets/images/surveys.png';
import marketIcon from '../../assets/images/market.png';
import tileIcon from '../../assets/images/tiles.png';
import profileIcon from '../../assets/images/user.png';


SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const [loaded] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
    TitanOne: require('../../assets/fonts/TitanOne-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }
  return (
    <>
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.content}>
          <Slot />
        </View>
      </View>
      {Platform.OS === 'web' &&
        <View style={styles.footer}>
          <TouchableOpacity style={styles.iconButton}>
            <Image
              source={profileIcon}
              style={[styles.iconButton, styles.profileImage]}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Image style={[styles.iconButton, styles.icon]} source={chatIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Image style={[styles.iconButton, styles.icon]} source={pollsIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => { router.push('/home/Market') }}>
            <Image style={[styles.iconButton, styles.icon]} source={marketIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={ () => router.push('/home/Menu')}>
            <Image style={[styles.iconButton, styles.icon]} source={tileIcon} />
          </TouchableOpacity>
        </View>}
    {
      Platform.OS !== 'web' &&
        <View style={styles.footer}>
          <TouchableOpacity style={styles.iconButton}>
            <Image style={[styles.iconButton, styles.icon]} source={chatIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Image style={[styles.iconButton, styles.icon]} source={pollsIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => { router.push('/home/Market') }}>
            <Image style={[styles.iconButton, styles.icon]} source={marketIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={ () => router.push('/home/Menu')}>
            <Image style={[styles.iconButton, styles.icon]} source={tileIcon} />
          </TouchableOpacity>
        </View>
    }
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    ...Platform.select({
      web: {
        flexDirection: 'row',
      }
    })
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    ...Platform.select({
      native: {
        position: 'absolute',
        top: 10,
        left: 10,
      },
      web: {
        marginBottom: 30,
        width: 100,
        height: 100,
        borderRadius: 50,
      },
    }),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: '#87CEFA',
    padding: 10,
    ...Platform.select({
      ios: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
      },
      web: {
        flexDirection: 'column',
        width: 175,
        height: '100%',
        justifyContent: 'center',
      },
    }),
  },
  iconButton: {
    padding: 10,
    ...Platform.select({
      web: {
        marginBottom: 20,
      },
    }),
  },
  icon: {
    width: 50,
    height: 50,
    ...Platform.select({
      ios: {
        width: 30,
        height: 30,
      },
    }),
  },
});

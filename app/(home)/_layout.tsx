import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Image } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EventRegister } from 'react-native-event-listeners';
import { Stack, useRouter } from "expo-router";
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import chatIcon from '../../assets/images/chat.png';
import pollsIcon from '../../assets/images/surveys.png';
import marketIcon from '../../assets/images/market.png';
import tileIcon from '../../assets/images/tiles.png';
import profileIcon from '../../assets/images/user.png';


SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const storage = Platform.OS === 'web' ? localStorage : AsyncStorage;
  const [user, setUser] = useState<Object | null>(null);
  const [loaded] = useFonts({
    SpaceMono: require('../../assets/fonts/SpaceMono-Regular.ttf'),
    TitanOne: require('../../assets/fonts/TitanOne-Regular.ttf'),
    TextMeOne: require('../../assets/fonts/TextMeOne-Regular.ttf'),
  });
  const [userData, setuserData] = useState<Object | null>(null);

  useEffect(() => {
    if (!loaded) return;

    const checkUser = async () => {
      try {
        const user = await storage.getItem('userData');
        if (!user) {
          console.log('No user data found');
          router.navigate('/Login');
          return;
        }

        const DATA = JSON.parse(user);
        if (!DATA || !DATA.uid) {
          console.log('Invalid user data');
          router.navigate('/Login');
          return;
        }

        setUser(DATA);
        console.log('Loaded user data:', DATA.uid);

      } catch (error) {
        console.error('Error checking user:', error);
        router.navigate('/Login');
        return;
      }
    };
    checkUser();
  }, [loaded]);

  const toggleSettings = useCallback(() => {
    router.navigate('/Settings');
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <>
        <View style={styles.container}>
          <Stack.Screen options={{ headerShown: false }} initialParams={{ toggleSettings: toggleSettings }}  />
          {Platform.OS !== 'web'  &&
            <TouchableOpacity onPress={toggleSettings} style={styles.profileImage}>
              <Image
                source={userData ? { uri: userData.photoURL } : profileIcon}
                style={styles.profileImage}
              />
            </TouchableOpacity>
          }
          <View style={styles.content}>
          {Platform.OS === 'web' &&
            <View style={styles.footer}>
              <TouchableOpacity style={styles.iconButton} onPress={ toggleSettings }>
                <Image
                  source={userData ? { uri: userData.photoURL } : profileIcon}
                  style={[styles.iconButton, styles.profileImage]}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Image style={[styles.iconButton, styles.icon]} source={chatIcon} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Image style={[styles.iconButton, styles.icon]} source={pollsIcon} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => { router.navigate('/Market') }}>
                <Image style={[styles.iconButton, styles.icon]} source={marketIcon} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={ () => router.navigate('/Menu')}>
                <Image style={[styles.iconButton, styles.icon]} source={tileIcon} />
              </TouchableOpacity>
            </View>}
            <Stack>
              <Stack.Screen name="Market" options={{ headerShown: false }} />
              <Stack.Screen name="Menu" options={{ headerShown: false }} />
            </Stack>
          </View>
        </View>
        {Platform.OS !== 'web' &&
        <View style={styles.footer}>
          <TouchableOpacity style={styles.iconButton}>
            <Image style={[styles.iconButton, styles.icon]} source={chatIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Image style={[styles.iconButton, styles.icon]} source={pollsIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => { router.navigate('/Market') }}>
            <Image style={[styles.iconButton, styles.icon]} source={marketIcon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={ () => router.navigate('/Menu')}>
            <Image style={[styles.iconButton, styles.icon]} source={tileIcon} />
          </TouchableOpacity>
        </View>}
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
        zIndex: 1,
        position: 'absolute',
        margin: 10,
        marginTop: 25,
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
        height: 75,
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
  },
});

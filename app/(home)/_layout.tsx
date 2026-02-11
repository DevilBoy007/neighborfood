import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Platform, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, useRouter } from 'expo-router';
import { SoundTouchableOpacity } from '@/components/SoundTouchableOpacity';
import { useAppColors } from '@/hooks/useAppColors';
import { Ionicons } from '@expo/vector-icons';

import marketIcon from '../../assets/images/market.png';
import profileIcon from '../../assets/images/user.png';
import { User } from 'firebase/auth';

import CartFAB from '@/components/CartFAB';
import NotificationBadge from '@/components/NotificationBadge';
import { useMessage } from '@/store/reduxHooks';

// Helper to get storage - lazily evaluated with guard for bundling
const getStorage = () => {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      return {
        getItem: () => Promise.resolve(null),
        setItem: () => Promise.resolve(),
        removeItem: () => Promise.resolve(),
      };
    }
    return localStorage;
  }
  return AsyncStorage;
};

export default function RootLayout() {
  const router = useRouter();
  const storage = getStorage();
  const [userData, setUser] = useState<User | null>(null);
  const { loadThreads, unreadCount } = useMessage();
  const colors = useAppColors();

  useEffect(() => {
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

        // Pre-load message threads in the background
        loadThreads(DATA.uid);
      } catch (error) {
        console.error('Error checking user:', error);
        router.navigate('/Login');
        return;
      }
    };
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSettings = useCallback(() => {
    router.navigate('/Settings');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navigateToMessages = useCallback(() => {
    router.push('/(home)/(messages)' as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <View style={styles.container}>
        <Stack.Screen
          options={{ headerShown: false }}
          initialParams={{ toggleSettings: toggleSettings }}
        />
        {Platform.OS !== 'web' && (
          <SoundTouchableOpacity
            onPress={toggleSettings}
            style={styles.profileImage}
            soundType="tap"
          >
            <Image
              source={userData?.photoURL ? { uri: userData.photoURL } : profileIcon}
              style={styles.profileImage}
            />
          </SoundTouchableOpacity>
        )}
        <View style={styles.content}>
          {Platform.OS === 'web' && (
            <View style={[styles.footer, { backgroundColor: colors.navBackground }]}>
              <SoundTouchableOpacity
                style={styles.iconButton}
                onPress={toggleSettings}
                soundType="tap"
              >
                <Image
                  source={userData?.photoURL ? { uri: userData.photoURL } : profileIcon}
                  style={[styles.iconButton, styles.profileImage]}
                />
              </SoundTouchableOpacity>
              <SoundTouchableOpacity
                style={styles.iconButton}
                onPress={navigateToMessages}
                soundType="tap"
              >
                <View style={styles.iconContainer}>
                  <Ionicons name="chatbubbles-outline" size={50} color={colors.navIcon} />
                  {unreadCount > 0 && (
                    <NotificationBadge count={unreadCount} size="small" position="top-right" />
                  )}
                </View>
              </SoundTouchableOpacity>
              <SoundTouchableOpacity style={styles.iconButton} soundType="tap">
                <Ionicons name="stats-chart-outline" size={50} color={colors.navIcon} />
              </SoundTouchableOpacity>
              <SoundTouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  router.navigate('/Market');
                }}
                soundType="tap"
              >
                <Image style={[styles.iconButton, styles.icon]} source={marketIcon} />
              </SoundTouchableOpacity>
              <SoundTouchableOpacity
                style={styles.iconButton}
                onPress={() => router.navigate('/Menu')}
                soundType="tap"
              >
                <Ionicons name="grid-outline" size={50} color={colors.navIcon} />
              </SoundTouchableOpacity>
            </View>
          )}
          <Stack>
            <Stack.Screen name="Market" options={{ headerShown: false }} />
            <Stack.Screen name="Menu" options={{ headerShown: false }} />
            <Stack.Screen name="(messages)" options={{ headerShown: false }} />
          </Stack>
        </View>
      </View>
      {Platform.OS !== 'web' && (
        <View
          style={[
            styles.footer,
            { backgroundColor: colors.navBackground, borderTopColor: colors.border },
          ]}
        >
          <SoundTouchableOpacity
            style={styles.iconButton}
            onPress={navigateToMessages}
            soundType="tap"
          >
            <View style={styles.iconContainer}>
              <Ionicons name="chatbubbles-outline" size={35} color={colors.navIcon} />
              {unreadCount > 0 && (
                <NotificationBadge count={unreadCount} size="small" position="top-right" />
              )}
            </View>
          </SoundTouchableOpacity>
          <SoundTouchableOpacity style={styles.iconButton} soundType="tap">
            <Ionicons name="stats-chart-outline" size={35} color={colors.navIcon} />
          </SoundTouchableOpacity>
          <SoundTouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              router.navigate('/Market');
            }}
            soundType="tap"
          >
            <Image style={[styles.iconButton, styles.icon]} source={marketIcon} />
          </SoundTouchableOpacity>
          <SoundTouchableOpacity
            style={styles.iconButton}
            onPress={() => router.navigate('/Menu')}
            soundType="tap"
          >
            <Ionicons name="grid-outline" size={35} color={colors.navIcon} />
          </SoundTouchableOpacity>
        </View>
      )}
      <CartFAB bottom={Platform.OS === 'web' ? 20 : 100} />
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
      },
    }),
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
    padding: 10,

    ...Platform.select({
      ios: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 75,
        borderTopWidth: 1,
      },
      web: {
        flexDirection: 'column',
        width: 175,
        height: '100%',
        justifyContent: 'center',
        borderRightWidth: 1,
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
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 50,
    height: 50,
  },
});

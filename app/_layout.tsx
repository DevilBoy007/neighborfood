import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast, { BaseToast } from 'react-native-toast-message';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store';
import { GoogleMapsLoader } from '@/components/GoogleMapsLoader';
import { NotificationProvider } from '@/components/NotificationProvider';
import { View, Text, LogBox } from 'react-native';

// Ignore specific warnings about text nodes
LogBox.ignoreLogs(['Unexpected text node', 'A text node cannot be a child of a <View>']);

// Patch the React Native View component for web to handle text nodes better
if (typeof window !== 'undefined') {
  // This is a web-only patch
  const originalCreateElement = React.createElement;

  // Override createElement to handle text nodes in Views
  React.createElement = function (type, props, ...children) {
    // Only modify View components
    if (type === View || (type && type.displayName === 'View')) {
      // Filter out direct text nodes from children
      const safeChildren = children.map((child) => {
        if (typeof child === 'string' || typeof child === 'number') {
          return React.createElement(Text, {}, child);
        }
        return child;
      });

      return originalCreateElement(type, props, ...safeChildren);
    }

    // For all other components, use the original behavior
    return originalCreateElement(type, props, ...children);
  };
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    TitanOne: require('../assets/fonts/TitanOne-Regular.ttf'),
    TextMeOne: require('../assets/fonts/TextMeOne-Regular.ttf'),
  });

  const toastConfig = {
    success: (props) => (
      <BaseToast
        {...props}
        style={{ borderLeftColor: '#00bfff', width: '90%' }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{ fontSize: 16, color: '#333' }}
        text2Style={{ fontSize: 12, color: '#666' }}
        text2NumberOfLines={2}
      />
    ),
    error: (props) => (
      <BaseToast
        {...props}
        style={{ borderLeftColor: '#ff3b30', width: '90%' }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{ fontSize: 14, color: '#333' }}
        text2Style={{ fontSize: 12, color: '#666' }}
        text2NumberOfLines={2}
      />
    ),
  };

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <NotificationProvider>
          <GoogleMapsLoader>
            <KeyboardProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="Register" options={{ headerShown: false }} />
                  <Stack.Screen name="Login" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="success"
                    options={{ headerShown: false, animation: 'fade' }}
                  />
                  <Stack.Screen name="EditDetails" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="Settings"
                    options={{
                      headerShown: false,
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                    }}
                  />
                </Stack>
                <Toast config={toastConfig} />
              </GestureHandlerRootView>
            </KeyboardProvider>
          </GoogleMapsLoader>
        </NotificationProvider>
      </PersistGate>
    </Provider>
  );
}

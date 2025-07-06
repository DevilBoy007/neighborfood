import React from 'react';
import { Stack } from "expo-router";
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from 'react-native-toast-message';
import { UserProvider } from "@/context/userContext";
import { LocationProvider, useLocation } from "@/context/locationContext";
import { ShopProvider } from "@/context/shopContext";
import { ItemProvider } from "@/context/itemContext";
import { OrderProvider } from "@/context/orderContext";
import { CartProvider } from "@/context/cartContext";
import { GoogleMapsLoader } from "@/components/GoogleMapsLoader";
import { View, Text, LogBox } from 'react-native';

// Ignore specific warnings about text nodes
LogBox.ignoreLogs([
  'Unexpected text node',
  'A text node cannot be a child of a <View>',
]);

// Patch the React Native View component for web to handle text nodes better
if (typeof window !== 'undefined') {
  // This is a web-only patch
  const originalCreateElement = React.createElement;
  
  // Override createElement to handle text nodes in Views
  React.createElement = function(type, props, ...children) {
    // Only modify View components
    if (type === View || (type && type.displayName === 'View')) {
      // Filter out direct text nodes from children
      const safeChildren = children.map(child => {
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

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }
    return (
        <GoogleMapsLoader>
            <OrderProvider>
                <UserProvider>
                    <LocationProvider>
                        <ShopProvider>
                            <ItemProvider>
                                <CartProvider>
                                    <KeyboardProvider>
                                        <GestureHandlerRootView style={{ flex: 1 }}>
                                            <Stack>
                                                <Stack.Screen name="index" options={{ headerShown: false }} />
                                                <Stack.Screen name="Register" options={{ headerShown: false }} />
                                                <Stack.Screen name="Login" options={{ headerShown: false }} />
                                                <Stack.Screen name="+not-found" options={{ headerShown: false }} />
                                                <Stack.Screen name="success" options={{ headerShown: false, animation: 'fade' }} />
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
                                            <Toast />
                                        </GestureHandlerRootView>
                                    </KeyboardProvider>
                                </CartProvider>
                            </ItemProvider>
                        </ShopProvider>
                    </LocationProvider>
                </UserProvider>
            </OrderProvider>
        </GoogleMapsLoader>
    );
}

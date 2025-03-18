import React from 'react';
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { KeyboardProvider } from 'react-native-keyboard-controller';



SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    return (
        <KeyboardProvider>
            <Stack.Screen options={{ headerShown: false }} />
            <Stack>
                <Stack.Screen name="Shops" options={{ headerShown: false}} />
                <Stack.Screen name="AddShop" options={{ headerShown: false }} />
            </Stack>
        </KeyboardProvider>
    );
}

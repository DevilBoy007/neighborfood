import React from 'react';
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';


SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <Stack>
                <Stack.Screen name="Shops" options={{ headerShown: false}} />
            </Stack>
        </>
    );
}

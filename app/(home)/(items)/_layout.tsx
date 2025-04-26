import React from 'react';
import { Stack } from "expo-router";
import { KeyboardProvider } from 'react-native-keyboard-controller';

export default function RootLayout() {
    return (
        <KeyboardProvider>
            <Stack.Screen options={{ headerShown: false }} />
            <Stack>
                <Stack.Screen name="AddItem" options={{ headerShown: false}} />
                <Stack.Screen name="ManageItems" options={{ headerShown: false}} />
            </Stack>
        </KeyboardProvider>
    );
}

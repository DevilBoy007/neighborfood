import React from 'react';
import { Stack } from "expo-router";

export default function RootLayout() {
    return (
        <>
        <Stack.Screen options={{ headerShown: false }} />
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="orders" options={{ headerShown: false }} />
            <Stack.Screen name="details" options={{ headerShown: false }} />
        </Stack>
        </>
    );
}

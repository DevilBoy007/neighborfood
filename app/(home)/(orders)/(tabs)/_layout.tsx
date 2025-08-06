import React from 'react';
import { Stack } from "expo-router";

export default function TabsLayout() {
    return (
        <Stack>
            <Stack.Screen name="orders" options={{ headerShown: false }} />
            <Stack.Screen name="history" options={{ headerShown: false }} />
        </Stack>
    );
}

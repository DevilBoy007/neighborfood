import React from 'react';
import { Stack } from "expo-router";

export default function RootLayout() {
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <Stack>
                <Stack.Screen name="ContactUs" options={{ headerShown: false}} />
            </Stack>
        </>
    );
}

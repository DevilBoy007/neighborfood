import { Stack } from "expo-router";
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';


SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded] = useFonts({
        SpaceMono: require('@/assets/fonts/SpaceMono-Regular.ttf'),
        TitanOne: require('@/assets/fonts/TitanOne-Regular.ttf'),
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
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <Stack>
                <Stack.Screen name="ContactUs" options={{ headerShown: false }} />
            </Stack>
        </>
    );
}

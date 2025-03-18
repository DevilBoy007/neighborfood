import { Stack } from "expo-router";
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { UserProvider } from "@/context/userContext";

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
        <UserProvider>
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
                </GestureHandlerRootView>
            </KeyboardProvider>
        </UserProvider>
    );
}

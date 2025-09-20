import { useRouter } from 'expo-router'
import { Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { useAppColors } from '@/hooks/useAppColors';

export default function SucessScreen({ onTimerComplete = () => { } }) {
    const router = useRouter()
    const [show, setShow] = useState(false);
    const colors = useAppColors();
    
    onTimerComplete = router.back
    
    useEffect(() => {
        setShow(true);
        const timer = setTimeout(() => {
            onTimerComplete();
        }, (Platform.OS === 'web'? 2000 : 1200));

        // Cleanup timer if component unmounts
        return () => clearTimeout(timer);
    }, [onTimerComplete]);
    return (
        <View style={[styles.container, { backgroundColor: colors.primary }]}>
            <LinearGradient
                // Background Linear Gradient - now uses theme colors
                colors={[colors.secondary, colors.secondary, colors.primary]}
                style={styles.background}
            />
            <Text style={[styles.text, { color: colors.white }]} onPress={() => { router.back() }}>🥕 THANKS, NEIGHBOR 🥕</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor moved to JSX with dynamic color
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 300,
    },
    text: {
        backgroundColor: 'transparent',
        fontSize: 30,
        // color moved to JSX
        fontFamily: 'TextMeOne',
        ...Platform.select({
            web: {
                fontSize: 80,
            },
        }),
    },
});

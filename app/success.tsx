import { useRouter } from 'expo-router'
import { Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';

export default function SucessScreen({ onTimerComplete = () => { } }) {
    const router = useRouter()
    const [show, setShow] = useState(false);
    
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
        <View style={styles.container}>
            <LinearGradient
                // Background Linear Gradient
                colors={['#b7ffb0', '#b7ffb0', '#00bfff']}
                style={styles.background}
            />
            <Text style={styles.text} onPress={() => { router.back() }}>🥕 SUCCESS 🥕</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00bfff',
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
        fontSize: 40,
        color: '#fff',
        fontFamily: 'TextMeOne',
        ...Platform.select({
            web: {
                fontSize: 80,
            },
        }),
    },
});

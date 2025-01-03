import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { User } from 'firebase/auth'
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import firebaseService from '@/handlers/firebaseService';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            try {
                const userData = await AsyncStorage.getItem('userData');
                if (userData) {
                    const DATA = JSON.parse(userData);
                    setUser(DATA);
                    console.log('Loaded user data:\n', user);
                    router.replace('/Market');
                }
            } catch (error) {
                console.error('User not logged in:', error);
            }
        };
        //checkUser();
        const userLoggedInListener = EventRegister.on('userLoggedIn', () => {
            router.replace('/success');
            setTimeout(() => {
                router.replace('/(home)/Market');
            }, 2000);
        });
    }, []);

    

    const handleLogin = async () => {
        try {
            await firebaseService.connect()
            const userCredential = await firebaseService.login(email, password);
            if (userCredential) {
                const userData = { userCredential };
                await AsyncStorage.setItem('userData', JSON.stringify(userData));
                setUser(userData);
                console.log('User logged in:', userData);
                EventRegister.emit('userLoggedIn');
            }
        } catch (error) {
            console.error('Error logging in:', error);
            setError(error.message);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView scrollEnabled={false}>
                <Text style={styles.title}>Login</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                </View>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleLogin}
                    >
                        <Text style={styles.buttonText}>Login</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.errorText}>{error}</Text>
            </ScrollView>
            <KeyboardToolbar />
        </KeyboardAvoidingView>
    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#B7FFB0',
    },
    title: {
        fontFamily: 'TitanOne',
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 33,
        textAlign: 'center',
        paddingBottom: 16,
    },
    inputContainer: {
        flex: 1,
        alignItems: 'center',
    },
    input: {
        width: '80%',
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    button: {
        width: '100%',
        height: 40,
        margin: 12,
        padding: 10,
        backgroundColor: '#00bfff',
        alignSelf: 'stretch',
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 16,
        fontFamily: 'TextMeOne',
    },
    errorText: {
        color: 'red',
        marginVertical: 2,
        marginHorizontal: 2,
        fontFamily: 'TextMeOne',
    }
})

export default LoginScreen;
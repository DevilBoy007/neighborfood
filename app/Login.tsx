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
    const [disabled, setDisabled] = useState<boolean>(false);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            try {
                const user = await AsyncStorage.getItem('userData');

                if (!user) {
                    console.log('No user data found');
                    router.replace('/');
                    return;
                }

                const DATA = JSON.parse(user);
                if (!DATA || !DATA.uid) {
                    console.log('Invalid user data');
                    router.replace('/');
                    return;
                }

                setuserData(DATA);
                console.log('Loaded user data:', DATA.uid);

            } catch (error) {
                console.error('Error checking user:', error);
                router.replace('/');
            }
        };

        // checkUser();
        const userLoggedInListener = EventRegister.on('userLoggedIn', () => {
            router.replace('/success');
            setTimeout(() => {
                router.replace('/(home)/Market');
            }, 2000);
        });
        return () => {
            EventRegister.rm(userLoggedInListener);
        }
    }, []);

    

    const handleLogin = async () => {
        setDisabled(true);
        try {
            await firebaseService.connect();
            await firebaseService.logout(); // clear any cached data
            const userCredential = await firebaseService.login(email, password);
            console.log(userCredential.operationType, userCredential.user);
            if (userCredential) {
                const userData =  userCredential.user ;
                await AsyncStorage.setItem('userData', JSON.stringify(userData));
                console.log('Stored user:', userData.uid);
                EventRegister.emit('userLoggedIn');
            }
        } catch (error) {
            console.error('Error logging in:', error);
            setError(error.message);
            setDisabled(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={Platform.select({ ios: -350, android: -350 })}
        >
            <ScrollView scrollEnabled={false}>
                <Text style={styles.title}>Login</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                    autoCapitalize='none'
                    style={styles.input}
                    placeholder="email"
                    placeholderTextColor={'#fff'}
                    value={email}
                    onChangeText={setEmail}
                />
                <TextInput
                    style={styles.input}
                    placeholder="password"
                    placeholderTextColor={'#fff'}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                <Text style={styles.errorText}>{error}</Text>
                </View>
            </ScrollView>
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={[
                        styles.button,
                        disabled && styles.buttonTextDisabled,
                    ]}
                    onPress={handleLogin}
                >
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>
            </View>
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
        marginTop: 100,
        textAlign: 'center',
        paddingBottom: 75,
    },
    inputContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 75,
    },
    input: {
        width: '80%',
        margin: 12,
        borderBottomWidth: 1,
        padding: 10,
        color: 'fff',
        fontSize: 20,
    },
    buttonContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
            }
        })
    },
    button: {
        width: '100%',
        padding: 10,
        paddingBottom: 33,
        backgroundColor: '#00bfff',
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 30,
        fontFamily: 'TextMeOne',
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.7,
    },
    buttonTextDisabled: {
        color: '#666'
    },
    errorText: {
        color: 'red',
        marginVertical: 2,
        marginHorizontal: 2,
        fontFamily: 'TextMeOne',
        fontSize: 16,
    }
})

export default LoginScreen;
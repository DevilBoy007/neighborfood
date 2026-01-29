import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { EventRegister } from 'react-native-event-listeners';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { useUser } from '@/store/reduxHooks';
import { SoundTouchableOpacity } from '@/components/SoundTouchableOpacity';
import { useAppColors } from '@/hooks/useAppColors';

import firebaseService from '@/handlers/firebaseService';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [disabled, setDisabled] = useState<boolean>(false);
  const router = useRouter();
  const colors = useAppColors();

  // Use the user context
  const { userData, setUserData } = useUser();
  const userLoggedInListener = EventRegister.addEventListener('userLoggedIn', () => {
    router.replace('/success');
    setTimeout(() => {
      router.replace('/(home)/Market');
    }, 2000);
  });

  useEffect(() => {
    // If user data already exists in context, navigate to the appropriate screen
    if (userData && userData.uid) {
      console.log('User already authenticated:', userData.uid);
      EventRegister.emit('userLoggedIn');
    }
    // Clean up the event listener on component unmount
    return () => {
      EventRegister.removeEventListener(userLoggedInListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setDisabled(true);
    try {
      const userCredential = await firebaseService.login(email, password);

      if (userCredential && userCredential.user) {
        const user = userCredential.user;
        // Create initial user data object with auth properties
        let userDataObj = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: '',
          first: '',
          last: '',
          dob: '',
          phone: '',
          location: '',
        };

        // Fetch additional user data from Firestore
        try {
          const firestoreUserData = await firebaseService.getDocument('users', user.uid);
          if (firestoreUserData) {
            // Merge auth data with Firestore data
            userDataObj = {
              ...userDataObj,
              ...firestoreUserData,
            };
            if (userDataObj.username) {
              delete userDataObj.username;
            }
          }
        } catch (firestoreError) {
          console.error('Error fetching user data from Firestore:', firestoreError);
          // Continue with basic auth data if Firestore fetch fails
        }

        // Use context's setUserData method which will handle storage
        setUserData(userDataObj);
        console.log('Stored user:', userDataObj.uid);
        EventRegister.emit('userLoggedIn');
      }
    } catch (error: any) {
      console.error('Error logging in:', error);
      setError(error.message || 'An error occurred');
      setDisabled(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={Platform.select({ ios: -350, android: -350 })}
    >
      <ScrollView scrollEnabled={false}>
        <Text style={[styles.title, { color: colors.textOnPrimary }]}>Login</Text>
        <View style={styles.inputContainer}>
          <TextInput
            autoCapitalize="none"
            style={[styles.input, { borderBottomColor: colors.border }]}
            placeholder="email"
            placeholderTextColor={colors.placeholder}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={[styles.input, { borderBottomColor: colors.border }]}
            placeholder="password"
            placeholderTextColor={colors.placeholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <SoundTouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.buttonPrimary },
            disabled && [styles.buttonDisabled, { backgroundColor: colors.buttonDisabled }],
          ]}
          onPress={handleLogin}
          disabled={disabled}
          soundType="click"
        >
          <Text
            style={[
              styles.buttonText,
              { color: colors.textOnPrimary },
              disabled && [styles.buttonTextDisabled, { color: colors.textMuted }],
            ]}
          >
            Login
          </Text>
        </SoundTouchableOpacity>
      </View>
      <KeyboardToolbar />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontFamily: 'TitanOne',
    fontSize: 36,
    fontWeight: 'bold',
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
      },
    }),
  },
  button: {
    width: '100%',
    padding: 10,
    paddingBottom: 33,
  },
  buttonText: {
    textAlign: 'center',
    fontSize: 30,
    fontFamily: 'TextMeOne',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonTextDisabled: {},
  errorText: {
    marginVertical: 2,
    marginHorizontal: 2,
    fontFamily: 'TextMeOne',
    fontSize: 16,
  },
});

export default LoginScreen;

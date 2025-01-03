import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Keyboard,
    KeyboardAvoidingView,
    Button,
    Platform
} from 'react-native';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { User } from 'firebase/auth'
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import firebaseService from '@/handlers/firebaseService';

const LoginScreen = () => {

}

const styles = StyleSheet.create({})

export default LoginScreen;
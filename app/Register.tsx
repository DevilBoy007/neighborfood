import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import firebaseAuth from '@/handlers/auth';

const RegisterScreen = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        dob: '',
        city: '',
        state: '',
        zip: '',
        username: '',
        password: '',
        confirmPassword: ''
    });

    const states = [
        { label: 'Select State', value: '' },
        { label: 'Indiana', value: 'IN' },
        { label: 'Illinois', value: 'IL' },
        // Add other states as needed
    ];

    const handleChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRegister = async () => {
        try {
            await firebaseAuth.connect();

            const { email, password } = formData;
            await firebaseAuth.registerUser(email, password);

            firebaseAuth.disconnect();
            console.log('Registration successful!');
        } catch (error) {
            console.error('Error registering user:', error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Register</Text>
            {/* Personal Details Section */}
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <View style={styles.row}>
                <TextInput
                    style={[styles.input, styles.flex1, styles.marginRight]}
                    placeholder="first name"
                    placeholderTextColor="#999"
                    value={formData.firstName}
                    onChangeText={(text) => handleChange('firstName', text)}
                />
                <TextInput
                    style={[styles.input, styles.flex1]}
                    placeholder="last name"
                    placeholderTextColor="#999"
                    value={formData.lastName}
                    onChangeText={(text) => handleChange('lastName', text)}
                />
            </View>

            <View style={styles.row}>
                <TextInput
                    style={[styles.input, styles.flex1, styles.marginRight]}
                    placeholder="email"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize='none'
                    value={formData.email}
                    onChangeText={(text) => handleChange('email', text)}
                />
                <TextInput
                    style={[styles.input, styles.flex1]}
                    placeholder="d.o.b."
                    placeholderTextColor="#999"
                    value={formData.dob}
                    onChangeText={(text) => handleChange('dob', text)}
                />
            </View>

            {/* Market Info Section */}
            <Text style={styles.sectionTitle}>Market Info</Text>
            <TextInput
                style={[styles.input, styles.marginBottom]}
                placeholder="city"
                placeholderTextColor="#999"
                value={formData.city}
                onChangeText={(text) => handleChange('city', text)}
            />

            <View style={styles.row}>
                <View style={[styles.flex1, styles.marginRight]}>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={formData.state}
                            onValueChange={(value) => handleChange('state', value)}
                            style={styles.picker}
                        >
                            {states.map((state) => (
                                <Picker.Item
                                    key={state.value}
                                    label={state.label}
                                    value={state.value}
                                />
                            ))}
                        </Picker>
                    </View>
                </View>
                <TextInput
                    style={[styles.input, styles.flex1]}
                    placeholder="zip"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                    value={formData.zip}
                    onChangeText={(text) => handleChange('zip', text)}
                />
            </View>

            {/* Login Info Section */}
            <Text style={styles.sectionTitle}>Login Info</Text>
            <TextInput
                style={[styles.input, styles.marginBottom]}
                placeholder="username"
                placeholderTextColor="#999"
                value={formData.username}
                autoCapitalize='none'
                onChangeText={(text) => handleChange('username', text)}
            />
            <TextInput
                style={[styles.input, styles.marginBottom]}
                placeholder="password"
                placeholderTextColor="#999"
                secureTextEntry
                value={formData.password}
                autoCapitalize='none'
                onChangeText={(text) => handleChange('password', text)}
            />
            <TextInput
                style={[styles.input, styles.marginBottom]}
                placeholder="confirm password"
                placeholderTextColor="#999"
                secureTextEntry
                value={formData.confirmPassword}
                autoCapitalize='none'
                onChangeText={(text) => handleChange('confirmPassword', text)}
            />

            {/* Register Button */}
            <TouchableOpacity
                style={styles.button}
                onPress={handleRegister}
            >
                <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: '#B7FFB0',
    },
    title: {
        fontFamily: 'TitanOne',
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 33,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 24,
        marginBottom: 16,
        marginTop: 16,
        fontWeight: '300',
        fontFamily: 'TextMeOne'
    },
    row: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    input: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
    },
    pickerContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    flex1: {
        flex: 1,
    },
    marginRight: {
        marginRight: 8,
    },
    marginBottom: {
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#00bfff',
        padding: 16,
        borderRadius: 8,
        marginTop: 25,
    },
    buttonText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 20,
    },
});

export default RegisterScreen;
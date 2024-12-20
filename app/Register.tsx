import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import 'react-native-get-random-values';
import { User } from 'firebase/auth'
import { EventRegister } from 'react-native-event-listeners';
import { GooglePlaceData, GooglePlaceDetail, GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import firebaseService from '@/handlers/firebaseService';

const RegisterScreen = () => {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        dob: '',
        location: {
            address: '',
            city: '',
            state: '',
            zip: '',
            latitude: null,
            longitude: null
        },
        username: '',
        password: '',
        confirmPassword: ''
    });
    const [errorMsg, setErrorMsg] = useState(null);

    const updateLocationData = (locationInfo) => {
        setFormData(prev => ({
            ...prev,
            location: {
                address: locationInfo.address || '',
                city: locationInfo.city || '',
                state: locationInfo.state || '',
                zip: locationInfo.zip || '',
                latitude: locationInfo.latitude || null,
                longitude: locationInfo.longitude || null
            }
        }));
    };

    useEffect(() => {
        (async () => {
            // Request location permissions
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            try {
                // Get the user's current location
                let location = await Location.getCurrentPositionAsync({});

                // Reverse geocode to get address details
                const [addressDetails] = await Location.reverseGeocodeAsync({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                });

                // Update form data with current location details
                updateLocationData({
                    address: addressDetails.formattedAddress??'',
                    city: addressDetails.city,
                    state: addressDetails.region,
                    zip: addressDetails.postalCode,
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                });
            } catch (error) {
                console.error('Error getting location', error);
                setErrorMsg('Could not retrieve location');
            }
        })();

        const listener = EventRegister.on('userLoggedIn', (user) => {
            router.replace('/success');
            setTimeout(() => {
                router.replace('/(home)/Market');
            }, 2000); // Adjust the delay as needed
        });

        return () => {
            EventRegister.removeEventListener(listener);
        };
    }, []);



    const handleChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleLocationSelect = (data: GooglePlaceData, details: GooglePlaceDetail = null) => {
        if (details) {
            // Extract address components
            const addressComponents = details.address_components;
            const cityComponent = addressComponents.find(component =>
                component.types.includes('locality')
            );
            const stateComponent = addressComponents.find(component =>
                component.types.includes('administrative_area_level_1')
            );
            const zipComponent = addressComponents.find(component =>
                component.types.includes('postal_code')
            );

            updateLocationData({
                address: details.formatted_address,
                city: cityComponent ? cityComponent.long_name : '',
                state: stateComponent ? stateComponent.short_name : '',
                zip: zipComponent ? zipComponent.long_name : '',
                latitude: details.geometry.location.lat,
                longitude: details.geometry.location.lng
            });
        }
    };

    const handleRegister = async () => {
        try {
            await firebaseService.connect();

            const { email, password, firstName, lastName, dob, location, username } = formData;
            const user = await firebaseService.registerUser(email, password, username);
            setUser(user);

            const userData = {
                uid: user.uid,
                email: user.email,
                first: firstName,
                last: lastName,
                dob: dob,
                location: location,
                username: username,
                pfpUrl: 'https://firebasestorage.googleapis.com/v0/b/neighborfoods/o/cloud.gif?alt=media&token=81350c47-c9e3-4c75-8d9d-d0b9ff6e50f0',
                createdAt: new Date(),
                lastLogin: new Date()
            };
            await firebaseService.addDocument('user', userData);
            await firebaseService.disconnect();

            console.log('Registration successful!');
            EventRegister.emit('userLoggedIn', user);
        } catch (error) {
            alert(`Error registering user: ${error}`);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Register</Text>
            <ScrollView keyboardDismissMode='on-drag' keyboardShouldPersistTaps='handled'>
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
                { !errorMsg && <>
                <Text style={styles.sectionTitle}>Market Info</Text>
                    <GooglePlacesAutocomplete
                        placeholder='Enter your address'
                        onPress={handleLocationSelect}
                        query={{
                            key: 'AIzaSyCci8Td3waW6ToYzua9q6fxiNDetGa1sBI',
                            language: 'en',
                        }}
                        styles={{
                            textInput: styles.googlePlacesInput,
                            container: styles.googlePlacesContainer
                        }}
                        fetchDetails={true}
                        enablePoweredByContainer={false}
                        requestUrl={{
                            useOnPlatform: 'web',
                            url: 'https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api',
                        }}
                        disableScroll={true}
                    />

                    {/* Display selected location details */}
                    {formData.location.address ? (
                        <View style={styles.locationDetailsContainer}>
                            <Text style={styles.locationDetail}>
                                {formData.location.address}
                            </Text>
                        </View>
                    ):(
                        <View style={styles.locationDetailsContainer}>
                            <Text style={styles.locationDetail}>
                                {formData.location.city}, {formData.location.state} {formData.location.zip}
                            </Text>
                        </View>
                    )}</>
                }
                
                <Text style={styles.errorText}>{errorMsg}</Text>

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
            </ScrollView>
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
    errorText: {
        color: 'red',
        fontSize: 24,
        marginTop: 8,
        fontFamily: 'TextMeOne',
    },
    googlePlacesContainer: {
        marginBottom: 16,
    },
    googlePlacesInput: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
        height: 50,
    },
    locationDetailsContainer: {
        backgroundColor: '#00bfff',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    locationDetail: {
        fontSize: 18,
        color: '#fff',
        fontFamily: 'TextMeOne',
    },
});

export default RegisterScreen;
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Button,
    Platform
} from 'react-native';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import 'react-native-get-random-values';
import { updateProfile, User } from 'firebase/auth'
import { EventRegister } from 'react-native-event-listeners';
import { GooglePlaceData, GooglePlaceDetail, GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import firebaseService from '@/handlers/firebaseService';
import DatePicker from 'react-native-date-picker';
import { useUser } from '@/context/userContext';

const RegisterScreen = () => {
    const router = useRouter();
    const { setUserData } = useUser();
    const [user, setUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        dob: '',
        phone: '',
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
    const [errorMsg, setErrorMsg] = useState<{
        fields: string,
        phone: string,
        username1: string,
        username2: string,
        password1: string,
        password2: string,
        email: string,
        location: string,
    }>({
        fields: '',
        phone: '',
        username1: '',
        username2: '',
        password1: '',
        password2: '',
        email: '',
        location: '',
    });
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    const [disabled, setDisabled] = useState<boolean>(false);

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
                setErrorMsg({...errorMsg, 'location': 'Permission to access location was denied'});
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
                setErrorMsg({...errorMsg, 'location': 'Could not retrieve location'});
            }
        })();

        const userLoggedInListener = EventRegister.on('userLoggedIn', () => {
            router.replace('/success');
            setTimeout(() => {
                router.replace('/(home)/Market');
            }, 2000);
        });

        return () => {
            EventRegister.rm(userLoggedInListener);
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

    const validateFormData = () => {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const { firstName, lastName, email, dob, phone, location, username, password, confirmPassword } = formData;
        setErrorMsg({'fields': '', 'phone': '', 'username1': '', 'username2': '', 'password1': '', 'password2': '', 'email': '', 'location': ''});
        if (!firstName || !lastName || !email || !dob || !phone || !location.address || !username || !password || !confirmPassword) {
            setErrorMsg({ ...errorMsg, fields: 'All fields are required. If location is unavailable, please refresh the page.' });
            return false;
        }
        if (username.length < 6) {
            setErrorMsg({...errorMsg, 'username1': 'Username must be at least 6 characters.'});
            return false;
        }
        if (username.match(/[^a-zA-Z0-9]/)) {
            setErrorMsg({...errorMsg, 'username2': 'Username cannot contain special characters.'});
            return false;
        }
        if (password !== confirmPassword) {
            setErrorMsg({...errorMsg, 'password1': 'Passwords do not match.'});
            return false;
        }
        if (password.length < 6) {
            setErrorMsg({...errorMsg, 'password2': 'Password must be at least 6 characters.'});
            return false;
        }
        if (!emailPattern.test(email)) {
            setErrorMsg({...errorMsg, 'email': 'Invalid email format.'});
            return false;
        }
        if (phone.length !== 10 || phone.match(/[^0-9]/)) {
            setErrorMsg({...errorMsg, 'phone': 'Invalid phone number.'});
            return false;
        }
        setErrorMsg({'fields': '', 'phone': '', 'username1': '', 'username2': '', 'password1': '', 'password2': '', 'email': '', 'location': ''});
        return true;
    };

    const handleRegister = async () => {
        if (!validateFormData()) {
            return;
        }
        try {
            setDisabled(true);
            
            if (user) { 
                await firebaseService.logout();
            }
            
            const { email, password, phone, firstName, lastName, dob, location, username } = formData;
            const user = await firebaseService.registerUser(email, password, username);
            setUser(user);
            await updateProfile(user, {
                displayName: username, 
                photoURL: "https://firebasestorage.googleapis.com/v0/b/neighborfoods/o/cloud.gif?alt=media&token=81350c47-c9e3-4c75-8d9d-d0b9ff6e50f0",
            })
            
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: username,
                photoURL: "https://firebasestorage.googleapis.com/v0/b/neighborfoods/o/cloud.gif?alt=media&token=81350c47-c9e3-4c75-8d9d-d0b9ff6e50f0",
                first: firstName,
                last: lastName
            };
            
            // Store additional user data in Firestore
            const firestoreUserData = {
                uid: user.uid,
                email: user.email,
                first: firstName,
                last: lastName,
                phone: phone,
                dob: dob,
                location: location,
                username: username,
                createdAt: new Date(),
                lastLogin: new Date()
            };
            await firebaseService.addDocument('user', firestoreUserData);
            console.log('Registration successful!');
            
            // Store in context
            setUserData(userData);
            EventRegister.emit('userLoggedIn');
        } catch (error) {
            alert(`Error registering user: ${error.message}`);
            setDisabled(false);
        }
    };

    const handleDateChange = (date: Date) => {
        setShowDatePicker(false);
        handleChange('dob', date.toISOString().split('T')[0]);
    };

    const renderDatePicker = () => {
        if (Platform.OS === 'web') {
            return (
                <input
                    type="date"
                    style={{
                        ...styles.input,
                        flex: 1,
                        padding: 12,
                        borderRadius: 8,
                        fontSize: 16,
                        border: 'none',
                        width: '100%'
                    }}
                    value={formData.dob}
                    onChange={(e) => handleChange('dob', e.target.value)}
                />
            );
        }

        return (
            <View style={[styles.input, styles.flex1, styles.thin]}>
                <Button
                    onPress={() => setShowDatePicker(true)}
                    title={formData.dob ? formData.dob : "d.o.b."}
                    color={formData.dob ? '#00bfff' : '#999'}
                />
                {showDatePicker && (
                    <DatePicker
                        modal
                        open={showDatePicker}
                        date={formData.dob ? new Date(formData.dob) : new Date()}
                        mode="date"
                        onConfirm={handleDateChange}
                        onCancel={() => setShowDatePicker(false)}
                    />
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Register</Text>
            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 20}>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 200 : 160 }}
                    keyboardDismissMode='on-drag'
                    keyboardShouldPersistTaps='handled'
                    showsVerticalScrollIndicator={false}>
                    {/* Personal Details Section */}
                    <Text style={styles.sectionTitle}>Personal Details</Text>
                    {errorMsg.fields && <Text style={[styles.errorText, styles.largeText]}>{errorMsg.fields}</Text>}
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
                            style={[styles.input, styles.flex1, styles.marginRight, styles.thin]}
                            placeholder="email"
                            placeholderTextColor="#999"
                            keyboardType="email-address"
                            autoCapitalize='none'
                            value={formData.email}
                            onChangeText={(text) => handleChange('email', text)}
                        />
                        {errorMsg.email && <Text style={styles.errorText}>{errorMsg.email}</Text>}
                        {renderDatePicker()}
                    </View>
                    <TextInput
                        style={styles.input}
                        placeholder="phone number"
                        placeholderTextColor="#999"
                        keyboardType="phone-pad"
                        value={formData.phone}
                        onChangeText={(text) => handleChange('phone', text)}
                    />
                    {/* Market Info Section */}
                    { !errorMsg.location && <>
                    <Text style={styles.sectionTitle}>Market Info</Text>
                        <GooglePlacesAutocomplete
                            placeholder='Enter your address'
                            textInputProps={{
                                placeholderTextColor: '#999',
                                returnKeyType: "search"
                            }}
                            onPress={(data: GooglePlaceData, detail: GooglePlaceDetail | null) => handleLocationSelect(data, detail || undefined)}
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
                        ) : (
                            <View style={styles.locationDetailsContainer}>
                                <Text style={styles.locationDetail}>
                                    {formData.location.city}, {formData.location.state} {formData.location.zip}
                                </Text>
                            </View>
                        )}</>
                    }
                    {errorMsg.location && <Text style={styles.errorText}>{errorMsg.location}</Text>}

                    {/* Login Info Section */}
                    <Text style={styles.sectionTitle}>Login Info</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="username"
                        placeholderTextColor="#999"
                        value={formData.username}
                        autoCapitalize='none'
                        onChangeText={(text) => handleChange('username', text)}
                    />
                    <Text style={[styles.subtitle, styles.marginBottom]}>[ <Text style={errorMsg.username1 == '' ? styles.subtitle : styles.errorText}>must be at least 6 characters</Text> | <Text style={errorMsg.username2 == '' ? styles.subtitle : styles.errorText}>cannot contain special characters</Text> ]</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="password"
                        placeholderTextColor="#999"
                        secureTextEntry
                        textContentType='none'
                        value={formData.password}
                        autoCapitalize='none'
                        onChangeText={(text) => handleChange('password', text)}
                        />
                    <Text style={[styles.subtitle, styles.marginBottom]}>[ <Text style={errorMsg.password2?styles.errorText:styles.subtitle}>must be at least 6 characters</Text> ]</Text>
                    {errorMsg.password1 && <Text style={styles.errorText}>{errorMsg.password1}</Text>}
                    <TextInput
                        style={[styles.input, styles.marginBottom]}
                        placeholder="confirm password"
                        placeholderTextColor="#999"
                        secureTextEntry
                        textContentType='none'
                        value={formData.confirmPassword}
                        autoCapitalize='none'
                        onChangeText={(text) => handleChange('confirmPassword', text)}
                        />
                </ScrollView>
                <View style={[styles.buttonContainer, Platform.OS === 'ios' && styles.iosButtonContainer]}>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            disabled && styles.buttonDisabled,
                        ]}
                        onPress={handleRegister}
                    >
                        <Text style={[
                            styles.buttonText,
                            disabled && styles.buttonTextDisabled
                            ]}>
                                Register
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
            <KeyboardToolbar/>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#B7FFB0',
    },
    scrollView: {
        flexGrow: 1,
        paddingHorizontal: 10,
    },
    title: {
        fontFamily: 'TitanOne',
        fontSize: 36,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 40,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 24,
        marginBottom: 16,
        marginTop: 16,
        fontWeight: '300',
        fontFamily: 'TextMeOne'
    },
    subtitle: {
        fontSize:10,
        marginLeft: 15,
        fontFamily: 'TextMeOne',
        color: '#000',
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
    thin: {
        paddingVertical: 3,
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
    buttonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    iosButtonContainer: {
        bottom: 0,
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
    errorText: {
        color: 'red',
        fontSize: 10,
        marginVertical: 2,
        fontFamily: 'TextMeOne',
    },
    largeText: {
        fontSize: 20,
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
    buttonDisabled: {
        backgroundColor: '#ccc',
        opacity: 0.7,
    },
    buttonTextDisabled: {
        color: '#666'
    }
});

export default RegisterScreen;
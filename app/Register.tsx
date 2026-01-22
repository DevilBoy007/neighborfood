import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Button,
    Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { updateProfile, User } from 'firebase/auth';
import { EventRegister } from 'react-native-event-listeners';
import firebaseService from '@/handlers/firebaseService';
import { useUser, useLocation } from '@/store/reduxHooks';
import { GeoPoint } from 'firebase/firestore';
import { SoundTouchableOpacity } from '@/components/SoundTouchableOpacity';

/* eslint-disable @typescript-eslint/no-require-imports */
// Conditionally import problematic native-only modules
const KeyboardControllerImport = Platform.OS !== 'web' ? 
  require('react-native-keyboard-controller') : 
  { KeyboardToolbar: React.Fragment };

const KeyboardToolbar = KeyboardControllerImport.KeyboardToolbar;

// Only import react-native-get-random-values on native platforms
if (Platform.OS !== 'web') {
  require('react-native-get-random-values');
}

// Conditionally import native-only components
let GooglePlacesAutocomplete;
if (Platform.OS !== 'web') {
  const GooglePlacesImport = require('react-native-google-places-autocomplete');
  GooglePlacesAutocomplete = GooglePlacesImport.GooglePlacesAutocomplete;
} else {
  // Import the web-compatible component
  GooglePlacesAutocomplete = require('@/components/WebGooglePlacesAutocomplete').default;
}

// Conditionally import DatePicker
let DatePicker;
if (Platform.OS !== 'web') {
  DatePicker = require('react-native-date-picker').default;
} else {
  // Web doesn't need the native DatePicker component
  const WebDatePicker = () => null;
  WebDatePicker.displayName = 'WebDatePicker';
  DatePicker = WebDatePicker;
}
/* eslint-enable @typescript-eslint/no-require-imports */
const RegisterScreen = () => {
    const router = useRouter();
    const { setUserData } = useUser();
    const [, setUser] = useState<User | null>(null);
    const { locationData, fetchCurrentLocation } = useLocation();
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
            coords: {
                latitude: null,
                longitude: null
            }
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
    const [locationSelected, setLocationSelected] = useState(false);

    const updateLocationData = (locationInfo) => {
        console.log("Updating location data with:", locationInfo);
        
        setFormData(prev => ({
            ...prev,
            location: {
                address: locationInfo.address || '',
                city: locationInfo.city || '',
                state: locationInfo.state || '',
                zip: locationInfo.zip || '',
                coords: {
                    latitude: locationInfo.latitude || null,
                    longitude: locationInfo.longitude || null
                }
            }
        }));

        if (locationInfo.address && locationInfo.address.trim() !== '') {
            setLocationSelected(true);
        }
    };
    
    useEffect(() => {
        (async () => {
            if (!locationSelected) {
                try {
                    await fetchCurrentLocation();

                    if (locationData.coords && !locationData.error && !locationSelected) {
                        updateLocationData({
                            address: locationData.coords ? `${locationData.zipCode || ''}` : '',
                            city: '', 
                            state: '',
                            zip: locationData.zipCode || '',
                            latitude: locationData.coords.latitude,
                            longitude: locationData.coords.longitude
                        });
                    } else if (locationData.error) {
                        setErrorMsg({...errorMsg, 'location': locationData.error});
                    }
                } catch (error) {
                    console.error('Error getting location', error);
                    setErrorMsg({...errorMsg, 'location': 'Could not retrieve location'});
                }
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locationData.coords, locationData.zipCode]);
    
    useEffect(() => {
        const userLoggedInListener = EventRegister.on('userLoggedIn', () => {
            router.replace('/success');
            setTimeout(() => {
                router.replace('/(home)/Market');
            }, 2000);
        });

        return () => {
            EventRegister.rm(userLoggedInListener);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleLocationSelect = (data: any, details: any = null) => {
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

            let latitude, longitude;
            
            // Check if we have proper geometry data
            if (details.geometry && details.geometry.location) {
                // Handle both function and direct value cases
                if (typeof details.geometry.location.lat === 'function') {
                    latitude = details.geometry.location.lat();
                } else {
                    latitude = details.geometry.location.lat;
                }
                
                if (typeof details.geometry.location.lng === 'function') {
                    longitude = details.geometry.location.lng();
                } else {
                    longitude = details.geometry.location.lng;
                }
            }
            
            console.log("Selected location coordinates (extracted):", latitude, longitude);
            
            setLocationSelected(true);
            
            updateLocationData({
                address: details.formatted_address,
                city: cityComponent ? cityComponent.long_name : '',
                state: stateComponent ? stateComponent.short_name : '',
                zip: zipComponent ? zipComponent.long_name : '',
                latitude: latitude || 0,
                longitude: longitude || 0
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
            
            await firebaseService.logout();
            
            const { email, password, phone, firstName, lastName, dob, location, username } = formData;
            const newUser = await firebaseService.registerUser(email, password, username);
            setUser(newUser);
            
            await updateProfile(newUser, {
                displayName: username, 
                photoURL: "https://firebasestorage.googleapis.com/v0/b/neighborfoods/o/cloud.gif?alt=media&token=81350c47-c9e3-4c75-8d9d-d0b9ff6e50f0",
            });
            
            const userData = {
                uid: newUser.uid,
                email: newUser.email,
                displayName: username,
                photoURL: "https://firebasestorage.googleapis.com/v0/b/neighborfoods/o/cloud.gif?alt=media&token=81350c47-c9e3-4c75-8d9d-d0b9ff6e50f0",
                createdAt: new Date(),
                first: firstName,
                last: lastName,
                phone: phone,
                dob: dob,
                location: location
            };

            // Extract latitude and longitude with proper checks
            const lat = location.coords && typeof location.coords.latitude === 'number' ? location.coords.latitude : 0;
            const lng = location.coords && typeof location.coords.longitude === 'number' ? location.coords.longitude : 0;
            
            // Only validate if we have non-zero coordinates
            let validLat = lat;
            let validLng = lng;
            
            if (lat !== 0 || lng !== 0) {
                validLat = Math.max(-90, Math.min(90, lat));
                validLng = Math.max(-180, Math.min(180, lng));
            }
            
            console.log("Coordinates being saved:", validLat, validLng);

            const locationWithGeoPoint = {
                address: location.address,
                city: location.city,
                state: location.state,
                zip: location.zip,
                coords: new GeoPoint(validLat, validLng)
            };

            const firestoreData = {
                createdAt: new Date(),
                dob: userData.dob,
                first: userData.first,
                last: userData.last,
                location: locationWithGeoPoint,
                phone: userData.phone,
                username: username
            }
            
            await firebaseService.addDocument('users', firestoreData, userData.uid);
            console.log('Registration successful!');
            
            // Store userData in context
            setUserData(userData);
            EventRegister.emit('userLoggedIn');
        } catch (error) {
            console.error('Registration error:', error);
            alert(`Error registering user: ${error.message || 'Unknown error'}`);
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

        if (Platform.OS !== 'web' && DatePicker) {
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
        }
        
        return null;
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
                    {errorMsg.fields ? <Text style={[styles.errorText, styles.largeText]}>{errorMsg.fields}</Text> : null}
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
                        {errorMsg.email ? <Text style={styles.errorText}>{errorMsg.email}</Text> : null}
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
                    {!errorMsg.location ? (
                        <>
                            <Text style={styles.sectionTitle}>Market Info</Text>
                            <View style={styles.googlePlacesWrapper}>
                                <GooglePlacesAutocomplete
                                    placeholder='Enter your address'
                                    textInputProps={{
                                        placeholderTextColor: '#999',
                                        returnKeyType: "search"
                                    }}
                                    onPress={handleLocationSelect}
                                    query={{
                                        key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
                                        language: 'en',
                                    }}
                                    styles={{
                                        textInput: styles.googlePlacesInput,
                                        container: {
                                            ...styles.googlePlacesContainer,
                                            zIndex: 9999
                                        },
                                        listView: {
                                            zIndex: 10000,
                                            position: 'relative'
                                        }
                                    }}
                                    predefinedPlaces={[]}
                                    fetchDetails={true}
                                    enablePoweredByContainer={false}
                                    minLength={3}
                                    keyboardShouldPersistTaps='handled'
                                    disableScroll={true}
                                    requestUrl={{
                                        useOnPlatform: 'web',
                                        url: 'https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api',
                                    }}
                                />
                            </View>

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
                            )}
                        </>
                    ) : null}
                    {errorMsg.location ? <Text style={styles.errorText}>{errorMsg.location}</Text> : null}

                    {/* Login Info Section */}
                    <View style={{ marginTop: 60 }}>
                        <Text style={styles.sectionTitle}>Login Info</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="username"
                            placeholderTextColor="#999"
                            value={formData.username}
                            autoCapitalize='none'
                            onChangeText={(text) => handleChange('username', text)}
                        />
                        <Text style={[styles.subtitle, styles.marginBottom]}>
                            [ <Text style={errorMsg.username1 === '' ? styles.subtitle : styles.errorText}>
                                must be at least 6 characters
                              </Text> | <Text style={errorMsg.username2 === '' ? styles.subtitle : styles.errorText}>
                                cannot contain special characters
                              </Text> ]
                        </Text>
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
                        <Text style={[styles.subtitle, styles.marginBottom]}>
                            [ <Text style={errorMsg.password2 ? styles.errorText : styles.subtitle}>
                                must be at least 6 characters
                              </Text> ]
                        </Text>
                        {errorMsg.password1 ? <Text style={styles.errorText}>{errorMsg.password1}</Text> : null}
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
                    </View>
                </ScrollView>
                <View style={[styles.buttonContainer, Platform.OS === 'ios' && styles.iosButtonContainer]}>
                    <SoundTouchableOpacity
                        style={[
                            styles.button,
                            disabled && styles.buttonDisabled,
                        ]}
                        onPress={handleRegister}
                        soundType="click"
                    >
                        <Text style={[
                            styles.buttonText,
                            disabled && styles.buttonTextDisabled
                        ]}>
                            Register
                        </Text>
                    </SoundTouchableOpacity>
                </View>
            </KeyboardAvoidingView>
            {Platform.OS !== 'web' ? <KeyboardToolbar /> : null}
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
    googlePlacesWrapper: {
        position: 'relative',
        zIndex: 9999,
        marginBottom: 10,
    },
    googlePlacesContainer: {
        marginBottom: 16,
        zIndex: 9999,
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
        zIndex: 1, // Lower z-index than predictions
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
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Platform,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    StyleSheet,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useUser } from '@/context/userContext';
import firebaseService from '@/handlers/firebaseService';
import { GeoPoint } from 'firebase/firestore';

const weekDays = Platform.OS === 'web' ? ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] : ['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su'];
const seasons = ['spring', 'summer', 'fall', 'winter'];

export default function ShopRegistrationScreen() {
    const [name, setName] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [type, setType] = useState<string>('');
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
    const [openTime, setOpenTime] = useState<string>('');
    const [closeTime, setCloseTime] = useState<string>('');
    const [allowPickup, setAllowPickup] = useState<boolean>(false);
    const [localDelivery, setLocalDelivery] = useState<boolean>(false);
    
    const [errors, setErrors] = useState({
        name: '',
        description: '',
        type: '',
        days: '',
        seasons: '',
        hours: '',
        delivery: '',
    });

    // Get the user data from context
    const { userData } = useUser();
    const router = useRouter();

    const toggleDay = (day: string) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    const toggleSeason = (season: string) => {
        if (selectedSeasons.includes(season)) {
            setSelectedSeasons(selectedSeasons.filter(s => s !== season));
        } else {
            setSelectedSeasons([...selectedSeasons, season]);
        }
    };
    
    // Validate time format (24-hour format: HH:MM)
    const isValidTimeFormat = (time: string): boolean => {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    };
    
    const validateForm = () => {
        let isValid = true;
        const newErrors = {
            name: '',
            description: '',
            type: '',
            days: '',
            seasons: '',
            hours: '',
            delivery: '',
        };

        if (!name.trim()) {
            newErrors.name = 'Shop name is required';
            isValid = false;
        }

        if (!description.trim()) {
            newErrors.description = 'Description is required';
            isValid = false;
        }

        if (!type) {
            newErrors.type = 'Please select a shop type';
            isValid = false;
        }

        if (selectedDays.length === 0) {
            newErrors.days = 'Please select at least one day';
            isValid = false;
        }

        if (selectedSeasons.length === 0) {
            newErrors.seasons = 'Please select at least one season';
            isValid = false;
        }

        // Validate open and close times
        if (!openTime.trim() || !closeTime.trim()) {
            newErrors.hours = 'Please provide both opening and closing times';
            isValid = false;
        } else if (!isValidTimeFormat(openTime) || !isValidTimeFormat(closeTime)) {
            newErrors.hours = 'Times must be in 24-hour format (e.g., 09:00, 17:30)';
            isValid = false;
        }

        if (!allowPickup && !localDelivery) {
            newErrors.delivery = 'Please select at least one delivery option';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async () => {
        if (validateForm()) {
            try {
                // Ensure user is authenticated before creating a shop
                if (!userData || !userData.uid) {
                    Alert.alert('Error', 'You must be logged in to create a shop');
                    return;
                }

                const shopData = {
                    name,
                    description,
                    type,
                    days: selectedDays,
                    seasons: selectedSeasons,
                    openTime,
                    closeTime,
                    allowPickup,
                    localDelivery,
                    location: new GeoPoint(userData.location.coords.latitude, userData.location.coords.longitude),
                    marketId: userData.location.zip || '',  // Associate shop with user's market
                    userId: userData.uid,  // Associate shop with current user
                    createdAt: new Date(),
                    backgroundImageUrl: 'https://cdn.shopify.com/s/files/1/0247/7771/9862/files/Kona-Fab-Farm-Quilt_480x480.jpg?v=1718261403'
                };
                
                // Connect to firebase
                await firebaseService.connect();
                
                // Add shop to database
                await firebaseService.createShopForUser(userData.uid, shopData)
                .then(() => {
                    console.log('Shop created successfully!');
                    router.navigate('/success');
                    setTimeout(() => {
                        router.back();
                    }, 2000);
                });
            } catch (error) {
                Alert.alert('Error', 'Failed to create shop. Please try again.');
            }
        } else {
            if (Platform.OS === 'web') {
                window.scrollTo(0, 0);
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.sectionTitle}>Manage Shops</Text>
            </View>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 20}>
                
            <ScrollView 
                style={styles.container}
                contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 50 : 50 }}
                keyboardDismissMode='on-drag'
                keyboardShouldPersistTaps='handled'
                showsVerticalScrollIndicator={false}>
                <View style={styles.formContainer}>
                    <Text style={styles.sectionTitle}>Shop Info</Text>
                    <TextInput
                        style={[styles.input, errors.name ? styles.inputError : null]}
                        placeholder="shop name"
                        placeholderTextColor={'#999'}
                        value={name}
                        onChangeText={(text) => {
                            setName(text);
                            if (text.trim()) setErrors({...errors, name: ''});
                        }}
                    />
                    {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
                    
                    <TextInput
                        style={[styles.input, styles.textArea, errors.description ? styles.inputError : null]}
                        placeholder="description"
                        placeholderTextColor={'#999'}
                        multiline
                        minHeight={Platform.OS === 'ios' ? 80 : null}
                        value={description}
                        onChangeText={(text) => {
                            setDescription(text);
                            if (text.trim()) setErrors({...errors, description: ''});
                        }}
                    />
                    {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}

                    <Text style={styles.sectionTitle}>Market Info</Text>
                    {Platform.OS === 'web' ? (
                        <>
                            <select
                                style={{
                                    ...styles.webSelect, 
                                    ...(errors.type ? styles.webSelectError : {})
                                }}
                                value={type}
                                onChange={(e) => {
                                    setType(e.target.value);
                                    if (e.target.value) setErrors({...errors, type: ''});
                                }}
                            >
                                <option value="">type</option>
                                <option value="general">General</option>
                                <option value="produce">Produce</option>
                                <option value="farm">Farm</option>
                                <option value="grainery">Grainery</option>
                                <option value="butchery">Butchery</option>
                                <option value="spices">Spices</option>
                                <option value="bakery">Bakery</option>
                                <option value="homemade">Homemade Goods</option>
                            </select>
                            {errors.type ? <Text style={styles.errorText}>{errors.type}</Text> : null}
                        </>
                    ) : (
                        <>
                            <View style={errors.type ? styles.pickerError : null}>
                                <Picker
                                    selectedValue={type}
                                    onValueChange={(value) => {
                                        setType(value);
                                        if (value) setErrors({...errors, type: ''});
                                    }}
                                    style={styles.picker}
                                    itemStyle={{ height: 150, fontFamily: 'TextMeOne' }}
                                >
                                    <Picker.Item color="#00bfff" label="type" value="" />
                                    <Picker.Item color="black" label="General" value="general" />
                                    <Picker.Item color="black" label="Produce" value="produce" />
                                    <Picker.Item color="black" label="Farm" value="farm" />
                                    <Picker.Item color="black" label="Grainery" value="grainery" />
                                    <Picker.Item color="black" label="Butchery" value="butchery" />
                                    <Picker.Item color="black" label="Spices" value="spices" />
                                    <Picker.Item color="black" label="Bakery" value="bakery" />
                                    <Picker.Item color="black" label="Homemade Goods" value="homemade" />
                                </Picker>
                            </View>
                            {errors.type ? <Text style={styles.errorText}>{errors.type}</Text> : null}
                        </>
                    )}

                    <Text style={styles.sectionTitle}>Availability</Text>
                    <Text style={styles.sectionSubtitle}>Days</Text>
                    <View style={styles.daysContainer}>
                        {weekDays.map((day) => (
                            <TouchableOpacity
                                key={day}
                                style={[
                                    styles.dayButton,
                                    selectedDays.includes(day) && styles.selectedButton
                                ]}
                                onPress={() => {
                                    toggleDay(day);
                                    if (selectedDays.length > 0 || day) setErrors({...errors, days: ''});
                                }}
                            >
                                <Text style={[
                                    styles.dayButtonText,
                                    selectedDays.includes(day) && styles.selectedButtonText
                                ]}>
                                    {day}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {errors.days ? <Text style={styles.errorText}>{errors.days}</Text> : null}

                    <Text style={styles.sectionSubtitle}>Seasons</Text>
                    <View style={styles.seasonsContainer}>
                        {seasons.map((season) => (
                            <TouchableOpacity
                                key={season}
                                style={[
                                    styles.seasonButton,
                                    selectedSeasons.includes(season) && styles.selectedButton
                                ]}
                                onPress={() => {
                                    toggleSeason(season);
                                    if (selectedSeasons.length > 0 || season) setErrors({...errors, seasons: ''});
                                }}
                            >
                                <Text style={[
                                    styles.seasonButtonText,
                                    selectedSeasons.includes(season) && styles.selectedButtonText
                                ]}>
                                    <Ionicons
                                    name={
                                        season === 'spring' ? 'rose-outline' :
                                        season === 'summer' ? 'sunny-outline' :
                                        season === 'fall' ? 'leaf-outline' :
                                        'snow-outline'
                                    }
                                    size={18}
                                    style={selectedSeasons.includes(season) ? {color: '#fff'} : {color: '#333'}}
                                    />
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {errors.seasons ? <Text style={styles.errorText}>{errors.seasons}</Text> : null}
                    
                    <Text style={styles.sectionSubtitle}>Hours</Text>
                    <View style={styles.hoursContainer}>
                        <View style={styles.timeInput}>
                            <TextInput
                                style={[styles.input, errors.hours ? styles.inputError : null]}
                                placeholder="09:00"
                                placeholderTextColor={'#999'}
                                value={openTime}
                                onChangeText={(text) => {
                                    setOpenTime(text);
                                    if (text.trim() || closeTime.trim()) setErrors({...errors, hours: ''});
                                }}
                            />
                            <Text style={styles.timeLabel}>(opening time)</Text>
                        </View>
                        <View style={styles.timeInput}>
                            <TextInput
                                style={[styles.input, errors.hours ? styles.inputError : null]}
                                placeholder="17:00"
                                placeholderTextColor={'#999'}
                                value={closeTime}
                                onChangeText={(text) => {
                                    setCloseTime(text);
                                    if (openTime.trim() || text.trim()) setErrors({...errors, hours: ''});
                                }}
                            />
                            <Text style={styles.timeLabel}>(closing time)</Text>
                        </View>
                    </View>
                    {errors.hours ? <Text style={styles.errorText}>{errors.hours}</Text> : null}
                    
                    <View style={styles.checkboxContainer}>
                        <TouchableOpacity
                            style={styles.checkbox}
                            onPress={() => {
                                setAllowPickup(!allowPickup);
                                if (!allowPickup || localDelivery) setErrors({...errors, delivery: ''});
                            }}
                        >
                            <View style={[
                                styles.checkboxBox,
                                allowPickup && styles.checkboxChecked
                            ]} />
                            <Text style={styles.checkboxLabel}>allow pickup</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.checkbox}
                            onPress={() => {
                                setLocalDelivery(!localDelivery);
                                if (allowPickup || !localDelivery) setErrors({...errors, delivery: ''});
                            }}
                        >
                            <View style={[
                                styles.checkboxBox,
                                localDelivery && styles.checkboxChecked
                            ]} />
                            <Text style={styles.checkboxLabel}>local delivery</Text>
                        </TouchableOpacity>
                        {errors.delivery ? <Text style={styles.errorText}>{errors.delivery}</Text> : null}
                    </View>
                </View>
            </ScrollView>
            </KeyboardAvoidingView>
            <View style={[styles.buttonContainer, Platform.OS === 'ios' && styles.iosButtonContainer]}>
                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.buttonText}>Create</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    inputError: {
        borderWidth: 1,
        borderColor: 'red',
    },
    webSelectError: {
        borderWidth: 1,
        borderColor: 'red',
    },
    pickerError: {
        borderWidth: 1,
        borderColor: 'red',
        borderRadius: 8,
        overflow: 'hidden',
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
        fontSize: 14,
    },
    container: {
        flex: 1,
        backgroundColor: '#b7ffb0',
    },
    formContainer: {
        paddingHorizontal: 20,
        alignSelf: 'center',
        width: '100%',
    },
    backButton: {
        marginRight: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomColor: '#000',
        borderBottomWidth: 1,
        ...Platform.select({
            ios: {
                justifyContent: 'flex-end',
            }
        })
    },
    sectionTitle: {
        fontSize: 24,
        marginVertical: 15,
        color: '#fff',
        fontFamily: 'TitanOne'
    },
    sectionSubtitle: {
        fontSize: 18,
        marginVertical: 15,
        color: 'black',
        fontFamily: 'TitanOne',
        textAlign: 'right',
    },
    input: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        fontFamily: 'TextMeOne',
        fontSize: 16,
    },
    textArea: {
        height: Platform.OS === 'web' ? 100 : null,
        textAlignVertical: 'top',
    },
    webSelect: {
        backgroundColor: '#fff',
        height: 50,
        padding: 15,
        borderRadius: 3,
        marginBottom: 15,
        fontSize: 16,
        width: '100%',
        borderWidth: 1,
        borderColor: '#999',
    },
    picker: {
        color: '#333',
        backgroundColor: '#fff',
        marginBottom: 25,
    },
    daysContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    dayButton: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
        width: 40,
        alignItems: 'center',
        ...Platform.select({
            web: {
                width: '10%',
            }
        })
    },
    seasonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        flexWrap: 'wrap',
    },
    seasonButton: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
        width: '20%',
        alignItems: 'center',
    },
    selectedButton: {
        backgroundColor: '#00bfff',
    },
    dayButtonText: {
        color: '#333',
    },
    seasonButtonText: {
        color: '#333',
    },
    selectedButtonText: {
        color: '#fff',
    },
    hoursContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    timeInput: {
        width: '48%',
    },
    timeLabel: {
        color: '#666',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 5,
    },
    checkboxContainer: {
        marginBottom: 20,
    },
    checkbox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    checkboxBox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#000',
        marginRight: 10,
        borderRadius: 4,
    },
    checkboxChecked: {
        backgroundColor: '#00bfff',
        borderColor: '#00bfff',
    },
    checkboxLabel: {
        color: '#333',
        fontSize: 16,
    },
    buttonContainer: {
        bottom: 0,
        left: 0,
        right: 0,
    },
    iosButtonContainer: {
        bottom: 30,
    },
    button: {
        width: '100%',
        padding: 10,
        paddingBottom: 33,
        backgroundColor: '#87CEFA',
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 30,
        fontFamily: 'TextMeOne',
    },
});
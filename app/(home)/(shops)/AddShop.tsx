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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';

const weekDays = ['M', 'T', 'W', 'Th', 'F', 'Sat', 'Sun'];
const seasons = ['spring', 'summer', 'fall', 'winter'];

export default function ShopRegistrationScreen() {
    const [shopName, setShopName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('');
    const [selectedDays, setSelectedDays] = useState([]);
    const [selectedSeasons, setSelectedSeasons] = useState([]);
    const [earlierHours, setEarlierHours] = useState('');
    const [laterHours, setLaterHours] = useState('');
    const [allowPickup, setAllowPickup] = useState(false);
    const [localDelivery, setLocalDelivery] = useState(false);

    const router = useRouter();

    const toggleDay = (day) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    const toggleSeason = (season) => {
        if (selectedSeasons.includes(season)) {
            setSelectedSeasons(selectedSeasons.filter(s => s !== season));
        } else {
            setSelectedSeasons([...selectedSeasons, season]);
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
                        style={styles.input}
                        placeholder="shop name"
                        placeholderTextColor={'#999'}
                        value={shopName}
                        onChangeText={setShopName}
                    />
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="description"
                        placeholderTextColor={'#999'}
                        multiline
                        minHeight={Platform.OS === 'ios' ? 80 : null}
                        value={description}
                        onChangeText={setDescription}
                    />

                    <Text style={styles.sectionTitle}>Market Info</Text>
                    {Platform.OS === 'web' ? (
                        <select
                            style={styles.webSelect}
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="">type</option>
                            <option value="farmers">Farmers Market</option>
                            <option value="crafts">Crafts Market</option>
                            <option value="food">Food Market</option>
                        </select>
                    ) : (
                        <Picker
                            selectedValue={type}
                            onValueChange={setType}
                            style={styles.picker}
                        >
                            <Picker.Item label="type" value="" />
                            <Picker.Item label="Farmers Market" value="farmers" />
                            <Picker.Item label="Crafts Market" value="crafts" />
                            <Picker.Item label="Food Market" value="food" />
                        </Picker>
                    )}

                    <Text style={styles.sectionTitle}>Availability</Text>
                    <View style={styles.daysContainer}>
                        {weekDays.map((day) => (
                            <TouchableOpacity
                                key={day}
                                style={[
                                    styles.dayButton,
                                    selectedDays.includes(day) && styles.selectedButton
                                ]}
                                onPress={() => toggleDay(day)}
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

                    <View style={styles.seasonsContainer}>
                        {seasons.map((season) => (
                            <TouchableOpacity
                                key={season}
                                style={[
                                    styles.seasonButton,
                                    selectedSeasons.includes(season) && styles.selectedButton
                                ]}
                                onPress={() => toggleSeason(season)}
                            >
                                <Text style={[
                                    styles.seasonButtonText,
                                    selectedSeasons.includes(season) && styles.selectedButtonText
                                ]}>
                                    {season}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.hoursContainer}>
                        <View style={styles.timeInput}>
                            <TextInput
                                style={styles.input}
                                placeholder="earlier"
                                value={earlierHours}
                                onChangeText={setEarlierHours}
                            />
                            <Text style={styles.timeLabel}>(earlier hours)</Text>
                        </View>
                        <View style={styles.timeInput}>
                            <TextInput
                                style={styles.input}
                                placeholder="later"
                                value={laterHours}
                                onChangeText={setLaterHours}
                            />
                            <Text style={styles.timeLabel}>(after noon)</Text>
                        </View>
                    </View>

                    <View style={styles.checkboxContainer}>
                        <TouchableOpacity
                            style={styles.checkbox}
                            onPress={() => setAllowPickup(!allowPickup)}
                        >
                            <View style={[
                                styles.checkboxBox,
                                allowPickup && styles.checkboxChecked
                            ]} />
                            <Text style={styles.checkboxLabel}>allow pickup</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.checkbox}
                            onPress={() => setLocalDelivery(!localDelivery)}
                        >
                            <View style={[
                                styles.checkboxBox,
                                localDelivery && styles.checkboxChecked
                            ]} />
                            <Text style={styles.checkboxLabel}>local delivery</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
            </KeyboardAvoidingView>
            <View style={[styles.buttonContainer, Platform.OS === 'ios' && styles.iosButtonContainer]}>
                <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Create</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
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
    input: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        fontSize: 16,
    },
    textArea: {
        height: Platform.OS === 'web' ? 100 : null,
        textAlignVertical: 'top',
    },
    webSelect: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        fontSize: 16,
        width: '100%',
        border: '1px solid #ddd',
    },
    picker: {
        backgroundColor: '#fff',
        marginBottom: 15,
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
        width: '23%',
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
        borderColor: '#ddd',
        marginRight: 10,
        borderRadius: 4,
    },
    checkboxChecked: {
        backgroundColor: '#90EE90',
        borderColor: '#90EE90',
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
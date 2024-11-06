import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const ContactScreen = () => {
    const router = useRouter();
    const [selectedOption, setSelectedOption] = useState(null);
    const [message, setMessage] = useState('');

    const options = ['feedback', 'question', 'other'];

    const handleSubmit = () => {
        // Handle form submission here
        console.log('Selected option:', selectedOption);
        console.log('Message:', message);
        router.back();
        router.push('/success');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={()=>{ router.back() }}>
                    <Ionicons name='chevron-back' color="#000" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerText}>Contact Us</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>what's on your mind?</Text>

                {options.map((option) => (
                    <TouchableOpacity
                        key={option}
                        style={[
                            styles.optionButton,
                            selectedOption === option && styles.selectedOption
                        ]}
                        onPress={() => setSelectedOption(option)}
                    >
                        <Text style={styles.optionText}>{option}</Text>
                    </TouchableOpacity>
                ))}

                {selectedOption && (
                    <TextInput
                        style={styles.textInput}
                        multiline
                        placeholder="Type your message here..."
                        value={message}
                        onChangeText={setMessage}
                    />
                )}
            </View>

            <TouchableOpacity
                style={[
                    styles.submitButton,
                    (!selectedOption || !message) && styles.submitButtonDisabled
                ]}
                disabled={!selectedOption || !message}
                onPress={handleSubmit}
            >
                <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#b7ffb0',
        paddingTop: 50,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        ...Platform.select({
            ios: {
                justifyContent: 'flex-end',
            },
        }),
    },
    backButton: {
        padding: 8,
    },
    headerText: {
        fontSize: 24,
        fontWeight: '500',
        marginLeft: 16,
        fontFamily: 'TitanOne',
        color: '#fff',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    title: {
        fontSize: 24,
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#000',
        paddingBottom: 8,
        fontFamily: 'TextMeOne',
        fontWeight: 'bold',
    },
    optionButton: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    selectedOption: {
        backgroundColor: '#00bfff',
    },
    optionText: {
        fontSize: Platform.OS === 'web' ? 21 : 18,
        textAlign: 'center',
        fontFamily: 'TextMeOne',
    },
    textInput: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        height: 150,
        marginTop: 24,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: '#87CEFA',
        padding: 20,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                marginBottom: 36,
            }
        })
    },
    submitButtonDisabled: {
        backgroundColor: '#ddd',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: Platform.OS === 'web' ? 30 : 25,
        fontWeight: '500',
        fontFamily: 'TitanOne',
    },
});

export default ContactScreen;
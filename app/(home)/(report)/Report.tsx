import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';

const ReportScreen = () => {
    const router = useRouter();
    const [selectedOption, setSelectedOption] = useState(null);
    const [problem, setProblem] = useState('');

    const options = ['order', 'shop', 'account', 'other'];

    const handleNext = (path) => {
        // Handle form submission here
        console.log('Selected option:', selectedOption);
        console.log('Problem:', problem);
        console.log('Path:', path);
        switch (selectedOption) {
            case 'order':
                router.navigate('./(order)');
                break;
            case 'shop':
                router.navigate('/ShopIssue');
                break;
            case 'account':
                router.navigate('/AccountIssue');
                break;
            case 'other':
                router.navigate('/OtherIssue');
                break;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => { router.back() }}>
                    <Ionicons name='chevron-back' color="#000" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerText}>Report Problem</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>what's the issue?</Text>

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
                {problem !== '' && (
                    <TouchableOpacity
                        key={problem}
                        style={[
                            styles.optionButton,
                            selectedOption === problem && styles.selectedOption
                        ]}
                        onPress={() => setSelectedOption(problem)}
                    >
                        <Text style={styles.optionText}>{problem}</Text>
                    </TouchableOpacity>
                )}
                {selectedOption == 'other' && (
                    <TextInput
                        style={styles.textInput}
                        placeholder="New Issue Category"
                        placeholderTextColor={'#999'}
                        value={problem}
                        onChangeText={setProblem}
                    />
                )}
            </View>

            <TouchableOpacity
                style={[
                    styles.nextButton,
                    (!selectedOption || (selectedOption == 'other' && !problem)) && styles.nextButtonDisabled
                ]}
                disabled={!selectedOption || (selectedOption == 'other' && !problem)}
                onPress={() => handleNext(selectedOption == 'other' ? problem : selectedOption)}
            >
                <Text style={styles.nextButtonText}>Next</Text>
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
        fontSize: Platform.OS === 'web' ? 21 : 18,
        fontFamily: 'TextMeOne',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        textAlignVertical: 'top',
    },
    nextButton: {
        backgroundColor: '#87CEFA',
        padding: 20,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                marginBottom: 36,
            }
        })
    },
    nextButtonDisabled: {
        backgroundColor: '#ddd',
    },
    nextButtonText: {
        color: '#fff',
        fontSize: Platform.OS === 'web' ? 30 : 25,
        fontWeight: '500',
        fontFamily: 'TitanOne',
    },
});

export default ReportScreen;
import React, { useState } from 'react';
import { useRouter } from 'expo-router'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import OrderCard from '@/components/OrderCard';
import { TextInput } from 'react-native-gesture-handler';

const OrderHistoryScreen = () => {
    const router = useRouter();
    // when we hook up a database we will replace this & pass it around with the router
    const orders = [
        {
            date: 'Sun, Oct 20',
            total: '36.90',
            shops: ["Ann's Apples", "Bakr's Baskets"],
            items: 9
        },
    ];
    const [issue, setIssue] = useState('');
    const [selectedOption, setSelectedOption] = useState(null);
    const options = ['bad product', 'missing product', 'later than anticipated', 'never delivered', 'other'];

    const handleOrderPress = (order) => {
        router.setParams({ order });
        router.push('/(home)/(orders)/OrderDetails');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>report order</Text>
            </View>
            <Text style={styles.title}>describe the issue</Text>
            <View style={{ padding: 16 }}>
                {orders.map((order, index) => (
                        <OrderCard
                            key={index}
                            order={order}
                            onPress={() => handleOrderPress(order)}
                        />
                    ))}
            </View>
            
            <ScrollView style={styles.scrollView}>
                {options.map((option) => (
                    <TouchableOpacity
                        key={option}
                        style={[
                            styles.optionButton,
                            selectedOption === option && styles.selectedOption
                        ]}
                        onPress={() => {setSelectedOption(option);}}
                    >
                        <Text style={styles.optionText}>{option}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
            { selectedOption && <TextInput 
                style={styles.input} 
                multiline 
                placeholder="Describe the issue?"  
                placeholderTextColor='#999'
                value={issue}
                onChangeText={setIssue}
            />}
            <TouchableOpacity style={[styles.nextButton, issue == '' && styles.nextButtonDisabled]} disabled={issue == ''}>
                <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#b7ffb0',
        justifyContent: 'center',
        // backgroundColor: '#c2f7d7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        ...Platform.select({
            ios: {
                justifyContent: 'flex-end',
            }
        }),
    },
    backButton: {
        marginRight: 16,
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
    title: {
        fontSize: 24,
        fontWeight: '400',
        fontFamily: 'TextMeOne',
        textAlign: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '400',
        fontFamily: 'TitanOne',
        color: "#fff",
        paddingLeft: 16,
        ...Platform.select({
            web: {
                fontSize: 32,
            }
        }),
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 16,
        margin: 16,
        height: Platform.OS === 'web' ? 400 : 250,
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
});

export default OrderHistoryScreen;
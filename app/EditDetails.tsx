import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Image, Platform } from 'react-native';
import {  ScrollView } from 'react-native-gesture-handler';

import profileIcon from '@/assets/images/user.png';
import { router } from 'expo-router';

const { height, width } = Dimensions.get('window');

const EditDetails = () => {

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity style={styles.profileImage}>
                    <Image
                        source={profileIcon}
                        style={styles.profileImage}
                    />
                </TouchableOpacity>
                <Text style={styles.title}>Edit Details</Text>
                <Text onPress={() => { router.back(); }} style={styles.closeIcon}>X</Text>
            </View>
            <ScrollView
            style={styles.scrollView}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={Platform.OS !== 'web'}
            >
                <Text style={styles.subtitle}>Personal Info</Text>
                <TextInput style={styles.input} placeholder="email" placeholderTextColor={ '#999' } />

                <View style={styles.row}>
                    <TextInput style={[styles.input, styles.halfInput]} placeholder="first name" placeholderTextColor={'#999'} />
                    <TextInput style={[styles.input, styles.halfInput]} placeholder="last name" placeholderTextColor={'#999'} />
                </View>

                <View style={styles.row}>
                    <TextInput style={[styles.input, styles.halfInput]} placeholder="address" placeholderTextColor={ '#999' } />
                    <TextInput style={[styles.input, styles.halfInput]} placeholder="city" placeholderTextColor={ '#999' } />
                </View>

                <View style={styles.row}>
                    <TextInput style={[styles.input, styles.halfInput]} placeholder="state" placeholderTextColor={ '#999' } />
                    <TextInput style={[styles.input, styles.halfInput]} placeholder="zip (optional)" placeholderTextColor={ '#999' } />
                </View>

                <Text style={styles.subtitle}>Login Info</Text>

                <TextInput style={styles.input} placeholder="username" placeholderTextColor={ '#999' } />
                <TextInput style={styles.input} placeholder="password" placeholderTextColor={ '#999' } secureTextEntry />
                <TextInput style={styles.input} placeholder="confirm password" placeholderTextColor={ '#999' } secureTextEntry />

                <Text style={styles.subtitle}>Payment Info</Text>

                <TextInput style={styles.input} placeholder="cardholder name" placeholderTextColor={'#999'} />
                <TextInput style={styles.input} placeholder="card number" placeholderTextColor={'#999'} />
                <TextInput style={styles.input} placeholder="expiration" placeholderTextColor={'#999'} />
                <TextInput style={styles.input} placeholder="cvv" placeholderTextColor={'#999'} />
            </ScrollView>
            <TouchableOpacity style={styles.saveButton} onPress={()=>{ router.back(); router.push("/success") }}>
                <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#b7ffb0',
        paddingHorizontal: Platform.OS === 'web' ? '10%' : 20,
        paddingTop: Platform.OS === 'web' ? 40 : 60,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    profileImage: {
        width: Platform.OS === 'web' ? 50 : 40,
        height: Platform.OS === 'web' ? 50 : 40,
        borderRadius: Platform.OS === 'web' ? 25 : 20,
        backgroundColor: '#f0f0f0',
    },
    title: {
        fontSize: 30,
        fontFamily: 'TitanOne',
        flex: 1,
        textAlign: 'center',
        color: '#fff',
    },
    closeIcon: {
        fontSize: 15,
        padding: Platform.OS === 'web'? 10 : 5,
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 5,
        backgroundColor: '#fff',
        color: '#b7ffb0',
    },
    subtitle: {
        fontSize: 20,
        fontFamily: 'TextMeOne',
        marginBottom: 20,
        marginTop: 10,
        paddingHorizontal: 10,
    },
    input: {
        height: Platform.OS === 'web' ? 45 : 50,
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
        backgroundColor: '#fff',
        width: '100%',
        ...Platform.select({
            web: {
                outlineStyle: 'none',
            },
        }),
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
        width: '100%',
    },
    halfInput: {
        width: '48%',
    },
    scrollView: {
        flexGrow: 1,
        paddingHorizontal: 10,
    },
    saveButton: {
        backgroundColor: '#00bfff',
        width: '100%',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 20,
    },
    saveButtonText: {
        fontFamily: 'TextMeOne',
        fontSize: 30,
        color: 'white',
    },
});

export default EditDetails;
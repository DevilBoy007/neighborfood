import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Image, Platform } from 'react-native';
import {  ScrollView } from 'react-native-gesture-handler';

import profileIcon from '@/assets/images/user.png';
import { router } from 'expo-router';

const { height, width } = Dimensions.get('window');

const EditDetails = () => {

    return (
        <View style={styles.container}>
            <View style={styles.dragBar}>
                {Platform.OS !== 'web' && <View style={styles.dragBarImage} />}
                {Platform.OS === 'web' && <Text onPress={() => { router.back(); }} style={styles.closeIcon}>X</Text>}
            </View>
            {Platform.OS === 'web' &&
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 100, }}>
                <TouchableOpacity style={styles.profileImage}>
                    <Image
                        source={profileIcon}
                        style={styles.profileImage}
                    />
                </TouchableOpacity>
                <Text style={styles.title}>Edit Details</Text>
            </View>
            }
            { Platform.OS !== 'web' && <>
            <TouchableOpacity style={styles.profileImage}>
                <Image
                    source={profileIcon}
                    style={styles.profileImage} />
            </TouchableOpacity>
            <Text style={styles.title}>Edit Details</Text>
            </>
            }
            <ScrollView>
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
        backgroundColor: '#b7ffb0',
        padding: 20,
        ...Platform.select({
            ios: {
                height: height * 0.93,
            },
            web: {
                height: height,
            },
        }),
    },
    dragBar: {
        width: '100%',
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeIcon: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#b7ffb0',
        fontFamily: 'TextMeOne',
        margin: 30,
        position: 'absolute',
        height: 33,
        width: 33,
        borderRadius: 17,
        backgroundColor: "#fff",
        padding: 10,
        paddingLeft: 12,
        right: 0,
        top: 0,
    },
    dragBarImage: {
        width: 50,
        height: 5,
        backgroundColor: 'grey',
        borderRadius: 2.5,
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        ...Platform.select({
            native: {
                zIndex: 1,
                position: 'absolute',
                margin: 10,
                marginTop: 25,
            },
            web: {
                marginBottom: 30,
                width: 100,
                height: 100,
                borderRadius: 50,
            },
        }),
    },
    title: {
        fontFamily: 'TitanOne',
        color: '#fff',
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center',
        ...Platform.select({
            web: {
                fontSize: 40,
                flexGrow: 1,
            }
        }),
    },
    subtitle: {
        fontFamily: 'TextMeOne',
        fontSize: 18,
        marginTop: 20,
        marginBottom: 10,
    },
    input: {
        fontFamily: 'TextMeOne',
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    saveButton: {
        backgroundColor: '#00bfff',
        width: '100%',
        padding: 15,
        marginTop: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    saveButtonText: {
        fontFamily: 'TextMeOne',
        fontSize: 30,
        color: 'white',
    },
});

export default EditDetails;
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

const EditDetails = ({ onClose }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Edit Details</Text>

            <TextInput style={styles.input} placeholder="email" />

            <View style={styles.row}>
                <TextInput style={[styles.input, styles.halfInput]} placeholder="address" />
                <TextInput style={[styles.input, styles.halfInput]} placeholder="city" />
            </View>

            <View style={styles.row}>
                <TextInput style={[styles.input, styles.halfInput]} placeholder="state" />
                <TextInput style={[styles.input, styles.halfInput]} placeholder="zip (optional)" />
            </View>

            <Text style={styles.subtitle}>Login Info</Text>

            <TextInput style={styles.input} placeholder="username" />
            <TextInput style={styles.input} placeholder="password" secureTextEntry />
            <TextInput style={styles.input} placeholder="confirm password" secureTextEntry />

            <TouchableOpacity style={styles.saveButton} onPress={onClose}>
                <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: height * 0.9,
        backgroundColor: '#87CEFA',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
    },
    input: {
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
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default EditDetails;
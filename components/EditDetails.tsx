import React, { useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Animated, Image } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
const { height, width } = Dimensions.get('window');

const EditDetails = ({ isVisible, onClose }) => {
    const slideAnim = useRef(new Animated.Value(height)).current;
    const lastGestureDy = useRef(0);

    useEffect(() => {
        if (isVisible) {
            // Slide up
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
            }).start();
        } else {
            // Slide down
            Animated.spring(slideAnim, {
                toValue: height,
                useNativeDriver: true,
            }).start();
        }
    }, [isVisible, slideAnim]);

    const onGestureEvent = Animated.event(
        [{ nativeEvent: { translationY: slideAnim } }],
        { useNativeDriver: true }
    );

    const onHandlerStateChange = event => {
        if (event.nativeEvent.oldState === State.ACTIVE) {
            lastGestureDy.current += event.nativeEvent.translationY;
            if (lastGestureDy.current > height * 0.4) {
                // If dragged down more than 40% of screen height, close the modal
                onClose();
            } else {
                // Otherwise, snap back to fully open position
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start();
            }
            lastGestureDy.current = 0;
        }
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <PanGestureHandler
                onGestureEvent={ () => { onGestureEvent }}
                onHandlerStateChange={onHandlerStateChange}
            >
                <View style={styles.dragBar}>
                    <Ionicons name="ellipsis-horizontal-outline" size={ 20 } color="gray" />
                </View>
            </PanGestureHandler>

            <Text style={styles.title}>Edit Details</Text>

            <TextInput style={styles.input} placeholder="email" placeholderTextColor={ '#999' } />

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

            <TouchableOpacity style={styles.saveButton} onPress={onClose}>
                <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: height * 0.9,
        backgroundColor: '#87CEFA',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    dragBar: {
        width: '100%',
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dragBarImage: {
        width: 50,
        height: 5,
        backgroundColor: 'grey',
        borderRadius: 2.5,
    },
    title: {
        fontFamily: 'TextMeOne',
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center',
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
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        fontFamily: 'TextMeOne',
        fontSize: 30,
    },
});

export default EditDetails;
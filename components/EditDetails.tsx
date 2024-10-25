import React, { useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Animated, Image, Platform } from 'react-native';
import { PanGestureHandler, ScrollView, State } from 'react-native-gesture-handler';

import profileIcon from '../assets/images/user.png';

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
                onClose();
            } else {
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
                    <View style={styles.dragBarImage} />
                </View>
            </PanGestureHandler>
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
        fontFamily: 'TextMeOne',
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
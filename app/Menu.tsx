import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import chatIcon from '../assets/images/chat.png';
import pollsIcon from '../assets/images/surveys.png';
import marketIcon from '../assets/images/market.png';
import tileIcon from '../assets/images/tiles.png';


const MenuScreen = () => {
    const MenuButton = ({ icon, title }: { icon: string, title: string }) => (
        <TouchableOpacity style={styles.menuButton}>
            <Text style={styles.menuButtonIcon}>{icon}</Text>
            <Text style={styles.menuButtonText}>{title}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={styles.headerText}>community needs | you're in Fountain Square, Indianapolis</Text>
                        <View style={styles.communityNeedsContainer}>
                            {['community need', 'community need', 'community need'].map((need, index) => (
                                <TouchableOpacity key={index} style={styles.communityNeedButton}>
                                    <Text style={styles.communityNeedText}>{need}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Image
                            source={{ uri: 'https://via.placeholder.com/50' }}
                            style={styles.profileImage}
                        />
                    </View>

                    <View style={styles.menuGrid}>
                        <MenuButton icon="+" title="add item" />
                        <MenuButton icon="manage items" title="manage items" />
                        <MenuButton icon="edit details" title="edit details" />
                        <MenuButton icon="order history" title="order history" />
                        <MenuButton icon="contact us" title="contact us" />
                        <MenuButton icon="!" title="report a problem" />
                    </View>
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Image style={[styles.iconButton,styles.icon]} source={chatIcon}/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Image style={[styles.iconButton,styles.icon]} source={pollsIcon}/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Image style={[styles.iconButton, styles.icon]} source={marketIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Image style={[styles.iconButton, styles.icon]} source={tileIcon} />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#B7FFB0',
    },
    content: {
        flex: 1,
        ...Platform.select({
            web: {
                flexDirection: 'row',
            },
        }),
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
        ...Platform.select({
            web: {
                padding: 20,
            },
        }),
    },
    header: {
        padding: 10,
        paddingTop: 100,
        ...Platform.select({
            web: {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
            },
        }),
    },
    headerText: {
        fontSize: 12,
        marginBottom: 10,
        ...Platform.select({
            web: {
                fontSize: 16,
                marginBottom: 0,
            },
        }),
    },
    communityNeedsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
        ...Platform.select({
            web: {
                marginBottom: 0,
                marginLeft: 20,
            },
        }),
    },
    communityNeedButton: {
        backgroundColor: '#87CEFA',
        padding: 5,
        borderRadius: 5,
        ...Platform.select({
            web: {
                marginHorizontal: 5,
            },
        }),
    },
    communityNeedText: {
        color: 'white',
        fontSize: 12,
        ...Platform.select({
            web: {
                fontSize: 14,
            },
        }),
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        ...Platform.select({
            native: {
                position: 'absolute',
                top: 10,
                left: 10,
            },
            web: {
                marginLeft: 20,
            },
        }),
    },
    menuGrid: {
        flexBasis: '50%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        padding: 10,
        ...Platform.select({
            web: {
                maxWidth: 800,
                marginHorizontal: 'auto',
            },
        }),
    },
    menuButton: {
        width: '45%',
        aspectRatio: 1,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderRadius: 10,
        ...Platform.select({
            web: {
                width: '30%',
                maxWidth: 200,
                aspectRatio: 'auto',
                height: 150,
            },
        }),
    },
    menuButtonIcon: {
        fontSize: 24,
        marginBottom: 5,
        color: '#888',
        ...Platform.select({
            web: {
                fontSize: 32,
            },
        }),
    },
    menuButtonText: {
        fontSize: 12,
        color: '#888',
        ...Platform.select({
            web: {
                fontSize: 16,
            },
        }),
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#87CEFA',
        padding: 10,
        ...Platform.select({
            web: {
                flexDirection: 'column',
                width: 200,
                height: '100%',
                justifyContent: 'flex-start',
                paddingTop: 50,
            },
        }),
    },
    iconButton: {
        padding: 10,
        ...Platform.select({
            web: {
                marginBottom: 20,
            },
        }),
    },
    icon: {
        width: 50,
        height: 50,
    }
});

export default MenuScreen;
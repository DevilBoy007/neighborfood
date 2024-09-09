import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';


const MenuScreen = () => {
    const router = useRouter();
    const MenuButton = ({ icon, title }: { icon: string, title: string }) => (
        <TouchableOpacity style={styles.menuButton}>
            <Text style={styles.menuButtonIcon}>{icon}</Text>
            <Text style={styles.menuButtonText}>{title}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
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

            <View style={styles.footer}>
                <TouchableOpacity style={styles.footerButton}>
                    <Text style={styles.footerButtonText}>chat</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.footerButton}>
                    <Text style={styles.footerButtonText}>forum</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.homeButton}>
                    <Ionicons name="home" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuButton}>
                    <Ionicons name="menu" size={24} color="black" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#B7FFB0',
    },
    header: {
        padding: 10,
    },
    headerText: {
        fontSize: 12,
        marginBottom: 10,
    },
    communityNeedsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    communityNeedButton: {
        backgroundColor: '#87CEFA',
        padding: 5,
        borderRadius: 5,
    },
    communityNeedText: {
        color: 'white',
        fontSize: 12,
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        position: 'absolute',
        top: 10,
        left: 10,
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        padding: 10,
    },
    menuButton: {
        width: '45%',
        aspectRatio: 1,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderRadius: 10,
    },
    menuButtonIcon: {
        fontSize: 24,
        marginBottom: 5,
        color: '#888',
    },
    menuButtonText: {
        fontSize: 12,
        color: '#888',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#87CEFA',
        padding: 10,
    },
    footerButton: {
        padding: 10,
    },
    footerButtonText: {
        color: 'black',
    },
    homeButton: {
        backgroundColor: '#87CEFA',
        padding: 10,
        borderRadius: 30,
    },
});

export default MenuScreen;
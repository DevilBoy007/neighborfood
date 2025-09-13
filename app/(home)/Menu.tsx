import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Platform, ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import { useLocation } from '@/context/locationContext';

import shopIcon from '@/assets/images/shop.png';
import receiptIcon from '@/assets/images/receipt.png';
import contactUsIcon from '@/assets/images/contact.png';
import dashboardIcon from '@/assets/images/dashboard.png';
import manageItemIcon from '@/assets/images/manageItemsIcon.png';



const MenuScreen = () => {
    const router = useRouter();
    const { locationData } = useLocation();
    
    const MenuButton = ({ icon, title, destination }: { icon: ImageSourcePropType | string, title: string, destination: string | null }) => {
        if (typeof icon !== 'string') {
            return (
                <TouchableOpacity style={styles.menuButton} onPress={() => router.navigate(`/(home)/${destination}`)} >
                    <Image source={icon} style={styles.icon} />
                    <Text style={styles.menuButtonText}>{title}</Text>
                </TouchableOpacity>
            );
        }
        else {
            return (
                <TouchableOpacity style={styles.menuButton} onPress={() => destination && router.navigate(`/(home)/${destination}`)}>
                    <Text style={styles.menuButtonIcon}>{icon}</Text>
                    <Text style={styles.menuButtonText}>{title}</Text>
                </TouchableOpacity>
            )
        }
    };
    
    return (
        <>
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>tiles</Text>
                <View style={styles.neighborhood}>
                    {locationData.area && !locationData.loading && (
                        <Text style={styles.headerText}>
                            📍 {locationData.area}
                        </Text>
                    )}
                    {locationData.loading && (
                        <Text style={styles.headerText}>
                            📍 Loading location...
                        </Text>
                    )}
                    {locationData.error && !locationData.loading && (
                        <Text style={styles.headerText}>
                            📍 Location unavailable
                        </Text>
                    )}
                </View>
                
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.menuGrid}>
                    <MenuButton icon="+" title="add item" destination="./(items)/AddItem"/>
                    <MenuButton icon={shopIcon} title="manage shops" destination={"./(shops)/Shops"}/>
                    <MenuButton icon={manageItemIcon} title="manage items" destination="./(items)/ManageItems" />
                    <MenuButton icon={receiptIcon} title="orders" destination={"./(orders)"}/>
                    <MenuButton icon={contactUsIcon} title="contact us" destination={"./(contact)/ContactUs"}/>
                    <MenuButton icon={dashboardIcon} title="dashboard" destination={null} />
                </View>
            </ScrollView>
        </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        height: '100%',
        paddingTop: Platform.OS === 'web' ? 0 : 70,
        flex: 1,
        backgroundColor: '#B7FFB0',
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
        paddingTop: Platform.OS === 'web' ? 50 : 0,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    title: {
        fontSize: Platform.select({ ios: 30, web: 80 }),
        fontWeight: 'bold',
        fontFamily: 'TitanOne',
        color: '#fff',
        paddingBottom: 10,
    },
    headerText: {
        fontSize: 18,
        fontFamily: 'TextMeOne',
        ...Platform.select({
            web: {
                fontSize: 32,
                marginBottom: 0,
            },
        }),
    },
    neighborhood: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: Platform.OS === 'web' ? 20 : 0,
        paddingHorizontal: Platform.OS === 'web' ? 40 : 5,
        borderColor: 'black',
        borderWidth: 1,
        borderRadius: 10,
        minHeight: Platform.OS === 'web' ? 80 : 50,
        ...Platform.select({
            ios: {
                marginTop: 10,
            },
            web: {
                flex: 1,
            },
        }),
    },
    menuGrid: {
        flexBasis: '50%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        padding: 10,
        ...Platform.select({
            web: {
                maxWidth: 900,
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
        borderColor: 'black',
        borderWidth: 1,
        ...Platform.select({
            web: {
                height: 250,
                width: 250,
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
        fontFamily: 'TextMeOne',
        color: '#888',
        ...Platform.select({
            web: {
                fontSize: 16,
            },
        }),
    }, 
    icon: {
        width: 50,
        height: 50,
        ...Platform.select({
            ios: {
                width: 30,
                height: 30,
            },
        }),
    },
    link: {
        color: '#00bfff',
    },
    boldText: {
        fontWeight: 'bold',
    },
    italicText: {
        fontStyle: 'italic',
    },
    underlineText: {
        textDecorationLine: 'underline',
    },
});

export default MenuScreen;
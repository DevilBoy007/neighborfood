import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Platform, ImageBackground, ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';

import shopIcon from '../../assets/images/shop.png';
import receiptIcon from '../../assets/images/receipt.png';
import contactUsIcon from '../../assets/images/contact.png';
import dashboardIcon from '../../assets/images/dashboard.png';

import tomatoImage from '../../assets/images/tomatoes.png';
import dillImage from '../../assets/images/dill.jpeg';
import bellPepperImage from '../../assets/images/bellPeppers.jpeg';



const MenuScreen = () => {
    const router = useRouter();
    const MenuButton = ({ icon, title }: { icon: ImageSourcePropType | string, title: string }) => {
        if (typeof icon !== 'string') {
            return (
                <TouchableOpacity style={styles.menuButton}>
                    <Image source={icon} style={styles.icon} />
                    <Text style={styles.menuButtonText}>{title}</Text>
                </TouchableOpacity>
            );
        }
        else {
            return (
                <TouchableOpacity style={styles.menuButton}>
                    <Text style={styles.menuButtonIcon}>{icon}</Text>
                    <Text style={styles.menuButtonText}>{title}</Text>
                </TouchableOpacity>
            )
        }
    };
    const communityNeedsList = [
        { name: 'tomatoes', image: tomatoImage },
        { name: 'dill', image: dillImage },
        { name: 'bell peppers', image: bellPepperImage },
    ];
    
    return (
        <>
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}> <Text style={styles.boldText}>community needs</Text> | <Text style={styles.italicText}>you're in <TouchableOpacity><Text style={[styles.link, styles.italicText, styles.underlineText]}>Fountain Square, Indianapolis</Text></TouchableOpacity></Text></Text>
                <View style={styles.communityNeedsContainer}>
                    {communityNeedsList.map((item, index) => (
                        <TouchableOpacity key={index} style={styles.communityNeedButton}>
                        {
                            Platform.select({
                                ios: 
                                <Text style={styles.communityNeedText}>{item.name}</Text>,
                                web: 
                                <ImageBackground source={item.image} style={{ width: 150, height: 150 }} resizeMode='cover'>
                                    <Text style={styles.communityNeedText}>{item.name}</Text>
                                </ImageBackground>
                            })
                        }
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.menuGrid}>
                    <MenuButton icon="+" title="add item" />
                    <MenuButton icon={shopIcon} title="manage shops" />
                    <MenuButton icon={dashboardIcon} title="dashboard" />
                    <MenuButton icon={receiptIcon} title="order history" />
                    <MenuButton icon={contactUsIcon} title="contact us" />
                    <MenuButton icon="!" title="report a problem" />
                </View>
            </ScrollView>
        </View>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        height: '100%',
        paddingTop: Platform.OS === ('ios' || 'android') ? 70 : 0,
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
        paddingTop: 40,
        ...Platform.select({
            web: {
                paddingTop: 25,
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
        padding: 10,
        ...Platform.select({
            ios: {
                borderColor: 'black',
                borderWidth: 1,
                borderRadius: 3,
            },
            web: {
                marginBottom: 0,
                marginLeft: 20,
            },
        }),
    },
    communityNeedButton: {
        backgroundColor: '#00bfff',
        padding: 5,
        borderRadius: 5,
        ...Platform.select({
            web: {
                marginHorizontal: 5,
            },
        }),
    },
    communityNeedText: {
        color: 'black',
        fontFamily: 'TitanOne',
        fontSize: 12,
        textAlign: 'center',
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
    },
    menuGrid: {
        flexBasis: '50%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
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
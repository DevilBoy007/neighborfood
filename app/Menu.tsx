import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image, ScrollView, Platform, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import chatIcon from '../assets/images/chat.png';
import pollsIcon from '../assets/images/surveys.png';
import marketIcon from '../assets/images/market.png';
import tileIcon from '../assets/images/tiles.png';

import tomatoImage from '../assets/images/tomatoes.png';
import dillImage from '../assets/images/dill.jpeg';
import bellPepperImage from '../assets/images/bellPeppers.jpeg';



const MenuScreen = () => {
    const router = useRouter();
    const MenuButton = ({ icon, title }: { icon: string, title: string }) => (
        <TouchableOpacity style={styles.menuButton}>
            <Text style={styles.menuButtonIcon}>{icon}</Text>
            <Text style={styles.menuButtonText}>{title}</Text>
        </TouchableOpacity>
    );

    const menuItems = [
        { name: 'tomatoes', image: tomatoImage },
        { name: 'dill', image: dillImage },
        { name: 'bell peppers', image: bellPepperImage },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={styles.headerText}> <Text style={styles.boldText}>community needs</Text> | <Text style={styles.italicText}>you're in <TouchableOpacity><Text style={[styles.link, styles.italicText, styles.underlineText]}>Fountain Square, Indianapolis</Text></TouchableOpacity></Text></Text>
                        <View style={styles.communityNeedsContainer}>
                            {menuItems.map((item, index) => (
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
                        {Platform.OS !== 'web' &&
                            <Image
                            source={{ uri: 'https://via.placeholder.com/50' }}
                            style={styles.profileImage}
                        />
                        }
                    </View>

                    <View style={styles.menuGrid}>
                        <MenuButton icon="+" title="add item" />
                        <MenuButton icon="manage shops" title="manage shops" />
                        <MenuButton icon="edit details" title="edit details" />
                        <MenuButton icon="order history" title="order history" />
                        <MenuButton icon="contact us" title="contact us" />
                        <MenuButton icon="!" title="report a problem" />
                    </View>
                </ScrollView>
                {Platform.OS === 'web' && 
                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.iconButton}>
                                <Image
                                source={{ uri: 'https://via.placeholder.com/50' }}
                                style={[styles.iconButton, styles.profileImage]}
                            />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton}>
                                <Image style={[styles.iconButton, styles.icon]} source={chatIcon} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton}>
                                <Image style={[styles.iconButton, styles.icon]} source={pollsIcon} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton} onPress={() => { router.push('/Market') }}>
                                <Image style={[styles.iconButton, styles.icon]} source={marketIcon} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton}>
                                <Image style={[styles.iconButton, styles.icon]} source={tileIcon} />
                            </TouchableOpacity>
                        </View>}
            </View>
            {Platform.OS !== 'web' &&
                    <View style={styles.footer}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Image style={[styles.iconButton,styles.icon]} source={chatIcon}/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Image style={[styles.iconButton,styles.icon]} source={pollsIcon}/>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton} onPress={()=>{router.push('/Market')}}>
                        <Image style={[styles.iconButton, styles.icon]} source={marketIcon} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Image style={[styles.iconButton, styles.icon]} source={tileIcon} />
                    </TouchableOpacity>
                </View>}
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
        ...Platform.select({
            native: {
                position: 'absolute',
                top: 10,
                left: 10,
            },
            web: {
                marginBottom: 30,
                width: 100,
                height: 100,
                borderRadius: 50,
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
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        backgroundColor: '#87CEFA',
        padding: 10,
        ...Platform.select({
            ios: {
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
            },
            web: {
                flexDirection: 'column',
                width: 200,
                height: '100%',
                justifyContent: 'center',
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
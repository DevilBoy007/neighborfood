import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import ItemCard from '@/components/ItemCard';
import firebaseService from '@/handlers/firebaseService';

import { useLocation } from '@/context/locationContext';
import { useUser } from '@/context/userContext';
import { useShop } from '@/context/shopContext';
import { ItemData } from '@/context/itemContext';

export default function ShopDetails() {
    const { selectedShop } = useShop();
    const { userData } = useUser();
    const { locationData, formatDistance } = useLocation();
    const [items, setItems] = useState<ItemData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();

    // Calculate distance between two coordinates in kilometers
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in km
        return distance;
    };

    const deg2rad = (deg: number): number => {
        return deg * (Math.PI/180);
    };

    useEffect(() => {
        async function fetchShopItems() {
        if (!selectedShop) return;
        
        try {
            setLoading(true);
            const shopItems = await firebaseService.getItemsForShop(selectedShop.id);
            setItems(shopItems || []);
        } catch (error) {
            console.error("Error fetching items:", error);
        } finally {
            setLoading(false);
        }
        }

        fetchShopItems();
    }, [selectedShop]);

    if (!selectedShop) {
        return (
        <View style={styles.container}>
            <Text style={styles.errorText}>Shop not found</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
            </TouchableOpacity>
        </View>
        );
    }

    const HeaderImage = () => (
        <Image 
            source={{ uri: selectedShop.backgroundImageUrl || 'https://placehold.co/600x400' }}
        style={styles.headerImage}
        />
    );

    return (
        <>
            {/* Sticky back button for mobile */}
            {Platform.OS !== 'web' && (
                <TouchableOpacity
                    style={styles.stickyBackButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="chevron-back" size={24} color="black" />
                </TouchableOpacity>
            )}

            <ParallaxScrollView
            headerImage={<HeaderImage />}
            headerBackgroundColor={{ light: '#b7ffb0', dark: '#b7ffb0' }}
            >
            <View style={styles.headerContainer}>
                {/* Only show this back button on web */}
                {Platform.OS === 'web' && (
                    <TouchableOpacity style={styles.backButtonContainer} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color="black" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.shopInfoContainer}>
                <View style={styles.shopHeaderRow}>
                    <Text style={styles.shopName}>{selectedShop.name}</Text>
                    {selectedShop.userId === userData?.uid && (
                        <TouchableOpacity
                            style={styles.editShopIconButton}
                            onPress={() => router.push({
                                pathname: '/AddShop',
                                params: { shopId: selectedShop.id }
                            })}
                        >
                            <Ionicons name="pencil" size={20} color="#555" />
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.shopDescription}>{selectedShop.description}</Text>
                <View>
                    {selectedShop.type && (
                    <View style={styles.infoRow}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="briefcase-outline" size={18} color="#555" />
                        </View>
                        <Text style={styles.infoText}>{selectedShop.type}</Text>
                    </View>
                    )}

                    {selectedShop.days && selectedShop.days.length > 0 && (
                    <View style={styles.infoRow}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="calendar-outline" size={18} color="#555" />
                        </View>
                        <Text style={styles.infoText}>Available: {selectedShop.days.join(', ')}</Text>
                    </View>
                    )}

                    {selectedShop.openTime && selectedShop.closeTime && (
                    <View style={styles.infoRow}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="time-outline" size={18} color="#555" />
                        </View>
                        <Text style={styles.infoText}>Hours: {selectedShop.openTime} - {selectedShop.closeTime}</Text>
                    </View>
                    )}
                    <View style={styles.infoRow}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="location-outline" size={18} color="#555" />
                    </View>
                    <Text style={styles.infoText}>
                        {locationData.coords && selectedShop.location ? 
                            formatDistance(calculateDistance(
                                locationData.coords.latitude, 
                                locationData.coords.longitude, 
                                selectedShop.location.latitude, 
                                selectedShop.location.longitude
                            )) + ' away'
                            : 
                            'Distance unavailable'
                        }
                    </Text>
                </View>
                </View>

                

                <View style={styles.deliveryInfoContainer}>
                {selectedShop.allowPickup && (
                    <View style={styles.deliveryOption}>
                    <Ionicons name="bag-handle-outline" size={18} color="#fff" />
                    <Text style={styles.deliveryText}>Pickup available</Text>
                    </View>
                )}
                {selectedShop.localDelivery && (
                    <View style={styles.deliveryOption}>
                    <Ionicons name="bicycle-outline" size={18} color="#fff" />
                    <Text style={styles.deliveryText}>Local delivery</Text>
                    </View>
                )}
                </View>
            </View>
            
            <View style={styles.itemsContainer}>
                <Text style={styles.sectionTitle}>Items</Text>
                {loading ? (
                <ActivityIndicator size="large" color="#00bfff" />
                ) : items.length > 0 ? (
                items.map((item) => (
                    <ItemCard
                        key={item.id}
                        item={item}
                        shopName={selectedShop.name}
                        shopPhotoURL={selectedShop.backgroundImageUrl}
                        showCartControls={selectedShop.userId !== userData?.uid}
                        isShopOwner={selectedShop.userId === userData?.uid}
                    />
                ))
                ) : (
                <Text style={styles.noItemsText}>No items available</Text>
                )}
                {selectedShop.userId === userData?.uid && (
                    <TouchableOpacity
                        style={styles.addItemsButton}
                        onPress={() => router.push({
                            pathname: '/AddItem',
                            params: { shopId: selectedShop.id }
                        })}
                    >
                        <Ionicons name="add-circle-outline" size={24} color="#fff" style={styles.buttonIcon} />
                        <Text style={styles.addItemsButtonText}>Add Items</Text>
                    </TouchableOpacity>
                )}
            </View>
            </ParallaxScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#b7ffb0",
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    headerContainer: {
        position: Platform.OS === 'web' ? 'absolute' : 'relative',
        top: Platform.OS === 'web' ? 10 : 0,
        left: Platform.OS === 'web' ? 10 : 0,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    backButtonContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 20,
        padding: 8,
    },
    stickyBackButton: {
        position: 'absolute',
        top: 110,
        left: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 20,
        padding: 3,
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    shopInfoContainer: {
        marginBottom: 20,
        backgroundColor: "#b7ffb0",
        alignItems: 'center',
    },
    shopHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    shopName: {
        fontSize: Platform.OS === 'web'? 40 : 30,
        fontWeight: 'bold',
        marginBottom: 8,
        fontFamily: 'TitanOne',
        color: '#fff',
    },
    editShopIconButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 15,
        padding: 8,
        marginLeft: 10,
    },
    shopDescription: {
        fontSize: 16,
        color: '#333',
        marginBottom: 16,
        fontFamily: 'TextMeOne',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        width: '100%',
    },
    iconContainer: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    infoText: {
        color: '#555',
        fontFamily: 'TextMeOne',
        flex: 1,
    },
    deliveryInfoContainer: {
        flexDirection: 'row',
        marginTop: 12,
        flexWrap: 'wrap',
    },
    deliveryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#000',
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginRight: 10,
        marginBottom: 6,
    },
    deliveryText: {
        marginLeft: 6,
        fontFamily: 'TextMeOne',
        color: 'white'
    },
    itemsContainer: {
        marginTop: 16,
        paddingBottom: 200,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        fontFamily: 'TitanOne',
    },
    backButton: {
        backgroundColor: '#00bfff',
        padding: 12,
        borderRadius: 8,
        marginTop: 20,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
    },
    errorText: {
        fontSize: 18,
        color: '#555',
        marginBottom: 20,
        fontFamily: 'TextMeOne',
    },
    noItemsText: {
        fontSize: 16,
        color: '#555',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 20,
        fontFamily: 'TextMeOne',
    },
    addItemsButton: {
        backgroundColor: '#00bfff',
        padding: 16,
        borderRadius: 8,
        marginTop: 16,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    addItemsButtonText: {
        fontSize: Platform.OS === 'web' ? 30 : 24,
        color: '#fff',
        fontFamily: 'TextMeOne',
    },
    buttonIcon: {
        marginRight: 8,
    },
});
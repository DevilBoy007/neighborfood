import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useShop } from '@/context/shopContext';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import firebaseService from '@/handlers/firebaseService';

interface ShopItem {
    id: string;
    name: string;
    price: number;
    description: string;
    imageUrl?: string;
}

export default function ShopDetails() {
    const { selectedShop } = useShop();
    const [items, setItems] = useState<ShopItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();

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

    // Header image component for the ParallaxScrollView
    const HeaderImage = () => (
        <Image 
        source={{ uri: selectedShop.backgroundImageUrl || 'https://via.placeholder.com/500' }}
        style={styles.headerImage}
        />
    );

    return (
        <ParallaxScrollView
        headerImage={<HeaderImage />}
        headerBackgroundColor={{ light: '#b7ffb0', dark: '#b7ffb0' }}
        >
        <View style={styles.headerContainer}>
            <TouchableOpacity style={styles.backButtonContainer} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="black" />
            </TouchableOpacity>
        </View>

        <View style={styles.shopInfoContainer}>
            <Text style={styles.shopName}>{selectedShop.name}</Text>
            <Text style={styles.shopDescription}>{selectedShop.description}</Text>

            {selectedShop.type && (
            <View style={styles.infoRow}>
                <Ionicons name="briefcase-outline" size={18} color="#555" />
                <Text style={styles.infoText}>{selectedShop.type}</Text>
            </View>
            )}

            {selectedShop.days && selectedShop.days.length > 0 && (
            <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={18} color="#555" />
                <Text style={styles.infoText}>Available: {selectedShop.days.join(', ')}</Text>
            </View>
            )}

            {selectedShop.openTime && selectedShop.closeTime && (
            <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={18} color="#555" />
                <Text style={styles.infoText}>Hours: {selectedShop.openTime} - {selectedShop.closeTime}</Text>
            </View>
            )}

            <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={18} color="#555" />
            <Text style={styles.infoText}>
                {selectedShop.location?.latitude.toFixed(6)}, {selectedShop.location?.longitude.toFixed(6)}
            </Text>
            </View>

            <View style={styles.deliveryInfoContainer}>
            {selectedShop.allowPickup && (
                <View style={styles.deliveryOption}>
                <Ionicons name="bag-handle-outline" size={18} color="#555" />
                <Text style={styles.deliveryText}>Pickup available</Text>
                </View>
            )}
            {selectedShop.localDelivery && (
                <View style={styles.deliveryOption}>
                <Ionicons name="bicycle-outline" size={18} color="#555" />
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
                <View key={item.id} style={styles.itemCard}>
                {item.imageUrl && (
                    <Image 
                    source={{ uri: item.imageUrl }} 
                    style={styles.itemImage}
                    />
                )}
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>${item.price?.toFixed(2)}</Text>
                    {item.description && (
                    <Text style={styles.itemDescription}>{item.description}</Text>
                    )}
                </View>
                </View>
            ))
            ) : (
            <Text style={styles.noItemsText}>No items available</Text>
            )}
        </View>
        </ParallaxScrollView>
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
    shopInfoContainer: {
        marginBottom: 20,
        backgroundColor: "#b7ffb0",
        alignItems: 'center',
    },
    shopName: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        fontFamily: 'TitanOne',
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
    },
    infoText: {
        marginLeft: 8,
        color: '#555',
        fontFamily: 'TextMeOne',
    },
    deliveryInfoContainer: {
        flexDirection: 'row',
        marginTop: 12,
        flexWrap: 'wrap',
    },
    deliveryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 16,
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginRight: 10,
        marginBottom: 6,
    },
    deliveryText: {
        marginLeft: 6,
        fontFamily: 'TextMeOne',
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
    itemCard: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 16,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
        fontFamily: 'TextMeOne',
    },
    itemPrice: {
        fontSize: 16,
        color: '#00bfff',
        marginBottom: 8,
        fontWeight: '600',
    },
    itemDescription: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'TextMeOne',
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
});
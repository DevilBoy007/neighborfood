import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useShop } from '@/context/shopContext';

type ShopLocation = {
    marketId: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
};

type ItemData = {
    id: string;
    shopId: string;
    marketId: string;
    name: string;
    description: string;
    category: string[];
    imageUrl: string;
    price: number;
    unit: string;
    negotiable: boolean;
    quantity: number;
    available: boolean;
    createdAt: { seconds: number; nanoseconds: number };
};

type ShopData = {
    id: string;
    name: string;
    description: string;
    backgroundImageUrl: string;
    userId: string;
    location: ShopLocation;
    createdAt: { seconds: number; nanoseconds: number };
    type: string;
    localDelivery: boolean;
    allowPickup: boolean;
    days: string[];
    openTime: string;
    closeTime: string;
    items?: ItemData[];
};

interface ShopCardProps {
    name: string;
    shop: ShopData;
}

const ShopCard = ({ name, shop }: ShopCardProps) => {
    const router = useRouter();
    const { setSelectedShop } = useShop();

    const handlePress = () => {
        if (shop) {
            setSelectedShop(shop);
            router.push('/ShopDetails');
        }
    };

    // Extract item images from the shop's items
    const itemImages = shop.items?.filter(item => item.imageUrl).map(item => item.imageUrl) || [];

    return (
        <View style={styles.shopItem}>
            <TouchableOpacity onPress={handlePress}>
                <Text style={styles.shopName}>{name}</Text>
                <View style={styles.shopCircles}>
                    {itemImages.length > 0 ? (
                        itemImages.map((imageUrl, i) => (
                            <Image
                                key={i}
                                source={{ uri: imageUrl }}
                                style={styles.itemImage}
                            />
                        ))
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 20, height: 20, backgroundColor: '#f0f0f0', borderRadius: 10 }} />
                            <Text style={{ marginLeft: 8, color: '#888', fontStyle: 'italic' }}>No items yet</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    shopItem: {
        backgroundColor: 'white',
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 8,
    },
    shopName: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'TextMeOne',
    },
    shopCircles: {
        flexDirection: 'row',
        marginTop: 8,
    },
    itemImage: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginRight: 8,
    },
});

export default ShopCard;

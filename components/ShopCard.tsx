import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';

interface ShopCardProps {
    name: string;
    itemImages: ImageSourcePropType[];
}

const ShopCard = ({ name, itemImages }: ShopCardProps) => (
    <View style={styles.shopItem}>
        <TouchableOpacity>
            <Text style={styles.shopName}>{name}</Text>
            <View style={styles.shopCircles}>
                {itemImages && itemImages.length > 0 ? (
                    itemImages.map((image, i) => (
                        <Image
                            key={i}
                            source={typeof image === 'string' ? { uri: image } : image}
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

import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/context/cartContext';

export interface ItemProps {
    id: string;
    itemId?: string;
    shopId?: string;
    shopName?: string;
    shopPhotoURL?: string;
    name: string;
    price: number;
    description?: string;
    imageUrl?: string;
    onPress?: () => void;
    showCartControls?: boolean;
}

const ItemCard = ({ 
    id, 
    itemId = '', 
    shopId = '', 
    shopName = '', 
    shopPhotoURL = '', 
    name, 
    price, 
    description, 
    imageUrl, 
    onPress,
    showCartControls = true
    }: ItemProps) => {
    const [quantity, setQuantity] = useState(1);
    const { addToCart } = useCart();

    const handleAddToCart = () => {
        if (!shopId) return;
        
        addToCart({
        itemId: itemId || id,
        shopId,
        shopName,
        shopPhotoURL,
        name,
        price,
        quantity,
        photoURL: imageUrl
        });

        // Reset quantity after adding to cart
        setQuantity(1);
    };

    const incrementQuantity = () => setQuantity(prev => prev + 1);
    const decrementQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1);

    return (
        <View style={styles.itemCard}>
        {imageUrl && (
            <Image 
            source={{ uri: imageUrl }} 
            style={styles.itemImage}
            />
        )}
        <View style={styles.itemInfo}>
            <TouchableOpacity 
            onPress={onPress}
            disabled={!onPress}
            style={styles.infoContainer}
            >
            <Text style={styles.itemName}>{name}</Text>
            <Text style={styles.itemPrice}>${price?.toFixed(2)}</Text>
            {description && (
                <Text style={styles.itemDescription}>{description}</Text>
            )}
            </TouchableOpacity>
            
            {showCartControls && (
            <View style={styles.cartControls}>
                <View style={styles.quantityContainer}>
                <TouchableOpacity onPress={decrementQuantity} style={styles.quantityButton}>
                    <Ionicons name="remove" size={16} color="#00bfff" />
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity onPress={incrementQuantity} style={styles.quantityButton}>
                    <Ionicons name="add" size={16} color="#00bfff" />
                </TouchableOpacity>
                </View>
                <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddToCart}
                >
                <Ionicons name="cart" size={16} color="white" />
                <Text style={styles.addButtonText}>Add to Cart</Text>
                </TouchableOpacity>
            </View>
            )}
        </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
    infoContainer: {
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
    cartControls: {
        marginTop: 10,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    quantityButton: {
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityText: {
        marginHorizontal: 12,
        fontSize: 16,
        fontWeight: '600',
    },
    addButton: {
        backgroundColor: '#00bfff',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 4,
    },
    addButtonText: {
        color: 'white',
        fontWeight: '600',
        marginLeft: 6,
    },
});

export default ItemCard;
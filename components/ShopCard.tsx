import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ShopCard = ({ name }: { name: string }) => (
    <View style={styles.shopItem}>
        <Text style={styles.shopName}>{name}</Text>
        <View style={styles.shopCircles}>
            {[...Array(4)].map((_, i) => (
                <View key={i} style={styles.circle} />
            ))}
        </View>
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
    },
    shopCircles: {
        flexDirection: 'row',
        marginTop: 8,
    },
    circle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'yellow',
        marginRight: 8,
    },
});

export default ShopCard;

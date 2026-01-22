import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const OrdersScreen = () => {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>orders</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="black" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                
                <View style={styles.tabContainer}>
                    <TouchableOpacity 
                        style={styles.tabButton}
                        onPress={() => router.push('./orders?filter=placed')}
                    >
                        <View style={styles.tabIcon}>
                            <Ionicons name="bag-outline" size={32} color="#2196F3" />
                        </View>
                        <Text style={styles.tabButtonText}>Orders Placed</Text>
                        <Text style={styles.tabButtonSubtext}>Active orders you&apos;ve placed</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.tabButton}
                        onPress={() => router.push('./orders?filter=received')}
                    >
                        <View style={styles.tabIcon}>
                            <Ionicons name="storefront-outline" size={32} color="#4CAF50" />
                        </View>
                        <Text style={styles.tabButtonText}>Orders Received</Text>
                        <Text style={styles.tabButtonSubtext}>Orders for your shops</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.tabButton}
                        onPress={() => router.push('./orders?filter=history')}
                    >
                        <View style={styles.tabIcon}>
                            <Ionicons name="receipt-outline" size={32} color="#FF9800" />
                        </View>
                        <Text style={styles.tabButtonText}>Order History</Text>
                        <Text style={styles.tabButtonSubtext}>View completed orders</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#b7ffb0',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        ...Platform.select({
            ios: {
                justifyContent: 'flex-end',
            }
        }),
    },
    backButton: {
        padding: 2,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '400',
        fontFamily: 'TitanOne',
        color: "#fff",
        ...Platform.select({
            web: {
                fontSize: 32,
            }
        }),
    },
    content: {
        flex: 1,
        padding: 20,
    },
    tabContainer: {
        gap: 20,
    },
    tabButton: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    tabIcon: {
        marginBottom: 12,
    },
    tabButtonText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
        fontFamily: 'TextMeOne',
    },
    tabButtonSubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        fontFamily: 'TextMeOne',
    },
});

export default OrdersScreen;

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import firebaseService from '@/handlers/firebaseService';
import notificationService from '@/handlers/notificationService';
import { useUser } from '@/store/reduxHooks';

const Settings = () => {
  // Use the user context for logout and to get user data
  const { clearUserData, userData } = useUser();

  const handleLogout = async () => {
    try {
      // Remove push notification token before logout
      if (userData?.uid) {
        await notificationService.removeTokenFromUser(userData.uid);
      }
      notificationService.cleanup();

      // First logout from Firebase
      await firebaseService.logout();

      // Then clear user data from context and storage
      await clearUserData();

      // Navigate back to home
      router.back();
      router.replace('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.dragBar}>
        {Platform.OS !== 'web' && <View style={styles.dragBarImage} />}
        {Platform.OS === 'web' && (
          <Text onPress={() => router.back()} style={styles.closeIcon}>
            X
          </Text>
        )}
      </View>

      {/* User profile header */}
      <View style={styles.userHeader}>
        <Text style={styles.welcomeText}>
          Logged in as: {userData?.displayName || 'not logged in'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => {
          router.back(); // Close modal first
          router.push('/EditDetails'); // Navigate to full page
        }}
      >
        <Text style={styles.menuText}>Edit Details</Text>
      </TouchableOpacity>

      {/* Add other menu items */}
      <TouchableOpacity style={styles.menuItem}>
        <Text style={styles.menuText}>Appearance</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <Text style={styles.menuText}>About</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem}>
        <Text style={styles.menuText}>Legal</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
        <Text style={styles.menuText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#b7ffb0',
    padding: 20,
  },
  dragBar: {
    width: '100%',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dragBarImage: {
    width: 50,
    height: 5,
    backgroundColor: 'grey',
    borderRadius: 2.5,
  },
  closeIcon: {
    position: 'absolute',
    right: 0,
    fontSize: 24,
    padding: 10,
  },
  userHeader: {
    padding: 15,
    borderRadius: 10,
    borderColor: '#000',
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontFamily: 'TextMeOne',
    color: '#000',
    textAlign: 'center',
  },
  menuItem: {
    backgroundColor: '#00bfff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  menuText: {
    textAlign: 'center',
    fontSize: 21,
    fontFamily: 'TextMeOne',
    color: '#fff',
  },
});

export default Settings;

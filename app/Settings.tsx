import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import firebaseService from '@/handlers/firebaseService';
import notificationService from '@/handlers/notificationService';
import { useUser } from '@/store/reduxHooks';
import { useAppColors } from '@/hooks/useAppColors';

const Settings = () => {
  // Use the user context for logout and to get user data
  const { clearUserData, userData } = useUser();
  const colors = useAppColors();

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

  const handleAppearance = () => {
    router.back(); // Close modal first
    router.push('/Appearance'); // Navigate to Appearance page
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.secondary }]}>
      <View style={styles.dragBar}>
        {Platform.OS !== 'web' && (
          <View style={[styles.dragBarImage, { backgroundColor: colors.textMuted }]} />
        )}
        {Platform.OS === 'web' && (
          <Text onPress={() => router.back()} style={[styles.closeIcon, { color: colors.text }]}>
            X
          </Text>
        )}
      </View>

      {/* User profile header */}
      <View style={[styles.userHeader, { borderColor: colors.border }]}>
        <Text style={[styles.welcomeText, { color: colors.text }]}>
          Logged in as: {userData?.displayName || 'not logged in'}
        </Text>
      </View>
      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.buttonPrimary }]}
          onPress={() => {
            router.back(); // Close modal first
            router.push('/EditDetails'); // Navigate to full page
          }}
        >
          <Text style={[styles.menuText, { color: colors.buttonText }]}>Edit Details</Text>
        </TouchableOpacity>

        {/* Add other menu items */}
        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.buttonPrimary }]}
          onPress={handleAppearance}
        >
          <Text style={[styles.menuText, { color: colors.buttonText }]}>Appearance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.buttonPrimary }]}>
          <Text style={[styles.menuText, { color: colors.buttonText }]}>About</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.buttonPrimary }]}>
          <Text style={[styles.menuText, { color: colors.buttonText }]}>Legal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, { backgroundColor: colors.buttonPrimary }]}
          onPress={handleLogout}
        >
          <Text style={[styles.menuText, { color: colors.buttonText }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
    width: Platform.OS === 'web' ? 800 : '100%',
    alignSelf: 'center',
  },
  welcomeText: {
    fontSize: Platform.OS === 'web' ? 30 : 24,
    fontFamily: 'TextMeOne',
    textAlign: 'center',
  },
  menuContainer: {
    flex: 1,
    gap: 15,
    alignItems: 'center',
  },
  menuItem: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    width: Platform.OS === 'web' ? 800 : '100%',
  },
  menuText: {
    textAlign: 'center',
    fontSize: Platform.OS === 'web' ? 30 : 21,
    fontFamily: 'TextMeOne',
  },
});

export default Settings;

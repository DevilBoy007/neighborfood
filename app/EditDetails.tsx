import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { router } from 'expo-router';
import { GeoPoint } from 'firebase/firestore';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import profileIcon from '@/assets/images/user.png';
import firebaseService from '@/handlers/firebaseService';
import { useUser } from '@/store/reduxHooks';

/* eslint-disable @typescript-eslint/no-require-imports */
// Conditionally import native-only components
let GooglePlacesAutocomplete: React.ComponentType<any>;
if (Platform.OS !== 'web') {
  const GooglePlacesImport = require('react-native-google-places-autocomplete');
  GooglePlacesAutocomplete = GooglePlacesImport.GooglePlacesAutocomplete;
} else {
  GooglePlacesAutocomplete = require('@/components/WebGooglePlacesAutocomplete').default;
}
/* eslint-enable @typescript-eslint/no-require-imports */

const EditDetails = () => {
  const { userData, setUserData } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [locationSelected, setLocationSelected] = useState(false);
  const [showLocationWarning, setShowLocationWarning] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const originalZip = useRef<string>('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEmailInfo, setShowEmailInfo] = useState(false);

  const [mediaLibraryPermissionResponse, requestMediaLibraryPermission] =
    ImagePicker.useMediaLibraryPermissions();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: {
      address: '',
      city: '',
      state: '',
      zip: '',
      coords: {
        latitude: 0,
        longitude: 0,
      },
    },
    username: '',
  });

  // Initialize form data from userData
  useEffect(() => {
    if (userData) {
      setFormData({
        firstName: userData.first || '',
        lastName: userData.last || '',
        email: userData.email || '',
        phone: userData.phone || '',
        location: {
          address: userData.location?.address || '',
          city: userData.location?.city || '',
          state: userData.location?.state || '',
          zip: userData.location?.zip || '',
          coords: {
            latitude: userData.location?.coords?.latitude || 0,
            longitude: userData.location?.coords?.longitude || 0,
          },
        },
        username: userData.displayName || '',
      });
      if (userData.location?.address) {
        setLocationSelected(true);
      }
      // Store original zip for comparison
      if (!originalZip.current && userData.location?.zip) {
        originalZip.current = userData.location.zip;
      }
      // Set profile image from userData
      if (userData.photoURL) {
        setProfileImage(userData.photoURL);
      }
    }
  }, [userData]);

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const pickImage = async () => {
    if (mediaLibraryPermissionResponse?.status !== 'granted') {
      await requestMediaLibraryPermission();
    }
    if (mediaLibraryPermissionResponse?.status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Permission Required',
        text2: 'Permission to access media library is required to upload images.',
      });
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to select image',
      });
    }
  };

  const uploadImage = async (uri: string) => {
    if (!userData?.uid) return;

    try {
      setUploadingImage(true);

      const response = await fetch(uri);
      const blob = await response.blob();
      const filename = `profile_${userData.uid}_${Date.now()}.jpg`;
      const file = new File([blob], filename, { type: blob.type });

      await firebaseService.uploadUserProfileImage(
        file,
        userData.uid,
        (progress) => {
          console.log(`Upload is ${progress}% done`);
        },
        async (downloadURL) => {
          // Update the user's photoURL in Firestore
          await firebaseService.updateDocument('users', userData.uid, {
            photoURL: downloadURL,
          });

          // Update local state
          setProfileImage(downloadURL);
          await setUserData({
            ...userData,
            photoURL: downloadURL,
          });

          setUploadingImage(false);
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Profile image updated!',
          });
        },
        (error) => {
          console.error('Error uploading image:', error);
          setUploadingImage(false);
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'Failed to upload image',
          });
        }
      );
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadingImage(false);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to upload image',
      });
    }
  };

  const handleLocationSelect = (data: any, details: any = null) => {
    if (details) {
      const addressComponents = details.address_components;
      const cityComponent = addressComponents.find((component: any) =>
        component.types.includes('locality')
      );
      const stateComponent = addressComponents.find((component: any) =>
        component.types.includes('administrative_area_level_1')
      );
      const zipComponent = addressComponents.find((component: any) =>
        component.types.includes('postal_code')
      );

      let latitude: number, longitude: number;

      if (details.geometry && details.geometry.location) {
        if (typeof details.geometry.location.lat === 'function') {
          latitude = details.geometry.location.lat();
        } else {
          latitude = details.geometry.location.lat;
        }

        if (typeof details.geometry.location.lng === 'function') {
          longitude = details.geometry.location.lng();
        } else {
          longitude = details.geometry.location.lng;
        }
      } else {
        latitude = 0;
        longitude = 0;
      }

      setLocationSelected(true);
      setFormData((prev) => ({
        ...prev,
        location: {
          address: details.formatted_address,
          city: cityComponent ? cityComponent.long_name : '',
          state: stateComponent ? stateComponent.short_name : '',
          zip: zipComponent ? zipComponent.long_name : '',
          coords: {
            latitude: latitude || 0,
            longitude: longitude || 0,
          },
        },
      }));
    }
  };

  const hasLocationChanged = () => {
    return (
      originalZip.current && formData.location.zip && originalZip.current !== formData.location.zip
    );
  };

  const handleSaveClick = () => {
    // Check if location (zip) has changed - if so, show warning modal
    if (hasLocationChanged()) {
      setShowLocationWarning(true);
    } else {
      handleSave();
    }
  };

  const handleSave = async () => {
    setShowLocationWarning(false);

    if (!userData?.uid) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'User not found. Please log in again.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { firstName, lastName, phone, location, username } = formData;

      // Validate required fields
      if (!firstName || !lastName || !phone) {
        Toast.show({
          type: 'error',
          text1: 'Missing Fields',
          text2: 'Please fill in all required fields.',
        });
        setIsLoading(false);
        return;
      }

      // Validate phone number
      if (phone.length !== 10 || phone.match(/[^0-9]/)) {
        Toast.show({
          type: 'error',
          text1: 'Invalid Phone',
          text2: 'Phone number must be 10 digits.',
        });
        setIsLoading(false);
        return;
      }

      // Validate username
      if (!username || username.length < 6) {
        setUsernameError('Username must be at least 6 characters.');
        setIsLoading(false);
        return;
      }
      if (username.match(/[^a-zA-Z0-9]/)) {
        setUsernameError('Username cannot contain special characters.');
        setIsLoading(false);
        return;
      }

      // Check if username changed and if so, verify it's not taken
      if (username !== userData.displayName) {
        const existingUsers = await firebaseService.getDocumentsWhere(
          'users',
          'username',
          '==',
          username
        );
        if (existingUsers.length > 0) {
          setUsernameError('Username is already taken.');
          setIsLoading(false);
          return;
        }
      }
      setUsernameError('');

      // Prepare location with GeoPoint for Firestore
      const locationWithGeoPoint = {
        address: location.address,
        city: location.city,
        state: location.state,
        zip: location.zip,
        coords: new GeoPoint(location.coords.latitude, location.coords.longitude),
      };

      // Update Firestore document
      await firebaseService.updateDocument('users', userData.uid, {
        first: firstName,
        last: lastName,
        phone: phone,
        location: locationWithGeoPoint,
        username: username,
      });

      // If location (zip) changed, update marketId for all user's shops and items
      if (hasLocationChanged()) {
        const newMarketId = location.zip;
        try {
          // Get all user's shops and items (uses cache if recently fetched)
          const { shops, items } = await firebaseService.getShopsAndItemsForUser(userData.uid);

          // Update each shop's marketId
          for (const shop of shops as { id: string }[]) {
            await firebaseService.updateShopDetails(shop.id, { marketId: newMarketId });
          }

          // Update each item's marketId
          for (const item of items as { id: string }[]) {
            await firebaseService.updateItemDetails(item.id, { marketId: newMarketId });
          }

          console.log(
            `Updated marketId to ${newMarketId} for ${shops.length} shops and ${items.length} items`
          );

          // Clear the user's shops cache since we just updated them
          firebaseService.clearUserShopsCache(userData.uid);
        } catch (updateError) {
          console.error('Error updating marketId for shops/items:', updateError);
          // Continue with save even if marketId update fails - user can retry
        }
      }

      // Update local state
      const updatedUserData = {
        ...userData,
        first: firstName,
        last: lastName,
        phone: phone,
        location: location,
        displayName: username,
      };
      await setUserData(updatedUserData);

      // Update the original zip reference
      originalZip.current = location.zip;

      // Clear the shops cache since location may have changed
      firebaseService.clearShopsCache();

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Your details have been updated.',
      });

      router.back();
      router.push('/success');
    } catch (error) {
      console.error('Error updating user details:', error);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Could not update your details. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.profileImageContainer}
          onPress={pickImage}
          disabled={uploadingImage}
        >
          {uploadingImage ? (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="small" color="#00bfff" />
            </View>
          ) : (
            <>
              <Image
                source={profileImage ? { uri: profileImage } : profileIcon}
                style={styles.profileImage}
              />
              <View style={styles.editIconOverlay}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.title}>Edit Details</Text>
        <Text
          onPress={() => {
            router.back();
          }}
          style={styles.closeIcon}
        >
          X
        </Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={Platform.OS !== 'web'}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>Personal Info</Text>
        <View style={styles.emailRow}>
          <TextInput
            style={[styles.input, styles.emailInput]}
            placeholder="email"
            placeholderTextColor={'#999'}
            value={formData.email}
            editable={false}
            selectTextOnFocus={false}
          />
          <TouchableOpacity style={styles.infoButton} onPress={() => setShowEmailInfo(true)}>
            <Ionicons name="information-circle-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="first name"
            placeholderTextColor={'#999'}
            value={formData.firstName}
            onChangeText={(text) => handleChange('firstName', text)}
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="last name"
            placeholderTextColor={'#999'}
            value={formData.lastName}
            onChangeText={(text) => handleChange('lastName', text)}
          />
        </View>

        <TextInput
          style={styles.input}
          placeholder="phone number"
          placeholderTextColor={'#999'}
          keyboardType="phone-pad"
          value={formData.phone}
          onChangeText={(text) => handleChange('phone', text)}
        />

        {/* Location Section */}
        <Text style={styles.subtitle}>Location</Text>
        <View style={styles.googlePlacesWrapper}>
          <GooglePlacesAutocomplete
            placeholder="Enter your address"
            textInputProps={{
              placeholderTextColor: '#999',
              returnKeyType: 'search',
              defaultValue: formData.location.address,
            }}
            onPress={handleLocationSelect}
            query={{
              key: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
              language: 'en',
            }}
            styles={{
              textInput: styles.googlePlacesInput,
              container: {
                ...styles.googlePlacesContainer,
                zIndex: 9999,
              },
              listView: {
                zIndex: 10000,
                position: 'relative',
              },
            }}
            predefinedPlaces={[]}
            fetchDetails={true}
            enablePoweredByContainer={false}
            minLength={3}
            keyboardShouldPersistTaps="handled"
            disableScroll={true}
            requestUrl={{
              useOnPlatform: 'web',
              url: 'https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api',
            }}
          />
        </View>

        {/* Display selected location details */}
        {locationSelected && formData.location.address ? (
          <View style={styles.locationDetailsContainer}>
            <Text style={styles.locationDetail}>{formData.location.address}</Text>
          </View>
        ) : formData.location.city || formData.location.state || formData.location.zip ? (
          <View style={styles.locationDetailsContainer}>
            <Text style={styles.locationDetail}>
              {formData.location.city}
              {formData.location.city && formData.location.state ? ', ' : ''}
              {formData.location.state} {formData.location.zip}
            </Text>
          </View>
        ) : null}

        <Text style={styles.subtitle}>Login Info</Text>

        <TextInput
          style={styles.input}
          placeholder="username"
          placeholderTextColor={'#999'}
          value={formData.username}
          autoCapitalize="none"
          onChangeText={(text) => {
            handleChange('username', text);
            setUsernameError('');
          }}
        />
        {usernameError ? (
          <Text style={styles.errorText}>{usernameError}</Text>
        ) : (
          <Text style={styles.helperText}>
            Must be at least 6 characters with no special characters.
          </Text>
        )}
      </ScrollView>

      {/* Email Info Modal */}
      <Modal
        visible={showEmailInfo}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEmailInfo(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEmailInfo(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ℹ️ About Email</Text>
            <Text style={styles.modalText}>
              Your email address is used as your login credential and is linked to your account's
              authentication.
            </Text>
            <Text style={styles.modalText}>
              For security reasons, changing your email requires identity verification. Please
              contact our support team if you need to update it.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirm, { marginTop: 8, flex: 0 }]}
              onPress={() => setShowEmailInfo(false)}
            >
              <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Location Change Warning Modal */}
      <Modal
        visible={showLocationWarning}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLocationWarning(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚠️ Location Change</Text>
            <Text style={styles.modalText}>
              Changing your location will update the market location for all of your existing shops
              and items. They will appear in the new market area ({formData.location.zip}) instead
              of the current one ({originalZip.current}).
            </Text>
            <Text style={styles.modalText}>Are you sure you want to continue?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowLocationWarning(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleSave}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>
                  Yes, Update
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <TouchableOpacity
        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
        onPress={handleSaveClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={styles.saveButtonText}>Save</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#b7ffb0',
    paddingHorizontal: Platform.OS === 'web' ? '10%' : 20,
    paddingTop: Platform.OS === 'web' ? 40 : 60,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  profileImageContainer: {
    position: 'relative',
    width: Platform.OS === 'web' ? 50 : 40,
    height: Platform.OS === 'web' ? 50 : 40,
  },
  profileImage: {
    width: Platform.OS === 'web' ? 50 : 40,
    height: Platform.OS === 'web' ? 50 : 40,
    borderRadius: Platform.OS === 'web' ? 25 : 20,
    backgroundColor: '#f0f0f0',
  },
  editIconOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#00bfff',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#b7ffb0',
  },
  uploadingOverlay: {
    width: Platform.OS === 'web' ? 50 : 40,
    height: Platform.OS === 'web' ? 50 : 40,
    borderRadius: Platform.OS === 'web' ? 25 : 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontFamily: 'TitanOne',
    flex: 1,
    textAlign: 'center',
    color: '#fff',
  },
  closeIcon: {
    fontSize: 15,
    padding: Platform.OS === 'web' ? 10 : 5,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 5,
    backgroundColor: '#fff',
    color: '#b7ffb0',
  },
  subtitle: {
    fontSize: 20,
    fontFamily: 'TextMeOne',
    marginBottom: 20,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  input: {
    height: Platform.OS === 'web' ? 45 : 50,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    width: '100%',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    width: '100%',
  },
  halfInput: {
    width: '48%',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  emailInput: {
    flex: 1,
    marginBottom: 0,
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  infoButton: {
    padding: 10,
    marginLeft: 8,
  },
  scrollView: {
    flexGrow: 1,
    paddingHorizontal: 10,
  },
  saveButton: {
    backgroundColor: '#00bfff',
    width: '100%',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  saveButtonText: {
    fontFamily: 'TextMeOne',
    fontSize: 30,
    color: 'white',
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'TextMeOne',
    color: '#666',
    marginTop: -10,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  googlePlacesWrapper: {
    position: 'relative',
    zIndex: 9999,
    marginBottom: 10,
  },
  googlePlacesContainer: {
    marginBottom: 16,
    zIndex: 9999,
  },
  googlePlacesInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    height: 50,
    borderWidth: 1,
    borderColor: '#000',
  },
  locationDetailsContainer: {
    backgroundColor: '#00bfff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    zIndex: 1,
  },
  locationDetail: {
    fontSize: 18,
    color: '#fff',
    fontFamily: 'TextMeOne',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'TextMeOne',
    color: '#ff3b30',
    marginTop: -10,
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
      },
    }),
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'TitanOne',
    color: '#ff9500',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    fontFamily: 'TextMeOne',
    color: '#333',
    marginBottom: 12,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonConfirm: {
    backgroundColor: '#ff9500',
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'TextMeOne',
    color: '#666',
  },
  modalButtonTextConfirm: {
    color: '#fff',
  },
});

export default EditDetails;

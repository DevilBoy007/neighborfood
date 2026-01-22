import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Platform,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    StyleSheet,
    Image,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

import firebaseService from '@/handlers/firebaseService';
import { useUser, useItem, useShop } from '@/store/reduxHooks';

const categories = ['produce', 'dairy', 'meat', 'baked good', 'preserves', 'spices', 'prepared foods', 'other'];
const units = ['each', 'lb', 'oz', 'bunch', 'pint', 'quart', 'gallon'];

export default function AddItemScreen() {
    const router = useRouter();
    const { itemId } = useLocalSearchParams();
    const { userData } = useUser();
    const { selectedItem, setSelectedItem, setIsLoadingItem, isLoadingItem } = useItem();
    const { shops, setShops, setIsLoadingShop } = useShop();
    
    const [name, setName] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [shopId, setShopId] = useState<string>('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [price, setPrice] = useState<string>('');
    const [unit, setUnit] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('1');
    const [negotiable, setNegotiable] = useState<boolean>(false);
    const [image, setImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState<boolean>(false);
    
    const [mediaLibraryPermissionResponse, requestMediaLibraryPermission] = ImagePicker.useMediaLibraryPermissions();
    
    const [errors, setErrors] = useState({
        name: '',
        description: '',
        shopId: '',
        categories: '',
        price: '',
        unit: '',
        quantity: '',
        image: ''
    });

    useEffect(() => {
        const loadShops = async () => {
            if (userData && userData.uid) {
                try {
                    setIsLoadingShop(true);
                    const userShops = await firebaseService.getShopsForUser(userData.uid);
                    setShops(userShops);
                    
                    // If we have shops and no shop is selected yet, pre-select the first one
                    if (userShops.length > 0 && !shopId) {
                        setShopId(userShops[0].id);
                    }
                } catch (error) {
                    console.error("Error loading shops:", error);
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: 'Failed to load shops. Please try again.'
                    });
                } finally {
                    setIsLoadingShop(false);
                }
            }
        };

        loadShops();
    }, [userData]);

    useEffect(() => {
        // If itemId matches selectedItem.id, we're editing that item
        if (itemId && selectedItem && itemId === selectedItem.id) {
            // Populate form with selectedItem data
            setName(selectedItem.name);
            setDescription(selectedItem.description);
            setShopId(selectedItem.shopId[0]);
            setSelectedCategories(selectedItem.category || []);
            setPrice(selectedItem.price?.toString() || '');
            setUnit(selectedItem.unit || '');
            setQuantity(selectedItem.quantity?.toString() || '1');
            setNegotiable(selectedItem.negotiable || false);
            setImage(selectedItem.imageUrl || null);
        }
    }, [itemId, selectedItem]);

    const pickImage = async () => {
        if (mediaLibraryPermissionResponse?.status !== 'granted') {
            await requestMediaLibraryPermission();
        }
        if (mediaLibraryPermissionResponse?.status !== 'granted') {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Permission to access media library is required to upload images.',
            });
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImage(result.assets[0].uri);
            setErrors({...errors, image: ''});
        }
    };
    
    const uploadImageToFirebase = async (uri: string, targetShopId: string, targetItemId: string): Promise<string> => {
        setUploading(true);
        
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            
            const file = new File([blob], `item_${Date.now()}.jpg`, { type: blob.type });
            
            return new Promise<string>((resolve, reject) => {
                firebaseService.uploadProductImage(
                    file,
                    targetShopId,
                    targetItemId,
                    (progress) => {
                        // You can use progress for a progress bar if desired
                        console.log(`Upload is ${progress}% done`);
                    },
                    (downloadURL) => {
                        setUploading(false);
                        resolve(downloadURL);
                    },
                    (error) => {
                        setUploading(false);
                        reject(error);
                    }
                );
            });
        } catch (error) {
            setUploading(false);
            console.error("Error uploading image:", error);
            throw error;
        }
    };

    const toggleCategory = (category: string) => {
        if (selectedCategories.includes(category)) {
            setSelectedCategories(selectedCategories.filter(c => c !== category));
        } else {
            setSelectedCategories([...selectedCategories, category]);
        }
    };
    
    const validateForm = () => {
        let isValid = true;
        const newErrors = {
            name: '',
            description: '',
            shopId: '',
            categories: '',
            price: '',
            unit: '',
            quantity: '',
            image: ''
        };

        if (!name.trim()) {
            newErrors.name = 'Item name is required';
            isValid = false;
        }

        if (!description.trim()) {
            newErrors.description = 'Description is required';
            isValid = false;
        }

        if (!shopId) {
            newErrors.shopId = 'Please select a shop';
            isValid = false;
        }

        if (selectedCategories.length === 0) {
            newErrors.categories = 'Please select at least one category';
            isValid = false;
        }

        if (!price.trim()) {
            newErrors.price = 'Price is required';
            isValid = false;
        } else if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
            newErrors.price = 'Please enter a valid price';
            isValid = false;
        }

        if (!unit) {
            newErrors.unit = 'Please select a unit';
            isValid = false;
        }

        if (!quantity.trim()) {
            newErrors.quantity = 'Quantity is required';
            isValid = false;
        } else if (isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
            newErrors.quantity = 'Please enter a valid quantity';
            isValid = false;
        }

        if (!image && !itemId) {
            newErrors.image = 'Please upload an image';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async () => {
        if (validateForm()) {
            try {
                // Ensure user is authenticated before creating an item
                if (!userData || !userData.uid) {
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: 'You must be logged in to add an item'
                    });
                    return;
                }

                setIsLoadingItem(true);

                // For new items, generate the itemId before uploading the image
                // This ensures the image path matches the storage rules
                const newItemIdForUpload = itemId ? itemId.toString() : uuidv4();

                // Upload image if it's a new item or if the image has changed
                let imageUrl = image;
                if (image && (!itemId || (selectedItem && image !== selectedItem.imageUrl))) {
                    try {
                        imageUrl = await uploadImageToFirebase(image, shopId, newItemIdForUpload);
                    } catch (uploadError) {
                        Toast.show({
                            type: 'error',
                            text1: 'Error',
                            text2: 'Failed to upload image. Please try again.'
                        });
                        setIsLoadingItem(false);
                        return;
                    }
                }

                // Find the selected shop to get the marketId
                const shop = shops.find(s => s.id === shopId);
                if (!shop) {
                    Toast.show({
                        type: 'error',
                        text1: 'Error',
                        text2: 'Selected shop not found'
                    });
                    setIsLoadingItem(false);
                    return;
                }

                const itemData = {
                    name,
                    description,
                    shopId: shopId, // Store as array to support multi-shop items in the future
                    marketId: userData.location.zip,
                    userId: userData.uid,
                    category: selectedCategories,
                    imageUrl,
                    price: parseFloat(price),
                    unit,
                    negotiable,
                    quantity: parseInt(quantity),
                };
                
                if (itemId && selectedItem) {
                    // We're updating an existing item - use dedicated updateItemDetails function
                    await firebaseService.updateItemDetails(itemId.toString(), itemData);
                    
                    // Update the selectedItem in context to reflect changes immediately
                    setSelectedItem({
                        ...selectedItem,
                        ...itemData,
                        id: selectedItem.id,
                        marketId: userData.location.zip || '',
                        imageUrl: imageUrl || '', // Ensure imageUrl is never null
                        createdAt: selectedItem.createdAt
                    });
                    
                    // Store success message for later
                    const successMessage = 'Item updated successfully!';
                    
                    setIsLoadingItem(false);
                    
                    if (Platform.OS === 'web') {
                        router.navigate('/success');
                        setTimeout(() => {
                            router.back();
                            // Show toast after navigating back
                            setTimeout(() => {
                                Toast.show({
                                    type: 'success',
                                    text1: 'Success',
                                    text2: successMessage
                                });
                            }, 300);
                        }, 2100);
                    } else {
                        router.navigate('/success');
                        setTimeout(() => {
                            router.back();
                            // Show toast after navigating back
                            setTimeout(() => {
                                Toast.show({
                                    type: 'success',
                                    text1: 'Success',
                                    text2: successMessage
                                });
                            }, 300);
                        }, 2000);
                    }
                } else {
                    // Create new item with the pre-generated itemId (for storage path consistency)
                    // Use dedicated createItemForShop function with optional itemId
                    await firebaseService.createItemForShop(shopId, itemData, newItemIdForUpload);
                    
                    const successMessage = 'Item created successfully!';
                    
                    setIsLoadingItem(false);
                    
                    if (Platform.OS === 'web') {
                        router.navigate('/success');
                        setTimeout(() => {
                            router.back();
                            setTimeout(() => {
                                Toast.show({
                                    type: 'success',
                                    text1: 'Success',
                                    text2: successMessage
                                });
                            }, 300);
                        }, 2100);
                    } else {
                        router.navigate('/success');
                        setTimeout(() => {
                            router.back();
                            setTimeout(() => {
                                Toast.show({
                                    type: 'success',
                                    text1: 'Success',
                                    text2: successMessage
                                });
                            }, 300);
                        }, 2000);
                    }
                }
            } catch (error) {
                setIsLoadingItem(false);
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: itemId ? 'Failed to update item. Please try again.' : 'Failed to create item. Please try again.'
                });
            }
        } else {
            if (Platform.OS === 'web') {
                window.scrollTo(0, 0);
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.sectionTitle}>{itemId ? 'Edit Item' : 'Add Item'}</Text>
            </View>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 20}>
                
            <ScrollView 
                style={styles.container}
                contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 50 : 50 }}
                keyboardDismissMode='on-drag'
                keyboardShouldPersistTaps='handled'
                showsVerticalScrollIndicator={false}>
                <View style={styles.formContainer}>
                    <Text style={styles.sectionTitle}>Item Info</Text>
                    <TextInput
                        style={[styles.input, errors.name ? styles.inputError : null]}
                        placeholder="item name"
                        placeholderTextColor={'#999'}
                        value={name}
                        onChangeText={(text) => {
                            setName(text);
                            if (text.trim()) setErrors({...errors, name: ''});
                        }}
                    />
                    {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
                    
                    <TextInput
                        style={[styles.input, styles.textArea, errors.description ? styles.inputError : null]}
                        placeholder="description"
                        placeholderTextColor={'#999'}
                        multiline
                        minHeight={Platform.OS === 'ios' ? 80 : null}
                        value={description}
                        onChangeText={(text) => {
                            setDescription(text);
                            if (text.trim()) setErrors({...errors, description: ''});
                        }}
                    />
                    {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}

                    <Text style={styles.sectionTitle}>Shop & Category</Text>
                    
                    {/* Shop Selection */}
                    {Platform.OS === 'web' ? (
                        <>
                            <select
                                style={{
                                    ...styles.webSelect, 
                                    ...(errors.shopId ? styles.webSelectError : {})
                                }}
                                value={shopId}
                                onChange={(e) => {
                                    setShopId(e.target.value);
                                    if (e.target.value) setErrors({...errors, shopId: ''});
                                }}
                            >
                                <option value="">select shop</option>
                                {shops.map(shop => (
                                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                                ))}
                            </select>
                            {errors.shopId ? <Text style={styles.errorText}>{errors.shopId}</Text> : null}
                        </>
                    ) : (
                        <>
                            <View style={errors.shopId ? styles.pickerError : null}>
                                <Picker
                                    selectedValue={shopId}
                                    onValueChange={(value) => {
                                        setShopId(value);
                                        if (value) setErrors({...errors, shopId: ''});
                                    }}
                                    style={styles.picker}
                                    itemStyle={{ height: 150, fontFamily: 'TextMeOne' }}
                                >
                                    <Picker.Item color="#00bfff" label="select shop" value="" />
                                    {shops.map(shop => (
                                        <Picker.Item 
                                            key={shop.id} 
                                            color="black" 
                                            label={shop.name} 
                                            value={shop.id} 
                                        />
                                    ))}
                                </Picker>
                            </View>
                            {errors.shopId ? <Text style={styles.errorText}>{errors.shopId}</Text> : null}
                        </>
                    )}

                    {/* Categories */}
                    <Text style={styles.sectionSubtitle}>Categories</Text>
                    <View style={styles.categoriesContainer}>
                        {categories.map((category) => (
                            <TouchableOpacity
                                key={category}
                                style={[
                                    styles.categoryButton,
                                    selectedCategories.includes(category) && styles.selectedButton
                                ]}
                                onPress={() => {
                                    toggleCategory(category);
                                    if (selectedCategories.length > 0 || category) setErrors({...errors, categories: ''});
                                }}
                            >
                                <Text style={[
                                    styles.categoryButtonText,
                                    selectedCategories.includes(category) && styles.selectedButtonText
                                ]}>
                                    {category}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    {errors.categories ? <Text style={styles.errorText}>{errors.categories}</Text> : null}

                    <Text style={styles.sectionTitle}>Pricing & Availability</Text>
                    
                    {/* Price and Unit */}
                    <View style={styles.priceContainer}>
                        <View style={[styles.priceInput, errors.price ? styles.inputError : null]}>
                            <TextInput
                                style={[styles.input, { marginBottom: 0, paddingLeft: 40 }]}
                                placeholder="9.99"
                                placeholderTextColor={'#999'}
                                value={price}
                                keyboardType="decimal-pad"
                                onChangeText={(text) => {
                                    setPrice(text);
                                    if (text.trim() && !isNaN(parseFloat(text))) setErrors({...errors, price: ''});
                                }}
                            />
                            <Text style={styles.priceLabel}>$</Text>
                        </View>
                        
                        <View style={[styles.unitSelection, {width: '48%'}]}>
                            {Platform.OS === 'web' ? (
                                <select
                                    style={{
                                        ...styles.webSelect, 
                                        ...styles.webUnitSelect,
                                        ...(errors.unit ? styles.webSelectError : {}),
                                        marginBottom: 0
                                    }}
                                    value={unit}
                                    onChange={(e) => {
                                        setUnit(e.target.value);
                                        if (e.target.value) setErrors({...errors, unit: ''});
                                    }}
                                >
                                    <option value="">unit</option>
                                    {units.map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                            ) : (
                                <View style={errors.unit ? styles.pickerError : null}>
                                    <Picker
                                        selectedValue={unit}
                                        onValueChange={(value) => {
                                            setUnit(value);
                                            if (value) setErrors({...errors, unit: ''});
                                        }}
                                        style={styles.picker}
                                        itemStyle={{ height: 150, fontFamily: 'TextMeOne' }}
                                    >
                                        <Picker.Item color="#00bfff" label="unit" value="" />
                                        {units.map(u => (
                                            <Picker.Item key={u} color="black" label={u} value={u} />
                                        ))}
                                    </Picker>
                                </View>
                            )}
                        </View>
                    </View>
                    <View style={styles.errorRow}>
                        <Text style={[styles.errorText, {width: '48%'}]}>{errors.price}</Text>
                        <Text style={[styles.errorText, {width: '48%'}]}>{errors.unit}</Text>
                    </View>

                    {/* Quantity */}
                    <View style={styles.quantityContainer}>
                        <Text style={styles.quantityLabel}>Quantity Available:</Text>
                        <TextInput
                            style={[
                                styles.input, 
                                styles.quantityInput, 
                                errors.quantity ? styles.inputError : null
                            ]}
                            placeholder="1"
                            placeholderTextColor={'#999'}
                            value={quantity}
                            keyboardType="number-pad"
                            onChangeText={(text) => {
                                setQuantity(text);
                                if (text.trim() && !isNaN(parseInt(text))) setErrors({...errors, quantity: ''});
                            }}
                        />
                    </View>
                    {errors.quantity ? <Text style={styles.errorText}>{errors.quantity}</Text> : null}

                    {/* Negotiable checkbox */}
                    <View style={styles.checkboxContainer}>
                        <TouchableOpacity
                            style={styles.checkbox}
                            onPress={() => setNegotiable(!negotiable)}
                        >
                            <View style={[
                                styles.checkboxBox,
                                negotiable && styles.checkboxChecked
                            ]} />
                            <Text style={styles.checkboxLabel}>price negotiable</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Image Upload */}
                    <Text style={styles.sectionTitle}>Item Image</Text>
                    <TouchableOpacity 
                        style={[styles.imageUpload, errors.image ? styles.imageUploadError : null]}
                        onPress={pickImage}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <View style={styles.uploadingContainer}>
                                <ActivityIndicator size="large" color="#00bfff" />
                                <Text style={styles.uploadingText}>Uploading...</Text>
                            </View>
                        ) : image ? (
                            <Image source={{ uri: image }} style={styles.previewImage} />
                        ) : (
                            <View style={styles.uploadPlaceholder}>
                                <Ionicons name="camera-outline" size={40} color="#888" />
                                <Text style={styles.uploadText}>Tap to upload image</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    {errors.image ? <Text style={styles.errorText}>{errors.image}</Text> : null}
                </View>
            </ScrollView>
            </KeyboardAvoidingView>
            <View style={[styles.buttonContainer, Platform.OS === 'ios' && styles.iosButtonContainer]}>
                <TouchableOpacity 
                    style={styles.button} 
                    onPress={handleSubmit}
                    disabled={uploading || isLoadingItem}
                >
                    <Text style={styles.buttonText}>{itemId ? 'Save' : 'Add Item'}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    inputError: {
        borderWidth: 1,
        borderColor: 'red',
    },
    webSelectError: {
        borderWidth: 1,
        borderColor: 'red',
    },
    pickerError: {
        borderWidth: 1,
        borderColor: 'red',
        borderRadius: 8,
        overflow: 'hidden',
    },
    imageUploadError: {
        borderWidth: 2,
        borderColor: 'red',
    },
    errorText: {
        color: 'red',
        marginBottom: 10,
        fontSize: 14,
        fontFamily: 'TextMeOne',
    },
    errorRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    container: {
        flex: 1,
        backgroundColor: '#b7ffb0',
    },
    formContainer: {
        paddingHorizontal: 20,
        alignSelf: 'center',
        width: '100%',
    },
    backButton: {
        marginRight: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomColor: '#000',
        borderBottomWidth: 1,
        ...Platform.select({
            ios: {
                justifyContent: 'flex-end',
            }
        })
    },
    sectionTitle: {
        fontSize: 24,
        marginVertical: 15,
        color: '#fff',
        fontFamily: 'TitanOne'
    },
    sectionSubtitle: {
        fontSize: 18,
        marginVertical: 15,
        color: 'black',
        fontFamily: 'TitanOne',
        textAlign: 'right',
    },
    input: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        fontFamily: 'TextMeOne',
        fontSize: 16,
    },
    textArea: {
        height: Platform.OS === 'web' ? 100 : null,
        textAlignVertical: 'top',
    },
    webSelect: {
        backgroundColor: '#fff',
        height: 50,
        padding: 15,
        borderRadius: 3,
        marginBottom: 15,
        fontSize: 16,
        width: '100%',
        borderWidth: 1,
        borderColor: '#999',
    },
    webUnitSelect: {
        height: 52,
        padding: 10,
    },
    picker: {
        color: '#333',
        backgroundColor: '#b7ffb0',
        height: 125,
        marginBottom: 25,
    },
    categoriesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    categoryButton: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
        width: '48%',
        alignItems: 'center',
        marginBottom: 10,
    },
    selectedButton: {
        backgroundColor: '#00bfff',
    },
    categoryButtonText: {
        color: '#333',
        fontFamily: 'TextMeOne',
    },
    selectedButtonText: {
        color: '#fff',
        fontFamily: 'TextMeOne',
    },
    priceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 0,
        alignItems: 'center',
    },
    priceInput: {
        width: '48%',
        position: 'relative',
    },
    priceLabel: {
        position: 'absolute',
        left: 10,
        top: 15,
        fontSize: 16,
        color: '#333',
    },
    unitSelection: {
        width: '48%',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 10,
    },
    quantityLabel: {
        fontSize: 16,
        marginRight: 10,
        flex: 1,
        fontFamily: 'TextMeOne',
    },
    quantityInput: {
        width: '30%',
        marginBottom: 0,
    },
    checkboxContainer: {
        marginBottom: 20,
    },
    checkbox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    checkboxBox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#000',
        marginRight: 10,
        borderRadius: 4,
    },
    checkboxChecked: {
        backgroundColor: '#00bfff',
        borderColor: '#00bfff',
    },
    checkboxLabel: {
        color: '#333',
        fontSize: 16,
        fontFamily: 'TextMeOne',
    },
    imageUpload: {
        height: 200,
        borderRadius: 10,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        borderStyle: 'dashed',
        overflow: 'hidden',
    },
    uploadPlaceholder: {
        alignItems: 'center',
    },
    uploadText: {
        color: '#888',
        marginTop: 10,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    uploadingContainer: {
        alignItems: 'center',
    },
    uploadingText: {
        marginTop: 10,
        color: '#00bfff',
    },
    buttonContainer: {
        bottom: 0,
        left: 0,
        right: 0,
    },
    iosButtonContainer: {
        bottom: 30,
    },
    button: {
        width: '100%',
        padding: 10,
        paddingBottom: 33,
        backgroundColor: '#87CEFA',
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 30,
        fontFamily: 'TextMeOne',
    },
});

import { Platform } from 'react-native';
import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { FirebaseStorage, getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Analytics, getAnalytics } from 'firebase/analytics';
import {
    initializeAuth,
    getAuth,
    browserLocalPersistence,
    getReactNativePersistence,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    Auth,
    UserCredential
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getFirestore,
    Firestore,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    arrayUnion,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

class FirebaseService {
    private static instance: FirebaseService;
    private firebaseConfig: {
        apiKey: string;
        authDomain: string;
        projectId: string;
        appId: string;
        storageBucket: string;
    };
    private app: FirebaseApp | null;
    private auth: Auth | null;
    private storage: FirebaseStorage | null;
    private analytics: Analytics | null;
    private db: Firestore | null;
    private functions: any;

    private constructor() {
        this.firebaseConfig = {
            apiKey: process.env.EXPO_PUBLIC_API_KEY??'',
            authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN??'',
            projectId: process.env.EXPO_PUBLIC_PROJECT_ID??'',
            appId: process.env.EXPO_PUBLIC_APP_ID??'',
            storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET??''
        };

        this.app = null;
        this.storage = null;
        this.analytics = null;
        this.auth = null;
        this.db = null;
        this.functions = null;
    }

    public static getInstance(): FirebaseService {
        if (!FirebaseService.instance) {
            FirebaseService.instance = new FirebaseService();
        }
        return FirebaseService.instance;
    }

    disconnect() {
        try {
            this.app = null;
            this.auth = null;
            this.db = null;
            this.functions = null;
            console.log('Disconnected from Firebase');
            return true;
        } catch (error) {
            console.error('Error disconnecting from Firebase:', error);
            throw error;
        }
    }

    async connect() {
        try {
            // Check if Firebase is already initialized
            if (this.app && this.auth && this.db && this.storage && this.functions) {
                console.log('Firebase already connected');
                return true;
            }
            
            try {
                this.app = getApp();
                console.log('Retrieved existing Firebase app');
            } catch (getAppError) {
                this.app = initializeApp(this.firebaseConfig);
                console.log('Initialized new Firebase app');
            }

            if (!this.auth) {
                try {
                    this.auth = initializeAuth(this.app, {
                        persistence: Platform.OS === 'web'
                            ? browserLocalPersistence
                            : getReactNativePersistence(AsyncStorage)
                    });
                } catch (authError) {
                    if (authError.code === 'auth/already-initialized') {
                        this.auth = getAuth(this.app);
                        console.log('Retrieved existing auth instance');
                    } else {
                        throw authError;
                    }
                }
            }

            if (!this.storage) {
                try {
                    this.storage = getStorage(this.app, 'gs://neighborfoods');
                    console.log('Initialized Firebase storage');
                } catch (storageError) {
                    console.error('Error initializing Firebase storage:', storageError);
                    this.storage = null;
                }
            }

            // Force token refresh on init if user exists
            if (this.auth.currentUser) {
                await this.auth.currentUser.reload();
            }

            // Initialize Firestore if not already initialized  
            if (!this.db) {
                this.db = getFirestore(this.app);
            }

            // Initialize Functions if not already initialized
            if (!this.functions) {
                this.functions = getFunctions(this.app);
            }

            console.log('Successfully connected to Firebase');
            return true;
        } catch (error) {
            console.error('Error connecting to Firebase:', error);
            throw error;
        }
    }

    // Helper method to get auth token for function calls
    private async getAuthToken(): Promise<string> {
        await this.connect();
        if (!this.auth?.currentUser) {
            throw new Error('User not authenticated');
        }
        return await this.auth.currentUser.getIdToken();
    }

    async logout() {
        try {
            if (this.auth) { 
                await signOut(this.auth);
            }
            else { 
                this.connect();
                if (this.auth) await signOut(this.auth);
            }
            
            console.log('User logged out from Firebase');
            return true;
        } catch (error) {
            console.error('Error logging out from Firebase:', error);
            throw error;
        }
    }

    async login(email: string, password: string): Promise<UserCredential> {
        try {
            // Make sure Firebase is connected before login
            await this.connect();
            
            if (!this.auth) {
                this.connect();
                if (!this.auth) {
                    throw new Error('Firebase Auth is not initialized');
                }
            }
            
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            console.log('User logged in:', userCredential.user.uid);
            return userCredential;
        } catch (error) {
            console.error('Error logging in:', error);
            if (error.code === 'auth/already-initialized') {
                // If we get the already-initialized error, try getting auth again
                try {
                    const { getAuth } = await import('firebase/auth');
                    this.auth = getAuth(this.app);
                    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
                    return userCredential;
                } catch (secondError) {
                    throw secondError;
                }
            }
            
            switch (error.code) {
                case 'auth/invalid-email':
                    throw new Error('Invalid email');
                case 'auth/user-not-found':
                    throw new Error('User not found');
                case 'auth/invalid-credential':
                    throw new Error('Wrong password');
                default:
                    throw error;
            }
        }
    }

    async registerUser(email: string, password: string, username: string): Promise<UserCredential['user']> {
        try {
            if (!this.auth) {
                await this.connect();
                if (!this.auth) {
                    throw new Error('Error connecting to Firebase Authentication');
                }
            }

            // Call Firebase Function for user registration
            const registerFunction = httpsCallable(this.functions, 'registerUser');
            const result = await registerFunction({
                email,
                password,
                username,
                userData: {
                    // Any additional user data can be passed here
                }
            });

            if (result.data.success) {
                // Now sign in the user locally
                const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
                const user = userCredential.user;
                console.log('User registered and signed in:', user.uid);
                return user;
            } else {
                throw new Error(result.data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Error registering user:', error);
            if (error.code === 'functions/already-exists') {
                throw new Error('Username already taken');
            } else if (error.code === 'functions/invalid-argument') {
                throw new Error('Invalid registration data');
            } else if (error.message?.includes('email-already-in-use')) {
                throw new Error('Email already in use');
            } else if (error.message?.includes('invalid-email')) {
                throw new Error('Invalid email');
            } else {
                throw error;
            }
        }
    }

    async getDocument(collectionPath: string, docId: string) {
        try {
            // For user documents, try to use the function-based approach if authenticated
            if (collectionPath === 'users' && this.auth?.currentUser) {
                try {
                    return await this.getUserById(docId);
                } catch (error) {
                    console.warn('Function call failed, falling back to direct Firestore access:', error);
                    // Fall through to direct Firestore access
                }
            }
            
            // Legacy direct Firestore access for backward compatibility
            if (!this.db) {
                await this.connect();
                if (!this.db) {
                    throw new Error('Error connecting to Firestore');
                }
            }
            const docRef = doc(this.db, collectionPath, docId);
            const snapshot = await getDoc(docRef);
            
            if (snapshot.exists()) {
                return { id: snapshot.id, ...snapshot.data() };
            } else {
                return null; // Document not found
            }
        } catch (error) {
            console.error('Error getting document:', error);
            throw error;
        }
    }

    async getAllDocuments(collectionPath: string) {
        try {
            if (!this.db) {
                this.connect();
                if (!this.db) {
                    throw new Error('Error connecting to Firestore');
                }
            }
            const collectionRef = collection(this.db, collectionPath);
            const snapshot = await getDocs(collectionRef);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting all documents:', error);
            throw error;
        }
    }

    async getDocumentsWhere(collectionPath: string, field: string, operator: any, value: any) {
        try {
            if (!this.db) {
                this.connect();
                if (!this.db) {
                    throw new Error('Error connecting to Firestore');
                }
            }
            const collectionRef = collection(this.db, collectionPath);
            const q = query(collectionRef, where(field, operator, value));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error('Error getting documents with condition:', error);
            throw error;
        }
    }

    async addDocument(collectionPath: string, data: object, id: string | null) {
        try {
            if (!this.db) {
                this.connect();
                if (!this.db) {
                    throw new Error('Error connecting to Firestore');
                }
            }

            // If ID is provided, use it to create a document with that ID
            if (id) {
                const docRef = doc(this.db, collectionPath, id);
                await setDoc(docRef, data);
                return id;
            } 
            // Otherwise create a document with auto-generated ID
            else {
                const collectionRef = collection(this.db, collectionPath);
                const docRef = await addDoc(collectionRef, data);
                return docRef.id;
            }
        } catch (error) {
            console.error('Error adding document:', error);
            throw error;
        }
    }

    async updateDocument(collectionPath: string, docId: string, data: object) {
        try {
            if (!this.db) {
                this.connect();
                if (!this.db) {
                    throw new Error('Error connecting to Firestore');
                }
            }
            const docRef = doc(this.db, collectionPath, docId);
            await updateDoc(docRef, data);
            return true;
        } catch (error) {
            console.error('Error updating document:', error);
            throw error;
        }
    }

    async deleteDocument(collectionPath: string, docId: string) {
        try {
            if (!this.db) {
                this.connect();
                if (!this.db) {
                    throw new Error('Error connecting to Firestore');
                }
            }
            const docRef = doc(this.db, collectionPath, docId);
            await deleteDoc(docRef);
            return true;
        } catch (error) {
            console.error('Error deleting document:', error);
            throw error;
        }
    }

    async createShopForUser(userId: string, shopData: object): Promise<void> {
        try {
            const authToken = await this.getAuthToken();
            const createShopFunction = httpsCallable(this.functions, 'createShopForUser');
            
            const result = await createShopFunction({
                userId,
                shopData,
                authToken
            });

            if (result.data.success) {
                console.log("Shop created with ID: ", result.data.shopId);
            } else {
                throw new Error(result.data.message || 'Failed to create shop');
            }
        } catch (error) {
            console.error("Error creating shop:", error);
            throw error;
        }
    }

    async getUserById(userId: string) {
        try {
            const authToken = await this.getAuthToken();
            const getUserFunction = httpsCallable(this.functions, 'getUserById');
            
            const result = await getUserFunction({
                userId,
                authToken
            });

            if (result.data.success) {
                return result.data.data;
            } else {
                throw new Error(result.data.message || 'Failed to get user');
            }
        } catch (error) {
            console.error("Error fetching user by ID:", error);
            throw error;
        }
    }

    async updateShopDetails(shopId: string, shopData: object): Promise<void> {
        try {
            const authToken = await this.getAuthToken();
            const updateShopFunction = httpsCallable(this.functions, 'updateShopDetails');
            
            const result = await updateShopFunction({
                shopId,
                shopData,
                authToken
            });

            if (result.data.success) {
                console.log("Shop updated with ID: ", shopId);
            } else {
                throw new Error(result.data.message || 'Failed to update shop');
            }
        } catch (error) {
            console.error("Error updating shop:", error);
            throw error;
        }
    }

    async getShopsAndItemsForUser(userId: string): Promise<{ shops: any[]; items: any[] }> {
        try {
            if (!this.db) {
                await this.connect();
                if (!this.db) {
                    throw new Error('Error connecting to Firestore');
                }
            }
            // 1. Get the shops for the user
            const shopsSnapshot = await this.getDocumentsWhere('shops', 'userId', '==', userId);
            const shops: any[] = [];
            const shopIds: string[] = [];

            shopsSnapshot.forEach((shopDoc) => {
                const { id, ...shopData } = shopDoc;
                console.log('Fetching shop:', shopData.name);
                shops.push({ id, ...shopData });
                shopIds.push(shopDoc.id);
            });

            // 2. Get the items for each shop
            const items: any[] = [];
            // Using Promise.all to handle async operations in parallel
            await Promise.all(shopIds.map(async (shopId) => {
                // Get all items for this shop
                console.log('Fetching items for shop ID:', shopId);
                const itemsForShop = await this.getDocumentsWhere('items', 'shopId', '==', shopId);
                console.log(`Found ${itemsForShop.length} items for shop ${shopId}`);
                itemsForShop.forEach(item => {
                    console.log('Fetching item:', item.name);
                    items.push(item);
                });
            }));

            return { shops, items };

        } catch (error) {
            console.error("Error fetching shops and items:", error);
            throw error;
        }
    }

    async getItemsForShop(shopId: string): Promise<any[]> {
        try {
            const authToken = await this.getAuthToken();
            const getItemsFunction = httpsCallable(this.functions, 'getItemsForShop');
            
            const result = await getItemsFunction({
                shopId,
                authToken
            });

            if (result.data.success) {
                return result.data.data;
            } else {
                throw new Error(result.data.message || 'Failed to get items');
            }
        } catch (error) {
            console.error("Error fetching items for shop:", error);
            throw error;
        }
    }

    async getShopsForMarket(marketId: string): Promise<any[]> {
        try {
            if (!this.db) {
                await this.connect();
                if (!this.db) {
                    throw new Error('Error connecting to Firestore');
                }
            }
            const shopsSnapshot = await this.getDocumentsWhere('shops', 'marketId', '==', marketId);
            const shops: any[] = [];
            shopsSnapshot.forEach((shopDoc) => {
                const { id, ...shopData } = shopDoc;
                shops.push({ id, ...shopData });
            });
            return shops;
        } catch (error) {
            console.error("Error fetching shops for market:", error);
            throw error;
        }
    }

    async getShopsByZipCodePrefix(zipPrefix: string, userId: string): Promise<any[]> {
        try {
            const authToken = await this.getAuthToken();
            const getShopsFunction = httpsCallable(this.functions, 'getShopsByZipCodePrefix');
            
            const result = await getShopsFunction({
                zipPrefix,
                userId,
                authToken
            });

            if (result.data.success) {
                return result.data.data;
            } else {
                throw new Error(result.data.message || 'Failed to get shops by ZIP code');
            }
        } catch (error) {
            console.error('Error getting shops by zip code prefix:', error);
            throw error;
        }
    }

    /**
     * Get shops by either ZIP code prefix or by coordinates within a radius
     */
    async getShopsNearby(zipPrefix, userCoords, userId) {
        try {
            let query = collection(this.db, 'shops');

            if (zipPrefix) {
                // Use the existing ZIP code prefix query
                query = query.where('zipPrefix', '==', zipPrefix);
            } else if (userCoords) {
                // If no ZIP but we have coordinates, we'd use geolocation query
                // Note: This would require Firestore GeoPoint and geohashing setup
                // For simplicity, you might just return all shops and filter them client-side for now
            }

            const querySnapshot = await getDocs(query);
            const shops = [];

            querySnapshot.forEach((doc) => {
                const shopData = doc.data();
                // Don't include the user's own shop
                if (shopData.ownerId !== userId) {
                    shops.push({
                        id: doc.id,
                        ...shopData
                    });
                }
            });

            return shops;
        } catch (error) {
            console.error("Error getting shops:", error);
            throw error;
        }
    }

    async uploadImage(
        image: File,
        progressCallback?: (progress: number) => void,
        successCallback?: (downloadURL: string) => void,
        errorCallback?: (error: any) => void
    ) {
        if (!this.storage) {
            await this.connect();
            if (!this.storage) {
                const error = new Error('Error connecting to Firebase Storage');
                if (errorCallback) errorCallback(error);
                throw error;
            }
        }
        
        try {
            // Create a unique filename if needed
            const fileName = image.name || `image_${Date.now()}`;
            const storageRef = ref(this.storage, `img/${fileName}`);
            const uploadTask = uploadBytesResumable(storageRef, image);

            uploadTask.on('state_changed',
                (snapshot) => {
                    // Handle progress updates
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                    if (progressCallback) progressCallback(progress);
                    
                    switch (snapshot.state) {
                        case 'paused':
                            console.log('Upload is paused');
                            break;
                        case 'running':
                            console.log('Upload is running');
                            break;
                    }
                },
                (error) => {
                    // Handle unsuccessful uploads
                    console.error("Error uploading file", error);
                    if (errorCallback) errorCallback(error);
                },
                () => {
                    // Handle successful uploads on complete
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        console.log('File available at', downloadURL);
                        if (successCallback) successCallback(downloadURL);
                        return downloadURL;
                    });
                }
            );
            
            return uploadTask;
        } catch (error) {
            console.error("Error starting upload", error);
            if (errorCallback) errorCallback(error);
            throw error;
        }
    }

    async createItemForShop(shopId: string, itemData: object): Promise<string> {
        try {
            const authToken = await this.getAuthToken();
            const createItemFunction = httpsCallable(this.functions, 'createItemForShop');
            
            const result = await createItemFunction({
                shopId,
                itemData,
                authToken
            });

            if (result.data.success) {
                console.log("Item created with ID: ", result.data.itemId);
                return result.data.itemId;
            } else {
                throw new Error(result.data.message || 'Failed to create item');
            }
        } catch (error) {
            console.error("Error creating item:", error);
            throw error;
        }
    }

    async getItemById(itemId: string) {
        try {
            if (!this.db) {
                await this.connect();
                if (!this.db) {
                    throw new Error('Error connecting to Firestore');
                }
            }
            
            const itemDoc = await this.getDocument('items', itemId);
            return itemDoc;
        } catch (error) {
            console.error("Error fetching item by ID:", error);
            throw error;
        }
    }

    async getAllItemsForUser(userId: string): Promise<any[]> {
        try {
            const authToken = await this.getAuthToken();
            const getItemsFunction = httpsCallable(this.functions, 'getAllItemsForUser');
            
            const result = await getItemsFunction({
                userId,
                authToken
            });

            if (result.data.success) {
                return result.data.data;
            } else {
                throw new Error(result.data.message || 'Failed to get items');
            }
        } catch (error) {
            console.error("Error fetching items for user:", error);
            throw error;
        }
    }

    async getShopsForUser(userId: string): Promise<any[]> {
        try {
            const authToken = await this.getAuthToken();
            const getShopsFunction = httpsCallable(this.functions, 'getShopsForUser');
            
            const result = await getShopsFunction({
                userId,
                authToken
            });

            if (result.data.success) {
                return result.data.data;
            } else {
                throw new Error(result.data.message || 'Failed to get shops');
            }
        } catch (error) {
            console.error("Error fetching shops for user:", error);
            throw error;
        }
    }

    async createOrder(orderData: object): Promise<string> {
        try {
            const authToken = await this.getAuthToken();
            const createOrderFunction = httpsCallable(this.functions, 'createOrder');
            
            const result = await createOrderFunction({
                orderData,
                authToken
            });

            if (result.data.success) {
                console.log("Order created with ID: ", result.data.orderId);
                return result.data.orderId;
            } else {
                throw new Error(result.data.message || 'Failed to create order');
            }
        } catch (error) {
            console.error("Error creating order:", error);
            throw error;
        }
    }

    async getOrdersFromUser(userId: string): Promise<any[]> {
        try {
            const authToken = await this.getAuthToken();
            const getOrdersFunction = httpsCallable(this.functions, 'getOrdersFromUser');
            
            const result = await getOrdersFunction({
                userId,
                authToken
            });

            if (result.data.success) {
                return result.data.data;
            } else {
                throw new Error(result.data.message || 'Failed to get orders');
            }
        } catch (error) {
            console.error("Error fetching orders for user:", error);
            throw error;
        }
    }

    async getOrdersForShop(shopId: string): Promise<any[]> {
        try {
            const authToken = await this.getAuthToken();
            const getOrdersFunction = httpsCallable(this.functions, 'getOrdersForShop');
            
            const result = await getOrdersFunction({
                shopId,
                authToken
            });

            if (result.data.success) {
                return result.data.data;
            } else {
                throw new Error(result.data.message || 'Failed to get orders for shop');
            }
        } catch (error) {
            console.error("Error fetching orders for shop:", error);
            throw error;
        }
    }

    async updateOrderStatus(orderId: string, shopId: string, status: string): Promise<void> {
        console.log('updating order: ', orderId, ' status to:', status)
        try {
            const authToken = await this.getAuthToken();
            const updateOrderFunction = httpsCallable(this.functions, 'updateOrderStatus');
            
            const result = await updateOrderFunction({
                orderId,
                shopId,
                status,
                authToken
            });

            if (result.data.success) {
                console.log("Order status updated: ", orderId, status);
            } else {
                throw new Error(result.data.message || 'Failed to update order status');
            }
        } catch (error) {
            console.error("Error updating order status:", error);
            throw error;
        }
    }

    /**
     * Comprehensive method to get all orders for a user
     * Returns both orders placed by the user (as customer) and orders received (as shop owner)
     */
    async getOrdersForUser(userId: string): Promise<{
        placedOrders: any[];
        receivedOrders: any[];
        allOrders: any[];
    }> {
        try {
            if (!this.db) {
                await this.connect();
                if (!this.db) {
                    throw new Error('Error connecting to Firestore');
                }
            }

            // Get orders placed by the user (as customer)
            const placedOrders = await this.getOrdersFromUser(userId);

            // Get orders received by the user's shops (as shop owner)
            const receivedOrders = await this.getOrdersForUserShops(userId);

            // Combine and sort all orders by creation date
            const allOrders = [...placedOrders, ...receivedOrders].sort((a, b) => {
                const aTime = a.createdAt?.seconds || 0;
                const bTime = b.createdAt?.seconds || 0;
                return bTime - aTime;
            });

            return {
                placedOrders,
                receivedOrders,
                allOrders
            };
        } catch (error) {
            console.error("Error fetching comprehensive orders for user:", error);
            throw error;
        }
    }

    /**
     * Get all orders for shops owned by a user
     */
    async getOrdersForUserShops(userId: string): Promise<any[]> {
        try {
            if (!this.db) {
                await this.connect();
                if (!this.db) {
                    throw new Error('Error connecting to Firestore');
                }
            }

            // First, get all shops owned by the user
            const userShops = await this.getShopsForUser(userId);
            const shopIds = userShops.map(shop => shop.id);

            if (shopIds.length === 0) {
                return []; // User has no shops
            }

            // Get orders for all user's shops
            const allShopOrders: any[] = [];
            
            // Use Promise.all to fetch orders for all shops in parallel
            const orderPromises = shopIds.map(shopId => this.getOrdersForShop(shopId));
            const shopOrdersArrays = await Promise.all(orderPromises);
            
            // Flatten the arrays and add shop information
            shopOrdersArrays.forEach((shopOrders, index) => {
                shopOrders.forEach(order => {
                    allShopOrders.push({
                        ...order,
                        shopOwnerView: true, // Flag to indicate this is from shop owner perspective
                    });
                });
            });

            // Sort by creation date, newest first
            return allShopOrders.sort((a, b) => {
                const aTime = a.createdAt?.seconds || 0;
                const bTime = b.createdAt?.seconds || 0;
                return bTime - aTime;
            });

        } catch (error) {
            console.error("Error fetching orders for user shops:", error);
            throw error;
        }
    }


    async getOrder(orderId: string, shopId: string): Promise<any> {

        try {
            if (!this.db) {
                await this.connect();
                if (!this.db) {
                    throw new Error('Error connecting to Firestore');
                }
            }
            
            const collectionRef = collection(this.db, 'orders');
            const q = query(collectionRef, 
                where('id', '==', orderId), 
                where('shopId', '==', shopId)
            );
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                throw new Error('Order not found');
            }
            
            const docSnapshot = snapshot.docs[0];
            return { 
                ref: docSnapshot.ref, 
                data: { id: docSnapshot.id, ...docSnapshot.data() } 
            };
        } catch (error) {
            console.error("Error fetching order:", error);
            throw error;
        }
    }
}

const firebaseService = FirebaseService.getInstance();
export default firebaseService;

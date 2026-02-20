import { Platform } from 'react-native';
import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import {
  FirebaseStorage,
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { Analytics, getAnalytics } from 'firebase/analytics';
import {
  initializeAuth,
  getAuth,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  Auth,
  UserCredential,
  Persistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFunctions, httpsCallable, Functions, HttpsCallableResult } from 'firebase/functions';
import type { OrderData } from '@/store/slices/orderSlice';
import type { ShopData } from '@/store/slices/shopSlice';
import type { ItemData } from '@/store/slices/itemSlice';

// Type declaration for getReactNativePersistence which is available in firebase/auth but not well-typed
declare function getReactNativePersistence(storage: typeof AsyncStorage): Persistence;

const { getReactNativePersistence: getReactNativePersistenceImpl } = require('firebase/auth');

/**
 * FirebaseService - Refactored to use Cloud Functions for Firestore operations
 *
 * Following Firebase best practices:
 * - Authentication (login, register, logout) remains CLIENT-SIDE as recommended by Firebase
 * - Storage uploads remain CLIENT-SIDE (requires direct file access)
 * - All Firestore operations use Cloud Functions for:
 *   - Better security through server-side validation
 *   - Reduced client-side bundle size
 *   - Centralized business logic
 */
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
  private functions: Functions | null;

  // Cache for reducing redundant API calls
  private cache: {
    users: Map<string, { data: unknown; timestamp: number }>;
    shopsWithItems: Map<string, { data: unknown[]; timestamp: number }>;
  };
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

  private constructor() {
    this.firebaseConfig = {
      apiKey: process.env.EXPO_PUBLIC_API_KEY ?? '',
      authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN ?? '',
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID ?? '',
      appId: process.env.EXPO_PUBLIC_APP_ID ?? '',
      storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET ?? '',
    };

    this.app = null;
    this.storage = null;
    this.analytics = null;
    this.auth = null;
    this.functions = null;

    // Initialize cache
    this.cache = {
      users: new Map(),
      shopsWithItems: new Map(),
    };
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  // Cache helper methods
  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  public clearCache(): void {
    this.cache.users.clear();
    this.cache.shopsWithItems.clear();
  }

  public clearUserCache(userId?: string): void {
    if (userId) {
      this.cache.users.delete(userId);
    } else {
      this.cache.users.clear();
    }
  }

  public clearShopsCache(): void {
    this.cache.shopsWithItems.clear();
  }

  disconnect() {
    try {
      this.app = null;
      this.auth = null;
      this.functions = null;
      this.clearCache();
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
      if (this.app && this.auth && this.functions && this.storage) {
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
            persistence:
              Platform.OS === 'web'
                ? browserLocalPersistence
                : getReactNativePersistenceImpl(AsyncStorage),
          });
        } catch (authError) {
          if ((authError as { code?: string }).code === 'auth/already-initialized') {
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

      // Initialize Cloud Functions
      if (!this.functions) {
        this.functions = getFunctions(this.app);
        console.log('Initialized Firebase Cloud Functions');
      }

      // Force token refresh on init if user exists
      if (this.auth.currentUser) {
        await this.auth.currentUser.reload();
      }

      console.log('Successfully connected to Firebase');
      return true;
    } catch (error) {
      console.error('Error connecting to Firebase:', error);
      throw error;
    }
  }

  // =========================================================================
  // Authentication Methods (CLIENT-SIDE - Best Practice)
  // Firebase recommends keeping authentication on the client for:
  // - Direct token management
  // - Session persistence
  // - OAuth flow handling
  // =========================================================================

  async logout() {
    try {
      if (this.auth) {
        await signOut(this.auth);
      } else {
        await this.connect();
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
        await this.connect();
        if (!this.auth) {
          throw new Error('Firebase Auth is not initialized');
        }
      }

      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      console.log('User logged in:', userCredential.user.uid);
      return userCredential;
    } catch (error) {
      console.error('Error logging in:', error);
      if ((error as { code?: string }).code === 'auth/already-initialized') {
        // If we get the already-initialized error, try getting auth again
        try {
          const { getAuth } = await import('firebase/auth');
          this.auth = getAuth(this.app!);
          const userCredential = await signInWithEmailAndPassword(this.auth!, email, password);
          return userCredential;
        } catch (secondError) {
          throw secondError;
        }
      }

      switch ((error as { code?: string }).code) {
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

  async registerUser(
    email: string,
    password: string,
    username: string
  ): Promise<UserCredential['user']> {
    try {
      if (!this.auth) {
        await this.connect();
        if (!this.auth) {
          throw new Error('Error connecting to Firebase Authentication');
        }
      }
      // Check if username is taken using Cloud Function
      const users = await this.getDocumentsWhere('users', 'username', '==', username);
      if (users.length > 0) {
        throw new Error('Username taken');
      }
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
      console.log('User registered:', user.uid);
      return user;
    } catch (error) {
      console.error('Error registering user:', error);
      switch ((error as { code?: string }).code) {
        case 'auth/email-already-in-use':
          throw new Error('Email already in use');
        case 'auth/invalid-email':
          throw new Error('Invalid email');
        default:
          throw error;
      }
    }
  }

  // =========================================================================
  // Cloud Functions Helper
  // =========================================================================

  private async callFunction<T, R>(functionName: string, data: T): Promise<R> {
    if (!this.functions) {
      await this.connect();
      if (!this.functions) {
        throw new Error('Error connecting to Firebase Cloud Functions');
      }
    }

    const callable = httpsCallable<T, R>(this.functions, functionName);
    const result: HttpsCallableResult<R> = await callable(data);
    return result.data;
  }

  // =========================================================================
  // Generic Document Operations (via Cloud Functions)
  // =========================================================================

  async getDocument(collectionPath: string, docId: string) {
    try {
      return await this.callFunction<
        { collectionPath: string; docId: string },
        { id: string; [key: string]: unknown } | null
      >('getDocument', { collectionPath, docId });
    } catch (error) {
      console.error('Error getting document:', error);
      throw error;
    }
  }

  async getAllDocuments(collectionPath: string) {
    try {
      return await this.callFunction<
        { collectionPath: string },
        { id: string; [key: string]: unknown }[]
      >('getAllDocuments', { collectionPath });
    } catch (error) {
      console.error('Error getting all documents:', error);
      throw error;
    }
  }

  async getDocumentsWhere(collectionPath: string, field: string, operator: string, value: unknown) {
    try {
      return await this.callFunction<
        { collectionPath: string; field: string; operator: string; value: unknown },
        { id: string; [key: string]: unknown }[]
      >('getDocumentsWhere', { collectionPath, field, operator, value });
    } catch (error) {
      console.error('Error getting documents with condition:', error);
      throw error;
    }
  }

  async addDocument(collectionPath: string, data: object, id: string | null) {
    try {
      return await this.callFunction<
        { collectionPath: string; data: object; id?: string | null },
        string
      >('addDocument', { collectionPath, data, id });
    } catch (error) {
      console.error('Error adding document:', error);
      throw error;
    }
  }

  async updateDocument(collectionPath: string, docId: string, data: object) {
    try {
      return await this.callFunction<
        { collectionPath: string; docId: string; data: object },
        boolean
      >('updateDocument', { collectionPath, docId, data });
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  async deleteDocument(collectionPath: string, docId: string) {
    try {
      return await this.callFunction<{ collectionPath: string; docId: string }, boolean>(
        'deleteDocument',
        { collectionPath, docId }
      );
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  // =========================================================================
  // Shop Operations (via Cloud Functions)
  // =========================================================================

  async createShopForUser(userId: string, shopData: object): Promise<string> {
    try {
      const result = await this.callFunction<{ userId: string; shopData: object }, string>(
        'createShopForUser',
        { userId, shopData }
      );
      console.log('Shop created with ID:', result);
      return result;
    } catch (error) {
      console.error('Error creating shop or updating user:', error);
      throw error;
    }
  }

  async getUserById(userId: string, skipCache = false) {
    try {
      // Check cache first
      if (!skipCache) {
        const cached = this.cache.users.get(userId);
        if (cached && this.isCacheValid(cached.timestamp)) {
          return cached.data as { id: string; [key: string]: unknown } | null;
        }
      }

      const result = await this.callFunction<
        { userId: string },
        { id: string; [key: string]: unknown } | null
      >('getUserById', { userId });

      // Cache the result
      if (result) {
        this.cache.users.set(userId, { data: result, timestamp: Date.now() });
      }

      return result;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  }

  async updateShopDetails(shopId: string, shopData: object): Promise<void> {
    try {
      await this.callFunction<{ shopId: string; shopData: object }, boolean>('updateShopDetails', {
        shopId,
        shopData,
      });
      console.log('Shop updated with ID:', shopId);
    } catch (error) {
      console.error('Error updating shop:', error);
      throw error;
    }
  }

  async getShopsAndItemsForUser(userId: string): Promise<{ shops: unknown[]; items: unknown[] }> {
    try {
      return await this.callFunction<{ userId: string }, { shops: unknown[]; items: unknown[] }>(
        'getShopsAndItemsForUser',
        { userId }
      );
    } catch (error) {
      console.error('Error fetching shops and items:', error);
      throw error;
    }
  }

  async getItemsForShop(shopId: string): Promise<ItemData[]> {
    try {
      return await this.callFunction<{ shopId: string }, ItemData[]>('getItemsForShop', { shopId });
    } catch (error) {
      console.error('Error fetching items for shop:', error);
      throw error;
    }
  }

  async getShopsForMarket(marketId: string): Promise<ShopData[]> {
    try {
      return await this.callFunction<{ marketId: string }, ShopData[]>('getShopsForMarket', {
        marketId,
      });
    } catch (error) {
      console.error('Error fetching shops for market:', error);
      throw error;
    }
  }

  async getShopsByZipCodePrefix(zipPrefix: string, userId: string): Promise<ShopData[]> {
    try {
      return await this.callFunction<{ zipPrefix: string; userId: string }, ShopData[]>(
        'getShopsByZipCodePrefix',
        { zipPrefix, userId }
      );
    } catch (error) {
      console.error('Error getting shops by zip code prefix:', error);
      throw error;
    }
  }

  /**
   * Get shops with their items in a single call (batch operation)
   * Reduces N+1 calls to 1 call, with client-side caching
   */
  async getShopsWithItems(
    zipPrefix: string,
    userId: string,
    skipCache = false
  ): Promise<ShopData[]> {
    try {
      const cacheKey = `${zipPrefix}:${userId}`;

      // Check cache first
      if (!skipCache) {
        const cached = this.cache.shopsWithItems.get(cacheKey);
        if (cached && this.isCacheValid(cached.timestamp)) {
          console.log('Returning cached shops with items');
          return cached.data as ShopData[];
        }
      }

      const result = await this.callFunction<{ zipPrefix: string; userId: string }, ShopData[]>(
        'getShopsWithItems',
        { zipPrefix, userId }
      );

      // Cache the result
      this.cache.shopsWithItems.set(cacheKey, { data: result, timestamp: Date.now() });

      return result;
    } catch (error) {
      console.error('Error getting shops with items:', error);
      throw error;
    }
  }

  async getShopsForUser(userId: string): Promise<ShopData[]> {
    try {
      return await this.callFunction<{ userId: string }, ShopData[]>('getShopsForUser', { userId });
    } catch (error) {
      console.error('Error fetching shops for user:', error);
      throw error;
    }
  }

  // =========================================================================
  // Storage Operations (CLIENT-SIDE - Best Practice)
  // File uploads require direct client access to files
  //
  // Storage paths must match Firebase Storage rules:
  // - product_images/{shopId}/{itemId}/{filename} - for item/product images
  // - user_profile_images/{userId}/{filename} - for user profile images
  // =========================================================================

  /**
   * Upload a product image (item image)
   * Path: product_images/{shopId}/{itemId}/{filename}
   */
  async uploadProductImage(
    image: File,
    shopId: string,
    itemId: string,
    progressCallback?: (progress: number) => void,
    successCallback?: (downloadURL: string) => void,
    errorCallback?: (error: unknown) => void
  ) {
    const fileName = image.name || `item_${Date.now()}.jpg`;
    const storagePath = `product_images/${shopId}/${itemId}/${fileName}`;
    return this.uploadToStorage(
      image,
      storagePath,
      progressCallback,
      successCallback,
      errorCallback
    );
  }

  /**
   * Upload a user profile image
   * Path: user_profile_images/{userId}/{filename}
   */
  async uploadUserProfileImage(
    image: File,
    userId: string,
    progressCallback?: (progress: number) => void,
    successCallback?: (downloadURL: string) => void,
    errorCallback?: (error: unknown) => void
  ) {
    const fileName = image.name || `profile_${Date.now()}.jpg`;
    const storagePath = `user_profile_images/${userId}/${fileName}`;
    return this.uploadToStorage(
      image,
      storagePath,
      progressCallback,
      successCallback,
      errorCallback
    );
  }

  /**
   * Internal method to upload a file to Firebase Storage
   */
  private async uploadToStorage(
    image: File,
    storagePath: string,
    progressCallback?: (progress: number) => void,
    successCallback?: (downloadURL: string) => void,
    errorCallback?: (error: unknown) => void
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
      console.log('Uploading to path:', storagePath);
      const storageRef = ref(this.storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, image);

      uploadTask.on(
        'state_changed',
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
          console.error('Error uploading file', error);
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
      console.error('Error starting upload', error);
      if (errorCallback) errorCallback(error);
      throw error;
    }
  }

  // =========================================================================
  // Item Operations (via Cloud Functions)
  // =========================================================================

  async createItemForShop(shopId: string, itemData: object, itemId?: string): Promise<string> {
    try {
      const result = await this.callFunction<
        { shopId: string; itemData: object; itemId?: string },
        string
      >('createItemForShop', { shopId, itemData, itemId });
      console.log('Item created with ID:', result);
      return result;
    } catch (error) {
      console.error('Error creating item:', error);
      throw error;
    }
  }

  async deleteItem(itemId: string): Promise<void> {
    try {
      await this.callFunction<{ itemId: string }, { success: boolean }>('deleteItem', { itemId });
      console.log('Item deleted:', itemId);
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }

  async getItemById(itemId: string) {
    try {
      return await this.callFunction<
        { itemId: string },
        { id: string; [key: string]: unknown } | null
      >('getItemById', { itemId });
    } catch (error) {
      console.error('Error fetching item by ID:', error);
      throw error;
    }
  }

  async getAllItemsForUser(userId: string): Promise<ItemData[]> {
    try {
      return await this.callFunction<{ userId: string }, ItemData[]>('getAllItemsForUser', {
        userId,
      });
    } catch (error) {
      console.error('Error fetching items for user:', error);
      throw error;
    }
  }

  async updateItemQuantity(itemId: string, quantityChange: number): Promise<void> {
    try {
      await this.callFunction<
        { itemId: string; quantityChange: number },
        { success: boolean; newQuantity: number }
      >('updateItemQuantity', { itemId, quantityChange });
      console.log(`Updated item ${itemId} quantity by ${quantityChange}`);
    } catch (error) {
      console.error('Error updating item quantity:', error);
      throw error;
    }
  }

  async updateItemDetails(itemId: string, itemData: object): Promise<void> {
    try {
      await this.callFunction<{ itemId: string; itemData: object }, { success: boolean }>(
        'updateItemDetails',
        { itemId, itemData }
      );
      console.log(`Updated item ${itemId} details`);
    } catch (error) {
      console.error('Error updating item details:', error);
      throw error;
    }
  }

  // =========================================================================
  // Order Operations (via Cloud Functions)
  // =========================================================================

  async createOrder(orderData: object): Promise<string> {
    try {
      const result = await this.callFunction<{ orderData: object }, string>('createOrder', {
        orderData,
      });
      console.log('Order created with ID:', result);
      return result;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  async getOrdersFromUser(userId: string): Promise<OrderData[]> {
    try {
      return await this.callFunction<{ userId: string }, OrderData[]>('getOrdersFromUser', {
        userId,
      });
    } catch (error) {
      console.error('Error fetching orders for user:', error);
      throw error;
    }
  }

  async getOrdersForShop(shopId: string): Promise<OrderData[]> {
    try {
      return await this.callFunction<{ shopId: string }, OrderData[]>('getOrdersForShop', {
        shopId,
      });
    } catch (error) {
      console.error('Error fetching orders for shop:', error);
      throw error;
    }
  }

  async updateOrderStatus(orderId: string, shopId: string, status: string): Promise<void> {
    console.log('Updating order status:', orderId, 'via Cloud Function');
    try {
      await this.callFunction<{ orderId: string; shopId: string; status: string }, boolean>(
        'updateOrderStatus',
        { orderId, shopId, status }
      );
      console.log('Order status updated:', orderId, status);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Comprehensive method to get all orders for a user
   * Returns both orders placed by the user (as customer) and orders received (as shop owner)
   */
  async getOrdersForUser(userId: string): Promise<{
    placedOrders: OrderData[];
    receivedOrders: OrderData[];
    allOrders: OrderData[];
  }> {
    try {
      return await this.callFunction<
        { userId: string },
        { placedOrders: OrderData[]; receivedOrders: OrderData[]; allOrders: OrderData[] }
      >('getOrdersForUser', { userId });
    } catch (error) {
      console.error('Error fetching comprehensive orders for user:', error);
      throw error;
    }
  }

  /**
   * Get all orders for shops owned by a user
   */
  async getOrdersForUserShops(userId: string): Promise<OrderData[]> {
    try {
      // Use the comprehensive getOrdersForUser function and extract receivedOrders
      const result = await this.getOrdersForUser(userId);
      return result.receivedOrders;
    } catch (error) {
      console.error('Error fetching orders for user shops:', error);
      throw error;
    }
  }

  /**
   * Get a specific order
   * Note: In the Cloud Functions version, document references are not returned.
   * The 'ref' property is maintained for API compatibility but will always be null.
   * Use updateOrderStatus() directly to update orders.
   */
  async getOrder(
    orderId: string,
    shopId: string
  ): Promise<{ ref: null; data: { id: string; [key: string]: unknown } }> {
    try {
      const data = await this.callFunction<
        { orderId: string; shopId: string },
        { id: string; [key: string]: unknown }
      >('getOrder', { orderId, shopId });

      return {
        ref: null, // Document reference not available via Cloud Functions - use updateOrderStatus() instead
        data,
      };
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }

  // =========================================================================
  // Legacy method for backward compatibility
  // This was used for coordinate-based queries but is not fully implemented
  // =========================================================================

  async getShopsNearby(
    zipPrefix: string | null,
    userCoords: { latitude: number; longitude: number } | null,
    userId: string
  ) {
    try {
      if (zipPrefix) {
        return await this.getShopsByZipCodePrefix(zipPrefix, userId);
      }

      // If no ZIP but we have coordinates, return all shops
      // Note: Full geolocation query would require Firestore GeoPoint and geohashing
      console.warn('Coordinate-based shop search not fully implemented. Using ZIP prefix search.');
      return [];
    } catch (error) {
      console.error('Error getting shops:', error);
      throw error;
    }
  }

  // =========================================================================
  // Message Thread Operations (via Cloud Functions)
  // =========================================================================

  /**
   * Create or get an existing thread between two users
   * Ensures only one thread exists between any two users
   */
  async createOrGetThread(
    participantIds: string[],
    initialMessage?: {
      type: 'text' | 'order';
      content?: string;
      orderId?: string;
      orderData?: object;
    }
  ): Promise<{
    id: string;
    participantIds: string[];
    participantInfo: Record<string, { username: string; photoURL: string | null }>;
    isNew: boolean;
    [key: string]: unknown;
  }> {
    try {
      return await this.callFunction<
        {
          participantIds: string[];
          initialMessage?: {
            type: 'text' | 'order';
            content?: string;
            orderId?: string;
            orderData?: object;
          };
        },
        {
          id: string;
          participantIds: string[];
          participantInfo: Record<string, { username: string; photoURL: string | null }>;
          isNew: boolean;
          [key: string]: unknown;
        }
      >('createOrGetThread', { participantIds, initialMessage });
    } catch (error) {
      console.error('Error creating or getting thread:', error);
      throw error;
    }
  }

  /**
   * Get all threads for a user
   */
  async getThreadsForUser(userId: string): Promise<
    {
      id: string;
      participantIds: string[];
      participantInfo: Record<string, { username: string; photoURL: string | null }>;
      lastMessage?: {
        type: string;
        content: string;
        senderId: string;
        createdAt: { seconds: number; nanoseconds: number };
      };
      updatedAt: { seconds: number; nanoseconds: number };
      deletedBy?: string[];
      [key: string]: unknown;
    }[]
  > {
    try {
      const threads = await this.callFunction<
        { userId: string },
        {
          id: string;
          participantIds: string[];
          participantInfo: Record<string, { username: string; photoURL: string | null }>;
          lastMessage?: {
            type: string;
            content: string;
            senderId: string;
            createdAt: { seconds: number; nanoseconds: number };
          };
          updatedAt: { seconds: number; nanoseconds: number };
          deletedBy?: string[];
          [key: string]: unknown;
        }[]
      >('getThreadsForUser', { userId });

      // Filter out threads that the user has deleted
      return threads.filter((thread) => !thread.deletedBy?.includes(userId));
    } catch (error) {
      console.error('Error fetching threads for user:', error);
      throw error;
    }
  }

  /**
   * Get messages for a thread
   */
  async getMessagesForThread(threadId: string): Promise<
    {
      id: string;
      senderId: string;
      type: 'text' | 'order';
      content: string;
      orderId?: string;
      orderData?: object;
      createdAt: { seconds: number; nanoseconds: number };
      read: boolean;
    }[]
  > {
    try {
      return await this.callFunction<
        { threadId: string },
        {
          id: string;
          senderId: string;
          type: 'text' | 'order';
          content: string;
          orderId?: string;
          orderData?: object;
          createdAt: { seconds: number; nanoseconds: number };
          read: boolean;
        }[]
      >('getMessagesForThread', { threadId });
    } catch (error) {
      console.error('Error fetching messages for thread:', error);
      throw error;
    }
  }

  /**
   * Send a message to a thread
   */
  async sendMessage(
    threadId: string,
    message: {
      type: 'text' | 'order';
      content?: string;
      orderId?: string;
      orderData?: object;
    }
  ): Promise<{
    id: string;
    senderId: string;
    type: 'text' | 'order';
    content: string;
    orderId?: string;
    orderData?: object;
  }> {
    try {
      return await this.callFunction<
        {
          threadId: string;
          message: {
            type: 'text' | 'order';
            content?: string;
            orderId?: string;
            orderData?: object;
          };
        },
        {
          id: string;
          senderId: string;
          type: 'text' | 'order';
          content: string;
          orderId?: string;
          orderData?: object;
        }
      >('sendMessage', { threadId, message });
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Delete a thread (soft delete - marks as deleted for the user)
   */
  async deleteThread(threadId: string): Promise<boolean> {
    try {
      return await this.callFunction<{ threadId: string }, boolean>('deleteThread', { threadId });
    } catch (error) {
      console.error('Error deleting thread:', error);
      throw error;
    }
  }

  /**
   * Mark a thread as read
   */
  async markThreadAsRead(threadId: string): Promise<boolean> {
    try {
      return await this.callFunction<{ threadId: string }, boolean>('markThreadAsRead', {
        threadId,
      });
    } catch (error) {
      console.error('Error marking thread as read:', error);
      throw error;
    }
  }

  // =========================================================================
  // Push Notification Operations (via Cloud Functions)
  // =========================================================================

  /**
   * Register a push notification token for the current user
   */
  async registerPushToken(token: string, platform: 'ios' | 'android' | 'web'): Promise<boolean> {
    try {
      return await this.callFunction<{ token: string; platform: string }, boolean>(
        'registerPushToken',
        { token, platform }
      );
    } catch (error) {
      console.error('Error registering push token:', error);
      throw error;
    }
  }

  /**
   * Send a notification for a new message
   */
  async sendMessageNotification(
    threadId: string,
    recipientId: string,
    senderName: string,
    messagePreview: string,
    messageType: 'text' | 'order'
  ): Promise<boolean> {
    try {
      return await this.callFunction<
        {
          threadId: string;
          recipientId: string;
          senderName: string;
          messagePreview: string;
          messageType: 'text' | 'order';
        },
        boolean
      >('sendMessageNotification', {
        threadId,
        recipientId,
        senderName,
        messagePreview,
        messageType,
      });
    } catch (error) {
      console.error('Error sending message notification:', error);
      // Don't throw - notification failure shouldn't break the message flow
      return false;
    }
  }

  /**
   * Send a notification for an order status update
   */
  async sendOrderStatusNotification(
    orderId: string,
    recipientId: string,
    shopName: string,
    newStatus: string
  ): Promise<boolean> {
    try {
      return await this.callFunction<
        {
          orderId: string;
          recipientId: string;
          shopName: string;
          newStatus: string;
        },
        boolean
      >('sendOrderStatusNotification', {
        orderId,
        recipientId,
        shopName,
        newStatus,
      });
    } catch (error) {
      console.error('Error sending order status notification:', error);
      return false;
    }
  }

  // =========================================================================
  // Stripe Payment Methods
  // =========================================================================

  async createSetupIntent(): Promise<{ clientSecret: string; customerId: string }> {
    return await this.callFunction<
      { userId: string },
      { clientSecret: string; customerId: string }
    >(
      'createSetupIntent',
      { userId: '' } // userId is extracted from auth token on server
    );
  }

  async createPaymentIntent(
    amount: number,
    paymentMethodId?: string
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    return await this.callFunction<
      { amount: number; currency: string; paymentMethodId?: string },
      { clientSecret: string; paymentIntentId: string }
    >('createPaymentIntent', {
      amount,
      currency: 'usd',
      paymentMethodId,
    });
  }

  async getPaymentMethods(): Promise<{
    paymentMethods: {
      id: string;
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
    }[];
    defaultPaymentMethodId: string | null;
  }> {
    return await this.callFunction<
      { userId: string },
      {
        paymentMethods: {
          id: string;
          brand: string;
          last4: string;
          expMonth: number;
          expYear: number;
        }[];
        defaultPaymentMethodId: string | null;
      }
    >('getPaymentMethods', { userId: '' });
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<boolean> {
    return await this.callFunction<{ paymentMethodId: string }, boolean>('deletePaymentMethod', {
      paymentMethodId,
    });
  }

  async setDefaultPaymentMethod(paymentMethodId: string): Promise<boolean> {
    return await this.callFunction<{ paymentMethodId: string }, boolean>(
      'setDefaultPaymentMethod',
      { paymentMethodId }
    );
  }
}

const firebaseService = FirebaseService.getInstance();
export default firebaseService;

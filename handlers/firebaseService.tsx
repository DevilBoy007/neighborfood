import { Platform } from 'react-native';
import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { Analytics, getAnalytics } from 'firebase/analytics';
import {
    initializeAuth,
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
    private analytics: Analytics | null;
    private db: Firestore | null;

    private constructor() {
        this.firebaseConfig = {
            apiKey: process.env.EXPO_PUBLIC_API_KEY??'',
            authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN??'',
            projectId: process.env.EXPO_PUBLIC_PROJECT_ID??'',
            appId: process.env.EXPO_PUBLIC_APP_ID??'',
            storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET??''
        };

        this.app = null;
        this.analytics = null;
        this.auth = null;
        this.db = null;
    }

    public static getInstance(): FirebaseService {
        if (!FirebaseService.instance) {
            FirebaseService.instance = new FirebaseService();
        }
        return FirebaseService.instance;
    }

    async connect() {
        try {
            // Check if Firebase is already initialized
            if (this.app && this.auth && this.db) {
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
                        const { getAuth } = await import('firebase/auth');
                        this.auth = getAuth(this.app);
                        console.log('Retrieved existing auth instance');
                    } else {
                        throw authError;
                    }
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

            console.log('Successfully connected to Firebase');
            return true;
        } catch (error) {
            console.error('Error connecting to Firebase:', error);
            throw error;
        }
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
                this.connect();
                if (!this.auth) {
                    throw new Error('Error connecting to Firebase Authentication');
                }
            }
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
            switch (error.code) {
                case 'auth/email-already-in-use':
                    throw new Error('Email already in use');
                case 'auth/invalid-email':
                    throw new Error('Invalid email');
                default:
                    throw error;
            }
        }
    }
    async getDocument(collectionPath: string, docId: string) {
        try {
            if (!this.db) {
                this.connect();
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
            if (!this.db) {
                await this.connect();
                if (!this.db) {
                    throw new Error('Error connecting to Firestore');
                }
            }
            
            const shopsCollectionRef = collection(this.db, 'shops');
            const userDocRef = doc(this.db, 'users', userId);
        
            // Create the shop document
            const docRef = await addDoc(shopsCollectionRef, shopData);
            console.log("Shop created with ID: ", docRef.id);
        
            const shopDocRef = doc(this.db, 'shops', docRef.id);

            // Update the user's 'shops' array with the document reference
            await updateDoc(userDocRef, {
                shops: arrayUnion(shopDocRef)
            });
        
            console.log("Shop reference added to user's shops array.");
        } catch (error) {
            console.error("Error creating shop or updating user: ", error);
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
            if (!this.db) {
                await this.connect();
                if (!this.db) {
                    throw new Error('Error connecting to Firestore');
                }
            }
            const itemsSnapshot = await this.getDocumentsWhere('items', 'shopId', '==', shopId);
            const items: any[] = [];

            itemsSnapshot.forEach((doc) => {
                items.push({ ...doc });
            });

            return items;
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
            if (!this.db) {
                await this.connect();
                if (!this.db) {
                    throw new Error('Error connecting to Firestore');
                }
            }
            
            // Query for shops where marketId starts with the zip prefix
            const collectionRef = collection(this.db, 'shops');
            
            // First get all shops with matching zip prefix
            const q = query(
                collectionRef,
                where('marketId', '>=', zipPrefix),
                where('marketId', '<=', zipPrefix + '\uf8ff')
            );
            
            // Then filter out the user's own shops in the client
            const shops = await getDocs(q);
            return shops.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(shop => shop.userId !== userId);
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

    disconnect() {
        try {
            this.app = null;
            this.auth = null;
            this.db = null;
            console.log('Disconnected from Firebase');
            return true;
        } catch (error) {
            console.error('Error disconnecting from Firebase:', error);
            throw error;
        }
    }

}


const firebaseService = FirebaseService.getInstance();
export default firebaseService;

import { initializeApp, FirebaseApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, Auth, UserCredential } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import {
    getFirestore,
    Firestore,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from 'firebase/firestore';

class FirebaseService {
    private static instance: FirebaseService;
    private firebaseConfig: {
        apiKey: string;
        authDomain: string;
        projectId: string;
        storageBucket: string;
    };
    private app: FirebaseApp | null;
    private auth: Auth | null;
    private db: Firestore | null;

    private constructor() {
        this.firebaseConfig = {
            apiKey: process.env.EXPO_PUBLIC_API_KEY??'',
            authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN??'',
            projectId: process.env.EXPO_PUBLIC_PROJECT_ID??'',
            storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET??''
        };

        this.app = null;
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
        if (this.app && this.auth && this.db) {
            console.log('Already connected to Firebase');
            return true;
        }
        else {
            try {
                this.app = initializeApp(this.firebaseConfig);
                this.auth = initializeAuth(this.app, { persistence: getReactNativePersistence(ReactNativeAsyncStorage) });
                this.db = getFirestore(this.app);
                console.log('Successfully connected to Firebase');
                return true;
            } catch (error) {
                console.error('Error connecting to Firebase:', error);
                throw error;
            }
        } 
    }

    async login(email: string, password: string): Promise<UserCredential> {
        try {
            if (!this.auth) {
                throw new Error('Firebase Auth is not initialized');
            }
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            console.log('User logged in:', userCredential.user.uid);
            return userCredential;
        } catch (error) {
            console.error('Error logging in:', error);
            switch (error.code) {
                case 'auth/invalid-email':
                    throw new Error('Invalid email');
                case 'auth/user-not-found':
                    throw new Error('User not found');
                case 'auth/wrong-password':
                    throw new Error('Wrong password');
                default:
                    throw error;
            }
        }
    }

    async registerUser(email: string, password: string, username: string): Promise<UserCredential['user']> {
        try {
            if (!this.auth) {
                throw new Error('Firebase Auth is not initialized');
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

    async getAllDocuments(collectionPath: string) {
        try {
            if (!this.db) {
                throw new Error('Database not connected. Call connect() first.');
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
                throw new Error('Database not connected. Call connect() first.');
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

    async addDocument(collectionPath: string, data: object) {
        try {
            if (!this.db) {
                throw new Error('Database not connected. Call connect() first.');
            }
            const collectionRef = collection(this.db, collectionPath);
            const docRef = await addDoc(collectionRef, data);
            return docRef.id;
        } catch (error) {
            console.error('Error adding document:', error);
            throw error;
        }
    }

    async updateDocument(collectionPath: string, docId: string, data: object) {
        try {
            if (!this.db) {
                throw new Error('Database not connected. Call connect() first.');
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
                throw new Error('Database not connected. Call connect() first.');
            }
            const docRef = doc(this.db, collectionPath, docId);
            await deleteDoc(docRef);
            return true;
        } catch (error) {
            console.error('Error deleting document:', error);
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

// firebaseDB.js
import { initializeApp, FirebaseApp } from 'firebase/app';
import { API_KEY, AUTH_DOMAIN, PROJECT_ID, STORAGE_BUCKET } from '@env';
import {
    Firestore,
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc
} from 'firebase/firestore';

class FirebaseDB {
    private firebaseConfig: {
        apiKey: string;
        authDomain: string;
        projectId: string;
        storageBucket: string;
    };
    private app: FirebaseApp | null;
    private db: Firestore | null;
    constructor() {
        this.firebaseConfig = {
            apiKey: API_KEY,
            authDomain: AUTH_DOMAIN,
            projectId: PROJECT_ID,
            storageBucket: STORAGE_BUCKET
        };

        this.app = null;
        this.db = null;
    }

    async connect() {
        try {
            // Initialize Firebase app
            this.app = initializeApp(this.firebaseConfig);

            // Initialize Firestore
            this.db = getFirestore(this.app);

            console.log('Successfully connected to Firestore');
            return true;
        } catch (error) {
            console.error('Error connecting to Firestore:', error);
            throw error;
        }
    }

    async query(path: string, queryString: any) {
        try {
            if (!this.db) {
                throw new Error('Database not connected. Call connect() first.');
            }

            // Parse the query string
            // Expected format: "action:condition"
            // Example: "get:all" or "get:where:field:operator:value"
            const [action, ...conditions] = queryString.split(':');

            const collectionRef = collection(this.db, path);

            switch (action.toLowerCase()) {
                case 'get': {
                    if (conditions[0] === 'all') {
                        const snapshot = await getDocs(collectionRef);
                        return snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                    } else if (conditions[0] === 'where') {
                        const [_, field, operator, value] = conditions;
                        const q = query(collectionRef, where(field, operator, value));
                        const snapshot = await getDocs(q);
                        return snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                    }
                    break;
                }

                case 'add': {
                    const data = JSON.parse(conditions[0]);
                    const docRef = await addDoc(collectionRef, data);
                    return docRef.id;
                }

                case 'update': {
                    const [docId, dataString] = conditions;
                    const data = JSON.parse(dataString);
                    const docRef = doc(this.db, path, docId);
                    await updateDoc(docRef, data);
                    return true;
                }

                case 'delete': {
                    const [docId] = conditions;
                    const docRef = doc(this.db, path, docId);
                    await deleteDoc(docRef);
                    return true;
                }

                default:
                    throw new Error(`Unsupported action: ${action}`);
            }
        } catch (error) {
            console.error('Error executing query:', error);
            throw error;
        }
    }

    disconnect() {
        try {
            // Firebase automatically handles connection management,
            // but we'll clean up our references
            this.app = null;
            this.db = null;
            console.log('Disconnected from Firebase');
            return true;
        } catch (error) {
            console.error('Error disconnecting from Firebase:', error);
            throw error;
        }
    }
}

// Export a singleton instance
const firebaseDB = new FirebaseDB();
export default firebaseDB;
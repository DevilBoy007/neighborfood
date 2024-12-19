import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, Auth, UserCredential } from 'firebase/auth';
import { API_KEY, AUTH_DOMAIN, PROJECT_ID } from '@env';

class FirebaseAuth {
    private firebaseConfig: {
        apiKey: string;
        authDomain: string;
        projectId: string;
    };
    private app: FirebaseApp | null;
    private auth: Auth | null;

    constructor() {
        this.firebaseConfig = {
            apiKey: API_KEY,
            authDomain: AUTH_DOMAIN,
            projectId: PROJECT_ID,
        };

        this.app = null;
        this.auth = null;
    }

    async connect() {
        try {
            // Initialize Firebase app
            this.app = initializeApp(this.firebaseConfig);
            // Initialize Firebase Authentication
            this.auth = getAuth(this.app);
            return true;
        } catch (error) {
            console.error('Error connecting to Firebase:', error);
            throw error;
        }
    }

    async registerUser(email: string, password: string): Promise<UserCredential["user"]> {
        try {
            if (!this.auth) {
                throw new Error('Firebase Auth is not initialized');
            }
            const userCredential = await createUserWithEmailAndPassword(
                this.auth,
                email,
                password
            );
            const user = userCredential.user;
            console.log('User registered:', user.uid);
            return user;
        } catch (error) {
            console.error('Error registering user:', error);
            throw error;
        }
    }

    disconnect() {
        try {
            // Firebase automatically handles connection management,
            // but we'll clean up our references
            this.app = null;
            this.auth = null;
            console.log('Disconnected from Firebase');
            return true;
        } catch (error) {
            console.error('Error disconnecting from Firebase:', error);
            throw error;
        }
    }
}

// Export a singleton instance
const firebaseAuth = new FirebaseAuth();
export default firebaseAuth;
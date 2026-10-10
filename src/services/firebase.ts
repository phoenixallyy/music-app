import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  firestoreDatabaseId?: string;
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

export function getFirebaseConfig(): FirebaseConfig | null {
  const envConfig: FirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig;
  }

  return null;
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseConfig() !== null;
}

export function getMissingFirebaseConfigDetails(): string[] {
  const missing: string[] = [];
  if (!import.meta.env.VITE_FIREBASE_API_KEY) missing.push('VITE_FIREBASE_API_KEY');
  if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) missing.push('VITE_FIREBASE_PROJECT_ID');
  if (!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) missing.push('VITE_FIREBASE_AUTH_DOMAIN');
  if (!import.meta.env.VITE_FIREBASE_APP_ID) missing.push('VITE_FIREBASE_APP_ID');
  return missing;
}

export function initFirebase(): { app: FirebaseApp | null; auth: Auth | null; db: Firestore | null } {
  if (app && auth) return { app, auth, db };

  const config = getFirebaseConfig();
  if (!config) {
    return { app: null, auth: null, db: null };
  }

  try {
    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    // Enforce browser local persistence
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('[Firebase] Persistence warning:', err);
    });
    db = getFirestore(app);
    return { app, auth, db };
  } catch (err) {
    console.warn('[Firebase] Initialization error:', err);
    return { app: null, auth: null, db: null };
  }
}

export function formatFirebaseAuthError(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Authentication request failed.';
  const code = (error as { code?: string }).code || '';
  const message = (error as { message?: string }).message || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'The email address is invalid or poorly formatted.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/user-not-found':
      return 'No account exists with this email address. Please register or check for typos.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Access temporarily blocked due to too many failed attempts. Please try again in a few minutes.';
    case 'auth/network-request-failed':
      return 'Network connection error. Check your internet connection and try again.';
    default:
      return message || 'Authentication failed. Please verify your details.';
  }
}

export async function firebaseSignIn(email: string, password: string): Promise<FirebaseUser> {
  const { auth } = initFirebase();
  if (!auth) {
    throw new Error('Firebase Authentication is not configured in this environment.');
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function firebaseRegister(email: string, password: string): Promise<FirebaseUser> {
  const { auth } = initFirebase();
  if (!auth) {
    throw new Error('Firebase Authentication is not configured in this environment.');
  }
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function firebaseSignOut(): Promise<void> {
  const { auth } = initFirebase();
  if (!auth) return;
  await fbSignOut(auth);
}

export function subscribeToFirebaseAuth(callback: (user: FirebaseUser | null) => void): (() => void) | null {
  const { auth } = initFirebase();
  if (!auth) return null;
  return onAuthStateChanged(auth, callback);
}

export const firebaseService = {
  isConfigured: isFirebaseConfigured,
  getConfig: getFirebaseConfig,
  getMissingConfig: getMissingFirebaseConfigDetails,
  init: initFirebase,
  getAuth: () => auth,
  getDb: () => db,
  signIn: firebaseSignIn,
  register: firebaseRegister,
  signOut: firebaseSignOut,
  subscribeAuth: subscribeToFirebaseAuth,
  formatError: formatFirebaseAuthError,
};

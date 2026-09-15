import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
export const emulator = env.VITE_USE_EMULATORS === 'true';

// Paste the public Web App config here OR use .env.local. Never paste a service-account key.
export const webConfig = {
  apiKey: 'YOUR_FIREBASE_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.firebasestorage.app',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_FIREBASE_APP_ID'
};

export const configured = emulator || !!(
  (env.VITE_FIREBASE_API_KEY || !webConfig.apiKey.startsWith('YOUR_')) &&
  (env.VITE_FIREBASE_PROJECT_ID || !webConfig.projectId.startsWith('YOUR_')) &&
  (env.VITE_FIREBASE_APP_ID || !webConfig.appId.startsWith('YOUR_'))
);

const config = emulator ? {
  apiKey: 'demo-key',
  authDomain: 'localhost',
  projectId: 'demo-gridguard',
  appId: 'demo-gridguard'
} : {
  apiKey: env.VITE_FIREBASE_API_KEY || webConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || webConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || webConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || webConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || webConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || webConfig.appId
};

// Initialize Firebase App exactly once as a singleton
export const app = configured ? (getApps().length ? getApp() : initializeApp(config)) : null;
export const auth = app ? getAuth(app) : null;

// Initialize Firestore with Safari/browser long-polling compatibility to prevent WebChannel CORS drops
export const db = app ? (
  emulator
    ? getFirestore(app)
    : (typeof window !== 'undefined'
        ? initializeFirestore(app, { experimentalForceLongPolling: true })
        : getFirestore(app))
) : null;

if (emulator && app) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}

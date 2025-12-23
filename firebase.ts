import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Safely access environment variables to prevent ReferenceError in browser
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
    return env[key];
  } catch (e) {
    return undefined;
  }
};

/**
 * CRITICAL: Do NOT use the Gemini 'API_KEY' as a fallback for Firebase.
 * Firebase requires a specific Web API Key from the Firebase Console.
 * Using a Gemini API Key here will result in "auth/api-key-not-valid".
 */
const firebaseConfig = {
  apiKey: getEnv('FIREBASE_API_KEY'),
  authDomain: getEnv('FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('FIREBASE_APP_ID')
};

let auth: Auth | undefined;

try {
  // Only attempt initialization if a key that looks like a Firebase key is present
  // Firebase keys usually start with AIza and are distinct from Gemini keys
  if (firebaseConfig.apiKey && firebaseConfig.apiKey.length > 20) {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
  } else {
    console.warn("Firebase configuration incomplete or invalid. Authentication features are disabled.");
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

export { auth };

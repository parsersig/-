
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore"; // Ensure getFirestore is imported

// Your web app's Firebase configuration
// IMPORTANT: These values MUST be set in your .env.local file for local development
// AND in Vercel Environment Variables for deployment.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

let app: FirebaseApp | undefined = undefined;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null; // Declare dbInstance

// Initialize Firebase only if not already initialized and essential keys are present
if (!getApps().length) {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    try {
      app = initializeApp(firebaseConfig);
      authInstance = getAuth(app);
      dbInstance = getFirestore(app); // Initialize Firestore
    } catch (e: any) {
      console.error("Firebase Critical Error: Failed to initialize Firebase app. Check your Firebase config values:", e.message);
      // app remains undefined, authInstance and dbInstance remain null
    }
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.warn("Firebase Config Warning: NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set. Firebase features will be unavailable. Please check your .env.local file.");
    }
  }
} else {
  app = getApps()[0];
  // If app was initialized by getApps(), try to get auth and db if essential keys are present
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    try {
        authInstance = getAuth(app);
        dbInstance = getFirestore(app); // Initialize Firestore
    } catch (e:any) {
        console.error("Firebase Services Error: Failed to get Auth or Firestore instance on re-initialized app.", e.message);
    }
  }
}

export { app, authInstance as auth, dbInstance as db }; // Export app, auth, and db

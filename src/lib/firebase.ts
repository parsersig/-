// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

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
let dbInstance: Firestore | null = null;

if (typeof window !== 'undefined') {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        "Firebase Config Warning: Essential Firebase config (apiKey or projectId) is not set. " +
        "Firebase features will be unavailable. Please check your .env.local file or Vercel environment variables."
      );
    }
  }

  if (!getApps().length) {
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      try {
        console.log("Initializing Firebase app...");
        app = initializeApp(firebaseConfig);
        authInstance = getAuth(app);
        dbInstance = getFirestore(app);
        console.log("Firebase initialized successfully with Auth and Firestore.");
      } catch (e: any) {
        console.error(
          "Firebase Critical Error: Failed to initialize Firebase app. Check your Firebase config values:",
          e.message
        );
        app = undefined; 
        authInstance = null;
        dbInstance = null;
      }
    }
  } else {
    app = getApps()[0];
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      try {
        if (!authInstance) authInstance = getAuth(app);
        if (!dbInstance) dbInstance = getFirestore(app);
        console.log("Firebase re-used existing app instance for Auth and Firestore.");
      } catch (e:any) {
          console.error("Firebase Services Error: Failed to get Auth or Firestore instance on re-initialized app.", e.message);
          authInstance = null;
          dbInstance = null;
      }
    }
  }
} else {
    // This block usually runs during server-side rendering or build time on Vercel/Node.js environments
    // We should attempt to initialize here as well if keys are present,
    // as some server-side logic might need db or auth.
    if (firebaseConfig.apiKey && firebaseConfig.projectId) {
        if (!getApps().length) {
            try {
                app = initializeApp(firebaseConfig);
                console.log("Firebase app initialized (server/build context).");
            } catch (e: any) {
                console.error("Firebase Critical Error: Failed to initialize Firebase app (server/build context).", e.message);
                app = undefined;
            }
        } else {
            app = getApps()[0];
        }
        if (app) {
            try {
                authInstance = getAuth(app);
                dbInstance = getFirestore(app);
                console.log("Firebase Auth & Firestore initialized (server/build context).");
            } catch (e: any) {
                console.error("Firebase Services Error: Failed to get Auth or Firestore (server/build context).", e.message);
                authInstance = null;
                dbInstance = null;
            }
        }
    } else {
        console.warn("Firebase: Config keys (apiKey or projectId) are missing. Firebase cannot be initialized (server/build context).");
    }
}

export { app, authInstance as auth, dbInstance as db };
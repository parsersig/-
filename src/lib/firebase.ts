
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth"; // Removed connectAuthEmulator as it's not currently used

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
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional, but good to have if configured
};

let app: FirebaseApp | undefined = undefined; // Initialize as undefined
let authInstance: Auth | null = null;

// Initialize Firebase only if not already initialized and apiKey is present
if (!getApps().length) {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) { // Check for essential keys
    try {
      app = initializeApp(firebaseConfig);
      authInstance = getAuth(app);
    } catch (e: any) {
      console.error("Firebase Critical Error: Failed to initialize Firebase app. Check your Firebase config values:", e.message);
      // app remains undefined, authInstance remains null
    }
  } else {
    // Do not output console.error during build if keys are intentionally missing for "Firebase disabled" state
    // console.warn("Firebase Warning: Firebase initialization skipped because API key or Project ID is missing. Firebase features will be unavailable.");
  }
} else {
  app = getApps()[0];
  // If app was initialized by getApps(), try to get auth if apiKey is present
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    try {
        authInstance = getAuth(app);
    } catch (e:any) {
        console.error("Firebase Auth Error: Failed to getAuth instance on re-initialized app.", e.message);
    }
  }
}

// Emulators are commented out
// if (process.env.NODE_ENV === 'development') {
//   if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' && authInstance) {
//     try {
//       console.log("Firebase: Connecting to Auth Emulator (localhost:9099)");
//       connectAuthEmulator(authInstance, "http://localhost:9099", { disableWarnings: true });
//     } catch (error) {
//         console.error("Firebase: Error connecting to Auth Emulator", error);
//     }
//   }
// }

export { app, authInstance as auth };

  
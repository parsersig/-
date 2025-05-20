
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

let app: FirebaseApp;
let authInstance: Auth | null = null;

// Initialize Firebase
if (!getApps().length) {
  if (!firebaseConfig.apiKey) {
    console.error("Firebase Build/Runtime Error: NEXT_PUBLIC_FIREBASE_API_KEY is not set. Firebase features requiring auth will not work. Please check your environment variables.");
    // App can be initialized even with missing apiKey, but auth-dependent services will fail.
    // We proceed to initialize app, but auth will remain null.
     try {
      app = initializeApp(firebaseConfig); // Firebase will throw its own error here if apiKey is truly invalid or malformed for initialization
    } catch (e: any) {
      console.error("Firebase Critical Error: Failed to initialize Firebase app, likely due to malformed config or missing API key:", e.message);
      // In this case, app might not be initialized, and authInstance will definitely be null.
      // This state should be handled gracefully by components using Firebase.
      // For now, we'll let app potentially be uninitialized if initializeApp itself fails.
      // A more robust solution might involve a global state to indicate Firebase readiness.
    }
  } else {
    app = initializeApp(firebaseConfig);
  }
} else {
  app = getApps()[0]; 
}

// Initialize Auth only if app was successfully initialized and apiKey is present
// It's possible app is undefined if initializeApp failed above due to critical config error
if (typeof app !== 'undefined' && firebaseConfig.apiKey) {
  try {
    authInstance = getAuth(app);
  } catch (e: any) {
    console.error("Firebase Auth Error: Failed to getAuth instance, even with an API key. This might indicate issues with other Firebase config values or service availability:", e.message);
    // authInstance remains null
  }
} else if (typeof app !== 'undefined' && !firebaseConfig.apiKey) {
  // This case is already covered by the console.error above,
  // but good to be explicit that authInstance remains null.
  // console.warn("Firebase Auth Warning: Auth service cannot be initialized because NEXT_PUBLIC_FIREBASE_API_KEY is missing.");
}


// Emulators are commented out as they are not the current focus.
// if (process.env.NODE_ENV === 'development') {
//   if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' && authInstance) { // Check authInstance
//     try {
//       console.log("Firebase: Connecting to Auth Emulator (localhost:9099)");
//       connectAuthEmulator(authInstance, "http://localhost:9099", { disableWarnings: true });
//     } catch (error) {
//         console.error("Firebase: Error connecting to Auth Emulator", error);
//     }
//   }
// }

export { app, authInstance as auth };


// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Removed connectAuthEmulator as it's not currently used

// Your web app's Firebase configuration
// IMPORTANT: These values MUST be set in your .env.local file
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

// Initialize Firebase
if (!getApps().length) {
  if (!firebaseConfig.apiKey) {
    console.error("Firebase Error: NEXT_PUBLIC_FIREBASE_API_KEY is not set. Please check your .env.local file.");
    // Potentially throw an error or handle this scenario to prevent app crash
    // For now, we'll let Firebase throw its own more specific error if apiKey is truly missing at initialization.
  }
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]; // If already initialized, use that app
}

const auth = getAuth(app);
// const db = getFirestore(app); // Uncomment this if you plan to use Firestore

// Emulators are commented out as they are not the current focus.
// if (process.env.NODE_ENV === 'development') {
//   if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
//     try {
//       console.log("Firebase: Connecting to Auth Emulator (localhost:9099)");
//       connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
//     } catch (error) {
//         console.error("Firebase: Error connecting to Auth Emulator", error);
//     }
//   }
// }

export { app, auth /*, db */ };

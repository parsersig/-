// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | undefined = undefined;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (typeof window !== 'undefined' && !getApps().length) {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    try {
      app = initializeApp(firebaseConfig);
      authInstance = getAuth(app);
      dbInstance = getFirestore(app);
      console.log("Firebase initialized successfully.");
    } catch (e: any) {
      console.error("Firebase Critical Error: Failed to initialize Firebase app. Check your Firebase config values:", e.message);
      if (process.env.NODE_ENV === 'development') {
        // alert("Критическая ошибка Firebase: Не удалось инициализировать приложение. Проверьте конфигурацию Firebase в .env.local и в консоли Firebase.");
      }
    }
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.warn("Firebase Config Warning: Essential Firebase config (apiKey or projectId) is not set. Firebase features will be unavailable. Please check your .env.local file or Vercel environment variables.");
    }
  }
} else if (getApps().length > 0) {
  app = getApps()[0];
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
     try {
        if (!authInstance) authInstance = getAuth(app);
        if (!dbInstance) dbInstance = getFirestore(app);
    } catch (e:any) {
        console.error("Firebase Services Error: Failed to get Auth or Firestore instance on re-initialized app.", e.message);
    }
  }
} else {
    // This case should ideally not be hit if window check is done right
    console.warn("Firebase: Attempting to initialize outside browser енер or without app already initialized.");
}

export
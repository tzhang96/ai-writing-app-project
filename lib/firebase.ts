"use client";

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Your Firebase configuration object
const firebaseConfig = {
  // Add your Firebase config here from your Firebase Console
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log('Firebase config:', {
  ...firebaseConfig,
  apiKey: firebaseConfig.apiKey ? '***' : undefined,
});

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app);

console.log('Firebase initialized:', {
  app: !!app,
  db: !!db,
  auth: !!auth,
  storage: !!storage,
  functions: !!functions,
});

export { app, db, auth, storage, functions }; 
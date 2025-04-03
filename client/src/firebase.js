// firebase.js - Client-side Firebase initialization
// This mirrors the server-side approach but uses ES modules syntax

import { initializeApp, getApps } from "firebase/app";

// Use the same Firebase configuration as on the server
// You can import this from a shared config if needed
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase - avoid re-initializing if already done
let firebaseApp;

try {
  console.log('Client: Initializing Firebase...');
  // Note: getApps() in the client SDK might work differently than server
  // We'll use a more reliable approach
  if (!firebaseApp) {
    firebaseApp = initializeApp(firebaseConfig);
    console.log('Client: Firebase initialized successfully');
  }
} catch (error) {
  console.error('Client: Error initializing Firebase:', error);
}

export default firebaseApp;
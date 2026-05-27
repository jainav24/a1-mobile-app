import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAniKBuT0Z7EFMnvAUHudvzK1Vt95G9gpM",
  authDomain: "a1-design-app.firebaseapp.com",
  projectId: "a1-design-app",
  storageBucket: "a1-design-app.firebasestorage.app",
  messagingSenderId: "313914380727",
  appId: "1:313914380727:web:eec2edbb6f0bfacd995832"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);
// Storage is not enabled yet — export null placeholder
export const storage = null;

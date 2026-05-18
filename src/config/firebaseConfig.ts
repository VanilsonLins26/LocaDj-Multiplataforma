import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// IMPORTAÇÃO CORRETA:
import {
  initializeAuth,
  getAuth,
  //@ts-ignore - Caso o TS ainda reclame do caminho interno
  getReactNativePersistence
} from "firebase/auth";

// Se o erro de "no exported member" persistir, use esta alternativa:
// import { getReactNativePersistence } from 'firebase/auth/react-native';
const firebaseConfig = {
  apiKey: "AIzaSyDDUF56tpMxteQktlS1b2k5n1E6oNtgsGk",
  authDomain: "locadj-6c4a1.firebaseapp.com",
  projectId: "locadj-6c4a1",
  storageBucket: "locadj-6c4a1.firebasestorage.app",
  messagingSenderId: "151515228402",
  appId: "1:151515228402:web:bec006e123447c6fdfc86b"
};

// 1. Inicializa o App (Singleton pattern)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Inicializa o Auth com persistência para React Native
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // Catch for Fast Refresh (HMR) if auth is already initialized
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
}

export const db = getFirestore(app);
export const storage = getStorage(app);
export { app, auth };
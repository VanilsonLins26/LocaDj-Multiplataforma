import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// @ts-ignore
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDDUF56tpMxteQktlS1b2k5n1E6oNtgsGk",
  authDomain: "locadj-6c4a1.firebaseapp.com",
  projectId: "locadj-6c4a1",
  storageBucket: "locadj-6c4a1.firebasestorage.app",
  messagingSenderId: "151515228402",
  appId: "1:151515228402:web:bec006e123447c6fdfc86b"
};



let app;
let auth;

if (getApps().length === 0) {

  app = initializeApp(firebaseConfig);
  
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} else {
  app = getApp();
  auth = getAuth(app);
}


export const db = getFirestore(app);

export { app, auth };


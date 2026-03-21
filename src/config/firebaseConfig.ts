import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDDUF56tpMxteQktlS1b2k5n1E6oNtgsGk",
  authDomain: "locadj-6c4a1.firebaseapp.com",
  projectId: "locadj-6c4a1",
  storageBucket: "locadj-6c4a1.firebasestorage.app",
  messagingSenderId: "151515228402",
  appId: "1:151515228402:web:bec006e123447c6fdfc86b"
};

// Evita inicializar múltiplas vezes (importante com hot reload do Expo)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db   = getFirestore(app);
export const auth = getAuth(app);
export { app };
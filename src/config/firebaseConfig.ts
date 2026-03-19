import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Defina o objeto com os seus dados
const firebaseConfig = {
  apiKey: "AIzaSyDDUF56tpMxteQktlS1b2k5n1E6oNtgsGk",
  authDomain: "locadj-6c4a1.firebaseapp.com",
  projectId: "locadj-6c4a1",
  storageBucket: "locadj-6c4a1.firebasestorage.app",
  messagingSenderId: "151515228402",
  appId: "1:151515228402:web:bec006e123447c6fdfc86b"
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);

// Exporte para usar em outros arquivos
export const db = getFirestore(app);
export { app };
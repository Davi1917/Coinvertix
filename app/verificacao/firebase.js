import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA0iVQA7hiqYIKPymj0QjTdynsKxlJstes",
  authDomain: "coinvertix.firebaseapp.com",
  projectId: "coinvertix",
  storageBucket: "coinvertix.firebasestorage.app",
  messagingSenderId: "1014998563667",
  appId: "1:1014998563667:web:dd729ef558a4a8d0e4ffa6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
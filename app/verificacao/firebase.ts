// config/firebase.ts
import { initializeApp, FirebaseOptions } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

// Tipagem estrita da configuração do Firebase utilizando o tipo oficial do SDK
const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyA0iVQA7hiqYIKPymj0QjTdynsKxlJstes",
  authDomain: "coinvertix.firebaseapp.com",
  projectId: "coinvertix",
  storageBucket: "coinvertix.firebasestorage.app",
  messagingSenderId: "1014998563667",
  appId: "1:1014998563667:web:dd729ef558a4a8d0e4ffa6"
};

// Inicialização da aplicação Firebase
const app = initializeApp(firebaseConfig);

// Exportação da instância de autenticação devidamente tipada
export const auth: Auth = getAuth(app);
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyABtIX9_vCAlG5t9OGNpaWujr-BqMbiaZg",
    authDomain: "vibemap-v0.firebaseapp.com",
    projectId: "vibemap-v0",
    storageBucket: "vibemap-v0.firebasestorage.app",
    messagingSenderId: "708774733086",
    appId: "1:708774733086:web:c1a310eecf74101cd1d50f",
    measurementId: "G-FRGPMYGK1K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

console.log("🔥 Firebase initialized:", app.name);

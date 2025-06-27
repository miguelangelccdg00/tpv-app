// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDFlnqpvKjoZgiihBQaAxPy2g5EkjMNq30",
  authDomain: "tpv-app-e849b.firebaseapp.com",
  projectId: "tpv-app-e849b",
  storageBucket: "tpv-app-e849b.firebasestorage.app",
  messagingSenderId: "415571489974",
  appId: "1:415571489974:web:8bfa504bf6519191302217",
  measurementId: "G-CKCSKYFG9D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Analytics (optional)
export const analytics = getAnalytics(app);

export default app;

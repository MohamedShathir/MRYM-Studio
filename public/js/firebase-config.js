import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// YOUR FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyCig8a2muZjXkfrjsnshtCua_3xDHQ7s98",
  authDomain: "mrym-studio.firebaseapp.com",
  projectId: "mrym-studio",
  storageBucket: "mrym-studio.firebasestorage.app",
  messagingSenderId: "126961175633",
  appId: "1:126961175633:web:84f80478ed84a50be0bc70",
  measurementId: "G-SQMY6Q1CM2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider(); // Export Google Provider
const analytics = getAnalytics(app);
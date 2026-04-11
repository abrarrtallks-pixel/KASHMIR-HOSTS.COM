// ================================================================
//  KASHMIRHOSTS — FIREBASE CONFIG
//  Replace placeholder values with your actual Firebase project
// ================================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, getDoc,
  setDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ⚠️  REPLACE THESE WITH YOUR FIREBASE PROJECT CREDENTIALS
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const gProvider = new GoogleAuthProvider();

export {
  auth, db, gProvider,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, signOut, onAuthStateChanged, updateProfile,
  collection, addDoc, getDocs, doc, getDoc, setDoc,
  updateDoc, deleteDoc, query, where, orderBy, serverTimestamp
};

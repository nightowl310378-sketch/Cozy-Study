import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment, collection, query, orderBy, limit, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDuigLSnD9UQDTkW6-ADEiyAxCQYgZsEiA",
  authDomain: "studychill-935f2.firebaseapp.com",
  projectId: "studychill-935f2",
  storageBucket: "studychill-935f2.firebasestorage.app",
  messagingSenderId: "396034386333",
  appId: "1:396034386333:web:fae40c102f9139c2682774",
  measurementId: "G-T7LWHB1KHE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

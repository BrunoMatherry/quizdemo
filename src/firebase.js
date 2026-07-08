import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithCredential, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs, onSnapshot, updateDoc, deleteDoc, serverTimestamp, Timestamp, runTransaction, arrayUnion } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCF_WhSSxn11Cv4VxZ6B5ngOOgSO-TKUno",
    authDomain: "quizmoz-31b31.firebaseapp.com",
    projectId: "quizmoz-31b31",
    storageBucket: "quizmoz-31b31.firebasestorage.app",
    messagingSenderId: "762913423131",
    appId: "1:762913423131:web:ece627bb11c1be52b6ddbe",
    measurementId: "G-N739ZMXXF8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithCredential, onAuthStateChanged, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs, onSnapshot, updateDoc, deleteDoc, serverTimestamp, Timestamp, runTransaction, arrayUnion };

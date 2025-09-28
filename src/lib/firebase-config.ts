import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration for client-side
const firebaseConfig = {
  apiKey: "AIzaSyBgFHkB2p0vEbts-hjqnXX-3PJ3ETHnCpU",
  authDomain: "studio-9024067253-54f69.firebaseapp.com",
  projectId: "studio-9024067253-54f69",
  storageBucket: "studio-9024067253-54f69.firebasestorage.app",
  messagingSenderId: "609855421516",
  appId: "1:609855421516:web:52667eb1f5939d981c48e9",
  databaseURL: ""
};

// Initialize Firebase for the client side
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
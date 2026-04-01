import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBrNh0p1QR8Oq5HT9Riic2rEdhMTNmXSe4",
  authDomain: "pm-heartthrob20260323.firebaseapp.com",
  projectId: "pm-heartthrob20260323",
  storageBucket: "pm-heartthrob20260323.firebasestorage.app",
  messagingSenderId: "578903151272",
  appId: "1:578903151272:web:b330e8634e9dfb88bbe89d",
  measurementId: "G-WEPXZZ47EF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyADRRElyEsfXQPoVrwY60xwC3BdcXpFFto",
  authDomain: "collect-card.firebaseapp.com",
  projectId: "collect-card",
  storageBucket: "collect-card.firebasestorage.app",
  messagingSenderId: "947892966745",
  appId: "1:947892966745:web:97de38cf8ead6e3788e848",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); // ここで db を export するのが重要！
export const auth = getAuth(app);

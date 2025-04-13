// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyD-Z1l1VZHaeVCNoQPXwFUcEvJYxrx0ASQ",
  authDomain: "tfg-ac-el-rinconcito.firebaseapp.com",
  databaseURL: "https://tfg-ac-el-rinconcito-default-rtdb.firebaseio.com",
  projectId: "tfg-ac-el-rinconcito",
  storageBucket: "tfg-ac-el-rinconcito.firebasestorage.app",
  messagingSenderId: "810954301932",
  appId: "1:810954301932:web:56f0627af27d602cf160c9",
  measurementId: "G-7HP3704NDC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
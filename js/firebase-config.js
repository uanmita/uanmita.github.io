// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
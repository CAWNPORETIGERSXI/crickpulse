// ==========================================
// CRICKPULSE - FIREBASE CONFIGURATION
// ==========================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


// ==========================================
// FIREBASE CONFIG
// ==========================================

const firebaseConfig = {

    apiKey: "AIzaSyB9X_8sg565D3cSQAB3D-6Arr9GjD1GQ6s",

    authDomain: "crickpulse-86857.firebaseapp.com",

    projectId: "crickpulse-86857",

    storageBucket: "crickpulse-86857.firebasestorage.app",

    messagingSenderId: "7752708835",

    appId: "1:7752708835:web:1efdef8ed098b490e3eb5e"

};


// ==========================================
// INITIALIZE FIREBASE
// ==========================================

const app = initializeApp(firebaseConfig);


// ==========================================
// FIREBASE AUTH
// ==========================================

const auth = getAuth(app);


// ==========================================
// FIRESTORE DATABASE
// ==========================================

const db = getFirestore(app);


// ==========================================
// EXPORT
// ==========================================

export {
    app,
    auth,
    db
};
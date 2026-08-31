// ============================================================
// ZENOVA EDUCATONS
// FIREBASE CONFIGURATION
// ============================================================

import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

import { getAuth } from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import { getFirestore } from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { getStorage } from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {

    apiKey: "AIzaSyDeO4bUhJ2kScQ7ZbEYwSlfH8Uk5qpGBIo",

    authDomain: "znvapp-2a26f.firebaseapp.com",

    projectId: "znvapp-2a26f",

    storageBucket: "znvapp-2a26f.firebasestorage.app",

    messagingSenderId: "391066000827",

    appId: "1:391066000827:web:9dda02a3464176af2ff89e",

    measurementId: "G-EJFSZLTHML"

};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);


// ============================================================
// FIREBASE SERVICES
// ============================================================

const auth = getAuth(app);

const db = getFirestore(app);

const storage = getStorage(app);


// ============================================================
// EXPORT
// ============================================================

export {
    app,
    auth,
    db,
    storage
};

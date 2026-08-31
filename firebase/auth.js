// ============================================================
// ZENOVA EDUCATONS
// AUTHENTICATION SYSTEM
// ============================================================

import {
    auth
} from "./firebase-config.js";

import {
    onAuthStateChanged,
    signOut
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// ============================================================
// GET CURRENT USER
// ============================================================

function watchAuth(callback) {

    return onAuthStateChanged(
        auth,
        callback
    );

}


// ============================================================
// LOGOUT
// ============================================================

async function logoutUser() {

    try {

        await signOut(auth);

        window.location.replace(
            "../index.html"
        );

    } catch (error) {

        console.error(
            "Zenova logout error:",
            error
        );

        throw error;

    }

}


// ============================================================
// EXPORT
// ============================================================

export {
    watchAuth,
    logoutUser
};

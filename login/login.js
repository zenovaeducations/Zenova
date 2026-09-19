/* ============================================================
   ZENOVA 2
   STUDENT LOGIN

   FLOW:

   Google Login
        ↓
   Check zen2Students/{uid}
        ↓
   Onboarding complete?
        ↓
   YES → Home
   NO  → Onboarding

   IMPORTANT:
   - Existing Firebase project
   - Existing Google Authentication
   - Student profile stored in zen2Students
============================================================ */


import {
    auth,
    db
} from "../firebase/firebase-config.js";


import {
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* ============================================================
   ELEMENTS
============================================================ */

const googleBtn =
    document.getElementById("googleBtn");

const googleBtnText =
    document.getElementById("googleBtnText");

const errorBox =
    document.getElementById("errorBox");


/* ============================================================
   CHECK EXISTING SESSION
============================================================ */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {
            return;
        }


        try {

            await routeStudent(
                user
            );

        } catch (error) {

            console.error(
                "Session check error:",
                error
            );

        }

    }
);


/* ============================================================
   GOOGLE LOGIN
============================================================ */

googleBtn.addEventListener(
    "click",
    async () => {

        clearError();

        googleBtn.disabled = true;

        googleBtnText.textContent =
            "Connecting...";


        try {

            const provider =
                new GoogleAuthProvider();


            provider.setCustomParameters({
                prompt: "select_account"
            });


            const result =
                await signInWithPopup(
                    auth,
                    provider
                );


            const user =
                result.user;


            console.log(
                "Zenova login successful:",
                user.uid
            );


            await routeStudent(
                user
            );


        } catch (error) {

            console.error(
                "Google login error:",
                error
            );


            showError(
                getFirebaseErrorMessage(
                    error
                )
            );


            googleBtn.disabled =
                false;


            googleBtnText.textContent =
                "Continue with Google";

        }

    }
);


/* ============================================================
   ROUTE STUDENT
============================================================ */

async function routeStudent(
    user
) {

    /*
     * New Zenova student collection.
     */

    const studentRef =
        doc(
            db,
            "zen2Students",
            user.uid
        );


    const studentSnapshot =
        await getDoc(
            studentRef
        );


    /*
     * Student profile exists.
     */

    if (
        studentSnapshot.exists()
    ) {

        const studentData =
            studentSnapshot.data();


        /*
         * Onboarding completed.
         */

        if (
            studentData.onboardingComplete === true
        ) {

            window.location.replace(
                "../home/"
            );

            return;

        }

    }


    /*
     * New student or incomplete
     * onboarding.
     */

    window.location.replace(
        "../account/onboarding/"
    );

}


/* ============================================================
   ERROR
============================================================ */

function showError(
    message
) {

    if (!errorBox) {
        return;
    }


    errorBox.textContent =
        message;

    errorBox.classList.add(
        "show"
    );

}


function clearError() {

    if (!errorBox) {
        return;
    }


    errorBox.textContent =
        "";

    errorBox.classList.remove(
        "show"
    );

}


/* ============================================================
   FIREBASE ERROR MESSAGE
============================================================ */

function getFirebaseErrorMessage(
    error
) {

    switch (error?.code) {

        case "auth/popup-closed-by-user":

            return "Google sign-in was cancelled.";


        case "auth/popup-blocked":

            return "Your browser blocked the Google sign-in popup. Please allow popups for Zenova.";


        case "auth/network-request-failed":

            return "Network error. Please check your internet connection.";


        case "auth/unauthorized-domain":

            return "This website is not authorized for Google sign-in in Firebase.";


        case "auth/operation-not-allowed":

            return "Google sign-in is not enabled in Firebase Authentication.";


        case "auth/account-exists-with-different-credential":

            return "An account already exists with a different sign-in method.";


        default:

            return (
                error?.message ||
                "Unable to sign in. Please try again."
            );

    }

}

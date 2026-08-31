// ============================================================
// ZENOVA EDUCATIONS
// LOGIN CONTROLLER
// ============================================================

import {
    auth
} from "../firebase/firebase-config.js";

import {
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// ============================================================
// ELEMENTS
// ============================================================

const googleButton =
    document.getElementById(
        "googleLoginButton"
    );

const loader =
    document.getElementById(
        "loginLoader"
    );

const errorBox =
    document.getElementById(
        "loginError"
    );

const errorMessage =
    document.getElementById(
        "errorMessage"
    );


// ============================================================
// GOOGLE PROVIDER
// ============================================================

const googleProvider =
    new GoogleAuthProvider();


// Ask Google to show account selection
// when appropriate.

googleProvider.setCustomParameters({
    prompt: "select_account"
});


// ============================================================
// CHECK EXISTING LOGIN
// ============================================================

let checkingExistingSession = true;


onAuthStateChanged(
    auth,
    (user) => {

        if (user) {

            /*
             * IMPORTANT:
             *
             * If the student is already authenticated,
             * the login page must NEVER remain visible.
             */

            window.location.replace(
                "../home/"
            );

            return;

        }


        checkingExistingSession = false;

    }
);


// ============================================================
// GOOGLE LOGIN
// ============================================================

googleButton.addEventListener(
    "click",
    async () => {


        if (checkingExistingSession) {

            return;

        }


        hideError();

        showLoader();

        googleButton.disabled = true;


        try {

            /*
             * Firebase handles the authentication.
             *
             * We do NOT store passwords.
             * We do NOT create our own login flag.
             */

            const result =
                await signInWithPopup(
                    auth,
                    googleProvider
                );


            const user =
                result.user;


            if (!user) {

                throw new Error(
                    "Authentication did not return a user."
                );

            }


            /*
             * Firebase has now created
             * the persistent authenticated session.
             *
             * The next stage will check the
             * student's Zenova profile.
             */


            window.location.replace(
                "../onboarding/"
            );


        } catch (error) {

            console.error(
                "Zenova login error:",
                error
            );


            hideLoader();

            googleButton.disabled = false;


            let message =
                "Something went wrong. Please try again.";


            switch (error.code) {

                case
                "auth/popup-closed-by-user":

                    message =
                        "Sign-in was cancelled.";

                    break;


                case
                "auth/popup-blocked":

                    message =
                        "Your browser blocked the Google sign-in window.";

                    break;


                case
                "auth/network-request-failed":

                    message =
                        "Please check your internet connection.";

                    break;


                case
                "auth/account-exists-with-different-credential":

                    message =
                        "This account already exists with another sign-in method.";

                    break;

            }


            showError(message);

        }

    }
);


// ============================================================
// LOADER
// ============================================================

function showLoader() {

    loader.classList.remove(
        "hidden"
    );

}


function hideLoader() {

    loader.classList.add(
        "hidden"
    );

}


// ============================================================
// ERROR
// ============================================================

function showError(message) {

    errorMessage.textContent =
        message;

    errorBox.classList.remove(
        "hidden"
    );

}


function hideError() {

    errorBox.classList.add(
        "hidden"
    );

}


// ============================================================
// TERMS
// ============================================================

document
    .getElementById("termsButton")
    .addEventListener(
        "click",
        () => {

            /*
             * Terms page will be connected
             * when that module is created.
             */

            window.location.href =
                "../terms/";

        }
    );


// ============================================================
// PRIVACY
// ============================================================

document
    .getElementById("privacyButton")
    .addEventListener(
        "click",
        () => {

            /*
             * Privacy page will be connected
             * when that module is created.
             */

            window.location.href =
                "../privacy/";

        }
    );

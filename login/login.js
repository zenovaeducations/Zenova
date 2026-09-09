import {
  auth
} from "../firebase/firebase-config.js";

import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// ------------------------------------
// ELEMENTS
// ------------------------------------

const googleBtn =
  document.getElementById("googleBtn");

const errorBox =
  document.getElementById("errorBox");


// ------------------------------------
// CHECK CURRENT SESSION
// ------------------------------------

onAuthStateChanged(
  auth,
  (user) => {

    /*
      The splash normally handles this.

      This is an additional safety check so
      someone cannot remain on the login page
      after already being authenticated.
    */

    if (user) {

      window.location.replace(
        "../home/"
      );

    }

  }
);


// ------------------------------------
// GOOGLE LOGIN
// ------------------------------------

googleBtn.addEventListener(
  "click",
  async () => {

    errorBox.textContent = "";

    errorBox.classList.remove("show");

    googleBtn.disabled = true;

    googleBtn.innerHTML =
      "<span>Connecting...</span>";


    try {

      const provider =
        new GoogleAuthProvider();


      /*
        Ask Google to show the account
        selection screen.

        This is useful when a device has
        multiple Google accounts.
      */

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
        "Google login successful:",
        user.uid
      );


      /*
        We now have a real Firebase
        authenticated user.

        Next step:
        onboarding.
      */

      window.location.replace(
        "../account/onboarding/"
      );


    } catch (error) {

      console.error(
        "Google login error:",
        error
      );


      let message =
        "Unable to sign in with Google. Please try again.";


      switch (error.code) {

        case "auth/popup-closed-by-user":

          message =
            "Google sign-in was cancelled.";

          break;


        case "auth/popup-blocked":

          message =
            "Your browser blocked the Google sign-in popup. Please allow popups for Zenova.";

          break;


        case "auth/network-request-failed":

          message =
            "Network error. Please check your internet connection.";

          break;


        case "auth/unauthorized-domain":

          message =
            "This website is not authorized for Google sign-in in Firebase.";

          break;


        case "auth/operation-not-allowed":

          message =
            "Google sign-in is not enabled in Firebase Authentication.";

          break;


        case "auth/account-exists-with-different-credential":

          message =
            "An account already exists with a different sign-in method.";

          break;


        default:

          if (error.message) {
            console.error(error.message);
          }

      }


      errorBox.textContent =
        message;

      errorBox.classList.add("show");


      googleBtn.disabled = false;

      googleBtn.innerHTML = `
        <span class="google-icon">G</span>
        <span>Continue with Google</span>
      `;

    }

  }
);

import {
  auth
} from "../../firebase/firebase-config.js";

import {
  onAuthStateChanged,
  GoogleAuthProvider,
  linkWithPopup,
  EmailAuthProvider,
  linkWithCredential
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// -----------------------------
// ELEMENTS
// -----------------------------

const loader = document.getElementById("loader");

const googleStep = document.getElementById("googleStep");
const passwordStep = document.getElementById("passwordStep");

const googleBtn = document.getElementById("googleBtn");
const passwordBtn = document.getElementById("passwordBtn");

const googleEmail = document.getElementById("googleEmail");

const googleError = document.getElementById("googleError");
const passwordError = document.getElementById("passwordError");

const passwordInput = document.getElementById("password");
const confirmPasswordInput =
  document.getElementById("confirmPassword");

const lengthRule = document.getElementById("lengthRule");
const upperRule = document.getElementById("upperRule");
const numberRule = document.getElementById("numberRule");


// -----------------------------
// AUTH CHECK
// -----------------------------

let currentUser = null;

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "../../login/index.html";
    return;
  }

  currentUser = user;

  loader.style.display = "none";

});


// -----------------------------
// GOOGLE LOGIN / LINK
// -----------------------------

googleBtn.addEventListener("click", async () => {

  if (!currentUser) {
    return;
  }

  googleError.textContent = "";
  googleBtn.disabled = true;

  try {

    const provider = new GoogleAuthProvider();

    provider.setCustomParameters({
      prompt: "select_account"
    });

    /*
      IMPORTANT:

      We use linkWithPopup instead of signInWithPopup.

      The user already authenticated through phone OTP.
      Therefore Google should be linked to the SAME Firebase user.
    */

    const result = await linkWithPopup(
      currentUser,
      provider
    );

    const user = result.user;

    if (!user.email) {
      throw new Error(
        "Google account did not provide an email address."
      );
    }

    googleEmail.textContent = user.email;

    googleStep.classList.add("hidden");
    passwordStep.classList.remove("hidden");

  } catch (error) {

    console.error(error);

    if (error.code === "auth/credential-already-in-use") {

      googleError.textContent =
        "This Google account is already connected to another Zenova account.";

    } else if (error.code === "auth/popup-closed-by-user") {

      googleError.textContent =
        "Google sign-in was cancelled.";

    } else {

      googleError.textContent =
        error.message || "Unable to connect Google account.";

    }

  } finally {

    googleBtn.disabled = false;

  }

});


// -----------------------------
// PASSWORD VALIDATION
// -----------------------------

function validatePassword(password) {

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  lengthRule.classList.toggle("valid", hasLength);
  upperRule.classList.toggle("valid", hasUpper);
  numberRule.classList.toggle("valid", hasNumber);

  return hasLength && hasUpper && hasNumber;
}

passwordInput.addEventListener("input", () => {

  validatePassword(passwordInput.value);

});


// -----------------------------
// CREATE PASSWORD
// -----------------------------

passwordBtn.addEventListener("click", async () => {

  passwordError.textContent = "";

  const password = passwordInput.value.trim();
  const confirmPassword =
    confirmPasswordInput.value.trim();

  if (!validatePassword(password)) {

    passwordError.textContent =
      "Password does not meet the required conditions.";

    return;
  }

  if (password !== confirmPassword) {

    passwordError.textContent =
      "Passwords do not match.";

    return;
  }

  if (!currentUser || !currentUser.email) {

    passwordError.textContent =
      "Account information is unavailable.";

    return;
  }

  passwordBtn.disabled = true;

  try {

    /*
      Attach Email + Password credential
      to the SAME Firebase user.
    */

    const credential =
      EmailAuthProvider.credential(
        currentUser.email,
        password
      );

    await linkWithCredential(
      currentUser,
      credential
    );


    // Save only non-sensitive account metadata.
    localStorage.setItem(
      "zenova_email",
      currentUser.email
    );

    localStorage.setItem(
      "zenova_auth_uid",
      currentUser.uid
    );


    // Continue to onboarding.
    window.location.href =
      "../onboarding/index.html";

  } catch (error) {

    console.error(error);

    if (error.code === "auth/provider-already-linked") {

      /*
        Password credential already exists.
        We can continue instead of creating it again.
      */

      window.location.href =
        "../onboarding/index.html";

      return;
    }

    if (error.code === "auth/email-already-in-use") {

      passwordError.textContent =
        "This email is already connected to another account.";

      return;
    }

    passwordError.textContent =
      error.message ||
      "Unable to create your password.";

  } finally {

    passwordBtn.disabled = false;

  }

});

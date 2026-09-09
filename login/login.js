import {
    RecaptchaVerifier,
    signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    auth
} from "../firebase/firebase-config.js";


/* =========================================================
   ELEMENTS
========================================================= */

const phoneStep = document.getElementById("phoneStep");
const otpStep = document.getElementById("otpStep");

const phoneNumberInput = document.getElementById("phoneNumber");
const otpInput = document.getElementById("otp");

const sendOtpBtn = document.getElementById("sendOtpBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const resendOtpBtn = document.getElementById("resendOtpBtn");

const backToPhoneBtn = document.getElementById("backToPhoneBtn");

const displayPhone = document.getElementById("displayPhone");

const phoneMessage = document.getElementById("phoneMessage");
const otpMessage = document.getElementById("otpMessage");

const loading = document.getElementById("loginLoading");


/* =========================================================
   STATE
========================================================= */

let confirmationResult = null;
let recaptchaVerifier = null;

let currentPhone = "";

let resendTimer = null;
let resendSeconds = 0;


/* =========================================================
   MESSAGE HELPERS
========================================================= */

function showMessage(element, text, type = "info") {

    element.textContent = text;

    element.className = `message show ${type}`;
}


function clearMessage(element) {

    element.textContent = "";

    element.className = "message";
}


/* =========================================================
   LOADING
========================================================= */

function showLoading() {
    loading.classList.add("active");
}


function hideLoading() {
    loading.classList.remove("active");
}


/* =========================================================
   PHONE NORMALIZATION
========================================================= */

function normalizePhone(value) {

    const digits = value
        .replace(/\D/g, "")
        .slice(0, 10);

    return digits;
}


function getInternationalPhone() {

    const phone = normalizePhone(
        phoneNumberInput.value
    );

    if (!/^[6-9]\d{9}$/.test(phone)) {

        throw new Error(
            "Please enter a valid 10-digit Indian mobile number."
        );
    }

    return `+91${phone}`;
}


/* =========================================================
   RECAPTCHA
========================================================= */

function setupRecaptcha() {

    if (recaptchaVerifier) {
        return;
    }

    recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
            size: "invisible",

            callback: () => {
                console.log(
                    "reCAPTCHA verification completed."
                );
            },

            "expired-callback": () => {

                console.log(
                    "reCAPTCHA expired."
                );

            }
        }
    );
}


/* =========================================================
   SEND OTP
========================================================= */

async function sendOTP() {

    clearMessage(phoneMessage);

    let phone;

    try {

        phone = getInternationalPhone();

    } catch (error) {

        showMessage(
            phoneMessage,
            error.message,
            "error"
        );

        phoneNumberInput.focus();

        return;
    }

    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = "Sending...";

    try {

        setupRecaptcha();

        confirmationResult =
            await signInWithPhoneNumber(
                auth,
                phone,
                recaptchaVerifier
            );

        currentPhone = phone;

        displayPhone.textContent = phone;

        phoneStep.classList.remove("active");
        otpStep.classList.add("active");

        otpInput.value = "";

        otpInput.focus();

        startResendTimer();

    } catch (error) {

        console.error(
            "Phone authentication error:",
            error
        );

        handleFirebaseError(
            error,
            phoneMessage
        );

        resetRecaptcha();

    } finally {

        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = "Continue";

    }
}


/* =========================================================
   VERIFY OTP
========================================================= */

async function verifyOTP() {

    clearMessage(otpMessage);

    const otp = otpInput.value
        .replace(/\D/g, "")
        .slice(0, 6);

    if (otp.length !== 6) {

        showMessage(
            otpMessage,
            "Please enter the 6-digit OTP.",
            "error"
        );

        otpInput.focus();

        return;
    }

    if (!confirmationResult) {

        showMessage(
            otpMessage,
            "Your verification session has expired. Please request a new OTP.",
            "error"
        );

        return;
    }

    verifyOtpBtn.disabled = true;
    verifyOtpBtn.textContent = "Verifying...";

    try {

        showLoading();

        const result =
            await confirmationResult.confirm(otp);

        const user = result.user;

        console.log(
            "Firebase user authenticated:",
            user.uid
        );

        /*
         * IMPORTANT
         *
         * Authentication is now complete.
         *
         * The next step is NOT to open Home directly.
         *
         * We must:
         *
         * 1. Search CRM
         * 2. Determine existing/new user
         * 3. Google email step
         * 4. Password setup
         * 5. Onboarding
         * 6. Admin approval
         *
         * We will build that next.
         */

        sessionStorage.setItem(
            "zenova_authenticated_phone",
            currentPhone
        );

        sessionStorage.setItem(
            "zenova_auth_uid",
            user.uid
        );

        /*
         * Temporary next route.
         *
         * This page will be created in the next step.
         */

        window.location.href =
            "../account/identify/index.html";

    } catch (error) {

        console.error(
            "OTP verification error:",
            error
        );

        hideLoading();

        handleFirebaseError(
            error,
            otpMessage
        );

    } finally {

        verifyOtpBtn.disabled = false;
        verifyOtpBtn.textContent =
            "Verify & Continue";

    }
}


/* =========================================================
   RESEND OTP
========================================================= */

async function resendOTP() {

    if (resendSeconds > 0) {
        return;
    }

    clearMessage(otpMessage);

    if (!currentPhone) {

        showMessage(
            otpMessage,
            "Please enter your mobile number again.",
            "error"
        );

        return;
    }

    resendOtpBtn.disabled = true;
    resendOtpBtn.textContent = "Sending...";

    try {

        setupRecaptcha();

        confirmationResult =
            await signInWithPhoneNumber(
                auth,
                currentPhone,
                recaptchaVerifier
            );

        showMessage(
            otpMessage,
            "A new OTP has been sent.",
            "success"
        );

        startResendTimer();

    } catch (error) {

        console.error(
            "Resend OTP error:",
            error
        );

        handleFirebaseError(
            error,
            otpMessage
        );

        resetRecaptcha();

    } finally {

        if (resendSeconds === 0) {

            resendOtpBtn.disabled = false;
            resendOtpBtn.textContent = "Resend OTP";

        }

    }
}


/* =========================================================
   RESEND TIMER
========================================================= */

function startResendTimer() {

    clearInterval(resendTimer);

    resendSeconds = 30;

    resendOtpBtn.disabled = true;

    resendOtpBtn.textContent =
        `Resend OTP (${resendSeconds}s)`;

    resendTimer = setInterval(() => {

        resendSeconds--;

        if (resendSeconds <= 0) {

            clearInterval(resendTimer);

            resendSeconds = 0;

            resendOtpBtn.disabled = false;

            resendOtpBtn.textContent =
                "Resend OTP";

            return;
        }

        resendOtpBtn.textContent =
            `Resend OTP (${resendSeconds}s)`;

    }, 1000);
}


/* =========================================================
   BACK TO PHONE
========================================================= */

function backToPhone() {

    clearMessage(otpMessage);

    otpStep.classList.remove("active");

    phoneStep.classList.add("active");

    otpInput.value = "";

    phoneNumberInput.focus();

}


/* =========================================================
   RESET RECAPTCHA
========================================================= */

function resetRecaptcha() {

    try {

        if (
            window.grecaptcha &&
            recaptchaVerifier
        ) {

            recaptchaVerifier.clear();

        }

    } catch (error) {

        console.warn(
            "Could not clear reCAPTCHA:",
            error
        );

    }

    recaptchaVerifier = null;

}


/* =========================================================
   FIREBASE ERROR HANDLING
========================================================= */

function handleFirebaseError(error, element) {

    let message =
        "Something went wrong. Please try again.";

    switch (error.code) {

        case "auth/invalid-phone-number":

            message =
                "Please enter a valid mobile number.";

            break;

        case "auth/too-many-requests":

            message =
                "Too many attempts. Please wait and try again later.";

            break;

        case "auth/quota-exceeded":

            message =
                "Verification service limit reached. Please try again later.";

            break;

        case "auth/invalid-verification-code":

            message =
                "The OTP is incorrect. Please check and try again.";

            break;

        case "auth/code-expired":

            message =
                "This OTP has expired. Please request a new one.";

            break;

        case "auth/session-expired":

            message =
                "Your verification session expired. Please request a new OTP.";

            break;

        case "auth/captcha-check-failed":

            message =
                "Security verification failed. Please try again.";

            break;

        case "auth/operation-not-allowed":

            message =
                "Phone authentication is not enabled in Firebase yet.";

            break;

        case "auth/billing-not-enabled":

            message =
                "Firebase Phone Authentication requires the appropriate project billing configuration.";

            break;

        default:

            console.error(
                "Unhandled Firebase error:",
                error
            );

    }

    showMessage(
        element,
        message,
        "error"
    );
}


/* =========================================================
   INPUT EVENTS
========================================================= */

phoneNumberInput.addEventListener(
    "input",
    () => {

        phoneNumberInput.value =
            normalizePhone(
                phoneNumberInput.value
            );

        clearMessage(phoneMessage);

    }
);


otpInput.addEventListener(
    "input",
    () => {

        otpInput.value =
            otpInput.value
                .replace(/\D/g, "")
                .slice(0, 6);

        clearMessage(otpMessage);

    }
);


/* =========================================================
   BUTTON EVENTS
========================================================= */

sendOtpBtn.addEventListener(
    "click",
    sendOTP
);

verifyOtpBtn.addEventListener(
    "click",
    verifyOTP
);

resendOtpBtn.addEventListener(
    "click",
    resendOTP
);

backToPhoneBtn.addEventListener(
    "click",
    backToPhone
);


/* =========================================================
   ENTER KEY
========================================================= */

phoneNumberInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            sendOTP();
        }

    }
);


otpInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            verifyOTP();
        }

    }
);

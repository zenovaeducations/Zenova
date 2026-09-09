import {
  auth,
  db
} from "../../firebase/firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================
// ELEMENTS
// =====================================

const loader =
  document.getElementById("loader");


const form =
  document.getElementById("onboardingForm");


const step1 =
  document.getElementById("step1");

const step2 =
  document.getElementById("step2");

const step3 =
  document.getElementById("step3");


const progressFill =
  document.getElementById("progressFill");

const progressText =
  document.getElementById("progressText");


// Personal

const nameInput =
  document.getElementById("name");

const emailInput =
  document.getElementById("email");

const dobInput =
  document.getElementById("dob");

const genderInput =
  document.getElementById("gender");


// Academic

const classInput =
  document.getElementById("class");

const boardContainer =
  document.getElementById("boardContainer");

const boardInput =
  document.getElementById("board");

const pucContainer =
  document.getElementById("pucContainer");

const streamInput =
  document.getElementById("stream");

const combinationInput =
  document.getElementById("combination");

const collegeInput =
  document.getElementById("college");


// Location

const schoolInput =
  document.getElementById("school");

const districtInput =
  document.getElementById("district");

const talukInput =
  document.getElementById("taluk");

const villageInput =
  document.getElementById("village");


const formError =
  document.getElementById("formError");


const submitBtn =
  document.getElementById("submitBtn");


// Buttons

const step1Next =
  document.getElementById("step1Next");

const step2Back =
  document.getElementById("step2Back");

const step2Next =
  document.getElementById("step2Next");

const step3Back =
  document.getElementById("step3Back");


// =====================================
// AUTH
// =====================================

let currentUser = null;


onAuthStateChanged(
  auth,
  (user) => {

    if (!user) {

      window.location.replace(
        "../../login/index.html"
      );

      return;

    }


    currentUser = user;


    /*
      Google already supplied these.
    */

    nameInput.value =
      user.displayName || "";


    emailInput.value =
      user.email || "";


    loader.style.display =
      "none";

  }
);


// =====================================
// STEP CONTROL
// =====================================

function showStep(number) {

  step1.classList.add("hidden");
  step2.classList.add("hidden");
  step3.classList.add("hidden");


  if (number === 1) {

    step1.classList.remove("hidden");

    progressFill.style.width =
      "33.33%";

    progressText.textContent =
      "Step 1 of 3";

  }


  if (number === 2) {

    step2.classList.remove("hidden");

    progressFill.style.width =
      "66.66%";

    progressText.textContent =
      "Step 2 of 3";

  }


  if (number === 3) {

    step3.classList.remove("hidden");

    progressFill.style.width =
      "100%";

    progressText.textContent =
      "Step 3 of 3";

  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


// =====================================
// VALIDATION
// =====================================

function validateStep1() {

  if (!nameInput.value.trim()) {

    return "Please enter your full name.";

  }


  if (!dobInput.value) {

    return "Please enter your date of birth.";

  }


  if (!genderInput.value) {

    return "Please select your gender.";

  }


  return null;

}


function validateStep2() {

  if (!classInput.value) {

    return "Please select your current class.";

  }


  if (
    classInput.value === "10TH" &&
    !boardInput.value
  ) {

    return "Please select your board.";

  }


  const isPuc =
    classInput.value === "1ST_PUC" ||
    classInput.value === "2ND_PUC";


  if (isPuc) {

    if (!streamInput.value) {

      return "Please select your stream.";

    }


    if (!collegeInput.value.trim()) {

      return "Please enter your college name.";

    }

  }


  return null;

}


function validateStep3() {

  if (!schoolInput.value.trim()) {

    return "Please enter your school or institution.";

  }


  if (!districtInput.value.trim()) {

    return "Please enter your district.";

  }


  if (!talukInput.value.trim()) {

    return "Please enter your taluk.";

  }


  return null;

}


// =====================================
// ERROR
// =====================================

function showError(message) {

  formError.textContent =
    message;

  formError.classList.add("show");

}


function clearError() {

  formError.textContent =
    "";

  formError.classList.remove(
    "show"
  );

}


// =====================================
// STEP 1 → STEP 2
// =====================================

step1Next.addEventListener(
  "click",
  () => {

    clearError();


    const error =
      validateStep1();


    if (error) {

      showError(error);

      return;

    }


    showStep(2);

  }
);


// =====================================
// STEP 2 → STEP 1
// =====================================

step2Back.addEventListener(
  "click",
  () => {

    clearError();

    showStep(1);

  }
);


// =====================================
// STEP 2 → STEP 3
// =====================================

step2Next.addEventListener(
  "click",
  () => {

    clearError();


    const error =
      validateStep2();


    if (error) {

      showError(error);

      return;

    }


    showStep(3);

  }
);


// =====================================
// STEP 3 → STEP 2
// =====================================

step3Back.addEventListener(
  "click",
  () => {

    clearError();

    showStep(2);

  }
);


// =====================================
// CLASS CHANGE
// =====================================

classInput.addEventListener(
  "change",
  () => {

    const selected =
      classInput.value;


    /*
      10TH → BOARD
    */

    if (selected === "10TH") {

      boardContainer
        .classList
        .remove("hidden");

      boardInput.required =
        true;

    } else {

      boardContainer
        .classList
        .add("hidden");

      boardInput.required =
        false;

      boardInput.value =
        "";

    }


    /*
      PUC → STREAM + COLLEGE
    */

    const isPuc =
      selected === "1ST_PUC" ||
      selected === "2ND_PUC";


    if (isPuc) {

      pucContainer
        .classList
        .remove("hidden");

      streamInput.required =
        true;

      collegeInput.required =
        true;

    } else {

      pucContainer
        .classList
        .add("hidden");

      streamInput.required =
        false;

      collegeInput.required =
        false;

      streamInput.value =
        "";

      combinationInput.value =
        "";

      collegeInput.value =
        "";

    }

  }
);


// =====================================
// SUBMIT
// =====================================

form.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    clearError();


    if (!currentUser) {

      showError(
        "Your account session has expired. Please sign in again."
      );

      return;

    }


    const error =
      validateStep3();


    if (error) {

      showError(error);

      return;

    }


    submitBtn.disabled =
      true;

    submitBtn.textContent =
      "Submitting...";


    try {


      // =================================
      // STUDENT PROFILE
      // =================================

      const profile = {

        uid:
          currentUser.uid,

        name:
          nameInput.value.trim(),

        email:
          currentUser.email || "",

        photoURL:
          currentUser.photoURL || "",

        dateOfBirth:
          dobInput.value,

        gender:
          genderInput.value,


        academic: {

          class:
            classInput.value,

          board:
            classInput.value === "10TH"
              ? boardInput.value
              : null,

          stream:
            (
              classInput.value === "1ST_PUC" ||
              classInput.value === "2ND_PUC"
            )
              ? streamInput.value
              : null,

          combination:
            (
              classInput.value === "1ST_PUC" ||
              classInput.value === "2ND_PUC"
            )
              ? combinationInput.value.trim()
              : null,

          college:
            (
              classInput.value === "1ST_PUC" ||
              classInput.value === "2ND_PUC"
            )
              ? collegeInput.value.trim()
              : null

        },


        school: {

          name:
            schoolInput.value.trim()

        },


        location: {

          district:
            districtInput.value.trim(),

          taluk:
            talukInput.value.trim(),

          village:
            villageInput.value.trim()

        }

      };


      // =================================
      // STUDENT ACCOUNT
      // =================================

      await setDoc(

        doc(
          db,
          "studentAccounts",
          currentUser.uid
        ),

        {

          uid:
            currentUser.uid,

          email:
            currentUser.email || "",

          profile,

          onboardingCompleted:
            true,

          /*
            New accounts start here.

            CRM/admin can later approve
            portal access.
          */

          portalAccess:
            "PENDING",

          crmStatus:
            "LEAD",

          source:
            "STUDENT_APP",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        },

        {
          merge: true
        }

      );


      // =================================
      // GO TO PENDING
      // =================================

      window.location.replace(
        "../pending/index.html"
      );


    } catch (error) {

      console.error(
        "Onboarding submission failed:",
        error
      );


      showError(
        "We couldn't save your details. Please try again."
      );


      submitBtn.disabled =
        false;

      submitBtn.textContent =
        "Submit";

    }

  }
);

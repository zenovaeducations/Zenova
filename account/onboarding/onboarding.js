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


const loader = document.getElementById("loader");

const form = document.getElementById("onboardingForm");

const nameInput = document.getElementById("name");
const dobInput = document.getElementById("dob");
const genderInput = document.getElementById("gender");

const classInput = document.getElementById("class");
const boardInput = document.getElementById("board");

const boardField = document.getElementById("boardField");
const pucFields = document.getElementById("pucFields");

const pucStreamInput =
  document.getElementById("pucStream");

const combinationInput =
  document.getElementById("combination");

const collegeInput =
  document.getElementById("college");

const districtInput =
  document.getElementById("district");

const talukInput =
  document.getElementById("taluk");

const villageInput =
  document.getElementById("village");

const schoolInput =
  document.getElementById("school");

const submitBtn =
  document.getElementById("submitBtn");

const formError =
  document.getElementById("formError");


let currentUser = null;


// ------------------------------------
// AUTH
// ------------------------------------

onAuthStateChanged(auth, (user) => {

  if (!user) {

    window.location.href =
      "../../login/index.html";

    return;
  }

  currentUser = user;

  loader.style.display = "none";

});


// ------------------------------------
// CLASS CHANGE
// ------------------------------------

classInput.addEventListener("change", () => {

  const selectedClass = classInput.value;


  // -------------------------------
  // 10TH
  // -------------------------------

  if (selectedClass === "10TH") {

    boardField.classList.remove("hidden");

    boardInput.required = true;

  } else {

    boardField.classList.add("hidden");

    boardInput.required = false;

    boardInput.value = "";

  }


  // -------------------------------
  // PUC
  // -------------------------------

  const isPuc =
    selectedClass === "1ST_PUC" ||
    selectedClass === "2ND_PUC";


  if (isPuc) {

    pucFields.classList.remove("hidden");

    pucStreamInput.required = true;
    collegeInput.required = true;

  } else {

    pucFields.classList.add("hidden");

    pucStreamInput.required = false;
    collegeInput.required = false;

    pucStreamInput.value = "";
    combinationInput.value = "";
    collegeInput.value = "";

  }

});


// ------------------------------------
// SUBMIT
// ------------------------------------

form.addEventListener("submit", async (event) => {

  event.preventDefault();

  formError.textContent = "";

  if (!currentUser) {

    formError.textContent =
      "Your account session has expired. Please login again.";

    return;
  }


  const selectedClass =
    classInput.value;


  // -------------------------------
  // BUILD PROFILE
  // -------------------------------

  const profile = {

    uid: currentUser.uid,

    phone:
      currentUser.phoneNumber || "",

    email:
      currentUser.email || "",

    name:
      nameInput.value.trim(),

    dateOfBirth:
      dobInput.value,

    gender:
      genderInput.value,

    class:
      selectedClass,

    board:
      selectedClass === "10TH"
        ? boardInput.value
        : null,

    puc: (
      selectedClass === "1ST_PUC" ||
      selectedClass === "2ND_PUC"
    )
      ? {
          stream:
            pucStreamInput.value,

          combination:
            combinationInput.value.trim(),

          college:
            collegeInput.value.trim()
        }
      : null,

    location: {

      district:
        districtInput.value.trim(),

      taluk:
        talukInput.value.trim(),

      village:
        villageInput.value.trim()

    },

    school:
      schoolInput.value.trim()

  };


  // -------------------------------
  // BASIC VALIDATION
  // -------------------------------

  if (!profile.name) {

    formError.textContent =
      "Please enter your full name.";

    return;
  }


  if (!profile.class) {

    formError.textContent =
      "Please select your class.";

    return;
  }


  if (
    profile.class === "10TH" &&
    !profile.board
  ) {

    formError.textContent =
      "Please select your board.";

    return;
  }


  if (
    (
      profile.class === "1ST_PUC" ||
      profile.class === "2ND_PUC"
    ) &&
    (
      !profile.puc.stream ||
      !profile.puc.college
    )
  ) {

    formError.textContent =
      "Please complete your PUC details.";

    return;
  }


  submitBtn.disabled = true;

  submitBtn.textContent =
    "Submitting...";


  try {

    /*
      TEMPORARY APP ACCOUNT DOCUMENT

      This does NOT create a CRM student.

      The trusted backend / CRM workflow will
      decide whether this person is an existing
      CRM student or a new lead/student.

      It also starts the account in PENDING status.
    */

    await setDoc(
      doc(db, "studentAccounts", currentUser.uid),
      {

        uid:
          currentUser.uid,

        phone:
          currentUser.phoneNumber || "",

        email:
          currentUser.email || "",

        profile,

        portalAccess:
          "PENDING",

        onboardingCompleted:
          true,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      },
      {
        merge: true
      }
    );


    /*
      Do NOT send the student directly to Home.

      Admin approval is required.
    */

    window.location.href =
      "../../pending/index.html";


  } catch (error) {

    console.error(error);

    formError.textContent =
      error.message ||
      "Something went wrong. Please try again.";

    submitBtn.disabled = false;

    submitBtn.textContent =
      "Complete registration";

  }

});

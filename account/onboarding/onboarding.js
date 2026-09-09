import {
  auth,
  db
} from "../../firebase/firebase-config.js";


import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ======================================================
// ELEMENTS
// ======================================================

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

const step4 =
  document.getElementById("step4");


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

const boardWrapper =
  document.getElementById("boardWrapper");

const boardInput =
  document.getElementById("board");

const pucWrapper =
  document.getElementById("pucWrapper");

const streamInput =
  document.getElementById("stream");

const combinationInput =
  document.getElementById("combination");

const collegeInput =
  document.getElementById("college");

const mediumInput =
  document.getElementById("medium");


// Location

const districtInput =
  document.getElementById("district");

const talukInput =
  document.getElementById("taluk");

const gpInput =
  document.getElementById("gp");

const villageInput =
  document.getElementById("village");

const schoolInput =
  document.getElementById("school");


// Subjects

const subjectsContainer =
  document.getElementById(
    "subjectsContainer"
  );


// Buttons

const step1Next =
  document.getElementById("step1Next");

const step2Back =
  document.getElementById("step2Back");

const step2Next =
  document.getElementById("step2Next");

const step3Back =
  document.getElementById("step3Back");

const step3Next =
  document.getElementById("step3Next");

const step4Back =
  document.getElementById("step4Back");

const submitBtn =
  document.getElementById("submitBtn");


// Errors

const step1Error =
  document.getElementById("step1Error");

const step2Error =
  document.getElementById("step2Error");

const step3Error =
  document.getElementById("step3Error");

const step4Error =
  document.getElementById("step4Error");


// ======================================================
// STATE
// ======================================================

let currentUser = null;

let districts = [];
let taluks = [];
let gps = [];
let villages = [];
let schools = [];
let subjects = [];


// ======================================================
// AUTH
// ======================================================

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {

      window.location.replace(
        "../../login/index.html"
      );

      return;

    }


    currentUser = user;


    /*
      Google information.
    */

    nameInput.value =
      user.displayName || "";

    emailInput.value =
      user.email || "";


    try {

      /*
        Load CRM master data.
      */

      await Promise.all([
        loadDistricts(),
        loadTaluks(),
        loadGPs(),
        loadVillages(),
        loadSchools(),
        loadSubjects()
      ]);


      loader.style.display =
        "none";


    } catch (error) {

      console.error(
        "Onboarding master data error:",
        error
      );


      loader.style.display =
        "none";


      showError(
        step3Error,
        "Unable to load Zenova master data. Please refresh and try again."
      );

    }

  }
);


// ======================================================
// LOAD DISTRICTS
// ======================================================

async function loadDistricts() {

  const snapshot =
    await getDocs(
      collection(
        db,
        "crmDistricts"
      )
    );


  districts =
    snapshot.docs
      .map((item) => ({

        id: item.id,

        ...item.data()

      }))
      .filter(
        item =>
          item.crmActive !== false
      )
      .sort(
        (a, b) =>
          String(
            a.crmDistrictName || ""
          ).localeCompare(
            String(
              b.crmDistrictName || ""
            )
          )
      );


  populateSelect(

    districtInput,

    districts,

    "Select district",

    "crmDistrictName"

  );

}


// ======================================================
// LOAD TALUKS
// ======================================================

async function loadTaluks() {

  const snapshot =
    await getDocs(
      collection(
        db,
        "crmTaluks"
      )
    );


  taluks =
    snapshot.docs
      .map((item) => ({

        id: item.id,

        ...item.data()

      }))
      .filter(
        item =>
          item.crmActive !== false
      );

}


// ======================================================
// LOAD GP
// ======================================================

async function loadGPs() {

  const snapshot =
    await getDocs(
      collection(
        db,
        "crmGramPanchayats"
      )
    );


  gps =
    snapshot.docs
      .map((item) => ({

        id: item.id,

        ...item.data()

      }))
      .filter(
        item =>
          item.crmActive !== false
      );

}


// ======================================================
// LOAD VILLAGES
// ======================================================

async function loadVillages() {

  const snapshot =
    await getDocs(
      collection(
        db,
        "crmVillages"
      )
    );


  villages =
    snapshot.docs
      .map((item) => ({

        id: item.id,

        ...item.data()

      }))
      .filter(
        item =>
          item.crmActive !== false
      );

}


// ======================================================
// LOAD SCHOOLS
// ======================================================

async function loadSchools() {

  const snapshot =
    await getDocs(
      collection(
        db,
        "crmSchools"
      )
    );


  schools =
    snapshot.docs
      .map((item) => ({

        id: item.id,

        ...item.data()

      }))
      .filter(
        item =>
          item.crmActive !== false
      );

}


// ======================================================
// LOAD SUBJECTS
// ======================================================

async function loadSubjects() {

  const subjectsQuery =
    query(

      collection(
        db,
        "hybridSubjects"
      ),

      where(
        "active",
        "==",
        true
      )

    );


  const snapshot =
    await getDocs(
      subjectsQuery
    );


  subjects =
    snapshot.docs
      .map((item) => ({

        id: item.id,

        ...item.data()

      }))
      .sort(
        sortSubjects
      );


  renderSubjects();

}


// ======================================================
// SUBJECT SORT
// ======================================================

function sortSubjects(a, b) {

  const priorityA =
    Number(
      a.priority ?? 9999
    );

  const priorityB =
    Number(
      b.priority ?? 9999
    );


  if (
    priorityA !==
    priorityB
  ) {

    return (
      priorityA -
      priorityB
    );

  }


  return String(
    a.name || ""
  ).localeCompare(
    String(
      b.name || ""
    )
  );

}


// ======================================================
// RENDER SUBJECTS
// ======================================================

function renderSubjects() {

  subjectsContainer.innerHTML =
    "";


  if (
    subjects.length === 0
  ) {

    subjectsContainer.innerHTML = `
      <div class="loading-text">
        No subjects available.
      </div>
    `;

    return;

  }


  subjects.forEach(
    (subject) => {

      const wrapper =
        document.createElement(
          "div"
        );

      wrapper.className =
        "subject-option";


      const input =
        document.createElement(
          "input"
        );

      input.type =
        "checkbox";

      input.id =
        `subject-${subject.id}`;

      input.value =
        subject.id;

      input.dataset.name =
        subject.name || "";


      const label =
        document.createElement(
          "label"
        );

      label.htmlFor =
        input.id;

      label.textContent =
        subject.name ||
        "Subject";


      wrapper.appendChild(
        input
      );

      wrapper.appendChild(
        label
      );

      subjectsContainer.appendChild(
        wrapper
      );

    }
  );

}


// ======================================================
// SELECT HELPER
// ======================================================

function resetSelect(
  select,
  placeholder
) {

  select.innerHTML = "";

  const option =
    document.createElement(
      "option"
    );

  option.value = "";

  option.textContent =
    placeholder;

  select.appendChild(
    option
  );

}


// ======================================================
// POPULATE SELECT
// ======================================================

function populateSelect(
  select,
  items,
  placeholder,
  nameField
) {

  resetSelect(
    select,
    placeholder
  );


  items.forEach(
    (item) => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        item.id;

      option.textContent =
        item[nameField] ||
        "Unnamed";


      select.appendChild(
        option
      );

    }
  );

}


// ======================================================
// DISTRICT CHANGE
// ======================================================

districtInput.addEventListener(
  "change",
  () => {

    const districtId =
      districtInput.value;


    resetSelect(
      talukInput,
      "Select taluk"
    );

    resetSelect(
      gpInput,
      "Select Gram Panchayat"
    );

    resetSelect(
      villageInput,
      "Select village"
    );

    resetSelect(
      schoolInput,
      "Select school"
    );


    gpInput.disabled =
      true;

    villageInput.disabled =
      true;

    schoolInput.disabled =
      true;


    if (!districtId) {

      talukInput.disabled =
        true;

      return;

    }


    const filtered =
      taluks.filter(
        item =>
          item.crmDistrictId ===
          districtId
      );


    populateSelect(

      talukInput,

      filtered,

      "Select taluk",

      "crmTalukName"

    );


    talukInput.disabled =
      false;

  }
);


// ======================================================
// TALUK CHANGE
// ======================================================

talukInput.addEventListener(
  "change",
  () => {

    const talukId =
      talukInput.value;


    resetSelect(
      gpInput,
      "Select Gram Panchayat"
    );

    resetSelect(
      villageInput,
      "Select village"
    );

    resetSelect(
      schoolInput,
      "Select school"
    );


    villageInput.disabled =
      true;

    schoolInput.disabled =
      true;


    if (!talukId) {

      gpInput.disabled =
        true;

      return;

    }


    // GP

    const filteredGPs =
      gps.filter(
        item =>
          item.crmTalukId ===
          talukId
      );


    populateSelect(

      gpInput,

      filteredGPs,

      "Select Gram Panchayat",

      "crmGPName"

    );


    gpInput.disabled =
      false;


    // SCHOOL

    const filteredSchools =
      schools.filter(
        item =>
          item.crmTalukId ===
          talukId
      );


    populateSelect(

      schoolInput,

      filteredSchools,

      "Select school",

      getSchoolNameField()

    );


    schoolInput.disabled =
      false;

  }
);


// ======================================================
// GP CHANGE
// ======================================================

gpInput.addEventListener(
  "change",
  () => {

    const gpId =
      gpInput.value;


    resetSelect(
      villageInput,
      "Select village"
    );


    if (!gpId) {

      villageInput.disabled =
        true;

      return;

    }


    const filteredVillages =
      villages.filter(
        item =>
          item.crmGPId ===
          gpId
      );


    populateSelect(

      villageInput,

      filteredVillages,

      "Select village",

      "crmVillageName"

    );


    villageInput.disabled =
      false;

  }
);


// ======================================================
// SCHOOL NAME FIELD
// ======================================================

function getSchoolNameField() {

  /*
    Different existing CRM school versions
    may use different naming fields.

    Prefer the canonical field if present.
  */

  const possibleFields = [
    "crmSchoolName",
    "crmSchoolNameEnglish",
    "schoolName",
    "name"
  ];


  for (
    const field of possibleFields
  ) {

    if (
      schools.some(
        school =>
          school[field]
      )
    ) {

      return field;

    }

  }


  return "crmSchoolName";

}


// ======================================================
// STEP CONTROL
// ======================================================

function showStep(number) {

  step1.classList.add("hidden");
  step2.classList.add("hidden");
  step3.classList.add("hidden");
  step4.classList.add("hidden");


  if (number === 1) {

    step1.classList.remove("hidden");

    progressFill.style.width =
      "25%";

    progressText.textContent =
      "Step 1 of 4";

  }


  if (number === 2) {

    step2.classList.remove("hidden");

    progressFill.style.width =
      "50%";

    progressText.textContent =
      "Step 2 of 4";

  }


  if (number === 3) {

    step3.classList.remove("hidden");

    progressFill.style.width =
      "75%";

    progressText.textContent =
      "Step 3 of 4";

  }


  if (number === 4) {

    step4.classList.remove("hidden");

    progressFill.style.width =
      "100%";

    progressText.textContent =
      "Step 4 of 4";

  }


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


// ======================================================
// ERROR
// ======================================================

function showError(
  element,
  message
) {

  element.textContent =
    message;

  element.classList.add(
    "show"
  );

}


function clearError(element) {

  element.textContent =
    "";

  element.classList.remove(
    "show"
  );

}


// ======================================================
// VALIDATE STEP 1
// ======================================================

function validateStep1() {

  if (
    !nameInput.value.trim()
  ) {

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


// ======================================================
// VALIDATE STEP 2
// ======================================================

function validateStep2() {

  if (!classInput.value) {

    return "Please select your class.";

  }


  if (
    classInput.value ===
    "10TH" &&
    !boardInput.value
  ) {

    return "Please select your board.";

  }


  const isPuc =
    classInput.value ===
      "1ST_PUC" ||
    classInput.value ===
      "2ND_PUC";


  if (isPuc) {

    if (
      !streamInput.value
    ) {

      return "Please select your stream.";

    }


    if (
      !collegeInput.value.trim()
    ) {

      return "Please enter your college name.";

    }

  }


  if (!mediumInput.value) {

    return "Please select your medium.";

  }


  return null;

}


// ======================================================
// VALIDATE STEP 3
// ======================================================

function validateStep3() {

  if (!districtInput.value) {

    return "Please select your district.";

  }


  if (!talukInput.value) {

    return "Please select your taluk.";

  }


  if (!gpInput.value) {

    return "Please select your Gram Panchayat.";

  }


  if (!villageInput.value) {

    return "Please select your village.";

  }


  if (!schoolInput.value) {

    return "Please select your school.";

  }


  return null;

}


// ======================================================
// STEP 1
// ======================================================

step1Next.addEventListener(
  "click",
  () => {

    clearError(step1Error);


    const error =
      validateStep1();


    if (error) {

      showError(
        step1Error,
        error
      );

      return;

    }


    showStep(2);

  }
);


// ======================================================
// STEP 2 BACK
// ======================================================

step2Back.addEventListener(
  "click",
  () => {

    clearError(step2Error);

    showStep(1);

  }
);


// ======================================================
// STEP 2 NEXT
// ======================================================

step2Next.addEventListener(
  "click",
  () => {

    clearError(step2Error);


    const error =
      validateStep2();


    if (error) {

      showError(
        step2Error,
        error
      );

      return;

    }


    showStep(3);

  }
);


// ======================================================
// STEP 3 BACK
// ======================================================

step3Back.addEventListener(
  "click",
  () => {

    clearError(step3Error);

    showStep(2);

  }
);


// ======================================================
// STEP 3 NEXT
// ======================================================

step3Next.addEventListener(
  "click",
  () => {

    clearError(step3Error);


    const error =
      validateStep3();


    if (error) {

      showError(
        step3Error,
        error
      );

      return;

    }


    showStep(4);

  }
);


// ======================================================
// STEP 4 BACK
// ======================================================

step4Back.addEventListener(
  "click",
  () => {

    clearError(step4Error);

    showStep(3);

  }
);


// ======================================================
// CLASS CHANGE
// ======================================================

classInput.addEventListener(
  "change",
  () => {

    const selected =
      classInput.value;


    // 10TH

    if (
      selected ===
      "10TH"
    ) {

      boardWrapper
        .classList
        .remove("hidden");

      boardInput.required =
        true;

    } else {

      boardWrapper
        .classList
        .add("hidden");

      boardInput.required =
        false;

      boardInput.value =
        "";

    }


    // PUC

    const isPuc =
      selected ===
        "1ST_PUC" ||
      selected ===
        "2ND_PUC";


    if (isPuc) {

      pucWrapper
        .classList
        .remove("hidden");

      streamInput.required =
        true;

      collegeInput.required =
        true;

    } else {

      pucWrapper
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


// ======================================================
// GET TOUGHEST SUBJECTS
// ======================================================

function getToughestSubjects() {

  const selected =
    subjectsContainer
      .querySelectorAll(
        "input[type='checkbox']:checked"
      );


  return Array.from(
    selected
  ).map(
    input => ({

      subjectId:
        input.value,

      subjectName:
        input.dataset.name || ""

    })
  );

}


// ======================================================
// SUBMIT
// ======================================================

form.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    clearError(step4Error);


    if (!currentUser) {

      showError(
        step4Error,
        "Your Google session has expired. Please sign in again."
      );

      return;

    }


    submitBtn.disabled =
      true;

    submitBtn.textContent =
      "Creating account...";


    try {


      // =================================================
      // SELECTED MASTER RECORDS
      // =================================================

      const district =
        districts.find(
          item =>
            item.id ===
            districtInput.value
        );


      const taluk =
        taluks.find(
          item =>
            item.id ===
            talukInput.value
        );


      const gp =
        gps.find(
          item =>
            item.id ===
            gpInput.value
        );


      const village =
        villages.find(
          item =>
            item.id ===
            villageInput.value
        );


      const school =
        schools.find(
          item =>
            item.id ===
            schoolInput.value
        );


      if (
        !district ||
        !taluk ||
        !gp ||
        !village ||
        !school
      ) {

        throw new Error(
          "One or more selected master records could not be found."
        );

      }


      // =================================================
      // TOUGHEST SUBJECTS
      // =================================================

      const toughestSubjects =
        getToughestSubjects();


      // =================================================
      // PROFILE
      // =================================================

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
            classInput.value ===
              "10TH"
              ? boardInput.value
              : null,

          medium:
            mediumInput.value,

          stream:
            (
              classInput.value ===
                "1ST_PUC" ||
              classInput.value ===
                "2ND_PUC"
            )
              ? streamInput.value
              : null,

          combination:
            (
              classInput.value ===
                "1ST_PUC" ||
              classInput.value ===
                "2ND_PUC"
            )
              ? combinationInput.value.trim()
              : null,

          college:
            (
              classInput.value ===
                "1ST_PUC" ||
              classInput.value ===
                "2ND_PUC"
            )
              ? collegeInput.value.trim()
              : null

        },


        location: {

          districtId:
            district.id,

          districtName:
            district.crmDistrictName,

          talukId:
            taluk.id,

          talukName:
            taluk.crmTalukName,

          gpId:
            gp.id,

          gpName:
            gp.crmGPName,

          villageId:
            village.id,

          villageName:
            village.crmVillageName

        },


        school: {

          schoolId:
            school.id,

          schoolName:
            school[
              getSchoolNameField()
            ] || ""

        },


        toughestSubjects:

          toughestSubjects

      };


      // =================================================
      // STUDENT ACCOUNT
      // =================================================

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

          googleDisplayName:
            currentUser.displayName || "",

          profile,

          onboardingCompleted:
            true,

          portalAccess:
            "PENDING",

          crmStatus:
            "NEW",

          crmTemperature:
            "HOT",

          crmSource:
            "WALK-IN",

          createdByEmail:
            currentUser.email || "",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        },

        {
          merge: true
        }

      );


      // =================================================
      // CREATE CRM LEAD
      // =================================================

      /*
        IMPORTANT:

        The CRM lead should be created from this
        information, but we use a deterministic
        document ID based on the Firebase UID.

        This prevents the same Google account from
        accidentally creating multiple app-generated
        leads.
      */

      await setDoc(

        doc(
          db,
          "crmLeads",
          currentUser.uid
        ),

        {

          // Identity

          uid:
            currentUser.uid,

          crmName:
            profile.name,

          crmEmail:
            profile.email,

          crmPhone:
            "",


          // Academic

          crmClass:
            profile.academic.class,

          crmBoard:
            profile.academic.board,

          crmMedium:
            profile.academic.medium,

          crmStream:
            profile.academic.stream,

          crmCombination:
            profile.academic.combination,

          crmCollege:
            profile.academic.college,


          // Location

          crmDistrictId:
            profile.location.districtId,

          crmDistrictName:
            profile.location.districtName,

          crmTalukId:
            profile.location.talukId,

          crmTalukName:
            profile.location.talukName,

          crmGPId:
            profile.location.gpId,

          crmGPName:
            profile.location.gpName,

          crmVillageId:
            profile.location.villageId,

          crmVillageName:
            profile.location.villageName,


          // School

          crmSchoolId:
            profile.school.schoolId,

          crmSchoolName:
            profile.school.schoolName,


          // Toughest subjects

          crmToughestSubjects:
            toughestSubjects,


          // ============================================
          // AUTOMATIC CRM LEAD VALUES
          // ============================================

          crmLeadStatus:
            "NEW",

          crmTemperature:
            "HOT",

          crmSource:
            "WALK-IN",


          // ============================================
          // APP ORIGIN
          // ============================================

          crmCreatedFrom:
            "STUDENT_APP",

          crmCreatedByEmail:
            currentUser.email || "",


          // ============================================
          // TIMESTAMPS
          // ============================================

          crmCreatedAt:
            serverTimestamp(),

          crmUpdatedAt:
            serverTimestamp()

        },

        {
          merge: true
        }

      );


      // =================================================
      // DONE
      // =================================================

      window.location.replace(
        "../pending/index.html"
      );


    } catch (error) {

      console.error(
        "Onboarding error:",
        error
      );


      showError(
        step4Error,
        "We couldn't complete your registration. Please try again."
      );


      submitBtn.disabled =
        false;

      submitBtn.textContent =
        "Complete registration";

    }

  }
);

import { auth, db } from "../../firebase/firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   PAGE ELEMENTS
========================================================= */

const loadingScreen =
  document.getElementById("loadingScreen");

const app =
  document.getElementById("app");

const courseContent =
  document.getElementById("courseContent");

const errorSection =
  document.getElementById("errorSection");

const errorMessage =
  document.getElementById("errorMessage");


/* =========================================================
   HEADER
========================================================= */

const backButton =
  document.getElementById("backButton");

const notificationBtn =
  document.getElementById("notificationBtn");


/* =========================================================
   COURSE
========================================================= */

const courseImage =
  document.getElementById("courseImage");

const courseImageFallback =
  document.getElementById("courseImageFallback");

const courseTitle =
  document.getElementById("courseTitle");

const courseCode =
  document.getElementById("courseCode");

const classBadge =
  document.getElementById("classBadge");

const activeBadge =
  document.getElementById("activeBadge");

const courseMedium =
  document.getElementById("courseMedium");

const courseDuration =
  document.getElementById("courseDuration");

const totalClasses =
  document.getElementById("totalClasses");


/* =========================================================
   PRICE
========================================================= */

const oldPrice =
  document.getElementById("oldPrice");

const finalPrice =
  document.getElementById("finalPrice");

const discountBadge =
  document.getElementById("discountBadge");


/* =========================================================
   DESCRIPTION
========================================================= */

const courseDescription =
  document.getElementById("courseDescription");


/* =========================================================
   HIGHLIGHTS
========================================================= */

const highlightsSection =
  document.getElementById("highlightsSection");

const highlightsGrid =
  document.getElementById("highlightsGrid");


/* =========================================================
   COURSE INFORMATION
========================================================= */

const infoCourseName =
  document.getElementById("infoCourseName");

const infoCourseCode =
  document.getElementById("infoCourseCode");

const infoClass =
  document.getElementById("infoClass");

const infoBoard =
  document.getElementById("infoBoard");

const infoMedium =
  document.getElementById("infoMedium");

const infoDuration =
  document.getElementById("infoDuration");

const infoTotalClasses =
  document.getElementById("infoTotalClasses");

const infoDurationRow =
  document.getElementById("infoDurationRow");

const infoClassesRow =
  document.getElementById("infoClassesRow");


/* =========================================================
   PURCHASE / ACCESS
========================================================= */

const buyNowBtn =
  document.getElementById("buyNowBtn");

const continueBtn =
  document.getElementById("continueBtn");

const enrolledNote =
  document.getElementById("enrolledNote");


const backToCoursesBtn =
  document.getElementById("backToCoursesBtn");


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let currentCourse = null;

let currentEnrollment = null;

let unsubscribeCourse = null;


/* =========================================================
   GET COURSE ID
========================================================= */

const urlParams =
  new URLSearchParams(window.location.search);

const courseId =
  urlParams.get("id");


console.log(
  "[Batch Details] Course ID:",
  courseId
);


/* =========================================================
   LOADING
========================================================= */

function showLoading() {

  if (loadingScreen) {
    loadingScreen.classList.remove("hidden");
  }

  if (app) {
    app.classList.add("hidden");
  }

}


function showApp() {

  if (loadingScreen) {
    loadingScreen.classList.add("hidden");
  }

  if (app) {
    app.classList.remove("hidden");
  }

}


function showError(message) {

  console.error(
    "[Batch Details]",
    message
  );


  if (loadingScreen) {
    loadingScreen.classList.add("hidden");
  }

  if (app) {
    app.classList.remove("hidden");
  }

  if (courseContent) {
    courseContent.classList.add("hidden");
  }

  if (errorSection) {
    errorSection.classList.remove("hidden");
  }

  if (errorMessage) {
    errorMessage.textContent =
      message ||
      "Unable to load this course.";
  }

}


function hideError() {

  if (errorSection) {
    errorSection.classList.add("hidden");
  }

  if (courseContent) {
    courseContent.classList.remove("hidden");
  }

}


/* =========================================================
   MONEY
========================================================= */

function formatMoney(value) {

  const number =
    Number(value || 0);

  return `₹${number.toLocaleString("en-IN")}`;

}


/* =========================================================
   MEDIUM
========================================================= */

function getCourseMediums(course) {

  /*
   * New structure
   */

  if (
    Array.isArray(course.crmMediums) &&
    course.crmMediums.length > 0
  ) {

    return course.crmMediums;

  }


  /*
   * Alternate array
   */

  if (
    Array.isArray(course.mediums) &&
    course.mediums.length > 0
  ) {

    return course.mediums;

  }


  /*
   * Old structure
   */

  if (course.crmMedium) {

    const medium =
      String(course.crmMedium).trim();

    if (
      medium.toLowerCase() === "both"
    ) {

      return [
        "Kannada",
        "English"
      ];

    }

    return [medium];

  }


  return [];

}


function getCourseMediumText(course) {

  const mediums =
    getCourseMediums(course);

  if (!mediums.length) {
    return "—";
  }

  return mediums.join(" • ");

}


/* =========================================================
   IMAGE
========================================================= */

function renderCourseImage(course) {

  const imageUrl =
    course.crmImageUrl ||
    course.imageUrl ||
    course.courseImage ||
    course.image ||
    "";


  if (!imageUrl) {

    if (courseImage) {
      courseImage.style.display = "none";
    }

    if (courseImageFallback) {
      courseImageFallback.style.display = "flex";
    }

    return;

  }


  if (courseImage) {

    courseImage.src =
      imageUrl;

    courseImage.style.display =
      "block";


    courseImage.onerror =
      () => {

        courseImage.style.display =
          "none";

        if (courseImageFallback) {

          courseImageFallback.style.display =
            "flex";

        }

      };

  }


  if (courseImageFallback) {

    courseImageFallback.style.display =
      "none";

  }

}


/* =========================================================
   PRICE
========================================================= */

function renderPrice(course) {

  const originalPrice =
    Number(
      course.crmPrice ??
      course.price ??
      0
    );


  const discount =
    Number(
      course.crmDiscount ??
      course.discount ??
      0
    );


  let calculatedFinal =
    originalPrice - discount;


  if (calculatedFinal < 0) {
    calculatedFinal = 0;
  }


  const final =
    Number(
      course.crmFinalPrice ??
      course.finalPrice ??
      calculatedFinal
    );


  /*
   * Original price
   */

  if (
    originalPrice > 0 &&
    originalPrice > final
  ) {

    oldPrice.textContent =
      formatMoney(originalPrice);

    oldPrice.classList.remove(
      "hidden"
    );

  } else {

    oldPrice.classList.add(
      "hidden"
    );

  }


  /*
   * Final price
   */

  finalPrice.textContent =
    formatMoney(final);


  /*
   * Discount percentage
   */

  if (
    originalPrice > 0 &&
    final < originalPrice
  ) {

    const percentage =
      Math.round(
        (
          (originalPrice - final) /
          originalPrice
        ) * 100
      );


    discountBadge.textContent =
      `${percentage}% OFF`;


    discountBadge.classList.remove(
      "hidden"
    );

  } else {

    discountBadge.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   DESCRIPTION
========================================================= */

function renderDescription(course) {

  const description =
    course.crmDescription ||
    course.description ||
    "";


  if (
    String(description).trim()
  ) {

    courseDescription.textContent =
      description;

  } else {

    courseDescription.textContent =
      "This course provides structured learning and academic support.";

  }

}


/* =========================================================
   COURSE HIGHLIGHTS
========================================================= */

function renderHighlights(course) {

  highlightsGrid.innerHTML = "";


  const items = [];


  /*
   * MEDIUM
   */

  const mediums =
    getCourseMediums(course);


  if (mediums.length > 0) {

    items.push({
      value: mediums.length,
      title:
        mediums.length === 1
          ? "Learning Medium"
          : "Learning Mediums"
    });

  }


  /*
   * DURATION
   */

  if (
    course.durationMonths !== undefined &&
    course.durationMonths !== null &&
    course.durationMonths !== ""
  ) {

    items.push({
      value:
        course.durationMonths,
      title: "Months"
    });

  }


  /*
   * CLASSES
   */

  if (
    course.totalClasses !== undefined &&
    course.totalClasses !== null &&
    course.totalClasses !== ""
  ) {

    items.push({
      value:
        course.totalClasses,
      title: "Classes"
    });

  }


  /*
   * Nothing to show
   */

  if (!items.length) {

    highlightsSection.classList.add(
      "hidden"
    );

    return;

  }


  /*
   * Render
   */

  items.forEach(item => {

    const card =
      document.createElement("div");

    card.className =
      "highlight-card";


    const number =
      document.createElement("div");

    number.className =
      "highlight-number";

    number.textContent =
      item.value;


    const title =
      document.createElement("div");

    title.className =
      "highlight-title";

    title.textContent =
      item.title;


    card.appendChild(number);
    card.appendChild(title);

    highlightsGrid.appendChild(card);

  });


  highlightsSection.classList.remove(
    "hidden"
  );

}


/* =========================================================
   COURSE INFORMATION
========================================================= */

function renderCourseInformation(course) {

  const name =
    course.crmCourseName ||
    course.courseName ||
    "—";


  const code =
    course.crmCourseCode ||
    course.courseCode ||
    "—";


  const className =
    course.crmClass ||
    course.className ||
    "—";


  const board =
    course.crmBoard ||
    course.board ||
    "—";


  const medium =
    getCourseMediumText(course);


  infoCourseName.textContent =
    name;

  infoCourseCode.textContent =
    code;

  infoClass.textContent =
    className;

  infoBoard.textContent =
    board;

  infoMedium.textContent =
    medium;


  /*
   * Duration
   */

  if (
    course.durationMonths !== undefined &&
    course.durationMonths !== null &&
    course.durationMonths !== ""
  ) {

    infoDuration.textContent =
      `${course.durationMonths} month${
        Number(course.durationMonths) === 1
          ? ""
          : "s"
      }`;


    infoDurationRow.classList.remove(
      "hidden"
    );

  } else {

    infoDurationRow.classList.add(
      "hidden"
    );

  }


  /*
   * Total classes
   */

  if (
    course.totalClasses !== undefined &&
    course.totalClasses !== null &&
    course.totalClasses !== ""
  ) {

    infoTotalClasses.textContent =
      course.totalClasses;


    infoClassesRow.classList.remove(
      "hidden"
    );

  } else {

    infoClassesRow.classList.add(
      "hidden"
    );

  }

}


/* =========================================================
   RENDER COURSE
========================================================= */

function renderCourse(course) {

  currentCourse =
    course;


  hideError();


  /*
   * IMAGE
   */

  renderCourseImage(course);


  /*
   * COURSE NAME
   */

  const name =
    course.crmCourseName ||
    course.courseName ||
    "Course";


  courseTitle.textContent =
    name;


  /*
   * COURSE CODE
   */

  courseCode.textContent =
    course.crmCourseCode ||
    course.courseCode ||
    "—";


  /*
   * CLASS
   */

  classBadge.textContent =
    course.crmClass ||
    course.className ||
    "—";


  /*
   * ACTIVE BADGE
   */

  if (
    course.crmActive === false
  ) {

    activeBadge.classList.add(
      "hidden"
    );

  } else {

    activeBadge.classList.remove(
      "hidden"
    );

  }


  /*
   * MEDIUM
   */

  courseMedium.textContent =
    getCourseMediumText(course);


  /*
   * DURATION
   */

  if (
    course.durationMonths !== undefined &&
    course.durationMonths !== null &&
    course.durationMonths !== ""
  ) {

    courseDuration.textContent =
      `${course.durationMonths} month${
        Number(course.durationMonths) === 1
          ? ""
          : "s"
      }`;


    document
      .getElementById("durationMeta")
      ?.classList.remove("hidden");

  } else {

    document
      .getElementById("durationMeta")
      ?.classList.add("hidden");

  }


  /*
   * TOTAL CLASSES
   */

  if (
    course.totalClasses !== undefined &&
    course.totalClasses !== null &&
    course.totalClasses !== ""
  ) {

    totalClasses.textContent =
      course.totalClasses;


    document
      .getElementById("classesMeta")
      ?.classList.remove("hidden");

  } else {

    document
      .getElementById("classesMeta")
      ?.classList.add("hidden");

  }


  /*
   * PRICE
   */

  renderPrice(course);


  /*
   * DESCRIPTION
   */

  renderDescription(course);


  /*
   * HIGHLIGHTS
   */

  renderHighlights(course);


  /*
   * INFORMATION
   */

  renderCourseInformation(course);


  /*
   * ENROLLMENT BUTTON
   */

  renderEnrollmentState();

}


/* =========================================================
   ENROLLMENT STATE
========================================================= */

function renderEnrollmentState() {

  /*
   * No enrollment
   */

  if (!currentEnrollment) {

    buyNowBtn.classList.remove(
      "hidden"
    );

    continueBtn.classList.add(
      "hidden"
    );

    enrolledNote.classList.add(
      "hidden"
    );

    return;

  }


  const status =
    String(
      currentEnrollment.status || ""
    ).toUpperCase();


  const paymentStatus =
    String(
      currentEnrollment.paymentStatus || ""
    ).toUpperCase();


  const isActive =
    status === "ACTIVE" ||
    status === "ENROLLED" ||
    paymentStatus === "PAID";


  /*
   * Not active
   */

  if (!isActive) {

    buyNowBtn.classList.remove(
      "hidden"
    );

    continueBtn.classList.add(
      "hidden"
    );

    enrolledNote.classList.add(
      "hidden"
    );

    return;

  }


  /*
   * Student already owns course
   */

  buyNowBtn.classList.add(
    "hidden"
  );

  continueBtn.classList.remove(
    "hidden"
  );

  enrolledNote.classList.remove(
    "hidden"
  );

}


/* =========================================================
   CHECK ENROLLMENT
========================================================= */

async function checkEnrollment(uid) {

  if (!uid || !courseId) {
    return;
  }


  try {

    /*
     * Recommended enrollment ID:
     *
     * studentEnrollments/{uid}_{courseId}
     */

    const enrollmentRef =
      doc(
        db,
        "studentEnrollments",
        `${uid}_${courseId}`
      );


    const snapshot =
      await getDoc(
        enrollmentRef
      );


    if (snapshot.exists()) {

      currentEnrollment = {
        id: snapshot.id,
        ...snapshot.data()
      };

    } else {

      currentEnrollment =
        null;

    }


    renderEnrollmentState();


  } catch (error) {

    /*
     * Enrollment failure should
     * NEVER block Course Details.
     */

    console.error(
      "[Batch Details] Enrollment error:",
      error
    );


    currentEnrollment =
      null;


    renderEnrollmentState();

  }

}


/* =========================================================
   LOAD COURSE
========================================================= */

function loadCourse() {

  if (!courseId) {

    showError(
      "No course was selected."
    );

    return;

  }


  console.log(
    "[Batch Details] Loading:",
    `crmCourses/${courseId}`
  );


  const courseRef =
    doc(
      db,
      "crmCourses",
      courseId
    );


  unsubscribeCourse =
    onSnapshot(

      courseRef,

      snapshot => {

        console.log(
          "[Batch Details] Course snapshot:",
          snapshot.exists()
        );


        if (!snapshot.exists()) {

          showError(
            "This course could not be found."
          );

          return;

        }


        const course =
          snapshot.data();


        console.log(
          "[Batch Details] Course data:",
          course
        );


        /*
         * IMPORTANT:
         *
         * Course is shown immediately.
         * Enrollment is checked separately.
         */

        renderCourse(course);

        showApp();


        /*
         * Check purchase status
         * after page is already visible.
         */

        if (currentUser) {

          checkEnrollment(
            currentUser.uid
          );

        }

      },


      error => {

        console.error(
          "[Batch Details] Firebase course error:",
          error
        );


        showError(
          `Unable to load course. ${error.message}`
        );

      }

    );

}


/* =========================================================
   AUTHENTICATION
========================================================= */

showLoading();


onAuthStateChanged(
  auth,

  user => {

    console.log(
      "[Batch Details] Auth:",
      user
        ? user.uid
        : "Not logged in"
    );


    if (!user) {

      /*
       * Wait briefly for Firebase to
       * restore the existing session.
       */

      setTimeout(() => {

        if (!auth.currentUser) {

          window.location.href =
            "../login/";

        }

      }, 1200);

      return;

    }


    currentUser =
      user;


    loadCourse();

  }

);


/* =========================================================
   BACK TO COURSES
========================================================= */

function goToCourses() {

  window.location.href =
    "../batches/";

}


if (backButton) {

  backButton.addEventListener(
    "click",
    goToCourses
  );

}


if (backToCoursesBtn) {

  backToCoursesBtn.addEventListener(
    "click",
    goToCourses
  );

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

if (notificationBtn) {

  notificationBtn.addEventListener(
    "click",

    () => {

      window.location.href =
        "../notifications/";

    }

  );

}


/* =========================================================
   BUY NOW
========================================================= */

if (buyNowBtn) {

  buyNowBtn.addEventListener(
    "click",

    () => {

      if (!courseId) {

        console.error(
          "[Batch Details] Missing course ID"
        );

        return;

      }


      console.log(
        "[Batch Details] Opening checkout:",
        courseId
      );


      /*
       * Language selection will happen
       * inside Checkout.
       */

      window.location.href =
        `../checkout/?id=${encodeURIComponent(courseId)}`;

    }

  );

}


/* =========================================================
   CONTINUE LEARNING
========================================================= */

if (continueBtn) {

  continueBtn.addEventListener(
    "click",

    () => {

      if (!courseId) {
        return;
      }


      window.location.href =
        `../study/?courseId=${encodeURIComponent(courseId)}`;

    }

  );

}


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
  "beforeunload",

  () => {

    if (unsubscribeCourse) {

      unsubscribeCourse();

    }

  }

);

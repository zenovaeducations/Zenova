import { auth, db } from "../../firebase/firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================
   ELEMENTS
========================================= */

const loadingScreen = document.getElementById("loadingScreen");
const app = document.getElementById("app");

const courseContent = document.getElementById("courseContent");
const errorSection = document.getElementById("errorSection");
const errorMessage = document.getElementById("errorMessage");

const backButton = document.getElementById("backButton");
const backToCoursesBtn = document.getElementById("backToCoursesBtn");

const buyNowBtn = document.getElementById("buyNowBtn");
const continueBtn = document.getElementById("continueBtn");
const enrolledNote = document.getElementById("enrolledNote");


/* COURSE */

const courseImage = document.getElementById("courseImage");
const courseImageFallback = document.getElementById("courseImageFallback");

const courseTitle = document.getElementById("courseTitle");
const courseCode = document.getElementById("courseCode");
const classBadge = document.getElementById("classBadge");
const activeBadge = document.getElementById("activeBadge");

const courseMedium = document.getElementById("courseMedium");
const courseDuration = document.getElementById("courseDuration");
const totalClasses = document.getElementById("totalClasses");

const oldPrice = document.getElementById("oldPrice");
const finalPrice = document.getElementById("finalPrice");
const discountBadge = document.getElementById("discountBadge");

const courseDescription = document.getElementById("courseDescription");


/* INFO */

const infoCourseName = document.getElementById("infoCourseName");
const infoCourseCode = document.getElementById("infoCourseCode");
const infoClass = document.getElementById("infoClass");
const infoBoard = document.getElementById("infoBoard");
const infoMedium = document.getElementById("infoMedium");
const infoDuration = document.getElementById("infoDuration");
const infoTotalClasses = document.getElementById("infoTotalClasses");

const infoDurationRow = document.getElementById("infoDurationRow");
const infoClassesRow = document.getElementById("infoClassesRow");


/* HIGHLIGHTS */

const highlightsSection =
  document.getElementById("highlightsSection");

const highlightsGrid =
  document.getElementById("highlightsGrid");


/* =========================================
   STATE
========================================= */

let currentUser = null;
let currentCourse = null;
let currentEnrollment = null;

let unsubscribeCourse = null;


/* =========================================
   COURSE ID
========================================= */

const params =
  new URLSearchParams(window.location.search);

const courseId =
  params.get("id");


console.log("Batch Details Course ID:", courseId);


/* =========================================
   BASIC HELPERS
========================================= */

function showLoading() {
  loadingScreen.classList.remove("hidden");
  app.classList.add("hidden");
}


function showApp() {
  loadingScreen.classList.add("hidden");
  app.classList.remove("hidden");
}


function showError(message) {

  loadingScreen.classList.add("hidden");

  app.classList.remove("hidden");

  courseContent.classList.add("hidden");

  errorSection.classList.remove("hidden");

  errorMessage.textContent =
    message || "Unable to load this course.";
}


function hideError() {

  errorSection.classList.add("hidden");
  courseContent.classList.remove("hidden");

}


function money(value) {

  const number =
    Number(value || 0);

  return `₹${number.toLocaleString("en-IN")}`;
}


/* =========================================
   MEDIUM
========================================= */

function getMediums(course) {

  if (
    Array.isArray(course.crmMediums) &&
    course.crmMediums.length
  ) {
    return course.crmMediums;
  }

  if (
    Array.isArray(course.mediums) &&
    course.mediums.length
  ) {
    return course.mediums;
  }

  if (course.crmMedium) {

    if (
      String(course.crmMedium).toLowerCase() === "both"
    ) {
      return ["Kannada", "English"];
    }

    return [course.crmMedium];
  }

  return [];
}


function getMediumText(course) {

  const mediums =
    getMediums(course);

  if (!mediums.length) {
    return "—";
  }

  return mediums.join(" • ");
}


/* =========================================
   IMAGE
========================================= */

function renderImage(course) {

  const imageUrl =
    course.crmImageUrl ||
    course.imageUrl ||
    course.courseImage ||
    "";

  if (!imageUrl) {

    courseImage.style.display = "none";
    courseImageFallback.style.display = "flex";

    return;
  }

  courseImage.src = imageUrl;

  courseImage.style.display = "block";
  courseImageFallback.style.display = "none";

  courseImage.onerror = function () {

    courseImage.style.display = "none";
    courseImageFallback.style.display = "flex";

  };
}


/* =========================================
   PRICE
========================================= */

function renderPrice(course) {

  const price =
    Number(course.crmPrice ?? course.price ?? 0);

  const discount =
    Number(course.crmDiscount ?? course.discount ?? 0);

  let final =
    Number(
      course.crmFinalPrice ??
      course.finalPrice ??
      price - discount
    );

  if (final < 0) {
    final = 0;
  }


  if (price > final) {

    oldPrice.textContent =
      money(price);

    oldPrice.classList.remove("hidden");

    const percentage =
      Math.round(
        ((price - final) / price) * 100
      );

    discountBadge.textContent =
      `${percentage}% OFF`;

    discountBadge.classList.remove("hidden");

  } else {

    oldPrice.classList.add("hidden");
    discountBadge.classList.add("hidden");

  }


  finalPrice.textContent =
    money(final);
}


/* =========================================
   COURSE RENDER
========================================= */

function renderCourse(course) {

  currentCourse = course;

  hideError();


  /* IMAGE */

  renderImage(course);


  /* NAME */

  const name =
    course.crmCourseName ||
    course.courseName ||
    "Course";

  courseTitle.textContent =
    name;


  /* CODE */

  courseCode.textContent =
    course.crmCourseCode ||
    course.courseCode ||
    "—";


  /* CLASS */

  classBadge.textContent =
    course.crmClass ||
    course.className ||
    "—";


  /* ACTIVE */

  if (course.crmActive === false) {

    activeBadge.classList.add("hidden");

  } else {

    activeBadge.classList.remove("hidden");

  }


  /* MEDIUM */

  const medium =
    getMediumText(course);

  courseMedium.textContent =
    medium;


  /* DURATION */

  if (
    course.durationMonths !== undefined &&
    course.durationMonths !== null &&
    course.durationMonths !== ""
  ) {

    courseDuration.textContent =
      `${course.durationMonths} month${
        Number(course.durationMonths) === 1 ? "" : "s"
      }`;

    document
      .getElementById("durationMeta")
      .classList.remove("hidden");

  } else {

    document
      .getElementById("durationMeta")
      .classList.add("hidden");

  }


  /* TOTAL CLASSES */

  if (
    course.totalClasses !== undefined &&
    course.totalClasses !== null &&
    course.totalClasses !== ""
  ) {

    totalClasses.textContent =
      course.totalClasses;

    document
      .getElementById("classesMeta")
      .classList.remove("hidden");

  } else {

    document
      .getElementById("classesMeta")
      .classList.add("hidden");

  }


  /* PRICE */

  renderPrice(course);


  /* DESCRIPTION */

  const description =
    course.crmDescription ||
    course.description ||
    "";

  courseDescription.textContent =
    description.trim()
      ? description
      : "This course provides structured learning and academic support.";


  /* INFO */

  infoCourseName.textContent =
    name;

  infoCourseCode.textContent =
    course.crmCourseCode ||
    course.courseCode ||
    "—";

  infoClass.textContent =
    course.crmClass ||
    course.className ||
    "—";

  infoBoard.textContent =
    course.crmBoard ||
    course.board ||
    "—";

  infoMedium.textContent =
    medium;


  /* DURATION INFO */

  if (
    course.durationMonths !== undefined &&
    course.durationMonths !== null &&
    course.durationMonths !== ""
  ) {

    infoDuration.textContent =
      `${course.durationMonths} month${
        Number(course.durationMonths) === 1 ? "" : "s"
      }`;

    infoDurationRow.classList.remove("hidden");

  } else {

    infoDurationRow.classList.add("hidden");

  }


  /* CLASSES INFO */

  if (
    course.totalClasses !== undefined &&
    course.totalClasses !== null &&
    course.totalClasses !== ""
  ) {

    infoTotalClasses.textContent =
      course.totalClasses;

    infoClassesRow.classList.remove("hidden");

  } else {

    infoClassesRow.classList.add("hidden");

  }


  renderHighlights(course);

  renderEnrollment();

}


/* =========================================
   HIGHLIGHTS
========================================= */

function renderHighlights(course) {

  highlightsGrid.innerHTML = "";

  const items = [];


  const mediums =
    getMediums(course);

  if (mediums.length) {

    items.push({
      value: mediums.length,
      title:
        mediums.length === 1
          ? "Learning Medium"
          : "Learning Mediums"
    });

  }


  if (
    course.durationMonths !== undefined &&
    course.durationMonths !== null &&
    course.durationMonths !== ""
  ) {

    items.push({
      value: course.durationMonths,
      title: "Months"
    });

  }


  if (
    course.totalClasses !== undefined &&
    course.totalClasses !== null &&
    course.totalClasses !== ""
  ) {

    items.push({
      value: course.totalClasses,
      title: "Classes"
    });

  }


  if (!items.length) {

    highlightsSection.classList.add("hidden");

    return;
  }


  items.forEach(item => {

    const div =
      document.createElement("div");

    div.className =
      "highlight-card";

    div.innerHTML = `
      <div class="highlight-number">
        ${item.value}
      </div>

      <div class="highlight-title">
        ${item.title}
      </div>
    `;

    highlightsGrid.appendChild(div);

  });


  highlightsSection.classList.remove("hidden");
}


/* =========================================
   ENROLLMENT
========================================= */

function renderEnrollment() {

  if (!currentEnrollment) {

    buyNowBtn.classList.remove("hidden");
    continueBtn.classList.add("hidden");
    enrolledNote.classList.add("hidden");

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


  if (!isActive) {

    buyNowBtn.classList.remove("hidden");
    continueBtn.classList.add("hidden");
    enrolledNote.classList.add("hidden");

    return;
  }


  buyNowBtn.classList.add("hidden");

  continueBtn.classList.remove("hidden");

  enrolledNote.classList.remove("hidden");
}


/* =========================================
   CHECK ENROLLMENT
========================================= */

async function checkEnrollment(uid) {

  if (!uid || !courseId) {
    return;
  }


  try {

    /*
     * Recommended document:
     * studentEnrollments/{uid}_{courseId}
     */

    const enrollmentRef =
      doc(
        db,
        "studentEnrollments",
        `${uid}_${courseId}`
      );


    const snapshot =
      await getDoc(enrollmentRef);


    if (snapshot.exists()) {

      currentEnrollment = {
        id: snapshot.id,
        ...snapshot.data()
      };

    } else {

      currentEnrollment = null;

    }


    renderEnrollment();

  } catch (error) {

    /*
     * IMPORTANT:
     *
     * Enrollment failure must NOT
     * stop Course Details from opening.
     */

    console.error(
      "Enrollment check failed:",
      error
    );

    currentEnrollment = null;

    renderEnrollment();
  }
}


/* =========================================
   START COURSE
========================================= */

function startCourse() {

  console.log(
    "Starting course:",
    courseId
  );


  if (!courseId) {

    showError(
      "No course ID was found in the URL."
    );

    return;
  }


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
          "Course snapshot received:",
          snapshot.exists()
        );


        if (!snapshot.exists()) {

          showError(
            "This course could not be found in CRM."
          );

          return;
        }


        const course =
          snapshot.data();


        console.log(
          "CRM Course:",
          course
        );


        /*
         * FIRST SHOW COURSE.
         *
         * Don't wait for enrollment.
         */

        renderCourse(course);

        showApp();


        /*
         * THEN CHECK ENROLLMENT.
         */

        if (currentUser) {

          checkEnrollment(
            currentUser.uid
          );

        }

      },

      error => {

        console.error(
          "CRM Course Firebase error:",
          error
        );


        showError(
          `Unable to load course: ${error.message}`
        );

      }

    );
}


/* =========================================
   AUTH
========================================= */

showLoading();


onAuthStateChanged(
  auth,

  user => {

    console.log(
      "Auth state:",
      user ? user.uid : "NO USER"
    );


    if (!user) {

      /*
       * Give Firebase a moment to restore
       * the authentication state.
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


    startCourse();

  }
);


/* =========================================
   BUY NOW
========================================= */

buyNowBtn.addEventListener(
  "click",

  () => {

    if (!courseId) {
      return;
    }


    console.log(
      "Opening checkout:",
      courseId
    );


    window.location.href =
      `../checkout/?id=${encodeURIComponent(courseId)}`;

  }
);


/* =========================================
   CONTINUE
========================================= */

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


/* =========================================
   BACK
========================================= */

function goToCourses() {

  window.location.href =
    "../batches/";

}


backButton.addEventListener(
  "click",
  goToCourses
);


backToCoursesBtn.addEventListener(
  "click",
  goToCourses
);


/* =========================================
   NOTIFICATIONS
========================================= */

function openNotifications() {

  window.location.href =
    "../notifications/";

}


document
  .getElementById("topNotificationBtn")
  .addEventListener(
    "click",
    openNotifications
  );


document
  .getElementById("pageNotificationBtn")
  .addEventListener(
    "click",
    openNotifications
  );


/* =========================================
   CLEANUP
========================================= */

window.addEventListener(
  "beforeunload",

  () => {

    if (unsubscribeCourse) {
      unsubscribeCourse();
    }

  }
);

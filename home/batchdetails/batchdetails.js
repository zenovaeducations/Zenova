import {
  auth,
  db
} from "../../firebase/firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  onSnapshot,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================
   ELEMENTS
========================================= */

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

const backButton =
  document.getElementById("backButton");

const backToCoursesBtn =
  document.getElementById("backToCoursesBtn");

const buyNowBtn =
  document.getElementById("buyNowBtn");

const continueBtn =
  document.getElementById("continueBtn");

const enrolledNote =
  document.getElementById("enrolledNote");


/* =========================================
   COURSE ELEMENTS
========================================= */

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

const oldPrice =
  document.getElementById("oldPrice");

const finalPrice =
  document.getElementById("finalPrice");

const discountBadge =
  document.getElementById("discountBadge");

const courseDescription =
  document.getElementById("courseDescription");


/* =========================================
   INFO
========================================= */

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


/* =========================================
   HIGHLIGHTS
========================================= */

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

let courseUnsubscribe = null;


/* =========================================
   GET COURSE ID
========================================= */

const params =
  new URLSearchParams(window.location.search);

const courseId =
  params.get("id");


/* =========================================
   HELPERS
========================================= */

function escapeHtml(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function formatMoney(value) {

  const number =
    Number(value || 0);

  return `₹${number.toLocaleString("en-IN")}`;
}


function normalizeMediums(course) {

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
      String(course.crmMedium)
        .toLowerCase() === "both"
    ) {
      return ["Kannada", "English"];
    }

    return [course.crmMedium];
  }

  return [];
}


function formatMedium(course) {

  const mediums =
    normalizeMediums(course);

  if (!mediums.length) {
    return "—";
  }

  return mediums.join(" • ");
}


function formatClass(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return String(value);
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


/* =========================================
   IMAGE
========================================= */

function renderCourseImage(course) {

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

  courseImage.onerror = () => {

    courseImage.style.display = "none";
    courseImageFallback.style.display = "flex";

  };
}


/* =========================================
   PRICE
========================================= */

function renderPrice(course) {

  const price =
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

  let finalPrice =
    Number(
      course.crmFinalPrice ??
      course.finalPrice ??
      (price - discount)
    );

  if (finalPrice < 0) {
    finalPrice = 0;
  }


  /*
   * OLD PRICE
   */

  if (price > finalPrice) {

    oldPrice.textContent =
      formatMoney(price);

    oldPrice.classList.remove("hidden");

  } else {

    oldPrice.classList.add("hidden");

  }


  /*
   * FINAL PRICE
   */

  finalPrice.textContent =
    formatMoney(finalPrice);


  /*
   * DISCOUNT
   */

  if (price > 0 && finalPrice < price) {

    const percentage =
      Math.round(
        ((price - finalPrice) / price) * 100
      );

    discountBadge.textContent =
      `${percentage}% OFF`;

    discountBadge.classList.remove("hidden");

  } else {

    discountBadge.classList.add("hidden");

  }
}


/* =========================================
   DESCRIPTION
========================================= */

function renderDescription(course) {

  const description =
    course.crmDescription ||
    course.description ||
    "";

  if (!description.trim()) {

    courseDescription.textContent =
      "This course is designed to provide structured learning and complete academic support.";

    return;
  }

  courseDescription.textContent =
    description;
}


/* =========================================
   HIGHLIGHTS
========================================= */

function renderHighlights(course) {

  highlightsGrid.innerHTML = "";

  const highlights = [];


  /*
   * MEDIUM
   */

  const mediums =
    normalizeMediums(course);

  if (mediums.length) {

    highlights.push({
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

    highlights.push({
      value: course.durationMonths,
      title: "Months"
    });

  }


  /*
   * TOTAL CLASSES
   */

  if (
    course.totalClasses !== undefined &&
    course.totalClasses !== null &&
    course.totalClasses !== ""
  ) {

    highlights.push({
      value: course.totalClasses,
      title: "Classes"
    });

  }


  /*
   * LANGUAGE CONFIG
   *
   * This only displays information.
   * It does NOT create language selection here.
   */

  const languageConfig =
    course.languageConfig;

  if (languageConfig) {

    const enabledSlots =
      Object.values(languageConfig)
        .filter(
          slot =>
            slot &&
            slot.enabled === true
        ).length;

    if (enabledSlots > 0) {

      highlights.push({
        value: enabledSlots,
        title:
          enabledSlots === 1
            ? "Language Slot"
            : "Language Slots"
      });

    }

  }


  if (!highlights.length) {

    highlightsSection.classList.add("hidden");

    return;
  }


  highlights.forEach(item => {

    const card =
      document.createElement("div");

    card.className =
      "highlight-card";

    card.innerHTML = `
      <div class="highlight-number">
        ${escapeHtml(item.value)}
      </div>

      <div class="highlight-title">
        ${escapeHtml(item.title)}
      </div>
    `;

    highlightsGrid.appendChild(card);

  });

  highlightsSection.classList.remove("hidden");
}


/* =========================================
   COURSE INFO
========================================= */

function renderCourseInfo(course) {

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
    formatMedium(course);

  const duration =
    course.durationMonths;

  const classes =
    course.totalClasses;


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


  if (
    duration !== undefined &&
    duration !== null &&
    duration !== ""
  ) {

    infoDuration.textContent =
      `${duration} month${Number(duration) === 1 ? "" : "s"}`;

    infoDurationRow.classList.remove("hidden");

  } else {

    infoDurationRow.classList.add("hidden");

  }


  if (
    classes !== undefined &&
    classes !== null &&
    classes !== ""
  ) {

    infoTotalClasses.textContent =
      classes;

    infoClassesRow.classList.remove("hidden");

  } else {

    infoClassesRow.classList.add("hidden");

  }
}


/* =========================================
   RENDER COURSE
========================================= */

function renderCourse(course) {

  currentCourse =
    course;

  hideError();


  /*
   * IMAGE
   */

  renderCourseImage(course);


  /*
   * TITLE
   */

  const name =
    course.crmCourseName ||
    course.courseName ||
    "Course";

  courseTitle.textContent =
    name;


  /*
   * CODE
   */

  courseCode.textContent =
    course.crmCourseCode ||
    course.courseCode ||
    "Course";


  /*
   * CLASS
   */

  const className =
    course.crmClass ||
    course.className ||
    "Course";

  classBadge.textContent =
    formatClass(className);


  /*
   * ACTIVE
   */

  if (course.crmActive !== false) {

    activeBadge.classList.remove("hidden");

  } else {

    activeBadge.classList.add("hidden");

  }


  /*
   * MEDIUM
   */

  const medium =
    formatMedium(course);

  courseMedium.textContent =
    medium;


  /*
   * DURATION
   */

  if (
    course.durationMonths !== undefined &&
    course.durationMonths !== null &&
    course.durationMonths !== ""
  ) {

    courseDuration.textContent =
      `${course.durationMonths} month${Number(course.durationMonths) === 1 ? "" : "s"}`;

    document
      .getElementById("durationMeta")
      .classList.remove("hidden");

  } else {

    document
      .getElementById("durationMeta")
      .classList.add("hidden");

  }


  /*
   * CLASSES
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
      .classList.remove("hidden");

  } else {

    document
      .getElementById("classesMeta")
      .classList.add("hidden");

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

  renderCourseInfo(course);


  /*
   * ENROLLMENT
   */

  renderEnrollmentState();
}


/* =========================================
   ENROLLMENT
========================================= */

function renderEnrollmentState() {

  if (!currentEnrollment) {

    buyNowBtn.classList.remove("hidden");
    continueBtn.classList.add("hidden");

    enrolledNote.classList.add("hidden");

    return;
  }


  const status =
    String(
      currentEnrollment.status ||
      ""
    ).toUpperCase();


  const paymentStatus =
    String(
      currentEnrollment.paymentStatus ||
      ""
    ).toUpperCase();


  const active =
    status === "ACTIVE" ||
    status === "ENROLLED" ||
    (
      paymentStatus === "PAID" &&
      status !== "CANCELLED"
    );


  if (!active) {

    buyNowBtn.classList.remove("hidden");
    continueBtn.classList.add("hidden");
    enrolledNote.classList.add("hidden");

    return;
  }


  /*
   * ENROLLED
   */

  buyNowBtn.classList.add("hidden");

  continueBtn.classList.remove("hidden");

  enrolledNote.classList.remove("hidden");
}


/* =========================================
   LOAD ENROLLMENT
========================================= */

async function loadEnrollment(uid) {

  if (!uid || !courseId) {
    return;
  }

  currentEnrollment = null;


  /*
   * PRIMARY DOCUMENT
   *
   * Recommended:
   * studentEnrollments/{uid}_{courseId}
   */

  const primaryId =
    `${uid}_${courseId}`;


  try {

    const primaryRef =
      doc(
        db,
        "studentEnrollments",
        primaryId
      );

    const snap =
      await getDoc(primaryRef);

    if (snap.exists()) {

      const data =
        snap.data();

      const linkedCourse =
        data.crmCourseId ||
        data.courseId;

      if (
        !linkedCourse ||
        linkedCourse === courseId
      ) {

        currentEnrollment = {
          id: snap.id,
          ...data
        };

        renderEnrollmentState();

        return;
      }
    }

  } catch (error) {

    console.warn(
      "Primary enrollment lookup failed:",
      error
    );

  }


  /*
   * If no enrollment was found,
   * leave the page available for purchase.
   */

  currentEnrollment = null;

  renderEnrollmentState();
}


/* =========================================
   LOAD COURSE
========================================= */

function startCourseListener() {

  if (!courseId) {

    showError(
      "No course was selected."
    );

    return;
  }


  const courseRef =
    doc(
      db,
      "crmCourses",
      courseId
    );


  courseUnsubscribe =
    onSnapshot(
      courseRef,

      async snapshot => {

        if (!snapshot.exists()) {

          showError(
            "This course no longer exists."
          );

          return;
        }


        const course =
          snapshot.data();


        /*
         * COURSE IS CANONICAL CRM DATA
         */

        renderCourse(course);


        if (currentUser) {

          await loadEnrollment(
            currentUser.uid
          );

        }


        showApp();

      },

      error => {

        console.error(
          "Course listener error:",
          error
        );

        showError(
          "Unable to load course details. Please try again."
        );

      }
    );
}


/* =========================================
   AUTH
========================================= */

onAuthStateChanged(
  auth,
  async user => {

    if (!user) {

      window.location.href =
        "../login/";

      return;
    }

    currentUser =
      user;

    startCourseListener();

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


    /*
     * IMPORTANT:
     *
     * Language selection belongs
     * to CHECKOUT, not Course Details.
     *
     * Therefore we only pass the
     * course ID here.
     */

    window.location.href =
      `../checkout/?id=${encodeURIComponent(courseId)}`;

  }
);


/* =========================================
   CONTINUE LEARNING
========================================= */

continueBtn.addEventListener(
  "click",
  () => {

    if (!courseId) {
      return;
    }


    /*
     * Change this later to the
     * actual course-learning route.
     */

    window.location.href =
      `../study/?courseId=${encodeURIComponent(courseId)}`;

  }
);


/* =========================================
   BACK
========================================= */

function goBackToCourses() {

  window.location.href =
    "../batches/";

}


backButton.addEventListener(
  "click",
  goBackToCourses
);


backToCoursesBtn.addEventListener(
  "click",
  goBackToCourses
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

    if (courseUnsubscribe) {
      courseUnsubscribe();
    }

  }
);

/* =========================================================
   ZENOVA HYBRID DASHBOARD
   UI DEVELOPMENT VERSION

   IMPORTANT:
   - No login logic here yet.
   - No approval logic here yet.
   - No Firebase writes here yet.
   - No existing Zenova student data is modified.
   ========================================================= */


/* =========================================================
   DOM
========================================================= */

const appLoader = document.getElementById("appLoader");
const app = document.getElementById("app");


/* =========================================================
   TEMPORARY STUDENT DISPLAY DATA

   This is ONLY for UI development.

   Later this will come from the existing logged-in
   student's Firestore document.

   DO NOT use this object for production student data.
========================================================= */

const student = {
  name: "Student",
  className: "1st PUC",
  stream: "Science"
};


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  initializeStudentUI();

  initializeBanner();

  initializeMasterPlan();

  initializeNavigation();

  initializeResourceButtons();

  initializeNotificationButton();

  initializePendingButton();

  /*
   * Small development loading delay so we can see
   * the branded loading screen.
   *
   * Later this will be replaced by the actual
   * Firebase initialization/authentication state.
   */

  setTimeout(() => {

    appLoader.classList.add("hidden");
    app.classList.remove("hidden");

  }, 650);

});


/* =========================================================
   STUDENT UI
========================================================= */

function initializeStudentUI() {

  const studentName = document.getElementById("studentName");
  const studentMeta = document.getElementById("studentMeta");
  const profileInitial = document.getElementById("profileInitial");

  if (studentName) {
    studentName.textContent = student.name;
  }

  if (studentMeta) {
    studentMeta.textContent =
      `${student.className} • ${student.stream}`;
  }

  if (profileInitial) {

    const firstLetter =
      student.name
        .trim()
        .charAt(0)
        .toUpperCase();

    profileInitial.textContent =
      firstLetter || "S";
  }

}


/* =========================================================
   BANNER CAROUSEL
========================================================= */

let currentBanner = 0;
let bannerTimer = null;

function initializeBanner() {

  const slides =
    Array.from(
      document.querySelectorAll(".banner-slide")
    );

  const dots =
    Array.from(
      document.querySelectorAll(".banner-dot")
    );

  const current =
    document.getElementById("bannerCurrent");

  if (!slides.length) return;


  function showBanner(index) {

    currentBanner =
      (index + slides.length) % slides.length;


    slides.forEach((slide, i) => {

      slide.classList.toggle(
        "active",
        i === currentBanner
      );

    });


    dots.forEach((dot, i) => {

      dot.classList.toggle(
        "active",
        i === currentBanner
      );

    });


    if (current) {

      current.textContent =
        String(currentBanner + 1)
          .padStart(2, "0");

    }

  }


  dots.forEach((dot, index) => {

    dot.addEventListener("click", () => {

      showBanner(index);

      restartBannerTimer();

    });

  });


  function restartBannerTimer() {

    clearInterval(bannerTimer);

    bannerTimer =
      setInterval(() => {

        showBanner(currentBanner + 1);

      }, 5000);

  }


  showBanner(0);

  restartBannerTimer();

}


/* =========================================================
   MASTER PLAN
========================================================= */

function initializeMasterPlan() {

  const planList =
    document.getElementById("masterPlanList");

  if (!planList) return;


  const cards =
    Array.from(
      planList.querySelectorAll(".plan-card")
    );


  const completedCount =
    document.getElementById("completedCount");

  const totalCount =
    document.getElementById("totalCount");

  const progress =
    document.getElementById("masterProgress");

  const pendingTitle =
    document.getElementById("pendingTitle");


  totalCount.textContent =
    cards.length;


  function updateProgress() {

    const completed =
      cards.filter(card =>
        card.classList.contains("completed")
      ).length;


    const total =
      cards.length;


    const percentage =
      total === 0
        ? 0
        : Math.round((completed / total) * 100);


    completedCount.textContent =
      completed;

    progress.style.width =
      `${percentage}%`;


    const remaining =
      total - completed;


    if (remaining === 0) {

      pendingTitle.textContent =
        "Today's plan is complete";

    } else {

      pendingTitle.textContent =
        `${remaining} ${
          remaining === 1
            ? "task"
            : "tasks"
        } remaining`;

    }

  }


  cards.forEach(card => {

    const completeButton =
      card.querySelector(".complete-button");


    completeButton.addEventListener(
      "click",
      () => {

        card.classList.toggle("completed");

        updateProgress();

        /*
         * FUTURE FIREBASE ACTION:
         *
         * saveMasterPlanCompletion({
         *   studentId,
         *   masterPlanId,
         *   taskId,
         *   completed: true
         * })
         *
         * This will be added after the
         * Firestore architecture is finalized.
         */

      }
    );

  });


  updateProgress();

}


/* =========================================================
   RESOURCE BUTTONS
========================================================= */

function initializeResourceButtons() {

  const buttons =
    document.querySelectorAll(
      ".open-resource"
    );


  buttons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const type =
          button.dataset.type;


        /*
         * UI DEVELOPMENT ONLY.
         *
         * Later each button will open
         * the exact Firebase resource:
         *
         * LIVE     → live class
         * PDF      → exact PDF
         * VIDEO    → exact recorded lecture
         * REVISION → exact chapter/revision
         */

        console.log(
          "Open master plan resource:",
          type
        );

        showTemporaryMessage(
          `Opening ${formatResourceType(type)}...`
        );

      }
    );

  });

}


function formatResourceType(type) {

  const map = {
    live: "live class",
    pdf: "notes",
    video: "recorded lecture",
    revision: "revision material"
  };

  return map[type] || "resource";

}


/* =========================================================
   NAVIGATION
========================================================= */

function initializeNavigation() {

  const navigationButtons =
    document.querySelectorAll(
      "[data-page]"
    );


  navigationButtons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const page =
          button.dataset.page;

        navigateToPage(page);

      }
    );

  });

}


function navigateToPage(page) {

  /*
   * These paths are prepared for the
   * final Hybrid Portal structure.
   *
   * We are not creating those pages yet.
   */

  const paths = {

    dashboard: "./",

    classes: "../hybrid/classes/",

    study: "../hybrid/study/",

    timetable: "../hybrid/timetable/",

    attendance: "../hybrid/attendance/",

    tests: "../hybrid/tests/",

    more: "../hybrid/more/",

    ai: "../hybrid/more/ai/"

  };


  if (!paths[page]) {

    console.warn(
      "Unknown page:",
      page
    );

    return;

  }


  /*
   * Dashboard is currently the only
   * existing page, so don't navigate
   * away from it during UI development.
   */

  if (page === "dashboard") {

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    return;

  }


  /*
   * The remaining pages will be created
   * one by one.
   *
   * For now show a development message
   * rather than sending the student
   * to a non-existent page.
   */

  showTemporaryMessage(
    `${capitalize(page)} page will be connected next.`
  );

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function initializeNotificationButton() {

  const button =
    document.getElementById(
      "notificationButton"
    );


  if (!button) return;


  button.addEventListener(
    "click",
    () => {

      /*
       * Later:
       *
       * window.location.href =
       * "../hybrid/more/notifications/";
       */

      showTemporaryMessage(
        "Notifications will be connected next."
      );

    }
  );

}


/* =========================================================
   PENDING
========================================================= */

function initializePendingButton() {

  const button =
    document.getElementById(
      "viewPendingButton"
    );


  if (!button) return;


  button.addEventListener(
    "click",
    () => {

      showTemporaryMessage(
        "Pending task view will be connected next."
      );

    }
  );

}


/* =========================================================
   TEMPORARY MESSAGE
========================================================= */

function showTemporaryMessage(message) {

  let toast =
    document.getElementById(
      "hybridToast"
    );


  if (!toast) {

    toast =
      document.createElement("div");

    toast.id =
      "hybridToast";

    toast.style.position =
      "fixed";

    toast.style.left =
      "50%";

    toast.style.bottom =
      "92px";

    toast.style.transform =
      "translateX(-50%)";

    toast.style.zIndex =
      "9999";

    toast.style.padding =
      "11px 16px";

    toast.style.borderRadius =
      "9px";

    toast.style.background =
      "#111";

    toast.style.color =
      "#fff";

    toast.style.fontSize =
      "11px";

    toast.style.fontWeight =
      "600";

    toast.style.boxShadow =
      "0 8px 30px rgba(0,0,0,0.15)";

    toast.style.opacity =
      "0";

    toast.style.transition =
      "opacity .2s ease";

    document.body.appendChild(toast);

  }


  toast.textContent =
    message;


  requestAnimationFrame(() => {

    toast.style.opacity =
      "1";

  });


  clearTimeout(
    window.hybridToastTimer
  );


  window.hybridToastTimer =
    setTimeout(() => {

      toast.style.opacity =
        "0";

    }, 2200);

}


/* =========================================================
   HELPERS
========================================================= */

function capitalize(value) {

  if (!value) return "";

  return value.charAt(0).toUpperCase()
    + value.slice(1);

}

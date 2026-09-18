import { auth, db } from "../../firebase/firebase-config.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================
   DOM
========================================= */

const loadingScreen =
  document.getElementById("loadingScreen");

const app =
  document.getElementById("app");

const errorSection =
  document.getElementById("errorSection");

const errorMessage =
  document.getElementById("errorMessage");

const backButton =
  document.getElementById("backButton");

const errorBackButton =
  document.getElementById("errorBackButton");

const batchName =
  document.getElementById("batchName");

const batchTitle =
  document.getElementById("batchTitle");

const batchMeta =
  document.getElementById("batchMeta");

const batchImage =
  document.getElementById("batchImage");

const batchImageFallback =
  document.getElementById("batchImageFallback");

const liveClassSection =
  document.getElementById("liveClassSection");

const liveThumbnail =
  document.getElementById("liveThumbnail");

const liveThumbnailFallback =
  document.getElementById("liveThumbnailFallback");

const liveSubject =
  document.getElementById("liveSubject");

const liveTopic =
  document.getElementById("liveTopic");

const liveTeacher =
  document.getElementById("liveTeacher");

const liveTime =
  document.getElementById("liveTime");

const joinLiveButton =
  document.getElementById("joinLiveButton");

const dateSelector =
  document.getElementById("dateSelector");

const selectedDateLabel =
  document.getElementById("selectedDateLabel");

const studyPlanContainer =
  document.getElementById("studyPlanContainer");

const subjectsContainer =
  document.getElementById("subjectsContainer");

const recordingsButton =
  document.getElementById("recordingsButton");


/* =========================================
   STATE
========================================= */

let currentUser = null;

let enrollment = null;

let courseId = null;

let course = null;

let subjects = [];

let studyPlans = [];

let selectedDate = null;

let currentLiveClass = null;


/* =========================================
   HELPERS
========================================= */

function showApp() {

  loadingScreen.classList.add("hidden");

  errorSection.classList.add("hidden");

  app.classList.remove("hidden");

}


function showError(message) {

  loadingScreen.classList.add("hidden");

  app.classList.add("hidden");

  errorMessage.textContent = message;

  errorSection.classList.remove("hidden");

}


function escapeHtml(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function getCourseIdFromEnrollment(data) {

  return (
    data.courseId ||
    data.crmCourseId ||
    data.batchId ||
    data.courseID ||
    null
  );

}


function normalizeDate(value) {

  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value.substring(0, 10);
  }

  if (
    value &&
    typeof value.toDate === "function"
  ) {

    return value
      .toDate()
      .toISOString()
      .substring(0, 10);

  }

  return null;

}


function formatDate(dateString) {

  if (!dateString) {
    return "—";
  }

  const date =
    new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  );

}


function formatDay(dateString) {

  const date =
    new Date(`${dateString}T00:00:00`);

  return date.toLocaleDateString(
    "en-IN",
    {
      weekday: "short"
    }
  );

}


/* =========================================
   AUTH
========================================= */

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {

      window.location.href =
        "../login/";

      return;

    }

    currentUser = user;

    try {

      await initializeStudyNow();

    } catch (error) {

      console.error(
        "[Study Now]",
        error
      );

      showError(
        "We couldn't load your learning space."
      );

    }

  }
);


/* =========================================
   INITIALIZE
========================================= */

async function initializeStudyNow() {

  /*
   * Find the student's enrollment.
   *
   * We use the student's UID and then
   * determine the course/batch ID.
   */

  const enrollmentQuery = query(
    collection(db, "studentEnrollments"),
    where("studentUid", "==", currentUser.uid)
  );

  const enrollmentSnapshot =
    await getDocs(enrollmentQuery);


  if (enrollmentSnapshot.empty) {

    showError(
      "You are not enrolled in any batch yet."
    );

    return;

  }


  /*
   * For now display the first enrollment.
   *
   * Later we can add a batch switcher if
   * the student has multiple batches.
   */

  const enrollmentDoc =
    enrollmentSnapshot.docs[0];

  enrollment = {
    id: enrollmentDoc.id,
    ...enrollmentDoc.data()
  };


  courseId =
    getCourseIdFromEnrollment(enrollment);


  if (!courseId) {

    showError(
      "Your enrollment does not contain a batch ID."
    );

    return;

  }


  await loadCourse();

  await loadSubjects();

  await loadStudyPlans();

  renderBatch();

  renderDates();

  renderSubjects();

  await loadLiveClass();

  showApp();

}


/* =========================================
   COURSE / BATCH
========================================= */

async function loadCourse() {

  const courseRef =
    doc(
      db,
      "crmCourses",
      courseId
    );

  const courseSnapshot =
    await getDoc(courseRef);


  if (!courseSnapshot.exists()) {

    throw new Error(
      "Course document not found."
    );

  }


  course = {
    id: courseSnapshot.id,
    ...courseSnapshot.data()
  };

}


/* =========================================
   RENDER BATCH
========================================= */

function renderBatch() {

  const name =
    course.crmCourseName ||
    course.courseName ||
    course.name ||
    enrollment.courseName ||
    "Your Batch";


  const className =
    course.crmClass ||
    course.className ||
    enrollment.className ||
    "";


  const board =
    course.crmBoard ||
    course.board ||
    enrollment.board ||
    "";


  batchName.textContent =
    name;

  batchTitle.textContent =
    name;


  const metaParts =
    [className, board]
      .filter(Boolean);


  batchMeta.textContent =
    metaParts.join(" • ") ||
    "Your enrolled batch";


  const image =
    course.crmImageUrl ||
    course.imageUrl ||
    course.thumbnail ||
    course.image ||
    enrollment.courseImage ||
    "";


  if (image) {

    batchImage.src = image;

    batchImage.classList.remove(
      "hidden"
    );

    batchImageFallback.classList.add(
      "hidden"
    );

  } else {

    batchImage.classList.add(
      "hidden"
    );

    batchImageFallback.classList.remove(
      "hidden"
    );

  }

}


/* =========================================
   SUBJECTS
========================================= */

async function loadSubjects() {

  /*
   * Existing app uses hybridSubjects.
   *
   * Some old records may use courseId while
   * others use crmCourseId, so we support both.
   */

  const subjectsRef =
    collection(
      db,
      "hybridSubjects"
    );


  const queries = [

    query(
      subjectsRef,
      where(
        "courseId",
        "==",
        courseId
      )
    ),

    query(
      subjectsRef,
      where(
        "crmCourseId",
        "==",
        courseId
      )
    )

  ];


  const results =
    await Promise.all(
      queries.map(
        q => getDocs(q)
      )
    );


  const map =
    new Map();


  results.forEach(snapshot => {

    snapshot.forEach(subjectDoc => {

      const data =
        subjectDoc.data();


      const name =
        data.subjectName ||
        data.name ||
        data.crmSubjectName ||
        data.subject ||
        "Subject";


      const language =
        data.language ||
        data.medium ||
        data.crmMedium ||
        "Both";


      /*
       * Important:
       *
       * Prevent duplicate Mathematics /
       * Science / Social Science records.
       *
       * But if the same subject exists in
       * different languages, keep them separate.
       */

      const key =
        `${name}`
          .trim()
          .toLowerCase()
          .replace(/\s+/g, " ")
        +
        "__"
        +
        `${language}`
          .trim()
          .toLowerCase();


      if (!map.has(key)) {

        map.set(
          key,
          {
            id: subjectDoc.id,
            ...data,
            displayName: name,
            displayLanguage: language
          }
        );

      }

    });

  });


  subjects =
    Array.from(map.values());

}


/* =========================================
   RENDER SUBJECTS
========================================= */

function renderSubjects() {

  subjectsContainer.innerHTML = "";


  if (!subjects.length) {

    subjectsContainer.innerHTML = `
      <div class="empty-state"
           style="grid-column:1/-1;">
        Subjects are not available yet.
      </div>
    `;

    return;

  }


  subjects.forEach(subject => {

    const card =
      document.createElement("div");

    card.className =
      "subject-card";


    card.innerHTML = `

      <div>

        <div class="subject-name">
          ${escapeHtml(
            subject.displayName
          )}
        </div>

        <div class="subject-meta">
          ${escapeHtml(
            subject.displayLanguage
          )}
        </div>

      </div>

      <div class="subject-open">
        OPEN →
      </div>

    `;


    card.addEventListener(
      "click",
      () => {

        /*
         * This is the future chapters page.
         *
         * We keep the subject ID and course ID
         * in the URL.
         */

        window.location.href =
          `../chapters/?courseId=${
            encodeURIComponent(courseId)
          }&subjectId=${
            encodeURIComponent(subject.id)
          }`;

      }
    );


    subjectsContainer.appendChild(card);

  });

}


/* =========================================
   STUDY PLAN
========================================= */

async function loadStudyPlans() {

  const plansRef =
    collection(
      db,
      "studyPlans"
    );


  const planQuery =
    query(
      plansRef,
      where(
        "courseId",
        "==",
        courseId
      )
    );


  const snapshot =
    await getDocs(planQuery);


  studyPlans =
    snapshot.docs.map(
      planDoc => ({
        id: planDoc.id,
        ...planDoc.data()
      })
    );


  studyPlans =
    studyPlans.filter(
      plan => {

        return (
          plan.date ||
          plan.planDate ||
          plan.scheduledDate
        );

      }
    );


  studyPlans.sort(
    (a, b) => {

      const dateA =
        normalizeDate(
          a.date ||
          a.planDate ||
          a.scheduledDate
        );

      const dateB =
        normalizeDate(
          b.date ||
          b.planDate ||
          b.scheduledDate
        );

      return String(dateA)
        .localeCompare(
          String(dateB)
        );

    }
  );


  /*
   * Always show a useful date range.
   *
   * If admin has no plans yet, the dates
   * still appear and show:
   *
   * "Not yet scheduled"
   */

  if (studyPlans.length) {

    selectedDate =
      normalizeDate(
        studyPlans[0].date ||
        studyPlans[0].planDate ||
        studyPlans[0].scheduledDate
      );

  } else {

    selectedDate =
      new Date()
        .toISOString()
        .substring(0, 10);

  }

}


/* =========================================
   DATE RANGE
========================================= */

function getDateRange() {

  const dates = [];

  const today =
    new Date();

  /*
   * Show 14 days.
   *
   * Later this can be changed to the
   * complete academic calendar.
   */

  for (
    let i = 0;
    i < 14;
    i++
  ) {

    const date =
      new Date(today);

    date.setDate(
      today.getDate() + i
    );


    dates.push(
      date
        .toISOString()
        .substring(0, 10)
    );

  }


  return dates;

}


/* =========================================
   RENDER DATES
========================================= */

function renderDates() {

  dateSelector.innerHTML = "";


  const dates =
    getDateRange();


  dates.forEach(date => {

    const button =
      document.createElement("button");

    button.className =
      "date-item";


    if (
      date === selectedDate
    ) {

      button.classList.add(
        "active"
      );

    }


    button.innerHTML = `

      <span class="date-day">
        ${formatDay(date)}
      </span>

      <span class="date-number">
        ${new Date(
          `${date}T00:00:00`
        ).getDate()}
      </span>

    `;


    button.addEventListener(
      "click",
      () => {

        selectedDate = date;

        renderDates();

        renderSelectedStudyPlan();

      }
    );


    dateSelector.appendChild(
      button
    );

  });


  renderSelectedStudyPlan();

}


/* =========================================
   SELECTED STUDY PLAN
========================================= */

function renderSelectedStudyPlan() {

  selectedDateLabel.textContent =
    formatDate(selectedDate);


  studyPlanContainer.innerHTML = "";


  const plans =
    studyPlans.filter(
      plan => {

        const date =
          normalizeDate(
            plan.date ||
            plan.planDate ||
            plan.scheduledDate
          );

        return date === selectedDate;

      }
    );


  if (!plans.length) {

    studyPlanContainer.innerHTML = `

      <div class="empty-state">
        Not yet scheduled
      </div>

    `;

    return;

  }


  plans.forEach(plan => {

    const subject =
      plan.subjectName ||
      plan.subject ||
      "Subject";


    const topic =
      plan.topic ||
      plan.chapterName ||
      plan.title ||
      "Study session";


    const time =
      plan.time ||
      plan.startTime ||
      "";


    const item =
      document.createElement("div");

    item.className =
      "plan-item";


    item.innerHTML = `

      <div>

        <div class="plan-subject">
          ${escapeHtml(subject)}
        </div>

        <div class="plan-topic">
          ${escapeHtml(topic)}
        </div>

      </div>

      ${
        time
          ? `
            <div class="plan-time">
              ${escapeHtml(time)}
            </div>
          `
          : ""
      }

    `;


    studyPlanContainer.appendChild(
      item
    );

  });

}


/* =========================================
   LIVE CLASS
========================================= */

async function loadLiveClass() {

  /*
   * We listen to the collection so the page
   * can react when admin changes the class.
   */

  const liveRef =
    collection(
      db,
      "liveClasses"
    );


  const liveQuery =
    query(
      liveRef,
      where(
        "courseId",
        "==",
        courseId
      )
    );


  onSnapshot(
    liveQuery,
    snapshot => {

      const classes =
        snapshot.docs.map(
          liveDoc => ({
            id: liveDoc.id,
            ...liveDoc.data()
          })
        );


      renderLiveClass(
        classes
      );

    },
    error => {

      console.error(
        "[Live Classes]",
        error
      );

      hideLiveClass();

    }
  );

}


/* =========================================
   RENDER LIVE CLASS
========================================= */

function renderLiveClass(classes) {

  const now =
    new Date();


  /*
   * Find an active class first.
   */

  let live =
    classes.find(
      item => {

        return (
          item.status === "live" ||
          item.status === "LIVE" ||
          item.isLive === true
        );

      }
    );


  /*
   * Otherwise find an upcoming class.
   */

  if (!live) {

    live =
      classes.find(
        item => {

          const start =
            parseDateTime(
              item.startDate ||
              item.date ||
              item.scheduledDate,

              item.startTime ||
              item.time
            );


          return (
            start &&
            start > now &&
            item.status !== "completed"
          );

        }
      );

  }


  if (!live) {

    hideLiveClass();

    return;

  }


  currentLiveClass =
    live;


  liveClassSection.classList.remove(
    "hidden"
  );


  const subject =
    live.subjectName ||
    live.subject ||
    "Subject";


  const topic =
    live.topic ||
    live.title ||
    live.chapterName ||
    "Live Class";


  const teacher =
    live.teacherName ||
    live.teacher ||
    live.facultyName ||
    "Zenova Faculty";


  liveSubject.textContent =
    subject;

  liveTopic.textContent =
    topic;

  liveTeacher.textContent =
    `Teacher: ${teacher}`;


  const image =
    live.thumbnailUrl ||
    live.thumbnail ||
    live.imageUrl ||
    "";


  if (image) {

    liveThumbnail.src =
      image;

    liveThumbnail.classList.remove(
      "hidden"
    );

    liveThumbnailFallback.classList.add(
      "hidden"
    );

  } else {

    liveThumbnail.classList.add(
      "hidden"
    );

    liveThumbnailFallback.classList.remove(
      "hidden"
    );

  }


  const isLive =
    live.status === "live" ||
    live.status === "LIVE" ||
    live.isLive === true;


  if (isLive) {

    liveTime.textContent =
      "Live now";

    joinLiveButton.textContent =
      "JOIN LIVE";

  } else {

    const start =
      parseDateTime(
        live.startDate ||
        live.date ||
        live.scheduledDate,

        live.startTime ||
        live.time
      );


    liveTime.textContent =
      start
        ? `Starts ${start.toLocaleString(
            "en-IN",
            {
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit"
            }
          )}`
        : "Upcoming class";


    joinLiveButton.textContent =
      "VIEW CLASS";

  }


  joinLiveButton.onclick =
    () => {

      const link =
        live.liveUrl ||
        live.meetingUrl ||
        live.joinUrl ||
        live.url;


      if (!link) {

        alert(
          "The live class link has not been added yet."
        );

        return;

      }


      window.location.href =
        link;

    };

}


/* =========================================
   HIDE LIVE
========================================= */

function hideLiveClass() {

  liveClassSection.classList.add(
    "hidden"
  );

  currentLiveClass =
    null;

}


/* =========================================
   DATE + TIME
========================================= */

function parseDateTime(
  dateValue,
  timeValue
) {

  if (!dateValue) {
    return null;
  }


  const date =
    normalizeDate(
      dateValue
    );


  if (!date) {
    return null;
  }


  const time =
    timeValue || "00:00";


  const parsed =
    new Date(
      `${date}T${time}`
    );


  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {

    return null;

  }


  return parsed;

}


/* =========================================
   RECORDINGS
========================================= */

recordingsButton.addEventListener(
  "click",
  () => {

    window.location.href =
      `../live-recordings/?courseId=${
        encodeURIComponent(courseId)
      }`;

  }
);


/* =========================================
   BACK
========================================= */

backButton.addEventListener(
  "click",
  () => {

    window.history.back();

  }
);


errorBackButton.addEventListener(
  "click",
  () => {

    window.history.back();

  }
);

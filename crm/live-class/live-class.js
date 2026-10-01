import { auth } from "../../firebase/firebase-config.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getFunctions,
  httpsCallable
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-functions.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const ALLOWED_EMAIL = "zenovaeducations@gmail.com";

const db = getFirestore();
const functions = getFunctions(undefined, "asia-south1");

const createZoomMeeting = httpsCallable(
  functions,
  "createZoomMeeting"
);

const form = document.getElementById("liveClassForm");

const courseSelect = document.getElementById("course");
const subjectSelect = document.getElementById("subject");
const chapterSelect = document.getElementById("chapter");

const titleInput = document.getElementById("title");
const facultyInput = document.getElementById("faculty");
const dateInput = document.getElementById("date");
const timeInput = document.getElementById("time");
const durationInput = document.getElementById("duration");
const thumbnailInput = document.getElementById("thumbnail");

const message = document.getElementById("message");
const saveButton = document.getElementById("saveButton");
const saveText = document.getElementById("saveText");

let courses = [];
let subjects = [];
let chapters = [];

let currentUser = null;

/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../../login/";
    return;
  }

if (
  !user.email ||
  user.email.toLowerCase().trim() !== ALLOWED_EMAIL.toLowerCase().trim()
) {
    document.body.innerHTML = `
      <div style="
        min-height:100vh;
        display:flex;
        align-items:center;
        justify-content:center;
        font-family:Arial,sans-serif;
        background:#f5f7fb;
      ">
        <div style="
          background:white;
          padding:40px;
          border-radius:20px;
          text-align:center;
          box-shadow:0 10px 40px rgba(0,0,0,.08);
        ">
          <h2>Access Denied</h2>
          <p>This page is restricted to the Zenova administrator.</p>
        </div>
      </div>
    `;
    return;
  }

  currentUser = user;

  await loadCourses();
});

/* =========================================================
   HELPERS
========================================================= */

function showMessage(text, type = "info") {
  if (!message) return;

  message.textContent = text;

  message.className = "message";

  if (type === "success") {
    message.classList.add("success");
  }

  if (type === "error") {
    message.classList.add("error");
  }
}

function setLoading(loading) {
  if (!saveButton) return;

  saveButton.disabled = loading;

  if (saveText) {
    saveText.textContent = loading
      ? "Creating Zoom Class..."
      : "Create Live Class";
  }
}

function resetSelect(select, text) {
  if (!select) return;

  select.innerHTML = `
    <option value="">${text}</option>
  `;

  select.disabled = true;
}

/* =========================================================
   LOAD COURSES
========================================================= */

async function loadCourses() {
  try {
    showMessage("Loading courses...");

    const snapshot = await getDocs(
      collection(db, "zen2Courses")
    );

    courses = [];

    snapshot.forEach((item) => {
      courses.push({
        id: item.id,
        ...item.data()
      });
    });

    courses.sort((a, b) =>
      String(a.name || a.title || "")
        .localeCompare(
          String(b.name || b.title || "")
        )
    );

    courseSelect.innerHTML = `
      <option value="">Select Course</option>
    `;

    courses.forEach((course) => {
      const option = document.createElement("option");

      option.value = course.id;

      option.textContent =
        course.name ||
        course.title ||
        course.courseName ||
        course.id;

      courseSelect.appendChild(option);
    });

    courseSelect.disabled = false;

    showMessage("");
  } catch (error) {
    console.error("COURSE LOAD ERROR:", error);

    showMessage(
      "Unable to load courses.",
      "error"
    );
  }
}

/* =========================================================
   COURSE CHANGE
========================================================= */

courseSelect?.addEventListener("change", async () => {
  const courseId = courseSelect.value;

  resetSelect(
    subjectSelect,
    "Select Subject"
  );

  resetSelect(
    chapterSelect,
    "Select Chapter"
  );

  if (!courseId) return;

  await loadSubjects(courseId);
});

/* =========================================================
   LOAD SUBJECTS
========================================================= */

async function loadSubjects(courseId) {
  try {
    showMessage("Loading subjects...");

    const snapshot = await getDocs(
      collection(db, "zen2Subjects")
    );

    subjects = [];

    snapshot.forEach((item) => {
      const data = item.data();

      const relatedCourse =
        data.courseId ||
        data.courseID ||
        data.course;

      if (
        relatedCourse === courseId
      ) {
        subjects.push({
          id: item.id,
          ...data
        });
      }
    });

    subjects.sort((a, b) =>
      String(a.name || a.title || "")
        .localeCompare(
          String(b.name || b.title || "")
        )
    );

    subjectSelect.innerHTML = `
      <option value="">Select Subject</option>
    `;

    subjects.forEach((subject) => {
      const option = document.createElement("option");

      option.value = subject.id;

      option.textContent =
        subject.name ||
        subject.title ||
        subject.subjectName ||
        subject.id;

      subjectSelect.appendChild(option);
    });

    subjectSelect.disabled = false;

    showMessage("");
  } catch (error) {
    console.error("SUBJECT LOAD ERROR:", error);

    showMessage(
      "Unable to load subjects.",
      "error"
    );
  }
}

/* =========================================================
   SUBJECT CHANGE
========================================================= */

subjectSelect?.addEventListener("change", async () => {
  const subjectId = subjectSelect.value;

  resetSelect(
    chapterSelect,
    "Select Chapter"
  );

  if (!subjectId) return;

  await loadChapters(subjectId);
});

/* =========================================================
   LOAD CHAPTERS
========================================================= */

async function loadChapters(subjectId) {
  try {
    showMessage("Loading chapters...");

    const snapshot = await getDocs(
      collection(db, "zen2Chapters")
    );

    chapters = [];

    snapshot.forEach((item) => {
      const data = item.data();

      const relatedSubject =
        data.subjectId ||
        data.subjectID ||
        data.subject;

      if (
        relatedSubject === subjectId
      ) {
        chapters.push({
          id: item.id,
          ...data
        });
      }
    });

    chapters.sort((a, b) =>
      String(a.name || a.title || "")
        .localeCompare(
          String(b.name || b.title || "")
        )
    );

    chapterSelect.innerHTML = `
      <option value="">Select Chapter</option>
    `;

    chapters.forEach((chapter) => {
      const option = document.createElement("option");

      option.value = chapter.id;

      option.textContent =
        chapter.name ||
        chapter.title ||
        chapter.chapterName ||
        chapter.id;

      chapterSelect.appendChild(option);
    });

    chapterSelect.disabled = false;

    showMessage("");
  } catch (error) {
    console.error("CHAPTER LOAD ERROR:", error);

    showMessage(
      "Unable to load chapters.",
      "error"
    );
  }
}

/* =========================================================
   AUTO TITLE
========================================================= */

function getSelectedText(select) {
  if (!select || !select.value) return "";

  const option =
    select.options[select.selectedIndex];

  return option?.textContent?.trim() || "";
}

function generateTitle() {
  const courseName = getSelectedText(courseSelect);
  const subjectName = getSelectedText(subjectSelect);
  const chapterName = getSelectedText(chapterSelect);

  const parts = [
    courseName,
    subjectName,
    chapterName
  ].filter(Boolean);

  if (parts.length > 0) {
    return parts.join(" - ");
  }

  return "";
}

[
  courseSelect,
  subjectSelect,
  chapterSelect
].forEach((select) => {
  select?.addEventListener(
    "change",
    () => {
      if (
        !titleInput.value.trim()
      ) {
        titleInput.value =
          generateTitle();
      }
    }
  );
});

/* =========================================================
   CREATE LIVE CLASS
========================================================= */

form?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    if (!currentUser) {
      showMessage(
        "Please login again.",
        "error"
      );
      return;
    }

    const courseId =
      courseSelect.value.trim();

    const subjectId =
      subjectSelect.value.trim();

    const chapterId =
      chapterSelect.value.trim();

    const scheduledDate =
      dateInput.value.trim();

    const scheduledTime =
      timeInput.value.trim();

    const duration =
      Number(durationInput.value);

    const faculty =
      facultyInput.value.trim();

    const thumbnail =
      thumbnailInput.value.trim();

    let title =
      titleInput.value.trim();

    if (!title) {
      title = generateTitle();
    }

    /* -----------------------------------------
       VALIDATION
    ----------------------------------------- */

    if (!courseId) {
      showMessage(
        "Please select a course.",
        "error"
      );
      return;
    }

    if (!subjectId) {
      showMessage(
        "Please select a subject.",
        "error"
      );
      return;
    }

    if (!chapterId) {
      showMessage(
        "Please select a chapter.",
        "error"
      );
      return;
    }

    if (!title) {
      showMessage(
        "Please enter a class title.",
        "error"
      );
      return;
    }

    if (!scheduledDate) {
      showMessage(
        "Please select the class date.",
        "error"
      );
      return;
    }

    if (!scheduledTime) {
      showMessage(
        "Please select the class time.",
        "error"
      );
      return;
    }

    if (
      !duration ||
      duration <= 0
    ) {
      showMessage(
        "Please enter a valid duration.",
        "error"
      );
      return;
    }

    if (!faculty) {
      showMessage(
        "Please enter faculty name.",
        "error"
      );
      return;
    }

    /* -----------------------------------------
       START
    ----------------------------------------- */

    try {
      setLoading(true);

      showMessage(
        "Creating Zoom meeting..."
      );

      /*
       * Backend reads the Zoom credentials
       * from:
       *
       * systemConfig/zoom
       *
       * Browser never receives the credentials.
       */

      const zoomResult =
        await createZoomMeeting({
          title,
          scheduledDate,
          scheduledTime,
          duration
        });

      const zoom =
        zoomResult.data || {};

      if (!zoom.meetingId) {
        throw new Error(
          "Zoom meeting was not created."
        );
      }

      showMessage(
        "Zoom meeting created. Saving class..."
      );

      /* -----------------------------------------
         SAVE LIVE CLASS
      ----------------------------------------- */

      const liveClassData = {
        title,

        courseId,
        subjectId,
        chapterId,

        courseName:
          getSelectedText(courseSelect),

        subjectName:
          getSelectedText(subjectSelect),

        chapterName:
          getSelectedText(chapterSelect),

        faculty,

        scheduledDate,
        scheduledTime,

        duration,

        thumbnail,

        status: "scheduled",

        zoomMeetingId:
          zoom.meetingId || "",

        zoomMeetingNumber:
          zoom.meetingNumber || "",

        zoomPassword:
          zoom.password || "",

        zoomJoinUrl:
          zoom.joinUrl || "",

        zoomStartUrl:
          zoom.startUrl || "",

        zoomCreated: true,

        createdBy:
          currentUser.uid,

        createdByEmail:
          currentUser.email,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()
      };

      const liveClassRef =
        await addDoc(
          collection(
            db,
            "liveClasses"
          ),
          liveClassData
        );

      console.log(
        "LIVE CLASS CREATED:",
        liveClassRef.id
      );

      showMessage(
        "Live class created successfully.",
        "success"
      );

      /* -----------------------------------------
         RESET FORM
      ----------------------------------------- */

      form.reset();

      resetSelect(
        subjectSelect,
        "Select Subject"
      );

      resetSelect(
        chapterSelect,
        "Select Chapter"
      );

      setLoading(false);

    } catch (error) {
      console.error(
        "LIVE CLASS CREATION ERROR:",
        error
      );

      let errorMessage =
        "Unable to create live class.";

      if (
        error?.message
      ) {
        errorMessage =
          error.message;
      }

      if (
        error?.details?.message
      ) {
        errorMessage =
          error.details.message;
      }

      showMessage(
        errorMessage,
        "error"
      );

      setLoading(false);
    }
  }
);

import {
  getFunctions,
  httpsCallable
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-functions.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const db = getFirestore();

const functions = getFunctions(
  undefined,
  "asia-south1"
);

const createZoomMeeting = httpsCallable(
  functions,
  "createZoomMeeting"
);

const form =
  document.getElementById("liveClassForm");

const courseSelect =
  document.getElementById("course");

const subjectSelect =
  document.getElementById("subject");

const chapterSelect =
  document.getElementById("chapter");

const titleInput =
  document.getElementById("title");

const facultyInput =
  document.getElementById("faculty");

const dateInput =
  document.getElementById("date");

const timeInput =
  document.getElementById("time");

const durationInput =
  document.getElementById("duration");

const thumbnailInput =
  document.getElementById("thumbnail");

const message =
  document.getElementById("message");

const saveButton =
  document.getElementById("saveButton");

const saveText =
  document.getElementById("saveText");

let courses = [];
let subjects = [];
let chapters = [];


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(text, type = "") {

  if (!message) return;

  message.textContent = text;

  message.className = "message";

  if (type) {
    message.classList.add(type);
  }
}


/* =========================================================
   LOADING
========================================================= */

function setLoading(loading) {

  if (saveButton) {
    saveButton.disabled = loading;
  }

  if (saveText) {
    saveText.textContent = loading
      ? "Creating Zoom Class..."
      : "Create Live Class";
  }
}


/* =========================================================
   SELECT RESET
========================================================= */

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
      String(
        a.name ||
        a.title ||
        a.courseName ||
        ""
      ).localeCompare(
        String(
          b.name ||
          b.title ||
          b.courseName ||
          ""
        )
      )
    );

    courseSelect.innerHTML = `
      <option value="">Select Course</option>
    `;

    courses.forEach((course) => {

      const option =
        document.createElement("option");

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

    console.error(
      "COURSE LOAD ERROR:",
      error
    );

    showMessage(
      "Unable to load courses.",
      "error"
    );

  }

}


/* =========================================================
   COURSE CHANGE
========================================================= */

courseSelect?.addEventListener(
  "change",
  async () => {

    const courseId =
      courseSelect.value;

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

    autoGenerateTitle();

  }
);


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

      if (relatedCourse === courseId) {

        subjects.push({
          id: item.id,
          ...data
        });

      }

    });

    subjects.sort((a, b) =>
      String(
        a.name ||
        a.title ||
        a.subjectName ||
        ""
      ).localeCompare(
        String(
          b.name ||
          b.title ||
          b.subjectName ||
          ""
        )
      )
    );

    subjectSelect.innerHTML = `
      <option value="">Select Subject</option>
    `;

    subjects.forEach((subject) => {

      const option =
        document.createElement("option");

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

    console.error(
      "SUBJECT LOAD ERROR:",
      error
    );

    showMessage(
      "Unable to load subjects.",
      "error"
    );

  }

}


/* =========================================================
   SUBJECT CHANGE
========================================================= */

subjectSelect?.addEventListener(
  "change",
  async () => {

    const subjectId =
      subjectSelect.value;

    resetSelect(
      chapterSelect,
      "Select Chapter"
    );

    if (!subjectId) return;

    await loadChapters(subjectId);

    autoGenerateTitle();

  }
);


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

      if (relatedSubject === subjectId) {

        chapters.push({
          id: item.id,
          ...data
        });

      }

    });

    chapters.sort((a, b) =>
      String(
        a.name ||
        a.title ||
        a.chapterName ||
        ""
      ).localeCompare(
        String(
          b.name ||
          b.title ||
          b.chapterName ||
          ""
        )
      )
    );

    chapterSelect.innerHTML = `
      <option value="">Select Chapter</option>
    `;

    chapters.forEach((chapter) => {

      const option =
        document.createElement("option");

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

    console.error(
      "CHAPTER LOAD ERROR:",
      error
    );

    showMessage(
      "Unable to load chapters.",
      "error"
    );

  }

}


/* =========================================================
   GET SELECTED TEXT
========================================================= */

function getSelectedText(select) {

  if (
    !select ||
    !select.value
  ) {
    return "";
  }

  return (
    select.options[
      select.selectedIndex
    ]?.textContent?.trim() || ""
  );

}


/* =========================================================
   AUTO TITLE
========================================================= */

function autoGenerateTitle() {

  if (
    titleInput &&
    titleInput.value.trim()
  ) {
    return;
  }

  const course =
    getSelectedText(courseSelect);

  const subject =
    getSelectedText(subjectSelect);

  const chapter =
    getSelectedText(chapterSelect);

  const parts = [
    course,
    subject,
    chapter
  ].filter(Boolean);

  if (parts.length) {
    titleInput.value =
      parts.join(" - ");
  }

}


/* =========================================================
   CHAPTER CHANGE
========================================================= */

chapterSelect?.addEventListener(
  "change",
  () => {
    autoGenerateTitle();
  }
);


/* =========================================================
   CREATE LIVE CLASS
========================================================= */

form?.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    const courseId =
      courseSelect.value.trim();

    const subjectId =
      subjectSelect.value.trim();

    const chapterId =
      chapterSelect.value.trim();

    let title =
      titleInput.value.trim();

    const faculty =
      facultyInput.value.trim();

    const scheduledDate =
      dateInput.value.trim();

    const scheduledTime =
      timeInput.value.trim();

    const duration =
      Number(durationInput.value);

    const thumbnail =
      thumbnailInput.value.trim();


    /* =========================================
       VALIDATION
    ========================================= */

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

      autoGenerateTitle();

      title =
        titleInput.value.trim();

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


    /* =========================================
       CREATE ZOOM MEETING
    ========================================= */

    try {

      setLoading(true);

      showMessage(
        "Connecting to Zoom..."
      );

      const result =
        await createZoomMeeting({

          title,

          scheduledDate,

          scheduledTime,

          duration

        });


      const zoom =
        result.data || {};


      console.log(
        "ZOOM RESPONSE:",
        zoom
      );


      if (!zoom.meetingId) {

        throw new Error(
          "Zoom meeting was not created."
        );

      }


      showMessage(
        "Zoom meeting created. Saving live class..."
      );


      /* =========================================
         SAVE LIVE CLASS
      ========================================= */

      const liveClass = {

        title,

        courseId,

        subjectId,

        chapterId,

        courseName:
          getSelectedText(
            courseSelect
          ),

        subjectName:
          getSelectedText(
            subjectSelect
          ),

        chapterName:
          getSelectedText(
            chapterSelect
          ),

        faculty,

        scheduledDate,

        scheduledTime,

        duration,

        thumbnail,

        status:
          "scheduled",

        zoomCreated:
          true,

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

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      };


      const docRef =
        await addDoc(
          collection(
            db,
            "liveClasses"
          ),
          liveClass
        );


      console.log(
        "LIVE CLASS ID:",
        docRef.id
      );


      console.log(
        "ZOOM MEETING:",
        zoom
      );


      showMessage(
        "Live class created successfully.",
        "success"
      );


      /* =========================================
         RESET
      ========================================= */

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
        "CREATE LIVE CLASS ERROR:",
        error
      );


      console.error(
        "ERROR DETAILS:",
        error?.details
      );


      let errorMessage =
        "Unable to create live class.";


      if (
        error?.details?.message
      ) {

        errorMessage =
          error.details.message;

      } else if (
        error?.message
      ) {

        errorMessage =
          error.message;

      }


      showMessage(
        errorMessage,
        "error"
      );


      setLoading(false);

    }

  }
);


/* =========================================================
   START
========================================================= */

loadCourses();

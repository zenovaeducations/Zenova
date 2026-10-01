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


/* =========================================================
   FIREBASE
========================================================= */

const db = getFirestore();

const functions = getFunctions(
  undefined,
  "asia-south1"
);

const createZoomMeeting = httpsCallable(
  functions,
  "createZoomMeeting"
);


/* =========================================================
   ELEMENTS
========================================================= */

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


/* =========================================================
   DATA
========================================================= */

let courses = [];
let subjects = [];
let chapters = [];


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
  text,
  type = ""
) {

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

function setLoading(
  loading
) {

  if (saveButton) {
    saveButton.disabled =
      loading;
  }

  if (saveText) {

    saveText.textContent =
      loading
        ? "Creating Zoom Class..."
        : "Create Live Class";

  }

}


/* =========================================================
   RESET SELECT
========================================================= */

function resetSelect(
  select,
  text
) {

  if (!select) return;

  select.innerHTML = `
    <option value="">
      ${text}
    </option>
  `;

  select.disabled = true;

}


/* =========================================================
   GET SELECTED TEXT
========================================================= */

function getSelectedText(
  select
) {

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
   LOAD COURSES
========================================================= */

async function loadCourses() {

  try {

    showMessage(
      "Loading courses..."
    );

    const snapshot =
      await getDocs(
        collection(
          db,
          "zen2Courses"
        )
      );

    courses = [];

    snapshot.forEach(
      (item) => {

        courses.push({
          id: item.id,
          ...item.data()
        });

      }
    );


    courses.sort(
      (a, b) => {

        const aName =
          a.name ||
          a.title ||
          a.courseName ||
          "";

        const bName =
          b.name ||
          b.title ||
          b.courseName ||
          "";

        return String(
          aName
        ).localeCompare(
          String(bName)
        );

      }
    );


    courseSelect.innerHTML = `
      <option value="">
        Select Course
      </option>
    `;


    courses.forEach(
      (course) => {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          course.id;

        option.textContent =
          course.name ||
          course.title ||
          course.courseName ||
          course.id;

        courseSelect.appendChild(
          option
        );

      }
    );


    courseSelect.disabled =
      false;

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
   LOAD SUBJECTS
========================================================= */

async function loadSubjects(
  courseId
) {

  try {

    showMessage(
      "Loading subjects..."
    );

    const snapshot =
      await getDocs(
        collection(
          db,
          "zen2Subjects"
        )
      );

    subjects = [];


    snapshot.forEach(
      (item) => {

        const data =
          item.data();

        const relatedCourse =
          data.courseId ||
          data.courseID ||
          data.course;

        if (
          relatedCourse ===
          courseId
        ) {

          subjects.push({
            id: item.id,
            ...data
          });

        }

      }
    );


    subjects.sort(
      (a, b) => {

        const aName =
          a.name ||
          a.title ||
          a.subjectName ||
          "";

        const bName =
          b.name ||
          b.title ||
          b.subjectName ||
          "";

        return String(
          aName
        ).localeCompare(
          String(bName)
        );

      }
    );


    subjectSelect.innerHTML = `
      <option value="">
        Select Subject
      </option>
    `;


    subjects.forEach(
      (subject) => {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          subject.id;

        option.textContent =
          subject.name ||
          subject.title ||
          subject.subjectName ||
          subject.id;

        subjectSelect.appendChild(
          option
        );

      }
    );


    subjectSelect.disabled =
      false;

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
   LOAD CHAPTERS
========================================================= */

async function loadChapters(
  subjectId
) {

  try {

    showMessage(
      "Loading chapters..."
    );

    const snapshot =
      await getDocs(
        collection(
          db,
          "zen2Chapters"
        )
      );

    chapters = [];


    snapshot.forEach(
      (item) => {

        const data =
          item.data();

        const relatedSubject =
          data.subjectId ||
          data.subjectID ||
          data.subject;

        if (
          relatedSubject ===
          subjectId
        ) {

          chapters.push({
            id: item.id,
            ...data
          });

        }

      }
    );


    chapters.sort(
      (a, b) => {

        const aName =
          a.name ||
          a.title ||
          a.chapterName ||
          "";

        const bName =
          b.name ||
          b.title ||
          b.chapterName ||
          "";

        return String(
          aName
        ).localeCompare(
          String(bName)
        );

      }
    );


    chapterSelect.innerHTML = `
      <option value="">
        Select Chapter
      </option>
    `;


    chapters.forEach(
      (chapter) => {

        const option =
          document.createElement(
            "option"
          );

        option.value =
          chapter.id;

        option.textContent =
          chapter.name ||
          chapter.title ||
          chapter.chapterName ||
          chapter.id;

        chapterSelect.appendChild(
          option
        );

      }
    );


    chapterSelect.disabled =
      false;

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
   AUTO TITLE
========================================================= */

function generateTitle() {

  const course =
    getSelectedText(
      courseSelect
    );

  const subject =
    getSelectedText(
      subjectSelect
    );

  const chapter =
    getSelectedText(
      chapterSelect
    );

  return [
    course,
    subject,
    chapter
  ]
    .filter(Boolean)
    .join(" - ");

}


function autoGenerateTitle() {

  if (
    titleInput.value.trim()
  ) {
    return;
  }

  const title =
    generateTitle();

  if (title) {
    titleInput.value =
      title;
  }

}


/* =========================================================
   COURSE CHANGE
========================================================= */

courseSelect.addEventListener(
  "change",
  async () => {

    resetSelect(
      subjectSelect,
      "Select Subject"
    );

    resetSelect(
      chapterSelect,
      "Select Chapter"
    );

    if (
      !courseSelect.value
    ) {
      return;
    }

    await loadSubjects(
      courseSelect.value
    );

    autoGenerateTitle();

  }
);


/* =========================================================
   SUBJECT CHANGE
========================================================= */

subjectSelect.addEventListener(
  "change",
  async () => {

    resetSelect(
      chapterSelect,
      "Select Chapter"
    );

    if (
      !subjectSelect.value
    ) {
      return;
    }

    await loadChapters(
      subjectSelect.value
    );

    autoGenerateTitle();

  }
);


/* =========================================================
   CHAPTER CHANGE
========================================================= */

chapterSelect.addEventListener(
  "change",
  () => {

    autoGenerateTitle();

  }
);


/* =========================================================
   FORM SUBMIT
========================================================= */

form.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    /* ---------------------------------------------
       VALUES
    --------------------------------------------- */

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
      Number(
        durationInput.value
      );

    const thumbnail =
      thumbnailInput.value.trim();


    /* ---------------------------------------------
       AUTO TITLE
    --------------------------------------------- */

    if (!title) {

      title =
        generateTitle();

    }


    /* ---------------------------------------------
       VALIDATION
    --------------------------------------------- */

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


    if (!faculty) {

      showMessage(
        "Please enter faculty name.",
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


    /* ---------------------------------------------
       CREATE ZOOM
    --------------------------------------------- */

    try {

      setLoading(true);

      showMessage(
        "Creating Zoom meeting..."
      );


      const result =
        await createZoomMeeting({

          title,

          scheduledDate,

          scheduledTime,

          duration

        });


      console.log(
        "ZOOM RESPONSE:",
        result
      );


      const zoom =
        result.data || {};


      if (
        !zoom.meetingId
      ) {

        throw new Error(
          "Zoom meeting was not created."
        );

      }


      /* ---------------------------------------------
         SAVE FIRESTORE
      --------------------------------------------- */

      showMessage(
        "Zoom meeting created. Saving class..."
      );


      const liveClassData = {

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


      console.log(
        "ZOOM MEETING:",
        zoom
      );


      /* ---------------------------------------------
         SUCCESS
      --------------------------------------------- */

      showMessage(
        "Live class created successfully.",
        "success"
      );


      form.reset();


      resetSelect(
        subjectSelect,
        "Select Subject"
      );


      resetSelect(
        chapterSelect,
        "Select Chapter"
      );


    } catch (error) {

      console.error(
        "LIVE CLASS ERROR:",
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

    } finally {

      setLoading(false);

    }

  }
);


/* =========================================================
   INITIAL LOAD
========================================================= */

loadCourses();

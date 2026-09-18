import { db } from "../../firebase/firebase-config.js";

import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   ELEMENTS
========================================================= */

const courseSelect =
  document.getElementById("courseSelect");

const subjectSelect =
  document.getElementById("subjectSelect");

const contentArea =
  document.getElementById("contentArea");

const emptyState =
  document.getElementById("emptyState");

const selectedSubjectName =
  document.getElementById("selectedSubjectName");

const selectedCourseName =
  document.getElementById("selectedCourseName");

const chaptersContainer =
  document.getElementById("chaptersContainer");

const addChapterBtn =
  document.getElementById("addChapterBtn");


/* MODALS */

const chapterModal =
  document.getElementById("chapterModal");

const contentModal =
  document.getElementById("contentModal");


/* CHAPTER FORM */

const chapterForm =
  document.getElementById("chapterForm");

const chapterNumber =
  document.getElementById("chapterNumber");

const chapterName =
  document.getElementById("chapterName");

const chapterDescription =
  document.getElementById("chapterDescription");


/* CONTENT FORM */

const contentForm =
  document.getElementById("contentForm");

const contentType =
  document.getElementById("contentType");

const contentTitle =
  document.getElementById("contentTitle");

const videoUrl =
  document.getElementById("videoUrl");

const pdfUrl =
  document.getElementById("pdfUrl");

const contentDescription =
  document.getElementById("contentDescription");

const contentOrder =
  document.getElementById("contentOrder");

const videoFields =
  document.getElementById("videoFields");

const noteFields =
  document.getElementById("noteFields");


/* =========================================================
   STATE
========================================================= */

let selectedCourse = null;
let selectedSubject = null;
let selectedChapter = null;


/* =========================================================
   INIT
========================================================= */

loadCourses();


/* =========================================================
   LOAD COURSES
========================================================= */

async function loadCourses() {

  try {

    courseSelect.innerHTML =
      `<option value="">Select a batch / course</option>`;

    const snapshot =
      await getDocs(
        collection(db, "crmCourses")
      );


    snapshot.forEach(docSnap => {

      const data = docSnap.data();

      const option =
        document.createElement("option");

      option.value = docSnap.id;

      option.textContent =
        data.crmCourseName ||
        data.courseName ||
        data.name ||
        "Unnamed Course";

      courseSelect.appendChild(option);

    });

  } catch (error) {

    console.error(
      "Error loading courses:",
      error
    );

    showToast(
      "Unable to load courses"
    );

  }

}


/* =========================================================
   COURSE SELECT
========================================================= */

courseSelect.addEventListener(
  "change",
  async () => {

    const courseId =
      courseSelect.value;

    selectedCourse = null;
    selectedSubject = null;

    subjectSelect.innerHTML =
      `<option value="">Loading subjects...</option>`;

    subjectSelect.disabled = true;

    contentArea.classList.add("hidden");
    emptyState.classList.remove("hidden");


    if (!courseId) {

      subjectSelect.innerHTML =
        `<option value="">Select a batch first</option>`;

      return;

    }


    try {

      const courseOption =
        courseSelect.options[
          courseSelect.selectedIndex
        ];

      selectedCourse = {
        id: courseId,
        name: courseOption.textContent
      };


      await loadSubjects(courseId);

    } catch (error) {

      console.error(
        "Error loading subjects:",
        error
      );

      showToast(
        "Unable to load subjects"
      );

    }

  }
);


/* =========================================================
   LOAD SUBJECTS
========================================================= */

async function loadSubjects(courseId) {

  subjectSelect.innerHTML =
    `<option value="">Select a subject</option>`;


  const subjectMap = new Map();


  /*
   * Your old app has used both courseId
   * and crmCourseId in hybridSubjects.
   *
   * So we check both.
   */

  const queries = [

    query(
      collection(db, "hybridSubjects"),
      where("courseId", "==", courseId)
    ),

    query(
      collection(db, "hybridSubjects"),
      where("crmCourseId", "==", courseId)
    )

  ];


  for (const q of queries) {

    try {

      const snapshot =
        await getDocs(q);

      snapshot.forEach(docSnap => {

        if (!subjectMap.has(docSnap.id)) {

          subjectMap.set(
            docSnap.id,
            {
              id: docSnap.id,
              ...docSnap.data()
            }
          );

        }

      });

    } catch (error) {

      console.warn(
        "Subject query failed:",
        error
      );

    }

  }


  if (subjectMap.size === 0) {

    subjectSelect.innerHTML =
      `<option value="">No subjects found</option>`;

    return;

  }


  Array.from(subjectMap.values())
    .sort((a, b) => {

      const aName =
        a.subjectName ||
        a.name ||
        a.title ||
        "";

      const bName =
        b.subjectName ||
        b.name ||
        a.title ||
        "";

      return aName.localeCompare(bName);

    })
    .forEach(subject => {

      const option =
        document.createElement("option");

      option.value =
        subject.id;

      option.textContent =
        subject.subjectName ||
        subject.name ||
        subject.title ||
        "Unnamed Subject";

      subjectSelect.appendChild(option);

    });


  subjectSelect.disabled = false;

}


/* =========================================================
   SUBJECT SELECT
========================================================= */

subjectSelect.addEventListener(
  "change",
  async () => {

    const subjectId =
      subjectSelect.value;

    if (!subjectId) {

      contentArea.classList.add("hidden");
      emptyState.classList.remove("hidden");

      return;

    }


    selectedSubject = {
      id: subjectId,
      name:
        subjectSelect.options[
          subjectSelect.selectedIndex
        ].textContent
    };


    selectedSubjectName.textContent =
      selectedSubject.name;

    selectedCourseName.textContent =
      selectedCourse?.name || "";


    emptyState.classList.add("hidden");
    contentArea.classList.remove("hidden");


    await loadChapters();

  }
);


/* =========================================================
   LOAD CHAPTERS
========================================================= */

async function loadSubjects(courseId) {

  subjectSelect.innerHTML =
    `<option value="">Select a subject</option>`;

  subjectSelect.disabled = true;

  const subjectMap = new Map();

  const queries = [

    query(
      collection(db, "hybridSubjects"),
      where("courseId", "==", courseId)
    ),

    query(
      collection(db, "hybridSubjects"),
      where("crmCourseId", "==", courseId)
    )

  ];

  for (const q of queries) {

    try {

      const snapshot = await getDocs(q);

      snapshot.forEach(docSnap => {

        const data = docSnap.data();

        const subjectName =
          data.subjectName ||
          data.name ||
          data.title ||
          data.crmSubjectName ||
          "";

        const cleanName =
          subjectName
            .trim()
            .replace(/\s+/g, " ")
            .toLowerCase();

        if (!cleanName) return;

        /*
         * IMPORTANT:
         * Same subject name = same logical subject
         */
        if (!subjectMap.has(cleanName)) {

          subjectMap.set(cleanName, {
            id: docSnap.id,
            ...data,
            displayName: subjectName.trim()
          });

        }

      });

    } catch (error) {

      console.warn(
        "Subject query failed:",
        error
      );

    }

  }


  const subjects =
    Array.from(subjectMap.values())
      .sort((a, b) =>
        a.displayName.localeCompare(
          b.displayName
        )
      );


  if (!subjects.length) {

    subjectSelect.innerHTML =
      `<option value="">No subjects found</option>`;

    return;

  }


  subjects.forEach(subject => {

    const option =
      document.createElement("option");

    option.value =
      subject.id;

    option.textContent =
      subject.displayName;

    subjectSelect.appendChild(option);

  });


  subjectSelect.disabled = false;
}
/* =========================================================
   CREATE CHAPTER CARD
========================================================= */

async function createChapterCard(chapter) {

  const card =
    document.createElement("div");

  card.className =
    "chapter-card";


  card.innerHTML = `

    <div class="chapter-header">

      <div class="chapter-left">

        <div class="chapter-number">
          ${escapeHtml(
            chapter.chapterNumber || ""
          )}
        </div>

        <div>

          <div class="chapter-title">
            ${escapeHtml(
              chapter.chapterName ||
              chapter.name ||
              "Untitled Chapter"
            )}
          </div>

          <div class="chapter-description">
            ${escapeHtml(
              chapter.description || ""
            )}
          </div>

        </div>

      </div>


      <div class="chapter-actions">

        <button
          class="small-btn add-video-btn"
        >
          + Video
        </button>

        <button
          class="small-btn add-note-btn"
        >
          + Notes
        </button>

      </div>

    </div>


    <div class="chapter-content">

      <div class="no-content">
        Loading content...
      </div>

    </div>
  `;


  const contentContainer =
    card.querySelector(
      ".chapter-content"
    );


  card
    .querySelector(".add-video-btn")
    .addEventListener(
      "click",
      () => {

        openContentModal(
          chapter,
          "VIDEO"
        );

      }
    );


  card
    .querySelector(".add-note-btn")
    .addEventListener(
      "click",
      () => {

        openContentModal(
          chapter,
          "NOTE"
        );

      }
    );


  await loadChapterContent(
    chapter,
    contentContainer
  );


  return card;

}


/* =========================================================
   LOAD CHAPTER CONTENT
========================================================= */

async function loadChapterContent(
  chapter,
  container
) {

  try {

    const q =
      query(
        collection(db, "hybridContent"),

        where(
          "courseId",
          "==",
          selectedCourse.id
        ),

        where(
          "subjectId",
          "==",
          selectedSubject.id
        ),

        where(
          "chapterId",
          "==",
          chapter.id
        )
      );


    const snapshot =
      await getDocs(q);


    const contents =
      snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));


    contents.sort(
      (a, b) =>
        Number(a.order || 0) -
        Number(b.order || 0)
    );


    if (!contents.length) {

      container.innerHTML = `
        <div class="no-content">
          No videos or notes added yet.
        </div>
      `;

      return;

    }


    container.innerHTML = "";


    contents.forEach(content => {

      const item =
        document.createElement("div");

      item.className =
        "content-item";


      const isVideo =
        content.contentType === "VIDEO";


      item.innerHTML = `

        <div class="content-info">

          <div class="content-icon">
            ${isVideo ? "▶" : "PDF"}
          </div>

          <div>

            <div class="content-title">
              ${escapeHtml(
                content.title ||
                "Untitled Content"
              )}
            </div>

            <div class="content-type">
              ${isVideo
                ? "Video"
                : "Notes / PDF"}
            </div>

          </div>

        </div>

      `;


      container.appendChild(item);

    });


  } catch (error) {

    console.error(
      "Error loading chapter content:",
      error
    );

    container.innerHTML = `
      <div class="no-content">
        Unable to load content.
      </div>
    `;

  }

}


/* =========================================================
   ADD CHAPTER
========================================================= */

addChapterBtn.addEventListener(
  "click",
  () => {

    if (
      !selectedCourse ||
      !selectedSubject
    ) {

      showToast(
        "Select a batch and subject first"
      );

      return;

    }


    chapterForm.reset();

    chapterModal.classList.remove(
      "hidden"
    );

  }
);


chapterForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    if (
      !selectedCourse ||
      !selectedSubject
    ) {

      showToast(
        "Select a batch and subject"
      );

      return;

    }


    const name =
      chapterName.value.trim();

    const number =
      Number(
        chapterNumber.value
      );


    if (!name || !number) {

      showToast(
        "Enter chapter number and name"
      );

      return;

    }


    try {

      await addDoc(
        collection(
          db,
          "hybridChapters"
        ),
        {

          courseId:
            selectedCourse.id,

          courseName:
            selectedCourse.name,

          subjectId:
            selectedSubject.id,

          subjectName:
            selectedSubject.name,

          chapterNumber:
            number,

          chapterName:
            name,

          description:
            chapterDescription.value.trim(),

          active: true,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        }
      );


      closeChapterModal();

      showToast(
        "Chapter added successfully"
      );


      await loadChapters();


    } catch (error) {

      console.error(
        "Error creating chapter:",
        error
      );

      showToast(
        "Failed to create chapter"
      );

    }

  }
);


/* =========================================================
   OPEN CONTENT MODAL
========================================================= */

function openContentModal(
  chapter,
  type
) {

  selectedChapter =
    chapter;


  contentForm.reset();


  contentType.value =
    type;


  toggleContentFields();


  document.getElementById(
    "contentModalTitle"
  ).textContent =
    type === "VIDEO"
      ? "Add Video"
      : "Add Notes";


  contentModal.classList.remove(
    "hidden"
  );

}


/* =========================================================
   CONTENT TYPE CHANGE
========================================================= */

contentType.addEventListener(
  "change",
  toggleContentFields
);


function toggleContentFields() {

  const type =
    contentType.value;


  if (type === "VIDEO") {

    videoFields.classList.remove(
      "hidden"
    );

    noteFields.classList.add(
      "hidden"
    );

  } else {

    videoFields.classList.add(
      "hidden"
    );

    noteFields.classList.remove(
      "hidden"
    );

  }

}


/* =========================================================
   SAVE CONTENT
========================================================= */

contentForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    if (
      !selectedCourse ||
      !selectedSubject ||
      !selectedChapter
    ) {

      showToast(
        "Chapter not selected"
      );

      return;

    }


    const type =
      contentType.value;

    const title =
      contentTitle.value.trim();


    if (!title) {

      showToast(
        "Enter content title"
      );

      return;

    }


    if (
      type === "VIDEO" &&
      !videoUrl.value.trim()
    ) {

      showToast(
        "Enter video URL"
      );

      return;

    }


    if (
      type === "NOTE" &&
      !pdfUrl.value.trim()
    ) {

      showToast(
        "Enter notes/PDF URL"
      );

      return;

    }


    try {

      await addDoc(
        collection(
          db,
          "hybridContent"
        ),
        {

          courseId:
            selectedCourse.id,

          courseName:
            selectedCourse.name,

          subjectId:
            selectedSubject.id,

          subjectName:
            selectedSubject.name,

          chapterId:
            selectedChapter.id,

          chapterName:
            selectedChapter.chapterName ||
            selectedChapter.name ||
            "",

          title,

          contentType:
            type,

          videoUrl:
            type === "VIDEO"
              ? videoUrl.value.trim()
              : "",

          pdfUrl:
            type === "NOTE"
              ? pdfUrl.value.trim()
              : "",

          description:
            contentDescription.value.trim(),

          order:
            Number(
              contentOrder.value || 1
            ),

          active: true,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        }
      );


      closeContentModal();


      showToast(
        type === "VIDEO"
          ? "Video added successfully"
          : "Notes added successfully"
      );


      /*
       * Refresh everything so the new
       * content immediately appears.
       */

      await loadChapters();


    } catch (error) {

      console.error(
        "Error adding content:",
        error
      );

      showToast(
        "Failed to add content"
      );

    }

  }
);


/* =========================================================
   MODAL CLOSE
========================================================= */

document
  .getElementById("closeChapterModal")
  .addEventListener(
    "click",
    closeChapterModal
  );


document
  .getElementById("cancelChapter")
  .addEventListener(
    "click",
    closeChapterModal
  );


function closeChapterModal() {

  chapterModal.classList.add(
    "hidden"
  );

}


document
  .getElementById("closeContentModal")
  .addEventListener(
    "click",
    closeContentModal
  );


document
  .getElementById("cancelContent")
  .addEventListener(
    "click",
    closeContentModal
  );


function closeContentModal() {

  contentModal.classList.add(
    "hidden"
  );

  selectedChapter = null;

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

  const toast =
    document.getElementById("toast");

  toast.textContent =
    message;

  toast.classList.add("show");


  setTimeout(() => {

    toast.classList.remove(
      "show"
    );

  }, 2500);

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

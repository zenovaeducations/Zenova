import { auth, db } from "../../../firebase/firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================
   ELEMENTS
========================================= */

const loadingScreen =
  document.getElementById(
    "loadingScreen"
  );

const app =
  document.getElementById(
    "app"
  );

const subjectName =
  document.getElementById(
    "subjectName"
  );

const subjectDescription =
  document.getElementById(
    "subjectDescription"
  );

const chapterCount =
  document.getElementById(
    "chapterCount"
  );

const chaptersList =
  document.getElementById(
    "chaptersList"
  );

const backBtn =
  document.getElementById(
    "backBtn"
  );


/* =========================================
   STATE
========================================= */

let currentUser = null;

let studentData = null;

let selectedSubjectId = null;

let selectedSubject = null;


/* =========================================
   GET SUBJECT ID
========================================= */

const params =
  new URLSearchParams(
    window.location.search
  );

selectedSubjectId =
  params.get("id");


/* =========================================
   AUTH
========================================= */

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {

      window.location.href =
        "../../../index.html";

      return;
    }


    currentUser = user;


    if (!selectedSubjectId) {

      showError(
        "Subject was not selected."
      );

      finishLoading();

      return;
    }


    try {

      await loadStudent();

      await loadSubject();

      await loadChapters();

      finishLoading();

    } catch (error) {

      console.error(
        "VIEW CHAPTERS ERROR:",
        error
      );

      showError(
        "We couldn't load the chapters right now."
      );

      finishLoading();

    }

  }
);


/* =========================================
   LOAD STUDENT
========================================= */

async function loadStudent() {

  const studentRef =
    doc(
      db,
      "students",
      currentUser.uid
    );


  const snapshot =
    await getDoc(
      studentRef
    );


  if (
    snapshot.exists()
  ) {

    studentData =
      snapshot.data();

  } else {

    studentData = {};

  }

}


/* =========================================
   LOAD SUBJECT
========================================= */

async function loadSubject() {

  const subjectRef =
    doc(
      db,
      "hybridSubjects",
      selectedSubjectId
    );


  const snapshot =
    await getDoc(
      subjectRef
    );


  if (
    !snapshot.exists()
  ) {

    throw new Error(
      "Subject does not exist."
    );

  }


  selectedSubject = {
    id: snapshot.id,
    ...snapshot.data()
  };


  if (
    selectedSubject.active === false
  ) {

    throw new Error(
      "Subject is inactive."
    );

  }


  subjectName.textContent =
    selectedSubject.name ||
    "Subject";


  subjectDescription.textContent =
    selectedSubject.description ||
    "Select a chapter to continue learning.";

}


/* =========================================
   LOAD CHAPTERS
========================================= */

async function loadChapters() {

  chaptersList.innerHTML = `
    <div class="empty">
      Loading chapters...
    </div>
  `;


  const chapterQuery =
    query(
      collection(
        db,
        "hybridChapters"
      ),
      where(
        "subjectId",
        "==",
        selectedSubjectId
      )
    );


  const snapshot =
    await getDocs(
      chapterQuery
    );


  const studentMedium =
    normalizeMedium(
      studentData?.medium
    );


  const chapters = [];


  snapshot.forEach(
    (item) => {

      const data =
        item.data();


      /*
        Inactive chapters are
        not shown to students.
      */

      if (
        data.active === false
      ) {
        return;
      }


      /*
        Medium:

        Missing content medium
        = Kannada

        Both
        = visible to everyone
      */

      const contentMedium =
        normalizeMedium(
          data.medium
        );


      if (
        !mediumAllowed(
          studentMedium,
          contentMedium
        )
      ) {

        return;
      }


      chapters.push({
        id: item.id,
        ...data
      });

    }
  );


  chapters.sort(
    (a, b) => {

      return (
        Number(
          a.chapterNumber || 0
        )
        -
        Number(
          b.chapterNumber || 0
        )
      );

    }
  );


  chapterCount.textContent =
    `${chapters.length} chapter${
      chapters.length === 1
        ? ""
        : "s"
    }`;


  renderChapters(
    chapters
  );

}


/* =========================================
   RENDER CHAPTERS
========================================= */

function renderChapters(
  chapters
) {

  chaptersList.innerHTML = "";


  if (
    !chapters.length
  ) {

    chaptersList.innerHTML = `
      <div class="empty">
        No chapters are available for this subject yet.
      </div>
    `;

    return;
  }


  chapters.forEach(
    (chapter) => {

      const card =
        document.createElement(
          "div"
        );


      const number =
        String(
          chapter.chapterNumber || ""
        ).padStart(
          2,
          "0"
        );


      const title =
        chapter.title ||
        chapter.chapterName ||
        "Untitled Chapter";


      const description =
        chapter.description ||
        "";


      const isLocked =
        chapter.locked === true;


      card.className =
        `chapter-card ${
          isLocked
            ? "locked"
            : "available"
        }`;


      card.innerHTML = `

        <div class="chapter-number">
          ${escapeHtml(number)}
        </div>


        <div class="chapter-info">

          <div class="chapter-title">
            ${escapeHtml(title)}
          </div>

          ${
            description
              ? `
                <div class="chapter-description">
                  ${escapeHtml(description)}
                </div>
              `
              : ""
          }

        </div>


        <div class="chapter-action">

          ${
            isLocked
              ? `
                <span class="locked-label">
                  Locked
                </span>
              `
              : `
                →
              `
          }

        </div>

      `;


      if (!isLocked) {

        card.addEventListener(
          "click",
          () => {

            window.location.href =
              `../viewchapterdetails/?id=${
                encodeURIComponent(
                  chapter.id
                )
              }`;

          }
        );

      }


      chaptersList.appendChild(
        card
      );

    }
  );

}


/* =========================================
   MEDIUM
========================================= */

function normalizeMedium(
  medium
) {

  if (
    medium === "English"
  ) {

    return "English";

  }


  if (
    medium === "Both"
  ) {

    return "Both";

  }


  return "Kannada";

}


function mediumAllowed(
  studentMedium,
  contentMedium
) {

  if (
    contentMedium === "Both"
  ) {

    return true;

  }


  return (
    studentMedium ===
    contentMedium
  );

}


/* =========================================
   BACK
========================================= */

backBtn.addEventListener(
  "click",
  () => {

    window.location.href =
      "../index.html";

  }
);


/* =========================================
   ERROR
========================================= */

function showError(
  message
) {

  chaptersList.innerHTML = `
    <div class="error">
      ${escapeHtml(message)}
    </div>
  `;

}


/* =========================================
   FINISH LOADING
========================================= */

function finishLoading() {

  loadingScreen.classList.add(
    "hidden"
  );

  app.classList.remove(
    "hidden"
  );

}


/* =========================================
   ESCAPE HTML
========================================= */

function escapeHtml(
  value
) {

  return String(value)

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}

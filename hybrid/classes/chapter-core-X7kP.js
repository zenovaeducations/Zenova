import { auth, db } from "../../firebase/firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// ELEMENTS
// =========================================================

const loadingScreen =
  document.getElementById("loadingScreen");

const app =
  document.getElementById("app");

const subjectName =
  document.getElementById("subjectName");

const subjectDescription =
  document.getElementById("subjectDescription");

const chaptersContainer =
  document.getElementById("chaptersContainer");

const emptyState =
  document.getElementById("emptyState");

const chapterCount =
  document.getElementById("chapterCount");

const backBtn =
  document.getElementById("backBtn");


// =========================================================
// URL
// =========================================================

// For now:
//
// chapter.html?id=SUBJECT_ID
//
// We also accept subjectId so the old flow doesn't
// immediately break while we're changing filenames.

const params = new URLSearchParams(window.location.search);

const subjectId =
  params.get("id") ||
  params.get("subjectId");


// =========================================================
// LOADING CONTROL
// =========================================================

function showApp() {

  loadingScreen.classList.add("hidden");

  app.classList.remove("hidden");
}


function showLoading() {

  loadingScreen.classList.remove("hidden");

  app.classList.add("hidden");
}


// =========================================================
// AUTH
// =========================================================

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    window.location.href = "../../index.html";

    return;
  }


  try {

    if (!subjectId) {

      showApp();

      subjectName.textContent = "Subject not found";

      subjectDescription.textContent =
        "The subject information could not be found.";

      return;
    }


    // -----------------------------------------------------
    // LOAD STUDENT
    // -----------------------------------------------------

    const studentSnap =
      await getDoc(
        doc(db, "students", user.uid)
      );

    const student =
      studentSnap.exists()
        ? studentSnap.data()
        : {};


    // -----------------------------------------------------
    // LOAD SUBJECT
    // -----------------------------------------------------

    await loadSubject();


    // -----------------------------------------------------
    // LOAD CHAPTERS
    // -----------------------------------------------------

    await loadChapters(student);


    // -----------------------------------------------------
    // SHOW APP
    // -----------------------------------------------------

    showApp();

  } catch (error) {

    console.error(
      "Chapter page error:",
      error
    );

    showApp();

    subjectName.textContent =
      "Unable to load";

    subjectDescription.textContent =
      "Something went wrong while loading this subject.";
  }

});


// =========================================================
// LOAD SUBJECT
// =========================================================

async function loadSubject() {

  const subjectRef =
    doc(
      db,
      "hybridSubjects",
      subjectId
    );

  const subjectSnap =
    await getDoc(subjectRef);


  if (!subjectSnap.exists()) {

    subjectName.textContent =
      "Subject not found";

    subjectDescription.textContent =
      "";

    return;
  }


  const subject =
    subjectSnap.data();


  subjectName.textContent =
    subject.name ||
    "Subject";


  subjectDescription.textContent =
    subject.description ||
    "Explore the recorded classes for this subject.";
}


// =========================================================
// LOAD CHAPTERS
// =========================================================

async function loadChapters(student) {

  chaptersContainer.innerHTML = "";

  emptyState.classList.add("hidden");


  const chaptersRef =
    collection(db, "hybridChapters");


  const q =
    query(
      chaptersRef,
      where(
        "subjectId",
        "==",
        subjectId
      )
    );


  const snapshot =
    await getDocs(q);


  let chapters =
    snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));


  // -----------------------------------------------------
  // ACTIVE ONLY
  // -----------------------------------------------------

  chapters =
    chapters.filter(
      chapter =>
        chapter.active !== false
    );


  // -----------------------------------------------------
  // MEDIUM FILTER
  //
  // Student medium:
  // Kannada / English
  //
  // Content medium:
  // Kannada / English / Both
  //
  // Missing student medium = Kannada
  // Missing content medium = Kannada
  // -----------------------------------------------------

  const studentMedium =
    student.medium || "Kannada";


  chapters =
    chapters.filter(chapter => {

      const contentMedium =
        chapter.medium || "Kannada";


      if (contentMedium === "Both") {
        return true;
      }


      return contentMedium === studentMedium;

    });


  // -----------------------------------------------------
  // SORT TEXTBOOK ORDER
  // -----------------------------------------------------

  chapters.sort((a, b) => {

    const numberA =
      Number(a.chapterNumber) || 0;

    const numberB =
      Number(b.chapterNumber) || 0;

    return numberA - numberB;

  });


  chapterCount.textContent =
    `${chapters.length} ${
      chapters.length === 1
        ? "Chapter"
        : "Chapters"
    }`;


  if (!chapters.length) {

    emptyState.classList.remove("hidden");

    return;
  }


  chapters.forEach(
    chapter =>
      renderChapter(chapter)
  );

}


// =========================================================
// RENDER CHAPTER
// =========================================================

function renderChapter(chapter) {

  const card =
    document.createElement("article");


  const locked =
    chapter.locked === true;


  const hasVideo =
    !!chapter.videoUrl;


  const hasPDF =
    !!chapter.pdfUrl;


  card.className =
    `chapter-card ${
      locked ? "locked" : ""
    }`;


  card.innerHTML = `

    <!-- THUMBNAIL -->

    <div class="chapter-thumbnail">

      <div class="chapter-number">
        CHAPTER ${escapeHtml(
          chapter.chapterNumber ?? ""
        )}
      </div>

      <div class="play-symbol">
        ▶
      </div>

    </div>


    <!-- CONTENT -->

    <div class="chapter-content">

      <h3>
        ${escapeHtml(
          chapter.title ||
          chapter.chapterName ||
          "Untitled Chapter"
        )}
      </h3>


      <p class="chapter-description">

        ${escapeHtml(
          chapter.description ||
          "Recorded class and study material."
        )}

      </p>


      ${
        locked
          ? `
            <span class="locked-label">
              🔒 LOCKED
            </span>
          `
          : ""
      }

    </div>


    <!-- ACTIONS -->

    <div class="chapter-actions">

      <button
        class="primary-btn watch-btn"
        ${locked || !hasVideo ? "disabled" : ""}
      >
        ${
          locked
            ? "Locked"
            : hasVideo
              ? "Watch Class"
              : "No Video"
        }
      </button>


      ${
        hasPDF
          ? `
            <button
              class="secondary-btn pdf-btn"
              ${locked ? "disabled" : ""}
            >
              PDF
            </button>
          `
          : ""
      }

    </div>

  `;


  // -------------------------------------------------------
  // WATCH CLASS
  // -------------------------------------------------------

  const watchBtn =
    card.querySelector(".watch-btn");


  if (watchBtn && !locked && hasVideo) {

    watchBtn.addEventListener(
      "click",
      () => {

        window.location.href =
          `./viewrecordedclasses/?id=${
            encodeURIComponent(chapter.id)
          }`;

      }
    );

  }


  // -------------------------------------------------------
  // PDF
  // -------------------------------------------------------

  const pdfBtn =
    card.querySelector(".pdf-btn");


  if (pdfBtn && !locked && hasPDF) {

    pdfBtn.addEventListener(
      "click",
      () => {

        window.open(
          chapter.pdfUrl,
          "_blank",
          "noopener,noreferrer"
        );

      }
    );

  }


  chaptersContainer.appendChild(card);
}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHtml(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// =========================================================
// BACK
// =========================================================

backBtn.addEventListener(
  "click",
  () => {

    window.location.href =
      "./index.html";

  }
);

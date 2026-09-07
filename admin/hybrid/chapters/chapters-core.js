import { auth, db } from "../../../firebase/firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  collection,
  doc,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const loadingScreen = document.getElementById("loadingScreen");
const app = document.getElementById("app");

const subjectsGrid = document.getElementById("subjectsGrid");
const chaptersSection = document.getElementById("chaptersSection");
const chaptersList = document.getElementById("chaptersList");

const selectedSubjectName =
  document.getElementById("selectedSubjectName");

const modalSubjectName =
  document.getElementById("modalSubjectName");

const chapterSubject =
  document.getElementById("chapterSubject");

const chapterNumber =
  document.getElementById("chapterNumber");

const chapterName =
  document.getElementById("chapterName");

const formError =
  document.getElementById("formError");

const modalOverlay =
  document.getElementById("modalOverlay");

const addChapterBtn =
  document.getElementById("addChapterBtn");

const closeModal =
  document.getElementById("closeModal");

const cancelBtn =
  document.getElementById("cancelBtn");

const createBtn =
  document.getElementById("createBtn");

const backBtn =
  document.getElementById("backBtn");


let currentUser = null;
let subjects = [];
let selectedSubject = null;


/* --------------------------------------------------
   AUTH
-------------------------------------------------- */

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "../../../index.html";
    return;
  }

  currentUser = user;

  try {

    await loadSubjects();

    loadingScreen.classList.add("hidden");
    app.classList.remove("hidden");

  } catch (error) {

    console.error(error);

    loadingScreen.classList.add("hidden");
    app.classList.remove("hidden");

    subjectsGrid.innerHTML = `
      <div class="empty">
        Unable to load subjects.
      </div>
    `;
  }

});


/* --------------------------------------------------
   LOAD SUBJECTS
-------------------------------------------------- */

async function loadSubjects() {

  const snapshot = await getDocs(
    collection(db, "hybridSubjects")
  );

  subjects = [];

  snapshot.forEach((item) => {

    const data = item.data();

    if (data.active === false) return;

    subjects.push({
      id: item.id,
      ...data
    });

  });

  subjects.sort((a, b) => {

    const priorityA = Number(a.priority ?? 999);
    const priorityB = Number(b.priority ?? 999);

    return priorityA - priorityB;

  });

  renderSubjects();
}


/* --------------------------------------------------
   RENDER SUBJECTS
-------------------------------------------------- */

function renderSubjects() {

  subjectsGrid.innerHTML = "";

  if (!subjects.length) {

    subjectsGrid.innerHTML = `
      <div class="empty">
        No subjects available.
      </div>
    `;

    return;
  }

  subjects.forEach((subject) => {

    const card = document.createElement("div");

    card.className = "subject-card";

    card.innerHTML = `
      <h3>${escapeHtml(subject.name || "Unnamed Subject")}</h3>
      <p>View chapters</p>
    `;

    card.addEventListener("click", () => {

      selectedSubject = subject;

      openSubject(subject);

    });

    subjectsGrid.appendChild(card);

  });

}


/* --------------------------------------------------
   OPEN SUBJECT
-------------------------------------------------- */

async function openSubject(subject) {

  selectedSubjectName.textContent =
    subject.name || "Subject";

  chaptersSection.classList.remove("hidden");

  document.querySelector(".subjects-section")
    .classList.add("hidden");

  await loadChapters(subject.id);

}


/* --------------------------------------------------
   LOAD CHAPTERS
-------------------------------------------------- */

async function loadChapters(subjectId) {

  chaptersList.innerHTML = `
    <div class="empty">
      Loading chapters...
    </div>
  `;

  const q = query(
    collection(db, "hybridChapters"),
    where("subjectId", "==", subjectId)
  );

  const snapshot = await getDocs(q);

  const chapters = [];

  snapshot.forEach((item) => {

    chapters.push({
      id: item.id,
      ...item.data()
    });

  });

  chapters.sort((a, b) => {

    return Number(a.chapterNumber || 0)
      - Number(b.chapterNumber || 0);

  });

  renderChapters(chapters);

}


/* --------------------------------------------------
   RENDER CHAPTERS
-------------------------------------------------- */

function renderChapters(chapters) {

  chaptersList.innerHTML = "";

  if (!chapters.length) {

    chaptersList.innerHTML = `
      <div class="empty">
        No chapters created for this subject yet.
      </div>
    `;

    return;
  }

  chapters.forEach((chapter) => {

    const row = document.createElement("div");

    row.className = "chapter-row";

    row.innerHTML = `
      <div class="chapter-number">
        ${String(chapter.chapterNumber || "").padStart(2, "0")}
      </div>

      <div class="chapter-name">
        ${escapeHtml(
          chapter.title ||
          chapter.chapterName ||
          "Untitled Chapter"
        )}
      </div>

      <div class="chapter-actions">

        <button
          class="small-btn delete-btn"
          data-id="${chapter.id}">
          Delete
        </button>

      </div>
    `;

    row.querySelector(".delete-btn")
      .addEventListener("click", async () => {

        const confirmed = confirm(
          "Delete this chapter?"
        );

        if (!confirmed) return;

        await deleteDoc(
          doc(db, "hybridChapters", chapter.id)
        );

        await loadChapters(selectedSubject.id);

      });

    chaptersList.appendChild(row);

  });

}


/* --------------------------------------------------
   ADD CHAPTER
-------------------------------------------------- */

addChapterBtn.addEventListener("click", () => {

  if (!selectedSubject) return;

  formError.textContent = "";

  chapterNumber.value = "";
  chapterName.value = "";

  modalSubjectName.textContent =
    selectedSubject.name;

  chapterSubject.value =
    selectedSubject.name;

  modalOverlay.classList.remove("hidden");

});


/* --------------------------------------------------
   CLOSE MODAL
-------------------------------------------------- */

function closeChapterModal() {

  modalOverlay.classList.add("hidden");

  formError.textContent = "";

}


closeModal.addEventListener(
  "click",
  closeChapterModal
);

cancelBtn.addEventListener(
  "click",
  closeChapterModal
);

modalOverlay.addEventListener("click", (event) => {

  if (event.target === modalOverlay) {
    closeChapterModal();
  }

});


/* --------------------------------------------------
   CREATE CHAPTER
-------------------------------------------------- */

createBtn.addEventListener("click", async () => {

  formError.textContent = "";

  const number = Number(
    chapterNumber.value
  );

  const name = chapterName.value.trim();

  if (!number || number < 1) {

    formError.textContent =
      "Enter a valid chapter number.";

    return;
  }

  if (!name) {

    formError.textContent =
      "Enter the chapter name.";

    return;
  }

  if (!selectedSubject) {

    formError.textContent =
      "Please select a subject.";

    return;
  }

  createBtn.disabled = true;
  createBtn.textContent = "Creating...";

  try {

    await addDoc(
      collection(db, "hybridChapters"),
      {
        subjectId: selectedSubject.id,
        chapterNumber: number,
        title: name,
        active: true,
        locked: false,
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid
      }
    );

    closeChapterModal();

    await loadChapters(
      selectedSubject.id
    );

  } catch (error) {

    console.error(error);

    formError.textContent =
      "Unable to create chapter.";

  } finally {

    createBtn.disabled = false;
    createBtn.textContent = "Create Chapter";

  }

});


/* --------------------------------------------------
   BACK TO SUBJECTS
-------------------------------------------------- */

backBtn.addEventListener("click", () => {

  selectedSubject = null;

  chaptersSection.classList.add("hidden");

  document.querySelector(".subjects-section")
    .classList.remove("hidden");

});


/* --------------------------------------------------
   HTML ESCAPE
-------------------------------------------------- */

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

import { auth, db, storage } from "../../../firebase/firebase-config.js";

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

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";



/* =====================================================
   ELEMENTS
===================================================== */

const loadingScreen =
  document.getElementById("loadingScreen");

const app =
  document.getElementById("app");

const subjectsScreen =
  document.getElementById("subjectsScreen");

const chaptersScreen =
  document.getElementById("chaptersScreen");

const detailsScreen =
  document.getElementById("detailsScreen");

const subjectsGrid =
  document.getElementById("subjectsGrid");

const chaptersList =
  document.getElementById("chaptersList");

const chaptersSubjectName =
  document.getElementById("chaptersSubjectName");

const chapterCount =
  document.getElementById("chapterCount");

const detailChapterNumber =
  document.getElementById("detailChapterNumber");

const detailChapterName =
  document.getElementById("detailChapterName");

const detailSubjectName =
  document.getElementById("detailSubjectName");

const materialsList =
  document.getElementById("materialsList");
const videoUrl =
  document.getElementById("videoUrl");

/* Buttons */

const adminBackBtn =
  document.getElementById("adminBackBtn");

const backToSubjectsBtn =
  document.getElementById("backToSubjectsBtn");

const backToChaptersBtn =
  document.getElementById("backToChaptersBtn");

const addVideoBtn =
  document.getElementById("addVideoBtn");

const addPdfBtn =
  document.getElementById("addPdfBtn");

const addNotesBtn =
  document.getElementById("addNotesBtn");


/* Modal */

const modalOverlay =
  document.getElementById("modalOverlay");

const modalTitle =
  document.getElementById("modalTitle");

const modalSubtitle =
  document.getElementById("modalSubtitle");

const closeModal =
  document.getElementById("closeModal");

const cancelModal =
  document.getElementById("cancelModal");

const saveMaterialBtn =
  document.getElementById("saveMaterialBtn");

const modalError =
  document.getElementById("modalError");


/* Forms */

const videoForm =
  document.getElementById("videoForm");

const pdfForm =
  document.getElementById("pdfForm");

const notesForm =
  document.getElementById("notesForm");


/* Video */

const videoTitle =
  document.getElementById("videoTitle");

const videoDescription =
  document.getElementById("videoDescription");

const videoTeacher =
  document.getElementById("videoTeacher");


const videoPriority =
  document.getElementById("videoPriority");


/* PDF */

const pdfTitle =
  document.getElementById("pdfTitle");

const pdfDescription =
  document.getElementById("pdfDescription");

const pdfFile =
  document.getElementById("pdfFile");

const pdfPriority =
  document.getElementById("pdfPriority");


/* Notes */

const notesTitle =
  document.getElementById("notesTitle");

const notesContent =
  document.getElementById("notesContent");

const notesPriority =
  document.getElementById("notesPriority");



/* =====================================================
   STATE
===================================================== */

let currentUser = null;

let subjects = [];

let selectedSubject = null;

let selectedChapter = null;

let currentMaterialType = null;



/* =====================================================
   AUTH
===================================================== */

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    window.location.href =
      "../../../index.html";

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



/* =====================================================
   SUBJECTS
===================================================== */

async function loadSubjects() {

  const snapshot =
    await getDocs(
      collection(db, "hybridSubjects")
    );

  subjects = [];

  snapshot.forEach((item) => {

    const data = item.data();

    if (data.active === false) {
      return;
    }

    subjects.push({
      id: item.id,
      ...data
    });

  });


  subjects.sort((a, b) => {

    return Number(a.priority ?? 999)
      - Number(b.priority ?? 999);

  });


  renderSubjects();

}



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

    const card =
      document.createElement("div");

    card.className =
      "subject-card";

    card.innerHTML = `
      <h3>
        ${escapeHtml(
          subject.name || "Unnamed Subject"
        )}
      </h3>

      <p>
        Select to view chapters
      </p>
    `;


    card.addEventListener(
      "click",
      () => selectSubject(subject)
    );


    subjectsGrid.appendChild(card);

  });

}



/* =====================================================
   SELECT SUBJECT
===================================================== */

async function selectSubject(subject) {

  selectedSubject = subject;

  chaptersSubjectName.textContent =
    subject.name || "Subject";

  subjectsScreen.classList.add("hidden");

  chaptersScreen.classList.remove("hidden");

  detailsScreen.classList.add("hidden");

  await loadChapters(subject.id);

}



/* =====================================================
   LOAD CHAPTERS
===================================================== */

async function loadChapters(subjectId) {

  chaptersList.innerHTML = `
    <div class="empty">
      Loading chapters...
    </div>
  `;


  const q =
    query(
      collection(db, "hybridChapters"),
      where("subjectId", "==", subjectId)
    );


  const snapshot =
    await getDocs(q);


  const chapters = [];


  snapshot.forEach((item) => {

    const data = item.data();

    chapters.push({
      id: item.id,
      ...data
    });

  });


  chapters.sort((a, b) => {

    return Number(a.chapterNumber || 0)
      - Number(b.chapterNumber || 0);

  });


  chapterCount.textContent =
    `${chapters.length} chapter${chapters.length === 1 ? "" : "s"}`;


  renderChapters(chapters);

}



/* =====================================================
   RENDER CHAPTERS
===================================================== */

function renderChapters(chapters) {

  chaptersList.innerHTML = "";

  if (!chapters.length) {

    chaptersList.innerHTML = `
      <div class="empty">
        No chapters have been created for this subject yet.
      </div>
    `;

    return;
  }


  chapters.forEach((chapter) => {

    const row =
      document.createElement("div");

    row.className =
      "chapter-row";


    const number =
      String(
        chapter.chapterNumber || ""
      ).padStart(2, "0");


    const title =
      chapter.title ||
      chapter.chapterName ||
      "Untitled Chapter";


    row.innerHTML = `

      <div class="chapter-number">
        ${escapeHtml(number)}
      </div>

      <div class="chapter-name">
        ${escapeHtml(title)}
      </div>

      <div class="chapter-arrow">
        →
      </div>

    `;


    row.addEventListener(
      "click",
      () => selectChapter(chapter)
    );


    chaptersList.appendChild(row);

  });

}



/* =====================================================
   SELECT CHAPTER
===================================================== */

async function selectChapter(chapter) {

  selectedChapter = chapter;

  detailChapterNumber.textContent =
    `Chapter ${String(
      chapter.chapterNumber || ""
    ).padStart(2, "0")}`;

  detailChapterName.textContent =
    chapter.title ||
    chapter.chapterName ||
    "Untitled Chapter";

  detailSubjectName.textContent =
    selectedSubject?.name || "Subject";

  chaptersScreen.classList.add("hidden");

  detailsScreen.classList.remove("hidden");

  await loadMaterials(chapter.id);

}



/* =====================================================
   LOAD MATERIALS
===================================================== */

async function loadMaterials(chapterId) {

  materialsList.innerHTML = `
    <div class="empty">
      Loading content...
    </div>
  `;


  const q =
    query(
      collection(db, "hybridMaterials"),
      where("chapterId", "==", chapterId)
    );


  const snapshot =
    await getDocs(q);


  const materials = [];


  snapshot.forEach((item) => {

    const data = item.data();

    if (data.active === false) {
      return;
    }

    materials.push({
      id: item.id,
      ...data
    });

  });


  materials.sort((a, b) => {

    return Number(a.priority || 999)
      - Number(b.priority || 999);

  });


  renderMaterials(materials);

}



/* =====================================================
   RENDER MATERIALS
===================================================== */

function renderMaterials(materials) {

  materialsList.innerHTML = "";

  if (!materials.length) {

    materialsList.innerHTML = `
      <div class="empty">
        No content has been added to this chapter yet.
      </div>
    `;

    return;
  }


  materials.forEach((material) => {

    const card =
      document.createElement("div");

    card.className =
      "material-card";


    const type =
      String(
        material.type || "MATERIAL"
      ).toUpperCase();


    card.innerHTML = `

      <div class="material-left">

        <div class="material-type">
          ${escapeHtml(type)}
        </div>

        <div class="material-title">
          ${escapeHtml(
            material.title || "Untitled"
          )}
        </div>

        ${
          material.description
            ? `
              <div class="material-description">
                ${escapeHtml(
                  material.description
                )}
              </div>
            `
            : ""
        }

      </div>


      <div class="material-action">

        <button
          class="delete-material"
          data-id="${material.id}">
          Delete
        </button>

      </div>

    `;


    card
      .querySelector(".delete-material")
      .addEventListener(
        "click",
        async (event) => {

          event.stopPropagation();

          const confirmed =
            confirm(
              "Delete this material?"
            );

          if (!confirmed) {
            return;
          }


          try {

            await deleteDoc(
              doc(
                db,
                "hybridMaterials",
                material.id
              )
            );


            await loadMaterials(
              selectedChapter.id
            );


          } catch (error) {

            console.error(error);

            alert(
              "Unable to delete material."
            );

          }

        }
      );


    materialsList.appendChild(card);

  });

}



/* =====================================================
   BACK — SUBJECTS
===================================================== */

backToSubjectsBtn.addEventListener(
  "click",
  () => {

    selectedSubject = null;
    selectedChapter = null;

    chaptersScreen.classList.add("hidden");

    detailsScreen.classList.add("hidden");

    subjectsScreen.classList.remove("hidden");

  }
);



/* =====================================================
   BACK — CHAPTERS
===================================================== */

backToChaptersBtn.addEventListener(
  "click",
  () => {

    selectedChapter = null;

    detailsScreen.classList.add("hidden");

    chaptersScreen.classList.remove("hidden");

  }
);



/* =====================================================
   BACK — ADMIN
===================================================== */

adminBackBtn.addEventListener(
  "click",
  () => {

    /*
      Change this path if your main
      Hybrid Admin dashboard is located elsewhere.
    */

    window.location.href =
      "../index.html";

  }
);



/* =====================================================
   OPEN VIDEO
===================================================== */

addVideoBtn.addEventListener(
  "click",
  () => openMaterialModal("VIDEO")
);



/* =====================================================
   OPEN PDF
===================================================== */

addPdfBtn.addEventListener(
  "click",
  () => openMaterialModal("PDF")
);



/* =====================================================
   OPEN NOTES
===================================================== */

addNotesBtn.addEventListener(
  "click",
  () => openMaterialModal("NOTES")
);



/* =====================================================
   OPEN MODAL
===================================================== */

function openMaterialModal(type) {

  currentMaterialType = type;

  modalError.textContent = "";

  videoForm.classList.add("hidden");
  pdfForm.classList.add("hidden");
  notesForm.classList.add("hidden");


  if (type === "VIDEO") {

    modalTitle.textContent =
      "Add Video";

    videoForm.classList.remove("hidden");

  }


  if (type === "PDF") {

    modalTitle.textContent =
      "Add PDF";

    pdfForm.classList.remove("hidden");

  }


  if (type === "NOTES") {

    modalTitle.textContent =
      "Add Notes";

    notesForm.classList.remove("hidden");

  }


  modalSubtitle.textContent =
    `${selectedSubject?.name || ""} • ${
      selectedChapter?.title ||
      selectedChapter?.chapterName ||
      ""
    }`;


  modalOverlay.classList.remove("hidden");

}



/* =====================================================
   CLOSE MODAL
===================================================== */

function closeMaterialModal() {

  modalOverlay.classList.add("hidden");

  modalError.textContent = "";

  currentMaterialType = null;

}


closeModal.addEventListener(
  "click",
  closeMaterialModal
);


cancelModal.addEventListener(
  "click",
  closeMaterialModal
);


modalOverlay.addEventListener(
  "click",
  (event) => {

    if (
      event.target === modalOverlay
    ) {
      closeMaterialModal();
    }

  }
);



/* =====================================================
   SAVE MATERIAL
===================================================== */

saveMaterialBtn.addEventListener(
  "click",
  async () => {

    modalError.textContent = "";


    if (!selectedSubject || !selectedChapter) {

      modalError.textContent =
        "Subject or chapter is missing.";

      return;
    }


    saveMaterialBtn.disabled = true;

    saveMaterialBtn.textContent =
      "Saving...";


    try {
/* ===============================================
   VIDEO
=============================================== */

if (currentMaterialType === "VIDEO") {

  const title =
    videoTitle.value.trim();

  const url =
    videoUrl.value.trim();

  const description =
    videoDescription.value.trim();

  const teacher =
    videoTeacher.value.trim();

  const priority =
    Number(videoPriority.value || 1);


  if (!title) {

    throw new Error(
      "Please enter the video title."
    );

  }


  if (!url) {

    throw new Error(
      "Please enter the embedded video link."
    );

  }


  if (!isValidVideoUrl(url)) {

    throw new Error(
      "Please enter a valid embedded video URL."
    );

  }


  await addDoc(
    collection(db, "hybridMaterials"),
    {

      subjectId:
        selectedSubject.id,

      chapterId:
        selectedChapter.id,

      title,

      description,

      type: "VIDEO",

      videoType:
        "embed",

      videoUrl:
        url,

      teacherName:
        teacher,

      priority,

      active: true,

      medium:
        selectedSubject.medium ||
        "Kannada",

      createdAt:
        serverTimestamp(),

      createdBy:
        currentUser.uid

    }
  );

}
      /* ===============================================
         PDF
      =============================================== */

      if (
        currentMaterialType === "PDF"
      ) {

        const title =
          pdfTitle.value.trim();

        const description =
          pdfDescription.value.trim();

        const file =
          pdfFile.files[0];

        const priority =
          Number(
            pdfPriority.value || 1
          );


        if (!title) {

          throw new Error(
            "Enter the PDF title."
          );

        }


        if (!file) {

          throw new Error(
            "Select a PDF file."
          );

        }


        const storagePath =
          `hybrid-materials/${
            selectedSubject.id
          }/${
            selectedChapter.id
          }/pdfs/${
            Date.now()
          }-${file.name}`;


        const storageRef =
          ref(
            storage,
            storagePath
          );


        await uploadBytes(
          storageRef,
          file
        );


        const pdfUrl =
          await getDownloadURL(
            storageRef
          );


        await addDoc(
          collection(
            db,
            "hybridMaterials"
          ),
          {

            subjectId:
              selectedSubject.id,

            chapterId:
              selectedChapter.id,

            title,

            description,

            type: "PDF",

            pdfUrl,

            pdfName:
              file.name,

            priority,

            active: true,

            medium:
              selectedSubject.medium ||
              "Kannada",

            createdAt:
              serverTimestamp(),

            createdBy:
              currentUser.uid

          }
        );

      }



      /* ===============================================
         NOTES
      =============================================== */

      if (
        currentMaterialType === "NOTES"
      ) {

        const title =
          notesTitle.value.trim();

        const content =
          notesContent.value.trim();

        const priority =
          Number(
            notesPriority.value || 1
          );


        if (!title) {

          throw new Error(
            "Enter the notes title."
          );

        }


        if (!content) {

          throw new Error(
            "Enter the notes."
          );

        }


        await addDoc(
          collection(
            db,
            "hybridMaterials"
          ),
          {

            subjectId:
              selectedSubject.id,

            chapterId:
              selectedChapter.id,

            title,

            type: "NOTES",

            notes:
              content,

            priority,

            active: true,

            medium:
              selectedSubject.medium ||
              "Kannada",

            createdAt:
              serverTimestamp(),

            createdBy:
              currentUser.uid

          }
        );

      }

function isValidVideoUrl(url) {

  try {

    const parsed =
      new URL(url);

    const host =
      parsed.hostname.toLowerCase();


    return (
      host.includes("youtube.com") ||
      host.includes("youtu.be") ||
      host.includes("vimeo.com") ||
      host.includes("player.vimeo.com")
    );

  } catch {

    return false;

  }

}

      /* ===============================================
         COMPLETE
      =============================================== */

      closeMaterialModal();

      clearForms();

      await loadMaterials(
        selectedChapter.id
      );


    } catch (error) {

      console.error(error);

      modalError.textContent =
        error.message ||
        "Unable to add material.";

    } finally {

      saveMaterialBtn.disabled = false;

      saveMaterialBtn.textContent =
        "Add Material";

    }

  }
);



/* =====================================================
   CLEAR FORMS
===================================================== */
function clearForms() {

  videoTitle.value = "";
  videoUrl.value = "";
  videoDescription.value = "";
  videoTeacher.value = "";
  videoPriority.value = "1";


  pdfTitle.value = "";
  pdfDescription.value = "";
  pdfFile.value = "";
  pdfPriority.value = "1";


  notesTitle.value = "";
  notesContent.value = "";
  notesPriority.value = "1";

}



/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(value) {

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
saveMaterialBtn.addEventListener(
  "click",
  async () => {

    modalError.textContent = "";

    saveMaterialBtn.disabled = true;
    saveMaterialBtn.textContent = "Saving...";

    try {

      if (!selectedSubject) {
        throw new Error("Subject is not selected.");
      }

      if (!selectedChapter) {
        throw new Error("Chapter is not selected.");
      }

      if (!currentMaterialType) {
        throw new Error("Material type is not selected.");
      }


      /* VIDEO */

      if (currentMaterialType === "VIDEO") {

        const title =
          videoTitle.value.trim();

        const url =
          videoUrl.value.trim();

        if (!title) {
          throw new Error(
            "Please enter the video title."
          );
        }

        if (!url) {
          throw new Error(
            "Please enter the embedded video link."
          );
        }

        if (!isValidVideoUrl(url)) {
          throw new Error(
            "Please enter a valid embedded video URL."
          );
        }


        await addDoc(
          collection(db, "hybridMaterials"),
          {
            subjectId: selectedSubject.id,
            chapterId: selectedChapter.id,

            title: title,

            description:
              videoDescription.value.trim(),

            type: "VIDEO",

            videoType: "embed",

            videoUrl: url,

            teacherName:
              videoTeacher.value.trim(),

            priority:
              Number(videoPriority.value || 1),

            active: true,

            medium:
              selectedSubject.medium ||
              "Kannada",

            createdAt:
              serverTimestamp(),

            createdBy:
              currentUser.uid
          }
        );
      }


      /* PDF */

      else if (currentMaterialType === "PDF") {

        const title =
          pdfTitle.value.trim();

        const file =
          pdfFile.files[0];


        if (!title) {
          throw new Error(
            "Please enter the PDF title."
          );
        }

        if (!file) {
          throw new Error(
            "Please select a PDF."
          );
        }


        const storagePath =
          `hybrid-materials/${
            selectedSubject.id
          }/${
            selectedChapter.id
          }/pdfs/${
            Date.now()
          }-${file.name}`;


        const storageRef =
          ref(storage, storagePath);


        await uploadBytes(
          storageRef,
          file
        );


        const pdfUrl =
          await getDownloadURL(
            storageRef
          );


        await addDoc(
          collection(db, "hybridMaterials"),
          {

            subjectId:
              selectedSubject.id,

            chapterId:
              selectedChapter.id,

            title,

            description:
              pdfDescription.value.trim(),

            type: "PDF",

            pdfUrl,

            pdfName:
              file.name,

            priority:
              Number(
                pdfPriority.value || 1
              ),

            active: true,

            medium:
              selectedSubject.medium ||
              "Kannada",

            createdAt:
              serverTimestamp(),

            createdBy:
              currentUser.uid

          }
        );

      }


      /* NOTES */

      else if (currentMaterialType === "NOTES") {

        const title =
          notesTitle.value.trim();

        const notes =
          notesContent.value.trim();


        if (!title) {
          throw new Error(
            "Please enter the notes title."
          );
        }

        if (!notes) {
          throw new Error(
            "Please enter the notes."
          );
        }


        await addDoc(
          collection(db, "hybridMaterials"),
          {

            subjectId:
              selectedSubject.id,

            chapterId:
              selectedChapter.id,

            title,

            type: "NOTES",

            notes,

            priority:
              Number(
                notesPriority.value || 1
              ),

            active: true,

            medium:
              selectedSubject.medium ||
              "Kannada",

            createdAt:
              serverTimestamp(),

            createdBy:
              currentUser.uid

          }
        );

      }


      /* SUCCESS */

      closeMaterialModal();

      clearForms();

      await loadMaterials(
        selectedChapter.id
      );


    } catch (error) {

      console.error(
        "SAVE MATERIAL ERROR:",
        error
      );

      modalError.textContent =
        error.message ||
        "Unable to save material.";

    } finally {

      saveMaterialBtn.disabled = false;

      saveMaterialBtn.textContent =
        "Add Material";

    }

  }
);

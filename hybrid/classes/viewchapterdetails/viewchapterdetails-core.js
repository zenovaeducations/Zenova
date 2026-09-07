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

const chapterNumber =
  document.getElementById(
    "chapterNumber"
  );

const chapterName =
  document.getElementById(
    "chapterName"
  );

const chapterDescription =
  document.getElementById(
    "chapterDescription"
  );

const backBtn =
  document.getElementById(
    "backBtn"
  );


/* Featured */

const featuredSection =
  document.getElementById(
    "featuredSection"
  );

const featuredTitle =
  document.getElementById(
    "featuredTitle"
  );

const featuredDescription =
  document.getElementById(
    "featuredDescription"
  );

const featuredTeacher =
  document.getElementById(
    "featuredTeacher"
  );

const featuredWatchBtn =
  document.getElementById(
    "featuredWatchBtn"
  );

const featuredThumbnail =
  document.getElementById(
    "featuredThumbnail"
  );


/* Videos */

const videosSection =
  document.getElementById(
    "videosSection"
  );

const videosList =
  document.getElementById(
    "videosList"
  );


/* PDFs */

const pdfSection =
  document.getElementById(
    "pdfSection"
  );

const pdfList =
  document.getElementById(
    "pdfList"
  );


/* Notes */

const notesSection =
  document.getElementById(
    "notesSection"
  );

const notesList =
  document.getElementById(
    "notesList"
  );


/* States */

const emptyState =
  document.getElementById(
    "emptyState"
  );

const errorState =
  document.getElementById(
    "errorState"
  );


/* =========================================
   URL
========================================= */

const params =
  new URLSearchParams(
    window.location.search
  );

const chapterId =
  params.get("id");


/* =========================================
   STATE
========================================= */

let currentUser = null;

let studentData = {};

let selectedChapter = null;

let selectedSubject = null;

let videoMaterials = [];



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


    if (!chapterId) {

      showError(
        "Chapter was not selected."
      );

      finishLoading();

      return;
    }


    try {

      await loadStudent();

      await loadChapter();

      await loadMaterials();

      finishLoading();

    } catch (error) {

      console.error(
        "VIEW CHAPTER DETAILS ERROR:",
        error
      );

      showError(
        "We couldn't load this chapter right now."
      );

      finishLoading();

    }

  }
);



/* =========================================
   STUDENT
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
   CHAPTER
========================================= */

async function loadChapter() {

  const chapterRef =
    doc(
      db,
      "hybridChapters",
      chapterId
    );


  const snapshot =
    await getDoc(
      chapterRef
    );


  if (
    !snapshot.exists()
  ) {

    throw new Error(
      "Chapter does not exist."
    );

  }


  selectedChapter = {
    id: snapshot.id,
    ...snapshot.data()
  };


  if (
    selectedChapter.active === false
  ) {

    throw new Error(
      "Chapter is inactive."
    );

  }


  /*
    Load parent subject.
  */

  const subjectId =
    selectedChapter.subjectId;


  if (!subjectId) {

    throw new Error(
      "Chapter has no subject."
    );

  }


  const subjectRef =
    doc(
      db,
      "hybridSubjects",
      subjectId
    );


  const subjectSnapshot =
    await getDoc(
      subjectRef
    );


  if (
    subjectSnapshot.exists()
  ) {

    selectedSubject = {
      id: subjectSnapshot.id,
      ...subjectSnapshot.data()
    };

  } else {

    selectedSubject = {};

  }


  renderChapterHeader();

}



/* =========================================
   HEADER
========================================= */

function renderChapterHeader() {

  subjectName.textContent =
    selectedSubject.name ||
    "Subject";


  chapterNumber.textContent =
    `Chapter ${
      String(
        selectedChapter.chapterNumber || ""
      ).padStart(2, "0")
    }`;


  chapterName.textContent =
    selectedChapter.title ||
    selectedChapter.chapterName ||
    "Chapter";


  chapterDescription.textContent =
    selectedChapter.description ||
    "";

}



/* =========================================
   MATERIALS
========================================= */

async function loadMaterials() {

  const materialQuery =
    query(
      collection(
        db,
        "hybridMaterials"
      ),
      where(
        "chapterId",
        "==",
        chapterId
      )
    );


  const snapshot =
    await getDocs(
      materialQuery
    );


  const materials = [];


  const studentMedium =
    normalizeMedium(
      studentData.medium
    );


  snapshot.forEach(
    (item) => {

      const data =
        item.data();


      if (
        data.active === false
      ) {
        return;
      }


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


      materials.push({
        id: item.id,
        ...data
      });

    }
  );


  materials.sort(
    (a, b) => {

      const priorityA =
        Number(
          a.priority ?? 999
        );

      const priorityB =
        Number(
          b.priority ?? 999
        );


      if (
        priorityA !== priorityB
      ) {

        return (
          priorityA -
          priorityB
        );

      }


      return String(
        a.title || ""
      ).localeCompare(
        String(
          b.title || ""
        )
      );

    }
  );


  videoMaterials =
    materials.filter(
      material =>
        String(
          material.type || ""
        ).toUpperCase() ===
        "VIDEO"
    );


  const pdfMaterials =
    materials.filter(
      material =>
        String(
          material.type || ""
        ).toUpperCase() ===
        "PDF"
    );


  const notesMaterials =
    materials.filter(
      material =>
        String(
          material.type || ""
        ).toUpperCase() ===
        "NOTES"
    );


  renderFeaturedVideo();

  renderOtherVideos(
    videoMaterials
  );

  renderPDFs(
    pdfMaterials
  );

  renderNotes(
    notesMaterials
  );


  if (
    materials.length === 0
  ) {

    emptyState.classList.remove(
      "hidden"
    );

  }

}



/* =========================================
   FEATURED VIDEO
========================================= */

function renderFeaturedVideo() {

  /*
    Priority 1 is the featured video.

    If there is no priority 1,
    use the first video.
  */

  if (
    !videoMaterials.length
  ) {

    featuredSection.classList.add(
      "hidden"
    );

    return;
  }


  let featured =
    videoMaterials.find(
      video =>
        Number(
          video.priority
        ) === 1
    );


  if (!featured) {

    featured =
      videoMaterials[0];

  }


  featuredSection.classList.remove(
    "hidden"
  );


  featuredTitle.textContent =
    featured.title ||
    "Video";


  featuredDescription.textContent =
    featured.description ||
    "";


  if (
    featured.teacherName
  ) {

    featuredTeacher.textContent =
      `Teacher: ${
        featured.teacherName
      }`;

  } else {

    featuredTeacher.textContent =
      "";

  }


  /*
    Thumbnail.

    If admin later stores thumbnailUrl,
    use it automatically.
  */

  if (
    featured.thumbnailUrl
  ) {

    featuredThumbnail.style.backgroundImage =
      `url("${featured.thumbnailUrl}")`;

    featuredThumbnail.style.backgroundSize =
      "cover";

    featuredThumbnail.style.backgroundPosition =
      "center";

  } else {

    featuredThumbnail.style.backgroundImage =
      "";

  }


  const openVideo =
    () => {

      window.location.href =
        `../videoplayer/?id=${
          encodeURIComponent(
            featured.id
          )
        }`;

    };


  featuredWatchBtn.onclick =
    openVideo;


  featuredThumbnail.onclick =
    openVideo;

}



/* =========================================
   OTHER VIDEOS
========================================= */

function renderOtherVideos(
  videos
) {

  /*
    Remove the featured video
    from the recommended list.
  */

  let featured =
    videos.find(
      video =>
        Number(
          video.priority
        ) === 1
    );


  if (!featured && videos.length) {

    featured =
      videos[0];

  }


  const others =
    videos.filter(
      video =>
        !featured ||
        video.id !== featured.id
    );


  if (
    !others.length
  ) {

    videosSection.classList.add(
      "hidden"
    );

    return;
  }


  videosSection.classList.remove(
    "hidden"
  );


  videosList.innerHTML = "";


  others.forEach(
    (video) => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "video-card";


      card.innerHTML = `

        <div class="video-thumbnail">

          ${
            video.thumbnailUrl
              ? ""
              : "▶"
          }

        </div>


        <div class="video-info">

          <div class="video-title">
            ${escapeHtml(
              video.title ||
              "Untitled Video"
            )}
          </div>


          ${
            video.description
              ? `
                <div class="video-description">
                  ${escapeHtml(
                    video.description
                  )}
                </div>
              `
              : ""
          }


          ${
            video.teacherName
              ? `
                <div class="video-teacher">
                  ${escapeHtml(
                    video.teacherName
                  )}
                </div>
              `
              : ""
          }

        </div>


        <div class="video-arrow">
          →
        </div>

      `;


      const thumbnail =
        card.querySelector(
          ".video-thumbnail"
        );


      if (
        video.thumbnailUrl
      ) {

        thumbnail.style.backgroundImage =
          `url("${video.thumbnailUrl}")`;

        thumbnail.style.backgroundSize =
          "cover";

        thumbnail.style.backgroundPosition =
          "center";

      }


      card.addEventListener(
        "click",
        () => {

          window.location.href =
            `../videoplayer/?id=${
              encodeURIComponent(
                video.id
              )
            }`;

        }
      );


      videosList.appendChild(
        card
      );

    }
  );

}



/* =========================================
   PDFs
========================================= */

function renderPDFs(
  pdfs
) {

  if (
    !pdfs.length
  ) {

    pdfSection.classList.add(
      "hidden"
    );

    return;
  }


  pdfSection.classList.remove(
    "hidden"
  );


  pdfList.innerHTML = "";


  pdfs.forEach(
    (pdf) => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "material-card";


      card.innerHTML = `

        <div class="material-left">

          <div class="material-title">
            ${escapeHtml(
              pdf.title ||
              pdf.pdfName ||
              "PDF"
            )}
          </div>

          ${
            pdf.description
              ? `
                <div class="material-description">
                  ${escapeHtml(
                    pdf.description
                  )}
                </div>
              `
              : ""
          }

        </div>


        ${
          pdf.pdfUrl
            ? `
              <button
                class="material-btn"
                data-url="${escapeHtml(
                  pdf.pdfUrl
                )}"
              >
                VIEW PDF
              </button>
            `
            : ""
        }

      `;


      const button =
        card.querySelector(
          ".material-btn"
        );


      if (button) {

        button.addEventListener(
          "click",
          () => {

            window.open(
              pdf.pdfUrl,
              "_blank",
              "noopener,noreferrer"
            );

          }
        );

      }


      pdfList.appendChild(
        card
      );

    }
  );

}



/* =========================================
   NOTES
========================================= */

function renderNotes(
  notes
) {

  if (
    !notes.length
  ) {

    notesSection.classList.add(
      "hidden"
    );

    return;
  }


  notesSection.classList.remove(
    "hidden"
  );


  notesList.innerHTML = "";


  notes.forEach(
    (note) => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "material-card";


      card.innerHTML = `

        <div class="material-left">

          <div class="material-title">
            ${escapeHtml(
              note.title ||
              "Notes"
            )}
          </div>


          ${
            note.notes
              ? `
                <div class="material-description">
                  ${escapeHtml(
                    note.notes
                  ).substring(
                    0,
                    180
                  )}
                  ${
                    String(
                      note.notes
                    ).length > 180
                      ? "..."
                      : ""
                  }
                </div>
              `
              : ""
          }

        </div>

      `;


      notesList.appendChild(
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
      `../viewchapters/?id=${
        encodeURIComponent(
          selectedSubject?.id ||
          selectedChapter?.subjectId ||
          ""
        )
      }`;

  }
);



/* =========================================
   ERROR
========================================= */

function showError(
  message
) {

  errorState.textContent =
    message;

  errorState.classList.remove(
    "hidden"
  );

}



/* =========================================
   FINISH
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

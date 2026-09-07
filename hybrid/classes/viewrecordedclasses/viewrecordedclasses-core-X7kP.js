import { auth, db } from "../../../firebase/firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// ELEMENTS
// =========================================================

const loadingScreen =
  document.getElementById("loadingScreen");

const app =
  document.getElementById("app");

const backBtn =
  document.getElementById("backBtn");

const videoContainer =
  document.getElementById("videoContainer");

const chapterNumber =
  document.getElementById("chapterNumber");

const classTitle =
  document.getElementById("classTitle");

const classDescription =
  document.getElementById("classDescription");

const aboutText =
  document.getElementById("aboutText");

const askDoubtBtn =
  document.getElementById("askDoubtBtn");

const shareBtn =
  document.getElementById("shareBtn");

const studyMaterialSection =
  document.getElementById("studyMaterialSection");

const pdfName =
  document.getElementById("pdfName");

const viewPdfBtn =
  document.getElementById("viewPdfBtn");


// =========================================================
// GET CHAPTER ID
// =========================================================

// Expected:
//
// viewrecordedclasses/?id=CHAPTER_ID
//
// We also accept chapterId for compatibility.

const params =
  new URLSearchParams(
    window.location.search
  );

const chapterId =
  params.get("id") ||
  params.get("chapterId");


// =========================================================
// LOADING
// =========================================================

function showApp() {

  loadingScreen.classList.add("hidden");

  app.classList.remove("hidden");
}


// =========================================================
// AUTH
// =========================================================

onAuthStateChanged(
  auth,
  async (user) => {

    if (!user) {

      window.location.href =
        "../../../index.html";

      return;
    }


    try {

      if (!chapterId) {

        showError(
          "Class not found",
          "No chapter was selected."
        );

        return;
      }


      await loadChapter();

      showApp();

    } catch (error) {

      console.error(
        "Recorded class error:",
        error
      );

      showError(
        "Unable to load class",
        "Something went wrong while loading this class."
      );

    }

  }
);


// =========================================================
// LOAD CHAPTER
// =========================================================

async function loadChapter() {

  const chapterRef =
    doc(
      db,
      "hybridChapters",
      chapterId
    );


  const snapshot =
    await getDoc(chapterRef);


  if (!snapshot.exists()) {

    showError(
      "Class not found",
      "This recorded class does not exist."
    );

    return;
  }


  const chapter =
    snapshot.data();


  // =======================================================
  // LOCK CHECK
  // =======================================================

  if (chapter.locked === true) {

    showError(
      "Class locked",
      "This recorded class is currently locked."
    );

    return;
  }


  // =======================================================
  // BASIC INFORMATION
  // =======================================================

  const title =
    chapter.title ||
    chapter.chapterName ||
    "Untitled Class";


  const description =
    chapter.description ||
    "No description available.";


  const number =
    chapter.chapterNumber;


  classTitle.textContent =
    title;


  classDescription.textContent =
    description;


  aboutText.textContent =
    description;


  if (
    number !== undefined &&
    number !== null &&
    number !== ""
  ) {

    chapterNumber.textContent =
      `CHAPTER ${number}`;

  } else {

    chapterNumber.textContent =
      "RECORDED CLASS";

  }


  // =======================================================
  // VIDEO
  // =======================================================

  if (chapter.videoUrl) {

    loadVideo(
      chapter.videoUrl
    );

  } else {

    showVideoMessage(
      "No video available",
      "A recorded video has not been added to this chapter yet."
    );

  }


  // =======================================================
  // PDF
  // =======================================================

  if (chapter.pdfUrl) {

    studyMaterialSection
      .classList
      .remove("hidden");


    pdfName.textContent =
      chapter.pdfName ||
      "Chapter Notes";


    viewPdfBtn.onclick =
      () => {

        window.open(
          chapter.pdfUrl,
          "_blank",
          "noopener,noreferrer"
        );

      };

  } else {

    studyMaterialSection
      .classList
      .add("hidden");

  }

}


// =========================================================
// VIDEO LOADER
// =========================================================

function loadVideo(url) {

  const youtubeId =
    extractYouTubeId(url);


  // =======================================================
  // YOUTUBE
  // =======================================================

  if (youtubeId) {

    videoContainer.innerHTML = `

      <iframe
        class="youtube-frame"
        src="https://www.youtube.com/embed/${youtubeId}"
        title="Zenova Super Class"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>

    `;

    return;
  }


  // =======================================================
  // HOSTED VIDEO
  // =======================================================

  videoContainer.innerHTML = `

    <video
      class="hosted-video"
      controls
      playsinline
      preload="metadata"
    >

      <source
        src="${escapeAttribute(url)}"
      >

      Your browser does not support video playback.

    </video>

  `;

}


// =========================================================
// YOUTUBE URL PARSER
// =========================================================

function extractYouTubeId(url) {

  if (!url) {
    return null;
  }


  try {

    const parsed =
      new URL(url);


    // youtube.com/watch?v=XXXXX

    if (
      parsed.hostname.includes("youtube.com") &&
      parsed.searchParams.get("v")
    ) {

      return parsed.searchParams.get("v");

    }


    // youtube.com/embed/XXXXX

    if (
      parsed.hostname.includes("youtube.com") &&
      parsed.pathname.startsWith("/embed/")
    ) {

      return parsed.pathname
        .split("/embed/")[1]
        .split("/")[0];

    }


    // youtu.be/XXXXX

    if (
      parsed.hostname === "youtu.be"
    ) {

      return parsed.pathname
        .replace("/", "")
        .split("/")[0];

    }


    return null;

  } catch {

    return null;

  }

}


// =========================================================
// VIDEO MESSAGE
// =========================================================

function showVideoMessage(
  title,
  message
) {

  videoContainer.innerHTML = `

    <div class="video-message">

      <strong>
        ${escapeHtml(title)}
      </strong>

      <span>
        ${escapeHtml(message)}
      </span>

    </div>

  `;

}


// =========================================================
// ERROR
// =========================================================

function showError(
  title,
  message
) {

  loadingScreen.classList.add("hidden");

  app.classList.remove("hidden");


  classTitle.textContent =
    title;

  classDescription.textContent =
    message;

  aboutText.textContent =
    message;


  showVideoMessage(
    title,
    message
  );

}


// =========================================================
// ASK DOUBT
// =========================================================

askDoubtBtn.addEventListener(
  "click",
  () => {

    /*
      FUTURE:

      This will connect to:

      /askdoubt/

      We can later pass:

      ?chapterId=CHAPTER_ID

      so the doubt is automatically
      connected to this recorded class.
    */

    window.location.href =
      `../../../askdoubt/?chapterId=${
        encodeURIComponent(chapterId)
      }`;

  }
);


// =========================================================
// SHARE
// =========================================================

shareBtn.addEventListener(
  "click",
  async () => {

    const shareUrl =
      window.location.href;


    const shareData = {

      title:
        classTitle.textContent ||
        "Zenova Super Class",

      text:
        "Watch this class on Zenova Educations.",

      url:
        shareUrl

    };


    try {

      if (
        navigator.share
      ) {

        await navigator.share(
          shareData
        );

        return;
      }


      // Desktop fallback

      await navigator.clipboard.writeText(
        shareUrl
      );


      const originalText =
        shareBtn.innerText;


      shareBtn.innerText =
        "Link Copied";


      setTimeout(
        () => {

          shareBtn.innerText =
            originalText;

        },
        1800
      );


    } catch (error) {

      console.log(
        "Share cancelled:",
        error
      );

    }

  }
);


// =========================================================
// BACK
// =========================================================

backBtn.addEventListener(
  "click",
  () => {

    window.history.back();

  }
);


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


function escapeAttribute(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

}

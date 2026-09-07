import { auth, db } from "../../../firebase/firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  doc,
  getDoc
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

const videoPlayer =
  document.getElementById(
    "videoPlayer"
  );

const playerLoading =
  document.getElementById(
    "playerLoading"
  );

const videoTitle =
  document.getElementById(
    "videoTitle"
  );

const subjectName =
  document.getElementById(
    "subjectName"
  );

const chapterName =
  document.getElementById(
    "chapterName"
  );

const teacherName =
  document.getElementById(
    "teacherName"
  );

const videoDescription =
  document.getElementById(
    "videoDescription"
  );

const descriptionSection =
  document.getElementById(
    "descriptionSection"
  );

const errorState =
  document.getElementById(
    "errorState"
  );

const backBtn =
  document.getElementById(
    "backBtn"
  );

const askDoubtBtn =
  document.getElementById(
    "askDoubtBtn"
  );

const shareBtn =
  document.getElementById(
    "shareBtn"
  );

const saveBtn =
  document.getElementById(
    "saveBtn"
  );


/* =========================================
   URL
========================================= */

const params =
  new URLSearchParams(
    window.location.search
  );

const videoId =
  params.get("id");


/* =========================================
   STATE
========================================= */

let currentUser = null;

let currentVideo = null;

let currentChapter = null;

let currentSubject = null;


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


    if (!videoId) {

      showError(
        "Video was not selected."
      );

      finishLoading();

      return;
    }


    try {

      await loadVideo();

      await loadChapterAndSubject();

      renderPage();

      finishLoading();

    } catch (error) {

      console.error(
        "VIDEO PLAYER ERROR:",
        error
      );

      showError(
        "We couldn't load this video right now."
      );

      finishLoading();

    }

  }
);


/* =========================================
   LOAD VIDEO
========================================= */

async function loadVideo() {

  const videoRef =
    doc(
      db,
      "hybridMaterials",
      videoId
    );


  const snapshot =
    await getDoc(
      videoRef
    );


  if (
    !snapshot.exists()
  ) {

    throw new Error(
      "Video does not exist."
    );

  }


  currentVideo = {
    id: snapshot.id,
    ...snapshot.data()
  };


  if (
    currentVideo.active === false
  ) {

    throw new Error(
      "Video is inactive."
    );

  }


  if (
    String(
      currentVideo.type || ""
    ).toUpperCase()
    !==
    "VIDEO"
  ) {

    throw new Error(
      "Selected material is not a video."
    );

  }


  if (
    !currentVideo.videoUrl
  ) {

    throw new Error(
      "Video URL is missing."
    );

  }

}


/* =========================================
   LOAD CHAPTER + SUBJECT
========================================= */

async function loadChapterAndSubject() {

  if (
    !currentVideo.chapterId
  ) {

    return;
  }


  const chapterRef =
    doc(
      db,
      "hybridChapters",
      currentVideo.chapterId
    );


  const chapterSnapshot =
    await getDoc(
      chapterRef
    );


  if (
    chapterSnapshot.exists()
  ) {

    currentChapter = {
      id: chapterSnapshot.id,
      ...chapterSnapshot.data()
    };

  }


  const subjectId =
    currentVideo.subjectId ||
    currentChapter?.subjectId;


  if (!subjectId) {
    return;
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

    currentSubject = {
      id: subjectSnapshot.id,
      ...subjectSnapshot.data()
    };

  }

}


/* =========================================
   RENDER
========================================= */

function renderPage() {

  videoTitle.textContent =
    currentVideo.title ||
    "Untitled Video";


  subjectName.textContent =
    currentSubject?.name ||
    "Subject";


  chapterName.textContent =
    currentChapter?.title ||
    currentChapter?.chapterName ||
    "Chapter";


  if (
    currentVideo.teacherName
  ) {

    teacherName.textContent =
      `Teacher: ${
        currentVideo.teacherName
      }`;

  }


  if (
    currentVideo.description
  ) {

    descriptionSection.classList.remove(
      "hidden"
    );

    videoDescription.textContent =
      currentVideo.description;

  }


  /*
    Load embedded video.

    This is the URL saved by Admin.
  */

  videoPlayer.src =
    currentVideo.videoUrl;


  videoPlayer.onload =
    () => {

      playerLoading.classList.add(
        "hidden"
      );

      videoPlayer.classList.remove(
        "hidden"
      );

    };


  /*
    In case the iframe does not
    fire load immediately.
  */

  setTimeout(
    () => {

      playerLoading.classList.add(
        "hidden"
      );

      videoPlayer.classList.remove(
        "hidden"
      );

    },
    1500
  );

}


/* =========================================
   BACK
========================================= */

backBtn.addEventListener(
  "click",
  () => {

    if (
      currentVideo?.chapterId
    ) {

      window.location.href =
        `../viewchapterdetails/?id=${
          encodeURIComponent(
            currentVideo.chapterId
          )
        }`;

      return;
    }


    window.history.back();

  }
);


/* =========================================
   ASK DOUBT
========================================= */

askDoubtBtn.addEventListener(
  "click",
  () => {

    window.location.href =
      `../askdoubt/?id=${
        encodeURIComponent(
          videoId
        )
      }`;

  }
);


/* =========================================
   SHARE
========================================= */

shareBtn.addEventListener(
  "click",
  async () => {

    const shareData = {

      title:
        currentVideo?.title ||
        "Zenova Video",

      text:
        "Watch this class on Zenova Educations.",

      url:
        window.location.href

    };


    try {

      if (
        navigator.share
      ) {

        await navigator.share(
          shareData
        );

      } else {

        await navigator.clipboard.writeText(
          window.location.href
        );

        shareBtn.textContent =
          "Link Copied";

        setTimeout(
          () => {

            shareBtn.textContent =
              "Share";

          },
          1800
        );

      }

    } catch (error) {

      /*
        User may simply cancel
        the native share dialog.
      */

      console.log(
        "Share cancelled.",
        error
      );

    }

  }
);


/* =========================================
   SAVE VIDEO
========================================= */

saveBtn.addEventListener(
  "click",
  () => {

    /*
      UI only for now.

      We have NOT created a
      savedVideos collection yet.

      Once the Save Video backend
      structure is finalized, this
      button can be connected.
    */

    saveBtn.classList.toggle(
      "saved"
    );


    if (
      saveBtn.classList.contains(
        "saved"
      )
    ) {

      saveBtn.textContent =
        "Saved";

    } else {

      saveBtn.textContent =
        "Save Video";

    }

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
   ESCAPE
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

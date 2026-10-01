import { auth, db } from "../../firebase/firebase-config.js";

import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  getFunctions,
  httpsCallable
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-functions.js";


const LIVE_CLASSES = "liveClasses";

const functions = getFunctions(
  undefined,
  "asia-south1"
);

const getZoomHostJoinData =
  httpsCallable(functions, "getZoomHostJoinData");


const classesContainer =
  document.getElementById("classes");

const loading =
  document.getElementById("loading");

const previewOverlay =
  document.getElementById("previewOverlay");

const cameraPreview =
  document.getElementById("cameraPreview");

const cameraStatus =
  document.getElementById("cameraStatus");

const micStatus =
  document.getElementById("micStatus");

const previewError =
  document.getElementById("previewError");

const cancelPreview =
  document.getElementById("cancelPreview");

const goLiveButton =
  document.getElementById("goLiveButton");

const previewTitle =
  document.getElementById("previewTitle");

const previewSubtitle =
  document.getElementById("previewSubtitle");

const cameraName =
  document.getElementById("cameraName");


let currentClass = null;
let cameraStream = null;


/* ---------------------------------
   AUTH
---------------------------------- */

onAuthStateChanged(auth, async (user) => {

  if (!user) {

    loading.textContent =
      "Please sign in to access the Faculty Live Portal.";

    return;
  }

  await loadLiveClasses();

});


/* ---------------------------------
   LOAD LIVE CLASSES
---------------------------------- */

async function loadLiveClasses() {

  loading.style.display = "block";

  classesContainer.innerHTML = "";

  try {

    const q = query(
      collection(db, LIVE_CLASSES),
      where("status", "==", "SCHEDULED")
    );

    const snapshot = await getDocs(q);

    const classes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));


    classes.sort((a, b) => {

      const aDate =
        `${a.scheduledDate || ""} ${a.scheduledTime || ""}`;

      const bDate =
        `${b.scheduledDate || ""} ${b.scheduledTime || ""}`;

      return aDate.localeCompare(bDate);

    });


    loading.style.display = "none";


    if (!classes.length) {

      classesContainer.innerHTML = `
        <div class="empty">
          <strong>No scheduled live classes</strong>
          There are currently no classes available to start.
        </div>
      `;

      return;
    }


    classes.forEach(renderClass);

  } catch (error) {

    console.error(
      "Failed to load live classes:",
      error
    );

    loading.textContent =
      "Unable to load live classes.";

  }

}


/* ---------------------------------
   RENDER CLASS
---------------------------------- */

function renderClass(liveClass) {

  const card =
    document.createElement("div");

  card.className = "class-card";


  const thumbnail =
    liveClass.thumbnailUrl
      ? `
        <img
          src="${escapeHtml(liveClass.thumbnailUrl)}"
          alt="">
      `
      : `
        <div class="thumbnail-placeholder">
          ZENOVA
        </div>
      `;


  card.innerHTML = `

    <div class="thumbnail">

      ${thumbnail}

      <div class="live-badge">
        LIVE CLASS
      </div>

    </div>


    <div class="card-body">

      <div class="course-name">
        ${escapeHtml(
          liveClass.courseName || "Zenova Course"
        )}
      </div>


      <div class="class-title">
        ${escapeHtml(
          liveClass.title || "Live Class"
        )}
      </div>


      <div class="details">

        ${escapeHtml(
          liveClass.subjectName || ""
        )}

        ${liveClass.chapterName
          ? ` • ${escapeHtml(liveClass.chapterName)}`
          : ""
        }

        <br>

        ${escapeHtml(
          liveClass.scheduledDate || ""
        )}

        ${liveClass.scheduledTime
          ? ` • ${escapeHtml(liveClass.scheduledTime)}`
          : ""
        }

        ${liveClass.duration
          ? ` • ${liveClass.duration} min`
          : ""
        }

      </div>


      <div class="faculty">

        Faculty:
        <strong>
          ${escapeHtml(
            liveClass.faculty ||
            liveClass.teacherName ||
            "Faculty"
          )}
        </strong>

      </div>


      <div class="actions">

        <button
          class="start-btn">

          START LIVE

        </button>

      </div>

    </div>
  `;


  const button =
    card.querySelector(".start-btn");


  button.addEventListener(
    "click",
    () => openPreview(liveClass)
  );


  classesContainer.appendChild(card);

}


/* ---------------------------------
   OPEN CAMERA PREVIEW
---------------------------------- */

async function openPreview(liveClass) {

  currentClass = liveClass;

  previewTitle.textContent =
    liveClass.title || "Live Class";

  previewSubtitle.textContent =
    `${liveClass.subjectName || ""} • ` +
    `${liveClass.chapterName || ""}`;

  cameraName.textContent =
    liveClass.faculty ||
    liveClass.teacherName ||
    "Faculty";

  previewError.style.display = "none";

  previewError.textContent = "";

  goLiveButton.disabled = true;

  previewOverlay.classList.add("show");


  try {

    cameraStream =
      await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });


    cameraPreview.srcObject =
      cameraStream;


    cameraStatus.textContent =
      "Ready";

    cameraStatus.style.color =
      "#16a34a";


    micStatus.textContent =
      "Ready";

    micStatus.style.color =
      "#16a34a";


    goLiveButton.disabled = false;


  } catch (error) {

    console.error(
      "Camera/microphone error:",
      error
    );


    cameraStatus.textContent =
      "Permission required";

    micStatus.textContent =
      "Permission required";


    previewError.textContent =
      "Please allow camera and microphone access in your browser.";

    previewError.style.display =
      "block";

  }

}


/* ---------------------------------
   CANCEL PREVIEW
---------------------------------- */

cancelPreview.addEventListener(
  "click",
  closePreview
);


function closePreview() {

  stopCamera();

  previewOverlay.classList.remove("show");

  currentClass = null;

}


/* ---------------------------------
   START LIVE
---------------------------------- */

goLiveButton.addEventListener(
  "click",
  startLive
);


async function startLive() {

  if (!currentClass) {
    return;
  }


  goLiveButton.disabled = true;

  goLiveButton.textContent =
    "CONNECTING...";


  try {

    /*
      Get the host's Zoom SDK
      signature + ZAK from Firebase.
    */

    const result =
      await getZoomHostJoinData({
        liveClassId: currentClass.id,
        meetingNumber:
          currentClass.zoomMeetingNumber ||
          currentClass.zoomMeetingId
      });


    const data =
      result.data;


    if (!data) {
      throw new Error(
        "Zoom host information was not returned."
      );
    }


    /*
      Save the class details temporarily.
      The actual Zoom classroom will
      be opened by the start-live page.
    */

    sessionStorage.setItem(
      "zenovaHostLive",
      JSON.stringify({
        liveClassId: currentClass.id,
        meetingNumber:
          currentClass.zoomMeetingNumber ||
          currentClass.zoomMeetingId,
        password:
          currentClass.zoomPassword || "",
        title:
          currentClass.title || "Live Class",
        subjectName:
          currentClass.subjectName || "",
        chapterName:
          currentClass.chapterName || "",
        faculty:
          currentClass.faculty ||
          currentClass.teacherName ||
          "Faculty",
        signature:
          data.signature,
        zak:
          data.zak,
        sdkKey:
          data.sdkKey
      })
    );


    stopCamera();


    /*
      For now this points to the
      faculty classroom page we will create
      next.
    */

    window.location.href =
      "./classroom.html";


  } catch (error) {

    console.error(
      "START LIVE ERROR:",
      error
    );


    previewError.textContent =
      error?.message ||
      "Unable to start the live class.";

    previewError.style.display =
      "block";


    goLiveButton.disabled = false;

    goLiveButton.textContent =
      "START LIVE";

  }

}


/* ---------------------------------
   STOP CAMERA
---------------------------------- */

function stopCamera() {

  if (!cameraStream) {
    return;
  }


  cameraStream
    .getTracks()
    .forEach(track => track.stop());


  cameraStream = null;

  cameraPreview.srcObject = null;

}


/* ---------------------------------
   ESCAPE HTML
---------------------------------- */

function escapeHtml(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

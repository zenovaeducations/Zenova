/* =========================================================
   ZENOVA AI
   Frontend foundation
========================================================= */

import { auth, db } from "../../firebase/firebase-config.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================================
   ELEMENTS
========================================================= */

const loadingScreen =
  document.getElementById("loadingScreen");

const app =
  document.getElementById("app");

const backBtn =
  document.getElementById("backBtn");

const notificationBtn =
  document.getElementById("notificationBtn");

const studentGreeting =
  document.getElementById("studentGreeting");

const questionInput =
  document.getElementById("questionInput");

const sendBtn =
  document.getElementById("sendBtn");

const cameraBtn =
  document.getElementById("cameraBtn");

const voiceBtn =
  document.getElementById("voiceBtn");

const questionImageInput =
  document.getElementById("questionImageInput");

const chatModal =
  document.getElementById("chatModal");

const closeChatBtn =
  document.getElementById("closeChatBtn");

const chatTitle =
  document.getElementById("chatTitle");

const chatMessages =
  document.getElementById("chatMessages");

const chatInput =
  document.getElementById("chatInput");

const chatSendBtn =
  document.getElementById("chatSendBtn");

const chatCameraBtn =
  document.getElementById("chatCameraBtn");


/* =========================================================
   STATE
========================================================= */

let currentUser = null;
let currentStudent = null;

let currentMode = "doubt";


/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  setupEvents();

  onAuthStateChanged(auth, async (user) => {

    if (!user) {
      window.location.href = "../login/";
      return;
    }

    currentUser = user;

    await loadStudentProfile(user.uid);

    hideLoader();

  });

});


/* =========================================================
   LOAD STUDENT
========================================================= */

async function loadStudentProfile(uid) {

  try {

    /*
      Student-facing profile.

      We are using students/{uid}
      to stay aligned with the existing
      student portal architecture.
    */

    const studentRef =
      doc(db, "students", uid);

    const snap =
      await getDoc(studentRef);

    if (snap.exists()) {

      currentStudent = {
        id: uid,
        ...snap.data()
      };

      const name =
        currentStudent.name ||
        currentStudent.fullName ||
        currentUser.displayName ||
        "Student";

      studentGreeting.textContent =
        `Hello, ${getFirstName(name)} 👋`;

    } else {

      studentGreeting.textContent =
        `Hello 👋`;

    }

  } catch (error) {

    console.error(
      "Failed to load student profile:",
      error
    );

    studentGreeting.textContent =
      "Hello 👋";

  }

}


/* =========================================================
   LOADER
========================================================= */

function hideLoader() {

  loadingScreen.style.opacity = "0";

  setTimeout(() => {

    loadingScreen.classList.add("hidden");

    app.classList.remove("hidden");

  }, 250);

}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

  /* Back */

  backBtn.addEventListener("click", () => {

    if (document.referrer) {

      history.back();

    } else {

      window.location.href = "../";

    }

  });


  /* Notifications */

  notificationBtn.addEventListener("click", () => {

    window.location.href =
      "../notifications/";

  });


  /* Main question */

  sendBtn.addEventListener("click", () => {

    const question =
      questionInput.value.trim();

    if (!question) {

      openChat("Ask Zenova");

      return;

    }

    openChat(
      "Ask Zenova",
      question
    );

  });


  questionInput.addEventListener(
    "keydown",
    (event) => {

      if (event.key === "Enter") {

        event.preventDefault();

        sendBtn.click();

      }

    }
  );


  /* Camera */

  cameraBtn.addEventListener(
    "click",
    () => {

      questionImageInput.click();

    }
  );


  chatCameraBtn.addEventListener(
    "click",
    () => {

      questionImageInput.click();

    }
  );


  questionImageInput.addEventListener(
    "change",
    handleImageQuestion
  );


  /* Voice */

  voiceBtn.addEventListener(
    "click",
    startVoiceInput
  );


  /* Close chat */

  closeChatBtn.addEventListener(
    "click",
    closeChat
  );


  document
    .querySelector(".modal-backdrop")
    .addEventListener(
      "click",
      closeChat
    );


  /* Chat send */

  chatSendBtn.addEventListener(
    "click",
    sendChatMessage
  );


  chatInput.addEventListener(
    "keydown",
    (event) => {

      if (event.key === "Enter") {

        event.preventDefault();

        sendChatMessage();

      }

    }
  );


  /* Quick cards */

  document
    .querySelectorAll(".quick-card")
    .forEach(card => {

      card.addEventListener(
        "click",
        () => {

          const mode =
            card.dataset.mode;

          handleQuickMode(mode);

        }

      );

    });


  /* Recommendation */

  document
    .getElementById("startRecommendationBtn")
    .addEventListener(
      "click",
      () => {

        openRecommendation();

      }
    );


  /* Weakness */

  document
    .getElementById("fixWeaknessBtn")
    .addEventListener(
      "click",
      () => {

        openChat(
          "Fix My Weakness",
          "Help me fix my current weakness in Physics."
        );

      }
    );


  /* Course */

  document
    .getElementById("viewCourseBtn")
    .addEventListener(
      "click",
      () => {

        window.location.href =
          "../study/";

      }
    );


  /* Progress */

  document
    .getElementById("progressBtn")
    .addEventListener(
      "click",
      () => {

        openChat(
          "My Learning",
          "Analyse my learning progress and tell me what I should improve."
        );

      }
    );


  /* Mistakes */

  document
    .getElementById("mistakesBtn")
    .addEventListener(
      "click",
      () => {

        openChat(
          "My Mistakes",
          "Show me the mistakes I should revise and explain what I need to improve."
        );

      }
    );


  /* Bottom navigation */

  document
    .querySelectorAll(".nav-item")
    .forEach(item => {

      item.addEventListener(
        "click",
        () => {

          const route =
            item.dataset.route;

          if (route) {

            window.location.href =
              route;

          }

        }
      );

    });

}


/* =========================================================
   QUICK MODES
========================================================= */

function handleQuickMode(mode) {

  currentMode = mode;

  const configs = {

    doubt: {
      title: "Ask a Doubt",
      prompt: ""
    },

    practice: {
      title: "Practice",
      prompt:
        "Give me practice questions based on what I need to improve."
    },

    revise: {
      title: "Revise",
      prompt:
        "Create a short revision session based on my weak topics."
    },

    master: {
      title: "Master a Topic",
      prompt: ""
    }

  };

  const config =
    configs[mode];

  if (!config) return;

  openChat(
    config.title,
    config.prompt
  );

}


/* =========================================================
   OPEN CHAT
========================================================= */

function openChat(
  title = "Ask Zenova",
  initialMessage = ""
) {

  currentMode = title;

  chatTitle.textContent =
    title;

  chatModal.classList.remove(
    "hidden"
  );

  document.body.style.overflow =
    "hidden";

  if (initialMessage) {

    addUserMessage(
      initialMessage
    );

    /*
      Temporary local response.

      Later this function will call
      the Zenova AI backend.
    */

    setTimeout(() => {

      generateDemoResponse(
        initialMessage
      );

    }, 450);

  }

  setTimeout(() => {

    chatInput.focus();

  }, 150);

}


/* =========================================================
   CLOSE CHAT
========================================================= */

function closeChat() {

  chatModal.classList.add(
    "hidden"
  );

  document.body.style.overflow =
    "";

}


/* =========================================================
   SEND CHAT
========================================================= */

function sendChatMessage() {

  const text =
    chatInput.value.trim();

  if (!text) return;

  addUserMessage(text);

  chatInput.value = "";

  /*
    Temporary frontend response.

    Replace with:
      callZenovaAI(text)
  */

  setTimeout(() => {

    generateDemoResponse(text);

  }, 500);

}


/* =========================================================
   USER MESSAGE
========================================================= */

function addUserMessage(text) {

  const wrapper =
    document.createElement("div");

  wrapper.className =
    "message user-message";

  wrapper.innerHTML = `

    <div class="message-bubble">

      <strong>You</strong>

      <p>
        ${escapeHTML(text)}
      </p>

    </div>

  `;

  chatMessages.appendChild(
    wrapper
  );

  scrollChatToBottom();

}


/* =========================================================
   AI MESSAGE
========================================================= */

function addAIMessage({
  text,
  video = null,
  question = null
}) {

  const wrapper =
    document.createElement("div");

  wrapper.className =
    "message ai-message";

  let html = `

    <div class="message-avatar">
      Z
    </div>

    <div class="message-bubble">

      <strong>Zenova AI</strong>

      <p>
        ${escapeHTML(text)}
      </p>

  `;


  /* Video recommendation */

  if (video) {

    html += `

      <div
        style="
          margin-top:10px;
          padding:10px;
          border:1px solid #e5e5e5;
          border-radius:10px;
          background:#fff;
        "
      >

        <div
          style="
            font-size:9px;
            color:#6d28d9;
            font-weight:800;
            letter-spacing:1px;
          "
        >
          FROM YOUR ZENOVA COURSE
        </div>

        <div
          style="
            font-size:11px;
            font-weight:700;
            margin-top:5px;
          "
        >
          ${escapeHTML(video.title)}
        </div>

        <div
          style="
            font-size:9px;
            color:#777;
            margin-top:3px;
          "
        >
          ${escapeHTML(video.path)}
        </div>

        <button
          class="primary-btn"
          style="
            margin-top:9px;
            min-height:38px;
          "
          data-video-id="${escapeHTML(video.id)}"
        >
          WATCH FROM ${escapeHTML(video.timestamp)}
          →
        </button>

      </div>

    `;

  }


  /* Practice question */

  if (question) {

    html += `

      <div
        style="
          margin-top:10px;
          padding:11px;
          border:1px solid #e5e5e5;
          border-radius:10px;
          background:#fff;
        "
      >

        <div
          style="
            font-size:9px;
            color:#6d28d9;
            font-weight:800;
          "
        >
          CHECK YOUR UNDERSTANDING
        </div>

        <p
          style="
            margin-top:6px;
            font-size:11px;
          "
        >
          ${escapeHTML(question)}
        </p>

      </div>

    `;

  }


  html += `</div>`;

  wrapper.innerHTML =
    html;

  chatMessages.appendChild(
    wrapper
  );

  scrollChatToBottom();

}


/* =========================================================
   DEMO AI RESPONSE
========================================================= */

function generateDemoResponse(text) {

  const lower =
    text.toLowerCase();


  /*
    IMPORTANT:

    These are placeholder responses.

    The real version will NOT use these.

    It will call your backend AI system,
    which searches:
      - crmCourses
      - hybridSubjects
      - hybridChapters
      - course videos
      - PDFs
      - tests
      - student performance
  */


  if (
    lower.includes("kirchhoff") ||
    lower.includes("current")
  ) {

    addAIMessage({

      text:
        "Let's solve this step by step. I can also take you directly to the relevant part of your Zenova course instead of giving you only a textbook-style explanation.",

      video: {

        id: "demo-video-001",

        title:
          "Kirchhoff's Second Law",

        path:
          "Physics · Current Electricity",

        timestamp:
          "12:22"

      },

      question:
        "If a circuit has two loops, what should the algebraic sum of potential changes around a complete loop be?"

    });

    return;

  }


  if (
    lower.includes("practice")
  ) {

    addAIMessage({

      text:
        "I'll create practice based on the areas you need to improve. In the real version, the difficulty will automatically change according to your previous answers.",

      question:
        "A resistance of 6 Ω is connected to a 12 V source. What current flows through the circuit?"

    });

    return;

  }


  addAIMessage({

    text:
      "I understand. In the full Zenova AI system, I'll first understand your question, search your enrolled course content, find the most relevant video or PDF, and then explain the concept at your level. After that, I'll check whether you've actually understood it."

  });

}


/* =========================================================
   RECOMMENDATION
========================================================= */

function openRecommendation() {

  openChat(
    "Your Next Step",
    "Start my recommended Physics learning activity."
  );

}


/* =========================================================
   IMAGE QUESTION
========================================================= */

function handleImageQuestion(event) {

  const file =
    event.target.files?.[0];

  if (!file) return;

  openChat(
    "Question from Photo"
  );

  addUserMessage(
    "📷 I uploaded a question. Please analyse it."
  );


  setTimeout(() => {

    addAIMessage({

      text:
        "I received your question image. In the full Zenova AI system, I'll read the question, identify the chapter and concept, solve it step by step, and then find the exact Zenova course video that teaches the required concept."

    });

  }, 600);


  event.target.value = "";

}


/* =========================================================
   VOICE
========================================================= */

function startVoiceInput() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {

    openChat(
      "Voice Question",
      "Voice input is not supported in this browser."
    );

    return;

  }

  const recognition =
    new SpeechRecognition();

  recognition.lang =
    "en-IN";

  recognition.interimResults =
    false;

  recognition.maxAlternatives =
    1;


  recognition.onstart = () => {

    voiceBtn.textContent =
      "●";

  };


  recognition.onresult = (event) => {

    const transcript =
      event.results[0][0].transcript;

    questionInput.value =
      transcript;

    sendBtn.click();

  };


  recognition.onerror = (error) => {

    console.error(
      "Voice error:",
      error
    );

  };


  recognition.onend = () => {

    voiceBtn.textContent =
      "🎤";

  };


  recognition.start();

}


/* =========================================================
   CHAT SCROLL
========================================================= */

function scrollChatToBottom() {

  requestAnimationFrame(() => {

    chatMessages.scrollTop =
      chatMessages.scrollHeight;

  });

}


/* =========================================================
   FIRST NAME
========================================================= */

function getFirstName(name) {

  if (!name) return "Student";

  return name
    .trim()
    .split(/\s+/)[0];

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}

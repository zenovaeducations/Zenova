import { auth, db } from "../../firebase/firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    query,
    where,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   ELEMENTS
========================================================= */

const loader = document.getElementById("loader");
const app = document.getElementById("app");

const subjectsGrid = document.getElementById("subjectsGrid");

const emptyState = document.getElementById("emptyState");
const errorState = document.getElementById("errorState");
const errorText = document.getElementById("errorText");

const retryBtn = document.getElementById("retryBtn");

const mediumLabel = document.getElementById("mediumLabel");

const backBtn = document.getElementById("backBtn");
const notificationBtn = document.getElementById("notificationBtn");


/* =========================================================
   STATE
========================================================= */

let currentUser = null;
let studentData = null;

let studentMedium = "Kannada";
let studentClass = "";

let unsubscribeSubjects = null;


/* =========================================================
   UI
========================================================= */

function showApp() {

    loader.classList.add("hidden");
    app.classList.remove("hidden");
}


function showError(message) {

    subjectsGrid.innerHTML = "";

    emptyState.classList.add("hidden");

    errorText.textContent =
        message || "Something went wrong.";

    errorState.classList.remove("hidden");
}


function hideError() {

    errorState.classList.add("hidden");
}


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "../../login/";

        return;
    }

    currentUser = user;

    try {

        await loadStudent();

        showApp();

        loadSubjects();

    } catch (error) {

        console.error("Classes initialization error:", error);

        showApp();

        showError(
            "We couldn't load your student profile."
        );
    }

});


/* =========================================================
   STUDENT
========================================================= */

async function loadStudent() {

    const {
        getDoc,
        doc
    } = await import(
        "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js"
    );

    const studentRef =
        doc(db, "students", currentUser.uid);

    const studentSnap =
        await getDoc(studentRef);


    if (!studentSnap.exists()) {

        /*
         * If the student document doesn't exist,
         * Kannada is the fallback.
         */

        studentData = {};

    } else {

        studentData = studentSnap.data();

    }


    /*
     * MEDIUM FALLBACK
     *
     * If medium doesn't exist:
     * Kannada
     */

    studentMedium =
        normalizeMedium(studentData.medium);


    /*
     * CLASS
     */

    studentClass =
        String(
            studentData.class ||
            studentData.className ||
            ""
        ).trim();


    mediumLabel.textContent =
        `${studentMedium} Medium`;
}


/* =========================================================
   MEDIUM NORMALIZATION
========================================================= */

function normalizeMedium(value) {

    if (!value) {
        return "Kannada";
    }

    const medium =
        String(value)
            .trim()
            .toLowerCase();


    if (
        medium === "english" ||
        medium === "english medium"
    ) {

        return "English";
    }


    if (
        medium === "kannada" ||
        medium === "kannada medium"
    ) {

        return "Kannada";
    }


    /*
     * Unknown / old value
     * also falls back to Kannada.
     */

    return "Kannada";
}


/* =========================================================
   SUBJECTS
========================================================= */

function loadSubjects() {

    hideError();

    if (unsubscribeSubjects) {
        unsubscribeSubjects();
    }


    /*
     * IMPORTANT:
     *
     * We only query by medium.
     *
     * No orderBy() here.
     * This avoids unnecessary composite
     * Firestore indexes.
     */

    const subjectsQuery = query(
        collection(db, "hybridSubjects"),
        where("active", "==", true),
        where("medium", "==", studentMedium)
    );


    unsubscribeSubjects =
        onSnapshot(
            subjectsQuery,

            (snapshot) => {

                const subjects = [];


                snapshot.forEach((docSnap) => {

                    const data =
                        docSnap.data();

                    /*
                     * Class filtering is done
                     * locally so we don't need
                     * another Firestore index.
                     */

                    if (
                        isSubjectForStudent(
                            data
                        )
                    ) {

                        subjects.push({

                            id: docSnap.id,

                            ...data

                        });

                    }

                });


                subjects.sort(sortSubjects);

                renderSubjects(subjects);

            },

            (error) => {

                console.error(
                    "Subjects listener error:",
                    error
                );

                showError(
                    "Recorded classes could not be loaded."
                );

            }
        );
}


/* =========================================================
   CLASS FILTER
========================================================= */

function isSubjectForStudent(subject) {

    /*
     * If admin hasn't specified
     * targetClasses, show the subject.
     */

    if (
        !Array.isArray(
            subject.targetClasses
        ) ||
        subject.targetClasses.length === 0
    ) {

        return true;
    }


    /*
     * If student class is missing,
     * don't accidentally hide everything.
     */

    if (!studentClass) {

        return true;
    }


    const studentClassNormalized =
        normalizeClass(studentClass);


    return subject.targetClasses.some(
        (targetClass) => {

            return (
                normalizeClass(
                    targetClass
                ) === studentClassNormalized
            );

        }
    );
}


/* =========================================================
   CLASS NORMALIZATION
========================================================= */

function normalizeClass(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}


/* =========================================================
   SORT
========================================================= */

function sortSubjects(a, b) {

    const priorityA =
        Number(a.priority ?? 9999);

    const priorityB =
        Number(b.priority ?? 9999);

    if (priorityA !== priorityB) {

        return priorityA - priorityB;

    }


    return String(a.name || "")
        .localeCompare(
            String(b.name || "")
        );
}


/* =========================================================
   RENDER
========================================================= */

function renderSubjects(subjects) {

    subjectsGrid.innerHTML = "";

    errorState.classList.add("hidden");


    if (subjects.length === 0) {

        emptyState.classList.remove("hidden");

        return;
    }


    emptyState.classList.add("hidden");


    subjects.forEach(
        (subject, index) => {

            const card =
                document.createElement("article");

            card.className =
                "subject-card";


            const subjectNumber =
                String(index + 1)
                    .padStart(2, "0");


            const name =
                escapeHTML(
                    subject.name ||
                    "Subject"
                );


            const description =
                escapeHTML(
                    subject.description ||
                    "Recorded classes and chapter lessons."
                );


            card.innerHTML = `

                <div>

                    <div class="subject-top">

                        <div class="subject-number">
                            ${subjectNumber}
                        </div>

                        <div class="subject-arrow">
                            ›
                        </div>

                    </div>


                    <h3>
                        ${name}
                    </h3>

                    <p>
                        ${description}
                    </p>

                </div>


                <div class="subject-footer">

                    <span class="open-text">
                        OPEN SUBJECT
                    </span>

                </div>

            `;


            card.addEventListener(
                "click",
                () => {

                    openSubject(
                        subject.id
                    );

                }
            );


            subjectsGrid.appendChild(card);

        }
    );
}


/* =========================================================
   OPEN SUBJECT
========================================================= */

function openSubject(subjectId) {

    if (!subjectId) {
        return;
    }


    window.location.href =
        `./subject.html?id=${encodeURIComponent(subjectId)}`;
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   BUTTONS
========================================================= */

backBtn.addEventListener(
    "click",
    () => {

        window.location.href = "../";

    }
);


notificationBtn.addEventListener(
    "click",
    () => {

        window.location.href =
            "../more/";

    }
);


retryBtn.addEventListener(
    "click",
    () => {

        loadSubjects();

    }
);

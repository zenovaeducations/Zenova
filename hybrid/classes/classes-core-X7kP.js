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
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   ELEMENTS
========================================================= */

const loader =
    document.getElementById("loader");

const app =
    document.getElementById("app");

const subjectsGrid =
    document.getElementById("subjectsGrid");

const emptyState =
    document.getElementById("emptyState");

const errorState =
    document.getElementById("errorState");

const errorText =
    document.getElementById("errorText");

const retryBtn =
    document.getElementById("retryBtn");

const mediumLabel =
    document.getElementById("mediumLabel");

const backBtn =
    document.getElementById("backBtn");

const notificationBtn =
    document.getElementById("notificationBtn");


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let student = {};

let studentMedium = "Kannada";

let studentClass = "";

let unsubscribeSubjects = null;


/* =========================================================
   START
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.replace(
                "../../login/"
            );

            return;
        }


        currentUser = user;


        try {

            await loadStudent();

            showApp();

            loadSubjects();

        } catch (error) {

            console.error(
                "ZENOVA CLASSES:",
                error
            );

            showApp();

            showError(
                "We couldn't load your Classes."
            );

        }

    }
);


/* =========================================================
   STUDENT
========================================================= */

async function loadStudent() {

    const studentRef =
        doc(
            db,
            "students",
            currentUser.uid
        );


    const snapshot =
        await getDoc(studentRef);


    if (!snapshot.exists()) {

        /*
         * Old / incomplete profile.
         *
         * Kannada is the default.
         */

        student = {};

    } else {

        student =
            snapshot.data();

    }


    /*
     * IMPORTANT
     *
     * Your existing student profile
     * uses className.
     */

    studentClass =
        String(
            student.className || ""
        ).trim();


    /*
     * MEDIUM
     *
     * If medium is missing:
     * Kannada
     */

    studentMedium =
        normalizeMedium(
            student.medium
        );


    mediumLabel.textContent =
        `${studentMedium} Medium`;
}


/* =========================================================
   MEDIUM
========================================================= */

function normalizeMedium(value) {

    if (!value) {

        return "Kannada";

    }


    const valueNormalized =
        String(value)
            .trim()
            .toLowerCase();


    if (
        valueNormalized === "english" ||
        valueNormalized === "english medium"
    ) {

        return "English";

    }


    if (
        valueNormalized === "kannada" ||
        valueNormalized === "kannada medium"
    ) {

        return "Kannada";

    }


    /*
     * Unknown value
     * = Kannada fallback
     */

    return "Kannada";
}


/* =========================================================
   LOAD SUBJECTS
========================================================= */

function loadSubjects() {

    hideError();


    if (unsubscribeSubjects) {

        unsubscribeSubjects();

    }


    /*
     * ONLY QUERY ACTIVE.
     *
     * We intentionally DO NOT query medium here.
     *
     * This means:
     *
     * - no composite index problem
     * - old documents without medium still work
     * - medium filtering happens locally
     */

    const subjectsQuery =
        query(
            collection(
                db,
                "hybridSubjects"
            ),
            where(
                "active",
                "==",
                true
            )
        );


    unsubscribeSubjects =
        onSnapshot(

            subjectsQuery,

            (snapshot) => {

                const subjects = [];


                snapshot.forEach(
                    (docSnapshot) => {

                        const data =
                            docSnapshot.data();


                        /*
                         * MEDIUM FILTER
                         */

                        if (
                            !isCorrectMedium(
                                data
                            )
                        ) {

                            return;

                        }


                        /*
                         * CLASS FILTER
                         */

                        if (
                            !isCorrectClass(
                                data
                            )
                        ) {

                            return;

                        }


                        subjects.push({

                            id:
                                docSnapshot.id,

                            ...data

                        });

                    }
                );


                subjects.sort(
                    sortSubjects
                );


                renderSubjects(
                    subjects
                );

            },

            (error) => {

                console.error(
                    "Firebase subjects error:",
                    error
                );


                showError(
                    firebaseErrorMessage(
                        error
                    )
                );

            }
        );
}


/* =========================================================
   MEDIUM FILTER
========================================================= */

function isCorrectMedium(subject) {

    /*
     * VERY IMPORTANT:
     *
     * If an old Firebase subject doesn't
     * have medium, we consider it Kannada.
     *
     * So:
     *
     * missing medium + Kannada student
     * = SHOW
     *
     * missing medium + English student
     * = HIDE
     */

    const contentMedium =
        normalizeMedium(
            subject.medium
        );


    return (
        contentMedium ===
        studentMedium
    );
}


/* =========================================================
   CLASS FILTER
========================================================= */

function isCorrectClass(subject) {

    /*
     * If admin hasn't assigned classes,
     * show it to everyone in this medium.
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
     * If student class isn't available,
     * don't hide the content.
     */

    if (!studentClass) {

        return true;

    }


    const studentClassNormalized =
        normalizeClass(
            studentClass
        );


    return subject.targetClasses.some(
        (targetClass) => {

            return (
                normalizeClass(
                    targetClass
                ) ===
                studentClassNormalized
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
        Number(
            a.priority ?? 9999
        );


    const priorityB =
        Number(
            b.priority ?? 9999
        );


    if (
        priorityA !==
        priorityB
    ) {

        return (
            priorityA -
            priorityB
        );

    }


    return String(
        a.name || ""
    ).localeCompare(
        String(
            b.name || ""
        )
    );
}


/* =========================================================
   RENDER SUBJECTS
========================================================= */

function renderSubjects(
    subjects
) {

    subjectsGrid.innerHTML = "";

    errorState.classList.add(
        "hidden"
    );


    if (
        subjects.length === 0
    ) {

        emptyState.classList.remove(
            "hidden"
        );

        return;
    }


    emptyState.classList.add(
        "hidden"
    );


    subjects.forEach(
        (subject, index) => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "subject-card";


            const number =
                String(
                    index + 1
                ).padStart(
                    2,
                    "0"
                );


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
                            ${number}
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

                    window.location.href =
                        `./subject.html?id=${encodeURIComponent(
                            subject.id
                        )}`;

                }
            );


            subjectsGrid.appendChild(
                card
            );

        }
    );
}


/* =========================================================
   ERROR
========================================================= */

function showError(
    message
) {

    subjectsGrid.innerHTML = "";

    emptyState.classList.add(
        "hidden"
    );

    errorText.textContent =
        message ||
        "Something went wrong.";

    errorState.classList.remove(
        "hidden"
    );
}


function hideError() {

    errorState.classList.add(
        "hidden"
    );
}


function firebaseErrorMessage(
    error
) {

    if (
        error?.code ===
        "permission-denied"
    ) {

        return (
            "Firebase permission denied. " +
            "Check your Firestore rules."
        );

    }


    if (
        error?.code ===
        "failed-precondition"
    ) {

        return (
            "Firebase requires an index for this query."
        );

    }


    return (
        "Recorded classes could not be loaded."
    );
}


/* =========================================================
   HTML SAFETY
========================================================= */

function escapeHTML(value) {

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


/* =========================================================
   NAVIGATION
========================================================= */

backBtn.addEventListener(
    "click",
    () => {

        window.location.href =
            "../";

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


/* =========================================================
   APP
========================================================= */

function showApp() {

    loader.classList.add(
        "hidden"
    );

    app.classList.remove(
        "hidden"
    );
}

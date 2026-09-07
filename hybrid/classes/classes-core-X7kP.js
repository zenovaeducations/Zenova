import {
    auth,
    db
} from "../../firebase/firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   ELEMENTS
========================================================= */

const loader =
    document.getElementById("loader");

const app =
    document.getElementById("app");

const subjectsList =
    document.getElementById("subjectsList");

const emptyState =
    document.getElementById("emptyState");


/* =========================================================
   STATE
========================================================= */

let currentUser = null;
let currentStudent = null;


/* =========================================================
   START
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "../../";

            return;
        }

        currentUser = user;

        try {

            await loadStudent();

            await loadSubjects();

            showApp();

        } catch (error) {

            console.error(
                "CLASSES ERROR:",
                error
            );

            showApp();

            showError(
                error
            );
        }
    }
);


/* =========================================================
   LOAD STUDENT
========================================================= */

async function loadStudent() {

    /*
     * Student profile is optional for displaying
     * subjects. Missing medium defaults to Kannada.
     */

    try {

        const { doc, getDoc } =
            await import(
                "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js"
            );

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

        if (snapshot.exists()) {

            currentStudent =
                snapshot.data();

        } else {

            currentStudent = {
                medium: "Kannada"
            };
        }

    } catch (error) {

        console.warn(
            "Student profile could not be loaded:",
            error
        );

        currentStudent = {
            medium: "Kannada"
        };
    }
}


/* =========================================================
   MEDIUM
========================================================= */

function normalizeMedium(
    value
) {

    if (!value) {

        return "Kannada";
    }

    const medium =
        String(value)
            .trim()
            .toLowerCase();

    if (
        medium === "both" ||
        medium === "all"
    ) {

        return "Both";
    }

    if (
        medium === "english" ||
        medium === "english medium"
    ) {

        return "English";
    }

    return "Kannada";
}


function canStudentSeeSubject(
    subject
) {

    const studentMedium =
        normalizeMedium(
            currentStudent?.medium
        );

    const subjectMedium =
        normalizeMedium(
            subject.medium
        );

    return (
        subjectMedium === "Both" ||
        subjectMedium === studentMedium
    );
}


/* =========================================================
   LOAD SUBJECTS
========================================================= */

async function loadSubjects() {

    subjectsList.innerHTML = "";

    emptyState.classList.add(
        "hidden"
    );


    const subjectsRef =
        collection(
            db,
            "hybridSubjects"
        );


    const subjectsQuery =
        query(
            subjectsRef,
            where(
                "active",
                "==",
                true
            )
        );


    const snapshot =
        await getDocs(
            subjectsQuery
        );


    let subjects =
        snapshot.docs.map(
            documentSnapshot => ({

                /*
                 * VERY IMPORTANT
                 *
                 * Always use the actual
                 * Firestore document ID.
                 */

                id:
                    documentSnapshot.id,

                ...documentSnapshot.data()

            })
        );


    /*
     * Medium filter.
     */

    subjects =
        subjects.filter(
            subject =>
                canStudentSeeSubject(
                    subject
                )
        );


    /*
     * Sort by priority.
     */

    subjects.sort(
        (a, b) =>
            Number(
                a.priority || 0
            ) -
            Number(
                b.priority || 0
            )
    );


    if (!subjects.length) {

        emptyState.classList.remove(
            "hidden"
        );

        return;
    }


    subjects.forEach(
        subject => {

            subjectsList.appendChild(
                createSubjectCard(
                    subject
                )
            );
        }
    );
}


/* =========================================================
   CREATE SUBJECT CARD
========================================================= */

function createSubjectCard(
    subject
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "subject-card";


    const name =
        subject.name ||
        subject.title ||
        "Subject";


    const description =
        subject.description ||
        "Recorded classes and study material";


    card.innerHTML = `

        <div class="subject-icon">

            <i class="ri-book-open-line"></i>

        </div>


        <div class="subject-info">

            <h3>
                ${escapeHTML(name)}
            </h3>

            <p>
                ${escapeHTML(description)}
            </p>

        </div>


        <div class="subject-arrow">

            <i class="ri-arrow-right-line"></i>

        </div>

    `;


    /*
     * =====================================================
     * THIS IS THE IMPORTANT PART
     * =====================================================
     *
     * We pass the REAL Firestore document ID.
     */

    card.addEventListener(
        "click",
        () => {

            if (!subject.id) {

                console.error(
                    "Subject has no Firestore ID:",
                    subject
                );

                alert(
                    "This subject has an invalid ID. Please contact the administrator."
                );

                return;
            }


            const url =
                new URL(
                    "./subject.html",
                    window.location.href
                );


            url.searchParams.set(
                "subjectId",
                subject.id
            );


            console.log(
                "Opening subject:",
                subject.name,
                "ID:",
                subject.id
            );


            window.location.href =
                url.toString();
        }
    );


    return card;
}


/* =========================================================
   SHOW APP
========================================================= */

function showApp() {

    if (loader) {

        loader.classList.add(
            "hidden"
        );
    }

    if (app) {

        app.classList.remove(
            "hidden"
        );
    }
}


/* =========================================================
   ERROR
========================================================= */

function showError(
    error
) {

    console.error(
        error
    );

    if (!subjectsList) {
        return;
    }

    subjectsList.innerHTML = `

        <div style="
            padding:40px;
            text-align:center;
            border:1px solid #eeeeee;
            border-radius:14px;
        ">

            <strong>
                Unable to load subjects
            </strong>

            <p style="
                margin-top:8px;
                color:#777;
                font-size:13px;
            ">
                ${
                    escapeHTML(
                        error?.message ||
                        "Please try again."
                    )
                }
            </p>

        </div>

    `;
}


/* =========================================================
   ESCAPE
========================================================= */

function escapeHTML(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

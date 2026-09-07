import { auth, db } from "../../firebase/firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// ELEMENTS
// =========================================================

const loadingScreen =
    document.getElementById(
        "loadingScreen"
    );

const app =
    document.getElementById(
        "app"
    );

const backBtn =
    document.getElementById(
        "backBtn"
    );

const liveClassesContainer =
    document.getElementById(
        "liveClassesContainer"
    );

const noLiveClasses =
    document.getElementById(
        "noLiveClasses"
    );

const subjectsContainer =
    document.getElementById(
        "subjectsContainer"
    );

const noSubjects =
    document.getElementById(
        "noSubjects"
    );


// =========================================================
// SHOW APP
// =========================================================

function showApp() {

    loadingScreen.classList.add(
        "hidden"
    );

    app.classList.remove(
        "hidden"
    );
}


// =========================================================
// AUTHENTICATION
// =========================================================

onAuthStateChanged(
    auth,
    async (user) => {

        // -------------------------------------------------
        // NOT LOGGED IN
        // -------------------------------------------------

        if (!user) {

            window.location.href =
                "../../index.html";

            return;
        }


        // -------------------------------------------------
        // LOGGED IN
        // -------------------------------------------------

        try {

            // Get the student document first.
            // This is required for medium filtering.

            const studentSnap =
                await getDoc(
                    doc(
                        db,
                        "students",
                        user.uid
                    )
                );


            const student =
                studentSnap.exists()
                    ? studentSnap.data()
                    : {};


            // -------------------------------------------------
            // LOAD BOTH SECTIONS
            // -------------------------------------------------

            await Promise.all([
                loadLiveClasses(),
                loadSubjects(student)
            ]);


            // -------------------------------------------------
            // ONLY SHOW AFTER FIREBASE LOAD
            // -------------------------------------------------

            showApp();

        } catch (error) {

            console.error(
                "Classes page error:",
                error
            );


            // We still show the page rather than leaving
            // the student stuck on the loader.

            showApp();

        }

    }
);


// =========================================================
// LIVE CLASSES
// =========================================================

async function loadLiveClasses() {

    liveClassesContainer.innerHTML = "";

    noLiveClasses.classList.add(
        "hidden"
    );


    /*
        EXISTING FIRESTORE COLLECTION:

        hybridClasses

        We are NOT creating another collection.
    */

    const snapshot =
        await getDocs(
            collection(
                db,
                "hybridClasses"
            )
        );


    const liveClasses = [];


    snapshot.forEach(
        (docSnap) => {

            const data =
                docSnap.data();


            /*
                Only active classes are considered.

                The actual live-status fields already
                used by your Hybrid system should determine
                whether a class is currently live.

                This section deliberately does not create
                fake classes.
            */

            if (
                data.active === false
            ) {
                return;
            }


            if (
                isCurrentlyLive(data)
            ) {

                liveClasses.push({
                    id: docSnap.id,
                    ...data
                });

            }

        }
    );


    // -------------------------------------------------------
    // NO LIVE CLASSES
    // -------------------------------------------------------

    if (
        liveClasses.length === 0
    ) {

        noLiveClasses.classList.remove(
            "hidden"
        );

        return;
    }


    // -------------------------------------------------------
    // LIVE CARDS
    // -------------------------------------------------------

    liveClasses.forEach(
        (liveClass) => {

            renderLiveClass(
                liveClass
            );

        }
    );

}


// =========================================================
// LIVE STATUS
// =========================================================

function isCurrentlyLive(data) {

    /*
        IMPORTANT:

        This function is kept isolated because the exact
        LIVE status field in your existing hybridClasses
        documents must remain unchanged.

        If your existing documents use:

        status: "live"

        this works.

        If they use:

        live: true

        this works too.
    */

    if (
        data.status &&
        String(data.status).toLowerCase() === "live"
    ) {
        return true;
    }


    if (
        data.live === true
    ) {
        return true;
    }


    if (
        data.isLive === true
    ) {
        return true;
    }


    return false;
}


// =========================================================
// RENDER LIVE CLASS
// =========================================================

function renderLiveClass(
    liveClass
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "live-card";


    const subject =
        liveClass.subjectName ||
        liveClass.subject ||
        liveClass.name ||
        "Live Class";


    const chapter =
        liveClass.chapterName ||
        liveClass.chapter ||
        liveClass.title ||
        "";


    const teacher =
        liveClass.teacherName ||
        liveClass.teacher ||
        "";


    card.innerHTML = `

        <div class="live-card-top">

            <span class="live-dot"></span>

            <span class="live-text">
                LIVE
            </span>

        </div>


        <div class="live-subject">
            ${escapeHtml(subject)}
        </div>


        ${
            chapter
                ? `
                    <div class="live-chapter">
                        ${escapeHtml(chapter)}
                    </div>
                  `
                : ""
        }


        ${
            teacher
                ? `
                    <div class="live-teacher">
                        Teacher:
                        ${escapeHtml(teacher)}
                    </div>
                  `
                : ""
        }


        <button
            class="join-live-btn"
        >
            JOIN LIVE NOW
        </button>

    `;


    const button =
        card.querySelector(
            ".join-live-btn"
        );


    button.addEventListener(
        "click",
        () => {

            window.location.href =
                `../viewliveclass/?id=${
                    encodeURIComponent(
                        liveClass.id
                    )
                }`;

        }
    );


    liveClassesContainer.appendChild(
        card
    );

}


// =========================================================
// SUBJECTS
// =========================================================

async function loadSubjects(
    student
) {

    subjectsContainer.innerHTML = "";

    noSubjects.classList.add(
        "hidden"
    );


    const studentMedium =
        student.medium ||
        "Kannada";


    const snapshot =
        await getDocs(
            collection(
                db,
                "hybridSubjects"
            )
        );


    const subjects = [];


    snapshot.forEach(
        (docSnap) => {

            const data =
                docSnap.data();


            // ---------------------------------------------
            // ACTIVE
            // ---------------------------------------------

            if (
                data.active === false
            ) {
                return;
            }


            // ---------------------------------------------
            // MEDIUM
            // ---------------------------------------------

            const contentMedium =
                data.medium ||
                "Kannada";


            if (
                contentMedium !== "Both" &&
                contentMedium !== studentMedium
            ) {

                return;

            }


            subjects.push({

                id:
                    docSnap.id,

                ...data

            });

        }
    );


    // -----------------------------------------------------
    // PRIORITY
    // -----------------------------------------------------

    subjects.sort(
        (a, b) => {

            return (
                Number(a.priority || 999) -
                Number(b.priority || 999)
            );

        }
    );


    // -----------------------------------------------------
    // EMPTY
    // -----------------------------------------------------

    if (
        subjects.length === 0
    ) {

        noSubjects.classList.remove(
            "hidden"
        );

        return;
    }


    // -----------------------------------------------------
    // RENDER
    // -----------------------------------------------------

    subjects.forEach(
        (subject, index) => {

            renderSubject(
                subject,
                index
            );

        }
    );

}


// =========================================================
// RENDER SUBJECT
// =========================================================

function renderSubject(
    subject,
    index
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "subject-card";


    const number =
        String(index + 1)
            .padStart(2, "0");


    card.innerHTML = `

        <div>

            <div class="subject-top">

                <div class="subject-number">
                    ${number}
                </div>

                <div class="subject-arrow">
                    →
                </div>

            </div>


            <div class="subject-name">
                ${escapeHtml(
                    subject.name ||
                    "Subject"
                )}
            </div>


            ${
                subject.description
                    ? `
                        <div
                            class="subject-description"
                        >
                            ${escapeHtml(
                                subject.description
                            )}
                        </div>
                      `
                    : ""
            }

        </div>


        <div class="subject-bottom">
            VIEW CHAPTERS →
        </div>

    `;


    // =====================================================
    // SUBJECT → CHAPTERS
    // =====================================================

    card.addEventListener(
        "click",
        () => {

            /*
                IMPORTANT:

                For now we keep your existing
                subject.html page exactly as it is.

                Later, when we rename the physical
                files, this can become:

                ../chapters/?id=SUBJECT_ID
            */

            window.location.href =
                `./chapters/?id=${
                    encodeURIComponent(
                        subject.id
                    )
                }`;

        }
    );


    subjectsContainer.appendChild(
        card
    );

}


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

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
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

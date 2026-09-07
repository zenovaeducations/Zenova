import { auth, db } from "../../../firebase/firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs
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

const subjectName =
    document.getElementById("subjectName");

const subjectDescription =
    document.getElementById("subjectDescription");

const chaptersContainer =
    document.getElementById("chaptersContainer");

const chapterCount =
    document.getElementById("chapterCount");

const emptyState =
    document.getElementById("emptyState");


// =========================================================
// URL
// =========================================================
//
// chapters/?id=SUBJECT_ID
//
// =========================================================

const params =
    new URLSearchParams(
        window.location.search
    );

const subjectId =
    params.get("id");


// =========================================================
// AUTH CHECK
// =========================================================

onAuthStateChanged(
    auth,
    async (user) => {

        // -----------------------------------------------
        // NOT LOGGED IN
        // -----------------------------------------------

        if (!user) {

            window.location.href =
                "../../../index.html";

            return;
        }


        // -----------------------------------------------
        // LOGGED IN
        // -----------------------------------------------

        try {

            if (!subjectId) {

                showApp();

                showError(
                    "Subject not found",
                    "No subject was selected."
                );

                return;
            }


            // -------------------------------------------
            // LOAD STUDENT
            // -------------------------------------------

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


            // -------------------------------------------
            // LOAD SUBJECT
            // -------------------------------------------

            await loadSubject();


            // -------------------------------------------
            // LOAD CHAPTERS
            // -------------------------------------------

            await loadChapters(
                student
            );


            // -------------------------------------------
            // SHOW PAGE
            // -------------------------------------------

            showApp();

        } catch (error) {

            console.error(
                "Chapters error:",
                error
            );

            showApp();

            showError(
                "Unable to load chapters",
                "Something went wrong while loading this subject."
            );

        }

    }
);


// =========================================================
// SUBJECT
// =========================================================

async function loadSubject() {

    const subjectSnap =
        await getDoc(
            doc(
                db,
                "hybridSubjects",
                subjectId
            )
        );


    if (!subjectSnap.exists()) {

        showError(
            "Subject not found",
            "This subject could not be found."
        );

        return;
    }


    const subject =
        subjectSnap.data();


    subjectName.textContent =
        subject.name ||
        "Subject";


    subjectDescription.textContent =
        subject.description ||
        "Explore all chapters available for this subject.";

}


// =========================================================
// CHAPTERS
// =========================================================

async function loadChapters(
    student
) {

    chaptersContainer.innerHTML = "";

    emptyState.classList.add(
        "hidden"
    );


    // -----------------------------------------------------
    // STUDENT MEDIUM
    // -----------------------------------------------------

    const studentMedium =
        student.medium ||
        "Kannada";


    // -----------------------------------------------------
    // GET CHAPTERS
    // -----------------------------------------------------

    const chaptersQuery =
        query(
            collection(
                db,
                "hybridChapters"
            ),
            where(
                "subjectId",
                "==",
                subjectId
            )
        );


    const snapshot =
        await getDocs(
            chaptersQuery
        );


    let chapters =
        snapshot.docs.map(
            (docSnap) => ({

                id:
                    docSnap.id,

                ...docSnap.data()

            })
        );


    // -----------------------------------------------------
    // ACTIVE ONLY
    // -----------------------------------------------------

    chapters =
        chapters.filter(
            chapter =>
                chapter.active !== false
        );


    // -----------------------------------------------------
    // MEDIUM
    // -----------------------------------------------------

    chapters =
        chapters.filter(
            chapter => {

                const contentMedium =
                    chapter.medium ||
                    "Kannada";


                if (
                    contentMedium === "Both"
                ) {

                    return true;

                }


                return (
                    contentMedium ===
                    studentMedium
                );

            }
        );


    // -----------------------------------------------------
    // CHAPTER NUMBER ORDER
    // -----------------------------------------------------

    chapters.sort(
        (a, b) => {

            return (
                Number(
                    a.chapterNumber
                ) -
                Number(
                    b.chapterNumber
                )
            );

        }
    );


    // -----------------------------------------------------
    // COUNT
    // -----------------------------------------------------

    chapterCount.textContent =
        `${chapters.length} ${
            chapters.length === 1
                ? "Chapter"
                : "Chapters"
        }`;


    // -----------------------------------------------------
    // EMPTY
    // -----------------------------------------------------

    if (
        chapters.length === 0
    ) {

        emptyState.classList.remove(
            "hidden"
        );

        return;
    }


    // -----------------------------------------------------
    // RENDER
    // -----------------------------------------------------

    chapters.forEach(
        chapter => {

            chaptersContainer.appendChild(
                createChapterCard(
                    chapter
                )
            );

        }
    );

}


// =========================================================
// CHAPTER CARD
// =========================================================

function createChapterCard(
    chapter
) {

    const card =
        document.createElement(
            "article"
        );


    const locked =
        chapter.locked === true;


    const title =
        chapter.chapterName ||
        chapter.title ||
        "Untitled Chapter";


    const description =
        chapter.description ||
        "Continue to explore this chapter.";


    const number =
        chapter.chapterNumber ??
        "—";


    card.className =
        `chapter-card ${
            locked
                ? "locked"
                : ""
        }`;


    card.innerHTML = `

        <div class="chapter-number">

            <div class="chapter-number-label">
                CHAPTER
            </div>

            <div class="chapter-number-value">
                ${escapeHtml(number)}
            </div>

        </div>


        <div class="chapter-content">

            <div class="chapter-title">
                ${escapeHtml(title)}
            </div>

            <div class="chapter-description">
                ${escapeHtml(description)}
            </div>


            ${
                locked
                    ? `
                        <span class="locked-label">
                            🔒 LOCKED
                        </span>
                      `
                    : ""
            }

        </div>


        <div class="chapter-continue">

            ${
                locked
                    ? "LOCKED"
                    : "CLICK TO CONTINUE"
            }

        </div>

    `;


    // =====================================================
    // CHAPTER → CHAPTER DETAILS
    // =====================================================

    if (!locked) {

        card.addEventListener(
            "click",
            () => {

                window.location.href =
                    `../chapterdetails/?id=${
                        encodeURIComponent(
                            chapter.id
                        )
                    }`;

            }
        );

    }


    return card;

}


// =========================================================
// ERROR
// =========================================================

function showError(
    title,
    message
) {

    subjectName.textContent =
        title;

    subjectDescription.textContent =
        message;

    chaptersContainer.innerHTML = "";

    chapterCount.textContent = "";

}


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
// BACK
// =========================================================

backBtn.addEventListener(
    "click",
    () => {

        window.history.back();

    }
);


// =========================================================
// ESCAPE
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

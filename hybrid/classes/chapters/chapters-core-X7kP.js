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

const subjectName =
    document.getElementById(
        "subjectName"
    );

const subjectDescription =
    document.getElementById(
        "subjectDescription"
    );

const chaptersContainer =
    document.getElementById(
        "chaptersContainer"
    );

const chapterCount =
    document.getElementById(
        "chapterCount"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );


// =========================================================
// URL
// =========================================================
//
// Expected:
//
// chapters/?id=SUBJECT_ID
//
// =========================================================

const params =
    new URLSearchParams(
        window.location.search
    );


const subjectId =
    params.get("id") ||
    params.get("subjectId");


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
                "../../../index.html";

            return;
        }


        // -------------------------------------------------
        // LOGGED IN
        // -------------------------------------------------

        try {


            if (!subjectId) {

                showApp();

                showError(
                    "Subject not found",
                    "No subject was selected."
                );

                return;

            }


            // -------------------------------------------------
            // LOAD STUDENT
            // -------------------------------------------------

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
            // LOAD SUBJECT
            // -------------------------------------------------

            await loadSubject();


            // -------------------------------------------------
            // LOAD CHAPTERS
            // -------------------------------------------------

            await loadChapters(
                student
            );


            // -------------------------------------------------
            // SHOW APP
            // -------------------------------------------------

            showApp();


        } catch (error) {

            console.error(
                "Chapters page error:",
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
// LOAD SUBJECT
// =========================================================

async function loadSubject() {


    const subjectRef =
        doc(
            db,
            "hybridSubjects",
            subjectId
        );


    const subjectSnap =
        await getDoc(
            subjectRef
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
        "Explore the recorded revision classes for this subject.";

}


// =========================================================
// LOAD CHAPTERS
// =========================================================

async function loadChapters(
    student
) {


    chaptersContainer.innerHTML = "";

    emptyState.classList.add(
        "hidden"
    );


    // -------------------------------------------------------
    // STUDENT MEDIUM
    // -------------------------------------------------------

    const studentMedium =
        student.medium ||
        "Kannada";


    // -------------------------------------------------------
    // QUERY EXISTING COLLECTION
    // -------------------------------------------------------

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


    // -------------------------------------------------------
    // ACTIVE CHAPTERS ONLY
    // -------------------------------------------------------

    chapters =
        chapters.filter(
            chapter =>
                chapter.active !== false
        );


    // -------------------------------------------------------
    // MEDIUM FILTER
    //
    // Existing content without a medium is treated
    // as Kannada.
    //
    // Both is available to both mediums.
    // -------------------------------------------------------

    chapters =
        chapters.filter(
            (chapter) => {


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


    // -------------------------------------------------------
    // TEXTBOOK ORDER
    // -------------------------------------------------------

    chapters.sort(
        (a, b) => {

            const numberA =
                Number(
                    a.chapterNumber
                ) || 0;


            const numberB =
                Number(
                    b.chapterNumber
                ) || 0;


            return numberA - numberB;

        }
    );


    // -------------------------------------------------------
    // COUNT
    // -------------------------------------------------------

    chapterCount.textContent =
        `${chapters.length} ${
            chapters.length === 1
                ? "Chapter"
                : "Chapters"
        }`;


    // -------------------------------------------------------
    // EMPTY
    // -------------------------------------------------------

    if (
        chapters.length === 0
    ) {

        emptyState.classList.remove(
            "hidden"
        );

        return;

    }


    // -------------------------------------------------------
    // RENDER
    // -------------------------------------------------------

    chapters.forEach(
        chapter => {

            const card =
                createChapterCard(
                    chapter
                );


            chaptersContainer.appendChild(
                card
            );

        }
    );

}


// =========================================================
// CREATE CHAPTER CARD
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


    const hasVideo =
        Boolean(
            chapter.videoUrl
        );


    const hasPdf =
        Boolean(
            chapter.pdfUrl
        );


    const chapterNumber =
        chapter.chapterNumber ??
        "—";


    const chapterTitle =
        chapter.chapterName ||
        chapter.title ||
        "Untitled Chapter";


    const description =
        chapter.description ||
        "Recorded revision class for this chapter.";


    card.className =
        `chapter-card ${
            locked
                ? "locked"
                : ""
        }`;


    card.innerHTML = `


        <!-- =============================================
             CHAPTER NUMBER
        ============================================== -->

        <div class="chapter-number-box">

            <div class="chapter-number-label">
                CHAPTER
            </div>

            <div class="chapter-number">
                ${escapeHtml(
                    chapterNumber
                )}
            </div>

        </div>



        <!-- =============================================
             CONTENT
        ============================================== -->

        <div class="chapter-content">

            <div class="chapter-title">

                ${escapeHtml(
                    chapterTitle
                )}

            </div>


            <div class="chapter-description">

                ${escapeHtml(
                    description
                )}

            </div>



            <!-- STATUS -->

            <div class="chapter-status">


                ${
                    locked

                        ? `

                            <span
                                class="status-pill"
                            >
                                🔒 LOCKED
                            </span>

                          `

                        : hasVideo

                            ? `

                                <span
                                    class="status-pill available"
                                >
                                    VIDEO AVAILABLE
                                </span>

                              `

                            : `

                                <span
                                    class="status-pill"
                                >
                                    VIDEO NOT AVAILABLE
                                </span>

                              `
                }


                ${
                    hasPdf && !locked

                        ? `

                            <span
                                class="status-pill"
                            >
                                PDF AVAILABLE
                            </span>

                          `

                        : ""
                }


            </div>

        </div>



        <!-- =============================================
             ACTIONS
        ============================================== -->

        <div class="chapter-actions">


            <button
                class="watch-btn"
                ${(
                    locked ||
                    !hasVideo
                )
                    ? "disabled"
                    : ""
                }
            >

                ${
                    locked
                        ? "Locked"
                        : hasVideo
                            ? "Watch Class"
                            : "No Video"
                }

            </button>


            ${
                hasPdf

                    ? `

                        <button
                            class="pdf-btn"
                            ${locked
                                ? "disabled"
                                : ""
                            }
                        >
                            PDF
                        </button>

                      `

                    : ""
            }


        </div>


    `;


    // =====================================================
    // WATCH CLASS
    // =====================================================

    const watchButton =
        card.querySelector(
            ".watch-btn"
        );


    if (
        watchButton &&
        !locked &&
        hasVideo
    ) {

        watchButton.addEventListener(
            "click",
            () => {


                /*
                    CHAPTER
                       ↓
                    RECORDED CLASS

                    The chapter document ID is passed
                    to the recorded-class page.
                */


                window.location.href =
                    `../viewrecordedclasses/?id=${
                        encodeURIComponent(
                            chapter.id
                        )
                    }`;

            }
        );

    }


    // =====================================================
    // PDF
    // =====================================================

    const pdfButton =
        card.querySelector(
            ".pdf-btn"
        );


    if (
        pdfButton &&
        !locked &&
        hasPdf
    ) {

        pdfButton.addEventListener(
            "click",
            () => {

                window.open(
                    chapter.pdfUrl,
                    "_blank",
                    "noopener,noreferrer"
                );

            }
        );

    }


    return card;

}


// =========================================================
// SHOW ERROR
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


    chapterCount.textContent =
        "";


    emptyState.classList.add(
        "hidden"
    );

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

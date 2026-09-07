/* =========================================================
   ZENOVA HYBRID
   STUDENT SUBJECT PAGE
========================================================= */

import {
    auth,
    db
} from "../../firebase/firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    doc,
    getDoc,
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

const subjectName =
    document.getElementById("subjectName");

const subjectDescription =
    document.getElementById("subjectDescription");

const chapterCount =
    document.getElementById("chapterCount");

const mediumBadge =
    document.getElementById("mediumBadge");

const chaptersList =
    document.getElementById("chaptersList");

const emptyState =
    document.getElementById("emptyState");

const errorState =
    document.getElementById("errorState");

const errorMessage =
    document.getElementById("errorMessage");

const retryButton =
    document.getElementById("retryButton");

const backButton =
    document.getElementById("backButton");


/* =========================================================
   URL PARAMETERS
========================================================= */

const params =
    new URLSearchParams(
        window.location.search
    );

const subjectId =
    params.get("subjectId");


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let currentStudent = null;

let currentSubject = null;


/* =========================================================
   MEDIUM
========================================================= */

function normalizeMedium(value) {

    if (!value) {
        return "Kannada";
    }

    const v =
        String(value)
            .trim()
            .toLowerCase();

    if (
        v === "both" ||
        v === "all"
    ) {
        return "Both";
    }

    if (
        v === "english" ||
        v === "english medium"
    ) {
        return "English";
    }

    return "Kannada";
}


function studentCanSeeContent(
    contentMedium
) {

    const studentMedium =
        normalizeMedium(
            currentStudent?.medium
        );

    const medium =
        normalizeMedium(
            contentMedium
        );

    if (medium === "Both") {
        return true;
    }

    return medium === studentMedium;
}


/* =========================================================
   SHOW / HIDE APP
========================================================= */

function showApp() {

    loader.classList.add("hidden");

    app.classList.remove("hidden");
}


function showError(message) {

    loader.classList.add("hidden");

    app.classList.remove("hidden");

    chaptersList.innerHTML = "";

    emptyState.classList.add("hidden");

    errorMessage.textContent =
        message || "Something went wrong.";

    errorState.classList.remove("hidden");
}


/* =========================================================
   SUBJECT ID CHECK
========================================================= */

if (!subjectId) {

    showError(
        "No subject was selected. Please go back and select a subject."
    );

} else {

    start();
}


/* =========================================================
   START
========================================================= */

async function start() {

    try {

        /*
         * Wait for Firebase Auth.
         */

        onAuthStateChanged(
            auth,
            async user => {

                try {

                    if (!user) {

                        window.location.href =
                            "../../";

                        return;
                    }

                    currentUser = user;

                    await loadStudent();

                    await loadSubject();

                    await loadChapters();

                    showApp();

                } catch (error) {

                    console.error(
                        "Zenova Subject Error:",
                        error
                    );

                    showError(
                        getReadableError(error)
                    );
                }

            }
        );

    } catch (error) {

        console.error(
            "Authentication startup error:",
            error
        );

        showError(
            getReadableError(error)
        );
    }
}


/* =========================================================
   LOAD STUDENT
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

    if (snapshot.exists()) {

        currentStudent =
            snapshot.data();

    } else {

        /*
         * If the student document does not exist,
         * default to Kannada for old accounts.
         */

        currentStudent = {
            medium: "Kannada"
        };
    }
}


/* =========================================================
   LOAD SUBJECT
========================================================= */

async function loadSubject() {

    const subjectRef =
        doc(
            db,
            "hybridSubjects",
            subjectId
        );

    const snapshot =
        await getDoc(subjectRef);

    if (!snapshot.exists()) {

        throw new Error(
            "This subject does not exist in Firebase."
        );
    }

    currentSubject = {
        id: snapshot.id,
        ...snapshot.data()
    };


    /*
     * SUBJECT INFORMATION
     */

    subjectName.textContent =
        currentSubject.name ||
        "Subject";

    subjectDescription.textContent =
        currentSubject.description ||
        "Recorded classes and study material for this subject.";


    /*
     * Medium badge.
     */

    const subjectMedium =
        normalizeMedium(
            currentSubject.medium
        );

    mediumBadge.textContent =
        subjectMedium + " Medium";
}


/* =========================================================
   LOAD CHAPTERS
========================================================= */

async function loadChapters() {

    chaptersList.innerHTML = "";

    emptyState.classList.add(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );


    /*
     * IMPORTANT:
     *
     * We query ONLY subjectId.
     *
     * No orderBy().
     *
     * Therefore this does not require a composite
     * Firestore index.
     */

    const chaptersRef =
        collection(
            db,
            "hybridChapters"
        );

    const chaptersQuery =
        query(
            chaptersRef,
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
            item => ({
                id: item.id,
                ...item.data()
            })
        );


    /*
     * Only active chapters.
     *
     * If active is missing, treat it as active.
     */

    chapters =
        chapters.filter(
            chapter =>
                chapter.active !== false
        );


    /*
     * MEDIUM FILTER
     *
     * Chapter medium:
     *
     * Kannada
     * English
     * Both
     *
     * Missing medium = Kannada
     */

    chapters =
        chapters.filter(
            chapter =>
                studentCanSeeContent(
                    chapter.medium
                )
        );


    /*
     * TEXTBOOK ORDER
     *
     * chapterNumber:
     * 1
     * 2
     * 3
     * ...
     */

    chapters.sort(
        (a, b) => {

            const numberA =
                Number(
                    a.chapterNumber
                );

            const numberB =
                Number(
                    b.chapterNumber
                );


            const safeA =
                Number.isFinite(numberA)
                    ? numberA
                    : 999999;

            const safeB =
                Number.isFinite(numberB)
                    ? numberB
                    : 999999;


            if (safeA !== safeB) {

                return safeA - safeB;
            }


            /*
             * Secondary ordering.
             */

            const priorityA =
                Number(
                    a.priority || 0
                );

            const priorityB =
                Number(
                    b.priority || 0
                );

            return priorityB - priorityA;
        }
    );


    chapterCount.textContent =
        chapters.length;


    /*
     * NOTHING AVAILABLE
     */

    if (!chapters.length) {

        emptyState.classList.remove(
            "hidden"
        );

        return;
    }


    /*
     * CREATE CARDS
     */

    chapters.forEach(
        chapter => {

            const card =
                createChapterCard(
                    chapter
                );

            chaptersList.appendChild(
                card
            );
        }
    );
}


/* =========================================================
   CREATE CHAPTER CARD
========================================================= */

function createChapterCard(
    chapter
) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "chapter-card";


    /* -----------------------------------------------------
       CHAPTER DATA
    ----------------------------------------------------- */

    const chapterNumber =
        chapter.chapterNumber ??
        "";

    const title =
        chapter.chapterName ||
        chapter.title ||
        "Untitled Chapter";

    const description =
        chapter.description ||
        chapter.chapterDescription ||
        "";

    const videoUrl =
        chapter.videoUrl ||
        chapter.youtubeUrl ||
        chapter.video ||
        "";

    const pdfUrl =
        chapter.pdfUrl ||
        "";

    const pdfName =
        chapter.pdfName ||
        "Chapter PDF";

    const locked =
        chapter.locked === true;


    /* -----------------------------------------------------
       THUMBNAIL
    ----------------------------------------------------- */

    const youtubeId =
        extractYouTubeId(
            videoUrl
        );


    let thumbnailHTML = "";


    if (youtubeId) {

        thumbnailHTML = `
            <img
                src="https://img.youtube.com/vi/${escapeAttribute(youtubeId)}/hqdefault.jpg"
                alt="${escapeAttribute(title)}"
                loading="lazy"
            >
        `;

    } else {

        thumbnailHTML = `
            <div class="thumbnail-placeholder">
                <i class="ri-play-circle-line"></i>
            </div>
        `;
    }


    /* -----------------------------------------------------
       LOCK
    ----------------------------------------------------- */

    const lockHTML =
        locked
            ? `
                <div class="lock-overlay">
                    <i class="ri-lock-line"></i>
                    Chapter Locked
                </div>
              `
            : "";


    /* -----------------------------------------------------
       VIDEO BUTTON
    ----------------------------------------------------- */

    let watchButtonHTML;


    if (locked) {

        watchButtonHTML = `
            <button
                class="chapter-button watch-button disabled"
                type="button"
                disabled
            >
                <i class="ri-lock-line"></i>
                Locked
            </button>
        `;

    } else if (videoUrl) {

        watchButtonHTML = `
            <button
                class="chapter-button watch-button"
                type="button"
                data-action="watch"
            >
                <i class="ri-play-fill"></i>
                Watch Class
            </button>
        `;

    } else {

        watchButtonHTML = `
            <button
                class="chapter-button watch-button disabled"
                type="button"
                disabled
            >
                <i class="ri-video-off-line"></i>
                No Video
            </button>
        `;
    }


    /* -----------------------------------------------------
       PDF BUTTON
    ----------------------------------------------------- */

    let pdfButtonHTML;


    if (locked) {

        pdfButtonHTML = `
            <button
                class="chapter-button pdf-button disabled"
                type="button"
                disabled
            >
                <i class="ri-lock-line"></i>
                Locked
            </button>
        `;

    } else if (pdfUrl) {

        pdfButtonHTML = `
            <a
                class="chapter-button pdf-button"
                href="${escapeAttribute(pdfUrl)}"
                download="${escapeAttribute(pdfName)}"
                target="_blank"
                rel="noopener"
            >
                <i class="ri-file-pdf-2-line"></i>
                Download PDF
            </a>
        `;

    } else {

        pdfButtonHTML = `
            <button
                class="chapter-button pdf-button disabled"
                type="button"
                disabled
            >
                <i class="ri-file-forbid-line"></i>
                No PDF
            </button>
        `;
    }


    /* -----------------------------------------------------
       CARD HTML
    ----------------------------------------------------- */

    card.innerHTML = `

        <div class="chapter-thumbnail">

            ${thumbnailHTML}

            ${lockHTML}

        </div>


        <div class="chapter-content">

            <div class="chapter-number">
                ${
                    chapterNumber !== ""
                        ? `CHAPTER ${escapeHTML(String(chapterNumber))}`
                        : "CHAPTER"
                }
            </div>


            <h3 class="chapter-title">
                ${escapeHTML(title)}
            </h3>


            ${
                description
                    ? `
                        <p class="chapter-description">
                            ${escapeHTML(description)}
                        </p>
                      `
                    : ""
            }


            <div class="chapter-info">

                ${
                    videoUrl && !locked
                        ? `
                            <span>
                                <i class="ri-video-line"></i>
                                Video Available
                            </span>
                          `
                        : `
                            <span>
                                <i class="ri-video-line"></i>
                                ${locked ? "Locked" : "Video Not Added"}
                            </span>
                          `
                }


                ${
                    pdfUrl && !locked
                        ? `
                            <span>
                                <i class="ri-file-pdf-line"></i>
                                PDF Available
                            </span>
                          `
                        : `
                            <span>
                                <i class="ri-file-pdf-line"></i>
                                ${locked ? "Locked" : "PDF Not Added"}
                            </span>
                          `
                }

            </div>


            <div class="chapter-actions">

                ${watchButtonHTML}

                ${pdfButtonHTML}

            </div>

        </div>
    `;


    /* -----------------------------------------------------
       WATCH
    ----------------------------------------------------- */

    const watchButton =
        card.querySelector(
            '[data-action="watch"]'
        );


    if (watchButton) {

        watchButton.addEventListener(
            "click",
            () => {

                openChapter(
                    chapter
                );
            }
        );
    }


    return card;
}


/* =========================================================
   OPEN CHAPTER
========================================================= */

function openChapter(
    chapter
) {

    if (
        chapter.locked === true
    ) {
        return;
    }


    const url =
        new URL(
            "./chapter.html",
            window.location.href
        );


    url.searchParams.set(
        "chapterId",
        chapter.id
    );


    url.searchParams.set(
        "subjectId",
        subjectId
    );


    window.location.href =
        url.toString();
}


/* =========================================================
   YOUTUBE ID
========================================================= */

function extractYouTubeId(
    url
) {

    if (!url) {
        return null;
    }


    const value =
        String(url).trim();


    /*
     * Already a YouTube ID.
     */

    if (
        /^[a-zA-Z0-9_-]{11}$/.test(
            value
        )
    ) {

        return value;
    }


    try {

        const parsed =
            new URL(value);


        /*
         * youtube.com/watch?v=
         */

        if (
            parsed.hostname.includes(
                "youtube.com"
            )
        ) {

            const id =
                parsed.searchParams.get(
                    "v"
                );

            if (id) {
                return id;
            }


            /*
             * youtube.com/embed/ID
             */

            const embedMatch =
                parsed.pathname.match(
                    /\/embed\/([^/]+)/
                );

            if (embedMatch) {
                return embedMatch[1];
            }


            /*
             * youtube.com/shorts/ID
             */

            const shortsMatch =
                parsed.pathname.match(
                    /\/shorts\/([^/]+)/
                );

            if (shortsMatch) {
                return shortsMatch[1];
            }
        }


        /*
         * youtu.be/ID
         */

        if (
            parsed.hostname.includes(
                "youtu.be"
            )
        ) {

            const id =
                parsed.pathname
                    .replace(
                        /^\/+/,
                        ""
                    )
                    .split("/")[0];

            if (id) {
                return id;
            }
        }

    } catch (error) {

        /*
         * Not a valid URL.
         */
    }


    return null;
}


/* =========================================================
   BACK BUTTON
========================================================= */

backButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "./";
    }
);


/* =========================================================
   RETRY
========================================================= */

retryButton.addEventListener(
    "click",
    () => {

        /*
         * Reset UI.
         */

        errorState.classList.add(
            "hidden"
        );

        emptyState.classList.add(
            "hidden"
        );

        chaptersList.innerHTML = "";

        loader.classList.remove(
            "hidden"
        );


        start();
    }
);


/* =========================================================
   ESCAPE HTML
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


/* =========================================================
   ESCAPE ATTRIBUTE
========================================================= */

function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );
}


/* =========================================================
   FIREBASE ERROR
========================================================= */

function getReadableError(
    error
) {

    if (!error) {
        return "Unknown error.";
    }


    console.error(
        error
    );


    if (
        error.code ===
        "permission-denied"
    ) {

        return "Firebase denied access to the chapters. Check your Firestore rules.";
    }


    if (
        error.code ===
        "failed-precondition"
    ) {

        return "Firestore requires an index for this query.";
    }


    if (
        error.code ===
        "unavailable"
    ) {

        return "Firebase is temporarily unavailable. Please try again.";
    }


    if (
        error.message
    ) {

        return error.message;
    }


    return "Unable to load this subject.";
}

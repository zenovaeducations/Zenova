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


// ======================================================
// ELEMENTS
// ======================================================

const pageLoader =
    document.getElementById(
        "pageLoader"
    );

const app =
    document.getElementById(
        "app"
    );

const backButton =
    document.getElementById(
        "backButton"
    );

const subjectName =
    document.getElementById(
        "subjectName"
    );

const subjectDescription =
    document.getElementById(
        "subjectDescription"
    );

const chaptersList =
    document.getElementById(
        "chaptersList"
    );

const chapterCount =
    document.getElementById(
        "chapterCount"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );

const toast =
    document.getElementById(
        "toast"
    );


// ======================================================
// STATE
// ======================================================

let currentUser = null;

let currentStudent = null;

let currentSubject = null;

let chapters = [];


// ======================================================
// URL
// ======================================================

const params =
    new URLSearchParams(
        window.location.search
    );

const subjectId =
    params.get(
        "subjectId"
    );


// ======================================================
// START
// ======================================================

if (!subjectId) {

    hideLoader();

    showToast(
        "No subject selected."
    );

    setTimeout(() => {

        window.location.href =
            "./";

    }, 1000);

} else {

    startAuth();

}


// ======================================================
// AUTH
// ======================================================

function startAuth() {

    onAuthStateChanged(
        auth,
        async user => {

            if (!user) {

                window.location.href =
                    "../../index.html";

                return;
            }

            currentUser =
                user;

            try {

                await loadStudent();

                await loadSubject();

                await loadChapters();

                showApp();

            } catch (error) {

                console.error(
                    "Subject page error:",
                    error
                );

                showApp();

                showToast(
                    "Unable to load this subject."
                );
            }

        }
    );

}


// ======================================================
// LOAD STUDENT
// ======================================================

async function loadStudent() {

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

    if (
        !snapshot.exists()
    ) {

        throw new Error(
            "Student profile not found."
        );
    }

    currentStudent = {
        id: snapshot.id,
        ...snapshot.data()
    };

}


// ======================================================
// LOAD SUBJECT
// ======================================================

async function loadSubject() {

    const subjectRef =
        doc(
            db,
            "hybridSubjects",
            subjectId
        );

    const snapshot =
        await getDoc(
            subjectRef
        );


    if (
        !snapshot.exists()
    ) {

        throw new Error(
            "Subject not found."
        );
    }


    currentSubject = {
        id: snapshot.id,
        ...snapshot.data()
    };


    subjectName.textContent =
        currentSubject.name ||
        "Subject";


    subjectDescription.textContent =
        currentSubject.description ||
        "Chapters and learning materials";
}


// ======================================================
// LOAD CHAPTERS
// ======================================================

async function loadChapters() {

    const chaptersRef =
        collection(
            db,
            "hybridChapters"
        );


    /*
     * Query ONLY by subjectId.
     *
     * We deliberately do NOT use
     * orderBy here because we want
     * to avoid composite-index
     * requirements.
     */

    const q =
        query(
            chaptersRef,
            where(
                "subjectId",
                "==",
                subjectId
            )
        );


    const snapshot =
        await getDocs(q);


    chapters =
        snapshot.docs
            .map(
                chapterDoc => ({
                    id:
                        chapterDoc.id,

                    ...chapterDoc.data()
                })
            )
            .filter(
                chapter =>
                    chapter.active !== false
            );


    /*
     * Textbook order.
     */

    chapters.sort(
        (a, b) => {

            const numberA =
                Number(
                    a.chapterNumber ||
                    999999
                );

            const numberB =
                Number(
                    b.chapterNumber ||
                    999999
                );


            return (
                numberA -
                numberB
            );

        }
    );


    renderChapters();

}


// ======================================================
// RENDER
// ======================================================

function renderChapters() {

    chaptersList.innerHTML =
        "";


    chapterCount.textContent =
        String(
            chapters.length
        );


    if (
        !chapters.length
    ) {

        emptyState.classList.remove(
            "hidden"
        );

        return;
    }


    emptyState.classList.add(
        "hidden"
    );


    chapters.forEach(
        chapter => {

            chaptersList.appendChild(
                createChapterCard(
                    chapter
                )
            );

        }
    );

}


// ======================================================
// CREATE CHAPTER CARD
// ======================================================

function createChapterCard(
    chapter
) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "chapter-card";


    const locked =
        chapter.locked === true;


    // ================================================
    // THUMBNAIL
    // ================================================

    const thumbnail =
        document.createElement(
            "div"
        );

    thumbnail.className =
        "chapter-thumbnail";


    const thumbnailData =
        getThumbnailData(
            chapter
        );


    if (
        thumbnailData
    ) {

        const image =
            document.createElement(
                "img"
            );

        image.src =
            thumbnailData;

        image.alt =
            chapter.chapterName ||
            "Chapter";

        image.loading =
            "lazy";

        thumbnail.appendChild(
            image
        );

    } else {

        const fallback =
            document.createElement(
                "div"
            );

        fallback.className =
            "thumbnail-fallback";


        const letter =
            document.createElement(
                "div"
            );

        letter.className =
            "thumbnail-fallback-letter";

        letter.textContent =
            "Z";


        fallback.appendChild(
            letter
        );

        thumbnail.appendChild(
            fallback
        );
    }


    /*
     * If video exists,
     * show play button.
     */

    if (
        chapter.videoUrl &&
        !locked
    ) {

        const play =
            document.createElement(
                "div"
            );

        play.className =
            "thumbnail-play";

        play.textContent =
            "▶";

        thumbnail.appendChild(
            play
        );

    }


    /*
     * Locked overlay.
     */

    if (locked) {

        const lock =
            document.createElement(
                "div"
            );

        lock.className =
            "thumbnail-lock";

        lock.textContent =
            "🔒";

        thumbnail.appendChild(
            lock
        );
    }


    // ================================================
    // CONTENT
    // ================================================

    const content =
        document.createElement(
            "div"
        );

    content.className =
        "chapter-content";


    const number =
        document.createElement(
            "div"
        );

    number.className =
        "chapter-number";

    number.textContent =
        `CHAPTER ${formatNumber(
            chapter.chapterNumber
        )}`;


    const title =
        document.createElement(
            "h3"
        );

    title.className =
        "chapter-title";

    title.textContent =
        chapter.chapterName ||
        chapter.title ||
        "Untitled Chapter";


    const status =
        document.createElement(
            "span"
        );

    status.className =
        `chapter-status ${
            locked
                ? "locked"
                : "available"
        }`;

    status.textContent =
        locked
            ? "🔒 Chapter Locked"
            : "🔓 Available";


    content.appendChild(
        number
    );

    content.appendChild(
        title
    );

    content.appendChild(
        status
    );


    // ================================================
    // ACTIONS
    // ================================================

    const actions =
        document.createElement(
            "div"
        );

    actions.className =
        "chapter-actions";


    if (locked) {

        const lockedMessage =
            document.createElement(
                "div"
            );

        lockedMessage.className =
            "locked-message";

        lockedMessage.innerHTML =
            `
                <span>🔒</span>
                <span>
                    This chapter is currently locked.
                </span>
            `;


        actions.appendChild(
            lockedMessage
        );

    } else {

        // -------------------------------
        // WATCH VIDEO
        // -------------------------------

        const watchButton =
            document.createElement(
                "button"
            );

        watchButton.type =
            "button";

        watchButton.className =
            "chapter-action watch";


        if (
            chapter.videoUrl
        ) {

            watchButton.innerHTML =
                `
                    <span class="action-icon">
                        ▶
                    </span>

                    <span>
                        Watch Class
                    </span>
                `;


            watchButton.addEventListener(
                "click",
                () => {

                    openChapter(
                        chapter
                    );

                }
            );

        } else {

            watchButton.className =
                "chapter-action disabled";

            watchButton.disabled =
                true;

            watchButton.innerHTML =
                `
                    <span class="action-icon">
                        ▶
                    </span>

                    <span>
                        No Video
                    </span>
                `;
        }


        actions.appendChild(
            watchButton
        );


        // -------------------------------
        // PDF
        // -------------------------------

        const pdfButton =
            document.createElement(
                "button"
            );

        pdfButton.type =
            "button";

        pdfButton.className =
            "chapter-action";


        if (
            chapter.pdfUrl
        ) {

            pdfButton.innerHTML =
                `
                    <span class="action-icon">
                        ↓
                    </span>

                    <span>
                        Download PDF
                    </span>
                `;


            pdfButton.addEventListener(
                "click",
                () => {

                    downloadPDF(
                        chapter
                    );

                }
            );

        } else {

            pdfButton.className =
                "chapter-action disabled";

            pdfButton.disabled =
                true;

            pdfButton.innerHTML =
                `
                    <span class="action-icon">
                        ↓
                    </span>

                    <span>
                        No PDF
                    </span>
                `;
        }


        actions.appendChild(
            pdfButton
        );

    }


    // ================================================
    // APPEND
    // ================================================

    card.appendChild(
        thumbnail
    );

    card.appendChild(
        content
    );

    card.appendChild(
        actions
    );


    return card;
}


// ======================================================
// THUMBNAIL
// ======================================================

function getThumbnailData(
    chapter
) {

    /*
     * If admin later adds a
     * thumbnailUrl field, it
     * will automatically work.
     */

    if (
        chapter.thumbnailUrl
    ) {

        return chapter.thumbnailUrl;
    }


    /*
     * YouTube thumbnail.
     */

    const youtubeId =
        extractYouTubeId(
            chapter.videoUrl
        );


    if (
        youtubeId
    ) {

        return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

    }


    return null;
}


// ======================================================
// YOUTUBE ID
// ======================================================

function extractYouTubeId(
    url
) {

    if (!url) {
        return null;
    }


    try {

        const parsed =
            new URL(url);


        /*
         * youtube.com/embed/VIDEO_ID
         */

        if (
            parsed.hostname.includes(
                "youtube.com"
            )
        ) {

            const parts =
                parsed.pathname
                    .split("/")
                    .filter(Boolean);


            const embedIndex =
                parts.indexOf(
                    "embed"
                );


            if (
                embedIndex !== -1 &&
                parts[embedIndex + 1]
            ) {

                return parts[
                    embedIndex + 1
                ];
            }


            /*
             * youtube.com/watch?v=
             */

            const watchId =
                parsed.searchParams.get(
                    "v"
                );

            if (
                watchId
            ) {

                return watchId;
            }
        }


        /*
         * youtu.be/VIDEO_ID
         */

        if (
            parsed.hostname ===
            "youtu.be"
        ) {

            return parsed.pathname
                .replace(
                    "/",
                    ""
                );

        }

    } catch {

        return null;
    }


    return null;
}


// ======================================================
// OPEN CHAPTER
// ======================================================

function openChapter(
    chapter
) {

    if (
        chapter.locked === true
    ) {

        showToast(
            "This chapter is locked."
        );

        return;
    }


    if (
        !chapter.videoUrl
    ) {

        showToast(
            "Video is not available yet."
        );

        return;
    }


    window.location.href =
        `./chapter.html?chapterId=${encodeURIComponent(
            chapter.id
        )}&subjectId=${encodeURIComponent(
            subjectId
        )}`;

}


// ======================================================
// DOWNLOAD PDF
// ======================================================

function downloadPDF(
    chapter
) {

    if (
        chapter.locked === true
    ) {

        showToast(
            "This chapter is locked."
        );

        return;
    }


    if (
        !chapter.pdfUrl
    ) {

        showToast(
            "PDF is not available."
        );

        return;
    }


    /*
     * Open Firebase Storage
     * download URL.
     *
     * Using an anchor allows
     * the browser to handle the
     * Storage URL correctly.
     */

    const link =
        document.createElement(
            "a"
        );

    link.href =
        chapter.pdfUrl;

    link.target =
        "_blank";

    link.rel =
        "noopener";

    link.download =
        chapter.pdfName ||
        `${chapter.chapterName || "chapter"}.pdf`;


    document.body.appendChild(
        link
    );

    link.click();

    link.remove();

}


// ======================================================
// NUMBER FORMAT
// ======================================================

function formatNumber(
    number
) {

    const value =
        Number(number);


    if (
        !Number.isFinite(value)
    ) {

        return "—";
    }


    return String(
        value
    ).padStart(
        2,
        "0"
    );
}


// ======================================================
// SHOW APP
// ======================================================

function showApp() {

    pageLoader.classList.add(
        "hidden"
    );

    app.classList.remove(
        "hidden"
    );

}


// ======================================================
// HIDE LOADER
// ======================================================

function hideLoader() {

    pageLoader.classList.add(
        "hidden"
    );

}


// ======================================================
// TOAST
// ======================================================

let toastTimer = null;

function showToast(
    message
) {

    clearTimeout(
        toastTimer
    );


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2800
        );
}


// ======================================================
// BACK
// ======================================================

backButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "./";

    }
);

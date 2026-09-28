/* =========================================================
   ZENOVA CHAPTER DETAILS
   ZEN2
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
    document.getElementById(
        "loader"
    );


const app =
    document.getElementById(
        "app"
    );


const errorState =
    document.getElementById(
        "errorState"
    );


const errorMessage =
    document.getElementById(
        "errorMessage"
    );


const retryButton =
    document.getElementById(
        "retryButton"
    );


const backButton =
    document.getElementById(
        "backButton"
    );


const batchName =
    document.getElementById(
        "batchName"
    );


const subjectName =
    document.getElementById(
        "subjectName"
    );


const chapterName =
    document.getElementById(
        "chapterName"
    );


const chapterTitle =
    document.getElementById(
        "chapterTitle"
    );


const chapterDescription =
    document.getElementById(
        "chapterDescription"
    );


const videoCount =
    document.getElementById(
        "videoCount"
    );


const heroImage =
    document.getElementById(
        "heroImage"
    );


const heroTitle =
    document.getElementById(
        "heroTitle"
    );


const heroDescription =
    document.getElementById(
        "heroDescription"
    );


const heroPlayButton =
    document.getElementById(
        "heroPlayButton"
    );


const heroThumbnail =
    document.getElementById(
        "heroThumbnail"
    );


const videoList =
    document.getElementById(
        "videoList"
    );


const emptyVideos =
    document.getElementById(
        "emptyVideos"
    );


const pdfList =
    document.getElementById(
        "pdfList"
    );


const emptyPdfs =
    document.getElementById(
        "emptyPdfs"
    );


/* =========================================================
   URL
========================================================= */

const params =
    new URLSearchParams(
        window.location.search
    );


const chapterId =
    params.get(
        "chapterId"
    );


const subjectId =
    params.get(
        "subjectId"
    );


/* =========================================================
   STATE
========================================================= */

let currentUser =
    null;


let currentStudent =
    null;


let currentCourse =
    null;


let currentSubject =
    null;


let currentChapter =
    null;


let videos =
    [];


let pdfs =
    [];


/* =========================================================
   START
========================================================= */

if (!chapterId) {

    showError(
        "No chapter was selected."
    );

} else {

    start();

}


/* =========================================================
   AUTH
========================================================= */

function start() {

    onAuthStateChanged(
        auth,
        async user => {

            if (!user) {

                window.location.href =
                    "../../account/login/";

                return;

            }


            currentUser =
                user;


            try {

                await loadStudent();

                await loadChapter();

                await loadSubject();

                await loadCourse();

                await loadContent();

                renderPage();

                hideLoader();

            } catch (error) {

                console.error(
                    "Chapter Details Error:",
                    error
                );


                showError(
                    getReadableError(
                        error
                    )
                );

            }

        }
    );

}


/* =========================================================
   LOAD STUDENT
========================================================= */

async function loadStudent() {

    const studentRef =
        doc(
            db,
            "zen2Students",
            currentUser.uid
        );


    const snapshot =
        await getDoc(
            studentRef
        );


    if (
        snapshot.exists()
    ) {

        currentStudent = {

            id:
                snapshot.id,

            ...snapshot.data()

        };

    }

}


/* =========================================================
   LOAD CHAPTER
========================================================= */

async function loadChapter() {

    const chapterRef =
        doc(
            db,
            "zen2Chapters",
            chapterId
        );


    const snapshot =
        await getDoc(
            chapterRef
        );


    if (
        !snapshot.exists()
    ) {

        throw new Error(
            "This chapter does not exist."
        );

    }


    currentChapter = {

        id:
            snapshot.id,

        ...snapshot.data()

    };


    /*
     * Check chapter relationship
     */

    if (
        subjectId &&
        currentChapter.subjectId &&
        currentChapter.subjectId !==
            subjectId
    ) {

        throw new Error(
            "This chapter does not belong to the selected subject."
        );

    }

}


/* =========================================================
   LOAD SUBJECT
========================================================= */

async function loadSubject() {

    const id =
        currentChapter.subjectId ||
        subjectId;


    if (!id) {

        throw new Error(
            "Subject information is missing."
        );

    }


    const subjectRef =
        doc(
            db,
            "zen2Subjects",
            id
        );


    const snapshot =
        await getDoc(
            subjectRef
        );


    if (
        snapshot.exists()
    ) {

        currentSubject = {

            id:
                snapshot.id,

            ...snapshot.data()

        };

    }

}


/* =========================================================
   LOAD COURSE
========================================================= */

async function loadCourse() {

    const courseId =
        currentSubject?.courseId ||
        currentChapter?.courseId;


    if (!courseId) {

        return;

    }


    const courseRef =
        doc(
            db,
            "zen2Courses",
            courseId
        );


    const snapshot =
        await getDoc(
            courseRef
        );


    if (
        snapshot.exists()
    ) {

        currentCourse = {

            id:
                snapshot.id,

            ...snapshot.data()

        };

    }

}


/* =========================================================
   LOAD CONTENT
========================================================= */

async function loadContent() {

    const contentRef =
        collection(
            db,
            "zen2Content"
        );


    const contentQuery =
        query(
            contentRef,
            where(
                "chapterId",
                "==",
                chapterId
            )
        );


    const snapshot =
        await getDocs(
            contentQuery
        );


    const content =
        snapshot.docs.map(
            item => ({

                id:
                    item.id,

                ...item.data()

            })
        );


    /*
     * Active content only.
     */

    const activeContent =
        content.filter(
            item =>
                item.active !== false
        );


    /*
     * VIDEO
     */

    videos =
        activeContent
            .filter(
                item =>
                    String(
                        item.contentType ||
                        ""
                    ).toUpperCase()
                    ===
                    "VIDEO"
            )
            .sort(
                sortContent
            );


    /*
     * PDF
     */

    pdfs =
        activeContent
            .filter(
                item =>
                    String(
                        item.contentType ||
                        ""
                    ).toUpperCase()
                    ===
                    "PDF"
            )
            .sort(
                sortContent
            );

}


/* =========================================================
   SORT
========================================================= */

function sortContent(
    a,
    b
) {

    const orderA =
        Number(
            a.order ||
            999999
        );


    const orderB =
        Number(
            b.order ||
            999999
        );


    return (
        orderA -
        orderB
    );

}


/* =========================================================
   RENDER PAGE
========================================================= */

function renderPage() {

    const courseTitle =
        currentCourse?.name ||
        currentCourse?.courseName ||
        currentCourse?.title ||
        "Zenova Batch";


    const subjectTitle =
        currentSubject?.name ||
        currentSubject?.subjectName ||
        currentSubject?.title ||
        "Subject";


    const chapterTitleValue =
        currentChapter?.title ||
        currentChapter?.chapterName ||
        currentChapter?.name ||
        "Chapter";


    /*
     * Header
     */

    batchName.textContent =
        courseTitle;


    subjectName.textContent =
        subjectTitle;


    chapterName.textContent =
        chapterTitleValue;


    chapterTitle.textContent =
        chapterTitleValue;


    chapterDescription.textContent =
        currentChapter?.description ||
        currentChapter?.chapterDescription ||
        "Recorded classes and study material for this chapter.";


    /*
     * Count
     */

    videoCount.textContent =
        videos.length;


    /*
     * Hero
     */

    renderHero();


    /*
     * Video list
     */

    renderVideos();


    /*
     * PDFs
     */

    renderPDFs();

}


/* =========================================================
   HERO
========================================================= */

function renderHero() {

    if (
        !videos.length
    ) {

        document
            .getElementById(
                "heroSection"
            )
            .classList.add(
                "hidden"
            );

        return;

    }


    const video =
        videos[0];


    const title =
        video.title ||
        "Recorded Class";


    const description =
        video.description ||
        "Watch this recorded class inside Zenova.";


    const thumbnail =
        getVideoThumbnail(
            video
        );


    heroImage.src =
        thumbnail;


    heroImage.alt =
        title;


    heroTitle.textContent =
        title;


    heroDescription.textContent =
        description;


    heroThumbnail.onclick =
        () => {

            openVideo(
                video
            );

        };


    heroPlayButton.onclick =
        event => {

            event.stopPropagation();

            openVideo(
                video
            );

        };

}


/* =========================================================
   VIDEO LIST
========================================================= */

function renderVideos() {

    videoList.innerHTML =
        "";


    if (
        !videos.length
    ) {

        emptyVideos.classList.remove(
            "hidden"
        );

        return;

    }


    emptyVideos.classList.add(
        "hidden"
    );


    videos.forEach(
        (
            video,
            index
        ) => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "video-card";


            const thumbnail =
                getVideoThumbnail(
                    video
                );


            const title =
                video.title ||
                "Untitled Video";


            const description =
                video.description ||
                "";


            card.innerHTML = `

                <div class="video-card-thumbnail">

                    <img
                        src="${escapeAttribute(thumbnail)}"
                        alt="${escapeAttribute(title)}"
                        loading="lazy"
                    >

                    <div class="small-play">
                        ▶
                    </div>

                </div>


                <div class="video-card-info">

                    <div class="video-number">
                        VIDEO ${String(
                            index + 1
                        ).padStart(
                            2,
                            "0"
                        )}
                    </div>


                    <h3 class="video-card-title">
                        ${escapeHTML(
                            title
                        )}
                    </h3>


                    ${
                        description
                            ? `
                                <p class="video-card-description">
                                    ${escapeHTML(
                                        description
                                    )}
                                </p>
                              `
                            : ""
                    }


                    <span class="watch-label">
                        ▶ WATCH VIDEO
                    </span>

                </div>

            `;


            card.addEventListener(
                "click",
                () => {

                    openVideo(
                        video
                    );

                }
            );


            videoList.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   PDF LIST
========================================================= */

function renderPDFs() {

    pdfList.innerHTML =
        "";


    if (
        !pdfs.length
    ) {

        emptyPdfs.classList.remove(
            "hidden"
        );

        return;

    }


    emptyPdfs.classList.add(
        "hidden"
    );


    pdfs.forEach(
        pdf => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "pdf-card";


            const title =
                pdf.title ||
                pdf.fileName ||
                "Study Material";


            const url =
                pdf.fileUrl ||
                pdf.pdfUrl ||
                "";


            card.innerHTML = `

                <div class="pdf-icon">
                    PDF
                </div>


                <div class="pdf-info">

                    <strong>
                        ${escapeHTML(
                            title
                        )}
                    </strong>

                    <span>
                        Study material
                    </span>

                </div>


                ${
                    url
                        ? `
                            <a
                                class="pdf-button"
                                href="${escapeAttribute(url)}"
                                target="_blank"
                                rel="noopener"
                            >
                                OPEN
                            </a>
                          `
                        : `
                            <span
                                class="pdf-button"
                                style="
                                    opacity:.45;
                                    cursor:not-allowed;
                                "
                            >
                                UNAVAILABLE
                            </span>
                          `
                }

            `;


            pdfList.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   VIDEO THUMBNAIL
========================================================= */

function getVideoThumbnail(
    video
) {

    /*
     * 1. Admin-provided thumbnail
     */

    if (
        video.thumbnailUrl &&
        String(
            video.thumbnailUrl
        ).trim()
    ) {

        return String(
            video.thumbnailUrl
        ).trim();

    }


    /*
     * 2. YouTube thumbnail
     */

    const youtubeId =
        extractYouTubeId(
            video.videoUrl
        );


    if (
        youtubeId
    ) {

        return (
            "https://img.youtube.com/vi/" +
            encodeURIComponent(
                youtubeId
            ) +
            "/maxresdefault.jpg"
        );

    }


    /*
     * 3. Generic placeholder
     */

    return createPlaceholderThumbnail();

}


/* =========================================================
   PLACEHOLDER
========================================================= */

function createPlaceholderThumbnail() {

    return (
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(`
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1280"
                height="720"
                viewBox="0 0 1280 720"
            >
                <rect
                    width="1280"
                    height="720"
                    fill="#181818"
                />
                <circle
                    cx="640"
                    cy="360"
                    r="70"
                    fill="#333"
                />
                <polygon
                    points="620,320 620,400 690,360"
                    fill="#fff"
                />
            </svg>
        `)
    );

}


/* =========================================================
   OPEN VIDEO PLAYER
========================================================= */

function openVideo(
    video
) {

    if (
        !video?.id
    ) {

        return;

    }


    /*
     * IMPORTANT:
     *
     * The video itself does NOT play
     * on chapter details.
     *
     * It opens our Zenova player.
     */

    const url =
        new URL(
            "../videoplayer/",
            window.location.href
        );


    url.searchParams.set(
        "contentId",
        video.id
    );


    window.location.href =
        url.toString();

}


/* =========================================================
   BACK
========================================================= */

backButton.addEventListener(
    "click",
    () => {

        /*
         * Subject details is the normal
         * previous page.
         */

        const url =
            new URL(
                "../subjectdetails/",
                window.location.href
            );


        if (
            currentSubject?.id
        ) {

            url.searchParams.set(
                "subjectId",
                currentSubject.id
            );

        }


        if (
            currentCourse?.id
        ) {

            url.searchParams.set(
                "courseId",
                currentCourse.id
            );

        }


        window.location.href =
            url.toString();

    }
);


/* =========================================================
   BOTTOM NAV
========================================================= */

document
    .querySelectorAll(
        "[data-nav]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const nav =
                        button.dataset.nav;


                    if (
                        nav ===
                        "home"
                    ) {

                        window.location.href =
                            "../";

                    }


                    if (
                        nav ===
                        "live"
                    ) {

                        window.location.href =
                            "../live/";

                    }


                    if (
                        nav ===
                        "revision"
                    ) {

                        window.location.href =
                            "../revision/";

                    }


                    if (
                        nav ===
                        "profile"
                    ) {

                        window.location.href =
                            "../profile/";

                    }

                }
            );

        }
    );


/* =========================================================
   RETRY
========================================================= */

retryButton.addEventListener(
    "click",
    () => {

        window.location.reload();

    }
);


/* =========================================================
   LOADER
========================================================= */

function hideLoader() {

    loader.classList.add(
        "hidden"
    );


    app.classList.remove(
        "hidden"
    );

}


/* =========================================================
   ERROR
========================================================= */

function showError(
    message
) {

    loader.classList.add(
        "hidden"
    );


    app.classList.add(
        "hidden"
    );


    errorMessage.textContent =
        message ||
        "Unable to load this chapter.";


    errorState.classList.remove(
        "hidden"
    );

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
        String(
            url
        ).trim();


    /*
     * Already an ID
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
            new URL(
                value
            );


        const hostname =
            parsed.hostname.toLowerCase();


        /*
         * youtu.be
         */

        if (
            hostname ===
                "youtu.be" ||
            hostname.endsWith(
                ".youtu.be"
            )
        ) {

            const id =
                parsed.pathname
                    .split("/")
                    .filter(
                        Boolean
                    )[0];


            if (
                id
            ) {

                return id;

            }

        }


        /*
         * youtube.com
         */

        if (
            hostname.includes(
                "youtube.com"
            )
        ) {

            /*
             * watch?v=
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


            /*
             * embed
             */

            const embedMatch =
                parsed.pathname.match(
                    /\/embed\/([^/]+)/i
                );


            if (
                embedMatch
            ) {

                return embedMatch[1];

            }


            /*
             * shorts
             */

            const shortsMatch =
                parsed.pathname.match(
                    /\/shorts\/([^/]+)/i
                );


            if (
                shortsMatch
            ) {

                return shortsMatch[1];

            }


            /*
             * live
             */

            const liveMatch =
                parsed.pathname.match(
                    /\/live\/([^/]+)/i
                );


            if (
                liveMatch
            ) {

                return liveMatch[1];

            }

        }

    } catch (error) {

        console.warn(
            "Could not parse video URL:",
            error
        );

    }


    return null;

}


/* =========================================================
   HTML ESCAPING
========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
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


function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}


/* =========================================================
   ERROR MESSAGE
========================================================= */

function getReadableError(
    error
) {

    if (
        error?.code ===
        "permission-denied"
    ) {

        return (
            "You do not have permission to access this chapter."
        );

    }


    return (
        error?.message ||
        "Something went wrong while loading the chapter."
    );

}

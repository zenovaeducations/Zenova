import {
    auth,
    db
} from "../firebase/firebase-config.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    limit
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";



/* =========================================
   ELEMENTS
========================================= */

const continueCard =
    document.getElementById(
        "continueCard"
    );


const recommendedList =
    document.getElementById(
        "recommendedList"
    );


const subjectsList =
    document.getElementById(
        "subjectsList"
    );


const profileInitial =
    document.getElementById(
        "profileInitial"
    );


const errorScreen =
    document.getElementById(
        "errorScreen"
    );


const errorText =
    document.getElementById(
        "errorText"
    );



/* =========================================
   STATE
========================================= */

let currentUser = null;

let student = null;

let courseId = null;

let course = null;

let subjects = [];

let chapters = [];

let content = [];

let enrollments = [];



/* =========================================
   AUTH
========================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.replace(
                "../account/login/"
            );

            return;

        }


        currentUser =
            user;


        try {

            await loadStudent();

            await determineCourse();

            await loadSubjects();

            await loadContent();

            renderContinueLearning();

            renderRecommendedVideos();

            renderSubjects();

            setupNavigation();

        }

        catch (error) {

            console.error(
                "REVISION ERROR:",
                error
            );


            showError(
                "Unable to load Revision Classes."
            );

        }

    }
);



/* =========================================
   STUDENT
========================================= */

async function loadStudent() {

    const ref =
        doc(
            db,
            "zen2Students",
            currentUser.uid
        );


    const snapshot =
        await getDoc(
            ref
        );


    if (!snapshot.exists()) {

        window.location.replace(
            "../account/onboarding/"
        );

        return;

    }


    student =
        snapshot.data();


    if (
        student.onboardingComplete !== true
    ) {

        window.location.replace(
            "../account/onboarding/"
        );

        return;

    }


    const name =
        student.name ||
        currentUser.displayName ||
        "Student";


    profileInitial.textContent =
        name
            .charAt(0)
            .toUpperCase();

}



/* =========================================
   DETERMINE COURSE
========================================= */

async function determineCourse() {

    /*
     * First preference:
     * student's active/enrolled ZEN2 course.
     */

    try {

        const enrollmentQuery =
            query(
                collection(
                    db,
                    "studentEnrollments"
                ),

                where(
                    "studentUid",
                    "==",
                    currentUser.uid
                ),

                limit(20)
            );


        const snapshot =
            await getDocs(
                enrollmentQuery
            );


        enrollments =
            snapshot.docs.map(
                item => ({

                    id:
                        item.id,

                    ...item.data()

                })
            );


        const active =
            enrollments.find(
                item => {

                    const status =
                        String(
                            item.status ||
                            ""
                        )
                        .toLowerCase();


                    return (
                        status === "active" ||
                        status === "enrolled" ||
                        item.accessGranted === true ||
                        item.active === true
                    );

                }
            );


        if (active) {

            courseId =
                active.courseId ||
                active.zen2CourseId ||
                active.batchId;


            if (courseId) {

                await loadCourse();

                return;

            }

        }

    }

    catch (error) {

        console.warn(
            "Enrollment lookup failed:",
            error
        );

    }


    /*
     * Fallback:
     * If there is no enrollment yet,
     * use the first ZEN2 course.
     *
     * This keeps Revision usable while
     * the purchase system is being built.
     */

    const coursesSnapshot =
        await getDocs(
            query(
                collection(
                    db,
                    "zen2Courses"
                ),

                limit(1)
            )
        );


    if (
        coursesSnapshot.empty
    ) {

        throw new Error(
            "No ZEN2 course available."
        );

    }


    const first =
        coursesSnapshot.docs[0];


    courseId =
        first.id;


    course = {

        id:
            first.id,

        ...first.data()

    };

}



/* =========================================
   LOAD COURSE
========================================= */

async function loadCourse() {

    const ref =
        doc(
            db,
            "zen2Courses",
            courseId
        );


    const snapshot =
        await getDoc(
            ref
        );


    if (
        snapshot.exists()
    ) {

        course = {

            id:
                snapshot.id,

            ...snapshot.data()

        };

    }

}



/* =========================================
   LOAD SUBJECTS
========================================= */

async function loadSubjects() {

    const q =
        query(
            collection(
                db,
                "zen2Subjects"
            ),

            where(
                "courseId",
                "==",
                courseId
            )
        );


    const snapshot =
        await getDocs(
            q
        );


    subjects =
        snapshot.docs.map(
            item => ({

                id:
                    item.id,

                ...item.data()

            })
        );


    subjects.sort(
        sortByOrder
    );

}



/* =========================================
   LOAD CONTENT
========================================= */

async function loadContent() {

    /*
     * Get chapters belonging to
     * the selected course.
     */

    chapters = [];


    for (
        const subject
        of subjects
    ) {

        const chapterQuery =
            query(
                collection(
                    db,
                    "zen2Chapters"
                ),

                where(
                    "subjectId",
                    "==",
                    subject.id
                )
            );


        const chapterSnapshot =
            await getDocs(
                chapterQuery
            );


        chapterSnapshot.docs.forEach(
            item => {

                chapters.push({

                    id:
                        item.id,

                    subjectId:
                        subject.id,

                    subjectName:
                        getSubjectName(
                            subject
                        ),

                    ...item.data()

                });

            }
        );

    }


    chapters.sort(
        sortByOrder
    );


    /*
     * Load all chapter content.
     */

    content = [];


    for (
        const chapter
        of chapters
    ) {

        const contentQuery =
            query(
                collection(
                    db,
                    "zen2Content"
                ),

                where(
                    "chapterId",
                    "==",
                    chapter.id
                )
            );


        const contentSnapshot =
            await getDocs(
                contentQuery
            );


        contentSnapshot.docs.forEach(
            item => {

                const data =
                    item.data();


                /*
                 * Only videos are used
                 * for Recommended Videos.
                 */

                const type =
                    String(
                        data.type ||
                        data.contentType ||
                        data.kind ||
                        ""
                    )
                    .toLowerCase();


                const isVideo =
                    type === "video" ||
                    Boolean(
                        data.videoUrl ||
                        data.videoURL ||
                        data.video
                    );


                if (
                    isVideo
                ) {

                    content.push({

                        id:
                            item.id,

                        chapterId:
                            chapter.id,

                        chapterName:
                            getChapterName(
                                chapter
                            ),

                        subjectId:
                            chapter.subjectId,

                        subjectName:
                            chapter.subjectName,

                        ...data

                    });

                }

            }
        );

    }


    content.sort(
        sortByOrder
    );

}



/* =========================================
   CONTINUE LEARNING
========================================= */

function renderContinueLearning() {

    /*
     * We use the saved last-watched
     * content if available.
     *
     * Later the video player can save:
     *
     * zen2LastWatched
     */

    let lastWatched = null;


    try {

        const saved =
            localStorage.getItem(
                "zen2LastWatched"
            );


        if (saved) {

            lastWatched =
                JSON.parse(
                    saved
                );

        }

    }

    catch (error) {

        console.warn(
            error
        );

    }


    let video = null;


    if (
        lastWatched?.contentId
    ) {

        video =
            content.find(
                item =>
                    item.id ===
                    lastWatched.contentId
            );

    }


    /*
     * If there is no previous video,
     * choose the first ordered video.
     */

    if (!video) {

        video =
            content[0] ||
            null;

    }


    if (!video) {

        continueCard.innerHTML = `

            <div class="loading-text">

                No learning videos available yet.

            </div>

        `;

        return;

    }


    const progress =
        Number(
            lastWatched?.progress ||
            0
        );


    const safeProgress =
        Math.max(
            0,
            Math.min(
                100,
                progress
            )
        );


    const thumbnail =
        video.thumbnailUrl ||
        video.thumbnail ||
        video.imageUrl ||
        "";


    const title =
        getContentTitle(
            video
        );


    continueCard.innerHTML = `

        <div class="continue-image">

            ${
                thumbnail
                    ? `

                        <img
                            src="${escapeHtml(
                                thumbnail
                            )}"
                            alt=""
                        >

                    `
                    : `

                        <div
                            class="continue-image-placeholder"
                        >
                            ZENOVA
                        </div>

                    `
            }

        </div>


        <div class="continue-info">

            <span class="continue-badge">
                CONTINUE LEARNING
            </span>


            <h3>
                ${escapeHtml(
                    title
                )}
            </h3>


            <p>
                ${escapeHtml(
                    video.subjectName ||
                    ""
                )}
                ${
                    video.chapterName
                        ? `
                            •
                            ${escapeHtml(
                                video.chapterName
                            )}
                        `
                        : ""
                }
            </p>


            <div class="progress-row">

                <div class="progress-bar">

                    <span
                        style="width:${safeProgress}%"
                    ></span>

                </div>


                <span class="progress-value">

                    ${safeProgress}%

                </span>

            </div>

        </div>


        <button
            class="continue-button"
            id="continueButton"
            type="button"
        >

            CONTINUE

        </button>

    `;


    document
        .getElementById(
            "continueButton"
        )
        ?.addEventListener(
            "click",
            () => {

                openContent(
                    video
                );

            }
        );

}



/* =========================================
   RECOMMENDED VIDEOS
========================================= */

function renderRecommendedVideos() {

    if (
        !content.length
    ) {

        recommendedList.innerHTML = `

            <div class="loading-text">

                No videos available yet.

            </div>

        `;

        return;

    }


    /*
     * Priority:
     *
     * 1. Last watched
     * 2. First ordered videos
     *
     * We don't repeat the Continue
     * video in the recommended list.
     */

    let lastWatchedId = null;


    try {

        const saved =
            localStorage.getItem(
                "zen2LastWatched"
            );


        if (saved) {

            lastWatchedId =
                JSON.parse(
                    saved
                )?.contentId;

        }

    }

    catch (error) {

        console.warn(
            error
        );

    }


    let videos =
        content.filter(
            item =>
                item.id !==
                lastWatchedId
        );


    /*
     * Take the first 6 ordered videos.
     */

    videos =
        videos.slice(
            0,
            6
        );


    if (
        !videos.length
    ) {

        recommendedList.innerHTML = `

            <div class="loading-text">

                You are up to date.

            </div>

        `;

        return;

    }


    recommendedList.innerHTML =
        videos
            .map(
                video =>
                    createVideoCard(
                        video
                    )
            )
            .join("");


    attachVideoEvents();

}



/* =========================================
   VIDEO CARD
========================================= */

function createVideoCard(
    video
) {

    const thumbnail =
        video.thumbnailUrl ||
        video.thumbnail ||
        video.imageUrl ||
        "";


    const title =
        getContentTitle(
            video
        );


    const access =
        String(
            video.accessType ||
            (
                video.isFree === true
                    ? "FREE"
                    : "PAID"
            )
        )
        .toUpperCase();


    return `

        <article
            class="video-card"
            data-content-id="${escapeHtml(
                video.id
            )}"
        >

            <div
                class="video-thumbnail"
            >

                ${
                    thumbnail
                        ? `

                            <img
                                src="${escapeHtml(
                                    thumbnail
                                )}"
                                alt=""
                                loading="lazy"
                            >

                        `
                        : ""
                }


                <span class="play-button">
                    ▶
                </span>


                ${
                    access === "FREE"
                        ? `

                            <span class="free-badge">
                                FREE
                            </span>

                        `
                        : `

                            <span class="paid-badge">
                                PAID
                            </span>

                        `
                }

            </div>


            <div class="video-info">

                <h3>
                    ${escapeHtml(
                        title
                    )}
                </h3>


                <p>

                    ${escapeHtml(
                        video.subjectName ||
                        ""
                    )}

                    ${
                        video.chapterName
                            ? `
                                •
                                ${escapeHtml(
                                    video.chapterName
                                )}
                            `
                            : ""
                    }

                </p>


                <div class="video-meta">

                    <span>
                        VIDEO
                    </span>

                    <span>
                        ${
                            video.duration ||
                            ""
                        }
                    </span>

                </div>

            </div>

        </article>

    `;

}



/* =========================================
   VIDEO EVENTS
========================================= */

function attachVideoEvents() {

    document
        .querySelectorAll(
            ".video-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        const id =
                            card.dataset.contentId;


                        const video =
                            content.find(
                                item =>
                                    item.id ===
                                    id
                            );


                        if (video) {

                            openContent(
                                video
                            );

                        }

                    }
                );

            }
        );

}



/* =========================================
   OPEN CONTENT
========================================= */

function openContent(
    video
) {

    /*
     * Chapter Details will contain
     * the actual video/PDF player.
     */

    const url =
        `../chapter-details/?chapterId=${
            encodeURIComponent(
                video.chapterId
            )
        }&contentId=${
            encodeURIComponent(
                video.id
            )
        }`;


    window.location.href =
        url;

}



/* =========================================
   SUBJECTS
========================================= */

function renderSubjects() {

    if (
        !subjects.length
    ) {

        subjectsList.innerHTML = `

            <div class="loading-text">

                No subjects available.

            </div>

        `;

        return;

    }


    subjectsList.innerHTML =
        subjects
            .map(
                subject => {

                    const name =
                        getSubjectName(
                            subject
                        );


                    const chapterCount =
                        chapters.filter(
                            chapter =>
                                chapter.subjectId ===
                                subject.id
                        ).length;


                    return `

                        <article
                            class="subject-card"
                            data-subject-id="${escapeHtml(
                                subject.id
                            )}"
                        >

                            <div
                                class="subject-icon"
                            >

                                ${escapeHtml(
                                    getInitial(
                                        name
                                    )
                                )}

                            </div>


                            <div
                                class="subject-info"
                            >

                                <h3>
                                    ${escapeHtml(
                                        name
                                    )}
                                </h3>


                                <p>

                                    ${chapterCount}

                                    ${
                                        chapterCount === 1
                                            ? " Chapter"
                                            : " Chapters"
                                    }

                                </p>

                            </div>


                            <span
                                class="subject-arrow"
                            >
                                →
                            </span>

                        </article>

                    `;

                }
            )
            .join("");


    document
        .querySelectorAll(
            ".subject-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        const id =
                            card.dataset.subjectId;


                        window.location.href =
                            `../subject-details/?subjectId=${
                                encodeURIComponent(
                                    id
                                )
                            }&courseId=${
                                encodeURIComponent(
                                    courseId
                                )
                            }`;

                    }
                );

            }
        );

}



/* =========================================
   NAVIGATION
========================================= */

function setupNavigation() {

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const route =
                            button.dataset.route;


                        if (
                            route === "home"
                        ) {

                            window.location.href =
                                "../home/";

                        }


                        if (
                            route === "live"
                        ) {

                            window.location.href =
                                "../live/";

                        }


                        if (
                            route === "revision"
                        ) {

                            window.location.href =
                                "./";

                        }


                        if (
                            route === "profile"
                        ) {

                            window.location.href =
                                "../profile/";

                        }

                    }
                );

            }
        );


    document
        .getElementById(
            "profileButton"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "../profile/";

            }
        );

}



/* =========================================
   HELPERS
========================================= */

function getSubjectName(
    subject
) {

    return (
        subject.name ||
        subject.title ||
        subject.subjectName ||
        subject.subject ||
        "Subject"
    );

}


function getChapterName(
    chapter
) {

    return (
        chapter.name ||
        chapter.title ||
        chapter.chapterName ||
        chapter.chapterTitle ||
        "Chapter"
    );

}


function getContentTitle(
    item
) {

    return (
        item.title ||
        item.name ||
        item.contentName ||
        item.videoTitle ||
        "Learning Video"
    );

}


function getInitial(
    text
) {

    return String(
        text ||
        "S"
    )
        .charAt(0)
        .toUpperCase();

}


function sortByOrder(
    a,
    b
) {

    return (
        Number(
            a.order ??
            a.position ??
            9999
        ) -
        Number(
            b.order ??
            b.position ??
            9999
        )
    );

}


function escapeHtml(
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


function showError(
    message
) {

    errorText.textContent =
        message;

    errorScreen.classList.remove(
        "hidden"
    );

}

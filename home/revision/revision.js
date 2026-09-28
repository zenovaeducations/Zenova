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


/* =====================================================
   STATE
===================================================== */

let currentUser = null;
let student = null;
let currentCourse = null;
let subjects = [];
let contents = [];


/* =====================================================
   ELEMENTS
===================================================== */

const loader =
    document.getElementById("loader");

const app =
    document.getElementById("app");

const errorScreen =
    document.getElementById("errorScreen");

const errorMessage =
    document.getElementById("errorMessage");


/* =====================================================
   AUTH
===================================================== */

onAuthStateChanged(
    auth,
    async (user) => {

        console.log(
            "REVISION AUTH:",
            user
        );


        /* ---------------------------------------------
           NOT LOGGED IN
        --------------------------------------------- */

        if (!user) {

            window.location.replace(
                "../../account/login/"
            );

            return;

        }


        currentUser = user;


        try {

            /*
             * IMPORTANT:
             * Use the REAL student collection.
             *
             * students/{uid}
             */

            await loadStudent();


            /*
             * Find course for student's class.
             */

            await loadCourse();


            /*
             * Load subjects belonging
             * to that course.
             */

            await loadSubjects();


            /*
             * Load content for
             * recommendations.
             */

            await loadContent();


            renderStudent();

            renderCourseName();

            renderSubjects();

            renderContinueLearning();

            renderRecommendedVideos();

            setupNavigation();

            showApp();

        }

        catch (error) {

            console.error(
                "REVISION PAGE ERROR:",
                error
            );

            showError(
                error?.message ||
                "Unable to load Revision Classes."
            );

        }

    }
);


/* =====================================================
   LOAD STUDENT
===================================================== */

async function loadStudent() {

    /*
     * THIS IS THE IMPORTANT FIX.
     *
     * Actual collection:
     *
     * students
     *
     * Document:
     *
     * students/{uid}
     */

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


    console.log(
        "STUDENT EXISTS:",
        snapshot.exists()
    );


    /*
     * DO NOT REDIRECT TO ONBOARDING HERE.
     *
     * Home already handles authentication/onboarding.
     *
     * If something is wrong, show an error instead
     * of creating a redirect loop.
     */

    if (!snapshot.exists()) {

        throw new Error(
            "Student profile was not found."
        );

    }


    student =
        snapshot.data();


    console.log(
        "REVISION STUDENT DATA:",
        student
    );


    /*
     * Actual field from onboarding:
     *
     * onboardingComplete
     */

    if (
        student.onboardingComplete !== true
    ) {

        throw new Error(
            "Student onboarding is not completed."
        );

    }

}


/* =====================================================
   STUDENT UI
===================================================== */

function renderStudent() {

    const name =
        student.name ||
        student.fullName ||
        currentUser.displayName ||
        "Student";


    const initial =
        document.getElementById(
            "profileInitial"
        );


    if (initial) {

        initial.textContent =
            name
                .trim()
                .charAt(0)
                .toUpperCase();

    }

}


/* =====================================================
   LOAD COURSE
===================================================== */

async function loadCourse() {

    /*
     * Actual onboarding field:
     *
     * className
     */

    const studentClass =
        normalizeClass(
            student.className
        );


    console.log(
        "STUDENT CLASS:",
        studentClass
    );


    if (!studentClass) {

        throw new Error(
            "Student class is missing."
        );

    }


    /*
     * Load ZEN2 courses.
     */

    const snapshot =
        await getDocs(
            collection(
                db,
                "zen2Courses"
            )
        );


    const allCourses =
        snapshot.docs.map(
            item => ({

                id:
                    item.id,

                ...item.data()

            })
        );


    console.log(
        "ALL ZEN2 COURSES:",
        allCourses
    );


    /*
     * Find course matching student's class.
     *
     * Example:
     *
     * student.className = "10th"
     *
     * course.className = "10th"
     */

    const matchingCourses =
        allCourses.filter(
            course => {

                const courseClass =
                    normalizeClass(
                        course.className
                    );


                const active =
                    course.active !== false &&
                    course.status !== "INACTIVE";


                return (
                    courseClass ===
                    studentClass
                ) && active;

            }
        );


    console.log(
        "MATCHING COURSES:",
        matchingCourses
    );


    /*
     * If no class-specific course,
     * try classDisplayName as fallback.
     */

    if (
        !matchingCourses.length
    ) {

        const displayClass =
            normalizeClass(
                student.classDisplayName
            );


        if (displayClass) {

            const fallback =
                allCourses.filter(
                    course => {

                        return (
                            normalizeClass(
                                course.className
                            ) === displayClass
                        ) &&
                        course.active !== false &&
                        course.status !== "INACTIVE";

                    }
                );


            if (fallback.length) {

                matchingCourses.push(
                    ...fallback
                );

            }

        }

    }


    if (
        !matchingCourses.length
    ) {

        throw new Error(
            `No ZEN2 course found for ${student.className}.`
        );

    }


    /*
     * Respect admin order.
     */

    matchingCourses.sort(
        (a, b) => {

            return (
                Number(
                    a.order ??
                    a.priority ??
                    9999
                ) -
                Number(
                    b.order ??
                    b.priority ??
                    9999
                )
            );

        }
    );


    currentCourse =
        matchingCourses[0];


    console.log(
        "SELECTED ZEN2 COURSE:",
        currentCourse
    );

}


/* =====================================================
   LOAD SUBJECTS
===================================================== */

async function loadSubjects() {

    if (!currentCourse) {

        throw new Error(
            "Course not selected."
        );

    }


    const subjectQuery =
        query(
            collection(
                db,
                "zen2Subjects"
            ),

            where(
                "courseId",
                "==",
                currentCourse.id
            )
        );


    const snapshot =
        await getDocs(
            subjectQuery
        );


    subjects =
        snapshot.docs.map(
            item => ({

                id:
                    item.id,

                ...item.data()

            })
        );


    /*
     * Ignore disabled subjects.
     */

    subjects =
        subjects.filter(
            subject =>
                subject.active !== false
        );


    /*
     * Admin order.
     */

    subjects.sort(
        (a, b) => {

            return (
                Number(
                    a.order ??
                    a.priority ??
                    9999
                ) -
                Number(
                    b.order ??
                    b.priority ??
                    9999
                )
            );

        }
    );


    console.log(
        "ZEN2 SUBJECTS:",
        subjects
    );

}


/* =====================================================
   LOAD CONTENT
===================================================== */

async function loadContent() {

    if (!currentCourse) {
        return;
    }


    const contentQuery =
        query(
            collection(
                db,
                "zen2Content"
            ),

            where(
                "courseId",
                "==",
                currentCourse.id
            )
        );


    const snapshot =
        await getDocs(
            contentQuery
        );


    contents =
        snapshot.docs.map(
            item => ({

                id:
                    item.id,

                ...item.data()

            })
        );


    contents =
        contents.filter(
            content =>
                content.active !== false
        );


    contents.sort(
        (a, b) => {

            return (
                Number(
                    a.order ??
                    9999
                ) -
                Number(
                    b.order ??
                    9999
                )
            );

        }
    );


    console.log(
        "ZEN2 CONTENT:",
        contents
    );

}


/* =====================================================
   COURSE NAME
===================================================== */

function renderCourseName() {

    const element =
        document.getElementById(
            "courseName"
        );


    if (!element) {
        return;
    }


    element.textContent =
        currentCourse.courseName ||
        currentCourse.name ||
        currentCourse.className ||
        "Your Course";

}


/* =====================================================
   RENDER SUBJECTS
===================================================== */

function renderSubjects() {

    const container =
        document.getElementById(
            "subjectsList"
        );


    if (!container) {
        return;
    }


    if (!subjects.length) {

        container.innerHTML = `

            <div class="loading-box">

                No subjects available
                for this course.

            </div>

        `;

        return;

    }


    container.innerHTML =
        subjects
            .map(
                subject => {

                    const name =
                        subject.subjectName ||
                        subject.name ||
                        subject.displayName ||
                        "Subject";


                    const firstLetter =
                        name
                            .trim()
                            .charAt(0)
                            .toUpperCase();


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
                                    firstLetter
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
                                    View Chapters →
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


    /*
     * SUBJECT CLICK
     *
     * Revision
     * ↓
     * Subject Details
     */

    document
        .querySelectorAll(
            ".subject-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        const subjectId =
                            card.dataset.subjectId;


                        window.location.href =
                            `../subjectdetails/?courseId=${
                                encodeURIComponent(
                                    currentCourse.id
                                )
                            }&subjectId=${
                                encodeURIComponent(
                                    subjectId
                                )
                            }`;

                    }
                );

            }
        );

}


/* =====================================================
   CONTINUE LEARNING
===================================================== */

function renderContinueLearning() {

    const container =
        document.getElementById(
            "continueCard"
        );


    if (!container) {
        return;
    }


    let lastWatched = null;


    const saved =
        localStorage.getItem(
            "zen2LastWatched"
        );


    if (saved) {

        try {

            lastWatched =
                JSON.parse(
                    saved
                );

        }

        catch {

            lastWatched =
                null;

        }

    }


    let video = null;


    /*
     * First:
     * last watched video
     */

    if (
        lastWatched?.contentId
    ) {

        video =
            contents.find(
                item =>
                    item.id ===
                    lastWatched.contentId
            );

    }


    /*
     * Otherwise:
     * first uploaded video
     */

    if (!video) {

        video =
            contents.find(
                item => {

                    const type =
                        String(
                            item.contentType ||
                            item.type ||
                            ""
                        )
                        .toUpperCase();


                    return (
                        type === "VIDEO"
                    );

                }
            );

    }


    if (!video) {

        container.innerHTML = `

            <div class="loading-box">

                No learning videos
                available yet.

            </div>

        `;

        return;

    }


    const subject =
        subjects.find(
            item =>
                item.id ===
                video.subjectId
        );


    const subjectName =
        subject?.subjectName ||
        subject?.name ||
        subject?.displayName ||
        "Subject";


    container.innerHTML = `

        <div class="continue-thumbnail">

            ${
                video.thumbnailUrl

                    ? `

                        <img
                            src="${escapeHtml(
                                video.thumbnailUrl
                            )}"
                            alt=""
                        >

                    `

                    : `

                        <div
                            class="thumbnail-placeholder"
                        >
                            ZENOVA
                        </div>

                    `
            }

        </div>


        <div class="continue-info">

            <span
                class="continue-label"
            >
                ${
                    lastWatched
                        ? "CONTINUE LEARNING"
                        : "START LEARNING"
                }
            </span>


            <h3>
                ${escapeHtml(
                    video.title ||
                    video.contentTitle ||
                    "Learning Video"
                )}
            </h3>


            <p>
                ${escapeHtml(
                    subjectName
                )}
            </p>

        </div>


        <button
            id="continueButton"
            class="continue-button"
            type="button"
        >
            ${
                lastWatched
                    ? "CONTINUE"
                    : "START"
            }
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


/* =====================================================
   RECOMMENDED VIDEOS
===================================================== */

function renderRecommendedVideos() {

    const container =
        document.getElementById(
            "recommendedVideos"
        );


    if (!container) {
        return;
    }


    const videos =
        contents.filter(
            content => {

                const type =
                    String(
                        content.contentType ||
                        content.type ||
                        ""
                    )
                    .toUpperCase();


                return (
                    type === "VIDEO"
                );

            }
        );


    if (!videos.length) {

        container.innerHTML = `

            <div class="loading-box">

                No recommended videos
                available yet.

            </div>

        `;

        return;

    }


    /*
     * First ordered videos.
     */

    const recommended =
        videos.slice(
            0,
            6
        );


    container.innerHTML =
        recommended
            .map(
                video => {

                    const subject =
                        subjects.find(
                            item =>
                                item.id ===
                                video.subjectId
                        );


                    const subjectName =
                        subject?.subjectName ||
                        subject?.name ||
                        subject?.displayName ||
                        "";


                    const accessType =
                        String(
                            video.accessType ||
                            ""
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
                                    video.thumbnailUrl

                                        ? `

                                            <img
                                                src="${escapeHtml(
                                                    video.thumbnailUrl
                                                )}"
                                                alt=""
                                                loading="lazy"
                                            >

                                        `

                                        : `

                                            <div
                                                class="video-placeholder"
                                            >
                                                ZENOVA
                                            </div>

                                        `
                                }


                                <span
                                    class="play-icon"
                                >
                                    ▶
                                </span>


                                ${
                                    accessType

                                        ? `

                                            <span
                                                class="access-badge"
                                            >
                                                ${escapeHtml(
                                                    accessType
                                                )}
                                            </span>

                                        `

                                        : ""
                                }

                            </div>


                            <div
                                class="video-info"
                            >

                                <h3>
                                    ${escapeHtml(
                                        video.title ||
                                        video.contentTitle ||
                                        "Learning Video"
                                    )}
                                </h3>


                                <p>
                                    ${escapeHtml(
                                        subjectName
                                    )}
                                </p>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");


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
                            contents.find(
                                item =>
                                    item.id === id
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


/* =====================================================
   OPEN CONTENT
===================================================== */

function openContent(
    content
) {

    if (
        !content.chapterId
    ) {

        console.warn(
            "Chapter ID missing:",
            content
        );

        return;

    }


    window.location.href =
        `../chapterdetails/?courseId=${
            encodeURIComponent(
                currentCourse.id
            )
        }&subjectId=${
            encodeURIComponent(
                content.subjectId || ""
            )
        }&chapterId=${
            encodeURIComponent(
                content.chapterId
            )
        }&contentId=${
            encodeURIComponent(
                content.id
            )
        }`;

}


/* =====================================================
   NAVIGATION
===================================================== */

function setupNavigation() {

    const profileButton =
        document.getElementById(
            "profileButton"
        );


    profileButton?.addEventListener(
        "click",
        () => {

            window.location.href =
                "../profile/";

        }
    );

}


/* =====================================================
   CLASS NORMALIZATION
===================================================== */

function normalizeClass(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .toUpperCase()
        .replace(
            /\s+/g,
            " "
        );

}


/* =====================================================
   SHOW APP
===================================================== */

function showApp() {

    if (app) {

        app.classList.remove(
            "hidden"
        );

    }


    setTimeout(
        () => {

            loader?.classList.add(
                "fade"
            );

        },
        100
    );

}


/* =====================================================
   ERROR
===================================================== */

function showError(
    message
) {

    console.error(
        message
    );


    if (errorMessage) {

        errorMessage.textContent =
            message;

    }


    loader?.classList.add(
        "fade"
    );


    errorScreen?.classList.remove(
        "hidden"
    );


    document
        .getElementById(
            "retryButton"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.reload();

            }
        );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

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

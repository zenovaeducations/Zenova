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

const continueCard =
    document.getElementById("continueCard");

const recommendedList =
    document.getElementById("recommendedList");

const subjectsList =
    document.getElementById("subjectsList");

const profileInitial =
    document.getElementById("profileInitial");

const errorScreen =
    document.getElementById("errorScreen");

const errorText =
    document.getElementById("errorText");


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let student = null;

let currentCourse = null;

let subjects = [];

let chapters = [];

let videos = [];


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.replace(
                "../../account/login/"
            );

            return;

        }


        currentUser = user;


        try {

            await loadStudent();

            await loadStudentCourse();

            await loadSubjects();

            await loadChapters();

            await loadVideos();

            renderContinueLearning();

            renderRecommendedVideos();

            renderSubjects();

            setupNavigation();

        }

        catch (error) {

            console.error(
                "REVISION LOAD ERROR:",
                error
            );

            showError(
                error.message ||
                "Unable to load Revision Classes."
            );

        }

    }
);


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
        await getDoc(
            studentRef
        );


    if (!snapshot.exists()) {

        window.location.replace(
            "../../account/onboarding/"
        );

        return;

    }


    student =
        snapshot.data();


    /*
     * Your existing onboarding field.
     */

    if (
        student.onboardingComplete !== true &&
        student.onboardingCompleted !== true
    ) {

        window.location.replace(
            "../../account/onboarding/"
        );

        return;

    }


    const studentName =
        student.name ||
        student.fullName ||
        currentUser.displayName ||
        "Student";


    profileInitial.textContent =
        studentName
            .charAt(0)
            .toUpperCase();

}


/* =========================================================
   NORMALIZE CLASS
========================================================= */

function normalizeClass(
    value
) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }


    const v =
        String(value)
            .trim()
            .toUpperCase()
            .replace(
                /[-_]/g,
                " "
            );


    if (
        [
            "10",
            "10TH",
            "10TH STANDARD",
            "10 STANDARD",
            "SSLC"
        ].includes(v)
    ) {

        return "10TH";

    }


    if (
        [
            "9",
            "9TH",
            "9TH STANDARD",
            "9 STANDARD"
        ].includes(v)
    ) {

        return "9TH";

    }


    if (
        [
            "8",
            "8TH",
            "8TH STANDARD",
            "8 STANDARD"
        ].includes(v)
    ) {

        return "8TH";

    }


    if (
        [
            "1ST PUC",
            "1 PUC",
            "PUC 1",
            "FIRST PUC",
            "1STPUC"
        ].includes(v)
    ) {

        return "1ST_PUC";

    }


    if (
        [
            "2ND PUC",
            "2 PUC",
            "PUC 2",
            "SECOND PUC",
            "2NDPUC"
        ].includes(v)
    ) {

        return "2ND_PUC";

    }


    return v.replace(
        /\s+/g,
        "_"
    );

}


/* =========================================================
   STUDENT CLASS
========================================================= */

function getStudentClass() {

    return normalizeClass(

        student.className ||

        student.class ||

        student.crmClass ||

        student.standard ||

        student.classLevel

    );

}


/* =========================================================
   COURSE CLASS
========================================================= */

function getCourseClass(
    course
) {

    return normalizeClass(

        course.className ||

        course.class ||

        course.standard ||

        course.classLevel ||

        course.crmClass ||

        course.targetClass

    );

}


/* =========================================================
   COURSE NAME
========================================================= */

function getCourseName(
    course
) {

    return (

        course.name ||

        course.title ||

        course.courseName ||

        course.batchName ||

        course.courseTitle ||

        "Zenova Course"

    );

}


/* =========================================================
   LOAD CORRECT ZEN2 COURSE
========================================================= */

async function loadStudentCourse() {

    const studentClass =
        getStudentClass();


    console.log(
        "Student class:",
        studentClass
    );


    if (!studentClass) {

        throw new Error(
            "Student class is not available."
        );

    }


    /*
     * IMPORTANT:
     *
     * We are intentionally loading
     * zen2Courses.
     *
     * NOT crmCourses.
     *
     * NOT hybrid courses.
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
        "ZEN2 courses:",
        allCourses
    );


    /*
     * Only courses for student's class.
     */

    const matchingCourses =
        allCourses.filter(
            course => {

                const courseClass =
                    getCourseClass(
                        course
                    );


                return (
                    courseClass ===
                    studentClass
                );

            }
        );


    console.log(
        "Matching courses:",
        matchingCourses
    );


    if (
        matchingCourses.length === 0
    ) {

        throw new Error(
            `No ZEN2 course found for ${displayClass(studentClass)}.`
        );

    }


    /*
     * Prefer active course.
     */

    const activeCourses =
        matchingCourses.filter(
            course =>
                course.active !== false &&
                course.isActive !== false &&
                course.crmActive !== false
        );


    const available =
        activeCourses.length
            ? activeCourses
            : matchingCourses;


    /*
     * Lower priority first.
     */

    available.sort(
        (
            a,
            b
        ) => {

            const priorityA =
                Number(
                    a.priority ??
                    a.order ??
                    9999
                );


            const priorityB =
                Number(
                    b.priority ??
                    b.order ??
                    9999
                );


            return (
                priorityA -
                priorityB
            );

        }
    );


    currentCourse =
        available[0];


    console.log(
        "Selected ZEN2 course:",
        currentCourse
    );

}


/* =========================================================
   LOAD SUBJECTS
========================================================= */

async function loadSubjects() {

    if (
        !currentCourse
    ) {

        return;

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
     * Active only.
     */

    subjects =
        subjects.filter(
            subject =>
                subject.active !== false &&
                subject.isActive !== false
        );


    /*
     * Sort by admin order.
     */

    subjects.sort(
        (
            a,
            b
        ) => {

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
    );


    console.log(
        "ZEN2 subjects:",
        subjects
    );

}


/* =========================================================
   SUBJECT NAME
========================================================= */

function getSubjectName(
    subject
) {

    return (

        subject.name ||

        subject.title ||

        subject.subjectName ||

        subject.subject ||

        subject.displayName ||

        "Subject"

    );

}


/* =========================================================
   LOAD CHAPTERS
========================================================= */

async function loadChapters() {

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


        const snapshot =
            await getDocs(
                chapterQuery
            );


        snapshot.docs.forEach(
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


    chapters =
        chapters.filter(
            chapter =>
                chapter.active !== false &&
                chapter.isActive !== false
        );


    chapters.sort(
        (
            a,
            b
        ) => {

            return (
                Number(
                    a.order ??
                    a.chapterNumber ??
                    a.position ??
                    9999
                ) -
                Number(
                    b.order ??
                    b.chapterNumber ??
                    b.position ??
                    9999
                )
            );

        }
    );


    console.log(
        "ZEN2 chapters:",
        chapters
    );

}


/* =========================================================
   LOAD VIDEOS
========================================================= */

async function loadVideos() {

    videos = [];


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


        const snapshot =
            await getDocs(
                contentQuery
            );


        snapshot.docs.forEach(
            item => {

                const data =
                    item.data();


                const contentType =
                    String(
                        data.type ||
                        data.contentType ||
                        data.kind ||
                        ""
                    )
                    .toUpperCase();


                const isVideo =
                    contentType ===
                    "VIDEO"
                    ||
                    Boolean(
                        data.videoUrl ||
                        data.videoURL ||
                        data.video
                    );


                if (
                    isVideo
                ) {

                    videos.push({

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


    videos =
        videos.filter(
            video =>
                video.active !== false &&
                video.isActive !== false
        );


    videos.sort(
        (
            a,
            b
        ) => {

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
    );


    console.log(
        "ZEN2 videos:",
        videos
    );

}


/* =========================================================
   CHAPTER NAME
========================================================= */

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


/* =========================================================
   CONTINUE LEARNING
========================================================= */

function renderContinueLearning() {

    let lastWatched =
        null;


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

    catch (
        error
    ) {

        console.warn(
            error
        );

    }


    let video =
        null;


    if (
        lastWatched?.contentId
    ) {

        video =
            videos.find(
                item =>
                    item.id ===
                    lastWatched.contentId
            );

    }


    /*
     * If student has never watched anything,
     * show the first video as the starting
     * learning video.
     */

    if (!video) {

        video =
            videos[0] ||
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


    const thumbnail =
        video.thumbnailUrl ||
        video.thumbnail ||
        video.imageUrl ||
        "";


    const title =
        getVideoTitle(
            video
        );


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
                ${
                    lastWatched?.contentId
                        ? "CONTINUE LEARNING"
                        : "START LEARNING"
                }
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

                •
                
                ${escapeHtml(
                    video.chapterName ||
                    ""
                )}
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
            id="continueButton"
            class="continue-button"
            type="button"
        >
            ${
                lastWatched?.contentId
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

                openVideo(
                    video
                );

            }
        );

}


/* =========================================================
   RECOMMENDED VIDEOS
========================================================= */

function renderRecommendedVideos() {

    if (
        !videos.length
    ) {

        recommendedList.innerHTML = `

            <div class="loading-text">

                No videos available yet.

            </div>

        `;

        return;

    }


    let lastWatchedId =
        null;


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

    catch (
        error
    ) {

        console.warn(
            error
        );

    }


    let recommended =
        videos.filter(
            video =>
                video.id !==
                lastWatchedId
        );


    recommended =
        recommended.slice(
            0,
            6
        );


    if (
        !recommended.length
    ) {

        recommendedList.innerHTML = `

            <div class="loading-text">

                You are up to date.

            </div>

        `;

        return;

    }


    recommendedList.innerHTML =
        recommended
            .map(
                createVideoCard
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

                        const video =
                            videos.find(
                                item =>
                                    item.id ===
                                    card.dataset.contentId
                            );


                        if (video) {

                            openVideo(
                                video
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   VIDEO CARD
========================================================= */

function createVideoCard(
    video
) {

    const thumbnail =
        video.thumbnailUrl ||
        video.thumbnail ||
        video.imageUrl ||
        "";


    const title =
        getVideoTitle(
            video
        );


    const accessType =
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

            <div class="video-thumbnail">

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
                    accessType === "FREE"

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

                    •

                    ${escapeHtml(
                        video.chapterName ||
                        ""
                    )}

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


/* =========================================================
   VIDEO TITLE
========================================================= */

function getVideoTitle(
    video
) {

    return (

        video.title ||

        video.name ||

        video.contentName ||

        video.videoTitle ||

        "Learning Video"

    );

}


/* =========================================================
   OPEN VIDEO
========================================================= */

function openVideo(
    video
) {

    window.location.href =
        `../chapter-details/?chapterId=${
            encodeURIComponent(
                video.chapterId
            )
        }&contentId=${
            encodeURIComponent(
                video.id
            )
        }&subjectId=${
            encodeURIComponent(
                video.subjectId
            )
        }&courseId=${
            encodeURIComponent(
                currentCourse.id
            )
        }`;

}


/* =========================================================
   RENDER SUBJECTS
========================================================= */

function renderSubjects() {

    if (
        !subjects.length
    ) {

        subjectsList.innerHTML = `

            <div class="loading-text">

                No subjects found for
                ${escapeHtml(
                    getCourseName(
                        currentCourse
                    )
                )}.

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
                                    name
                                        .charAt(0)
                                        .toUpperCase()
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

                        const subjectId =
                            card.dataset.subjectId;


                        window.location.href =
                            `../subject-details/?subjectId=${
                                encodeURIComponent(
                                    subjectId
                                )
                            }&courseId=${
                                encodeURIComponent(
                                    currentCourse.id
                                )
                            }`;

                    }
                );

            }
        );

}


/* =========================================================
   NAVIGATION
========================================================= */

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
                                "../";

                            return;

                        }


                        if (
                            route === "live"
                        ) {

                            window.location.href =
                                "../live/";

                            return;

                        }


                        if (
                            route === "revision"
                        ) {

                            window.location.href =
                                "./";

                            return;

                        }


                        if (
                            route === "profile"
                        ) {

                            window.location.href =
                                "../profile/";

                            return;

                        }

                    }
                );

            }
        );


    profileInitial.parentElement
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "../profile/";

            }
        );

}


/* =========================================================
   DISPLAY CLASS
========================================================= */

function displayClass(
    value
) {

    const normalized =
        normalizeClass(
            value
        );


    const names = {

        "10TH":
            "10th",

        "9TH":
            "9th",

        "8TH":
            "8th",

        "1ST_PUC":
            "1st PUC",

        "2ND_PUC":
            "2nd PUC"

    };


    return (
        names[normalized] ||
        value ||
        "class"
    );

}


/* =========================================================
   ERROR
========================================================= */

function showError(
    message
) {

    console.error(
        message
    );


    if (
        errorText
    ) {

        errorText.textContent =
            message;

    }


    if (
        errorScreen
    ) {

        errorScreen.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

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

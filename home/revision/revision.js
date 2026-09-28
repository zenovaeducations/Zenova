import {
    auth,
    db
} from "../../firebase/firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =====================================================
   ZEN2 REVISION
===================================================== */

let currentUser = null;
let zen2Student = null;
let currentCourse = null;
let subjects = [];


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

const subjectsList =
    document.getElementById("subjectsList");

const courseName =
    document.getElementById("courseName");

const continueCard =
    document.getElementById("continueCard");

const recommendedVideos =
    document.getElementById("recommendedVideos");

const profileInitial =
    document.getElementById("profileInitial");


/* =====================================================
   START
===================================================== */

onAuthStateChanged(
    auth,
    async (user) => {

        console.log(
            "ZEN2 REVISION AUTH:",
            user
        );


        /*
         * NOT LOGGED IN
         */

        if (!user) {

            window.location.replace(
                "../../account/login/"
            );

            return;

        }


        currentUser = user;


        try {

            /*
             * 1. GET ZEN2 STUDENT
             */

            await loadZen2Student();


            /*
             * 2. FIND COURSE
             *    ACCORDING TO STUDENT CLASS
             */

            await loadCorrectCourse();


            /*
             * 3. GET SUBJECTS
             *    OF THAT COURSE
             */

            await loadCourseSubjects();


            /*
             * 4. DISPLAY
             */

            renderStudent();

            renderCourse();

            renderSubjects();

            renderContinueLearning();

            renderRecommendedVideos();


            /*
             * 5. SHOW APP
             */

            showApp();

        }

        catch (error) {

            console.error(
                "ZEN2 REVISION ERROR:",
                error
            );

            showError(
                error.message ||
                "Unable to load Revision."
            );

        }

    }
);


/* =====================================================
   LOAD ZEN2 STUDENT
===================================================== */

async function loadZen2Student() {

    /*
     * IMPORTANT
     *
     * ONLY ZEN2 STUDENTS
     *
     * zen2Students/{uid}
     */

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


    console.log(
        "ZEN2 STUDENT EXISTS:",
        snapshot.exists()
    );


    if (!snapshot.exists()) {

        throw new Error(
            "ZEN2 student profile not found."
        );

    }


    zen2Student =
        snapshot.data();


    console.log(
        "ZEN2 STUDENT DATA:",
        zen2Student
    );


    /*
     * Student name
     */

    if (profileInitial) {

        const name =
            zen2Student.name ||
            zen2Student.fullName ||
            currentUser.displayName ||
            "S";


        profileInitial.textContent =
            name
                .trim()
                .charAt(0)
                .toUpperCase();

    }

}


/* =====================================================
   LOAD CORRECT COURSE
===================================================== */

async function loadCorrectCourse() {

    /*
     * Student class from ZEN2
     */

    const studentClass =
        getStudentClass();


    console.log(
        "ZEN2 STUDENT CLASS:",
        studentClass
    );


    if (!studentClass) {

        throw new Error(
            "Class is not available in your ZEN2 student profile."
        );

    }


    /*
     * Get ALL ZEN2 courses.
     */

    const snapshot =
        await getDocs(
            collection(
                db,
                "zen2Courses"
            )
        );


    const courses =
        snapshot.docs.map(
            item => ({

                id:
                    item.id,

                ...item.data()

            })
        );


    console.log(
        "ZEN2 COURSES:",
        courses
    );


    /*
     * Find course whose class matches
     * student's class.
     */

    const matchingCourses =
        courses.filter(
            course => {

                const courseClass =
                    getCourseClass(
                        course
                    );


                return (
                    normalizeClass(
                        courseClass
                    ) ===
                    normalizeClass(
                        studentClass
                    )
                );

            }
        );


    console.log(
        "MATCHING ZEN2 COURSES:",
        matchingCourses
    );


    if (
        !matchingCourses.length
    ) {

        throw new Error(
            `No ZEN2 course found for class ${studentClass}.`
        );

    }


    /*
     * If there are multiple courses
     * for same class, use first active one.
     */

    const activeCourse =
        matchingCourses.find(
            course =>
                course.active !== false
        );


    currentCourse =
        activeCourse ||
        matchingCourses[0];


    console.log(
        "SELECTED ZEN2 COURSE:",
        currentCourse
    );

}


/* =====================================================
   GET STUDENT CLASS
===================================================== */

function getStudentClass() {

    /*
     * Main field:
     *
     * className
     *
     * Other fallbacks are only to make this
     * compatible with the existing ZEN2
     * onboarding data if the field name differs.
     */

    return (
        zen2Student.className ||
        zen2Student.class ||
        zen2Student.standard ||
        zen2Student.grade ||
        zen2Student.targetClass ||
        ""
    );

}


/* =====================================================
   GET COURSE CLASS
===================================================== */

function getCourseClass(
    course
) {

    /*
     * Main ZEN2 field:
     *
     * className
     *
     * Fallbacks supported.
     */

    return (
        course.className ||
        course.courseClass ||
        course.targetClass ||
        course.standard ||
        course.grade ||
        course.crmClass ||
        ""
    );

}


/* =====================================================
   LOAD SUBJECTS
===================================================== */

async function loadCourseSubjects() {

    if (!currentCourse) {

        throw new Error(
            "ZEN2 course not selected."
        );

    }


    /*
     * Subjects are connected through:
     *
     * courseId
     */

    const subjectsQuery =
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
            subjectsQuery
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
     * Remove disabled subjects
     */

    subjects =
        subjects.filter(
            subject =>
                subject.active !== false
        );


    /*
     * Sort according to admin order.
     */

    subjects.sort(
        (a, b) => {

            return (
                Number(
                    a.order ??
                    999999
                ) -
                Number(
                    b.order ??
                    999999
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
   RENDER STUDENT
===================================================== */

function renderStudent() {

    const name =
        zen2Student.name ||
        zen2Student.fullName ||
        currentUser.displayName ||
        "Student";


    if (profileInitial) {

        profileInitial.textContent =
            name
                .trim()
                .charAt(0)
                .toUpperCase();

    }

}


/* =====================================================
   RENDER COURSE
===================================================== */

function renderCourse() {

    if (!courseName) {
        return;
    }


    courseName.textContent =
        currentCourse.courseName ||
        currentCourse.name ||
        currentCourse.title ||
        currentCourse.batchName ||
        getCourseClass(
            currentCourse
        ) ||
        "Your Course";

}


/* =====================================================
   RENDER SUBJECTS
===================================================== */

function renderSubjects() {

    if (!subjectsList) {
        return;
    }


    if (!subjects.length) {

        subjectsList.innerHTML = `

            <div class="loading-box">

                No subjects have been added
                to this course yet.

            </div>

        `;

        return;

    }


    subjectsList.innerHTML =
        subjects
            .map(
                subject => {

                    const name =
                        subject.subjectName ||
                        subject.name ||
                        subject.title ||
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


                            <div
                                class="subject-arrow"
                            >
                                →
                            </div>

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

    if (!continueCard) {
        return;
    }


    /*
     * We are not creating a new progress
     * system now.
     *
     * Just show the first video if available.
     */

    loadFirstVideo()
        .then(
            video => {

                if (!video) {

                    continueCard.innerHTML = `

                        <div class="loading-box">

                            No learning video
                            available yet.

                        </div>

                    `;

                    return;

                }


                const subject =
                    subjects.find(
                        subject =>
                            subject.id ===
                            video.subjectId
                    );


                const subjectName =
                    subject?.subjectName ||
                    subject?.name ||
                    "Subject";


                continueCard.innerHTML = `

                    <div
                        class="continue-thumbnail"
                    >

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


                    <div
                        class="continue-info"
                    >

                        <span
                            class="continue-label"
                        >
                            START LEARNING
                        </span>


                        <h3>
                            ${escapeHtml(
                                video.title ||
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
                        class="continue-button"
                        id="continueButton"
                        type="button"
                    >
                        START
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
        )
        .catch(
            error => {

                console.error(
                    "CONTINUE VIDEO:",
                    error
                );

            }
        );

}


/* =====================================================
   LOAD FIRST VIDEO
===================================================== */

async function loadFirstVideo() {

    if (!currentCourse) {
        return null;
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


    const videos =
        snapshot.docs
            .map(
                item => ({

                    id:
                        item.id,

                    ...item.data()

                })
            )
            .filter(
                item => {

                    const type =
                        String(
                            item.contentType ||
                            item.type ||
                            ""
                        )
                        .toUpperCase();


                    return (
                        type === "VIDEO" &&
                        item.active !== false
                    );

                }
            );


    videos.sort(
        (a, b) => {

            return (
                Number(
                    a.order ??
                    999999
                ) -
                Number(
                    b.order ??
                    999999
                )
            );

        }
    );


    return (
        videos[0] ||
        null
    );

}


/* =====================================================
   RECOMMENDED VIDEOS
===================================================== */

async function renderRecommendedVideos() {

    if (!recommendedVideos) {
        return;
    }


    try {

        const firstVideos =
            await loadRecommendedVideos();


        if (!firstVideos.length) {

            recommendedVideos.innerHTML = `

                <div class="loading-box">

                    No recommended videos
                    available yet.

                </div>

            `;

            return;

        }


        recommendedVideos.innerHTML =
            firstVideos
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
                            "";


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

                                </div>


                                <div
                                    class="video-info"
                                >

                                    <h3>
                                        ${escapeHtml(
                                            video.title ||
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
                        async () => {

                            const id =
                                card.dataset.contentId;


                            const video =
                                firstVideos.find(
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

    catch (error) {

        console.error(
            "RECOMMENDED VIDEOS:",
            error
        );

        recommendedVideos.innerHTML = `

            <div class="loading-box">

                Unable to load videos.

            </div>

        `;

    }

}


/* =====================================================
   LOAD RECOMMENDED VIDEOS
===================================================== */

async function loadRecommendedVideos() {

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


    const videos =
        snapshot.docs
            .map(
                item => ({

                    id:
                        item.id,

                    ...item.data()

                })
            )
            .filter(
                item => {

                    const type =
                        String(
                            item.contentType ||
                            item.type ||
                            ""
                        )
                        .toUpperCase();


                    return (
                        type === "VIDEO" &&
                        item.active !== false
                    );

                }
            );


    videos.sort(
        (a, b) => {

            return (
                Number(
                    a.order ??
                    999999
                ) -
                Number(
                    b.order ??
                    999999
                )
            );

        }
    );


    return videos.slice(
        0,
        6
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
        150
    );

}


/* =====================================================
   ERROR
===================================================== */

function showError(
    message
) {

    console.error(
        "ZEN2 REVISION:",
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

}


/* =====================================================
   NORMALIZE CLASS
===================================================== */

function normalizeClass(
    value
) {

    let text =
        String(
            value || ""
        )
        .trim()
        .toLowerCase();


    /*
     * Convert common variations:
     *
     * 10th
     * 10th standard
     * class 10
     * class 10th
     * 10
     */

    text =
        text
            .replace(
                /^class\s*/,
                ""
            )
            .replace(
                /\s*standard$/,
                ""
            )
            .trim();


    if (
        text === "10"
    ) {

        return "10th";

    }


    if (
        text === "10th"
    ) {

        return "10th";

    }


    if (
        text === "9"
    ) {

        return "9th";

    }


    if (
        text === "9th"
    ) {

        return "9th";

    }


    if (
        text === "8"
    ) {

        return "8th";

    }


    if (
        text === "8th"
    ) {

        return "8th";

    }


    if (
        text === "1 puc" ||
        text === "1st puc" ||
        text === "1st pu"
    ) {

        return "1st puc";

    }


    if (
        text === "2 puc" ||
        text === "2nd puc" ||
        text === "2nd pu"
    ) {

        return "2nd puc";

    }


    return text;

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

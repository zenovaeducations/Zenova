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
    document.getElementById(
        "loader"
    );


const app =
    document.getElementById(
        "app"
    );


const errorScreen =
    document.getElementById(
        "errorScreen"
    );


const errorMessage =
    document.getElementById(
        "errorMessage"
    );


/* =====================================================
   AUTH
===================================================== */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.replace(
                "../../account/login/"
            );

            return;

        }


        currentUser =
            user;


        try {

            await loadStudent();

            await loadCourse();

            await loadSubjects();

            await loadContent();

            renderCourseName();

            renderSubjects();

            renderContinueLearning();

            renderRecommendedVideos();

            setupNavigation();

            showApp();

        }

        catch (error) {

            console.error(
                "REVISION ERROR:",
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
     * ACTUAL ZEN2 STUDENT COLLECTION
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


    if (
        !snapshot.exists()
    ) {

        window.location.replace(
            "../../account/onboarding/"
        );

        return;

    }


    student =
        snapshot.data();


    if (
        student.onboardingComplete !== true
    ) {

        window.location.replace(
            "../../account/onboarding/"
        );

        return;

    }


    console.log(
        "REVISION STUDENT:",
        student
    );

}


/* =====================================================
   LOAD CORRECT COURSE
===================================================== */

async function loadCourse() {

    const studentClass =
        normalizeClass(
            student.className
        );


    if (!studentClass) {

        throw new Error(
            "Student class is missing."
        );

    }


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


    const matchingCourses =
        courses.filter(
            course => {

                const courseClass =
                    normalizeClass(
                        course.className
                    );


                const isActive =
                    course.active !== false &&
                    course.status !== "INACTIVE";


                return (
                    courseClass ===
                    studentClass
                ) &&
                isActive;

            }
        );


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


    if (
        !matchingCourses.length
    ) {

        throw new Error(
            `No ZEN2 course found for ${
                student.classDisplayName ||
                student.className
            }.`
        );

    }


    currentCourse =
        matchingCourses[0];


    console.log(
        "REVISION COURSE:",
        currentCourse
    );

}


/* =====================================================
   LOAD SUBJECTS
===================================================== */

async function loadSubjects() {

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


    subjects =
        subjects.filter(
            subject =>
                subject.active !== false
        );


    subjects.sort(
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
        "REVISION SUBJECTS:",
        subjects
    );

}


/* =====================================================
   LOAD CONTENT
===================================================== */

async function loadContent() {

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
        "REVISION CONTENT:",
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


    if (!element) return;


    element.textContent =
        currentCourse.courseName ||
        currentCourse.classDisplayName ||
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


    if (!container) return;


    if (!subjects.length) {

        container.innerHTML = `

            <div class="loading-box">

                No subjects available for
                ${
                    escapeHtml(
                        currentCourse.courseName ||
                        currentCourse.classDisplayName ||
                        "your course"
                    )
                }.

            </div>

        `;

        return;

    }


    container.innerHTML =
        subjects
            .map(
                subject => {

                    const subjectName =
                        subject.subjectName ||
                        subject.displayName ||
                        "Subject";


                    const firstLetter =
                        subjectName
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
                                        subjectName
                                    )}
                                </h3>


                                <p>
                                    Open subject →
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


    if (!container) return;


    let lastWatched =
        null;


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


    let content =
        null;


    /*
     * First priority:
     * student's last watched content.
     */

    if (
        lastWatched?.contentId
    ) {

        content =
            contents.find(
                item =>
                    item.id ===
                    lastWatched.contentId
            );

    }


    /*
     * If no previous content:
     * first VIDEO by admin order.
     */

    if (!content) {

        content =
            contents.find(
                item =>
                    String(
                        item.contentType ||
                        ""
                    )
                    .toUpperCase() ===
                    "VIDEO"
            );

    }


    if (!content) {

        container.innerHTML = `

            <div class="loading-box">
                No learning videos available yet.
            </div>

        `;

        return;

    }


    const subject =
        subjects.find(
            item =>
                item.id ===
                content.subjectId
        );


    const subjectName =
        subject?.subjectName ||
        subject?.displayName ||
        "Subject";


    container.innerHTML = `

        <div class="continue-thumbnail">

            ${
                content.thumbnailUrl

                    ? `

                        <img
                            src="${escapeHtml(
                                content.thumbnailUrl
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
                    content.title ||
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
                    content
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


    if (!container) return;


    /*
     * Only VIDEO content.
     */

    const videos =
        contents.filter(
            content => {

                return String(
                    content.contentType ||
                    ""
                )
                .toUpperCase() ===
                "VIDEO";

            }
        );


    if (!videos.length) {

        container.innerHTML = `

            <div class="loading-box">
                No recommended videos available yet.
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
                        subject?.displayName ||
                        "";


                    const access =
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
                                    access

                                        ? `

                                            <span
                                                class="access-badge"
                                            >
                                                ${escapeHtml(
                                                    access
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

                        const contentId =
                            card.dataset.contentId;


                        const content =
                            contents.find(
                                item =>
                                    item.id ===
                                    contentId
                            );


                        if (
                            content
                        ) {

                            openContent(
                                content
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

    /*
     * Chapter details page will receive
     * the chapter, subject and content IDs.
     */

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
                content.chapterId || ""
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


    /*
     * Bottom navigation is already
     * handled by normal <a> links.
     */

}


/* =====================================================
   NORMALIZE CLASS
===================================================== */

function normalizeClass(
    value
) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }


    return String(
        value
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

    app.classList.remove(
        "hidden"
    );


    setTimeout(
        () => {

            loader.classList.add(
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
        "REVISION:",
        message
    );


    if (
        errorMessage
    ) {

        errorMessage.textContent =
            message;

    }


    loader.classList.add(
        "fade"
    );


    errorScreen.classList.remove(
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

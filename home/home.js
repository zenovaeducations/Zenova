import { auth, db } from "../firebase/firebase-config.js";

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
let selectedCourse = null;
let courses = [];
let subjects = [];
let chapters = [];
let contents = [];


/* =====================================================
   ELEMENTS
===================================================== */

const loader = document.getElementById("zenovaLoader");
const app = document.getElementById("zenovaApp");
const errorScreen = document.getElementById("errorScreen");
const errorMessage = document.getElementById("errorMessage");


/* =====================================================
   AUTH
===================================================== */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.replace("../account/login/");
        return;

    }

    currentUser = user;

    try {

        await loadStudent();

        await loadCourses();

        await loadCourseData();

        await loadBanners();

        await loadLiveClasses();

        await loadContinueLearning();

        renderStudent();

        setupNavigation();

        showApp();

    } catch (error) {

        console.error("HOME ERROR:", error);

        showError(
            error?.message ||
            "Unable to load Home."
        );

    }

});


/* =====================================================
   STUDENT
===================================================== */

async function loadStudent() {

    const studentRef = doc(
        db,
        "zen2Students",
        currentUser.uid
    );

    const snapshot = await getDoc(
        studentRef
    );

    if (!snapshot.exists()) {

        window.location.replace(
            "../account/onboarding/"
        );

        return;

    }

    student = snapshot.data();

    if (
        student.onboardingComplete !== true
    ) {

        window.location.replace(
            "../account/onboarding/"
        );

        return;

    }

}


/* =====================================================
   STUDENT UI
===================================================== */

function renderStudent() {

    const name =
        student.name ||
        currentUser.displayName ||
        "Student";

    const nameElement =
        document.getElementById(
            "studentName"
        );

    if (nameElement) {
        nameElement.textContent = name;
    }


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


    const greeting =
        document.getElementById(
            "greeting"
        );

    if (!greeting) return;


    const hour =
        new Date().getHours();


    if (hour < 12) {

        greeting.textContent =
            "Good Morning,";

    } else if (hour < 17) {

        greeting.textContent =
            "Good Afternoon,";

    } else {

        greeting.textContent =
            "Good Evening,";

    }

}


/* =====================================================
   LOAD COURSES
===================================================== */

async function loadCourses() {

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


    courses =
        snapshot.docs.map(
            item => ({
                id: item.id,
                ...item.data()
            })
        );


    courses =
        courses.filter(
            course => {

                const courseClass =
                    normalizeClass(
                        course.className
                    );


                const active =
                    course.active !== false &&
                    course.status !== "INACTIVE";


                return (
                    courseClass === studentClass &&
                    active
                );

            }
        );


    courses.sort(
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


    if (!courses.length) {

        throw new Error(
            `No ZEN2 course found for ${
                student.classDisplayName ||
                student.className
            }.`
        );

    }


    selectedCourse =
        courses[0];


    renderCourses();

}


/* =====================================================
   COURSE CARD
===================================================== */

function renderCourses() {

    const container =
        document.getElementById(
            "myBatchesList"
        );


    if (!container) return;


    if (!courses.length) {

        container.innerHTML = `
            <div class="loading-card">
                No course available.
            </div>
        `;

        return;

    }


    container.innerHTML =
        courses
            .map(course => {

                const courseName =
                    course.courseName ||
                    "Zenova Course";


                const className =
                    course.classDisplayName ||
                    course.className ||
                    "";


                const board =
                    course.board ||
                    "";


                const academicYear =
                    course.academicYear ||
                    "";


                return `

                    <article class="batch-card">

                        <div class="batch-cover">

                            <span class="batch-cover-label">
                                ZENOVA ZEN2
                            </span>

                            <h3>
                                ${escapeHtml(
                                    courseName
                                )}
                            </h3>

                        </div>


                        <div class="batch-info">

                            <div class="batch-name">
                                ${escapeHtml(
                                    courseName
                                )}
                            </div>


                            <div class="batch-meta">

                                ${
                                    className
                                        ? `
                                            <span>
                                                ${escapeHtml(
                                                    className
                                                )}
                                            </span>
                                        `
                                        : ""
                                }


                                ${
                                    board
                                        ? `
                                            <span>
                                                ${escapeHtml(
                                                    board
                                                )}
                                            </span>
                                        `
                                        : ""
                                }


                                ${
                                    academicYear
                                        ? `
                                            <span>
                                                ${escapeHtml(
                                                    academicYear
                                                )}
                                            </span>
                                        `
                                        : ""
                                }

                            </div>


                            <div class="batch-actions">

                                <button
                                    type="button"
                                    class="batch-button explore-button"
                                    data-explore="${escapeHtml(
                                        course.id
                                    )}"
                                >
                                    EXPLORE BATCH
                                </button>


                                <button
                                    type="button"
                                    class="batch-button buy-button"
                                    data-buy="${escapeHtml(
                                        course.id
                                    )}"
                                >
                                    BUY NOW
                                </button>

                            </div>

                        </div>

                    </article>

                `;

            })
            .join("");


    document
        .querySelectorAll(
            "[data-explore]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const courseId =
                        button.dataset.explore;


                    window.location.href =
                        `./batchdetails/?courseId=${
                            encodeURIComponent(
                                courseId
                            )
                        }`;

                }
            );

        });


    document
        .querySelectorAll(
            "[data-buy]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const courseId =
                        button.dataset.buy;


                    window.location.href =
                        `./batchdetails/?courseId=${
                            encodeURIComponent(
                                courseId
                            )
                        }&buy=true`;

                }
            );

        });

}


/* =====================================================
   COURSE STRUCTURE
===================================================== */

async function loadCourseData() {

    if (!selectedCourse) return;


    /* SUBJECTS */

    const subjectQuery =
        query(
            collection(
                db,
                "zen2Subjects"
            ),
            where(
                "courseId",
                "==",
                selectedCourse.id
            )
        );


    const subjectSnapshot =
        await getDocs(
            subjectQuery
        );


    subjects =
        subjectSnapshot.docs.map(
            item => ({
                id: item.id,
                ...item.data()
            })
        );


    subjects =
        subjects.filter(
            item =>
                item.active !== false
        );


    subjects.sort(
        sortByOrder
    );


    /* CHAPTERS */

    chapters = [];


    for (
        const subject of subjects
    ) {

        const chapterQuery =
            query(
                collection(
                    db,
                    "zen2Chapters"
                ),
                where(
                    "courseId",
                    "==",
                    selectedCourse.id
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
                    id: item.id,
                    ...item.data()
                });

            }
        );

    }


    chapters =
        chapters.filter(
            item =>
                item.active !== false
        );


    chapters.sort(
        sortByOrder
    );


    /* CONTENT */

    contents = [];


    for (
        const chapter of chapters
    ) {

        const contentQuery =
            query(
                collection(
                    db,
                    "zen2Content"
                ),
                where(
                    "courseId",
                    "==",
                    selectedCourse.id
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

                contents.push({
                    id: item.id,
                    ...item.data()
                });

            }
        );

    }


    contents =
        contents.filter(
            item =>
                item.active !== false
        );


    contents.sort(
        sortByOrder
    );

}


/* =====================================================
   BANNERS
===================================================== */

async function loadBanners() {

    const section =
        document.getElementById(
            "heroSection"
        );


    const slider =
        document.getElementById(
            "heroSlider"
        );


    const dots =
        document.getElementById(
            "heroDots"
        );


    if (
        !section ||
        !slider ||
        !dots
    ) return;


    const bannerQuery =
        query(
            collection(
                db,
                "homeBanners"
            ),
            where(
                "active",
                "==",
                true
            )
        );


    const snapshot =
        await getDocs(
            bannerQuery
        );


    const banners =
        snapshot.docs.map(
            item => ({
                id: item.id,
                ...item.data()
            })
        );


    banners.sort(
        (a, b) => {

            return (
                Number(
                    a.priority ??
                    9999
                ) -
                Number(
                    b.priority ??
                    9999
                )
            );

        }
    );


    if (!banners.length) {

        section.classList.add(
            "hidden"
        );

        return;

    }


    section.classList.remove(
        "hidden"
    );


    slider.innerHTML =
        banners
            .map(
                (banner, index) => {

                    return `

                        <div
                            class="hero-slide ${
                                index === 0
                                    ? "active"
                                    : ""
                            }"
                            data-link="${escapeHtml(
                                banner.link || ""
                            )}"
                        >

                            <img
                                src="${escapeHtml(
                                    banner.imageUrl || ""
                                )}"
                                alt=""
                            >


                            ${
                                banner.title ||
                                banner.description ||
                                banner.buttonText

                                    ? `

                                        <div class="hero-overlay">

                                            ${
                                                banner.label
                                                    ? `
                                                        <span class="hero-label">
                                                            ${escapeHtml(
                                                                banner.label
                                                            )}
                                                        </span>
                                                    `
                                                    : ""
                                            }


                                            ${
                                                banner.title
                                                    ? `
                                                        <h2>
                                                            ${escapeHtml(
                                                                banner.title
                                                            )}
                                                        </h2>
                                                    `
                                                    : ""
                                            }


                                            ${
                                                banner.description
                                                    ? `
                                                        <p>
                                                            ${escapeHtml(
                                                                banner.description
                                                            )}
                                                        </p>
                                                    `
                                                    : ""
                                            }


                                            ${
                                                banner.buttonText
                                                    ? `
                                                        <span class="hero-button">
                                                            ${escapeHtml(
                                                                banner.buttonText
                                                            )}
                                                        </span>
                                                    `
                                                    : ""
                                            }

                                        </div>

                                    `
                                    : ""
                            }

                        </div>

                    `;

                }
            )
            .join("");


    dots.innerHTML =
        banners
            .map(
                (_, index) => {

                    return `

                        <button
                            type="button"
                            class="hero-dot ${
                                index === 0
                                    ? "active"
                                    : ""
                            }"
                            data-index="${index}"
                        ></button>

                    `;

                }
            )
            .join("");


    startBannerSlider();


    document
        .querySelectorAll(
            ".hero-slide"
        )
        .forEach(slide => {

            slide.addEventListener(
                "click",
                () => {

                    const link =
                        slide.dataset.link;


                    if (link) {

                        window.location.href =
                            link;

                    }

                }
            );

        });

}


/* =====================================================
   BANNER SLIDER
===================================================== */

function startBannerSlider() {

    const slides =
        document.querySelectorAll(
            ".hero-slide"
        );


    const dots =
        document.querySelectorAll(
            ".hero-dot"
        );


    if (slides.length <= 1) {
        return;
    }


    let index = 0;


    setInterval(
        () => {

            slides[index]
                ?.classList.remove(
                    "active"
                );

            dots[index]
                ?.classList.remove(
                    "active"
                );


            index =
                (
                    index + 1
                ) %
                slides.length;


            slides[index]
                ?.classList.add(
                    "active"
                );

            dots[index]
                ?.classList.add(
                    "active"
                );

        },
        5000
    );


    dots.forEach(dot => {

        dot.addEventListener(
            "click",
            event => {

                event.stopPropagation();


                slides[index]
                    ?.classList.remove(
                        "active"
                    );

                dots[index]
                    ?.classList.remove(
                        "active"
                    );


                index =
                    Number(
                        dot.dataset.index
                    );


                slides[index]
                    ?.classList.add(
                        "active"
                    );

                dots[index]
                    ?.classList.add(
                        "active"
                    );

            }
        );

    });

}


/* =====================================================
   LIVE CLASSES
===================================================== */

async function loadLiveClasses() {

    const container =
        document.getElementById(
            "liveList"
        );


    if (!container) return;


    const snapshot =
        await getDocs(
            query(
                collection(
                    db,
                    "liveClasses"
                ),
                where(
                    "active",
                    "==",
                    true
                )
            )
        );


    const today =
        getToday();


    const classes =
        snapshot.docs
            .map(
                item => ({
                    id: item.id,
                    ...item.data()
                })
            )
            .filter(
                item =>
                    item.scheduledDate ===
                    today
            );


    classes.sort(
        (a, b) =>
            String(
                a.scheduledTime || ""
            )
            .localeCompare(
                String(
                    b.scheduledTime || ""
                )
            )
    );


    renderLiveClasses(
        classes
    );

}


/* =====================================================
   RENDER LIVE
===================================================== */

function renderLiveClasses(
    classes
) {

    const container =
        document.getElementById(
            "liveList"
        );


    if (!classes.length) {

        container.innerHTML = `

            <div class="loading-card">
                No live class scheduled for today.
            </div>

        `;

        return;

    }


    container.innerHTML =
        classes
            .map(
                liveClass => {

                    const thumbnail =
                        liveClass.thumbnailUrl ||
                        "";


                    return `

                        <article class="live-card">

                            <div class="live-thumbnail">

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
                                            <div class="live-placeholder">
                                                LIVE CLASS
                                            </div>
                                        `
                                }

                            </div>


                            <div class="live-info">

                                <span class="live-status">
                                    TODAY
                                </span>


                                <h3>
                                    ${escapeHtml(
                                        liveClass.title ||
                                        "Live Class"
                                    )}
                                </h3>


                                <p>

                                    ${
                                        liveClass.teacherName
                                            ? escapeHtml(
                                                liveClass.teacherName
                                            )
                                            : ""
                                    }

                                </p>


                                <p>

                                    ${
                                        liveClass.subjectName
                                            ? escapeHtml(
                                                liveClass.subjectName
                                            )
                                            : ""
                                    }

                                    ${
                                        liveClass.chapterName
                                            ? ` • ${escapeHtml(
                                                liveClass.chapterName
                                            )}`
                                            : ""
                                    }

                                </p>


                                <div class="live-time">

                                    ${formatTime(
                                        liveClass.scheduledTime
                                    )}

                                </div>

                            </div>


                            <button
                                class="live-open"
                                type="button"
                                data-live-open
                            >
                                VIEW
                            </button>

                        </article>

                    `;

                }
            )
            .join("");


    document
        .querySelectorAll(
            "[data-live-open]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        window.location.href =
                            "../live/";

                    }
                );

            }
        );

}


/* =====================================================
   CONTINUE LEARNING
===================================================== */

async function loadContinueLearning() {

    const container =
        document.getElementById(
            "continueCard"
        );


    if (!container) return;


    if (!contents.length) {

        container.innerHTML = `

            <div class="loading-card">
                No learning content available yet.
            </div>

        `;

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

        } catch {

            lastWatched = null;

        }

    }


    let content = null;


    if (
        lastWatched &&
        lastWatched.contentId
    ) {

        content =
            contents.find(
                item =>
                    item.id ===
                    lastWatched.contentId
            );

    }


    if (!content) {

        content =
            contents.find(
                item =>
                    String(
                        item.contentType ||
                        ""
                    ).toUpperCase() ===
                    "VIDEO"
            );

    }


    if (!content) {

        content =
            contents[0];

    }


    const subject =
        subjects.find(
            item =>
                item.id ===
                content.subjectId
        );


    const chapter =
        chapters.find(
            item =>
                item.id ===
                content.chapterId
        );


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
                        <div class="continue-placeholder">
                            ZENOVA
                        </div>
                    `
            }

        </div>


        <div class="continue-info">

            <span class="continue-label">

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
                    subject?.subjectName ||
                    subject?.displayName ||
                    ""
                )}

                ${
                    chapter?.chapterName
                        ? ` • ${escapeHtml(
                            chapter.chapterName
                        )}`
                        : ""
                }

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

                window.location.href =
                    `./revision/chapter-details/?chapterId=${
                        encodeURIComponent(
                            content.chapterId
                        )
                    }&subjectId=${
                        encodeURIComponent(
                            content.subjectId
                        )
                    }&courseId=${
                        encodeURIComponent(
                            selectedCourse.id
                        )
                    }&contentId=${
                        encodeURIComponent(
                            content.id
                        )
                    }`;

            }
        );

}


/* =====================================================
   NAVIGATION
===================================================== */

function setupNavigation() {

    document
        .querySelectorAll(
            "[data-route]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const route =
                            button.dataset.route;


                        if (
                            route ===
                            "revision"
                        ) {

                            window.location.href =
                                "./revision/";

                        }


                        if (
                            route ===
                            "live"
                        ) {

                            window.location.href =
                                "../live/";

                        }


                        if (
                            route ===
                            "tests"
                        ) {

                            window.location.href =
                                "./tests/";

                        }


                        if (
                            route ===
                            "doubts"
                        ) {

                            window.location.href =
                                "./doubts/";

                        }

                    }
                );

            }
        );


    document
        .getElementById(
            "profileShortcut"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "./profile/";

            }
        );


    document
        .getElementById(
            "aiButton"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "./ai/";

            }
        );

}


/* =====================================================
   HELPERS
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


function sortByOrder(
    a,
    b
) {

    return (
        Number(
            a.order ??
            a.chapterNumber ??
            9999
        ) -
        Number(
            b.order ??
            b.chapterNumber ??
            9999
        )
    );

}


function getToday() {

    const date =
        new Date();


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        )
        .padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        )
        .padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


function formatTime(
    value
) {

    if (!value) {
        return "";
    }


    const parts =
        String(
            value
        ).split(":");


    if (parts.length < 2) {
        return value;
    }


    let hour =
        Number(
            parts[0]
        );


    const minute =
        parts[1];


    const suffix =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 ||
        12;


    return `${hour}:${minute} ${suffix}`;

}


function showApp() {

    app?.classList.remove(
        "hidden"
    );


    setTimeout(
        () => {

            loader?.classList.add(
                "fade-out"
            );

        },
        100
    );

}


function showError(
    message
) {

    if (errorMessage) {

        errorMessage.textContent =
            message;

    }


    loader?.classList.add(
        "fade-out"
    );


    errorScreen?.classList.remove(
        "hidden"
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

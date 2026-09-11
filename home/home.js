import {
    auth,
    db
} from "../firebase/firebase-config.js";

import {
    collection,
    doc,
    onSnapshot,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let studentData = null;

let banners = [];

let currentBanner = 0;

let bannerTimer = null;

let enrolledCourses = [];

let allCourses = [];

let unsubscribeStudent = null;

let unsubscribeBanners = null;

let unsubscribeEnrollments = null;

let unsubscribeCourses = null;


/* =========================================================
   ELEMENTS
========================================================= */

const loadingScreen =
    document.getElementById(
        "loadingScreen"
    );

const app =
    document.getElementById(
        "app"
    );

const studentName =
    document.getElementById(
        "studentName"
    );

const studentAvatar =
    document.getElementById(
        "studentAvatar"
    );

const welcomeTime =
    document.getElementById(
        "welcomeTime"
    );

const profileButton =
    document.getElementById(
        "profileButton"
    );

const notificationButton =
    document.getElementById(
        "notificationButton"
    );

const bannerSection =
    document.getElementById(
        "bannerSection"
    );

const bannerSlider =
    document.getElementById(
        "bannerSlider"
    );

const bannerDots =
    document.getElementById(
        "bannerDots"
    );

const batchesContainer =
    document.getElementById(
        "batchesContainer"
    );

const exploreBatches =
    document.getElementById(
        "exploreBatches"
    );

const aiCard =
    document.getElementById(
        "aiCard"
    );

const videosExplore =
    document.getElementById(
        "videosExplore"
    );


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    user => {

        if (!user) {

            window.location.href =
                "../login/";

            return;

        }


        currentUser =
            user;


        updateGreeting();


        loadStudent(
            user.uid
        );


        loadBanners();


        loadEnrollments(
            user.uid
        );


        loadCourses();

    }
);


/* =========================================================
   STUDENT
========================================================= */

function loadStudent(
    uid
) {

    if (
        unsubscribeStudent
    ) {

        unsubscribeStudent();

    }


    const studentRef =
        doc(
            db,
            "students",
            uid
        );


    unsubscribeStudent =
        onSnapshot(

            studentRef,

            snapshot => {

                if (
                    !snapshot.exists()
                ) {

                    console.warn(
                        "Student document not found."
                    );

                    setStudentName(
                        currentUser?.displayName ||
                        "Student"
                    );

                    hideLoading();

                    return;

                }


                studentData =
                    snapshot.data();


                const name =
                    studentData.name ||
                    studentData.fullName ||
                    currentUser?.displayName ||
                    "Student";


                setStudentName(
                    name
                );


                hideLoading();

            },

            error => {

                console.error(
                    "Student loading error:",
                    error
                );


                setStudentName(
                    currentUser?.displayName ||
                    "Student"
                );


                hideLoading();

            }

        );

}


/* =========================================================
   STUDENT NAME
========================================================= */

function setStudentName(
    name
) {

    studentName.textContent =
        name;


    const firstLetter =
        String(name)
            .trim()
            .charAt(0)
            .toUpperCase();


    studentAvatar.textContent =
        firstLetter || "Z";

}


/* =========================================================
   GREETING
========================================================= */

function updateGreeting() {

    const hour =
        new Date().getHours();


    let greeting =
        "GOOD MORNING";


    if (
        hour >= 12 &&
        hour < 17
    ) {

        greeting =
            "GOOD AFTERNOON";

    }


    if (
        hour >= 17
    ) {

        greeting =
            "GOOD EVENING";

    }


    welcomeTime.textContent =
        greeting;

}


/* =========================================================
   HOME BANNERS
========================================================= */

function loadBanners() {

    if (
        unsubscribeBanners
    ) {

        unsubscribeBanners();

    }


    const bannersRef =
        collection(
            db,
            "homeBanners"
        );


    unsubscribeBanners =
        onSnapshot(

            bannersRef,

            snapshot => {

                banners =
                    snapshot.docs
                        .map(
                            item => ({
                                id: item.id,
                                ...item.data()
                            })
                        )
                        .filter(
                            banner =>
                                banner.active === true
                        )
                        .sort(
                            (a, b) =>
                                Number(
                                    a.priority ?? 999
                                ) -
                                Number(
                                    b.priority ?? 999
                                )
                        );


                renderBanners();

            },

            error => {

                console.error(
                    "Banner listener error:",
                    error
                );

            }

        );

}


/* =========================================================
   RENDER BANNERS
========================================================= */

function renderBanners() {

    clearBannerTimer();


    if (
        !banners.length
    ) {

        bannerSection.classList.add(
            "hidden"
        );

        bannerSlider.innerHTML =
            "";

        bannerDots.innerHTML =
            "";

        return;

    }


    bannerSection.classList.remove(
        "hidden"
    );


    currentBanner = 0;


    bannerSlider.innerHTML =
        banners
            .map(
                (banner, index) => {

                    const image =
                        banner.imageUrl ||
                        banner.crmImageUrl ||
                        "";


                    const title =
                        escapeHtml(
                            banner.title ||
                            ""
                        );


                    const label =
                        escapeHtml(
                            banner.label ||
                            ""
                        );


                    const description =
                        escapeHtml(
                            banner.description ||
                            ""
                        );


                    const buttonText =
                        escapeHtml(
                            banner.buttonText ||
                            ""
                        );


                    return `

                        <article
                            class="home-banner ${
                                index === 0
                                    ? "active"
                                    : ""
                            }"
                            data-banner-id="${banner.id}"
                        >

                            ${
                                image
                                    ? `
                                        <img
                                            src="${escapeAttribute(image)}"
                                            alt="${title}"
                                        >
                                    `
                                    : ""
                            }


                            ${
                                title ||
                                description ||
                                buttonText
                                    ? `

                                        <div
                                            class="banner-overlay"
                                        >

                                            ${
                                                label
                                                    ? `
                                                        <span class="banner-label">
                                                            ${label}
                                                        </span>
                                                    `
                                                    : ""
                                            }


                                            ${
                                                title
                                                    ? `
                                                        <h3>
                                                            ${title}
                                                        </h3>
                                                    `
                                                    : ""
                                            }


                                            ${
                                                description
                                                    ? `
                                                        <p>
                                                            ${description}
                                                        </p>
                                                    `
                                                    : ""
                                            }


                                            ${
                                                buttonText
                                                    ? `
                                                        <span class="banner-button">
                                                            ${buttonText}
                                                        </span>
                                                    `
                                                    : ""
                                            }

                                        </div>

                                    `
                                    : ""
                            }

                        </article>

                    `;

                }
            )
            .join("");


    bannerDots.innerHTML =
        banners
            .map(
                (_, index) => `

                    <span
                        class="banner-dot ${
                            index === 0
                                ? "active"
                                : ""
                        }"
                        data-index="${index}"
                    ></span>

                `
            )
            .join("");


    /*
     * Banner click
     */

    bannerSlider
        .querySelectorAll(
            ".home-banner"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    () => {

                        const id =
                            element.dataset.bannerId;


                        const banner =
                            banners.find(
                                item =>
                                    item.id === id
                            );


                        if (
                            banner?.link
                        ) {

                            window.location.href =
                                banner.link;

                        }

                    }
                );

            }
        );


    startBannerTimer();

}


/* =========================================================
   BANNER TIMER
========================================================= */

function startBannerTimer() {

    if (
        banners.length <= 1
    ) {

        return;

    }


    bannerTimer =
        setInterval(
            () => {

                currentBanner =
                    (
                        currentBanner + 1
                    ) %
                    banners.length;


                showBanner(
                    currentBanner
                );

            },
            5000
        );

}


function clearBannerTimer() {

    if (
        bannerTimer
    ) {

        clearInterval(
            bannerTimer
        );

        bannerTimer = null;

    }

}


function showBanner(
    index
) {

    bannerSlider
        .querySelectorAll(
            ".home-banner"
        )
        .forEach(
            (banner, bannerIndex) => {

                banner.classList.toggle(
                    "active",
                    bannerIndex === index
                );

            }
        );


    bannerDots
        .querySelectorAll(
            ".banner-dot"
        )
        .forEach(
            (dot, dotIndex) => {

                dot.classList.toggle(
                    "active",
                    dotIndex === index
                );

            }
        );

}


/* =========================================================
   ENROLLMENTS
========================================================= */

function loadEnrollments(
    uid
) {

    if (
        unsubscribeEnrollments
    ) {

        unsubscribeEnrollments();

    }


    const enrollmentRef =
        collection(
            db,
            "studentEnrollments"
        );


    const enrollmentQuery =
        query(
            enrollmentRef,
            where(
                "studentUid",
                "==",
                uid
            )
        );


    unsubscribeEnrollments =
        onSnapshot(

            enrollmentQuery,

            snapshot => {

                enrolledCourses =
                    snapshot.docs
                        .map(
                            item => ({
                                id: item.id,
                                ...item.data()
                            })
                        )
                        .filter(
                            enrollment => {

                                const status =
                                    String(
                                        enrollment.status ||
                                        ""
                                    ).toUpperCase();


                                return (
                                    status ===
                                        "ACTIVE" ||
                                    status ===
                                        "ENROLLED" ||
                                    status ===
                                        "APPROVED" ||
                                    !status
                                );

                            }
                        );


                renderBatches();

            },

            error => {

                console.error(
                    "Enrollment error:",
                    error
                );

                enrolledCourses = [];

                renderBatches();

            }

        );

}


/* =========================================================
   CRM COURSES
========================================================= */

function loadCourses() {

    if (
        unsubscribeCourses
    ) {

        unsubscribeCourses();

    }


    const coursesRef =
        collection(
            db,
            "crmCourses"
        );


    const coursesQuery =
        query(
            coursesRef,
            where(
                "crmActive",
                "==",
                true
            )
        );


    unsubscribeCourses =
        onSnapshot(

            coursesQuery,

            snapshot => {

                allCourses =
                    snapshot.docs
                        .map(
                            item => ({
                                id: item.id,
                                ...item.data()
                            })
                        )
                        .sort(
                            (a, b) =>
                                Number(
                                    a.priority ?? 999
                                ) -
                                Number(
                                    b.priority ?? 999
                                )
                        );


                renderBatches();

            },

            error => {

                console.error(
                    "Courses error:",
                    error
                );


                /*
                 * If the catalogue query fails,
                 * don't break the complete Home page.
                 */

                allCourses = [];

                renderBatches();

            }

        );

}


/* =========================================================
   BATCHES FOR YOU
========================================================= */

function renderBatches() {

    if (
        !batchesContainer
    ) {

        return;

    }


    const cards = [];


    /*
     * -----------------------------------------------------
     * 1. ENROLLED COURSES FIRST
     * -----------------------------------------------------
     */

    enrolledCourses.forEach(
        enrollment => {

            const courseId =
                enrollment.crmCourseId ||
                enrollment.courseId;


            const course =
                allCourses.find(
                    item =>
                        item.id === courseId
                );


            if (
                course
            ) {

                cards.push({
                    course,
                    enrollment,
                    enrolled: true
                });

            }

        }
    );


    /*
     * -----------------------------------------------------
     * 2. SAME CLASS COURSES
     * -----------------------------------------------------
     */

    const studentClass =
        studentData?.className ||
        studentData?.crmClass ||
        studentData?.class ||
        "";


    const enrolledIds =
        new Set(
            enrolledCourses.map(
                enrollment =>
                    enrollment.crmCourseId ||
                    enrollment.courseId
            )
        );


    const sameClass =
        allCourses
            .filter(
                course => {

                    if (
                        enrolledIds.has(
                            course.id
                        )
                    ) {

                        return false;

                    }


                    return sameClassMatch(
                        course.crmClass,
                        studentClass
                    );

                }
            );


    sameClass.forEach(
        course => {

            cards.push({
                course,
                enrollment: null,
                enrolled: false
            });

        }
    );


    /*
     * -----------------------------------------------------
     * 3. OTHER PROGRAMS
     * -----------------------------------------------------
     */

    const otherCourses =
        allCourses
            .filter(
                course => {

                    if (
                        enrolledIds.has(
                            course.id
                        )
                    ) {

                        return false;

                    }


                    return !sameClassMatch(
                        course.crmClass,
                        studentClass
                    );

                }
            );


    otherCourses.forEach(
        course => {

            cards.push({
                course,
                enrollment: null,
                enrolled: false
            });

        }
    );


    /*
     * LIMIT HOME
     */

    const visible =
        cards.slice(
            0,
            8
        );


    if (
        !visible.length
    ) {

        batchesContainer.innerHTML = `

            <div class="section-loading">
                No batches available right now.
            </div>

        `;

        return;

    }


    batchesContainer.innerHTML =
        visible
            .map(
                item =>
                    createBatchCard(
                        item
                    )
            )
            .join("");


    batchesContainer
        .querySelectorAll(
            "[data-course-id]"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        const id =
                            card.dataset.courseId;


                        const enrolled =
                            card.dataset.enrolled ===
                            "true";


                        if (
                            enrolled
                        ) {

                            window.location.href =
                                `../home/study/?courseId=${encodeURIComponent(id)}`;

                        } else {

                            window.location.href =
                                `../home/batchdetails/?id=${encodeURIComponent(id)}`;

                        }

                    }
                );

            }
        );

}


/* =========================================================
   CREATE BATCH CARD
========================================================= */

function createBatchCard(
    item
) {

    const course =
        item.course;


    const enrollment =
        item.enrollment;


    const image =
        course.crmImageUrl ||
        course.imageUrl ||
        course.courseImageUrl ||
        "";


    const title =
        escapeHtml(
            course.crmCourseName ||
            course.name ||
            "Course"
        );


    const className =
        escapeHtml(
            formatClass(
                course.crmClass ||
                ""
            )
        );


    const enrolled =
        item.enrolled;


    const progress =
        Number(
            enrollment?.progress ??
            enrollment?.progressPercent ??
            0
        );


    return `

        <article
            class="batch-card"
            data-course-id="${escapeAttribute(course.id)}"
            data-enrolled="${enrolled}"
        >

            <div class="batch-image">

                ${
                    image
                        ? `
                            <img
                                src="${escapeAttribute(image)}"
                                alt="${title}"
                                loading="lazy"
                            >
                        `
                        : ""
                }

            </div>


            <div class="batch-body">

                <span class="batch-status">

                    ${
                        enrolled
                            ? "✓ ENROLLED"
                            : "RECOMMENDED"
                    }

                </span>


                <h3>
                    ${title}
                </h3>


                <p>
                    ${className}
                </p>


                <div class="batch-action">

                    <span>

                        ${
                            enrolled
                                ? `${progress}% completed`
                                : "Explore course"
                        }

                    </span>


                    <span>
                        →
                    </span>

                </div>

            </div>

        </article>

    `;

}


/* =========================================================
   CLASS MATCH
========================================================= */

function sameClassMatch(
    courseClass,
    studentClass
) {

    if (
        !courseClass ||
        !studentClass
    ) {

        return false;

    }


    return normalizeClass(
        courseClass
    ) ===
    normalizeClass(
        studentClass
    );

}


function normalizeClass(
    value
) {

    return String(
        value || ""
    )
        .toUpperCase()
        .replace(
            /\s+/g,
            ""
        )
        .replace(
            /_/g,
            ""
        );

}


/* =========================================================
   NAVIGATION
========================================================= */

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
                        route
                    ) {

                        window.location.href =
                            route;

                    }

                }
            );

        }
    );


/* =========================================================
   PROFILE
========================================================= */

profileButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "./profile/";

    }
);


/* =========================================================
   NOTIFICATIONS
========================================================= */

notificationButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "./notifications/";

    }
);


/* =========================================================
   EXPLORE BATCHES
========================================================= */

exploreBatches.addEventListener(
    "click",
    () => {

        window.location.href =
            "./batches/";

    }
);


/* =========================================================
   AI
========================================================= */

aiCard.addEventListener(
    "click",
    () => {

        window.location.href =
            "./ai/";

    }
);


/* =========================================================
   VIDEOS
========================================================= */

videosExplore.addEventListener(
    "click",
    () => {

        /*
         * Change this once the dedicated
         * video library route is finalized.
         */

        window.location.href =
            "./library/";

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

                    const route =
                        button.dataset.nav;


                    switch (route) {

                        case "home":

                            break;


                        case "courses":

                            window.location.href =
                                "./batches/";

                            break;


                        case "study":

                            window.location.href =
                                "./study/";

                            break;


                        case "ai":

                            window.location.href =
                                "./ai/";

                            break;


                        case "profile":

                            window.location.href =
                                "./profile/";

                            break;

                    }

                }
            );

        }
    );


/* =========================================================
   LOADING
========================================================= */

function hideLoading() {

    if (
        loadingScreen
    ) {

        loadingScreen.classList.add(
            "hidden"
        );

    }


    if (
        app
    ) {

        app.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   FORMAT CLASS
========================================================= */

function formatClass(
    value
) {

    const classes = {

        UNDER_8TH:
            "Under 8th",

        "8TH":
            "8th",

        "9TH":
            "9th",

        "10TH":
            "10th",

        "1ST_PUC":
            "1st PUC",

        "2ND_PUC":
            "2nd PUC"

    };


    return (
        classes[value] ||
        String(
            value || ""
        )
            .replace(
                /_/g,
                " "
            )
    );

}


/* =========================================================
   HTML SAFETY
========================================================= */

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


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        clearBannerTimer();


        if (
            unsubscribeStudent
        ) {

            unsubscribeStudent();

        }


        if (
            unsubscribeBanners
        ) {

            unsubscribeBanners();

        }


        if (
            unsubscribeEnrollments
        ) {

            unsubscribeEnrollments();

        }


        if (
            unsubscribeCourses
        ) {

            unsubscribeCourses();

        }

    }
);

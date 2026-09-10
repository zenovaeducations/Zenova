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
    onSnapshot,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================
   DOM
========================================= */

const loadingScreen =
    document.getElementById("loadingScreen");

const app =
    document.getElementById("app");

const backButton =
    document.getElementById("backButton");

const notificationButton =
    document.getElementById("notificationButton");

const searchInput =
    document.getElementById("searchInput");

const filterContainer =
    document.getElementById("filterContainer");

const yourClassTitle =
    document.getElementById("yourClassTitle");

const myBatchSection =
    document.getElementById("myBatchSection");

const myBatchList =
    document.getElementById("myBatchList");

const availableSection =
    document.getElementById("availableSection");

const availableList =
    document.getElementById("availableList");

const otherProgramsSection =
    document.getElementById("otherProgramsSection");

const otherProgramsList =
    document.getElementById("otherProgramsList");

const emptySearchState =
    document.getElementById("emptySearchState");


/* =========================================
   STATE
========================================= */

let currentUser = null;

let student = null;

let courses = [];

let enrollments = [];

let activeFilter = "ALL";

let searchTerm = "";

let unsubscribeStudent = null;
let unsubscribeCourses = null;
let unsubscribeEnrollments = null;


/* =========================================
   AUTH
========================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "../../account/login/";
        return;
    }

    currentUser = user;

    try {

        await startRealtimeListeners();

        showApp();

    } catch (error) {

        console.error(
            "Courses initialization error:",
            error
        );

        showApp();

        showErrorState(
            "Unable to load courses right now."
        );
    }

});


/* =========================================
   REALTIME LISTENERS
========================================= */

async function startRealtimeListeners() {

    /* -------------------------------------
       STUDENT PROFILE
    -------------------------------------- */

    const studentRef =
        doc(db, "students", currentUser.uid);

    unsubscribeStudent =
        onSnapshot(
            studentRef,
            (snapshot) => {

                if (!snapshot.exists()) {

                    console.warn(
                        "Student profile not found."
                    );

                    student = {
                        className: ""
                    };

                } else {

                    student = {
                        id: snapshot.id,
                        ...snapshot.data()
                    };

                }

                buildFilters();

                renderCourses();

            },
            (error) => {

                console.error(
                    "Student listener error:",
                    error
                );

            }
        );


    /* -------------------------------------
       CRM COURSES
    -------------------------------------- */

    const coursesQuery =
        query(
            collection(db, "crmCourses"),
            where("crmActive", "==", true)
        );

    unsubscribeCourses =
        onSnapshot(
            coursesQuery,
            (snapshot) => {

                courses =
                    snapshot.docs.map(
                        (courseDoc) => ({
                            id: courseDoc.id,
                            ...courseDoc.data()
                        })
                    );

                buildFilters();

                renderCourses();

            },
            (error) => {

                console.error(
                    "Courses listener error:",
                    error
                );

                showErrorState(
                    "Unable to load courses."
                );

            }
        );


    /* -------------------------------------
       STUDENT ENROLLMENTS
    -------------------------------------- */

    const enrollmentQuery =
        query(
            collection(db, "studentEnrollments"),
            where(
                "studentUid",
                "==",
                currentUser.uid
            )
        );

    unsubscribeEnrollments =
        onSnapshot(
            enrollmentQuery,
            (snapshot) => {

                enrollments =
                    snapshot.docs.map(
                        (enrollmentDoc) => ({
                            id: enrollmentDoc.id,
                            ...enrollmentDoc.data()
                        })
                    );

                renderCourses();

            },
            (error) => {

                console.error(
                    "Enrollment listener error:",
                    error
                );

                /*
                 * If the collection doesn't exist yet,
                 * the page will simply show catalogue courses.
                 */
            }
        );

}


/* =========================================
   SHOW APP
========================================= */

function showApp() {

    setTimeout(() => {

        loadingScreen.classList.add("hidden");

        app.classList.remove("hidden");

    }, 350);

}


/* =========================================
   CLASS NORMALIZATION
========================================= */

function normalizeClass(value) {

    if (!value) {
        return "";
    }

    const v =
        String(value)
            .trim()
            .toUpperCase()
            .replace(/\s+/g, " ");


    /* 10TH / SSLC */

    if (
        [
            "10",
            "10TH",
            "SSLC",
            "10TH STANDARD",
            "CLASS 10",
            "CLASS 10TH"
        ].includes(v)
    ) {
        return "10TH";
    }


    /* 9TH */

    if (
        [
            "9",
            "9TH",
            "9TH STANDARD",
            "CLASS 9",
            "CLASS 9TH"
        ].includes(v)
    ) {
        return "9TH";
    }


    /* 8TH */

    if (
        [
            "8",
            "8TH",
            "8TH STANDARD",
            "CLASS 8",
            "CLASS 8TH"
        ].includes(v)
    ) {
        return "8TH";
    }


    /* 7TH */

    if (
        [
            "7",
            "7TH",
            "7TH STANDARD",
            "CLASS 7",
            "CLASS 7TH"
        ].includes(v)
    ) {
        return "7TH";
    }


    /* 6TH */

    if (
        [
            "6",
            "6TH",
            "6TH STANDARD",
            "CLASS 6",
            "CLASS 6TH"
        ].includes(v)
    ) {
        return "6TH";
    }


    /* UNDER 8TH */

    if (
        [
            "UNDER 8TH",
            "BELOW 8TH",
            "UNDER8TH"
        ].includes(v)
    ) {
        return "UNDER_8TH";
    }


    /* 1ST PUC */

    if (
        [
            "1ST PUC",
            "1 PUC",
            "PUC 1",
            "PUC-1",
            "FIRST PUC"
        ].includes(v)
    ) {
        return "1ST_PUC";
    }


    /* 2ND PUC */

    if (
        [
            "2ND PUC",
            "2 PUC",
            "PUC 2",
            "PUC-2",
            "SECOND PUC"
        ].includes(v)
    ) {
        return "2ND_PUC";
    }


    return v;
}


/* =========================================
   DISPLAY CLASS NAME
========================================= */

function displayClass(value) {

    const normalized =
        normalizeClass(value);

    const labels = {

        "10TH": "10th",

        "9TH": "9th",

        "8TH": "8th",

        "7TH": "7th",

        "6TH": "6th",

        "UNDER_8TH": "Under 8th",

        "1ST_PUC": "1st PUC",

        "2ND_PUC": "2nd PUC"
    };

    return labels[normalized] || value || "Your Class";
}


/* =========================================
   MEDIUM
========================================= */

function getCourseMediums(course) {

    if (
        Array.isArray(course.crmMediums)
        &&
        course.crmMediums.length
    ) {

        return course.crmMediums;

    }


    if (
        Array.isArray(course.mediums)
        &&
        course.mediums.length
    ) {

        return course.mediums;

    }


    if (course.crmMedium) {

        /*
         * Old courses used:
         * Kannada
         * English
         * Both
         */

        if (
            String(course.crmMedium)
                .toLowerCase() === "both"
        ) {
            return [
                "Kannada",
                "English"
            ];
        }

        return [
            course.crmMedium
        ];
    }


    return [];
}


/* =========================================
   COURSE PRICE
========================================= */

function getFinalPrice(course) {

    if (
        course.crmFinalPrice !== undefined
        &&
        course.crmFinalPrice !== null
        &&
        course.crmFinalPrice !== ""
    ) {

        return Number(course.crmFinalPrice) || 0;

    }

    const price =
        Number(course.crmPrice) || 0;

    const discount =
        Number(course.crmDiscount) || 0;

    return Math.max(
        0,
        price - discount
    );
}


/* =========================================
   COURSE SORT
========================================= */

function getPriority(course) {

    const value =
        Number(course.priority);

    if (
        Number.isFinite(value)
    ) {
        return value;
    }

    return 999999;
}


function getCreatedTime(course) {

    if (
        course.createdAt
        &&
        typeof course.createdAt.toMillis === "function"
    ) {
        return course.createdAt.toMillis();
    }

    if (
        course.createdAt
        &&
        course.createdAt.seconds
    ) {
        return course.createdAt.seconds * 1000;
    }

    return 0;
}


function sortCourses(list) {

    return [...list].sort(
        (a, b) => {

            const priorityDifference =
                getPriority(a)
                -
                getPriority(b);

            if (
                priorityDifference !== 0
            ) {
                return priorityDifference;
            }

            return (
                getCreatedTime(b)
                -
                getCreatedTime(a)
            );

        }
    );

}


/* =========================================
   ENROLLMENT HELPERS
========================================= */

function getEnrollmentCourseId(enrollment) {

    return (
        enrollment.crmCourseId
        ||
        enrollment.courseId
        ||
        enrollment.batchId
        ||
        ""
    );

}


function isPurchased(enrollment) {

    const status =
        String(
            enrollment.status || ""
        ).toUpperCase();

    const paymentStatus =
        String(
            enrollment.paymentStatus || ""
        ).toUpperCase();


    /*
     * Main purchased states.
     */

    if (
        paymentStatus === "PAID"
        ||
        paymentStatus === "COMPLETED"
        ||
        paymentStatus === "SUCCESS"
        ||
        paymentStatus === "PAYMENT_COMPLETED"
    ) {

        return (
            status !== "CANCELLED"
            &&
            status !== "REJECTED"
            &&
            status !== "SUSPENDED"
        );

    }


    /*
     * For manually activated enrollments
     * where paymentStatus isn't stored.
     */

    if (
        status === "ACTIVE"
        &&
        !enrollment.paymentStatus
    ) {
        return true;
    }


    if (
        status === "ENROLLED"
    ) {
        return true;
    }


    return false;
}


function getEnrollmentForCourse(courseId) {

    return enrollments.find(
        (enrollment) => {

            return (
                getEnrollmentCourseId(enrollment)
                ===
                courseId
            )
            &&
            isPurchased(enrollment);

        }
    );

}


/* =========================================
   PROGRESS
========================================= */

function getProgress(enrollment) {

    if (!enrollment) {
        return 0;
    }

    const progress =
        Number(
            enrollment.progress
        );

    if (
        !Number.isFinite(progress)
    ) {
        return 0;
    }

    return Math.min(
        100,
        Math.max(0, progress)
    );

}


/* =========================================
   BUILD FILTERS
========================================= */

function buildFilters() {

    if (!filterContainer) {
        return;
    }

    const classSet =
        new Set();

    courses.forEach(
        (course) => {

            const normalized =
                normalizeClass(
                    course.crmClass
                );

            if (normalized) {
                classSet.add(normalized);
            }

        }
    );


    const studentClass =
        normalizeClass(
            student?.className
            ||
            student?.class
            ||
            student?.standard
        );


    const orderedClasses =
        [...classSet].sort(
            (a, b) => {

                return (
                    classOrder(a)
                    -
                    classOrder(b)
                );

            }
        );


    const filters = [
        {
            key: "ALL",
            label: "All"
        },
        {
            key: "MY_CLASS",
            label: "My Class"
        }
    ];


    orderedClasses.forEach(
        (classKey) => {

            if (
                classKey !== studentClass
            ) {

                filters.push({
                    key: classKey,
                    label: displayClass(classKey)
                });

            }

        }
    );


    /*
     * Make sure current class can be
     * selected even if CRM has no course.
     */

    if (
        studentClass
        &&
        !filters.some(
            (filter) =>
                filter.key === studentClass
        )
    ) {

        filters.push({
            key: studentClass,
            label: displayClass(studentClass)
        });

    }


    filterContainer.innerHTML = "";


    filters.forEach(
        (filter) => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.className =
                "filter-button"
                +
                (
                    activeFilter === filter.key
                        ? " active"
                        : ""
                );

            button.textContent =
                filter.label;


            button.addEventListener(
                "click",
                () => {

                    activeFilter =
                        filter.key;

                    buildFilters();

                    renderCourses();

                }
            );


            filterContainer.appendChild(button);

        }
    );

}


/* =========================================
   CLASS ORDER
========================================= */

function classOrder(value) {

    const order = {
        "UNDER_8TH": 1,
        "8TH": 2,
        "9TH": 3,
        "10TH": 4,
        "1ST_PUC": 5,
        "2ND_PUC": 6
    };

    return (
        order[value]
        ||
        999
    );

}


/* =========================================
   RENDER
========================================= */

function renderCourses() {

    if (!student) {
        return;
    }


    const studentClass =
        normalizeClass(
            student.className
            ||
            student.class
            ||
            student.standard
        );


    yourClassTitle.textContent =
        displayClass(studentClass);


    let visibleCourses =
        [...courses];


    /*
     * SEARCH
     */

    if (searchTerm) {

        const term =
            searchTerm.toLowerCase();

        visibleCourses =
            visibleCourses.filter(
                (course) => {

                    const name =
                        String(
                            course.crmCourseName || ""
                        ).toLowerCase();

                    const code =
                        String(
                            course.crmCourseCode || ""
                        ).toLowerCase();

                    const className =
                        String(
                            course.crmClass || ""
                        ).toLowerCase();

                    const description =
                        String(
                            course.crmDescription || ""
                        ).toLowerCase();

                    return (
                        name.includes(term)
                        ||
                        code.includes(term)
                        ||
                        className.includes(term)
                        ||
                        description.includes(term)
                    );

                }
            );

    }


    /*
     * FILTER
     */

    if (activeFilter === "MY_CLASS") {

        visibleCourses =
            visibleCourses.filter(
                (course) =>
                    normalizeClass(
                        course.crmClass
                    )
                    ===
                    studentClass
            );

    }
    else if (
        activeFilter !== "ALL"
    ) {

        visibleCourses =
            visibleCourses.filter(
                (course) =>
                    normalizeClass(
                        course.crmClass
                    )
                    ===
                    activeFilter
            );

    }


    /*
     * SEARCH RESULT MODE
     */

    if (searchTerm) {

        renderSearchResults(
            visibleCourses
        );

        return;

    }


    /*
     * NORMAL PAGE
     */

    renderNormalPage(
        visibleCourses,
        studentClass
    );

}


/* =========================================
   NORMAL PAGE
========================================= */

function renderNormalPage(
    visibleCourses,
    studentClass
) {

    /*
     * Purchased courses.
     */

    const purchasedCourses =
        visibleCourses.filter(
            (course) =>
                !!getEnrollmentForCourse(
                    course.id
                )
        );


    /*
     * Only student's class.
     */

    const sameClassCourses =
        visibleCourses.filter(
            (course) => {

                return (
                    normalizeClass(
                        course.crmClass
                    )
                    ===
                    studentClass
                    &&
                    !getEnrollmentForCourse(
                        course.id
                    )
                );

            }
        );


    /*
     * Other classes.
     */

    const otherCourses =
        visibleCourses.filter(
            (course) => {

                return (
                    normalizeClass(
                        course.crmClass
                    )
                    !==
                    studentClass
                );

            }
        );


    /*
     * MY BATCH
     */

    if (
        purchasedCourses.length
    ) {

        myBatchSection.classList.remove(
            "hidden"
        );

        renderMyBatches(
            sortCourses(
                purchasedCourses
            )
        );

    } else {

        myBatchSection.classList.add(
            "hidden"
        );

        myBatchList.innerHTML = "";

    }


    /*
     * AVAILABLE FOR YOU
     */

    if (
        sameClassCourses.length
    ) {

        availableSection.classList.remove(
            "hidden"
        );

        renderCourseList(
            sortCourses(
                sameClassCourses
            ),
            availableList
        );

    } else {

        availableSection.classList.remove(
            "hidden"
        );

        availableList.innerHTML = `
            <div class="no-courses">
                No courses available for your class yet.
            </div>
        `;

    }


    /*
     * OTHER PROGRAMS
     */

    renderOtherPrograms(
        sortCourses(
            otherCourses
        )
    );

}


/* =========================================
   MY BATCH RENDER
========================================= */

function renderMyBatches(list) {

    myBatchList.innerHTML = "";


    list.forEach(
        (course) => {

            const enrollment =
                getEnrollmentForCourse(
                    course.id
                );

            const progress =
                getProgress(
                    enrollment
                );


            const card =
                document.createElement("div");

            card.className =
                "my-batch-card";


            const image =
                getCourseImage(
                    course
                );


            const meta =
                buildCourseMeta(
                    course
                );


            card.innerHTML = `

                <img
                    class="my-batch-image"
                    src="${escapeAttribute(image)}"
                    alt=""
                    loading="lazy"
                >

                <div class="my-batch-content">

                    <div class="my-batch-status">
                        ✓ ENROLLED
                    </div>

                    <div class="my-batch-name">
                        ${escapeHTML(
                            course.crmCourseName
                            ||
                            "Your Batch"
                        )}
                    </div>

                    <div class="my-batch-meta">
                        ${escapeHTML(meta)}
                    </div>

                    <div class="progress-row">

                        <span class="progress-label">
                            Your Progress
                        </span>

                        <span class="progress-percent">
                            ${progress}%
                        </span>

                    </div>

                    <div class="progress-bar">

                        <div
                            class="progress-fill"
                            style="width:${progress}%"
                        ></div>

                    </div>

                    <div class="continue-button">
                        CONTINUE LEARNING →
                    </div>

                </div>
            `;


            attachImageFallback(
                card
            );


            card.addEventListener(
                "click",
                () => {

                    openCourse(
                        course.id
                    );

                }
            );


            myBatchList.appendChild(
                card
            );

        }
    );

}


/* =========================================
   COURSE LIST
========================================= */

function renderCourseList(
    list,
    container
) {

    container.innerHTML = "";


    list.forEach(
        (course) => {

            const card =
                createCourseCard(
                    course
                );

            container.appendChild(
                card
            );

        }
    );

}


/* =========================================
   COURSE CARD
========================================= */

function createCourseCard(course) {

    const card =
        document.createElement("div");

    card.className =
        "course-card";


    const image =
        getCourseImage(
            course
        );


    const meta =
        buildCourseMeta(
            course
        );


    card.innerHTML = `

        <img
            class="course-image"
            src="${escapeAttribute(image)}"
            alt=""
            loading="lazy"
        >

        <div class="course-information">

            <div class="course-name">
                ${escapeHTML(
                    course.crmCourseName
                    ||
                    "Untitled Course"
                )}
            </div>

            <div class="course-meta">
                ${escapeHTML(meta)}
            </div>

        </div>

        <div class="course-arrow">
            →
        </div>

    `;


    attachImageFallback(
        card
    );


    card.addEventListener(
        "click",
        () => {

            openCourse(
                course.id
            );

        }
    );


    return card;

}


/* =========================================
   OTHER PROGRAMS
========================================= */

function renderOtherPrograms(list) {

    otherProgramsList.innerHTML = "";


    if (!list.length) {

        otherProgramsSection.classList.add(
            "hidden"
        );

        return;

    }


    otherProgramsSection.classList.remove(
        "hidden"
    );


    const groups =
        new Map();


    list.forEach(
        (course) => {

            const classKey =
                normalizeClass(
                    course.crmClass
                )
                ||
                "OTHER";


            if (
                !groups.has(classKey)
            ) {

                groups.set(
                    classKey,
                    []
                );

            }


            groups.get(
                classKey
            ).push(course);

        }
    );


    const sortedGroups =
        [...groups.entries()].sort(
            (a, b) =>
                classOrder(a[0])
                -
                classOrder(b[0])
        );


    sortedGroups.forEach(
        ([classKey, groupCourses]) => {

            const group =
                document.createElement("div");

            group.className =
                "class-group";


            group.innerHTML = `

                <div class="class-group-title">
                    ${escapeHTML(
                        displayClass(classKey)
                    )}
                </div>

                <div class="class-group-list"></div>

            `;


            const groupList =
                group.querySelector(
                    ".class-group-list"
                );


            sortCourses(
                groupCourses
            ).forEach(
                (course) => {

                    groupList.appendChild(
                        createCourseCard(
                            course
                        )
                    );

                }
            );


            otherProgramsList.appendChild(
                group
            );

        }
    );

}


/* =========================================
   SEARCH RESULTS
========================================= */

function renderSearchResults(
    list
) {

    myBatchSection.classList.add(
        "hidden"
    );

    availableSection.classList.add(
        "hidden"
    );

    otherProgramsSection.classList.add(
        "hidden"
    );


    if (!list.length) {

        emptySearchState.classList.remove(
            "hidden"
        );

        return;

    }


    emptySearchState.classList.add(
        "hidden"
    );


    availableSection.classList.remove(
        "hidden"
    );


    availableSection.querySelector(
        ".subsection-heading"
    ).textContent =
        "SEARCH RESULTS";


    renderCourseList(
        sortCourses(list),
        availableList
    );

}


/* =========================================
   COURSE META
========================================= */

function buildCourseMeta(course) {

    const parts = [];


    if (course.crmClass) {

        parts.push(
            displayClass(
                course.crmClass
            )
        );

    }


    if (course.crmBoard) {

        parts.push(
            course.crmBoard
        );

    }


    const mediums =
        getCourseMediums(
            course
        );


    if (mediums.length) {

        parts.push(
            mediums.join(", ")
        );

    }


    return parts.join(" • ");

}


/* =========================================
   IMAGE
========================================= */

function getCourseImage(course) {

    return (
        course.crmImageUrl
        ||
        course.imageUrl
        ||
        createPlaceholderImage(
            course.crmCourseName
            ||
            "Zenova Course"
        )
    );

}


function createPlaceholderImage(title) {

    /*
     * SVG placeholder.
     * This prevents the broken-image icon
     * seen in the screenshot.
     */

    const safeTitle =
        String(title)
            .slice(0, 25)
            .replace(/[<>&"]/g, "");


    const svg = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="800"
            height="450"
            viewBox="0 0 800 450"
        >
            <rect
                width="800"
                height="450"
                fill="#f3f3f3"
            />

            <text
                x="50%"
                y="47%"
                dominant-baseline="middle"
                text-anchor="middle"
                font-family="Arial, sans-serif"
                font-size="34"
                font-weight="700"
                fill="#555555"
            >
                ZENOVA
            </text>

            <text
                x="50%"
                y="58%"
                dominant-baseline="middle"
                text-anchor="middle"
                font-family="Arial, sans-serif"
                font-size="20"
                fill="#888888"
            >
                ${safeTitle}
            </text>
        </svg>
    `;


    return (
        "data:image/svg+xml;charset=UTF-8,"
        +
        encodeURIComponent(svg)
    );

}


function attachImageFallback(card) {

    const image =
        card.querySelector("img");


    if (!image) {
        return;
    }


    image.addEventListener(
        "error",
        () => {

            image.src =
                createPlaceholderImage(
                    "Zenova Course"
                );

        },
        {
            once: true
        }
    );

}


/* =========================================
   OPEN COURSE
========================================= */

function openCourse(courseId) {

    if (!courseId) {
        return;
    }


    window.location.href =
        `../batchdetails/?id=${encodeURIComponent(courseId)}`;

}


/* =========================================
   SEARCH
========================================= */

searchInput.addEventListener(
    "input",
    (event) => {

        searchTerm =
            event.target.value
                .trim()
                .toLowerCase();


        if (!searchTerm) {

            availableSection.querySelector(
                ".subsection-heading"
            ).textContent =
                "AVAILABLE FOR YOU";

        }


        renderCourses();

    }
);


/* =========================================
   BACK BUTTON
========================================= */

backButton.addEventListener(
    "click",
    () => {

        /*
         * Courses is a child page of Home.
         *
         * If there is a valid browser history,
         * use it. Otherwise go Home.
         */

        if (
            window.history.length > 1
        ) {

            window.history.back();

        } else {

            window.location.href =
                "../";

        }

    }
);


/* =========================================
   NOTIFICATIONS
========================================= */

notificationButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "../notifications/";

    }
);


/* =========================================
   ERROR
========================================= */

function showErrorState(message) {

    availableSection.classList.remove(
        "hidden"
    );

    availableList.innerHTML = `
        <div class="no-courses">
            ${escapeHTML(message)}
        </div>
    `;

}


/* =========================================
   HTML ESCAPING
========================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {

    return escapeHTML(value);

}

import {
    auth,
    db
} from "../firebase/firebase-config.js";

import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================================
   ELEMENTS
========================================================= */

const loadingState =
    document.getElementById("loadingState");

const errorState =
    document.getElementById("errorState");

const errorText =
    document.getElementById("errorText");

const retryBtn =
    document.getElementById("retryBtn");

const emptyState =
    document.getElementById("emptyState");

const batchContent =
    document.getElementById("batchContent");

const searchInput =
    document.getElementById("searchInput");

const clearSearch =
    document.getElementById("clearSearch");

const resetFiltersBtn =
    document.getElementById("resetFiltersBtn");

const dynamicFilters =
    document.getElementById("dynamicFilters");

const myBatchSection =
    document.getElementById("myBatchSection");

const myBatchList =
    document.getElementById("myBatchList");

const sameClassSection =
    document.getElementById("sameClassSection");

const sameClassList =
    document.getElementById("sameClassList");

const sameClassTitle =
    document.getElementById("sameClassTitle");

const otherProgramsSection =
    document.getElementById("otherProgramsSection");

const otherProgramsList =
    document.getElementById("otherProgramsList");

const backBtn =
    document.getElementById("backBtn");


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let studentProfile = null;

let courses = [];

let enrollments = [];

let selectedFilter = "ALL";

let searchTerm = "";

let unsubscribeCourses = null;

let unsubscribeEnrollments = null;


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "../account/login/";

            return;
        }

        currentUser = user;

        await initializePage();

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

async function initializePage() {

    showLoading();

    try {

        await loadStudentProfile();

        buildDynamicFilters();

        startCoursesListener();

        startEnrollmentListener();

    } catch (error) {

        console.error(
            "Batches initialization error:",
            error
        );

        showError(
            "Unable to load your profile."
        );

    }

}


/* =========================================================
   STUDENT PROFILE
========================================================= */

async function loadStudentProfile() {

    const studentRef =
        doc(
            db,
            "students",
            currentUser.uid
        );

    const snapshot =
        await getDoc(studentRef);


    if (!snapshot.exists()) {

        throw new Error(
            "Student profile not found."
        );

    }


    studentProfile = {

        id: snapshot.id,

        ...snapshot.data()

    };


    console.log(
        "Student profile:",
        studentProfile
    );

}


/* =========================================================
   CRM COURSES REALTIME
========================================================= */

function startCoursesListener() {

    const coursesRef =
        collection(
            db,
            "crmCourses"
        );


    /*
     * We intentionally load active courses
     * and sort priority on the client.
     *
     * This avoids requiring a Firestore
     * composite index for priority.
     */

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

                courses =
                    snapshot.docs.map(
                        courseDoc => ({
                            id: courseDoc.id,
                            ...courseDoc.data()
                        })
                    );


                courses.sort(
                    compareCourses
                );


                render();

            },

            error => {

                console.error(
                    "Courses listener error:",
                    error
                );

                showError(
                    "Unable to load available batches."
                );

            }
        );

}


/* =========================================================
   ENROLLMENTS REALTIME
========================================================= */

function startEnrollmentListener() {

    const enrollmentsRef =
        collection(
            db,
            "studentEnrollments"
        );


    const enrollmentQuery =
        query(
            enrollmentsRef,
            where(
                "studentUid",
                "==",
                currentUser.uid
            )
        );


    unsubscribeEnrollments =
        onSnapshot(
            enrollmentQuery,

            snapshot => {

                enrollments =
                    snapshot.docs.map(
                        enrollmentDoc => ({
                            id: enrollmentDoc.id,
                            ...enrollmentDoc.data()
                        })
                    );


                render();

            },

            error => {

                console.error(
                    "Enrollment listener error:",
                    error
                );

                /*
                 * Do not destroy the entire page
                 * if enrollment data cannot load.
                 *
                 * Student can still browse courses.
                 */

                enrollments = [];

                render();

            }
        );

}


/* =========================================================
   SORT
========================================================= */

function compareCourses(a, b) {

    const priorityA =
        Number(a.priority ?? 999999);

    const priorityB =
        Number(b.priority ?? 999999);


    if (
        priorityA !== priorityB
    ) {

        return priorityA - priorityB;

    }


    const createdA =
        timestampValue(
            a.createdAt
        );

    const createdB =
        timestampValue(
            b.createdAt
        );


    return createdB - createdA;

}


function timestampValue(value) {

    if (!value) return 0;

    if (
        typeof value.toMillis ===
        "function"
    ) {

        return value.toMillis();

    }

    if (
        value.seconds
    ) {

        return value.seconds * 1000;

    }

    if (
        value instanceof Date
    ) {

        return value.getTime();

    }

    return 0;

}


/* =========================================================
   DYNAMIC CLASS FILTERS
========================================================= */

function buildDynamicFilters() {

    const classes =
        courses
            .map(
                course =>
                    normalizeClass(
                        course.crmClass
                    )
            )
            .filter(Boolean);


    const uniqueClasses =
        [...new Set(classes)];


    uniqueClasses.sort(
        compareClassNames
    );


    dynamicFilters.innerHTML =
        "";


    uniqueClasses.forEach(
        className => {

            const button =
                document.createElement(
                    "button"
                );

            button.className =
                "filter-pill";

            button.dataset.filter =
                className;

            button.textContent =
                displayClass(
                    className
                );


            button.addEventListener(
                "click",
                () => {

                    selectedFilter =
                        className;

                    updateFilterButtons();

                    render();

                }
            );


            dynamicFilters.appendChild(
                button
            );

        }
    );

}


function compareClassNames(a, b) {

    const order = {

        "UNDER_8TH": 1,
        "8TH": 2,
        "9TH": 3,
        "10TH": 4,
        "1ST_PUC": 5,
        "2ND_PUC": 6

    };


    return (
        (order[a] || 99) -
        (order[b] || 99)
    );

}


/* =========================================================
   FILTER BUTTONS
========================================================= */

document
    .querySelectorAll(
        ".filter-pill"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    selectedFilter =
                        button.dataset.filter;

                    updateFilterButtons();

                    render();

                }
            );

        }
    );


function updateFilterButtons() {

    document
        .querySelectorAll(
            ".filter-pill"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.filter ===
                    selectedFilter
                );

            }
        );

}


/* =========================================================
   RENDER
========================================================= */

function render() {

    if (!studentProfile) return;

    buildDynamicFilters();

    updateFilterButtons();


    const enrolledCourseIds =
        getEnrolledCourseIds();


    let visibleCourses =
        courses.filter(
            course =>
                matchesSearch(
                    course
                )
        );


    /*
     * ALL
     */

    if (
        selectedFilter === "ALL"
    ) {

        renderAllMode(
            visibleCourses,
            enrolledCourseIds
        );

    }


    /*
     * MY CLASS
     */

    else if (
        selectedFilter === "MY_CLASS"
    ) {

        const myClass =
            getStudentClass();


        const filtered =
            visibleCourses.filter(
                course =>
                    normalizeClass(
                        course.crmClass
                    ) === myClass
            );


        renderMyClassMode(
            filtered,
            enrolledCourseIds
        );

    }


    /*
     * SPECIFIC CLASS
     */

    else {

        const filtered =
            visibleCourses.filter(
                course =>
                    normalizeClass(
                        course.crmClass
                    ) === selectedFilter
            );


        renderSpecificClassMode(
            filtered,
            enrolledCourseIds
        );

    }

}


/* =========================================================
   ALL MODE
========================================================= */

function renderAllMode(
    visibleCourses,
    enrolledCourseIds
) {

    const myClass =
        getStudentClass();


    const myCourses =
        visibleCourses.filter(
            course =>
                enrolledCourseIds.has(
                    course.id
                )
        );


    const sameClass =
        visibleCourses.filter(
            course =>
                !enrolledCourseIds.has(
                    course.id
                ) &&
                normalizeClass(
                    course.crmClass
                ) === myClass
        );


    const otherCourses =
        visibleCourses.filter(
            course =>
                !enrolledCourseIds.has(
                    course.id
                ) &&
                normalizeClass(
                    course.crmClass
                ) !== myClass
        );


    renderMyBatches(
        myCourses
    );


    renderSameClass(
        sameClass
    );


    renderOtherPrograms(
        otherCourses
    );


    showContentState(
        myCourses.length +
        sameClass.length +
        otherCourses.length
    );

}


/* =========================================================
   MY CLASS MODE
========================================================= */

function renderMyClassMode(
    visibleCourses,
    enrolledCourseIds
) {

    const myCourses =
        visibleCourses.filter(
            course =>
                enrolledCourseIds.has(
                    course.id
                )
        );


    const availableCourses =
        visibleCourses.filter(
            course =>
                !enrolledCourseIds.has(
                    course.id
                )
        );


    renderMyBatches(
        myCourses
    );


    renderSameClass(
        availableCourses
    );


    hideOtherPrograms();


    showContentState(
        visibleCourses.length
    );

}


/* =========================================================
   SPECIFIC CLASS MODE
========================================================= */

function renderSpecificClassMode(
    visibleCourses,
    enrolledCourseIds
) {

    const myCourses =
        visibleCourses.filter(
            course =>
                enrolledCourseIds.has(
                    course.id
                )
        );


    const availableCourses =
        visibleCourses.filter(
            course =>
                !enrolledCourseIds.has(
                    course.id
                )
        );


    renderMyBatches(
        myCourses
    );


    renderSameClass(
        availableCourses
    );


    hideOtherPrograms();


    showContentState(
        visibleCourses.length
    );

}


/* =========================================================
   MY BATCHES
========================================================= */

function renderMyBatches(
    courseList
) {

    if (
        courseList.length === 0
    ) {

        myBatchSection.classList.add(
            "hidden"
        );

        myBatchList.innerHTML =
            "";

        return;

    }


    myBatchSection.classList.remove(
        "hidden"
    );


    myBatchList.innerHTML =
        "";


    courseList.forEach(
        course => {

            const enrollment =
                findEnrollment(
                    course.id
                );


            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "my-batch-card";


            const imageUrl =
                safeUrl(
                    getCourseImage(
                        course
                    )
                );


            const progress =
                getProgress(
                    enrollment
                );


            card.innerHTML = `

                <div class="my-batch-image">

                    ${
                        imageUrl
                        ?
                        `
                        <img
                            src="${imageUrl}"
                            alt="${escapeHtml(
                                course.crmCourseName ||
                                "Batch"
                            )}"
                            loading="lazy"
                        >
                        `
                        :
                        `
                        <div
                            class="image-placeholder"
                        ></div>
                        `
                    }

                </div>


                <div class="my-batch-info">

                    <span class="enrolled-tag">
                        ✓ ENROLLED
                    </span>

                    <div class="my-batch-title">
                        ${escapeHtml(
                            course.crmCourseName ||
                            "My Batch"
                        )}
                    </div>

                    <div class="my-batch-meta">
                        ${courseMeta(course)}
                    </div>


                    <div class="progress-row">

                        <span>
                            Progress
                        </span>

                        <span class="progress-value">
                            ${progress}%
                        </span>

                    </div>


                    <div class="progress-track">

                        <div
                            class="progress-fill"
                            style="width:${progress}%"
                        ></div>

                    </div>


                    <div class="continue-btn">
                        Continue Learning →
                    </div>

                </div>

            `;


            card.addEventListener(
                "click",
                () =>
                    openBatchDetails(
                        course.id
                    )
            );


            myBatchList.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   SAME CLASS
========================================================= */

function renderSameClass(
    courseList
) {

    if (
        courseList.length === 0
    ) {

        sameClassSection.classList.add(
            "hidden"
        );

        sameClassList.innerHTML =
            "";

        return;

    }


    sameClassSection.classList.remove(
        "hidden"
    );


    const myClass =
        getStudentClass();


    sameClassTitle.textContent =
        myClass
        ? `Recommended for ${displayClass(myClass)}`
        : "Recommended for You";


    sameClassList.innerHTML =
        "";


    courseList.forEach(
        course => {

            sameClassList.appendChild(
                createCourseCard(
                    course
                )
            );

        }
    );

}


/* =========================================================
   OTHER PROGRAMS
========================================================= */

function renderOtherPrograms(
    courseList
) {

    if (
        courseList.length === 0
    ) {

        hideOtherPrograms();

        return;

    }


    otherProgramsSection.classList.remove(
        "hidden"
    );


    otherProgramsList.innerHTML =
        "";


    const groups =
        groupByClass(
            courseList
        );


    Object.keys(groups)
        .sort(compareClassNames)
        .forEach(
            className => {

                const coursesForClass =
                    groups[className];


                const group =
                    document.createElement(
                        "div"
                    );

                group.className =
                    "program-group";


                group.innerHTML = `

                    <div class="program-heading">

                        <h3>
                            ${escapeHtml(
                                displayClass(
                                    className
                                ).toUpperCase()
                            )}
                        </h3>

                        <button
                            type="button"
                            data-class="${escapeHtml(
                                className
                            )}"
                        >
                            View all →
                        </button>

                    </div>

                    <div
                        class="program-course-list"
                    ></div>

                `;


                const list =
                    group.querySelector(
                        ".program-course-list"
                    );


                /*
                 * Show all courses for now.
                 * They remain priority ordered.
                 */

                coursesForClass.forEach(
                    course => {

                        list.appendChild(
                            createCompactCourse(
                                course
                            )
                        );

                    }
                );


                group
                    .querySelector(
                        "button"
                    )
                    .addEventListener(
                        "click",
                        () => {

                            selectedFilter =
                                className;

                            updateFilterButtons();

                            render();

                            window.scrollTo({
                                top: 0,
                                behavior: "smooth"
                            });

                        }
                    );


                otherProgramsList.appendChild(
                    group
                );

            }
        );

}


function hideOtherPrograms() {

    otherProgramsSection.classList.add(
        "hidden"
    );

    otherProgramsList.innerHTML =
        "";

}


/* =========================================================
   COURSE CARD
========================================================= */

function createCourseCard(
    course
) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "course-card";


    const imageUrl =
        safeUrl(
            getCourseImage(
                course
            )
        );


    const title =
        course.crmCourseName ||
        "Untitled Batch";


    const description =
        course.crmDescription ||
        "Explore this Zenova learning program.";


    const price =
        getPrice(
            course
        );


    const originalPrice =
        getOriginalPrice(
            course
        );


    const discount =
        getDiscount(
            course
        );


    card.innerHTML = `

        <div class="course-image">

            ${
                imageUrl
                ?
                `
                <img
                    src="${imageUrl}"
                    alt="${escapeHtml(title)}"
                    loading="lazy"
                >
                `
                :
                ""
            }


            ${
                course.crmCourseCode
                ?
                `
                <span class="course-tag">
                    ${escapeHtml(
                        course.crmCourseCode
                    )}
                </span>
                `
                :
                ""
            }

        </div>


        <div class="course-body">

            <div class="course-title">
                ${escapeHtml(title)}
            </div>


            <div class="course-description">
                ${escapeHtml(description)}
            </div>


            <div class="course-meta">

                ${
                    course.crmClass
                    ?
                    `
                    <span class="meta-pill">
                        ${escapeHtml(
                            displayClass(
                                normalizeClass(
                                    course.crmClass
                                )
                            )
                        )}
                    </span>
                    `
                    :
                    ""
                }


                ${
                    course.crmBoard
                    ?
                    `
                    <span class="meta-pill">
                        ${escapeHtml(
                            course.crmBoard
                        )}
                    </span>
                    `
                    :
                    ""
                }


                ${
                    course.crmMedium
                    ?
                    `
                    <span class="meta-pill">
                        ${escapeHtml(
                            course.crmMedium
                        )}
                    </span>
                    `
                    :
                    ""
                }

            </div>


            <div class="course-bottom">

                <div>

                    <span class="price">
                        ${formatPrice(price)}
                    </span>


                    ${
                        originalPrice &&
                        Number(originalPrice) >
                        Number(price)
                        ?
                        `
                        <span class="original-price">
                            ${formatPrice(
                                originalPrice
                            )}
                        </span>
                        `
                        :
                        ""
                    }


                    ${
                        discount > 0
                        ?
                        `
                        <span class="discount">
                            ${discount}% OFF
                        </span>
                        `
                        :
                        ""
                    }

                </div>


                <button
                    class="explore-btn"
                    type="button"
                >
                    Explore →
                </button>

            </div>

        </div>

    `;


    card.addEventListener(
        "click",
        event => {

            /*
             * Avoid duplicate click behavior
             * if button itself is clicked.
             */

            openBatchDetails(
                course.id
            );

        }
    );


    return card;

}


/* =========================================================
   COMPACT COURSE
========================================================= */

function createCompactCourse(
    course
) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "compact-course";


    const imageUrl =
        safeUrl(
            getCourseImage(
                course
            )
        );


    card.innerHTML = `

        <div class="compact-image">

            ${
                imageUrl
                ?
                `
                <img
                    src="${imageUrl}"
                    alt="${escapeHtml(
                        course.crmCourseName ||
                        "Batch"
                    )}"
                    loading="lazy"
                >
                `
                :
                ""
            }

        </div>


        <div class="compact-info">

            <div class="compact-title">
                ${escapeHtml(
                    course.crmCourseName ||
                    "Untitled Batch"
                )}
            </div>

            <div class="compact-description">
                ${escapeHtml(
                    course.crmDescription ||
                    "Zenova learning program"
                )}
            </div>

            <div class="compact-meta">

                ${
                    course.crmBoard
                    ? escapeHtml(
                        course.crmBoard
                    )
                    : ""
                }

                ${
                    course.crmBoard &&
                    course.crmMedium
                    ? " • "
                    : ""
                }

                ${
                    course.crmMedium
                    ? escapeHtml(
                        course.crmMedium
                    )
                    : ""
                }

            </div>

        </div>


        <div class="compact-arrow">
            →
        </div>

    `;


    card.addEventListener(
        "click",
        () =>
            openBatchDetails(
                course.id
            )
    );


    return card;

}


/* =========================================================
   GROUP
========================================================= */

function groupByClass(
    courseList
) {

    const groups = {};


    courseList.forEach(
        course => {

            const className =
                normalizeClass(
                    course.crmClass
                ) ||
                "OTHER";


            if (!groups[className]) {

                groups[className] =
                    [];

            }


            groups[className].push(
                course
            );

        }
    );


    return groups;

}


/* =========================================================
   ENROLLMENT HELPERS
========================================================= */

function getEnrolledCourseIds() {

    const result =
        new Set();


    enrollments.forEach(
        enrollment => {

            if (
                !isActiveEnrollment(
                    enrollment
                )
            ) {

                return;

            }


            const courseId =
                enrollment.crmCourseId ||
                enrollment.courseId;


            if (courseId) {

                result.add(
                    String(courseId)
                );

            }

        }
    );


    return result;

}


function findEnrollment(
    courseId
) {

    return enrollments.find(
        enrollment => {

            const id =
                enrollment.crmCourseId ||
                enrollment.courseId;


            return (
                String(id || "") ===
                String(courseId)
            ) &&
            isActiveEnrollment(
                enrollment
            );

        }
    );

}


function isActiveEnrollment(
    enrollment
) {

    const status =
        String(
            enrollment.status ||
            ""
        )
        .trim()
        .toUpperCase();


    const payment =
        String(
            enrollment.paymentStatus ||
            ""
        )
        .trim()
        .toUpperCase();


    /*
     * Accept the common active states.
     */

    if (
        [
            "SUSPENDED",
            "CANCELLED",
            "CANCELED",
            "EXPIRED",
            "REJECTED"
        ].includes(status)
    ) {

        return false;

    }


    if (
        status === "ACTIVE" ||
        status === "ENROLLED" ||
        status === "APPROVED" ||
        status === "COMPLETED"
    ) {

        return true;

    }


    /*
     * If your enrollment has no status but
     * has a paid payment status, allow it.
     */

    if (
        payment === "PAID" ||
        payment === "COMPLETED" ||
        payment === "SUCCESS"
    ) {

        return true;

    }


    return false;

}


/* =========================================================
   PROGRESS
========================================================= */

function getProgress(
    enrollment
) {

    if (!enrollment) return 0;


    const possibleValues = [

        enrollment.progress,

        enrollment.progressPercent,

        enrollment.completionPercentage,

        enrollment.overallProgress

    ];


    for (
        const value of possibleValues
    ) {

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {

            const number =
                Number(value);


            if (
                Number.isFinite(number)
            ) {

                return Math.max(
                    0,
                    Math.min(
                        100,
                        Math.round(number)
                    )
                );

            }

        }

    }


    return 0;

}


/* =========================================================
   STUDENT CLASS
========================================================= */

function getStudentClass() {

    return normalizeClass(
        studentProfile.className ||
        studentProfile.crmClass ||
        studentProfile.class ||
        ""
    );

}


/* =========================================================
   CLASS NORMALIZATION
========================================================= */

function normalizeClass(
    value
) {

    if (!value) return "";

    const clean =
        String(value)
            .trim()
            .toUpperCase()
            .replace(
                /\./g,
                ""
            )
            .replace(
                /\s+/g,
                "_"
            );


    const aliases = {

        "UNDER8TH": "UNDER_8TH",
        "UNDER_8TH": "UNDER_8TH",

        "8": "8TH",
        "8TH": "8TH",

        "9": "9TH",
        "9TH": "9TH",

        "10": "10TH",
        "10TH": "10TH",
        "10TH_SSLC": "10TH",

        "1PUC": "1ST_PUC",
        "1STPUC": "1ST_PUC",
        "1ST_PUC": "1ST_PUC",

        "2PUC": "2ND_PUC",
        "2NDPUC": "2ND_PUC",
        "2ND_PUC": "2ND_PUC"

    };


    return (
        aliases[clean] ||
        clean
    );

}


function displayClass(
    value
) {

    const normalized =
        normalizeClass(
            value
        );


    const names = {

        "UNDER_8TH":
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
        names[normalized] ||
        String(value || "")
            .replace(
                /_/g,
                " "
            )
    );

}


/* =========================================================
   SEARCH
========================================================= */

searchInput.addEventListener(
    "input",
    () => {

        searchTerm =
            searchInput.value
                .trim()
                .toLowerCase();


        clearSearch.classList.toggle(
            "show",
            searchTerm.length > 0
        );


        render();

    }
);


clearSearch.addEventListener(
    "click",
    () => {

        searchInput.value =
            "";

        searchTerm =
            "";

        clearSearch.classList.remove(
            "show"
        );

        render();

        searchInput.focus();

    }
);


function matchesSearch(
    course
) {

    if (!searchTerm) {

        return true;

    }


    const searchable = [

        course.crmCourseName,

        course.crmCourseCode,

        course.crmDescription,

        course.crmClass,

        course.crmBoard,

        course.crmMedium

    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();


    return searchable.includes(
        searchTerm
    );

}


/* =========================================================
   VIEW ALL
========================================================= */

document
    .getElementById(
        "sameClassViewAll"
    )
    .addEventListener(
        "click",
        () => {

            selectedFilter =
                "MY_CLASS";

            updateFilterButtons();

            render();

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );


/* =========================================================
   RESET
========================================================= */

resetFiltersBtn.addEventListener(
    "click",
    resetFilters
);


function resetFilters() {

    searchInput.value =
        "";

    searchTerm =
        "";

    selectedFilter =
        "ALL";

    clearSearch.classList.remove(
        "show"
    );

    updateFilterButtons();

    render();

}


/* =========================================================
   NAVIGATION
========================================================= */

function openBatchDetails(
    courseId
) {

    if (!courseId) return;


    window.location.href =
        `../batchdetails/?id=${encodeURIComponent(
            courseId
        )}`;

}


backBtn.addEventListener(
    "click",
    () => {

        if (
            window.history.length > 1
        ) {

            window.history.back();

        } else {

            window.location.href =
                "../home/";

        }

    }
);


/* =========================================================
   PRICE
========================================================= */

function getPrice(
    course
) {

    if (
        course.crmFinalPrice !==
        undefined &&
        course.crmFinalPrice !== null &&
        course.crmFinalPrice !== ""
    ) {

        return Number(
            course.crmFinalPrice
        ) || 0;

    }


    if (
        course.crmPrice !==
        undefined
    ) {

        return Number(
            course.crmPrice
        ) || 0;

    }


    return 0;

}


function getOriginalPrice(
    course
) {

    if (
        course.crmPrice !==
        undefined &&
        course.crmPrice !== null &&
        course.crmPrice !== ""
    ) {

        return Number(
            course.crmPrice
        ) || 0;

    }


    return 0;

}


function getDiscount(
    course
) {

    const price =
        getPrice(course);


    const original =
        getOriginalPrice(course);


    if (
        original > price &&
        original > 0
    ) {

        return Math.round(
            (
                (
                    original -
                    price
                ) /
                original
            ) * 100
        );

    }


    if (
        course.crmDiscount !==
        undefined
    ) {

        const discount =
            Number(
                course.crmDiscount
            );


        if (
            Number.isFinite(
                discount
            )
        ) {

            return Math.max(
                0,
                Math.round(
                    discount
                )
            );

        }

    }


    return 0;

}


function formatPrice(
    value
) {

    const number =
        Number(value) || 0;


    if (number <= 0) {

        return "Free";

    }


    return (
        "₹" +
        number.toLocaleString(
            "en-IN"
        )
    );

}


/* =========================================================
   COURSE IMAGE
========================================================= */

function getCourseImage(
    course
) {

    return (
        course.crmImageUrl ||
        course.imageUrl ||
        course.courseImageUrl ||
        course.bannerImageUrl ||
        ""
    );

}


/* =========================================================
   META
========================================================= */

function courseMeta(
    course
) {

    const values = [

        displayClass(
            course.crmClass
        ),

        course.crmBoard,

        course.crmMedium

    ]
        .filter(Boolean);


    return escapeHtml(
        values.join(" • ")
    );

}


/* =========================================================
   SAFE URL
========================================================= */

function safeUrl(
    value
) {

    if (!value) return "";

    try {

        const url =
            new URL(
                value,
                window.location.href
            );


        if (
            url.protocol ===
                "https:" ||
            url.protocol ===
                "http:"
        ) {

            return url.href;

        }


        return "";

    } catch {

        return "";

    }

}


/* =========================================================
   HTML ESCAPE
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


/* =========================================================
   SHOW / HIDE STATES
========================================================= */

function showLoading() {

    loadingState.classList.remove(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

    emptyState.classList.add(
        "hidden"
    );

    batchContent.classList.add(
        "hidden"
    );

}


function showError(
    message
) {

    loadingState.classList.add(
        "hidden"
    );

    batchContent.classList.add(
        "hidden"
    );

    emptyState.classList.add(
        "hidden"
    );

    errorState.classList.remove(
        "hidden"
    );


    errorText.textContent =
        message;

}


function showContentState(
    count
) {

    loadingState.classList.add(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );


    if (count === 0) {

        batchContent.classList.add(
            "hidden"
        );

        emptyState.classList.remove(
            "hidden"
        );

        return;

    }


    emptyState.classList.add(
        "hidden"
    );

    batchContent.classList.remove(
        "hidden"
    );

}


/* =========================================================
   RETRY
========================================================= */

retryBtn.addEventListener(
    "click",
    () => {

        initializePage();

    }
);

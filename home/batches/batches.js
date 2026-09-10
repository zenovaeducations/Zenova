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


/* =========================================================
   DOM
========================================================= */

const loadingScreen =
    document.getElementById("loadingScreen");

const backButton =
    document.getElementById("backButton");

const searchInput =
    document.getElementById("searchInput");

const filterContainer =
    document.getElementById("filterContainer");

const studentClassTitle =
    document.getElementById("studentClassTitle");

const myBatchSection =
    document.getElementById("myBatchSection");

const myBatchContainer =
    document.getElementById("myBatchContainer");

const availableCoursesContainer =
    document.getElementById("availableCoursesContainer");

const otherProgramsContainer =
    document.getElementById("otherProgramsContainer");

const otherProgramsSection =
    document.getElementById("otherProgramsSection");

const noResults =
    document.getElementById("noResults");


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let student = null;

let courses = [];

let enrollments = [];

let selectedFilter = "ALL";

let searchTerm = "";

let unsubscribeCourses = null;

let unsubscribeEnrollments = null;


/* =========================================================
   INIT
========================================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "../../account/login/";
        return;
    }

    currentUser = user;

    try {

        await loadStudent();

        startCoursesListener();

        startEnrollmentListener();

        hideLoading();

    } catch (error) {

        console.error(
            "Courses initialization error:",
            error
        );

        hideLoading();

    }

});


/* =========================================================
   STUDENT
========================================================= */

async function loadStudent() {

    const studentRef =
        doc(
            db,
            "students",
            currentUser.uid
        );

    const studentSnap =
        await getDoc(studentRef);

    if (studentSnap.exists()) {

        student = {
            id: studentSnap.id,
            ...studentSnap.data()
        };

        return;
    }


    /*
       Compatibility fallback.

       If your older authentication/onboarding
       system uses studentAccounts, this allows
       the page to continue working.
    */

    const accountRef =
        doc(
            db,
            "studentAccounts",
            currentUser.uid
        );

    const accountSnap =
        await getDoc(accountRef);

    if (accountSnap.exists()) {

        student = {
            id: accountSnap.id,
            ...accountSnap.data()
        };

        return;
    }


    /*
       Student profile doesn't exist.
    */

    window.location.href =
        "../../account/onboarding/";

}


/* =========================================================
   COURSES REALTIME
========================================================= */

function startCoursesListener() {

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
                    snapshot.docs.map((docSnap) => ({
                        id: docSnap.id,
                        ...docSnap.data()
                    }));

                renderEverything();

            },

            (error) => {

                console.error(
                    "Courses listener error:",
                    error
                );

                /*
                   Compatibility fallback.

                   If some old course documents don't
                   have crmActive, they won't appear
                   in the query above.

                   In that situation, use the normal
                   collection listener below if required.
                */
            }
        );

}


/* =========================================================
   ENROLLMENTS REALTIME
========================================================= */

function startEnrollmentListener() {

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
                    snapshot.docs.map((docSnap) => ({
                        id: docSnap.id,
                        ...docSnap.data()
                    }));

                renderEverything();

            },

            (error) => {

                console.error(
                    "Enrollment listener error:",
                    error
                );

            }
        );

}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderEverything() {

    renderFilters();

    renderClassTitle();

    renderMyBatch();

    renderAvailableCourses();

    renderOtherPrograms();

}


/* =========================================================
   CLASS NORMALIZATION
========================================================= */

function normalizeClass(value) {

    if (!value) {
        return "";
    }

    const v =
        String(value)
            .trim()
            .toUpperCase()
            .replace(/\s+/g, " ");


    /*
       SSLC / 10th
    */

    if (
        [
            "10",
            "10TH",
            "SSLC",
            "10TH STANDARD",
            "10 STANDARD"
        ].includes(v)
    ) {
        return "10TH";
    }


    /*
       9th
    */

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


    /*
       8th
    */

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


    /*
       7th
    */

    if (
        [
            "7",
            "7TH",
            "7TH STANDARD",
            "7 STANDARD"
        ].includes(v)
    ) {
        return "7TH";
    }


    /*
       6th
    */

    if (
        [
            "6",
            "6TH",
            "6TH STANDARD",
            "6 STANDARD"
        ].includes(v)
    ) {
        return "6TH";
    }


    /*
       PUC
    */

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


/* =========================================================
   DISPLAY CLASS
========================================================= */

function displayClass(value) {

    const normalized =
        normalizeClass(value);

    const names = {
        "10TH": "10th",
        "9TH": "9th",
        "8TH": "8th",
        "7TH": "7th",
        "6TH": "6th",
        "1ST_PUC": "1st PUC",
        "2ND_PUC": "2nd PUC"
    };

    return names[normalized] || value || "Other";
}


/* =========================================================
   STUDENT CLASS
========================================================= */

function getStudentClass() {

    return normalizeClass(
        student?.className ||
        student?.class ||
        student?.crmClass ||
        student?.standard
    );

}


/* =========================================================
   COURSE CLASS
========================================================= */

function getCourseClass(course) {

    return normalizeClass(
        course.crmClass ||
        course.className ||
        course.class ||
        course.standard
    );

}


/* =========================================================
   COURSE MEDIUM
========================================================= */

function getCourseMedium(course) {

    /*
       New system:
       crmMediums: ["Kannada", "English", "Hindi"]
    */

    if (
        Array.isArray(course.crmMediums) &&
        course.crmMediums.length
    ) {

        return course.crmMediums.join(", ");

    }


    /*
       Legacy system:
       crmMedium
    */

    if (course.crmMedium) {

        return String(course.crmMedium);

    }


    return "All Mediums";

}


/* =========================================================
   COURSE PRICE
========================================================= */

function getCoursePrice(course) {

    const finalPrice =
        Number(course.crmFinalPrice);

    const price =
        Number(course.crmPrice);

    if (
        Number.isFinite(finalPrice) &&
        finalPrice > 0
    ) {
        return finalPrice;
    }

    if (
        Number.isFinite(price) &&
        price > 0
    ) {
        return price;
    }

    return 0;

}


/* =========================================================
   COURSE PRIORITY
========================================================= */

function getPriority(course) {

    const priority =
        Number(course.priority);

    if (Number.isFinite(priority)) {
        return priority;
    }

    return 999999;

}


/* =========================================================
   DATE
========================================================= */

function getTimestampValue(value) {

    if (!value) {
        return 0;
    }

    if (
        typeof value.toMillis === "function"
    ) {
        return value.toMillis();
    }

    if (
        value.seconds
    ) {
        return Number(value.seconds) * 1000;
    }

    if (
        value instanceof Date
    ) {
        return value.getTime();
    }

    return 0;

}


/* =========================================================
   SORT COURSES
========================================================= */

function sortCourses(list) {

    return [...list].sort((a, b) => {

        const priorityDifference =
            getPriority(a) -
            getPriority(b);

        if (
            priorityDifference !== 0
        ) {
            return priorityDifference;
        }


        return (
            getTimestampValue(b.createdAt) -
            getTimestampValue(a.createdAt)
        );

    });

}


/* =========================================================
   ENROLLMENT MATCH
========================================================= */

function getEnrollmentForCourse(courseId) {

    return enrollments.find((enrollment) => {

        const enrollmentCourseId =
            enrollment.crmCourseId ||
            enrollment.courseId;

        return (
            enrollmentCourseId === courseId &&
            isEnrollmentActive(enrollment)
        );

    });

}


/* =========================================================
   ACTIVE ENROLLMENT
========================================================= */

function isEnrollmentActive(enrollment) {

    const status =
        String(
            enrollment.status || ""
        ).toUpperCase();

    const paymentStatus =
        String(
            enrollment.paymentStatus || ""
        ).toUpperCase();


    /*
       Don't show cancelled/rejected/
       inactive enrollments as My Batch.
    */

    if (
        [
            "CANCELLED",
            "REJECTED",
            "INACTIVE",
            "SUSPENDED"
        ].includes(status)
    ) {
        return false;
    }


    /*
       Explicit ACTIVE
    */

    if (status === "ACTIVE") {
        return true;
    }


    /*
       Compatibility:
       paid enrollment without status
    */

    if (
        !status &&
        [
            "PAID",
            "COMPLETED",
            "SUCCESS"
        ].includes(paymentStatus)
    ) {
        return true;
    }


    return false;

}


/* =========================================================
   PROGRESS
========================================================= */

function getProgress(enrollment) {

    if (!enrollment) {
        return 0;
    }

    const value =
        Number(
            enrollment.progress ??
            enrollment.progressPercent ??
            enrollment.completion ??
            0
        );

    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.max(
        0,
        Math.min(100, value)
    );

}


/* =========================================================
   FILTERS
========================================================= */

function renderFilters() {

    const classOptions =
        [...new Set(
            courses
                .map(course => getCourseClass(course))
                .filter(Boolean)
        )];


    const filters = [
        {
            value: "ALL",
            label: "All"
        },
        {
            value: "MY_CLASS",
            label: "My Class"
        }
    ];


    classOptions
        .filter(
            className =>
                className !== getStudentClass()
        )
        .sort()
        .forEach(className => {

            filters.push({
                value: className,
                label: displayClass(className)
            });

        });


    filterContainer.innerHTML =
        filters.map(filter => {

            const active =
                selectedFilter === filter.value
                    ? "active"
                    : "";

            return `
                <button
                    class="filter-button ${active}"
                    data-filter="${escapeHtml(filter.value)}"
                >
                    ${escapeHtml(filter.label)}
                </button>
            `;

        }).join("");


    filterContainer
        .querySelectorAll(".filter-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    selectedFilter =
                        button.dataset.filter;

                    renderEverything();

                }
            );

        });

}


/* =========================================================
   CLASS TITLE
========================================================= */

function renderClassTitle() {

    const className =
        getStudentClass();

    studentClassTitle.textContent =
        displayClass(
            className
        );

}


/* =========================================================
   MY BATCH
========================================================= */

function renderMyBatch() {

    const purchasedCourses =
        courses
            .map(course => {

                const enrollment =
                    getEnrollmentForCourse(
                        course.id
                    );

                if (!enrollment) {
                    return null;
                }

                return {
                    course,
                    enrollment
                };

            })
            .filter(Boolean);


    if (!purchasedCourses.length) {

        myBatchSection.classList.add(
            "hidden"
        );

        myBatchContainer.innerHTML = "";

        return;
    }


    /*
       Always priority sort.
    */

    purchasedCourses.sort(
        (a, b) =>
            getPriority(a.course) -
            getPriority(b.course)
    );


    /*
       My Batch should always be
       visible regardless of filter.
    */

    myBatchSection.classList.remove(
        "hidden"
    );


    myBatchContainer.innerHTML =
        purchasedCourses
            .map(
                ({
                    course,
                    enrollment
                }) =>
                    createMyBatchCard(
                        course,
                        enrollment
                    )
            )
            .join("");


    myBatchContainer
        .querySelectorAll(
            "[data-course-id]"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const courseId =
                        card.dataset.courseId;

                    openCourse(courseId);

                }
            );

        });

}


/* =========================================================
   MY BATCH CARD
========================================================= */

function createMyBatchCard(
    course,
    enrollment
) {

    const progress =
        getProgress(enrollment);

    const image =
        getCourseImage(course);

    const className =
        displayClass(
            getCourseClass(course)
        );

    const medium =
        getCourseMedium(course);

    const mode =
        enrollment.batchMode ||
        enrollment.mode ||
        course.batchMode ||
        "";


    const metaParts = [
        className,
        medium,
        mode
    ].filter(Boolean);


    return `
        <div
            class="my-batch-card"
            data-course-id="${escapeHtml(course.id)}"
        >

            <img
                class="my-batch-image"
                src="${escapeHtml(image)}"
                alt="${escapeHtml(course.crmCourseName || "Course")}"
                loading="lazy"
                onerror="this.src='${escapeHtml(getFallbackImage())}'"
            >

            <div class="my-batch-body">

                <div class="enrolled-label">

                    <span class="enrolled-check">
                        ✓
                    </span>

                    ENROLLED

                </div>


                <div class="my-batch-title">
                    ${escapeHtml(
                        course.crmCourseName ||
                        "My Course"
                    )}
                </div>


                <div class="my-batch-meta">
                    ${escapeHtml(
                        metaParts.join(" • ")
                    )}
                </div>


                <div class="progress-row">

                    <span class="progress-label">
                        Your progress
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


                <button
                    class="continue-button"
                    type="button"
                >
                    CONTINUE LEARNING →
                </button>

            </div>

        </div>
    `;

}


/* =========================================================
   AVAILABLE COURSES
========================================================= */

function renderAvailableCourses() {

    const studentClass =
        getStudentClass();


    let available =
        courses.filter(course => {

            const courseClass =
                getCourseClass(course);

            /*
               Must match student's class.
            */

            if (
                courseClass !== studentClass
            ) {
                return false;
            }


            /*
               Purchased courses are
               already shown in My Batch.
            */

            if (
                getEnrollmentForCourse(
                    course.id
                )
            ) {
                return false;
            }


            return matchesSearch(course);

        });


    /*
       Apply selected filter.
    */

    if (
        selectedFilter !== "ALL" &&
        selectedFilter !== "MY_CLASS"
    ) {

        available =
            available.filter(
                course =>
                    getCourseClass(course) ===
                    selectedFilter
            );

    }


    available =
        sortCourses(available);


    /*
       Search/filter can hide the
       entire class section.
    */

    if (
        selectedFilter !== "ALL" &&
        selectedFilter !== "MY_CLASS"
    ) {

        availableCoursesContainer.innerHTML =
            "";

        return;

    }


    if (!available.length) {

        availableCoursesContainer.innerHTML = `
            <div class="empty-course">
                No courses available for your class yet.
            </div>
        `;

        return;

    }


    availableCoursesContainer.innerHTML = `
        <div class="course-list">
            ${available
                .map(
                    course =>
                        createCourseCard(
                            course
                        )
                )
                .join("")
            }
        </div>
    `;


    attachCourseClicks(
        availableCoursesContainer
    );

}


/* =========================================================
   OTHER PROGRAMS
========================================================= */

function renderOtherPrograms() {

    const studentClass =
        getStudentClass();


    let others =
        courses.filter(course => {

            const courseClass =
                getCourseClass(course);

            /*
               Don't show student's own
               class here.
            */

            if (
                courseClass === studentClass
            ) {
                return false;
            }


            /*
               Purchased other-class courses
               should still not appear here.
            */

            if (
                getEnrollmentForCourse(
                    course.id
                )
            ) {
                return false;
            }


            return matchesSearch(course);

        });


    /*
       Filter.
    */

    if (
        selectedFilter === "MY_CLASS"
    ) {

        others = [];

    } else if (
        selectedFilter !== "ALL"
    ) {

        others =
            others.filter(
                course =>
                    getCourseClass(course) ===
                    selectedFilter
            );

    }


    /*
       Group by class.
    */

    const groups = new Map();


    sortCourses(others)
        .forEach(course => {

            const className =
                getCourseClass(course) ||
                "OTHER";

            if (!groups.has(className)) {

                groups.set(
                    className,
                    []
                );

            }

            groups
                .get(className)
                .push(course);

        });


    if (!groups.size) {

        otherProgramsSection.classList.add(
            "hidden"
        );

        otherProgramsContainer.innerHTML =
            "";

        updateNoResults();

        return;

    }


    otherProgramsSection.classList.remove(
        "hidden"
    );


    otherProgramsContainer.innerHTML =
        [...groups.entries()]
            .map(
                ([className, classCourses]) =>
                    createOtherClassGroup(
                        className,
                        classCourses
                    )
            )
            .join("");


    attachCourseClicks(
        otherProgramsContainer
    );

    updateNoResults();

}


/* =========================================================
   OTHER CLASS GROUP
========================================================= */

function createOtherClassGroup(
    className,
    classCourses
) {

    return `
        <div class="other-class-group">

            <div class="other-class-title">
                ${escapeHtml(
                    displayClass(className)
                )}
            </div>

            <div class="other-course-list">

                ${classCourses
                    .map(
                        course =>
                            createCourseCard(
                                course
                            )
                    )
                    .join("")
                }

            </div>

        </div>
    `;

}


/* =========================================================
   NORMAL COURSE CARD
========================================================= */

function createCourseCard(course) {

    const image =
        getCourseImage(course);

    const className =
        displayClass(
            getCourseClass(course)
        );

    const medium =
        getCourseMedium(course);

    const price =
        getCoursePrice(course);


    let priceText =
        "Free";


    if (price > 0) {

        priceText =
            `₹${formatPrice(price)}`;

    }


    return `
        <div
            class="course-card"
            data-course-id="${escapeHtml(course.id)}"
            role="button"
            tabindex="0"
        >

            <img
                class="course-image"
                src="${escapeHtml(image)}"
                alt="${escapeHtml(
                    course.crmCourseName ||
                    "Course"
                )}"
                loading="lazy"
                onerror="this.src='${escapeHtml(getFallbackImage())}'"
            >


            <div class="course-info">

                <div class="course-title">
                    ${escapeHtml(
                        course.crmCourseName ||
                        "Untitled Course"
                    )}
                </div>


                <div class="course-meta">
                    ${escapeHtml(className)}
                    ${medium
                        ? ` • ${escapeHtml(medium)}`
                        : ""
                    }
                </div>


                <div class="course-price">
                    ${escapeHtml(priceText)}
                </div>

            </div>


            <div class="course-arrow">
                →
            </div>

        </div>
    `;

}


/* =========================================================
   COURSE IMAGE
========================================================= */

function getCourseImage(course) {

    return (
        course.crmImageUrl ||
        course.imageUrl ||
        course.thumbnailUrl ||
        getFallbackImage()
    );

}


/* =========================================================
   FALLBACK IMAGE
========================================================= */

function getFallbackImage() {

    /*
       Inline SVG.

       This prevents broken-image icons when
       an old CRM course has no image.
    */

    const svg = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="600"
            height="400"
            viewBox="0 0 600 400"
        >
            <rect
                width="600"
                height="400"
                fill="#f3f3f3"
            />

            <text
                x="300"
                y="205"
                text-anchor="middle"
                font-family="Arial"
                font-size="54"
                font-weight="700"
                fill="#6d28d9"
            >
                Z
            </text>
        </svg>
    `;

    return (
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(svg)
    );

}


/* =========================================================
   SEARCH
========================================================= */

searchInput.addEventListener(
    "input",
    (event) => {

        searchTerm =
            String(
                event.target.value || ""
            )
            .trim()
            .toLowerCase();

        renderEverything();

    }
);


/* =========================================================
   SEARCH MATCH
========================================================= */

function matchesSearch(course) {

    if (!searchTerm) {
        return true;
    }


    const searchableText = [

        course.crmCourseName,

        course.crmCourseCode,

        course.crmClass,

        course.crmBoard,

        course.crmDescription,

        course.crmMedium,

        Array.isArray(course.crmMediums)
            ? course.crmMediums.join(" ")
            : ""

    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();


    return searchableText.includes(
        searchTerm
    );

}


/* =========================================================
   COURSE CLICK
========================================================= */

function attachCourseClicks(container) {

    container
        .querySelectorAll(
            "[data-course-id]"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    openCourse(
                        card.dataset.courseId
                    );

                }
            );


            card.addEventListener(
                "keydown",
                (event) => {

                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {

                        event.preventDefault();

                        openCourse(
                            card.dataset.courseId
                        );

                    }

                }
            );

        });

}


/* =========================================================
   OPEN COURSE
========================================================= */

function openCourse(courseId) {

    if (!courseId) {
        return;
    }

    window.location.href =
        `../batchdetails/?id=${encodeURIComponent(courseId)}`;

}


/* =========================================================
   BACK BUTTON
========================================================= */

backButton.addEventListener(
    "click",
    () => {

        /*
           If the student came from another
           page, go back normally.
        */

        if (
            window.history.length > 1
        ) {

            window.history.back();

            return;
        }


        /*
           Fallback to Student Home.
        */

        window.location.href =
            "../";

    }
);


/* =========================================================
   NOTIFICATION
========================================================= */

document
    .getElementById("notificationButton")
    .addEventListener(
        "click",
        () => {

            /*
               Change this later to your
               notifications route.
            */

            window.location.href =
                "../notifications/";

        }
    );


/* =========================================================
   NO RESULTS
========================================================= */

function updateNoResults() {

    const hasAvailable =
        availableCoursesContainer
            .querySelector(
                "[data-course-id]"
            );

    const hasOther =
        otherProgramsContainer
            .querySelector(
                "[data-course-id]"
            );

    const hasMyBatch =
        myBatchContainer
            .querySelector(
                "[data-course-id]"
            );


    const shouldShow =
        !hasAvailable &&
        !hasOther &&
        !hasMyBatch &&
        searchTerm;


    noResults.classList.toggle(
        "hidden",
        !shouldShow
    );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   PRICE FORMAT
========================================================= */

function formatPrice(value) {

    const number =
        Number(value);

    if (!Number.isFinite(number)) {
        return "0";
    }

    return number.toLocaleString(
        "en-IN",
        {
            maximumFractionDigits: 0
        }
    );

}


/* =========================================================
   LOADING
========================================================= */

function hideLoading() {

    setTimeout(() => {

        loadingScreen.classList.add(
            "hidden"
        );

    }, 250);

}


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (unsubscribeCourses) {
            unsubscribeCourses();
        }

        if (unsubscribeEnrollments) {
            unsubscribeEnrollments();
        }

    }
);

import {
    auth,
    db
} from "../../firebase/firebase-config.js";

import {
    collection,
    query,
    where,
    getDocs,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let student = null;

let courses = [];

let enrollments = [];

let selectedFilter = "ALL";

let filters = [];


/* =========================================================
   ELEMENTS
========================================================= */

const loadingScreen =
    document.getElementById(
        "loadingScreen"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const clearSearch =
    document.getElementById(
        "clearSearch"
    );

const filterList =
    document.getElementById(
        "filterList"
    );

const myBatchSection =
    document.getElementById(
        "myBatchSection"
    );

const myBatchCard =
    document.getElementById(
        "myBatchCard"
    );

const recommendedSection =
    document.getElementById(
        "recommendedSection"
    );

const recommendedList =
    document.getElementById(
        "recommendedList"
    );

const myClassList =
    document.getElementById(
        "myClassList"
    );

const myClassEmpty =
    document.getElementById(
        "myClassEmpty"
    );

const otherPrograms =
    document.getElementById(
        "otherPrograms"
    );

const toast =
    document.getElementById(
        "toast"
    );


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "../../login/";

            return;

        }


        currentUser =
            user;


        try {

            await loadStudent();

            await loadCourses();

            await loadEnrollments();

            buildFilters();

            renderPage();

            hideLoading();

        } catch (error) {

            console.error(
                "Batches page:",
                error
            );

            showToast(
                "Unable to load courses."
            );

            hideLoading();

        }

    }
);


/* =========================================================
   STUDENT
========================================================= */

async function loadStudent() {

    /*
     * Existing student portal uses:
     *
     * students/{uid}
     */

    const snapshot =
        await getDocs(
            query(
                collection(
                    db,
                    "students"
                ),
                where(
                    "__name__",
                    "==",
                    currentUser.uid
                )
            )
        );


    if (
        snapshot.empty
    ) {

        /*
         * Fallback:
         * direct document import.
         */

        const {
            doc,
            getDoc
        } = await import(
            "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js"
        );


        const studentSnapshot =
            await getDoc(
                doc(
                    db,
                    "students",
                    currentUser.uid
                )
            );


        if (
            studentSnapshot.exists()
        ) {

            student = {

                id:
                    studentSnapshot.id,

                ...studentSnapshot.data()

            };

        }

        return;

    }


    const item =
        snapshot.docs[0];


    student = {

        id:
            item.id,

        ...item.data()

    };

}


/* =========================================================
   COURSES
========================================================= */

function loadCourses() {

    return new Promise(
        (resolve, reject) => {

            onSnapshot(

                collection(
                    db,
                    "crmCourses"
                ),

                snapshot => {

                    courses =
                        snapshot.docs
                            .map(
                                item => ({
                                    id:
                                        item.id,

                                    ...item.data()
                                })
                            )
                            .filter(
                                course =>
                                    course.crmActive !==
                                    false
                            )
                            .sort(
                                sortCourses
                            );


                    resolve();

                },

                error => {

                    reject(
                        error
                    );

                }

            );

        }
    );

}


/* =========================================================
   ENROLLMENTS
========================================================= */

async function loadEnrollments() {

    /*
     * Main expected collection:
     *
     * studentEnrollments
     */

    try {

        const snapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        "studentEnrollments"
                    ),
                    where(
                        "studentUid",
                        "==",
                        currentUser.uid
                    )
                )
            );


        enrollments =
            snapshot.docs.map(
                item => ({
                    id:
                        item.id,

                    ...item.data()
                })
            );


        return;

    } catch (error) {

        console.warn(
            "Enrollment query failed:",
            error
        );


        enrollments = [];

    }

}


/* =========================================================
   FILTERS
========================================================= */

function buildFilters() {

    const classNames = [
        ...new Set(
            courses
                .map(
                    course =>
                        course.crmClass
                )
                .filter(Boolean)
        )
    ]
        .sort(
            compareClasses
        );


    filters = [
        {
            id:
                "ALL",

            label:
                "All"
        },

        {
            id:
                "MY_CLASS",

            label:
                "My Class"
        },

        ...classNames.map(
            className => ({

                id:
                    className,

                label:
                    displayClass(
                        className
                    )

            })
        )

    ];


    filterList.innerHTML = "";


    filters.forEach(
        filter => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "filter-button";


            button.classList.toggle(
                "active",
                selectedFilter ===
                filter.id
            );


            button.textContent =
                filter.label;


            button.addEventListener(
                "click",
                () => {

                    selectedFilter =
                        filter.id;


                    document
                        .querySelectorAll(
                            ".filter-button"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                    button.classList.add(
                        "active"
                    );


                    renderPage();

                }
            );


            filterList.appendChild(
                button
            );

        }
    );

}


/* =========================================================
   RENDER PAGE
========================================================= */

function renderPage() {

    renderMyBatch();

    renderRecommended();

    renderMyClass();

    renderOtherPrograms();

}


/* =========================================================
   MY BATCH
========================================================= */

function renderMyBatch() {

    const myEnrollments =
        getActiveEnrollments();


    if (
        !myEnrollments.length
    ) {

        myBatchSection.classList.add(
            "hidden"
        );

        return;

    }


    const enrollment =
        myEnrollments[0];


    const course =
        findEnrollmentCourse(
            enrollment
        );


    if (!course) {

        myBatchSection.classList.add(
            "hidden"
        );

        return;

    }


    const progress =
        clamp(
            Number(
                enrollment.progress ||
                0
            ),
            0,
            100
        );


    myBatchSection.classList.remove(
        "hidden"
    );


    myBatchCard.innerHTML = `

        <div class="my-batch-image">

            ${
                course.crmImageUrl
                ?
                `
                <img
                    src="${escapeAttr(
                        course.crmImageUrl
                    )}"
                    alt=""
                >
                `
                :
                ""
            }

        </div>


        <div class="my-batch-details">

            <div class="batch-small-label">
                MY BATCH
            </div>


            <h3>
                ${escapeHtml(
                    course.crmCourseName ||
                    "Your Course"
                )}
            </h3>


            <div class="batch-meta">

                ${escapeHtml(
                    displayClass(
                        course.crmClass
                    )
                )}

                ${
                    course.crmBoard
                    ?
                    ` • ${escapeHtml(
                        course.crmBoard
                    )}`
                    :
                    ""
                }

            </div>


            <div class="progress-area">

                <div class="progress-row">

                    <span>
                        Your progress
                    </span>

                    <strong>
                        ${progress}%
                    </strong>

                </div>


                <div class="progress-track">

                    <div
                        class="progress-fill"
                        style="width:${progress}%"
                    ></div>

                </div>

            </div>

        </div>


        <button
            class="continue-batch"
            type="button"
        >
            CONTINUE
        </button>

    `;


    myBatchCard
        .querySelector(
            ".continue-batch"
        )
        .addEventListener(
            "click",
            () => {

                goToCourse(
                    course.id
                );

            }
        );

}


/* =========================================================
   RECOMMENDED
========================================================= */

function renderRecommended() {

    const myClass =
        student?.className ||
        "";


    let list =
        courses.filter(
            course =>
                course.crmClass ===
                myClass
        );


    const enrolledIds =
        new Set(
            enrollments.map(
                enrollment =>
                    enrollment.crmCourseId ||
                    enrollment.courseId
            )
        );


    list =
        list.filter(
            course =>
                !enrolledIds.has(
                    course.id
                )
        );


    list =
        list.slice(
            0,
            6
        );


    if (!list.length) {

        recommendedSection.classList.add(
            "hidden"
        );

        return;

    }


    recommendedSection.classList.remove(
        "hidden"
    );


    recommendedList.innerHTML =
        list.map(
            course =>
                horizontalCourseHtml(
                    course
                )
        ).join("");


    attachCourseClicks(
        recommendedList
    );

}


/* =========================================================
   MY CLASS
========================================================= */

function renderMyClass() {

    const myClass =
        student?.className ||
        "";


    document.getElementById(
        "myClassTitle"
    ).textContent =
        myClass
        ?
        displayClass(
            myClass
        )
        :
        "My Class";


    let list =
        courses.filter(
            course =>
                course.crmClass ===
                myClass
        );


    if (
        selectedFilter !==
        "ALL" &&
        selectedFilter !==
        "MY_CLASS"
    ) {

        if (
            selectedFilter !==
            myClass
        ) {

            myClassList.innerHTML =
                "";

            myClassEmpty.classList.remove(
                "hidden"
            );

            return;

        }

    }


    if (!list.length) {

        myClassList.innerHTML =
            "";

        myClassEmpty.classList.remove(
            "hidden"
        );

        return;

    }


    myClassEmpty.classList.add(
        "hidden"
    );


    myClassList.innerHTML =
        list.map(
            course =>
                courseCardHtml(
                    course
                )
        ).join("");


    attachCourseClicks(
        myClassList
    );

}


/* =========================================================
   OTHER PROGRAMS
========================================================= */

function renderOtherPrograms() {

    let list =
        courses.filter(
            course =>
                course.crmClass !==
                (
                    student?.className ||
                    ""
                )
        );


    if (
        selectedFilter !==
        "ALL" &&
        selectedFilter !==
        "MY_CLASS"
    ) {

        list =
            list.filter(
                course =>
                    course.crmClass ===
                    selectedFilter
            );

    }


    const grouped = {};


    list.forEach(
        course => {

            const key =
                course.crmClass ||
                "OTHER";


            if (
                !grouped[key]
            ) {

                grouped[key] = [];

            }


            grouped[key].push(
                course
            );

        }
    );


    const groups =
        Object.entries(
            grouped
        )
        .sort(
            ([a], [b]) =>
                compareClasses(
                    a,
                    b
                )
        );


    otherPrograms.innerHTML =
        "";


    groups.forEach(
        ([className, classCourses]) => {

            const group =
                document.createElement(
                    "div"
                );


            group.innerHTML = `

                <h3
                    class="program-group-title"
                >
                    ${escapeHtml(
                        displayClass(
                            className
                        )
                    )}
                </h3>


                <div
                    class="program-list"
                >

                    ${classCourses
                        .map(
                            course =>
                                programCardHtml(
                                    course
                                )
                        )
                        .join("")}

                </div>

            `;


            otherPrograms.appendChild(
                group
            );


            attachCourseClicks(
                group
            );

        }
    );

}


/* =========================================================
   COURSE HTML
========================================================= */

function courseCardHtml(
    course
) {

    const enrolled =
        isEnrolled(
            course.id
        );


    const price =
        Number(
            course.crmFinalPrice ??
            course.crmPrice ??
            0
        );


    return `

        <article
            class="course-card"
            data-course-id="${escapeAttr(
                course.id
            )}"
        >

            <div class="course-image">

                ${
                    course.crmImageUrl
                    ?
                    `
                    <img
                        src="${escapeAttr(
                            course.crmImageUrl
                        )}"
                        alt=""
                        loading="lazy"
                    >
                    `
                    :
                    ""
                }

            </div>


            <div class="course-body">

                <h3>
                    ${escapeHtml(
                        course.crmCourseName ||
                        "Course"
                    )}
                </h3>


                <div class="course-subtitle">

                    ${escapeHtml(
                        displayClass(
                            course.crmClass
                        )
                    )}

                    ${
                        getCourseMediums(
                            course
                        ).length
                        ?
                        ` • ${escapeHtml(
                            getCourseMediums(
                                course
                            ).join(
                                ", "
                            )
                        )}`
                        :
                        ""
                    }

                </div>


                <div class="course-footer">

                    ${
                        enrolled
                        ?
                        `
                        <span class="enrolled-label">
                            ✓ ENROLLED
                        </span>
                        `
                        :
                        `
                        <span class="price">
                            ${
                                getCourseType(
                                    course
                                ) === "FREE"
                                ?
                                "Free"
                                :
                                formatPrice(
                                    price
                                )
                            }
                        </span>
                        `
                    }


                    <span
                        class="program-arrow"
                    >
                        →
                    </span>

                </div>

            </div>

        </article>

    `;

}


function horizontalCourseHtml(
    course
) {

    return `

        <article
            class="horizontal-course"
            data-course-id="${escapeAttr(
                course.id
            )}"
        >

            <div
                class="horizontal-course-image"
            >

                ${
                    course.crmImageUrl
                    ?
                    `
                    <img
                        src="${escapeAttr(
                            course.crmImageUrl
                        )}"
                        alt=""
                        loading="lazy"
                    >
                    `
                    :
                    ""
                }

            </div>


            <div
                class="horizontal-course-body"
            >

                <h3>
                    ${escapeHtml(
                        course.crmCourseName ||
                        "Course"
                    )}
                </h3>


                <div class="course-meta">

                    ${escapeHtml(
                        displayClass(
                            course.crmClass
                        )
                    )}

                    ${
                        course.crmBoard
                        ?
                        ` • ${escapeHtml(
                            course.crmBoard
                        )}`
                        :
                        ""
                    }

                </div>


                <button
                    class="explore-link"
                    type="button"
                >
                    EXPLORE
                </button>

            </div>

        </article>

    `;

}


function programCardHtml(
    course
) {

    return `

        <article
            class="program-card"
            data-course-id="${escapeAttr(
                course.id
            )}"
        >

            <div
                class="program-thumbnail"
            >

                ${
                    course.crmImageUrl
                    ?
                    `
                    <img
                        src="${escapeAttr(
                            course.crmImageUrl
                        )}"
                        alt=""
                        loading="lazy"
                    >
                    `
                    :
                    ""
                }

            </div>


            <div
                class="program-info"
            >

                <strong>
                    ${escapeHtml(
                        course.crmCourseName ||
                        "Course"
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        getCourseMediums(
                            course
                        ).join(
                            ", "
                        ) ||
                        "Program"
                    )}
                </span>

            </div>


            <div
                class="program-arrow"
            >
                →
            </div>

        </article>

    `;

}


/* =========================================================
   COURSE CLICK
========================================================= */

function attachCourseClicks(
    container
) {

    container
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


                        if (id) {

                            goToCourse(
                                id
                            );

                        }

                    }
                );

            }
        );

}


function goToCourse(
    courseId
) {

    window.location.href =
        `../batchdetails/?id=${encodeURIComponent(
            courseId
        )}`;

}


/* =========================================================
   ENROLLMENTS
========================================================= */

function getActiveEnrollments() {

    return enrollments.filter(
        enrollment => {

            const status =
                String(
                    enrollment.status ||
                    "ACTIVE"
                ).toUpperCase();


            return (
                status ===
                    "ACTIVE" ||
                status ===
                    "APPROVED" ||
                enrollment.paymentStatus ===
                    "PAID"
            );

        }
    );

}


function isEnrolled(
    courseId
) {

    return enrollments.some(
        enrollment => {

            const enrolledId =
                enrollment.crmCourseId ||
                enrollment.courseId;


            return (
                enrolledId ===
                courseId
            );

        }
    );

}


function findEnrollmentCourse(
    enrollment
) {

    const courseId =
        enrollment.crmCourseId ||
        enrollment.courseId;


    return courses.find(
        course =>
            course.id ===
            courseId
    );

}


/* =========================================================
   SORT
========================================================= */

function sortCourses(
    a,
    b
) {

    const priorityA =
        Number(
            a.priority ??
            999999
        );


    const priorityB =
        Number(
            b.priority ??
            999999
        );


    if (
        priorityA !==
        priorityB
    ) {

        return (
            priorityA -
            priorityB
        );

    }


    return (
        timestampValue(
            b.createdAt
        ) -
        timestampValue(
            a.createdAt
        )
    );

}


function timestampValue(
    value
) {

    if (!value) {
        return 0;
    }


    if (
        typeof value.toMillis ===
        "function"
    ) {

        return value.toMillis();

    }


    if (value.seconds) {

        return (
            value.seconds *
            1000
        );

    }


    return 0;

}


/* =========================================================
   MEDIUM
========================================================= */

function getCourseMediums(
    course
) {

    if (
        Array.isArray(
            course.mediums
        ) &&
        course.mediums.length
    ) {

        return course.mediums;

    }


    if (
        Array.isArray(
            course.crmMediums
        ) &&
        course.crmMediums.length
    ) {

        return course.crmMediums;

    }


    if (
        typeof course.crmMedium ===
        "string"
    ) {

        return course.crmMedium
            .split(",")
            .map(
                value =>
                    value.trim()
            )
            .filter(Boolean);

    }


    return [];

}


/* =========================================================
   CLASS
========================================================= */

function displayClass(
    value
) {

    const labels = {

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
        labels[value] ||
        value ||
        "Other"
    );

}


function compareClasses(
    a,
    b
) {

    const order = {

        UNDER_8TH: 1,

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
   TYPE / PRICE
========================================================= */

function getCourseType(
    course
) {

    return String(
        course.courseType ||
        "FREE"
    ).toUpperCase();

}


function formatPrice(
    value
) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style:
                "currency",

            currency:
                "INR",

            maximumFractionDigits:
                0

        }
    ).format(
        Number(value) ||
        0
    );

}


/* =========================================================
   SEARCH
========================================================= */

searchInput.addEventListener(
    "input",
    () => {

        const value =
            searchInput.value
                .trim()
                .toLowerCase();


        clearSearch.classList.toggle(
            "hidden",
            !value
        );


        const cards =
            document.querySelectorAll(
                "[data-course-id]"
            );


        cards.forEach(
            card => {

                const course =
                    courses.find(
                        item =>
                            item.id ===
                            card.dataset.courseId
                    );


                if (!course) {
                    return;
                }


                const text = [

                    course.crmCourseName,

                    course.crmCourseCode,

                    course.crmClass,

                    course.crmDescription,

                    ...getCourseMediums(
                        course
                    )

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                card.style.display =
                    !value ||
                    text.includes(
                        value
                    )
                    ?
                    ""
                    :
                    "none";

            }
        );

    }
);


clearSearch.addEventListener(
    "click",
    () => {

        searchInput.value =
            "";

        clearSearch.classList.add(
            "hidden"
        );

        renderPage();

    }
);


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

                    navigate(
                        button.dataset.route
                    );

                }
            );

        }
    );


function navigate(
    route
) {

    const routes = {

        home:
            "../",

        batches:
            "./",

        study:
            "../study/",

        timetable:
            "../timetable/",

        more:
            "../more/"

    };


    if (
        routes[route]
    ) {

        window.location.href =
            routes[route];

    }

}


/* =========================================================
   BACK BUTTON
========================================================= */

document
    .getElementById(
        "backButton"
    )
    .addEventListener(
        "click",
        () => {

            /*
             * If user came from Home,
             * go back normally.
             */

            if (
                history.length >
                1
            ) {

                history.back();

            } else {

                window.location.href =
                    "../";

            }

        }
    );


/* =========================================================
   NOTIFICATIONS
========================================================= */

document
    .getElementById(
        "notificationButton"
    )
    .addEventListener(
        "click",
        () => {

            window.location.href =
                "../notifications/";

        }
    );


/* =========================================================
   LOADING
========================================================= */

function hideLoading() {

    loadingScreen.classList.add(
        "hide"
    );


    setTimeout(
        () => {

            loadingScreen.remove();

        },
        300
    );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message
) {

    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        showToast.timer
    );


    showToast.timer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );

}


/* =========================================================
   HELPERS
========================================================= */

function clamp(
    value,
    min,
    max
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );

}


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


function escapeAttr(
    value
) {

    return escapeHtml(
        value
    );

}

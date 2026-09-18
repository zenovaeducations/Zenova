/* =========================================================
   ZENOVA
   STUDY NOW
   ========================================================= */

import {
    auth,
    db
} from "../../firebase/firebase-config.js";

import {
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================================
   DOM
========================================================= */

const loadingScreen =
    document.getElementById("loadingScreen");

const app =
    document.getElementById("app");

const errorSection =
    document.getElementById("errorSection");

const errorMessage =
    document.getElementById("errorMessage");

const errorBackButton =
    document.getElementById("errorBackButton");

const backButton =
    document.getElementById("backButton");


/* =========================================================
   BATCH
========================================================= */

const batchName =
    document.getElementById("batchName");

const batchCard =
    document.getElementById("batchCard");

const batchImage =
    document.getElementById("batchImage");

const batchImageFallback =
    document.getElementById("batchImageFallback");

const batchTitle =
    document.getElementById("batchTitle");

const batchMeta =
    document.getElementById("batchMeta");


/* =========================================================
   LIVE CLASS
========================================================= */

const liveClassSection =
    document.getElementById("liveClassSection");

const liveHeading =
    document.getElementById("liveHeading");

const liveStatus =
    document.getElementById("liveStatus");

const liveClassCard =
    document.getElementById("liveClassCard");

const liveThumbnail =
    document.getElementById("liveThumbnail");

const liveThumbnailFallback =
    document.getElementById("liveThumbnailFallback");

const liveSubject =
    document.getElementById("liveSubject");

const liveTopic =
    document.getElementById("liveTopic");

const liveTeacher =
    document.getElementById("liveTeacher");

const liveTime =
    document.getElementById("liveTime");

const joinLiveButton =
    document.getElementById("joinLiveButton");


/* =========================================================
   STUDY PLAN
========================================================= */

const dateSelector =
    document.getElementById("dateSelector");

const selectedDateLabel =
    document.getElementById("selectedDateLabel");

const studyPlanContainer =
    document.getElementById("studyPlanContainer");


/* =========================================================
   START LEARNING
========================================================= */

const subjectsContainer =
    document.getElementById("subjectsContainer");


/* =========================================================
   RECORDINGS
========================================================= */

const recordingsButton =
    document.getElementById("recordingsButton");


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let currentStudent = null;

let currentEnrollment = null;

let currentCourse = null;

let currentCourseId = "";

let currentSubjects = [];

let currentLanguages = [];

let currentPlans = [];

let selectedPlanDate = "";

let unsubscribeLiveClass = null;


/* =========================================================
   URL
========================================================= */

const params =
    new URLSearchParams(
        window.location.search
    );

const urlCourseId =
    (
        params.get("courseId") ||
        params.get("id") ||
        ""
    ).trim();


/* =========================================================
   INIT
========================================================= */

onAuthStateChanged(
    auth,

    async user => {

        try {

            if (!user) {

                window.location.href =
                    "../login/";

                return;

            }


            currentUser =
                user;


            showLoading();


            await loadStudent();


            await loadEnrollment();


            if (!currentEnrollment) {

                throw new Error(
                    "You are not enrolled in an active batch."
                );

            }


            currentCourseId =
                getEnrollmentCourseId(
                    currentEnrollment
                );


            /*
             * If Study Now was opened with a
             * specific courseId, use it.
             *
             * Otherwise use enrollment course.
             */

            if (
                urlCourseId &&
                isSameId(
                    urlCourseId,
                    currentCourseId
                )
            ) {

                currentCourseId =
                    urlCourseId;

            }


            if (!currentCourseId) {

                throw new Error(
                    "Your enrollment does not contain a course ID."
                );

            }


            await loadCourse(
                currentCourseId
            );


            /*
             * IMPORTANT:
             *
             * Subjects and languages now come
             * DIRECTLY from the course document.
             *
             * We DO NOT build this list from
             * hybridSubjects.
             *
             * This prevents:
             *
             * Mathematics
             * Mathematics
             * Mathematics
             *
             * duplicates.
             */

            buildLearningList();


            renderBatch();


            await loadStudyPlans();


            startLiveClassListener();


            setupButtons();


            showApp();


        } catch (error) {

            console.error(
                "ZENOVA STUDY ERROR:",
                error
            );

            showError(
                getReadableError(error)
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


    if (
        snapshot.exists()
    ) {

        currentStudent = {
            id:
                snapshot.id,

            ...snapshot.data()
        };

        return;

    }


    /*
     * Compatibility fallback.
     */

    const accountRef =
        doc(
            db,
            "studentAccounts",
            currentUser.uid
        );


    const accountSnapshot =
        await getDoc(
            accountRef
        );


    if (
        accountSnapshot.exists()
    ) {

        currentStudent = {
            id:
                accountSnapshot.id,

            ...accountSnapshot.data()
        };

        return;

    }


    currentStudent = {};

}


/* =========================================================
   LOAD ENROLLMENT
========================================================= */

async function loadEnrollment() {

    /*
     * First try:
     *
     * studentEnrollments
     * where studentUid == user.uid
     */

    try {

        const q =
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
            );


        const snapshot =
            await getDocs(q);


        const enrollments =
            snapshot.docs
                .map(
                    item => ({
                        id:
                            item.id,

                        ...item.data()
                    })
                )
                .filter(
                    enrollment =>
                        isActiveEnrollment(
                            enrollment
                        )
                );


        /*
         * If URL specifies a course,
         * prefer that enrollment.
         */

        if (urlCourseId) {

            const matching =
                enrollments.find(
                    enrollment =>
                        isSameId(
                            getEnrollmentCourseId(
                                enrollment
                            ),
                            urlCourseId
                        )
                );


            if (matching) {

                currentEnrollment =
                    matching;

                return;

            }

        }


        currentEnrollment =
            enrollments[0] || null;


        if (
            currentEnrollment
        ) {

            return;

        }

    } catch (error) {

        console.warn(
            "studentEnrollments query failed:",
            error
        );

    }


    /*
     * Nothing found.
     */

    currentEnrollment =
        null;

}


/* =========================================================
   ENROLLMENT STATUS
========================================================= */

function isActiveEnrollment(
    enrollment
) {

    if (!enrollment) {

        return false;

    }


    const status =
        String(
            enrollment.status || ""
        )
        .trim()
        .toUpperCase();


    const paymentStatus =
        String(
            enrollment.paymentStatus || ""
        )
        .trim()
        .toUpperCase();


    const accessGranted =
        enrollment.accessGranted === true;


    /*
     * Preferred:
     *
     * ACTIVE / ENROLLED
     * +
     * accessGranted
     */

    if (
        accessGranted &&
        (
            status === "ACTIVE" ||
            status === "ENROLLED"
        )
    ) {

        return true;

    }


    /*
     * Compatibility with old
     * approved enrollments.
     */

    if (
        paymentStatus === "PAID" &&
        (
            status === "ACTIVE" ||
            status === "ENROLLED"
        )
    ) {

        return true;

    }


    return false;

}


/* =========================================================
   ENROLLMENT COURSE ID
========================================================= */

function getEnrollmentCourseId(
    enrollment
) {

    if (!enrollment) {

        return "";

    }


    return (
        enrollment.crmCourseId ||
        enrollment.courseId ||
        enrollment.batchId ||
        enrollment.crmBatchId ||
        ""
    )
    .trim();

}


/* =========================================================
   LOAD COURSE
========================================================= */

async function loadCourse(
    courseId
) {

    const courseRef =
        doc(
            db,
            "crmCourses",
            courseId
        );


    const snapshot =
        await getDoc(
            courseRef
        );


    if (
        !snapshot.exists()
    ) {

        throw new Error(
            "The enrolled batch could not be found."
        );

    }


    currentCourse = {

        id:
            snapshot.id,

        ...snapshot.data()

    };


    console.log(
        "[Study] Course:",
        currentCourse
    );

}


/* =========================================================
   BUILD LEARNING LIST
========================================================= */

function buildLearningList() {

    /*
     * ============================================
     * SUBJECTS
     * ============================================
     *
     * Your CRM stores subjects as:
     *
     * course.subjects
     *
     * Example:
     *
     * [
     *   "Mathematics",
     *   "Science",
     *   "Social Science"
     * ]
     */

    const rawSubjects =
        Array.isArray(
            currentCourse?.subjects
        )
            ? currentCourse.subjects
            : [];


    /*
     * ============================================
     * LANGUAGES
     * ============================================
     *
     * Your CRM stores the course languages/
     * mediums as:
     *
     * course.mediums
     *
     * Example:
     *
     * [
     *   "Kannada",
     *   "English",
     *   "Hindi"
     * ]
     */

    const rawLanguages =
        Array.isArray(
            currentCourse?.mediums
        )
            ? currentCourse.mediums
            : parseMediumString(
                currentCourse?.crmMedium
            );


    /*
     * Deduplicate subjects.
     */

    currentSubjects =
        uniqueDisplayValues(
            rawSubjects
        );


    /*
     * Deduplicate languages.
     */

    currentLanguages =
        uniqueDisplayValues(
            rawLanguages
        );


    console.log(
        "[Study] Subjects:",
        currentSubjects
    );


    console.log(
        "[Study] Languages:",
        currentLanguages
    );


    renderLearningSubjects();

}


/* =========================================================
   RENDER LEARNING SUBJECTS
========================================================= */

function renderLearningSubjects() {

    if (!subjectsContainer) {

        return;

    }


    subjectsContainer.innerHTML =
        "";


    /*
     * ============================================
     * SUBJECTS
     * ============================================
     */

    currentSubjects.forEach(
        subject => {

            subjectsContainer.appendChild(
                createLearningCard(
                    subject,
                    "SUBJECT",
                    findSubjectId(
                        subject
                    )
                )
            );

        }
    );


    /*
     * ============================================
     * LANGUAGES
     * ============================================
     *
     * A language is also displayed as a
     * learning subject, exactly as requested.
     */

    currentLanguages.forEach(
        language => {

            subjectsContainer.appendChild(
                createLearningCard(
                    language,
                    "LANGUAGE",
                    ""
                )
            );

        }
    );


    /*
     * Nothing available.
     */

    if (
        !currentSubjects.length &&
        !currentLanguages.length
    ) {

        subjectsContainer.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    Z
                </div>

                <h3>
                    Learning content coming soon
                </h3>

                <p>
                    Subjects and languages for your
                    batch will appear here.
                </p>

            </div>

        `;

    }

}


/* =========================================================
   CREATE LEARNING CARD
========================================================= */

function createLearningCard(
    name,
    type,
    subjectId
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "subject-card";


    /*
     * Store information for
     * future chapter navigation.
     */

    card.dataset.name =
        name;

    card.dataset.type =
        type;

    card.dataset.subjectId =
        subjectId || "";


    card.innerHTML = `

        <div class="subject-card-content">

            <div class="subject-card-title">
                ${escapeHtml(name)}
            </div>

            <div class="subject-card-medium">
                ${type === "LANGUAGE"
                    ? "Language"
                    : "Subject"}
            </div>

        </div>

        <div class="subject-card-action">
            OPEN →
        </div>

    `;


    /*
     * SUBJECT
     *
     * Can currently open the existing
     * subject page if we can find a real
     * hybridSubjects document.
     */

    if (
        type === "SUBJECT" &&
        subjectId
    ) {

        card.addEventListener(
            "click",
            () => {

                const url =
                    `../subject/?subjectId=${encodeURIComponent(
                        subjectId
                    )}&courseId=${encodeURIComponent(
                        currentCourseId
                    )}`;


                window.location.href =
                    url;

            }
        );

    } else {

        /*
         * Language cards are displayed now.
         *
         * We intentionally don't send them
         * to the old subject page because that
         * page expects a real hybridSubjects
         * document ID.
         *
         * We will make the language-specific
         * chapter/content page next.
         */

        card.addEventListener(
            "click",
            () => {

                console.log(
                    "[Study] Language selected:",
                    name
                );

            }
        );

    }


    return card;

}


/* =========================================================
   FIND REAL SUBJECT ID
========================================================= */

async function findSubjectId(
    subjectName
) {

    /*
     * This function is async, so we cannot
     * directly use its result while building
     * the card.
     *
     * The actual IDs are loaded separately
     * below.
     */

    return "";

}


/* =========================================================
   LOAD SUBJECT DOCUMENT IDS
========================================================= */

async function loadSubjectDocumentIds() {

    /*
     * This is ONLY for navigation.
     *
     * The display list itself still comes
     * directly from crmCourses.subjects.
     */

    try {

        const subjectMap =
            new Map();


        const queries = [

            query(
                collection(
                    db,
                    "hybridSubjects"
                ),

                where(
                    "courseId",
                    "==",
                    currentCourseId
                )
            ),

            query(
                collection(
                    db,
                    "hybridSubjects"
                ),

                where(
                    "crmCourseId",
                    "==",
                    currentCourseId
                )
            )

        ];


        for (
            const subjectQuery
            of queries
        ) {

            try {

                const snapshot =
                    await getDocs(
                        subjectQuery
                    );


                snapshot.forEach(
                    item => {

                        const data =
                            item.data();


                        const name =
                            getSubjectName(
                                data
                            );


                        const key =
                            normalizeKey(
                                name
                            );


                        if (
                            key &&
                            !subjectMap.has(key)
                        ) {

                            subjectMap.set(
                                key,
                                item.id
                            );

                        }

                    }
                );

            } catch (error) {

                console.warn(
                    "[Study] Subject ID query failed:",
                    error
                );

            }

        }


        /*
         * Add IDs to subject cards.
         */

        document
            .querySelectorAll(
                ".subject-card[data-type='SUBJECT']"
            )
            .forEach(
                card => {

                    const key =
                        normalizeKey(
                            card.dataset.name
                        );


                    const subjectId =
                        subjectMap.get(
                            key
                        ) || "";


                    card.dataset.subjectId =
                        subjectId;


                    if (
                        subjectId
                    ) {

                        card.onclick =
                            () => {

                                window.location.href =
                                    `../subject/?subjectId=${encodeURIComponent(
                                        subjectId
                                    )}&courseId=${encodeURIComponent(
                                        currentCourseId
                                    )}`;

                            };

                    }

                }
            );


    } catch (error) {

        console.warn(
            "[Study] Unable to map subject IDs:",
            error
        );

    }

}


/* =========================================================
   GET SUBJECT NAME
========================================================= */

function getSubjectName(
    data
) {

    return (
        data?.name ||
        data?.subjectName ||
        data?.title ||
        data?.crmSubjectName ||
        ""
    )
    .trim();

}


/* =========================================================
   RENDER BATCH
========================================================= */

function renderBatch() {

    const name =
        currentCourse?.crmCourseName ||
        currentCourse?.courseName ||
        "My Batch";


    const className =
        formatClass(
            currentCourse?.crmClass ||
            currentCourse?.className ||
            ""
        );


    const mediumText =
        currentLanguages.join(
            " • "
        );


    const metaParts = [
        className,
        mediumText
    ]
    .filter(Boolean);


    setText(
        batchName,
        name
    );


    setText(
        batchTitle,
        name
    );


    setText(
        batchMeta,
        metaParts.join(" • ")
    );


    /*
     * Batch image.
     */

    const image =
        currentCourse?.crmImageUrl ||
        currentCourse?.imageUrl ||
        currentCourse?.courseImageUrl ||
        currentEnrollment?.batchImageUrl ||
        "";


    if (
        image &&
        batchImage
    ) {

        batchImage.src =
            image;

        batchImage.classList.remove(
            "hidden"
        );


        if (
            batchImageFallback
        ) {

            batchImageFallback.classList.add(
                "hidden"
            );

        }

    } else {

        if (
            batchImage
        ) {

            batchImage.classList.add(
                "hidden"
            );

        }


        if (
            batchImageFallback
        ) {

            batchImageFallback.classList.remove(
                "hidden"
            );

        }

    }


    /*
     * Make sure enrolled state
     * is visible if the HTML supports it.
     */

    if (
        batchCard
    ) {

        batchCard.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   STUDY PLANS
========================================================= */

async function loadStudyPlans() {

    currentPlans =
        [];


    if (
        !studyPlanContainer
    ) {

        return;

    }


    try {

        /*
         * Try courseId.
         */

        const q =
            query(
                collection(
                    db,
                    "studyPlans"
                ),

                where(
                    "courseId",
                    "==",
                    currentCourseId
                )
            );


        const snapshot =
            await getDocs(q);


        currentPlans =
            snapshot.docs
                .map(
                    item => ({
                        id:
                            item.id,

                        ...item.data()
                    })
                )
                .filter(
                    item =>
                        item.active !== false
                );


    } catch (error) {

        console.warn(
            "[Study] Study plans unavailable:",
            error
        );


        currentPlans =
            [];

    }


    buildDateSelector();


    renderSelectedStudyPlan();

}


/* =========================================================
   DATE SELECTOR
========================================================= */

function buildDateSelector() {

    if (!dateSelector) {

        return;

    }


    dateSelector.innerHTML =
        "";


    /*
     * Always show the next 14 days.
     */

    const today =
        new Date();


    const dates = [];


    for (
        let i = 0;
        i < 14;
        i++
    ) {

        const date =
            new Date(today);


        date.setDate(
            today.getDate() + i
        );


        dates.push(
            date
        );

    }


    /*
     * Default today.
     */

    selectedPlanDate =
        getDateKey(
            dates[0]
        );


    dates.forEach(
        date => {

            const key =
                getDateKey(
                    date
                );


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "date-item";


            if (
                key ===
                selectedPlanDate
            ) {

                button.classList.add(
                    "active"
                );

            }


            button.dataset.date =
                key;


            button.innerHTML = `

                <span>
                    ${formatDay(
                        date
                    )}
                </span>

                <strong>
                    ${date.getDate()}
                </strong>

                <small>
                    ${formatMonth(
                        date
                    )}
                </small>

            `;


            button.addEventListener(
                "click",
                () => {

                    selectedPlanDate =
                        key;


                    dateSelector
                        .querySelectorAll(
                            ".date-item"
                        )
                        .forEach(
                            item => {

                                item.classList.toggle(
                                    "active",
                                    item.dataset.date ===
                                    key
                                );

                            }
                        );


                    renderSelectedStudyPlan();

                }
            );


            dateSelector.appendChild(
                button
            );

        }
    );


    setText(
        selectedDateLabel,
        formatFullDate(
            dates[0]
        )
    );

}


/* =========================================================
   RENDER STUDY PLAN
========================================================= */

function renderSelectedStudyPlan() {

    if (
        !studyPlanContainer
    ) {

        return;

    }


    const plan =
        findPlanForDate(
            selectedPlanDate
        );


    const date =
        parseDateKey(
            selectedPlanDate
        );


    setText(
        selectedDateLabel,
        formatFullDate(
            date
        )
    );


    if (!plan) {

        studyPlanContainer.innerHTML = `

            <div class="empty-card">

                <strong>
                    Not yet scheduled
                </strong>

                <p>
                    The study plan for this date
                    has not been uploaded yet.
                </p>

            </div>

        `;

        return;

    }


    const items =
        getPlanItems(
            plan
        );


    if (!items.length) {

        studyPlanContainer.innerHTML = `

            <div class="empty-card">

                <strong>
                    Not yet scheduled
                </strong>

                <p>
                    The study plan for this date
                    has not been uploaded yet.
                </p>

            </div>

        `;

        return;

    }


    studyPlanContainer.innerHTML =
        items
            .map(
                (item, index) => `

                    <article
                        class="study-plan-item"
                    >

                        <div class="study-plan-number">
                            ${index + 1}
                        </div>

                        <div class="study-plan-info">

                            <strong>
                                ${escapeHtml(
                                    item.subject ||
                                    item.title ||
                                    ""
                                )}
                            </strong>

                            <p>
                                ${escapeHtml(
                                    item.topic ||
                                    item.chapter ||
                                    item.description ||
                                    ""
                                )}
                            </p>

                        </div>

                    </article>

                `
            )
            .join("");

}


/* =========================================================
   FIND PLAN FOR DATE
========================================================= */

function findPlanForDate(
    dateKey
) {

    if (!dateKey) {

        return null;

    }


    return (
        currentPlans.find(
            plan =>
                getPlanDateKey(
                    plan
                ) ===
                dateKey
        ) ||
        null
    );

}


/* =========================================================
   PLAN DATE
========================================================= */

function getPlanDateKey(
    plan
) {

    const value =
        plan?.dateKey ||
        plan?.date ||
        plan?.studyDate ||
        plan?.scheduledDate ||
        "";


    if (!value) {

        return "";

    }


    if (
        typeof value ===
        "string"
    ) {

        /*
         * YYYY-MM-DD
         */

        if (
            /^\d{4}-\d{2}-\d{2}$/
                .test(
                    value
                )
        ) {

            return value;

        }


        /*
         * ISO date.
         */

        const parsed =
            new Date(
                value
            );


        if (
            !Number.isNaN(
                parsed.getTime()
            )
        ) {

            return getDateKey(
                parsed
            );

        }

    }


    if (
        value?.toDate
    ) {

        return getDateKey(
            value.toDate()
        );

    }


    return "";

}


/* =========================================================
   PLAN ITEMS
========================================================= */

function getPlanItems(
    plan
) {

    if (
        Array.isArray(
            plan.items
        )
    ) {

        return plan.items;

    }


    if (
        Array.isArray(
            plan.tasks
        )
    ) {

        return plan.tasks;

    }


    if (
        Array.isArray(
            plan.activities
        )
    ) {

        return plan.activities;

    }


    return [];

}


/* =========================================================
   LIVE CLASS
========================================================= */

function startLiveClassListener() {

    if (
        unsubscribeLiveClass
    ) {

        unsubscribeLiveClass();

        unsubscribeLiveClass =
            null;

    }


    /*
     * Hide initially.
     */

    if (
        liveClassSection
    ) {

        liveClassSection.classList.add(
            "hidden"
        );

    }


    /*
     * Query active live classes
     * for this course.
     */

    try {

        const q =
            query(
                collection(
                    db,
                    "liveClasses"
                ),

                where(
                    "courseId",
                    "==",
                    currentCourseId
                )
            );


        unsubscribeLiveClass =
            onSnapshot(

                q,

                snapshot => {

                    const classes =
                        snapshot.docs
                            .map(
                                item => ({
                                    id:
                                        item.id,

                                    ...item.data()
                                })
                            )
                            .filter(
                                item =>
                                    item.active !== false
                            );


                    renderLiveClass(
                        chooseLiveClass(
                            classes
                        )
                    );

                },

                error => {

                    console.warn(
                        "[Study] Live class error:",
                        error
                    );


                    renderLiveClass(
                        null
                    );

                }

            );

    } catch (error) {

        console.warn(
            "[Study] Live listener error:",
            error
        );

        renderLiveClass(
            null
        );

    }

}


/* =========================================================
   CHOOSE LIVE CLASS
========================================================= */

function chooseLiveClass(
    classes
) {

    if (
        !classes.length
    ) {

        return null;

    }


    const now =
        Date.now();


    const sorted =
        [...classes].sort(
            (a, b) =>
                getClassStartMillis(a) -
                getClassStartMillis(b)
        );


    /*
     * Prefer currently live.
     */

    const live =
        sorted.find(
            item =>
                isCurrentlyLive(
                    item,
                    now
                )
        );


    if (
        live
    ) {

        return live;

    }


    /*
     * Otherwise next upcoming class.
     */

    const upcoming =
        sorted.find(
            item =>
                getClassStartMillis(
                    item
                ) >=
                now
        );


    return (
        upcoming ||
        null
    );

}


/* =========================================================
   RENDER LIVE CLASS
========================================================= */

function renderLiveClass(
    item
) {

    if (
        !liveClassSection
    ) {

        return;

    }


    if (!item) {

        liveClassSection.classList.add(
            "hidden"
        );

        return;

    }


    liveClassSection.classList.remove(
        "hidden"
    );


    const live =
        isCurrentlyLive(
            item,
            Date.now()
        );


    if (
        liveStatus
    ) {

        liveStatus.textContent =
            live
                ? "LIVE NOW"
                : "UPCOMING";

    }


    if (
        liveHeading
    ) {

        liveHeading.textContent =
            live
                ? "Live Class"
                : "Upcoming Class";

    }


    const subject =
        item.subject ||
        item.subjectName ||
        item.title ||
        "";


    const topic =
        item.topic ||
        item.chapter ||
        item.description ||
        "";


    const teacher =
        item.teacherName ||
        item.teacher ||
        "";


    setText(
        liveSubject,
        subject
    );


    setText(
        liveTopic,
        topic
    );


    setText(
        liveTeacher,
        teacher
    );


    setText(
        liveTime,
        formatClassTime(
            item
        )
    );


    const thumbnail =
        item.thumbnailUrl ||
        item.imageUrl ||
        item.thumbnail ||
        "";


    if (
        thumbnail &&
        liveThumbnail
    ) {

        liveThumbnail.src =
            thumbnail;

        liveThumbnail.classList.remove(
            "hidden"
        );


        if (
            liveThumbnailFallback
        ) {

            liveThumbnailFallback.classList.add(
                "hidden"
            );

        }

    } else {

        if (
            liveThumbnail
        ) {

            liveThumbnail.classList.add(
                "hidden"
            );

        }


        if (
            liveThumbnailFallback
        ) {

            liveThumbnailFallback.classList.remove(
                "hidden"
            );

        }

    }


    if (
        joinLiveButton
    ) {

        const joinUrl =
            item.joinUrl ||
            item.liveUrl ||
            item.meetingUrl ||
            item.streamUrl ||
            "";


        if (
            joinUrl
        ) {

            joinLiveButton.classList.remove(
                "hidden"
            );


            joinLiveButton.onclick =
                () => {

                    window.open(
                        joinUrl,
                        "_blank",
                        "noopener,noreferrer"
                    );

                };

        } else {

            joinLiveButton.classList.add(
                "hidden"
            );

        }

    }

}


/* =========================================================
   BUTTONS
========================================================= */

function setupButtons() {

    if (
        recordingsButton
    ) {

        recordingsButton.onclick =
            () => {

                window.location.href =
                    `../live-recordings/?courseId=${encodeURIComponent(
                        currentCourseId
                    )}`;

            };

    }


    if (
        backButton
    ) {

        backButton.onclick =
            () => {

                if (
                    window.history.length >
                    1
                ) {

                    window.history.back();

                } else {

                    window.location.href =
                        "../";

                }

            };

    }


    if (
        errorBackButton
    ) {

        errorBackButton.onclick =
            () => {

                window.location.href =
                    "../";

            };

    }

}


/* =========================================================
   APP
========================================================= */

function showLoading() {

    if (
        loadingScreen
    ) {

        loadingScreen.classList.remove(
            "hidden"
        );

    }


    if (
        app
    ) {

        app.classList.add(
            "hidden"
        );

    }

}


function showApp() {

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


    if (
        errorSection
    ) {

        errorSection.classList.add(
            "hidden"
        );

    }

}


function showError(
    message
) {

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


    if (
        errorSection
    ) {

        errorSection.classList.remove(
            "hidden"
        );

    }


    setText(
        errorMessage,
        message
    );

}


/* =========================================================
   HELPERS
========================================================= */

function uniqueDisplayValues(
    values
) {

    const map =
        new Map();


    if (
        !Array.isArray(
            values
        )
    ) {

        return [];

    }


    values.forEach(
        value => {

            const text =
                String(
                    value ?? ""
                )
                .trim()
                .replace(
                    /\s+/g,
                    " "
                );


            if (!text) {

                return;

            }


            const key =
                text.toLowerCase();


            if (
                !map.has(key)
            ) {

                map.set(
                    key,
                    text
                );

            }

        }
    );


    return Array.from(
        map.values()
    );

}


/* =========================================================
   MEDIUM STRING
========================================================= */

function parseMediumString(
    value
) {

    if (
        !value
    ) {

        return [];

    }


    return String(
        value
    )
    .split(",")
    .map(
        item =>
            item.trim()
    )
    .filter(Boolean);

}


/* =========================================================
   NORMALIZE KEY
========================================================= */

function normalizeKey(
    value
) {

    return String(
        value || ""
    )
    .trim()
    .replace(
        /\s+/g,
        " "
    )
    .toLowerCase();

}


/* =========================================================
   SAME ID
========================================================= */

function isSameId(
    a,
    b
) {

    return (
        String(a || "")
            .trim() ===
        String(b || "")
            .trim()
    );

}


/* =========================================================
   DATE KEY
========================================================= */

function getDateKey(
    date
) {

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


/* =========================================================
   PARSE DATE KEY
========================================================= */

function parseDateKey(
    value
) {

    if (
        !value
    ) {

        return new Date();

    }


    const parts =
        value.split("-");


    if (
        parts.length !== 3
    ) {

        return new Date();

    }


    return new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDay(
    date
) {

    return date
        .toLocaleDateString(
            "en-IN",
            {
                weekday:
                    "short"
            }
        )
        .toUpperCase();

}


function formatMonth(
    date
) {

    return date
        .toLocaleDateString(
            "en-IN",
            {
                month:
                    "short"
            }
        )
        .toUpperCase();

}


function formatFullDate(
    date
) {

    return date
        .toLocaleDateString(
            "en-IN",
            {
                weekday:
                    "long",

                day:
                    "numeric",

                month:
                    "long",

                year:
                    "numeric"
            }
        );

}


/* =========================================================
   CLASS FORMAT
========================================================= */

function formatClass(
    value
) {

    const v =
        String(
            value || ""
        )
        .trim()
        .toUpperCase();


    const names = {

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
        names[v] ||
        value ||
        ""
    );

}


/* =========================================================
   CLASS TIME
========================================================= */

function getClassStartMillis(
    item
) {

    const dateValue =
        item.date ||
        item.dateKey ||
        "";


    const timeValue =
        item.startTime ||
        item.time ||
        "00:00";


    if (
        dateValue instanceof Date
    ) {

        const date =
            new Date(
                dateValue
            );


        return setTime(
            date,
            timeValue
        )
        .getTime();

    }


    if (
        typeof dateValue ===
        "string" &&
        /^\d{4}-\d{2}-\d{2}$/
            .test(
                dateValue
            )
    ) {

        const date =
            new Date(
                `${dateValue}T00:00:00`
            );


        return setTime(
            date,
            timeValue
        )
        .getTime();

    }


    if (
        item.startAt?.toDate
    ) {

        return item.startAt
            .toDate()
            .getTime();

    }


    return 0;

}


function setTime(
    date,
    time
) {

    const match =
        String(
            time || ""
        )
        .match(
            /^(\d{1,2}):(\d{2})/
        );


    if (
        match
    ) {

        date.setHours(
            Number(match[1]),
            Number(match[2]),
            0,
            0
        );

    }


    return date;

}


/* =========================================================
   CURRENTLY LIVE
========================================================= */

function isCurrentlyLive(
    item,
    now
) {

    const start =
        getClassStartMillis(
            item
        );


    const duration =
        Number(
            item.durationMinutes ||
            item.duration ||
            60
        );


    const end =
        start +
        duration *
        60 *
        1000;


    return (
        start > 0 &&
        now >= start &&
        now <= end
    );

}


/* =========================================================
   CLASS TIME DISPLAY
========================================================= */

function formatClassTime(
    item
) {

    const start =
        getClassStartMillis(
            item
        );


    if (
        !start
    ) {

        return (
            item.startTime ||
            item.time ||
            ""
        );

    }


    return new Date(
        start
    )
    .toLocaleTimeString(
        "en-IN",
        {
            hour:
                "numeric",

            minute:
                "2-digit"
        }
    );

}


/* =========================================================
   TEXT
========================================================= */

function setText(
    element,
    value
) {

    if (
        element
    ) {

        element.textContent =
            value ?? "";

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
   READABLE ERROR
========================================================= */

function getReadableError(
    error
) {

    console.error(
        error
    );


    if (
        error?.code ===
        "permission-denied"
    ) {

        return "Firebase denied access. Please check your Firestore rules.";

    }


    if (
        error?.code ===
        "failed-precondition"
    ) {

        return "Firestore needs an index for this query.";

    }


    return (
        error?.message ||
        "Unable to load Study Now."
    );

}


/* =========================================================
   INITIAL SUBJECT ID MAPPING
========================================================= */

setTimeout(
    async () => {

        if (
            currentCourseId
        ) {

            await loadSubjectDocumentIds();

        }

    },
    1500
);

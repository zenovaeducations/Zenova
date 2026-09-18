import { auth, db } from "../../firebase/firebase-config.js";

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

const backButton =
    document.getElementById("backButton");

const errorBackButton =
    document.getElementById("errorBackButton");

const batchName =
    document.getElementById("batchName");

const batchTitle =
    document.getElementById("batchTitle");

const batchMeta =
    document.getElementById("batchMeta");

const batchImage =
    document.getElementById("batchImage");

const batchImageFallback =
    document.getElementById("batchImageFallback");

const liveClassSection =
    document.getElementById("liveClassSection");

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

const dateSelector =
    document.getElementById("dateSelector");

const selectedDateLabel =
    document.getElementById("selectedDateLabel");

const studyPlanContainer =
    document.getElementById("studyPlanContainer");

const subjectsContainer =
    document.getElementById("subjectsContainer");

const recordingsButton =
    document.getElementById("recordingsButton");


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let enrollments = [];

let currentEnrollment = null;

let courseId = null;

let course = null;

let subjects = [];

let studyPlans = [];

let selectedDate = null;


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "../login/";

            return;

        }


        currentUser = user;


        console.log(
            "[Study Now] User:",
            currentUser.uid
        );


        try {

            await initializeStudyNow();

        } catch (error) {

            console.error(
                "[Study Now] ERROR:",
                error
            );

            showError(
                "Unable to load Study Now. " +
                (error.message || "")
            );

        }

    }
);


/* =========================================================
   MAIN INITIALIZATION
========================================================= */

async function initializeStudyNow() {

    /*
     * STEP 1
     *
     * Find every enrollment belonging to
     * the currently logged-in student.
     */

    enrollments =
        await findStudentEnrollments();


    console.log(
        "[Study Now] All enrollments:",
        enrollments
    );


    /*
     * STEP 2
     *
     * Keep only active / approved access.
     */

    const activeEnrollments =
        enrollments.filter(
            isActiveEnrollment
        );


    console.log(
        "[Study Now] Active enrollments:",
        activeEnrollments
    );


    if (!activeEnrollments.length) {

        showNoEnrollment();

        return;

    }


    /*
     * For now use the first active batch.
     *
     * Later we can add a "My Batches"
     * selector if a student owns multiple batches.
     */

    currentEnrollment =
        activeEnrollments[0];


    /*
     * Get the exact CRM course ID.
     */

    courseId =
        currentEnrollment.crmCourseId ||
        currentEnrollment.courseId ||
        currentEnrollment.batchId;


    if (!courseId) {

        throw new Error(
            "Your enrollment does not contain a course ID."
        );

    }


    console.log(
        "[Study Now] Exact course:",
        courseId
    );


    /*
     * STEP 3
     *
     * Load the actual CRM course.
     */

    await loadCourse();


    /*
     * STEP 4
     *
     * Load course subjects.
     */

    await loadSubjects();


    /*
     * STEP 5
     *
     * Load study plan.
     */

    await loadStudyPlans();


    /*
     * STEP 6
     *
     * Render page.
     */

    renderBatch();

    renderSubjects();

    renderDates();


    /*
     * STEP 7
     *
     * Live class listener.
     */

    listenForLiveClasses();


    showApp();

}


/* =========================================================
   FIND STUDENT ENROLLMENTS
========================================================= */

async function findStudentEnrollments() {

    const results =
        new Map();


    /*
     * METHOD 1
     *
     * Your existing app uses:
     *
     * studentEnrollments/{uid}_{courseId}
     *
     * But we don't know the course IDs in advance.
     */


    /*
     * METHOD 2
     *
     * Search the collection using studentUid.
     *
     * This is the main method.
     */

    try {

        const enrollmentRef =
            collection(
                db,
                "studentEnrollments"
            );


        const q =
            query(
                enrollmentRef,
                where(
                    "studentUid",
                    "==",
                    currentUser.uid
                )
            );


        const snapshot =
            await getDocs(q);


        snapshot.forEach(
            enrollmentDoc => {

                results.set(
                    enrollmentDoc.id,
                    {
                        id:
                            enrollmentDoc.id,

                        ...enrollmentDoc.data()
                    }
                );

            }
        );


    } catch (error) {

        console.warn(
            "[Study Now] studentUid query failed:",
            error
        );

    }


    /*
     * METHOD 3
     *
     * Some older records may use uid.
     */

    if (!results.size) {

        try {

            const enrollmentRef =
                collection(
                    db,
                    "studentEnrollments"
                );


            const q =
                query(
                    enrollmentRef,
                    where(
                        "uid",
                        "==",
                        currentUser.uid
                    )
                );


            const snapshot =
                await getDocs(q);


            snapshot.forEach(
                enrollmentDoc => {

                    results.set(
                        enrollmentDoc.id,
                        {
                            id:
                                enrollmentDoc.id,

                            ...enrollmentDoc.data()
                        }
                    );

                }
            );


        } catch (error) {

            console.warn(
                "[Study Now] uid query failed:",
                error
            );

        }

    }


    /*
     * Return everything we found.
     */

    return Array.from(
        results.values()
    );

}


/* =========================================================
   ACTIVE ENROLLMENT CHECK
========================================================= */

function isActiveEnrollment(
    enrollment
) {

    const status =
        String(
            enrollment.status || ""
        ).trim().toUpperCase();


    const paymentStatus =
        String(
            enrollment.paymentStatus || ""
        ).trim().toUpperCase();


    /*
     * Your actual admin approval system
     * uses ACTIVE + accessGranted.
     */

    if (
        enrollment.accessGranted === true &&
        (
            status === "ACTIVE" ||
            status === "ENROLLED"
        )
    ) {

        return true;

    }


    /*
     * Also support already-paid records
     * from the existing app.
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
   LOAD COURSE
========================================================= */

async function loadCourse() {

    const courseRef =
        doc(
            db,
            "crmCourses",
            courseId
        );


    const snapshot =
        await getDoc(courseRef);


    if (!snapshot.exists()) {

        throw new Error(
            "The enrolled course could not be found."
        );

    }


    course = {

        id:
            snapshot.id,

        ...snapshot.data()

    };


    console.log(
        "[Study Now] Course:",
        course
    );

}


/* =========================================================
   RENDER BATCH
========================================================= */

function renderBatch() {

    const name =
        course.crmCourseName ||
        course.courseName ||
        course.name ||
        currentEnrollment.courseName ||
        "Your Batch";


    const className =
        course.crmClass ||
        currentEnrollment.className ||
        "";


    const board =
        course.crmBoard ||
        currentEnrollment.board ||
        "";


    batchName.textContent =
        name;


    batchTitle.textContent =
        name;


    const meta =
        [
            className,
            board
        ]
        .filter(Boolean)
        .join(" • ");


    batchMeta.textContent =
        meta ||
        "Enrolled Batch";


    const image =
        course.crmImageUrl ||
        course.imageUrl ||
        course.thumbnailUrl ||
        course.thumbnail ||
        "";


    if (image) {

        batchImage.src =
            image;

        batchImage.classList.remove(
            "hidden"
        );

        batchImageFallback.classList.add(
            "hidden"
        );

    } else {

        batchImage.classList.add(
            "hidden"
        );

        batchImageFallback.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   LOAD SUBJECTS
========================================================= */

async function loadSubjects() {

    const subjectRef =
        collection(
            db,
            "hybridSubjects"
        );


    const results =
        new Map();


    /*
     * Existing app has used both courseId
     * and crmCourseId.
     */


    const queries = [

        query(
            subjectRef,
            where(
                "courseId",
                "==",
                courseId
            )
        ),

        query(
            subjectRef,
            where(
                "crmCourseId",
                "==",
                courseId
            )
        )

    ];


    const snapshots =
        await Promise.all(
            queries.map(
                q => getDocs(q)
            )
        );


    snapshots.forEach(
        snapshot => {

            snapshot.forEach(
                subjectDoc => {

                    const data =
                        subjectDoc.data();


                    const name =
                        data.subjectName ||
                        data.crmSubjectName ||
                        data.subject ||
                        data.name ||
                        "Subject";


                    const language =
                        data.language ||
                        data.medium ||
                        data.crmMedium ||
                        "Both";


                    /*
                     * Prevent duplicate records.
                     */

                    const key =
                        `${String(name)
                            .trim()
                            .toLowerCase()}__${String(language)
                            .trim()
                            .toLowerCase()}`;


                    if (
                        !results.has(key)
                    ) {

                        results.set(
                            key,
                            {

                                id:
                                    subjectDoc.id,

                                ...data,

                                displayName:
                                    name,

                                displayLanguage:
                                    language

                            }
                        );

                    }

                }
            );

        }
    );


    subjects =
        Array.from(
            results.values()
        );


    console.log(
        "[Study Now] Subjects:",
        subjects
    );

}


/* =========================================================
   RENDER SUBJECTS
========================================================= */

function renderSubjects() {

    subjectsContainer.innerHTML =
        "";


    if (!subjects.length) {

        subjectsContainer.innerHTML = `

            <div
                class="empty-state"
                style="grid-column:1/-1;"
            >
                Subjects are not available yet.
            </div>

        `;

        return;

    }


    subjects.forEach(
        subject => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "subject-card";


            card.innerHTML = `

                <div>

                    <div class="subject-name">
                        ${escapeHtml(
                            subject.displayName
                        )}
                    </div>

                    <div class="subject-meta">
                        ${escapeHtml(
                            subject.displayLanguage
                        )}
                    </div>

                </div>

                <div class="subject-open">
                    OPEN →
                </div>

            `;


            card.addEventListener(
                "click",
                () => {

                    window.location.href =
                        `../chapters/?courseId=${
                            encodeURIComponent(
                                courseId
                            )
                        }&subjectId=${
                            encodeURIComponent(
                                subject.id
                            )
                        }`;

                }
            );


            subjectsContainer.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   STUDY PLAN
========================================================= */

async function loadStudyPlans() {

    studyPlans = [];


    try {

        const plansRef =
            collection(
                db,
                "studyPlans"
            );


        const q =
            query(
                plansRef,
                where(
                    "courseId",
                    "==",
                    courseId
                )
            );


        const snapshot =
            await getDocs(q);


        studyPlans =
            snapshot.docs.map(
                planDoc => ({

                    id:
                        planDoc.id,

                    ...planDoc.data()

                })
            );


    } catch (error) {

        /*
         * Study plan is optional.
         *
         * If admin has not created it yet,
         * Study Now should still load.
         */

        console.warn(
            "[Study Now] Study plan unavailable:",
            error
        );


        studyPlans = [];

    }


    /*
     * Sort oldest → newest.
     */

    studyPlans.sort(
        (a, b) => {

            const dateA =
                normalizeDate(
                    a.date ||
                    a.planDate ||
                    a.scheduledDate
                );


            const dateB =
                normalizeDate(
                    b.date ||
                    b.planDate ||
                    b.scheduledDate
                );


            return String(dateA)
                .localeCompare(
                    String(dateB)
                );

        }
    );


    /*
     * Default selected date = today.
     */

    selectedDate =
        getTodayDate();

}


/* =========================================================
   DATE SELECTOR
========================================================= */

function renderDates() {

    dateSelector.innerHTML =
        "";


    const dates =
        getDateRange();


    dates.forEach(
        date => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "date-item";


            if (
                date === selectedDate
            ) {

                button.classList.add(
                    "active"
                );

            }


            button.innerHTML = `

                <span class="date-day">
                    ${formatDay(date)}
                </span>

                <span class="date-number">
                    ${getDayNumber(date)}
                </span>

            `;


            button.addEventListener(
                "click",
                () => {

                    selectedDate =
                        date;


                    renderDates();

                }
            );


            dateSelector.appendChild(
                button
            );

        }
    );


    renderSelectedStudyPlan();

}


/* =========================================================
   RENDER SELECTED PLAN
========================================================= */

function renderSelectedStudyPlan() {

    selectedDateLabel.textContent =
        formatDate(
            selectedDate
        );


    studyPlanContainer.innerHTML =
        "";


    const plans =
        studyPlans.filter(
            plan => {

                const date =
                    normalizeDate(
                        plan.date ||
                        plan.planDate ||
                        plan.scheduledDate
                    );


                return (
                    date === selectedDate
                );

            }
        );


    if (!plans.length) {

        studyPlanContainer.innerHTML = `

            <div class="empty-state">
                Not yet scheduled
            </div>

        `;

        return;

    }


    plans.forEach(
        plan => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "plan-item";


            const subject =
                plan.subjectName ||
                plan.subject ||
                "Subject";


            const topic =
                plan.topic ||
                plan.title ||
                plan.chapterName ||
                "Study session";


            const time =
                plan.time ||
                plan.startTime ||
                "";


            item.innerHTML = `

                <div>

                    <div class="plan-subject">
                        ${escapeHtml(subject)}
                    </div>

                    <div class="plan-topic">
                        ${escapeHtml(topic)}
                    </div>

                </div>

                ${
                    time
                    ? `
                        <div class="plan-time">
                            ${escapeHtml(time)}
                        </div>
                    `
                    : ""
                }

            `;


            studyPlanContainer.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   LIVE CLASSES
========================================================= */

function listenForLiveClasses() {

    const liveRef =
        collection(
            db,
            "liveClasses"
        );


    const q =
        query(
            liveRef,
            where(
                "courseId",
                "==",
                courseId
            )
        );


    onSnapshot(
        q,
        snapshot => {

            const classes =
                snapshot.docs.map(
                    liveDoc => ({

                        id:
                            liveDoc.id,

                        ...liveDoc.data()

                    })
                );


            renderLiveClass(
                classes
            );

        },
        error => {

            console.warn(
                "[Study Now] Live class error:",
                error
            );


            hideLiveClass();

        }
    );

}


/* =========================================================
   RENDER LIVE CLASS
========================================================= */

function renderLiveClass(
    classes
) {

    const now =
        new Date();


    /*
     * First priority:
     * explicitly LIVE.
     */

    let selected =
        classes.find(
            item => {

                const status =
                    String(
                        item.status || ""
                    )
                    .trim()
                    .toUpperCase();


                return (
                    status === "LIVE" ||
                    item.isLive === true
                );

            }
        );


    /*
     * Second priority:
     * upcoming class.
     */

    if (!selected) {

        selected =
            classes
                .filter(
                    item => {

                        const start =
                            parseDateTime(
                                item.startDate ||
                                item.date ||
                                item.scheduledDate,

                                item.startTime ||
                                item.time
                            );


                        return (
                            start &&
                            start > now &&
                            String(
                                item.status || ""
                            )
                            .toUpperCase()
                            !== "COMPLETED"
                        );

                    }
                )
                .sort(
                    (a, b) => {

                        const dateA =
                            parseDateTime(
                                a.startDate ||
                                a.date ||
                                a.scheduledDate,

                                a.startTime ||
                                a.time
                            );


                        const dateB =
                            parseDateTime(
                                b.startDate ||
                                b.date ||
                                b.scheduledDate,

                                b.startTime ||
                                b.time
                            );


                        return (
                            dateA - dateB
                        );

                    }
                )[0];

    }


    if (!selected) {

        hideLiveClass();

        return;

    }


    liveClassSection.classList.remove(
        "hidden"
    );


    const subject =
        selected.subjectName ||
        selected.subject ||
        "Subject";


    const topic =
        selected.topic ||
        selected.title ||
        selected.chapterName ||
        "Live Class";


    const teacher =
        selected.teacherName ||
        selected.teacher ||
        selected.facultyName ||
        "Zenova Faculty";


    liveSubject.textContent =
        subject;


    liveTopic.textContent =
        topic;


    liveTeacher.textContent =
        `Teacher: ${teacher}`;


    const image =
        selected.thumbnailUrl ||
        selected.thumbnail ||
        selected.imageUrl ||
        "";


    if (image) {

        liveThumbnail.src =
            image;

        liveThumbnail.classList.remove(
            "hidden"
        );

        liveThumbnailFallback.classList.add(
            "hidden"
        );

    } else {

        liveThumbnail.classList.add(
            "hidden"
        );

        liveThumbnailFallback.classList.remove(
            "hidden"
        );

    }


    const status =
        String(
            selected.status || ""
        )
        .trim()
        .toUpperCase();


    const isLive =
        status === "LIVE" ||
        selected.isLive === true;


    if (isLive) {

        liveTime.textContent =
            "Live now";


        joinLiveButton.textContent =
            "JOIN LIVE";

    } else {

        const start =
            parseDateTime(
                selected.startDate ||
                selected.date ||
                selected.scheduledDate,

                selected.startTime ||
                selected.time
            );


        liveTime.textContent =
            start
            ? `Starts ${formatDateTime(start)}`
            : "Upcoming class";


        joinLiveButton.textContent =
            "VIEW CLASS";

    }


    joinLiveButton.onclick =
        () => {

            const url =
                selected.liveUrl ||
                selected.meetingUrl ||
                selected.joinUrl ||
                selected.url;


            if (!url) {

                alert(
                    "The live class link has not been added yet."
                );

                return;

            }


            window.location.href =
                url;

        };

}


/* =========================================================
   HIDE LIVE CLASS
========================================================= */

function hideLiveClass() {

    liveClassSection.classList.add(
        "hidden"
    );

}


/* =========================================================
   RECORDINGS
========================================================= */

recordingsButton?.addEventListener(
    "click",
    () => {

        if (!courseId) {

            return;

        }


        window.location.href =
            `../live-recordings/?courseId=${
                encodeURIComponent(
                    courseId
                )
            }`;

    }
);


/* =========================================================
   SHOW APP
========================================================= */

function showApp() {

    loadingScreen.classList.add(
        "hidden"
    );

    errorSection.classList.add(
        "hidden"
    );

    app.classList.remove(
        "hidden"
    );

}


/* =========================================================
   NO ENROLLMENT
========================================================= */

function showNoEnrollment() {

    loadingScreen.classList.add(
        "hidden"
    );

    app.classList.add(
        "hidden"
    );

    errorSection.classList.remove(
        "hidden"
    );


    errorMessage.textContent =
        "No active course has been purchased or approved for your account yet.";

}


/* =========================================================
   ERROR
========================================================= */

function showError(
    message
) {

    loadingScreen.classList.add(
        "hidden"
    );

    app.classList.add(
        "hidden"
    );

    errorSection.classList.remove(
        "hidden"
    );


    errorMessage.textContent =
        message;

}


/* =========================================================
   BACK
========================================================= */

backButton?.addEventListener(
    "click",
    () => {

        window.history.back();

    }
);


errorBackButton?.addEventListener(
    "click",
    () => {

        window.history.back();

    }
);


/* =========================================================
   HELPERS
========================================================= */

function getTodayDate() {

    const now =
        new Date();


    const year =
        now.getFullYear();


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


function getDateRange() {

    const dates = [];

    const today =
        new Date();


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


        const year =
            date.getFullYear();


        const month =
            String(
                date.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                date.getDate()
            ).padStart(
                2,
                "0"
            );


        dates.push(
            `${year}-${month}-${day}`
        );

    }


    return dates;

}


function getDayNumber(
    dateString
) {

    return new Date(
        `${dateString}T00:00:00`
    ).getDate();

}


function formatDay(
    dateString
) {

    return new Date(
        `${dateString}T00:00:00`
    )
    .toLocaleDateString(
        "en-IN",
        {
            weekday: "short"
        }
    );

}


function formatDate(
    dateString
) {

    if (!dateString) {

        return "—";

    }


    return new Date(
        `${dateString}T00:00:00`
    )
    .toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}


function formatDateTime(
    date
) {

    return date.toLocaleString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


function normalizeDate(
    value
) {

    if (!value) {

        return null;

    }


    if (
        typeof value === "string"
    ) {

        return value.substring(
            0,
            10
        );

    }


    if (
        value &&
        typeof value.toDate === "function"
    ) {

        const date =
            value.toDate();


        const year =
            date.getFullYear();


        const month =
            String(
                date.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                date.getDate()
            ).padStart(
                2,
                "0"
            );


        return `${year}-${month}-${day}`;

    }


    return null;

}


function parseDateTime(
    dateValue,
    timeValue
) {

    const date =
        normalizeDate(
            dateValue
        );


    if (!date) {

        return null;

    }


    const time =
        timeValue || "00:00";


    const result =
        new Date(
            `${date}T${time}`
        );


    if (
        Number.isNaN(
            result.getTime()
        )
    ) {

        return null;

    }


    return result;

}


function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
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

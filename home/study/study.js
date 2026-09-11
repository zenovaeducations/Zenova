/* ============================================================
   ZENOVA EDUCATIONS
   STUDY NOW
============================================================ */

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
    onSnapshot,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* ============================================================
   ELEMENTS
============================================================ */

const loader =
    document.getElementById("loader");

const app =
    document.getElementById("app");

const backButton =
    document.getElementById("backButton");

const studentMeta =
    document.getElementById("studentMeta");

const purchasedSection =
    document.getElementById("purchasedSection");

const purchasedCourseImage =
    document.getElementById("purchasedCourseImage");

const purchasedCourseTitle =
    document.getElementById("purchasedCourseTitle");

const purchasedCourseMeta =
    document.getElementById("purchasedCourseMeta");

const courseProgress =
    document.getElementById("courseProgress");

const courseProgressBar =
    document.getElementById("courseProgressBar");

const purchasedCourseCard =
    document.getElementById("purchasedCourseCard");

const freeContentList =
    document.getElementById("freeContentList");

const liveClassesList =
    document.getElementById("liveClassesList");

const dateList =
    document.getElementById("dateList");

const scheduleList =
    document.getElementById("scheduleList");

const subjectsList =
    document.getElementById("subjectsList");

const previousDate =
    document.getElementById("previousDate");

const nextDate =
    document.getElementById("nextDate");

const errorState =
    document.getElementById("errorState");

const errorMessage =
    document.getElementById("errorMessage");

const retryButton =
    document.getElementById("retryButton");


/* ============================================================
   URL
============================================================ */

const params =
    new URLSearchParams(
        window.location.search
    );


/*
 * Continue Learning / Home can send:
 *
 * ?courseId=COURSE_ID
 *
 * We also accept batchId.
 */

const requestedCourseId =
    params.get("courseId") ||
    params.get("batchId") ||
    params.get("id") ||
    null;


/* ============================================================
   STATE
============================================================ */

let currentUser = null;

let student = null;

let purchasedCourse = null;

let purchasedEnrollment = null;

let enrollments = [];

let subjects = [];

let chapters = [];

let freeContent = [];

let liveClasses = [];

let selectedDate = new Date();

let dateOffset = 0;

let unsubscribeEnrollments = null;

let unsubscribeLiveClasses = null;


/* ============================================================
   HELPERS
============================================================ */

function $(id) {
    return document.getElementById(id);
}


function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function formatDate(date) {

    return date.toISOString()
        .split("T")[0];

}


function formatDateReadable(date) {

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    ).format(date);

}


function formatTime(value) {

    if (!value) {
        return "";
    }

    /*
     * Handles:
     *
     * "18:00"
     * "18:30"
     * Firestore Timestamp
     * JS Date
     */

    if (
        value?.toDate
    ) {
        value =
            value.toDate();
    }

    if (
        value instanceof Date
    ) {

        return value.toLocaleTimeString(
            "en-IN",
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );

    }


    const stringValue =
        String(value);

    if (
        /^\d{1,2}:\d{2}$/.test(
            stringValue
        )
    ) {

        const [
            hours,
            minutes
        ] =
            stringValue
                .split(":")
                .map(Number);

        const d =
            new Date();

        d.setHours(
            hours,
            minutes,
            0,
            0
        );

        return d.toLocaleTimeString(
            "en-IN",
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );

    }


    return stringValue;

}


function getImage(value) {

    return (
        value?.crmImageUrl ||
        value?.imageUrl ||
        value?.courseImageUrl ||
        value?.thumbnailUrl ||
        value?.thumbnail ||
        ""
    );

}


function showApp() {

    loader.classList.add(
        "hidden"
    );

    app.classList.remove(
        "hidden"
    );

}


function showError(message) {

    loader.classList.add(
        "hidden"
    );

    app.classList.remove(
        "hidden"
    );

    errorState.classList.remove(
        "hidden"
    );

    errorMessage.textContent =
        message ||
        "Something went wrong.";

}


/* ============================================================
   AUTH
============================================================ */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "../login/";

            return;

        }


        currentUser =
            user;


        try {

            await initialize();

        } catch (error) {

            console.error(
                "ZENOVA STUDY ERROR:",
                error
            );

            showError(
                error.message ||
                "Unable to load Study."
            );

        }

    }
);


/* ============================================================
   INITIALIZE
============================================================ */

async function initialize() {

    await loadStudent();

    await loadEnrollments();

    await determinePurchasedCourse();

    await loadSubjects();

    await loadFreeContent();

    startLiveClassesListener();

    renderDates();

    await loadSchedule(
        selectedDate
    );

    renderStudentMeta();

    showApp();

}


/* ============================================================
   STUDENT
============================================================ */

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


    if (!snapshot.exists()) {

        throw new Error(
            "Student profile not found."
        );

    }


    student = {
        id: snapshot.id,
        ...snapshot.data()
    };

}


/* ============================================================
   STUDENT META
============================================================ */

function renderStudentMeta() {

    const details = [];


    if (student?.className) {

        details.push(
            student.className
        );

    }


    if (student?.combination) {

        details.push(
            student.combination
        );

    }


    if (purchasedCourse?.crmCourseName) {

        details.push(
            purchasedCourse.crmCourseName
        );

    }


    studentMeta.textContent =
        details.length
            ? details.join(" • ")
            : "Your learning space";

}


/* ============================================================
   LOAD ENROLLMENTS
============================================================ */

async function loadEnrollments() {

    const enrollmentRef =
        collection(
            db,
            "studentEnrollments"
        );


    /*
     * Query only studentUid.
     *
     * We sort/filter locally to avoid
     * unnecessary composite indexes.
     */

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


    enrollments =
        snapshot.docs
            .map(item => ({
                id: item.id,
                ...item.data()
            }))
            .filter(
                enrollment =>
                    enrollment.status !==
                    "CANCELLED" &&
                    enrollment.status !==
                    "REJECTED"
            );

}


/* ============================================================
   DETERMINE PURCHASED COURSE
============================================================ */

async function determinePurchasedCourse() {

    let enrollment = null;


    /*
     * If Study was opened from Continue Learning,
     * prefer that course.
     */

    if (requestedCourseId) {

        enrollment =
            enrollments.find(
                item =>
                    (
                        item.crmCourseId ||
                        item.courseId
                    ) ===
                    requestedCourseId
            );

    }


    /*
     * Otherwise use first active enrollment.
     */

    if (!enrollment) {

        enrollment =
            enrollments.find(
                item =>
                    (
                        item.status ===
                        "ACTIVE" ||
                        item.accessGranted === true
                    )
            );

    }


    if (!enrollment) {

        purchasedCourse = null;

        purchasedEnrollment = null;

        purchasedSection.classList.add(
            "hidden"
        );

        return;

    }


    purchasedEnrollment =
        enrollment;


    const courseId =
        enrollment.crmCourseId ||
        enrollment.courseId;


    if (!courseId) {

        purchasedSection.classList.add(
            "hidden"
        );

        return;

    }


    const courseRef =
        doc(
            db,
            "crmCourses",
            courseId
        );


    const courseSnapshot =
        await getDoc(
            courseRef
        );


    if (!courseSnapshot.exists()) {

        purchasedSection.classList.add(
            "hidden"
        );

        return;

    }


    purchasedCourse = {
        id: courseSnapshot.id,
        ...courseSnapshot.data()
    };


    renderPurchasedCourse();

}


/* ============================================================
   PURCHASED COURSE
============================================================ */

function renderPurchasedCourse() {

    if (!purchasedCourse) {

        purchasedSection.classList.add(
            "hidden"
        );

        return;

    }


    purchasedSection.classList.remove(
        "hidden"
    );


    const image =
        getImage(
            purchasedCourse
        );


    purchasedCourseImage.src =
        image ||
        "../assets/images/course-placeholder.png";


    purchasedCourseTitle.textContent =
        purchasedCourse.crmCourseName ||
        "My Course";


    purchasedCourseMeta.textContent =
        [
            purchasedCourse.crmClass,
            purchasedCourse.crmBoard,
            purchasedCourse.crmMedium
        ]
            .filter(Boolean)
            .join(" • ");


    const progress =
        Number(
            purchasedEnrollment?.progress ||
            0
        );


    const safeProgress =
        Math.min(
            100,
            Math.max(
                0,
                progress
            )
        );


    courseProgress.textContent =
        `${safeProgress}%`;


    courseProgressBar.style.width =
        `${safeProgress}%`;


    purchasedCourseCard.onclick =
        () => {

            openCurrentCourse();

        };

}


/* ============================================================
   OPEN PURCHASED COURSE
============================================================ */

function openCurrentCourse() {

    if (!purchasedCourse?.id) {
        return;
    }


    /*
     * Study page already represents
     * the course.
     *
     * Clicking the course card does NOT
     * go to Batch Details.
     */

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* ============================================================
   LOAD SUBJECTS
============================================================ */

async function loadSubjects() {

    subjects = [];


    if (!purchasedCourse?.id) {

        renderSubjects();

        return;

    }


    const subjectSnapshot =
        await getDocs(
            collection(
                db,
                "hybridSubjects"
            )
        );


    const rawSubjects =
        subjectSnapshot.docs
            .map(item => ({
                id: item.id,
                ...item.data()
            }));


    const courseId =
        purchasedCourse.id;


    /*
     * Match the subject to the CRM course.
     *
     * Supports the structures already used
     * by the existing CRM content manager.
     */

    subjects =
        rawSubjects.filter(
            subject => {

                return (
                    subject.courseId ===
                    courseId ||

                    subject.crmCourseId ===
                    courseId ||

                    subject.targetCourseId ===
                    courseId ||

                    subject.courseID ===
                    courseId
                );

            }
        );


    /*
     * If the course itself contains
     * commonSubjects / subjects,
     * use their names as fallback.
     */

    if (!subjects.length) {

        const names =
            new Set([
                ...(purchasedCourse.commonSubjects || [])
                    .map(
                        item =>
                            item?.name ||
                            item
                    ),

                ...(purchasedCourse.subjects || [])
                    .map(
                        item =>
                            typeof item === "string"
                                ? item
                                : item?.name
                    )
            ]);


        if (names.size) {

            subjects =
                rawSubjects.filter(
                    subject =>
                        names.has(
                            subject.name ||
                            subject.subjectName
                        )
                );

        }

    }


    /*
     * Active only.
     */

    subjects =
        subjects.filter(
            subject =>
                subject.active !== false
        );


    /*
     * Sort by priority / order.
     */

    subjects.sort(
        (a, b) => {

            const orderA =
                Number(
                    a.priority ??
                    a.order ??
                    9999
                );

            const orderB =
                Number(
                    b.priority ??
                    b.order ??
                    9999
                );

            return orderA - orderB;

        }
    );


    await loadChapterCounts();

    renderSubjects();

}


/* ============================================================
   CHAPTER COUNTS
============================================================ */

async function loadChapterCounts() {

    if (!subjects.length) {
        return;
    }


    const chapterSnapshot =
        await getDocs(
            collection(
                db,
                "hybridChapters"
            )
        );


    chapters =
        chapterSnapshot.docs
            .map(item => ({
                id: item.id,
                ...item.data()
            }))
            .filter(
                chapter =>
                    chapter.active !== false
            );


    subjects =
        subjects.map(
            subject => {

                const subjectChapters =
                    chapters.filter(
                        chapter =>
                            chapter.subjectId ===
                            subject.id
                    );


                return {
                    ...subject,
                    chapterCount:
                        subjectChapters.length
                };

            }
        );

}


/* ============================================================
   RENDER SUBJECTS
============================================================ */

function renderSubjects() {

    subjectsList.innerHTML = "";


    if (!purchasedCourse) {

        subjectsList.innerHTML = `
            <div class="empty-message">
                Purchase a course to access its subjects.
            </div>
        `;

        return;

    }


    if (!subjects.length) {

        subjectsList.innerHTML = `
            <div class="empty-message">
                No subjects are available yet.
            </div>
        `;

        return;

    }


    subjects.forEach(
        (subject, index) => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "subject-card";


            card.innerHTML = `

                <div class="subject-icon">

                    <i class="ri-book-2-line"></i>

                </div>


                <div class="subject-info">

                    <h3>
                        ${escapeHtml(
                            subject.name ||
                            subject.subjectName ||
                            "Subject"
                        )}
                    </h3>

                    <p>
                        ${
                            subject.chapterCount || 0
                        }
                        ${
                            (subject.chapterCount || 0) === 1
                                ? "Chapter"
                                : "Chapters"
                        }
                    </p>

                </div>


                <div class="subject-arrow">

                    <i class="ri-arrow-right-s-line"></i>

                </div>

            `;


            card.addEventListener(
                "click",
                () => {

                    openSubject(
                        subject
                    );

                }
            );


            subjectsList.appendChild(
                card
            );

        }
    );

}


/* ============================================================
   OPEN SUBJECT
============================================================ */

function openSubject(subject) {

    if (!subject?.id) {
        return;
    }


    const params =
        new URLSearchParams();


    params.set(
        "subjectId",
        subject.id
    );


    if (purchasedCourse?.id) {

        params.set(
            "courseId",
            purchasedCourse.id
        );

    }


    window.location.href =
        `../chapters/?${params.toString()}`;

}


/* ============================================================
   FREE CONTENT
============================================================ */

async function loadFreeContent() {

    freeContent = [];


    /*
     * For now free learning is represented by
     * active chapters marked accessType FREE.
     *
     * This lets us build Study without creating
     * another content collection.
     */

    const snapshot =
        await getDocs(
            collection(
                db,
                "hybridChapters"
            )
        );


    freeContent =
        snapshot.docs
            .map(item => ({
                id: item.id,
                ...item.data()
            }))
            .filter(
                chapter =>
                    chapter.active !== false &&
                    (
                        chapter.accessType ===
                        "FREE" ||

                        chapter.isFree ===
                        true ||

                        chapter.free ===
                        true
                    )
            );


    freeContent.sort(
        (a, b) => {

            const numberA =
                Number(
                    a.chapterNumber ||
                    9999
                );

            const numberB =
                Number(
                    b.chapterNumber ||
                    9999
                );

            return numberA - numberB;

        }
    );


    renderFreeContent();

}


/* ============================================================
   FREE CONTENT RENDER
============================================================ */

function renderFreeContent() {

    freeContentList.innerHTML = "";


    if (!freeContent.length) {

        freeContentList.innerHTML = `
            <div class="empty-message">
                Free learning content will appear here.
            </div>
        `;

        return;

    }


    /*
     * Show a reasonable number on Study page.
     *
     * We can later add "View All".
     */

    freeContent
        .slice(0, 6)
        .forEach(
            chapter => {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "free-card";


                const thumbnail =
                    chapter.thumbnailUrl ||
                    chapter.imageUrl ||
                    "";


                card.innerHTML = `

                    <div class="free-thumbnail">

                        ${
                            thumbnail
                                ? `
                                    <img
                                        src="${escapeHtml(thumbnail)}"
                                        alt="">
                                  `
                                : `
                                    <div
                                        style="
                                            width:100%;
                                            height:100%;
                                            display:flex;
                                            align-items:center;
                                            justify-content:center;
                                            color:#6c35de;
                                            font-size:28px;
                                        ">

                                        <i class="ri-play-circle-line"></i>

                                    </div>
                                  `
                        }


                        <div class="free-play">

                            <i class="ri-play-fill"></i>

                        </div>

                    </div>


                    <div class="free-info">

                        <div class="free-label">
                            FREE
                        </div>

                        <h3>
                            ${escapeHtml(
                                chapter.title ||
                                chapter.chapterName ||
                                "Free Lesson"
                            )}
                        </h3>

                        <p>
                            Chapter
                            ${
                                chapter.chapterNumber ||
                                ""
                            }
                        </p>

                    </div>

                `;


                card.addEventListener(
                    "click",
                    () => {

                        openChapter(
                            chapter
                        );

                    }
                );


                freeContentList.appendChild(
                    card
                );

            }
        );

}


/* ============================================================
   OPEN CHAPTER
============================================================ */

function openChapter(chapter) {

    if (!chapter?.id) {
        return;
    }


    /*
     * We keep the actual video/chapter page
     * for the next stage.
     *
     * If a dedicated chapter player exists,
     * this can be changed to that route.
     */

    const params =
        new URLSearchParams();


    params.set(
        "chapterId",
        chapter.id
    );


    if (chapter.subjectId) {

        params.set(
            "subjectId",
            chapter.subjectId
        );

    }


    if (purchasedCourse?.id) {

        params.set(
            "courseId",
            purchasedCourse.id
        );

    }


    /*
     * Temporary route:
     *
     * chapters/?chapterId=...
     *
     * Later we can make:
     *
     * player/?chapterId=...
     */

    window.location.href =
        `../chapters/?${params.toString()}`;

}


/* ============================================================
   LIVE CLASSES REALTIME
============================================================ */

function startLiveClassesListener() {

    if (
        unsubscribeLiveClasses
    ) {

        unsubscribeLiveClasses();

    }


    const liveRef =
        collection(
            db,
            "liveClasses"
        );


    /*
     * We intentionally query without
     * multiple filters so this doesn't
     * require a composite index.
     */

    unsubscribeLiveClasses =
        onSnapshot(
            liveRef,
            snapshot => {

                liveClasses =
                    snapshot.docs
                        .map(item => ({
                            id: item.id,
                            ...item.data()
                        }))
                        .filter(
                            liveClass =>
                                liveClass.active !== false
                        );


                /*
                 * Show classes belonging to
                 * the purchased course.
                 */

                if (
                    purchasedCourse?.id
                ) {

                    liveClasses =
                        liveClasses.filter(
                            liveClass => {

                                const courseId =
                                    liveClass.courseId ||
                                    liveClass.crmCourseId;


                                return (
                                    !courseId ||
                                    courseId ===
                                    purchasedCourse.id
                                );

                            }
                        );

                }


                liveClasses.sort(
                    sortByTime
                );


                renderLiveClasses();

                loadSchedule(
                    selectedDate
                );

            },
            error => {

                console.error(
                    "Live class listener:",
                    error
                );

                liveClassesList.innerHTML = `
                    <div class="empty-message">
                        Live classes are unavailable right now.
                    </div>
                `;

            }
        );

}


/* ============================================================
   SORT TIME
============================================================ */

function sortByTime(a, b) {

    const timeA =
        String(
            a.startTime ||
            a.time ||
            "23:59"
        );

    const timeB =
        String(
            b.startTime ||
            b.time ||
            "23:59"
        );


    return timeA.localeCompare(
        timeB
    );

}


/* ============================================================
   RENDER LIVE CLASSES
============================================================ */

function renderLiveClasses() {

    liveClassesList.innerHTML = "";


    const today =
        formatDate(
            new Date()
        );


    const todayClasses =
        liveClasses.filter(
            liveClass => {

                const date =
                    getClassDate(
                        liveClass
                    );

                return date ===
                    today;

            }
        );


    if (!todayClasses.length) {

        liveClassesList.innerHTML = `
            <div class="empty-message">
                No live classes scheduled for today.
            </div>
        `;

        return;

    }


    todayClasses.forEach(
        liveClass => {

            liveClassesList.appendChild(
                createLiveCard(
                    liveClass
                )
            );

        }
    );

}


/* ============================================================
   CLASS DATE
============================================================ */

function getClassDate(liveClass) {

    const value =
        liveClass.date ||
        liveClass.classDate ||
        liveClass.startDate;


    if (!value) {
        return "";
    }


    if (
        value?.toDate
    ) {

        return formatDate(
            value.toDate()
        );

    }


    if (
        value instanceof Date
    ) {

        return formatDate(
            value
        );

    }


    return String(
        value
    ).split("T")[0];

}


/* ============================================================
   LIVE CARD
============================================================ */

function createLiveCard(liveClass) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "live-card";


    const thumbnail =
        liveClass.thumbnailUrl ||
        liveClass.imageUrl ||
        liveClass.thumbnail ||
        "";


    const isLive =
        liveClass.status ===
        "LIVE" ||
        liveClass.isLive ===
        true;


    const title =
        liveClass.title ||
        liveClass.subjectName ||
        liveClass.subject ||
        "Live Class";


    const subject =
        liveClass.subjectName ||
        liveClass.subject ||
        "";


    const time =
        formatTime(
            liveClass.startTime ||
            liveClass.time
        );


    card.innerHTML = `

        <div class="live-thumbnail">

            ${
                thumbnail
                    ? `
                        <img
                            src="${escapeHtml(thumbnail)}"
                            alt="">
                      `
                    : `
                        <div
                            style="
                                width:100%;
                                height:100%;
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                color:#6c35de;
                                font-size:25px;
                            ">

                            <i class="ri-live-line"></i>

                        </div>
                      `
            }

        </div>


        <div class="live-content">

            <div class="live-status">

                <span class="live-status-dot"></span>

                ${
                    isLive
                        ? "LIVE NOW"
                        : "SCHEDULED"
                }

            </div>


            <h3>
                ${escapeHtml(title)}
            </h3>


            <p>
                ${
                    escapeHtml(subject)
                }

                ${
                    time
                        ? ` • ${escapeHtml(time)}`
                        : ""
                }
            </p>

        </div>


        <button
            class="
                join-button
                ${isLive ? "" : "disabled"}
            "
            ${isLive ? "" : "disabled"}>

            ${
                isLive
                    ? "JOIN NOW"
                    : "UPCOMING"
            }

        </button>

    `;


    const button =
        card.querySelector(
            ".join-button"
        );


    if (isLive) {

        button.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                joinLiveClass(
                    liveClass
                );

            }
        );

    }


    return card;

}


/* ============================================================
   JOIN LIVE CLASS
============================================================ */

function joinLiveClass(liveClass) {

    const link =
        liveClass.joinUrl ||
        liveClass.meetingUrl ||
        liveClass.liveUrl ||
        liveClass.roomUrl;


    if (!link) {

        alert(
            "The live class link is not available yet."
        );

        return;

    }


    window.location.href =
        link;

}


/* ============================================================
   DATES
============================================================ */

function renderDates() {

    dateList.innerHTML = "";


    /*
     * Five dates around selectedDate.
     */

    for (
        let i = 0;
        i < 5;
        i++
    ) {

        const date =
            new Date(
                selectedDate
            );


        date.setDate(
            date.getDate() +
            i -
            2
        );


        const item =
            document.createElement(
                "button"
            );


        item.className =
            "date-item";


        if (
            formatDate(date) ===
            formatDate(selectedDate)
        ) {

            item.classList.add(
                "active"
            );

        }


        const day =
            new Intl.DateTimeFormat(
                "en-IN",
                {
                    weekday: "short"
                }
            ).format(date);


        item.innerHTML = `

            <span class="day">
                ${day}
            </span>

            <span class="number">
                ${date.getDate()}
            </span>

        `;


        item.addEventListener(
            "click",
            async () => {

                selectedDate =
                    date;


                renderDates();

                await loadSchedule(
                    selectedDate
                );

            }
        );


        dateList.appendChild(
            item
        );

    }

}


/* ============================================================
   DATE ARROWS
============================================================ */

previousDate.addEventListener(
    "click",
    async () => {

        selectedDate =
            new Date(
                selectedDate
            );


        selectedDate.setDate(
            selectedDate.getDate() -
            1
        );


        renderDates();

        await loadSchedule(
            selectedDate
        );

    }
);


nextDate.addEventListener(
    "click",
    async () => {

        selectedDate =
            new Date(
                selectedDate
            );


        selectedDate.setDate(
            selectedDate.getDate() +
            1
        );


        renderDates();

        await loadSchedule(
            selectedDate
        );

    }
);


/* ============================================================
   LOAD SCHEDULE
============================================================ */

async function loadSchedule(date) {

    scheduleList.innerHTML = `
        <div class="section-loading">
            Loading schedule...
        </div>
    `;


    const targetDate =
        formatDate(date);


    const classes =
        liveClasses.filter(
            liveClass =>
                getClassDate(
                    liveClass
                ) ===
                targetDate
        );


    renderSchedule(
        classes
    );

}


/* ============================================================
   RENDER SCHEDULE
============================================================ */

function renderSchedule(classes) {

    scheduleList.innerHTML = "";


    if (!classes.length) {

        scheduleList.innerHTML = `
            <div class="empty-message">
                No classes scheduled for
                ${formatDateReadable(selectedDate)}.
            </div>
        `;

        return;

    }


    classes
        .sort(sortByTime)
        .forEach(
            liveClass => {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "schedule-card";


                const time =
                    formatTime(
                        liveClass.startTime ||
                        liveClass.time
                    );


                const title =
                    liveClass.title ||
                    liveClass.subjectName ||
                    liveClass.subject ||
                    "Class";


                const subject =
                    liveClass.subjectName ||
                    liveClass.subject ||
                    "";


                card.innerHTML = `

                    <div class="schedule-time">

                        ${escapeHtml(
                            time || "--"
                        )}

                    </div>


                    <div class="schedule-content">

                        <h3>
                            ${escapeHtml(title)}
                        </h3>

                        <p>
                            ${escapeHtml(subject)}
                        </p>

                    </div>


                    <div class="schedule-type">

                        ${
                            liveClass.type ||
                            "LIVE"
                        }

                    </div>

                `;


                scheduleList.appendChild(
                    card
                );

            }
        );

}


/* ============================================================
   BACK BUTTON
============================================================ */

backButton.addEventListener(
    "click",
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

    }
);


/* ============================================================
   RETRY
============================================================ */

retryButton.addEventListener(
    "click",
    () => {

        window.location.reload();

    }
);


/* ============================================================
   CLEANUP
============================================================ */

window.addEventListener(
    "beforeunload",
    () => {

        if (
            unsubscribeEnrollments
        ) {

            unsubscribeEnrollments();

        }


        if (
            unsubscribeLiveClasses
        ) {

            unsubscribeLiveClasses();

        }

    }
);

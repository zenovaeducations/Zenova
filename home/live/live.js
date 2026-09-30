import { auth, db } from "../../firebase/firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";



/* =========================================================
   DOM
========================================================= */

const loadingState =
    document.getElementById("loadingState");

const errorState =
    document.getElementById("errorState");

const errorText =
    document.getElementById("errorText");

const liveApp =
    document.getElementById("liveApp");

const todayClasses =
    document.getElementById("todayClasses");

const todayEmpty =
    document.getElementById("todayEmpty");

const todayDate =
    document.getElementById("todayDate");

const datePicker =
    document.getElementById("datePicker");

const selectedDateText =
    document.getElementById("selectedDateText");

const selectedDateClasses =
    document.getElementById("selectedDateClasses");

const selectedDateEmpty =
    document.getElementById("selectedDateEmpty");

const previousDate =
    document.getElementById("previousDate");

const nextDate =
    document.getElementById("nextDate");

const subjectGrid =
    document.getElementById("subjectGrid");

const subjectsEmpty =
    document.getElementById("subjectsEmpty");

const subjectHistorySection =
    document.getElementById("subjectHistorySection");

const historySubjectName =
    document.getElementById("historySubjectName");

const subjectHistory =
    document.getElementById("subjectHistory");

const historyEmpty =
    document.getElementById("historyEmpty");

const closeHistory =
    document.getElementById("closeHistory");

const backButton =
    document.getElementById("backButton");

const retryButton =
    document.getElementById("retryButton");



/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let student = null;

let studentCourse = null;

let allClasses = [];

let allSubjects = [];

let selectedDate = getTodayString();



/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "../../account/login/";

            return;

        }


        currentUser = user;


        try {

            await loadPage();

        }

        catch (error) {

            console.error(
                "LIVE PAGE ERROR:",
                error
            );

            showError(
                error.message ||
                "Unable to load live classes."
            );

        }

    }
);



/* =========================================================
   MAIN LOAD
========================================================= */

async function loadPage() {

    showLoading();


    /*
     * Student
     */

    const studentRef =
        doc(
            db,
            "zen2Students",
            currentUser.uid
        );


    const studentSnap =
        await getDoc(
            studentRef
        );


    if (!studentSnap.exists()) {

        throw new Error(
            "Student profile was not found."
        );

    }


    student = {
        id: studentSnap.id,
        ...studentSnap.data()
    };


    /*
     * Find student's class
     */

    const className =
        getStudentClass(
            student
        );


    if (!className) {

        throw new Error(
            "Your class is not assigned yet."
        );

    }


    /*
     * Load courses
     */

    const coursesSnap =
        await getDocs(
            collection(
                db,
                "zen2Courses"
            )
        );


    const courses =
        coursesSnap.docs
            .map(
                item => ({

                    id: item.id,

                    ...item.data()

                })
            )
            .filter(
                item =>
                    item.active !== false
            );


    /*
     * Find matching course.
     */

    studentCourse =
        courses.find(
            course =>
                normalizeClass(
                    getCourseClass(course)
                ) ===
                normalizeClass(
                    className
                )
        );


    /*
     * If student's document already
     * has courseId, prefer it.
     */

    if (
        student.courseId ||
        student.batchId
    ) {

        const directId =
            student.courseId ||
            student.batchId;


        const directCourse =
            courses.find(
                item =>
                    item.id === directId
            );


        if (directCourse) {

            studentCourse =
                directCourse;

        }

    }


    if (!studentCourse) {

        throw new Error(
            `No batch was found for ${className}.`
        );

    }


    /*
     * Load live classes.
     */

    const liveSnap =
        await getDocs(
            collection(
                db,
                "liveClasses"
            )
        );


    allClasses =
        liveSnap.docs
            .map(
                item => ({

                    id: item.id,

                    ...item.data()

                })
            )
            .filter(
                item =>
                    item.active !== false
            )
            .filter(
                item =>
                    belongsToCourse(
                        item,
                        studentCourse
                    )
            );


    /*
     * Load subjects.
     */

    const subjectsSnap =
        await getDocs(
            collection(
                db,
                "zen2Subjects"
            )
        );


    allSubjects =
        subjectsSnap.docs
            .map(
                item => ({

                    id: item.id,

                    ...item.data()

                })
            )
            .filter(
                item =>
                    item.courseId ===
                    studentCourse.id
            )
            .filter(
                item =>
                    item.active !== false
            )
            .sort(
                sortSubjects
            );


    /*
     * Date setup
     */

    datePicker.value =
        selectedDate;


    renderToday();

    renderSelectedDate();

    renderSubjects();


    showApp();

}



/* =========================================================
   TODAY
========================================================= */

function renderToday() {

    const today =
        getTodayString();


    todayDate.textContent =
        formatLongDate(
            today
        );


    const list =
        getClassesForDate(
            today
        );


    if (!list.length) {

        todayClasses.innerHTML =
            "";

        todayEmpty.classList.remove(
            "hidden"
        );

        return;

    }


    todayEmpty.classList.add(
        "hidden"
    );


    todayClasses.innerHTML =
        list
            .map(
                item =>
                    createLiveCard(
                        item
                    )
            )
            .join("");

}



/* =========================================================
   DATE SELECTOR
========================================================= */

datePicker.addEventListener(
    "change",
    () => {

        if (!datePicker.value) {

            return;

        }


        selectedDate =
            datePicker.value;


        renderSelectedDate();

    }
);


previousDate.addEventListener(
    "click",
    () => {

        selectedDate =
            shiftDate(
                selectedDate,
                -1
            );

        datePicker.value =
            selectedDate;

        renderSelectedDate();

    }
);


nextDate.addEventListener(
    "click",
    () => {

        selectedDate =
            shiftDate(
                selectedDate,
                1
            );

        datePicker.value =
            selectedDate;

        renderSelectedDate();

    }
);



function renderSelectedDate() {

    selectedDateText.textContent =
        formatLongDate(
            selectedDate
        );


    const list =
        getClassesForDate(
            selectedDate
        );


    if (!list.length) {

        selectedDateClasses.innerHTML =
            "";

        selectedDateEmpty.classList.remove(
            "hidden"
        );

        return;

    }


    selectedDateEmpty.classList.add(
        "hidden"
    );


    selectedDateClasses.innerHTML =
        list
            .map(
                item =>
                    createDateClassCard(
                        item
                    )
            )
            .join("");

}



/* =========================================================
   SUBJECTS
========================================================= */

function renderSubjects() {

    if (!allSubjects.length) {

        subjectGrid.innerHTML =
            "";

        subjectsEmpty.classList.remove(
            "hidden"
        );

        return;

    }


    subjectsEmpty.classList.add(
        "hidden"
    );


    subjectGrid.innerHTML =
        allSubjects
            .map(
                subject =>
                    createSubjectCard(
                        subject
                    )
            )
            .join("");


    document
        .querySelectorAll(
            "[data-subject-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        showSubjectHistory(
                            button.dataset.subjectId
                        );

                    }
                );

            }
        );

}



/* =========================================================
   SUBJECT HISTORY
========================================================= */

function showSubjectHistory(
    subjectId
) {

    const subject =
        allSubjects.find(
            item =>
                item.id ===
                subjectId
        );


    if (!subject) {

        return;

    }


    const history =
        allClasses
            .filter(
                item =>
                    item.subjectId ===
                    subjectId
            )
            .filter(
                item =>
                    getClassStatus(
                        item
                    ).status ===
                    "ENDED"
            )
            .sort(
                (a, b) =>
                    getStartMillis(b) -
                    getStartMillis(a)
            );


    historySubjectName.textContent =
        subject.name ||
        subject.title ||
        "Previous Classes";


    subjectHistorySection.classList.remove(
        "hidden"
    );


    if (!history.length) {

        subjectHistory.innerHTML =
            "";

        historyEmpty.classList.remove(
            "hidden"
        );

    }

    else {

        historyEmpty.classList.add(
            "hidden"
        );


        subjectHistory.innerHTML =
            history
                .map(
                    item =>
                        createHistoryCard(
                            item
                        )
                )
                .join("");

    }


    subjectHistorySection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}



closeHistory.addEventListener(
    "click",
    () => {

        subjectHistorySection.classList.add(
            "hidden"
        );

    }
);



/* =========================================================
   CARD — TODAY
========================================================= */

function createLiveCard(
    item
) {

    const status =
        getClassStatus(
            item
        );


    const provider =
        getProvider(
            item
        );


    let action =
        "";


    if (
        status.status ===
        "LIVE"
    ) {

        action = `
            <button
                type="button"
                class="action-button live-button"
                data-join="${escapeAttribute(item.id)}"
            >
                JOIN CLASS
            </button>
        `;

    }

    else if (
        status.status ===
        "ENDED"
    ) {

        if (
            hasRecording(
                item
            )
        ) {

            action = `
                <button
                    type="button"
                    class="action-button watch-button"
                    data-recording="${escapeAttribute(item.id)}"
                >
                    WATCH RECORDING
                </button>
            `;

        }

        else {

            action = `
                <span class="provider-label">
                    Class ended
                </span>
            `;

        }

    }

    else {

        action = `
            <span class="provider-label">
                Starts ${formatTime(item)}
            </span>
        `;

    }


    return `

        <article
            class="live-card ${
                status.status === "LIVE"
                    ? "live-now"
                    : ""
            }"
        >

            <div class="live-card-top">

                <div>

                    <h3 class="live-card-title">
                        ${escapeHtml(
                            item.title ||
                            "Live Class"
                        )}
                    </h3>

                    <div class="live-card-subject">

                        ${escapeHtml(
                            item.subjectName ||
                            "Class"
                        )}

                        ${
                            item.chapterName
                                ? `
                                    ·
                                    ${escapeHtml(
                                        item.chapterName
                                    )}
                                `
                                : ""
                        }

                    </div>

                </div>


                <span
                    class="status-pill ${
                        status.status === "LIVE"
                            ? "live"
                            : status.status === "UPCOMING"
                                ? "upcoming"
                                : "missed"
                    }"
                >
                    ${escapeHtml(
                        status.label
                    )}
                </span>

            </div>


            <div class="class-details">

                <span>
                    🕒 ${escapeHtml(
                        formatTimeRange(item)
                    )}
                </span>

                <span>
                    👨‍🏫 ${escapeHtml(
                        item.teacherName ||
                        item.facultyName ||
                        "Faculty"
                    )}
                </span>

            </div>


            <div class="class-action-row">

                <span
                    class="provider-label ${
                        item.liveType === "ZOOM"
                            ? "zoom"
                            : ""
                    }"
                >
                    ${escapeHtml(
                        provider
                    )}
                </span>


                <div>
                    ${action}
                </div>

            </div>

        </article>

    `;

}



/* =========================================================
   DATE CLASS CARD
========================================================= */

function createDateClassCard(
    item
) {

    const status =
        getClassStatus(
            item
        );


    let action =
        "";


    if (
        status.status ===
        "LIVE"
    ) {

        action = `
            <button
                type="button"
                class="action-button live-button"
                data-join="${escapeAttribute(item.id)}"
            >
                JOIN CLASS
            </button>
        `;

    }

    else if (
        status.status ===
        "ENDED" &&
        hasRecording(item)
    ) {

        action = `
            <button
                type="button"
                class="action-button watch-button"
                data-recording="${escapeAttribute(item.id)}"
            >
                WATCH RECORDING
            </button>
        `;

    }

    else if (
        status.status ===
        "UPCOMING"
    ) {

        action = `
            <span class="provider-label">
                UPCOMING
            </span>
        `;

    }


    return `

        <article class="date-class-card">

            <div class="date-class-main">

                <div class="date-class-title">

                    ${escapeHtml(
                        item.title ||
                        "Live Class"
                    )}

                </div>


                <div class="date-class-info">

                    ${escapeHtml(
                        item.subjectName ||
                        "Subject"
                    )}

                    ${
                        item.chapterName
                            ? `
                                ·
                                ${escapeHtml(
                                    item.chapterName
                                )}
                            `
                            : ""
                    }

                    <br>

                    ${escapeHtml(
                        item.teacherName ||
                        item.facultyName ||
                        "Faculty"
                    )}

                    ·

                    ${escapeHtml(
                        formatTimeRange(item)
                    )}

                </div>

            </div>


            <div class="date-class-action">

                ${action}

            </div>

        </article>

    `;

}



/* =========================================================
   SUBJECT CARD
========================================================= */

function createSubjectCard(
    subject
) {

    const name =
        subject.name ||
        subject.title ||
        "Subject";


    const count =
        allClasses.filter(
            item =>
                item.subjectId ===
                subject.id
        ).length;


    return `

        <button
            type="button"
            class="subject-card"
            data-subject-id="${escapeAttribute(subject.id)}"
        >

            <div class="subject-icon">

                ${escapeHtml(
                    getInitial(name)
                )}

            </div>


            <div class="subject-name">

                <strong>
                    ${escapeHtml(
                        name
                    )}
                </strong>

                <span>
                    ${count}
                    ${
                        count === 1
                            ? "class"
                            : "classes"
                    }
                </span>

            </div>


            <div class="subject-arrow">
                ›
            </div>

        </button>

    `;

}



/* =========================================================
   HISTORY CARD
========================================================= */

function createHistoryCard(
    item
) {

    return `

        <article class="history-card">

            <div>

                <div class="history-title">

                    ${escapeHtml(
                        item.title ||
                        "Live Class"
                    )}

                </div>


                <div class="history-info">

                    ${escapeHtml(
                        item.chapterName ||
                        "Class"
                    )}

                    <br>

                    ${escapeHtml(
                        item.teacherName ||
                        item.facultyName ||
                        "Faculty"
                    )}

                    ·

                    ${escapeHtml(
                        formatHistoryDate(item)
                    )}

                </div>

            </div>


            ${
                hasRecording(item)
                    ? `
                        <button
                            type="button"
                            class="history-watch"
                            data-recording="${escapeAttribute(item.id)}"
                        >
                            WATCH
                        </button>
                    `
                    : `
                        <span class="provider-label">
                            NO RECORDING
                        </span>
                    `
            }

        </article>

    `;

}



/* =========================================================
   EVENT DELEGATION
========================================================= */

document.addEventListener(
    "click",
    event => {

        const join =
            event.target.closest(
                "[data-join]"
            );


        if (join) {

            openLiveClass(
                join.dataset.join
            );

            return;

        }


        const recording =
            event.target.closest(
                "[data-recording]"
            );


        if (recording) {

            openRecording(
                recording.dataset.recording
            );

        }

    }
);



/* =========================================================
   ZOOM CONNECTION
========================================================= */

function openLiveClass(
    liveClassId
) {

    const item =
        allClasses.find(
            classItem =>
                classItem.id ===
                liveClassId
        );


    if (!item) {

        showToast(
            "Live class not found."
        );

        return;

    }


    const status =
        getClassStatus(
            item
        );


    /*
     * Only allow joining an actual
     * currently-live class.
     */

    if (
        status.status !==
        "LIVE"
    ) {

        showToast(
            "This class is not live right now."
        );

        return;

    }


    /*
     * NEW ZOOM ROUTE
     *
     * The Zoom Meeting SDK will be
     * loaded by /home/liveclass/
     */

    window.location.href =
        `../liveclass/?liveClassId=${
            encodeURIComponent(
                liveClassId
            )
        }`;

}



/* =========================================================
   RECORDING
========================================================= */

function openRecording(
    liveClassId
) {

    const item =
        allClasses.find(
            classItem =>
                classItem.id ===
                liveClassId
        );


    if (!item) {

        showToast(
            "Recording not found."
        );

        return;

    }


    if (
        !hasRecording(item)
    ) {

        showToast(
            "Recording is not available yet."
        );

        return;

    }


    /*
     * Common Zenova Video Player
     */

    window.location.href =
        `../videoplayer/?liveClassId=${
            encodeURIComponent(
                liveClassId
            )
        }`;

}



/* =========================================================
   RECORDING DETECTION
========================================================= */

function hasRecording(
    item
) {

    /*
     * IMPORTANT:
     *
     * youtubeLiveUrl is NOT considered
     * a recording.
     *
     * A live source alone does not mean
     * a replay exists.
     */

    return Boolean(

        item.recordingUrl ||

        item.recordedUrl ||

        item.replayUrl ||

        item.recordedVideoUrl ||

        item.recordingVideoUrl ||

        (
            item.videoUrl &&
            item.liveType ===
            "RECORDED_VIDEO"
        ) ||

        item.recordingContentId

    );

}



/* =========================================================
   CLASS STATUS
========================================================= */

function getClassStatus(
    item
) {

    const now =
        Date.now();


    const start =
        getStartMillis(
            item
        );


    let end =
        getEndMillis(
            item
        );


    /*
     * If end time is unavailable,
     * assume two hours.
     */

    if (
        !end ||
        end <= start
    ) {

        end =
            start +
            (
                2 *
                60 *
                60 *
                1000
            );

    }


    if (
        now <
        start
    ) {

        return {

            status: "UPCOMING",

            label: "UPCOMING"

        };

    }


    if (
        now >= start &&
        now <= end
    ) {

        return {

            status: "LIVE",

            label: "LIVE NOW"

        };

    }


    return {

        status: "ENDED",

        label: "MISSED"

    };

}



/* =========================================================
   DATE / TIME
========================================================= */

function getStartMillis(
    item
) {

    if (
        item.startDateTime &&
        typeof item.startDateTime.toMillis ===
        "function"
    ) {

        return item.startDateTime.toMillis();

    }


    if (
        item.startDateTime &&
        item.startDateTime.seconds
    ) {

        return (
            Number(
                item.startDateTime.seconds
            ) * 1000
        );

    }


    return parseIndiaDateTime(
        item.scheduledDate,
        item.scheduledTime ||
        item.startTime
    );

}



function getEndMillis(
    item
) {

    if (
        item.endDateTime &&
        typeof item.endDateTime.toMillis ===
        "function"
    ) {

        return item.endDateTime.toMillis();

    }


    if (
        item.endDateTime &&
        item.endDateTime.seconds
    ) {

        return (
            Number(
                item.endDateTime.seconds
            ) * 1000
        );

    }


    return parseIndiaDateTime(
        item.endDate ||
        item.scheduledDate,
        item.endTime
    );

}



function parseIndiaDateTime(
    date,
    time
) {

    if (
        !date ||
        !time
    ) {

        return 0;

    }


    return new Date(
        `${date}T${time}:00+05:30`
    ).getTime();

}



function formatTime(
    item
) {

    const millis =
        getStartMillis(
            item
        );


    if (!millis) {

        return "--";

    }


    return new Intl.DateTimeFormat(
        "en-IN",
        {

            hour: "numeric",

            minute: "2-digit",

            hour12: true,

            timeZone:
                "Asia/Kolkata"

        }
    ).format(
        new Date(millis)
    );

}



function formatTimeRange(
    item
) {

    const start =
        getStartMillis(
            item
        );


    const end =
        getEndMillis(
            item
        );


    if (!start) {

        return "Time unavailable";

    }


    const formatter =
        new Intl.DateTimeFormat(
            "en-IN",
            {

                hour: "numeric",

                minute: "2-digit",

                hour12: true,

                timeZone:
                    "Asia/Kolkata"

            }
        );


    const startText =
        formatter.format(
            new Date(start)
        );


    if (!end) {

        return startText;

    }


    return `${startText} – ${
        formatter.format(
            new Date(end)
        )
    }`;

}



/* =========================================================
   DATE HELPERS
========================================================= */

function getTodayString() {

    const parts =
        new Intl.DateTimeFormat(
            "en-CA",
            {

                timeZone:
                    "Asia/Kolkata",

                year: "numeric",

                month: "2-digit",

                day: "2-digit"

            }
        ).formatToParts(
            new Date()
        );


    const values = {};


    parts.forEach(
        part => {

            if (
                part.type !==
                "literal"
            ) {

                values[part.type] =
                    part.value;

            }

        }
    );


    return `${
        values.year
    }-${
        values.month
    }-${
        values.day
    }`;

}



function shiftDate(
    dateString,
    amount
) {

    const date =
        new Date(
            `${dateString}T12:00:00+05:30`
        );


    date.setDate(
        date.getDate() +
        amount
    );


    return formatDateInput(
        date
    );

}



function formatDateInput(
    date
) {

    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1
        ).padStart(2, "0"),
        String(
            date.getDate()
        ).padStart(2, "0")
    ].join("-");

}



function formatLongDate(
    dateString
) {

    if (!dateString) {

        return "";

    }


    return new Intl.DateTimeFormat(
        "en-IN",
        {

            weekday: "short",

            day: "numeric",

            month: "short",

            year: "numeric",

            timeZone:
                "Asia/Kolkata"

        }
    ).format(
        new Date(
            `${dateString}T12:00:00+05:30`
        )
    );

}



function formatHistoryDate(
    item
) {

    const millis =
        getStartMillis(
            item
        );


    if (!millis) {

        return "Date unavailable";

    }


    return new Intl.DateTimeFormat(
        "en-IN",
        {

            weekday: "short",

            day: "numeric",

            month: "short",

            year: "numeric",

            hour: "numeric",

            minute: "2-digit",

            hour12: true,

            timeZone:
                "Asia/Kolkata"

        }
    ).format(
        new Date(millis)
    );

}



/* =========================================================
   CLASS FILTER
========================================================= */

function getClassesForDate(
    dateString
) {

    return allClasses
        .filter(
            item =>
                getClassDate(
                    item
                ) ===
                dateString
        )
        .sort(
            (a, b) =>
                getStartMillis(a) -
                getStartMillis(b)
        );

}



function getClassDate(
    item
) {

    const millis =
        getStartMillis(
            item
        );


    if (!millis) {

        return "";

    }


    const parts =
        new Intl.DateTimeFormat(
            "en-CA",
            {

                timeZone:
                    "Asia/Kolkata",

                year: "numeric",

                month: "2-digit",

                day: "2-digit"

            }
        ).formatToParts(
            new Date(millis)
        );


    const values = {};


    parts.forEach(
        part => {

            if (
                part.type !==
                "literal"
            ) {

                values[part.type] =
                    part.value;

            }

        }
    );


    return `${
        values.year
    }-${
        values.month
    }-${
        values.day
    }`;

}



function belongsToCourse(
    item,
    course
) {

    if (
        item.courseId
    ) {

        return (
            item.courseId ===
            course.id
        );

    }


    return normalizeClass(
        item.courseClass ||
        item.className ||
        item.standard ||
        ""
    ) ===
    normalizeClass(
        getCourseClass(course)
    );

}



function getStudentClass(
    data
) {

    return (
        data.className ||
        data.class ||
        data.standard ||
        data.grade ||
        data.targetClass ||
        ""
    );

}



function getCourseClass(
    data
) {

    return (
        data.className ||
        data.courseClass ||
        data.targetClass ||
        data.standard ||
        data.grade ||
        data.crmClass ||
        ""
    );

}



function normalizeClass(
    value
) {

    const text =
        String(
            value ||
            ""
        )
            .trim()
            .toLowerCase()
            .replace(
                /\s+/g,
                ""
            );


    if (
        text === "10" ||
        text === "10th" ||
        text === "class10" ||
        text === "10thstandard"
    ) {

        return "10th";

    }


    if (
        text === "9" ||
        text === "9th" ||
        text === "class9" ||
        text === "9thstandard"
    ) {

        return "9th";

    }


    if (
        text === "8" ||
        text === "8th" ||
        text === "class8" ||
        text === "8thstandard"
    ) {

        return "8th";

    }


    if (
        text.includes("1stpuc") ||
        text.includes("puc1")
    ) {

        return "1stpuc";

    }


    if (
        text.includes("2ndpuc") ||
        text.includes("puc2")
    ) {

        return "2ndpuc";

    }


    return text;

}



/* =========================================================
   PROVIDER
========================================================= */

function getProvider(
    item
) {

    if (
        item.liveType ===
        "ZOOM"
    ) {

        return "ZOOM CLASSROOM";

    }


    if (
        item.liveType ===
        "YOUTUBE_LIVE"
    ) {

        return "YOUTUBE LIVE";

    }


    if (
        item.liveType ===
        "RECORDED_VIDEO"
    ) {

        return "RECORDED CLASS";

    }


    if (
        item.liveType ===
        "EXTERNAL_VIDEO"
    ) {

        return "LIVE CLASS";

    }


    return "ZENOVA LIVE";

}



/* =========================================================
   SUBJECT SORT
========================================================= */

function sortSubjects(
    a,
    b
) {

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



/* =========================================================
   INITIAL
========================================================= */

function getInitial(
    value
) {

    return String(
        value ||
        "Z"
    )
        .trim()
        .charAt(0)
        .toUpperCase() ||
        "Z";

}



/* =========================================================
   NAVIGATION
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

                    window.location.href =
                        button.dataset.nav;

                }
            );

        }
    );


backButton.addEventListener(
    "click",
    () => {

        if (
            document.referrer &&
            document.referrer.includes(
                window.location.origin
            )
        ) {

            history.back();

        }

        else {

            window.location.href =
                "../../home/";

        }

    }
);


retryButton.addEventListener(
    "click",
    () => {

        window.location.reload();

    }
);



/* =========================================================
   UI STATES
========================================================= */

function showLoading() {

    loadingState.classList.remove(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

    liveApp.classList.add(
        "hidden"
    );

}



function showApp() {

    loadingState.classList.add(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

    liveApp.classList.remove(
        "hidden"
    );

}



function showError(
    message
) {

    loadingState.classList.add(
        "hidden"
    );

    liveApp.classList.add(
        "hidden"
    );

    errorState.classList.remove(
        "hidden"
    );

    errorText.textContent =
        message;

}



/* =========================================================
   TOAST
========================================================= */

function showToast(
    message
) {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;

    toast.classList.add(
        "show"
    );


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
   ESCAPE
========================================================= */

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



function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}

/* =========================================================
   ZENOVA EDUCATIONS
   LIVE CLASSES PAGE

   LIVE NOW
      -> /home/livevideoplayer/?liveClassId=ID

   RECORDED LIVE
      -> /home/videoplayer/?liveClassId=ID

   UPCOMING
      -> No player until class starts
========================================================= */

import {
    auth,
    db
} from "../../firebase/firebase-config.js";

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
   STATE
========================================================= */

let currentUser = null;

let student = null;

let studentCourse = null;

let allClasses = [];

let allSubjects = [];

let selectedDate = null;

/* =========================================================
   DOM
========================================================= */

const loadingState =
    document.getElementById(
        "loadingState"
    );

const errorState =
    document.getElementById(
        "errorState"
    );

const errorMessage =
    document.getElementById(
        "errorMessage"
    );

const errorBackButton =
    document.getElementById(
        "errorBackButton"
    );

const liveApp =
    document.getElementById(
        "liveApp"
    );

const backButton =
    document.getElementById(
        "backButton"
    );

const todayClasses =
    document.getElementById(
        "todayClasses"
    );

const todayEmpty =
    document.getElementById(
        "todayEmpty"
    );

const upcomingClasses =
    document.getElementById(
        "upcomingClasses"
    );

const upcomingEmpty =
    document.getElementById(
        "upcomingEmpty"
    );

const recordedClasses =
    document.getElementById(
        "recordedClasses"
    );

const recordedEmpty =
    document.getElementById(
        "recordedEmpty"
    );

const dateSelector =
    document.getElementById(
        "dateSelector"
    );

const selectedDateLabel =
    document.getElementById(
        "selectedDateLabel"
    );

const selectedDateClasses =
    document.getElementById(
        "selectedDateClasses"
    );

const selectedDateEmpty =
    document.getElementById(
        "selectedDateEmpty"
    );

const subjectGrid =
    document.getElementById(
        "subjectGrid"
    );

const subjectsEmpty =
    document.getElementById(
        "subjectsEmpty"
    );

const subjectHistorySection =
    document.getElementById(
        "subjectHistorySection"
    );

const subjectHistoryTitle =
    document.getElementById(
        "subjectHistoryTitle"
    );

const subjectHistory =
    document.getElementById(
        "subjectHistory"
    );

const closeSubjectHistory =
    document.getElementById(
        "closeSubjectHistory"
    );

const toast =
    document.getElementById(
        "toast"
    );

/* =========================================================
   INITIAL
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "../../account/login/";

            return;
        }

        currentUser =
            user;

        try {

            await initialize();

        } catch (error) {

            console.error(
                error
            );

            showError(
                error?.message ||
                "Unable to load live classes."
            );
        }
    }
);

/* =========================================================
   INITIALIZE
========================================================= */

async function initialize() {

    showLoading();

    await loadStudent();

    await loadStudentCourse();

    await loadLiveClasses();

    await loadSubjects();

    renderToday();

    renderUpcoming();

    renderRecorded();

    renderDateSelector();

    renderSelectedDate();

    renderSubjects();

    hideLoading();
}

/* =========================================================
   STUDENT
========================================================= */

async function loadStudent() {

    const ref =
        doc(
            db,
            "zen2Students",
            currentUser.uid
        );

    const snapshot =
        await getDoc(ref);

    if (!snapshot.exists()) {

        throw new Error(
            "Student profile was not found."
        );
    }

    student = {
        id: snapshot.id,
        ...snapshot.data()
    };
}

/* =========================================================
   COURSE
========================================================= */

async function loadStudentCourse() {

    const studentClass =
        normalizeClass(
            student.className ||
            student.class ||
            student.standard ||
            student.grade ||
            student.targetClass
        );

    const coursesSnapshot =
        await getDocs(
            collection(
                db,
                "zen2Courses"
            )
        );

    const courses = [];

    coursesSnapshot.forEach(
        (snapshot) => {

            const data =
                snapshot.data();

            if (
                data.active === false
            ) {
                return;
            }

            courses.push({
                id: snapshot.id,
                ...data
            });
        }
    );

    /*
       First try class match.
    */

    studentCourse =
        courses.find(
            course => {

                const courseClass =
                    normalizeClass(
                        course.className ||
                        course.courseClass ||
                        course.targetClass ||
                        course.standard ||
                        course.grade
                    );

                return (
                    studentClass &&
                    courseClass ===
                    studentClass
                );
            }
        ) || null;
}

/* =========================================================
   LIVE CLASSES
========================================================= */

async function loadLiveClasses() {

    const snapshot =
        await getDocs(
            collection(
                db,
                "liveClasses"
            )
        );

    allClasses = [];

    snapshot.forEach(
        (docSnapshot) => {

            const data =
                docSnapshot.data();

            if (
                data.active === false
            ) {
                return;
            }

            /*
               If we know the student's course,
               prefer matching classes.

               If courseId is absent, keep the
               class because older admin records
               may not contain it.
            */

            if (
                studentCourse &&
                data.courseId &&
                data.courseId !==
                    studentCourse.id
            ) {

                return;
            }

            allClasses.push({
                id: docSnapshot.id,
                ...data
            });
        }
    );

    /*
       Sort oldest/newest consistently.
    */

    allClasses.sort(
        (a, b) => {

            return (
                getStartTimestamp(a) -
                getStartTimestamp(b)
            );
        }
    );
}

/* =========================================================
   SUBJECTS
========================================================= */

async function loadSubjects() {

    allSubjects = [];

    if (
        studentCourse
    ) {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "zen2Subjects"
                )
            );

        snapshot.forEach(
            (docSnapshot) => {

                const data =
                    docSnapshot.data();

                if (
                    data.active === false
                ) {
                    return;
                }

                if (
                    data.courseId !==
                    studentCourse.id
                ) {
                    return;
                }

                allSubjects.push({
                    id: docSnapshot.id,
                    ...data
                });
            }
        );
    }

    /*
       Also discover subjects from
       liveClasses in case some subjects
       don't yet exist in zen2Subjects.
    */

    allClasses.forEach(
        item => {

            const subjectId =
                item.subjectId;

            const subjectName =
                item.subjectName ||
                item.subject;

            if (
                !subjectName &&
                !subjectId
            ) {
                return;
            }

            const exists =
                allSubjects.some(
                    subject =>
                        (
                            subjectId &&
                            subject.id ===
                                subjectId
                        ) ||
                        (
                            subjectName &&
                            normalizeText(
                                subject.name ||
                                subject.title
                            ) ===
                            normalizeText(
                                subjectName
                            )
                        )
                );

            if (
                !exists
            ) {

                allSubjects.push({

                    id:
                        subjectId ||
                        slugify(
                            subjectName
                        ),

                    name:
                        subjectName ||
                        "Subject",

                    title:
                        subjectName ||
                        "Subject",

                    courseId:
                        item.courseId ||
                        studentCourse?.id ||
                        null

                });
            }
        }
    );

    allSubjects.sort(
        (a, b) =>
            String(
                a.name ||
                a.title ||
                ""
            ).localeCompare(
                String(
                    b.name ||
                    b.title ||
                    ""
                )
            )
    );
}

/* =========================================================
   STATUS
========================================================= */

function getClassStatus(
    item
) {

    const start =
        getStartTimestamp(
            item
        );

    const end =
        getEndTimestamp(
            item
        );

    const now =
        Date.now();

    if (
        start &&
        now < start
    ) {

        return "UPCOMING";
    }

    /*
       If there is no end time, assume
       the class is live for 2 hours.
    */

    const effectiveEnd =
        end ||
        (
            start
                ? start +
                    (
                        2 *
                        60 *
                        60 *
                        1000
                    )
                : 0
        );

    if (
        start &&
        now >= start &&
        now <= effectiveEnd
    ) {

        return "LIVE";
    }

    return "ENDED";
}

/* =========================================================
   TODAY
========================================================= */

function renderToday() {

    todayClasses.innerHTML = "";

    const today =
        getDateKey(
            new Date()
        );

    const classes =
        allClasses
            .filter(
                item =>
                    getClassDate(
                        item
                    ) === today
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    getStartTimestamp(a) -
                    getStartTimestamp(b)
            );

    if (!classes.length) {

        todayEmpty.classList.remove(
            "hidden"
        );

        return;
    }

    todayEmpty.classList.add(
        "hidden"
    );

    classes.forEach(
        item => {

            const status =
                getClassStatus(
                    item
                );

            /*
               Don't put completed classes
               into the TODAY live area if
               they have already moved into
               recording.
            */

            if (
                status === "ENDED"
            ) {

                return;
            }

            todayClasses.appendChild(
                createTodayCard(
                    item,
                    status
                )
            );
        }
    );

    if (
        !todayClasses.children.length
    ) {

        todayEmpty.classList.remove(
            "hidden"
        );
    }
}

/* =========================================================
   TODAY CARD
========================================================= */

function createTodayCard(
    item,
    status
) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "today-card";

    const thumbnail =
        getThumbnail(
            item
        );

    const title =
        getTitle(
            item
        );

    const subject =
        getSubjectName(
            item
        );

    const chapter =
        getChapterName(
            item
        );

    const teacher =
        getTeacher(
            item
        );

    const time =
        getTimeRange(
            item
        );

    const image =
        thumbnail
            ? `<img src="${escapeAttribute(thumbnail)}" alt="">`
            : placeholderThumbnail();

    card.innerHTML = `

        <div class="today-thumbnail">

            ${image}

            ${
                status === "LIVE"
                    ? `
                        <div class="today-live-label">
                            <span></span>
                            LIVE NOW
                        </div>
                    `
                    : ""
            }

        </div>

        <div class="today-content">

            <h3 class="today-title">
                ${escapeHTML(title)}
            </h3>

            <div class="today-meta">

                ${escapeHTML(subject)}
                •
                ${escapeHTML(chapter)}

            </div>

            <div class="today-footer">

                <span class="teacher">
                    ${escapeHTML(teacher)}
                    <br>
                    ${escapeHTML(time)}
                </span>

                <button
                    class="join-button"
                    type="button"
                >
                    ${
                        status === "LIVE"
                            ? "JOIN LIVE"
                            : "UPCOMING"
                    }
                </button>

            </div>

        </div>
    `;

    const button =
        card.querySelector(
            ".join-button"
        );

    if (
        status === "LIVE"
    ) {

        button.addEventListener(
            "click",
            () => {

                openLivePlayer(
                    item.id
                );
            }
        );

    } else {

        button.disabled =
            true;

        button.style.opacity =
            "0.5";

        button.style.cursor =
            "default";
    }

    return card;
}

/* =========================================================
   UPCOMING
========================================================= */

function renderUpcoming() {

    upcomingClasses.innerHTML = "";

    const upcoming =
        allClasses
            .filter(
                item =>
                    getClassStatus(
                        item
                    ) ===
                    "UPCOMING"
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    getStartTimestamp(a) -
                    getStartTimestamp(b)
            )
            .slice(
                0,
                8
            );

    if (!upcoming.length) {

        upcomingEmpty.classList.remove(
            "hidden"
        );

        return;
    }

    upcomingEmpty.classList.add(
        "hidden"
    );

    upcoming.forEach(
        item => {

            upcomingClasses.appendChild(
                createUpcomingCard(
                    item
                )
            );
        }
    );
}

/* =========================================================
   UPCOMING CARD
========================================================= */

function createUpcomingCard(
    item
) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "upcoming-card";

    const date =
        getDateObject(
            item
        );

    const day =
        date
            ? date.getDate()
            : "—";

    const month =
        date
            ? date.toLocaleDateString(
                "en-IN",
                {
                    month: "short"
                }
            )
            : "";

    card.innerHTML = `

        <div class="upcoming-date">

            <span class="upcoming-day">
                ${day}
            </span>

            <span class="upcoming-month">
                ${escapeHTML(month)}
            </span>

        </div>

        <div>

            <h3 class="upcoming-title">
                ${escapeHTML(
                    getTitle(item)
                )}
            </h3>

            <div class="upcoming-meta">

                ${escapeHTML(
                    getSubjectName(item)
                )}

                •

                ${escapeHTML(
                    getChapterName(item)
                )}

                <br>

                ${escapeHTML(
                    getTeacher(item)
                )}

            </div>

            <span class="upcoming-badge">
                UPCOMING
            </span>

        </div>

        <div class="upcoming-time">

            ${escapeHTML(
                getTimeRange(item)
            )}

        </div>
    `;

    return card;
}

/* =========================================================
   RECORDED
========================================================= */

function renderRecorded() {

    recordedClasses.innerHTML = "";

    const recorded =
        allClasses
            .filter(
                item =>
                    getClassStatus(
                        item
                    ) ===
                    "ENDED" &&
                    hasRecording(
                        item
                    )
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    getStartTimestamp(b) -
                    getStartTimestamp(a)
            )
            .slice(
                0,
                12
            );

    if (!recorded.length) {

        recordedEmpty.classList.remove(
            "hidden"
        );

        return;
    }

    recordedEmpty.classList.add(
        "hidden"
    );

    recorded.forEach(
        item => {

            recordedClasses.appendChild(
                createRecordedCard(
                    item
                )
            );
        }
    );
}

/* =========================================================
   RECORDED CARD
========================================================= */

function createRecordedCard(
    item
) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "recorded-card";

    const thumbnail =
        getThumbnail(
            item
        );

    const image =
        thumbnail
            ? `<img src="${escapeAttribute(thumbnail)}" alt="">`
            : placeholderThumbnail();

    card.innerHTML = `

        <div class="recorded-thumbnail">

            ${image}

            <div class="recorded-play">
                ▶
            </div>

            <div class="recorded-badge">
                RECORDED LIVE
            </div>

        </div>

        <div class="recorded-content">

            <h3 class="recorded-title">
                ${escapeHTML(
                    getTitle(item)
                )}
            </h3>

            <div class="recorded-meta">

                ${escapeHTML(
                    getSubjectName(item)
                )}

                •

                ${escapeHTML(
                    getChapterName(item)
                )}

                <br>

                ${escapeHTML(
                    getTeacher(item)
                )}

            </div>

            <div class="recorded-date">

                ${escapeHTML(
                    formatDate(
                        getClassDate(item)
                    )
                )}

                •

                ${escapeHTML(
                    getTimeRange(item)
                )}

            </div>

        </div>
    `;

    card.addEventListener(
        "click",
        () => {

            /*
               IMPORTANT:

               Recorded live class goes to
               the COMMON VIDEO PLAYER.

               NOT livevideoplayer.
            */

            openRecordedPlayer(
                item.id
            );
        }
    );

    return card;
}

/* =========================================================
   DATE SELECTOR
========================================================= */

function renderDateSelector() {

    dateSelector.innerHTML = "";

    const dates =
        [];

    allClasses.forEach(
        item => {

            const date =
                getClassDate(
                    item
                );

            if (
                date &&
                !dates.includes(
                    date
                )
            ) {

                dates.push(
                    date
                );
            }
        }
    );

    dates.sort();

    /*
       Show latest/future dates first
       around the current period.
    */

    const today =
        getDateKey(
            new Date()
        );

    dates.sort(
        (
            a,
            b
        ) => {

            const da =
                dateFromKey(a)
                    .getTime();

            const db =
                dateFromKey(b)
                    .getTime();

            return da - db;
        }
    );

    const visibleDates =
        dates.slice(
            0,
            30
        );

    if (
        !selectedDate
    ) {

        selectedDate =
            dates.includes(
                today
            )
                ? today
                : (
                    dates[0] ||
                    today
                );
    }

    visibleDates.forEach(
        dateKey => {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                "date-button";

            if (
                dateKey ===
                selectedDate
            ) {

                button.classList.add(
                    "active"
                );
            }

            const date =
                dateFromKey(
                    dateKey
                );

            button.innerHTML = `

                <span class="date-day">
                    ${date.getDate()}
                </span>

                <span class="date-name">
                    ${date.toLocaleDateString(
                        "en-IN",
                        {
                            weekday: "short"
                        }
                    )}
                </span>
            `;

            button.addEventListener(
                "click",
                () => {

                    selectedDate =
                        dateKey;

                    renderDateSelector();

                    renderSelectedDate();
                }
            );

            dateSelector.appendChild(
                button
            );
        }
    );
}

/* =========================================================
   SELECTED DATE
========================================================= */

function renderSelectedDate() {

    selectedDateClasses.innerHTML =
        "";

    const date =
        dateFromKey(
            selectedDate
        );

    selectedDateLabel.textContent =
        date
            ? date.toLocaleDateString(
                "en-IN",
                {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                }
            )
            : "";

    const classes =
        allClasses
            .filter(
                item =>
                    getClassDate(
                        item
                    ) ===
                    selectedDate
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    getStartTimestamp(a) -
                    getStartTimestamp(b)
            );

    if (!classes.length) {

        selectedDateEmpty.classList.remove(
            "hidden"
        );

        return;
    }

    selectedDateEmpty.classList.add(
        "hidden"
    );

    classes.forEach(
        item => {

            selectedDateClasses.appendChild(
                createDateClass(
                    item
                )
            );
        }
    );
}

/* =========================================================
   DATE CLASS
========================================================= */

function createDateClass(
    item
) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "date-class";

    const status =
        getClassStatus(
            item
        );

    const hasRecordingValue =
        hasRecording(
            item
        );

    let buttonText =
        "UPCOMING";

    let buttonClass =
        "";

    if (
        status ===
        "LIVE"
    ) {

        buttonText =
            "JOIN LIVE";

    } else if (
        status ===
            "ENDED" &&
        hasRecordingValue
    ) {

        buttonText =
            "WATCH";

        buttonClass =
            "recorded";

    } else if (
        status ===
        "ENDED"
    ) {

        buttonText =
            "NO RECORDING";

        buttonClass =
            "recorded";
    }

    card.innerHTML = `

        <div class="date-class-time">

            ${escapeHTML(
                getTimeRange(item)
            )}

        </div>

        <div>

            <h3 class="date-class-title">
                ${escapeHTML(
                    getTitle(item)
                )}
            </h3>

            <div class="date-class-meta">

                ${escapeHTML(
                    getSubjectName(item)
                )}

                •

                ${escapeHTML(
                    getChapterName(item)
                )}

                <br>

                ${escapeHTML(
                    getTeacher(item)
                )}

            </div>

        </div>

        <button
            class="date-class-button ${buttonClass}"
            type="button"
        >
            ${buttonText}
        </button>
    `;

    const button =
        card.querySelector(
            ".date-class-button"
        );

    if (
        status ===
        "LIVE"
    ) {

        button.addEventListener(
            "click",
            () => {

                openLivePlayer(
                    item.id
                );
            }
        );

    } else if (
        status === "ENDED" &&
        hasRecordingValue
    ) {

        button.addEventListener(
            "click",
            () => {

                openRecordedPlayer(
                    item.id
                );
            }
        );

    } else {

        button.disabled =
            true;

        button.style.opacity =
            "0.45";

        button.style.cursor =
            "default";
    }

    return card;
}

/* =========================================================
   SUBJECTS
========================================================= */

function renderSubjects() {

    subjectGrid.innerHTML =
        "";

    if (
        !allSubjects.length
    ) {

        subjectsEmpty.classList.remove(
            "hidden"
        );

        return;
    }

    subjectsEmpty.classList.add(
        "hidden"
    );

    allSubjects.forEach(
        subject => {

            const subjectName =
                subject.name ||
                subject.title ||
                "Subject";

            const subjectId =
                subject.id;

            const count =
                allClasses.filter(
                    item => {

                        if (
                            subjectId &&
                            item.subjectId
                        ) {

                            return (
                                item.subjectId ===
                                subjectId
                            );
                        }

                        return (
                            normalizeText(
                                getSubjectName(
                                    item
                                )
                            ) ===
                            normalizeText(
                                subjectName
                            )
                        );
                    }
                ).length;

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "subject-card";

            card.innerHTML = `

                <div class="subject-icon">
                    ${escapeHTML(
                        getInitial(
                            subjectName
                        )
                    )}
                </div>

                <span class="subject-name">
                    ${escapeHTML(
                        subjectName
                    )}
                </span>

                <span class="subject-count">
                    ${count}
                    ${count === 1 ? "class" : "classes"}
                </span>
            `;

            card.addEventListener(
                "click",
                () => {

                    showSubjectHistory(
                        subject
                    );
                }
            );

            subjectGrid.appendChild(
                card
            );
        }
    );
}

/* =========================================================
   SUBJECT HISTORY
========================================================= */

function showSubjectHistory(
    subject
) {

    const subjectName =
        subject.name ||
        subject.title ||
        "Subject";

    subjectHistoryTitle.textContent =
        subjectName;

    subjectHistory.innerHTML =
        "";

    const classes =
        allClasses
            .filter(
                item => {

                    if (
                        subject.id &&
                        item.subjectId
                    ) {

                        return (
                            item.subjectId ===
                            subject.id
                        );
                    }

                    return (
                        normalizeText(
                            getSubjectName(
                                item
                            )
                        ) ===
                        normalizeText(
                            subjectName
                        )
                    );
                }
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    getStartTimestamp(b) -
                    getStartTimestamp(a)
            );

    if (!classes.length) {

        subjectHistory.innerHTML = `

            <div class="empty-state compact">

                <p>
                    No classes found for this subject.
                </p>

            </div>
        `;

    } else {

        classes.forEach(
            item => {

                subjectHistory.appendChild(
                    createHistoryCard(
                        item
                    )
                );
            }
        );
    }

    subjectHistorySection.classList.remove(
        "hidden"
    );

    subjectHistorySection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

/* =========================================================
   HISTORY CARD
========================================================= */

function createHistoryCard(
    item
) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "history-card";

    const date =
        getDateObject(
            item
        );

    const status =
        getClassStatus(
            item
        );

    const recording =
        hasRecording(
            item
        );

    let action =
        "UPCOMING";

    if (
        status ===
        "LIVE"
    ) {

        action =
            "JOIN LIVE";

    } else if (
        status === "ENDED" &&
        recording
    ) {

        action =
            "WATCH";
    } else if (
        status === "ENDED"
    ) {

        action =
            "NO RECORDING";
    }

    card.innerHTML = `

        <div class="history-date">

            <strong>
                ${
                    date
                        ? date.getDate()
                        : "—"
                }
            </strong>

            <span>
                ${
                    date
                        ? date.toLocaleDateString(
                            "en-IN",
                            {
                                month: "short"
                            }
                        )
                        : ""
                }
            </span>

        </div>

        <div>

            <h3 class="history-title">
                ${escapeHTML(
                    getTitle(item)
                )}
            </h3>

            <div class="history-meta">

                ${escapeHTML(
                    getChapterName(item)
                )}

                •
                ${escapeHTML(
                    getTeacher(item)
                )}

                <br>

                ${escapeHTML(
                    getTimeRange(item)
                )}

            </div>

        </div>

        <button
            class="history-watch"
            type="button"
        >
            ${action}
        </button>
    `;

    const button =
        card.querySelector(
            ".history-watch"
        );

    if (
        status === "LIVE"
    ) {

        button.addEventListener(
            "click",
            () => {

                openLivePlayer(
                    item.id
                );
            }
        );

    } else if (
        status === "ENDED" &&
        recording
    ) {

        button.addEventListener(
            "click",
            () => {

                openRecordedPlayer(
                    item.id
                );
            }
        );

    } else {

        button.disabled =
            true;

        button.style.opacity =
            "0.45";

        button.style.cursor =
            "default";
    }

    return card;
}

/* =========================================================
   ROUTING
========================================================= */

function openLivePlayer(
    id
) {

    /*
       ACTUAL LIVE ONLY
    */

    window.location.href =
        `../livevideoplayer/?liveClassId=${encodeURIComponent(id)}`;
}

function openRecordedPlayer(
    id
) {

    /*
       RECORDED LIVE CLASS
       ALWAYS COMMON VIDEO PLAYER
    */

    window.location.href =
        `../videoplayer/?liveClassId=${encodeURIComponent(id)}`;
}

/* =========================================================
   RECORDING CHECK
========================================================= */

function hasRecording(
    item
) {

    return Boolean(

        item.recordingUrl ||

        item.recordedUrl ||

        item.replayUrl ||

        item.videoUrl ||

        item.externalVideoUrl ||

        item.youtubeUrl ||

        item.youtubeLiveUrl ||

        item.contentId

    );
}

/* =========================================================
   TITLE
========================================================= */

function getTitle(
    item
) {

    return (
        item.title ||
        item.classTitle ||
        item.liveTitle ||
        item.topic ||
        item.name ||
        "Live Class"
    );
}

/* =========================================================
   SUBJECT
========================================================= */

function getSubjectName(
    item
) {

    return (
        item.subjectName ||
        item.subject ||
        "Subject"
    );
}

/* =========================================================
   CHAPTER
========================================================= */

function getChapterName(
    item
) {

    return (
        item.chapterName ||
        item.chapter ||
        "Chapter"
    );
}

/* =========================================================
   TEACHER
========================================================= */

function getTeacher(
    item
) {

    return (
        item.teacherName ||
        item.facultyName ||
        item.teacher ||
        item.faculty ||
        "Zenova Faculty"
    );
}

/* =========================================================
   TIME
========================================================= */

function getTimeRange(
    item
) {

    const start =
        item.scheduledTime ||
        item.startTime ||
        item.classTime ||
        item.startClockTime ||
        "";

    const end =
        item.endTime ||
        "";

    if (
        start &&
        end
    ) {

        return `${start} – ${end}`;
    }

    if (start) {
        return start;
    }

    return "Time not specified";
}

/* =========================================================
   DATE
========================================================= */

function getClassDate(
    item
) {

    return (
        item.scheduledDate ||
        item.classDate ||
        item.liveDate ||
        item.startDate ||
        ""
    );
}

/* =========================================================
   START TIMESTAMP
========================================================= */

function getStartTimestamp(
    item
) {

    const date =
        getClassDate(
            item
        );

    const time =
        item.scheduledTime ||
        item.startTime ||
        item.classTime ||
        item.startClockTime ||
        "00:00";

    if (!date) {
        return 0;
    }

    const timestamp =
        new Date(
            `${date}T${normalizeTime(time)}`
        ).getTime();

    return Number.isNaN(
        timestamp
    )
        ? 0
        : timestamp;
}

/* =========================================================
   END TIMESTAMP
========================================================= */

function getEndTimestamp(
    item
) {

    const date =
        getClassDate(
            item
        );

    const endTime =
        item.endTime ||
        "";

    if (
        !date ||
        !endTime
    ) {

        return 0;
    }

    const timestamp =
        new Date(
            `${date}T${normalizeTime(endTime)}`
        ).getTime();

    return Number.isNaN(
        timestamp
    )
        ? 0
        : timestamp;
}

/* =========================================================
   DATE OBJECT
========================================================= */

function getDateObject(
    item
) {

    const date =
        getClassDate(
            item
        );

    if (!date) {
        return null;
    }

    const time =
        item.scheduledTime ||
        item.startTime ||
        item.classTime ||
        "00:00";

    const result =
        new Date(
            `${date}T${normalizeTime(time)}`
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

/* =========================================================
   THUMBNAIL
========================================================= */

function getThumbnail(
    item
) {

    if (
        item.thumbnailUrl
    ) {

        return item.thumbnailUrl;
    }

    if (
        item.thumbnail
    ) {

        return item.thumbnail;
    }

    const candidates = [

        item.recordingUrl,

        item.recordedUrl,

        item.replayUrl,

        item.videoUrl,

        item.externalVideoUrl,

        item.youtubeUrl,

        item.youtubeLiveUrl

    ];

    for (
        const candidate
        of candidates
    ) {

        const id =
            extractYouTubeId(
                candidate
            );

        if (id) {

            return (
                `https://img.youtube.com/vi/${id}/hqdefault.jpg`
            );
        }
    }

    return "";
}

/* =========================================================
   PLACEHOLDER
========================================================= */

function placeholderThumbnail() {

    return `

        <div style="
            width:100%;
            height:100%;
            display:flex;
            align-items:center;
            justify-content:center;
            background:#eeeeee;
            color:#777777;
            font-family:Poppins,sans-serif;
            font-size:13px;
            font-weight:600;
        ">
            ZENOVA
        </div>
    `;
}

/* =========================================================
   YOUTUBE ID
========================================================= */

function extractYouTubeId(
    value
) {

    if (!value) {
        return null;
    }

    const text =
        String(
            value
        ).trim();

    if (
        /^[a-zA-Z0-9_-]{11}$/.test(
            text
        )
    ) {

        return text;
    }

    try {

        const url =
            new URL(
                text
            );

        if (
            url.hostname.includes(
                "youtu.be"
            )
        ) {

            return url.pathname
                .replace(
                    "/",
                    ""
                )
                .slice(
                    0,
                    11
                );
        }

        if (
            url.hostname.includes(
                "youtube.com"
            )
        ) {

            const watchId =
                url.searchParams.get(
                    "v"
                );

            if (watchId) {
                return watchId;
            }

            const parts =
                url.pathname
                    .split("/")
                    .filter(Boolean);

            const index =
                parts.findIndex(
                    part =>
                        [
                            "live",
                            "embed",
                            "shorts"
                        ].includes(
                            part
                        )
                );

            if (
                index >= 0 &&
                parts[index + 1]
            ) {

                return parts[
                    index + 1
                ].slice(
                    0,
                    11
                );
            }
        }

    } catch (error) {

        return null;
    }

    return null;
}

/* =========================================================
   DATE HELPERS
========================================================= */

function getDateKey(
    date
) {

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

    return (
        `${year}-${month}-${day}`
    );
}

function dateFromKey(
    key
) {

    if (!key) {
        return null;
    }

    const result =
        new Date(
            `${key}T00:00:00`
        );

    return Number.isNaN(
        result.getTime()
    )
        ? null
        : result;
}

function formatDate(
    key
) {

    const date =
        dateFromKey(
            key
        );

    if (!date) {
        return "Date not specified";
    }

    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}

/* =========================================================
   TIME NORMALIZATION
========================================================= */

function normalizeTime(
    value
) {

    if (!value) {
        return "00:00";
    }

    const text =
        String(
            value
        )
            .trim()
            .toUpperCase();

    /*
       Already 24-hour.
    */

    if (
        /^\d{1,2}:\d{2}$/.test(
            text
        )
    ) {

        return text;
    }

    const match =
        text.match(
            /^(\d{1,2}):(\d{2})\s*(AM|PM)$/
        );

    if (!match) {

        return "00:00";
    }

    let hours =
        Number(
            match[1]
        );

    const minutes =
        match[2];

    const period =
        match[3];

    if (
        period === "PM" &&
        hours !== 12
    ) {

        hours += 12;
    }

    if (
        period === "AM" &&
        hours === 12
    ) {

        hours = 0;
    }

    return (
        String(
            hours
        ).padStart(
            2,
            "0"
        ) +
        ":" +
        minutes
    );
}

/* =========================================================
   CLASS NORMALIZATION
========================================================= */

function normalizeClass(
    value
) {

    if (!value) {
        return "";
    }

    const text =
        String(
            value
        )
            .toLowerCase()
            .trim()
            .replace(
                /\s+/g,
                ""
            );

    if (
        [
            "10",
            "10th",
            "class10",
            "class10th",
            "sslc"
        ].includes(
            text
        )
    ) {

        return "10th";
    }

    if (
        [
            "9",
            "9th",
            "class9",
            "class9th"
        ].includes(
            text
        )
    ) {

        return "9th";
    }

    if (
        [
            "8",
            "8th",
            "class8",
            "class8th"
        ].includes(
            text
        )
    ) {

        return "8th";
    }

    if (
        text.includes(
            "1stpuc"
        ) ||
        text === "puc1"
    ) {

        return "1st puc";
    }

    if (
        text.includes(
            "2ndpuc"
        ) ||
        text === "puc2"
    ) {

        return "2nd puc";
    }

    return text;
}

/* =========================================================
   TEXT
========================================================= */

function normalizeText(
    value
) {

    return String(
        value || ""
    )
        .toLowerCase()
        .trim()
        .replace(
            /\s+/g,
            " "
        );
}

function slugify(
    value
) {

    return String(
        value || "subject"
    )
        .toLowerCase()
        .replace(
            /[^a-z0-9]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            ""
        );
}

function getInitial(
    value
) {

    return String(
        value || "Z"
    )
        .trim()
        .charAt(0)
        .toUpperCase() || "Z";
}

/* =========================================================
   ESCAPE
========================================================= */

function escapeHTML(
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

    return String(
        value ?? ""
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
   UI
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

function hideLoading() {

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

    errorMessage.textContent =
        message;
}

/* =========================================================
   BACK
========================================================= */

backButton.addEventListener(
    "click",
    goBack
);

errorBackButton.addEventListener(
    "click",
    goBack
);

function goBack() {

    if (
        document.referrer
    ) {

        try {

            const referrer =
                new URL(
                    document.referrer
                );

            if (
                referrer.origin ===
                window.location.origin
            ) {

                window.location.href =
                    document.referrer;

                return;
            }

        } catch (error) {
            console.warn(error);
        }
    }

    if (
        window.history.length > 1
    ) {

        window.history.back();

        return;
    }

    window.location.href =
        "../";
}

/* =========================================================
   BOTTOM NAV
========================================================= */

document
    .querySelectorAll(
        ".bottom-nav button[data-route]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    window.location.href =
                        button.dataset.route;
                }
            );
        }
    );

/* =========================================================
   CLOSE SUBJECT HISTORY
========================================================= */

closeSubjectHistory.addEventListener(
    "click",
    () => {

        subjectHistorySection.classList.add(
            "hidden"
        );
    }
);

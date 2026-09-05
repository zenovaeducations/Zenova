import {
    auth,
    db
} from "../../firebase/firebase-config.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    collection,
    query,
    where,
    limit,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   ELEMENTS
========================================================= */

const pageLoader =
    document.getElementById(
        "pageLoader"
    );


const classesApp =
    document.getElementById(
        "classesApp"
    );


const backButton =
    document.getElementById(
        "backButton"
    );


const notificationButton =
    document.getElementById(
        "notificationButton"
    );


const todayButton =
    document.getElementById(
        "todayButton"
    );


const dateStrip =
    document.getElementById(
        "dateStrip"
    );


const selectedDateLabel =
    document.getElementById(
        "selectedDateLabel"
    );


const studentGreeting =
    document.getElementById(
        "studentGreeting"
    );


const dayTitle =
    document.getElementById(
        "dayTitle"
    );


const classCount =
    document.getElementById(
        "classCount"
    );


const liveSection =
    document.getElementById(
        "liveSection"
    );


const liveList =
    document.getElementById(
        "liveList"
    );


const upcomingSection =
    document.getElementById(
        "upcomingSection"
    );


const upcomingList =
    document.getElementById(
        "upcomingList"
    );


const recordedSection =
    document.getElementById(
        "recordedSection"
    );


const recordedList =
    document.getElementById(
        "recordedList"
    );


const emptyState =
    document.getElementById(
        "emptyState"
    );


const errorState =
    document.getElementById(
        "errorState"
    );


const errorMessage =
    document.getElementById(
        "errorMessage"
    );


const retryButton =
    document.getElementById(
        "retryButton"
    );


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let student = null;

let allClasses = [];

let selectedDate =
    getDateKey(
        new Date()
    );


let unsubscribeClasses =
    null;


/*
 * We load a small window around today.
 *
 * This lets the date selector show
 * upcoming classes without making
 * a separate query for every date.
 */

const DAYS_BEFORE =
    1;


const DAYS_AFTER =
    14;


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.replace(
                "../../login/"
            );

            return;
        }


        currentUser =
            user;


        try {

            await loadStudent();

            buildDateStrip();

            setupEvents();

            startClassesListener();

            showApp();

        } catch (error) {

            console.error(
                "CLASSES PAGE ERROR:",
                error
            );


            showError(
                getReadableError(
                    error
                )
            );

        }

    }
);


/* =========================================================
   LOAD STUDENT
========================================================= */

async function loadStudent() {

    /*
     * We don't use getDoc here.
     *
     * The student information is loaded
     * from the existing Firebase auth
     * profile when available.
     *
     * The Classes page does not require
     * a second student query just to render.
     */

    student = {

        name:
            currentUser.displayName ||
            "Student"

    };


    studentGreeting.textContent =
        `View your live, upcoming and recorded classes.`;

}


/* =========================================================
   DATE STRIP
========================================================= */

function buildDateStrip() {

    dateStrip.innerHTML = "";


    const today =
        new Date();


    for (
        let offset = -DAYS_BEFORE;
        offset <= DAYS_AFTER;
        offset++
    ) {

        const date =
            new Date(
                today
            );


        date.setDate(
            today.getDate() +
            offset
        );


        const dateKey =
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
            dateKey ===
            selectedDate
        ) {

            button.classList.add(
                "active"
            );

        }


        button.dataset.date =
            dateKey;


        button.innerHTML = `

            <span
                class="date-day"
            >
                ${offset === 0
                    ? "TODAY"
                    : date.toLocaleDateString(
                        "en-IN",
                        {
                            weekday:
                                "short"
                        }
                    )
                }
            </span>


            <span
                class="date-number"
            >
                ${date.getDate()}
            </span>


            <span
                class="date-month"
            >
                ${date.toLocaleDateString(
                    "en-IN",
                    {
                        month:
                            "short"
                    }
                )}
            </span>

        `;


        dateStrip.appendChild(
            button
        );

    }


    updateDateHeader();

}


/* =========================================================
   DATE EVENTS
========================================================= */

function setupEvents() {

    backButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "../";

        }
    );


    notificationButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "../more/";

        }
    );


    todayButton.addEventListener(
        "click",
        () => {

            selectedDate =
                getDateKey(
                    new Date()
                );


            updateDateSelection();

            updateDateHeader();

            renderClasses();

        }
    );


    dateStrip.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-date]"
                );


            if (!button) {
                return;
            }


            selectedDate =
                button.dataset.date;


            updateDateSelection();

            updateDateHeader();

            renderClasses();

        }
    );


    retryButton.addEventListener(
        "click",
        () => {

            hideError();

            startClassesListener();

        }
    );

}


/* =========================================================
   FIRESTORE CLASSES
========================================================= */

function startClassesListener() {

    if (
        unsubscribeClasses
    ) {

        unsubscribeClasses();

        unsubscribeClasses =
            null;

    }


    /*
     * We intentionally avoid orderBy().
     *
     * The result is sorted locally in JS.
     *
     * This reduces composite-index requirements
     * while we're building the Hybrid portal.
     */

    const today =
        new Date();


    const startDate =
        new Date(
            today
        );


    startDate.setDate(
        today.getDate() -
        DAYS_BEFORE
    );


    const endDate =
        new Date(
            today
        );


    endDate.setDate(
        today.getDate() +
        DAYS_AFTER
    );


    const startKey =
        getDateKey(
            startDate
        );


    const endKey =
        getDateKey(
            endDate
        );


    const classesQuery =
        query(

            collection(
                db,
                "hybridClasses"
            ),

            where(
                "active",
                "==",
                true
            ),

            where(
                "dateKey",
                ">=",
                startKey
            ),

            where(
                "dateKey",
                "<=",
                endKey
            ),

            limit(300)

        );


    unsubscribeClasses =
        onSnapshot(

            classesQuery,

            snapshot => {

                allClasses =
                    snapshot.docs.map(
                        document => ({

                            id:
                                document.id,

                            ...document.data()

                        })
                    );


                /*
                 * Sort locally.
                 */

                allClasses.sort(
                    compareClasses
                );


                console.log(
                    "ZENOVA CLASSES:",
                    allClasses
                );


                hideError();

                renderClasses();

            },


            error => {

                console.error(
                    "HYBRID CLASSES FIRESTORE ERROR:",
                    error
                );


                showError(
                    getReadableError(
                        error
                    )
                );

            }

        );

}


/* =========================================================
   FILTER CLASSES
========================================================= */

function getSelectedClasses() {

    let classes =
        allClasses.filter(
            item =>
                item.dateKey ===
                selectedDate
        );


    /*
     * Student-specific filtering.
     *
     * If admin creates targetClasses,
     * the student will only see matching
     * classes.
     *
     * If targetClasses is missing or empty,
     * the class is treated as generally available.
     */

    if (
        student &&
        student.className
    ) {

        classes =
            classes.filter(
                item => {

                    const targets =
                        Array.isArray(
                            item.targetClasses
                        )
                            ? item.targetClasses
                            : [];


                    if (
                        !targets.length
                    ) {

                        return true;

                    }


                    return targets.some(
                        target =>
                            normalize(
                                target
                            ) ===
                            normalize(
                                student.className
                            )
                    );

                }
            );

    }


    return classes;

}


/* =========================================================
   RENDER
========================================================= */

function renderClasses() {

    const classes =
        getSelectedClasses();


    const live = [];

    const upcoming = [];

    const recorded = [];


    const now =
        new Date();


    classes.forEach(
        item => {

            const type =
                normalize(
                    item.type
                );


            const start =
                getClassDateTime(
                    item,
                    "start"
                );


            const end =
                getClassDateTime(
                    item,
                    "end"
                );


            /*
             * Explicit recorded class.
             */

            if (
                type ===
                "recorded"
            ) {

                recorded.push(
                    item
                );

                return;

            }


            /*
             * A class with a recording
             * and a completed time can also
             * appear under recorded.
             */

            if (
                item.status ===
                "completed" &&
                item.videoUrl
            ) {

                recorded.push(
                    item
                );

                return;

            }


            /*
             * Live right now.
             */

            if (
                start &&
                end &&
                now >= start &&
                now <= end
            ) {

                live.push(
                    item
                );

                return;

            }


            /*
             * Future class.
             */

            if (
                !start ||
                now < start
            ) {

                upcoming.push(
                    item
                );

                return;

            }


            /*
             * Past live class.
             *
             * If recording exists,
             * show it as recorded.
             */

            if (
                item.videoUrl
            ) {

                recorded.push(
                    item
                );

            }

        }
    );


    /*
     * Count total.
     */

    classCount.textContent =
        `${classes.length} ${
            classes.length === 1
                ? "class"
                : "classes"
        }`;


    renderLive(
        live
    );


    renderUpcoming(
        upcoming
    );


    renderRecorded(
        recorded
    );


    const hasContent =
        live.length ||
        upcoming.length ||
        recorded.length;


    emptyState.classList.toggle(
        "hidden",
        Boolean(
            hasContent
        )
    );

}


/* =========================================================
   LIVE
========================================================= */

function renderLive(
    classes
) {

    if (
        !classes.length
    ) {

        liveSection.classList.add(
            "hidden"
        );

        liveList.innerHTML = "";

        return;

    }


    liveSection.classList.remove(
        "hidden"
    );


    liveList.innerHTML =
        classes.map(
            item => `

                <article
                    class="live-card"
                >

                    <div>

                        <div
                            class="live-status"
                        >

                            <span
                                class="live-status-dot"
                            ></span>

                            LIVE NOW

                        </div>


                        <h3>
                            ${escapeHtml(
                                item.subject ||
                                "Class"
                            )}
                        </h3>


                        <p
                            class="live-topic"
                        >
                            ${escapeHtml(
                                item.topic ||
                                ""
                            )}
                        </p>


                        <p
                            class="live-teacher"
                        >
                            ${escapeHtml(
                                item.teacherName ||
                                "Zenova Faculty"
                            )}

                            ${
                                item.startTime
                                    ? `
                                        ·
                                        ${escapeHtml(
                                            item.startTime
                                        )}

                                        ${
                                            item.endTime
                                                ? `
                                                    –
                                                    ${escapeHtml(
                                                        item.endTime
                                                    )}
                                                `
                                                : ""
                                        }
                                    `
                                    : ""
                            }

                        </p>

                    </div>


                    ${
                        item.meetingUrl
                            ? `

                                <a
                                    class="join-button"
                                    href="${escapeAttr(
                                        item.meetingUrl
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    JOIN LIVE →
                                </a>

                              `
                            : `

                                <span
                                    class="class-status"
                                >
                                    LINK NOT AVAILABLE
                                </span>

                              `
                    }

                </article>

            `
        ).join("");

}


/* =========================================================
   UPCOMING
========================================================= */

function renderUpcoming(
    classes
) {

    if (
        !classes.length
    ) {

        upcomingSection.classList.add(
            "hidden"
        );

        upcomingList.innerHTML = "";

        return;

    }


    upcomingSection.classList.remove(
        "hidden"
    );


    upcomingList.innerHTML =
        classes.map(
            item => `

                <article
                    class="class-card"
                >

                    <div>

                        <div
                            class="class-time"
                        >
                            ${escapeHtml(
                                item.startTime ||
                                "--:--"
                            )}
                        </div>


                        ${
                            item.endTime
                                ? `
                                    <div
                                        class="class-duration"
                                    >
                                        ${escapeHtml(
                                            item.endTime
                                        )}
                                    </div>
                                  `
                                : ""
                        }

                    </div>


                    <div
                        class="class-info"
                    >

                        <h3>
                            ${escapeHtml(
                                item.subject ||
                                "Class"
                            )}
                        </h3>


                        ${
                            item.topic
                                ? `
                                    <p>
                                        ${escapeHtml(
                                            item.topic
                                        )}
                                    </p>
                                  `
                                : ""
                        }


                        ${
                            item.teacherName
                                ? `
                                    <span>
                                        ${escapeHtml(
                                            item.teacherName
                                        )}
                                    </span>
                                  `
                                : ""
                        }

                    </div>


                    <div
                        class="class-status"
                    >
                        ${
                            getStartsText(
                                item
                            )
                        }
                    </div>

                </article>

            `
        ).join("");

}


/* =========================================================
   RECORDED
========================================================= */

function renderRecorded(
    classes
) {

    if (
        !classes.length
    ) {

        recordedSection.classList.add(
            "hidden"
        );

        recordedList.innerHTML = "";

        return;

    }


    recordedSection.classList.remove(
        "hidden"
    );


    recordedList.innerHTML =
        classes.map(
            item => `

                <article
                    class="recorded-card"
                >

                    <div
                        class="recorded-top"
                    >

                        <span
                            class="recorded-badge"
                        >
                            RECORDED
                        </span>


                        ${
                            item.duration
                                ? `
                                    <span
                                        class="recorded-duration"
                                    >
                                        ${escapeHtml(
                                            item.duration
                                        )}
                                    </span>
                                  `
                                : ""
                        }

                    </div>


                    <h3>
                        ${escapeHtml(
                            item.subject ||
                            "Class"
                        )}
                    </h3>


                    <p>
                        ${escapeHtml(
                            item.topic ||
                            ""
                        )}
                    </p>


                    ${
                        item.teacherName
                            ? `
                                <p>
                                    ${escapeHtml(
                                        item.teacherName
                                    )}
                                </p>
                              `
                            : ""
                    }


                    ${
                        item.videoUrl
                            ? `

                                <a
                                    class="watch-button"
                                    href="${escapeAttr(
                                        item.videoUrl
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    WATCH RECORDING →
                                </a>

                              `
                            : `

                                <span
                                    class="class-status"
                                >
                                    RECORDING NOT AVAILABLE
                                </span>

                              `
                    }

                </article>

            `
        ).join("");

}


/* =========================================================
   HEADER
========================================================= */

function updateDateHeader() {

    const date =
        parseDateKey(
            selectedDate
        );


    if (!date) {
        return;
    }


    const isToday =
        selectedDate ===
        getDateKey(
            new Date()
        );


    selectedDateLabel.textContent =
        isToday
            ? "Today"
            : date.toLocaleDateString(
                "en-IN",
                {
                    day:
                        "numeric",

                    month:
                        "short",

                    year:
                        "numeric"
                }
            );


    dayTitle.textContent =
        isToday
            ? "Today's Classes"
            : date.toLocaleDateString(
                "en-IN",
                {
                    weekday:
                        "long",

                    day:
                        "numeric",

                    month:
                        "long"
                }
            );

}


function updateDateSelection() {

    document
        .querySelectorAll(
            ".date-item"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.date ===
                    selectedDate
                );

            }
        );

}


/* =========================================================
   SHOW / ERROR
========================================================= */

function showApp() {

    classesApp.classList.remove(
        "hidden"
    );


    pageLoader.classList.add(
        "hidden"
    );

}


function showError(
    message
) {

    pageLoader.classList.add(
        "hidden"
    );


    errorState.classList.remove(
        "hidden"
    );


    errorMessage.textContent =
        message ||
        "Please try again.";

}


function hideError() {

    errorState.classList.add(
        "hidden"
    );

}


/* =========================================================
   DATE HELPERS
========================================================= */

function getDateKey(
    date
) {

    return [

        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        ),

        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        )

    ].join("-");

}


function parseDateKey(
    value
) {

    const parts =
        String(
            value
        ).split("-");


    if (
        parts.length !== 3
    ) {

        return null;

    }


    const year =
        Number(
            parts[0]
        );


    const month =
        Number(
            parts[1]
        ) - 1;


    const day =
        Number(
            parts[2]
        );


    return new Date(
        year,
        month,
        day
    );

}


function getClassDateTime(
    item,
    type
) {

    if (
        !item.dateKey
    ) {

        return null;

    }


    const date =
        parseDateKey(
            item.dateKey
        );


    if (!date) {
        return null;
    }


    const time =
        type === "start"
            ? item.startTime
            : item.endTime;


    if (!time) {
        return null;
    }


    const parts =
        String(
            time
        ).split(":");


    const hours =
        Number(
            parts[0]
        );


    const minutes =
        Number(
            parts[1]
        );


    if (
        Number.isNaN(hours) ||
        Number.isNaN(minutes)
    ) {

        return null;

    }


    date.setHours(
        hours,
        minutes,
        0,
        0
    );


    return date;

}


/* =========================================================
   SORT
========================================================= */

function compareClasses(
    a,
    b
) {

    const dateA =
        `${a.dateKey || ""} ${
            a.startTime || ""
        }`;


    const dateB =
        `${b.dateKey || ""} ${
            b.startTime || ""
        }`;


    return dateA.localeCompare(
        dateB
    );

}


/* =========================================================
   UPCOMING TEXT
========================================================= */

function getStartsText(
    item
) {

    const start =
        getClassDateTime(
            item,
            "start"
        );


    if (!start) {

        return "UPCOMING";

    }


    const now =
        new Date();


    const difference =
        start.getTime() -
        now.getTime();


    if (
        difference <= 0
    ) {

        return "STARTING";

    }


    const minutes =
        Math.floor(
            difference /
            60000
        );


    if (
        minutes < 60
    ) {

        return `IN ${minutes} MIN`;

    }


    const hours =
        Math.floor(
            minutes /
            60
        );


    if (
        hours < 24
    ) {

        return `IN ${hours} HR`;

    }


    const days =
        Math.floor(
            hours /
            24
        );


    return `IN ${days} ${
        days === 1
            ? "DAY"
            : "DAYS"
    }`;

}


/* =========================================================
   STRING HELPERS
========================================================= */

function normalize(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase();

}


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


function escapeAttr(
    value
) {

    return escapeHtml(
        value
    );

}


/* =========================================================
   FIREBASE ERROR
========================================================= */

function getReadableError(
    error
) {

    if (!error) {

        return "Please try again.";

    }


    console.error(
        error
    );


    if (
        error.code ===
        "permission-denied"
    ) {

        return "You don't have permission to view classes.";

    }


    if (
        error.code ===
        "failed-precondition"
    ) {

        return "The classes database needs a Firebase index.";

    }


    if (
        error.code ===
        "unavailable"
    ) {

        return "Firebase is temporarily unavailable.";

    }


    return (
        error.message ||
        "Unable to load classes."
    );

}

/* ============================================================
   ZENOVA ZEN2
   LIVE CLASSES — STUDENT PAGE
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
    query,
    where

} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";



/* ============================================================
   STATE
============================================================ */

let currentUser = null;

let student = null;

let currentCourse = null;

let liveClasses = [];

let subjects = [];

let selectedDate = new Date();

let selectedSubject = null;



/* ============================================================
   DOM
============================================================ */

const loadingScreen =
    document.getElementById(
        "loadingScreen"
    );


const app =
    document.getElementById(
        "app"
    );


const errorSection =
    document.getElementById(
        "errorSection"
    );


const errorMessage =
    document.getElementById(
        "errorMessage"
    );


const errorBackButton =
    document.getElementById(
        "errorBackButton"
    );


const backButton =
    document.getElementById(
        "backButton"
    );


const batchSubtitle =
    document.getElementById(
        "batchSubtitle"
    );


const todayList =
    document.getElementById(
        "todayList"
    );


const todayEmpty =
    document.getElementById(
        "todayEmpty"
    );


const todayCount =
    document.getElementById(
        "todayCount"
    );


const selectedDateLabel =
    document.getElementById(
        "selectedDateLabel"
    );


const selectedDateDay =
    document.getElementById(
        "selectedDateDay"
    );


const selectedDateList =
    document.getElementById(
        "selectedDateList"
    );


const selectedDateEmpty =
    document.getElementById(
        "selectedDateEmpty"
    );


const subjectList =
    document.getElementById(
        "subjectList"
    );


const subjectsEmpty =
    document.getElementById(
        "subjectsEmpty"
    );


const subjectClassesSection =
    document.getElementById(
        "subjectClassesSection"
    );


const selectedSubjectTitle =
    document.getElementById(
        "selectedSubjectTitle"
    );


const subjectClassesList =
    document.getElementById(
        "subjectClassesList"
    );


const subjectClassesEmpty =
    document.getElementById(
        "subjectClassesEmpty"
    );


const closeSubjectButton =
    document.getElementById(
        "closeSubjectButton"
    );


const previousDate =
    document.getElementById(
        "previousDate"
    );


const nextDate =
    document.getElementById(
        "nextDate"
    );


const scrollRecordingsButton =
    document.getElementById(
        "scrollRecordingsButton"
    );



/* ============================================================
   AUTH
============================================================ */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "../../account/login/";

            return;

        }


        currentUser =
            user;


        try {

            await initializePage();

        } catch (error) {

            console.error(
                "Zenova Live:",
                error
            );

            showError(
                error.message ||
                "Unable to load live classes."
            );

        }

    }
);



/* ============================================================
   INITIALIZE
============================================================ */

async function initializePage() {

    showLoading();


    await loadStudent();


    await loadCourse();


    await loadLiveClasses();


    await loadSubjects();


    renderBatchInfo();


    renderToday();


    renderSelectedDate();


    renderSubjects();


    hideLoading();

}



/* ============================================================
   LOAD STUDENT
============================================================ */

async function loadStudent() {

    const studentRef =
        doc(
            db,
            "zen2Students",
            currentUser.uid
        );


    const snapshot =
        await getDoc(
            studentRef
        );


    if (!snapshot.exists()) {

        throw new Error(
            "Your student profile could not be found."
        );

    }


    student = {

        id:
            snapshot.id,

        ...snapshot.data()

    };

}



/* ============================================================
   LOAD COURSE
============================================================ */

async function loadCourse() {

    const coursesSnapshot =
        await getDocs(
            collection(
                db,
                "zen2Courses"
            )
        );


    const courses =
        coursesSnapshot.docs.map(
            item => ({

                id:
                    item.id,

                ...item.data()

            })
        );


    const studentCourseId =
        firstValue(

            student.courseId,

            student.batchId,

            student.zen2CourseId,

            student.courseID

        );


    if (studentCourseId) {

        const direct =
            courses.find(
                course =>
                    course.id ===
                    studentCourseId
            );


        if (direct) {

            currentCourse =
                direct;

            return;

        }

    }


    const studentClass =
        normalizeClass(
            firstValue(

                student.className,

                student.class,

                student.standard,

                student.grade,

                student.targetClass

            )
        );


    if (studentClass) {

        const matches =
            courses.filter(
                course => {

                    const courseClass =
                        normalizeClass(

                            firstValue(

                                course.className,

                                course.class,

                                course.standard,

                                course.grade,

                                course.targetClass,

                                course.courseClass

                            )

                        );


                    return (
                        courseClass &&
                        courseClass ===
                        studentClass
                    );

                }
            );


        if (matches.length) {

            currentCourse =
                matches[0];

            return;

        }

    }


    /*
     * If no course can be resolved,
     * we still allow live classes to load
     * using student-level identifiers.
     */

    currentCourse = null;

}



/* ============================================================
   LOAD LIVE CLASSES
============================================================ */

async function loadLiveClasses() {

    const snapshot =
        await getDocs(
            collection(
                db,
                "liveClasses"
            )
        );


    liveClasses =
        snapshot.docs.map(
            item => ({

                id:
                    item.id,

                ...item.data()

            })
        );


    /*
     * Only active classes should normally
     * be visible.
     *
     * If active does not exist, keep
     * the class visible for compatibility.
     */

    liveClasses =
        liveClasses.filter(
            item =>
                item.active !== false
        );


    /*
     * Filter by student's course/batch
     * whenever a course ID is available.
     */

    if (currentCourse) {

        const courseId =
            currentCourse.id;


        const matching =
            liveClasses.filter(
                item =>
                    getCourseId(item) ===
                    courseId
            );


        if (matching.length) {

            liveClasses =
                matching;

        } else {

            /*
             * If no live class contains a
             * course ID, don't accidentally
             * hide everything.
             *
             * This keeps compatibility with
             * existing scheduler records.
             */

            const hasCourseAssignments =
                liveClasses.some(
                    item =>
                        Boolean(
                            getCourseId(item)
                        )
                );


            if (hasCourseAssignments) {

                liveClasses = [];

            }

        }

    }


    liveClasses.sort(
        compareLiveClasses
    );

}



/* ============================================================
   LOAD SUBJECTS
============================================================ */

async function loadSubjects() {

    if (!currentCourse) {

        /*
         * Fallback:
         * derive unique subjects directly
         * from liveClasses.
         */

        subjects =
            uniqueSubjectsFromLive();

        return;

    }


    const snapshot =
        await getDocs(
            collection(
                db,
                "zen2Subjects"
            )
        );


    const allSubjects =
        snapshot.docs.map(
            item => ({

                id:
                    item.id,

                ...item.data()

            })
        );


    const courseId =
        currentCourse.id;


    subjects =
        allSubjects.filter(
            subject => {

                if (
                    subject.active === false
                ) {

                    return false;

                }


                const subjectCourseId =
                    firstValue(

                        subject.courseId,

                        subject.zen2CourseId,

                        subject.courseID

                    );


                return (
                    subjectCourseId ===
                    courseId
                );

            }
        );


    /*
     * If there are no zen2Subjects,
     * fall back to subjects appearing
     * in liveClasses.
     */

    if (!subjects.length) {

        subjects =
            uniqueSubjectsFromLive();

    }


    subjects =
        deduplicateSubjects(
            subjects
        );


    subjects.sort(
        (a, b) =>
            Number(
                a.order || 999
            ) -
            Number(
                b.order || 999
            )
    );

}



/* ============================================================
   SUBJECT FALLBACK
============================================================ */

function uniqueSubjectsFromLive() {

    const map =
        new Map();


    liveClasses.forEach(
        item => {

            const name =
                getSubjectName(
                    item
                );


            if (!name) {

                return;

            }


            const key =
                normalizeText(
                    name
                );


            if (
                !map.has(key)
            ) {

                map.set(
                    key,
                    {

                        id:
                            firstValue(

                                item.subjectId,

                                item.subjectID

                            ) ||
                            key,

                        subjectName:
                            name,

                        name:
                            name,

                        order:
                            999

                    }
                );

            }

        }
    );


    return Array.from(
        map.values()
    );

}



/* ============================================================
   DEDUPLICATE SUBJECTS
============================================================ */

function deduplicateSubjects(
    items
) {

    const map =
        new Map();


    items.forEach(
        item => {

            const name =
                firstValue(

                    item.subjectName,

                    item.name,

                    item.title

                );


            if (!name) {

                return;

            }


            const key =
                normalizeText(
                    name
                );


            if (!map.has(key)) {

                map.set(
                    key,
                    item
                );

            }

        }
    );


    return Array.from(
        map.values()
    );

}



/* ============================================================
   BATCH INFO
============================================================ */

function renderBatchInfo() {

    if (!currentCourse) {

        batchSubtitle.textContent =
            "Join your scheduled classes or revise previous live sessions.";

        return;

    }


    const name =
        firstValue(

            currentCourse.name,

            currentCourse.courseName,

            currentCourse.batchName,

            currentCourse.title,

            currentCourse.crmCourseName

        );


    if (name) {

        batchSubtitle.textContent =
            `${name} • Join your scheduled classes or revise previous live sessions.`;

    }

}



/* ============================================================
   TODAY
============================================================ */

function renderToday() {

    const today =
        new Date();


    const items =
        getClassesForDate(
            today
        );


    todayCount.textContent =
        String(
            items.length
        );


    if (!items.length) {

        todayList.innerHTML =
            "";

        todayEmpty.classList.remove(
            "hidden"
        );

        return;

    }


    todayEmpty.classList.add(
        "hidden"
    );


    todayList.innerHTML =
        items
            .map(
                item =>
                    createLiveCard(
                        item,
                        true
                    )
            )
            .join("");

}



/* ============================================================
   DATE RENDER
============================================================ */

function renderSelectedDate() {

    selectedDateLabel.textContent =
        formatLongDate(
            selectedDate
        );


    selectedDateDay.textContent =
        selectedDate.toLocaleDateString(
            "en-IN",
            {
                weekday:
                    "long"
            }
        );


    const items =
        getClassesForDate(
            selectedDate
        );


    if (!items.length) {

        selectedDateList.innerHTML =
            "";

        selectedDateEmpty.classList.remove(
            "hidden"
        );

        return;

    }


    selectedDateEmpty.classList.add(
        "hidden"
    );


    selectedDateList.innerHTML =
        items
            .map(
                createDateClassCard
            )
            .join("");

}



/* ============================================================
   SUBJECTS
============================================================ */

function renderSubjects() {

    if (!subjects.length) {

        subjectList.innerHTML =
            "";

        subjectsEmpty.classList.remove(
            "hidden"
        );

        return;

    }


    subjectsEmpty.classList.add(
        "hidden"
    );


    subjectList.innerHTML =
        subjects
            .map(
                (
                    subject,
                    index
                ) => {

                    const name =
                        firstValue(

                            subject.subjectName,

                            subject.name,

                            subject.title

                        ) ||
                        "Subject";


                    const count =
                        getSubjectClassCount(
                            name,
                            subject.id
                        );


                    return `

                        <button
                            type="button"
                            class="subject-card"
                            data-subject-index="${index}"
                        >

                            <div
                                class="subject-icon"
                            >
                                ${getSubjectInitial(
                                    name
                                )}
                            </div>

                            <h3>
                                ${escapeHtml(
                                    name
                                )}
                            </h3>

                            <p>
                                ${count}
                                ${
                                    count === 1
                                        ? "live class"
                                        : "live classes"
                                }
                            </p>

                            <div
                                class="subject-arrow"
                            >
                                VIEW CLASSES →
                            </div>

                        </button>

                    `;

                }
            )
            .join("");


    subjectList
        .querySelectorAll(
            "[data-subject-index]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                button.dataset
                                    .subjectIndex
                            );


                        openSubject(
                            subjects[index]
                        );

                    }
                );

            }
        );

}



/* ============================================================
   OPEN SUBJECT
============================================================ */

function openSubject(
    subject
) {

    selectedSubject =
        subject;


    const name =
        firstValue(

            subject.subjectName,

            subject.name,

            subject.title

        ) ||
        "Subject";


    selectedSubjectTitle.textContent =
        name;


    const subjectId =
        subject.id;


    const items =
        liveClasses.filter(
            item => {

                const itemSubjectId =
                    firstValue(

                        item.subjectId,

                        item.subjectID

                    );


                if (
                    subjectId &&
                    itemSubjectId
                ) {

                    return (
                        itemSubjectId ===
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
                        name
                    )
                );

            }
        );


    renderSubjectClasses(
        items
    );


    subjectClassesSection.classList.remove(
        "hidden"
    );


    setTimeout(
        () => {

            subjectClassesSection.scrollIntoView(
                {
                    behavior:
                        "smooth",

                    block:
                        "start"
                }
            );

        },
        50
    );

}



/* ============================================================
   SUBJECT CLASSES
============================================================ */

function renderSubjectClasses(
    items
) {

    const sorted =
        [...items].sort(
            compareLiveClasses
        );


    if (!sorted.length) {

        subjectClassesList.innerHTML =
            "";

        subjectClassesEmpty.classList.remove(
            "hidden"
        );

        return;

    }


    subjectClassesEmpty.classList.add(
        "hidden"
    );


    subjectClassesList.innerHTML =
        sorted
            .map(
                createSubjectClassCard
            )
            .join("");

}



/* ============================================================
   CLOSE SUBJECT
============================================================ */

closeSubjectButton.addEventListener(
    "click",
    () => {

        selectedSubject =
            null;

        subjectClassesSection.classList.add(
            "hidden"
        );

    }
);



/* ============================================================
   DATE NAVIGATION
============================================================ */

previousDate.addEventListener(
    "click",
    () => {

        selectedDate =
            addDays(
                selectedDate,
                -1
            );


        renderSelectedDate();

    }
);


nextDate.addEventListener(
    "click",
    () => {

        selectedDate =
            addDays(
                selectedDate,
                1
            );


        renderSelectedDate();

    }
);



/* ============================================================
   RECORDINGS SCROLL
============================================================ */

scrollRecordingsButton.addEventListener(
    "click",
    () => {

        document
            .getElementById(
                "dateSection"
            )
            .scrollIntoView(
                {
                    behavior:
                        "smooth"
                }
            );

    }
);



/* ============================================================
   LIVE CARD
============================================================ */

function createLiveCard(
    item,
    isToday = false
) {

    const status =
        getClassStatus(
            item
        );


    const subject =
        getSubjectName(
            item
        ) ||
        "Live Class";


    const title =
        getClassTitle(
            item
        );


    const topic =
        getTopic(
            item
        );


    const faculty =
        getFaculty(
            item
        );


    const time =
        getStartDate(
            item
        );


    const button =
        getActionButton(
            item,
            status
        );


    return `

        <article
            class="live-card"
        >

            <div
                class="live-card-top"
            >

                <div>

                    <div
                        class="live-subject"
                    >
                        ${escapeHtml(
                            subject
                        )}
                    </div>

                </div>


                <span
                    class="live-status ${status.className}"
                >
                    ${status.label}
                </span>

            </div>


            <h3>
                ${escapeHtml(
                    title
                )}
            </h3>


            ${
                topic
                    ? `
                        <p
                            class="live-topic"
                        >
                            ${escapeHtml(
                                topic
                            )}
                        </p>
                    `
                    : ""
            }


            <div
                class="live-meta"
            >

                ${
                    faculty
                        ? `
                            <div
                                class="meta-item"
                            >
                                <span
                                    class="meta-icon"
                                >
                                    ●
                                </span>

                                ${escapeHtml(
                                    faculty
                                )}
                            </div>
                        `
                        : ""
                }


                ${
                    item.chapterName ||
                    item.chapter
                        ? `
                            <div
                                class="meta-item"
                            >
                                <span
                                    class="meta-icon"
                                >
                                    #
                                </span>

                                ${escapeHtml(
                                    firstValue(
                                        item.chapterName,
                                        item.chapter
                                    )
                                )}
                            </div>
                        `
                        : ""
                }

            </div>


            <div
                class="live-card-bottom"
            >

                <div
                    class="time-block"
                >

                    <strong>
                        ${formatTime(
                            time
                        )}
                    </strong>

                    <span>
                        ${isToday
                            ? "Today"
                            : formatShortDate(
                                time
                            )}
                    </span>

                </div>


                ${button}

            </div>

        </article>

    `;

}



/* ============================================================
   DATE CLASS CARD
============================================================ */

function createDateClassCard(
    item
) {

    const date =
        getStartDate(
            item
        );


    const subject =
        getSubjectName(
            item
        ) ||
        "Live Class";


    const title =
        getClassTitle(
            item
        );


    const faculty =
        getFaculty(
            item
        );


    const status =
        getClassStatus(
            item
        );


    return `

        <article
            class="date-class-card"
        >

            <div
                class="date-class-time"
            >

                <strong>
                    ${formatTime(
                        date
                    )}
                </strong>

                <span>
                    ${formatPeriod(
                        date
                    )}
                </span>

            </div>


            <div
                class="date-class-divider"
            ></div>


            <div
                class="date-class-info"
            >

                <div
                    class="subject"
                >
                    ${escapeHtml(
                        subject
                    )}
                </div>

                <h3>
                    ${escapeHtml(
                        title
                    )}
                </h3>

                <p>
                    ${
                        faculty
                            ? escapeHtml(
                                faculty
                            ) + " • "
                            : ""
                    }

                    ${escapeHtml(
                        formatLongDate(
                            date
                        )
                    )}
                </p>

            </div>


            ${
                status.canWatch
                    ? `
                        <button
                            type="button"
                            class="small-watch-button"
                            data-watch-id="${escapeAttr(
                                item.id
                            )}"
                        >
                            WATCH
                        </button>
                    `
                    : `
                        <button
                            type="button"
                            class="small-watch-button"
                            disabled
                        >
                            ${status.label}
                        </button>
                    `
            }

        </article>

    `;

}



/* ============================================================
   SUBJECT CLASS CARD
============================================================ */

function createSubjectClassCard(
    item
) {

    const date =
        getStartDate(
            item
        );


    const subject =
        getSubjectName(
            item
        );


    const title =
        getClassTitle(
            item
        );


    const faculty =
        getFaculty(
            item
        );


    const thumbnail =
        getThumbnail(
            item
        );


    return `

        <article
            class="subject-class-card"
        >

            <div
                class="subject-class-thumbnail"
            >

                ${
                    thumbnail
                        ? `
                            <img
                                src="${escapeAttr(
                                    thumbnail
                                )}"
                                alt=""
                            >
                        `
                        : ""
                }


                <span
                    class="thumbnail-play"
                >
                    ▶
                </span>

            </div>


            <div
                class="subject-class-info"
            >

                <div
                    class="subject-label"
                >
                    ${escapeHtml(
                        subject
                    )}
                </div>


                <h3>
                    ${escapeHtml(
                        title
                    )}
                </h3>


                <p>
                    ${
                        faculty
                            ? escapeHtml(
                                faculty
                            ) + " • "
                            : ""
                    }

                    ${escapeHtml(
                        formatLongDate(
                            date
                        )
                    )}

                    •

                    ${escapeHtml(
                        formatWeekday(
                            date
                        )
                    )}
                </p>

            </div>


            <button
                type="button"
                class="watch-button"
                data-watch-id="${escapeAttr(
                    item.id
                )}"
            >
                WATCH
            </button>

        </article>

    `;

}



/* ============================================================
   EVENT DELEGATION
============================================================ */

document.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-watch-id]"
            );


        if (!button) {

            return;

        }


        const id =
            button.dataset.watchId;


        if (!id) {

            return;

        }


        openLivePlayer(
            id
        );

    }
);



/* ============================================================
   ACTION BUTTON
============================================================ */

function getActionButton(
    item,
    status
) {

    if (
        status.canJoin
    ) {

        return `

            <button
                type="button"
                class="join-button live"
                data-watch-id="${escapeAttr(
                    item.id
                )}"
            >
                JOIN LIVE
            </button>

        `;

    }


    if (
        status.canWatch
    ) {

        return `

            <button
                type="button"
                class="join-button watch"
                data-watch-id="${escapeAttr(
                    item.id
                )}"
            >
                WATCH
            </button>

        `;

    }


    return `

        <button
            type="button"
            class="join-button"
            disabled
        >
            ${status.label}
        </button>

    `;

}



/* ============================================================
   OPEN LIVE PLAYER
============================================================ */

function openLivePlayer(
    liveClassId
) {

    const url =
        new URL(
            "../livevideoplayer/",
            window.location.href
        );


    url.searchParams.set(
        "liveClassId",
        liveClassId
    );


    window.location.href =
        url.toString();

}



/* ============================================================
   CLASS STATUS
============================================================ */

function getClassStatus(
    item
) {

    const now =
        new Date();


    const start =
        getStartDate(
            item
        );


    const end =
        getEndDate(
            item,
            start
        );


    /*
     * Explicit status from scheduler.
     */

    const rawStatus =
        String(
            firstValue(

                item.status,

                item.liveStatus,

                item.classStatus

            ) || ""
        )
        .trim()
        .toLowerCase();


    if (
        rawStatus === "live" ||
        rawStatus === "live_now" ||
        rawStatus === "started"
    ) {

        return {

            label:
                "LIVE NOW",

            className:
                "now",

            canJoin:
                true,

            canWatch:
                true

        };

    }


    /*
     * Time-based status.
     */

    if (
        start &&
        now < start
    ) {

        return {

            label:
                "UPCOMING",

            className:
                "upcoming",

            canJoin:
                false,

            canWatch:
                false

        };

    }


    if (
        start &&
        end &&
        now >= start &&
        now <= end
    ) {

        return {

            label:
                "LIVE NOW",

            className:
                "now",

            canJoin:
                true,

            canWatch:
                true

        };

    }


    /*
     * If the class has a recorded
     * stream/player URL or recording
     * flag, allow WATCH.
     */

    if (
        hasRecording(
            item
        )
    ) {

        return {

            label:
                "RECORDED",

            className:
                "ended",

            canJoin:
                false,

            canWatch:
                true

        };

    }


    /*
     * A class in the past is considered
     * watchable. The live player can
     * decide whether a recording exists.
     */

    if (
        start &&
        now > start
    ) {

        return {

            label:
                "ENDED",

            className:
                "ended",

            canJoin:
                false,

            canWatch:
                true

        };

    }


    return {

        label:
            "SCHEDULED",

        className:
            "upcoming",

        canJoin:
            false,

        canWatch:
            false

    };

}



/* ============================================================
   GET CLASSES FOR DATE
============================================================ */

function getClassesForDate(
    date
) {

    return liveClasses
        .filter(
            item => {

                const start =
                    getStartDate(
                        item
                    );


                if (!start) {

                    return false;

                }


                return isSameDate(
                    start,
                    date
                );

            }
        )
        .sort(
            compareLiveClasses
        );

}



/* ============================================================
   COURSE ID
============================================================ */

function getCourseId(
    item
) {

    return firstValue(

        item.courseId,

        item.courseID,

        item.zen2CourseId,

        item.batchId,

        item.batchID,

        item.crmCourseId,

        item.crmCourseID

    );

}



/* ============================================================
   SUBJECT NAME
============================================================ */

function getSubjectName(
    item
) {

    return firstValue(

        item.subjectName,

        item.subject,

        item.subjectTitle

    ) || "";

}



/* ============================================================
   CLASS TITLE
============================================================ */

function getClassTitle(
    item
) {

    return firstValue(

        item.title,

        item.classTitle,

        item.liveTitle,

        item.topic,

        item.name

    ) || "Live Class";

}



/* ============================================================
   TOPIC
============================================================ */

function getTopic(
    item
) {

    return firstValue(

        item.topic,

        item.chapterName,

        item.chapter,

        item.description

    ) || "";

}



/* ============================================================
   FACULTY
============================================================ */

function getFaculty(
    item
) {

    return firstValue(

        item.facultyName,

        item.teacherName,

        item.teacher,

        item.faculty,

        item.mentorName,

        item.instructorName,

        item.instructor

    ) || "";

}



/* ============================================================
   START DATE
============================================================ */

function getStartDate(
    item
) {

    /*
     * Timestamp fields.
     */

    const timestampValue =
        firstValue(

            item.startAt,

            item.startTime,

            item.scheduledAt,

            item.scheduledDateTime,

            item.dateTime,

            item.liveStart

        );


    const parsedTimestamp =
        parseDateValue(
            timestampValue
        );


    if (
        parsedTimestamp
    ) {

        return parsedTimestamp;

    }


    /*
     * Date + time fields.
     */

    const dateValue =
        firstValue(

            item.date,

            item.classDate,

            item.liveDate,

            item.scheduledDate,

            item.startDate

        );


    const timeValue =
        firstValue(

            item.time,

            item.classTime,

            item.startClockTime,

            item.scheduledTime

        );


    if (
        dateValue
    ) {

        const combined =
            combineDateAndTime(
                dateValue,
                timeValue
            );


        if (
            combined
        ) {

            return combined;

        }

    }


    return null;

}



/* ============================================================
   END DATE
============================================================ */

function getEndDate(
    item,
    startDate
) {

    const explicit =
        firstValue(

            item.endAt,

            item.endTime,

            item.endedAt,

            item.liveEnd,

            item.scheduledEnd

        );


    const parsed =
        parseDateValue(
            explicit
        );


    if (
        parsed
    ) {

        return parsed;

    }


    const duration =
        Number(
            firstValue(

                item.durationMinutes,

                item.duration,

                item.classDuration

            ) || 0
        );


    if (
        startDate &&
        duration > 0
    ) {

        return new Date(
            startDate.getTime() +
            duration * 60000
        );

    }


    /*
     * Default live duration:
     * 2 hours.
     */

    if (
        startDate
    ) {

        return new Date(
            startDate.getTime() +
            2 * 60 * 60 * 1000
        );

    }


    return null;

}



/* ============================================================
   RECORDING
============================================================ */

function hasRecording(
    item
) {

    return Boolean(

        firstValue(

            item.recordingUrl,

            item.recordedUrl,

            item.replayUrl,

            item.videoUrl,

            item.recording,

            item.hasRecording

        )

    );

}



/* ============================================================
   THUMBNAIL
============================================================ */

function getThumbnail(
    item
) {

    const direct =
        firstValue(

            item.thumbnailUrl,

            item.thumbnail,

            item.imageUrl,

            item.image

        );


    if (direct) {

        return direct;

    }


    const videoUrl =
        firstValue(

            item.recordingUrl,

            item.recordedUrl,

            item.videoUrl,

            item.youtubeUrl,

            item.streamUrl

        );


    const youtubeId =
        extractYouTubeId(
            videoUrl
        );


    if (
        youtubeId
    ) {

        return (
            "https://img.youtube.com/vi/" +
            youtubeId +
            "/hqdefault.jpg"
        );

    }


    return "";

}



/* ============================================================
   YOUTUBE ID
============================================================ */

function extractYouTubeId(
    url
) {

    if (!url) {

        return "";

    }


    const value =
        String(
            url
        ).trim();


    const patterns = [

        /youtu\.be\/([^?&/]+)/i,

        /youtube\.com\/watch\?v=([^?&/]+)/i,

        /youtube\.com\/embed\/([^?&/]+)/i,

        /youtube\.com\/shorts\/([^?&/]+)/i,

        /youtube\.com\/live\/([^?&/]+)/i

    ];


    for (
        const pattern of patterns
    ) {

        const match =
            value.match(
                pattern
            );


        if (
            match &&
            match[1]
        ) {

            return match[1];

        }

    }


    return "";

}



/* ============================================================
   DATE PARSING
============================================================ */

function parseDateValue(
    value
) {

    if (!value) {

        return null;

    }


    if (
        value instanceof Date
    ) {

        return isNaN(
            value.getTime()
        )
            ? null
            : value;

    }


    /*
     * Firestore Timestamp
     */

    if (
        typeof value.toDate ===
        "function"
    ) {

        const date =
            value.toDate();


        return isNaN(
            date.getTime()
        )
            ? null
            : date;

    }


    /*
     * Firestore timestamp-like object
     */

    if (
        typeof value ===
        "object" &&
        value.seconds
    ) {

        const date =
            new Date(
                Number(
                    value.seconds
                ) * 1000
            );


        return isNaN(
            date.getTime()
        )
            ? null
            : date;

    }


    if (
        typeof value ===
        "number"
    ) {

        const date =
            new Date(
                value > 100000000000
                    ? value
                    : value * 1000
            );


        return isNaN(
            date.getTime()
        )
            ? null
            : date;

    }


    if (
        typeof value ===
        "string"
    ) {

        const parsed =
            new Date(
                value
            );


        if (
            !isNaN(
                parsed.getTime()
            )
        ) {

            return parsed;

        }

    }


    return null;

}



/* ============================================================
   COMBINE DATE + TIME
============================================================ */

function combineDateAndTime(
    dateValue,
    timeValue
) {

    let baseDate =
        parseDateValue(
            dateValue
        );


    /*
     * Date-only strings such as
     * 2026-09-29.
     */

    if (
        !baseDate &&
        typeof dateValue === "string"
    ) {

        const match =
            dateValue.match(
                /^(\d{4})-(\d{1,2})-(\d{1,2})$/
            );


        if (match) {

            baseDate =
                new Date(

                    Number(
                        match[1]
                    ),

                    Number(
                        match[2]
                    ) - 1,

                    Number(
                        match[3]
                    ),

                    0,
                    0,
                    0,
                    0

                );

        }

    }


    if (!baseDate) {

        return null;

    }


    const result =
        new Date(
            baseDate
        );


    if (
        !timeValue
    ) {

        return result;

    }


    const text =
        String(
            timeValue
        )
        .trim()
        .toUpperCase();


    const match =
        text.match(
            /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/
        );


    if (
        !match
    ) {

        return result;

    }


    let hours =
        Number(
            match[1]
        );


    const minutes =
        Number(
            match[2] || 0
        );


    const period =
        match[3];


    if (
        period === "PM" &&
        hours < 12
    ) {

        hours += 12;

    }


    if (
        period === "AM" &&
        hours === 12
    ) {

        hours = 0;

    }


    result.setHours(
        hours,
        minutes,
        0,
        0
    );


    return result;

}



/* ============================================================
   SORT
============================================================ */

function compareLiveClasses(
    a,
    b
) {

    const aDate =
        getStartDate(
            a
        );


    const bDate =
        getStartDate(
            b
        );


    if (
        !aDate &&
        !bDate
    ) {

        return 0;

    }


    if (!aDate) {

        return 1;

    }


    if (!bDate) {

        return -1;

    }


    return (
        bDate.getTime() -
        aDate.getTime()
    );

}



/* ============================================================
   SUBJECT CLASS COUNT
============================================================ */

function getSubjectClassCount(
    subjectName,
    subjectId
) {

    return liveClasses.filter(
        item => {

            const itemSubjectId =
                firstValue(

                    item.subjectId,

                    item.subjectID

                );


            if (
                subjectId &&
                itemSubjectId
            ) {

                return (
                    subjectId ===
                    itemSubjectId
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

}



/* ============================================================
   HELPERS
============================================================ */

function firstValue(
    ...values
) {

    return values.find(
        value =>

            value !==
            undefined &&

            value !==
            null &&

            String(
                value
            ).trim() !== ""

    );

}



function normalizeText(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase();

}



function normalizeClass(
    value
) {

    const text =
        normalizeText(
            value
        )
        .replace(
            /\s+/g,
            " "
        );


    if (
        text === "10" ||
        text === "10th" ||
        text === "class 10" ||
        text === "class 10th" ||
        text.includes("10th")
    ) {

        return "10th";

    }


    if (
        text === "9" ||
        text === "9th" ||
        text === "class 9"
    ) {

        return "9th";

    }


    if (
        text === "8" ||
        text === "8th" ||
        text === "class 8"
    ) {

        return "8th";

    }


    return text;

}



function getSubjectInitial(
    name
) {

    const clean =
        String(
            name || "S"
        )
        .trim();


    return clean
        .charAt(0)
        .toUpperCase();

}



function addDays(
    date,
    amount
) {

    const result =
        new Date(
            date
        );


    result.setDate(
        result.getDate() +
        amount
    );


    return result;

}



function isSameDate(
    first,
    second
) {

    return (

        first.getFullYear() ===
        second.getFullYear()

        &&

        first.getMonth() ===
        second.getMonth()

        &&

        first.getDate() ===
        second.getDate()

    );

}



function formatLongDate(
    date
) {

    if (!date) {

        return "Date unavailable";

    }


    return date.toLocaleDateString(
        "en-IN",
        {

            day:
                "numeric",

            month:
                "long",

            year:
                "numeric"

        }
    );

}



function formatShortDate(
    date
) {

    if (!date) {

        return "";

    }


    return date.toLocaleDateString(
        "en-IN",
        {

            day:
                "numeric",

            month:
                "short"

        }
    );

}



function formatWeekday(
    date
) {

    if (!date) {

        return "";

    }


    return date.toLocaleDateString(
        "en-IN",
        {

            weekday:
                "long"

        }
    );

}



function formatTime(
    date
) {

    if (!date) {

        return "--:--";

    }


    return date.toLocaleTimeString(
        "en-IN",
        {

            hour:
                "numeric",

            minute:
                "2-digit",

            hour12:
                true

        }
    );

}



function formatPeriod(
    date
) {

    if (!date) {

        return "";

    }


    return date.toLocaleTimeString(
        "en-IN",
        {

            hour:
                "numeric",

            hour12:
                true

        }
    )
    .split(" ")
    .pop();

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



/* ============================================================
   LOADING / ERROR
============================================================ */

function showLoading() {

    loadingScreen.classList.remove(
        "hidden"
    );

    app.classList.add(
        "hidden"
    );

    errorSection.classList.add(
        "hidden"
    );

}



function hideLoading() {

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



/* ============================================================
   NAVIGATION
============================================================ */

backButton.addEventListener(
    "click",
    () => {

        if (
            document.referrer
        ) {

            window.history.back();

            return;

        }


        window.location.href =
            "../";

    }
);


errorBackButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "../";

    }
);



document
    .querySelectorAll(
        ".nav-item[data-route]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const route =
                        button.dataset.route;


                    if (
                        route
                    ) {

                        window.location.href =
                            route;

                    }

                }
            );

        }
    );

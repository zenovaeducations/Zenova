import { db } from "../../firebase/firebase-config.js";

import {
    collection,
    getDocs,
    query,
    where,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    getFunctions,
    httpsCallable
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-functions.js";


/* =========================================================
   FIREBASE FUNCTIONS
========================================================= */

const functions = getFunctions(
    undefined,
    "asia-south1"
);

const createZoomMeeting = httpsCallable(
    functions,
    "createZoomMeeting"
);


/* =========================================================
   ELEMENTS
========================================================= */

const form =
    document.getElementById("liveForm");

const course =
    document.getElementById("course");

const subject =
    document.getElementById("subject");

const chapter =
    document.getElementById("chapter");

const titleInput =
    document.getElementById("title");

const teacherInput =
    document.getElementById("teacher");

const thumbnailInput =
    document.getElementById("thumbnail");

const dateInput =
    document.getElementById("date");

const timeInput =
    document.getElementById("time");

const message =
    document.getElementById("message");

const saveButton =
    document.getElementById("saveButton");

const classes =
    document.getElementById("classes");

const refreshButton =
    document.getElementById("refresh");


/* =========================================================
   DATA
========================================================= */

let courses = [];
let subjects = [];
let chapters = [];
let liveClasses = [];


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    text,
    type = ""
) {

    if (!message) return;

    message.textContent = text;

    message.className = "message";

    if (type) {
        message.classList.add(type);
    }
}


/* =========================================================
   LOAD COURSES
========================================================= */

async function loadCourses() {

    try {

        showMessage(
            "Loading courses..."
        );

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "zen2Courses"
                )
            );

        courses =
            snapshot.docs.map(
                item => ({
                    id: item.id,
                    ...item.data()
                })
            );


        courses.sort(
            (a, b) =>
                Number(
                    a.order || 0
                ) -
                Number(
                    b.order || 0
                )
        );


        course.innerHTML = `
            <option value="">
                Select Course
            </option>
        `;


        courses.forEach(
            item => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    item.id;

                option.textContent =
                    item.name ||
                    item.title ||
                    item.courseName ||
                    item.className ||
                    item.crmCourseName ||
                    "Course";

                course.appendChild(
                    option
                );

            }
        );


        course.disabled = false;

        showMessage("");

    } catch (error) {

        console.error(
            "LOAD COURSES ERROR:",
            error
        );

        showMessage(
            "Unable to load courses: " +
            (error.message || error),
            "error"
        );

    }

}


/* =========================================================
   LOAD SUBJECTS
========================================================= */

async function loadSubjects(
    courseId
) {

    subject.innerHTML = `
        <option value="">
            Select Subject
        </option>
    `;

    chapter.innerHTML = `
        <option value="">
            Select Chapter
        </option>
    `;

    subject.disabled = true;
    chapter.disabled = true;

    subjects = [];
    chapters = [];


    if (!courseId) {
        return;
    }


    try {

        showMessage(
            "Loading subjects..."
        );


        /*
         * IMPORTANT:
         * Subjects are connected using courseId.
         */

        const q =
            query(
                collection(
                    db,
                    "zen2Subjects"
                ),
                where(
                    "courseId",
                    "==",
                    courseId
                )
            );


        const snapshot =
            await getDocs(q);


        subjects =
            snapshot.docs.map(
                item => ({
                    id: item.id,
                    ...item.data()
                })
            );


        subjects.sort(
            (a, b) =>
                Number(
                    a.order || 0
                ) -
                Number(
                    b.order || 0
                )
        );


        subjects.forEach(
            item => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    item.id;

                option.textContent =
                    item.name ||
                    item.title ||
                    item.subjectName ||
                    item.subject ||
                    "Subject";

                subject.appendChild(
                    option
                );

            }
        );


        subject.disabled =
            subjects.length === 0;


        if (
            subjects.length === 0
        ) {

            showMessage(
                "No subjects found for this course.",
                "error"
            );

        } else {

            showMessage("");

        }

    } catch (error) {

        console.error(
            "LOAD SUBJECTS ERROR:",
            error
        );

        showMessage(
            "Unable to load subjects: " +
            (error.message || error),
            "error"
        );

    }

}


/* =========================================================
   LOAD CHAPTERS
========================================================= */

async function loadChapters(
    subjectId
) {

    chapter.innerHTML = `
        <option value="">
            Select Chapter
        </option>
    `;

    chapter.disabled = true;

    chapters = [];


    if (!subjectId) {
        return;
    }


    try {

        showMessage(
            "Loading chapters..."
        );


        /*
         * IMPORTANT:
         * Chapters are connected using subjectId.
         */

        const q =
            query(
                collection(
                    db,
                    "zen2Chapters"
                ),
                where(
                    "subjectId",
                    "==",
                    subjectId
                )
            );


        const snapshot =
            await getDocs(q);


        chapters =
            snapshot.docs.map(
                item => ({
                    id: item.id,
                    ...item.data()
                })
            );


        chapters =
            chapters.filter(
                item =>
                    item.active !== false
            );


        chapters.sort(
            (a, b) => {

                const aNumber =
                    Number(
                        a.chapterNumber ??
                        a.order ??
                        0
                    );

                const bNumber =
                    Number(
                        b.chapterNumber ??
                        b.order ??
                        0
                    );

                return (
                    aNumber -
                    bNumber
                );

            }
        );


        chapters.forEach(
            item => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    item.id;

                option.textContent =
                    item.name ||
                    item.title ||
                    item.chapterName ||
                    "Chapter";

                chapter.appendChild(
                    option
                );

            }
        );


        chapter.disabled =
            chapters.length === 0;


        if (
            chapters.length === 0
        ) {

            showMessage(
                "No chapters found for this subject.",
                "error"
            );

        } else {

            showMessage("");

        }

    } catch (error) {

        console.error(
            "LOAD CHAPTERS ERROR:",
            error
        );

        showMessage(
            "Unable to load chapters: " +
            (error.message || error),
            "error"
        );

    }

}


/* =========================================================
   COURSE CHANGE
========================================================= */

course.addEventListener(
    "change",
    async () => {

        await loadSubjects(
            course.value
        );

        autoTitle();

    }
);


/* =========================================================
   SUBJECT CHANGE
========================================================= */

subject.addEventListener(
    "change",
    async () => {

        await loadChapters(
            subject.value
        );

        autoTitle();

    }
);


/* =========================================================
   CHAPTER CHANGE
========================================================= */

chapter.addEventListener(
    "change",
    () => {

        autoTitle();

    }
);


/* =========================================================
   GET SELECTED NAME
========================================================= */

function getSelectedName(
    select
) {

    if (
        !select ||
        !select.value
    ) {
        return "";
    }

    const option =
        select.options[
            select.selectedIndex
        ];

    return (
        option?.textContent?.trim() ||
        ""
    );

}


/* =========================================================
   AUTO TITLE
========================================================= */

function autoTitle() {

    if (
        titleInput &&
        titleInput.value.trim()
    ) {
        return;
    }


    const courseName =
        getSelectedName(course);

    const subjectName =
        getSelectedName(subject);

    const chapterName =
        getSelectedName(chapter);


    const title = [
        courseName,
        subjectName,
        chapterName
    ]
        .filter(Boolean)
        .join(" - ");


    if (titleInput) {
        titleInput.value =
            title;
    }

}


/* =========================================================
   CREATE ZOOM MEETING
========================================================= */

async function createZoomForClass() {

    const title =
        titleInput.value.trim();

    const scheduledDate =
        dateInput.value.trim();

    const scheduledTime =
        timeInput.value.trim();


    /*
     * Existing backend supports:
     *
     * title
     * scheduledDate
     * scheduledTime
     * duration
     */

    const result =
        await createZoomMeeting({

            title,

            scheduledDate,

            scheduledTime,

            duration: 60

        });


    return result.data;

}


/* =========================================================
   FORM SUBMIT
========================================================= */

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        /* -----------------------------------------
           VALIDATION
        ----------------------------------------- */

        if (!course.value) {

            showMessage(
                "Please select a course.",
                "error"
            );

            return;

        }


        if (!subject.value) {

            showMessage(
                "Please select a subject.",
                "error"
            );

            return;

        }


        if (!chapter.value) {

            showMessage(
                "Please select a chapter.",
                "error"
            );

            return;

        }


        if (!titleInput.value.trim()) {

            autoTitle();

        }


        if (!titleInput.value.trim()) {

            showMessage(
                "Please enter a class title.",
                "error"
            );

            return;

        }


        if (!teacherInput.value.trim()) {

            showMessage(
                "Please enter teacher name.",
                "error"
            );

            return;

        }


        if (!dateInput.value) {

            showMessage(
                "Please select class date.",
                "error"
            );

            return;

        }


        if (!timeInput.value) {

            showMessage(
                "Please select class time.",
                "error"
            );

            return;

        }


        /* -----------------------------------------
           DISABLE BUTTON
        ----------------------------------------- */

        saveButton.disabled =
            true;

        saveButton.textContent =
            "CREATING ZOOM MEETING...";


        try {

            /* =====================================
               CREATE ZOOM
            ===================================== */

            const zoomData =
                await createZoomForClass();


            console.log(
                "ZOOM RESPONSE:",
                zoomData
            );


            if (
                !zoomData ||
                !zoomData.meetingId
            ) {

                throw new Error(
                    "Zoom meeting was not created."
                );

            }


            /* =====================================
               SAVE LIVE CLASS
            ===================================== */

            saveButton.textContent =
                "SAVING LIVE CLASS...";


            const data = {

                title:
                    titleInput.value.trim(),

                teacherName:
                    teacherInput.value.trim(),

                facultyName:
                    teacherInput.value.trim(),

                courseId:
                    course.value,

                courseName:
                    getSelectedName(
                        course
                    ),

                subjectId:
                    subject.value,

                subjectName:
                    getSelectedName(
                        subject
                    ),

                chapterId:
                    chapter.value,

                chapterName:
                    getSelectedName(
                        chapter
                    ),

                thumbnailUrl:
                    thumbnailInput.value.trim(),

                scheduledDate:
                    dateInput.value,

                scheduledTime:
                    timeInput.value,

                duration:
                    60,

                liveType:
                    "ZOOM",

                accessType:
                    "PAID",

                status:
                    "scheduled",

                zoomCreated:
                    true,

                zoomMeetingId:
                    zoomData.meetingId ||
                    "",

                zoomMeetingNumber:
                    zoomData.meetingNumber ||
                    "",

                zoomPassword:
                    zoomData.password ||
                    "",

                zoomJoinUrl:
                    zoomData.joinUrl ||
                    "",

                zoomStartUrl:
                    zoomData.startUrl ||
                    "",

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            };


            const ref =
                await addDoc(
                    collection(
                        db,
                        "liveClasses"
                    ),
                    data
                );


            console.log(
                "LIVE CLASS CREATED:",
                ref.id
            );


            showMessage(
                "Live class created successfully.",
                "success"
            );


            form.reset();


            subject.innerHTML = `
                <option value="">
                    Select Subject
                </option>
            `;

            chapter.innerHTML = `
                <option value="">
                    Select Chapter
                </option>
            `;

            subject.disabled = true;
            chapter.disabled = true;


            await loadClasses();


        } catch (error) {

            console.error(
                "LIVE CLASS ERROR:",
                error
            );

            console.error(
                "ERROR DETAILS:",
                error?.details
            );


            let errorMessage =
                "Unable to create live class.";


            if (
                error?.details?.message
            ) {

                errorMessage =
                    error.details.message;

            } else if (
                error?.message
            ) {

                errorMessage =
                    error.message;

            }


            showMessage(
                errorMessage,
                "error"
            );

        } finally {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "SCHEDULE LIVE CLASS";

        }

    }
);


/* =========================================================
   LOAD EXISTING LIVE CLASSES
========================================================= */

async function loadClasses() {

    if (!classes) {
        return;
    }


    try {

        classes.innerHTML =
            "Loading...";


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
                    id: item.id,
                    ...item.data()
                })
            );


        liveClasses.sort(
            (a, b) => {

                const aDate =
                    `${a.scheduledDate || ""} ${a.scheduledTime || ""}`;

                const bDate =
                    `${b.scheduledDate || ""} ${b.scheduledTime || ""}`;

                return aDate.localeCompare(
                    bDate
                );

            }
        );


        renderClasses();


    } catch (error) {

        console.error(
            "LOAD LIVE CLASSES ERROR:",
            error
        );

        classes.innerHTML =
            "Unable to load classes.";

    }

}


/* =========================================================
   RENDER LIVE CLASSES
========================================================= */

function renderClasses() {

    if (
        !liveClasses.length
    ) {

        classes.innerHTML = `
            <div class="empty">
                No live classes scheduled yet.
            </div>
        `;

        return;

    }


    classes.innerHTML = "";


    liveClasses.forEach(
        item => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "class-card";


            card.innerHTML = `

                <div class="class-main">

                    <h3>
                        ${escapeHtml(
                            item.title ||
                            "Live Class"
                        )}
                    </h3>

                    <p>
                        ${escapeHtml(
                            item.courseName ||
                            ""
                        )}
                        ${item.subjectName
                            ? " • " +
                              escapeHtml(
                                  item.subjectName
                              )
                            : ""}
                        ${item.chapterName
                            ? " • " +
                              escapeHtml(
                                  item.chapterName
                              )
                            : ""}
                    </p>

                    <p class="class-time">
                        ${escapeHtml(
                            item.scheduledDate ||
                            ""
                        )}
                        ${item.scheduledTime
                            ? " at " +
                              escapeHtml(
                                  item.scheduledTime
                              )
                            : ""}
                    </p>

                </div>

                <div class="class-actions">

                    ${
                        item.zoomJoinUrl
                            ? `
                                <button
                                    class="join-button"
                                    data-id="${item.id}"
                                >
                                    Join Zoom
                                </button>
                              `
                            : ""
                    }

                </div>

            `;


            const joinButton =
                card.querySelector(
                    ".join-button"
                );


            if (joinButton) {

                joinButton.addEventListener(
                    "click",
                    () => {

                        window.open(
                            item.zoomJoinUrl,
                            "_blank"
                        );

                    }
                );

            }


            classes.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   REFRESH
========================================================= */

if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        async () => {

            await loadCourses();

            await loadClasses();

        }
    );

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


/* =========================================================
   INITIAL LOAD
========================================================= */

async function init() {

    await loadCourses();

    await loadClasses();

}

init();

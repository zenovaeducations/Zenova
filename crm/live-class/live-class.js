import { db } from "../../firebase/firebase-config.js";

import {
    collection,
    getDocs,
    query,
    where,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    getFunctions,
    httpsCallable
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-functions.js";


/* ============================================================
   COLLECTIONS
============================================================ */

const COURSES = "zen2Courses";
const SUBJECTS = "zen2Subjects";
const CHAPTERS = "zen2Chapters";
const LIVE_CLASSES = "liveClasses";


/* ============================================================
   FIREBASE FUNCTIONS
============================================================ */

const functions = getFunctions(
    undefined,
    "asia-south1"
);

const createZoomMeeting = httpsCallable(
    functions,
    "createZoomMeeting"
);


/* ============================================================
   DOM
============================================================ */

const form =
    document.getElementById("liveClassForm");

const courseSelect =
    document.getElementById("course");

const subjectSelect =
    document.getElementById("subject");

const chapterSelect =
    document.getElementById("chapter");

const titleInput =
    document.getElementById("title");

const facultyInput =
    document.getElementById("faculty");

const dateInput =
    document.getElementById("date");

const timeInput =
    document.getElementById("time");

const durationInput =
    document.getElementById("duration");

const thumbnailInput =
    document.getElementById("thumbnail");

const message =
    document.getElementById("message");

const saveButton =
    document.getElementById("saveButton");

const saveText =
    document.getElementById("saveText");


/* ============================================================
   STATE
============================================================ */

let courses = [];
let subjects = [];
let chapters = [];


/* ============================================================
   MESSAGE
============================================================ */

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


/* ============================================================
   BUTTON LOADING
============================================================ */

function setLoading(
    loading,
    text = ""
) {

    if (saveButton) {
        saveButton.disabled = loading;
    }

    if (saveText) {

        saveText.textContent =
            loading
                ? text || "Please wait..."
                : "Create Live Class";

    }

}


/* ============================================================
   RESET SUBJECT
============================================================ */

function resetSubject() {

    subjectSelect.innerHTML = `
        <option value="">
            Select Subject
        </option>
    `;

    subjectSelect.disabled = true;

}


/* ============================================================
   RESET CHAPTER
============================================================ */

function resetChapter() {

    chapterSelect.innerHTML = `
        <option value="">
            Select Chapter
        </option>
    `;

    chapterSelect.disabled = true;

}


/* ============================================================
   LOAD COURSES
============================================================ */

async function loadCourses() {

    console.log(
        "[LIVE CLASS] Loading courses from:",
        COURSES
    );

    try {

        showMessage(
            "Loading courses..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    COURSES
                )
            );


        console.log(
            "[LIVE CLASS] Course documents:",
            snapshot.size
        );


        courses =
            snapshot.docs.map(
                documentSnapshot => {

                    const data =
                        documentSnapshot.data();

                    console.log(
                        "[LIVE CLASS] Course:",
                        documentSnapshot.id,
                        data
                    );

                    return {

                        id:
                            documentSnapshot.id,

                        ...data

                    };

                }
            );


        /*
         * EXACT ZEN2 FIELD:
         * courseName
         */

        courses.sort(
            (a, b) =>
                String(
                    a.courseName || ""
                ).localeCompare(
                    String(
                        b.courseName || ""
                    )
                )
        );


        courseSelect.innerHTML = `
            <option value="">
                Select Course
            </option>
        `;


        courses.forEach(
            course => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    course.id;


                option.textContent =
                    course.courseName ||
                    "Unnamed Course";


                courseSelect.appendChild(
                    option
                );

            }
        );


        courseSelect.disabled =
            false;


        if (
            courses.length === 0
        ) {

            showMessage(
                "No courses found in zen2Courses.",
                "error"
            );

        } else {

            showMessage(
                ""
            );

        }


    } catch (error) {

        console.error(
            "[LIVE CLASS] LOAD COURSES ERROR:",
            error
        );


        showMessage(
            "Unable to load courses: " +
            (
                error.message ||
                "Unknown error"
            ),
            "error"
        );

    }

}


/* ============================================================
   LOAD SUBJECTS
============================================================ */

async function loadSubjects(
    courseId
) {

    resetSubject();
    resetChapter();

    subjects = [];
    chapters = [];


    if (!courseId) {
        return;
    }


    console.log(
        "[LIVE CLASS] Loading subjects for course:",
        courseId
    );


    try {

        showMessage(
            "Loading subjects..."
        );


        /*
         * EXACT ZEN2 RELATION:
         *
         * zen2Subjects.courseId
         * ==
         * selected course ID
         */

        const subjectQuery =
            query(
                collection(
                    db,
                    SUBJECTS
                ),
                where(
                    "courseId",
                    "==",
                    courseId
                )
            );


        const snapshot =
            await getDocs(
                subjectQuery
            );


        console.log(
            "[LIVE CLASS] Subject documents:",
            snapshot.size
        );


        subjects =
            snapshot.docs.map(
                documentSnapshot => {

                    const data =
                        documentSnapshot.data();

                    console.log(
                        "[LIVE CLASS] Subject:",
                        documentSnapshot.id,
                        data
                    );

                    return {

                        id:
                            documentSnapshot.id,

                        ...data

                    };

                }
            );


        /*
         * EXACT ZEN2 FIELD:
         * subjectName
         */

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
            subject => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    subject.id;


                option.textContent =
                    subject.subjectName ||
                    "Unnamed Subject";


                subjectSelect.appendChild(
                    option
                );

            }
        );


        subjectSelect.disabled =
            subjects.length === 0;


        if (
            subjects.length === 0
        ) {

            showMessage(
                "No subjects found for this course.",
                "error"
            );

        } else {

            showMessage(
                ""
            );

        }


    } catch (error) {

        console.error(
            "[LIVE CLASS] LOAD SUBJECTS ERROR:",
            error
        );


        showMessage(
            "Unable to load subjects: " +
            (
                error.message ||
                "Unknown error"
            ),
            "error"
        );

    }

}


/* ============================================================
   LOAD CHAPTERS
============================================================ */

async function loadChapters(
    courseId,
    subjectId
) {

    resetChapter();

    chapters = [];


    if (
        !courseId ||
        !subjectId
    ) {

        return;

    }


    console.log(
        "[LIVE CLASS] Loading chapters:",
        {
            courseId,
            subjectId
        }
    );


    try {

        showMessage(
            "Loading chapters..."
        );


        /*
         * EXACT ZEN2 RELATION:
         *
         * zen2Chapters.courseId
         * ==
         * selected course ID
         *
         * AND
         *
         * zen2Chapters.subjectId
         * ==
         * selected subject ID
         */

        const chapterQuery =
            query(
                collection(
                    db,
                    CHAPTERS
                ),
                where(
                    "courseId",
                    "==",
                    courseId
                ),
                where(
                    "subjectId",
                    "==",
                    subjectId
                )
            );


        const snapshot =
            await getDocs(
                chapterQuery
            );


        console.log(
            "[LIVE CLASS] Chapter documents:",
            snapshot.size
        );


        chapters =
            snapshot.docs.map(
                documentSnapshot => {

                    const data =
                        documentSnapshot.data();

                    console.log(
                        "[LIVE CLASS] Chapter:",
                        documentSnapshot.id,
                        data
                    );

                    return {

                        id:
                            documentSnapshot.id,

                        ...data

                    };

                }
            );


        /*
         * EXACT ZEN2 FIELD:
         * chapterNumber
         */

        chapters.sort(
            (a, b) =>
                Number(
                    a.chapterNumber || 0
                ) -
                Number(
                    b.chapterNumber || 0
                )
        );


        chapters.forEach(
            chapter => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    chapter.id;


                option.textContent =
                    `Chapter ${
                        chapter.chapterNumber || ""
                    }${
                        chapter.chapterName
                            ? " - " +
                              chapter.chapterName
                            : ""
                    }`;


                chapterSelect.appendChild(
                    option
                );

            }
        );


        chapterSelect.disabled =
            chapters.length === 0;


        if (
            chapters.length === 0
        ) {

            showMessage(
                "No chapters found for this subject.",
                "error"
            );

        } else {

            showMessage(
                ""
            );

        }


    } catch (error) {

        console.error(
            "[LIVE CLASS] LOAD CHAPTERS ERROR:",
            error
        );


        showMessage(
            "Unable to load chapters: " +
            (
                error.message ||
                "Unknown error"
            ),
            "error"
        );

    }

}


/* ============================================================
   SELECTED NAME HELPERS
============================================================ */

function selectedText(
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


/* ============================================================
   GET ACTUAL COURSE
============================================================ */

function getSelectedCourse() {

    return courses.find(
        course =>
            course.id ===
            courseSelect.value
    ) || null;

}


/* ============================================================
   GET ACTUAL SUBJECT
============================================================ */

function getSelectedSubject() {

    return subjects.find(
        subject =>
            subject.id ===
            subjectSelect.value
    ) || null;

}


/* ============================================================
   GET ACTUAL CHAPTER
============================================================ */

function getSelectedChapter() {

    return chapters.find(
        chapter =>
            chapter.id ===
            chapterSelect.value
    ) || null;

}


/* ============================================================
   AUTO TITLE
============================================================ */

function autoTitle() {

    if (
        titleInput.value.trim()
    ) {

        return;

    }


    const subjectData =
        getSelectedSubject();

    const chapterData =
        getSelectedChapter();


    const courseName =
        getSelectedCourse()?.courseName ||
        "";


    const subjectName =
        subjectData?.subjectName ||
        "";


    const chapterName =
        chapterData?.chapterName ||
        "";


    const titleParts = [
        courseName,
        subjectName,
        chapterName
    ].filter(Boolean);


    if (
        titleParts.length
    ) {

        titleInput.value =
            titleParts.join(
                " - "
            );

    }

}


/* ============================================================
   COURSE CHANGE
============================================================ */

courseSelect.addEventListener(
    "change",
    async () => {

        await loadSubjects(
            courseSelect.value
        );

        autoTitle();

    }
);


/* ============================================================
   SUBJECT CHANGE
============================================================ */

subjectSelect.addEventListener(
    "change",
    async () => {

        await loadChapters(
            courseSelect.value,
            subjectSelect.value
        );

        autoTitle();

    }
);


/* ============================================================
   CHAPTER CHANGE
============================================================ */

chapterSelect.addEventListener(
    "change",
    () => {

        autoTitle();

    }
);


/* ============================================================
   CREATE ZOOM
============================================================ */

async function createZoom() {

    const title =
        titleInput.value.trim();


    const scheduledDate =
        dateInput.value;


    const scheduledTime =
        timeInput.value;


    const duration =
        Number(
            durationInput.value
        );


    console.log(
        "[LIVE CLASS] Sending Zoom request:",
        {
            title,
            scheduledDate,
            scheduledTime,
            duration
        }
    );


    const result =
        await createZoomMeeting({

            title,

            scheduledDate,

            scheduledTime,

            duration

        });


    console.log(
        "[LIVE CLASS] Zoom response:",
        result
    );


    return result.data;

}


/* ============================================================
   FORM SUBMIT
============================================================ */

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        /* --------------------------------------------
           VALIDATION
        -------------------------------------------- */

        if (
            !courseSelect.value
        ) {

            showMessage(
                "Please select a course.",
                "error"
            );

            return;

        }


        if (
            !subjectSelect.value
        ) {

            showMessage(
                "Please select a subject.",
                "error"
            );

            return;

        }


        if (
            !chapterSelect.value
        ) {

            showMessage(
                "Please select a chapter.",
                "error"
            );

            return;

        }


        autoTitle();


        if (
            !titleInput.value.trim()
        ) {

            showMessage(
                "Please enter class title.",
                "error"
            );

            return;

        }


        if (
            !facultyInput.value.trim()
        ) {

            showMessage(
                "Please enter faculty name.",
                "error"
            );

            return;

        }


        if (
            !dateInput.value
        ) {

            showMessage(
                "Please select class date.",
                "error"
            );

            return;

        }


        if (
            !timeInput.value
        ) {

            showMessage(
                "Please select class time.",
                "error"
            );

            return;

        }


        const duration =
            Number(
                durationInput.value
            );


        if (
            !duration ||
            duration <= 0
        ) {

            showMessage(
                "Please enter a valid duration.",
                "error"
            );

            return;

        }


        /* --------------------------------------------
           DATA
        -------------------------------------------- */

        const selectedCourse =
            getSelectedCourse();

        const selectedSubject =
            getSelectedSubject();

        const selectedChapter =
            getSelectedChapter();


        /* --------------------------------------------
           LOADING
        -------------------------------------------- */

        setLoading(
            true,
            "Creating Zoom Meeting..."
        );


        try {

            /* ========================================
               CREATE ZOOM
            ======================================== */

            const zoom =
                await createZoom();


            if (
                !zoom ||
                !zoom.meetingId
            ) {

                throw new Error(
                    "Zoom meeting was not created."
                );

            }


            console.log(
                "[LIVE CLASS] Zoom created:",
                zoom
            );


            /* ========================================
               SAVE LIVE CLASS
            ======================================== */

            setLoading(
                true,
                "Saving Live Class..."
            );


            const liveClassData = {

                /*
                 * CLASS INFORMATION
                 */

                title:
                    titleInput.value.trim(),

                faculty:
                    facultyInput.value.trim(),

                teacherName:
                    facultyInput.value.trim(),


                /*
                 * ZEN2 COURSE
                 */

                courseId:
                    selectedCourse.id,

                courseName:
                    selectedCourse.courseName || "",


                /*
                 * ZEN2 SUBJECT
                 */

                subjectId:
                    selectedSubject.id,

                subjectName:
                    selectedSubject.subjectName || "",


                /*
                 * ZEN2 CHAPTER
                 */

                chapterId:
                    selectedChapter.id,

                chapterNumber:
                    selectedChapter.chapterNumber || 0,

                chapterName:
                    selectedChapter.chapterName || "",


                /*
                 * CLASS SCHEDULE
                 */

                scheduledDate:
                    dateInput.value,

                scheduledTime:
                    timeInput.value,

                duration:
                    duration,


                /*
                 * THUMBNAIL
                 */

                thumbnailUrl:
                    thumbnailInput.value.trim(),


                /*
                 * LIVE CLASS
                 */

                liveType:
                    "ZOOM",

                status:
                    "SCHEDULED",

                accessType:
                    "PAID",


                /*
                 * ZOOM
                 */

                zoomCreated:
                    true,

                zoomMeetingId:
                    zoom.meetingId || "",

                zoomMeetingNumber:
                    zoom.meetingNumber || "",

                zoomPassword:
                    zoom.password || "",

                zoomJoinUrl:
                    zoom.joinUrl || "",

                zoomStartUrl:
                    zoom.startUrl || "",


                /*
                 * TIMESTAMP
                 */

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            };


            console.log(
                "[LIVE CLASS] Firestore data:",
                liveClassData
            );


            const liveClassRef =
                await addDoc(
                    collection(
                        db,
                        LIVE_CLASSES
                    ),
                    liveClassData
                );


            console.log(
                "[LIVE CLASS] Created:",
                liveClassRef.id
            );


            /* --------------------------------------------
               SUCCESS
            -------------------------------------------- */

            showMessage(
                "Live class created successfully.",
                "success"
            );


            form.reset();


            resetSubject();

            resetChapter();


            durationInput.value =
                "60";


        } catch (error) {

            console.error(
                "[LIVE CLASS] ERROR:",
                error
            );


            console.error(
                "[LIVE CLASS] ERROR DETAILS:",
                error?.details
            );


            let errorText =
                "Unable to create live class.";


            if (
                error?.details?.message
            ) {

                errorText =
                    error.details.message;

            } else if (
                error?.message
            ) {

                errorText =
                    error.message;

            }


            showMessage(
                errorText,
                "error"
            );

        } finally {

            setLoading(
                false
            );

        }

    }
);


/* ============================================================
   INITIALIZE
============================================================ */

async function init() {

    console.log(
        "[LIVE CLASS] Initializing..."
    );


    /*
     * Make sure dropdowns start correctly.
     */

    resetSubject();

    resetChapter();


    /*
     * Load actual Zenova courses.
     */

    await loadCourses();

}


init();

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
    orderBy,
    limit,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   ELEMENTS
========================================================= */

const form =
    document.getElementById(
        "liveClassForm"
    );


const titleInput =
    document.getElementById(
        "title"
    );


const teacherInput =
    document.getElementById(
        "teacherName"
    );


const courseSelect =
    document.getElementById(
        "courseSelect"
    );


const subjectSelect =
    document.getElementById(
        "subjectSelect"
    );


const chapterSelect =
    document.getElementById(
        "chapterSelect"
    );


const thumbnailInput =
    document.getElementById(
        "thumbnailUrl"
    );


const dateInput =
    document.getElementById(
        "scheduledDate"
    );


const timeInput =
    document.getElementById(
        "scheduledTime"
    );


const scheduleButton =
    document.getElementById(
        "scheduleButton"
    );


const message =
    document.getElementById(
        "message"
    );


const classList =
    document.getElementById(
        "classList"
    );


const refreshButton =
    document.getElementById(
        "refreshButton"
    );


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    user => {

        if (!user) {

            window.location.replace(
                "../../account/login/"
            );

            return;

        }


        loadCourses();

        loadScheduledClasses();

    }
);


/* =========================================================
   LOAD COURSES
========================================================= */

async function loadCourses() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "zen2Courses"
                )
            );


        courseSelect.innerHTML = `
            <option value="">
                Select Course
            </option>
        `;


        snapshot.docs.forEach(
            item => {

                const data =
                    item.data();


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    item.id;


                option.textContent =
                    data.name ||
                    data.title ||
                    "Unnamed Course";


                option.dataset.courseName =
                    data.name ||
                    data.title ||
                    "";


                courseSelect.appendChild(
                    option
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Course loading error:",
            error
        );


        showMessage(
            "Unable to load courses.",
            "error"
        );

    }

}


/* =========================================================
   COURSE CHANGE
========================================================= */

courseSelect.addEventListener(
    "change",
    async () => {

        subjectSelect.innerHTML = `
            <option value="">
                Select Subject
            </option>
        `;


        chapterSelect.innerHTML = `
            <option value="">
                Select Chapter
            </option>
        `;


        subjectSelect.disabled =
            true;


        chapterSelect.disabled =
            true;


        const courseId =
            courseSelect.value;


        if (!courseId) {

            return;

        }


        await loadSubjects(
            courseId
        );

    }
);


/* =========================================================
   LOAD SUBJECTS
========================================================= */

async function loadSubjects(
    courseId
) {

    try {

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


        snapshot.docs.forEach(
            item => {

                const data =
                    item.data();


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    item.id;


                option.textContent =
                    data.name ||
                    data.title ||
                    "Unnamed Subject";


                option.dataset.subjectName =
                    data.name ||
                    data.title ||
                    "";


                subjectSelect.appendChild(
                    option
                );

            }
        );


        subjectSelect.disabled =
            snapshot.empty;


    }

    catch (error) {

        console.error(
            "Subject loading error:",
            error
        );


        showMessage(
            "Unable to load subjects.",
            "error"
        );

    }

}


/* =========================================================
   SUBJECT CHANGE
========================================================= */

subjectSelect.addEventListener(
    "change",
    async () => {

        chapterSelect.innerHTML = `
            <option value="">
                Select Chapter
            </option>
        `;


        chapterSelect.disabled =
            true;


        const subjectId =
            subjectSelect.value;


        if (!subjectId) {

            return;

        }


        await loadChapters(
            subjectId
        );

    }
);


/* =========================================================
   LOAD CHAPTERS
========================================================= */

async function loadChapters(
    subjectId
) {

    try {

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


        snapshot.docs.forEach(
            item => {

                const data =
                    item.data();


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    item.id;


                option.textContent =
                    data.name ||
                    data.title ||
                    "Unnamed Chapter";


                option.dataset.chapterName =
                    data.name ||
                    data.title ||
                    "";


                chapterSelect.appendChild(
                    option
                );

            }
        );


        /*
         * Chapter is optional.
         * We still allow scheduling if there
         * are no chapters.
         */

        chapterSelect.disabled =
            snapshot.empty;

    }

    catch (error) {

        console.error(
            "Chapter loading error:",
            error
        );

    }

}


/* =========================================================
   FORM SUBMIT
========================================================= */

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        clearMessage();


        const title =
            titleInput.value.trim();


        const teacherName =
            teacherInput.value.trim();


        const courseId =
            courseSelect.value;


        const subjectId =
            subjectSelect.value;


        const chapterId =
            chapterSelect.value;


        const thumbnailUrl =
            thumbnailInput.value.trim();


        const scheduledDate =
            dateInput.value;


        const scheduledTime =
            timeInput.value;


        if (!title) {

            showMessage(
                "Please enter the class title.",
                "error"
            );

            return;

        }


        if (!teacherName) {

            showMessage(
                "Please enter the teacher name.",
                "error"
            );

            return;

        }


        if (!courseId) {

            showMessage(
                "Please select a course.",
                "error"
            );

            return;

        }


        if (!subjectId) {

            showMessage(
                "Please select a subject.",
                "error"
            );

            return;

        }


        if (!scheduledDate) {

            showMessage(
                "Please select a date.",
                "error"
            );

            return;

        }


        if (!scheduledTime) {

            showMessage(
                "Please select a time.",
                "error"
            );

            return;

        }


        /*
         * Get selected names.
         */

        const courseOption =
            courseSelect.options[
                courseSelect.selectedIndex
            ];


        const subjectOption =
            subjectSelect.options[
                subjectSelect.selectedIndex
            ];


        const chapterOption =
            chapterSelect.options[
                chapterSelect.selectedIndex
            ];


        const courseName =
            courseOption?.dataset.courseName ||
            courseOption?.textContent ||
            "";


        const subjectName =
            subjectOption?.dataset.subjectName ||
            subjectOption?.textContent ||
            "";


        const chapterName =
            chapterId
                ? (
                    chapterOption?.dataset.chapterName ||
                    chapterOption?.textContent ||
                    ""
                )
                : "";


        try {

            scheduleButton.disabled =
                true;


            scheduleButton.textContent =
                "SCHEDULING...";


            await addDoc(
                collection(
                    db,
                    "liveClasses"
                ),
                {

                    title,

                    teacherName,

                    courseId,

                    courseName,

                    subjectId,

                    subjectName,

                    chapterId:
                        chapterId || null,

                    chapterName:
                        chapterName || null,

                    thumbnailUrl:
                        thumbnailUrl || null,

                    scheduledDate,

                    scheduledTime,

                    active: true,

                    createdAt:
                        serverTimestamp()

                }
            );


            showMessage(
                "Live class scheduled successfully.",
                "success"
            );


            form.reset();


            subjectSelect.innerHTML = `
                <option value="">
                    Select Subject
                </option>
            `;


            chapterSelect.innerHTML = `
                <option value="">
                    Select Chapter
                </option>
            `;


            subjectSelect.disabled =
                true;


            chapterSelect.disabled =
                true;


            loadScheduledClasses();

        }

        catch (error) {

            console.error(
                "Schedule error:",
                error
            );


            showMessage(
                "Unable to schedule live class. Please try again.",
                "error"
            );

        }

        finally {

            scheduleButton.disabled =
                false;


            scheduleButton.textContent =
                "SCHEDULE LIVE CLASS";

        }

    }
);


/* =========================================================
   LOAD SCHEDULED CLASSES
========================================================= */

async function loadScheduledClasses() {

    classList.innerHTML = `
        <div class="empty">
            Loading...
        </div>
    `;


    try {

        const q =
            query(
                collection(
                    db,
                    "liveClasses"
                ),

                orderBy(
                    "scheduledDate",
                    "asc"
                ),

                limit(50)
            );


        const snapshot =
            await getDocs(q);


        if (snapshot.empty) {

            classList.innerHTML = `
                <div class="empty">
                    No live classes scheduled.
                </div>
            `;

            return;

        }


        classList.innerHTML =
            snapshot.docs
                .map(
                    item =>
                        renderClass(
                            item.id,
                            item.data()
                        )
                )
                .join("");


        attachDeleteEvents();

    }

    catch (error) {

        console.error(
            "Live class loading error:",
            error
        );


        /*
         * If the query requires an index,
         * still try a simple query.
         */

        await loadClassesFallback();

    }

}


/* =========================================================
   FALLBACK
========================================================= */

async function loadClassesFallback() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "liveClasses"
                )
            );


        const classes =
            snapshot.docs
                .map(
                    item => ({

                        id:
                            item.id,

                        ...item.data()

                    })
                )
                .sort(
                    (
                        a,
                        b
                    ) => {

                        const first =
                            `${a.scheduledDate || ""} ${a.scheduledTime || ""}`;

                        const second =
                            `${b.scheduledDate || ""} ${b.scheduledTime || ""}`;

                        return first.localeCompare(
                            second
                        );

                    }
                )
                .slice(
                    0,
                    50
                );


        if (!classes.length) {

            classList.innerHTML = `
                <div class="empty">
                    No live classes scheduled.
                </div>
            `;

            return;

        }


        classList.innerHTML =
            classes
                .map(
                    item =>
                        renderClass(
                            item.id,
                            item
                        )
                )
                .join("");


        attachDeleteEvents();

    }

    catch (error) {

        console.error(
            error
        );


        classList.innerHTML = `
            <div class="empty">
                Unable to load scheduled classes.
            </div>
        `;

    }

}


/* =========================================================
   RENDER CLASS
========================================================= */

function renderClass(
    id,
    data
) {

    const thumbnail =
        data.thumbnailUrl
            ? `
                <img
                    src="${escapeHtml(
                        data.thumbnailUrl
                    )}"
                    alt=""
                >
            `
            : "";


    return `

        <article
            class="class-card"
        >

            <div
                class="class-thumbnail"
            >

                ${thumbnail}

            </div>


            <div
                class="class-info"
            >

                <h3>
                    ${escapeHtml(
                        data.title ||
                        "Live Class"
                    )}
                </h3>


                <p>

                    Teacher:
                    <strong>
                        ${escapeHtml(
                            data.teacherName ||
                            "-"
                        )}
                    </strong>

                    <br>

                    ${
                        escapeHtml(
                            data.courseName ||
                            ""
                        )
                    }

                    •
                    ${
                        escapeHtml(
                            data.subjectName ||
                            ""
                        )
                    }

                    ${
                        data.chapterName
                            ? `
                                •
                                ${escapeHtml(
                                    data.chapterName
                                )}
                            `
                            : ""
                    }

                </p>


                <button
                    class="delete-button"
                    data-delete-id="${escapeHtml(
                        id
                    )}"
                >
                    Delete Class
                </button>

            </div>


            <div
                class="class-date"
            >

                <strong>
                    ${
                        formatDate(
                            data.scheduledDate
                        )
                    }
                </strong>


                <span>
                    ${
                        escapeHtml(
                            data.scheduledTime ||
                            ""
                        )
                    }
                </span>

            </div>

        </article>

    `;

}


/* =========================================================
   DELETE
========================================================= */

function attachDeleteEvents() {

    document
        .querySelectorAll(
            "[data-delete-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const id =
                            button.dataset.deleteId;


                        const confirmed =
                            confirm(
                                "Delete this live class?"
                            );


                        if (!confirmed) {

                            return;

                        }


                        try {

                            await deleteDoc(
                                doc(
                                    db,
                                    "liveClasses",
                                    id
                                )
                            );


                            loadScheduledClasses();

                        }

                        catch (error) {

                            console.error(
                                error
                            );


                            alert(
                                "Unable to delete class."
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   REFRESH
========================================================= */

refreshButton.addEventListener(
    "click",
    () => {

        loadScheduledClasses();

    }
);


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    text,
    type
) {

    message.textContent =
        text;


    message.className =
        `message ${type}`;

}


function clearMessage() {

    message.textContent =
        "";

    message.className =
        "message";

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    value
) {

    if (!value) {

        return "-";

    }


    const date =
        new Date(
            `${value}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"
        }
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

import {
    auth,
    db
} from "../../firebase/firebase-config.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    collection,
    getDocs,
    query,
    where,
    addDoc,
    deleteDoc,
    doc,
    orderBy,
    limit,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const form =
    document.getElementById(
        "liveForm"
    );


const course =
    document.getElementById(
        "course"
    );


const subject =
    document.getElementById(
        "subject"
    );


const chapter =
    document.getElementById(
        "chapter"
    );


const message =
    document.getElementById(
        "message"
    );


const classes =
    document.getElementById(
        "classes"
    );


const saveButton =
    document.getElementById(
        "saveButton"
    );


/* =========================
   AUTH
========================= */

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

        loadClasses();

    }
);


/* =========================
   COURSES
========================= */

async function loadCourses() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "zen2Courses"
                )
            );


        course.innerHTML = `
            <option value="">
                Select Course
            </option>
        `;


        snapshot.forEach(
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
    data.courseName ||
    data.crmCourseName ||
    "Course";


                option.dataset.name =
                    data.name ||
                    data.title ||
                    "";


                course.appendChild(
                    option
                );

            }
        );

    }

    catch (error) {

        console.error(
            error
        );

        showMessage(
            "Unable to load courses.",
            "error"
        );

    }

}


/* =========================
   SUBJECTS
========================= */

course.addEventListener(
    "change",
    async () => {

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


        subject.disabled =
            true;


        chapter.disabled =
            true;


        if (!course.value) {

            return;

        }


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
                        course.value
                    )
                );


            const snapshot =
                await getDocs(q);


            snapshot.forEach(
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
    data.subjectName ||
    data.subject ||
    "Subject";


                    option.dataset.name =
                        data.name ||
                        data.title ||
                        "";


                    subject.appendChild(
                        option
                    );

                }
            );


            subject.disabled =
                snapshot.empty;

        }

        catch (error) {

            console.error(
                error
            );

        }

    }
);


/* =========================
   CHAPTERS
========================= */

subject.addEventListener(
    "change",
    async () => {

        chapter.innerHTML = `
            <option value="">
                Select Chapter
            </option>
        `;


        chapter.disabled =
            true;


        if (!subject.value) {

            return;

        }


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
                        subject.value
                    )
                );


            const snapshot =
                await getDocs(q);


            snapshot.forEach(
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
    data.chapterName ||
    data.chapterTitle ||
    "Chapter";
                    option.dataset.name =
                        data.name ||
                        data.title ||
                        "";


                    chapter.appendChild(
                        option
                    );

                }
            );


            chapter.disabled =
                snapshot.empty;

        }

        catch (error) {

            console.error(
                error
            );

        }

    }
);


/* =========================
   SAVE CLASS
========================= */

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        clearMessage();


        const title =
            document
                .getElementById("title")
                .value
                .trim();


        const teacher =
            document
                .getElementById("teacher")
                .value
                .trim();


        const thumbnail =
            document
                .getElementById("thumbnail")
                .value
                .trim();


        const date =
            document
                .getElementById("date")
                .value;


        const time =
            document
                .getElementById("time")
                .value;


        if (
            !title ||
            !teacher ||
            !course.value ||
            !subject.value ||
            !date ||
            !time
        ) {

            showMessage(
                "Please fill all required fields.",
                "error"
            );

            return;

        }


        const courseOption =
            course.options[
                course.selectedIndex
            ];


        const subjectOption =
            subject.options[
                subject.selectedIndex
            ];


        const chapterOption =
            chapter.options[
                chapter.selectedIndex
            ];


        const data = {

            title,

            teacherName:
                teacher,

            courseId:
                course.value,

            courseName:
                courseOption.dataset.name ||
                courseOption.textContent,

            subjectId:
                subject.value,

            subjectName:
                subjectOption.dataset.name ||
                subjectOption.textContent,

            chapterId:
                chapter.value ||
                null,

            chapterName:
                chapter.value
                    ? (
                        chapterOption.dataset.name ||
                        chapterOption.textContent
                    )
                    : null,

            thumbnailUrl:
                thumbnail ||
                null,

            scheduledDate:
                date,

            scheduledTime:
                time,

            active:
                true,

            createdAt:
                serverTimestamp()

        };


        try {

            saveButton.disabled =
                true;


            saveButton.textContent =
                "SCHEDULING...";


            await addDoc(
                collection(
                    db,
                    "liveClasses"
                ),
                data
            );


            showMessage(
                "Live class scheduled successfully.",
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


            subject.disabled =
                true;


            chapter.disabled =
                true;


            loadClasses();

        }

        catch (error) {

            console.error(
                error
            );


            showMessage(
                "Unable to schedule class.",
                "error"
            );

        }

        finally {

            saveButton.disabled =
                false;


            saveButton.textContent =
                "SCHEDULE LIVE CLASS";

        }

    }
);


/* =========================
   LOAD CLASSES
========================= */

async function loadClasses() {

    classes.innerHTML =
        "Loading...";


    try {

        const snapshot =
            await getDocs(
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
                )
            );


        if (
            snapshot.empty
        ) {

            classes.innerHTML =
                "No classes scheduled.";

            return;

        }


        classes.innerHTML =
            snapshot.docs
                .map(
                    item =>
                        createClassCard(
                            item.id,
                            item.data()
                        )
                )
                .join("");


        attachDelete();

    }

    catch (error) {

        console.error(
            error
        );


        /*
         * Fallback if Firestore asks
         * for an index.
         */

        try {

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "liveClasses"
                    )
                );


            const data =
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
                        ) =>
                            `${a.scheduledDate} ${a.scheduledTime}`
                                .localeCompare(
                                    `${b.scheduledDate} ${b.scheduledTime}`
                                )
                    );


            classes.innerHTML =
                data
                    .slice(
                        0,
                        50
                    )
                    .map(
                        item =>
                            createClassCard(
                                item.id,
                                item
                            )
                    )
                    .join("");


            attachDelete();

        }

        catch (secondError) {

            console.error(
                secondError
            );


            classes.innerHTML =
                "Unable to load classes.";

        }

    }

}


/* =========================
   CARD
========================= */

function createClassCard(
    id,
    data
) {

    return `

        <div class="class-card">

            <div class="class-title">

                ${escapeHtml(
                    data.title ||
                    "Live Class"
                )}

            </div>


            <div class="class-info">

                Teacher:
                ${escapeHtml(
                    data.teacherName ||
                    "-"
                )}

                <br>

                Course:
                ${escapeHtml(
                    data.courseName ||
                    "-"
                )}

                <br>

                Subject:
                ${escapeHtml(
                    data.subjectName ||
                    "-"
                )}

                <br>

                ${
                    data.chapterName
                        ? `
                            Chapter:
                            ${escapeHtml(
                                data.chapterName
                            )}

                            <br>
                        `
                        : ""
                }


                Date:
                ${escapeHtml(
                    data.scheduledDate ||
                    "-"
                )}

                <br>

                Time:
                ${escapeHtml(
                    data.scheduledTime ||
                    "-"
                )}

            </div>


            <button
                class="delete"
                data-id="${escapeHtml(id)}"
            >
                Delete
            </button>

        </div>

    `;

}


/* =========================
   DELETE
========================= */

function attachDelete() {

    document
        .querySelectorAll(
            ".delete"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        if (
                            !confirm(
                                "Delete this live class?"
                            )
                        ) {

                            return;

                        }


                        try {

                            await deleteDoc(
                                doc(
                                    db,
                                    "liveClasses",
                                    button.dataset.id
                                )
                            );


                            loadClasses();

                        }

                        catch (error) {

                            console.error(
                                error
                            );

                            alert(
                                "Delete failed."
                            );

                        }

                    }
                );

            }
        );

}


/* =========================
   REFRESH
========================= */

document
    .getElementById("refresh")
    .addEventListener(
        "click",
        loadClasses
    );


/* =========================
   MESSAGE
========================= */

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


/* =========================
   ESCAPE
========================= */

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

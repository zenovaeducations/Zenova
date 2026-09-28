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
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =====================================================
   STATE
===================================================== */

let currentUser = null;

let student = null;

let currentCourse = null;

let currentSubject = null;

let chapters = [];


/* =====================================================
   ELEMENTS
===================================================== */

const loader =
    document.getElementById(
        "loader"
    );

const app =
    document.getElementById(
        "app"
    );

const errorScreen =
    document.getElementById(
        "errorScreen"
    );

const errorMessage =
    document.getElementById(
        "errorMessage"
    );


/* =====================================================
   URL PARAMETERS
===================================================== */

const params =
    new URLSearchParams(
        window.location.search
    );


const courseId =
    params.get(
        "courseId"
    );


const subjectId =
    params.get(
        "subjectId"
    );


/* =====================================================
   START
===================================================== */

onAuthStateChanged(
    auth,
    async user => {

        /*
         * No login
         */

        if (!user) {

            window.location.replace(
                "../../account/login/"
            );

            return;

        }


        currentUser =
            user;


        try {

            /*
             * URL validation
             */

            if (!courseId) {

                throw new Error(
                    "Course information is missing."
                );

            }


            if (!subjectId) {

                throw new Error(
                    "Subject information is missing."
                );

            }


            /*
             * ZEN2 student
             */

            await loadStudent();


            /*
             * Exact ZEN2 course
             */

            await loadCourse();


            /*
             * Exact ZEN2 subject
             */

            await loadSubject();


            /*
             * Chapters
             */

            await loadChapters();


            /*
             * Render
             */

            renderStudent();

            renderCourse();

            renderSubject();

            renderChapters();


            /*
             * Buttons
             */

            setupButtons();


            /*
             * Show
             */

            showApp();

        }

        catch (error) {

            console.error(
                "SUBJECT DETAILS ERROR:",
                error
            );


            showError(
                error.message ||
                "Unable to load subject."
            );

        }

    }
);


/* =====================================================
   LOAD ZEN2 STUDENT
===================================================== */

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
            "ZEN2 student profile not found."
        );

    }


    student =
        snapshot.data();


    console.log(
        "ZEN2 STUDENT:",
        student
    );

}


/* =====================================================
   LOAD COURSE
===================================================== */

async function loadCourse() {

    /*
     * Direct course document.
     */

    const courseRef =
        doc(
            db,
            "zen2Courses",
            courseId
        );


    const snapshot =
        await getDoc(
            courseRef
        );


    if (!snapshot.exists()) {

        throw new Error(
            "This ZEN2 course was not found."
        );

    }


    currentCourse = {

        id:
            snapshot.id,

        ...snapshot.data()

    };


    console.log(
        "ZEN2 COURSE:",
        currentCourse
    );

}


/* =====================================================
   LOAD SUBJECT
===================================================== */

async function loadSubject() {

    /*
     * Direct subject document.
     */

    const subjectRef =
        doc(
            db,
            "zen2Subjects",
            subjectId
        );


    const snapshot =
        await getDoc(
            subjectRef
        );


    if (!snapshot.exists()) {

        throw new Error(
            "This subject was not found."
        );

    }


    currentSubject = {

        id:
            snapshot.id,

        ...snapshot.data()

    };


    /*
     * Safety check:
     *
     * Subject must belong to selected course.
     */

    if (
        currentSubject.courseId !==
        currentCourse.id
    ) {

        throw new Error(
            "This subject does not belong to this course."
        );

    }


    console.log(
        "ZEN2 SUBJECT:",
        currentSubject
    );

}


/* =====================================================
   LOAD CHAPTERS
===================================================== */

async function loadChapters() {

    const chaptersQuery =
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
        await getDocs(
            chaptersQuery
        );


    chapters =
        snapshot.docs.map(
            item => ({

                id:
                    item.id,

                ...item.data()

            })
        );


    /*
     * Only active chapters.
     */

    chapters =
        chapters.filter(
            chapter =>
                chapter.active !== false
        );


    /*
     * Admin order.
     */

    chapters.sort(
        (a, b) => {

            return (
                Number(
                    a.order ??
                    a.chapterNumber ??
                    999999
                ) -
                Number(
                    b.order ??
                    b.chapterNumber ??
                    999999
                )
            );

        }
    );


    console.log(
        "ZEN2 CHAPTERS:",
        chapters
    );

}


/* =====================================================
   RENDER STUDENT
===================================================== */

function renderStudent() {

    const initial =
        document.getElementById(
            "profileInitial"
        );


    if (!initial) {
        return;
    }


    const name =
        student.name ||
        student.fullName ||
        currentUser.displayName ||
        "S";


    initial.textContent =
        name
            .trim()
            .charAt(0)
            .toUpperCase();

}


/* =====================================================
   RENDER COURSE
===================================================== */

function renderCourse() {

    const element =
        document.getElementById(
            "courseTitle"
        );


    if (!element) {
        return;
    }


    element.textContent =
        currentCourse.courseName ||
        currentCourse.name ||
        currentCourse.title ||
        currentCourse.batchName ||
        "ZENOVA Course";

}


/* =====================================================
   RENDER SUBJECT
===================================================== */

function renderSubject() {

    const name =
        currentSubject.subjectName ||
        currentSubject.name ||
        currentSubject.title ||
        currentSubject.displayName ||
        "Subject";


    const title =
        document.getElementById(
            "subjectTitle"
        );


    const subjectName =
        document.getElementById(
            "subjectName"
        );


    const letter =
        document.getElementById(
            "subjectLetter"
        );


    const description =
        document.getElementById(
            "subjectDescription"
        );


    if (title) {

        title.textContent =
            name;

    }


    if (subjectName) {

        subjectName.textContent =
            name;

    }


    if (letter) {

        letter.textContent =
            name
                .trim()
                .charAt(0)
                .toUpperCase();

    }


    if (description) {

        description.textContent =
            currentSubject.description ||
            "Learn this subject chapter by chapter.";

    }

}


/* =====================================================
   RENDER CHAPTERS
===================================================== */

function renderChapters() {

    const container =
        document.getElementById(
            "chaptersList"
        );


    const count =
        document.getElementById(
            "chapterCount"
        );


    if (count) {

        count.textContent =
            chapters.length;

    }


    if (!container) {
        return;
    }


    if (!chapters.length) {

        container.innerHTML = `

            <div class="loading-box">

                No chapters have been added
                to this subject yet.

            </div>

        `;

        return;

    }


    container.innerHTML =
        chapters
            .map(
                (chapter, index) => {

                    const number =
                        chapter.chapterNumber ||
                        chapter.order ||
                        index + 1;


                    const name =
                        chapter.chapterName ||
                        chapter.name ||
                        chapter.title ||
                        "Chapter";


                    const description =
                        chapter.description ||
                        "Open chapter to view videos and PDFs.";


                    return `

                        <article
                            class="chapter-card"
                            data-chapter-id="${escapeHtml(
                                chapter.id
                            )}"
                        >

                            <div
                                class="chapter-number"
                            >

                                ${escapeHtml(
                                    number
                                )}

                            </div>


                            <div
                                class="chapter-info"
                            >

                                <h3>
                                    ${escapeHtml(
                                        name
                                    )}
                                </h3>


                                <p>
                                    ${escapeHtml(
                                        description
                                    )}
                                </p>

                            </div>


                            <div
                                class="chapter-arrow"
                            >

                                →

                            </div>

                        </article>

                    `;

                }
            )
            .join("");


    /*
     * Chapter click
     *
     * Subject Details
     * ↓
     * Chapter Details
     */

    document
        .querySelectorAll(
            ".chapter-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        const chapterId =
                            card.dataset.chapterId;


                        window.location.href =
                            `../chapterdetails/?courseId=${
                                encodeURIComponent(
                                    currentCourse.id
                                )
                            }&subjectId=${
                                encodeURIComponent(
                                    currentSubject.id
                                )
                            }&chapterId=${
                                encodeURIComponent(
                                    chapterId
                                )
                            }`;

                    }
                );

            }
        );

}


/* =====================================================
   BUTTONS
===================================================== */

function setupButtons() {

    /*
     * BACK BUTTON
     *
     * ALWAYS RETURN TO REVISION
     */

    document
        .getElementById(
            "backButton"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "../revision/";

            }
        );


    /*
     * PROFILE
     */

    document
        .getElementById(
            "profileButton"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "../profile/";

            }
        );


    /*
     * Error screen back button
     */

    document
        .getElementById(
            "backErrorButton"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "../revision/";

            }
        );

}


/* =====================================================
   SHOW APP
===================================================== */

function showApp() {

    app?.classList.remove(
        "hidden"
    );


    setTimeout(
        () => {

            loader?.classList.add(
                "fade"
            );

        },
        100
    );

}


/* =====================================================
   ERROR
===================================================== */

function showError(
    message
) {

    console.error(
        message
    );


    if (errorMessage) {

        errorMessage.textContent =
            message;

    }


    loader?.classList.add(
        "fade"
    );


    errorScreen?.classList.remove(
        "hidden"
    );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

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

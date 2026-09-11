import {
    auth,
    db
} from "../../firebase/firebase-config.js";


import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDocs,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";



/* =========================================================
   EXISTING FIRESTORE COLLECTION NAMES
   DO NOT CHANGE THESE
========================================================= */

const COURSES_COLLECTION =
    "crmCourses";

const SUBJECTS_COLLECTION =
    "hybridSubjects";

const CHAPTERS_COLLECTION =
    "hybridChapters";



/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let courses = [];

let mediums = [];

let subjects = [];

let editingCourseId = null;



/* =========================================================
   ELEMENTS
========================================================= */

const loader =
    document.getElementById(
        "loader"
    );

const courseModal =
    document.getElementById(
        "courseModal"
    );

const contentModal =
    document.getElementById(
        "contentModal"
    );

const courseForm =
    document.getElementById(
        "courseForm"
    );

const courseGrid =
    document.getElementById(
        "courseGrid"
    );

const emptyCourses =
    document.getElementById(
        "emptyCourses"
    );

const courseSearch =
    document.getElementById(
        "courseSearch"
    );

const classFilter =
    document.getElementById(
        "classFilter"
    );

const statusFilter =
    document.getElementById(
        "statusFilter"
    );

const mediumList =
    document.getElementById(
        "mediumList"
    );

const subjectList =
    document.getElementById(
        "subjectList"
    );

const newMedium =
    document.getElementById(
        "newMedium"
    );

const newSubject =
    document.getElementById(
        "newSubject"
    );



/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    user => {

        if (!user) {

            window.location.href =
                "../../login/";

            return;
        }

        currentUser = user;

        startCoursesListener();

    }
);



/* =========================================================
   COURSES REALTIME LISTENER
========================================================= */

function startCoursesListener() {

    const coursesRef =
        collection(
            db,
            COURSES_COLLECTION
        );


    onSnapshot(
        coursesRef,

        snapshot => {

            courses =
                snapshot.docs.map(
                    item => ({
                        id: item.id,
                        ...item.data()
                    })
                );


            renderCourses();

            loader.classList.add(
                "hidden"
            );

        },

        error => {

            console.error(
                "Courses listener error:",
                error
            );

            loader.classList.add(
                "hidden"
            );

            showToast(
                "Unable to load courses."
            );

        }
    );

}



/* =========================================================
   NORMALIZE
========================================================= */

function normalize(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .replace(
            /\s+/g,
            " "
        )
        .toLowerCase();

}



/* =========================================================
   UNIQUE STRINGS
========================================================= */

function uniqueStrings(
    array
) {

    const result = [];

    const seen =
        new Set();


    for (
        const item of
        Array.isArray(array)
            ? array
            : []
    ) {

        let value = "";


        if (
            typeof item ===
            "string"
        ) {

            value =
                item.trim();

        } else if (
            item &&
            typeof item ===
            "object"
        ) {

            value =
                String(
                    item.name ||
                    item.subjectName ||
                    item.medium ||
                    item.language ||
                    ""
                ).trim();

        }


        if (!value) {
            continue;
        }


        const key =
            normalize(value);


        if (
            seen.has(key)
        ) {
            continue;
        }


        seen.add(key);

        result.push(
            value
        );

    }


    return result;

}



/* =========================================================
   DISPLAY CLASS
========================================================= */

function displayClass(
    value
) {

    const classes = {

        UNDER_8TH:
            "Under 8th",

        "8TH":
            "8th",

        "9TH":
            "9th",

        "10TH":
            "10th",

        "1ST_PUC":
            "1st PUC",

        "2ND_PUC":
            "2nd PUC"

    };


    return (
        classes[value] ||
        value ||
        "—"
    );

}



/* =========================================================
   RENDER COURSES
========================================================= */

function renderCourses() {

    const search =
        normalize(
            courseSearch.value
        );

    const selectedClass =
        classFilter.value;

    const selectedStatus =
        statusFilter.value;


    const filtered =
        courses
            .filter(
                course => {

                    const searchable =
                        normalize(
                            `
                            ${course.crmCourseName || ""}
                            ${course.crmCourseCode || ""}
                            ${course.crmDescription || ""}
                            `
                        );


                    const matchesSearch =
                        !search ||
                        searchable.includes(
                            search
                        );


                    const matchesClass =
                        !selectedClass ||
                        course.crmClass ===
                        selectedClass;


                    const matchesStatus =
                        !selectedStatus ||
                        (
                            selectedStatus ===
                            "active"
                                ? course.crmActive !==
                                  false
                                : course.crmActive ===
                                  false
                        );


                    return (
                        matchesSearch &&
                        matchesClass &&
                        matchesStatus
                    );

                }
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    Number(
                        a.priority ??
                        1
                    ) -
                    Number(
                        b.priority ??
                        1
                    )
            );


    courseGrid.innerHTML =
        filtered
            .map(
                renderCourseCard
            )
            .join("");


    emptyCourses.classList.toggle(
        "hidden",
        filtered.length !== 0
    );

}



/* =========================================================
   COURSE CARD
========================================================= */

function renderCourseCard(
    course
) {

    const languages =
        uniqueStrings(
            course.mediums ||
            String(
                course.crmMedium ||
                ""
            ).split(",")
        );


    const courseSubjects =
        uniqueStrings(
            course.subjects ||
            []
        );


    const image =
        course.crmImageUrl ||
        course.imageUrl ||
        "";


    return `

        <article class="course-card">

            <div class="course-image">

                ${
                    image

                        ? `
                            <img
                                src="${escapeAttribute(
                                    image
                                )}"
                                alt=""
                            >
                        `

                        : `
                            No image
                        `
                }

            </div>


            <div class="course-body">

                <div class="course-meta">

                    ${escapeHtml(
                        displayClass(
                            course.crmClass
                        )
                    )}

                    ·

                    ${
                        course.crmActive ===
                        false
                            ? "Inactive"
                            : "Active"
                    }

                </div>


                <div class="course-title">

                    ${escapeHtml(
                        course.crmCourseName ||
                        "Untitled Course"
                    )}

                </div>


                <div class="course-meta">

                    ${escapeHtml(
                        course.crmCourseCode ||
                        "No course code"
                    )}

                </div>


                <div class="course-tags">

                    ${languages
                        .map(
                            language =>
                                `
                                <span class="course-tag">
                                    ${escapeHtml(
                                        language
                                    )}
                                </span>
                                `
                        )
                        .join("")}

                </div>


                <div
                    class="course-meta"
                    style="margin-top:10px"
                >

                    ${
                        courseSubjects.length
                    }

                    subject${
                        courseSubjects.length ===
                        1
                            ? ""
                            : "s"
                    }

                </div>


                <div class="course-actions">

                    <button
                        class="secondary-btn"
                        data-edit-course="${course.id}"
                        type="button"
                    >
                        Edit
                    </button>


                    <button
                        class="secondary-btn"
                        data-content-course="${course.id}"
                        type="button"
                    >
                        Content
                    </button>

                </div>

            </div>

        </article>

    `;

}



/* =========================================================
   ADD COURSE
========================================================= */

document
    .getElementById(
        "addCourseBtn"
    )
    .addEventListener(
        "click",
        () => {

            resetCourseForm();

            courseModal.classList.remove(
                "hidden"
            );

        }
    );



/* =========================================================
   RESET FORM
========================================================= */

function resetCourseForm() {

    courseForm.reset();

    editingCourseId = null;

    mediums = [];

    subjects = [];


    document.getElementById(
        "courseModalLabel"
    ).textContent =
        "NEW COURSE";


    document.getElementById(
        "courseModalTitle"
    ).textContent =
        "Create Course";


    document.getElementById(
        "coursePriority"
    ).value = 1;


    document.getElementById(
        "courseActive"
    ).checked = true;


    document.querySelector(
        'input[name="courseType"][value="FREE"]'
    ).checked = true;


    document.getElementById(
        "paidFields"
    ).classList.add(
        "hidden"
    );


    renderMediums();

    renderSubjects();

    updateFinalPrice();

}



/* =========================================================
   EDIT COURSE
========================================================= */

function openEditCourse(
    course
) {

    editingCourseId =
        course.id;


    document.getElementById(
        "courseModalLabel"
    ).textContent =
        "EDIT COURSE";


    document.getElementById(
        "courseModalTitle"
    ).textContent =
        "Edit Course";


    document.getElementById(
        "courseName"
    ).value =
        course.crmCourseName ||
        "";


    document.getElementById(
        "courseCode"
    ).value =
        course.crmCourseCode ||
        "";


    document.getElementById(
        "courseClass"
    ).value =
        course.crmClass ||
        "";


    document.getElementById(
        "courseBoard"
    ).value =
        course.crmBoard ||
        "";


    document.getElementById(
        "courseDescription"
    ).value =
        course.crmDescription ||
        "";


    document.getElementById(
        "courseImageUrl"
    ).value =
        course.crmImageUrl ||
        "";


    document.getElementById(
        "coursePriority"
    ).value =
        course.priority ??
        1;


    document.getElementById(
        "courseActive"
    ).checked =
        course.crmActive !==
        false;


    mediums =
        uniqueStrings(
            course.mediums ||
            String(
                course.crmMedium ||
                ""
            ).split(",")
        );


    subjects =
        uniqueStrings(
            course.subjects ||
            []
        );


    const type =
        String(
            course.courseType ||
            "FREE"
        ).toUpperCase();


    document.querySelector(
        `input[name="courseType"][value="${
            type === "PAID"
                ? "PAID"
                : "FREE"
        }"]`
    ).checked = true;


    document.getElementById(
        "paidFields"
    ).classList.toggle(
        "hidden",
        type !== "PAID"
    );


    document.getElementById(
        "coursePrice"
    ).value =
        course.crmPrice ??
        "";


    document.getElementById(
        "courseDiscount"
    ).value =
        course.crmDiscount ??
        0;


    renderMediums();

    renderSubjects();

    updateFinalPrice();


    courseModal.classList.remove(
        "hidden"
    );

}



/* =========================================================
   ADD LANGUAGE
========================================================= */

document
    .getElementById(
        "addMediumBtn"
    )
    .addEventListener(
        "click",
        addMedium
    );


function addMedium() {

    const value =
        newMedium.value.trim();


    if (!value) {
        return;
    }


    const exists =
        mediums.some(
            item =>
                normalize(item) ===
                normalize(value)
        );


    if (!exists) {

        mediums.push(
            value
        );

    }


    newMedium.value = "";


    renderMediums();

}



/* ENTER KEY LANGUAGE */

newMedium.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Enter"
        ) {

            event.preventDefault();

            addMedium();

        }

    }
);



/* =========================================================
   RENDER LANGUAGES
========================================================= */

function renderMediums() {

    mediumList.innerHTML =
        mediums
            .map(
                (
                    medium,
                    index
                ) => `

                    <span class="editable-tag">

                        ${escapeHtml(
                            medium
                        )}

                        <button
                            type="button"
                            data-remove-medium="${index}"
                        >
                            ×
                        </button>

                    </span>

                `
            )
            .join("");

}



/* =========================================================
   ADD SUBJECT
========================================================= */

document
    .getElementById(
        "addSubjectBtn"
    )
    .addEventListener(
        "click",
        addSubject
    );


function addSubject() {

    const value =
        newSubject.value.trim();


    if (!value) {
        return;
    }


    const exists =
        subjects.some(
            item =>
                normalize(item) ===
                normalize(value)
        );


    if (!exists) {

        subjects.push(
            value
        );

    }


    newSubject.value = "";


    renderSubjects();

}



/* ENTER KEY SUBJECT */

newSubject.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Enter"
        ) {

            event.preventDefault();

            addSubject();

        }

    }
);



/* =========================================================
   RENDER SUBJECTS
========================================================= */

function renderSubjects() {

    subjectList.innerHTML =
        subjects
            .map(
                (
                    subject,
                    index
                ) => `

                    <span class="editable-tag">

                        ${escapeHtml(
                            subject
                        )}

                        <button
                            type="button"
                            data-remove-subject="${index}"
                        >
                            ×
                        </button>

                    </span>

                `
            )
            .join("");

}



/* =========================================================
   REMOVE TAGS
========================================================= */

document.addEventListener(
    "click",
    event => {

        const removeMedium =
            event.target.closest(
                "[data-remove-medium]"
            );


        if (
            removeMedium
        ) {

            const index =
                Number(
                    removeMedium.dataset
                        .removeMedium
                );


            mediums.splice(
                index,
                1
            );


            renderMediums();

        }


        const removeSubject =
            event.target.closest(
                "[data-remove-subject]"
            );


        if (
            removeSubject
        ) {

            const index =
                Number(
                    removeSubject.dataset
                        .removeSubject
                );


            subjects.splice(
                index,
                1
            );


            renderSubjects();

        }


        const editButton =
            event.target.closest(
                "[data-edit-course]"
            );


        if (
            editButton
        ) {

            const course =
                courses.find(
                    item =>
                        item.id ===
                        editButton.dataset
                            .editCourse
                );


            if (course) {

                openEditCourse(
                    course
                );

            }

        }


        const contentButton =
            event.target.closest(
                "[data-content-course]"
            );


        if (
            contentButton
        ) {

            const course =
                courses.find(
                    item =>
                        item.id ===
                        contentButton.dataset
                            .contentCourse
                );


            if (course) {

                openContent(
                    course
                );

            }

        }

    }
);



/* =========================================================
   COURSE TYPE
========================================================= */

document
    .querySelectorAll(
        'input[name="courseType"]'
    )
    .forEach(
        radio => {

            radio.addEventListener(
                "change",
                updateCourseType
            );

        }
    );


function updateCourseType() {

    const type =
        document.querySelector(
            'input[name="courseType"]:checked'
        ).value;


    document
        .getElementById(
            "paidFields"
        )
        .classList.toggle(
            "hidden",
            type !== "PAID"
        );


    updateFinalPrice();

}



/* =========================================================
   PRICE
========================================================= */

document
    .getElementById(
        "coursePrice"
    )
    .addEventListener(
        "input",
        updateFinalPrice
    );


document
    .getElementById(
        "courseDiscount"
    )
    .addEventListener(
        "input",
        updateFinalPrice
    );


function updateFinalPrice() {

    const type =
        document.querySelector(
            'input[name="courseType"]:checked'
        )?.value;


    if (
        type !==
        "PAID"
    ) {

        document.getElementById(
            "finalPrice"
        ).textContent =
            "Free";

        return;

    }


    const price =
        Number(
            document.getElementById(
                "coursePrice"
            ).value ||
            0
        );


    const discount =
        Math.min(
            price,

            Number(
                document.getElementById(
                    "courseDiscount"
                ).value ||
                0
            )
        );


    const final =
        Math.max(
            0,
            price - discount
        );


    document.getElementById(
        "finalPrice"
    ).textContent =
        `Final price: ₹${final.toLocaleString(
            "en-IN"
        )}`;

}



/* =========================================================
   SAVE COURSE
========================================================= */

courseForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (
            !mediums.length
        ) {

            showToast(
                "Add at least one language."
            );

            return;

        }


        if (
            !subjects.length
        ) {

            showToast(
                "Add at least one subject."
            );

            return;

        }


        const type =
            document.querySelector(
                'input[name="courseType"]:checked'
            ).value;


        const price =
            type === "PAID"
                ? Math.max(
                    0,
                    Number(
                        document.getElementById(
                            "coursePrice"
                        ).value ||
                        0
                    )
                )
                : 0;


        const discount =
            type === "PAID"
                ? Math.min(
                    price,
                    Math.max(
                        0,
                        Number(
                            document.getElementById(
                                "courseDiscount"
                            ).value ||
                            0
                        )
                    )
                )
                : 0;


        const courseData = {

            crmCourseName:
                document.getElementById(
                    "courseName"
                ).value.trim(),

            crmCourseCode:
                document.getElementById(
                    "courseCode"
                ).value.trim(),

            crmClass:
                document.getElementById(
                    "courseClass"
                ).value,

            crmBoard:
                document.getElementById(
                    "courseBoard"
                ).value.trim(),

            crmDescription:
                document.getElementById(
                    "courseDescription"
                ).value.trim(),

            crmImageUrl:
                document.getElementById(
                    "courseImageUrl"
                ).value.trim(),


            /* LANGUAGES */

            mediums: [
                ...mediums
            ],

            crmMedium:
                mediums.join(
                    ", "
                ),


            /* SUBJECTS */

            subjects: [
                ...subjects
            ],


            /* PRICE */

            courseType:
                type,

            crmPrice:
                price,

            crmDiscount:
                discount,

            crmFinalPrice:
                Math.max(
                    0,
                    price - discount
                ),


            priority:
                Math.max(
                    1,
                    Number(
                        document.getElementById(
                            "coursePriority"
                        ).value ||
                        1
                    )
                ),


            crmActive:
                document.getElementById(
                    "courseActive"
                ).checked,


            updatedAt:
                serverTimestamp(),

            updatedBy:
                currentUser.uid

        };


        try {

            document.getElementById(
                "saveCourseBtn"
            ).disabled = true;


            let courseId =
                editingCourseId;


            if (
                editingCourseId
            ) {

                await updateDoc(
                    doc(
                        db,
                        COURSES_COLLECTION,
                        editingCourseId
                    ),

                    courseData
                );

            } else {

                const created =
                    await addDoc(
                        collection(
                            db,
                            COURSES_COLLECTION
                        ),

                        {
                            ...courseData,

                            createdAt:
                                serverTimestamp(),

                            createdBy:
                                currentUser.uid
                        }
                    );


                courseId =
                    created.id;

            }


            /*
             * Keep existing hybridSubjects
             * collection.
             *
             * Do not create duplicates.
             */

            await syncCourseSubjects(
                courseId,
                courseData
            );


            courseModal.classList.add(
                "hidden"
            );


            showToast(
                editingCourseId
                    ? "Course updated."
                    : "Course created."
            );


        } catch (
            error
        ) {

            console.error(
                error
            );


            showToast(
                "Unable to save course."
            );

        } finally {

            document.getElementById(
                "saveCourseBtn"
            ).disabled = false;

        }

    }
);



/* =========================================================
   SYNC SUBJECTS
========================================================= */

async function syncCourseSubjects(
    courseId,
    courseData
) {

    const snapshot =
        await getDocs(
            collection(
                db,
                SUBJECTS_COLLECTION
            )
        );


    const existing =
        snapshot.docs.map(
            item => ({
                id: item.id,
                ...item.data()
            })
        );


    const cleanSubjects =
        uniqueStrings(
            courseData.subjects
        );


    for (
        const subjectName of
        cleanSubjects
    ) {

        const alreadyExists =
            existing.some(
                subject => {

                    const belongsToCourse =
                        subject.crmCourseId ===
                            courseId ||

                        subject.courseId ===
                            courseId ||

                        subject.targetCourseId ===
                            courseId ||

                        subject.courseID ===
                            courseId;


                    const sameSubject =
                        normalize(
                            subject.name ||
                            subject.subjectName
                        ) ===
                        normalize(
                            subjectName
                        );


                    return (
                        belongsToCourse &&
                        sameSubject
                    );

                }
            );


        if (
            alreadyExists
        ) {

            continue;

        }


        await addDoc(
            collection(
                db,
                SUBJECTS_COLLECTION
            ),

            {

                name:
                    subjectName,

                subjectName:
                    subjectName,

                crmCourseId:
                    courseId,

                courseId:
                    courseId,

                courseName:
                    courseData.crmCourseName,

                crmClass:
                    courseData.crmClass,

                active:
                    true,

                createdAt:
                    serverTimestamp(),

                createdBy:
                    currentUser.uid,

                updatedAt:
                    serverTimestamp(),

                updatedBy:
                    currentUser.uid

            }
        );

    }

}



/* =========================================================
   CONTENT VIEWER
========================================================= */

async function openContent(
    course
) {

    document.getElementById(
        "contentCourseTitle"
    ).textContent =
        course.crmCourseName ||
        "Course Content";


    document.getElementById(
        "contentBody"
    ).innerHTML =
        "<p>Loading content...</p>";


    contentModal.classList.remove(
        "hidden"
    );


    try {

        const [
            subjectSnapshot,
            chapterSnapshot
        ] =
            await Promise.all([

                getDocs(
                    collection(
                        db,
                        SUBJECTS_COLLECTION
                    )
                ),

                getDocs(
                    collection(
                        db,
                        CHAPTERS_COLLECTION
                    )
                )

            ]);


        const allSubjects =
            subjectSnapshot.docs.map(
                item => ({
                    id: item.id,
                    ...item.data()
                })
            );


        const allChapters =
            chapterSnapshot.docs.map(
                item => ({
                    id: item.id,
                    ...item.data()
                })
            );


        /*
         * First use course ID.
         */

        let courseSubjects =
            allSubjects.filter(
                subject => {

                    return (

                        subject.crmCourseId ===
                            course.id ||

                        subject.courseId ===
                            course.id ||

                        subject.targetCourseId ===
                            course.id ||

                        subject.courseID ===
                            course.id

                    );

                }
            );


        /*
         * Legacy fallback.
         */

        if (
            !courseSubjects.length
        ) {

            const wanted =
                new Set(
                    uniqueStrings(
                        course.subjects ||
                        []
                    ).map(
                        normalize
                    )
                );


            courseSubjects =
                allSubjects.filter(
                    subject =>
                        wanted.has(
                            normalize(
                                subject.name ||
                                subject.subjectName
                            )
                        )
                );

        }


        /*
         * IMPORTANT:
         *
         * Even if Firebase currently contains
         * 3 copies, admin UI shows one subject.
         */

        const seen =
            new Set();


        courseSubjects =
            courseSubjects.filter(
                subject => {

                    const name =
                        normalize(
                            subject.name ||
                            subject.subjectName
                        );


                    if (
                        !name ||
                        seen.has(name)
                    ) {

                        return false;

                    }


                    seen.add(name);

                    return true;

                }
            );


        if (
            !courseSubjects.length
        ) {

            document.getElementById(
                "contentBody"
            ).innerHTML = `
                <div class="empty-state">
                    No subjects found.
                </div>
            `;

            return;

        }


        document.getElementById(
            "contentBody"
        ).innerHTML =
            courseSubjects
                .map(
                    subject => {

                        const chapters =
                            allChapters.filter(
                                chapter => {

                                    return (

                                        chapter.subjectId ===
                                            subject.id ||

                                        chapter.hybridSubjectId ===
                                            subject.id ||

                                        chapter.subjectID ===
                                            subject.id

                                    );

                                }
                            );


                        return `

                            <div class="content-subject">

                                <div class="content-subject-header">

                                    <div class="content-subject-title">

                                        ${escapeHtml(
                                            subject.name ||
                                            subject.subjectName ||
                                            "Subject"
                                        )}

                                    </div>


                                    <div class="course-meta">

                                        ${
                                            chapters.length
                                        }

                                        chapter${
                                            chapters.length ===
                                            1
                                                ? ""
                                                : "s"
                                        }

                                    </div>

                                </div>


                                ${
                                    chapters.length

                                        ? chapters
                                            .map(
                                                chapter => `

                                                    <div class="chapter">

                                                        <div class="chapter-title">

                                                            ${escapeHtml(
                                                                chapter.name ||
                                                                chapter.chapterName ||
                                                                chapter.title ||
                                                                "Chapter"
                                                            )}

                                                        </div>


                                                        ${
                                                            Array.isArray(
                                                                chapter.videos
                                                            )

                                                                ? chapter.videos
                                                                    .map(
                                                                        video => `

                                                                            <div class="content-item">

                                                                                ▶

                                                                                ${escapeHtml(
                                                                                    video.title ||
                                                                                    "Video"
                                                                                )}

                                                                            </div>

                                                                        `
                                                                    )
                                                                    .join("")

                                                                : ""
                                                        }


                                                        ${
                                                            Array.isArray(
                                                                chapter.pdfs
                                                            )

                                                                ? chapter.pdfs
                                                                    .map(
                                                                        pdf => `

                                                                            <div class="content-item">

                                                                                PDF ·

                                                                                ${escapeHtml(
                                                                                    pdf.title ||
                                                                                    "PDF"
                                                                                )}

                                                                            </div>

                                                                        `
                                                                    )
                                                                    .join("")

                                                                : ""
                                                        }

                                                    </div>

                                                `
                                            )
                                            .join("")

                                        : `
                                            <div class="course-meta"
                                                 style="margin-top:10px">

                                                No chapters yet.

                                            </div>
                                        `
                                }

                            </div>

                        `;

                    }
                )
                .join("");


    } catch (
        error
    ) {

        console.error(
            error
        );


        document.getElementById(
            "contentBody"
        ).innerHTML = `
            <div class="empty-state">
                Unable to load content.
            </div>
        `;

    }

}



/* =========================================================
   CLOSE MODALS
========================================================= */

document
    .getElementById(
        "closeCourseModal"
    )
    .addEventListener(
        "click",
        () => {

            courseModal.classList.add(
                "hidden"
            );

        }
    );


document
    .getElementById(
        "cancelCourseBtn"
    )
    .addEventListener(
        "click",
        () => {

            courseModal.classList.add(
                "hidden"
            );

        }
    );


document
    .getElementById(
        "closeContentModal"
    )
    .addEventListener(
        "click",
        () => {

            contentModal.classList.add(
                "hidden"
            );

        }
    );


document
    .querySelectorAll(
        ".modal-overlay"
    )
    .forEach(
        overlay => {

            overlay.addEventListener(
                "click",
                () => {

                    overlay
                        .parentElement
                        .classList.add(
                            "hidden"
                        );

                }
            );

        }
    );



/* =========================================================
   FILTERS
========================================================= */

courseSearch.addEventListener(
    "input",
    renderCourses
);

classFilter.addEventListener(
    "change",
    renderCourses
);

statusFilter.addEventListener(
    "change",
    renderCourses
);



/* =========================================================
   BACK
========================================================= */

document
    .getElementById(
        "backBtn"
    )
    .addEventListener(
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



/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


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


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2600
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
    ).replace(
        /[&<>"']/g,
        character => ({

            "&":
                "&amp;",

            "<":
                "&lt;",

            ">":
                "&gt;",

            '"':
                "&quot;",

            "'":
                "&#039;"

        })[character]
    );

}


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

    }

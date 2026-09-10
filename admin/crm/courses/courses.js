import {
    auth,
    db,
    storage
} from "../../../firebase/firebase-config.js";


import {
    collection,
    addDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    where,
    orderBy,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let courses = [];

let teachers = [];

let mediums = [];

let subjects = [];

let selectedImageSource = "url";

let selectedPdfSource = "url";

let selectedCourseForContent = null;

let unsubscribeCourses = null;

let unsubscribeTeachers = null;


/* =========================================================
   ELEMENTS
========================================================= */

const courseModal =
    document.getElementById(
        "courseModal"
    );

const teacherModal =
    document.getElementById(
        "teacherModal"
    );

const contentModal =
    document.getElementById(
        "contentModal"
    );

const courseForm =
    document.getElementById(
        "courseForm"
    );

const teacherForm =
    document.getElementById(
        "teacherForm"
    );

const chapterForm =
    document.getElementById(
        "chapterForm"
    );

const videoForm =
    document.getElementById(
        "videoForm"
    );

const pdfForm =
    document.getElementById(
        "pdfForm"
    );

const courseTableBody =
    document.getElementById(
        "courseTableBody"
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

const courseImageUrl =
    document.getElementById(
        "courseImageUrl"
    );

const courseImageFile =
    document.getElementById(
        "courseImageFile"
    );

const imagePreview =
    document.getElementById(
        "imagePreview"
    );

const paidFields =
    document.getElementById(
        "paidFields"
    );

const coursePrice =
    document.getElementById(
        "coursePrice"
    );

const courseDiscount =
    document.getElementById(
        "courseDiscount"
    );

const finalPrice =
    document.getElementById(
        "finalPrice"
    );

const courseTeacher =
    document.getElementById(
        "courseTeacher"
    );

const toast =
    document.getElementById(
        "toast"
    );


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "../../../login/";

            return;

        }

        currentUser = user;

        /*
         * Frontend gate only.
         *
         * Production Firestore/Storage rules
         * must independently verify admin access.
         */

        startCoursesListener();

        startTeachersListener();

    }
);


/* =========================================================
   COURSE LISTENER
========================================================= */

function startCoursesListener() {

    const coursesRef =
        collection(
            db,
            "crmCourses"
        );


    const coursesQuery =
        query(
            coursesRef
        );


    unsubscribeCourses =
        onSnapshot(
            coursesQuery,

            snapshot => {

                courses =
                    snapshot.docs.map(
                        item => ({
                            id: item.id,
                            ...item.data()
                        })
                    );


                courses.sort(
                    sortCourses
                );


                updateSummary();

                buildClassFilter();

                renderCourses();

            },

            error => {

                console.error(
                    error
                );

                showToast(
                    "Unable to load courses."
                );

            }
        );

}


/* =========================================================
   TEACHER LISTENER
========================================================= */

function startTeachersListener() {

    const teachersRef =
        collection(
            db,
            "crmTeachers"
        );


    unsubscribeTeachers =
        onSnapshot(
            teachersRef,

            snapshot => {

                teachers =
                    snapshot.docs.map(
                        item => ({
                            id: item.id,
                            ...item.data()
                        })
                    );


                teachers.sort(
                    (a, b) =>
                        String(
                            a.name || ""
                        ).localeCompare(
                            String(
                                b.name || ""
                            )
                        )
                );


                renderTeachers();

            },

            error => {

                console.error(
                    error
                );

            }
        );

}


/* =========================================================
   SORT
========================================================= */

function sortCourses(
    a,
    b
) {

    const priorityA =
        Number(
            a.priority ?? 999999
        );

    const priorityB =
        Number(
            b.priority ?? 999999
        );


    if (
        priorityA !==
        priorityB
    ) {

        return (
            priorityA -
            priorityB
        );

    }


    return (
        timestampValue(
            b.createdAt
        ) -
        timestampValue(
            a.createdAt
        )
    );

}


function timestampValue(
    value
) {

    if (!value) return 0;

    if (
        typeof value.toMillis ===
        "function"
    ) {

        return value.toMillis();

    }

    if (
        value.seconds
    ) {

        return (
            value.seconds *
            1000
        );

    }

    return 0;

}


/* =========================================================
   SUMMARY
========================================================= */

function updateSummary() {

    const total =
        courses.length;


    const active =
        courses.filter(
            course =>
                course.crmActive ===
                true
        ).length;


    const free =
        courses.filter(
            course =>
                String(
                    course.courseType ||
                    "FREE"
                ).toUpperCase() ===
                "FREE"
        ).length;


    const paid =
        courses.filter(
            course =>
                String(
                    course.courseType ||
                    "FREE"
                ).toUpperCase() ===
                "PAID"
        ).length;


    document.getElementById(
        "totalCourses"
    ).textContent =
        total;


    document.getElementById(
        "activeCourses"
    ).textContent =
        active;


    document.getElementById(
        "freeCourses"
    ).textContent =
        free;


    document.getElementById(
        "paidCourses"
    ).textContent =
        paid;

}


/* =========================================================
   CLASS FILTER
========================================================= */

function buildClassFilter() {

    const current =
        classFilter.value ||
        "ALL";


    const classes =
        [
            ...new Set(
                courses
                    .map(
                        course =>
                            course.crmClass
                    )
                    .filter(Boolean)
            )
        ]
        .sort(
            compareClasses
        );


    classFilter.innerHTML = `

        <option value="ALL">
            All Classes
        </option>

    `;


    classes.forEach(
        className => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                className;

            option.textContent =
                displayClass(
                    className
                );

            classFilter.appendChild(
                option
            );

        }
    );


    if (
        classes.includes(
            current
        )
    ) {

        classFilter.value =
            current;

    }

}


function compareClasses(
    a,
    b
) {

    const order = {

        UNDER_8TH: 1,
        "8TH": 2,
        "9TH": 3,
        "10TH": 4,
        "1ST_PUC": 5,
        "2ND_PUC": 6

    };


    return (
        (order[a] || 99) -
        (order[b] || 99)
    );

}


/* =========================================================
   RENDER COURSES
========================================================= */

function renderCourses() {

    const search =
        courseSearch.value
            .trim()
            .toLowerCase();


    const classValue =
        classFilter.value;


    const statusValue =
        statusFilter.value;


    const filtered =
        courses.filter(
            course => {

                const searchable = [

                    course.crmCourseName,

                    course.crmCourseCode,

                    course.crmDescription,

                    course.crmClass,

                    ...(course.mediums || [])

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                if (
                    search &&
                    !searchable.includes(
                        search
                    )
                ) {

                    return false;

                }


                if (
                    classValue !==
                    "ALL" &&
                    course.crmClass !==
                    classValue
                ) {

                    return false;

                }


                if (
                    statusValue ===
                    "ACTIVE" &&
                    course.crmActive !==
                    true
                ) {

                    return false;

                }


                if (
                    statusValue ===
                    "INACTIVE" &&
                    course.crmActive ===
                    true
                ) {

                    return false;

                }


                return true;

            }
        );


    courseTableBody.innerHTML =
        "";


    if (
        filtered.length === 0
    ) {

        emptyCourses.classList.remove(
            "hidden"
        );

        document
            .getElementById(
                "courseTableWrapper"
            )
            .classList.add(
                "hidden"
            );

        return;

    }


    emptyCourses.classList.add(
        "hidden"
    );

    document
        .getElementById(
            "courseTableWrapper"
        )
        .classList.remove(
            "hidden"
        );


    filtered.forEach(
        course => {

            courseTableBody.appendChild(
                createCourseRow(
                    course
                )
            );

        }
    );

}


/* =========================================================
   COURSE ROW
========================================================= */

function createCourseRow(
    course
) {

    const row =
        document.createElement(
            "tr"
        );


    const image =
        safeUrl(
            course.crmImageUrl
        );


    const mediums =
        Array.isArray(
            course.mediums
        )
            ? course.mediums
            : (
                course.crmMedium
                    ? [course.crmMedium]
                    : []
            );


    const type =
        String(
            course.courseType ||
            "FREE"
        ).toUpperCase();


    const price =
        Number(
            course.crmFinalPrice ??
            course.crmPrice ??
            0
        );


    row.innerHTML = `

        <td>

            <div class="course-cell">

                ${
                    image
                    ?
                    `
                    <img
                        class="course-thumb"
                        src="${image}"
                        alt=""
                    >
                    `
                    :
                    `
                    <div
                        class="course-thumb"
                    ></div>
                    `
                }


                <div>

                    <div class="course-name">
                        ${escapeHtml(
                            course.crmCourseName ||
                            "Untitled"
                        )}
                    </div>

                    <div class="course-code">
                        ${escapeHtml(
                            course.crmCourseCode ||
                            "No course code"
                        )}
                    </div>

                </div>

            </div>

        </td>


        <td>
            ${escapeHtml(
                displayClass(
                    course.crmClass
                )
            )}
        </td>


        <td>

            <div class="medium-stack">

                ${
                    mediums.length
                    ?
                    mediums.map(
                        medium => `
                            <span class="medium-pill">
                                ${escapeHtml(
                                    medium
                                )}
                            </span>
                        `
                    ).join("")
                    :
                    "-"
                }

            </div>

        </td>


        <td>

            <span
                class="type-pill ${
                    type === "PAID"
                        ? "type-paid"
                        : "type-free"
                }"
            >
                ${type}
            </span>

        </td>


        <td>
            ${
                type === "PAID"
                    ? formatPrice(price)
                    : "Free"
            }
        </td>


        <td>
            ${Number(
                course.priority ??
                999
            )}
        </td>


        <td>

            <span
                class="status-pill ${
                    course.crmActive
                        ? "status-active"
                        : "status-inactive"
                }"
            >
                ${
                    course.crmActive
                        ? "ACTIVE"
                        : "INACTIVE"
                }
            </span>

        </td>


        <td>

            <div class="row-actions">

                <button
                    class="icon-btn purple"
                    title="Add chapter"
                    data-action="chapter"
                >
                    Ch
                </button>


                <button
                    class="icon-btn purple"
                    title="Add video"
                    data-action="video"
                >
                    V
                </button>


                <button
                    class="icon-btn purple"
                    title="Add PDF"
                    data-action="pdf"
                >
                    PDF
                </button>


                <button
                    class="icon-btn"
                    title="Edit"
                    data-action="edit"
                >
                    ✎
                </button>


                <button
                    class="icon-btn"
                    title="${
                        course.crmActive
                            ? "Deactivate"
                            : "Activate"
                    }"
                    data-action="toggle"
                >
                    ${
                        course.crmActive
                            ? "●"
                            : "○"
                    }
                </button>


                <button
                    class="icon-btn"
                    title="Delete"
                    data-action="delete"
                >
                    ×
                </button>

            </div>

        </td>

    `;


    row
        .querySelectorAll(
            "[data-action]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const action =
                            button.dataset.action;


                        if (
                            action ===
                            "edit"
                        ) {

                            openEditCourse(
                                course
                            );

                        }


                        if (
                            action ===
                            "chapter"
                        ) {

                            openContentModal(
                                course,
                                "chapter"
                            );

                        }


                        if (
                            action ===
                            "video"
                        ) {

                            openContentModal(
                                course,
                                "video"
                            );

                        }


                        if (
                            action ===
                            "pdf"
                        ) {

                            openContentModal(
                                course,
                                "pdf"
                            );

                        }


                        if (
                            action ===
                            "toggle"
                        ) {

                            toggleCourse(
                                course
                            );

                        }


                        if (
                            action ===
                            "delete"
                        ) {

                            deleteCourse(
                                course
                            );

                        }

                    }
                );

            }
        );


    return row;

}


/* =========================================================
   OPEN COURSE MODAL
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


document
    .getElementById(
        "emptyAddCourseBtn"
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


function resetCourseForm() {

    courseForm.reset();

    document.getElementById(
        "editingCourseId"
    ).value =
        "";


    document.getElementById(
        "courseModalTitle"
    ).textContent =
        "Create Course";


    document.getElementById(
        "courseModalLabel"
    ).textContent =
        "NEW COURSE";


    mediums = [];

    subjects = [];


    renderMediums();

    renderSubjects();


    document
        .querySelector(
            'input[name="courseType"][value="FREE"]'
        )
        .checked =
        true;


    paidFields.classList.add(
        "hidden"
    );


    courseImageUrl.value =
        "";

    courseImageFile.value =
        "";

    selectedImageSource =
        "url";


    document
        .querySelectorAll(
            ".source-btn"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.source ===
                    "url"
                );

            }
        );


    document
        .getElementById(
            "urlSource"
        )
        .classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "uploadSource"
        )
        .classList.add(
            "hidden"
        );


    imagePreview.innerHTML =
        "<span>No image</span>";


    renderTeachers();

}


/* =========================================================
   EDIT COURSE
========================================================= */

async function openEditCourse(
    course
) {

    document.getElementById(
        "editingCourseId"
    ).value =
        course.id;


    document.getElementById(
        "courseModalTitle"
    ).textContent =
        "Edit Course";


    document.getElementById(
        "courseModalLabel"
    ).textContent =
        "EDIT COURSE";


    document.getElementById(
        "courseClass"
    ).value =
        course.crmClass ||
        "";


    document.getElementById(
        "courseCode"
    ).value =
        course.crmCourseCode ||
        "";


    document.getElementById(
        "courseTitle"
    ).value =
        course.crmCourseName ||
        "";


    document.getElementById(
        "courseDescription"
    ).value =
        course.crmDescription ||
        "";


    mediums =
        Array.isArray(
            course.mediums
        )
            ? [...course.mediums]
            : (
                course.crmMedium
                    ? [course.crmMedium]
                    : []
            );


    subjects =
        Array.isArray(
            course.subjects
        )
            ? [...course.subjects]
            : [];


    renderMediums();

    renderSubjects();


    document.getElementById(
        "courseTeacher"
    ).value =
        course.teacherId ||
        "";


    const type =
        String(
            course.courseType ||
            "FREE"
        ).toUpperCase();


    document
        .querySelectorAll(
            'input[name="courseType"]'
        )
        .forEach(
            radio => {

                radio.checked =
                    radio.value ===
                    type;

            }
        );


    if (
        type === "PAID"
    ) {

        paidFields.classList.remove(
            "hidden"
        );

    } else {

        paidFields.classList.add(
            "hidden"
        );

    }


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


    document.getElementById(
        "coursePriority"
    ).value =
        course.priority ??
        1;


    document.getElementById(
        "courseActive"
    ).value =
        String(
            course.crmActive !==
            false
        );


    courseImageUrl.value =
        course.crmImageUrl ||
        "";


    if (
        course.crmImageUrl
    ) {

        showImagePreview(
            course.crmImageUrl
        );

    } else {

        imagePreview.innerHTML =
            "<span>No image</span>";

    }


    updateFinalPrice();

    renderTeachers();

    courseTeacher.value =
        course.teacherId ||
        "";


    courseModal.classList.remove(
        "hidden"
    );

}


/* =========================================================
   SAVE COURSE
========================================================= */

courseForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (
            mediums.length === 0
        ) {

            document
                .getElementById(
                    "mediumError"
                )
                .classList.remove(
                    "hidden"
                );

            showToast(
                "Add at least one medium."
            );

            return;

        }


        document
            .getElementById(
                "mediumError"
            )
            .classList.add(
                "hidden"
            );


        if (
            subjects.length === 0
        ) {

            showToast(
                "Add at least one subject."
            );

            return;

        }


        const editingId =
            document.getElementById(
                "editingCourseId"
            ).value;


        const type =
            document.querySelector(
                'input[name="courseType"]:checked'
            ).value;


        const price =
            type === "PAID"
                ? numberValue(
                    coursePrice.value
                )
                : 0;


        const discount =
            type === "PAID"
                ? numberValue(
                    courseDiscount.value
                )
                : 0;


        const final =
            Math.max(
                0,
                price - discount
            );


        const teacherId =
            courseTeacher.value ||
            "";


        const teacher =
            teachers.find(
                item =>
                    item.id ===
                    teacherId
            );


        try {

            setSaving(
                true
            );


            let imageUrl =
                courseImageUrl.value
                    .trim();


            /*
             * Upload only when the admin selected
             * an actual image file.
             */

            if (
                selectedImageSource ===
                    "upload" &&
                courseImageFile.files.length
            ) {

                const file =
                    courseImageFile.files[0];


                validateImageFile(
                    file
                );


                const fileName =
                    createSafeFileName(
                        file.name
                    );


                const storagePath =
                    `crm/courses/${Date.now()}_${fileName}`;


                const storageRef =
                    ref(
                        storage,
                        storagePath
                    );


                await uploadBytes(
                    storageRef,
                    file
                );


                imageUrl =
                    await getDownloadURL(
                        storageRef
                    );

            }


            const data = {

                crmClass:
                    document.getElementById(
                        "courseClass"
                    ).value,

                crmCourseCode:
                    document.getElementById(
                        "courseCode"
                    ).value
                    .trim(),

                crmCourseName:
                    document.getElementById(
                        "courseTitle"
                    ).value
                    .trim(),

                crmDescription:
                    document.getElementById(
                        "courseDescription"
                    ).value
                    .trim(),


                /*
                 * MULTIPLE MEDIUMS
                 */

                mediums:
                    [...mediums],


                /*
                 * Compatibility field.
                 *
                 * New code should use mediums[].
                 */

                crmMedium:
                    mediums.join(", "),

                subjects:
                    [...subjects],


                teacherId:
                    teacherId,

                teacherName:
                    teacher?.name ||
                    "",


                crmImageUrl:
                    imageUrl,


                courseType:
                    type,


                crmPrice:
                    price,

                crmDiscount:
                    discount,

                crmFinalPrice:
                    final,


                priority:
                    numberValue(
                        document.getElementById(
                            "coursePriority"
                        ).value
                    ) || 1,


                crmActive:
                    document.getElementById(
                        "courseActive"
                    ).value ===
                    "true",


                updatedAt:
                    serverTimestamp(),

                updatedBy:
                    currentUser.uid

            };


            if (
                editingId
            ) {

                const courseRef =
                    doc(
                        db,
                        "crmCourses",
                        editingId
                    );


                await updateDoc(
                    courseRef,
                    data
                );


                showToast(
                    "Course updated successfully."
                );

            } else {

                data.createdAt =
                    serverTimestamp();

                data.createdBy =
                    currentUser.uid;


                const created =
                    await addDoc(
                        collection(
                            db,
                            "crmCourses"
                        ),
                        data
                    );


                showToast(
                    "Course created successfully."
                );


                /*
                 * We can immediately offer
                 * content creation after creation.
                 */

                setTimeout(
                    () => {

                        const createdCourse =
                            {
                                id: created.id,
                                ...data
                            };


                        closeCourseModal();


                        openContentModal(
                            createdCourse,
                            "chapter"
                        );

                    },
                    350
                );


                return;

            }


            closeCourseModal();

        } catch (
            error
        ) {

            console.error(
                "Course save error:",
                error
            );


            showToast(
                error.message ||
                "Unable to save course."
            );

        } finally {

            setSaving(
                false
            );

        }

    }
);


/* =========================================================
   MEDIUMS
========================================================= */

document
    .getElementById(
        "addMediumBtn"
    )
    .addEventListener(
        "click",
        addMedium
    );


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


function addMedium() {

    const value =
        newMedium.value
            .trim();


    if (!value) {

        return;

    }


    const exists =
        mediums.some(
            medium =>
                medium.toLowerCase() ===
                value.toLowerCase()
        );


    if (
        exists
    ) {

        showToast(
            "This medium is already added."
        );

        return;

    }


    mediums.push(
        value
    );


    newMedium.value =
        "";


    renderMediums();


    document
        .getElementById(
            "mediumError"
        )
        .classList.add(
            "hidden"
        );

}


function renderMediums() {

    mediumList.innerHTML =
        "";


    mediums.forEach(
        (medium, index) => {

            const chip =
                document.createElement(
                    "div"
                );


            chip.className =
                "medium-editor-chip";


            chip.innerHTML = `

                <span>
                    ${escapeHtml(
                        medium
                    )}
                </span>

                <button
                    type="button"
                    data-index="${index}"
                >
                    ×
                </button>

            `;


            chip
                .querySelector(
                    "button"
                )
                .addEventListener(
                    "click",
                    () => {

                        mediums.splice(
                            index,
                            1
                        );

                        renderMediums();

                    }
                );


            mediumList.appendChild(
                chip
            );

        }
    );

}


/* =========================================================
   SUBJECTS
========================================================= */

document
    .getElementById(
        "addSubjectBtn"
    )
    .addEventListener(
        "click",
        addSubject
    );


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


function addSubject() {

    const value =
        newSubject.value
            .trim();


    if (!value) {

        return;

    }


    const exists =
        subjects.some(
            subject =>
                subject.toLowerCase() ===
                value.toLowerCase()
        );


    if (
        exists
    ) {

        showToast(
            "This subject is already added."
        );

        return;

    }


    subjects.push(
        value
    );


    newSubject.value =
        "";


    renderSubjects();

}


function renderSubjects() {

    subjectList.innerHTML =
        "";


    subjects.forEach(
        (subject, index) => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "subject-row";


            row.innerHTML = `

                <div class="subject-number">
                    ${index + 1}
                </div>

                <span>
                    ${escapeHtml(
                        subject
                    )}
                </span>

                <button
                    type="button"
                    class="remove-subject"
                >
                    ×
                </button>

            `;


            row
                .querySelector(
                    ".remove-subject"
                )
                .addEventListener(
                    "click",
                    () => {

                        subjects.splice(
                            index,
                            1
                        );

                        renderSubjects();

                    }
                );


            subjectList.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   TEACHERS
========================================================= */

function renderTeachers() {

    const current =
        courseTeacher.value;


    courseTeacher.innerHTML = `

        <option value="">
            No teacher selected
        </option>

    `;


    teachers.forEach(
        teacher => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                teacher.id;


            option.textContent =
                teacher.name ||
                "Unnamed Teacher";


            courseTeacher.appendChild(
                option
            );

        }
    );


    if (
        teachers.some(
            teacher =>
                teacher.id ===
                current
        )
    ) {

        courseTeacher.value =
            current;

    }

}


document
    .getElementById(
        "addTeacherBtn"
    )
    .addEventListener(
        "click",
        () => {

            teacherForm.reset();

            teacherModal.classList.remove(
                "hidden"
            );

        }
    );


teacherForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const name =
            document.getElementById(
                "teacherName"
            ).value
            .trim();


        if (!name) return;


        try {

            await addDoc(
                collection(
                    db,
                    "crmTeachers"
                ),
                {

                    name,

                    phone:
                        document.getElementById(
                            "teacherPhone"
                        ).value
                        .trim(),

                    email:
                        document.getElementById(
                            "teacherEmail"
                        ).value
                        .trim(),

                    qualification:
                        document.getElementById(
                            "teacherQualification"
                        ).value
                        .trim(),

                    active:
                        true,

                    createdAt:
                        serverTimestamp(),

                    createdBy:
                        currentUser.uid

                }
            );


            showToast(
                "Teacher added."
            );


            teacherModal.classList.add(
                "hidden"
            );

        } catch (
            error
        ) {

            console.error(
                error
            );

            showToast(
                "Unable to add teacher."
            );

        }

    }
);


/* =========================================================
   IMAGE SOURCE
========================================================= */

document
    .querySelectorAll(
        ".source-btn"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    selectedImageSource =
                        button.dataset.source;


                    document
                        .querySelectorAll(
                            ".source-btn"
                        )
                        .forEach(
                            item => {

                                item.classList.toggle(
                                    "active",
                                    item ===
                                    button
                                );

                            }
                        );


                    document
                        .getElementById(
                            "urlSource"
                        )
                        .classList.toggle(
                            "hidden",
                            selectedImageSource !==
                            "url"
                        );


                    document
                        .getElementById(
                            "uploadSource"
                        )
                        .classList.toggle(
                            "hidden",
                            selectedImageSource !==
                            "upload"
                        );

                }
            );

        }
    );


courseImageUrl.addEventListener(
    "input",
    () => {

        if (
            selectedImageSource !==
            "url"
        ) {

            return;

        }


        const url =
            courseImageUrl.value
                .trim();


        if (
            url
        ) {

            showImagePreview(
                url
            );

        } else {

            imagePreview.innerHTML =
                "<span>No image</span>";

        }

    }
);


courseImageFile.addEventListener(
    "change",
    () => {

        const file =
            courseImageFile.files[0];


        if (!file) return;


        validateImageFile(
            file
        );


        const objectUrl =
            URL.createObjectURL(
                file
            );


        showImagePreview(
            objectUrl
        );

    }
);


function showImagePreview(
    url
) {

    const safe =
        safeUrl(
            url
        );


    if (!safe) {

        imagePreview.innerHTML =
            "<span>Invalid image URL</span>";

        return;

    }


    imagePreview.innerHTML = `

        <img
            src="${safe}"
            alt="Course thumbnail preview"
        >

    `;

}


/* =========================================================
   PRICING
========================================================= */

document
    .querySelectorAll(
        'input[name="courseType"]'
    )
    .forEach(
        radio => {

            radio.addEventListener(
                "change",
                () => {

                    const paid =
                        document.querySelector(
                            'input[name="courseType"]:checked'
                        ).value ===
                        "PAID";


                    paidFields.classList.toggle(
                        "hidden",
                        !paid
                    );


                    updateFinalPrice();

                }
            );

        }
    );


coursePrice.addEventListener(
    "input",
    updateFinalPrice
);


courseDiscount.addEventListener(
    "input",
    updateFinalPrice
);


function updateFinalPrice() {

    const price =
        numberValue(
            coursePrice.value
        );


    const discount =
        numberValue(
            courseDiscount.value
        );


    const final =
        Math.max(
            0,
            price - discount
        );


    finalPrice.textContent =
        formatPrice(
            final
        );

}


/* =========================================================
   CONTENT MODAL
========================================================= */

function openContentModal(
    course,
    tab
) {

    selectedCourseForContent =
        course;


    document.getElementById(
        "contentModalTitle"
    ).textContent =
        `Add Content — ${
            course.crmCourseName ||
            "Course"
        }`;


    populateContentCourse(
        course
    );


    populateCourseSubjects(
        course
    );


    activateContentTab(
        tab
    );


    contentModal.classList.remove(
        "hidden"
    );

}


function populateContentCourse(
    course
) {

    const selects = [

        document.getElementById(
            "chapterCourse"
        ),

        document.getElementById(
            "videoCourse"
        ),

        document.getElementById(
            "pdfCourse"
        )

    ];


    selects.forEach(
        select => {

            select.innerHTML = `

                <option value="${
                    escapeAttribute(
                        course.id
                    )
                }">

                    ${escapeHtml(
                        course.crmCourseName ||
                        "Course"
                    )}

                </option>

            `;

        }
    );

}


function populateCourseSubjects(
    course
) {

    const courseSubjects =
        Array.isArray(
            course.subjects
        )
            ? course.subjects
            : [];


    const selectIds = [

        "chapterSubject",
        "videoSubject",
        "pdfSubject"

    ];


    selectIds.forEach(
        id => {

            const select =
                document.getElementById(
                    id
                );


            select.innerHTML =
                "";


            if (
                courseSubjects.length ===
                0
            ) {

                select.innerHTML = `

                    <option value="">
                        No subjects available
                    </option>

                `;

                return;

            }


            select.innerHTML = `

                <option value="">
                    Select subject
                </option>

            `;


            courseSubjects.forEach(
                subject => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        subject;


                    option.textContent =
                        subject;


                    select.appendChild(
                        option
                    );

                }
            );

        }
    );

}


/* =========================================================
   CONTENT TABS
========================================================= */

document
    .querySelectorAll(
        ".content-tab"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    activateContentTab(
                        button.dataset.contentTab
                    );

                }
            );

        }
    );


function activateContentTab(
    tab
) {

    document
        .querySelectorAll(
            ".content-tab"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.contentTab ===
                    tab
                );

            }
        );


    chapterForm.classList.toggle(
        "hidden",
        tab !== "chapter"
    );


    videoForm.classList.toggle(
        "hidden",
        tab !== "video"
    );


    pdfForm.classList.toggle(
        "hidden",
        tab !== "pdf"
    );


    if (
        tab === "chapter"
    ) {

        document.getElementById(
            "chapterName"
        ).focus();

    }


    if (
        tab === "video"
    ) {

        loadChaptersForContent(
            "video"
        );

    }


    if (
        tab === "pdf"
    ) {

        loadChaptersForContent(
            "pdf"
        );

    }

}


/* =========================================================
   CHAPTER
========================================================= */

chapterForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (
            !selectedCourseForContent
        ) return;


        const subject =
            document.getElementById(
                "chapterSubject"
            ).value;


        const chapterNumber =
            numberValue(
                document.getElementById(
                    "chapterNumber"
                ).value
            );


        const chapterName =
            document.getElementById(
                "chapterName"
            ).value
            .trim();


        if (
            !subject ||
            !chapterNumber ||
            !chapterName
        ) {

            showToast(
                "Fill all chapter details."
            );

            return;

        }


        try {

            await addDoc(
                collection(
                    db,
                    "crmCourseChapters"
                ),
                {

                    courseId:
                        selectedCourseForContent.id,

                    courseName:
                        selectedCourseForContent.crmCourseName ||
                        "",

                    subject:
                        subject,

                    chapterNumber:
                        chapterNumber,

                    chapterName:
                        chapterName,

                    active:
                        true,

                    createdAt:
                        serverTimestamp(),

                    createdBy:
                        currentUser.uid

                }
            );


            showToast(
                "Chapter added."
            );


            chapterForm.reset();

            populateContentCourse(
                selectedCourseForContent
            );

            populateCourseSubjects(
                selectedCourseForContent
            );


            activateContentTab(
                "chapter"
            );

        } catch (
            error
        ) {

            console.error(
                error
            );

            showToast(
                "Unable to add chapter."
            );

        }

    }
);


/* =========================================================
   VIDEO
========================================================= */

videoForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (
            !selectedCourseForContent
        ) return;


        const subject =
            document.getElementById(
                "videoSubject"
            ).value;


        const chapterId =
            document.getElementById(
                "videoChapter"
            ).value;


        const chapterOption =
            document.getElementById(
                "videoChapter"
            )
            .selectedOptions[0];


        const title =
            document.getElementById(
                "videoTitle"
            ).value
            .trim();


        const url =
            document.getElementById(
                "videoUrl"
            ).value
            .trim();


        const description =
            document.getElementById(
                "videoDescription"
            ).value
            .trim();


        if (
            !subject ||
            !chapterId ||
            !title ||
            !url
        ) {

            showToast(
                "Fill all required video details."
            );

            return;

        }


        try {

            await addDoc(
                collection(
                    db,
                    "crmCourseVideos"
                ),
                {

                    courseId:
                        selectedCourseForContent.id,

                    courseName:
                        selectedCourseForContent.crmCourseName ||
                        "",

                    subject:
                        subject,

                    chapterId:
                        chapterId,

                    chapterNumber:
                        chapterOption?.dataset
                            ?.number ||
                        "",

                    chapterName:
                        chapterOption?.dataset
                            ?.name ||
                        "",

                    videoTitle:
                        title,

                    videoUrl:
                        url,

                    description:
                        description,

                    active:
                        true,

                    createdAt:
                        serverTimestamp(),

                    createdBy:
                        currentUser.uid

                }
            );


            showToast(
                "Video added."
            );


            videoForm.reset();

            populateContentCourse(
                selectedCourseForContent
            );

            populateCourseSubjects(
                selectedCourseForContent
            );

            activateContentTab(
                "video"
            );

            loadChaptersForContent(
                "video"
            );

        } catch (
            error
        ) {

            console.error(
                error
            );

            showToast(
                "Unable to add video."
            );

        }

    }
);


/* =========================================================
   PDF
========================================================= */

pdfForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (
            !selectedCourseForContent
        ) return;


        const subject =
            document.getElementById(
                "pdfSubject"
            ).value;


        const chapterId =
            document.getElementById(
                "pdfChapter"
            ).value;


        const chapterOption =
            document.getElementById(
                "pdfChapter"
            )
            .selectedOptions[0];


        const title =
            document.getElementById(
                "pdfTitle"
            ).value
            .trim();


        let pdfUrl =
            document.getElementById(
                "pdfUrl"
            ).value
            .trim();


        if (
            !subject ||
            !chapterId ||
            !title
        ) {

            showToast(
                "Fill all required PDF details."
            );

            return;

        }


        try {

            if (
                selectedPdfSource ===
                    "upload"
            ) {

                const file =
                    document.getElementById(
                        "pdfFile"
                    ).files[0];


                if (!file) {

                    showToast(
                        "Select a PDF file."
                    );

                    return;

                }


                if (
                    file.type !==
                    "application/pdf"
                ) {

                    showToast(
                        "Only PDF files are allowed."
                    );

                    return;

                }


                const fileName =
                    createSafeFileName(
                        file.name
                    );


                const storagePath =
                    `crm/courses/${selectedCourseForContent.id}/pdfs/${Date.now()}_${fileName}`;


                const storageRef =
                    ref(
                        storage,
                        storagePath
                    );


                await uploadBytes(
                    storageRef,
                    file
                );


                pdfUrl =
                    await getDownloadURL(
                        storageRef
                    );

            }


            if (!pdfUrl) {

                showToast(
                    "Enter a PDF URL or upload a PDF."
                );

                return;

            }


            await addDoc(
                collection(
                    db,
                    "crmCoursePdfs"
                ),
                {

                    courseId:
                        selectedCourseForContent.id,

                    courseName:
                        selectedCourseForContent.crmCourseName ||
                        "",

                    subject:
                        subject,

                    chapterId:
                        chapterId,

                    chapterNumber:
                        chapterOption?.dataset
                            ?.number ||
                        "",

                    chapterName:
                        chapterOption?.dataset
                            ?.name ||
                        "",

                    pdfTitle:
                        title,

                    pdfUrl:
                        pdfUrl,

                    active:
                        true,

                    createdAt:
                        serverTimestamp(),

                    createdBy:
                        currentUser.uid

                }
            );


            showToast(
                "PDF added."
            );


            pdfForm.reset();

            activateContentTab(
                "pdf"
            );

            populateContentCourse(
                selectedCourseForContent
            );

            populateCourseSubjects(
                selectedCourseForContent
            );

            loadChaptersForContent(
                "pdf"
            );

        } catch (
            error
        ) {

            console.error(
                error
            );

            showToast(
                error.message ||
                "Unable to add PDF."
            );

        }

    }
);


/* =========================================================
   LOAD CHAPTERS
========================================================= */

async function loadChaptersForContent(
    type
) {

    if (
        !selectedCourseForContent
    ) return;


    const subjectId =
        type === "video"
            ? "videoSubject"
            : "pdfSubject";


    const chapterId =
        type === "video"
            ? "videoChapter"
            : "pdfChapter";


    const subject =
        document.getElementById(
            subjectId
        ).value;


    const select =
        document.getElementById(
            chapterId
        );


    select.innerHTML = `

        <option value="">
            Loading chapters...
        </option>

    `;


    if (!subject) {

        select.innerHTML = `

            <option value="">
                Select subject first
            </option>

        `;

        return;

    }


    try {

        const chaptersQuery =
            query(
                collection(
                    db,
                    "crmCourseChapters"
                ),
                where(
                    "courseId",
                    "==",
                    selectedCourseForContent.id
                ),
                where(
                    "subject",
                    "==",
                    subject
                )
            );


        const snapshot =
            await getDocs(
                chaptersQuery
            );


        const chapters =
            snapshot.docs.map(
                item => ({
                    id: item.id,
                    ...item.data()
                })
            );


        chapters.sort(
            (a, b) =>
                Number(
                    a.chapterNumber ||
                    999999
                ) -
                Number(
                    b.chapterNumber ||
                    999999
                )
        );


        select.innerHTML = `

            <option value="">
                Select chapter
            </option>

        `;


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
                        chapter.chapterNumber
                    } — ${
                        chapter.chapterName
                    }`;


                option.dataset.number =
                    chapter.chapterNumber;


                option.dataset.name =
                    chapter.chapterName;


                select.appendChild(
                    option
                );

            }
        );


        if (
            chapters.length === 0
        ) {

            select.innerHTML = `

                <option value="">
                    No chapters found
                </option>

            `;

        }

    } catch (
        error
    ) {

        console.error(
            error
        );


        select.innerHTML = `

            <option value="">
                Unable to load chapters
            </option>

        `;

    }

}


/* =========================================================
   SUBJECT CHANGE → CHAPTERS
========================================================= */

document
    .getElementById(
        "videoSubject"
    )
    .addEventListener(
        "change",
        () =>
            loadChaptersForContent(
                "video"
            )
    );


document
    .getElementById(
        "pdfSubject"
    )
    .addEventListener(
        "change",
        () =>
            loadChaptersForContent(
                "pdf"
            )
    );


/* =========================================================
   PDF SOURCE
========================================================= */

document
    .querySelectorAll(
        ".pdf-source-btn"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    selectedPdfSource =
                        button.dataset
                            .pdfSource;


                    document
                        .querySelectorAll(
                            ".pdf-source-btn"
                        )
                        .forEach(
                            item => {

                                item.classList.toggle(
                                    "active",
                                    item ===
                                    button
                                );

                            }
                        );


                    document
                        .getElementById(
                            "pdfUrlSource"
                        )
                        .classList.toggle(
                            "hidden",
                            selectedPdfSource !==
                            "url"
                        );


                    document
                        .getElementById(
                            "pdfUploadSource"
                        )
                        .classList.toggle(
                            "hidden",
                            selectedPdfSource !==
                            "upload"
                        );

                }
            );

        }
    );


/* =========================================================
   COURSE TOGGLE
========================================================= */

async function toggleCourse(
    course
) {

    try {

        await updateDoc(
            doc(
                db,
                "crmCourses",
                course.id
            ),
            {

                crmActive:
                    course.crmActive !==
                    true,

                updatedAt:
                    serverTimestamp(),

                updatedBy:
                    currentUser.uid

            }
        );


        showToast(
            course.crmActive
                ? "Course deactivated."
                : "Course activated."
        );

    } catch (
        error
    ) {

        console.error(
            error
        );

        showToast(
            "Unable to update course."
        );

    }

}


/* =========================================================
   DELETE COURSE
========================================================= */

async function deleteCourse(
    course
) {

    const confirmed =
        window.confirm(
            `Delete "${course.crmCourseName}"?\n\nThis removes the course master document. Content documents are not automatically deleted.`
        );


    if (!confirmed) return;


    try {

        await deleteDoc(
            doc(
                db,
                "crmCourses",
                course.id
            )
        );


        showToast(
            "Course deleted."
        );

    } catch (
        error
    ) {

        console.error(
            error
        );

        showToast(
            "Unable to delete course."
        );

    }

}


/* =========================================================
   MODAL CLOSE
========================================================= */

function closeCourseModal() {

    courseModal.classList.add(
        "hidden"
    );

}


document
    .getElementById(
        "closeCourseModal"
    )
    .addEventListener(
        "click",
        closeCourseModal
    );


document
    .getElementById(
        "cancelCourseBtn"
    )
    .addEventListener(
        "click",
        closeCourseModal
    );


document
    .getElementById(
        "closeTeacherModal"
    )
    .addEventListener(
        "click",
        () => {

            teacherModal.classList.add(
                "hidden"
            );

        }
    );


document
    .getElementById(
        "cancelTeacherBtn"
    )
    .addEventListener(
        "click",
        () => {

            teacherModal.classList.add(
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
        ".close-content-action"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    contentModal.classList.add(
                        "hidden"
                    );

                }
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
                        .classList
                        .add(
                            "hidden"
                        );

                }
            );

        }
    );


/* =========================================================
   SEARCH / FILTERS
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
   HELPERS
========================================================= */

function numberValue(
    value
) {

    const number =
        Number(value);


    return Number.isFinite(
        number
    )
        ? number
        : 0;

}


function formatPrice(
    value
) {

    const number =
        numberValue(
            value
        );


    if (
        number <= 0
    ) {

        return "Free";

    }


    return (
        "₹" +
        number.toLocaleString(
            "en-IN"
        )
    );

}


function displayClass(
    value
) {

    const names = {

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
        names[value] ||
        String(
            value ||
            ""
        )
            .replace(
                /_/g,
                " "
            )
    );

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


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}


function safeUrl(
    value
) {

    if (!value) return "";

    try {

        const url =
            new URL(
                value,
                window.location.href
            );


        if (
            url.protocol ===
                "https:" ||
            url.protocol ===
                "http:"
        ) {

            return url.href;

        }


        return "";

    } catch {

        return "";

    }

}


function validateImageFile(
    file
) {

    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        throw new Error(
            "Please select an image file."
        );

    }


    /*
     * 10 MB max for course thumbnail.
     */

    if (
        file.size >
        10 * 1024 * 1024
    ) {

        throw new Error(
            "Image must be smaller than 10 MB."
        );

    }

}


function createSafeFileName(
    name
) {

    return String(
        name
    )
        .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );

}


function setSaving(
    saving
) {

    const button =
        document.getElementById(
            "saveCourseBtn"
        );


    button.disabled =
        saving;


    button.textContent =
        saving
            ? "Saving..."
            : (
                document.getElementById(
                    "editingCourseId"
                ).value
                    ? "Update Course"
                    : "Save Course"
            );

}


function showToast(
    message
) {

    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        showToast.timer
    );


    showToast.timer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2800
        );

}

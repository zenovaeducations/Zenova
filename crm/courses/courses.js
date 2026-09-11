import {
    auth,
    db,
    storage
} from "../../firebase/firebase-config.js";

import {
    collection,
    addDoc,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    where,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let courses = [];

let mediums = [];

let subjects = [];

let languageConfig = {
    firstLanguage: {
        enabled: false,
        required: false,
        options: []
    },

    secondLanguage: {
        enabled: false,
        required: false,
        options: []
    },

    thirdLanguage: {
        enabled: false,
        required: false,
        options: []
    }
};

let selectedImageSource = "url";

let selectedPdfSource = "url";

let selectedCourseForContent = null;

let selectedSubjectForContent = null;

let unsubscribeCourses = null;

let unsubscribeSubjects = null;

let unsubscribeChapters = null;

let allSubjects = [];

let allChapters = [];


/* =========================================================
   ELEMENTS
========================================================= */

const courseModal =
    document.getElementById("courseModal");

const contentModal =
    document.getElementById("contentModal");

const contentEditModal =
    document.getElementById("contentEditModal");

const courseForm =
    document.getElementById("courseForm");

const contentEditForm =
    document.getElementById("contentEditForm");

const courseTableBody =
    document.getElementById("courseTableBody");

const emptyCourses =
    document.getElementById("emptyCourses");

const courseSearch =
    document.getElementById("courseSearch");

const classFilter =
    document.getElementById("classFilter");

const statusFilter =
    document.getElementById("statusFilter");

const mediumList =
    document.getElementById("mediumList");

const newMedium =
    document.getElementById("newMedium");

const subjectList =
    document.getElementById("subjectList");

const newSubject =
    document.getElementById("newSubject");

const newSubjectType =
    document.getElementById("newSubjectType");

const newSubjectLanguageSlot =
    document.getElementById(
        "newSubjectLanguageSlot"
    );

const newSubjectLanguage =
    document.getElementById(
        "newSubjectLanguage"
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

const toast =
    document.getElementById("toast");


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
         * This is only a frontend gate.
         *
         * Your Firestore and Storage rules must
         * independently enforce admin access.
         */

        startCoursesListener();

        await loadAllSubjects();

    }
);


/* =========================================================
   COURSES REALTIME
========================================================= */

function startCoursesListener() {

    const coursesRef =
        collection(
            db,
            "crmCourses"
        );

    unsubscribeCourses =
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

                courses.sort(
                    sortCourses
                );

                updateSummary();

                buildClassFilter();

                renderCourses();

            },

            error => {

                console.error(
                    "Courses listener:",
                    error
                );

                showToast(
                    "Unable to load courses."
                );

            }
        );

}


/* =========================================================
   SUBJECT MASTER
========================================================= */

async function loadAllSubjects() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "hybridSubjects"
                )
            );

        allSubjects =
            snapshot.docs.map(
                item => ({
                    id: item.id,
                    ...item.data()
                })
            );

    } catch (error) {

        console.error(
            "Subject master:",
            error
        );

    }

}


/* =========================================================
   COURSE SORT
========================================================= */

function sortCourses(a, b) {

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


function timestampValue(value) {

    if (!value) {
        return 0;
    }

    if (
        typeof value.toMillis ===
        "function"
    ) {

        return value.toMillis();

    }

    if (value.seconds) {

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

    document.getElementById(
        "totalCourses"
    ).textContent =
        courses.length;


    document.getElementById(
        "activeCourses"
    ).textContent =
        courses.filter(
            course =>
                course.crmActive === true
        ).length;


    document.getElementById(
        "freeCourses"
    ).textContent =
        courses.filter(
            course =>
                getCourseType(course) ===
                "FREE"
        ).length;


    document.getElementById(
        "paidCourses"
    ).textContent =
        courses.filter(
            course =>
                getCourseType(course) ===
                "PAID"
        ).length;

}


/* =========================================================
   CLASS FILTER
========================================================= */

function buildClassFilter() {

    const current =
        classFilter.value ||
        "ALL";

    const classes = [
        ...new Set(
            courses
                .map(
                    course =>
                        course.crmClass
                )
                .filter(Boolean)
        )
    ].sort(
        compareClasses
    );

    classFilter.innerHTML =
        `<option value="ALL">
            All Classes
        </option>`;

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
        classes.includes(current)
    ) {

        classFilter.value =
            current;

    }

}


function compareClasses(a, b) {

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

                    ...getCourseMediums(course)

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
                    classValue !== "ALL" &&
                    course.crmClass !==
                    classValue
                ) {

                    return false;

                }


                if (
                    statusValue ===
                    "ACTIVE" &&
                    course.crmActive !== true
                ) {

                    return false;

                }


                if (
                    statusValue ===
                    "INACTIVE" &&
                    course.crmActive === true
                ) {

                    return false;

                }


                return true;

            }
        );


    courseTableBody.innerHTML = "";


    if (!filtered.length) {

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

function createCourseRow(course) {

    const row =
        document.createElement(
            "tr"
        );

    const image =
        safeUrl(
            course.crmImageUrl
        );

    const courseMediums =
        getCourseMediums(course);

    const languages =
        getLanguageSummary(
            course
        );

    const type =
        getCourseType(course);

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
                    courseMediums.length
                    ?
                    courseMediums
                        .map(
                            medium => `
                            <span class="medium-pill">
                                ${escapeHtml(
                                    medium
                                )}
                            </span>
                            `
                        )
                        .join("")
                    :
                    "-"
                }

            </div>

        </td>


        <td>

            <div class="language-stack">

                ${
                    languages.length
                    ?
                    languages
                        .map(
                            language => `
                            <span class="language-pill">
                                ${escapeHtml(
                                    language
                                )}
                            </span>
                            `
                        )
                        .join("")
                    :
                    `<span style="color:#999;font-size:10px">
                        None
                    </span>`
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
                course.priority ?? 999
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
                    data-action="content"
                    title="Course content"
                >
                    Content
                </button>

                <button
                    class="icon-btn"
                    data-action="edit"
                    title="Edit course"
                >
                    Edit
                </button>

                <button
                    class="icon-btn"
                    data-action="toggle"
                    title="Toggle status"
                >
                    ${
                        course.crmActive
                        ? "Off"
                        : "On"
                    }
                </button>

                <button
                    class="icon-btn"
                    data-action="delete"
                    title="Delete course"
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
                            "content"
                        ) {

                            openContentModal(
                                course
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
    ).value = "";


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

    resetLanguageConfig();

    renderMediums();

    renderSubjects();

    renderLanguageConfig();


    document.querySelector(
        'input[name="courseType"][value="FREE"]'
    ).checked = true;


    paidFields.classList.add(
        "hidden"
    );


    courseImageUrl.value = "";

    courseImageFile.value = "";

    selectedImageSource = "url";

    imagePreview.innerHTML =
        "<span>No image</span>";


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


    updateFinalPrice();

}


/* =========================================================
   EDIT COURSE
========================================================= */

function openEditCourse(course) {

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
        getCourseMediums(course);


    subjects =
        Array.isArray(
            course.subjects
        )
        ?
        JSON.parse(
            JSON.stringify(
                course.subjects
            )
        )
        :
        [];


    languageConfig =
        normalizeLanguageConfig(
            course.languageConfig
        );


    renderMediums();

    renderSubjects();

    renderLanguageConfig();


    const type =
        getCourseType(course);


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


    if (type === "PAID") {

        paidFields.classList.remove(
            "hidden"
        );

    } else {

        paidFields.classList.add(
            "hidden"
        );

    }


    coursePrice.value =
        course.crmPrice ??
        0;


    courseDiscount.value =
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
            course.crmActive !== false
        );


    courseImageUrl.value =
        course.crmImageUrl ||
        "";


    if (course.crmImageUrl) {

        showImagePreview(
            course.crmImageUrl
        );

    } else {

        imagePreview.innerHTML =
            "<span>No image</span>";

    }


    updateFinalPrice();


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
                "Medium is compulsory."
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
            ?
            numberValue(
                coursePrice.value
            )
            :
            0;


        const discount =
            type === "PAID"
            ?
            numberValue(
                courseDiscount.value
            )
            :
            0;


        const final =
            Math.max(
                0,
                price - discount
            );


        let imageUrl =
            courseImageUrl.value
                .trim();


        try {

            setButtonLoading(
                "saveCourseBtn",
                true
            );


            /*
             * Optional image upload.
             *
             * If Storage CORS is not configured,
             * URL mode can still be used.
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


                const safeName =
                    createSafeFileName(
                        file.name
                    );


                const storagePath =
                    `crm/courses/${Date.now()}_${safeName}`;


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


            /*
             * IMPORTANT:
             *
             * crmMedium remains.
             *
             * mediums[] is the new canonical
             * multi-medium field.
             */

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
                 * NEW
                 */

                mediums:
                    [...mediums],


                /*
                 * OLD FIELD PRESERVED
                 */

                crmMedium:
                    mediums.join(", "),


                /*
                 * Course subject configuration
                 */

                subjects:
                    [...subjects],


                /*
                 * NEW LANGUAGE CONFIGURATION
                 */

                languageConfig:
                    JSON.parse(
                        JSON.stringify(
                            languageConfig
                        )
                    ),


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


            if (editingId) {

                await updateDoc(
                    doc(
                        db,
                        "crmCourses",
                        editingId
                    ),
                    data
                );


                /*
                 * Make sure associated subjects
                 * have the CRM course relationship.
                 */

                await syncCourseSubjects(
                    editingId,
                    subjects
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


                await syncCourseSubjects(
                    created.id,
                    subjects
                );


                showToast(
                    "Course created successfully."
                );

            }


            closeCourseModal();


        } catch (error) {

            console.error(
                "Course save error:",
                error
            );


            showToast(
                error.message ||
                "Unable to save course."
            );

        } finally {

            setButtonLoading(
                "saveCourseBtn",
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


    if (exists) {

        showToast(
            "Medium already added."
        );

        return;

    }


    mediums.push(
        value
    );


    newMedium.value = "";

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

    mediumList.innerHTML = "";

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
   LANGUAGE CONFIG
========================================================= */

function resetLanguageConfig() {

    languageConfig = {

        firstLanguage: {
            enabled: false,
            required: false,
            options: []
        },

        secondLanguage: {
            enabled: false,
            required: false,
            options: []
        },

        thirdLanguage: {
            enabled: false,
            required: false,
            options: []
        }

    };

}


function normalizeLanguageConfig(config) {

    const source =
        config || {};

    return {

        firstLanguage: {

            enabled:
                Boolean(
                    source.firstLanguage?.enabled
                ),

            required:
                Boolean(
                    source.firstLanguage?.required
                ),

            options:
                Array.isArray(
                    source.firstLanguage?.options
                )
                ?
                [...source.firstLanguage.options]
                :
                []

        },


        secondLanguage: {

            enabled:
                Boolean(
                    source.secondLanguage?.enabled
                ),

            required:
                Boolean(
                    source.secondLanguage?.required
                ),

            options:
                Array.isArray(
                    source.secondLanguage?.options
                )
                ?
                [...source.secondLanguage.options]
                :
                []

        },


        thirdLanguage: {

            enabled:
                Boolean(
                    source.thirdLanguage?.enabled
                ),

            required:
                Boolean(
                    source.thirdLanguage?.required
                ),

            options:
                Array.isArray(
                    source.thirdLanguage?.options
                )
                ?
                [...source.thirdLanguage.options]
                :
                []

        }

    };

}


function renderLanguageConfig() {

    renderLanguageSlot(
        "FIRST",
        languageConfig.firstLanguage
    );

    renderLanguageSlot(
        "SECOND",
        languageConfig.secondLanguage
    );

    renderLanguageSlot(
        "THIRD",
        languageConfig.thirdLanguage
    );

}


function renderLanguageSlot(
    slot,
    config
) {

    const lower =
        slot.toLowerCase();


    const enabled =
        document.getElementById(
            `${lower}LanguageEnabled`
        );


    const required =
        document.getElementById(
            `${lower}LanguageRequired`
        );


    const optionsBox =
        document.getElementById(
            `${lower}LanguageOptions`
        );


    const list =
        document.getElementById(
            `${lower}LanguageList`
        );


    enabled.checked =
        Boolean(
            config.enabled
        );


    required.checked =
        Boolean(
            config.required
        );


    optionsBox.classList.toggle(
        "hidden",
        !config.enabled
    );


    list.innerHTML = "";


    config.options.forEach(
        (language, index) => {

            const chip =
                document.createElement(
                    "div"
                );

            chip.className =
                "language-editor-chip";


            chip.innerHTML = `

                <span>
                    ${escapeHtml(
                        language
                    )}
                </span>

                <button
                    type="button"
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

                        config.options.splice(
                            index,
                            1
                        );

                        renderLanguageConfig();

                    }
                );


            list.appendChild(
                chip
            );

        }
    );

}


/* LANGUAGE TOGGLES */

[
    ["FIRST", "firstLanguage"],
    ["SECOND", "secondLanguage"],
    ["THIRD", "thirdLanguage"]
].forEach(
    ([slot, key]) => {

        const lower =
            slot.toLowerCase();


        document
            .getElementById(
                `${lower}LanguageEnabled`
            )
            .addEventListener(
                "change",
                event => {

                    languageConfig[
                        key
                    ].enabled =
                        event.target.checked;


                    if (
                        !event.target.checked
                    ) {

                        languageConfig[
                            key
                        ].required =
                            false;

                    }


                    renderLanguageConfig();

                }
            );


        document
            .getElementById(
                `${lower}LanguageRequired`
            )
            .addEventListener(
                "change",
                event => {

                    languageConfig[
                        key
                    ].required =
                        event.target.checked;

                }
            );

    }
);


/* ADD LANGUAGE */

document
    .querySelectorAll(
        "[data-language-add]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    addLanguage(
                        button.dataset.languageAdd
                    );

                }
            );

        }
    );


[
    ["FIRST", "firstLanguage"],
    ["SECOND", "secondLanguage"],
    ["THIRD", "thirdLanguage"]
].forEach(
    ([slot, key]) => {

        const input =
            document.getElementById(
                `${slot.toLowerCase()}LanguageInput`
            );


        input.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                    "Enter"
                ) {

                    event.preventDefault();

                    addLanguage(
                        slot
                    );

                }

            }
        );

    }
);


function addLanguage(slot) {

    const lower =
        slot.toLowerCase();


    const input =
        document.getElementById(
            `${lower}LanguageInput`
        );


    const value =
        input.value.trim();


    if (!value) {
        return;
    }


    const key =
        slot === "FIRST"
        ?
        "firstLanguage"
        :
        slot === "SECOND"
        ?
        "secondLanguage"
        :
        "thirdLanguage";


    const exists =
        languageConfig[key]
            .options
            .some(
                language =>
                    language.toLowerCase() ===
                    value.toLowerCase()
            );


    if (exists) {

        showToast(
            "Language already added."
        );

        return;

    }


    languageConfig[key]
        .enabled = true;


    languageConfig[key]
        .options
        .push(value);


    input.value = "";

    renderLanguageConfig();

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

    const name =
        newSubject.value.trim();


    if (!name) {

        showToast(
            "Enter subject name."
        );

        return;

    }


    const type =
        newSubjectType.value;


    const languageSlot =
        type === "LANGUAGE"
        ?
        newSubjectLanguageSlot.value
        :
        "";


    const language =
        type === "LANGUAGE"
        ?
        newSubjectLanguage.value.trim()
        :
        "";


    if (
        type === "LANGUAGE" &&
        !languageSlot
    ) {

        showToast(
            "Select language slot."
        );

        return;

    }


    const subject = {

        id:
            `new_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 7)}`,

        name,

        subjectType:
            type,

        languageSlot,

        language,

        priority:
            subjects.length + 1,

        active:
            true

    };


    subjects.push(
        subject
    );


    newSubject.value = "";

    newSubjectLanguage.value = "";

    renderSubjects();

}


function renderSubjects() {

    subjectList.innerHTML = "";


    if (!subjects.length) {

        subjectList.innerHTML = `
            <div style="
                color:#999;
                font-size:11px;
                padding:8px 0;
            ">
                No subjects added yet.
            </div>
        `;

        return;

    }


    subjects.forEach(
        (subject, index) => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "subject-row";


            const languageInfo =
                subject.subjectType ===
                "LANGUAGE"
                ?
                `${slotLabel(
                    subject.languageSlot
                )}${subject.language
                    ? ` • ${subject.language}`
                    : ""
                }`
                :
                "Common subject";


            row.innerHTML = `

                <div class="subject-main">

                    <div class="subject-title">
                        ${escapeHtml(
                            subject.name
                        )}
                    </div>

                    <div class="subject-meta">

                        <span class="subject-tag">
                            ${escapeHtml(
                                subject.subjectType
                            )}
                        </span>

                        <span class="subject-tag">
                            ${escapeHtml(
                                languageInfo
                            )}
                        </span>

                    </div>

                </div>


                <button
                    type="button"
                    class="subject-delete"
                >
                    ×
                </button>

            `;


            row
                .querySelector(
                    ".subject-delete"
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
   SYNC SUBJECTS TO HYBRID SUBJECT MASTER
========================================================= */

async function syncCourseSubjects(
    courseId,
    courseSubjects
) {

    if (!Array.isArray(courseSubjects)) {
        return;
    }


    for (
        const subject of courseSubjects
    ) {

        /*
         * Existing subject:
         *
         * Keep its ID so existing
         * hybridChapters.subjectId
         * remains valid.
         */

        if (
            subject.id &&
            !subject.id.startsWith(
                "new_"
            )
        ) {

            try {

                await updateDoc(
                    doc(
                        db,
                        "hybridSubjects",
                        subject.id
                    ),
                    {

                        crmCourseId:
                            courseId,

                        courseId:
                            courseId,

                        subjectType:
                            subject.subjectType ||
                            "COMMON",

                        languageSlot:
                            subject.languageSlot ||
                            "",

                        language:
                            subject.language ||
                            "",

                        priority:
                            subject.priority ??
                            1,

                        updatedAt:
                            serverTimestamp(),

                        updatedBy:
                            currentUser.uid

                    }
                );

            } catch (error) {

                console.warn(
                    "Existing subject sync failed:",
                    error
                );

            }

            continue;

        }


        /*
         * New subject.
         *
         * Create it in the EXISTING
         * hybridSubjects collection.
         */

        try {

            const newSubjectRef =
                await addDoc(
                    collection(
                        db,
                        "hybridSubjects"
                    ),
                    {

                        name:
                            subject.name,

                        description:
                            "",

                        medium:
                            getLegacySubjectMedium(),

                        mediums:
                            [...mediums],

                        crmCourseId:
                            courseId,

                        courseId:
                            courseId,

                        subjectType:
                            subject.subjectType ||
                            "COMMON",

                        languageSlot:
                            subject.languageSlot ||
                            "",

                        language:
                            subject.language ||
                            "",

                        priority:
                            subject.priority ??
                            1,

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


            subject.id =
                newSubjectRef.id;


        } catch (error) {

            console.error(
                "New subject creation:",
                error
            );

            throw error;

        }

    }

}


/*
 * Old student code understands:
 *
 * Kannada
 * English
 * Both
 *
 * For a new arbitrary medium,
 * keep the first medium in the
 * legacy scalar field while the
 * new `mediums[]` contains all.
 */

function getLegacySubjectMedium() {

    if (mediums.length === 1) {

        return mediums[0];

    }


    const lower =
        mediums.map(
            item =>
                item.toLowerCase()
        );


    if (
        lower.includes("english") &&
        lower.includes("kannada")
    ) {

        return "Both";

    }


    return mediums[0] || "Kannada";

}


/* =========================================================
   COURSE CONTENT MODAL
========================================================= */

function openContentModal(course) {

    selectedCourseForContent =
        course;

    selectedSubjectForContent =
        null;


    document.getElementById(
        "contentCourseName"
    ).textContent =
        course.crmCourseName ||
        "Course";


    document.getElementById(
        "contentCourseMeta"
    ).textContent =
        `${displayClass(course.crmClass)} • ${
            getCourseMediums(course).join(
                ", "
            )
        }`;


    document.getElementById(
        "chaptersSection"
    ).classList.add(
        "hidden"
    );


    contentModal.classList.remove(
        "hidden"
    );


    loadCourseSubjects(
        course
    );

}


/* =========================================================
   LOAD COURSE SUBJECTS
========================================================= */

async function loadCourseSubjects(course) {

    const container =
        document.getElementById(
            "contentSubjectList"
        );


    container.innerHTML = `
        <div style="
            color:#999;
            font-size:12px;
            padding:10px;
        ">
            Loading subjects...
        </div>
    `;


    try {

        const courseSubjects =
            [];


        /*
         * First priority:
         * subjects[] stored on crmCourses.
         */

        if (
            Array.isArray(
                course.subjects
            )
        ) {

            course.subjects.forEach(
                subject => {

                    courseSubjects.push(
                        subject
                    );

                }
            );

        }


        /*
         * Then load hybridSubjects
         * linked with crmCourseId/courseId.
         */

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "hybridSubjects"
                )
            );


        const linked =
            snapshot.docs
                .map(
                    item => ({
                        id: item.id,
                        ...item.data()
                    })
                )
                .filter(
                    subject =>
                        subject.crmCourseId ===
                            course.id ||
                        subject.courseId ===
                            course.id
                );


        linked.forEach(
            subject => {

                const exists =
                    courseSubjects.some(
                        item =>
                            item.id ===
                            subject.id
                    );


                if (!exists) {

                    courseSubjects.push({

                        id:
                            subject.id,

                        name:
                            subject.name ||
                            subject.title ||
                            "Subject",

                        subjectType:
                            subject.subjectType ||
                            "COMMON",

                        languageSlot:
                            subject.languageSlot ||
                            "",

                        language:
                            subject.language ||
                            "",

                        priority:
                            subject.priority ??
                            999,

                        active:
                            subject.active !==
                            false

                    });

                }

            }
        );


        courseSubjects.sort(
            (a, b) =>
                Number(
                    a.priority ??
                    999
                ) -
                Number(
                    b.priority ??
                    999
                )
        );


        renderContentSubjects(
            courseSubjects
        );


    } catch (error) {

        console.error(
            error
        );

        container.innerHTML = `
            <div style="
                color:#b42318;
                font-size:12px;
                padding:10px;
            ">
                Unable to load subjects.
            </div>
        `;

    }

}


function renderContentSubjects(
    courseSubjects
) {

    const container =
        document.getElementById(
            "contentSubjectList"
        );


    container.innerHTML = "";


    if (!courseSubjects.length) {

        container.innerHTML = `
            <div style="
                color:#999;
                font-size:12px;
                padding:10px;
            ">
                No subjects linked to this course.
                Edit the course and add subjects first.
            </div>
        `;

        return;

    }


    courseSubjects.forEach(
        subject => {

            const card =
                document.createElement(
                    "button"
                );

            card.type = "button";

            card.className =
                "content-subject-card";


            card.innerHTML = `

                <strong>
                    ${escapeHtml(
                        subject.name ||
                        "Subject"
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        subject.subjectType ||
                        "COMMON"
                    )}

                    ${
                        subject.language
                        ?
                        ` • ${escapeHtml(
                            subject.language
                        )}`
                        :
                        ""
                    }
                </span>

            `;


            card.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".content-subject-card"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );


                    card.classList.add(
                        "active"
                    );


                    selectedSubjectForContent =
                        subject;


                    document.getElementById(
                        "selectedSubjectName"
                    ).textContent =
                        subject.name ||
                        "Chapters";


                    document
                        .getElementById(
                            "chaptersSection"
                        )
                        .classList.remove(
                            "hidden"
                        );


                    loadChapters(
                        subject
                    );

                }
            );


            container.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   LOAD CHAPTERS
========================================================= */

async function loadChapters(subject) {

    const list =
        document.getElementById(
            "chapterList"
        );


    list.innerHTML = `
        <div style="
            color:#999;
            font-size:12px;
            padding:10px;
        ">
            Loading chapters...
        </div>
    `;


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "hybridChapters"
                )
            );


        allChapters =
            snapshot.docs
                .map(
                    item => ({
                        id: item.id,
                        ...item.data()
                    })
                )
                .filter(
                    chapter =>
                        chapter.subjectId ===
                        subject.id
                )
                .sort(
                    (a, b) =>
                        Number(
                            a.priority ??
                            a.chapterNumber ??
                            999
                        ) -
                        Number(
                            b.priority ??
                            b.chapterNumber ??
                            999
                        )
                );


        renderChapters(
            allChapters
        );


    } catch (error) {

        console.error(
            error
        );

        list.innerHTML = `
            <div style="
                color:#b42318;
                font-size:12px;
                padding:10px;
            ">
                Unable to load chapters.
            </div>
        `;

    }

}


/* =========================================================
   CHAPTER RENDER
========================================================= */

function renderChapters(
    chapters
) {

    const list =
        document.getElementById(
            "chapterList"
        );


    list.innerHTML = "";


    if (!chapters.length) {

        list.innerHTML = `
            <div style="
                color:#999;
                font-size:12px;
                padding:10px;
            ">
                No chapters yet. Add your first chapter.
            </div>
        `;

        return;

    }


    chapters.forEach(
        chapter => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "chapter-card";


            const videoUrl =
                getVideoUrl(
                    chapter
                );

            const pdfUrl =
                getPdfUrl(
                    chapter
                );


            const thumbnail =
                getChapterThumbnail(
                    chapter
                );


            card.innerHTML = `

                <div class="chapter-number">
                    ${escapeHtml(
                        chapter.chapterNumber ??
                        "-"
                    )}
                </div>


                ${
                    thumbnail
                    ?
                    `
                    <img
                        src="${thumbnail}"
                        style="
                            width:90px;
                            height:55px;
                            border-radius:7px;
                            object-fit:cover;
                            flex:0 0 auto;
                        "
                        alt=""
                    >
                    `
                    :
                    ""
                }


                <div class="chapter-info">

                    <div class="chapter-title">
                        ${escapeHtml(
                            chapter.title ||
                            chapter.name ||
                            "Untitled chapter"
                        )}
                    </div>


                    <div class="chapter-meta">

                        <span class="content-badge">
                            Priority:
                            ${Number(
                                chapter.priority ??
                                999
                            )}
                        </span>


                        <span class="content-badge ${
                            videoUrl
                            ? "available"
                            : ""
                        }">
                            ${
                                videoUrl
                                ? "Video"
                                : "No Video"
                            }
                        </span>


                        <span class="content-badge ${
                            pdfUrl
                            ? "available"
                            : ""
                        }">
                            ${
                                pdfUrl
                                ? "Notes / PDF"
                                : "No PDF"
                            }
                        </span>


                        <span class="content-badge">
                            ${
                                chapter.active === false
                                ? "Inactive"
                                : "Active"
                            }
                        </span>

                    </div>

                </div>


                <div class="chapter-actions">

                    <button
                        data-chapter-action="video"
                    >
                        ${
                            videoUrl
                            ? "Edit Video"
                            : "+ Video"
                        }
                    </button>


                    <button
                        data-chapter-action="pdf"
                    >
                        ${
                            pdfUrl
                            ? "Edit PDF"
                            : "+ PDF"
                        }
                    </button>


                    <button
                        data-chapter-action="edit"
                    >
                        Edit
                    </button>

                </div>

            `;


            card
                .querySelectorAll(
                    "[data-chapter-action]"
                )
                .forEach(
                    button => {

                        button.addEventListener(
                            "click",
                            () => {

                                const action =
                                    button.dataset
                                        .chapterAction;


                                openContentEdit(
                                    action ===
                                    "edit"
                                    ?
                                    "chapter"
                                    :
                                    action,
                                    chapter
                                );

                            }
                        );

                    }
                );


            list.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   CONTENT EDIT
========================================================= */

function openContentEdit(
    type,
    chapter = null
) {

    document.getElementById(
        "contentEditType"
    ).value =
        type;


    document.getElementById(
        "contentEditChapterId"
    ).value =
        chapter?.id ||
        "";


    document.getElementById(
        "contentEditTitle"
    ).textContent =
        type === "video"
        ?
        "Add Video"
        :
        type === "pdf"
        ?
        "Add Notes / PDF"
        :
        chapter
        ?
        "Edit Chapter"
        :
        "Add Chapter";


    document.getElementById(
        "contentEditLabel"
    ).textContent =
        type === "video"
        ?
        "VIDEO"
        :
        type === "pdf"
        ?
        "NOTES / PDF"
        :
        "CHAPTER";


    buildContentSubjectOptions();


    const subjectId =
        chapter?.subjectId ||
        selectedSubjectForContent?.id ||
        "";


    document.getElementById(
        "contentEditSubject"
    ).value =
        subjectId;


    buildContentChapterOptions(
        subjectId,
        chapter?.id || ""
    );


    document.getElementById(
        "contentChapterNumber"
    ).value =
        chapter?.chapterNumber ??
        getNextChapterNumber();


    document.getElementById(
        "contentChapterPriority"
    ).value =
        chapter?.priority ??
        getNextChapterNumber();


    document.getElementById(
        "contentChapterTitle"
    ).value =
        chapter?.title ||
        chapter?.name ||
        "";


    document.getElementById(
        "contentDescription"
    ).value =
        chapter?.description ||
        "";


    document.getElementById(
        "contentActive"
    ).checked =
        chapter?.active !== false;


    document.getElementById(
        "contentVideoUrl"
    ).value =
        getVideoUrl(
            chapter || {}
        );


    document.getElementById(
        "contentThumbnailUrl"
    ).value =
        chapter?.thumbnailUrl ||
        "";


    document.getElementById(
        "contentPdfUrl"
    ).value =
        getPdfUrl(
            chapter || {}
        );


    document.getElementById(
        "contentPdfName"
    ).value =
        chapter?.pdfName ||
        chapter?.notesName ||
        "";


    document.getElementById(
        "contentPdfFile"
    ).value = "";


    document
        .getElementById(
            "videoContentFields"
        )
        .classList.toggle(
            "hidden",
            type !== "video"
        );


    document
        .getElementById(
            "pdfContentFields"
        )
        .classList.toggle(
            "hidden",
            type !== "pdf"
        );


    if (
        type === "video"
    ) {

        updateVideoPreview();

    }


    contentEditModal.classList.remove(
        "hidden"
    );

}


/* =========================================================
   CONTENT SUBJECT OPTIONS
========================================================= */

function buildContentSubjectOptions() {

    const select =
        document.getElementById(
            "contentEditSubject"
        );


    select.innerHTML = "";


    const courseSubjects =
        getCurrentCourseSubjects();


    courseSubjects.forEach(
        subject => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                subject.id;

            option.textContent =
                subject.name ||
                "Subject";

            select.appendChild(
                option
            );

        }
    );

}


function getCurrentCourseSubjects() {

    const result = [];


    if (
        Array.isArray(
            selectedCourseForContent?.subjects
        )
    ) {

        result.push(
            ...selectedCourseForContent.subjects
        );

    }


    allSubjects
        .filter(
            subject =>
                subject.crmCourseId ===
                    selectedCourseForContent?.id ||
                subject.courseId ===
                    selectedCourseForContent?.id
        )
        .forEach(
            subject => {

                if (
                    !result.some(
                        item =>
                            item.id ===
                            subject.id
                    )
                ) {

                    result.push({

                        id:
                            subject.id,

                        name:
                            subject.name,

                        subjectType:
                            subject.subjectType ||
                            "COMMON"

                    });

                }

            }
        );


    return result;

}


/* =========================================================
   CHAPTER OPTIONS
========================================================= */

async function buildContentChapterOptions(
    subjectId,
    selectedChapterId = ""
) {

    const select =
        document.getElementById(
            "contentEditChapter"
        );


    select.innerHTML = `
        <option value="">
            Create new chapter
        </option>
    `;


    if (!subjectId) {
        return;
    }


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "hybridChapters"
                )
            );


        const chapters =
            snapshot.docs
                .map(
                    item => ({
                        id: item.id,
                        ...item.data()
                    })
                )
                .filter(
                    chapter =>
                        chapter.subjectId ===
                        subjectId
                )
                .sort(
                    (a, b) =>
                        Number(
                            a.chapterNumber ??
                            999
                        ) -
                        Number(
                            b.chapterNumber ??
                            999
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
                    `${chapter.chapterNumber ?? "-"} — ${
                        chapter.title ||
                        chapter.name ||
                        "Untitled"
                    }`;

                select.appendChild(
                    option
                );

            }
        );


        select.value =
            selectedChapterId ||
            "";

    } catch (error) {

        console.error(
            error
        );

    }

}


/* =========================================================
   CHAPTER SELECT
========================================================= */

document
    .getElementById(
        "contentEditSubject"
    )
    .addEventListener(
        "change",
        event => {

            buildContentChapterOptions(
                event.target.value
            );

        }
    );


document
    .getElementById(
        "contentEditChapter"
    )
    .addEventListener(
        "change",
        async event => {

            const id =
                event.target.value;


            if (!id) {
                return;
            }


            const snapshot =
                await getDoc(
                    doc(
                        db,
                        "hybridChapters",
                        id
                    )
                );


            if (
                !snapshot.exists()
            ) {

                return;

            }


            const chapter = {

                id,

                ...snapshot.data()

            };


            document.getElementById(
                "contentChapterNumber"
            ).value =
                chapter.chapterNumber ??
                1;


            document.getElementById(
                "contentChapterPriority"
            ).value =
                chapter.priority ??
                1;


            document.getElementById(
                "contentChapterTitle"
            ).value =
                chapter.title ||
                chapter.name ||
                "";


            document.getElementById(
                "contentDescription"
            ).value =
                chapter.description ||
                "";


            document.getElementById(
                "contentActive"
            ).checked =
                chapter.active !== false;


            document.getElementById(
                "contentVideoUrl"
            ).value =
                getVideoUrl(
                    chapter
                );


            document.getElementById(
                "contentThumbnailUrl"
            ).value =
                chapter.thumbnailUrl ||
                "";


            document.getElementById(
                "contentPdfUrl"
            ).value =
                getPdfUrl(
                    chapter
                );


            document.getElementById(
                "contentPdfName"
            ).value =
                chapter.pdfName ||
                chapter.notesName ||
                "";


            updateVideoPreview();

        }
    );


/* =========================================================
   ADD CONTENT BUTTONS
========================================================= */

document
    .getElementById(
        "addChapterBtn"
    )
    .addEventListener(
        "click",
        () => {

            openContentEdit(
                "chapter"
            );

        }
    );


document
    .getElementById(
        "addVideoBtn"
    )
    .addEventListener(
        "click",
        () => {

            openContentEdit(
                "video"
            );

        }
    );


document
    .getElementById(
        "addPdfBtn"
    )
    .addEventListener(
        "click",
        () => {

            openContentEdit(
                "pdf"
            );

        }
    );


/* =========================================================
   SAVE CONTENT
========================================================= */

contentEditForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (
            !selectedCourseForContent
        ) {

            showToast(
                "Course not selected."
            );

            return;

        }


        const type =
            document.getElementById(
                "contentEditType"
            ).value;


        const existingId =
            document.getElementById(
                "contentEditChapterId"
            ).value;


        const selectedExistingId =
            document.getElementById(
                "contentEditChapter"
            ).value;


        const chapterId =
            existingId ||
            selectedExistingId;


        const subjectId =
            document.getElementById(
                "contentEditSubject"
            ).value;


        const title =
            document.getElementById(
                "contentChapterTitle"
            ).value.trim();


        if (!subjectId) {

            showToast(
                "Select a subject."
            );

            return;

        }


        if (!title) {

            showToast(
                "Enter chapter title."
            );

            return;

        }


        try {

            const baseData = {

                subjectId,

                courseId:
                    selectedCourseForContent.id,

                crmCourseId:
                    selectedCourseForContent.id,

                chapterNumber:
                    numberValue(
                        document.getElementById(
                            "contentChapterNumber"
                        ).value
                    ) || 1,

                title,

                description:
                    document.getElementById(
                        "contentDescription"
                    ).value.trim(),

                priority:
                    numberValue(
                        document.getElementById(
                            "contentChapterPriority"
                        ).value
                    ) || 1,

                active:
                    document.getElementById(
                        "contentActive"
                    ).checked,

                updatedAt:
                    serverTimestamp(),

                updatedBy:
                    currentUser.uid

            };


            /*
             * VIDEO
             */

            if (
                type === "video"
            ) {

                const videoUrl =
                    document.getElementById(
                        "contentVideoUrl"
                    ).value.trim();


                if (!videoUrl) {

                    showToast(
                        "Enter video URL."
                    );

                    return;

                }


                baseData.videoUrl =
                    videoUrl;


                /*
                 * Preserve / add YouTube URL.
                 */

                if (
                    extractYouTubeId(
                        videoUrl
                    )
                ) {

                    baseData.youtubeUrl =
                        videoUrl;

                }


                let thumbnail =
                    document.getElementById(
                        "contentThumbnailUrl"
                    ).value.trim();


                if (!thumbnail) {

                    thumbnail =
                        getYouTubeThumbnail(
                            videoUrl
                        );

                }


                if (thumbnail) {

                    baseData.thumbnailUrl =
                        thumbnail;

                }

            }


            /*
             * PDF
             */

            if (
                type === "pdf"
            ) {

                let pdfUrl =
                    document.getElementById(
                        "contentPdfUrl"
                    ).value.trim();


                const pdfFile =
                    document.getElementById(
                        "contentPdfFile"
                    ).files[0];


                /*
                 * Upload if selected.
                 */

                if (
                    selectedPdfSource ===
                    "upload" &&
                    pdfFile
                ) {

                    if (
                        pdfFile.type !==
                        "application/pdf"
                    ) {

                        showToast(
                            "Please select a PDF."
                        );

                        return;

                    }


                    const safeName =
                        createSafeFileName(
                            pdfFile.name
                        );


                    const storagePath =
                        `crm/course-content/${selectedCourseForContent.id}/${subjectId}/${Date.now()}_${safeName}`;


                    const storageRef =
                        ref(
                            storage,
                            storagePath
                        );


                    await uploadBytes(
                        storageRef,
                        pdfFile
                    );


                    pdfUrl =
                        await getDownloadURL(
                            storageRef
                        );

                }


                if (!pdfUrl) {

                    showToast(
                        "Enter PDF URL or upload a PDF."
                    );

                    return;

                }


                baseData.pdfUrl =
                    pdfUrl;


                baseData.pdfName =
                    document.getElementById(
                        "contentPdfName"
                    ).value.trim() ||
                    "Notes / PDF";

            }


            /*
             * CHAPTER CREATE / UPDATE
             */

            if (chapterId) {

                await updateDoc(
                    doc(
                        db,
                        "hybridChapters",
                        chapterId
                    ),
                    baseData
                );


                showToast(
                    "Content updated."
                );

            } else {

                baseData.createdAt =
                    serverTimestamp();

                baseData.createdBy =
                    currentUser.uid;


                await addDoc(
                    collection(
                        db,
                        "hybridChapters"
                    ),
                    baseData
                );


                showToast(
                    "Content added."
                );

            }


            closeContentEditModal();

            await loadChapters(
                selectedSubjectForContent
            );


        } catch (error) {

            console.error(
                "Content save:",
                error
            );


            showToast(
                error.message ||
                "Unable to save content."
            );

        }

    }
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
                        button.dataset.pdfSource;


                    document
                        .querySelectorAll(
                            ".pdf-source-btn"
                        )
                        .forEach(
                            item =>
                                item.classList.toggle(
                                    "active",
                                    item ===
                                    button
                                )
                        );


                    document
                        .getElementById(
                            "pdfUrlBox"
                        )
                        .classList.toggle(
                            "hidden",
                            selectedPdfSource !==
                            "url"
                        );


                    document
                        .getElementById(
                            "pdfUploadBox"
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
   VIDEO PREVIEW
========================================================= */

document
    .getElementById(
        "contentVideoUrl"
    )
    .addEventListener(
        "input",
        updateVideoPreview
    );


document
    .getElementById(
        "contentThumbnailUrl"
    )
    .addEventListener(
        "input",
        updateVideoPreview
    );


function updateVideoPreview() {

    const url =
        document.getElementById(
            "contentVideoUrl"
        ).value.trim();


    let thumbnail =
        document.getElementById(
            "contentThumbnailUrl"
        ).value.trim();


    if (!thumbnail) {

        thumbnail =
            getYouTubeThumbnail(
                url
            );

    }


    const img =
        document.getElementById(
            "videoThumbnailPreview"
        );


    const box =
        document.querySelector(
            ".video-preview-box"
        );


    if (thumbnail) {

        img.src =
            thumbnail;

        box.classList.add(
            "has-image"
        );

    } else {

        img.removeAttribute(
            "src"
        );

        box.classList.remove(
            "has-image"
        );

    }

}


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
                            item =>
                                item.classList.toggle(
                                    "active",
                                    item ===
                                    button
                                )
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
            courseImageUrl.value.trim()
        ) {

            showImagePreview(
                courseImageUrl.value.trim()
            );

        }

    }
);


courseImageFile.addEventListener(
    "change",
    () => {

        const file =
            courseImageFile.files[0];


        if (!file) {
            return;
        }


        const reader =
            new FileReader();


        reader.onload =
            event => {

                showImagePreview(
                    event.target.result
                );

            };


        reader.readAsDataURL(
            file
        );

    }
);


function showImagePreview(
    url
) {

    imagePreview.innerHTML = `
        <img
            src="${safeUrl(url)}"
            alt=""
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

                    const type =
                        document.querySelector(
                            'input[name="courseType"]:checked'
                        ).value;


                    paidFields.classList.toggle(
                        "hidden",
                        type !==
                        "PAID"
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
   TOGGLE / DELETE COURSE
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
                    !course.crmActive,

                updatedAt:
                    serverTimestamp(),

                updatedBy:
                    currentUser.uid

            }
        );


        showToast(
            course.crmActive
            ?
            "Course deactivated."
            :
            "Course activated."
        );


    } catch (error) {

        console.error(
            error
        );

        showToast(
            "Unable to change course status."
        );

    }

}


async function deleteCourse(
    course
) {

    const confirmed =
        confirm(
            `Delete "${course.crmCourseName}"?\n\nThis will remove the course from CRM. Existing content documents are not automatically deleted.`
        );


    if (!confirmed) {
        return;
    }


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


    } catch (error) {

        console.error(
            error
        );

        showToast(
            "Unable to delete course."
        );

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
        "closeContentModal"
    )
    .addEventListener(
        "click",
        closeContentModal
    );


document
    .getElementById(
        "closeContentEditModal"
    )
    .addEventListener(
        "click",
        closeContentEditModal
    );


document
    .getElementById(
        "cancelContentEditBtn"
    )
    .addEventListener(
        "click",
        closeContentEditModal
    );


function closeCourseModal() {

    courseModal.classList.add(
        "hidden"
    );

}


function closeContentModal() {

    contentModal.classList.add(
        "hidden"
    );

}


function closeContentEditModal() {

    contentEditModal.classList.add(
        "hidden"
    );

}


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
   REFRESH CONTENT
========================================================= */

document
    .getElementById(
        "refreshContentBtn"
    )
    .addEventListener(
        "click",
        async () => {

            if (
                selectedCourseForContent
            ) {

                await loadCourseSubjects(
                    selectedCourseForContent
                );

            }

            if (
                selectedSubjectForContent
            ) {

                await loadChapters(
                    selectedSubjectForContent
                );

            }

        }
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
                history.length >
                1
            ) {

                history.back();

            } else {

                window.location.href =
                    "../";

            }

        }
    );


/* =========================================================
   HELPERS
========================================================= */

function getCourseMediums(course) {

    if (
        Array.isArray(
            course.mediums
        ) &&
        course.mediums.length
    ) {

        return [
            ...course.mediums
        ];

    }


    if (
        Array.isArray(
            course.crmMediums
        ) &&
        course.crmMediums.length
    ) {

        return [
            ...course.crmMediums
        ];

    }


    if (
        typeof course.crmMedium ===
        "string" &&
        course.crmMedium.trim()
    ) {

        return course.crmMedium
            .split(",")
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);

    }


    return [];

}


function getCourseType(course) {

    return String(
        course.courseType ||
        "FREE"
    ).toUpperCase();

}


function getLanguageSummary(course) {

    const config =
        normalizeLanguageConfig(
            course.languageConfig
        );


    const result = [];


    [
        ["1st", config.firstLanguage],
        ["2nd", config.secondLanguage],
        ["3rd", config.thirdLanguage]
    ].forEach(
        ([label, slot]) => {

            if (
                slot.enabled
            ) {

                result.push(
                    `${label} Language`
                );

            }

        }
    );


    return result;

}


function getVideoUrl(chapter) {

    return (
        chapter.videoUrl ||
        chapter.youtubeUrl ||
        chapter.video ||
        ""
    );

}


function getPdfUrl(chapter) {

    return (
        chapter.pdfUrl ||
        chapter.notesUrl ||
        chapter.pdf ||
        ""
    );

}


function getChapterThumbnail(
    chapter
) {

    if (
        chapter.thumbnailUrl
    ) {

        return chapter.thumbnailUrl;

    }


    return getYouTubeThumbnail(
        getVideoUrl(chapter)
    );

}


function extractYouTubeId(
    url
) {

    if (!url) {
        return "";
    }


    try {

        const parsed =
            new URL(url);


        if (
            parsed.hostname.includes(
                "youtu.be"
            )
        ) {

            return parsed.pathname
                .replace(
                    "/",
                    ""
                );

        }


        if (
            parsed.hostname.includes(
                "youtube.com"
            )
        ) {

            const queryId =
                parsed.searchParams.get(
                    "v"
                );


            if (queryId) {
                return queryId;
            }


            const parts =
                parsed.pathname
                    .split("/")
                    .filter(Boolean);


            const index =
                parts.findIndex(
                    item =>
                        item ===
                        "embed" ||
                        item ===
                        "shorts"
                );


            if (
                index !== -1 &&
                parts[index + 1]
            ) {

                return parts[index + 1];

            }

        }

    } catch {

        return "";

    }


    return "";

}


function getYouTubeThumbnail(
    url
) {

    const id =
        extractYouTubeId(
            url
        );


    if (!id) {
        return "";
    }


    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

}


function getNextChapterNumber() {

    if (!allChapters.length) {
        return 1;
    }


    return (
        Math.max(
            ...allChapters.map(
                chapter =>
                    Number(
                        chapter.chapterNumber ||
                        0
                    )
            )
        ) + 1
    );

}


function slotLabel(
    slot
) {

    if (
        slot ===
        "FIRST"
    ) {

        return "1st Language";

    }


    if (
        slot ===
        "SECOND"
    ) {

        return "2nd Language";

    }


    if (
        slot ===
        "THIRD"
    ) {

        return "3rd Language";

    }


    return "";

}


function displayClass(
    value
) {

    const labels = {

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
        labels[value] ||
        value ||
        "—"
    );

}


function formatPrice(
    value
) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(
        Number(value) || 0
    );

}


function numberValue(
    value
) {

    const number =
        Number(value);


    return Number.isFinite(
        number
    )
    ?
    number
    :
    0;

}


function safeUrl(
    value
) {

    if (!value) {
        return "";
    }


    try {

        const url =
            new URL(value);


        if (
            url.protocol ===
            "https:" ||
            url.protocol ===
            "http:"
        ) {

            return url.href;

        }

    } catch {

        return "";

    }


    return "";

}


function createSafeFileName(
    filename
) {

    return filename
        .toLowerCase()
        .replace(
            /[^a-z0-9.]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            ""
        );

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


    if (
        file.size >
        8 * 1024 * 1024
    ) {

        throw new Error(
            "Image must be below 8 MB."
        );

    }

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


function setButtonLoading(
    id,
    loading
) {

    const button =
        document.getElementById(
            id
        );


    if (!button) {
        return;
    }


    if (
        loading
    ) {

        button.dataset.originalText =
            button.textContent;

        button.disabled =
            true;

        button.textContent =
            "Saving...";

    } else {

        button.disabled =
            false;

        button.textContent =
            button.dataset.originalText ||
            "Save";

    }

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
            3000
        );

}

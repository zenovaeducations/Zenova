/* ============================================================
   ZEN2 CONTENT STUDIO

   NEW SIMPLE ZENOVA STRUCTURE

   zen2Courses
       ↓
   zen2Subjects
       ↓
   zen2Chapters
       ↓
   zen2Content

   CONTENT ACCESS:

   FREE
      ↓
   Everyone can access

   PAID
      ↓
   Visible to everyone
      ↓
   Locked for students without purchase
      ↓
   "Kindly purchase the batch to access this video / PDF."

   FILES:

   Firebase Storage

   zen2/
      courseId/
         subjectId/
            chapterId/
               contentId/
                  filename

============================================================ */


import {
    auth,
    db,
    storage
} from "../../firebase/firebase-config.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    collection,
    doc,
    addDoc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


import {
    ref,
    uploadBytesResumable,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";


/* ============================================================
   COLLECTIONS
============================================================ */

const COURSES =
    "zen2Courses";

const SUBJECTS =
    "zen2Subjects";

const CHAPTERS =
    "zen2Chapters";

const CONTENT =
    "zen2Content";
const thumbnailFile =
    courseThumbnail.files[0];

/* ============================================================
   STATE
============================================================ */

let currentUser = null;

let courses = [];

let selectedCourseId = null;

let selectedSubjectId = null;

let selectedChapterId = null;

let contentUploading = false;


/* ============================================================
   DOM
============================================================ */

const userBadge =
    document.getElementById(
        "userBadge"
    );


/* STEPS */

const stepTabs =
    document.querySelectorAll(
        ".step-tab"
    );

const workspaces =
    document.querySelectorAll(
        ".workspace"
    );


/* BATCH */

const courseName =
    document.getElementById(
        "courseName"
    );

const courseCode =
    document.getElementById(
        "courseCode"
    );

const academicYear =
    document.getElementById(
        "academicYear"
    );

const board =
    document.getElementById(
        "board"
    );

const coursePrice =
    document.getElementById(
        "coursePrice"
    );

const courseStatus =
    document.getElementById(
        "courseStatus"
    );

const courseDescription =
    document.getElementById(
        "courseDescription"
    );

const createBatchButton =
    document.getElementById(
        "createBatchButton"
    );

const courseList =
    document.getElementById(
        "courseList"
    );

const courseThumbnail =
    document.getElementById(
        "courseThumbnail"
    );

const thumbnailPreview =
    document.getElementById(
        "thumbnailPreview"
    );

const thumbnailPreviewImage =
    document.getElementById(
        "thumbnailPreviewImage"
    );
/* SUBJECT */

const subjectCourseLabel =
    document.getElementById(
        "subjectCourseLabel"
    );

const selectedCourseName =
    document.getElementById(
        "selectedCourseName"
    );

const subjectName =
    document.getElementById(
        "subjectName"
    );

const addSubjectButton =
    document.getElementById(
        "addSubjectButton"
    );

const subjectList =
    document.getElementById(
        "subjectList"
    );


/* CHAPTER */

const chapterCourseSelect =
    document.getElementById(
        "chapterCourseSelect"
    );

const chapterSubjectSelect =
    document.getElementById(
        "chapterSubjectSelect"
    );

const chapterSelected =
    document.getElementById(
        "chapterSelected"
    );

const chapterSubjectName =
    document.getElementById(
        "chapterSubjectName"
    );

const chapterNumber =
    document.getElementById(
        "chapterNumber"
    );

const chapterName =
    document.getElementById(
        "chapterName"
    );

const addChapterButton =
    document.getElementById(
        "addChapterButton"
    );

const chapterList =
    document.getElementById(
        "chapterList"
    );


/* CONTENT */

const contentCourseSelect =
    document.getElementById(
        "contentCourseSelect"
    );

const contentSubjectSelect =
    document.getElementById(
        "contentSubjectSelect"
    );

const contentChapterSelect =
    document.getElementById(
        "contentChapterSelect"
    );

const contentContext =
    document.getElementById(
        "contentContext"
    );

const contentContextName =
    document.getElementById(
        "contentContextName"
    );

const contentType =
    document.getElementById(
        "contentType"
    );

const accessType =
    document.getElementById(
        "accessType"
    );

const contentTitle =
    document.getElementById(
        "contentTitle"
    );

const contentOrder =
    document.getElementById(
        "contentOrder"
    );

const thumbnailUrl =
    document.getElementById(
        "thumbnailUrl"
    );

const contentDescription =
    document.getElementById(
        "contentDescription"
    );

const videoUploadField =
    document.getElementById(
        "videoUploadField"
    );

const pdfUploadField =
    document.getElementById(
        "pdfUploadField"
    );

const videoFile =
    document.getElementById(
        "videoFile"
    );

const pdfFile =
    document.getElementById(
        "pdfFile"
    );

const videoBrowseButton =
    document.getElementById(
        "videoBrowseButton"
    );

const pdfBrowseButton =
    document.getElementById(
        "pdfBrowseButton"
    );

const videoDropZone =
    document.getElementById(
        "videoDropZone"
    );

const pdfDropZone =
    document.getElementById(
        "pdfDropZone"
    );

const videoFileName =
    document.getElementById(
        "videoFileName"
    );

const pdfFileName =
    document.getElementById(
        "pdfFileName"
    );

const uploadContentButton =
    document.getElementById(
        "uploadContentButton"
    );

const contentList =
    document.getElementById(
        "contentList"
    );

const uploadProgressContainer =
    document.getElementById(
        "uploadProgressContainer"
    );

const uploadProgressBar =
    document.getElementById(
        "uploadProgressBar"
    );

const uploadStatus =
    document.getElementById(
        "uploadStatus"
    );

const uploadPercentage =
    document.getElementById(
        "uploadPercentage"
    );
let thumbnailUrl = "";

let thumbnailStoragePath = "";


if (thumbnailFile) {

    const thumbnailPath =
        `zen2/${courseId}/thumbnail/${Date.now()}_${thumbnailFile.name}`;

    const thumbnailRef =
        ref(
            storage,
            thumbnailPath
        );


    const uploadTask =
        uploadBytesResumable(
            thumbnailRef,
            thumbnailFile
        );


    await waitForUpload(
        uploadTask,
        progress => {

            // Update your existing progress UI here

        }
    );


    thumbnailUrl =
        await getDownloadURL(
            thumbnailRef
        );


    thumbnailStoragePath =
        thumbnailPath;

}

/* ============================================================
   AUTH
============================================================ */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            userBadge.textContent =
                "Sign in required";

            disablePage();

            return;

        }


        currentUser =
            user;


        userBadge.textContent =
            user.email ||
            user.displayName ||
            "Admin";


        await loadCourses();

    }
);


/* ============================================================
   STEP NAVIGATION
============================================================ */

stepTabs.forEach(
    (tab) => {

        tab.addEventListener(
            "click",
            () => {

                const step =
                    Number(
                        tab.dataset.step
                    );


                /*
                 * Steps 2–4 require
                 * a selected course.
                 */

                if (
                    step > 1 &&
                    !selectedCourseId
                ) {

                    showToast(
                        "Create or select a batch first."
                    );

                    setStep(1);

                    return;

                }


                setStep(step);

            }
        );

    }
);


function setStep(step) {

    stepTabs.forEach(
        (tab) => {

            tab.classList.toggle(
                "active",
                Number(
                    tab.dataset.step
                ) === step
            );

        }
    );


    workspaces.forEach(
        (workspace) => {

            workspace.classList.toggle(
                "active",
                workspace.id ===
                    `step${step}`
            );

        }
    );


    if (step === 2) {

        loadSubjects(
            selectedCourseId
        );

    }


    if (step === 3) {

        populateChapterCourses();

        if (selectedCourseId) {

            chapterCourseSelect.value =
                selectedCourseId;

            loadChapterSubjects(
                selectedCourseId
            );

        }

    }


    if (step === 4) {

        populateContentCourses();

        if (selectedCourseId) {

            contentCourseSelect.value =
                selectedCourseId;

            loadContentSubjects(
                selectedCourseId
            );

        }

    }

}

courseThumbnail.addEventListener(
    "change",
    () => {

        const file =
            courseThumbnail.files[0];

        if (!file) {

            thumbnailPreview.classList.add(
                "hidden"
            );

            thumbnailPreviewImage.src =
                "";

            return;

        }


        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            showToast(
                "Invalid image",
                "Please select JPG, PNG or WebP."
            );

            courseThumbnail.value =
                "";

            return;

        }


        const url =
            URL.createObjectURL(
                file
            );


        thumbnailPreviewImage.src =
            url;


        thumbnailPreview.classList.remove(
            "hidden"
        );

    }
);

/* ============================================================
   BATCH
============================================================ */

createBatchButton.addEventListener(
    "click",
    createCourse
);


async function createCourse() {

    clearErrors();


    const name =
        courseName.value.trim();

    const code =
        courseCode.value.trim();

    const year =
        academicYear.value.trim();

    const selectedBoard =
        board.value;

    const price =
        Number(
            coursePrice.value || 0
        );

    const status =
        courseStatus.value;

    const description =
        courseDescription.value.trim();


    if (!name) {

        showError(
            "batchError",
            "Please enter the batch/course name."
        );

        return;

    }


    if (!code) {

        showError(
            "batchError",
            "Please enter a course code."
        );

        return;

    }


    if (!year) {

        showError(
            "batchError",
            "Please enter the academic year."
        );

        return;

    }


    if (!selectedBoard) {

        showError(
            "batchError",
            "Please select the board."
        );

        return;

    }


    if (price < 0) {

        showError(
            "batchError",
            "Please enter a valid course price."
        );

        return;

    }


    createBatchButton.disabled =
        true;

    createBatchButton.innerHTML =
        "Creating...";


    try {

        const courseRef =
            await addDoc(
                collection(
                    db,
                    COURSES
                ),

                {

                    courseName:
                        name,

                    courseCode:
                        code,

                    className:
                        "10th",

                    classDisplayName:
                        "10th Standard",

                    academicYear:
                        year,

                    board:
                        selectedBoard,

                    price:
                        price,

                    description:
                        description,

                    status:
                        status,

                    active:
                        status === "ACTIVE",

                    appVersion:
                        "ZEN2",

                    createdBy:
                        currentUser.uid,

                    createdByEmail:
                        currentUser.email || "",

                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()

                }
            );


        selectedCourseId =
            courseRef.id;


        selectedCourseName.textContent =
            name;


        subjectCourseLabel.textContent =
            `Add subjects to ${name}.`;


        showToast(
            "Batch created successfully."
        );


        await loadCourses();


        setStep(2);


        resetBatchForm();


    } catch (error) {

        console.error(
            "Create batch error:",
            error
        );


        showError(
            "batchError",
            error.message ||
            "Unable to create batch."
        );

    } finally {

        createBatchButton.disabled =
            false;

        createBatchButton.innerHTML =
            `Create Batch <span>→</span>`;

    }

}


/* ============================================================
   LOAD COURSES
============================================================ */

async function loadCourses() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    COURSES
                )
            );


        courses =
            snapshot.docs
                .map(
                    (item) => ({
                        id: item.id,
                        ...item.data()
                    })
                )
                .sort(
                    (a, b) =>
                        String(
                            a.courseName || ""
                        ).localeCompare(
                            String(
                                b.courseName || ""
                            )
                        )
                );


        renderCourses();

        populateChapterCourses();

        populateContentCourses();


    } catch (error) {

        console.error(
            "Load courses error:",
            error
        );


        courseList.innerHTML =
            `<div class="empty-state">
                Unable to load batches.
            </div>`;

    }

}


/* ============================================================
   RENDER COURSES
============================================================ */

function renderCourses() {

    if (!courses.length) {

        courseList.innerHTML =
            `<div class="empty-state">
                No ZEN2 batches created yet.
            </div>`;

        return;

    }


    courseList.innerHTML =
        "";


    courses.forEach(
        (course) => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "course-card";


            card.innerHTML = `

                <div class="course-card-top">

                    <div>

                        <h3>
                            ${escapeHtml(
                                course.courseName ||
                                "Unnamed batch"
                            )}
                        </h3>

                        <p>
                            ${escapeHtml(
                                course.courseCode ||
                                ""
                            )}
                        </p>

                    </div>

                    <span class="course-status">
                        ${
                            escapeHtml(
                                course.status ||
                                "ACTIVE"
                            )
                        }
                    </span>

                </div>


                <div class="course-meta">

                    <span>
                        10th Standard
                    </span>

                    <span>
                        ₹${Number(
                            course.price || 0
                        ).toLocaleString("en-IN")}
                    </span>

                </div>

                <button
                    type="button"
                    class="item-action"
                    data-select-course="${course.id}"
                    style="margin-top:12px;"
                >
                    Manage Content →
                </button>
            `;


            courseList.appendChild(
                card
            );

        }
    );


    courseList
        .querySelectorAll(
            "[data-select-course]"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        selectCourse(
                            button.dataset.selectCourse
                        );

                    }
                );

            }
        );

}


/* ============================================================
   SELECT COURSE
============================================================ */

function selectCourse(
    courseId
) {

    const course =
        courses.find(
            (item) =>
                item.id === courseId
        );


    if (!course) {
        return;
    }


    selectedCourseId =
        courseId;


    selectedCourseName.textContent =
        course.courseName;


    subjectCourseLabel.textContent =
        `Add subjects to ${course.courseName}.`;


    showToast(
        `Selected ${course.courseName}`
    );


    setStep(2);

}


/* ============================================================
   SUBJECTS
============================================================ */

addSubjectButton.addEventListener(
    "click",
    addSubject
);


subjectName.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Enter"
        ) {

            event.preventDefault();

            addSubject();

        }

    }
);


async function addSubject() {

    clearErrors();


    if (!selectedCourseId) {

        showError(
            "subjectError",
            "Please select a batch first."
        );

        return;

    }


    const name =
        subjectName.value.trim();


    if (!name) {

        showError(
            "subjectError",
            "Enter a subject name."
        );

        return;

    }


    /*
     * Prevent duplicate subject names
     * inside the same course.
     */

    const existingQuery =
        query(
            collection(
                db,
                SUBJECTS
            ),

            where(
                "courseId",
                "==",
                selectedCourseId
            )
        );


    const existingSnapshot =
        await getDocs(
            existingQuery
        );


    const normalized =
        normalize(name);


    const duplicate =
        existingSnapshot.docs.some(
            (item) =>
                normalize(
                    item.data().subjectName || ""
                ) === normalized
        );


    if (duplicate) {

        showError(
            "subjectError",
            "This subject already exists in this batch."
        );

        return;

    }


    addSubjectButton.disabled =
        true;


    try {

        await addDoc(
            collection(
                db,
                SUBJECTS
            ),

            {

                courseId:
                    selectedCourseId,

                subjectName:
                    name,

                displayName:
                    name,

                active:
                    true,

                order:
                    await getNextSubjectOrder(
                        selectedCourseId
                    ),

                createdBy:
                    currentUser.uid,

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            }
        );


        subjectName.value =
            "";


        showToast(
            "Subject added."
        );


        await loadSubjects(
            selectedCourseId
        );


    } catch (error) {

        console.error(
            "Add subject error:",
            error
        );


        showError(
            "subjectError",
            error.message ||
            "Unable to add subject."
        );

    } finally {

        addSubjectButton.disabled =
            false;

    }

}


/* ============================================================
   LOAD SUBJECTS
============================================================ */

async function loadSubjects(
    courseId
) {

    if (!courseId) {

        subjectList.innerHTML =
            `<div class="empty-state">
                Select a batch.
            </div>`;

        return;

    }


    try {

        const snapshot =
            await getDocs(
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
                )
            );


        const subjects =
            snapshot.docs
                .map(
                    (item) => ({
                        id: item.id,
                        ...item.data()
                    })
                )
                .sort(
                    (a, b) =>
                        Number(
                            a.order || 0
                        ) -
                        Number(
                            b.order || 0
                        )
                );


        renderSubjects(
            subjects
        );


    } catch (error) {

        console.error(
            "Load subjects error:",
            error
        );

        subjectList.innerHTML =
            `<div class="empty-state">
                Unable to load subjects.
            </div>`;

    }

}


/* ============================================================
   RENDER SUBJECTS
============================================================ */

function renderSubjects(
    subjects
) {

    if (!subjects.length) {

        subjectList.innerHTML =
            `<div class="empty-state">
                No subjects added yet.
            </div>`;

        return;

    }


    subjectList.innerHTML =
        "";


    subjects.forEach(
        (subject, index) => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "item-card";


            card.innerHTML = `

                <div class="item-main">

                    <div class="item-number">
                        ${index + 1}
                    </div>

                    <div>

                        <strong>
                            ${escapeHtml(
                                subject.subjectName
                            )}
                        </strong>

                        <span>
                            ${escapeHtml(
                                subject.id
                            )}
                        </span>

                    </div>

                </div>

                <button
                    type="button"
                    class="item-action"
                    data-manage-subject="${subject.id}"
                >
                    Manage Chapters →
                </button>
            `;


            subjectList.appendChild(
                card
            );

        }
    );


    subjectList
        .querySelectorAll(
            "[data-manage-subject]"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        selectedSubjectId =
                            button.dataset.manageSubject;

                        setStep(3);

                    }
                );

            }
        );

}


/* ============================================================
   SUBJECT ORDER
============================================================ */

async function getNextSubjectOrder(
    courseId
) {

    const snapshot =
        await getDocs(
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
            )
        );


    return snapshot.size + 1;

}


/* ============================================================
   CHAPTER COURSE SELECT
============================================================ */

function populateChapterCourses() {

    chapterCourseSelect.innerHTML =
        `<option value="">
            Select batch
        </option>`;


    courses.forEach(
        (course) => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                course.id;

            option.textContent =
                course.courseName;

            chapterCourseSelect.appendChild(
                option
            );

        }
    );

}


/* ============================================================
   CHAPTER COURSE CHANGE
============================================================ */

chapterCourseSelect.addEventListener(
    "change",
    async () => {

        selectedCourseId =
            chapterCourseSelect.value;

        selectedSubjectId =
            null;

        chapterSubjectSelect.innerHTML =
            `<option value="">
                Loading subjects...
            </option>`;

        chapterSubjectSelect.disabled =
            true;


        if (!selectedCourseId) {

            chapterSubjectSelect.innerHTML =
                `<option value="">
                    Select subject
                </option>`;

            return;

        }


        await loadChapterSubjects(
            selectedCourseId
        );

    }
);


/* ============================================================
   LOAD CHAPTER SUBJECTS
============================================================ */

async function loadChapterSubjects(
    courseId
) {

    const snapshot =
        await getDocs(
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
            )
        );


    const subjects =
        snapshot.docs
            .map(
                (item) => ({
                    id: item.id,
                    ...item.data()
                })
            )
            .sort(
                (a, b) =>
                    Number(a.order || 0) -
                    Number(b.order || 0)
            );


    chapterSubjectSelect.innerHTML =
        `<option value="">
            Select subject
        </option>`;


    subjects.forEach(
        (subject) => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                subject.id;

            option.textContent =
                subject.subjectName;

            chapterSubjectSelect.appendChild(
                option
            );

        }
    );


    chapterSubjectSelect.disabled =
        subjects.length === 0;


    if (
        selectedSubjectId &&
        subjects.some(
            (item) =>
                item.id === selectedSubjectId
        )
    ) {

        chapterSubjectSelect.value =
            selectedSubjectId;

        await selectChapterSubject(
            selectedSubjectId
        );

    }

}


/* ============================================================
   CHAPTER SUBJECT CHANGE
============================================================ */

chapterSubjectSelect.addEventListener(
    "change",
    async () => {

        selectedSubjectId =
            chapterSubjectSelect.value;


        await selectChapterSubject(
            selectedSubjectId
        );

    }
);


/* ============================================================
   SELECT CHAPTER SUBJECT
============================================================ */

async function selectChapterSubject(
    subjectId
) {

    if (!subjectId) {

        selectedSubjectId =
            null;

        addChapterButton.disabled =
            true;

        chapterSelected.classList.add(
            "hidden"
        );

        chapterList.innerHTML =
            `<div class="empty-state">
                Select a subject.
            </div>`;

        return;

    }


    selectedSubjectId =
        subjectId;


    const subject =
        await getDocument(
            SUBJECTS,
            subjectId
        );


    if (!subject) {
        return;
    }


    chapterSubjectName.textContent =
        subject.subjectName;


    chapterSelected.classList.remove(
        "hidden"
    );


    addChapterButton.disabled =
        false;


    await loadChapters(
        selectedCourseId,
        selectedSubjectId
    );

}


/* ============================================================
   ADD CHAPTER
============================================================ */

addChapterButton.addEventListener(
    "click",
    addChapter
);


async function addChapter() {

    clearErrors();


    if (
        !selectedCourseId ||
        !selectedSubjectId
    ) {

        showError(
            "chapterError",
            "Select a batch and subject first."
        );

        return;

    }


    const number =
        Number(
            chapterNumber.value
        );

    const name =
        chapterName.value.trim();


    if (
        !number ||
        number < 1
    ) {

        showError(
            "chapterError",
            "Enter a valid chapter number."
        );

        return;

    }


    if (!name) {

        showError(
            "chapterError",
            "Enter the chapter name."
        );

        return;

    }


    addChapterButton.disabled =
        true;


    try {

        /*
         * Check duplicate chapter number/name.
         */

        const existingSnapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        CHAPTERS
                    ),

                    where(
                        "courseId",
                        "==",
                        selectedCourseId
                    ),

                    where(
                        "subjectId",
                        "==",
                        selectedSubjectId
                    )
                )
            );


        const duplicate =
            existingSnapshot.docs.some(
                (item) => {

                    const data =
                        item.data();


                    return (
                        Number(
                            data.chapterNumber
                        ) === number
                        ||
                        normalize(
                            data.chapterName || ""
                        ) ===
                        normalize(name)
                    );

                }
            );


        if (duplicate) {

            showError(
                "chapterError",
                "That chapter number or chapter name already exists."
            );

            return;

        }


        await addDoc(
            collection(
                db,
                CHAPTERS
            ),

            {

                courseId:
                    selectedCourseId,

                subjectId:
                    selectedSubjectId,

                chapterNumber:
                    number,

                chapterName:
                    name,

                active:
                    true,

                createdBy:
                    currentUser.uid,

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            }
        );


        chapterNumber.value =
            "";

        chapterName.value =
            "";


        showToast(
            "Chapter added."
        );


        await loadChapters(
            selectedCourseId,
            selectedSubjectId
        );


    } catch (error) {

        console.error(
            "Add chapter error:",
            error
        );


        showError(
            "chapterError",
            error.message ||
            "Unable to add chapter."
        );

    } finally {

        addChapterButton.disabled =
            false;

    }

}


/* ============================================================
   LOAD CHAPTERS
============================================================ */

async function loadChapters(
    courseId,
    subjectId
) {

    if (!courseId || !subjectId) {

        return;

    }


    try {

        const snapshot =
            await getDocs(
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
                )
            );


        const chapters =
            snapshot.docs
                .map(
                    (item) => ({
                        id: item.id,
                        ...item.data()
                    })
                )
                .sort(
                    (a, b) =>
                        Number(
                            a.chapterNumber || 0
                        ) -
                        Number(
                            b.chapterNumber || 0
                        )
                );


        renderChapters(
            chapters
        );


    } catch (error) {

        console.error(
            "Load chapters error:",
            error
        );


        chapterList.innerHTML =
            `<div class="empty-state">
                Unable to load chapters.
            </div>`;

    }

}


/* ============================================================
   RENDER CHAPTERS
============================================================ */

function renderChapters(
    chapters
) {

    if (!chapters.length) {

        chapterList.innerHTML =
            `<div class="empty-state">
                No chapters added yet.
            </div>`;

        return;

    }


    chapterList.innerHTML =
        "";


    chapters.forEach(
        (chapter) => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "chapter-card";


            card.innerHTML = `

                <div class="chapter-header">

                    <div class="chapter-left">

                        <div class="chapter-number">

                            ${Number(
                                chapter.chapterNumber
                            )}

                        </div>

                        <div>

                            <h3>
                                ${escapeHtml(
                                    chapter.chapterName
                                )}
                            </h3>

                            <p>
                                Chapter ${Number(
                                    chapter.chapterNumber
                                )}
                            </p>

                        </div>

                    </div>


                    <button
                        type="button"
                        class="item-action"
                        data-manage-chapter="${chapter.id}"
                    >
                        Add Content →
                    </button>

                </div>

            `;


            chapterList.appendChild(
                card
            );

        }
    );


    chapterList
        .querySelectorAll(
            "[data-manage-chapter]"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        selectedChapterId =
                            button.dataset.manageChapter;

                        setStep(4);

                    }
                );

            }
        );

}


/* ============================================================
   CONTENT COURSE SELECT
============================================================ */

function populateContentCourses() {

    contentCourseSelect.innerHTML =
        `<option value="">
            Select batch
        </option>`;


    courses.forEach(
        (course) => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                course.id;

            option.textContent =
                course.courseName;

            contentCourseSelect.appendChild(
                option
            );

        }
    );

}


/* ============================================================
   CONTENT COURSE CHANGE
============================================================ */

contentCourseSelect.addEventListener(
    "change",
    async () => {

        selectedCourseId =
            contentCourseSelect.value;

        selectedSubjectId =
            null;

        selectedChapterId =
            null;


        contentSubjectSelect.innerHTML =
            `<option value="">
                Loading subjects...
            </option>`;

        contentSubjectSelect.disabled =
            true;


        contentChapterSelect.innerHTML =
            `<option value="">
                Select chapter
            </option>`;

        contentChapterSelect.disabled =
            true;


        if (!selectedCourseId) {
            return;
        }


        await loadContentSubjects(
            selectedCourseId
        );

    }
);


/* ============================================================
   LOAD CONTENT SUBJECTS
============================================================ */

async function loadContentSubjects(
    courseId
) {

    const snapshot =
        await getDocs(
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
            )
        );


    const subjects =
        snapshot.docs
            .map(
                (item) => ({
                    id: item.id,
                    ...item.data()
                })
            )
            .sort(
                (a, b) =>
                    Number(a.order || 0) -
                    Number(b.order || 0)
            );


    contentSubjectSelect.innerHTML =
        `<option value="">
            Select subject
        </option>`;


    subjects.forEach(
        (subject) => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                subject.id;

            option.textContent =
                subject.subjectName;

            contentSubjectSelect.appendChild(
                option
            );

        }
    );


    contentSubjectSelect.disabled =
        subjects.length === 0;


    if (
        selectedSubjectId &&
        subjects.some(
            (item) =>
                item.id === selectedSubjectId
        )
    ) {

        contentSubjectSelect.value =
            selectedSubjectId;

        await loadContentChapters(
            selectedCourseId,
            selectedSubjectId
        );

    }

}


/* ============================================================
   CONTENT SUBJECT CHANGE
============================================================ */

contentSubjectSelect.addEventListener(
    "change",
    async () => {

        selectedSubjectId =
            contentSubjectSelect.value;

        selectedChapterId =
            null;


        contentChapterSelect.innerHTML =
            `<option value="">
                Loading chapters...
            </option>`;

        contentChapterSelect.disabled =
            true;


        if (!selectedSubjectId) {
            return;
        }


        await loadContentChapters(
            selectedCourseId,
            selectedSubjectId
        );

    }
);


/* ============================================================
   LOAD CONTENT CHAPTERS
============================================================ */

async function loadContentChapters(
    courseId,
    subjectId
) {

    const snapshot =
        await getDocs(
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
            )
        );


    const chapters =
        snapshot.docs
            .map(
                (item) => ({
                    id: item.id,
                    ...item.data()
                })
            )
            .sort(
                (a, b) =>
                    Number(
                        a.chapterNumber || 0
                    ) -
                    Number(
                        b.chapterNumber || 0
                    )
            );


    contentChapterSelect.innerHTML =
        `<option value="">
            Select chapter
        </option>`;


    chapters.forEach(
        (chapter) => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                chapter.id;

            option.textContent =
                `${chapter.chapterNumber}. ${chapter.chapterName}`;

            contentChapterSelect.appendChild(
                option
            );

        }
    );


    contentChapterSelect.disabled =
        chapters.length === 0;


    if (
        selectedChapterId &&
        chapters.some(
            (item) =>
                item.id === selectedChapterId
        )
    ) {

        contentChapterSelect.value =
            selectedChapterId;

        await selectContentChapter(
            selectedChapterId
        );

    }

}


/* ============================================================
   CONTENT CHAPTER CHANGE
============================================================ */

contentChapterSelect.addEventListener(
    "change",
    async () => {

        selectedChapterId =
            contentChapterSelect.value;


        await selectContentChapter(
            selectedChapterId
        );

    }
);


/* ============================================================
   SELECT CONTENT CHAPTER
============================================================ */

async function selectContentChapter(
    chapterId
) {

    if (!chapterId) {

        contentContext.classList.add(
            "hidden"
        );

        uploadContentButton.disabled =
            true;

        contentList.innerHTML =
            `<div class="empty-state">
                Select a chapter.
            </div>`;

        return;

    }


    selectedChapterId =
        chapterId;


    const chapter =
        await getDocument(
            CHAPTERS,
            chapterId
        );


    if (!chapter) {
        return;
    }


    contentContextName.textContent =
        chapter.chapterName;


    contentContext.classList.remove(
        "hidden"
    );


    uploadContentButton.disabled =
        false;


    await loadContent(
        chapterId
    );

}


/* ============================================================
   CONTENT TYPE CHANGE
============================================================ */

contentType.addEventListener(
    "change",
    updateContentTypeUI
);


function updateContentTypeUI() {

    const type =
        contentType.value;


    if (type === "VIDEO") {

        videoUploadField.classList.remove(
            "hidden"
        );

        pdfUploadField.classList.add(
            "hidden"
        );

    } else {

        videoUploadField.classList.add(
            "hidden"
        );

        pdfUploadField.classList.remove(
            "hidden"
        );

    }


    resetSelectedFiles();

}


/* ============================================================
   FILE BUTTONS
============================================================ */

videoBrowseButton.addEventListener(
    "click",
    () => {

        videoFile.click();

    }
);


pdfBrowseButton.addEventListener(
    "click",
    () => {

        pdfFile.click();

    }
);


/* ============================================================
   FILE CHANGE
============================================================ */

videoFile.addEventListener(
    "change",
    () => {

        if (
            videoFile.files &&
            videoFile.files[0]
        ) {

            videoFileName.textContent =
                videoFile.files[0].name;

        }

    }
);


pdfFile.addEventListener(
    "change",
    () => {

        if (
            pdfFile.files &&
            pdfFile.files[0]
        ) {

            pdfFileName.textContent =
                pdfFile.files[0].name;

        }

    }
);


/* ============================================================
   DRAG AND DROP
============================================================ */

setupDropZone(
    videoDropZone,
    videoFile
);

setupDropZone(
    pdfDropZone,
    pdfFile
);


function setupDropZone(
    zone,
    input
) {

    [
        "dragenter",
        "dragover"
    ].forEach(
        (eventName) => {

            zone.addEventListener(
                eventName,
                (event) => {

                    event.preventDefault();

                    zone.classList.add(
                        "dragging"
                    );

                }
            );

        }
    );


    [
        "dragleave",
        "drop"
    ].forEach(
        (eventName) => {

            zone.addEventListener(
                eventName,
                (event) => {

                    event.preventDefault();

                    zone.classList.remove(
                        "dragging"
                    );

                }
            );

        }
    );


    zone.addEventListener(
        "drop",
        (event) => {

            const files =
                event.dataTransfer.files;


            if (
                files &&
                files.length
            ) {

                input.files =
                    files;


                input.dispatchEvent(
                    new Event(
                        "change"
                    )
                );

            }

        }
    );

}


/* ============================================================
   UPLOAD CONTENT
============================================================ */

uploadContentButton.addEventListener(
    "click",
    uploadContent
);


async function uploadContent() {

    clearErrors();


    if (
        !selectedCourseId ||
        !selectedSubjectId ||
        !selectedChapterId
    ) {

        showError(
            "contentError",
            "Select a batch, subject and chapter."
        );

        return;

    }


    const title =
        contentTitle.value.trim();


    if (!title) {

        showError(
            "contentError",
            "Enter a content title."
        );

        return;

    }


    const type =
        contentType.value;


    const access =
        accessType.value;


    const file =
        type === "VIDEO"
            ? videoFile.files[0]
            : pdfFile.files[0];


    if (!file) {

        showError(
            "contentError",
            `Please select a ${
                type === "VIDEO"
                    ? "video"
                    : "PDF"
            } file.`
        );

        return;

    }


    /*
     * Validate file.
     */

    if (
        type === "PDF" &&
        file.type !== "application/pdf"
    ) {

        showError(
            "contentError",
            "Please select a valid PDF file."
        );

        return;

    }


    if (
        type === "VIDEO" &&
        !file.type.startsWith(
            "video/"
        )
    ) {

        showError(
            "contentError",
            "Please select a valid video file."
        );

        return;

    }


    contentUploading =
        true;


    uploadContentButton.disabled =
        true;


    uploadContentButton.innerHTML =
        "Uploading...";


    uploadProgressContainer.classList.remove(
        "hidden"
    );


    updateUploadProgress(
        0,
        "Preparing upload..."
    );


    try {

        /*
         * Generate Firestore content ID
         * before uploading the file.
         */

        const contentRef =
            doc(
                collection(
                    db,
                    CONTENT
                )
            );


        const safeFileName =
            sanitizeFileName(
                file.name
            );


        const storagePath =
            `zen2/${selectedCourseId}/${selectedSubjectId}/${selectedChapterId}/${contentRef.id}/${safeFileName}`;


        const storageReference =
            ref(
                storage,
                storagePath
            );


        /*
         * Upload to Firebase Storage.
         */

        const uploadTask =
            uploadBytesResumable(
                storageReference,
                file,
                {
                    contentType:
                        file.type
                }
            );


        const downloadURL =
            await waitForUpload(
                uploadTask
            );


        updateUploadProgress(
            95,
            "Saving content..."
        );


        /*
         * Save metadata in Firestore.
         */

        await setDoc(
            contentRef,

            {

                courseId:
                    selectedCourseId,

                subjectId:
                    selectedSubjectId,

                chapterId:
                    selectedChapterId,


                title:
                    title,

                contentType:
                    type,

                accessType:
                    access,


                /*
                 * FREE or PAID
                 *
                 * Student app will use
                 * this field to decide
                 * whether the item is locked.
                 */

                isFree:
                    access === "FREE",

                requiresPurchase:
                    access === "PAID",


                order:
                    Number(
                        contentOrder.value ||
                        1
                    ),


                description:
                    contentDescription
                        .value
                        .trim(),


                thumbnailUrl:
                    thumbnailUrl
                        .value
                        .trim(),


                fileName:
                    file.name,

                fileSize:
                    file.size,

                fileType:
                    file.type,

                storagePath:
                    storagePath,

                fileUrl:
                    downloadURL,


                active:
                    true,


                createdBy:
                    currentUser.uid,

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            }
        );


        updateUploadProgress(
            100,
            "Upload complete."
        );


        showToast(
            `${type === "VIDEO" ? "Video" : "PDF"} uploaded successfully.`
        );


        resetContentForm();


        await loadContent(
            selectedChapterId
        );


    } catch (error) {

        console.error(
            "Upload content error:",
            error
        );


        showError(
            "contentError",
            error.message ||
            "Unable to upload content."
        );


    } finally {

        contentUploading =
            false;

        uploadContentButton.disabled =
            false;

        uploadContentButton.innerHTML =
            `Upload Content <span>↑</span>`;

    }

}


/* ============================================================
   WAIT FOR UPLOAD
============================================================ */

function waitForUpload(
    uploadTask
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            uploadTask.on(

                "state_changed",

                (snapshot) => {

                    const percentage =
                        Math.round(
                            (
                                snapshot.bytesTransferred /
                                snapshot.totalBytes
                            ) * 90
                        );


                    updateUploadProgress(
                        percentage,
                        "Uploading file..."
                    );

                },

                (error) => {

                    reject(
                        error
                    );

                },

                async () => {

                    try {

                        const url =
                            await getDownloadURL(
                                uploadTask.snapshot.ref
                            );

                        resolve(
                            url
                        );

                    } catch (error) {

                        reject(
                            error
                        );

                    }

                }

            );

        }
    );

}


/* ============================================================
   LOAD CONTENT
============================================================ */

async function loadContent(
    chapterId
) {

    if (!chapterId) {

        return;

    }


    try {

        const snapshot =
            await getDocs(
                query(
                    collection(
                        db,
                        CONTENT
                    ),

                    where(
                        "chapterId",
                        "==",
                        chapterId
                    )
                )
            );


        const content =
            snapshot.docs
                .map(
                    (item) => ({
                        id: item.id,
                        ...item.data()
                    })
                )
                .sort(
                    (a, b) =>
                        Number(
                            a.order || 0
                        ) -
                        Number(
                            b.order || 0
                        )
                );


        renderContent(
            content
        );


    } catch (error) {

        console.error(
            "Load content error:",
            error
        );


        contentList.innerHTML =
            `<div class="empty-state">
                Unable to load content.
            </div>`;

    }

}


/* ============================================================
   RENDER CONTENT
============================================================ */

function renderContent(
    content
) {

    if (!content.length) {

        contentList.innerHTML =
            `<div class="empty-state">
                No videos or PDFs uploaded yet.
            </div>`;

        return;

    }


    contentList.innerHTML =
        "";


    content.forEach(
        (item) => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "content-card";


            const typeLabel =
                item.contentType === "VIDEO"
                    ? "VIDEO"
                    : "PDF";


            const accessClass =
                item.accessType === "FREE"
                    ? "free"
                    : "paid";


            const accessLabel =
                item.accessType === "FREE"
                    ? "FREE"
                    : "PAID";


            card.innerHTML = `

                <div class="content-main">

                    <div class="content-type">
                        ${typeLabel}
                    </div>

                    <div class="content-info">

                        <strong>
                            ${escapeHtml(
                                item.title ||
                                "Untitled"
                            )}
                        </strong>

                        <span>
                            ${escapeHtml(
                                item.fileName ||
                                ""
                            )}
                        </span>

                    </div>

                </div>


                <span
                    class="access-badge ${accessClass}"
                >
                    ${accessLabel}
                </span>

            `;


            contentList.appendChild(
                card
            );

        }
    );

}


/* ============================================================
   UPLOAD PROGRESS
============================================================ */

function updateUploadProgress(
    percentage,
    status
) {

    const safePercentage =
        Math.max(
            0,
            Math.min(
                100,
                percentage
            )
        );


    uploadProgressBar.style.width =
        `${safePercentage}%`;


    uploadPercentage.textContent =
        `${safePercentage}%`;


    uploadStatus.textContent =
        status;

}


/* ============================================================
   RESET CONTENT FORM
============================================================ */

function resetContentForm() {

    contentTitle.value =
        "";

    contentDescription.value =
        "";

    thumbnailUrl.value =
        "";

    contentOrder.value =
        "1";


    accessType.value =
        "FREE";


    resetSelectedFiles();


    uploadProgressContainer.classList.add(
        "hidden"
    );


    updateUploadProgress(
        0,
        "Preparing upload..."
    );

}


function resetSelectedFiles() {

    videoFile.value =
        "";

    pdfFile.value =
        "";

    videoFileName.textContent =
        "";

    pdfFileName.textContent =
        "";

}


/* ============================================================
   BATCH FORM RESET
============================================================ */

function resetBatchForm() {

    courseName.value =
        "";

    courseCode.value =
        "";

    academicYear.value =
        "";

    board.value =
        "";

    coursePrice.value =
        "";

    courseStatus.value =
        "ACTIVE";

    courseDescription.value =
        "";

}


/* ============================================================
   DOCUMENT HELPER
============================================================ */

async function getDocument(
    collectionName,
    id
) {

    const snapshot =
        await getDoc(
            doc(
                db,
                collectionName,
                id
            )
        );


    if (!snapshot.exists()) {
        return null;
    }


    return {
        id: snapshot.id,
        ...snapshot.data()
    };

}


/* ============================================================
   ERROR HELPERS
============================================================ */

function showError(
    elementId,
    message
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;

    element.classList.add(
        "show"
    );

}


function clearErrors() {

    document
        .querySelectorAll(
            ".error-message"
        )
        .forEach(
            (element) => {

                element.textContent =
                    "";

                element.classList.remove(
                    "show"
                );

            }
        );

}


/* ============================================================
   TOAST
============================================================ */

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


/* ============================================================
   DISABLE PAGE
============================================================ */

function disablePage() {

    document
        .querySelectorAll(
            "button, input, select, textarea"
        )
        .forEach(
            (element) => {

                element.disabled =
                    true;

            }
        );

}


/* ============================================================
   NORMALIZE
============================================================ */

function normalize(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase()
        .replace(
            /\s+/g,
            " "
        );

}


/* ============================================================
   FILE NAME
============================================================ */

function sanitizeFileName(
    filename
) {

    return String(
        filename || "file"
    )
        .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
        );

}


/* ============================================================
   HTML ESCAPE
============================================================ */

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


/* ============================================================
   INITIAL UI
============================================================ */

updateContentTypeUI();

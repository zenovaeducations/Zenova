/* =====================================================
   ZEN2 CRM CONTENT MANAGER
   Batch → Subject → Chapter → Content
===================================================== */


import {
    auth,
    db,
    storage
} from "../../../firebase/firebase-config.js";


import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    updateDoc,
    deleteDoc,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";



/* =====================================================
   COLLECTIONS
===================================================== */

const COURSES =
    "zen2Courses";

const SUBJECTS =
    "zen2Subjects";

const CHAPTERS =
    "zen2Chapters";

const CONTENT =
    "zen2Content";



/* =====================================================
   STATE
===================================================== */

let currentUser = null;

let courses = [];

let subjects = [];

let chapters = [];

let contents = [];

let selectedCourseId = "";

let selectedSubjectId = "";

let selectedChapterId = "";

let deleteCallback = null;



/* =====================================================
   ELEMENTS
===================================================== */

const batchSelect =
    document.getElementById(
        "batchSelect"
    );

const subjectSelect =
    document.getElementById(
        "subjectSelect"
    );

const chapterSelect =
    document.getElementById(
        "chapterSelect"
    );


const editSubjectBtn =
    document.getElementById(
        "editSubjectBtn"
    );

const deleteSubjectBtn =
    document.getElementById(
        "deleteSubjectBtn"
    );


const editChapterBtn =
    document.getElementById(
        "editChapterBtn"
    );

const deleteChapterBtn =
    document.getElementById(
        "deleteChapterBtn"
    );


const contentPanel =
    document.getElementById(
        "contentPanel"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );


const locationPanel =
    document.getElementById(
        "locationPanel"
    );


const videoList =
    document.getElementById(
        "videoList"
    );

const pdfList =
    document.getElementById(
        "pdfList"
    );


const videoCount =
    document.getElementById(
        "videoCount"
    );

const pdfCount =
    document.getElementById(
        "pdfCount"
    );



/* =====================================================
   AUTH
===================================================== */

onAuthStateChanged(
    auth,

    async user => {

        if (!user) {

            window.location.href =
                "../../../login/";

            return;

        }


        currentUser =
            user;


        await loadCourses();

    }
);



/* =====================================================
   LOAD COURSES
===================================================== */

async function loadCourses() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    COURSES
                )
            );


        courses = [];


        snapshot.forEach(
            item => {

                courses.push({

                    id:
                        item.id,

                    ...item.data()

                });

            }
        );


        courses.sort(
            (a, b) =>

                getCourseName(a)
                    .localeCompare(
                        getCourseName(b)
                    )
        );


        batchSelect.innerHTML =
            `<option value="">
                Select Batch
            </option>`;


        courses.forEach(
            course => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    course.id;


                option.textContent =
                    getCourseName(
                        course
                    );


                batchSelect.appendChild(
                    option
                );

            }
        );

    }

    catch (error) {

        showToast(
            "Error",
            readableError(error)
        );

        console.error(
            error
        );

    }

}



/* =====================================================
   COURSE NAME
===================================================== */

function getCourseName(
    course
) {

    return (
        course.name ||
        course.courseName ||
        course.title ||
        course.crmCourseName ||
        "Unnamed Batch"
    );

}



/* =====================================================
   BATCH CHANGE
===================================================== */

batchSelect.addEventListener(
    "change",

    async () => {

        selectedCourseId =
            batchSelect.value;


        selectedSubjectId = "";

        selectedChapterId = "";


        resetSubject();

        resetChapter();

        hideContent();


        if (
            !selectedCourseId
        ) {

            return;

        }


        await loadSubjects();

    }
);



/* =====================================================
   LOAD SUBJECTS
===================================================== */

async function loadSubjects() {

    subjectSelect.disabled =
        true;


    subjectSelect.innerHTML =
        `<option value="">
            Loading subjects...
        </option>`;


    const q =
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


    const snapshot =
        await getDocs(q);


    subjects = [];


    snapshot.forEach(
        item => {

            subjects.push({

                id:
                    item.id,

                ...item.data()

            });

        }
    );


    subjects.sort(
        (a, b) =>

            getSubjectName(a)
                .localeCompare(
                    getSubjectName(b)
                )
    );


    subjectSelect.innerHTML =
        `<option value="">
            Select Subject
        </option>`;


    subjects.forEach(
        subject => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                subject.id;


            /*
             * IMPORTANT:
             * Support both `name`
             * and `subjectName`
             */

            option.textContent =
                getSubjectName(
                    subject
                );


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

        subjectSelect.innerHTML =
            `<option value="">
                No subjects found
            </option>`;

    }

}



/* =====================================================
   SUBJECT NAME
===================================================== */

function getSubjectName(
    subject
) {

    return (
        subject.name ||
        subject.subjectName ||
        subject.title ||
        "Unnamed Subject"
    );

}



/* =====================================================
   SUBJECT CHANGE
===================================================== */

subjectSelect.addEventListener(
    "change",

    async () => {

        selectedSubjectId =
            subjectSelect.value;


        selectedChapterId = "";


        resetChapter();

        hideContent();


        editSubjectBtn.disabled =
            !selectedSubjectId;


        deleteSubjectBtn.disabled =
            !selectedSubjectId;


        if (
            !selectedSubjectId
        ) {

            return;

        }


        await loadChapters();

    }
);



/* =====================================================
   LOAD CHAPTERS
===================================================== */

async function loadChapters() {

    chapterSelect.disabled =
        true;


    chapterSelect.innerHTML =
        `<option value="">
            Loading chapters...
        </option>`;


    const q =
        query(

            collection(
                db,
                CHAPTERS
            ),

            where(
                "subjectId",
                "==",
                selectedSubjectId
            )

        );


    const snapshot =
        await getDocs(q);


    chapters = [];


    snapshot.forEach(
        item => {

            chapters.push({

                id:
                    item.id,

                ...item.data()

            });

        }
    );


    chapters.sort(
        (a, b) =>

            Number(
                getChapterNumber(a)
            ) -

            Number(
                getChapterNumber(b)
            )
    );


    chapterSelect.innerHTML =
        `<option value="">
            Select Chapter
        </option>`;


    chapters.forEach(
        chapter => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                chapter.id;


            option.textContent =
                `${getChapterNumber(chapter)} - ${getChapterName(chapter)}`;


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

        chapterSelect.innerHTML =
            `<option value="">
                No chapters found
            </option>`;

    }

}



/* =====================================================
   CHAPTER HELPERS
===================================================== */

function getChapterNumber(
    chapter
) {

    return (
        chapter.chapterNumber ??
        chapter.order ??
        0
    );

}


function getChapterName(
    chapter
) {

    return (
        chapter.name ||
        chapter.chapterName ||
        chapter.title ||
        "Unnamed Chapter"
    );

}



/* =====================================================
   CHAPTER CHANGE
===================================================== */

chapterSelect.addEventListener(
    "change",

    async () => {

        selectedChapterId =
            chapterSelect.value;


        editChapterBtn.disabled =
            !selectedChapterId;


        deleteChapterBtn.disabled =
            !selectedChapterId;


        if (
            !selectedChapterId
        ) {

            hideContent();

            return;

        }


        await loadContent();

    }
);



/* =====================================================
   LOAD CONTENT
===================================================== */

async function loadContent() {

    const q =
        query(

            collection(
                db,
                CONTENT
            ),

            where(
                "chapterId",
                "==",
                selectedChapterId
            )

        );


    const snapshot =
        await getDocs(q);


    contents = [];


    snapshot.forEach(
        item => {

            contents.push({

                id:
                    item.id,

                ...item.data()

            });

        }
    );


    contents.sort(
        (a, b) =>

            Number(
                a.order ||
                0
            ) -

            Number(
                b.order ||
                0
            )
    );


    renderContent();

}



/* =====================================================
   RENDER CONTENT
===================================================== */

function renderContent() {

    const videos =
        contents.filter(
            item =>
                String(
                    item.contentType ||
                    ""
                ).toUpperCase() ===
                "VIDEO"
        );


    const pdfs =
        contents.filter(
            item =>
                String(
                    item.contentType ||
                    ""
                ).toUpperCase() ===
                "PDF"
        );


    videoCount.textContent =
        videos.length;


    pdfCount.textContent =
        pdfs.length;


    videoList.innerHTML =
        "";


    pdfList.innerHTML =
        "";


    if (
        videos.length === 0
    ) {

        videoList.innerHTML =
            emptyContent(
                "No videos in this chapter."
            );

    }

    else {

        videos.forEach(
            content => {

                videoList.appendChild(
                    createContentRow(
                        content,
                        "VIDEO"
                    )
                );

            }
        );

    }


    if (
        pdfs.length === 0
    ) {

        pdfList.innerHTML =
            emptyContent(
                "No PDFs in this chapter."
            );

    }

    else {

        pdfs.forEach(
            content => {

                pdfList.appendChild(
                    createContentRow(
                        content,
                        "PDF"
                    )
                );

            }
        );

    }


    updateLocation();


    contentPanel.classList.remove(
        "hidden"
    );


    emptyState.classList.add(
        "hidden"
    );

}



/* =====================================================
   CONTENT ROW
===================================================== */

function createContentRow(
    content,
    type
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        "content-row";


    const access =
        String(
            content.accessType ||
            (
                content.isFree
                    ? "FREE"
                    : "PAID"
            )
        ).toUpperCase();


    row.innerHTML =
        `

        <div class="content-icon">
            ${type === "VIDEO" ? "▶" : "📄"}
        </div>


        <div>

            <div class="content-title">
                ${escapeHTML(
                    content.title ||
                    "Untitled"
                )}
            </div>


            <div class="content-meta">

                Order:
                ${escapeHTML(
                    content.order ||
                    0
                )}

                ${content.fileName
                    ? ` • ${escapeHTML(content.fileName)}`
                    : ""
                }

            </div>

        </div>


        <span
            class="badge ${access === "PAID" ? "paid" : "free"}"
        >
            ${access}
        </span>


        <div class="content-actions">

            <button
                class="small-btn"
                data-action="edit-content"
                data-id="${content.id}"
            >
                Edit
            </button>


            <button
                class="small-btn delete"
                data-action="delete-content"
                data-id="${content.id}"
            >
                Delete
            </button>

        </div>

        `;


    return row;

}



/* =====================================================
   CONTENT BUTTONS
===================================================== */

document.addEventListener(
    "click",

    event => {

        const button =
            event.target.closest(
                "[data-action]"
            );


        if (!button) {
            return;
        }


        const action =
            button.dataset.action;


        const id =
            button.dataset.id;


        if (
            action ===
            "edit-content"
        ) {

            openContentEdit(
                id
            );

        }


        if (
            action ===
            "delete-content"
        ) {

            confirmContentDelete(
                id
            );

        }

    }
);



/* =====================================================
   EDIT SUBJECT
===================================================== */

editSubjectBtn.addEventListener(
    "click",

    () => {

        const subject =
            subjects.find(
                item =>
                    item.id ===
                    selectedSubjectId
            );


        if (!subject) {
            return;
        }


        document
            .getElementById(
                "subjectName"
            )
            .value =
            getSubjectName(
                subject
            );


        openModal(
            "subjectModal"
        );

    }
);



/* =====================================================
   SAVE SUBJECT
===================================================== */

document
    .getElementById(
        "subjectForm"
    )
    .addEventListener(

        "submit",

        async event => {

            event.preventDefault();


            const name =
                document
                    .getElementById(
                        "subjectName"
                    )
                    .value
                    .trim();


            if (!name) {
                return;
            }


            try {

                await updateDoc(

                    doc(
                        db,
                        SUBJECTS,
                        selectedSubjectId
                    ),

                    {
                        name,

                        subjectName:
                            name,

                        updatedAt:
                            serverTimestamp()
                    }

                );


                closeModal(
                    "subjectModal"
                );


                await loadSubjects();


                subjectSelect.value =
                    selectedSubjectId;


                await loadChapters();


                showToast(
                    "Saved",
                    "Subject name updated."
                );

            }

            catch (error) {

                showToast(
                    "Error",
                    readableError(error)
                );

            }

        }

    );



/* =====================================================
   DELETE SUBJECT
===================================================== */

deleteSubjectBtn.addEventListener(
    "click",

    () => {

        const subject =
            subjects.find(
                item =>
                    item.id ===
                    selectedSubjectId
            );


        if (!subject) {
            return;
        }


        const subjectName =
            getSubjectName(
                subject
            );


        askDelete(

            "Delete Subject?",

            `
            Delete <strong>
            ${escapeHTML(subjectName)}
            </strong>?

            <br><br>

            All chapters and their
            videos/PDFs will also be deleted.
            `,

            async () => {

                await deleteSubjectTree(
                    selectedSubjectId
                );

            }

        );

    }
);



/* =====================================================
   DELETE SUBJECT TREE
===================================================== */

async function deleteSubjectTree(
    subjectId
) {

    const q =
        query(

            collection(
                db,
                CHAPTERS
            ),

            where(
                "subjectId",
                "==",
                subjectId
            )

        );


    const snapshot =
        await getDocs(q);


    for (
        const chapterDoc
        of snapshot.docs
    ) {

        await deleteChapterTree(
            chapterDoc.id
        );

    }


    await deleteDoc(
        doc(
            db,
            SUBJECTS,
            subjectId
        )
    );


    selectedSubjectId = "";

    selectedChapterId = "";


    resetSubject();

    resetChapter();

    hideContent();


    await loadSubjects();


    showToast(
        "Deleted",
        "Subject deleted successfully."
    );

}



/* =====================================================
   EDIT CHAPTER
===================================================== */

editChapterBtn.addEventListener(
    "click",

    () => {

        const chapter =
            chapters.find(
                item =>
                    item.id ===
                    selectedChapterId
            );


        if (!chapter) {
            return;
        }


        document
            .getElementById(
                "chapterNumber"
            )
            .value =
            getChapterNumber(
                chapter
            );


        document
            .getElementById(
                "chapterName"
            )
            .value =
            getChapterName(
                chapter
            );


        openModal(
            "chapterModal"
        );

    }
);



/* =====================================================
   SAVE CHAPTER
===================================================== */

document
    .getElementById(
        "chapterForm"
    )
    .addEventListener(

        "submit",

        async event => {

            event.preventDefault();


            const number =
                Number(
                    document
                        .getElementById(
                            "chapterNumber"
                        )
                        .value
                );


            const name =
                document
                    .getElementById(
                        "chapterName"
                    )
                    .value
                    .trim();


            if (
                !number ||
                !name
            ) {
                return;
            }


            try {

                await updateDoc(

                    doc(
                        db,
                        CHAPTERS,
                        selectedChapterId
                    ),

                    {
                        chapterNumber:
                            number,

                        order:
                            number,

                        name,

                        chapterName:
                            name,

                        updatedAt:
                            serverTimestamp()
                    }

                );


                closeModal(
                    "chapterModal"
                );


                await loadChapters();


                chapterSelect.value =
                    selectedChapterId;


                await loadContent();


                showToast(
                    "Saved",
                    "Chapter updated."
                );

            }

            catch (error) {

                showToast(
                    "Error",
                    readableError(error)
                );

            }

        }

    );



/* =====================================================
   DELETE CHAPTER
===================================================== */

deleteChapterBtn.addEventListener(
    "click",

    () => {

        const chapter =
            chapters.find(
                item =>
                    item.id ===
                    selectedChapterId
            );


        if (!chapter) {
            return;
        }


        askDelete(

            "Delete Chapter?",

            `
            Delete <strong>
            ${escapeHTML(
                getChapterName(chapter)
            )}
            </strong>?

            <br><br>

            All videos and PDFs inside
            this chapter will also be deleted.
            `,

            async () => {

                await deleteChapterTree(
                    selectedChapterId
                );


                selectedChapterId =
                    "";


                resetChapter();

                hideContent();


                await loadChapters();


                showToast(
                    "Deleted",
                    "Chapter deleted successfully."
                );

            }

        );

    }
);



/* =====================================================
   DELETE CHAPTER TREE
===================================================== */

async function deleteChapterTree(
    chapterId
) {

    const q =
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

        );


    const snapshot =
        await getDocs(q);


    for (
        const contentDoc
        of snapshot.docs
    ) {

        await deleteContent(
            {
                id:
                    contentDoc.id,

                ...contentDoc.data()
            }
        );

    }


    await deleteDoc(
        doc(
            db,
            CHAPTERS,
            chapterId
        )
    );

}



/* =====================================================
   EDIT CONTENT
===================================================== */

function openContentEdit(
    contentId
) {

    const content =
        contents.find(
            item =>
                item.id ===
                contentId
        );


    if (!content) {
        return;
    }


    document
        .getElementById(
            "editingContentId"
        )
        .value =
        contentId;


    document
        .getElementById(
            "contentTitle"
        )
        .value =
        content.title ||
        "";


    document
        .getElementById(
            "contentAccess"
        )
        .value =
        content.accessType ||
        (
            content.isFree
                ? "FREE"
                : "PAID"
        );


    document
        .getElementById(
            "contentOrder"
        )
        .value =
        content.order ||
        1;


    document
        .getElementById(
            "contentDescription"
        )
        .value =
        content.description ||
        "";


    document
        .getElementById(
            "contentThumbnail"
        )
        .value =
        content.thumbnailUrl ||
        "";


    const fileInput =
        document
            .getElementById(
                "contentFile"
            );


    fileInput.value =
        "";


    fileInput.accept =
        content.contentType ===
        "PDF"
            ? ".pdf,application/pdf"
            : "video/*";


    document
        .getElementById(
            "contentModalTitle"
        )
        .textContent =
        content.contentType ===
        "PDF"
            ? "Edit PDF"
            : "Edit Video";


    openModal(
        "contentModal"
    );

}



/* =====================================================
   SAVE CONTENT
===================================================== */

document
    .getElementById(
        "contentForm"
    )
    .addEventListener(

        "submit",

        async event => {

            event.preventDefault();


            const contentId =
                document
                    .getElementById(
                        "editingContentId"
                    )
                    .value;


            const content =
                contents.find(
                    item =>
                        item.id ===
                        contentId
                );


            if (!content) {
                return;
            }


            const title =
                document
                    .getElementById(
                        "contentTitle"
                    )
                    .value
                    .trim();


            const accessType =
                document
                    .getElementById(
                        "contentAccess"
                    )
                    .value;


            const order =
                Number(
                    document
                        .getElementById(
                            "contentOrder"
                        )
                        .value
                );


            const description =
                document
                    .getElementById(
                        "contentDescription"
                    )
                    .value
                    .trim();


            const thumbnailUrl =
                document
                    .getElementById(
                        "contentThumbnail"
                    )
                    .value
                    .trim();


            const file =
                document
                    .getElementById(
                        "contentFile"
                    )
                    .files[0];


            if (
                !title ||
                !order
            ) {
                return;
            }


            try {

                const updateData = {

                    title,

                    accessType,

                    isFree:
                        accessType ===
                        "FREE",

                    requiresPurchase:
                        accessType ===
                        "PAID",

                    order,

                    description,

                    thumbnailUrl,

                    updatedAt:
                        serverTimestamp()

                };


                /* -------------------------------------
                   REPLACE FILE
                -------------------------------------- */

                if (file) {

                    validateFile(
                        content,
                        file
                    );


                    const oldPath =
                        content.storagePath;


                    const newPath =
                        buildStoragePath(
                            selectedCourseId,
                            content.subjectId,
                            content.chapterId,
                            content.id,
                            file.name
                        );


                    const storageRef =
                        ref(
                            storage,
                            newPath
                        );


                    const task =
                        uploadBytesResumable(
                            storageRef,
                            file
                        );


                    showUploadProgress(
                        0
                    );


                    await new Promise(
                        (
                            resolve,
                            reject
                        ) => {

                            task.on(

                                "state_changed",

                                snapshot => {

                                    const percentage =
                                        Math.round(
                                            (
                                                snapshot.bytesTransferred /
                                                snapshot.totalBytes
                                            ) * 100
                                        );


                                    showUploadProgress(
                                        percentage
                                    );

                                },

                                reject,

                                resolve

                            );

                        }
                    );


                    const url =
                        await getDownloadURL(
                            storageRef
                        );


                    updateData.fileName =
                        file.name;


                    updateData.fileSize =
                        file.size;


                    updateData.fileType =
                        file.type;


                    updateData.storagePath =
                        newPath;


                    updateData.fileUrl =
                        url;


                    if (
                        oldPath &&
                        oldPath !==
                        newPath
                    ) {

                        await safeDeleteStorage(
                            oldPath
                        );

                    }


                    hideUploadProgress();

                }


                await updateDoc(

                    doc(
                        db,
                        CONTENT,
                        contentId
                    ),

                    updateData

                );


                closeModal(
                    "contentModal"
                );


                await loadContent();


                showToast(
                    "Saved",
                    "Content updated successfully."
                );

            }

            catch (error) {

                hideUploadProgress();


                console.error(
                    error
                );


                showToast(
                    "Error",
                    readableError(error)
                );

            }

        }

    );



/* =====================================================
   ADD VIDEO / PDF
===================================================== */

document
    .getElementById(
        "addVideoBtn"
    )
    .addEventListener(
        "click",

        () => {

            /*
             * We intentionally do not create a
             * second upload system here.
             *
             * Existing Content Studio already
             * handles creation.
             */

            window.location.href =
                `../?courseId=${encodeURIComponent(
                    selectedCourseId
                )}&subjectId=${encodeURIComponent(
                    selectedSubjectId
                )}&chapterId=${encodeURIComponent(
                    selectedChapterId
                )}`;

        }
    );


document
    .getElementById(
        "addPdfBtn"
    )
    .addEventListener(
        "click",

        () => {

            window.location.href =
                `../?courseId=${encodeURIComponent(
                    selectedCourseId
                )}&subjectId=${encodeURIComponent(
                    selectedSubjectId
                )}&chapterId=${encodeURIComponent(
                    selectedChapterId
                )}`;

        }
    );



/* =====================================================
   DELETE CONTENT CONFIRM
===================================================== */

function confirmContentDelete(
    contentId
) {

    const content =
        contents.find(
            item =>
                item.id ===
                contentId
        );


    if (!content) {
        return;
    }


    askDelete(

        "Delete Content?",

        `
        Delete <strong>
        ${escapeHTML(
            content.title ||
            "this content"
        )}
        </strong>?

        <br><br>

        The Firestore record and
        uploaded file will be deleted.
        `,

        async () => {

            await deleteContent(
                content
            );


            await loadContent();


            showToast(
                "Deleted",
                "Content deleted successfully."
            );

        }

    );

}



/* =====================================================
   DELETE CONTENT
===================================================== */

async function deleteContent(
    content
) {

    if (
        content.storagePath
    ) {

        await safeDeleteStorage(
            content.storagePath
        );

    }


    await deleteDoc(
        doc(
            db,
            CONTENT,
            content.id
        )
    );

}



/* =====================================================
   STORAGE DELETE
===================================================== */

async function safeDeleteStorage(
    path
) {

    try {

        await deleteObject(
            ref(
                storage,
                path
            )
        );

    }

    catch (error) {

        if (
            error.code ===
            "storage/object-not-found"
        ) {

            return;

        }


        throw error;

    }

}



/* =====================================================
   STORAGE PATH
===================================================== */

function buildStoragePath(
    courseId,
    subjectId,
    chapterId,
    contentId,
    fileName
) {

    return (
        `zen2/` +
        `${courseId}/` +
        `${subjectId}/` +
        `${chapterId}/` +
        `${contentId}/` +
        `${Date.now()}_${fileName}`
    );

}



/* =====================================================
   VALIDATE FILE
===================================================== */

function validateFile(
    content,
    file
) {

    if (
        content.contentType ===
        "PDF"
    ) {

        if (
            file.type !==
            "application/pdf"
        ) {

            throw new Error(
                "Please select a PDF file."
            );

        }

    }


    if (
        content.contentType ===
        "VIDEO"
    ) {

        if (
            !file.type.startsWith(
                "video/"
            )
        ) {

            throw new Error(
                "Please select a video file."
            );

        }

    }

}



/* =====================================================
   LOCATION
===================================================== */

function updateLocation() {

    const course =
        courses.find(
            item =>
                item.id ===
                selectedCourseId
        );


    const subject =
        subjects.find(
            item =>
                item.id ===
                selectedSubjectId
        );


    const chapter =
        chapters.find(
            item =>
                item.id ===
                selectedChapterId
        );


    document
        .getElementById(
            "selectedBatchText"
        )
        .textContent =
        course
            ? getCourseName(course)
            : "Batch";


    document
        .getElementById(
            "selectedSubjectText"
        )
        .textContent =
        subject
            ? getSubjectName(subject)
            : "Subject";


    document
        .getElementById(
            "selectedChapterText"
        )
        .textContent =
        chapter
            ? `${getChapterNumber(chapter)} - ${getChapterName(chapter)}`
            : "Chapter";


    document
        .getElementById(
            "chapterHeading"
        )
        .textContent =
        chapter
            ? getChapterName(chapter)
            : "Chapter";


    locationPanel.classList.remove(
        "hidden"
    );

}



/* =====================================================
   RESET
===================================================== */

function resetSubject() {

    subjectSelect.innerHTML =
        `<option value="">
            Select Subject
        </option>`;


    subjectSelect.disabled =
        true;


    editSubjectBtn.disabled =
        true;


    deleteSubjectBtn.disabled =
        true;

}


function resetChapter() {

    chapterSelect.innerHTML =
        `<option value="">
            Select Chapter
        </option>`;


    chapterSelect.disabled =
        true;


    editChapterBtn.disabled =
        true;


    deleteChapterBtn.disabled =
        true;

}


function hideContent() {

    contentPanel.classList.add(
        "hidden"
    );


    locationPanel.classList.add(
        "hidden"
    );


    emptyState.classList.remove(
        "hidden"
    );

}



/* =====================================================
   EMPTY CONTENT
===================================================== */

function emptyContent(
    text
) {

    return `
        <div
            style="
                padding:25px;
                text-align:center;
                color:#888;
                font-size:13px;
            "
        >
            ${text}
        </div>
    `;

}



/* =====================================================
   MODAL
===================================================== */

function openModal(
    id
) {

    document
        .getElementById(
            id
        )
        .classList.remove(
            "hidden"
        );

}


function closeModal(
    id
) {

    document
        .getElementById(
            id
        )
        .classList.add(
            "hidden"
        );

}


document
    .querySelectorAll(
        "[data-close]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",

                () => {

                    closeModal(
                        button.dataset.close
                    );

                }

            );

        }
    );



/* =====================================================
   DELETE CONFIRM
===================================================== */

function askDelete(
    title,
    message,
    callback
) {

    document
        .getElementById(
            "confirmTitle"
        )
        .textContent =
        title;


    document
        .getElementById(
            "confirmText"
        )
        .innerHTML =
        message;


    deleteCallback =
        callback;


    openModal(
        "confirmModal"
    );

}


document
    .getElementById(
        "cancelDelete"
    )
    .addEventListener(
        "click",

        () => {

            deleteCallback =
                null;

            closeModal(
                "confirmModal"
            );

        }
    );


document
    .getElementById(
        "confirmDelete"
    )
    .addEventListener(
        "click",

        async () => {

            if (
                !deleteCallback
            ) {
                return;
            }


            const callback =
                deleteCallback;


            deleteCallback =
                null;


            closeModal(
                "confirmModal"
            );


            try {

                await callback();

            }

            catch (error) {

                console.error(
                    error
                );


                showToast(
                    "Delete failed",
                    readableError(error)
                );

            }

        }
    );



/* =====================================================
   UPLOAD PROGRESS
===================================================== */

function showUploadProgress(
    percentage
) {

    document
        .getElementById(
            "uploadProgress"
        )
        .classList.remove(
            "hidden"
        );


    document
        .getElementById(
            "progressBar"
        )
        .style.width =
        `${percentage}%`;


    document
        .getElementById(
            "progressText"
        )
        .textContent =
        `${percentage}%`;

}


function hideUploadProgress() {

    document
        .getElementById(
            "uploadProgress"
        )
        .classList.add(
            "hidden"
        );

}



/* =====================================================
   TOAST
===================================================== */

let toastTimer =
    null;


function showToast(
    title,
    message
) {

    const toast =
        document.getElementById(
            "toast"
        );


    document
        .getElementById(
            "toastTitle"
        )
        .textContent =
        title;


    document
        .getElementById(
            "toastMessage"
        )
        .textContent =
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

            3500
        );

}



/* =====================================================
   ERROR
===================================================== */

function readableError(
    error
) {

    console.error(
        error
    );


    if (
        error?.code ===
        "permission-denied"
    ) {

        return (
            "Firebase permission denied. Check Firestore rules."
        );

    }


    if (
        error?.code ===
        "storage/unauthorized"
    ) {

        return (
            "Storage permission denied. Check Storage rules."
        );

    }


    return (
        error?.message ||
        "Something went wrong."
    );

}



/* =====================================================
   ESCAPE
===================================================== */

function escapeHTML(
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

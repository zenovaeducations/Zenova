/* =====================================================
   ZENOVA ZEN2
   CONTENT MANAGER

   IMPORTANT:
   This is a separate management page.
   It does NOT modify the existing Content Studio code.
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
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


import {
    ref,
    uploadBytesResumable,
    deleteObject,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";



/* =====================================================
   COLLECTIONS
===================================================== */

const COURSES = "zen2Courses";
const SUBJECTS = "zen2Subjects";
const CHAPTERS = "zen2Chapters";
const CONTENT = "zen2Content";



/* =====================================================
   STATE
===================================================== */

let currentUser = null;

let selectedCourseId = "";

let selectedCourse = null;

let subjects = [];

let chapters = [];

let contents = [];

let pendingDelete = null;



/* =====================================================
   ELEMENTS
===================================================== */

const batchSelect =
    document.getElementById(
        "batchSelect"
    );


const batchSection =
    document.getElementById(
        "batchSection"
    );


const batchSummary =
    document.getElementById(
        "batchSummary"
    );


const subjectsSection =
    document.getElementById(
        "subjectsSection"
    );


const subjectsList =
    document.getElementById(
        "subjectsList"
    );


const subjectModal =
    document.getElementById(
        "subjectModal"
    );


const chapterModal =
    document.getElementById(
        "chapterModal"
    );


const contentModal =
    document.getElementById(
        "contentModal"
    );


const confirmModal =
    document.getElementById(
        "confirmModal"
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


        await loadBatches();

    }
);



/* =====================================================
   LOAD BATCHES
===================================================== */

async function loadBatches() {

    try {

        batchSelect.innerHTML =
            `<option value="">
                Select a batch
            </option>`;


        const snapshot =
            await getDocs(
                collection(
                    db,
                    COURSES
                )
            );


        if (
            snapshot.empty
        ) {

            batchSelect.innerHTML =
                `<option value="">
                    No batches found
                </option>`;

            return;

        }


        snapshot.forEach(
            snapshotDoc => {

                const data =
                    snapshotDoc.data();


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    snapshotDoc.id;


                option.textContent =
                    data.name ||
                    data.courseName ||
                    data.title ||
                    "Unnamed Batch";


                batchSelect.appendChild(
                    option
                );

            }
        );


    }

    catch (error) {

        console.error(
            "LOAD BATCHES ERROR:",
            error
        );


        showToast(
            "Error",
            getErrorMessage(error)
        );

    }

}



/* =====================================================
   BATCH CHANGE
===================================================== */

batchSelect.addEventListener(
    "change",

    async () => {

        selectedCourseId =
            batchSelect.value;


        if (
            !selectedCourseId
        ) {

            batchSection.classList.add(
                "hidden"
            );

            subjectsSection.classList.add(
                "hidden"
            );

            return;

        }


        await loadSelectedBatch();

    }
);



/* =====================================================
   LOAD SELECTED BATCH
===================================================== */

async function loadSelectedBatch() {

    try {

        const snapshot =
            await getDoc(
                doc(
                    db,
                    COURSES,
                    selectedCourseId
                )
            );


        if (
            !snapshot.exists()
        ) {

            showToast(
                "Error",
                "Batch no longer exists."
            );

            return;

        }


        selectedCourse = {
            id:
                snapshot.id,

            ...snapshot.data()
        };


        renderBatch();


        await loadSubjects();


    }

    catch (error) {

        console.error(
            error
        );


        showToast(
            "Error",
            getErrorMessage(error)
        );

    }

}



/* =====================================================
   RENDER BATCH
===================================================== */

function renderBatch() {

    const name =
        selectedCourse.name ||
        selectedCourse.courseName ||
        selectedCourse.title ||
        "Unnamed Batch";


    const code =
        selectedCourse.code ||
        selectedCourse.courseCode ||
        "";


    const year =
        selectedCourse.academicYear ||
        "";


    const price =
        selectedCourse.price ??
        selectedCourse.coursePrice ??
        "";


    batchSummary.textContent =
        `${name}${code ? ` • ${code}` : ""}${year ? ` • ${year}` : ""}${price !== "" ? ` • ₹${price}` : ""}`;


    batchSection.classList.remove(
        "hidden"
    );


    subjectsSection.classList.remove(
        "hidden"
    );

}



/* =====================================================
   LOAD SUBJECTS
===================================================== */

async function loadSubjects() {

    subjects = [];


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
            String(
                a.name ||
                ""
            ).localeCompare(
                String(
                    b.name ||
                    ""
                )
            )
    );


    await loadAllChaptersAndContent();


    renderSubjects();

}



/* =====================================================
   LOAD ALL CHAPTERS + CONTENT
===================================================== */

async function loadAllChaptersAndContent() {

    chapters = [];

    contents = [];


    const chapterQuery =
        query(
            collection(
                db,
                CHAPTERS
            ),

            where(
                "courseId",
                "==",
                selectedCourseId
            )
        );


    const chapterSnapshot =
        await getDocs(
            chapterQuery
        );


    chapterSnapshot.forEach(
        item => {

            chapters.push({
                id:
                    item.id,

                ...item.data()
            });

        }
    );


    const contentQuery =
        query(
            collection(
                db,
                CONTENT
            ),

            where(
                "courseId",
                "==",
                selectedCourseId
            )
        );


    const contentSnapshot =
        await getDocs(
            contentQuery
        );


    contentSnapshot.forEach(
        item => {

            contents.push({
                id:
                    item.id,

                ...item.data()
            });

        }
    );

}



/* =====================================================
   RENDER SUBJECTS
===================================================== */

function renderSubjects() {

    subjectsList.innerHTML = "";


    if (
        subjects.length === 0
    ) {

        subjectsList.innerHTML =
            `
            <div class="empty">
                No subjects found.
                Click "+ Add Subject" to create one.
            </div>
            `;

        return;

    }


    subjects.forEach(
        subject => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "subject-card";


            const subjectChapters =
                chapters
                    .filter(
                        chapter =>
                            chapter.subjectId ===
                            subject.id
                    )
                    .sort(
                        (a, b) =>
                            Number(
                                a.chapterNumber ||
                                a.order ||
                                0
                            ) -
                            Number(
                                b.chapterNumber ||
                                b.order ||
                                0
                            )
                    );


            card.innerHTML =
                `
                <div class="subject-header">

                    <div>

                        <div class="subject-name">
                            ${escapeHTML(
                                subject.name ||
                                "Unnamed Subject"
                            )}
                        </div>

                        <div class="muted">
                            ${subjectChapters.length}
                            chapter${subjectChapters.length === 1 ? "" : "s"}
                        </div>

                    </div>


                    <div class="subject-actions">

                        <button
                            class="button secondary small"
                            data-action="edit-subject"
                            data-id="${subject.id}"
                        >
                            ✎ Edit
                        </button>

                        <button
                            class="button danger small"
                            data-action="delete-subject"
                            data-id="${subject.id}"
                        >
                            🗑 Delete
                        </button>

                        <button
                            class="button primary small"
                            data-action="add-chapter"
                            data-id="${subject.id}"
                        >
                            + Chapter
                        </button>

                    </div>

                </div>


                <div class="chapters-container">

                    ${
                        subjectChapters.length
                        ?
                        subjectChapters
                            .map(
                                chapter =>
                                    renderChapter(
                                        chapter
                                    )
                            )
                            .join("")
                        :
                        `
                        <div class="empty">
                            No chapters yet.
                        </div>
                        `
                    }

                </div>
                `;


            subjectsList.appendChild(
                card
            );

        }
    );

}



/* =====================================================
   RENDER CHAPTER
===================================================== */

function renderChapter(
    chapter
) {

    const chapterContents =
        contents
            .filter(
                content =>
                    content.chapterId ===
                    chapter.id
            )
            .sort(
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


    const number =
        chapter.chapterNumber ||
        chapter.order ||
        "";


    const name =
        chapter.name ||
        chapter.chapterName ||
        "Unnamed Chapter";


    return `

        <div class="chapter">

            <div class="chapter-header">

                <div>

                    <span class="chapter-number">
                        ${escapeHTML(number)}
                    </span>

                    <span class="chapter-title">
                        ${escapeHTML(name)}
                    </span>

                </div>


                <div class="chapter-actions">

                    <button
                        class="button secondary small"
                        data-action="edit-chapter"
                        data-id="${chapter.id}"
                    >
                        ✎ Edit
                    </button>


                    <button
                        class="button danger small"
                        data-action="delete-chapter"
                        data-id="${chapter.id}"
                    >
                        🗑 Delete
                    </button>

                </div>

            </div>


            <div class="content-list">

                ${
                    chapterContents.length
                    ?
                    chapterContents
                        .map(
                            content =>
                                renderContent(
                                    content
                                )
                        )
                        .join("")
                    :
                    `
                    <div class="empty">
                        No videos or PDFs in this chapter.
                    </div>
                    `
                }

            </div>

        </div>

    `;

}



/* =====================================================
   RENDER CONTENT
===================================================== */

function renderContent(
    content
) {

    const isVideo =
        content.contentType ===
        "VIDEO";


    const access =
        content.accessType ===
        "PAID"
        ?
        "PAID"
        :
        "FREE";


    return `

        <div class="content-row">

            <div class="content-icon">
                ${isVideo ? "▶" : "📄"}
            </div>


            <div class="content-info">

                <div class="content-title">

                    ${escapeHTML(
                        content.title ||
                        "Untitled"
                    )}

                </div>


                <div class="content-meta">

                    ${isVideo ? "Video" : "PDF"}

                    • Order:
                    ${escapeHTML(
                        content.order ??
                        0
                    )}

                </div>

            </div>


            <span
                class="badge ${access === "PAID" ? "paid" : "free"}"
            >
                ${access}
            </span>


            <div class="content-actions">

                <button
                    class="button secondary small"
                    data-action="edit-content"
                    data-id="${content.id}"
                >
                    ✎
                </button>


                <button
                    class="button danger small"
                    data-action="delete-content"
                    data-id="${content.id}"
                >
                    🗑
                </button>

            </div>

        </div>

    `;

}



/* =====================================================
   EVENT DELEGATION
===================================================== */

subjectsList.addEventListener(
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
            "edit-subject"
        ) {

            openEditSubject(
                id
            );

        }


        else if (
            action ===
            "delete-subject"
        ) {

            confirmDeleteSubject(
                id
            );

        }


        else if (
            action ===
            "add-chapter"
        ) {

            openAddChapter(
                id
            );

        }


        else if (
            action ===
            "edit-chapter"
        ) {

            openEditChapter(
                id
            );

        }


        else if (
            action ===
            "delete-chapter"
        ) {

            confirmDeleteChapter(
                id
            );

        }


        else if (
            action ===
            "edit-content"
        ) {

            openEditContent(
                id
            );

        }


        else if (
            action ===
            "delete-content"
        ) {

            confirmDeleteContent(
                id
            );

        }

    }
);



/* =====================================================
   ADD SUBJECT
===================================================== */

document
    .getElementById(
        "addSubjectButton"
    )
    .addEventListener(
        "click",

        () => {

            document
                .getElementById(
                    "subjectModalTitle"
                )
                .textContent =
                "Add Subject";


            document
                .getElementById(
                    "subjectId"
                )
                .value = "";


            document
                .getElementById(
                    "subjectName"
                )
                .value = "";


            openModal(
                subjectModal
            );

        }
    );



/* =====================================================
   EDIT SUBJECT
===================================================== */

function openEditSubject(
    subjectId
) {

    const subject =
        subjects.find(
            item =>
                item.id ===
                subjectId
        );


    if (!subject) {
        return;
    }


    document
        .getElementById(
            "subjectModalTitle"
        )
        .textContent =
        "Edit Subject";


    document
        .getElementById(
            "subjectId"
        )
        .value =
        subjectId;


    document
        .getElementById(
            "subjectName"
        )
        .value =
        subject.name || "";


    openModal(
        subjectModal
    );

}



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


            const id =
                document
                    .getElementById(
                        "subjectId"
                    )
                    .value;


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

                /* Duplicate protection */

                const duplicate =
                    subjects.find(
                        subject =>
                            subject.id !== id &&
                            String(
                                subject.name ||
                                ""
                            )
                                .trim()
                                .toLowerCase() ===
                            name.toLowerCase()
                    );


                if (duplicate) {

                    showToast(
                        "Cannot save",
                        "This subject already exists."
                    );

                    return;

                }


                if (id) {

                    await updateDoc(
                        doc(
                            db,
                            SUBJECTS,
                            id
                        ),

                        {
                            name,
                            updatedAt:
                                serverTimestamp()
                        }
                    );

                }

                else {

                    await setDoc(
                        doc(
                            collection(
                                db,
                                SUBJECTS
                            )
                        ),

                        {
                            courseId:
                                selectedCourseId,

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

                }


                closeModal(
                    subjectModal
                );


                await loadSelectedBatch();


                showToast(
                    "Saved",
                    "Subject updated successfully."
                );

            }

            catch (error) {

                console.error(
                    error
                );

                showToast(
                    "Error",
                    getErrorMessage(error)
                );

            }

        }
    );



/* =====================================================
   ADD CHAPTER
===================================================== */

function openAddChapter(
    subjectId
) {

    document
        .getElementById(
            "chapterModalTitle"
        )
        .textContent =
        "Add Chapter";


    document
        .getElementById(
            "chapterId"
        )
        .value = "";


    document
        .getElementById(
            "chapterNumber"
        )
        .value = "";


    document
        .getElementById(
            "chapterName"
        )
        .value = "";


    document
        .getElementById(
            "chapterId"
        )
        .dataset.subjectId =
        subjectId;


    openModal(
        chapterModal
    );

}



/* =====================================================
   EDIT CHAPTER
===================================================== */

function openEditChapter(
    chapterId
) {

    const chapter =
        chapters.find(
            item =>
                item.id ===
                chapterId
        );


    if (!chapter) {
        return;
    }


    document
        .getElementById(
            "chapterModalTitle"
        )
        .textContent =
        "Edit Chapter";


    document
        .getElementById(
            "chapterId"
        )
        .value =
        chapterId;


    document
        .getElementById(
            "chapterNumber"
        )
        .value =
        chapter.chapterNumber ??
        chapter.order ??
        1;


    document
        .getElementById(
            "chapterName"
        )
        .value =
        chapter.name ||
        chapter.chapterName ||
        "";


    document
        .getElementById(
            "chapterId"
        )
        .dataset.subjectId =
        chapter.subjectId;


    openModal(
        chapterModal
    );

}



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


            const id =
                document
                    .getElementById(
                        "chapterId"
                    )
                    .value;


            const subjectId =
                document
                    .getElementById(
                        "chapterId"
                    )
                    .dataset.subjectId;


            const chapterNumber =
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
                !chapterNumber ||
                !name
            ) {

                return;

            }


            try {

                const duplicate =
                    chapters.find(
                        chapter =>

                            chapter.id !== id &&

                            chapter.subjectId ===
                            subjectId &&

                            (
                                Number(
                                    chapter.chapterNumber ??
                                    chapter.order ??
                                    0
                                ) ===
                                chapterNumber ||

                                String(
                                    chapter.name ||
                                    chapter.chapterName ||
                                    ""
                                )
                                    .trim()
                                    .toLowerCase() ===
                                name.toLowerCase()
                            )
                    );


                if (duplicate) {

                    showToast(
                        "Cannot save",
                        "Chapter number or name already exists."
                    );

                    return;

                }


                if (id) {

                    await updateDoc(
                        doc(
                            db,
                            CHAPTERS,
                            id
                        ),

                        {
                            chapterNumber,

                            order:
                                chapterNumber,

                            name,

                            chapterName:
                                name,

                            updatedAt:
                                serverTimestamp()
                        }
                    );

                }

                else {

                    await setDoc(
                        doc(
                            collection(
                                db,
                                CHAPTERS
                            )
                        ),

                        {
                            courseId:
                                selectedCourseId,

                            subjectId,

                            chapterNumber,

                            order:
                                chapterNumber,

                            name,

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

                }


                closeModal(
                    chapterModal
                );


                await loadSelectedBatch();


                showToast(
                    "Saved",
                    "Chapter saved successfully."
                );

            }

            catch (error) {

                console.error(
                    error
                );


                showToast(
                    "Error",
                    getErrorMessage(error)
                );

            }

        }
    );



/* =====================================================
   EDIT CONTENT
===================================================== */

function openEditContent(
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
            "contentId"
        )
        .value =
        contentId;


    document
        .getElementById(
            "contentType"
        )
        .value =
        content.contentType ||
        "VIDEO";


    document
        .getElementById(
            "accessType"
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
            "contentTitle"
        )
        .value =
        content.title ||
        "";


    document
        .getElementById(
            "contentOrder"
        )
        .value =
        content.order ||
        1;


    document
        .getElementById(
            "contentThumbnail"
        )
        .value =
        content.thumbnailUrl ||
        "";


    document
        .getElementById(
            "contentDescription"
        )
        .value =
        content.description ||
        "";


    document
        .getElementById(
            "replacementFile"
        )
        .value = "";


    document
        .getElementById(
            "replacementFile"
        )
        .accept =
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
        contentModal
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
                        "contentId"
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


            const accessType =
                document
                    .getElementById(
                        "accessType"
                    )
                    .value;


            const title =
                document
                    .getElementById(
                        "contentTitle"
                    )
                    .value
                    .trim();


            const order =
                Number(
                    document
                        .getElementById(
                            "contentOrder"
                        )
                        .value
                );


            const thumbnailUrl =
                document
                    .getElementById(
                        "contentThumbnail"
                    )
                    .value
                    .trim();


            const description =
                document
                    .getElementById(
                        "contentDescription"
                    )
                    .value
                    .trim();


            const replacementFile =
                document
                    .getElementById(
                        "replacementFile"
                    )
                    .files[0];


            if (
                !title ||
                !order
            ) {

                return;

            }


            try {

                let updateData = {

                    title,

                    order,

                    accessType,

                    isFree:
                        accessType ===
                        "FREE",

                    requiresPurchase:
                        accessType ===
                        "PAID",

                    thumbnailUrl,

                    description,

                    updatedAt:
                        serverTimestamp()

                };


                /* -----------------------------------------
                   REPLACE FILE
                ----------------------------------------- */

                if (
                    replacementFile
                ) {

                    const valid =
                        validateReplacementFile(
                            content,
                            replacementFile
                        );


                    if (!valid) {
                        return;
                    }


                    await replaceContentFile(
                        content,
                        replacementFile,

                        progress => {

                            showReplaceProgress(
                                progress
                            );

                        }
                    );


                    const oldStoragePath =
                        content.storagePath;


                    const storagePath =
                        buildStoragePath(
                            selectedCourseId,
                            content.subjectId,
                            content.chapterId,
                            content.id,
                            replacementFile.name
                        );


                    const newRef =
                        ref(
                            storage,
                            storagePath
                        );


                    const uploadTask =
                        uploadBytesResumable(
                            newRef,
                            replacementFile
                        );


                    await waitForUpload(
                        uploadTask,

                        progress => {

                            showReplaceProgress(
                                progress
                            );

                        }
                    );


                    const newUrl =
                        await getDownloadURL(
                            newRef
                        );


                    updateData =
                        {

                            ...updateData,

                            fileName:
                                replacementFile.name,

                            fileSize:
                                replacementFile.size,

                            fileType:
                                replacementFile.type,

                            storagePath,

                            fileUrl:
                                newUrl

                        };


                    /* Delete old file AFTER
                       successful new upload */

                    if (
                        oldStoragePath &&
                        oldStoragePath !==
                        storagePath
                    ) {

                        await deleteStorageFile(
                            oldStoragePath
                        );

                    }

                }


                await updateDoc(
                    doc(
                        db,
                        CONTENT,
                        contentId
                    ),

                    updateData
                );


                hideReplaceProgress();


                closeModal(
                    contentModal
                );


                await loadSelectedBatch();


                showToast(
                    "Saved",
                    "Content updated successfully."
                );

            }

            catch (error) {

                console.error(
                    "SAVE CONTENT ERROR:",
                    error
                );


                hideReplaceProgress();


                showToast(
                    "Error",
                    getErrorMessage(error)
                );

            }

        }
    );



/* =====================================================
   REPLACE FILE
===================================================== */

async function replaceContentFile(
    content,
    file,
    progressCallback
) {

    /*
     * This function only validates the file.
     * Actual upload is handled below.
     */

    if (
        file.size <= 0
    ) {

        throw new Error(
            "The selected file is empty."
        );

    }

}



/* =====================================================
   UPLOAD HELPER
===================================================== */

function waitForUpload(
    uploadTask,
    progressCallback
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            uploadTask.on(

                "state_changed",

                snapshot => {

                    const progress =
                        Math.round(
                            (
                                snapshot.bytesTransferred /
                                snapshot.totalBytes
                            ) *
                            100
                        );


                    progressCallback(
                        progress
                    );

                },

                error => {

                    reject(
                        error
                    );

                },

                () => {

                    resolve();

                }

            );

        }
    );

}



/* =====================================================
   BUILD STORAGE PATH
===================================================== */

function buildStoragePath(
    courseId,
    subjectId,
    chapterId,
    contentId,
    filename
) {

    return (
        `zen2/` +
        `${courseId}/` +
        `${subjectId}/` +
        `${chapterId}/` +
        `${contentId}/` +
        `${Date.now()}_${filename}`
    );

}



/* =====================================================
   VALIDATE REPLACEMENT
===================================================== */

function validateReplacementFile(
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

            showToast(
                "Invalid file",
                "Please select a PDF file."
            );

            return false;

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

            showToast(
                "Invalid file",
                "Please select a video file."
            );

            return false;

        }

    }


    return true;

}



/* =====================================================
   DELETE SUBJECT
===================================================== */

function confirmDeleteSubject(
    subjectId
) {

    const subject =
        subjects.find(
            item =>
                item.id ===
                subjectId
        );


    if (!subject) {
        return;
    }


    const subjectChapters =
        chapters.filter(
            chapter =>
                chapter.subjectId ===
                subjectId
        );


    const chapterIds =
        new Set(
            subjectChapters.map(
                chapter =>
                    chapter.id
            )
        );


    const subjectContents =
        contents.filter(
            content =>
                chapterIds.has(
                    content.chapterId
                )
        );


    askConfirmation(

        "Delete Subject?",

        `
        Delete
        <strong>
            ${escapeHTML(
                subject.name ||
                "this subject"
            )}
        </strong>?

        <br><br>

        This will also delete:

        <br>

        • ${subjectChapters.length}
        chapter${subjectChapters.length === 1 ? "" : "s"}

        <br>

        • ${subjectContents.length}
        video/PDF item${subjectContents.length === 1 ? "" : "s"}

        <br><br>

        This action cannot be undone.
        `,

        async () => {

            await deleteSubjectTree(
                subjectId
            );

        }

    );

}



/* =====================================================
   DELETE SUBJECT TREE
===================================================== */

async function deleteSubjectTree(
    subjectId
) {

    const subjectChapters =
        chapters.filter(
            chapter =>
                chapter.subjectId ===
                subjectId
        );


    for (
        const chapter
        of subjectChapters
    ) {

        await deleteChapterTree(
            chapter.id
        );

    }


    await deleteDoc(
        doc(
            db,
            SUBJECTS,
            subjectId
        )
    );


    await loadSelectedBatch();


    showToast(
        "Deleted",
        "Subject and all its content were deleted."
    );

}



/* =====================================================
   DELETE CHAPTER
===================================================== */

function confirmDeleteChapter(
    chapterId
) {

    const chapter =
        chapters.find(
            item =>
                item.id ===
                chapterId
        );


    if (!chapter) {
        return;
    }


    const chapterContents =
        contents.filter(
            content =>
                content.chapterId ===
                chapterId
        );


    askConfirmation(

        "Delete Chapter?",

        `
        Delete
        <strong>
            ${escapeHTML(
                chapter.name ||
                chapter.chapterName ||
                "this chapter"
            )}
        </strong>?

        <br><br>

        This will also delete
        ${chapterContents.length}
        video/PDF item${chapterContents.length === 1 ? "" : "s"}.

        <br><br>

        This action cannot be undone.
        `,

        async () => {

            await deleteChapterTree(
                chapterId
            );


            await loadSelectedBatch();


            showToast(
                "Deleted",
                "Chapter and its content were deleted."
            );

        }

    );

}



/* =====================================================
   DELETE CHAPTER TREE
===================================================== */

async function deleteChapterTree(
    chapterId
) {

    const chapterContents =
        contents.filter(
            content =>
                content.chapterId ===
                chapterId
        );


    for (
        const content
        of chapterContents
    ) {

        await deleteContentDocument(
            content
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
   DELETE CONTENT
===================================================== */

function confirmDeleteContent(
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


    askConfirmation(

        "Delete Content?",

        `
        Delete
        <strong>
            ${escapeHTML(
                content.title ||
                "this content"
            )}
        </strong>?

        <br><br>

        The Firestore record and
        uploaded Storage file will be deleted.

        <br><br>

        This action cannot be undone.
        `,

        async () => {

            await deleteContentDocument(
                content
            );


            await loadSelectedBatch();


            showToast(
                "Deleted",
                "Content deleted successfully."
            );

        }

    );

}



/* =====================================================
   DELETE CONTENT DOCUMENT
===================================================== */

async function deleteContentDocument(
    content
) {

    if (
        content.storagePath
    ) {

        await deleteStorageFile(
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
   DELETE STORAGE FILE
===================================================== */

async function deleteStorageFile(
    storagePath
) {

    if (!storagePath) {
        return;
    }


    try {

        const fileRef =
            ref(
                storage,
                storagePath
            );


        await deleteObject(
            fileRef
        );

    }

    catch (error) {

        /*
         * If the Storage file has already
         * been deleted, don't block the
         * Firestore deletion.
         */

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
   EDIT BATCH
===================================================== */

document
    .getElementById(
        "editBatchButton"
    )
    .addEventListener(
        "click",

        () => {

            openBatchEdit();

        }
    );



/*
 * Batch editing uses a simple browser
 * prompt-based interface here so that
 * the existing creation page remains
 * completely untouched.
 */

async function openBatchEdit() {

    if (!selectedCourse) {
        return;
    }


    const currentName =
        selectedCourse.name ||
        selectedCourse.courseName ||
        selectedCourse.title ||
        "";


    const name =
        prompt(
            "Batch Name",
            currentName
        );


    if (
        name === null
    ) {
        return;
    }


    const trimmedName =
        name.trim();


    if (!trimmedName) {

        showToast(
            "Error",
            "Batch name cannot be empty."
        );

        return;

    }


    try {

        await updateDoc(
            doc(
                db,
                COURSES,
                selectedCourseId
            ),

            {
                name:
                    trimmedName,

                updatedAt:
                    serverTimestamp()
            }
        );


        await loadSelectedBatch();


        showToast(
            "Saved",
            "Batch name updated."
        );

    }

    catch (error) {

        console.error(
            error
        );


        showToast(
            "Error",
            getErrorMessage(error)
        );

    }

}



/* =====================================================
   CONFIRMATION SYSTEM
===================================================== */

function askConfirmation(
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
            "confirmMessage"
        )
        .innerHTML =
        message;


    pendingDelete =
        callback;


    openModal(
        confirmModal
    );

}


document
    .getElementById(
        "confirmDelete"
    )
    .addEventListener(
        "click",

        async () => {

            if (
                !pendingDelete
            ) {
                return;
            }


            const callback =
                pendingDelete;


            pendingDelete =
                null;


            closeModal(
                confirmModal
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
                    getErrorMessage(error)
                );

            }

        }
    );


document
    .getElementById(
        "confirmCancel"
    )
    .addEventListener(
        "click",

        () => {

            pendingDelete =
                null;

            closeModal(
                confirmModal
            );

        }
    );



/* =====================================================
   MODALS
===================================================== */

document
    .querySelectorAll(
        "[data-close]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",

                () => {

                    const id =
                        button.dataset.close;


                    const modal =
                        document.getElementById(
                            id
                        );


                    closeModal(
                        modal
                    );

                }
            );

        }
    );



function openModal(
    modal
) {

    modal.classList.remove(
        "hidden"
    );

}


function closeModal(
    modal
) {

    modal.classList.add(
        "hidden"
    );

}



/* =====================================================
   REPLACEMENT PROGRESS
===================================================== */

function showReplaceProgress(
    percentage
) {

    const wrapper =
        document.getElementById(
            "replaceProgress"
        );


    const bar =
        document.getElementById(
            "replaceProgressBar"
        );


    const text =
        document.getElementById(
            "replaceProgressText"
        );


    wrapper.classList.remove(
        "hidden"
    );


    bar.style.width =
        `${percentage}%`;


    text.textContent =
        `${percentage}%`;

}


function hideReplaceProgress() {

    document
        .getElementById(
            "replaceProgress"
        )
        .classList.add(
            "hidden"
        );


    document
        .getElementById(
            "replaceProgressBar"
        )
        .style.width =
        "0%";

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
   ERROR MESSAGE
===================================================== */

function getErrorMessage(
    error
) {

    console.error(
        "Firebase error:",
        error
    );


    if (
        error?.code ===
        "permission-denied"
    ) {

        return (
            "Permission denied. Check your Firestore/Storage rules."
        );

    }


    if (
        error?.code ===
        "storage/unauthorized"
    ) {

        return (
            "Storage permission denied. Check your Storage rules."
        );

    }


    if (
        error?.code ===
        "storage/object-not-found"
    ) {

        return (
            "The Storage file was not found."
        );

    }


    return (
        error?.message ||
        "Something went wrong."
    );

}



/* =====================================================
   ESCAPE HTML
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

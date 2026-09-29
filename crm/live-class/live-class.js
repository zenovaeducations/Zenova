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
    updateDoc,
    doc,
    orderBy,
    limit,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   DOM
========================================================= */

const form =
    document.getElementById("liveForm");

const titleInput =
    document.getElementById("title");

const teacherInput =
    document.getElementById("teacher");

const courseSelect =
    document.getElementById("course");

const subjectSelect =
    document.getElementById("subject");

const chapterSelect =
    document.getElementById("chapter");

const thumbnailInput =
    document.getElementById("thumbnail");

const contentSelect =
    document.getElementById("content");

const contentPreview =
    document.getElementById("contentPreview");

const contentPreviewTitle =
    document.getElementById("contentPreviewTitle");

const contentPreviewMeta =
    document.getElementById("contentPreviewMeta");

const youtubeUrl =
    document.getElementById("youtubeUrl");

const externalUrl =
    document.getElementById("externalUrl");

const dateInput =
    document.getElementById("date");

const startTimeInput =
    document.getElementById("startTime");

const endDateInput =
    document.getElementById("endDate");

const endTimeInput =
    document.getElementById("endTime");

const descriptionInput =
    document.getElementById("description");

const activeInput =
    document.getElementById("active");

const recordedSection =
    document.getElementById("recordedSection");

const youtubeSection =
    document.getElementById("youtubeSection");

const externalSection =
    document.getElementById("externalSection");

const message =
    document.getElementById("message");

const saveButton =
    document.getElementById("saveButton");

const classesContainer =
    document.getElementById("classes");

const refreshButton =
    document.getElementById("refresh");

const filterButtons =
    document.querySelectorAll(
        ".filter-button"
    );


/* MODAL */

const editModal =
    document.getElementById("editModal");

const closeModal =
    document.getElementById("closeModal");

const cancelEdit =
    document.getElementById("cancelEdit");

const saveEdit =
    document.getElementById("saveEdit");

const editId =
    document.getElementById("editId");

const editTitle =
    document.getElementById("editTitle");

const editDate =
    document.getElementById("editDate");

const editStartTime =
    document.getElementById("editStartTime");

const editEndDate =
    document.getElementById("editEndDate");

const editEndTime =
    document.getElementById("editEndTime");

const editTeacher =
    document.getElementById("editTeacher");

const editStatus =
    document.getElementById("editStatus");


/* =========================================================
   STATE
========================================================= */

let allClasses = [];

let currentFilter =
    "ALL";

let contentCache = [];

let editingClassData = null;


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.replace(
                "../../account/login/"
            );

            return;
        }

        await loadCourses();

        await loadClasses();

    }
);


/* =========================================================
   DEFAULT DATE
========================================================= */

setDefaultDates();


function setDefaultDates() {

    const today =
        new Date();

    const date =
        formatDateInput(
            today
        );

    dateInput.value =
        date;

    endDateInput.value =
        date;
}


/* =========================================================
   LIVE TYPE
========================================================= */

document
    .querySelectorAll(
        'input[name="liveType"]'
    )
    .forEach(
        radio => {

            radio.addEventListener(
                "change",
                updateLiveTypeUI
            );

        }
    );


function getLiveType() {

    const selected =
        document.querySelector(
            'input[name="liveType"]:checked'
        );

    return selected
        ? selected.value
        : "RECORDED_VIDEO";
}


function updateLiveTypeUI() {

    const type =
        getLiveType();


    recordedSection.classList.toggle(
        "hidden",
        type !== "RECORDED_VIDEO"
    );

    youtubeSection.classList.toggle(
        "hidden",
        type !== "YOUTUBE"
    );

    externalSection.classList.toggle(
        "hidden",
        type !== "EXTERNAL_URL"
    );

}


/* =========================================================
   COURSE
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


        const courses =
            snapshot.docs
                .map(
                    item => ({
                        id: item.id,
                        ...item.data()
                    })
                )
                .filter(
                    item =>
                        item.active !== false
                )
                .sort(
                    sortByOrder
                );


        courses.forEach(
            data => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    data.id;

                option.textContent =
                    data.name ||
                    data.title ||
                    data.courseName ||
                    data.crmCourseName ||
                    "Course";

                option.dataset.name =
                    option.textContent;

                courseSelect.appendChild(
                    option
                );

            }
        );

    } catch (error) {

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
   SUBJECTS
========================================================= */

courseSelect.addEventListener(
    "change",
    async () => {

        resetSubject();

        resetChapter();

        resetContent();

        if (!courseSelect.value) {
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
                        courseSelect.value
                    )
                );


            const snapshot =
                await getDocs(q);


            const subjects =
                snapshot.docs
                    .map(
                        item => ({
                            id: item.id,
                            ...item.data()
                        })
                    )
                    .filter(
                        item =>
                            item.active !== false
                    )
                    .sort(
                        sortByOrder
                    );


            subjects.forEach(
                data => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        data.id;

                    option.textContent =
                        data.name ||
                        data.title ||
                        data.subjectName ||
                        data.subject ||
                        "Subject";

                    option.dataset.name =
                        option.textContent;

                    subjectSelect.appendChild(
                        option
                    );

                }
            );


            subjectSelect.disabled =
                subjects.length === 0;

        } catch (error) {

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
);


/* =========================================================
   CHAPTERS
========================================================= */

subjectSelect.addEventListener(
    "change",
    async () => {

        resetChapter();

        resetContent();

        if (!subjectSelect.value) {
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
                        subjectSelect.value
                    )
                );


            const snapshot =
                await getDocs(q);


            const chapters =
                snapshot.docs
                    .map(
                        item => ({
                            id: item.id,
                            ...item.data()
                        })
                    )
                    .filter(
                        item =>
                            item.active !== false
                    )
                    .sort(
                        sortByOrder
                    );


            chapters.forEach(
                data => {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        data.id;

                    option.textContent =
                        data.name ||
                        data.title ||
                        data.chapterName ||
                        data.chapterTitle ||
                        "Chapter";

                    option.dataset.name =
                        option.textContent;

                    chapterSelect.appendChild(
                        option
                    );

                }
            );


            chapterSelect.disabled =
                chapters.length === 0;


            /*
               Load content even if
               chapter isn't mandatory.
            */

            if (
                chapters.length === 0
            ) {

                await loadContent();
            }

        } catch (error) {

            console.error(
                "Chapter loading error:",
                error
            );
        }

    }
);


/* =========================================================
   CHAPTER CHANGE
========================================================= */

chapterSelect.addEventListener(
    "change",
    async () => {

        resetContent();

        await loadContent();

    }
);


/* =========================================================
   CONTENT
========================================================= */

async function loadContent() {

    if (!courseSelect.value) {
        return;
    }


    contentSelect.disabled =
        true;

    contentSelect.innerHTML = `
        <option value="">
            Loading videos...
        </option>
    `;


    try {

        let snapshot;


        /*
           If chapter exists,
           load directly by chapter.
        */

        if (
            chapterSelect.value
        ) {

            const q =
                query(
                    collection(
                        db,
                        "zen2Content"
                    ),
                    where(
                        "chapterId",
                        "==",
                        chapterSelect.value
                    )
                );

            snapshot =
                await getDocs(q);

        } else {

            /*
               No chapter selected:
               load course content.
            */

            const q =
                query(
                    collection(
                        db,
                        "zen2Content"
                    ),
                    where(
                        "courseId",
                        "==",
                        courseSelect.value
                    )
                );

            snapshot =
                await getDocs(q);
        }


        contentCache =
            snapshot.docs
                .map(
                    item => ({
                        id: item.id,
                        ...item.data()
                    })
                )
                .filter(
                    item =>
                        item.active !== false &&
                        String(
                            item.contentType || ""
                        ).toUpperCase() === "VIDEO"
                )
                .sort(
                    sortByOrder
                );


        contentSelect.innerHTML = `
            <option value="">
                Select Video
            </option>
        `;


        contentCache.forEach(
            item => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    item.id;

                option.textContent =
                    item.title ||
                    "Video";

                contentSelect.appendChild(
                    option
                );

            }
        );


        contentSelect.disabled =
            contentCache.length === 0;


        if (
            contentCache.length === 0
        ) {

            contentSelect.innerHTML = `
                <option value="">
                    No videos found
                </option>
            `;
        }

    } catch (error) {

        console.error(
            "Content loading error:",
            error
        );

        contentSelect.innerHTML = `
            <option value="">
                Unable to load videos
            </option>
        `;
    }

}


/* =========================================================
   CONTENT SELECT
========================================================= */

contentSelect.addEventListener(
    "change",
    () => {

        const selected =
            contentCache.find(
                item =>
                    item.id ===
                    contentSelect.value
            );


        if (!selected) {

            contentPreview.classList.add(
                "hidden"
            );

            return;
        }


        contentPreviewTitle.textContent =
            selected.title ||
            "Video";


        const duration =
            selected.duration
                ? formatDuration(
                    selected.duration
                )
                : "Video";


        const access =
            selected.accessType ||
            "";


        contentPreviewMeta.textContent =
            access
                ? `${duration} • ${access}`
                : duration;


        contentPreview.classList.remove(
            "hidden"
        );

    }
);


/* =========================================================
   SAVE
========================================================= */

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        clearMessage();


        const title =
            titleInput.value.trim();

        const teacher =
            teacherInput.value.trim();

        const thumbnail =
            thumbnailInput.value.trim();

        const date =
            dateInput.value;

        const startTime =
            startTimeInput.value;

        const endDate =
            endDateInput.value ||
            date;

        const endTime =
            endTimeInput.value;

        const liveType =
            getLiveType();

        const accessType =
            document.querySelector(
                'input[name="accessType"]:checked'
            )?.value ||
            "PAID";


        if (
            !title ||
            !teacher ||
            !courseSelect.value ||
            !subjectSelect.value ||
            !date ||
            !startTime ||
            !endTime
        ) {

            showMessage(
                "Please fill all required fields.",
                "error"
            );

            return;
        }


        if (
            liveType ===
            "RECORDED_VIDEO" &&
            !contentSelect.value
        ) {

            showMessage(
                "Please select the recorded video.",
                "error"
            );

            return;
        }


        if (
            liveType ===
            "YOUTUBE" &&
            !youtubeUrl.value.trim()
        ) {

            showMessage(
                "Please enter the YouTube Live URL.",
                "error"
            );

            return;
        }


        if (
            liveType ===
            "EXTERNAL_URL" &&
            !externalUrl.value.trim()
        ) {

            showMessage(
                "Please enter the external video URL.",
                "error"
            );

            return;
        }


        const startDateTime =
            `${date}T${startTime}`;

        const endDateTime =
            `${endDate}T${endTime}`;


        if (
            new Date(endDateTime) <=
            new Date(startDateTime)
        ) {

            showMessage(
                "End time must be after start time.",
                "error"
            );

            return;
        }


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


        const selectedContent =
            contentCache.find(
                item =>
                    item.id ===
                    contentSelect.value
            );


        const data = {

            title,

            teacherName:
                teacher,

            facultyName:
                teacher,


            courseId:
                courseSelect.value,

            courseName:
                courseOption?.dataset.name ||
                courseOption?.textContent ||
                "",


            subjectId:
                subjectSelect.value,

            subjectName:
                subjectOption?.dataset.name ||
                subjectOption?.textContent ||
                "",


            chapterId:
                chapterSelect.value ||
                null,

            chapterName:
                chapterSelect.value
                    ? (
                        chapterOption?.dataset.name ||
                        chapterOption?.textContent ||
                        null
                    )
                    : null,


            thumbnailUrl:
                thumbnail ||
                selectedContent?.thumbnailUrl ||
                null,


            /*
               MAIN LIVE MODE
            */

            liveType,

            mode:
                liveType ===
                "RECORDED_VIDEO"
                    ? "RECORDED_LIVE"
                    : liveType,


            /*
               Recorded video
            */

            contentId:
                liveType ===
                "RECORDED_VIDEO"
                    ? contentSelect.value
                    : null,


            videoUrl:
                liveType ===
                "RECORDED_VIDEO"
                    ? (
                        selectedContent?.videoUrl ||
                        selectedContent?.playbackUrl ||
                        selectedContent?.fileUrl ||
                        null
                    )
                    : null,


            /*
               YouTube
            */

            youtubeLiveUrl:
                liveType === "YOUTUBE"
                    ? youtubeUrl.value.trim()
                    : null,


            youtubeUrl:
                liveType === "YOUTUBE"
                    ? youtubeUrl.value.trim()
                    : null,


            /*
               External
            */

            externalVideoUrl:
                liveType === "EXTERNAL_URL"
                    ? externalUrl.value.trim()
                    : null,


            /*
               Schedule
            */

            scheduledDate:
                date,

            scheduledTime:
                startTime,

            startTime,

            endDate,

            endTime,

            startDateTime,

            endDateTime,


            /*
               Access
            */

            accessType,

            requiresPurchase:
                accessType === "PAID",


            /*
               Status
            */

            status:
                "SCHEDULED",

            active:
                activeInput.checked,


            description:
                descriptionInput.value.trim() ||
                null,


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


            resetForm();

            await loadClasses();

        } catch (error) {

            console.error(
                "Save error:",
                error
            );

            showMessage(
                error.message ||
                "Unable to schedule class.",
                "error"
            );

        } finally {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "SCHEDULE LIVE CLASS";

        }

    }
);


/* =========================================================
   LOAD CLASSES
========================================================= */

async function loadClasses() {

    classesContainer.innerHTML = `
        <div class="loading-card">
            Loading classes...
        </div>
    `;


    try {

        let snapshot;


        try {

            snapshot =
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
                        limit(100)
                    )
                );

        } catch {

            snapshot =
                await getDocs(
                    collection(
                        db,
                        "liveClasses"
                    )
                );
        }


        allClasses =
            snapshot.docs
                .map(
                    item => ({
                        id: item.id,
                        ...item.data()
                    })
                )
                .sort(
                    sortByDateTime
                );


        renderClasses();

    } catch (error) {

        console.error(
            "Load classes error:",
            error
        );

        classesContainer.innerHTML = `
            <div class="empty-card">
                Unable to load live classes.
            </div>
        `;
    }

}


/* =========================================================
   RENDER
========================================================= */

function renderClasses() {

    const filtered =
        allClasses.filter(
            item =>
                matchesFilter(
                    item,
                    currentFilter
                )
        );


    if (
        filtered.length === 0
    ) {

        classesContainer.innerHTML = `
            <div class="empty-card">
                No classes found.
            </div>
        `;

        return;
    }


    classesContainer.innerHTML =
        filtered
            .map(
                createClassCard
            )
            .join("");


    attachClassActions();

}


/* =========================================================
   STATUS
========================================================= */

function getClassStatus(data) {

    if (
        data.status ===
        "CANCELLED"
    ) {

        return "CANCELLED";
    }


    const start =
        getStartDate(
            data
        );

    const end =
        getEndDate(
            data
        );


    const now =
        Date.now();


    if (
        start &&
        now < start
    ) {

        return "SCHEDULED";
    }


    if (
        start &&
        end &&
        now >= start &&
        now < end
    ) {

        return "LIVE";
    }


    if (
        end &&
        now >= end
    ) {

        return "ENDED";
    }


    return "SCHEDULED";
}


/* =========================================================
   CARD
========================================================= */

function createClassCard(data) {

    const status =
        getClassStatus(
            data
        );


    const type =
        getLiveTypeLabel(
            data.liveType ||
            data.mode
        );


    const date =
        data.scheduledDate ||
        "-";


    const start =
        data.startTime ||
        data.scheduledTime ||
        "-";


    const end =
        data.endTime ||
        "-";


    const thumbnail =
        data.thumbnailUrl;


    const imageHTML =
        thumbnail
            ? `
                <img
                    src="${escapeHtml(thumbnail)}"
                    alt=""
                    onerror="this.parentElement.innerHTML='<div class=&quot;class-thumbnail-placeholder&quot;>LIVE</div>'"
                >
            `
            : `
                <div class="class-thumbnail-placeholder">
                    LIVE
                </div>
            `;


    return `

        <div
            class="class-card"
            data-id="${escapeHtml(data.id)}"
        >

            <div class="class-thumbnail">
                ${imageHTML}
            </div>


            <div class="class-main">

                <div class="class-title-row">

                    <div class="class-title">
                        ${escapeHtml(
                            data.title ||
                            "Live Class"
                        )}
                    </div>

                    <span
                        class="status ${status.toLowerCase()}"
                    >
                        ${status}
                    </span>

                </div>


                <div class="class-info">

                    ${escapeHtml(
                        data.courseName ||
                        "-"
                    )}

                    •

                    ${escapeHtml(
                        data.subjectName ||
                        "-"
                    )}

                    ${
                        data.chapterName
                            ? ` • ${escapeHtml(
                                data.chapterName
                            )}`
                            : ""
                    }

                    <br>

                    Faculty:
                    ${escapeHtml(
                        data.teacherName ||
                        data.facultyName ||
                        "-"
                    )}

                    <br>

                    ${escapeHtml(date)}
                    •
                    ${escapeHtml(start)}
                    –
                    ${escapeHtml(end)}

                </div>


                <div class="class-type">

                    ${escapeHtml(type)}

                    ${
                        data.accessType ===
                        "FREE"
                            ? " • FREE"
                            : " • PAID"
                    }

                </div>

            </div>


            <div class="class-actions">

                ${
                    status === "LIVE"
                        ? `
                            <button
                                class="action-button live-action"
                                data-action="view"
                                data-id="${escapeHtml(data.id)}"
                                type="button"
                            >
                                View Live
                            </button>
                        `
                        : ""
                }


                <button
                    class="action-button"
                    data-action="edit"
                    data-id="${escapeHtml(data.id)}"
                    type="button"
                >
                    Edit
                </button>


                <button
                    class="action-button delete"
                    data-action="delete"
                    data-id="${escapeHtml(data.id)}"
                    type="button"
                >
                    Delete
                </button>

            </div>

        </div>

    `;

}


/* =========================================================
   ACTIONS
========================================================= */

function attachClassActions() {

    document
        .querySelectorAll(
            ".action-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const id =
                            button.dataset.id;

                        const action =
                            button.dataset.action;


                        const item =
                            allClasses.find(
                                data =>
                                    data.id === id
                            );


                        if (!item) {
                            return;
                        }


                        if (
                            action ===
                            "edit"
                        ) {

                            openEditModal(
                                item
                            );

                            return;
                        }


                        if (
                            action ===
                            "delete"
                        ) {

                            await deleteClass(
                                item
                            );

                            return;
                        }


                        if (
                            action ===
                            "view"
                        ) {

                            window.open(
                                `../../home/livevideoplayer/?liveClassId=${encodeURIComponent(id)}`,
                                "_blank"
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   DELETE
========================================================= */

async function deleteClass(
    item
) {

    const confirmed =
        confirm(
            `Delete "${item.title || "this class"}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await deleteDoc(
            doc(
                db,
                "liveClasses",
                item.id
            )
        );


        await loadClasses();

    } catch (error) {

        console.error(
            "Delete error:",
            error
        );

        alert(
            "Delete failed."
        );
    }

}


/* =========================================================
   EDIT MODAL
========================================================= */

function openEditModal(
    item
) {

    editingClassData =
        item;


    editId.value =
        item.id;

    editTitle.value =
        item.title || "";

    editTeacher.value =
        item.teacherName ||
        item.facultyName ||
        "";

    editDate.value =
        item.scheduledDate ||
        "";

    editStartTime.value =
        item.startTime ||
        item.scheduledTime ||
        "";

    editEndDate.value =
        item.endDate ||
        item.scheduledDate ||
        "";

    editEndTime.value =
        item.endTime ||
        "";

    editStatus.value =
        item.status ===
        "CANCELLED"
            ? "CANCELLED"
            : "SCHEDULED";


    editModal.classList.remove(
        "hidden"
    );
}


function closeEditModal() {

    editModal.classList.add(
        "hidden"
    );

    editingClassData =
        null;
}


closeModal.addEventListener(
    "click",
    closeEditModal
);

cancelEdit.addEventListener(
    "click",
    closeEditModal
);


editModal
    .querySelector(
        ".modal-backdrop"
    )
    .addEventListener(
        "click",
        closeEditModal
);


/* =========================================================
   SAVE EDIT
========================================================= */

saveEdit.addEventListener(
    "click",
    async () => {

        if (
            !editingClassData
        ) {
            return;
        }


        const id =
            editingClassData.id;


        const updated = {

            title:
                editTitle.value.trim(),

            teacherName:
                editTeacher.value.trim(),

            facultyName:
                editTeacher.value.trim(),

            scheduledDate:
                editDate.value,

            scheduledTime:
                editStartTime.value,

            startTime:
                editStartTime.value,

            endDate:
                editEndDate.value ||
                editDate.value,

            endTime:
                editEndTime.value,

            status:
                editStatus.value

        };


        if (
            !updated.title ||
            !updated.scheduledDate ||
            !updated.startTime ||
            !updated.endTime
        ) {

            alert(
                "Please fill all required fields."
            );

            return;
        }


        try {

            saveEdit.disabled =
                true;

            saveEdit.textContent =
                "Saving...";


            await updateDoc(
                doc(
                    db,
                    "liveClasses",
                    id
                ),
                updated
            );


            closeEditModal();

            await loadClasses();

        } catch (error) {

            console.error(
                "Edit error:",
                error
            );

            alert(
                "Unable to save changes."
            );

        } finally {

            saveEdit.disabled =
                false;

            saveEdit.textContent =
                "Save Changes";
        }

    }
);


/* =========================================================
   FILTERS
========================================================= */

filterButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                filterButtons.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );


                button.classList.add(
                    "active"
                );


                currentFilter =
                    button.dataset.filter;


                renderClasses();

            }
        );

    }
);


function matchesFilter(
    item,
    filter
) {

    if (
        filter ===
        "ALL"
    ) {
        return true;
    }


    return (
        getClassStatus(item) ===
        filter
    );
}


/* =========================================================
   RESET FORM
========================================================= */

function resetForm() {

    form.reset();

    setDefaultDates();

    resetSubject();

    resetChapter();

    resetContent();

    activeInput.checked =
        true;

    document
        .querySelector(
            'input[name="liveType"][value="RECORDED_VIDEO"]'
        )
        .checked = true;

    document
        .querySelector(
            'input[name="accessType"][value="PAID"]'
        )
        .checked = true;


    updateLiveTypeUI();

}


/* =========================================================
   RESET SUBJECT
========================================================= */

function resetSubject() {

    subjectSelect.innerHTML = `
        <option value="">
            Select Subject
        </option>
    `;

    subjectSelect.disabled =
        true;
}


/* =========================================================
   RESET CHAPTER
========================================================= */

function resetChapter() {

    chapterSelect.innerHTML = `
        <option value="">
            Select Chapter
        </option>
    `;

    chapterSelect.disabled =
        true;
}


/* =========================================================
   RESET CONTENT
========================================================= */

function resetContent() {

    contentCache =
        [];

    contentSelect.innerHTML = `
        <option value="">
            Select course, subject and chapter first
        </option>
    `;

    contentSelect.disabled =
        true;

    contentPreview.classList.add(
        "hidden"
    );
}


/* =========================================================
   REFRESH
========================================================= */

refreshButton.addEventListener(
    "click",
    loadClasses
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
   SORT
========================================================= */

function sortByOrder(
    a,
    b
) {

    return (
        Number(a.order || 0) -
        Number(b.order || 0)
    );
}


function sortByDateTime(
    a,
    b
) {

    const aDate =
        getStartDate(a) ||
        0;

    const bDate =
        getStartDate(b) ||
        0;

    return aDate - bDate;
}


/* =========================================================
   DATE HELPERS
========================================================= */

function getStartDate(
    item
) {

    if (
        item.startDateTime
    ) {

        const parsed =
            Date.parse(
                item.startDateTime
            );

        if (
            !Number.isNaN(parsed)
        ) {
            return parsed;
        }
    }


    const date =
        item.scheduledDate;

    const time =
        item.startTime ||
        item.scheduledTime;


    if (
        date &&
        time
    ) {

        const parsed =
            Date.parse(
                `${date}T${time}`
            );

        if (
            !Number.isNaN(parsed)
        ) {
            return parsed;
        }
    }


    return null;
}


function getEndDate(
    item
) {

    if (
        item.endDateTime
    ) {

        const parsed =
            Date.parse(
                item.endDateTime
            );

        if (
            !Number.isNaN(parsed)
        ) {
            return parsed;
        }
    }


    const date =
        item.endDate ||
        item.scheduledDate;

    const time =
        item.endTime;


    if (
        date &&
        time
    ) {

        const parsed =
            Date.parse(
                `${date}T${time}`
            );

        if (
            !Number.isNaN(parsed)
        ) {
            return parsed;
        }
    }


    return null;
}


function formatDateInput(
    date
) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${year}-${month}-${day}`;
}


/* =========================================================
   TYPE LABEL
========================================================= */

function getLiveTypeLabel(
    type
) {

    const value =
        String(
            type || ""
        )
        .toUpperCase();


    if (
        value ===
        "RECORDED_VIDEO" ||
        value ===
        "RECORDED_LIVE" ||
        value ===
        "VIDEO"
    ) {

        return "RECORDED AS LIVE";
    }


    if (
        value ===
        "YOUTUBE" ||
        value ===
        "YOUTUBE_LIVE"
    ) {

        return "YOUTUBE LIVE";
    }


    if (
        value ===
        "EXTERNAL_URL" ||
        value ===
        "EXTERNAL"
    ) {

        return "EXTERNAL URL";
    }


    return "LIVE";
}


/* =========================================================
   DURATION
========================================================= */

function formatDuration(
    value
) {

    if (
        typeof value ===
        "string"
    ) {

        return value;
    }


    if (
        !Number.isFinite(
            Number(value)
        )
    ) {

        return "Video";
    }


    let seconds =
        Number(value);


    if (
        seconds > 100000
    ) {

        seconds =
            seconds / 1000;
    }


    seconds =
        Math.floor(
            seconds
        );


    const hours =
        Math.floor(
            seconds / 3600
        );

    const minutes =
        Math.floor(
            (seconds % 3600) / 60
        );

    const secs =
        seconds % 60;


    if (
        hours > 0
    ) {

        return `${hours}h ${minutes}m`;
    }


    return `${minutes}m ${secs}s`;
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

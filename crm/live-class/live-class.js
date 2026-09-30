import {
    auth,
    db
} from "../../firebase/firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFunctions,
    httpsCallable
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-functions.js";

import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

/* =========================================================
   FIREBASE FUNCTIONS
========================================================= */

const functions =
    getFunctions(undefined, "asia-south1");

const createZoomMeeting =
    httpsCallable(
        functions,
        "createZoomMeeting"
    );

/* =========================================================
   DOM
========================================================= */

const form =
    document.getElementById("liveForm");

const formPanel =
    document.getElementById("formPanel");

const newClassBtn =
    document.getElementById("newClassBtn");

const closeFormBtn =
    document.getElementById("closeFormBtn");

const cancelBtn =
    document.getElementById("cancelBtn");

const refreshBtn =
    document.getElementById("refreshBtn");

const saveButton =
    document.getElementById("saveButton");

const titleInput =
    document.getElementById("title");

const teacherInput =
    document.getElementById("teacherName");

const liveType =
    document.getElementById("liveType");

const course =
    document.getElementById("course");

const subject =
    document.getElementById("subject");

const chapter =
    document.getElementById("chapter");

const thumbnailInput =
    document.getElementById("thumbnailUrl");

const dateStart =
    document.getElementById("dateStart");

const timeStart =
    document.getElementById("timeStart");

const dateEnd =
    document.getElementById("dateEnd");

const timeEnd =
    document.getElementById("timeEnd");

const duration =
    document.getElementById("duration");

const accessType =
    document.getElementById("accessType");

const description =
    document.getElementById("description");

const classesList =
    document.getElementById("classesList");

const loading =
    document.getElementById("loading");

const emptyState =
    document.getElementById("emptyState");

const upcomingCount =
    document.getElementById("upcomingCount");

const liveCount =
    document.getElementById("liveCount");

const completedCount =
    document.getElementById("completedCount");

const zoomInfo =
    document.getElementById("zoomInfo");

const providerFields =
    document.getElementById("providerFields");

const toast =
    document.getElementById("toast");

/* =========================================================
   STATE
========================================================= */

let courses = [];
let subjects = [];
let chapters = [];
let liveClasses = [];

let editingId = null;

/* =========================================================
   IMPORTANT
   Disable browser native required validation.

   This prevents the browser from stopping submission
   before our JavaScript can handle the form.
========================================================= */

if (form) {
    form.noValidate = true;
}

/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "../../account/login/";

            return;
        }

        await loadAll();

    }
);

/* =========================================================
   TOAST
========================================================= */

function showToast(message) {

    if (!toast) {
        alert(message);
        return;
    }

    toast.textContent =
        message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 3500);
}

/* =========================================================
   DATE / TIME
========================================================= */

function createDateTime(date, time) {

    if (!date || !time) {
        return null;
    }

    return `${date}T${time}:00+05:30`;
}

function getStatus(item) {

    const now =
        new Date();

    const start =
        item.startDateTime
            ? new Date(item.startDateTime)
            : null;

    const end =
        item.endDateTime
            ? new Date(item.endDateTime)
            : null;

    if (!start) {
        return "UPCOMING";
    }

    if (
        start <= now &&
        end &&
        now <= end
    ) {

        return "LIVE";
    }

    if (
        end &&
        now > end
    ) {

        return "COMPLETED";
    }

    return "UPCOMING";
}

/* =========================================================
   GET SELECTED OPTION TEXT
========================================================= */

function getSelectedText(selectElement) {

    if (
        !selectElement ||
        selectElement.selectedIndex < 0
    ) {
        return "";
    }

    const option =
        selectElement.options[
            selectElement.selectedIndex
        ];

    return option?.textContent?.trim() || "";
}

/* =========================================================
   LOAD COURSES
========================================================= */

async function loadCourses() {

    if (!course) {
        return;
    }

    const snap =
        await getDocs(
            collection(
                db,
                "zen2Courses"
            )
        );

    courses =
        snap.docs.map(
            d => ({
                id: d.id,
                ...d.data()
            })
        );

    courses.sort(
        (a, b) =>
            Number(a.order || 0) -
            Number(b.order || 0)
    );

    course.innerHTML =
        `<option value="">Select Course</option>`;

    courses.forEach(
        item => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                item.id;

            option.textContent =
                item.name ||
                item.title ||
                item.courseName ||
                item.className ||
                "Course";

            course.appendChild(
                option
            );

        }
    );

}

/* =========================================================
   LOAD SUBJECTS
========================================================= */

async function loadSubjects(courseId) {

    if (!subject || !chapter) {
        return;
    }

    subject.innerHTML =
        `<option value="">Select Subject</option>`;

    chapter.innerHTML =
        `<option value="">Select Chapter</option>`;

    subject.disabled = true;
    chapter.disabled = true;

    subjects = [];
    chapters = [];

    if (!courseId) {
        return;
    }

    const snap =
        await getDocs(
            collection(
                db,
                "zen2Subjects"
            )
        );

    subjects =
        snap.docs
            .map(
                d => ({
                    id: d.id,
                    ...d.data()
                })
            )
            .filter(
                item =>
                    item.courseId === courseId &&
                    item.active !== false
            );

    subjects.sort(
        (a, b) =>
            Number(a.order || 0) -
            Number(b.order || 0)
    );

    subjects.forEach(
        item => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                item.id;

            option.textContent =
                item.name ||
                item.title ||
                item.subjectName ||
                "Subject";

            subject.appendChild(
                option
            );

        }
    );

    subject.disabled =
        subjects.length === 0;

}

/* =========================================================
   LOAD CHAPTERS
========================================================= */

async function loadChapters(subjectId) {

    if (!chapter) {
        return;
    }

    chapter.innerHTML =
        `<option value="">Select Chapter</option>`;

    chapter.disabled = true;

    chapters = [];

    if (!subjectId) {
        return;
    }

    const snap =
        await getDocs(
            collection(
                db,
                "zen2Chapters"
            )
        );

    chapters =
        snap.docs
            .map(
                d => ({
                    id: d.id,
                    ...d.data()
                })
            )
            .filter(
                item =>
                    item.subjectId === subjectId &&
                    item.active !== false
            );

    chapters.sort(
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

    chapters.forEach(
        item => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                item.id;

            option.textContent =
                item.name ||
                item.title ||
                item.chapterName ||
                "Chapter";

            chapter.appendChild(
                option
            );

        }
    );

    chapter.disabled =
        chapters.length === 0;

}

/* =========================================================
   COURSE CHANGE
========================================================= */

if (course) {

    course.addEventListener(
        "change",
        async () => {

            await loadSubjects(
                course.value
            );

        }
    );

}

/* =========================================================
   SUBJECT CHANGE
========================================================= */

if (subject) {

    subject.addEventListener(
        "change",
        async () => {

            await loadChapters(
                subject.value
            );

        }
    );

}

/* =========================================================
   LIVE TYPE
========================================================= */

function updateProviderFields() {

    if (!liveType) {
        return;
    }

    const type =
        liveType.value;

    if (type === "ZOOM") {

        if (zoomInfo) {
            zoomInfo.style.display =
                "flex";
        }

        if (providerFields) {
            providerFields.innerHTML =
                "";
        }

        return;
    }

    if (zoomInfo) {
        zoomInfo.style.display =
            "none";
    }

    if (!providerFields) {
        return;
    }

    if (type === "YOUTUBE_LIVE") {

        providerFields.innerHTML = `
            <div class="field">
                <label>YouTube Live URL</label>

                <input
                    id="providerUrl"
                    type="url"
                    placeholder="https://youtube.com/live/..."
                >
            </div>
        `;

    }

    else if (type === "RECORDED_VIDEO") {

        providerFields.innerHTML = `
            <div class="field">
                <label>Recorded Video URL</label>

                <input
                    id="providerUrl"
                    type="url"
                    placeholder="Video URL"
                >
            </div>
        `;

    }

    else {

        providerFields.innerHTML = `
            <div class="field">
                <label>External Video URL</label>

                <input
                    id="providerUrl"
                    type="url"
                    placeholder="https://..."
                >
            </div>
        `;

    }

}

if (liveType) {

    liveType.addEventListener(
        "change",
        updateProviderFields
    );

}

/* =========================================================
   OPEN FORM
========================================================= */

function openForm() {

    if (!formPanel) {
        return;
    }

    formPanel.style.display =
        "block";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}

/* =========================================================
   RESET FORM
========================================================= */

function resetForm() {

    editingId = null;

    if (form) {
        form.reset();
    }

    if (subject) {
        subject.innerHTML =
            `<option value="">Select Subject</option>`;

        subject.disabled = true;
    }

    if (chapter) {
        chapter.innerHTML =
            `<option value="">Select Chapter</option>`;

        chapter.disabled = true;
    }

    subjects = [];
    chapters = [];

    if (zoomInfo) {
        zoomInfo.style.display =
            "flex";
    }

    if (providerFields) {
        providerFields.innerHTML =
            "";
    }

    if (saveButton) {
        saveButton.textContent =
            "Schedule Live Class";
    }

    const formTitle =
        document.getElementById(
            "formTitle"
        );

    if (formTitle) {
        formTitle.textContent =
            "Create Live Class";
    }

}

/* =========================================================
   CLOSE FORM
========================================================= */

function closeForm() {

    if (formPanel) {
        formPanel.style.display =
            "none";
    }

    resetForm();

}

/* =========================================================
   NEW CLASS
========================================================= */

if (newClassBtn) {

    newClassBtn.addEventListener(
        "click",
        () => {

            resetForm();

            openForm();

        }
    );

}

/* =========================================================
   CLOSE BUTTON
========================================================= */

if (closeFormBtn) {

    closeFormBtn.addEventListener(
        "click",
        closeForm
    );

}

/* =========================================================
   CANCEL BUTTON
========================================================= */

if (cancelBtn) {

    cancelBtn.addEventListener(
        "click",
        closeForm
    );

}

/* =========================================================
   BUILD AUTOMATIC TITLE
========================================================= */

function getClassTitle() {

    const manualTitle =
        titleInput?.value?.trim() || "";

    /*
       If admin entered a title,
       ALWAYS use that title.
    */

    if (manualTitle) {
        return manualTitle;
    }

    /*
       If title is empty,
       automatically generate:
       Course • Subject • Chapter
    */

    const courseName =
        getSelectedText(course);

    const subjectName =
        getSelectedText(subject);

    const chapterName =
        getSelectedText(chapter);

    const generatedTitle =
        [
            courseName,
            subjectName,
            chapterName
        ]
            .filter(Boolean)
            .join(" • ");

    if (generatedTitle) {
        return generatedTitle;
    }

    return "Live Class";
}

/* =========================================================
   CREATE ZOOM MEETING
========================================================= */

async function createZoomForClass() {

    const title =
        getClassTitle();

    const scheduledDate =
        dateStart?.value?.trim() || "";

    const scheduledTime =
        timeStart?.value?.trim() || "";

    const minutes =
        Number(
            duration?.value || 60
        );


    if (!title) {
        throw new Error(
            "Class title could not be generated."
        );
    }


    if (!scheduledDate) {
        throw new Error(
            "Please select the start date."
        );
    }


    if (!scheduledTime) {
        throw new Error(
            "Please select the start time."
        );
    }


    if (!minutes || minutes <= 0) {
        throw new Error(
            "Please enter a valid class duration."
        );
    }


    console.log(
        "Creating Zoom meeting:",
        {
            title,
            scheduledDate,
            scheduledTime,
            duration: minutes
        }
    );


    const result =
        await createZoomMeeting({

            title:
                title,

            scheduledDate:
                scheduledDate,

            scheduledTime:
                scheduledTime,

            duration:
                minutes

        });


    if (
        !result ||
        !result.data
    ) {

        throw new Error(
            "Zoom backend returned no meeting data."
        );

    }


    if (
        result.data.success !== true
    ) {

        throw new Error(
            "Zoom meeting creation failed."
        );

    }


    return result.data;
            }

/* =========================================================
   BUILD LIVE CLASS DATA
========================================================= */

function buildData(
    zoomData = null
) {

    const type =
        liveType?.value || "ZOOM";

    const selectedCourseName =
        getSelectedText(course);

    const selectedSubjectName =
        getSelectedText(subject);

    const selectedChapterName =
        getSelectedText(chapter);

    const data = {

        title:
            getClassTitle(),

        teacherName:
            teacherInput?.value?.trim() || "",

        facultyName:
            teacherInput?.value?.trim() || "",

        courseId:
            course?.value || "",

        courseName:
            selectedCourseName || null,

        subjectId:
            subject?.value || "",

        subjectName:
            selectedSubjectName || null,

        chapterId:
            chapter?.value || null,

        chapterName:
            chapter?.value
                ? selectedChapterName || null
                : null,

        thumbnailUrl:
            thumbnailInput?.value?.trim() || null,

        liveType:
            type,

        mode:
            type,

        scheduledDate:
            dateStart?.value || "",

        scheduledTime:
            timeStart?.value || "",

        startTime:
            timeStart?.value || "",

        endDate:
            dateEnd?.value || "",

        endTime:
            timeEnd?.value || "",

        startDateTime:
            createDateTime(
                dateStart?.value,
                timeStart?.value
            ),

        endDateTime:
            createDateTime(
                dateEnd?.value,
                timeEnd?.value
            ),

        accessType:
            accessType?.value || "PAID",

        requiresPurchase:
            accessType?.value === "PAID",

        status:
            "SCHEDULED",

        active:
            true,

        description:
            description?.value?.trim() || null

    };

    /* =====================================================
       ZOOM
    ===================================================== */

    if (
        type === "ZOOM" &&
        zoomData
    ) {

        data.zoomMeetingNumber =
            zoomData.meetingNumber ||
            zoomData.meetingId ||
            null;

        data.zoomMeetingId =
            zoomData.meetingId ||
            zoomData.meetingNumber ||
            null;

        data.zoomPassword =
            zoomData.password ||
            null;

        data.zoomJoinUrl =
            zoomData.joinUrl ||
            null;

        data.zoomStartUrl =
            zoomData.startUrl ||
            null;

        data.zoomCreated =
            true;

    }

    /* =====================================================
       OTHER PROVIDERS
    ===================================================== */

    if (
        type !== "ZOOM"
    ) {

        const providerInput =
            document.getElementById(
                "providerUrl"
            );

        const url =
            providerInput?.value?.trim() || "";

        if (
            type === "YOUTUBE_LIVE"
        ) {

            data.youtubeLiveUrl =
                url || null;

            data.youtubeUrl =
                url || null;

        }

        else if (
            type === "RECORDED_VIDEO"
        ) {

            data.videoUrl =
                url || null;

        }

        else if (
            type === "EXTERNAL_VIDEO"
        ) {

            data.externalVideoUrl =
                url || null;

        }

    }

    return data;

}

/* =========================================================
   VALIDATE FORM
========================================================= */

function validateForm() {

    /*
       TITLE IS NOT REQUIRED.
       It is automatically generated.
    */

    if (!course?.value) {

        showToast(
            "Please select a course."
        );

        return false;
    }

    if (!subject?.value) {

        showToast(
            "Please select a subject."
        );

        return false;
    }

    if (!dateStart?.value) {

        showToast(
            "Please select the start date."
        );

        return false;
    }

    if (!timeStart?.value) {

        showToast(
            "Please select the start time."
        );

        return false;
    }

    if (!dateEnd?.value) {

        showToast(
            "Please select the end date."
        );

        return false;
    }

    if (!timeEnd?.value) {

        showToast(
            "Please select the end time."
        );

        return false;
    }

    const start =
        new Date(
            createDateTime(
                dateStart.value,
                timeStart.value
            )
        );

    const end =
        new Date(
            createDateTime(
                dateEnd.value,
                timeEnd.value
            )
        );

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {

        showToast(
            "Please enter valid date and time."
        );

        return false;
    }

    if (end <= start) {

        showToast(
            "End date/time must be after start date/time."
        );

        return false;
    }

    /*
       Validate provider URL when not Zoom.
    */

    if (
        liveType?.value !== "ZOOM"
    ) {

        const providerInput =
            document.getElementById(
                "providerUrl"
            );

        if (
            !providerInput?.value?.trim()
        ) {

            showToast(
                "Please enter the video/provider URL."
            );

            return false;
        }

    }

    return true;

}

/* =========================================================
   SAVE
========================================================= */

if (form) {

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();
            event.stopPropagation();

            if (!validateForm()) {
                return;
            }

            if (saveButton) {
                saveButton.disabled =
                    true;
            }

            try {

                let zoomData =
                    null;

                /* =========================================
                   CREATE ZOOM ONLY FOR NEW ZOOM CLASS
                ========================================= */

                if (
                    liveType?.value === "ZOOM" &&
                    !editingId
                ) {

                    if (saveButton) {

                        saveButton.textContent =
                            "CREATING ZOOM MEETING...";
                    }

                    zoomData =
                        await createZoomForClass();

                    if (!zoomData) {

                        throw new Error(
                            "Zoom meeting was not created."
                        );

                    }

                }

                if (saveButton) {

                    saveButton.textContent =
                        editingId
                            ? "UPDATING CLASS..."
                            : "SAVING CLASS...";
                }

                const data =
                    buildData(
                        zoomData
                    );

                /* =========================================
                   EDIT EXISTING CLASS
                ========================================= */

                if (editingId) {

                    data.updatedAt =
                        serverTimestamp();

                    /*
                       Do not overwrite existing Zoom data
                       when editing a Zoom class.
                    */

                    const existing =
                        liveClasses.find(
                            item =>
                                item.id === editingId
                        );

                    if (
                        data.liveType === "ZOOM" &&
                        existing
                    ) {

                        data.zoomMeetingNumber =
                            existing.zoomMeetingNumber ||
                            null;

                        data.zoomMeetingId =
                            existing.zoomMeetingId ||
                            null;

                        data.zoomPassword =
                            existing.zoomPassword ||
                            null;

                        data.zoomJoinUrl =
                            existing.zoomJoinUrl ||
                            null;

                        data.zoomStartUrl =
                            existing.zoomStartUrl ||
                            null;

                        data.zoomCreated =
                            existing.zoomCreated ||
                            false;

                    }

                    await updateDoc(
                        doc(
                            db,
                            "liveClasses",
                            editingId
                        ),
                        data
                    );

                    showToast(
                        "Live class updated successfully."
                    );

                }

                /* =========================================
                   CREATE NEW CLASS
                ========================================= */

                else {

                    data.createdAt =
                        serverTimestamp();

                    await addDoc(
                        collection(
                            db,
                            "liveClasses"
                        ),
                        data
                    );

                    if (
                        liveType?.value === "ZOOM"
                    ) {

                        showToast(
                            "Live class scheduled and Zoom meeting created."
                        );

                    }

                    else {

                        showToast(
                            "Live class scheduled successfully."
                        );

                    }

                }

                closeForm();

                await loadLiveClasses();

            }

            catch (error) {

                console.error(
                    "Live class error:",
                    error
                );

                let message =
                    error?.message ||
                    "Unable to save live class.";

                if (
                    error?.code ===
                    "functions/invalid-argument"
                ) {

                    message =
                        "Zoom backend rejected the meeting details.";

                }

                if (
                    error?.code ===
                    "functions/unauthenticated"
                ) {

                    message =
                        "Please login again.";

                }

                if (
                    error?.code ===
                    "functions/internal"
                ) {

                    message =
                        "Zoom/Firebase backend error. Please check Firebase Functions logs.";

                }

                showToast(
                    message
                );

            }

            finally {

                if (saveButton) {

                    saveButton.disabled =
                        false;

                    saveButton.textContent =
                        editingId
                            ? "Update Live Class"
                            : "Schedule Live Class";

                }

            }

        }
    );

}

/* =========================================================
   LOAD LIVE CLASSES
========================================================= */

async function loadLiveClasses() {

    if (loading) {

        loading.classList.remove(
            "hidden"
        );

    }

    if (emptyState) {

        emptyState.classList.add(
            "hidden"
        );

    }

    const snap =
        await getDocs(
            collection(
                db,
                "liveClasses"
            )
        );

    liveClasses =
        snap.docs.map(
            d => ({
                id: d.id,
                ...d.data()
            })
        );

    liveClasses.sort(
        (a, b) => {

            const aa =
                a.startDateTime || "";

            const bb =
                b.startDateTime || "";

            return aa.localeCompare(
                bb
            );

        }
    );

    renderClasses();

}

/* =========================================================
   RENDER CLASSES
========================================================= */

function renderClasses() {

    if (loading) {

        loading.classList.add(
            "hidden"
        );

    }

    let upcoming = 0;
    let live = 0;
    let completed = 0;

    if (classesList) {

        classesList.innerHTML =
            "";

    }

    liveClasses.forEach(
        item => {

            const status =
                getStatus(item);

            if (
                status === "UPCOMING"
            ) {

                upcoming++;

            }

            if (
                status === "LIVE"
            ) {

                live++;

            }

            if (
                status === "COMPLETED"
            ) {

                completed++;

            }

            if (!classesList) {
                return;
            }

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "class-card";

            const isZoom =
                item.liveType ===
                "ZOOM";

            card.innerHTML = `

                <div class="class-main">

                    <div class="class-title">
                        ${escapeHtml(
                            item.title ||
                            "Live Class"
                        )}
                    </div>

                    <div class="class-meta">

                        <span class="badge">
                            ${escapeHtml(
                                item.courseName ||
                                "Course"
                            )}
                        </span>

                        <span class="badge">
                            ${escapeHtml(
                                item.subjectName ||
                                "Subject"
                            )}
                        </span>

                        ${
                            isZoom
                                ? `
                                    <span class="badge zoom">
                                        ZOOM
                                    </span>
                                `
                                : `
                                    <span class="badge">
                                        ${escapeHtml(
                                            item.liveType ||
                                            ""
                                        )}
                                    </span>
                                `
                        }

                        <span class="badge ${status.toLowerCase()}">
                            ${status}
                        </span>

                    </div>

                    ${
                        item.chapterName
                            ? `
                                <p>
                                    Chapter:
                                    ${escapeHtml(
                                        item.chapterName
                                    )}
                                </p>
                            `
                            : ""
                    }

                    ${
                        item.teacherName
                            ? `
                                <p>
                                    Faculty:
                                    ${escapeHtml(
                                        item.teacherName
                                    )}
                                </p>
                            `
                            : ""
                    }

                    <p>
                        ${escapeHtml(
                            item.scheduledDate ||
                            ""
                        )}

                        •

                        ${escapeHtml(
                            item.scheduledTime ||
                            ""
                        )}
                    </p>

                    ${
                        isZoom &&
                        item.zoomMeetingNumber
                            ? `
                                <p>
                                    Zoom Meeting:
                                    <strong>
                                        ${escapeHtml(
                                            String(
                                                item.zoomMeetingNumber
                                            )
                                        )}
                                    </strong>
                                </p>
                            `
                            : ""
                    }

                </div>

                <div class="class-actions">

                    ${
                        isZoom &&
                        item.zoomJoinUrl
                            ? `
                                <button
                                    class="small-btn"
                                    data-action="zoom"
                                    data-id="${item.id}"
                                >
                                    Zoom Link
                                </button>
                            `
                            : ""
                    }

                    <button
                        class="small-btn"
                        data-action="edit"
                        data-id="${item.id}"
                    >
                        Edit
                    </button>

                    <button
                        class="small-btn danger"
                        data-action="delete"
                        data-id="${item.id}"
                    >
                        Delete
                    </button>

                </div>

            `;

            classesList.appendChild(
                card
            );

        }
    );

    if (upcomingCount) {
        upcomingCount.textContent =
            upcoming;
    }

    if (liveCount) {
        liveCount.textContent =
            live;
    }

    if (completedCount) {
        completedCount.textContent =
            completed;
    }

    if (
        emptyState &&
        liveClasses.length === 0
    ) {

        emptyState.classList.remove(
            "hidden"
        );

    }

}

/* =========================================================
   CLASS ACTIONS
========================================================= */

if (classesList) {

    classesList.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    "button"
                );

            if (!button) {
                return;
            }

            const id =
                button.dataset.id;

            const action =
                button.dataset.action;

            const item =
                liveClasses.find(
                    x => x.id === id
                );

            if (!item) {
                return;
            }

            /* =========================================
               ZOOM LINK
            ========================================= */

            if (
                action === "zoom"
            ) {

                if (
                    item.zoomJoinUrl
                ) {

                    window.open(
                        item.zoomJoinUrl,
                        "_blank"
                    );

                }

                return;

            }

            /* =========================================
               DELETE
            ========================================= */

            if (
                action === "delete"
            ) {

                const yes =
                    confirm(
                        "Delete this live class?"
                    );

                if (!yes) {
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

                    showToast(
                        "Live class deleted."
                    );

                    await loadLiveClasses();

                }

                catch (error) {

                    console.error(
                        error
                    );

                    showToast(
                        error?.message ||
                        "Unable to delete live class."
                    );

                }

                return;

            }

            /* =========================================
               EDIT
            ========================================= */

            if (
                action === "edit"
            ) {

                editingId =
                    id;

                resetForm();

                editingId =
                    id;

                openForm();

                titleInput.value =
                    item.title ||
                    "";

                teacherInput.value =
                    item.teacherName ||
                    item.facultyName ||
                    "";

                liveType.value =
                    item.liveType ||
                    "ZOOM";

                thumbnailInput.value =
                    item.thumbnailUrl ||
                    "";

                dateStart.value =
                    item.scheduledDate ||
                    "";

                timeStart.value =
                    item.scheduledTime ||
                    "";

                dateEnd.value =
                    item.endDate ||
                    item.scheduledDate ||
                    "";

                timeEnd.value =
                    item.endTime ||
                    "";

                accessType.value =
                    item.accessType ||
                    "PAID";

                description.value =
                    item.description ||
                    "";

                await loadSubjects(
                    item.courseId
                );

                course.value =
                    item.courseId ||
                    "";

                await loadChapters(
                    item.subjectId
                );

                subject.value =
                    item.subjectId ||
                    "";

                chapter.value =
                    item.chapterId ||
                    "";

                /*
                   Load provider URL.
                */

                updateProviderFields();

                if (
                    item.liveType !==
                    "ZOOM"
                ) {

                    const providerInput =
                        document.getElementById(
                            "providerUrl"
                        );

                    if (providerInput) {

                        if (
                            item.liveType ===
                            "YOUTUBE_LIVE"
                        ) {

                            providerInput.value =
                                item.youtubeLiveUrl ||
                                item.youtubeUrl ||
                                "";

                        }

                        else if (
                            item.liveType ===
                            "RECORDED_VIDEO"
                        ) {

                            providerInput.value =
                                item.videoUrl ||
                                "";

                        }

                        else {

                            providerInput.value =
                                item.externalVideoUrl ||
                                "";

                        }

                    }

                }

                const formTitle =
                    document.getElementById(
                        "formTitle"
                    );

                if (formTitle) {

                    formTitle.textContent =
                        "Edit Live Class";

                }

                if (saveButton) {

                    saveButton.textContent =
                        "Update Live Class";

                }

            }

        }
    );

}

/* =========================================================
   REFRESH
========================================================= */

if (refreshBtn) {

    refreshBtn.addEventListener(
        "click",
        async () => {

            try {

                await loadLiveClasses();

                showToast(
                    "Live classes refreshed."
                );

            }

            catch (error) {

                console.error(
                    error
                );

                showToast(
                    error?.message ||
                    "Unable to refresh."
                );

            }

        }
    );

}

/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

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

/* =========================================================
   INITIAL LOAD
========================================================= */

async function loadAll() {

    try {

        await loadCourses();

        await loadLiveClasses();

        updateProviderFields();

    }

    catch (error) {

        console.error(
            "Live Class CRM load error:",
            error
        );

        showToast(
            error?.message ||
            "Unable to load Live Class CRM."
        );

        if (loading) {

            loading.textContent =
                "Unable to load classes.";

        }

    }

}

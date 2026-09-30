import { auth, db } from "../../firebase/firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    Timestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   DOM
========================================================= */

const form =
    document.getElementById("liveForm");

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

const startDate =
    document.getElementById("startDate");

const startTime =
    document.getElementById("startTime");

const endDate =
    document.getElementById("endDate");

const endTime =
    document.getElementById("endTime");

const accessType =
    document.getElementById("accessType");

const description =
    document.getElementById("description");

const zoomFields =
    document.getElementById("zoomFields");

const youtubeFields =
    document.getElementById("youtubeFields");

const recordedFields =
    document.getElementById("recordedFields");

const externalFields =
    document.getElementById("externalFields");

const zoomMeetingNumber =
    document.getElementById("zoomMeetingNumber");

const zoomPassword =
    document.getElementById("zoomPassword");

const youtubeLiveUrl =
    document.getElementById("youtubeLiveUrl");

const videoUrl =
    document.getElementById("videoUrl");

const externalVideoUrl =
    document.getElementById("externalVideoUrl");

const saveButton =
    document.getElementById("saveButton");

const cancelEditButton =
    document.getElementById("cancelEditButton");

const refreshButton =
    document.getElementById("refreshButton");

const classes =
    document.getElementById("classes");

const classCount =
    document.getElementById("classCount");

const formMessage =
    document.getElementById("formMessage");

const toast =
    document.getElementById("toast");


/* =========================================================
   STATE
========================================================= */

let editingId = null;

let currentUser = null;

let courseData = [];


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

        currentUser = user;

        await loadCourses();

        await loadClasses();

    }
);


/* =========================================================
   LIVE TYPE UI
========================================================= */

liveType.addEventListener(
    "change",
    updateProviderFields
);


function updateProviderFields() {

    const type =
        liveType.value;

    zoomFields.classList.add("hidden");

    youtubeFields.classList.add("hidden");

    recordedFields.classList.add("hidden");

    externalFields.classList.add("hidden");


    if (type === "ZOOM") {

        zoomFields.classList.remove("hidden");

        return;

    }


    if (type === "YOUTUBE_LIVE") {

        youtubeFields.classList.remove("hidden");

        return;

    }


    if (type === "RECORDED_VIDEO") {

        recordedFields.classList.remove("hidden");

        return;

    }


    if (type === "EXTERNAL_VIDEO") {

        externalFields.classList.remove("hidden");

    }

}


/* =========================================================
   LOAD COURSES
========================================================= */

async function loadCourses() {

    course.innerHTML = `
        <option value="">
            Select Batch
        </option>
    `;

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "zen2Courses"
                )
            );


        courseData =
            snapshot.docs.map(
                item => ({

                    id: item.id,

                    ...item.data()

                })
            );


        courseData
            .sort(
                (a, b) =>
                    Number(a.order || 9999) -
                    Number(b.order || 9999)
            )
            .forEach(
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
                        "Batch";

                    option.dataset.name =
                        data.name ||
                        data.title ||
                        data.courseName ||
                        "";

                    course.appendChild(
                        option
                    );

                }
            );

    }

    catch (error) {

        console.error(error);

        showFormMessage(
            "Unable to load batches.",
            "error"
        );

    }

}


/* =========================================================
   LOAD SUBJECTS
========================================================= */

course.addEventListener(
    "change",
    async () => {

        resetSelect(
            subject,
            "Select Subject"
        );

        resetSelect(
            chapter,
            "Select Chapter"
        );

        subject.disabled = true;

        chapter.disabled = true;


        if (!course.value) {

            return;

        }


        try {

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "zen2Subjects"
                    )
                );


            const list =
                snapshot.docs
                    .map(
                        item => ({

                            id: item.id,

                            ...item.data()

                        })
                    )
                    .filter(
                        item =>
                            item.courseId ===
                            course.value &&
                            item.active !== false
                    )
                    .sort(
                        (a, b) =>
                            Number(a.order || 9999) -
                            Number(b.order || 9999)
                    );


            list.forEach(
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
                        data.name ||
                        data.title ||
                        data.subjectName ||
                        data.subject ||
                        "";

                    subject.appendChild(
                        option
                    );

                }
            );


            subject.disabled =
                list.length === 0;

        }

        catch (error) {

            console.error(error);

            showFormMessage(
                "Unable to load subjects.",
                "error"
            );

        }

    }
);


/* =========================================================
   LOAD CHAPTERS
========================================================= */

subject.addEventListener(
    "change",
    async () => {

        resetSelect(
            chapter,
            "Select Chapter"
        );

        chapter.disabled = true;


        if (!subject.value) {

            return;

        }


        try {

            const snapshot =
                await getDocs(
                    collection(
                        db,
                        "zen2Chapters"
                    )
                );


            const list =
                snapshot.docs
                    .map(
                        item => ({

                            id: item.id,

                            ...item.data()

                        })
                    )
                    .filter(
                        item =>
                            item.subjectId ===
                            subject.value &&
                            item.active !== false
                    )
                    .sort(
                        (a, b) =>
                            Number(
                                a.order ??
                                a.chapterNumber ??
                                9999
                            ) -
                            Number(
                                b.order ??
                                b.chapterNumber ??
                                9999
                            )
                    );


            list.forEach(
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
                        data.name ||
                        data.title ||
                        data.chapterName ||
                        data.chapterTitle ||
                        "";

                    chapter.appendChild(
                        option
                    );

                }
            );


            chapter.disabled =
                list.length === 0;

        }

        catch (error) {

            console.error(error);

            showFormMessage(
                "Unable to load chapters.",
                "error"
            );

        }

    }
);


/* =========================================================
   SAVE
========================================================= */

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        clearFormMessage();


        const title =
            titleInput.value.trim();

        const teacher =
            teacherInput.value.trim();

        const type =
            liveType.value;

        const dateStart =
            startDate.value;

        const timeStart =
            startTime.value;

        const dateEnd =
            endDate.value;

        const timeEnd =
            endTime.value;


        if (
            !title ||
            !teacher ||
            !course.value ||
            !subject.value ||
            !dateStart ||
            !timeStart ||
            !dateEnd ||
            !timeEnd
        ) {

            showFormMessage(
                "Please fill all required fields.",
                "error"
            );

            return;

        }


        if (
            dateEnd + "T" + timeEnd <
            dateStart + "T" + timeStart
        ) {

            showFormMessage(
                "End time cannot be before start time.",
                "error"
            );

            return;

        }


        if (
            type === "ZOOM" &&
            (
                !zoomMeetingNumber.value.trim() ||
                !zoomPassword.value.trim()
            )
        ) {

            showFormMessage(
                "Enter the Zoom Meeting ID and passcode.",
                "error"
            );

            return;

        }


        if (
            type === "YOUTUBE_LIVE" &&
            !youtubeLiveUrl.value.trim()
        ) {

            showFormMessage(
                "Enter the YouTube Live URL.",
                "error"
            );

            return;

        }


        if (
            type === "RECORDED_VIDEO" &&
            !videoUrl.value.trim()
        ) {

            showFormMessage(
                "Enter the recorded video URL.",
                "error"
            );

            return;

        }


        if (
            type === "EXTERNAL_VIDEO" &&
            !externalVideoUrl.value.trim()
        ) {

            showFormMessage(
                "Enter the external video URL.",
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


        const startDateTime =
            createTimestamp(
                dateStart,
                timeStart
            );

        const endDateTime =
            createTimestamp(
                dateEnd,
                timeEnd
            );


        const data = {

            title,

            teacherName: teacher,

            facultyName: teacher,


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
                thumbnailInput.value.trim() ||
                null,


            liveType: type,

            mode:
                type === "ZOOM"
                    ? "ZOOM"
                    : type,


            zoomMeetingNumber:
                type === "ZOOM"
                    ? zoomMeetingNumber.value.trim()
                    : null,

            zoomMeetingId:
                type === "ZOOM"
                    ? zoomMeetingNumber.value.trim()
                    : null,

            zoomPassword:
                type === "ZOOM"
                    ? zoomPassword.value.trim()
                    : null,


            youtubeLiveUrl:
                type === "YOUTUBE_LIVE"
                    ? youtubeLiveUrl.value.trim()
                    : null,

            youtubeUrl:
                type === "YOUTUBE_LIVE"
                    ? youtubeLiveUrl.value.trim()
                    : null,


            videoUrl:
                type === "RECORDED_VIDEO"
                    ? videoUrl.value.trim()
                    : null,


            externalVideoUrl:
                type === "EXTERNAL_VIDEO"
                    ? externalVideoUrl.value.trim()
                    : null,


            scheduledDate:
                dateStart,

            scheduledTime:
                timeStart,

            startTime:
                timeStart,

            endDate:
                dateEnd,

            endTime:
                timeEnd,


            startDateTime,

            endDateTime,


            accessType:
                accessType.value,

            requiresPurchase:
                accessType.value === "PAID",


            status:
                "SCHEDULED",

            active:
                true,

            description:
                description.value.trim() ||
                null

        };


        saveButton.disabled = true;

        saveButton.textContent =
            editingId
                ? "SAVING..."
                : "SCHEDULING...";


        try {

            if (editingId) {

                await updateDoc(
                    doc(
                        db,
                        "liveClasses",
                        editingId
                    ),
                    {

                        ...data,

                        updatedAt:
                            serverTimestamp()

                    }
                );


                showToast(
                    "Live class updated."
                );

            }

            else {

                await addDoc(
                    collection(
                        db,
                        "liveClasses"
                    ),
                    {

                        ...data,

                        createdAt:
                            serverTimestamp()

                    }
                );


                showToast(
                    "Live class scheduled."
                );

            }


            resetForm();

            await loadClasses();

        }

        catch (error) {

            console.error(error);

            showFormMessage(
                error.message ||
                "Unable to save live class.",
                "error"
            );

        }

        finally {

            saveButton.disabled =
                false;

            saveButton.textContent =
                editingId
                    ? "Save Changes"
                    : "Schedule Live Class";

        }

    }
);


/* =========================================================
   LOAD CLASSES
========================================================= */

async function loadClasses() {

    classes.innerHTML = `
        <div class="loading">
            Loading classes...
        </div>
    `;


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "liveClasses"
                )
            );


        let data =
            snapshot.docs.map(
                item => ({

                    id: item.id,

                    ...item.data()

                })
            );


        data.sort(
            (a, b) =>
                getDateValue(a.startDateTime, a.scheduledDate, a.scheduledTime) -
                getDateValue(b.startDateTime, b.scheduledDate, b.scheduledTime)
        );


        classCount.textContent =
            data.length;


        if (!data.length) {

            classes.innerHTML = `
                <div class="empty-state">
                    No live classes scheduled yet.
                </div>
            `;

            return;

        }


        classes.innerHTML =
            data
                .map(
                    item =>
                        createClassCard(
                            item.id,
                            item
                        )
                )
                .join("");


        attachClassActions();

    }

    catch (error) {

        console.error(error);

        classes.innerHTML = `
            <div class="empty-state">
                Unable to load live classes.
            </div>
        `;

    }

}


/* =========================================================
   CARD
========================================================= */

function createClassCard(
    id,
    data
) {

    const status =
        getClassStatus(data);

    const provider =
        getProviderName(
            data.liveType
        );


    const thumb =
        data.thumbnailUrl
            ? `
                <img
                    src="${escapeAttribute(data.thumbnailUrl)}"
                    alt=""
                    loading="lazy"
                    onerror="this.style.display='none'"
                >
            `
            : `
                <div class="class-thumb-empty">
                    ZENOVA
                </div>
            `;


    return `

        <article
            class="class-card"
        >

            <div class="class-thumb">
                ${thumb}
            </div>


            <div class="class-main">

                <div class="class-title">
                    ${escapeHtml(
                        data.title ||
                        "Live Class"
                    )}
                </div>


                <div class="class-meta">

                    <span>
                        ${escapeHtml(
                            data.courseName ||
                            "-"
                        )}
                    </span>

                    <span>
                        ${escapeHtml(
                            data.subjectName ||
                            "-"
                        )}
                    </span>

                    ${
                        data.chapterName
                            ? `
                                <span>
                                    ${escapeHtml(
                                        data.chapterName
                                    )}
                                </span>
                            `
                            : ""
                    }

                    <span>
                        ${escapeHtml(
                            data.teacherName ||
                            data.facultyName ||
                            "-"
                        )}
                    </span>

                    <span>
                        ${formatDateTime(data)}
                    </span>

                </div>


                <span
                    class="class-provider ${
                        data.liveType === "ZOOM"
                            ? "zoom"
                            : ""
                    }"
                >
                    ${escapeHtml(provider)}
                </span>


                <span
                    class="class-status ${status.className}"
                >
                    ${escapeHtml(status.label)}
                </span>

            </div>


            <div class="class-actions">

                <button
                    type="button"
                    class="action-button edit"
                    data-edit="${escapeAttribute(id)}"
                >
                    Edit
                </button>

                <button
                    type="button"
                    class="action-button delete"
                    data-delete="${escapeAttribute(id)}"
                >
                    Delete
                </button>

            </div>

        </article>

    `;

}


/* =========================================================
   ACTIONS
========================================================= */

function attachClassActions() {

    document
        .querySelectorAll("[data-edit]")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.edit;

                        editClass(id);

                    }
                );

            }
        );


    document
        .querySelectorAll("[data-delete]")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.delete;

                        deleteClass(id);

                    }
                );

            }
        );

}


/* =========================================================
   EDIT
========================================================= */

async function editClass(id) {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "liveClasses"
                )
            );


        const found =
            snapshot.docs.find(
                item =>
                    item.id === id
            );


        if (!found) {

            showToast(
                "Class not found."
            );

            return;

        }


        const data =
            found.data();


        editingId = id;


        titleInput.value =
            data.title || "";

        teacherInput.value =
            data.teacherName ||
            data.facultyName ||
            "";

        liveType.value =
            data.liveType ||
            "ZOOM";


        await setCourseValue(
            data.courseId
        );


        await setSubjectValue(
            data.subjectId
        );


        await setChapterValue(
            data.chapterId
        );


        thumbnailInput.value =
            data.thumbnailUrl ||
            "";


        const start =
            extractDateTime(
                data.startDateTime,
                data.scheduledDate,
                data.scheduledTime
            );

        const end =
            extractDateTime(
                data.endDateTime,
                data.endDate,
                data.endTime
            );


        startDate.value =
            start.date;

        startTime.value =
            start.time;

        endDate.value =
            end.date;

        endTime.value =
            end.time;


        accessType.value =
            data.accessType ||
            "FREE";

        description.value =
            data.description ||
            "";


        zoomMeetingNumber.value =
            data.zoomMeetingNumber ||
            data.zoomMeetingId ||
            "";

        zoomPassword.value =
            data.zoomPassword ||
            "";


        youtubeLiveUrl.value =
            data.youtubeLiveUrl ||
            data.youtubeUrl ||
            "";


        videoUrl.value =
            data.videoUrl ||
            "";


        externalVideoUrl.value =
            data.externalVideoUrl ||
            "";


        updateProviderFields();


        saveButton.textContent =
            "Save Changes";

        cancelEditButton.classList.remove(
            "hidden"
        );


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }

    catch (error) {

        console.error(error);

        showToast(
            "Unable to open class."
        );

    }

}


/* =========================================================
   DELETE
========================================================= */

async function deleteClass(id) {

    const confirmed =
        confirm(
            "Delete this live class?"
        );


    if (!confirmed) {

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


        if (
            editingId === id
        ) {

            resetForm();

        }


        await loadClasses();

    }

    catch (error) {

        console.error(error);

        showToast(
            "Unable to delete class."
        );

    }

}


/* =========================================================
   CANCEL EDIT
========================================================= */

cancelEditButton.addEventListener(
    "click",
    resetForm
);


function resetForm() {

    editingId = null;

    form.reset();


    resetSelect(
        subject,
        "Select Subject"
    );

    resetSelect(
        chapter,
        "Select Chapter"
    );


    subject.disabled = true;

    chapter.disabled = true;


    liveType.value =
        "ZOOM";

    updateProviderFields();


    saveButton.textContent =
        "Schedule Live Class";


    cancelEditButton.classList.add(
        "hidden"
    );


    clearFormMessage();

}


/* =========================================================
   REFRESH
========================================================= */

refreshButton.addEventListener(
    "click",
    loadClasses
);


/* =========================================================
   HELPERS
========================================================= */

function resetSelect(
    element,
    label
) {

    element.innerHTML = `
        <option value="">
            ${label}
        </option>
    `;

}


function createTimestamp(
    date,
    time
) {

    return Timestamp.fromDate(
        new Date(
            `${date}T${time}:00+05:30`
        )
    );

}


function getClassStatus(data) {

    const now =
        Date.now();


    const start =
        getDateValue(
            data.startDateTime,
            data.scheduledDate,
            data.scheduledTime
        );


    const end =
        getDateValue(
            data.endDateTime,
            data.endDate ||
            data.scheduledDate,
            data.endTime ||
            data.scheduledTime
        );


    const actualEnd =
        end > start
            ? end
            : start + 2 * 60 * 60 * 1000;


    if (
        now < start
    ) {

        return {
            label: "UPCOMING",
            className: "upcoming"
        };

    }


    if (
        now >= start &&
        now <= actualEnd
    ) {

        return {
            label: "LIVE NOW",
            className: "live"
        };

    }


    return {
        label: "ENDED",
        className: "ended"
    };

}


function getDateValue(
    timestamp,
    date,
    time
) {

    if (
        timestamp &&
        typeof timestamp.toMillis === "function"
    ) {

        return timestamp.toMillis();

    }


    if (
        timestamp &&
        timestamp.seconds
    ) {

        return (
            Number(timestamp.seconds) *
            1000
        );

    }


    if (
        date &&
        time
    ) {

        return new Date(
            `${date}T${time}:00+05:30`
        ).getTime();

    }


    return 0;

}


function extractDateTime(
    timestamp,
    fallbackDate,
    fallbackTime
) {

    if (
        timestamp &&
        typeof timestamp.toDate === "function"
    ) {

        const date =
            timestamp.toDate();


        return {
            date:
                formatInputDate(date),
            time:
                formatInputTime(date)
        };

    }


    return {
        date:
            fallbackDate || "",
        time:
            fallbackTime || ""
    };

}


function formatInputDate(
    date
) {

    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1
        ).padStart(2, "0"),
        String(
            date.getDate()
        ).padStart(2, "0")
    ].join("-");

}


function formatInputTime(
    date
) {

    return [
        String(
            date.getHours()
        ).padStart(2, "0"),
        String(
            date.getMinutes()
        ).padStart(2, "0")
    ].join(":");

}


function formatDateTime(data) {

    const value =
        getDateValue(
            data.startDateTime,
            data.scheduledDate,
            data.scheduledTime
        );


    if (!value) {

        return "-";

    }


    return new Intl.DateTimeFormat(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata"
        }
    ).format(
        new Date(value)
    );

}


function getProviderName(
    type
) {

    switch (type) {

        case "ZOOM":
            return "ZOOM CLASSROOM";

        case "YOUTUBE_LIVE":
            return "YOUTUBE LIVE";

        case "RECORDED_VIDEO":
            return "RECORDED VIDEO";

        case "EXTERNAL_VIDEO":
            return "EXTERNAL VIDEO";

        default:
            return "LIVE CLASS";

    }

}


async function setCourseValue(
    courseId
) {

    if (!courseId) {

        return;

    }


    course.value =
        courseId;

}


async function setSubjectValue(
    subjectId
) {

    if (!subjectId) {

        return;

    }


    const snapshot =
        await getDocs(
            collection(
                db,
                "zen2Subjects"
            )
        );


    resetSelect(
        subject,
        "Select Subject"
    );


    snapshot.docs
        .map(
            item => ({

                id: item.id,

                ...item.data()

            })
        )
        .filter(
            item =>
                item.courseId ===
                course.value &&
                item.active !== false
        )
        .forEach(
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
                    "Subject";

                option.dataset.name =
                    option.textContent;

                subject.appendChild(
                    option
                );

            }
        );


    subject.disabled = false;

    subject.value =
        subjectId;

}


async function setChapterValue(
    chapterId
) {

    resetSelect(
        chapter,
        "Select Chapter"
    );


    if (!chapterId) {

        chapter.disabled = false;

        return;

    }


    const snapshot =
        await getDocs(
            collection(
                db,
                "zen2Chapters"
            )
        );


    snapshot.docs
        .map(
            item => ({

                id: item.id,

                ...item.data()

            })
        )
        .filter(
            item =>
                item.subjectId ===
                subject.value &&
                item.active !== false
        )
        .sort(
            (a, b) =>
                Number(
                    a.order ??
                    a.chapterNumber ??
                    9999
                ) -
                Number(
                    b.order ??
                    b.chapterNumber ??
                    9999
                )
        )
        .forEach(
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
                    "Chapter";

                option.dataset.name =
                    option.textContent;

                chapter.appendChild(
                    option
                );

            }
        );


    chapter.disabled = false;

    chapter.value =
        chapterId;

}


function showFormMessage(
    message,
    type
) {

    formMessage.textContent =
        message;

    formMessage.className =
        `form-message ${type}`;

}


function clearFormMessage() {

    formMessage.textContent = "";

    formMessage.className =
        "form-message";

}


function showToast(
    message
) {

    toast.textContent =
        message;

    toast.classList.add(
        "show"
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        2500
    );

}


function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function escapeAttribute(
    value
) {

    return escapeHtml(value);

}

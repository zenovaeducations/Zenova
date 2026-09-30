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


let courses = [];
let subjects = [];
let chapters = [];
let liveClasses = [];

let editingId = null;


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

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 3500);
}


/* =========================================================
   DATE / TIME
========================================================= */

function createDateTime(date, time) {

    return `${date}T${time}:00+05:30`;

}


function getStatus(item) {

    const now =
        new Date();

    const start =
        item.startDateTime
            ? new Date(
                item.startDateTime
            )
            : null;

    const end =
        item.endDateTime
            ? new Date(
                item.endDateTime
            )
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
   LOAD COURSES
========================================================= */

async function loadCourses() {

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

    subject.innerHTML =
        `<option value="">Select Subject</option>`;

    chapter.innerHTML =
        `<option value="">Select Chapter</option>`;

    subject.disabled = true;
    chapter.disabled = true;

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
                    item.courseId ===
                    courseId &&
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

    chapter.innerHTML =
        `<option value="">Select Chapter</option>`;

    chapter.disabled = true;

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
                    item.subjectId ===
                    subjectId &&
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
   COURSE / SUBJECT EVENTS
========================================================= */

course.addEventListener(
    "change",
    async () => {

        await loadSubjects(
            course.value
        );

    }
);


subject.addEventListener(
    "change",
    async () => {

        await loadChapters(
            subject.value
        );

    }
);


/* =========================================================
   LIVE TYPE
========================================================= */

liveType.addEventListener(
    "change",
    () => {

        const type =
            liveType.value;

        if (type === "ZOOM") {

            zoomInfo.style.display =
                "flex";

            providerFields.innerHTML =
                "";

            return;
        }

        zoomInfo.style.display =
            "none";


        if (
            type ===
            "YOUTUBE_LIVE"
        ) {

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

        } else if (
            type ===
            "RECORDED_VIDEO"
        ) {

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

        } else {

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
);


/* =========================================================
   OPEN / CLOSE FORM
========================================================= */

function openForm() {

    formPanel.style.display =
        "block";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


function closeForm() {

    formPanel.style.display =
        "none";

    editingId =
        null;

    form.reset();

    zoomInfo.style.display =
        "flex";

    providerFields.innerHTML =
        "";

    saveButton.textContent =
        "Schedule Live Class";

}


newClassBtn.addEventListener(
    "click",
    () => {

        closeForm();

        openForm();

    }
);


closeFormBtn.addEventListener(
    "click",
    closeForm
);

cancelBtn.addEventListener(
    "click",
    closeForm
);


/* =========================================================
   ZOOM CREATION
========================================================= */

async function createZoomForClass() {

    const start =
        createDateTime(
            dateStart.value,
            timeStart.value
        );

    const minutes =
        Number(
            duration.value || 60
        );


    /*
       IMPORTANT:
       These are the fields sent to the deployed
       createZoomMeeting callable function.
    */

    const result =
        await createZoomMeeting({

            topic:
                titleInput.value.trim(),

            startTime:
                start,

            duration:
                minutes

        });


    return result.data;

}


/* =========================================================
   BUILD LIVE CLASS DATA
========================================================= */

function buildData(
    zoomData = null
) {

    const selectedCourse =
        course.options[
            course.selectedIndex
        ];

    const selectedSubject =
        subject.options[
            subject.selectedIndex
        ];

    const selectedChapter =
        chapter.options[
            chapter.selectedIndex
        ];


    const type =
        liveType.value;


    const data = {

        title:
            titleInput.value.trim(),

        teacherName:
            teacherInput.value.trim(),

        facultyName:
            teacherInput.value.trim(),

        courseId:
            course.value,

        courseName:
            selectedCourse?.textContent ||
            null,

        subjectId:
            subject.value,

        subjectName:
            selectedSubject?.textContent ||
            null,

        chapterId:
            chapter.value ||
            null,

        chapterName:
            chapter.value
                ? selectedChapter?.textContent ||
                  null
                : null,

        thumbnailUrl:
            thumbnailInput.value.trim() ||
            null,

        liveType:
            type,

        mode:
            type,

        scheduledDate:
            dateStart.value,

        scheduledTime:
            timeStart.value,

        startTime:
            timeStart.value,

        endDate:
            dateEnd.value,

        endTime:
            timeEnd.value,

        startDateTime:
            createDateTime(
                dateStart.value,
                timeStart.value
            ),

        endDateTime:
            createDateTime(
                dateEnd.value,
                timeEnd.value
            ),

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
            null,

        createdAt:
            serverTimestamp()

    };


    if (type === "ZOOM" && zoomData) {

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


    if (
        type !== "ZOOM" &&
        document.getElementById(
            "providerUrl"
        )
    ) {

        const url =
            document.getElementById(
                "providerUrl"
            ).value.trim();

        if (
            type ===
            "YOUTUBE_LIVE"
        ) {

            data.youtubeLiveUrl =
                url;

            data.youtubeUrl =
                url;

        }

        if (
            type ===
            "RECORDED_VIDEO"
        ) {

            data.videoUrl =
                url;

        }

        if (
            type ===
            "EXTERNAL_VIDEO"
        ) {

            data.externalVideoUrl =
                url;

        }

    }


    return data;

}


/* =========================================================
   SAVE
========================================================= */

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (
            !course.value ||
            !subject.value
        ) {

            showToast(
                "Please select course and subject."
            );

            return;
        }


        if (
            dateStart.value >
            dateEnd.value
        ) {

            showToast(
                "End date cannot be before start date."
            );

            return;
        }


        saveButton.disabled =
            true;


        try {

            let zoomData =
                null;


            /*
              CREATE ZOOM AUTOMATICALLY
            */

            if (
                liveType.value ===
                "ZOOM"
            ) {

                saveButton.textContent =
                    "CREATING ZOOM MEETING...";


                zoomData =
                    await createZoomForClass();


                if (
                    !zoomData
                ) {

                    throw new Error(
                        "Zoom meeting was not created."
                    );

                }

            }


            saveButton.textContent =
                "SAVING CLASS...";


            const data =
                buildData(
                    zoomData
                );


            if (editingId) {

                delete data.createdAt;

                data.updatedAt =
                    serverTimestamp();


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

            } else {

                await addDoc(
                    collection(
                        db,
                        "liveClasses"
                    ),
                    data
                );


                if (
                    liveType.value ===
                    "ZOOM"
                ) {

                    showToast(
                        "Live class scheduled and Zoom meeting created."
                    );

                } else {

                    showToast(
                        "Live class scheduled successfully."
                    );

                }

            }


            closeForm();

            await loadLiveClasses();


        } catch (error) {

            console.error(
                "Live class error:",
                error
            );


            showToast(
                error?.message ||
                "Unable to save live class."
            );

        } finally {

            saveButton.disabled =
                false;

            saveButton.textContent =
                editingId
                    ? "Update Live Class"
                    : "Schedule Live Class";

        }

    }
);


/* =========================================================
   LOAD LIVE CLASSES
========================================================= */

async function loadLiveClasses() {

    loading.classList.remove(
        "hidden"
    );

    emptyState.classList.add(
        "hidden"
    );


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
   RENDER
========================================================= */

function renderClasses() {

    loading.classList.add(
        "hidden"
    );


    let upcoming = 0;
    let live = 0;
    let completed = 0;


    classesList.innerHTML =
        "";


    liveClasses.forEach(
        item => {

            const status =
                getStatus(item);


            if (
                status ===
                "UPCOMING"
            ) upcoming++;

            if (
                status ===
                "LIVE"
            ) live++;

            if (
                status ===
                "COMPLETED"
            ) completed++;


            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "class-card";


            const zoom =
                item.liveType ===
                "ZOOM";


            card.innerHTML = `

                <div class="class-main">

                    <div class="class-title">
                        ${escapeHtml(
                            item.title ||
                            "Untitled Class"
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
                            zoom
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

                    <p>
                        ${escapeHtml(
                            item.teacherName ||
                            ""
                        )}
                    </p>

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
                        zoom &&
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
                        zoom &&
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


    upcomingCount.textContent =
        upcoming;

    liveCount.textContent =
        live;

    completedCount.textContent =
        completed;


    if (
        liveClasses.length === 0
    ) {

        emptyState.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   ACTIONS
========================================================= */

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


        if (
            action ===
            "zoom"
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


        if (
            action ===
            "delete"
        ) {

            const yes =
                confirm(
                    "Delete this live class?"
                );

            if (!yes) {
                return;
            }


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

            return;

        }


        if (
            action ===
            "edit"
        ) {

            editingId =
                id;

            openForm();


            titleInput.value =
                item.title || "";

            teacherInput.value =
                item.teacherName || "";

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


            document.getElementById(
                "formTitle"
            ).textContent =
                "Edit Live Class";


            saveButton.textContent =
                "Update Live Class";

        }

    }
);


/* =========================================================
   REFRESH
========================================================= */

refreshBtn.addEventListener(
    "click",
    loadLiveClasses
);


/* =========================================================
   HELPERS
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

        liveType.dispatchEvent(
            new Event("change")
        );

    } catch (error) {

        console.error(
            error
        );

        showToast(
            error?.message ||
            "Unable to load Live Class CRM."
        );

        loading.textContent =
            "Unable to load classes.";

    }

        }

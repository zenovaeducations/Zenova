import {
    auth,
    db
} from "../firebase/firebase-config.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    doc,
    getDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";



/* =========================================================
   ELEMENTS
========================================================= */

const loader =
    document.getElementById(
        "zenovaLoader"
    );


const app =
    document.getElementById(
        "hybridApp"
    );



/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let student = null;

let masterPlanTasks = [];

let banners = [];

let currentBanner = 0;

let bannerTimer = null;



/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.replace(
                "../login/"
            );

            return;
        }


        currentUser =
            user;


        try {

            await loadStudent();


            await Promise.all([

                loadBanners(),

                loadMasterPlan(),

                loadTodayClasses(),

                loadAnnouncements(),

                loadAttendance(),

                loadLatestTest()

            ]);


            setupNavigation();

            setupProfile();

            setupNotifications();


            showApplication();


        } catch (error) {

            console.error(
                "Zenova Hybrid:",
                error
            );


            showError();

        }

    }
);



/* =========================================================
   STUDENT
========================================================= */

async function loadStudent() {

    const ref =
        doc(
            db,
            "students",
            currentUser.uid
        );


    const snapshot =
        await getDoc(
            ref
        );


    if (!snapshot.exists()) {

        throw new Error(
            "Student profile not found."
        );

    }


    student =
        snapshot.data();


    renderStudent();

}



function renderStudent() {

    const name =
        student.name ||
        currentUser.displayName ||
        "Student";


    document.getElementById(
        "studentName"
    ).textContent =
        name;


    const details = [];


    if (student.className) {

        details.push(
            student.className
        );

    }


    if (student.combination) {

        details.push(
            student.combination
        );

    }


    details.push(
        "Hybrid Program"
    );


    document.getElementById(
        "studentMeta"
    ).textContent =
        details.join(
            " • "
        );


    document.getElementById(
        "profileButton"
    ).textContent =
        name
            .trim()
            .charAt(0)
            .toUpperCase();

}



/* =========================================================
   BANNERS
========================================================= */

function loadBanners() {

    const q =
        query(
            collection(
                db,
                "hybridBanners"
            ),

            where(
                "active",
                "==",
                true
            ),

            orderBy(
                "priority",
                "desc"
            )
        );


    return new Promise(
        (resolve, reject) => {

            let first =
                true;


            onSnapshot(
                q,

                snapshot => {

                    banners =
                        snapshot.docs.map(
                            item => ({
                                id: item.id,
                                ...item.data()
                            })
                        );


                    renderBanners();


                    if (first) {

                        first =
                            false;

                        resolve();

                    }

                },

                error => {

                    reject(error);

                }
            );

        }
    );

}



function renderBanners() {

    const section =
        document.getElementById(
            "bannerSection"
        );


    const wrapper =
        document.getElementById(
            "bannerWrapper"
        );


    const dots =
        document.getElementById(
            "bannerDots"
        );


    if (!banners.length) {

        section.classList.add(
            "hidden"
        );

        return;

    }


    section.classList.remove(
        "hidden"
    );


    currentBanner = 0;


    wrapper.innerHTML =
        banners.map(
            (banner, index) => `

                <article
                    class="
                        banner-slide
                        ${index === 0 ? "active" : ""}
                    "
                >

                    <img
                        src="${escapeAttr(
                            banner.imageUrl || ""
                        )}"
                        alt="${escapeAttr(
                            banner.title || ""
                        )}"
                    >


                    <div
                        class="banner-overlay"
                    ></div>


                    <div
                        class="banner-content"
                    >

                        ${
                            banner.label
                                ? `
                                    <span
                                        class="banner-label"
                                    >
                                        ${escapeHtml(
                                            banner.label
                                        )}
                                    </span>
                                `
                                : ""
                        }


                        <h2>
                            ${escapeHtml(
                                banner.title || ""
                            )}
                        </h2>


                        ${
                            banner.description
                                ? `
                                    <p>
                                        ${escapeHtml(
                                            banner.description
                                        )}
                                    </p>
                                `
                                : ""
                        }

                    </div>

                </article>

            `
        ).join("");


    dots.innerHTML =
        banners.map(
            (_, index) => `

                <button
                    class="
                        banner-dot
                        ${index === 0 ? "active" : ""}
                    "
                    data-banner-index="${index}"
                    type="button"
                ></button>

            `
        ).join("");


    document
        .querySelectorAll(
            "[data-banner-index]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        showBanner(
                            Number(
                                button.dataset
                                    .bannerIndex
                            )
                        );


                        restartBanner();

                    }
                );

            }
        );


    updateBannerCounter();

    restartBanner();

}



function showBanner(
    index
) {

    if (!banners.length) {
        return;
    }


    currentBanner =
        (
            index +
            banners.length
        ) %
        banners.length;


    document
        .querySelectorAll(
            ".banner-slide"
        )
        .forEach(
            (slide, i) => {

                slide.classList.toggle(
                    "active",
                    i === currentBanner
                );

            }
        );


    document
        .querySelectorAll(
            ".banner-dot"
        )
        .forEach(
            (dot, i) => {

                dot.classList.toggle(
                    "active",
                    i === currentBanner
                );

            }
        );


    updateBannerCounter();

}



function updateBannerCounter() {

    document.getElementById(
        "bannerCounter"
    ).textContent =

        `${String(
            currentBanner + 1
        ).padStart(2, "0")} / ${
            String(
                banners.length
            ).padStart(2, "0")
        }`;

}



function restartBanner() {

    clearInterval(
        bannerTimer
    );


    if (banners.length <= 1) {
        return;
    }


    bannerTimer =
        setInterval(
            () => {

                showBanner(
                    currentBanner + 1
                );

            },
            5000
        );

}



/* =========================================================
   MASTER PLAN
========================================================= */

function loadMasterPlan() {

    const today =
        getDateKey(
            new Date()
        );


    const q =
        query(
            collection(
                db,
                "hybridMasterPlans"
            ),

            where(
                "dateKey",
                "==",
                today
            ),

            where(
                "active",
                "==",
                true
            ),

            limit(1)
        );


    return new Promise(
        (resolve, reject) => {

            let first =
                true;


            onSnapshot(
                q,

                async snapshot => {

                    if (
                        snapshot.empty
                    ) {

                        masterPlanTasks =
                            [];

                        renderMasterPlan();


                        if (first) {

                            first =
                                false;

                            resolve();

                        }

                        return;

                    }


                    const plan =
                        snapshot.docs[0];


                    const planData =
                        plan.data();


                    const tasks =
                        Array.isArray(
                            planData.tasks
                        )
                            ? planData.tasks
                            : [];


                    masterPlanTasks =
                        await Promise.all(

                            tasks.map(
                                async task => {

                                    const completion =
                                        await getCompletion(
                                            plan.id,
                                            task.id
                                        );


                                    return {

                                        ...task,

                                        planId:
                                            plan.id,

                                        completed:
                                            completion

                                    };

                                }
                            )

                        );


                    renderMasterPlan();


                    if (first) {

                        first =
                            false;

                        resolve();

                    }

                },

                error => {

                    reject(error);

                }
            );

        }
    );

}



async function getCompletion(
    planId,
    taskId
) {

    const completionId =
        `${currentUser.uid}_${planId}_${taskId}`;


    const ref =
        doc(
            db,
            "hybridTaskCompletions",
            completionId
        );


    const snapshot =
        await getDoc(
            ref
        );


    return (
        snapshot.exists() &&
        snapshot.data().completed === true
    );

}



function renderMasterPlan() {

    const list =
        document.getElementById(
            "masterPlanList"
        );


    const empty =
        document.getElementById(
            "masterPlanEmpty"
        );


    const total =
        masterPlanTasks.length;


    const completed =
        masterPlanTasks.filter(
            task =>
                task.completed
        ).length;


    document.getElementById(
        "completedCount"
    ).textContent =
        completed;


    document.getElementById(
        "totalCount"
    ).textContent =
        total;


    const percentage =
        total
            ? Math.round(
                completed /
                total *
                100
            )
            : 0;


    document.getElementById(
        "masterProgress"
    ).style.width =
        `${percentage}%`;


    if (!total) {

        list.innerHTML = "";

        empty.classList.remove(
            "hidden"
        );

        return;

    }


    empty.classList.add(
        "hidden"
    );


    list.innerHTML =
        masterPlanTasks.map(
            task => `

                <article
                    class="
                        plan-card
                        ${task.completed ? "completed" : ""}
                    "
                >

                    <div
                        class="plan-icon"
                    >
                        ${getTaskIcon(
                            task.type
                        )}
                    </div>


                    <div
                        class="plan-info"
                    >

                        <div
                            class="plan-top"
                        >

                            <span
                                class="plan-type"
                            >
                                ${escapeHtml(
                                    String(
                                        task.type ||
                                        "STUDY"
                                    ).toUpperCase()
                                )}
                            </span>


                            ${
                                task.time
                                    ? `
                                        <span
                                            class="plan-time"
                                        >
                                            ${escapeHtml(
                                                task.time
                                            )}
                                        </span>
                                    `
                                    : ""
                            }

                        </div>


                        <h3>
                            ${escapeHtml(
                                task.subject ||
                                task.title ||
                                ""
                            )}
                        </h3>


                        <p>
                            ${escapeHtml(
                                task.title ||
                                task.chapter ||
                                ""
                            )}
                        </p>

                    </div>


                    <button
                        class="plan-action"
                        data-resource-url="${escapeAttr(
                            task.resourceUrl || ""
                        )}"
                        type="button"
                    >
                        ${getActionText(
                            task.type
                        )}
                    </button>


                    <button
                        class="complete-button"
                        data-complete-task="${escapeAttr(
                            String(task.id)
                        )}"
                        type="button"
                    >
                        ✓
                    </button>

                </article>

            `
        ).join("");


    attachPlanEvents();

}



function attachPlanEvents() {

    document
        .querySelectorAll(
            "[data-complete-task]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async event => {

                        event.stopPropagation();


                        await toggleTask(
                            button.dataset
                                .completeTask
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".plan-action"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    event => {

                        event.stopPropagation();


                        const url =
                            button.dataset
                                .resourceUrl;


                        if (!url) {
                            return;
                        }


                        window.location.href =
                            url;

                    }
                );

            }
        );

}



async function toggleTask(
    taskId
) {

    const task =
        masterPlanTasks.find(
            item =>
                String(item.id) ===
                String(taskId)
        );


    if (!task) {
        return;
    }


    task.completed =
        !task.completed;


    renderMasterPlan();


    const id =
        `${currentUser.uid}_${task.planId}_${task.id}`;


    const ref =
        doc(
            db,
            "hybridTaskCompletions",
            id
        );


    await setDoc(
        ref,

        {

            studentId:
                currentUser.uid,

            planId:
                task.planId,

            taskId:
                task.id,

            completed:
                task.completed,

            completedAt:
                task.completed
                    ? serverTimestamp()
                    : null,

            updatedAt:
                serverTimestamp()

        },

        {
            merge: true
        }
    );

}



/* =========================================================
   TODAY'S CLASSES
========================================================= */

function loadTodayClasses() {

    const today =
        getDateKey(
            new Date()
        );


    const q =
        query(
            collection(
                db,
                "hybridClasses"
            ),

            where(
                "dateKey",
                "==",
                today
            ),

            where(
                "active",
                "==",
                true
            ),

            orderBy(
                "startTime",
                "asc"
            ),

            limit(5)
        );


    return new Promise(
        (resolve, reject) => {

            let first =
                true;


            onSnapshot(
                q,

                snapshot => {

                    const classes =
                        snapshot.docs.map(
                            item => ({
                                id: item.id,
                                ...item.data()
                            })
                        );


                    renderTodayClasses(
                        classes
                    );


                    if (first) {

                        first =
                            false;

                        resolve();

                    }

                },

                reject
            );

        }
    );

}



function renderTodayClasses(
    classes
) {

    const section =
        document.getElementById(
            "todayClassesSection"
        );


    const list =
        document.getElementById(
            "todayClassesList"
        );


    if (!classes.length) {

        section.classList.add(
            "hidden"
        );

        return;

    }


    section.classList.remove(
        "hidden"
    );


    list.innerHTML =
        classes.map(
            item => `

                <article
                    class="class-row"
                >

                    <div
                        class="class-time"
                    >
                        ${escapeHtml(
                            item.startTime || ""
                        )}
                    </div>


                    <div
                        class="class-info"
                    >

                        <strong>
                            ${escapeHtml(
                                item.subject || ""
                            )}
                        </strong>

                        <span>
                            ${escapeHtml(
                                item.topic || ""
                            )}
                        </span>

                        <small>
                            ${escapeHtml(
                                item.mode || ""
                            )}
                        </small>

                    </div>


                    ${
                        item.meetingUrl
                            ? `
                                <a
                                    class="join-button"
                                    href="${escapeAttr(
                                        item.meetingUrl
                                    )}"
                                    target="_blank"
                                    rel="noopener"
                                >
                                    JOIN
                                </a>
                            `
                            : ""
                    }

                </article>

            `
        ).join("");

}



/* =========================================================
   ANNOUNCEMENTS
========================================================= */

function loadAnnouncements() {

    const q =
        query(
            collection(
                db,
                "hybridAnnouncements"
            ),

            where(
                "active",
                "==",
                true
            ),

            orderBy(
                "createdAt",
                "desc"
            ),

            limit(5)
        );


    return new Promise(
        (resolve, reject) => {

            let first =
                true;


            onSnapshot(
                q,

                snapshot => {

                    const items =
                        snapshot.docs.map(
                            item => ({
                                id: item.id,
                                ...item.data()
                            })
                        );


                    renderAnnouncements(
                        items
                    );


                    if (first) {

                        first =
                            false;

                        resolve();

                    }

                },

                reject
            );

        }
    );

}



function renderAnnouncements(
    items
) {

    const section =
        document.getElementById(
            "announcementSection"
        );


    const list =
        document.getElementById(
            "announcementList"
        );


    if (!items.length) {

        section.classList.add(
            "hidden"
        );

        return;

    }


    section.classList.remove(
        "hidden"
    );


    list.innerHTML =
        items.map(
            item => `

                <article
                    class="announcement-card"
                >

                    <div
                        class="announcement-mark"
                    >
                        ${
                            item.priority ===
                            "important"
                                ? "!"
                                : "N"
                        }
                    </div>


                    <div
                        class="announcement-info"
                    >

                        <div
                            class="announcement-meta"
                        >

                            <strong>
                                ${escapeHtml(
                                    item.category ||
                                    "NOTICE"
                                )}
                            </strong>

                            <span>
                                ${formatDate(
                                    item.createdAt
                                )}
                            </span>

                        </div>


                        <h3>
                            ${escapeHtml(
                                item.title || ""
                            )}
                        </h3>


                        ${
                            item.description
                                ? `
                                    <p>
                                        ${escapeHtml(
                                            item.description
                                        )}
                                    </p>
                                `
                                : ""
                        }

                    </div>

                </article>

            `
        ).join("");

}



/* =========================================================
   ATTENDANCE
========================================================= */

function loadAttendance() {

    const q =
        query(
            collection(
                db,
                "hybridAttendance"
            ),

            where(
                "studentId",
                "==",
                currentUser.uid
            ),

            orderBy(
                "dateKey",
                "desc"
            ),

            limit(100)
        );


    return new Promise(
        (resolve, reject) => {

            let first =
                true;


            onSnapshot(
                q,

                snapshot => {

                    const records =
                        snapshot.docs.map(
                            item =>
                                item.data()
                        );


                    renderAttendance(
                        records
                    );


                    if (first) {

                        first =
                            false;

                        resolve();

                    }

                },

                reject
            );

        }
    );

}



function renderAttendance(
    records
) {

    const card =
        document.getElementById(
            "attendanceSummary"
        );


    if (!records.length) {

        card.innerHTML = `

            <p class="section-label">
                ATTENDANCE
            </p>

            <h3>
                Attendance
            </h3>

            <div class="summary-loading">
                No attendance recorded yet.
            </div>

        `;

        return;

    }


    const present =
        records.filter(
            item =>
                item.status ===
                "present"
        ).length;


    const percentage =
        Math.round(
            present /
            records.length *
            100
        );


    card.innerHTML = `

        <p class="section-label">
            ATTENDANCE
        </p>

        <h3>
            Overall Attendance
        </h3>


        <div
            class="summary-number"
        >
            ${percentage}
            <span>%</span>
        </div>


        <div
            class="summary-bar"
        >

            <div
                style="width:${percentage}%"
            ></div>

        </div>

    `;

}



/* =========================================================
   LATEST TEST
========================================================= */

function loadLatestTest() {

    const q =
        query(
            collection(
                db,
                "hybridTestResults"
            ),

            where(
                "studentId",
                "==",
                currentUser.uid
            ),

            orderBy(
                "createdAt",
                "desc"
            ),

            limit(1)
        );


    return new Promise(
        (resolve, reject) => {

            let first =
                true;


            onSnapshot(
                q,

                snapshot => {

                    if (
                        snapshot.empty
                    ) {

                        renderLatestTest(
                            null
                        );

                    } else {

                        renderLatestTest(
                            snapshot.docs[0]
                                .data()
                        );

                    }


                    if (first) {

                        first =
                            false;

                        resolve();

                    }

                },

                reject
            );

        }
    );

}



function renderLatestTest(
    result
) {

    const card =
        document.getElementById(
            "testSummary"
        );


    if (!result) {

        card.innerHTML = `

            <p class="section-label">
                PERFORMANCE
            </p>

            <h3>
                Latest Test
            </h3>

            <div class="summary-loading">
                No test result yet.
            </div>

        `;

        return;

    }


    card.innerHTML = `

        <p class="section-label">
            LATEST RESULT
        </p>

        <h3>
            ${escapeHtml(
                result.testName ||
                "Test"
            )}
        </h3>


        <div
            class="summary-number"
        >

            ${Number(
                result.obtainedMarks ||
                0
            )}

            <span>
                /
                ${Number(
                    result.maximumMarks ||
                    0
                )}
            </span>

        </div>

    `;

}



/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    document
        .querySelectorAll(
            "[data-route]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    () => {

                        navigate(
                            element.dataset.route
                        );

                    }
                );

            }
        );

}



function navigate(
    route
) {

    const routes = {

        home:
            "./",

        classes:
            "./classes/",

        study:
            "./study/",

        timetable:
            "./timetable/",

        attendance:
            "./attendance/",

        tests:
            "./tests/",

        more:
            "./more/"

    };


    const destination =
        routes[route];


    if (destination) {

        window.location.href =
            destination;

    }

}



/* =========================================================
   PROFILE
========================================================= */

function setupProfile() {

    document
        .getElementById(
            "profileButton"
        )
        .addEventListener(
            "click",
            () => {

                navigate(
                    "more"
                );

            }
        );

}



/* =========================================================
   NOTIFICATIONS
========================================================= */

function setupNotifications() {

    document
        .getElementById(
            "notificationButton"
        )
        .addEventListener(
            "click",
            () => {

                navigate(
                    "more"
                );

            }
        );

}



/* =========================================================
   SHOW APP
========================================================= */

function showApplication() {

    app.classList.remove(
        "hidden"
    );


    setTimeout(
        () => {

            loader.classList.add(
                "hidden"
            );

        },
        150
    );

}



/* =========================================================
   ERROR
========================================================= */

function showError() {

    loader.innerHTML = `

        <div
            style="
                text-align:center;
                padding:30px;
            "
        >

            <div
                style="
                    font-size:22px;
                    font-weight:900;
                    letter-spacing:3px;
                "
            >
                ZENOVA
            </div>


            <p
                style="
                    margin-top:10px;
                    color:#777;
                    font-size:11px;
                "
            >
                We couldn't load your Hybrid Portal.
            </p>


            <button
                onclick="location.reload()"
                style="
                    margin-top:18px;
                    padding:10px 16px;
                    background:#111;
                    color:#fff;
                    border-radius:7px;
                    font-size:9px;
                    font-weight:800;
                "
            >
                TRY AGAIN
            </button>

        </div>

    `;

}



/* =========================================================
   HELPERS
========================================================= */

function getTaskIcon(
    type
) {

    const value =
        String(
            type || ""
        ).toLowerCase();


    if (
        value.includes("live")
    ) {
        return "▶";
    }


    if (
        value.includes("record")
    ) {
        return "▷";
    }


    if (
        value.includes("note") ||
        value.includes("pdf")
    ) {
        return "▤";
    }


    if (
        value.includes("test")
    ) {
        return "□";
    }


    if (
        value.includes("assignment")
    ) {
        return "✓";
    }


    return "•";

}



function getActionText(
    type
) {

    const value =
        String(
            type || ""
        ).toLowerCase();


    if (
        value.includes("live")
    ) {
        return "JOIN";
    }


    if (
        value.includes("record")
    ) {
        return "WATCH";
    }


    if (
        value.includes("note") ||
        value.includes("pdf")
    ) {
        return "OPEN";
    }


    return "STUDY";

}



function getDateKey(
    date
) {

    return [

        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        ),

        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        )

    ].join("-");

}



function formatDate(
    value
) {

    if (!value) {
        return "";
    }


    let date;


    if (
        typeof value.toDate ===
        "function"
    ) {

        date =
            value.toDate();

    } else {

        date =
            new Date(value);

    }


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "short"
        }
    );

}



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



function escapeAttr(
    value
) {

    return escapeHtml(
        value
    );

}

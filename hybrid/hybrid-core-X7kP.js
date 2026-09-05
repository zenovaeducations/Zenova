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
    limit,
    onSnapshot,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   ELEMENTS
========================================================= */

const loader =
    document.getElementById("zenovaLoader");

const app =
    document.getElementById("hybridApp");


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
   START
========================================================= */

console.log("ZENOVA HYBRID: CORE STARTED");


onAuthStateChanged(
    auth,
    async (user) => {

        console.log(
            "ZENOVA HYBRID: AUTH",
            user ? user.uid : "NO USER"
        );


        if (!user) {

            window.location.replace(
                "../login/"
            );

            return;
        }


        currentUser = user;


        try {

            /*
             * Student profile is the only
             * thing required before opening
             * the portal.
             */

            await loadStudent();


            /*
             * Show the application immediately.
             *
             * Individual sections load independently.
             */

            setupNavigation();
            setupProfile();
            setupNotifications();

            showApplication();


            /*
             * Start every realtime section
             * independently.
             */

            startBannersListener();
            startMasterPlanListener();
            startTodayClassesListener();
            startAnnouncementsListener();
            startAttendanceListener();
            startLatestTestListener();


        } catch (error) {

            console.error(
                "ZENOVA HYBRID START ERROR:",
                error
            );

            showError(
                error
            );

        }

    }
);


/* =========================================================
   STUDENT
========================================================= */

async function loadStudent() {

    console.log(
        "ZENOVA HYBRID: Loading student..."
    );


    const studentRef =
        doc(
            db,
            "students",
            currentUser.uid
        );


    const snapshot =
        await getDoc(
            studentRef
        );


    if (!snapshot.exists()) {

        throw new Error(
            "Student profile not found."
        );

    }


    student =
        snapshot.data();


    console.log(
        "ZENOVA HYBRID: Student loaded",
        student
    );


    renderStudent();

}


function renderStudent() {

    const name =
        student.name ||
        currentUser.displayName ||
        "Student";


    const nameElement =
        document.getElementById(
            "studentName"
        );


    const metaElement =
        document.getElementById(
            "studentMeta"
        );


    const profileButton =
        document.getElementById(
            "profileButton"
        );


    if (nameElement) {

        nameElement.textContent =
            name;

    }


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


    if (metaElement) {

        metaElement.textContent =
            details.join(
                " • "
            );

    }


    if (profileButton) {

        profileButton.textContent =
            name
                .trim()
                .charAt(0)
                .toUpperCase();

    }

}


/* =========================================================
   BANNERS
========================================================= */

function startBannersListener() {

    console.log(
        "ZENOVA HYBRID: Starting banners listener..."
    );


    const baseQuery =
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

            limit(20)
        );


    onSnapshot(

        baseQuery,

        (snapshot) => {

            banners =
                snapshot.docs.map(
                    item => ({
                        id: item.id,
                        ...item.data()
                    })
                );


            /*
             * Sort locally.
             * This avoids a Firestore
             * composite index requirement.
             */

            banners.sort(
                (a, b) =>
                    Number(
                        b.priority || 0
                    ) -
                    Number(
                        a.priority || 0
                    )
            );


            console.log(
                "ZENOVA HYBRID: Banners",
                banners.length
            );


            renderBanners();

        },

        (error) => {

            console.error(
                "HYBRID BANNERS ERROR:",
                error
            );

            /*
             * Banner failure must NEVER
             * stop the whole portal.
             */

            banners = [];

            renderBanners();

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


    if (
        !section ||
        !wrapper ||
        !dots
    ) {
        return;
    }


    if (!banners.length) {

        section.classList.add(
            "hidden"
        );

        clearInterval(
            bannerTimer
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
                    aria-label="Banner ${index + 1}"
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


function showBanner(index) {

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

    const counter =
        document.getElementById(
            "bannerCounter"
        );


    if (!counter) {
        return;
    }


    counter.textContent =
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

function startMasterPlanListener() {

    const today =
        getDateKey(
            new Date()
        );


    console.log(
        "ZENOVA HYBRID: Master plan",
        today
    );


    const baseQuery =
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

            limit(10)
        );


    onSnapshot(

        baseQuery,

        async (snapshot) => {

            try {

                if (snapshot.empty) {

                    masterPlanTasks = [];

                    renderMasterPlan();

                    return;

                }


                /*
                 * Sort plans locally.
                 */

                const plans =
                    snapshot.docs.map(
                        item => ({
                            id: item.id,
                            ...item.data()
                        })
                    );


                plans.sort(
                    (a, b) =>
                        String(
                            a.priority || ""
                        ).localeCompare(
                            String(
                                b.priority || ""
                            )
                        )
                );


                const plan =
                    plans[0];


                const tasks =
                    Array.isArray(
                        plan.tasks
                    )
                        ? plan.tasks
                        : [];


                masterPlanTasks =
                    await Promise.all(

                        tasks.map(
                            async task => {

                                let completed =
                                    false;


                                try {

                                    completed =
                                        await getCompletion(
                                            plan.id,
                                            task.id
                                        );

                                } catch (error) {

                                    console.error(
                                        "TASK COMPLETION ERROR:",
                                        error
                                    );

                                }


                                return {

                                    ...task,

                                    planId:
                                        plan.id,

                                    completed

                                };

                            }
                        )

                    );


                renderMasterPlan();

            } catch (error) {

                console.error(
                    "MASTER PLAN RENDER ERROR:",
                    error
                );

                masterPlanTasks = [];

                renderMasterPlan();

            }

        },

        (error) => {

            console.error(
                "HYBRID MASTER PLAN ERROR:",
                error
            );

            masterPlanTasks = [];

            renderMasterPlan();

        }

    );

}


async function getCompletion(
    planId,
    taskId
) {

    const completionId =
        `${currentUser.uid}_${planId}_${taskId}`;


    const completionRef =
        doc(
            db,
            "hybridTaskCompletions",
            completionId
        );


    const snapshot =
        await getDoc(
            completionRef
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


    if (!list || !empty) {
        return;
    }


    const total =
        masterPlanTasks.length;


    const completed =
        masterPlanTasks.filter(
            task =>
                task.completed === true
        ).length;


    const completedElement =
        document.getElementById(
            "completedCount"
        );


    const totalElement =
        document.getElementById(
            "totalCount"
        );


    const progress =
        document.getElementById(
            "masterProgress"
        );


    if (completedElement) {

        completedElement.textContent =
            completed;

    }


    if (totalElement) {

        totalElement.textContent =
            total;

    }


    const percentage =
        total
            ? Math.round(
                completed /
                total *
                100
            )
            : 0;


    if (progress) {

        progress.style.width =
            `${percentage}%`;

    }


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


    const newValue =
        !task.completed;


    task.completed =
        newValue;


    renderMasterPlan();


    try {

        const id =
            `${currentUser.uid}_${task.planId}_${task.id}`;


        const completionRef =
            doc(
                db,
                "hybridTaskCompletions",
                id
            );


        await setDoc(

            completionRef,

            {

                studentId:
                    currentUser.uid,

                planId:
                    task.planId,

                taskId:
                    task.id,

                completed:
                    newValue,

                completedAt:
                    newValue
                        ? serverTimestamp()
                        : null,

                updatedAt:
                    serverTimestamp()

            },

            {
                merge: true
            }

        );

    } catch (error) {

        console.error(
            "TASK SAVE ERROR:",
            error
        );

        /*
         * Revert UI if save fails.
         */

        task.completed =
            !newValue;

        renderMasterPlan();

    }

}


/* =========================================================
   TODAY'S CLASSES
========================================================= */

function startTodayClassesListener() {

    const today =
        getDateKey(
            new Date()
        );


    const baseQuery =
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

            limit(20)
        );


    onSnapshot(

        baseQuery,

        (snapshot) => {

            let classes =
                snapshot.docs.map(
                    item => ({
                        id: item.id,
                        ...item.data()
                    })
                );


            /*
             * Sort locally.
             */

            classes.sort(
                (a, b) =>
                    String(
                        a.startTime || ""
                    ).localeCompare(
                        String(
                            b.startTime || ""
                        )
                    )
            );


            classes =
                classes.slice(
                    0,
                    5
                );


            renderTodayClasses(
                classes
            );

        },

        (error) => {

            console.error(
                "HYBRID CLASSES ERROR:",
                error
            );

            renderTodayClasses([]);

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


    if (!section || !list) {
        return;
    }


    if (!classes.length) {

        section.classList.add(
            "hidden"
        );

        list.innerHTML = "";

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
                                    rel="noopener noreferrer"
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

function startAnnouncementsListener() {

    const baseQuery =
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

            limit(20)
        );


    onSnapshot(

        baseQuery,

        (snapshot) => {

            let items =
                snapshot.docs.map(
                    item => ({
                        id: item.id,
                        ...item.data()
                    })
                );


            /*
             * Sort locally by createdAt.
             */

            items.sort(
                (a, b) =>
                    getTimestampMillis(
                        b.createdAt
                    ) -
                    getTimestampMillis(
                        a.createdAt
                    )
            );


            items =
                items.slice(
                    0,
                    5
                );


            renderAnnouncements(
                items
            );

        },

        (error) => {

            console.error(
                "HYBRID ANNOUNCEMENTS ERROR:",
                error
            );

            renderAnnouncements([]);

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


    if (!section || !list) {
        return;
    }


    if (!items.length) {

        section.classList.add(
            "hidden"
        );

        list.innerHTML = "";

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

function startAttendanceListener() {

    const baseQuery =
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

            limit(200)
        );


    onSnapshot(

        baseQuery,

        (snapshot) => {

            let records =
                snapshot.docs.map(
                    item => ({
                        id: item.id,
                        ...item.data()
                    })
                );


            /*
             * Sort locally.
             */

            records.sort(
                (a, b) =>
                    String(
                        b.dateKey || ""
                    ).localeCompare(
                        String(
                            a.dateKey || ""
                        )
                    )
            );


            renderAttendance(
                records
            );

        },

        (error) => {

            console.error(
                "HYBRID ATTENDANCE ERROR:",
                error
            );

            renderAttendance([]);

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


    if (!card) {
        return;
    }


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
                String(
                    item.status || ""
                ).toLowerCase() ===
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

function startLatestTestListener() {

    const baseQuery =
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

            limit(50)
        );


    onSnapshot(

        baseQuery,

        (snapshot) => {

            let results =
                snapshot.docs.map(
                    item => ({
                        id: item.id,
                        ...item.data()
                    })
                );


            /*
             * Sort locally.
             */

            results.sort(
                (a, b) =>
                    getTimestampMillis(
                        b.createdAt
                    ) -
                    getTimestampMillis(
                        a.createdAt
                    )
            );


            renderLatestTest(
                results[0] || null
            );

        },

        (error) => {

            console.error(
                "HYBRID TEST RESULT ERROR:",
                error
            );

            renderLatestTest(
                null
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


    if (!card) {
        return;
    }


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

    const button =
        document.getElementById(
            "profileButton"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
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

    const button =
        document.getElementById(
            "notificationButton"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            navigate(
                "more"
            );

        }
    );

}


/* =========================================================
   SHOW APPLICATION
========================================================= */

function showApplication() {

    if (app) {

        app.classList.remove(
            "hidden"
        );

    }


    if (loader) {

        setTimeout(
            () => {

                loader.classList.add(
                    "hidden"
                );

            },
            150
        );

    }

}


/* =========================================================
   ERROR
========================================================= */

function showError(
    error
) {

    console.error(
        "ZENOVA HYBRID FATAL ERROR:",
        error
    );


    if (!loader) {
        return;
    }


    loader.innerHTML = `

        <div
            style="
                text-align:center;
                padding:30px;
                font-family:Arial,sans-serif;
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
                    border:none;
                    border-radius:7px;
                    font-size:9px;
                    font-weight:800;
                    cursor:pointer;
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


function getTimestampMillis(
    value
) {

    if (!value) {
        return 0;
    }


    if (
        typeof value.toMillis ===
        "function"
    ) {

        return value.toMillis();

    }


    if (
        typeof value.toDate ===
        "function"
    ) {

        return value.toDate().getTime();

    }


    const date =
        new Date(value);


    return Number.isNaN(
        date.getTime()
    )
        ? 0
        : date.getTime();

}


function formatDate(
    value
) {

    const millis =
        getTimestampMillis(
            value
        );


    if (!millis) {
        return "";
    }


    return new Date(
        millis
    ).toLocaleDateString(
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

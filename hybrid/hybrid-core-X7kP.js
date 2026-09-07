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

let masterPlan = null;

let masterPlanTasks = [];

let banners = [];

let currentBanner = 0;

let bannerTimer = null;

let completionUnsubscribe = null;


/* =========================================================
   START
========================================================= */

console.log(
    "ZENOVA HYBRID: CORE STARTED"
);


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
             * Student profile is required.
             */

            await loadStudent();


            /*
             * Show UI immediately.
             */

            setupNavigation();

            setupProfile();

            setupNotifications();

            showApplication();


            /*
             * Start realtime listeners independently.
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

            showError(error);
        }

    }
);


/* =========================================================
   STUDENT
========================================================= */

async function loadStudent() {

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


    const greetingLabel =
        document.getElementById(
            "greetingLabel"
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
            details.join(" • ");
    }


    if (profileButton) {

        profileButton.textContent =
            name
                .trim()
                .charAt(0)
                .toUpperCase();
    }


    if (greetingLabel) {

        const hour =
            new Date().getHours();


        if (hour < 12) {

            greetingLabel.textContent =
                "GOOD MORNING";

        } else if (hour < 17) {

            greetingLabel.textContent =
                "GOOD AFTERNOON";

        } else {

            greetingLabel.textContent =
                "GOOD EVENING";
        }
    }

}


/* =========================================================
   BANNERS
========================================================= */

function startBannersListener() {

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


            banners.sort(
                (a, b) =>
                    Number(
                        b.priority || 0
                    ) -
                    Number(
                        a.priority || 0
                    )
            );


            renderBanners();

        },

        (error) => {

            console.error(
                "HYBRID BANNERS ERROR:",
                error
            );

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
                                    <div class="banner-label">
                                        ${escapeHtml(
                                            banner.label
                                        )}
                                    </div>
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
/* =========================================================
   MASTER PLAN — REALTIME
========================================================= */

function startMasterPlanListener() {

    const today =
        getDateKey(new Date());

    console.log(
        "ZENOVA HYBRID: Listening for master plan:",
        today
    );

    /*
     * IMPORTANT:
     * Query ONLY by date.
     *
     * We intentionally do NOT use:
     * where("active", "==", true)
     *
     * This avoids composite-index problems and also
     * allows older plans where active may be missing.
     */
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
            limit(10)
        );


    onSnapshot(
        baseQuery,

        async (snapshot) => {

            console.log(
                "ZENOVA HYBRID: Master plan documents found:",
                snapshot.size
            );


            /*
             * Convert Firestore documents.
             */
            let plans =
                snapshot.docs.map(
                    document => ({
                        id: document.id,
                        ...document.data()
                    })
                );


            console.log(
                "ZENOVA HYBRID: Master plans:",
                plans
            );


            /*
             * Treat missing active as ACTIVE.
             *
             * Only an explicit active:false hides the plan.
             */
            plans =
                plans.filter(
                    plan =>
                        plan.active !== false
                );


            /*
             * Sort by priority.
             */
            plans.sort(
                (a, b) =>
                    Number(a.priority || 9999) -
                    Number(b.priority || 9999)
            );


            /*
             * No plan for today.
             */
            if (!plans.length) {

                console.log(
                    "ZENOVA HYBRID: No active master plan for today."
                );

                masterPlanTasks = [];

                renderMasterPlan();

                return;
            }


            /*
             * Take highest-priority plan.
             */
            const plan =
                plans[0];


            console.log(
                "ZENOVA HYBRID: Selected master plan:",
                plan.id,
                plan
            );


            /*
             * Read tasks.
             */
            const tasks =
                Array.isArray(plan.tasks)
                    ? plan.tasks
                    : [];


            console.log(
                "ZENOVA HYBRID: Tasks:",
                tasks
            );


            /*
             * Load student completion state.
             */
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


            console.log(
                "ZENOVA HYBRID: Final master plan tasks:",
                masterPlanTasks
            );


            /*
             * Render immediately.
             */
            renderMasterPlan();

        },


        error => {

            console.error(
                "HYBRID MASTER PLAN REALTIME ERROR:",
                error
            );

            masterPlanTasks = [];

            renderMasterPlan();

        }

    );

}

/* =========================================================
   REALTIME TASK COMPLETIONS
========================================================= */

function startCompletionListener(
    planId
) {

    stopCompletionListener();


    const completionQuery =
        query(
            collection(
                db,
                "hybridTaskCompletions"
            ),

            where(
                "studentId",
                "==",
                currentUser.uid
            ),

            where(
                "planId",
                "==",
                planId
            ),

            limit(100)
        );


    completionUnsubscribe =
        onSnapshot(

            completionQuery,

            (snapshot) => {

                const completedMap =
                    new Map();


                snapshot.docs.forEach(
                    item => {

                        const data =
                            item.data();


                        completedMap.set(
                            String(
                                data.taskId
                            ),
                            data.completed === true
                        );

                    }
                );


                masterPlanTasks =
                    masterPlanTasks.map(
                        task => ({
                            ...task,

                            completed:
                                completedMap.get(
                                    String(task.id)
                                ) === true

                        })
                    );


                renderMasterPlan();

            },

            (error) => {

                console.error(
                    "COMPLETION LISTENER ERROR:",
                    error
                );

            }

        );
}


function stopCompletionListener() {

    if (
        typeof completionUnsubscribe ===
        "function"
    ) {

        completionUnsubscribe();

        completionUnsubscribe = null;
    }

}


/* =========================================================
   RENDER MASTER PLAN
========================================================= */

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


    const progressText =
        document.getElementById(
            "progressText"
        );


    const percentage =
        total
            ? Math.round(
                completed /
                total *
                100
            )
            : 0;


    if (completedElement) {

        completedElement.textContent =
            completed;
    }


    if (totalElement) {

        totalElement.textContent =
            total;
    }


    if (progress) {

        progress.style.width =
            `${percentage}%`;
    }


    if (progressText) {

        progressText.textContent =
            `${percentage}% complete`;
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

                    <div class="plan-icon">
                        ${getTaskIcon(task.type)}
                    </div>


                    <div class="plan-info">

                        <div class="plan-top">

                            <span class="plan-type">
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
                                        <span class="plan-time">
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
                        aria-label="Complete task"
                    >
                        ✓
                    </button>

                </article>

            `
        ).join("");


    attachPlanEvents();
}


/* =========================================================
   MASTER PLAN EVENTS
========================================================= */

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


    /*
     * Optimistic UI.
     */

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

                    <div class="class-time">
                        ${escapeHtml(
                            item.startTime || ""
                        )}
                    </div>


                    <div class="class-info">

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

            <div class="performance-top">

                <span class="performance-icon">
                    %
                </span>

                <span class="performance-label">
                    ATTENDANCE
                </span>

            </div>

            <div class="performance-loading">
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

        <div class="performance-top">

            <span class="performance-icon">
                %
            </span>

            <span class="performance-label">
                ATTENDANCE
            </span>

        </div>


        <div class="performance-number">
            ${percentage}
            <span>%</span>
        </div>


        <div class="performance-sub">
            ${present} of ${records.length} classes present
        </div>


        <div class="performance-bar">

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

            limit(20)
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


            results.sort(
                (a, b) =>
                    getTimestampMillis(
                        b.createdAt ||
                        b.date ||
                        b.updatedAt
                    ) -
                    getTimestampMillis(
                        a.createdAt ||
                        a.date ||
                        a.updatedAt
                    )
            );


            renderLatestTest(
                results[0]
            );

        },

        (error) => {

            console.error(
                "HYBRID TEST ERROR:",
                error
            );

            renderLatestTest(null);
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

            <div class="performance-top">

                <span class="performance-icon">
                    ✓
                </span>

                <span class="performance-label">
                    LATEST TEST
                </span>

            </div>

            <div class="performance-loading">
                No test result yet.
            </div>

        `;

        return;
    }


    const score =
        result.score ??
        result.marks ??
        result.obtainedMarks ??
        0;


    const total =
        result.totalMarks ??
        result.maxMarks ??
        100;


    const percentage =
        total
            ? Math.round(
                Number(score) /
                Number(total) *
                100
            )
            : 0;


    card.innerHTML = `

        <div class="performance-top">

            <span class="performance-icon">
                ✓
            </span>

            <span class="performance-label">
                LATEST TEST
            </span>

        </div>


        <div class="performance-number">
            ${escapeHtml(
                String(score)
            )}
            <span>/${escapeHtml(
                String(total)
            )}</span>
        </div>


        <div class="performance-sub">
            ${escapeHtml(
                result.testTitle ||
                result.title ||
                "Latest test"
            )}
        </div>


        <div class="performance-bar">

            <div
                style="width:${percentage}%"
            ></div>

        </div>

    `;
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
                    3
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

                    <div class="announcement-mark">

                        ${
                            item.priority ===
                            "important"
                                ? "!"
                                : "N"
                        }

                    </div>


                    <div class="announcement-info">

                        <div class="announcement-meta">

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


    const menuButton =
        document.getElementById(
            "menuButton"
        );


    if (menuButton) {

        menuButton.addEventListener(
            "click",
            () => {

                navigate("more");

            }
        );

    }

}


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

            navigate("more");

        }
    );

}


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

            navigate("more");

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


    if (
        routes[route]
    ) {

        window.location.href =
            routes[route];

    }

}


/* =========================================================
   APPLICATION
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
        value instanceof Date
    ) {

        return value.getTime();
    }


    const parsed =
        new Date(value);


    return isNaN(
        parsed.getTime()
    )
        ? 0
        : parsed.getTime();
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


    return new Intl.DateTimeFormat(
        "en-IN",
        {
            day: "numeric",
            month: "short"
        }
    ).format(
        new Date(millis)
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

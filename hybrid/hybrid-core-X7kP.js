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

let banners = [];

let masterPlan = [];

let currentBanner = 0;

let bannerInterval = null;



/* =========================================================
   AUTHENTICATION
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


        currentUser = user;


        try {

            await loadStudent();

            setupNavigation();

            setupProfile();

            setupNotifications();


            await Promise.all([

                loadBanners(),

                loadMasterPlan(),

                loadTodayClasses(),

                loadAnnouncements()

            ]);


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

    const reference =
        doc(
            db,
            "students",
            currentUser.uid
        );


    const snapshot =
        await getDoc(
            reference
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


    const information = [];


    if (
        student.className
    ) {

        information.push(
            student.className
        );

    }


    if (
        student.combination
    ) {

        information.push(
            student.combination
        );

    }


    if (
        student.board
    ) {

        information.push(
            student.board
        );

    }


    if (!information.length) {

        information.push(
            "Hybrid Program"
        );

    }


    document.getElementById(
        "studentMeta"
    ).textContent =
        information.join(
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

    const bannersQuery =
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

            let firstLoad = true;


            onSnapshot(
                bannersQuery,

                snapshot => {

                    banners =
                        snapshot.docs.map(
                            item => ({
                                id:
                                    item.id,

                                ...item.data()
                            })
                        );


                    renderBanners();


                    if (
                        firstLoad
                    ) {

                        firstLoad = false;

                        resolve();

                    }

                },

                error => {

                    console.error(
                        "Banners:",
                        error
                    );

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


    const slider =
        document.getElementById(
            "bannerSlider"
        );


    const dots =
        document.getElementById(
            "bannerDots"
        );


    const counter =
        document.getElementById(
            "bannerCounter"
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


    slider.innerHTML =
        banners.map(
            (
                banner,
                index
            ) => `

                <article
                    class="banner-slide ${
                        index === 0
                            ? "active"
                            : ""
                    }"
                >

                    <img
                        src="${escapeAttribute(
                            banner.imageUrl ||
                            ""
                        )}"
                        alt="${escapeAttribute(
                            banner.title ||
                            "Zenova"
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
                                        ${escapeHTML(
                                            banner.label
                                        )}
                                    </span>
                                `
                                : ""
                        }


                        <h2>
                            ${escapeHTML(
                                banner.title ||
                                ""
                            )}
                        </h2>


                        ${
                            banner.description
                                ? `
                                    <p>
                                        ${escapeHTML(
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
            (
                _,
                index
            ) => `

                <button
                    class="banner-dot ${
                        index === 0
                            ? "active"
                            : ""
                    }"
                    data-banner-index="${index}"
                    type="button"
                ></button>

            `
        ).join("");


    updateBannerCounter();


    dots
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
            (
                slide,
                index
            ) => {

                slide.classList.toggle(
                    "active",
                    index ===
                        currentBanner
                );

            }
        );


    document
        .querySelectorAll(
            ".banner-dot"
        )
        .forEach(
            (
                dot,
                index
            ) => {

                dot.classList.toggle(
                    "active",
                    index ===
                        currentBanner
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
        ).padStart(
            2,
            "0"
        )} / ${String(
            banners.length
        ).padStart(
            2,
            "0"
        )}`;

}


function restartBanner() {

    clearInterval(
        bannerInterval
    );


    if (
        banners.length <= 1
    ) {

        return;

    }


    bannerInterval =
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

    const dateKey =
        getTodayKey();


    const planQuery =
        query(
            collection(
                db,
                "hybridMasterPlans"
            ),

            where(
                "dateKey",
                "==",
                dateKey
            ),

            where(
                "active",
                "==",
                true
            ),

            limit(1)
        );


    return new Promise(
        (
            resolve,
            reject
        ) => {

            let firstLoad = true;


            onSnapshot(
                planQuery,

                async snapshot => {

                    if (
                        snapshot.empty
                    ) {

                        masterPlan = [];

                    } else {

                        const plan =
                            snapshot.docs[0];


                        const data =
                            plan.data();


                        const tasks =
                            Array.isArray(
                                data.tasks
                            )
                                ? data.tasks
                                : [];


                        masterPlan =
                            await Promise.all(
                                tasks.map(
                                    async task => {

                                        const completed =
                                            await getCompletion(
                                                plan.id,
                                                task.id
                                            );


                                        return {

                                            ...task,

                                            planId:
                                                plan.id,

                                            completed

                                        };

                                    }
                                )
                            );

                    }


                    renderMasterPlan();


                    if (
                        firstLoad
                    ) {

                        firstLoad = false;

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

    const reference =
        doc(
            db,
            "hybridTaskCompletions",
            `${currentUser.uid}_${planId}_${taskId}`
        );


    const snapshot =
        await getDoc(
            reference
        );


    if (
        !snapshot.exists()
    ) {

        return false;

    }


    return (
        snapshot.data()
            .completed === true
    );

}


function renderMasterPlan() {

    const list =
        document.getElementById(
            "masterPlanList"
        );


    const progressText =
        document.getElementById(
            "masterProgressText"
        );


    const progress =
        document.getElementById(
            "masterProgress"
        );


    if (!masterPlan.length) {

        list.innerHTML = `

            <div
                class="empty-card"
            >
                No master plan published for today.
            </div>

        `;


        progressText.textContent =
            "0 / 0";


        progress.style.width =
            "0%";


        return;

    }


    list.innerHTML =
        masterPlan.map(
            (
                task,
                index
            ) => `

                <article
                    class="plan-card ${
                        task.completed
                            ? "completed"
                            : ""
                    }"
                >

                    <div
                        class="plan-number"
                    >
                        ${String(
                            index + 1
                        ).padStart(
                            2,
                            "0"
                        )}
                    </div>


                    <div
                        class="plan-icon"
                    >
                        ${taskIcon(
                            task.type
                        )}
                    </div>


                    <div
                        class="plan-information"
                    >

                        <span
                            class="plan-type"
                        >
                            ${escapeHTML(
                                (
                                    task.type ||
                                    "STUDY"
                                ).toUpperCase()
                            )}
                        </span>


                        <h3>
                            ${escapeHTML(
                                task.subject ||
                                task.title ||
                                ""
                            )}
                        </h3>


                        <p>
                            ${escapeHTML(
                                task.title ||
                                task.chapter ||
                                ""
                            )}
                        </p>

                    </div>


                    <button
                        class="plan-button"
                        data-resource-url="${
                            escapeAttribute(
                                task.resourceUrl ||
                                ""
                            )
                        }"
                        type="button"
                    >
                        ${taskAction(
                            task.type
                        )}
                    </button>


                    <button
                        class="plan-complete"
                        data-task-id="${
                            escapeAttribute(
                                task.id
                            )
                        }"
                        type="button"
                    >
                        ✓
                    </button>

                </article>

            `
        ).join("");


    attachPlanEvents();

    updatePlanProgress();

}


function attachPlanEvents() {

    document
        .querySelectorAll(
            "[data-task-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async event => {

                        event.stopPropagation();


                        await toggleTask(
                            button.dataset.taskId
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".plan-button"
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
        masterPlan.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    taskId
                )
        );


    if (!task) {

        return;

    }


    task.completed =
        !task.completed;


    renderMasterPlan();


    const reference =
        doc(
            db,
            "hybridTaskCompletions",
            `${currentUser.uid}_${task.planId}_${task.id}`
        );


    await setDoc(
        reference,
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


function updatePlanProgress() {

    const total =
        masterPlan.length;


    const completed =
        masterPlan.filter(
            item =>
                item.completed
        ).length;


    const percentage =
        total
            ? (
                completed /
                total
            ) * 100
            : 0;


    document.getElementById(
        "masterProgressText"
    ).textContent =
        `${completed} / ${total}`;


    document.getElementById(
        "masterProgress"
    ).style.width =
        `${percentage}%`;

}



/* =========================================================
   TODAY'S CLASSES
========================================================= */

function loadTodayClasses() {

    const today =
        getTodayKey();


    const classesQuery =
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

            limit(6)
        );


    return new Promise(
        (
            resolve,
            reject
        ) => {

            let firstLoad = true;


            onSnapshot(
                classesQuery,

                snapshot => {

                    const classes =
                        snapshot.docs.map(
                            item => ({
                                id:
                                    item.id,

                                ...item.data()
                            })
                        );


                    renderClasses(
                        classes
                    );


                    if (
                        firstLoad
                    ) {

                        firstLoad = false;

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


function renderClasses(
    classes
) {

    const section =
        document.getElementById(
            "classesSection"
        );


    const list =
        document.getElementById(
            "classesList"
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
                    class="class-card"
                >

                    <div
                        class="class-time"
                    >
                        ${escapeHTML(
                            item.startTime ||
                            ""
                        )}
                    </div>


                    <div
                        class="class-information"
                    >

                        <strong>
                            ${escapeHTML(
                                item.subject ||
                                ""
                            )}
                        </strong>


                        <span>
                            ${escapeHTML(
                                item.topic ||
                                ""
                            )}
                        </span>


                        <div
                            class="class-mode"
                        >
                            ${escapeHTML(
                                item.mode ||
                                ""
                            )}
                        </div>

                    </div>


                    ${
                        item.meetingUrl
                            ? `

                                <a
                                    class="join-button"
                                    href="${escapeAttribute(
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

    const announcementQuery =
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
        (
            resolve,
            reject
        ) => {

            let firstLoad = true;


            onSnapshot(
                announcementQuery,

                snapshot => {

                    const items =
                        snapshot.docs.map(
                            item => ({
                                id:
                                    item.id,

                                ...item.data()
                            })
                        );


                    renderAnnouncements(
                        items
                    );


                    if (
                        firstLoad
                    ) {

                        firstLoad = false;

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
                        class="announcement-icon"
                    >
                        N
                    </div>


                    <div
                        class="announcement-information"
                    >

                        <div
                            class="announcement-meta"
                        >

                            <span
                                class="announcement-category"
                            >
                                ${escapeHTML(
                                    item.category ||
                                    "NOTICE"
                                )}
                            </span>


                            <span
                                class="announcement-date"
                            >
                                ${formatDate(
                                    item.createdAt
                                )}
                            </span>

                        </div>


                        <h3>
                            ${escapeHTML(
                                item.title ||
                                ""
                            )}
                        </h3>


                        ${
                            item.description
                                ? `

                                    <p>
                                        ${escapeHTML(
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


    if (
        destination
    ) {

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
   APPLICATION
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


function showError() {

    loader.innerHTML = `

        <div
            style="
                text-align:center;
                padding:30px;
            "
        >

            <strong
                style="
                    font-size:22px;
                    letter-spacing:3px;
                "
            >
                ZENOVA
            </strong>


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
                    border:0;
                    border-radius:7px;
                    background:#111;
                    color:white;
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

function getTodayKey() {

    const date =
        new Date();


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


function taskIcon(
    type
) {

    const value =
        String(
            type || ""
        ).toLowerCase();


    if (
        value.includes(
            "live"
        )
    ) {

        return "▶";

    }


    if (
        value.includes(
            "video"
        ) ||
        value.includes(
            "record"
        )
    ) {

        return "▷";

    }


    if (
        value.includes(
            "note"
        ) ||
        value.includes(
            "pdf"
        )
    ) {

        return "▤";

    }


    if (
        value.includes(
            "test"
        )
    ) {

        return "□";

    }


    if (
        value.includes(
            "revision"
        )
    ) {

        return "↻";

    }


    return "•";

}


function taskAction(
    type
) {

    const value =
        String(
            type || ""
        ).toLowerCase();


    if (
        value.includes(
            "live"
        )
    ) {

        return "JOIN";

    }


    if (
        value.includes(
            "video"
        ) ||
        value.includes(
            "record"
        )
    ) {

        return "WATCH";

    }


    if (
        value.includes(
            "note"
        ) ||
        value.includes(
            "pdf"
        )
    ) {

        return "OPEN";

    }


    if (
        value.includes(
            "test"
        )
    ) {

        return "START";

    }


    return "OPEN";

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
            new Date(
                value
            );

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


function escapeHTML(
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


function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}

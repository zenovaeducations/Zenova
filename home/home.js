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
    getDocs,
    limit
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   ELEMENTS
========================================================= */

const loader =
    document.getElementById("zenovaLoader");

const app =
    document.getElementById("zenovaApp");


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let student = null;

let purchasedBatches = [];


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        /*
         * USER NOT LOGGED IN
         * Go to the actual account login page.
         */

        if (!user) {

            window.location.replace(
                "../account/login/"
            );

            return;

        }


        currentUser = user;


        try {

            /*
             * Load the ZEN2 student profile.
             */

            const validStudent =
                await loadStudent();


            /*
             * If the student is not onboarded,
             * loadStudent() already redirected.
             */

            if (!validStudent) {

                return;

            }


            /*
             * Student is valid.
             * Now load Home.
             */

            await loadHomeData();

            setupNavigation();

            showApp();

        }

        catch (error) {

            console.error(
                "ZEN2 HOME ERROR:",
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

    /*
     * IMPORTANT:
     *
     * ZEN2 uses:
     *
     * zen2Students/{uid}
     *
     * NOT:
     *
     * students/{uid}
     */

    const studentRef =
        doc(
            db,
            "zen2Students",
            currentUser.uid
        );


    const snapshot =
        await getDoc(
            studentRef
        );


    /*
     * No student profile.
     *
     * This means onboarding has not
     * been completed yet.
     */

    if (!snapshot.exists()) {

        console.log(
            "ZEN2: Student profile not found. Opening onboarding."
        );


        window.location.replace(
            "../account/onboarding/"
        );


        return false;

    }


    student =
        snapshot.data();


    /*
     * Check the exact field used by
     * the ZEN2 onboarding system.
     */

    if (
        student.onboardingComplete !== true
    ) {

        console.log(
            "ZEN2: Onboarding is not complete."
        );


        window.location.replace(
            "../account/onboarding/"
        );


        return false;

    }


    /*
     * Student is completely valid.
     */

    console.log(
        "ZEN2: Student authenticated:",
        student.name
    );


    renderStudent();


    return true;

}


/* =========================================================
   RENDER STUDENT
========================================================= */

function renderStudent() {

    const name =
        student.name ||
        currentUser.displayName ||
        "Student";


    const nameElement =
        document.getElementById(
            "studentName"
        );


    if (nameElement) {

        nameElement.textContent =
            name;

    }


    const initial =
        document.getElementById(
            "profileInitial"
        );


    if (initial) {

        initial.textContent =
            name
                .charAt(0)
                .toUpperCase();

    }

}


/* =========================================================
   LOAD HOME
========================================================= */

async function loadHomeData() {

    const [
        banners,
        batches,
        liveClasses,
        announcements,
        enrollments
    ] =
        await Promise.all([

            safeQuery(
                loadBanners
            ),

            safeQuery(
                loadBatches
            ),

            safeQuery(
                loadLiveClasses
            ),

            safeQuery(
                loadAnnouncements
            ),

            safeQuery(
                loadEnrollments
            )

        ]);


    purchasedBatches =
        enrollments || [];


    renderBanners(
        banners || []
    );


    renderBatches(
        batches || []
    );


    renderLiveClasses(
        liveClasses || []
    );


    renderAnnouncements(
        announcements || []
    );


    renderContinueLearning();

}


/* =========================================================
   SAFE QUERY
========================================================= */

async function safeQuery(
    functionToRun
) {

    try {

        return await functionToRun();

    }

    catch (error) {

        console.warn(
            "ZEN2 HOME SECTION ERROR:",
            error
        );

        return [];

    }

}


/* =========================================================
   BANNERS
========================================================= */

async function loadBanners() {

    const ref =
        collection(
            db,
            "homeBanners"
        );


    const q =
        query(
            ref,

            where(
                "active",
                "==",
                true
            ),

            limit(10)
        );


    const snapshot =
        await getDocs(q);


    const banners =
        snapshot.docs.map(
            item => ({

                id:
                    item.id,

                ...item.data()

            })
        );


    banners.sort(
        (a, b) =>
            Number(
                a.order || 999
            ) -
            Number(
                b.order || 999
            )
    );


    return banners;

}


/* =========================================================
   BATCHES
========================================================= */

async function loadBatches() {

    const ref =
        collection(
            db,
            "zen2Courses"
        );


    const q =
        query(
            ref,

            limit(30)
        );


    const snapshot =
        await getDocs(q);


    return snapshot.docs.map(
        item => ({

            id:
                item.id,

            ...item.data()

        })
    );

}


/* =========================================================
   STUDENT ENROLLMENTS
========================================================= */

async function loadEnrollments() {

    const ref =
        collection(
            db,
            "studentEnrollments"
        );


    const q =
        query(
            ref,

            where(
                "studentUid",
                "==",
                currentUser.uid
            ),

            limit(30)
        );


    const snapshot =
        await getDocs(q);


    return snapshot.docs.map(
        item => ({

            id:
                item.id,

            ...item.data()

        })
    );

}


/* =========================================================
   LIVE CLASSES
========================================================= */

async function loadLiveClasses() {

    const ref =
        collection(
            db,
            "liveClasses"
        );


    const q =
        query(
            ref,

            where(
                "active",
                "==",
                true
            ),

            limit(30)
        );


    const snapshot =
        await getDocs(q);


    return snapshot.docs.map(
        item => ({

            id:
                item.id,

            ...item.data()

        })
    );

}


/* =========================================================
   ANNOUNCEMENTS
========================================================= */

async function loadAnnouncements() {

    const ref =
        collection(
            db,
            "announcements"
        );


    const q =
        query(
            ref,

            where(
                "active",
                "==",
                true
            ),

            limit(10)
        );


    const snapshot =
        await getDocs(q);


    return snapshot.docs.map(
        item => ({

            id:
                item.id,

            ...item.data()

        })
    );

}


/* =========================================================
   BANNERS UI
========================================================= */

function renderBanners(
    banners
) {

    const section =
        document.getElementById(
            "heroSection"
        );

    const slider =
        document.getElementById(
            "heroSlider"
        );

    const dots =
        document.getElementById(
            "heroDots"
        );


    if (
        !section ||
        !slider ||
        !dots
    ) {

        return;

    }


    if (
        !banners.length
    ) {

        section.classList.add(
            "hidden"
        );

        return;

    }


    section.classList.remove(
        "hidden"
    );


    slider.innerHTML =
        banners.map(
            (
                banner,
                index
            ) => `

                <div
                    class="hero-slide ${
                        index === 0
                            ? "active"
                            : ""
                    }"
                    data-link="${
                        escapeAttr(
                            banner.link || ""
                        )
                    }"
                >

                    <img
                        src="${
                            escapeAttr(
                                banner.imageUrl || ""
                            )
                        }"
                        alt=""
                    >

                    ${
                        banner.title
                            ? `

                                <div class="banner-content">

                                    <h2>
                                        ${
                                            escapeHtml(
                                                banner.title
                                            )
                                        }
                                    </h2>

                                    ${
                                        banner.buttonText
                                            ? `

                                                <button>
                                                    ${
                                                        escapeHtml(
                                                            banner.buttonText
                                                        )
                                                    }
                                                </button>

                                            `
                                            : ""
                                    }

                                </div>

                            `
                            : ""
                    }

                </div>

            `
        )
        .join("");


    dots.innerHTML =
        banners.map(
            (
                _,
                index
            ) => `

                <button
                    class="hero-dot ${
                        index === 0
                            ? "active"
                            : ""
                    }"
                    data-index="${index}"
                ></button>

            `
        )
        .join("");


    startBannerSlider(
        banners.length
    );


    slider
        .querySelectorAll(
            ".hero-slide"
        )
        .forEach(
            slide => {

                slide.addEventListener(
                    "click",
                    () => {

                        const link =
                            slide.dataset.link;

                        if (link) {

                            window.location.href =
                                link;

                        }

                    }
                );

            }
        );

}


/* =========================================================
   BANNER SLIDER
========================================================= */

function startBannerSlider(
    count
) {

    if (
        count <= 1
    ) {

        return;

    }


    const slides =
        document.querySelectorAll(
            ".hero-slide"
        );


    const dots =
        document.querySelectorAll(
            ".hero-dot"
        );


    let current = 0;


    function show(
        index
    ) {

        current =
            (
                index +
                count
            ) %
            count;


        slides.forEach(
            (
                slide,
                i
            ) => {

                slide.classList.toggle(
                    "active",
                    i === current
                );

            }
        );


        dots.forEach(
            (
                dot,
                i
            ) => {

                dot.classList.toggle(
                    "active",
                    i === current
                );

            }
        );

    }


    dots.forEach(
        dot => {

            dot.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    show(
                        Number(
                            dot.dataset.index
                        )
                    );

                }
            );

        }
    );


    setInterval(
        () => {

            show(
                current + 1
            );

        },
        5000
    );

}


/* =========================================================
   MY BATCHES
========================================================= */
function renderBatches(batches) {

    const container =
        document.getElementById("myBatchesList");

    if (!container) {
        return;
    }

    if (!batches.length) {

        container.innerHTML = `
            <div class="loading-card">
                No batches available right now.
            </div>
        `;

        return;
    }

    container.innerHTML =
        batches.map(batch => {

            const purchased =
                isBatchPurchased(batch.id);

            return `

                <article class="batch-card">

                    <div class="batch-image">

                        ${
                            batch.thumbnailUrl ||
                            batch.imageUrl
                                ? `
                                    <img
                                        src="${escapeAttr(
                                            batch.thumbnailUrl ||
                                            batch.imageUrl
                                        )}"
                                        alt=""
                                        loading="lazy"
                                    >
                                `
                                : `
                                    <div class="batch-image-placeholder">
                                        ZENOVA
                                    </div>
                                `
                        }

                    </div>


                    <div class="batch-details">

                        <h3>
                            ${escapeHtml(
                                batch.name ||
                                batch.title ||
                                "Zenova Batch"
                            )}
                        </h3>


                        <div class="batch-actions">

                            <button
                                class="batch-button explore-button"
                                data-explore-id="${escapeAttr(
                                    batch.id
                                )}"
                            >
                                EXPLORE BATCH
                            </button>


                            ${
                                purchased
                                    ? `
                                        <button
                                            class="batch-button buy-button purchased"
                                            data-open-batch="${escapeAttr(
                                                batch.id
                                            )}"
                                        >
                                            OPEN BATCH
                                        </button>
                                    `
                                    : `
                                        <button
                                            class="batch-button buy-button"
                                            data-buy-id="${escapeAttr(
                                                batch.id
                                            )}"
                                        >
                                            BUY NOW
                                        </button>
                                    `
                            }

                        </div>

                    </div>

                </article>

            `;

        }).join("");


    setupBatchButtons();

}
/* =========================================================
   PURCHASE CHECK
========================================================= */

function isBatchPurchased(
    courseId
) {

    return purchasedBatches.some(
        enrollment => {

            const enrolledId =
                enrollment.courseId ||
                enrollment.zen2CourseId ||
                enrollment.batchId ||
                enrollment.crmCourseId;


            const status =
                String(
                    enrollment.status ||
                    ""
                )
                .toLowerCase();


            return (
                String(
                    enrolledId
                ) ===
                String(
                    courseId
                )
                &&
                (
                    status === "active" ||
                    status === "enrolled" ||
                    enrollment.accessGranted === true ||
                    enrollment.active === true
                )
            );

        }
    );

}


/* =========================================================
   BATCH BUTTONS
========================================================= */

function setupBatchButtons() {

    document
        .querySelectorAll(
            "[data-explore-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.exploreId;


                        window.location.href =
                            `../batch-details/?courseId=${
                                encodeURIComponent(
                                    id
                                )
                            }`;

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "[data-buy-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.buyId;


                        window.location.href =
                            `../batch-details/?courseId=${
                                encodeURIComponent(
                                    id
                                )
                            }&buy=true`;

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "[data-open-batch]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.openBatch;


                        window.location.href =
                            `../study/?courseId=${
                                encodeURIComponent(
                                    id
                                )
                            }`;

                    }
                );

            }
        );

}


/* =========================================================
   LIVE CLASSES
========================================================= */

function renderLiveClasses(
    classes
) {

    const container =
        document.getElementById(
            "liveList"
        );


    if (!container) {

        return;

    }


    const now =
        new Date();


    const today =
        classes
            .map(
                item => {

                    const start =
                        getDate(
                            item.scheduledAt
                        );


                    const duration =
                        Number(
                            item.durationMinutes ||
                            60
                        );


                    const end =
                        new Date(
                            start.getTime() +
                            duration *
                            60000
                        );


                    return {

                        ...item,

                        start,

                        end

                    };

                }
            )
            .filter(
                item =>
                    !Number.isNaN(
                        item.start.getTime()
                    )
            )
            .filter(
                item =>
                    isSameDay(
                        item.start,
                        now
                    )
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    a.start -
                    b.start
            );


    if (!today.length) {

        container.innerHTML = `

            <div class="no-live-class">

                <strong>
                    No class scheduled for today
                </strong>

                <span>
                    Check again later for your next live class.
                </span>

            </div>

        `;

        return;

    }


    const liveNow =
        today.find(
            item =>
                now >= item.start &&
                now <= item.end
        );


    const upcoming =
        today.find(
            item =>
                item.start > now
        );


    const selected =
        liveNow ||
        upcoming;


    if (!selected) {

        container.innerHTML = `

            <div class="no-live-class">

                <strong>
                    Today's classes are completed
                </strong>

                <span>
                    No more live classes scheduled today.
                </span>

            </div>

        `;

        return;

    }


    const isLive =
        Boolean(
            liveNow
        );


    const title =
        selected.isCasual
            ? (
                selected.topicName ||
                "Live Class"
            )
            : (
                selected.chapterName ||
                selected.subjectName ||
                "Live Class"
            );


    const subtitle =
        selected.isCasual
            ? "Casual Session"
            : [
                selected.subjectName,
                selected.chapterName
            ]
            .filter(Boolean)
            .join(
                " • "
            );


    container.innerHTML = `

        <article
            class="live-home-card"
        >

            <div
                class="live-thumbnail"
            >

                ${
                    selected.thumbnailUrl
                        ? `

                            <img
                                src="${
                                    escapeAttr(
                                        selected.thumbnailUrl
                                    )
                                }"
                                alt=""
                            >

                        `
                        : `

                            <div
                                class="live-thumbnail-placeholder"
                            >
                                LIVE
                            </div>

                        `
                }


                <span
                    class="live-status ${
                        isLive
                            ? "live-now"
                            : "upcoming"
                    }"
                >

                    ${
                        isLive
                            ? "● LIVE NOW"
                            : "UPCOMING"
                    }

                </span>

            </div>


            <div
                class="live-home-content"
            >

                <div class="live-label">

                    ${
                        isLive
                            ? "LIVE NOW"
                            : "NEXT CLASS"
                    }

                </div>


                <h3>
                    ${
                        escapeHtml(
                            title
                        )
                    }
                </h3>


                <p>
                    ${
                        escapeHtml(
                            subtitle
                        )
                    }
                </p>


                ${
                    selected.facultyName
                        ? `

                            <small>
                                By ${
                                    escapeHtml(
                                        selected.facultyName
                                    )
                                }
                            </small>

                        `
                        : ""
                }


                <div class="live-time">

                    ${
                        isLive
                            ? "Class is live now"
                            : formatTime(
                                selected.start
                            )
                    }

                </div>


                ${
                    isLive
                        ? `

                            <button
                                id="joinLiveButton"
                                class="join-live-btn"
                            >
                                JOIN LIVE →
                            </button>

                        `
                        : `

                            <div class="countdown">

                                Starts in

                                <strong
                                    id="liveCountdown"
                                >
                                    ${getCountdown(
                                        selected.start
                                    )}
                                </strong>

                            </div>

                        `
                }

            </div>

        </article>

    `;


    if (isLive) {

        document
            .getElementById(
                "joinLiveButton"
            )
            ?.addEventListener(
                "click",
                () => {

                    if (
                        selected.liveLink
                    ) {

                        window.location.href =
                            selected.liveLink;

                    }

                }
            );

    }

    else {

        startCountdown(
            selected.start
        );

    }

}


/* =========================================================
   COUNTDOWN
========================================================= */

function startCountdown(
    target
) {

    const element =
        document.getElementById(
            "liveCountdown"
        );


    if (!element) {

        return;

    }


    const timer =
        setInterval(
            () => {

                const remaining =
                    target.getTime() -
                    Date.now();


                if (
                    remaining <= 0
                ) {

                    clearInterval(
                        timer
                    );


                    loadHomeData();

                    return;

                }


                element.textContent =
                    getCountdown(
                        target
                    );

            },
            1000
        );

}


/* =========================================================
   CONTINUE LEARNING
========================================================= */

function renderContinueLearning() {

    const card =
        document.getElementById(
            "continueCard"
        );


    if (!card) {

        return;

    }


    if (
        !purchasedBatches.length
    ) {

        card.innerHTML = `

            <div
                class="continue-content"
            >

                <span>
                    START LEARNING
                </span>

                <h3>
                    Your learning journey starts here.
                </h3>

                <p>
                    Purchase a batch to start learning.
                </p>

            </div>

        `;

        return;

    }


    const enrollment =
        purchasedBatches[0];


    const progress =
        Math.max(
            0,
            Math.min(
                100,
                Number(
                    enrollment.progress ||
                    0
                )
            )
        );


    card.innerHTML = `

        <div class="continue-thumbnail">

            ${
                enrollment.batchImageUrl
                    ? `

                        <img
                            src="${
                                escapeAttr(
                                    enrollment.batchImageUrl
                                )
                            }"
                            alt=""
                        >

                    `
                    : `

                        <div>
                            ZENOVA
                        </div>

                    `
            }

        </div>


        <div class="continue-content">

            <span>
                CONTINUE LEARNING
            </span>

            <h3>
                ${
                    escapeHtml(
                        enrollment.lastContentTitle ||
                        enrollment.batchName ||
                        "Continue Learning"
                    )
                }
            </h3>


            <p>
                ${
                    escapeHtml(
                        enrollment.lastContentSubtitle ||
                        ""
                    )
                }
            </p>


            <div class="continue-progress">

                <div>

                    <span
                        style="width:${progress}%"
                    ></span>

                </div>

                <strong>
                    ${progress}%
                </strong>

            </div>

        </div>


        <button
            id="continueButton"
            class="continue-button"
        >
            CONTINUE
        </button>

    `;


    document
        .getElementById(
            "continueButton"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.href =
                    "../study/";

            }
        );

}


/* =========================================================
   ANNOUNCEMENTS
========================================================= */

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


    if (
        !section ||
        !list
    ) {

        return;

    }


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
        items
            .slice(
                0,
                3
            )
            .map(
                item => `

                    <article
                        class="announcement-card"
                    >

                        <div
                            class="announcement-icon"
                        >
                            📢
                        </div>


                        <div>

                            <strong>
                                ${
                                    escapeHtml(
                                        item.title ||
                                        ""
                                    )
                                }
                            </strong>


                            <p>
                                ${
                                    escapeHtml(
                                        item.description ||
                                        ""
                                    )
                                }
                            </p>

                        </div>


                        <span>
                            →
                        </span>

                    </article>

                `
            )
            .join("");

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


    document
        .getElementById(
            "profileShortcut"
        )
        ?.addEventListener(
            "click",
            () => {

                navigate(
                    "profile"
                );

            }
        );


    document
        .getElementById(
            "aiButton"
        )
        ?.addEventListener(
            "click",
            () => {

                navigate(
                    "ai"
                );

            }
        );

}


/* =========================================================
   ROUTES
========================================================= */

function navigate(
    route
) {

    const routes = {

        revision:
            "../revision/",

        live:
            "../live/",

        tests:
            "../tests/",

        doubts:
            "../doubts/",

        profile:
            "../profile/",

        ai:
            "../ai/"

    };


    if (
        routes[route]
    ) {

        window.location.href =
            routes[route];

    }

}


/* =========================================================
   DATE
========================================================= */

function getDate(
    value
) {

    if (!value) {

        return new Date(
            "invalid"
        );

    }


    if (
        typeof value.toDate ===
        "function"
    ) {

        return value.toDate();

    }


    return new Date(
        value
    );

}


/* =========================================================
   SAME DAY
========================================================= */

function isSameDay(
    a,
    b
) {

    return (
        a.getFullYear() ===
            b.getFullYear() &&

        a.getMonth() ===
            b.getMonth() &&

        a.getDate() ===
            b.getDate()
    );

}


/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(
    date
) {

    return date.toLocaleTimeString(
        "en-IN",
        {
            hour:
                "numeric",

            minute:
                "2-digit"
        }
    );

}


/* =========================================================
   COUNTDOWN TEXT
========================================================= */

function getCountdown(
    target
) {

    const difference =
        Math.max(
            0,
            target.getTime() -
            Date.now()
        );


    const totalSeconds =
        Math.floor(
            difference /
            1000
        );


    const hours =
        Math.floor(
            totalSeconds /
            3600
        );


    const minutes =
        Math.floor(
            (
                totalSeconds %
                3600
            ) /
            60
        );


    const seconds =
        totalSeconds %
        60;


    if (
        hours > 0
    ) {

        return `${hours}h ${minutes}m`;

    }


    if (
        minutes > 0
    ) {

        return `${minutes}m ${seconds}s`;

    }


    return `${seconds}s`;

}


/* =========================================================
   HTML SAFETY
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


function escapeAttr(
    value
) {

    return escapeHtml(
        value
    );

}


/* =========================================================
   SHOW APP
========================================================= */

function showApp() {

    app?.classList.remove(
        "hidden"
    );


    setTimeout(
        () => {

            loader?.classList.add(
                "fade-out"
            );

        },
        100
    );

}


/* =========================================================
   ERROR
========================================================= */

function showError() {

    if (!loader) {

        return;

    }


    loader.innerHTML = `

        <div
            style="
                text-align:center;
                padding:30px;
            "
        >

            <div
                style="
                    font-size:24px;
                    font-weight:800;
                    letter-spacing:3px;
                "
            >
                ZENOVA
            </div>


            <p
                style="
                    margin-top:10px;
                    color:#777;
                    font-size:12px;
                "
            >
                We couldn't load your
                learning space.
            </p>


            <button
                onclick="location.reload()"
                style="
                    margin-top:15px;
                    border:0;
                    padding:10px 18px;
                    border-radius:8px;
                    background:#111;
                    color:#fff;
                "
            >
                TRY AGAIN
            </button>

        </div>

    `;

}

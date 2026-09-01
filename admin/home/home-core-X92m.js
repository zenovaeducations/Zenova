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


/* ============================================================
   ELEMENTS
============================================================ */

const loader =
    document.getElementById(
        "pageLoader"
    );

const app =
    document.getElementById(
        "app"
    );


let user = null;
let profile = null;
let enrollments = [];


/* ============================================================
   AUTH + ONBOARDING GATE
============================================================ */

onAuthStateChanged(
    auth,
    async currentUser => {

        if (!currentUser) {

            window.location.replace(
                "../login/"
            );

            return;

        }


        user =
            currentUser;


        try {

            const studentRef =
                doc(
                    db,
                    "students",
                    user.uid
                );


            const snapshot =
                await getDoc(
                    studentRef
                );


            /*
             * No student profile.
             */

            if (
                !snapshot.exists()
            ) {

                window.location.replace(
                    "../onboarding/"
                );

                return;

            }


            profile =
                snapshot.data();


            /*
             * Do not allow partially
             * completed onboarding.
             */

            if (
                !completeProfile(
                    profile
                )
            ) {

                window.location.replace(
                    "../onboarding/"
                );

                return;

            }


            renderStudent();


            await loadHome();


            /*
             * Only after all essential
             * authentication/profile checks
             * are complete do we reveal Home.
             */

            loader.classList.add(
                "hidden"
            );

            app.classList.remove(
                "hidden"
            );


        } catch (error) {

            console.error(
                "Zenova Home Error:",
                error
            );


            showLoadError();

        }

    }
);


/* ============================================================
   PROFILE VALIDATION
============================================================ */

function completeProfile(
    data
) {

    if (
        !data ||
        data.onboardingComplete !== true
    ) {

        return false;

    }


    if (
        typeof data.name !== "string" ||
        data.name.trim().length < 2
    ) {

        return false;

    }


    const allowedClasses = [

        "Under 8th",
        "8th",
        "9th",
        "10th",
        "1st PUC",
        "2nd PUC"

    ];


    if (
        !allowedClasses.includes(
            data.className
        )
    ) {

        return false;

    }


    /*
     * 10th
     */

    if (
        data.className === "10th"
    ) {

        if (
            !data.board ||
            !data.studyMode
        ) {

            return false;

        }

    }


    /*
     * PUC
     */

    if (
        data.className === "1st PUC" ||
        data.className === "2nd PUC"
    ) {

        if (
            !data.combination ||
            !data.target ||
            !data.studyMode
        ) {

            return false;

        }

    }


    /*
     * Under 8th / 8th / 9th
     */

    if (
        data.className === "Under 8th" ||
        data.className === "8th" ||
        data.className === "9th"
    ) {

        if (
            !data.studyMode
        ) {

            return false;

        }

    }


    return true;

}


/* ============================================================
   STUDENT HEADER
============================================================ */

function renderStudent() {

    const name =
        profile.name.trim();


    document.getElementById(
        "studentName"
    ).textContent =
        name;


    document.getElementById(
        "profileInitial"
    ).textContent =
        name
            .charAt(0)
            .toUpperCase();


    let academic =
        profile.className;


    if (
        profile.board
    ) {

        academic +=
            ` • ${profile.board}`;

    }


    if (
        profile.combination
    ) {

        academic +=
            ` • ${profile.combination}`;

    }


    document.getElementById(
        "studentAcademic"
    ).textContent =
        academic;

}


/* ============================================================
   LOAD HOME
============================================================ */

async function loadHome() {

    const results =
        await Promise.allSettled([

            loadBanners(),

            loadAnnouncements(),

            loadBatches(),

            loadPromotion(),

            loadEnrollments(),

            loadClasses(),

            loadTests(),

            loadFreeLearning()

        ]);


    const value =
        index => {

            const result =
                results[index];

            return result.status ===
                "fulfilled"
                ? result.value
                : null;

        };


    renderBanners(
        value(0) || []
    );


    renderAnnouncements(
        value(1) || []
    );


    renderBatches(
        value(2) || []
    );


    renderPromotion(
        value(3)
    );


    enrollments =
        value(4) || [];


    renderLearning();


    renderClasses(
        value(5) || []
    );


    renderTests(
        value(6) || []
    );


    renderFreeLearning(
        value(7) || []
    );


    renderProgress();

}


/* ============================================================
   BANNERS
============================================================ */

async function loadBanners() {

    const reference =
        collection(
            db,
            "homeBanners"
        );


    const request =
        query(
            reference,

            where(
                "active",
                "==",
                true
            ),

            limit(10)
        );


    const snapshot =
        await getDocs(
            request
        );


    const items =
        snapshot.docs.map(
            item => ({
                id: item.id,
                ...item.data()
            })
        );


    items.sort(
        (a, b) =>
            Number(
                a.order || 999
            ) -
            Number(
                b.order || 999
            )
    );


    return items;

}


/* ============================================================
   ANNOUNCEMENTS
============================================================ */

async function loadAnnouncements() {

    const reference =
        collection(
            db,
            "announcements"
        );


    const request =
        query(
            reference,

            where(
                "active",
                "==",
                true
            ),

            limit(10)
        );


    const snapshot =
        await getDocs(
            request
        );


    return snapshot.docs.map(
        item => ({
            id: item.id,
            ...item.data()
        })
    );

}


/* ============================================================
   BATCHES
============================================================ */

async function loadBatches() {

    const reference =
        collection(
            db,
            "batches"
        );


    const request =
        query(
            reference,

            where(
                "active",
                "==",
                true
            ),

            limit(20)
        );


    const snapshot =
        await getDocs(
            request
        );


    let items =
        snapshot.docs.map(
            item => ({
                id: item.id,
                ...item.data()
            })
        );


    const matching =
        items.filter(
            batch =>
                Array.isArray(
                    batch.targetClasses
                ) &&
                batch.targetClasses.includes(
                    profile.className
                )
        );


    if (
        matching.length > 0
    ) {

        items =
            matching;

    }


    items.sort(
        (a, b) =>
            Number(
                b.priority || 0
            ) -
            Number(
                a.priority || 0
            )
    );


    return items.slice(
        0,
        8
    );

}


/* ============================================================
   PROMOTION
============================================================ */

async function loadPromotion() {

    const reference =
        collection(
            db,
            "homeCampaigns"
        );


    const request =
        query(
            reference,

            where(
                "active",
                "==",
                true
            ),

            limit(1)
        );


    const snapshot =
        await getDocs(
            request
        );


    if (
        snapshot.empty
    ) {

        return null;

    }


    return {
        id:
            snapshot.docs[0].id,

        ...snapshot.docs[0].data()
    };

}


/* ============================================================
   ENROLLMENTS
============================================================ */

async function loadEnrollments() {

    const reference =
        collection(
            db,
            "enrollments"
        );


    const request =
        query(
            reference,

            where(
                "studentId",
                "==",
                user.uid
            ),

            where(
                "status",
                "==",
                "active"
            ),

            limit(20)
        );


    const snapshot =
        await getDocs(
            request
        );


    return snapshot.docs.map(
        item => ({
            id: item.id,
            ...item.data()
        })
    );

}


/* ============================================================
   CLASSES
============================================================ */

async function loadClasses() {

    const reference =
        collection(
            db,
            "liveClasses"
        );


    const request =
        query(
            reference,

            where(
                "active",
                "==",
                true
            ),

            limit(10)
        );


    const snapshot =
        await getDocs(
            request
        );


    return snapshot.docs.map(
        item => ({
            id: item.id,
            ...item.data()
        })
    );

}


/* ============================================================
   TESTS
============================================================ */

async function loadTests() {

    const reference =
        collection(
            db,
            "tests"
        );


    const request =
        query(
            reference,

            where(
                "active",
                "==",
                true
            ),

            limit(10)
        );


    const snapshot =
        await getDocs(
            request
        );


    return snapshot.docs.map(
        item => ({
            id: item.id,
            ...item.data()
        })
    );

}


/* ============================================================
   FREE LEARNING
============================================================ */

async function loadFreeLearning() {

    const reference =
        collection(
            db,
            "freeLearning"
        );


    const request =
        query(
            reference,

            where(
                "active",
                "==",
                true
            ),

            limit(10)
        );


    const snapshot =
        await getDocs(
            request
        );


    return snapshot.docs.map(
        item => ({
            id: item.id,
            ...item.data()
        })
    );

}


/* ============================================================
   RENDER BANNERS
============================================================ */

function renderBanners(
    items
) {

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


    if (
        !items.length
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
        items.map(
            (item, index) => `

                <div
                    class="banner-slide ${
                        index === 0
                            ? "active"
                            : ""
                    }"
                    data-link="${
                        safeAttr(
                            item.link || ""
                        )
                    }"
                >

                    <img
                        src="${
                            safeAttr(
                                item.imageUrl
                            )
                        }"
                        alt=""
                        loading="${
                            index === 0
                                ? "eager"
                                : "lazy"
                        }"
                    >

                </div>

            `
        ).join("");


    dots.innerHTML =
        items.map(
            (_, index) => `

                <button
                    class="banner-dot ${
                        index === 0
                            ? "active"
                            : ""
                    }"
                    data-index="${index}"
                ></button>

            `
        ).join("");


    setupSlider(
        items.length
    );

}


/* ============================================================
   SLIDER
============================================================ */

function setupSlider(
    count
) {

    if (
        count < 2
    ) {

        return;

    }


    const slides =
        document.querySelectorAll(
            ".banner-slide"
        );


    const dots =
        document.querySelectorAll(
            ".banner-dot"
        );


    let current =
        0;


    const show =
        index => {

            current =
                (index + count) %
                count;


            slides.forEach(
                (slide, i) =>
                    slide.classList.toggle(
                        "active",
                        i === current
                    )
            );


            dots.forEach(
                (dot, i) =>
                    dot.classList.toggle(
                        "active",
                        i === current
                    )
            );

        };


    dots.forEach(
        dot => {

            dot.addEventListener(
                "click",
                () =>
                    show(
                        Number(
                            dot.dataset.index
                        )
                    )
            );

        }
    );


    setInterval(
        () =>
            show(
                current + 1
            ),
        5000
    );

}


/* ============================================================
   ANNOUNCEMENTS
============================================================ */

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
        !items.length
    ) {

        section.classList.add(
            "hidden"
        );

        return;

    }


    section.classList.remove(
        "hidden"
    );


    list.innerHTML =
        items.slice(
            0,
            3
        ).map(
            item => `

                <article
                    class="announcement-card"
                >

                    <div
                        class="announcement-date"
                    >

                        <strong>
                            ${
                                formatDay(
                                    item.date
                                )
                            }
                        </strong>

                        <span>
                            ${
                                formatMonth(
                                    item.date
                                )
                            }
                        </span>

                    </div>


                    <div
                        class="announcement-info"
                    >

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


                    <div
                        class="announcement-arrow"
                    >
                        →
                    </div>

                </article>

            `
        ).join("");

}


/* ============================================================
   BATCHES
============================================================ */

function renderBatches(
    items
) {

    const section =
        document.getElementById(
            "recommendedSection"
        );

    const list =
        document.getElementById(
            "recommendedList"
        );


    if (
        !items.length
    ) {

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
                    class="batch-card"
                    data-id="${
                        safeAttr(
                            item.id
                        )
                    }"
                >

                    <div class="batch-image">

                        <img
                            src="${
                                safeAttr(
                                    item.imageUrl
                                )
                            }"
                            alt=""
                            loading="lazy"
                        >

                    </div>


                    <div class="batch-content">

                        <h3>
                            ${
                                escapeHtml(
                                    item.name ||
                                    ""
                                )
                            }
                        </h3>


                        <p>
                            ${
                                escapeHtml(
                                    item.shortDescription ||
                                    ""
                                )
                            }
                        </p>


                        <div class="batch-meta">

                            <strong
                                class="batch-price"
                            >
                                ₹${
                                    Number(
                                        item.price ||
                                        0
                                    ).toLocaleString(
                                        "en-IN"
                                    )
                                }
                            </strong>


                            <span
                                class="batch-mode"
                            >
                                ${
                                    escapeHtml(
                                        item.mode ||
                                        ""
                                    )
                                }
                            </span>

                        </div>

                    </div>

                </article>

            `
        ).join("");


    list
        .querySelectorAll(
            ".batch-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        window.location.href =
                            `../batch/?id=${
                                encodeURIComponent(
                                    card.dataset.id
                                )
                            }`;

                    }
                );

            }
        );

}


/* ============================================================
   PROMOTION
============================================================ */

function renderPromotion(
    item
) {

    const section =
        document.getElementById(
            "promotionSection"
        );

    const container =
        document.getElementById(
            "promotion"
        );


    if (
        !item
    ) {

        section.classList.add(
            "hidden"
        );

        return;

    }


    section.classList.remove(
        "hidden"
    );


    container.innerHTML = `

        ${
            item.imageUrl
                ? `
                    <img
                        src="${
                            safeAttr(
                                item.imageUrl
                            )
                        }"
                        alt=""
                        loading="lazy"
                    >
                `
                : ""
        }


        <div
            class="promotion-content"
        >

            ${
                item.tag
                    ? `
                        <small>
                            ${
                                escapeHtml(
                                    item.tag
                                )
                            }
                        </small>
                    `
                    : ""
            }


            <h2>
                ${
                    escapeHtml(
                        item.title ||
                        ""
                    )
                }
            </h2>


            ${
                item.description
                    ? `
                        <p>
                            ${
                                escapeHtml(
                                    item.description
                                )
                            }
                        </p>
                    `
                    : ""
            }


            ${
                item.buttonText
                    ? `
                        <button
                            id="promotionButton"
                        >
                            ${
                                escapeHtml(
                                    item.buttonText
                                )
                            }
                        </button>
                    `
                    : ""
            }

        </div>

    `;


    const button =
        document.getElementById(
            "promotionButton"
        );


    if (
        button &&
        item.link
    ) {

        button.addEventListener(
            "click",
            () => {

                window.location.href =
                    item.link;

            }
        );

    }

}


/* ============================================================
   LEARNING
============================================================ */

function renderLearning() {

    const container =
        document.getElementById(
            "learningContent"
        );


    /*
     * No purchased batch.
     */

    if (
        !enrollments.length
    ) {

        container.innerHTML = `

            <div
                class="learning-empty"
            >

                <p class="learning-label">
                    YOUR LEARNING JOURNEY
                </p>


                <h3>
                    Your learning starts here.
                </h3>


                <p>
                    Explore Zenova programs
                    and choose the right one
                    for you.
                </p>


                <button
                    id="exploreButton"
                    class="learning-action"
                >
                    EXPLORE BATCHES
                </button>

            </div>

        `;


        document
            .getElementById(
                "exploreButton"
            )
            .addEventListener(
                "click",
                () =>
                    navigate(
                        "batches"
                    )
            );


        return;

    }


    /*
     * Actual enrollment.
     */

    const enrollment =
        enrollments[0];


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


    container.innerHTML = `

        <div
            class="learning-purchased"
        >

            <div
                class="learning-thumbnail"
            >

                ${
                    enrollment.batchImageUrl
                        ? `
                            <img
                                src="${
                                    safeAttr(
                                        enrollment.batchImageUrl
                                    )
                                }"
                                alt=""
                            >
                        `
                        : ""
                }

            </div>


            <div
                class="learning-info"
            >

                <p class="learning-label">
                    CONTINUE LEARNING
                </p>


                <h3>
                    ${
                        escapeHtml(
                            enrollment.batchName ||
                            enrollment.lastContentTitle ||
                            ""
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


                <div
                    class="progress-mini"
                >

                    <div
                        class="progress-track"
                    >

                        <div
                            class="progress-fill"
                            style="width:${progress}%"
                        ></div>

                    </div>

                </div>


                <button
                    id="continueButton"
                    class="continue-button"
                >
                    CONTINUE
                </button>

            </div>

        </div>

    `;


    document
        .getElementById(
            "continueButton"
        )
        .addEventListener(
            "click",
            () =>
                navigate(
                    "study"
                )
        );

}


/* ============================================================
   CLASSES
============================================================ */

function renderClasses(
    items
) {

    const section =
        document.getElementById(
            "classesSection"
        );

    const list =
        document.getElementById(
            "classesList"
        );


    if (
        !items.length
    ) {

        section.classList.add(
            "hidden"
        );

        return;

    }


    section.classList.remove(
        "hidden"
    );


    list.innerHTML =
        items.slice(
            0,
            4
        ).map(
            item => `

                <article
                    class="schedule-card"
                >

                    <div class="schedule-left">

                        <div
                            class="schedule-time"
                        >

                            <strong>
                                ${
                                    escapeHtml(
                                        item.time ||
                                        ""
                                    )
                                }
                            </strong>

                            <span>
                                ${
                                    escapeHtml(
                                        item.period ||
                                        ""
                                    )
                                }
                            </span>

                        </div>


                        <div
                            class="schedule-info"
                        >

                            <h3>
                                ${
                                    escapeHtml(
                                        item.title ||
                                        ""
                                    )
                                }
                            </h3>

                            <p>
                                ${
                                    escapeHtml(
                                        item.subtitle ||
                                        ""
                                    )
                                }
                            </p>

                        </div>

                    </div>


                    <div class="schedule-arrow">
                        →
                    </div>

                </article>

            `
        ).join("");

}


/* ============================================================
   TESTS
============================================================ */

function renderTests(
    items
) {

    const section =
        document.getElementById(
            "testsSection"
        );

    const list =
        document.getElementById(
            "testsList"
        );


    if (
        !items.length
    ) {

        section.classList.add(
            "hidden"
        );

        return;

    }


    section.classList.remove(
        "hidden"
    );


    list.innerHTML =
        items.slice(
            0,
            4
        ).map(
            item => `

                <article
                    class="schedule-card"
                >

                    <div class="schedule-left">

                        <div
                            class="schedule-time"
                        >

                            <strong>
                                ${
                                    escapeHtml(
                                        item.day ||
                                        ""
                                    )
                                }
                            </strong>

                            <span>
                                ${
                                    escapeHtml(
                                        item.month ||
                                        ""
                                    )
                                }
                            </span>

                        </div>


                        <div
                            class="schedule-info"
                        >

                            <h3>
                                ${
                                    escapeHtml(
                                        item.title ||
                                        ""
                                    )
                                }
                            </h3>

                            <p>
                                ${
                                    escapeHtml(
                                        item.description ||
                                        ""
                                    )
                                }
                            </p>

                        </div>

                    </div>


                    <div class="schedule-arrow">
                        →
                    </div>

                </article>

            `
        ).join("");

}


/* ============================================================
   FREE LEARNING
============================================================ */

function renderFreeLearning(
    items
) {

    const section =
        document.getElementById(
            "freeSection"
        );

    const list =
        document.getElementById(
            "freeList"
        );


    if (
        !section ||
        !list
    ) {

        return;

    }


    if (
        !items.length
    ) {

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
                    class="free-card"
                >

                    <div class="free-image">

                        <img
                            src="${
                                safeAttr(
                                    item.imageUrl
                                )
                            }"
                            alt=""
                            loading="lazy"
                        >

                    </div>


                    <div
                        class="free-content"
                    >

                        <h3>
                            ${
                                escapeHtml(
                                    item.title ||
                                    ""
                                )
                            }
                        </h3>


                        <p>
                            ${
                                escapeHtml(
                                    item.description ||
                                    ""
                                )
                            }
                        </p>

                    </div>

                </article>

            `
        ).join("");

}


/* ============================================================
   PROGRESS
============================================================ */

function renderProgress() {

    const section =
        document.getElementById(
            "progressSection"
        );

    const container =
        document.getElementById(
            "progressContent"
        );


    if (
        !enrollments.length
    ) {

        section.classList.add(
            "hidden"
        );

        return;

    }


    const progress =
        Math.max(
            0,
            Math.min(
                100,
                Number(
                    profile.overallProgress ||
                    0
                )
            )
        );


    section.classList.remove(
        "hidden"
    );


    container.innerHTML = `

        <div class="progress-head">

            <strong>
                Overall learning progress
            </strong>

            <span>
                ${progress}%
            </span>

        </div>


        <div
            class="progress-big-track"
        >

            <div
                style="width:${progress}%"
            ></div>

        </div>

    `;

}


/* ============================================================
   ROUTING
============================================================ */

function navigate(
    route
) {

    const routes = {

        home:
            "./",

        batches:
            "../batches/",

        live:
            "../live/",

        tests:
            "../tests/",

        results:
            "../results/",

        announcements:
            "../announcements/",

        study:
            "../study/",

        profile:
            "../profile/",

        ai:
            "../ai/",

        free:
            "../free/",

        notifications:
            "../notifications/"

    };


    if (
        routes[route]
    ) {

        window.location.href =
            routes[route];

    }

}


/* ============================================================
   ROUTING EVENTS
============================================================ */

document
    .querySelectorAll(
        "[data-route]"
    )
    .forEach(
        element => {

            element.addEventListener(
                "click",
                () =>
                    navigate(
                        element.dataset.route
                    )
            );

        }
    );


document
    .getElementById(
        "profileBtn"
    )
    .addEventListener(
        "click",
        () =>
            navigate(
                "profile"
            )
    );


document
    .getElementById(
        "notificationBtn"
    )
    .addEventListener(
        "click",
        () =>
            navigate(
                "notifications"
            )
    );


document
    .getElementById(
        "aiBtn"
    )
    .addEventListener(
        "click",
        () =>
            navigate(
                "ai"
            )
    );


/* ============================================================
   DATE HELPERS
============================================================ */

function getDate(
    value
) {

    if (!value) {
        return null;
    }


    if (
        typeof value.toDate ===
        "function"
    ) {

        return value.toDate();

    }


    const date =
        new Date(value);


    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;

}


function formatDay(
    value
) {

    const date =
        getDate(value);


    return date
        ? String(
            date.getDate()
        ).padStart(
            2,
            "0"
        )
        : "--";

}


function formatMonth(
    value
) {

    const date =
        getDate(value);


    return date
        ? date
            .toLocaleString(
                "en-IN",
                {
                    month: "short"
                }
            )
            .toUpperCase()
        : "";

}


/* ============================================================
   SECURITY HELPERS
============================================================ */

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


function safeAttr(
    value
) {

    return escapeHtml(
        value
    );

}


/* ============================================================
   ERROR
============================================================ */

function showLoadError() {

    loader.innerHTML = `

        <div
            style="
                text-align:center;
                padding:30px;
            "
        >

            <img
                src="../logo.jpg"
                alt="Zenova Educations"
                style="
                    max-width:130px;
                    max-height:45px;
                    object-fit:contain;
                "
            >


            <p
                style="
                    margin-top:14px;
                    color:#777;
                    font-size:10px;
                "
            >
                We couldn't load your
                learning space.
            </p>


            <button
                onclick="location.reload()"
                style="
                    margin-top:15px;
                    padding:10px 15px;
                    border:0;
                    border-radius:7px;
                    background:#111;
                    color:#fff;
                    font-size:8px;
                    font-weight:800;
                "
            >
                TRY AGAIN
            </button>

        </div>

    `;

}

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
    document.getElementById("zenovaLoader");

const app =
    document.getElementById("zenovaApp");


let currentUser = null;
let student = null;
let enrollments = [];


/* ============================================================
   AUTHENTICATION
============================================================ */

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

            const profileRef =
                doc(
                    db,
                    "students",
                    user.uid
                );


            const profileSnapshot =
                await getDoc(
                    profileRef
                );


            /*
             * Student document does not exist.
             */

            if (
                !profileSnapshot.exists()
            ) {

                window.location.replace(
                    "../onboarding/"
                );

                return;

            }


            student =
                profileSnapshot.data();


            /*
             * HARD ONBOARDING GATE
             */

            if (
                !isProfileComplete(
                    student
                )
            ) {

                window.location.replace(
                    "../onboarding/"
                );

                return;

            }


            /*
             * Basic student information.
             */

            renderStudent();


            /*
             * Load all actual Firebase
             * Home content.
             */

            await loadRealHomeData();


            /*
             * Everything verified.
             */

            showApp();


        } catch (error) {

            console.error(
                "Zenova Home:",
                error
            );


            showError();

        }

    }
);


/* ============================================================
   PROFILE VALIDATION
============================================================ */

function isProfileComplete(data) {

    if (!data) {
        return false;
    }


    if (
        data.onboardingComplete !== true
    ) {
        return false;
    }


    if (
        !data.name ||
        typeof data.name !== "string" ||
        data.name.trim().length < 2
    ) {
        return false;
    }


    const validClasses = [

        "Under 8th",
        "8th",
        "9th",
        "10th",
        "1st PUC",
        "2nd PUC"

    ];


    if (
        !validClasses.includes(
            data.className
        )
    ) {
        return false;
    }


    if (
        data.className === "10th"
    ) {

        if (!data.board) {
            return false;
        }

        if (!data.studyMode) {
            return false;
        }

    }


    if (
        data.className === "1st PUC" ||
        data.className === "2nd PUC"
    ) {

        if (!data.combination) {
            return false;
        }

        if (!data.target) {
            return false;
        }

        if (!data.studyMode) {
            return false;
        }

    }


    if (
        data.className === "Under 8th" ||
        data.className === "8th" ||
        data.className === "9th"
    ) {

        if (!data.studyMode) {
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
        student.name;


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
        student.className;


    if (student.board) {

        academic +=
            ` • ${student.board}`;

    }


    if (student.combination) {

        academic +=
            ` • ${student.combination}`;

    }


    document.getElementById(
        "studentAcademic"
    ).textContent =
        academic;

}


/* ============================================================
   LOAD REAL HOME DATA
============================================================ */

async function loadRealHomeData() {

    /*
     * Each section is independent.
     * One unavailable collection does not
     * break the entire Home page.
     */

    const [

        banners,
        announcements,
        batches,
        campaign,
        liveClasses,
        tests,
        freeLearning,
        studentEnrollments

    ] = await Promise.all([

        safeQuery(
            loadBanners
        ),

        safeQuery(
            loadAnnouncements
        ),

        safeQuery(
            loadRecommendedBatches
        ),

        safeQuery(
            loadCampaign
        ),

        safeQuery(
            loadLiveClasses
        ),

        safeQuery(
            loadUpcomingTests
        ),

        safeQuery(
            loadFreeLearning
        ),

        safeQuery(
            loadEnrollments
        )

    ]);


    enrollments =
        studentEnrollments || [];


    renderBanners(
        banners || []
    );


    renderAnnouncements(
        announcements || []
    );


    renderRecommendedBatches(
        batches || []
    );


    renderCampaign(
        campaign
    );


    renderLearning();


    renderLiveClasses(
        liveClasses || []
    );


    renderTests(
        tests || []
    );


    renderFreeLearning(
        freeLearning || []
    );


    renderProgress();

}


/* ============================================================
   SAFE FIREBASE QUERY
============================================================ */

async function safeQuery(
    functionToRun
) {

    try {

        return await functionToRun();

    } catch (error) {

        console.warn(
            "Home section unavailable:",
            error
        );

        return null;

    }

}


/* ============================================================
   BANNERS
============================================================ */

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
                id: item.id,
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


/* ============================================================
   ANNOUNCEMENTS
============================================================ */

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
            id: item.id,
            ...item.data()
        })
    );

}


/* ============================================================
   RECOMMENDED BATCHES
============================================================ */

async function loadRecommendedBatches() {

    const ref =
        collection(
            db,
            "batches"
        );


    const q =
        query(
            ref,

            where(
                "active",
                "==",
                true
            ),

            limit(20)
        );


    const snapshot =
        await getDocs(q);


    let batches =
        snapshot.docs.map(
            item => ({
                id: item.id,
                ...item.data()
            })
        );


    /*
     * First preference:
     * student's current class.
     */

    const matching =
        batches.filter(
            batch => {

                if (
                    !Array.isArray(
                        batch.targetClasses
                    )
                ) {
                    return false;
                }


                return batch.targetClasses
                    .includes(
                        student.className
                    );

            }
        );


    if (
        matching.length
    ) {

        batches =
            matching;

    }


    batches.sort(
        (a, b) =>
            Number(
                b.priority || 0
            ) -
            Number(
                a.priority || 0
            )
    );


    return batches.slice(
        0,
        8
    );

}


/* ============================================================
   CAMPAIGN
============================================================ */

async function loadCampaign() {

    const ref =
        collection(
            db,
            "homeCampaigns"
        );


    const q =
        query(
            ref,

            where(
                "active",
                "==",
                true
            ),

            limit(1)
        );


    const snapshot =
        await getDocs(q);


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
   LIVE CLASSES
============================================================ */

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

            limit(10)
        );


    const snapshot =
        await getDocs(q);


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

async function loadUpcomingTests() {

    const ref =
        collection(
            db,
            "tests"
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
            id: item.id,
            ...item.data()
        })
    );

}


/* ============================================================
   FREE LEARNING
============================================================ */

async function loadFreeLearning() {

    const ref =
        collection(
            db,
            "freeLearning"
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
            id: item.id,
            ...item.data()
        })
    );

}


/* ============================================================
   STUDENT ENROLLMENTS
============================================================ */

async function loadEnrollments() {

    const ref =
        collection(
            db,
            "enrollments"
        );


    const q =
        query(
            ref,

            where(
                "studentId",
                "==",
                currentUser.uid
            ),

            where(
                "status",
                "==",
                "active"
            ),

            limit(20)
        );


    const snapshot =
        await getDocs(q);


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


    /*
     * NO DATA:
     * hide entire section.
     */

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
            (banner, index) => `

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
                                banner.imageUrl
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
        banners.map(
            (_, index) => `

                <button
                    class="hero-dot ${
                        index === 0
                            ? "active"
                            : ""
                    }"
                    data-index="${index}"
                    aria-label="Banner ${
                        index + 1
                    }"
                ></button>

            `
        ).join("");


    startSlider(
        banners.length
    );

}


/* ============================================================
   BANNER SLIDER
============================================================ */

function startSlider(
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
            (index + count) %
            count;


        slides.forEach(
            (slide, i) => {

                slide.classList.toggle(
                    "active",
                    i === current
                );

            }
        );


        dots.forEach(
            (dot, i) => {

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
                () => {

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
            item => {

                const date =
                    getAnnouncementDate(
                        item.date
                    );


                return `

                    <article
                        class="announcement-card"
                        data-link="${
                            escapeAttr(
                                item.link || ""
                            )
                        }"
                    >

                        <div
                            class="announcement-date"
                        >

                            <strong>
                                ${date.day}
                            </strong>

                            <span>
                                ${date.month}
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

                `;

            }
        ).join("");


    list
        .querySelectorAll(
            ".announcement-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        if (
                            card.dataset.link
                        ) {

                            window.location.href =
                                card.dataset.link;

                        }

                    }
                );

            }
        );

}


/* ============================================================
   BATCHES
============================================================ */

function renderRecommendedBatches(
    batches
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
        !batches.length
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
        batches.map(
            batch => `

                <article
                    class="batch-card"
                    data-id="${
                        escapeAttr(
                            batch.id
                        )
                    }"
                >

                    <div class="batch-image">

                        <img
                            src="${
                                escapeAttr(
                                    batch.imageUrl
                                )
                            }"
                            alt=""
                            loading="lazy"
                        >


                        <span
                            class="batch-mode"
                        >
                            ${
                                escapeHtml(
                                    batch.mode ||
                                    ""
                                )
                            }
                        </span>

                    </div>


                    <div class="batch-details">

                        <h3>
                            ${
                                escapeHtml(
                                    batch.name ||
                                    ""
                                )
                            }
                        </h3>


                        <p>
                            ${
                                escapeHtml(
                                    batch.shortDescription ||
                                    ""
                                )
                            }
                        </p>


                        <div
                            class="batch-bottom"
                        >

                            <strong
                                class="batch-price"
                            >
                                ₹${
                                    Number(
                                        batch.price ||
                                        0
                                    ).toLocaleString(
                                        "en-IN"
                                    )
                                }
                            </strong>


                            <span
                                class="batch-arrow"
                            >
                                →
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
   CAMPAIGN
============================================================ */

function renderCampaign(
    campaign
) {

    const section =
        document.getElementById(
            "campaignSection"
        );


    const container =
        document.getElementById(
            "campaignContainer"
        );


    if (
        !campaign
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
            campaign.imageUrl
                ? `
                    <img
                        src="${
                            escapeAttr(
                                campaign.imageUrl
                            )
                        }"
                        alt=""
                        loading="lazy"
                    >
                `
                : ""
        }


        <div
            class="campaign-overlay"
        >

            ${
                campaign.tag
                    ? `
                        <span
                            class="campaign-tag"
                        >
                            ${
                                escapeHtml(
                                    campaign.tag
                                )
                            }
                        </span>
                    `
                    : ""
            }


            <h2>
                ${
                    escapeHtml(
                        campaign.title ||
                        ""
                    )
                }
            </h2>


            ${
                campaign.description
                    ? `
                        <p>
                            ${
                                escapeHtml(
                                    campaign.description
                                )
                            }
                        </p>
                    `
                    : ""
            }


            ${
                campaign.buttonText
                    ? `
                        <button
                            class="campaign-button"
                            id="campaignButton"
                        >
                            ${
                                escapeHtml(
                                    campaign.buttonText
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
            "campaignButton"
        );


    if (
        button &&
        campaign.link
    ) {

        button.addEventListener(
            "click",
            () => {

                window.location.href =
                    campaign.link;

            }
        );

    }

}


/* ============================================================
   START LEARNING
============================================================ */

function renderLearning() {

    const card =
        document.getElementById(
            "learningCard"
        );


    /*
     * No purchased batch.
     *
     * This is NOT fake data.
     * This is a permanent functional state.
     */

    if (
        !enrollments.length
    ) {

        card.innerHTML = `

            <div class="learning-empty">

                <p class="learning-label">
                    YOUR LEARNING JOURNEY
                </p>


                <h3>
                    Explore your learning options.
                </h3>


                <p>
                    Choose a Zenova program
                    that fits your goals.
                </p>


                <button
                    class="learning-action"
                    id="exploreBatches"
                >
                    EXPLORE BATCHES
                </button>

            </div>

        `;


        document
            .getElementById(
                "exploreBatches"
            )
            .addEventListener(
                "click",
                () => {

                    navigate(
                        "batches"
                    );

                }
            );


        return;

    }


    /*
     * Real purchased batch.
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


    card.innerHTML = `

        <div class="learning-thumbnail">

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
                    : ""
            }

        </div>


        <div class="learning-details">

            <p class="learning-label">
                CONTINUE LEARNING
            </p>


            <h3>
                ${
                    escapeHtml(
                        enrollment.lastContentTitle ||
                        enrollment.batchName ||
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


            <div class="progress-line">

                <div
                    class="progress-track"
                >

                    <div
                        class="progress-fill"
                        style="width:${progress}%"
                    ></div>

                </div>


                <span
                    class="progress-value"
                >
                    ${progress}%
                </span>

            </div>

        </div>


        <button
            class="continue-button"
            id="continueLearning"
        >
            CONTINUE
        </button>

    `;


    document
        .getElementById(
            "continueLearning"
        )
        .addEventListener(
            "click",
            () => {

                navigate(
                    "study"
                );

            }
        );

}


/* ============================================================
   LIVE CLASSES
============================================================ */

function renderLiveClasses(
    items
) {

    const section =
        document.getElementById(
            "liveSection"
        );


    const list =
        document.getElementById(
            "liveList"
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
                    data-route="live"
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


                    <div
                        class="schedule-arrow"
                    >
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
                    data-route="tests"
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


                    <div
                        class="schedule-arrow"
                    >
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
                    data-link="${
                        escapeAttr(
                            item.link || ""
                        )
                    }"
                >

                    <img
                        src="${
                            escapeAttr(
                                item.imageUrl
                            )
                        }"
                        alt=""
                        loading="lazy"
                    >


                    <div
                        class="free-card-content"
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


    const card =
        document.getElementById(
            "progressCard"
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
                    student.overallProgress ||
                    0
                )
            )
        );


    section.classList.remove(
        "hidden"
    );


    card.innerHTML = `

        <div class="progress-heading">

            <strong>
                Overall learning progress
            </strong>


            <span>
                ${progress}%
            </span>

        </div>


        <div
            class="large-progress"
        >

            <div
                style="width:${progress}%"
            ></div>

        </div>

    `;

}


/* ============================================================
   NAVIGATION
============================================================ */

function navigate(
    route
) {

    const routes = {

        home:
            "../home/",

        quick:
            "../home/quick/",

        batches:
            "../home/batches/",

        live:
            "../home/live/",

        tests:
            "../home/tests/",

        results:
            "../home/results/",

        announcements:
            "../home/announcements/",

        study:
            "../home/study/",

        profile:
            "../home/profile/",

        timetable:
            "../home/timetable/",

        free:
            "../home/free/",

        library:
            "../home/library/",

        ai:
            "../home/ai/",

        doubts:
            "../home/doubts/",

        support:
            "../home/support/",

        notifications:
            "../home/notifications/"

    };


    if (
        routes[route]
    ) {

        window.location.href =
            routes[route];

    }

}


/* ============================================================
   NAVIGATION EVENTS
============================================================ */

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
    .addEventListener(
        "click",
        () => {

            navigate(
                "profile"
            );

        }
    );


document
    .getElementById(
        "notificationButton"
    )
    .addEventListener(
        "click",
        () => {

            navigate(
                "notifications"
            );

        }
    );


document
    .getElementById(
        "aiButton"
    )
    .addEventListener(
        "click",
        () => {

            navigate(
                "ai"
            );

        }
    );


/* ============================================================
   LOADING
============================================================ */

function showApp() {

    app.classList.remove(
        "hidden"
    );


    setTimeout(
        () => {

            loader.classList.add(
                "fade-out"
            );

        },
        100
    );

}


/* ============================================================
   ERROR
============================================================ */

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
                    font-size:21px;
                    font-weight:900;
                    letter-spacing:3px;
                "
            >
                ZENOVA
            </div>


            <p
                style="
                    margin-top:12px;
                    color:#777;
                    font-size:11px;
                "
            >
                We couldn't load your
                learning space.
            </p>


            <button
                onclick="location.reload()"
                style="
                    margin-top:18px;
                    padding:11px 18px;
                    border:0;
                    border-radius:7px;
                    background:#111;
                    color:#fff;
                    font-size:9px;
                    font-weight:700;
                "
            >
                TRY AGAIN
            </button>

        </div>

    `;

}


/* ============================================================
   DATE
============================================================ */

function getAnnouncementDate(
    value
) {

    if (!value) {

        return {
            day: "--",
            month: ""
        };

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

        return {
            day: "--",
            month: ""
        };

    }


    return {

        day:
            String(
                date.getDate()
            ).padStart(
                2,
                "0"
            ),

        month:
            date
                .toLocaleString(
                    "en-IN",
                    {
                        month: "short"
                    }
                )
                .toUpperCase()

    };

}


/* ============================================================
   SECURITY / HTML HELPERS
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


function escapeAttr(
    value
) {

    return escapeHtml(
        value
    );

}

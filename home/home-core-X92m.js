// ============================================================
// ZENOVA EDUCATIONS
// UNIVERSAL HOME ENGINE
// ============================================================

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


// ============================================================
// ELEMENTS
// ============================================================

const loader =
    document.getElementById(
        "zenovaLoader"
    );

const app =
    document.getElementById(
        "zenovaApp"
    );


// ============================================================
// STATE
// ============================================================

let currentUser = null;

let student = null;

let enrollments = [];


// ============================================================
// AUTH
// ============================================================

onAuthStateChanged(
    auth,
    async (user) => {

        /*
         * USER NOT LOGGED IN
         */

        if (!user) {

            window.location.replace(
                "../login/"
            );

            return;

        }


        currentUser =
            user;


        try {

            /*
             * FIRST:
             * Verify onboarding.
             */

            const profile =
                await getStudentProfile();


            /*
             * If profile is incomplete,
             * Home is forbidden.
             */

            if (
                !profile ||
                !isProfileComplete(
                    profile
                )
            ) {

                window.location.replace(
                    "../onboarding/"
                );

                return;

            }


            student =
                profile;


            /*
             * Render basic information.
             */

            renderStudent();


            /*
             * Load optional content.
             *
             * IMPORTANT:
             * One failed collection will
             * NEVER crash the whole Home.
             */

            await loadHomeContent();


            /*
             * Home is now ready.
             */

            showApp();


        } catch (error) {

            console.error(
                "ZENOVA HOME ERROR:",
                error
            );


            showError(
                error
            );

        }

    }
);


// ============================================================
// GET STUDENT
// ============================================================

async function getStudentProfile() {

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


    if (
        !snapshot.exists()
    ) {

        return null;

    }


    return snapshot.data();

}


// ============================================================
// PROFILE VALIDATION
// ============================================================

function isProfileComplete(
    data
) {

    if (!data) {
        return false;
    }


    if (
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


    const classes = [

        "Under 8th",

        "8th",

        "9th",

        "10th",

        "1st PUC",

        "2nd PUC"

    ];


    if (
        !classes.includes(
            data.className
        )
    ) {

        return false;

    }


    /*
     * 10TH
     */

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


    /*
     * PUC
     */

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


    /*
     * OTHER CLASSES
     */

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


// ============================================================
// LOAD HOME
// ============================================================

async function loadHomeContent() {

    const results =
        await Promise.allSettled([

            safeLoad(
                "banners",
                loadBanners
            ),

            safeLoad(
                "announcements",
                loadAnnouncements
            ),

            safeLoad(
                "batches",
                loadBatches
            ),

            safeLoad(
                "campaign",
                loadCampaign
            ),

            safeLoad(
                "freeLearning",
                loadFreeLearning
            ),

            safeLoad(
                "results",
                loadResults
            ),

            safeLoad(
                "enrollments",
                loadEnrollments
            )

        ]);


    const data =
        results.map(
            result =>
                result.status === "fulfilled"
                    ? result.value
                    : null
        );


    const [

        banners,
        announcements,
        batches,
        campaign,
        freeLearning,
        resultsData,
        enrollmentData

    ] = data;


    /*
     * ENROLLMENTS
     */

    if (
        Array.isArray(
            enrollmentData
        )
    ) {

        enrollments =
            enrollmentData;

    }


    /*
     * RENDER EVERYTHING
     */

    renderHero(
        banners || []
    );

    renderAnnouncements(
        announcements || []
    );

    renderBatches(
        batches || []
    );

    renderCampaign(
        campaign
    );

    renderFreeLearning(
        freeLearning || []
    );

    renderResults(
        resultsData || []
    );

    renderLearning();

    renderProgress();

}


// ============================================================
// SAFE LOADER
// ============================================================

async function safeLoad(
    name,
    functionToRun
) {

    try {

        return await functionToRun();

    } catch (error) {

        console.warn(
            `Zenova ${name} unavailable:`,
            error
        );

        return null;

    }

}


// ============================================================
// BANNERS
// ============================================================

async function loadBanners() {

    const reference =
        collection(
            db,
            "homeBanners"
        );


    const q =
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


// ============================================================
// ANNOUNCEMENTS
// ============================================================

async function loadAnnouncements() {

    const reference =
        collection(
            db,
            "announcements"
        );


    const q =
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
        await getDocs(q);


    const items =
        snapshot.docs.map(
            item => ({
                id: item.id,
                ...item.data()
            })
        );


    items.sort(
        (a, b) =>
            getDate(
                b.date
            ) -
            getDate(
                a.date
            )
    );


    return items;

}


// ============================================================
// BATCHES
// ============================================================

async function loadBatches() {

    const reference =
        collection(
            db,
            "batches"
        );


    const q =
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
        await getDocs(q);


    let batches =
        snapshot.docs.map(
            item => ({
                id: item.id,
                ...item.data()
            })
        );


    /*
     * Prioritise student's class.
     */

    if (
        student.className
    ) {

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


// ============================================================
// CAMPAIGN
// ============================================================

async function loadCampaign() {

    const reference =
        collection(
            db,
            "homeCampaigns"
        );


    const q =
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
        await getDocs(q);


    if (
        snapshot.empty
    ) {

        return null;

    }


    const campaigns =
        snapshot.docs.map(
            item => ({
                id: item.id,
                ...item.data()
            })
        );


    campaigns.sort(
        (a, b) =>
            Number(
                a.order || 999
            ) -
            Number(
                b.order || 999
            )
    );


    return campaigns[0];

}


// ============================================================
// FREE LEARNING
// ============================================================

async function loadFreeLearning() {

    const reference =
        collection(
            db,
            "freeLearning"
        );


    const q =
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
        await getDocs(q);


    return snapshot.docs.map(
        item => ({
            id: item.id,
            ...item.data()
        })
    );

}


// ============================================================
// RESULTS
// ============================================================

async function loadResults() {

    const reference =
        collection(
            db,
            "results"
        );


    const q =
        query(
            reference,

            where(
                "featured",
                "==",
                true
            ),

            limit(6)
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


// ============================================================
// ENROLLMENTS
// ============================================================

async function loadEnrollments() {

    const reference =
        collection(
            db,
            "enrollments"
        );


    const q =
        query(
            reference,

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


// ============================================================
// STUDENT UI
// ============================================================

function renderStudent() {

    const name =
        student.name ||
        "Student";


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


    if (
        student.board
    ) {

        academic +=
            ` • ${student.board}`;

    }


    if (
        student.combination
    ) {

        academic +=
            ` • ${student.combination}`;

    }


    document.getElementById(
        "studentAcademic"
    ).textContent =
        academic;

}


// ============================================================
// HERO UI
// ============================================================

function renderHero(
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
                        safeAttr(
                            banner.link || ""
                        )
                    }"
                >

                    <img
                        src="${
                            safeAttr(
                                banner.imageUrl || ""
                            )
                        }"
                        alt="${
                            safeAttr(
                                banner.title ||
                                "Zenova"
                            )
                        }"
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
                ></button>

            `
        ).join("");


    setupHeroSlider(
        banners.length
    );

}


// ============================================================
// HERO SLIDER
// ============================================================

function setupHeroSlider(
    count
) {

    if (
        count <= 1
    ) {

        return;

    }


    let current =
        0;


    const slides =
        document.querySelectorAll(
            ".hero-slide"
        );

    const dots =
        document.querySelectorAll(
            ".hero-dot"
        );


    function showSlide(
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

                    showSlide(
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

            showSlide(
                current + 1
            );

        },
        5000
    );

}


// ============================================================
// ANNOUNCEMENTS UI
// ============================================================

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
                    formatDate(
                        item.date
                    );


                return `

                    <article
                        class="announcement-card"
                        data-link="${
                            safeAttr(
                                item.link || ""
                            )
                        }"
                    >

                        <div
                            class="announcement-date"
                        >

                            <strong>
                                ${
                                    date.day
                                }
                            </strong>

                            <span>
                                ${
                                    date.month
                                }
                            </span>

                        </div>


                        <div
                            class="announcement-info"
                        >

                            <strong>
                                ${
                                    safeHtml(
                                        item.title ||
                                        ""
                                    )
                                }
                            </strong>

                            <p>
                                ${
                                    safeHtml(
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


// ============================================================
// BATCH UI
// ============================================================

function renderBatches(
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
                        safeAttr(
                            batch.id
                        )
                    }"
                >

                    <div class="batch-image">

                        <img
                            src="${
                                safeAttr(
                                    batch.imageUrl ||
                                    ""
                                )
                            }"
                            alt="${
                                safeAttr(
                                    batch.name ||
                                    ""
                                )
                            }"
                            loading="lazy"
                        >


                        <span class="batch-mode">
                            ${
                                safeHtml(
                                    batch.mode ||
                                    "ONLINE"
                                )
                            }
                        </span>

                    </div>


                    <div class="batch-details">

                        <h3>
                            ${
                                safeHtml(
                                    batch.name ||
                                    ""
                                )
                            }
                        </h3>


                        <p>
                            ${
                                safeHtml(
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


// ============================================================
// CAMPAIGN UI
// ============================================================

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


    if (!campaign) {

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
                            safeAttr(
                                campaign.imageUrl
                            )
                        }"
                        alt=""
                        loading="lazy"
                    >
                `
                : ""
        }


        <div class="campaign-overlay">

            ${
                campaign.tag
                    ? `
                        <span
                            class="campaign-tag"
                        >
                            ${
                                safeHtml(
                                    campaign.tag
                                )
                            }
                        </span>
                    `
                    : ""
            }


            <h2>
                ${
                    safeHtml(
                        campaign.title ||
                        ""
                    )
                }
            </h2>


            <p>
                ${
                    safeHtml(
                        campaign.description ||
                        ""
                    )
                }
            </p>


            ${
                campaign.buttonText
                    ? `
                        <button
                            class="campaign-button"
                            id="campaignAction"
                        >
                            ${
                                safeHtml(
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
            "campaignAction"
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


// ============================================================
// LEARNING UI
// ============================================================

function renderLearning() {

    const container =
        document.getElementById(
            "learningContainer"
        );


    /*
     * NO PURCHASED BATCH
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
                    Start learning with Zenova.
                </h3>


                <p>
                    Explore our programs and
                    find the right batch for you.
                </p>


                <button
                    class="learning-action"
                    data-route="batches"
                >
                    EXPLORE BATCHES
                </button>

            </div>

        `;


        container
            .querySelector(
                "[data-route]"
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
     * PURCHASED
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
            class="learning-details"
        >

            <p class="learning-label">
                CONTINUE LEARNING
            </p>


            <h3>
                ${
                    safeHtml(
                        enrollment.lastContentTitle ||
                        enrollment.batchName ||
                        "Your Batch"
                    )
                }
            </h3>


            <p>
                ${
                    safeHtml(
                        enrollment.lastContentSubtitle ||
                        enrollment.batchName ||
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


                <span class="progress-value">
                    ${progress}%
                </span>

            </div>

        </div>


        <button
            class="continue-button"
            id="continueButton"
        >
            CONTINUE
        </button>

    `;


    document
        .getElementById(
            "continueButton"
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


// ============================================================
// FREE LEARNING UI
// ============================================================

function renderFreeLearning(
    items
) {

    const section =
        document.getElementById(
            "freeLearningSection"
        );

    const list =
        document.getElementById(
            "freeLearningList"
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
                        safeAttr(
                            item.link || ""
                        )
                    }"
                >

                    <img
                        src="${
                            safeAttr(
                                item.imageUrl ||
                                ""
                            )
                        }"
                        alt="${
                            safeAttr(
                                item.title ||
                                ""
                            )
                        }"
                        loading="lazy"
                    >


                    <div
                        class="free-card-content"
                    >

                        <strong>
                            ${
                                safeHtml(
                                    item.title ||
                                    ""
                                )
                            }
                        </strong>


                        <p>
                            ${
                                safeHtml(
                                    item.description ||
                                    ""
                                )
                            }
                        </p>

                    </div>

                </article>

            `
        ).join("");


    list
        .querySelectorAll(
            ".free-card"
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


// ============================================================
// RESULTS
// ============================================================

function renderResults(
    results
) {

    /*
     * Results section will be activated
     * when the dedicated Results UI is
     * expanded.
     *
     * We intentionally don't create
     * empty UI here.
     */

    return results;

}


// ============================================================
// PROGRESS
// ============================================================

function renderProgress() {

    const section =
        document.getElementById(
            "progressSection"
        );

    const container =
        document.getElementById(
            "progressContainer"
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


    container.innerHTML = `

        <div class="progress-heading">

            <strong>
                Overall learning progress
            </strong>

            <span>
                ${progress}%
            </span>

        </div>


        <div class="large-progress">

            <div
                style="width:${progress}%"
            ></div>

        </div>

    `;

}


// ============================================================
// NAVIGATION
// ============================================================

function navigate(
    route
) {

    const routes = {

        home:
            "../home/",

        batches:
            "../batches/",

        study:
            "../study/",

        tests:
            "../tests/",

        profile:
            "../profile/",

        free:
            "../free/",

        results:
            "../results/",

        announcements:
            "../announcements/",

        live:
            "../live/",

        library:
            "../library/",

        ai:
            "../ai/",

        doubts:
            "../doubts/",

        timetable:
            "../timetable/",

        support:
            "../support/",

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


// ============================================================
// NAVIGATION BUTTONS
// ============================================================

document
    .querySelectorAll(
        "[data-route]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    navigate(
                        button.dataset.route
                    );

                }
            );

        }
    );


// ============================================================
// PROFILE
// ============================================================

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


// ============================================================
// AI
// ============================================================

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


// ============================================================
// NOTIFICATIONS
// ============================================================

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


// ============================================================
// SIDE MENU
// ============================================================

const menu =
    document.getElementById(
        "sideMenu"
    );

const overlay =
    document.getElementById(
        "menuOverlay"
    );


document
    .getElementById(
        "menuButton"
    )
    .addEventListener(
        "click",
        () => {

            menu.classList.add(
                "open"
            );

            overlay.classList.remove(
                "hidden"
            );

        }
    );


document
    .getElementById(
        "closeMenu"
    )
    .addEventListener(
        "click",
        closeMenu
    );


overlay.addEventListener(
    "click",
    closeMenu
);


function closeMenu() {

    menu.classList.remove(
        "open"
    );

    overlay.classList.add(
        "hidden"
    );

}


// ============================================================
// SHOW APP
// ============================================================

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


// ============================================================
// ERROR
// ============================================================

function showError(
    error
) {

    console.error(
        error
    );


    /*
     * We do not expose Firebase
     * error details to students.
     */

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
                    line-height:1.5;
                "
            >
                We couldn't load your learning space.
            </p>


            <button
                onclick="location.reload()"
                style="
                    margin-top:18px;
                    padding:11px 20px;
                    border:0;
                    border-radius:8px;
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


// ============================================================
// DATE
// ============================================================

function getDate(
    value
) {

    if (!value) {
        return 0;
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


    const time =
        date.getTime();


    return Number.isNaN(
        time
    )
        ? 0
        : time;

}


function formatDate(
    value
) {

    const time =
        getDate(value);


    if (!time) {

        return {
            day: "--",
            month: ""
        };

    }


    const date =
        new Date(time);


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


// ============================================================
// SECURITY HELPERS
// ============================================================

function safeHtml(
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

    return safeHtml(
        value
    );

}

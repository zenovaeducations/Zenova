// ============================================================
// ZENOVA EDUCATIONS
// UNIVERSAL HOME
// FIREBASE CONNECTED VERSION
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
    document.getElementById("pageLoader");

const app =
    document.getElementById("app");


// ============================================================
// GLOBAL DATA
// ============================================================

let currentUser = null;
let student = null;
let enrollments = [];


// ============================================================
// AUTH CHECK
// ============================================================

onAuthStateChanged(auth, async (user) => {

    console.log("Zenova Auth:", user ? user.uid : "NOT LOGGED IN");

    if (!user) {

        window.location.replace("../login/");
        return;

    }

    currentUser = user;

    try {

        // Student profile is essential.
        const profile = await loadStudentProfile();

        if (!profile) {
            return;
        }

        student = profile;

        // Render essential profile immediately.
        renderStudentProfile(student);

        /*
         * The rest of Home is optional.
         * If one Firebase collection fails,
         * the rest of the Home still works.
         */

        await loadOptionalHomeData();

        hideLoader();
        showApp();

    } catch (error) {

        console.error(
            "ZENOVA HOME FIREBASE ERROR:",
            error
        );

        showFatalError(error);

    }

});


// ============================================================
// STUDENT PROFILE
// ============================================================

async function loadStudentProfile() {

    console.log("Loading student profile...");

    const ref =
        doc(
            db,
            "students",
            currentUser.uid
        );

    const snapshot =
        await getDoc(ref);

    console.log(
        "Student profile exists:",
        snapshot.exists()
    );

    if (!snapshot.exists()) {

        console.log(
            "Student profile not found. Sending to onboarding."
        );

        window.location.replace(
            "../onboarding/"
        );

        return null;

    }

    return snapshot.data();

}


// ============================================================
// OPTIONAL HOME DATA
// ============================================================

async function loadOptionalHomeData() {

    /*
     * IMPORTANT:
     *
     * Promise.allSettled means one failed collection
     * will NOT destroy the complete Home page.
     */

    const results =
        await Promise.allSettled([

            loadHeroBanners(),

            loadAnnouncements(),

            loadRecommendedBatches(),

            loadCampaign(),

            loadFreeLearning(),

            loadResults(),

            loadEnrollments()

        ]);


    const [

        bannersResult,
        announcementsResult,
        batchesResult,
        campaignResult,
        freeResult,
        resultsResult,
        enrollmentsResult

    ] = results;


    // --------------------------------------------------------
    // HERO
    // --------------------------------------------------------

    if (
        bannersResult.status === "fulfilled"
    ) {

        renderHero(
            bannersResult.value
        );

    } else {

        console.warn(
            "Home banners unavailable:",
            bannersResult.reason
        );

    }


    // --------------------------------------------------------
    // ANNOUNCEMENTS
    // --------------------------------------------------------

    if (
        announcementsResult.status === "fulfilled"
    ) {

        renderAnnouncements(
            announcementsResult.value
        );

    } else {

        console.warn(
            "Announcements unavailable:",
            announcementsResult.reason
        );

    }


    // --------------------------------------------------------
    // BATCHES
    // --------------------------------------------------------

    if (
        batchesResult.status === "fulfilled"
    ) {

        renderRecommendedBatches(
            batchesResult.value
        );

    } else {

        console.warn(
            "Recommended batches unavailable:",
            batchesResult.reason
        );

    }


    // --------------------------------------------------------
    // CAMPAIGN
    // --------------------------------------------------------

    if (
        campaignResult.status === "fulfilled"
    ) {

        renderCampaign(
            campaignResult.value
        );

    } else {

        console.warn(
            "Campaign unavailable:",
            campaignResult.reason
        );

    }


    // --------------------------------------------------------
    // FREE LEARNING
    // --------------------------------------------------------

    if (
        freeResult.status === "fulfilled"
    ) {

        renderFreeLearning(
            freeResult.value
        );

    } else {

        console.warn(
            "Free learning unavailable:",
            freeResult.reason
        );

    }


    // --------------------------------------------------------
    // RESULTS
    // --------------------------------------------------------

    if (
        resultsResult.status === "fulfilled"
    ) {

        renderResults(
            resultsResult.value
        );

    } else {

        console.warn(
            "Results unavailable:",
            resultsResult.reason
        );

    }


    // --------------------------------------------------------
    // ENROLLMENTS
    // --------------------------------------------------------

    if (
        enrollmentsResult.status === "fulfilled"
    ) {

        enrollments =
            enrollmentsResult.value;

    } else {

        console.warn(
            "Enrollments unavailable:",
            enrollmentsResult.reason
        );

        enrollments = [];

    }


    renderLearning();

    await loadPersonalSections();

}


// ============================================================
// HERO BANNERS
// ============================================================

async function loadHeroBanners() {

    const ref =
        collection(
            db,
            "homeBanners"
        );

    /*
     * No orderBy here.
     *
     * This avoids unnecessary composite-index
     * problems while we are developing.
     */

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
            Number(a.order || 999) -
            Number(b.order || 999)
    );


    return banners;

}


// ============================================================
// ANNOUNCEMENTS
// ============================================================

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


    const announcements =
        snapshot.docs.map(
            item => ({
                id: item.id,
                ...item.data()
            })
        );


    announcements.sort(
        (a, b) => {

            const aDate =
                getDateValue(a.date);

            const bDate =
                getDateValue(b.date);

            return bDate - aDate;

        }
    );


    return announcements;

}


// ============================================================
// BATCHES
// ============================================================

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


    batches.sort(
        (a, b) =>
            Number(b.priority || 0) -
            Number(a.priority || 0)
    );


    /*
     * Class based recommendation.
     */

    if (
        student &&
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

                    return batch.targetClasses.includes(
                        student.className
                    );

                }
            );


        if (matching.length) {

            batches = matching;

        }

    }


    return batches.slice(0, 10);

}


// ============================================================
// CAMPAIGN
// ============================================================

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
            limit(10)
        );


    const snapshot =
        await getDocs(q);


    if (snapshot.empty) {

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
            Number(a.order || 999) -
            Number(b.order || 999)
    );


    return campaigns[0] || null;

}


// ============================================================
// FREE LEARNING
// ============================================================

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


    const items =
        snapshot.docs.map(
            item => ({
                id: item.id,
                ...item.data()
            })
        );


    items.sort(
        (a, b) =>
            Number(a.order || 999) -
            Number(b.order || 999)
    );


    return items;

}


// ============================================================
// RESULTS
// ============================================================

async function loadResults() {

    const ref =
        collection(
            db,
            "results"
        );

    const q =
        query(
            ref,
            where(
                "featured",
                "==",
                true
            ),
            limit(10)
        );


    const snapshot =
        await getDocs(q);


    const results =
        snapshot.docs.map(
            item => ({
                id: item.id,
                ...item.data()
            })
        );


    results.sort(
        (a, b) =>
            Number(b.score || 0) -
            Number(a.score || 0)
    );


    return results;

}


// ============================================================
// ENROLLMENTS
// ============================================================

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


// ============================================================
// STUDENT PROFILE UI
// ============================================================

function renderStudentProfile(data) {

    document.getElementById(
        "studentName"
    ).textContent =
        data.name || "Student";


    let academic = "";


    if (data.className) {

        academic =
            data.className;

    }


    if (data.board) {

        const board =
            shortBoard(data.board);


        academic +=
            academic
                ? ` • ${board}`
                : board;

    }


    if (data.combination) {

        academic +=
            ` • ${data.combination}`;

    }


    document.getElementById(
        "studentAcademic"
    ).textContent =
        academic || "Zenova Student";


    document.getElementById(
        "studentPoints"
    ).textContent =
        `${Number(data.points || 0)} Points`;

}


function shortBoard(board) {

    if (
        board ===
        "Karnataka State Board"
    ) {

        return "SSLC";

    }

    return board;

}


// ============================================================
// HERO UI
// ============================================================

function renderHero(banners) {

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
        !banners ||
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
                                banner.imageUrl || ""
                            )
                        }"
                        alt="${
                            escapeAttr(
                                banner.title || "Zenova"
                            )
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
                    data-slide="${index}"
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

function setupHeroSlider(total) {

    if (total <= 1) {
        return;
    }


    let current = 0;


    const slides =
        document.querySelectorAll(
            ".hero-slide"
        );

    const dots =
        document.querySelectorAll(
            ".hero-dot"
        );


    function show(index) {

        current =
            (index + total) % total;


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
                            dot.dataset.slide
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


// ============================================================
// ANNOUNCEMENTS UI
// ============================================================

function renderAnnouncements(
    announcements
) {

    const section =
        document.getElementById(
            "announcementsSection"
        );

    const container =
        document.getElementById(
            "announcementsList"
        );


    if (
        !announcements ||
        !announcements.length
    ) {

        section.classList.add(
            "hidden"
        );

        return;

    }


    section.classList.remove(
        "hidden"
    );


    container.innerHTML =
        announcements
            .slice(0, 3)
            .map(
                item => {

                    const date =
                        formatDate(
                            item.date
                        );


                    return `

                        <article
                            class="announcement"
                            data-link="${
                                escapeAttr(
                                    item.link || ""
                                )
                            }"
                        >

                            <div class="announcement-date">

                                <strong>
                                    ${date.day}
                                </strong>

                                <span>
                                    ${date.month}
                                </span>

                            </div>


                            <div class="announcement-text">

                                <strong>
                                    ${escapeHtml(
                                        item.title || ""
                                    )}
                                </strong>

                                <p>
                                    ${escapeHtml(
                                        item.description || ""
                                    )}
                                </p>

                            </div>


                            <div class="announcement-arrow">
                                ›
                            </div>

                        </article>

                    `;

                }
            )
            .join("");


    container
        .querySelectorAll(
            ".announcement"
        )
        .forEach(
            item => {

                item.addEventListener(
                    "click",
                    () => {

                        if (
                            item.dataset.link
                        ) {

                            window.location.href =
                                item.dataset.link;

                        }

                    }
                );

            }
        );

}


// ============================================================
// BATCH UI
// ============================================================

function renderRecommendedBatches(
    batches
) {

    const section =
        document.getElementById(
            "recommendedSection"
        );

    const container =
        document.getElementById(
            "recommendedList"
        );


    if (
        !batches ||
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


    container.innerHTML =
        batches
            .slice(0, 8)
            .map(
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
                                        batch.imageUrl || ""
                                    )
                                }"
                                alt="${
                                    escapeAttr(
                                        batch.name || ""
                                    )
                                }"
                                loading="lazy"
                            >

                            <span class="mode-label">
                                ${
                                    escapeHtml(
                                        batch.mode ||
                                        "ONLINE"
                                    )
                                }
                            </span>

                        </div>


                        <div class="batch-info">

                            <h3>
                                ${
                                    escapeHtml(
                                        batch.name || ""
                                    )
                                }
                            </h3>


                            <p>
                                ${
                                    escapeHtml(
                                        batch.shortDescription || ""
                                    )
                                }
                            </p>


                            <div class="batch-bottom">

                                <strong
                                    class="batch-price"
                                >
                                    ₹${
                                        formatMoney(
                                            batch.price || 0
                                        )
                                    }
                                </strong>


                                <span class="batch-arrow">
                                    ›
                                </span>

                            </div>

                        </div>

                    </article>

                `
            )
            .join("");


    container
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

    const content =
        document.getElementById(
            "campaignContent"
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


    content.innerHTML = `

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
                    >
                `
                : ""
        }


        <div class="campaign-overlay">

            ${
                campaign.tag
                    ? `
                        <span class="campaign-tag">
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
                        campaign.title || ""
                    )
                }
            </h2>


            <p>
                ${
                    escapeHtml(
                        campaign.description || ""
                    )
                }
            </p>


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

    const container =
        document.getElementById(
            "freeLearningList"
        );


    if (
        !items ||
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


    container.innerHTML =
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
                                item.imageUrl || ""
                            )
                        }"
                        alt="${
                            escapeAttr(
                                item.title || ""
                            )
                        }"
                        loading="lazy"
                    >


                    <div>

                        <strong>
                            ${
                                escapeHtml(
                                    item.title || ""
                                )
                            }
                        </strong>

                        <p>
                            ${
                                escapeHtml(
                                    item.description || ""
                                )
                            }
                        </p>

                    </div>

                </article>

            `
        ).join("");


    container
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
// RESULTS UI
// ============================================================

function renderResults(
    results
) {

    const section =
        document.getElementById(
            "resultsSection"
        );

    const container =
        document.getElementById(
            "resultsList"
        );


    if (
        !results ||
        !results.length
    ) {

        section.classList.add(
            "hidden"
        );

        return;

    }


    section.classList.remove(
        "hidden"
    );


    container.innerHTML =
        results
            .slice(0, 3)
            .map(
                result => `

                    <div class="result-card">

                        <strong>
                            ${
                                escapeHtml(
                                    result.scoreText ||
                                    `${result.score || 0}%`
                                )
                            }
                        </strong>

                        <span>
                            ${
                                escapeHtml(
                                    result.exam ||
                                    "Zenova Student"
                                )
                            }
                        </span>

                    </div>

                `
            )
            .join("");

}


// ============================================================
// LEARNING UI
// ============================================================

function renderLearning() {

    const section =
        document.getElementById(
            "learningSection"
        );

    const container =
        document.getElementById(
            "learningContent"
        );


    /*
     * NO PURCHASE
     */

    if (
        !enrollments ||
        !enrollments.length
    ) {

        section.classList.remove(
            "hidden"
        );


        container.innerHTML = `

            <div
                class="learning-details"
                style="width:100%"
            >

                <span class="continue">
                    YOUR LEARNING JOURNEY
                </span>


                <h3>
                    Find the right program for you
                </h3>


                <p>
                    Explore Zenova batches and start learning.
                </p>


                <button
                    class="continue-button"
                    id="exploreBatches"
                    style="margin-top:12px"
                >
                    EXPLORE
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
     * PURCHASED
     */

    const enrollment =
        enrollments[0];


    section.classList.remove(
        "hidden"
    );


    const progress =
        Number(
            enrollment.progress || 0
        );


    container.innerHTML = `

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

            <span class="continue">
                CONTINUE WHERE YOU LEFT
            </span>


            <h3>
                ${
                    escapeHtml(
                        enrollment.lastContentTitle ||
                        enrollment.batchName ||
                        "Your Batch"
                    )
                }
            </h3>


            <p>
                ${
                    escapeHtml(
                        enrollment.lastContentSubtitle ||
                        enrollment.batchName ||
                        ""
                    )
                }
            </p>


            <div class="progress-row">

                <div class="progress-track">

                    <div
                        class="progress-fill"
                        style="width:${progress}%"
                    ></div>

                </div>


                <span class="progress-percent">
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


// ============================================================
// PERSONAL SECTIONS
// ============================================================

async function loadPersonalSections() {

    if (
        !enrollments.length
    ) {

        return;

    }


    /*
     * These are intentionally independent.
     */

    try {

        await loadUpcomingClasses();

    } catch (error) {

        console.warn(
            "Upcoming classes unavailable:",
            error
        );

    }


    try {

        await loadUpcomingTests();

    } catch (error) {

        console.warn(
            "Upcoming tests unavailable:",
            error
        );

    }


    try {

        await loadProgress();

    } catch (error) {

        console.warn(
            "Progress unavailable:",
            error
        );

    }

}


// ============================================================
// UPCOMING CLASSES
// ============================================================

async function loadUpcomingClasses() {

    const batchIds =
        enrollments
            .map(
                item =>
                    item.batchId
            )
            .filter(Boolean);


    if (
        !batchIds.length
    ) {

        return;

    }


    const ref =
        collection(
            db,
            "classes"
        );


    /*
     * We don't use orderBy here.
     * This avoids composite-index problems.
     */

    const q =
        query(
            ref,
            where(
                "batchId",
                "in",
                batchIds.slice(0, 10)
            ),
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

        return;

    }


    const classes =
        snapshot.docs.map(
            item => ({
                id: item.id,
                ...item.data()
            })
        );


    classes.sort(
        (a, b) =>
            getDateValue(
                a.startTime
            ) -
            getDateValue(
                b.startTime
            )
    );


    const section =
        document.getElementById(
            "classesSection"
        );

    const container =
        document.getElementById(
            "classesList"
        );


    section.classList.remove(
        "hidden"
    );


    container.innerHTML =
        classes
            .slice(0, 3)
            .map(
                item => `

                    <article class="simple-item">

                        <div class="simple-item-left">

                            <div class="simple-date">

                                <strong>
                                    ${
                                        formatShortDay(
                                            item.startTime
                                        )
                                    }
                                </strong>

                                <span>
                                    ${
                                        formatTime(
                                            item.startTime
                                        )
                                    }
                                </span>

                            </div>


                            <div>

                                <h3>
                                    ${
                                        escapeHtml(
                                            item.title ||
                                            "Class"
                                        )
                                    }
                                </h3>

                                <p>
                                    ${
                                        escapeHtml(
                                            item.subject ||
                                            ""
                                        )
                                    }
                                </p>

                            </div>

                        </div>


                        <span class="simple-arrow">
                            ›
                        </span>

                    </article>

                `
            )
            .join("");

}


// ============================================================
// UPCOMING TESTS
// ============================================================

async function loadUpcomingTests() {

    const batchIds =
        enrollments
            .map(
                item =>
                    item.batchId
            )
            .filter(Boolean);


    if (
        !batchIds.length
    ) {

        return;

    }


    const ref =
        collection(
            db,
            "tests"
        );


    const q =
        query(
            ref,
            where(
                "batchId",
                "in",
                batchIds.slice(0, 10)
            ),
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

        return;

    }


    const tests =
        snapshot.docs.map(
            item => ({
                id: item.id,
                ...item.data()
            })
        );


    tests.sort(
        (a, b) =>
            getDateValue(
                a.startTime
            ) -
            getDateValue(
                b.startTime
            )
    );


    const section =
        document.getElementById(
            "testsSection"
        );

    const container =
        document.getElementById(
            "testsList"
        );


    section.classList.remove(
        "hidden"
    );


    container.innerHTML =
        tests
            .slice(0, 3)
            .map(
                item => `

                    <article class="simple-item">

                        <div class="simple-item-left">

                            <div class="simple-date">

                                <strong>
                                    ${
                                        formatShortDay(
                                            item.startTime
                                        )
                                    }
                                </strong>

                                <span>
                                    ${
                                        formatTime(
                                            item.startTime
                                        )
                                    }
                                </span>

                            </div>


                            <div>

                                <h3>
                                    ${
                                        escapeHtml(
                                            item.title ||
                                            "Test"
                                        )
                                    }
                                </h3>

                                <p>
                                    ${
                                        escapeHtml(
                                            item.subject ||
                                            ""
                                        )
                                    }
                                </p>

                            </div>

                        </div>


                        <span class="simple-arrow">
                            ›
                        </span>

                    </article>

                `
            )
            .join("");

}


// ============================================================
// PROGRESS
// ============================================================

async function loadProgress() {

    if (
        !enrollments.length
    ) {

        return;

    }


    const progress =
        Number(
            student?.overallProgress || 0
        );


    const section =
        document.getElementById(
            "progressSection"
        );

    const container =
        document.getElementById(
            "progressContent"
        );


    section.classList.remove(
        "hidden"
    );


    container.innerHTML = `

        <div class="progress-top">

            <strong>
                Overall learning progress
            </strong>

            <span>
                ${progress}%
            </span>

        </div>


        <div class="progress-large-track">

            <div
                class="progress-large-fill"
                style="width:${progress}%"
            ></div>

        </div>

    `;

}


// ============================================================
// NAVIGATION
// ============================================================

function navigate(destination) {

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
        routes[destination]
    ) {

        window.location.href =
            routes[destination];

    }

}


// ============================================================
// ALL DATA-ACTION BUTTONS
// ============================================================

document
    .querySelectorAll(
        "[data-action]"
    )
    .forEach(
        element => {

            element.addEventListener(
                "click",
                () => {

                    navigate(
                        element.dataset.action
                    );

                }
            );

        }
    );


// ============================================================
// AI
// ============================================================

const aiButton =
    document.getElementById(
        "aiButton"
    );


if (aiButton) {

    aiButton.addEventListener(
        "click",
        () => {

            navigate("ai");

        }
    );

}


// ============================================================
// NOTIFICATIONS
// ============================================================

const notificationButton =
    document.getElementById(
        "notificationButton"
    );


if (notificationButton) {

    notificationButton.addEventListener(
        "click",
        () => {

            navigate(
                "notifications"
            );

        }
    );

}


// ============================================================
// SIDE MENU
// ============================================================

const sideMenu =
    document.getElementById(
        "sideMenu"
    );

const menuOverlay =
    document.getElementById(
        "menuOverlay"
    );

const menuButton =
    document.getElementById(
        "menuButton"
    );

const closeMenuButton =
    document.getElementById(
        "closeMenu"
    );


if (menuButton) {

    menuButton.addEventListener(
        "click",
        () => {

            sideMenu.classList.add(
                "open"
            );

            menuOverlay.classList.remove(
                "hidden"
            );

        }
    );

}


if (closeMenuButton) {

    closeMenuButton.addEventListener(
        "click",
        closeMenu
    );

}


if (menuOverlay) {

    menuOverlay.addEventListener(
        "click",
        closeMenu
    );

}


function closeMenu() {

    sideMenu.classList.remove(
        "open"
    );

    menuOverlay.classList.add(
        "hidden"
    );

}


// ============================================================
// LOADING
// ============================================================

function hideLoader() {

    loader.style.opacity =
        "0";

    loader.style.transition =
        "opacity .25s ease";


    setTimeout(
        () => {

            loader.classList.add(
                "hidden"
            );

        },
        250
    );

}


function showApp() {

    app.classList.remove(
        "hidden"
    );

}


// ============================================================
// ERROR SCREEN
// ============================================================

function showFatalError(error) {

    console.error(
        "FINAL HOME ERROR:",
        error
    );


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
                    margin-top:12px;
                    color:#777;
                    font-size:11px;
                    line-height:1.6;
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
                    font-size:10px;
                    cursor:pointer;
                "
            >
                TRY AGAIN
            </button>

        </div>

    `;

}


// ============================================================
// DATE HELPERS
// ============================================================

function getDateValue(value) {

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


    return Number.isNaN(time)
        ? 0
        : time;

}


function formatDate(value) {

    const time =
        getDateValue(value);


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
            ).padStart(2, "0"),

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


function formatShortDay(value) {

    const time =
        getDateValue(value);


    if (!time) {

        return "--";

    }


    return String(
        new Date(time).getDate()
    ).padStart(2, "0");

}


function formatTime(value) {

    const time =
        getDateValue(value);


    if (!time) {

        return "";

    }


    return new Date(time)
        .toLocaleTimeString(
            "en-IN",
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );

}


// ============================================================
// MONEY
// ============================================================

function formatMoney(value) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-IN"
    );

}


// ============================================================
// SECURITY / HTML ESCAPING
// ============================================================

function escapeHtml(value) {

    return String(value)
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


function escapeAttr(value) {

    return escapeHtml(value);

}

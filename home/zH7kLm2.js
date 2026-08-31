// ============================================================
// ZENOVA EDUCATIONS
// UNIVERSAL HOME CONTROLLER
// ============================================================

import {
    auth,
    db
} from "../firebase/firebase-config.js";

import {
    onAuthStateChanged
} from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs
} from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ============================================================
// ELEMENTS
// ============================================================

const loader =
    document.getElementById("pageLoader");

const app =
    document.getElementById("app");


// ============================================================
// GLOBAL STATE
// ============================================================

let currentUser = null;

let student = null;

let enrollments = [];

let heroTimer = null;


// ============================================================
// START
// ============================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.replace(
                "../login/"
            );

            return;

        }

        currentUser = user;

        try {

            await loadHome();

        } catch (error) {

            console.error(
                "Zenova Home Error:",
                error
            );

            showFatalError();

        }

    }
);


// ============================================================
// LOAD COMPLETE HOME
// ============================================================

async function loadHome() {

    /*
     * We intentionally keep the entire Home hidden
     * until the important Firebase information is ready.
     */

    const [
        profileData,
        bannerData,
        announcementData,
        batchData,
        campaignData,
        freeData,
        resultData,
        enrollmentData
    ] = await Promise.all([

        loadStudentProfile(),

        loadHeroBanners(),

        loadAnnouncements(),

        loadRecommendedBatches(),

        loadCampaign(),

        loadFreeLearning(),

        loadResults(),

        loadEnrollments()

    ]);


    student =
        profileData;

    enrollments =
        enrollmentData;


    renderStudentProfile(student);

    renderHero(bannerData);

    renderAnnouncements(announcementData);

    renderRecommendedBatches(batchData);

    renderCampaign(campaignData);

    renderFreeLearning(freeData);

    renderResults(resultData);

    renderLearning();

    await loadPersonalSections();

    hideLoader();

    showApp();

}


// ============================================================
// STUDENT PROFILE
// ============================================================

async function loadStudentProfile() {

    const ref =
        doc(
            db,
            "students",
            currentUser.uid
        );

    const snapshot =
        await getDoc(ref);


    if (!snapshot.exists()) {

        /*
         * The user is authenticated but has
         * not completed onboarding.
         */

        window.location.replace(
            "../onboarding/"
        );

        throw new Error(
            "Student profile does not exist."
        );

    }


    return snapshot.data();

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

    const q =
        query(
            ref,
            where(
                "active",
                "==",
                true
            ),
            orderBy(
                "order",
                "asc"
            ),
            limit(10)
        );


    const snapshot =
        await getDocs(q);


    return snapshot.docs.map(
        doc => ({
            id: doc.id,
            ...doc.data()
        })
    );

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
            orderBy(
                "date",
                "desc"
            ),
            limit(5)
        );


    const snapshot =
        await getDocs(q);


    return snapshot.docs.map(
        doc => ({
            id: doc.id,
            ...doc.data()
        })
    );

}


// ============================================================
// RECOMMENDED BATCHES
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
            orderBy(
                "priority",
                "desc"
            ),
            limit(10)
        );


    const snapshot =
        await getDocs(q);


    const allBatches =
        snapshot.docs.map(
            doc => ({
                id: doc.id,
                ...doc.data()
            })
        );


    /*
     * Initial recommendation filtering.
     *
     * Later we will build a much stronger
     * recommendation engine.
     */

    return allBatches.filter(
        batch => {

            if (
                !batch.targetClasses ||
                !Array.isArray(
                    batch.targetClasses
                )
            ) {

                return true;

            }


            return batch.targetClasses.includes(
                student?.className
            );

        }
    ).slice(0, 6);

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
            orderBy(
                "order",
                "asc"
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
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
    };

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
            orderBy(
                "order",
                "asc"
            ),
            limit(8)
        );


    const snapshot =
        await getDocs(q);


    return snapshot.docs.map(
        doc => ({
            id: doc.id,
            ...doc.data()
        })
    );

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
            orderBy(
                "score",
                "desc"
            ),
            limit(6)
        );


    const snapshot =
        await getDocs(q);


    return snapshot.docs.map(
        doc => ({
            id: doc.id,
            ...doc.data()
        })
    );

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
            )
        );


    const snapshot =
        await getDocs(q);


    return snapshot.docs.map(
        doc => ({
            id: doc.id,
            ...doc.data()
        })
    );

}


// ============================================================
// PROFILE RENDER
// ============================================================

function renderStudentProfile(data) {

    document.getElementById(
        "studentName"
    ).textContent =
        data.name || "Student";


    let academic = "";


    if (data.className) {

        academic +=
            data.className;

    }


    if (data.board) {

        academic +=
            academic
                ? ` • ${shortBoard(data.board)}`
                : shortBoard(data.board);

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
        `${data.points || 0} Points`;

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
// HERO RENDER
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


    if (!banners.length) {

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
                    class="hero-slide ${index === 0 ? "active" : ""}"
                    data-link="${escapeAttr(
                        banner.link || ""
                    )}"
                >

                    <img
                        src="${escapeAttr(
                            banner.imageUrl || ""
                        )}"
                        alt="${escapeAttr(
                            banner.title || "Zenova"
                        )}"
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
                    data-slide="${index}"
                    aria-label="Slide ${
                        index + 1
                    }"
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

    let current = 0;


    const slides =
        document.querySelectorAll(
            ".hero-slide"
        );

    const dots =
        document.querySelectorAll(
            ".hero-dot"
        );


    function showSlide(index) {

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

                    showSlide(
                        Number(
                            dot.dataset.slide
                        )
                    );

                }
            );

        }
    );


    slides.forEach(
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


    if (total > 1) {

        heroTimer =
            setInterval(
                () => {

                    showSlide(
                        current + 1
                    );

                },
                5000
            );

    }

}


// ============================================================
// ANNOUNCEMENTS RENDER
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


    if (!announcements.length) {

        section.classList.add(
            "hidden"
        );

        return;

    }


    section.classList.remove(
        "hidden"
    );


    container.innerHTML =
        announcements.slice(0, 3).map(
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
        ).join("");


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
// RECOMMENDED BATCHES
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


    if (!batches.length) {

        section.classList.add(
            "hidden"
        );

        return;

    }


    section.classList.remove(
        "hidden"
    );


    container.innerHTML =
        batches.map(
            batch => `

                <article
                    class="batch-card"
                    data-id="${
                        escapeAttr(batch.id)
                    }"
                >

                    <div class="batch-image">

                        <img
                            src="${escapeAttr(
                                batch.imageUrl || ""
                            )}"
                            alt="${escapeAttr(
                                batch.name || ""
                            )}"
                            loading="lazy"
                        >

                        <span class="mode-label">
                            ${escapeHtml(
                                batch.mode || "ONLINE"
                            )}
                        </span>

                    </div>


                    <div class="batch-info">

                        <h3>
                            ${escapeHtml(
                                batch.name || ""
                            )}
                        </h3>

                        <p>
                            ${escapeHtml(
                                batch.shortDescription || ""
                            )}
                        </p>


                        <div class="batch-bottom">

                            <strong
                                class="batch-price"
                            >
                                ₹${formatMoney(
                                    batch.price || 0
                                )}
                            </strong>

                            <span
                                class="batch-arrow"
                            >
                                ›
                            </span>

                        </div>

                    </div>

                </article>

            `
        ).join("");


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
                            `../batch/?id=${encodeURIComponent(
                                card.dataset.id
                            )}`;

                    }
                );

            }
        );

}


// ============================================================
// CAMPAIGN
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
                        src="${escapeAttr(
                            campaign.imageUrl
                        )}"
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
                            ${escapeHtml(
                                campaign.tag
                            )}
                        </span>
                    `
                    : ""
            }

            <h2>
                ${escapeHtml(
                    campaign.title || ""
                )}
            </h2>

            <p>
                ${escapeHtml(
                    campaign.description || ""
                )}
            </p>

            ${
                campaign.buttonText
                    ? `
                        <button
                            class="campaign-button"
                            id="campaignButton"
                        >
                            ${escapeHtml(
                                campaign.buttonText
                            )}
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


    if (button && campaign.link) {

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
// FREE LEARNING
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


    if (!items.length) {

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
                        src="${escapeAttr(
                            item.imageUrl || ""
                        )}"
                        alt="${escapeAttr(
                            item.title || ""
                        )}"
                        loading="lazy"
                    >

                    <div>

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
// RESULTS
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


    if (!results.length) {

        section.classList.add(
            "hidden"
        );

        return;

    }


    section.classList.remove(
        "hidden"
    );


    container.innerHTML =
        results.slice(0, 3).map(
            result => `

                <div class="result-card">

                    <strong>
                        ${escapeHtml(
                            result.scoreText ||
                            `${result.score || 0}%`
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            result.exam ||
                            "Zenova Student"
                        )}
                    </span>

                </div>

            `
        ).join("");

}


// ============================================================
// LEARNING
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


    if (!enrollments.length) {

        /*
         * No purchase:
         * Show a useful CTA rather than "No data".
         */

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
     * For now use the latest enrollment.
     *
     * Later this will use actual
     * learning progress from the content
     * system.
     */

    const enrollment =
        enrollments[0];


    section.classList.remove(
        "hidden"
    );


    container.innerHTML = `

        <div class="learning-thumbnail">

            ${
                enrollment.batchImageUrl
                    ? `
                        <img
                            src="${escapeAttr(
                                enrollment.batchImageUrl
                            )}"
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
                ${escapeHtml(
                    enrollment.lastContentTitle ||
                    enrollment.batchName ||
                    "Your Batch"
                )}
            </h3>

            <p>
                ${escapeHtml(
                    enrollment.lastContentSubtitle ||
                    enrollment.batchName ||
                    ""
                )}
            </p>


            <div class="progress-row">

                <div class="progress-track">

                    <div
                        class="progress-fill"
                        style="width:${
                            Number(
                                enrollment.progress || 0
                            )
                        }%"
                    ></div>

                </div>

                <span
                    class="progress-percent"
                >
                    ${
                        Number(
                            enrollment.progress || 0
                        )
                    }%
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

    if (!enrollments.length) {

        return;

    }


    /*
     * These collections will be built properly
     * when we build the timetable and test systems.
     */

    try {

        await Promise.all([
            loadUpcomingClasses(),
            loadUpcomingTests(),
            loadProgress()
        ]);

    } catch (error) {

        console.warn(
            "Some personal Home data unavailable:",
            error
        );

    }

}


// ============================================================
// UPCOMING CLASSES
// ============================================================

async function loadUpcomingClasses() {

    const section =
        document.getElementById(
            "classesSection"
        );

    const container =
        document.getElementById(
            "classesList"
        );


    const batchIds =
        enrollments
            .map(
                item =>
                    item.batchId
            )
            .filter(Boolean);


    if (!batchIds.length) {

        return;

    }


    /*
     * This is intentionally prepared for the
     * timetable collection we will build next.
     */

    const ref =
        collection(
            db,
            "classes"
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
            orderBy(
                "startTime",
                "asc"
            ),
            limit(3)
        );


    const snapshot =
        await getDocs(q);


    if (snapshot.empty) {

        return;

    }


    const classes =
        snapshot.docs.map(
            doc => doc.data()
        );


    section.classList.remove(
        "hidden"
    );


    container.innerHTML =
        classes.map(
            item => `

                <article class="simple-item">

                    <div class="simple-item-left">

                        <div class="simple-date">

                            <strong>
                                ${formatShortDay(
                                    item.startTime
                                )}
                            </strong>

                            <span>
                                ${formatTime(
                                    item.startTime
                                )}
                            </span>

                        </div>

                        <div>

                            <h3>
                                ${escapeHtml(
                                    item.title || "Class"
                                )}
                            </h3>

                            <p>
                                ${escapeHtml(
                                    item.subject || ""
                                )}
                            </p>

                        </div>

                    </div>

                    <span class="simple-arrow">
                        ›
                    </span>

                </article>

            `
        ).join("");

}


// ============================================================
// UPCOMING TESTS
// ============================================================

async function loadUpcomingTests() {

    const section =
        document.getElementById(
            "testsSection"
        );

    const container =
        document.getElementById(
            "testsList"
        );


    const batchIds =
        enrollments
            .map(
                item =>
                    item.batchId
            )
            .filter(Boolean);


    if (!batchIds.length) {

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
            orderBy(
                "startTime",
                "asc"
            ),
            limit(3)
        );


    const snapshot =
        await getDocs(q);


    if (snapshot.empty) {

        return;

    }


    section.classList.remove(
        "hidden"
    );


    container.innerHTML =
        snapshot.docs.map(
            document => {

                const item =
                    document.data();


                return `

                    <article class="simple-item">

                        <div class="simple-item-left">

                            <div class="simple-date">

                                <strong>
                                    ${formatShortDay(
                                        item.startTime
                                    )}
                                </strong>

                                <span>
                                    ${formatTime(
                                        item.startTime
                                    )}
                                </span>

                            </div>

                            <div>

                                <h3>
                                    ${escapeHtml(
                                        item.title || "Test"
                                    )}
                                </h3>

                                <p>
                                    ${escapeHtml(
                                        item.subject || ""
                                    )}
                                </p>

                            </div>

                        </div>

                        <span class="simple-arrow">
                            ›
                        </span>

                    </article>

                `;

            }
        ).join("");

}


// ============================================================
// PROGRESS
// ============================================================

async function loadProgress() {

    const section =
        document.getElementById(
            "progressSection"
        );

    const container =
        document.getElementById(
            "progressContent"
        );


    const progress =
        Number(
            student?.overallProgress || 0
        );


    if (!enrollments.length) {

        return;

    }


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

function navigate(
    destination
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
            "../support/"

    };


    if (
        routes[destination]
    ) {

        window.location.href =
            routes[destination];

    }

}


// ============================================================
// NAVIGATION EVENTS
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

const sideMenu =
    document.getElementById(
        "sideMenu"
    );

const menuOverlay =
    document.getElementById(
        "menuOverlay"
    );


document
    .getElementById(
        "menuButton"
    )
    .addEventListener(
        "click",
        openMenu
    );


document
    .getElementById(
        "closeMenu"
    )
    .addEventListener(
        "click",
        closeMenu
    );


menuOverlay.addEventListener(
    "click",
    closeMenu
);


function openMenu() {

    sideMenu.classList.add(
        "open"
    );

    menuOverlay.classList.remove(
        "hidden"
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
// LOADER CONTROL
// ============================================================

function hideLoader() {

    loader.style.opacity = "0";

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
// FATAL ERROR
// ============================================================

function showFatalError() {

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
                    font-weight:800;
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
                    color:white;
                    font-size:10px;
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

function formatDate(value) {

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
            ).padStart(2, "0"),

        month:
            date.toLocaleString(
                "en-IN",
                {
                    month: "short"
                }
            ).toUpperCase()

    };

}


function formatShortDay(value) {

    const date =
        value?.toDate
            ? value.toDate()
            : new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "--";

    }


    return date
        .getDate()
        .toString()
        .padStart(2, "0");

}


function formatTime(value) {

    const date =
        value?.toDate
            ? value.toDate()
            : new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    return date.toLocaleTimeString(
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

    return Number(value)
        .toLocaleString("en-IN");

}


// ============================================================
// SECURITY HELPERS
// ============================================================

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function escapeAttr(value) {

    return escapeHtml(value);

}

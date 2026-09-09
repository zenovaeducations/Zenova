import {
    auth,
    db
} from "../firebase/firebase-config.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    signOut
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
   STATE
========================================================= */

let currentUser = null;
let student = null;
let enrollments = [];


/* =========================================================
   ELEMENTS
========================================================= */

const loader =
    document.getElementById(
        "zenovaLoader"
    );

const app =
    document.getElementById(
        "zenovaApp"
    );


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.replace(
                "../account/login/"
            );

            return;
        }


        currentUser = user;


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
            if (!snapshot.exists()) {

                window.location.replace(
                    "../account/onboarding/"
                );

                return;
            }


            student =
                snapshot.data();


            /*
             * Onboarding protection.
             */
            if (
                student.onboardingComplete !== true
            ) {

                window.location.replace(
                    "../account/onboarding/"
                );

                return;
            }


            /*
             * Render student immediately.
             */
            renderStudent();


            /*
             * Load Home data.
             */
            await loadHome();


            /*
             * Show page.
             */
            showApp();

        } catch (error) {

            console.error(
                "ZENOVA HOME ERROR:",
                error
            );

            showError();

        }

    }
);


/* =========================================================
   STUDENT
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


    const initialElement =
        document.getElementById(
            "profileInitial"
        );


    const academicElement =
        document.getElementById(
            "studentAcademic"
        );


    nameElement.textContent =
        name;


    initialElement.textContent =
        name
            .charAt(0)
            .toUpperCase();


    /*
     * Academic line.
     */
    const academicParts = [];


    if (student.className) {

        academicParts.push(
            student.className
        );

    }


    if (student.board) {

        academicParts.push(
            student.board
        );

    }


    if (student.combination) {

        academicParts.push(
            student.combination
        );

    }


    academicElement.textContent =
        academicParts.length
            ? academicParts.join(" • ")
            : "Zenova Student";


    /*
     * Greeting.
     */
    const hour =
        new Date().getHours();


    let greeting =
        "Good morning";


    if (hour >= 12 && hour < 17) {

        greeting =
            "Good afternoon";

    }


    if (hour >= 17) {

        greeting =
            "Good evening";

    }


    document.getElementById(
        "greeting"
    ).textContent =
        greeting;

}


/* =========================================================
   HOME DATA
========================================================= */

async function loadHome() {

    const results =
        await Promise.all([

            safeLoad(
                loadBanners
            ),

            safeLoad(
                loadAnnouncements
            ),

            safeLoad(
                loadLiveClasses
            ),

            safeLoad(
                loadTests
            ),

            safeLoad(
                loadFreeLearning
            ),

            safeLoad(
                loadEnrollments
            )

        ]);


    const [
        banners,
        announcements,
        liveClasses,
        tests,
        freeLearning,
        studentEnrollments
    ] = results;


    enrollments =
        studentEnrollments || [];


    renderBanners(
        banners || []
    );


    renderAnnouncements(
        announcements || []
    );


    renderLiveClasses(
        liveClasses || []
    );


    renderTests(
        tests || []
    );


    renderFreeLearning(
        freeLearning || []
    );


    renderLearning();


    renderMyLearning();


    renderProgress();

}


/* =========================================================
   SAFE LOADER
========================================================= */

async function safeLoad(
    functionToRun
) {

    try {

        return await functionToRun();

    } catch (error) {

        console.warn(
            "Home section unavailable:",
            error
        );

        return [];

    }

}


/* =========================================================
   BANNERS
========================================================= */

async function loadBanners() {

    const q =
        query(
            collection(
                db,
                "homeBanners"
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


/* =========================================================
   ANNOUNCEMENTS
========================================================= */

async function loadAnnouncements() {

    const q =
        query(
            collection(
                db,
                "announcements"
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


    return snapshot.docs.map(
        item => ({
            id: item.id,
            ...item.data()
        })
    );

}


/* =========================================================
   LIVE CLASSES
========================================================= */

async function loadLiveClasses() {

    const q =
        query(
            collection(
                db,
                "liveClasses"
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


    return snapshot.docs.map(
        item => ({
            id: item.id,
            ...item.data()
        })
    );

}


/* =========================================================
   TESTS
========================================================= */

async function loadTests() {

    const q =
        query(
            collection(
                db,
                "tests"
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


    return snapshot.docs.map(
        item => ({
            id: item.id,
            ...item.data()
        })
    );

}


/* =========================================================
   FREE LEARNING
========================================================= */

async function loadFreeLearning() {

    const q =
        query(
            collection(
                db,
                "freeLearning"
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


    return snapshot.docs.map(
        item => ({
            id: item.id,
            ...item.data()
        })
    );

}


/* =========================================================
   ENROLLMENTS
========================================================= */

async function loadEnrollments() {

    const q =
        query(
            collection(
                db,
                "enrollments"
            ),

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


/* =========================================================
   BANNERS RENDER
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
                    class="hero-slide ${
                        index === 0
                            ? "active"
                            : ""
                    }"
                    data-link="${escapeAttr(
                        banner.link || ""
                    )}"
                >

                    <img
                        src="${escapeAttr(
                            banner.imageUrl || ""
                        )}"
                        alt=""
                    >

                </div>

            `
        ).join("");


    dots.innerHTML =
        banners.map(
            (_, index) => `

                <button
                    type="button"
                    class="hero-dot ${
                        index === 0
                            ? "active"
                            : ""
                    }"
                    data-index="${index}"
                ></button>

            `
        ).join("");


    setupSlider(
        banners.length
    );

}


/* =========================================================
   SLIDER
========================================================= */

function setupSlider(
    count
) {

    if (count <= 1) {

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


    setInterval(
        () => {

            showSlide(
                current + 1
            );

        },
        5000
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
            .slice(0, 3)
            .map(
                item => {

                    const date =
                        getDate(
                            item.date ||
                            item.createdAt
                        );


                    return `

                        <article
                            class="announcement-card"
                            data-link="${escapeAttr(
                                item.link || ""
                            )}"
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
                                    ${escapeHtml(
                                        item.title || ""
                                    )}
                                </strong>

                                <p>
                                    ${escapeHtml(
                                        item.description ||
                                        item.message ||
                                        ""
                                    )}
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
            )
            .join("");


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


/* =========================================================
   LIVE CLASSES
========================================================= */

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
            .slice(0, 4)
            .map(
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
                                    ${escapeHtml(
                                        item.time || ""
                                    )}
                                </strong>

                                <span>
                                    ${escapeHtml(
                                        item.period || ""
                                    )}
                                </span>

                            </div>


                            <div
                                class="schedule-info"
                            >

                                <h3>
                                    ${escapeHtml(
                                        item.title || ""
                                    )}
                                </h3>

                                <p>
                                    ${escapeHtml(
                                        item.subtitle ||
                                        item.teacher ||
                                        ""
                                    )}
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
            )
            .join("");

}


/* =========================================================
   TESTS
========================================================= */

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
            .slice(0, 4)
            .map(
                item => {

                    const date =
                        getDate(
                            item.date ||
                            item.testDate
                        );


                    return `

                        <article
                            class="schedule-card"
                            data-route="tests"
                        >

                            <div
                                class="schedule-left"
                            >

                                <div
                                    class="schedule-time"
                                >

                                    <strong>
                                        ${date.day}
                                    </strong>

                                    <span>
                                        ${date.month}
                                    </span>

                                </div>


                                <div
                                    class="schedule-info"
                                >

                                    <h3>
                                        ${escapeHtml(
                                            item.title || ""
                                        )}
                                    </h3>

                                    <p>
                                        ${escapeHtml(
                                            item.description ||
                                            item.subject ||
                                            ""
                                        )}
                                    </p>

                                </div>

                            </div>


                            <div
                                class="schedule-arrow"
                            >
                                →
                            </div>

                        </article>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   LEARNING
========================================================= */

function renderLearning() {

    const section =
        document.getElementById(
            "learningSection"
        );

    const card =
        document.getElementById(
            "learningCard"
        );


    if (!enrollments.length) {

        section.classList.add(
            "hidden"
        );

        return;
    }


    section.classList.remove(
        "hidden"
    );


    const enrollment =
        enrollments[0];


    const progress =
        clamp(
            Number(
                enrollment.progress || 0
            )
        );


    card.innerHTML = `

        <div
            class="learning-thumbnail"
        >

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


        <div
            class="learning-details"
        >

            <p
                class="learning-label"
            >
                CONTINUE LEARNING
            </p>


            <h3>
                ${escapeHtml(
                    enrollment.lastContentTitle ||
                    enrollment.batchName ||
                    "Your course"
                )}
            </h3>


            <p>
                ${escapeHtml(
                    enrollment.lastContentSubtitle ||
                    "Continue where you stopped."
                )}
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
            type="button"
            class="continue-button"
            data-route="learn"
        >
            CONTINUE
        </button>

    `;

}


/* =========================================================
   MY LEARNING
========================================================= */

function renderMyLearning() {

    const section =
        document.getElementById(
            "myLearningSection"
        );

    const list =
        document.getElementById(
            "myLearningList"
        );


    if (!enrollments.length) {

        section.classList.add(
            "hidden"
        );

        return;
    }


    section.classList.remove(
        "hidden"
    );


    list.innerHTML =
        enrollments
            .slice(0, 4)
            .map(
                enrollment => {

                    const progress =
                        clamp(
                            Number(
                                enrollment.progress ||
                                0
                            )
                        );


                    return `

                        <article
                            class="course-card"
                            data-route="learn"
                        >

                            <h3>
                                ${escapeHtml(
                                    enrollment.batchName ||
                                    enrollment.courseName ||
                                    "Zenova Course"
                                )}
                            </h3>


                            <p>
                                ${escapeHtml(
                                    enrollment.batchMode ||
                                    "Active learning"
                                )}
                            </p>


                            <div
                                class="course-progress"
                            >

                                <span
                                    style="width:${progress}%"
                                ></span>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   PROGRESS
========================================================= */

function renderProgress() {

    const section =
        document.getElementById(
            "progressSection"
        );

    const card =
        document.getElementById(
            "progressCard"
        );


    if (!enrollments.length) {

        section.classList.add(
            "hidden"
        );

        return;
    }


    const progress =
        clamp(
            Number(
                student.overallProgress ||
                enrollments[0].progress ||
                0
            )
        );


    section.classList.remove(
        "hidden"
    );


    card.innerHTML = `

        <div
            class="progress-heading"
        >

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


/* =========================================================
   FREE LEARNING
========================================================= */

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
            .slice(0, 6)
            .map(
                item => `

                    <article
                        class="free-card"
                        data-link="${escapeAttr(
                            item.link || ""
                        )}"
                    >

                        <img
                            src="${escapeAttr(
                                item.imageUrl || ""
                            )}"
                            alt=""
                            loading="lazy"
                        >


                        <div
                            class="free-card-content"
                        >

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
            )
            .join("");


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


/* =========================================================
   NAVIGATION
========================================================= */

const routes = {

    learn:
        "../courses/",

    live:
        "../live/",

    tests:
        "../tests/",

    chat:
        "../chat/",

    profile:
        "../profile/",

    performance:
        "../performance/",

    announcements:
        "../announcements/",

    free:
        "../library/",

    ai:
        "../ai/"

};


document
    .querySelectorAll(
        "[data-route]"
    )
    .forEach(
        element => {

            element.addEventListener(
                "click",
                () => {

                    const route =
                        element.dataset.route;


                    if (
                        routes[route]
                    ) {

                        window.location.href =
                            routes[route];

                    }

                }
            );

        }
    );


/* =========================================================
   HEADER ACTIONS
========================================================= */

document
    .getElementById(
        "notificationButton"
    )
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "../notifications/";

        }
    );


document
    .getElementById(
        "profileShortcut"
    )
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "../profile/";

        }
    );


document
    .getElementById(
        "aiButton"
    )
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "../ai/";

        }
    );


/* =========================================================
   SHOW APP
========================================================= */

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
                    font-size:21px;
                    font-weight:800;
                    letter-spacing:2px;
                "
            >
                ZENOVA
            </div>


            <p
                style="
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
                    margin-top:12px;
                    padding:11px 18px;
                    border:0;
                    border-radius:9px;
                    background:#111;
                    color:#fff;
                    font-weight:700;
                    cursor:pointer;
                "
            >
                TRY AGAIN
            </button>

        </div>

    `;

}


/* =========================================================
   DATE
========================================================= */

function getDate(
    value
) {

    if (!value) {

        return {
            day: "--",
            month: ""
        };

    }


    let date;


    try {

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

    } catch {

        return {
            day: "--",
            month: ""
        };

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


/* =========================================================
   HELPERS
========================================================= */

function clamp(
    value
) {

    return Math.max(
        0,
        Math.min(
            100,
            value
        )
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

/* ============================================================
   ZENOVA UNIVERSAL STUDENT HOME
============================================================ */

import {
    auth,
    db
} from "../firebase/firebase-config.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    limit
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* ============================================================
   STATE
============================================================ */

let currentUser = null;
let student = null;

let banners = [];
let courses = [];
let freeLearning = [];
let announcements = [];

let bannerTimer = null;


/* ============================================================
   ELEMENTS
============================================================ */

const loader =
    document.getElementById(
        "zenovaLoader"
    );

const app =
    document.getElementById(
        "zenovaApp"
    );


/* ============================================================
   AUTH
============================================================ */

onAuthStateChanged(
    auth,
    async (user) => {

        /*
         * Not logged in
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
             * Get student profile.
             */
            const studentRef =
                doc(
                    db,
                    "students",
                    user.uid
                );


            const studentSnapshot =
                await getDoc(
                    studentRef
                );


            /*
             * Student profile doesn't exist.
             */
            if (
                !studentSnapshot.exists()
            ) {

                window.location.replace(
                    "../account/onboarding/"
                );

                return;
            }


            student =
                studentSnapshot.data();


            /*
             * IMPORTANT:
             *
             * If onboarding isn't complete,
             * Home cannot be opened.
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
             * Load all universal content.
             */
            await Promise.all([

                loadBanners(),

                loadRecommendedCourses(),

                loadFreeLearning(),

                loadAnnouncements()

            ]);


            /*
             * Show page.
             */
            showApp();


        } catch (error) {

            console.error(
                "HOME INITIALIZATION ERROR:",
                error
            );

            showHomeError();

        }

    }
);


/* ============================================================
   STUDENT HEADER
============================================================ */

function renderStudent() {

    const name =
        student.name ||
        student.fullName ||
        currentUser.displayName ||
        "Student";


    document.getElementById(
        "studentName"
    ).textContent =
        name;


    document.getElementById(
        "profileInitial"
    ).textContent =
        name
            .trim()
            .charAt(0)
            .toUpperCase();


    /*
     * Academic information.
     */
    const academic = [];


    if (student.className) {

        academic.push(
            student.className
        );

    }


    if (student.board) {

        academic.push(
            student.board
        );

    }


    if (student.medium) {

        academic.push(
            student.medium
        );

    }


    if (student.combination) {

        academic.push(
            student.combination
        );

    }


    document.getElementById(
        "academicInfo"
    ).textContent =
        academic.length
            ? academic.join(" • ")
            : "Let's make today productive.";


    /*
     * Greeting.
     */
    const hour =
        new Date().getHours();


    let greeting =
        "Good morning";


    if (
        hour >= 12 &&
        hour < 17
    ) {

        greeting =
            "Good afternoon";

    }


    if (
        hour >= 17
    ) {

        greeting =
            "Good evening";

    }


    document.getElementById(
        "greetingText"
    ).textContent =
        greeting;


    /*
     * Motivation.
     */
    const motivations = [

        "Small steps, big results.",

        "Learn something new today.",

        "Your consistency creates results.",

        "One lesson closer to your goal.",

        "Keep learning. Keep growing."

    ];


    const random =
        Math.floor(
            Math.random() *
            motivations.length
        );


    document.getElementById(
        "motivationText"
    ).textContent =
        motivations[random];

}


/* ============================================================
   BANNERS
============================================================ */

async function loadBanners() {

    try {

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

                limit(20)
            );


        const snapshot =
            await getDocs(q);


        banners =
            snapshot.docs.map(
                item => ({
                    id: item.id,
                    ...item.data()
                })
            );


        banners.sort(
            (a, b) => {

                return Number(
                    a.order || 999
                )
                -
                Number(
                    b.order || 999
                );

            }
        );


        renderBanners();


    } catch (error) {

        console.warn(
            "Banners unavailable:",
            error
        );

        hideSection(
            "bannerSection"
        );

    }

}


/* ============================================================
   RENDER BANNERS
============================================================ */

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
        banners
            .map(
                (banner, index) => `

                    <div
                        class="banner-slide ${
                            index === 0
                                ? "active"
                                : ""
                        }"
                        data-link="${escapeAttr(
                            banner.link ||
                            banner.buttonLink ||
                            ""
                        )}"
                    >

                        <img
                            src="${escapeAttr(
                                banner.imageUrl ||
                                banner.image ||
                                ""
                            )}"
                            alt=""
                        >

                    </div>

                `
            )
            .join("");


    dots.innerHTML =
        banners
            .map(
                (_, index) => `

                    <button
                        class="banner-dot ${
                            index === 0
                                ? "active"
                                : ""
                        }"
                        data-index="${index}"
                        type="button"
                        aria-label="Banner ${
                            index + 1
                        }"
                    ></button>

                `
            )
            .join("");


    setupBannerSlider();

}


/* ============================================================
   BANNER SLIDER
============================================================ */

function setupBannerSlider() {

    const slides =
        document.querySelectorAll(
            ".banner-slide"
        );

    const dots =
        document.querySelectorAll(
            ".banner-dot"
        );


    if (
        slides.length <= 1
    ) {

        return;

    }


    let current =
        0;


    function showSlide(
        index
    ) {

        current =
            (index + slides.length)
            %
            slides.length;


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


    clearInterval(
        bannerTimer
    );


    bannerTimer =
        setInterval(
            () => {

                showSlide(
                    current + 1
                );

            },
            5000
        );

}


/* ============================================================
   RECOMMENDED COURSES / BATCHES
============================================================ */

async function loadRecommendedCourses() {

    try {

        /*
         * CRM course master.
         */
        const snapshot =
            await getDocs(
                collection(
                    db,
                    "crmCourses"
                )
            );


        const allCourses =
            snapshot.docs.map(
                item => ({
                    id: item.id,
                    ...item.data()
                })
            );


        /*
         * Only active courses.
         */
        const activeCourses =
            allCourses.filter(
                course =>
                    course.crmActive !== false
            );


        /*
         * Match according to onboarding.
         */
        courses =
            activeCourses
                .filter(
                    matchesStudent
                )
                .slice(0, 10);


        /*
         * If there aren't enough exact
         * matches, show active courses
         * rather than an empty Home.
         */
        if (
            courses.length < 3
        ) {

            const remaining =
                activeCourses.filter(
                    course =>
                        !courses.some(
                            selected =>
                                selected.id ===
                                course.id
                        )
                );


            courses =
                [
                    ...courses,
                    ...remaining
                ]
                .slice(0, 10);

        }


        renderRecommendedCourses();


    } catch (error) {

        console.warn(
            "Recommended courses unavailable:",
            error
        );

        renderRecommendedCourses();

    }

}


/* ============================================================
   MATCH COURSE TO STUDENT
============================================================ */

function matchesStudent(
    course
) {

    let score = 0;


    /*
     * Class.
     */
    if (
        student.className &&
        (
            course.crmClass ===
            student.className
            ||
            course.className ===
            student.className
        )
    ) {

        score += 4;

    }


    /*
     * Board.
     */
    if (
        student.board &&
        (
            course.crmBoard ===
            student.board
            ||
            course.board ===
            student.board
        )
    ) {

        score += 3;

    }


    /*
     * Medium.
     */
    if (
        student.medium &&
        (
            course.crmMedium ===
            student.medium
            ||
            course.medium ===
            student.medium
        )
    ) {

        score += 2;

    }


    /*
     * Combination.
     */
    if (
        student.combination &&
        (
            course.crmCombination ===
            student.combination
            ||
            course.combination ===
            student.combination
        )
    ) {

        score += 2;

    }


    /*
     * A course is considered relevant
     * if it matches at least the class.
     */
    return score > 0;

}


/* ============================================================
   RENDER RECOMMENDED
============================================================ */

function renderRecommendedCourses() {

    const list =
        document.getElementById(
            "recommendedList"
        );


    if (!courses.length) {

        list.innerHTML = `

            <div class="empty-state">

                New batches will appear here
                as they become available.

            </div>

        `;

        return;
    }


    list.innerHTML =
        courses
            .map(
                course => {

                    const image =
                        course.crmImageUrl ||
                        course.imageUrl ||
                        course.image ||
                        "";


                    const name =
                        course.crmCourseName ||
                        course.courseName ||
                        "Zenova Batch";


                    const description =
                        course.crmDescription ||
                        course.description ||
                        "";


                    const finalPrice =
                        course.crmFinalPrice ??
                        course.finalPrice ??
                        course.crmPrice ??
                        course.price;


                    const originalPrice =
                        course.crmPrice ??
                        course.price;


                    return `

                        <article
                            class="batch-card"
                            data-id="${escapeAttr(
                                course.id
                            )}"
                        >

                            ${
                                image
                                    ? `
                                        <img
                                            class="batch-image"
                                            src="${escapeAttr(
                                                image
                                            )}"
                                            alt=""
                                            loading="lazy"
                                        >
                                    `
                                    : `
                                        <div
                                            class="batch-image"
                                        ></div>
                                    `
                            }


                            <div
                                class="batch-content"
                            >

                                <span
                                    class="batch-tag"
                                >
                                    RECOMMENDED
                                </span>


                                <h3>
                                    ${escapeHtml(
                                        name
                                    )}
                                </h3>


                                <p
                                    class="batch-description"
                                >
                                    ${escapeHtml(
                                        description
                                    )}
                                </p>


                                <div
                                    class="batch-bottom"
                                >

                                    <div
                                        class="batch-price"
                                    >

                                        ${
                                            finalPrice !==
                                            undefined &&
                                            finalPrice !==
                                            null
                                                ? `
                                                    ₹${escapeHtml(
                                                        formatPrice(
                                                            finalPrice
                                                        )
                                                    )}
                                                `
                                                : ""
                                        }


                                        ${
                                            originalPrice &&
                                            String(
                                                originalPrice
                                            ) !==
                                            String(
                                                finalPrice
                                            )
                                                ? `
                                                    <del>
                                                        ₹${escapeHtml(
                                                            formatPrice(
                                                                originalPrice
                                                            )
                                                        )}
                                                    </del>
                                                `
                                                : ""
                                        }

                                    </div>


                                    <button
                                        type="button"
                                        class="batch-action"
                                    >

                                        <i
                                            class="ri-arrow-right-line"
                                        ></i>

                                    </button>

                                </div>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");


    list
        .querySelectorAll(
            ".batch-card"
        )
        .forEach(
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        const id =
                            card.dataset.id;


                        /*
                         * Batch/course details page.
                         *
                         * We keep the ID in the URL
                         * for the next page.
                         */
                        window.location.href =
                            `../batches/?course=${encodeURIComponent(
                                id
                            )}`;

                    }
                );

            }
        );

}


/* ============================================================
   FREE LEARNING
============================================================ */

async function loadFreeLearning() {

    try {

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


        freeLearning =
            snapshot.docs.map(
                item => ({
                    id: item.id,
                    ...item.data()
                })
            );


        renderFreeLearning();


    } catch (error) {

        console.warn(
            "Free learning unavailable:",
            error
        );

        renderFreeLearning();

    }

}


/* ============================================================
   RENDER FREE LEARNING
============================================================ */

function renderFreeLearning() {

    const list =
        document.getElementById(
            "freeLearningList"
        );


    if (!freeLearning.length) {

        list.innerHTML = `

            <div class="empty-state">

                Free learning content
                will appear here.

            </div>

        `;

        return;

    }


    list.innerHTML =
        freeLearning
            .slice(0, 8)
            .map(
                item => {

                    const image =
                        item.imageUrl ||
                        item.thumbnailUrl ||
                        item.image ||
                        "";


                    return `

                        <article
                            class="free-card"
                            data-link="${escapeAttr(
                                item.link ||
                                item.videoUrl ||
                                ""
                            )}"
                        >

                            <div
                                class="free-image-wrapper"
                            >

                                ${
                                    image
                                        ? `
                                            <img
                                                class="free-image"
                                                src="${escapeAttr(
                                                    image
                                                )}"
                                                alt=""
                                                loading="lazy"
                                            >
                                        `
                                        : ""
                                }


                                <div
                                    class="free-play"
                                >

                                    <i
                                        class="ri-play-fill"
                                    ></i>

                                </div>

                            </div>


                            <div
                                class="free-content"
                            >

                                <strong>
                                    ${escapeHtml(
                                        item.title ||
                                        "Free Learning"
                                    )}
                                </strong>


                                <p>
                                    ${escapeHtml(
                                        item.description ||
                                        item.subject ||
                                        "Learn with Zenova."
                                    )}
                                </p>

                            </div>

                        </article>

                    `;

                }
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

                        const link =
                            card.dataset.link;


                        if (link) {

                            window.location.href =
                                link;

                        }

                    }
                );

            }
        );

}


/* ============================================================
   ANNOUNCEMENTS
============================================================ */

async function loadAnnouncements() {

    try {

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


        announcements =
            snapshot.docs.map(
                item => ({
                    id: item.id,
                    ...item.data()
                })
            );


        renderAnnouncements();


    } catch (error) {

        console.warn(
            "Announcements unavailable:",
            error
        );

        renderAnnouncements();

    }

}


/* ============================================================
   RENDER ANNOUNCEMENTS
============================================================ */

function renderAnnouncements() {

    const section =
        document.getElementById(
            "announcementSection"
        );

    const list =
        document.getElementById(
            "announcementList"
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


    list.innerHTML =
        announcements
            .slice(0, 4)
            .map(
                item => {

                    const date =
                        getDateInfo(
                            item.date ||
                            item.createdAt
                        );


                    return `

                        <article
                            class="announcement"
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
                                class="announcement-body"
                            >

                                <strong>
                                    ${escapeHtml(
                                        item.title ||
                                        "Announcement"
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


                            <i
                                class="ri-arrow-right-line announcement-arrow"
                            ></i>

                        </article>

                    `;

                }
            )
            .join("");


    list
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


/* ============================================================
   NAVIGATION
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

                    const route =
                        element.dataset.route;


                    if (route) {

                        window.location.href =
                            route;

                    }

                }
            );

        }
    );


/* ============================================================
   HEADER BUTTONS
============================================================ */

document
    .getElementById(
        "notificationBtn"
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
        "profileBtn"
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
        "aiBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            window.location.href =
                "../ai/";

        }
    );


/* ============================================================
   SHOW APP
============================================================ */

function showApp() {

    app.classList.remove(
        "hidden"
    );


    setTimeout(
        () => {

            loader.classList.add(
                "hide"
            );

        },
        100
    );

}


/* ============================================================
   ERROR
============================================================ */

function showHomeError() {

    loader.innerHTML = `

        <div
            style="
                text-align:center;
                padding:30px;
            "
        >

            <div
                style="
                    width:55px;
                    height:55px;
                    margin:0 auto 18px;
                    border-radius:50%;
                    background:#111;
                    color:#fff;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-weight:800;
                "
            >
                Z
            </div>


            <strong>
                Something went wrong
            </strong>


            <p
                style="
                    color:#777;
                    font-size:12px;
                "
            >
                Please try again.
            </p>


            <button
                onclick="location.reload()"
                style="
                    padding:11px 18px;
                    border:0;
                    border-radius:9px;
                    background:#111;
                    color:#fff;
                    font-weight:700;
                "
            >
                TRY AGAIN
            </button>

        </div>

    `;

}


/* ============================================================
   HELPERS
============================================================ */

function hideSection(
    id
) {

    document
        .getElementById(id)
        ?.classList.add(
            "hidden"
        );

}


function formatPrice(
    value
) {

    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return value;

    }


    return number.toLocaleString(
        "en-IN"
    );

}


function getDateInfo(
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

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


/* =====================================================
   ELEMENTS
===================================================== */

const loader =
    document.getElementById(
        "zenovaLoader"
    );


const app =
    document.getElementById(
        "zenovaApp"
    );


const errorScreen =
    document.getElementById(
        "errorScreen"
    );


const errorMessage =
    document.getElementById(
        "errorMessage"
    );


/* =====================================================
   STATE
===================================================== */

let currentUser = null;

let student = null;

let studentCourses = [];

let selectedCourse = null;

let subjects = [];

let chapters = [];

let contents = [];

let enrollments = [];


/* =====================================================
   AUTH
===================================================== */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.replace(
                "../account/login/"
            );

            return;

        }


        currentUser =
            user;


        try {

            await loadStudent();

            await loadCourses();

            await loadCourseStructure();

            await loadBanners();

            await loadLiveClasses();

            await loadContinueLearning();

            renderStudent();

            setupNavigation();

            showApp();

        }

        catch (error) {

            console.error(
                "ZENOVA HOME ERROR:",
                error
            );


            showError(
                error.message ||
                "Unable to load Home."
            );

        }

    }
);


/* =====================================================
   LOAD STUDENT
===================================================== */

async function loadStudent() {

    /*
     * ACTUAL ZEN2 STUDENT COLLECTION
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


    if (
        !snapshot.exists()
    ) {

        window.location.replace(
            "../account/onboarding/"
        );

        return;

    }


    student =
        snapshot.data();


    /*
     * ACTUAL FIELD:
     *
     * onboardingComplete
     */

    if (
        student.onboardingComplete !== true
    ) {

        window.location.replace(
            "../account/onboarding/"
        );

        return;

    }


    console.log(
        "ZEN2 STUDENT:",
        student
    );

}


/* =====================================================
   RENDER STUDENT
===================================================== */

function renderStudent() {

    const name =
        student.name ||
        currentUser.displayName ||
        "Student";


    const nameElement =
        document.getElementById(
            "studentName"
        );


    if (
        nameElement
    ) {

        nameElement.textContent =
            name;

    }


    const initial =
        document.getElementById(
            "profileInitial"
        );


    if (
        initial
    ) {

        initial.textContent =
            name
                .trim()
                .charAt(0)
                .toUpperCase();

    }


    const hour =
        new Date().getHours();


    const greeting =
        document.getElementById(
            "greeting"
        );


    if (
        greeting
    ) {

        if (
            hour < 12
        ) {

            greeting.textContent =
                "Good Morning,";

        }

        else if (
            hour < 17
        ) {

            greeting.textContent =
                "Good Afternoon,";

        }

        else {

            greeting.textContent =
                "Good Evening,";

        }

    }

}


/* =====================================================
   GET STUDENT CLASS
===================================================== */

function getStudentClass() {

    return normalizeClass(
        student.className
    );

}


/* =====================================================
   NORMALIZE CLASS
===================================================== */

function normalizeClass(
    value
) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }


    return String(
        value
    )
        .trim()
        .toUpperCase()
        .replace(
            /\s+/g,
            " "
        );

}


/* =====================================================
   LOAD COURSES
===================================================== */

async function loadCourses() {

    const studentClass =
        getStudentClass();


    if (
        !studentClass
    ) {

        throw new Error(
            "Student class is not available."
        );

    }


    /*
     * ACTUAL ZEN2 COURSE COLLECTION
     */

    const snapshot =
        await getDocs(
            collection(
                db,
                "zen2Courses"
            )
        );


    const allCourses =
        snapshot.docs.map(
            item => ({

                id:
                    item.id,

                ...item.data()

            })
        );


    /*
     * Match the student's class.
     *
     * Example:
     *
     * student = 10th
     *
     * course.className = 10th
     */

    studentCourses =
        allCourses.filter(
            course => {

                const courseClass =
                    normalizeClass(
                        course.className
                    );


                const active =
                    course.active !== false &&
                    course.status !== "INACTIVE";


                return (
                    courseClass ===
                    studentClass
                ) && active;

            }
        );


    /*
     * Sort courses.
     */

    studentCourses.sort(
        (
            a,
            b
        ) => {

            const orderA =
                Number(
                    a.order ??
                    a.priority ??
                    9999
                );


            const orderB =
                Number(
                    b.order ??
                    b.priority ??
                    9999
                );


            return (
                orderA -
                orderB
            );

        }
    );


    console.log(
        "STUDENT CLASS:",
        studentClass
    );


    console.log(
        "MATCHING ZEN2 COURSES:",
        studentCourses
    );


    if (
        !studentCourses.length
    ) {

        throw new Error(
            `No ZEN2 course found for ${student.classDisplayName || student.className}.`
        );

    }


    /*
     * First course is the primary
     * course used for learning content.
     */

    selectedCourse =
        studentCourses[0];


    renderCourses();

}


/* =====================================================
   COURSE NAME
===================================================== */

function getCourseName(
    course
) {

    return (
        course.courseName ||
        "Zenova Course"
    );

}


/* =====================================================
   RENDER COURSES
===================================================== */

function renderCourses() {

    const container =
        document.getElementById(
            "myBatchesList"
        );


    if (
        !container
    ) {

        return;

    }


    if (
        !studentCourses.length
    ) {

        container.innerHTML = `

            <div class="loading-card">
                No course available.
            </div>

        `;

        return;

    }


    container.innerHTML =
        studentCourses
            .map(
                course => {

                    const name =
                        getCourseName(
                            course
                        );


                    const className =
                        course.classDisplayName ||
                        course.className ||
                        "";


                    const year =
                        course.academicYear ||
                        "";


                    const board =
                        course.board ||
                        "";


                    return `

                        <article
                            class="batch-card"
                        >

                            <div
                                class="batch-cover"
                            >

                                <span
                                    class="batch-cover-label"
                                >
                                    ZENOVA ZEN2
                                </span>


                                <h3>
                                    ${escapeHtml(
                                        name
                                    )}
                                </h3>

                            </div>


                            <div
                                class="batch-info"
                            >

                                <div
                                    class="batch-name"
                                >
                                    ${escapeHtml(
                                        name
                                    )}
                                </div>


                                <div
                                    class="batch-meta"
                                >

                                    ${
                                        className
                                            ? `
                                                <span>
                                                    ${escapeHtml(
                                                        className
                                                    )}
                                                </span>
                                            `
                                            : ""
                                    }


                                    ${
                                        board
                                            ? `
                                                <span>
                                                    ${escapeHtml(
                                                        board
                                                    )}
                                                </span>
                                            `
                                            : ""
                                    }


                                    ${
                                        year
                                            ? `
                                                <span>
                                                    ${escapeHtml(
                                                        year
                                                    )}
                                                </span>
                                            `
                                            : ""
                                    }

                                </div>


                                <div
                                    class="batch-actions"
                                >

                                    <button
                                        class="batch-button explore-button"
                                        data-explore-id="${escapeHtml(
                                            course.id
                                        )}"
                                        type="button"
                                    >
                                        EXPLORE BATCH
                                    </button>


                                    <button
                                        class="batch-button buy-button"
                                        data-buy-id="${escapeHtml(
                                            course.id
                                        )}"
                                        type="button"
                                    >
                                        BUY NOW
                                    </button>

                                </div>

                            </div>

                        </article>

                    `;

                }
            )
            .join("");


    document
        .querySelectorAll(
            "[data-explore-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const courseId =
                            button.dataset.exploreId;


                        window.location.href =
                            `./batchdetails/?courseId=${
                                encodeURIComponent(
                                    courseId
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

                        const courseId =
                            button.dataset.buyId;


                        window.location.href =
                            `./batchdetails/?courseId=${
                                encodeURIComponent(
                                    courseId
                                )
                            }&buy=true`;

                    }
                );

            }
        );

}


/* =====================================================
   LOAD COURSE STRUCTURE
===================================================== */

async function loadCourseStructure() {

    if (
        !selectedCourse
    ) {

        return;

    }


    /*
     * SUBJECTS
     */

    const subjectQuery =
        query(
            collection(
                db,
                "zen2Subjects"
            ),

            where(
                "courseId",
                "==",
                selectedCourse.id
            )
        );


    const subjectSnapshot =
        await getDocs(
            subjectQuery
        );


    subjects =
        subjectSnapshot.docs.map(
            item => ({

                id:
                    item.id,

                ...item.data()

            })
        );


    subjects.sort(
        sortByOrder
    );


    /*
     * CHAPTERS
     */

    chapters = [];


    for (
        const subject
        of subjects
    ) {

        const chapterQuery =
            query(
                collection(
                    db,
                    "zen2Chapters"
                ),

                where(
                    "courseId",
                    "==",
                    selectedCourse.id
                ),

                where(
                    "subjectId",
                    "==",
                    subject.id
                )
            );


        const chapterSnapshot =
            await getDocs(
                chapterQuery
            );


        chapterSnapshot.docs.forEach(
            item => {

                chapters.push({

                    id:
                        item.id,

                    ...item.data()

                });

            }
        );

    }


    chapters.sort(
        sortByOrder
    );


    /*
     * CONTENT
     */

    contents = [];


    for (
        const chapter
        of chapters
    ) {

        const contentQuery =
            query(
                collection(
                    db,
                    "zen2Content"
                ),

                where(
                    "courseId",
                    "==",
                    selectedCourse.id
                ),

                where(
                    "chapterId",
                    "==",
                    chapter.id
                )
            );


        const contentSnapshot =
            await getDocs(
                contentQuery
            );


        contentSnapshot.docs.forEach(
            item => {

                contents.push({

                    id:
                        item.id,

                    ...item.data()

                });

            }
        );

    }


    contents.sort(
        sortByOrder
    );


    console.log(
        "ZEN2 SUBJECTS:",
        subjects
    );


    console.log(
        "ZEN2 CHAPTERS:",
        chapters
    );


    console.log(
        "ZEN2 CONTENT:",
        contents
    );

}


/* =====================================================
   BANNERS
===================================================== */

async function loadBanners() {

    const container =
        document.getElementById(
            "heroSlider"
        );


    const dots =
        document.getElementById(
            "heroDots"
        );


    const section =
        document.getElementById(
            "heroSection"
        );


    try {

        const bannerQuery =
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
            await getDocs(
                bannerQuery
            );


        const banners =
            snapshot.docs.map(
                item => ({

                    id:
                        item.id,

                    ...item.data()

                })
            );


        banners.sort(
            (
                a,
                b
            ) => {

                return (
                    Number(
                        a.priority ??
                        9999
                    ) -
                    Number(
                        b.priority ??
                        9999
                    )
                );

            }
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


        container.innerHTML =
            banners
                .map(
                    (
                        banner,
                        index
                    ) => {

                        return `

                            <div
                                class="hero-slide ${
                                    index === 0
                                        ? "active"
                                        : ""
                                }"
                                data-link="${escapeHtml(
                                    banner.link || ""
                                )}"
                            >

                                <img
                                    src="${escapeHtml(
                                        banner.imageUrl || ""
                                    )}"
                                    alt=""
                                >


                                ${
                                    banner.title ||
                                    banner.description ||
                                    banner.buttonText

                                        ? `

                                            <div
                                                class="hero-overlay"
                                            >

                                                ${
                                                    banner.label
                                                        ? `
                                                            <span
                                                                class="hero-label"
                                                            >
                                                                ${escapeHtml(
                                                                    banner.label
                                                                )}
                                                            </span>
                                                        `
                                                        : ""
                                                }


                                                ${
                                                    banner.title
                                                        ? `
                                                            <h2>
                                                                ${escapeHtml(
                                                                    banner.title
                                                                )}
                                                            </h2>
                                                        `
                                                        : ""
                                                }


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


                                                ${
                                                    banner.buttonText
                                                        ? `
                                                            <span
                                                                class="hero-button"
                                                            >
                                                                ${escapeHtml(
                                                                    banner.buttonText
                                                                )}
                                                            </span>
                                                        `
                                                        : ""
                                                }

                                            </div>

                                        `

                                        : ""
                                }

                            </div>

                        `;

                    }
                )
                .join("");


        dots.innerHTML =
            banners
                .map(
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
                            type="button"
                        ></button>

                    `
                )
                .join("");


        setupBannerSlider(
            banners.length
        );


        container
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


                            if (
                                link
                            ) {

                                window.location.href =
                                    link;

                            }

                        }
                    );

                }
            );

    }

    catch (
        error
    ) {

        console.warn(
            "Banner loading failed:",
            error
        );


        section.classList.add(
            "hidden"
        );

    }

}


/* =====================================================
   BANNER SLIDER
===================================================== */

function setupBannerSlider(
    total
) {

    if (
        total <= 1
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


    function show(
        index
    ) {

        slides.forEach(
            slide =>
                slide.classList.remove(
                    "active"
                )
        );


        dots.forEach(
            dot =>
                dot.classList.remove(
                    "active"
                )
        );


        slides[index]
            ?.classList.add(
                "active"
            );


        dots[index]
            ?.classList.add(
                "active"
            );

    }


    setInterval(
        () => {

            current =
                (
                    current + 1
                ) %
                total;


            show(
                current
            );

        },
        5000
    );


    dots.forEach(
        dot => {

            dot.addEventListener(
                "click",
                event => {

                    event.stopPropagation();


                    current =
                        Number(
                            dot.dataset.index
                        );


                    show(
                        current
                    );

                }
            );

        }
    );

}


/* =====================================================
   LIVE CLASSES
===================================================== */

async function loadLiveClasses() {

    const container =
        document.getElementById(
            "liveList"
        );


    try {

        const liveQuery =
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

                limit(50)
            );


        const snapshot =
            await getDocs(
                liveQuery
            );


        const classes =
            snapshot.docs.map(
                item => ({

                    id:
                        item.id,

                    ...item.data()

                })
            );


        /*
         * IMPORTANT:
         *
         * CRM saves:
         *
         * scheduledDate = YYYY-MM-DD
         * scheduledTime = HH:MM
         */

        const today =
            getTodayString();


        const todayClasses =
            classes
                .filter(
                    item =>
                        item.scheduledDate ===
                        today
                )
                .sort(
                    (
                        a,
                        b
                    ) => {

                        return String(
                            a.scheduledTime ||
                            ""
                        ).localeCompare(
                            String(
                                b.scheduledTime ||
                                ""
                            )
                        );

                    }
                );


        renderLiveClasses(
            todayClasses
        );

    }

    catch (
        error
    ) {

        console.warn(
            "Live class loading failed:",
            error
        );


        container.innerHTML = `

            <div class="loading-card">
                Unable to load today's classes.
            </div>

        `;

    }

}


/* =====================================================
   RENDER LIVE CLASSES
===================================================== */

function renderLiveClasses(
    classes
) {

    const container =
        document.getElementById(
            "liveList"
        );


    if (
        !classes.length
    ) {

        container.innerHTML = `

            <div class="loading-card">

                No live class scheduled for today.

            </div>

        `;

        return;

    }


    const now =
        new Date();


    container.innerHTML =
        classes
            .map(
                liveClass => {

                    const start =
                        parseLiveDate(
                            liveClass
                        );


                    const isStarted =
                        start &&
                        now >= start;


                    const thumbnail =
                        liveClass.thumbnailUrl ||
                        "";


                    const topic =
                        liveClass.chapterName ||
                        liveClass.subjectName ||
                        liveClass.title ||
                        "Live Class";


                    return `

                        <article
                            class="live-card"
                        >

                            <div
                                class="live-thumbnail"
                            >

                                ${
                                    thumbnail

                                        ? `

                                            <img
                                                src="${escapeHtml(
                                                    thumbnail
                                                )}"
                                                alt=""
                                            >

                                        `

                                        : `

                                            <div
                                                class="live-placeholder"
                                            >
                                                LIVE CLASS
                                            </div>

                                        `
                                }

                            </div>


                            <div
                                class="live-info"
                            >

                                <span
                                    class="live-status ${
                                        isStarted
                                            ? "now"
                                            : ""
                                    }"
                                >

                                    ${
                                        isStarted
                                            ? "TODAY"
                                            : "UPCOMING"
                                    }

                                </span>


                                <h3>
                                    ${escapeHtml(
                                        liveClass.title ||
                                        topic
                                    )}
                                </h3>


                                <p>

                                    ${
                                        liveClass.teacherName
                                            ? escapeHtml(
                                                liveClass.teacherName
                                            )
                                            : ""
                                    }

                                    ${
                                        liveClass.subjectName
                                            ? ` • ${escapeHtml(
                                                liveClass.subjectName
                                            )}`
                                            : ""
                                    }

                                </p>


                                ${
                                    liveClass.chapterName

                                        ? `

                                            <p>
                                                ${escapeHtml(
                                                    liveClass.chapterName
                                                )}
                                            </p>

                                        `

                                        : ""
                                }


                                <div
                                    class="live-time"
                                >

                                    ${
                                        formatTime(
                                            liveClass.scheduledTime
                                        )
                                    }

                                </div>

                            </div>


                            <button
                                class="live-open"
                                data-live-id="${escapeHtml(
                                    liveClass.id
                                )}"
                                type="button"
                            >

                                VIEW

                            </button>

                        </article>

                    `;

                }
            )
            .join("");


    document
        .querySelectorAll(
            "[data-live-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        window.location.href =
                            "../live/";

                    }
                );

            }
        );

}


/* =====================================================
   CONTINUE LEARNING
===================================================== */

async function loadContinueLearning() {

    const container =
        document.getElementById(
            "continueCard"
        );


    if (
        !contents.length
    ) {

        container.innerHTML = `

            <div class="loading-card">
                No learning content available yet.
            </div>

        `;

        return;

    }


    let lastWatched =
        null;


    try {

        const saved =
            localStorage.getItem(
                "zen2LastWatched"
            );


        if (
            saved
        ) {

            lastWatched =
                JSON.parse(
                    saved
                );

            }

        }

    }

    catch (
        error
    ) {

        console.warn(
            error
        );

    }


    let selectedContent =
        null;


    /*
     * First priority:
     * previously watched content.
     */

    if (
        lastWatched?.contentId
    ) {

        selectedContent =
            contents.find(
                content =>
                    content.id ===
                    lastWatched.contentId
            );

    }


    /*
     * If nothing was watched,
     * use the first ordered video.
     */

    if (
        !selectedContent
    ) {

        selectedContent =
            contents.find(
                content =>
                    String(
                        content.contentType ||
                        ""
                    )
                    .toUpperCase() ===
                    "VIDEO"
            );

    }


    /*
     * If still nothing,
     * use first content.
     */

    if (
        !selectedContent
    ) {

        selectedContent =
            contents[0];

    }


    if (
        !selectedContent
    ) {

        container.innerHTML = `

            <div class="loading-card">
                No learning content available yet.
            </div>

        `;

        return;

    }


    const title =
        selectedContent.title ||
        "Learning Content";


    const thumbnail =
        selectedContent.thumbnailUrl ||
        "";


    const subject =
        findSubjectName(
            selectedContent.subjectId
        );


    const chapter =
        findChapterName(
            selectedContent.chapterId
        );


    const isVideo =
        String(
            selectedContent.contentType ||
            ""
        )
        .toUpperCase() ===
        "VIDEO";


    container.innerHTML = `

        <div
            class="continue-thumbnail"
        >

            ${
                thumbnail

                    ? `

                        <img
                            src="${escapeHtml(
                                thumbnail
                            )}"
                            alt=""
                        >

                    `

                    : `

                        <div
                            class="continue-placeholder"
                        >
                            ZENOVA
                        </div>

                    `
            }

        </div>


        <div
            class="continue-info"
        >

            <span
                class="continue-label"
            >

                ${
                    lastWatched?.contentId
                        ? "CONTINUE LEARNING"
                        : "START LEARNING"
                }

            </span>


            <h3>
                ${escapeHtml(
                    title
                )}
            </h3>


            <p>

                ${escapeHtml(
                    subject
                )}

                ${
                    chapter
                        ? ` • ${escapeHtml(
                            chapter
                        )}`
                        : ""
                }

            </p>

        </div>


        <button
            class="continue-button"
            id="continueLearningButton"
            type="button"
        >

            ${
                lastWatched?.contentId
                    ? "CONTINUE"
                    : (
                        isVideo
                            ? "START"
                            : "OPEN"
                    )
            }

        </button>

    `;


    document
        .getElementById(
            "continueLearningButton"
        )
        ?.addEventListener(
            "click",
            () => {

                openContent(
                    selectedContent
                );

            }
        );

}


/* =====================================================
   OPEN CONTENT
===================================================== */

function openContent(
    content
) {

    const chapterId =
        content.chapterId;


    const subjectId =
        content.subjectId;


    if (
        !chapterId
    ) {

        return;

    }


    window.location.href =
        `./chapters/?chapterId=${
            encodeURIComponent(
                chapterId
            )
        }&subjectId=${
            encodeURIComponent(
                subjectId || ""
            )
        }&courseId=${
            encodeURIComponent(
                selectedCourse.id
            )
        }&contentId=${
            encodeURIComponent(
                content.id
            )
        }`;

}


/* =====================================================
   SUBJECT NAME
===================================================== */

function findSubjectName(
    subjectId
) {

    const subject =
        subjects.find(
            item =>
                item.id ===
                subjectId
        );


    return (
        subject?.subjectName ||
        subject?.displayName ||
        "Subject"
    );

}


/* =====================================================
   CHAPTER NAME
===================================================== */

function findChapterName(
    chapterId
) {

    const chapter =
        chapters.find(
            item =>
                item.id ===
                chapterId
        );


    return (
        chapter?.chapterName ||
        "Chapter"
    );

}


/* =====================================================
   NAVIGATION
===================================================== */

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

                        const route =
                            element.dataset.route;


                        if (
                            route ===
                            "revision"
                        ) {

                            window.location.href =
                                "./revision/";

                            return;

                        }


                        if (
                            route ===
                            "live"
                        ) {

                            window.location.href =
                                "../live/";

                            return;

                        }


                        if (
                            route ===
                            "tests"
                        ) {

                            /*
                             * Keep this route
                             * ready for the Tests
                             * page.
                             */

                            window.location.href =
                                "./tests/";

                            return;

                        }


                        if (
                            route ===
                            "doubts"
                        ) {

                            window.location.href =
                                "./doubts/";

                            return;

                        }

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

                window.location.href =
                    "./profile/";

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
                    "./ai/";

            }
        );

}


/* =====================================================
   DATE
===================================================== */

function getTodayString() {

    const date =
        new Date();


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        )
        .padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        )
        .padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


/* =====================================================
   LIVE DATE
===================================================== */

function parseLiveDate(
    liveClass
) {

    if (
        !liveClass.scheduledDate
    ) {

        return null;

    }


    const time =
        liveClass.scheduledTime ||
        "00:00";


    const date =
        new Date(
            `${liveClass.scheduledDate}T${time}:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return date;

}


/* =====================================================
   FORMAT TIME
===================================================== */

function formatTime(
    time
) {

    if (
        !time
    ) {

        return "";

    }


    const parts =
        String(
            time
        )
        .split(":");


    if (
        parts.length < 2
    ) {

        return time;

    }


    let hour =
        Number(
            parts[0]
        );


    const minute =
        parts[1];


    const suffix =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 ||
        12;


    return `${hour}:${minute} ${suffix}`;

}


/* =====================================================
   SORT
===================================================== */

function sortByOrder(
    a,
    b
) {

    return (
        Number(
            a.order ??
            a.chapterNumber ??
            a.position ??
            9999
        ) -
        Number(
            b.order ??
            b.chapterNumber ??
            b.position ??
            9999
        )
    );

}


/* =====================================================
   SHOW APP
===================================================== */

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


/* =====================================================
   ERROR
===================================================== */

function showError(
    message
) {

    console.error(
        message
    );


    if (
        errorMessage
    ) {

        errorMessage.textContent =
            message;

    }


    loader?.classList.add(
        "fade-out"
    );


    errorScreen?.classList.remove(
        "hidden"
    );


    document
        .getElementById(
            "retryButton"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.reload();

            }
        );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

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

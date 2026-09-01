import {
    auth,
    db
} from "../../firebase/firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* ============================================================
   STATE
============================================================ */

let currentUser = null;

let student = null;

let allBatches = [];

let recommendedBatches = [];

let activeFilter = "all";

let searchTerm = "";


/* ============================================================
   ELEMENTS
============================================================ */

const loader =
    document.getElementById("pageLoader");

const app =
    document.getElementById("batchesApp");

const batchGrid =
    document.getElementById("batchGrid");

const recommendedGrid =
    document.getElementById("recommendedGrid");

const recommendedSection =
    document.getElementById("recommendedSection");

const allBatchesSection =
    document.getElementById("allBatchesSection");

const emptyState =
    document.getElementById("emptyState");

const noResults =
    document.getElementById("noResults");

const batchCount =
    document.getElementById("batchCount");

const studentContext =
    document.getElementById("studentContext");

const searchArea =
    document.getElementById("searchArea");

const searchInput =
    document.getElementById("searchInput");

const clearSearch =
    document.getElementById("clearSearch");


/* ============================================================
   START
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    startApp
);


async function startApp() {

    setupStaticEvents();

}


/* ============================================================
   FIREBASE AUTH
============================================================ */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.replace(
                "../../login/"
            );

            return;

        }


        currentUser =
            user;


        try {

            await loadStudent();

            await loadBatches();

            render();

            showApp();

        } catch (error) {

            console.error(
                "ZENOVA BATCHES ERROR:",
                error
            );

            showLoadingError(
                error
            );

        }

    }
);


/* ============================================================
   LOAD STUDENT
============================================================ */

async function loadStudent() {

    const studentRef =
        doc(
            db,
            "students",
            currentUser.uid
        );


    const snapshot =
        await getDoc(
            studentRef
        );


    if (!snapshot.exists()) {

        window.location.replace(
            "../../onboarding/"
        );

        return;

    }


    student =
        snapshot.data();


    if (
        student.onboardingComplete !==
        true
    ) {

        window.location.replace(
            "../../onboarding/"
        );

        return;

    }


    updateStudentContext();

}


/* ============================================================
   STUDENT CONTEXT
============================================================ */

function updateStudentContext() {

    const parts = [];


    if (
        student.className
    ) {

        parts.push(
            student.className
        );

    }


    if (
        student.board
    ) {

        parts.push(
            student.board
        );

    }


    if (
        student.combination
    ) {

        parts.push(
            student.combination
        );

    }


    if (
        parts.length
    ) {

        studentContext.textContent =
            `Showing programs relevant to ${parts.join(" • ")}.`;

    } else {

        studentContext.textContent =
            "Explore available Zenova programs.";

    }

}


/* ============================================================
   LOAD BATCHES
============================================================ */

/*
    IMPORTANT:

    We intentionally load the batches collection
    without a Firestore "where" query for now.

    This makes the first Firebase connection easier
    to test.

    Student-side rendering still hides inactive batches.
*/

async function loadBatches() {

    const batchesRef =
        collection(
            db,
            "batches"
        );


    const snapshot =
        await getDocs(
            batchesRef
        );


    allBatches =
        snapshot.docs
            .map(
                documentSnapshot => ({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                })
            )
            .filter(
                batch =>
                    batch.active === true
            );


    /*
        Highest priority first.
    */

    allBatches.sort(
        (a, b) => {

            const priorityA =
                Number(
                    a.priority || 0
                );

            const priorityB =
                Number(
                    b.priority || 0
                );


            return (
                priorityB -
                priorityA
            );

        }
    );


    recommendedBatches =
        getRecommendedBatches();

}


/* ============================================================
   RECOMMENDATION ENGINE
============================================================ */

function getRecommendedBatches() {

    if (!student) {

        return [];

    }


    const scoredBatches =
        allBatches.map(
            batch => {

                let score = 0;


                const targetClasses =
                    normaliseArray(
                        batch.targetClasses
                    );


                const targetBoards =
                    normaliseArray(
                        batch.targetBoards
                    );


                /*
                    Support both:

                    targetBoards

                    and old:

                    board
                */

                if (
                    batch.board
                ) {

                    targetBoards.push(
                        String(
                            batch.board
                        )
                            .trim()
                            .toLowerCase()
                    );

                }


                const targetCombinations =
                    normaliseArray(
                        batch.targetCombinations
                    );


                const targetExams =
                    normaliseArray(
                        batch.targetExams
                    );


                const studentClass =
                    normaliseValue(
                        student.className
                    );


                const studentBoard =
                    normaliseValue(
                        student.board
                    );


                const studentCombination =
                    normaliseValue(
                        student.combination
                    );


                /*
                    EXACT CLASS MATCH
                    Strongest recommendation.
                */

                if (
                    studentClass &&
                    targetClasses.includes(
                        studentClass
                    )
                ) {

                    score += 1000;

                }


                /*
                    BOARD MATCH
                */

                if (
                    studentBoard &&
                    targetBoards.includes(
                        studentBoard
                    )
                ) {

                    score += 300;

                }


                /*
                    COMBINATION MATCH
                */

                if (
                    studentCombination &&
                    targetCombinations.includes(
                        studentCombination
                    )
                ) {

                    score += 300;

                }


                /*
                    TARGET EXAMS
                */

                const studentExams =
                    normaliseArray(
                        student.targetExams
                    );


                studentExams.forEach(
                    exam => {

                        if (
                            targetExams.includes(
                                exam
                            )
                        ) {

                            score += 200;

                        }

                    }
                );


                /*
                    ADMIN PRIORITY
                */

                score +=
                    Number(
                        batch.priority || 0
                    );


                return {

                    batch,
                    score

                };

            }
        );


    scoredBatches.sort(
        (a, b) =>
            b.score - a.score
    );


    /*
        Only genuinely relevant
        batches become recommendations.
    */

    return scoredBatches
        .filter(
            item =>
                item.score >= 1000
        )
        .slice(
            0,
            6
        )
        .map(
            item =>
                item.batch
        );

}


/* ============================================================
   STATIC EVENTS
============================================================ */

function setupStaticEvents() {


    /*
        Search button
    */

    const searchButton =
        document.getElementById(
            "searchButton"
        );


    if (
        searchButton
    ) {

        searchButton.addEventListener(
            "click",
            () => {

                searchArea.classList.toggle(
                    "hidden"
                );


                if (
                    !searchArea.classList.contains(
                        "hidden"
                    )
                ) {

                    searchInput.focus();

                }

            }
        );

    }


    /*
        Search input
    */

    if (
        searchInput
    ) {

        searchInput.addEventListener(
            "input",
            event => {

                searchTerm =
                    event.target.value
                        .trim()
                        .toLowerCase();


                if (
                    clearSearch
                ) {

                    clearSearch.classList.toggle(
                        "hidden",
                        !searchTerm
                    );

                }


                render();

            }
        );

    }


    /*
        Clear search
    */

    if (
        clearSearch
    ) {

        clearSearch.addEventListener(
            "click",
            () => {

                searchInput.value =
                    "";

                searchTerm =
                    "";

                clearSearch.classList.add(
                    "hidden"
                );

                render();

                searchInput.focus();

            }
        );

    }


    /*
        Back button
    */

    const backButton =
        document.getElementById(
            "backButton"
        );


    if (
        backButton
    ) {

        backButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "../";

            }
        );

    }


    /*
        Filter buttons
    */

    document
        .querySelectorAll(
            ".filter-chip"
        )
        .forEach(
            chip => {

                chip.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".filter-chip"
                            )
                            .forEach(
                                item =>
                                    item.classList.remove(
                                        "active"
                                    )
                            );


                        chip.classList.add(
                            "active"
                        );


                        activeFilter =
                            chip.dataset.filter;


                        render();

                    }
                );

            }
        );


    /*
        Bottom navigation
    */

    document
        .querySelectorAll(
            "[data-route]"
        )
        .forEach(
            item => {

                item.addEventListener(
                    "click",
                    () => {

                        navigate(
                            item.dataset.route
                        );

                    }
                );

            }
        );

}


/* ============================================================
   RENDER EVERYTHING
============================================================ */

function render() {

    /*
        No batches at all.
    */

    if (
        allBatches.length === 0
    ) {

        recommendedSection.classList.add(
            "hidden"
        );


        allBatchesSection.classList.add(
            "hidden"
        );


        noResults.classList.add(
            "hidden"
        );


        emptyState.classList.remove(
            "hidden"
        );


        return;

    }


    emptyState.classList.add(
        "hidden"
    );


    /*
        Recommended
    */

    const filteredRecommended =
        filterBatches(
            recommendedBatches
        );


    if (
        filteredRecommended.length > 0
    ) {

        recommendedSection.classList.remove(
            "hidden"
        );


        renderBatchCards(
            filteredRecommended,
            recommendedGrid
        );

    } else {

        recommendedSection.classList.add(
            "hidden"
        );


        recommendedGrid.innerHTML =
            "";

    }


    /*
        All batches.

        IMPORTANT:

        Remove recommended IDs so that
        one batch does not appear twice.
    */

    const recommendedIds =
        new Set(
            recommendedBatches.map(
                batch =>
                    batch.id
            )
        );


    const remainingBatches =
        allBatches.filter(
            batch =>
                !recommendedIds.has(
                    batch.id
                )
        );


    const filteredAll =
        filterBatches(
            remainingBatches
        );


    if (
        filteredAll.length > 0
    ) {

        allBatchesSection.classList.remove(
            "hidden"
        );


        noResults.classList.add(
            "hidden"
        );


        batchCount.textContent =
            `${filteredAll.length} ${
                filteredAll.length === 1
                    ? "program"
                    : "programs"
            }`;


        renderBatchCards(
            filteredAll,
            batchGrid
        );

    } else {

        allBatchesSection.classList.add(
            "hidden"
        );


        /*
            If recommendations exist,
            don't show "no results".
        */

        if (
            filteredRecommended.length === 0
        ) {

            noResults.classList.remove(
                "hidden"
            );

        } else {

            noResults.classList.add(
                "hidden"
            );

        }


        batchGrid.innerHTML =
            "";

    }

}


/* ============================================================
   FILTER BATCHES
============================================================ */

function filterBatches(
    batches
) {

    return batches.filter(
        batch => {

            /*
                MODE FILTER
            */

            if (
                activeFilter !==
                "all"
            ) {

                const batchMode =
                    String(
                        batch.mode || ""
                    )
                        .trim()
                        .toLowerCase();


                if (
                    batchMode !==
                    activeFilter
                ) {

                    return false;

                }

            }


            /*
                SEARCH
            */

            if (
                searchTerm
            ) {

                const searchable =
                    [

                        batch.title,

                        batch.subtitle,

                        batch.description,

                        batch.board,

                        batch.mode,

                        batch.className,

                        ...(Array.isArray(
                            batch.targetClasses
                        )
                            ? batch.targetClasses
                            : [])

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                if (
                    !searchable.includes(
                        searchTerm
                    )
                ) {

                    return false;

                }

            }


            return true;

        }
    );

}


/* ============================================================
   RENDER BATCH CARDS
============================================================ */

function renderBatchCards(
    batches,
    container
) {

    if (
        !container
    ) {

        return;

    }


    container.innerHTML =
        batches
            .map(
                batch =>
                    createBatchCard(
                        batch
                    )
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

                        const batchId =
                            card.dataset.id;


                        if (
                            !batchId
                        ) {

                            return;

                        }


                        /*
                            IMPORTANT:

                            We are inside:

                            home/batches/

                            So:

                            ../batch/

                            correctly opens:

                            home/batch/
                        */

                        window.location.href =
                            `../batch/?id=${
                                encodeURIComponent(
                                    batchId
                                )
                            }`;

                    }
                );

            }
        );

}


/* ============================================================
   CREATE BATCH CARD
============================================================ */

function createBatchCard(
    batch
) {

    const title =
        escapeHtml(
            batch.title ||
            batch.name ||
            "Untitled Batch"
        );


    const subtitle =
        escapeHtml(
            batch.subtitle ||
            batch.shortDescription ||
            ""
        );


    const description =
        escapeHtml(
            batch.description ||
            ""
        );


    const image =
        escapeAttr(
            batch.thumbnailUrl ||
            batch.imageUrl ||
            ""
        );


    const mode =
        escapeHtml(
            batch.mode ||
            ""
        );


    const className =
        escapeHtml(
            batch.className ||
            getFirstClass(
                batch.targetClasses
            ) ||
            ""
        );


    const isPaid =
        batch.isPaid !== false;


    const originalPrice =
        Number(
            batch.price || 0
        );


    const discount =
        Number(
            batch.discount || 0
        );


    let finalPrice =
        Number(
            batch.finalPrice
        );


    /*
        If finalPrice isn't stored,
        calculate it.
    */

    if (
        !Number.isFinite(
            finalPrice
        )
    ) {

        finalPrice =
            Math.max(
                0,
                Math.round(
                    originalPrice -
                    (
                        originalPrice *
                        discount /
                        100
                    )
                )
            );

    }


    let priceHtml = "";


    if (
        isPaid
    ) {

        priceHtml = `

            <div class="batch-price">

                <strong
                    class="final-price"
                >
                    ₹${finalPrice.toLocaleString(
                        "en-IN"
                    )}
                </strong>


                ${
                    discount > 0 &&
                    originalPrice > finalPrice
                        ? `
                            <span
                                class="original-price"
                            >
                                ₹${originalPrice.toLocaleString(
                                    "en-IN"
                                )}
                            </span>
                        `
                        : ""
                }

            </div>


            ${
                discount > 0
                    ? `
                        <span
                            class="discount"
                        >
                            ${discount}% OFF
                        </span>
                    `
                    : ""
            }

        `;

    } else {

        priceHtml = `

            <div class="batch-price">

                <strong
                    class="final-price"
                >
                    FREE
                </strong>

            </div>

        `;

    }


    /*
        Image area.

        If no thumbnail exists,
        use a clean placeholder rather
        than broken-image icon.
    */

    const thumbnailHtml =
        image

            ? `

                <img
                    src="${image}"
                    alt="${title}"
                    loading="lazy"
                    onerror="this.style.display='none';"
                >

            `

            : `

                <div
                    style="
                        width:100%;
                        height:100%;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        background:#f1f1f1;
                        color:#111;
                        font-size:18px;
                        font-weight:900;
                    "
                >
                    Z
                </div>

            `;


    return `

        <article
            class="batch-card"
            data-id="${escapeAttr(
                batch.id
            )}"
        >

            <div
                class="batch-thumbnail"
            >

                ${thumbnailHtml}


                ${
                    isPaid
                        ? `

                            <div
                                class="batch-lock"
                                aria-label="Paid batch"
                            >

                                <svg viewBox="0 0 24 24">

                                    <rect
                                        x="5"
                                        y="10"
                                        width="14"
                                        height="10"
                                        rx="2"
                                    ></rect>

                                    <path
                                        d="M8 10V7a4 4 0 0 1 8 0v3"
                                    ></path>

                                </svg>

                            </div>

                        `
                        : ""
                }


                ${
                    mode
                        ? `

                            <span
                                class="batch-mode"
                            >
                                ${mode}
                            </span>

                        `
                        : ""
                }

            </div>


            <div
                class="batch-content"
            >

                <h3
                    class="batch-title"
                >
                    ${title}
                </h3>


                <p
                    class="batch-subtitle"
                >
                    ${subtitle || description}
                </p>


                ${
                    className
                        ? `

                            <div
                                class="batch-meta"
                            >

                                <span
                                    class="batch-class"
                                >
                                    ${className}
                                </span>

                            </div>

                        `
                        : ""
                }


                <div
                    class="batch-price-row"
                >

                    ${priceHtml}


                    <span
                        class="batch-arrow"
                    >
                        →
                    </span>

                </div>

            </div>

        </article>

    `;

}


/* ============================================================
   NORMALISE ARRAY
============================================================ */

function normaliseArray(
    value
) {

    if (
        Array.isArray(value)
    ) {

        return value
            .map(
                item =>
                    normaliseValue(
                        item
                    )
            )
            .filter(Boolean);

    }


    if (
        typeof value ===
        "string"
    ) {

        return value
            .split(",")
            .map(
                item =>
                    normaliseValue(
                        item
                    )
            )
            .filter(Boolean);

    }


    return [];

}


/* ============================================================
   NORMALISE VALUE
============================================================ */

function normaliseValue(
    value
) {

    return String(
        value ?? ""
    )
        .trim()
        .toLowerCase();

}


/* ============================================================
   FIRST CLASS
============================================================ */

function getFirstClass(
    classes
) {

    if (
        !Array.isArray(
            classes
        )
    ) {

        return "";

    }


    return classes[0] || "";

}


/* ============================================================
   HTML ESCAPING
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


/* ============================================================
   NAVIGATION
============================================================ */

function navigate(
    route
) {

    /*
        Current page:

        home/batches/

        Therefore all Home sections are
        reached through ../
    */

    const routes = {

        home:
            "../",

        batches:
            "../batches/",

        ai:
            "../ai/",

        all:
            "../all/",

        live:
            "../live/",

        tests:
            "../tests/",

        announcements:
            "../announcements/",

        library:
            "../library/",

        profile:
            "../profile/",

        study:
            "../study/"

    };


    if (
        routes[route]
    ) {

        window.location.href =
            routes[route];

    }

}


/* ============================================================
   SHOW APPLICATION
============================================================ */

function showApp() {

    if (
        app
    ) {

        app.classList.remove(
            "hidden"
        );

    }


    if (
        loader
    ) {

        setTimeout(
            () => {

                loader.classList.add(
                    "fade-out"
                );

            },
            100
        );

    }

}


/* ============================================================
   LOADING ERROR
============================================================ */

function showLoadingError(
    error
) {

    console.error(
        error
    );


    if (
        loader
    ) {

        loader.innerHTML = `

            <div
                style="
                    text-align:center;
                    padding:30px;
                "
            >

                <div
                    style="
                        width:54px;
                        height:54px;
                        margin:0 auto;
                        border-radius:50%;
                        background:#111;
                        color:#fff;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        font-size:17px;
                        font-weight:900;
                    "
                >
                    Z
                </div>


                <div
                    style="
                        margin-top:17px;
                        font-size:14px;
                        font-weight:900;
                    "
                >
                    Couldn't load batches
                </div>


                <p
                    style="
                        max-width:270px;
                        margin:8px auto 0;
                        color:#777;
                        font-size:9px;
                        line-height:1.5;
                    "
                >
                    Please try again.
                </p>


                <button
                    id="retryBatches"
                    style="
                        margin-top:17px;
                        padding:10px 17px;
                        border:0;
                        border-radius:8px;
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


        const retry =
            document.getElementById(
                "retryBatches"
            );


        retry?.addEventListener(
            "click",
            () => {

                window.location.reload();

            }
        );

    }

}

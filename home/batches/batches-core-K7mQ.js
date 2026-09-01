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
    query,
    where,
    getDocs,
    limit
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
    document.getElementById(
        "pageLoader"
    );


const app =
    document.getElementById(
        "batchesApp"
    );


const batchGrid =
    document.getElementById(
        "batchGrid"
    );


const recommendedGrid =
    document.getElementById(
        "recommendedGrid"
    );


const recommendedSection =
    document.getElementById(
        "recommendedSection"
    );


const allBatchesSection =
    document.getElementById(
        "allBatchesSection"
    );


const emptyState =
    document.getElementById(
        "emptyState"
    );


const noResults =
    document.getElementById(
        "noResults"
    );


const batchCount =
    document.getElementById(
        "batchCount"
    );


const studentContext =
    document.getElementById(
        "studentContext"
    );


const searchArea =
    document.getElementById(
        "searchArea"
    );


const searchInput =
    document.getElementById(
        "searchInput"
    );


const clearSearch =
    document.getElementById(
        "clearSearch"
    );



/* ============================================================
   AUTHENTICATION
============================================================ */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.replace(
                "../../login/"
            );

            return;

        }


        currentUser = user;


        try {

            await loadStudent();


            await loadBatches();


            setupUI();


            showApp();


        } catch (error) {

            console.error(
                "Batches error:",
                error
            );


            showError();

        }

    }
);



/* ============================================================
   STUDENT
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


    if (
        !snapshot.exists()
    ) {

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


    studentContext.textContent =
        parts.length
            ? `Showing programs relevant to ${parts.join(" • ")}.`
            : "Explore available Zenova programs.";

}



/* ============================================================
   LOAD BATCHES
============================================================ */

async function loadBatches() {

    const batchesRef =
        collection(
            db,
            "batches"
        );


    const batchesQuery =
        query(
            batchesRef,

            where(
                "active",
                "==",
                true
            ),

            limit(100)
        );


    const snapshot =
        await getDocs(
            batchesQuery
        );


    allBatches =
        snapshot.docs.map(
            item => ({

                id:
                    item.id,

                ...item.data()

            })
        );


    /*
     * Admin priority first.
     */

    allBatches.sort(
        (a, b) => {

            return (
                Number(
                    b.priority || 0
                ) -
                Number(
                    a.priority || 0
                )
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

    if (
        !student
    ) {

        return [];

    }


    const scored =
        allBatches.map(
            batch => {

                let score = 0;


                const targetClasses =
                    Array.isArray(
                        batch.targetClasses
                    )
                        ? batch.targetClasses
                        : [];


                const targetBoards =
                    Array.isArray(
                        batch.targetBoards
                    )
                        ? batch.targetBoards
                        : [];


                const targetCombinations =
                    Array.isArray(
                        batch.targetCombinations
                    )
                        ? batch.targetCombinations
                        : [];


                const targetExams =
                    Array.isArray(
                        batch.targetExams
                    )
                        ? batch.targetExams
                        : [];


                /*
                 * Exact class = strongest match.
                 */

                if (
                    student.className &&
                    targetClasses.includes(
                        student.className
                    )
                ) {

                    score += 1000;

                }


                /*
                 * Board match.
                 */

                if (
                    student.board &&
                    targetBoards.includes(
                        student.board
                    )
                ) {

                    score += 300;

                }


                /*
                 * Combination match.
                 */

                if (
                    student.combination &&
                    targetCombinations.includes(
                        student.combination
                    )
                ) {

                    score += 300;

                }


                /*
                 * Target exam match.
                 */

                if (
                    Array.isArray(
                        student.targetExams
                    )
                ) {

                    student.targetExams
                        .forEach(
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

                }


                /*
                 * Admin priority.
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


    scored.sort(
        (a, b) =>
            b.score - a.score
    );


    /*
     * Only show recommendations
     * with actual relevance.
     */

    return scored
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
   UI
============================================================ */

function setupUI() {

    /*
     * Filters
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
     * Search
     */

    document
        .getElementById(
            "searchButton"
        )
        .addEventListener(
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


    searchInput.addEventListener(
        "input",
        () => {

            searchTerm =
                searchInput.value
                    .trim()
                    .toLowerCase();


            clearSearch.classList.toggle(
                "hidden",
                !searchTerm
            );


            render();

        }
    );


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

        }
    );


    /*
     * Back
     */

    document
        .getElementById(
            "backButton"
        )
        .addEventListener(
            "click",
            () => {

                if (
                    window.history.length > 1
                ) {

                    window.history.back();

                } else {

                    window.location.href =
                        "../../home/";

                }

            }
        );


    /*
     * Bottom navigation.
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


    render();

}



/* ============================================================
   RENDER
============================================================ */

function render() {

    const filtered =
        filterBatches(
            allBatches
        );


    /*
     * Absolutely no batches.
     */

    if (
        !allBatches.length
    ) {

        allBatchesSection.classList.add(
            "hidden"
        );


        recommendedSection.classList.add(
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
     * Recommendations.
     */

    const filteredRecommended =
        filterBatches(
            recommendedBatches
        );


    if (
        filteredRecommended.length
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

    }


    /*
     * All batches.
     */

    if (
        filtered.length
    ) {

        allBatchesSection.classList.remove(
            "hidden"
        );


        noResults.classList.add(
            "hidden"
        );


        batchCount.textContent =
            `${filtered.length} ${
                filtered.length === 1
                    ? "program"
                    : "programs"
            }`;


        renderBatchCards(
            filtered,
            batchGrid
        );

    } else {

        allBatchesSection.classList.add(
            "hidden"
        );


        noResults.classList.remove(
            "hidden"
        );

    }

}



/* ============================================================
   FILTER
============================================================ */

function filterBatches(
    batches
) {

    return batches.filter(
        batch => {

            /*
             * Mode filter.
             */

            if (
                activeFilter !==
                "all"
            ) {

                const mode =
                    String(
                        batch.mode || ""
                    ).toLowerCase();


                if (
                    mode !==
                    activeFilter
                ) {

                    return false;

                }

            }


            /*
             * Search filter.
             */

            if (
                searchTerm
            ) {

                const searchable =
                    [

                        batch.title,

                        batch.subtitle,

                        batch.description,

                        batch.className,

                        batch.mode,

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
   BATCH CARDS
============================================================ */

function renderBatchCards(
    batches,
    container
) {

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

                        const id =
                            card.dataset.id;


                        window.location.href =
                            `../../batch/?id=${
                                encodeURIComponent(
                                    id
                                )
                            }`;

                    }
                );

            }
        );

}



/* ============================================================
   BATCH CARD
============================================================ */

function createBatchCard(
    batch
) {

    const title =
        escapeHtml(
            batch.title || ""
        );


    const subtitle =
        escapeHtml(
            batch.subtitle || ""
        );


    const image =
        escapeAttr(
            batch.thumbnailUrl ||
            ""
        );


    const mode =
        escapeHtml(
            batch.mode || ""
        );


    const className =
        escapeHtml(
            batch.className ||
            getFirstClass(
                batch.targetClasses
            ) ||
            ""
        );


    const price =
        Number(
            batch.finalPrice ??
            batch.price ??
            0
        );


    const originalPrice =
        Number(
            batch.price ||
            0
        );


    const discount =
        Number(
            batch.discount ||
            0
        );


    const isPaid =
        batch.isPaid !== false;


    let priceHtml = "";


    if (
        isPaid
    ) {

        priceHtml = `

            <div class="batch-price">

                <strong
                    class="final-price"
                >
                    ₹${price.toLocaleString(
                        "en-IN"
                    )}
                </strong>

                ${
                    discount > 0 &&
                    originalPrice > price
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

                ${
                    image
                        ? `
                            <img
                                src="${image}"
                                alt=""
                                loading="lazy"
                            >
                        `
                        : ""
                }


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
                    ${subtitle}
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
   HELPERS
============================================================ */

function getFirstClass(
    classes
) {

    if (
        !Array.isArray(classes)
    ) {

        return "";

    }


    return classes[0] || "";

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



/* ============================================================
   NAVIGATION
============================================================ */

function navigate(
    route
) {

    const routes = {

        home:
            "../../home/",

        batches:
            "../../home/batches/",

        study:
            "../../study/",

        tests:
            "../../tests/",

        profile:
            "../../profile/"

    };


    if (
        routes[route]
    ) {

        window.location.href =
            routes[route];

    }

}



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
                    font-size:20px;
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
                    font-size:10px;
                "
            >
                We couldn't load your
                batches.
            </p>


            <button
                onclick="location.reload()"
                style="
                    margin-top:17px;
                    padding:10px 16px;
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

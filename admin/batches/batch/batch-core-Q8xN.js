import {
    db
} from "../../../firebase/firebase-config.js";


import {
    doc,
    getDoc
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
        "batchApp"
    );


const errorState =
    document.getElementById(
        "errorState"
    );


const batchImage =
    document.getElementById(
        "batchImage"
    );


const batchMode =
    document.getElementById(
        "batchMode"
    );


const batchCategory =
    document.getElementById(
        "batchCategory"
    );


const batchTitle =
    document.getElementById(
        "batchTitle"
    );


const batchSubtitle =
    document.getElementById(
        "batchSubtitle"
    );


const batchMeta =
    document.getElementById(
        "batchMeta"
    );


const finalPrice =
    document.getElementById(
        "finalPrice"
    );


const originalPrice =
    document.getElementById(
        "originalPrice"
    );


const discount =
    document.getElementById(
        "discount"
    );


const batchDescription =
    document.getElementById(
        "batchDescription"
    );


const detailsList =
    document.getElementById(
        "detailsList"
    );


const purchaseButton =
    document.getElementById(
        "purchaseButton"
    );


const bottomPrice =
    document.getElementById(
        "bottomPrice"
    );


/* ============================================================
   GET BATCH ID
============================================================ */

const params =
    new URLSearchParams(
        window.location.search
    );


const batchId =
    params.get(
        "id"
    );



/* ============================================================
   START
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupNavigation();


        if (!batchId) {

            showError();

            return;

        }


        await loadBatch();

    }
);



/* ============================================================
   LOAD BATCH
============================================================ */

async function loadBatch() {

    try {

        const batchRef =
            doc(
                db,
                "batches",
                batchId
            );


        const snapshot =
            await getDoc(
                batchRef
            );


        if (
            !snapshot.exists()
        ) {

            showError();

            return;

        }


        const batch =
            {
                id:
                    snapshot.id,

                ...snapshot.data()

            };


        /*
         * Students should only be able
         * to see published batches.
         */

        if (
            batch.active !== true
        ) {

            showError();

            return;

        }


        renderBatch(
            batch
        );


        showApp();


    } catch (error) {

        console.error(
            "Batch loading error:",
            error
        );


        showError();

    }

}



/* ============================================================
   RENDER
============================================================ */

function renderBatch(
    batch
) {

    /*
     * IMAGE
     */

    if (
        batch.thumbnailUrl
    ) {

        batchImage.style.backgroundImage =
            `url("${escapeCssUrl(
                batch.thumbnailUrl
            )}")`;

    }



    /*
     * MODE
     */

    if (
        batch.mode
    ) {

        batchMode.textContent =
            String(
                batch.mode
            ).toUpperCase();

        batchMode.classList.remove(
            "hidden"
        );

    }



    /*
     * CATEGORY
     */

    const classes =
        Array.isArray(
            batch.targetClasses
        )
            ? batch.targetClasses
            : [];


    batchCategory.textContent =
        classes.length
            ? classes.join(
                " • "
            )
            : "LEARNING PROGRAM";



    /*
     * TITLE
     */

    batchTitle.textContent =
        batch.title ||
        "Untitled Batch";



    /*
     * SUBTITLE
     */

    batchSubtitle.textContent =
        batch.subtitle ||
        "";



    /*
     * META
     */

    renderMeta(
        batch
    );



    /*
     * PRICE
     */

    renderPrice(
        batch
    );



    /*
     * DESCRIPTION
     */

    batchDescription.textContent =
        batch.description ||
        "Program details will be available soon.";



    /*
     * PROGRAM DETAILS
     */

    renderDetails(
        batch
    );

}



/* ============================================================
   META
============================================================ */

function renderMeta(
    batch
) {

    const items = [];


    if (
        batch.mode
    ) {

        items.push(
            String(
                batch.mode
            )
        );

    }


    if (
        Array.isArray(
            batch.targetClasses
        ) &&
        batch.targetClasses.length
    ) {

        items.push(
            batch.targetClasses.join(
                ", "
            )
        );

    }


    if (
        batch.board
    ) {

        items.push(
            batch.board
        );

    }


    batchMeta.innerHTML =
        items
            .map(
                item =>
                    `

                    <span
                        class="meta-item"
                    >
                        ${escapeHtml(
                            item
                        )}
                    </span>

                    `
            )
            .join("");

}



/* ============================================================
   PRICE
============================================================ */

function renderPrice(
    batch
) {

    const isPaid =
        batch.isPaid !== false;


    if (!isPaid) {

        finalPrice.textContent =
            "FREE";


        bottomPrice.textContent =
            "FREE";


        originalPrice.classList.add(
            "hidden"
        );


        discount.classList.add(
            "hidden"
        );


        purchaseButton.textContent =
            "START LEARNING";


        return;

    }


    const price =
        Number(
            batch.finalPrice ??
            batch.price ??
            0
        );


    const original =
        Number(
            batch.price ||
            0
        );


    const discountPercent =
        Number(
            batch.discount ||
            0
        );


    finalPrice.textContent =
        `₹${price.toLocaleString(
            "en-IN"
        )}`;


    bottomPrice.textContent =
        `₹${price.toLocaleString(
            "en-IN"
        )}`;


    if (
        original > price
    ) {

        originalPrice.textContent =
            `₹${original.toLocaleString(
                "en-IN"
            )}`;

        originalPrice.classList.remove(
            "hidden"
        );

    } else {

        originalPrice.classList.add(
            "hidden"
        );

    }


    if (
        discountPercent > 0
    ) {

        discount.textContent =
            `${discountPercent}% OFF`;

        discount.classList.remove(
            "hidden"
        );

    } else {

        discount.classList.add(
            "hidden"
        );

    }

}



/* ============================================================
   DETAILS
============================================================ */

function renderDetails(
    batch
) {

    const rows = [];


    if (
        batch.board
    ) {

        rows.push({
            label:
                "Board",

            value:
                batch.board

        });

    }


    if (
        Array.isArray(
            batch.targetCombinations
        ) &&
        batch.targetCombinations.length
    ) {

        rows.push({
            label:
                "Combination",

            value:
                batch.targetCombinations.join(
                    ", "
                )

        });

    }


    if (
        Array.isArray(
            batch.targetExams
        ) &&
        batch.targetExams.length
    ) {

        rows.push({
            label:
                "Target Exam",

            value:
                batch.targetExams.join(
                    ", "
                )

        });

    }


    if (
        Array.isArray(
            batch.targetClasses
        ) &&
        batch.targetClasses.length
    ) {

        rows.push({
            label:
                "For",

            value:
                batch.targetClasses.join(
                    ", "
                )

        });

    }


    if (
        batch.mode
    ) {

        rows.push({
            label:
                "Learning Mode",

            value:
                batch.mode

        });

    }


    detailsList.innerHTML =
        rows
            .map(
                row =>
                    `

                    <div
                        class="detail-row"
                    >

                        <span
                            class="detail-label"
                        >
                            ${escapeHtml(
                                row.label
                            )}
                        </span>

                        <span
                            class="detail-value"
                        >
                            ${escapeHtml(
                                row.value
                            )}
                        </span>

                    </div>

                    `
            )
            .join("");

}



/* ============================================================
   NAVIGATION
============================================================ */

function setupNavigation() {


    document
        .getElementById(
            "backButton"
        )
        .addEventListener(
            "click",
            () => {

                window.location.href =
                    "../";

            }
        );


    document
        .getElementById(
            "errorBackButton"
        )
        .addEventListener(
            "click",
            () => {

                window.location.href =
                    "../";

            }
        );


    document
        .getElementById(
            "shareButton"
        )
        .addEventListener(
            "click",
            shareBatch
        );


    purchaseButton
        .addEventListener(
            "click",
            () => {

                /*
                 * Purchase system will be connected
                 * after the batch details UI.
                 */

                console.log(
                    "Purchase clicked:",
                    batchId
                );

            }
        );

}



/* ============================================================
   SHARE
============================================================ */

async function shareBatch() {

    const shareData = {

        title:
            batchTitle.textContent,

        text:
            batchSubtitle.textContent,

        url:
            window.location.href

    };


    try {

        if (
            navigator.share
        ) {

            await navigator.share(
                shareData
            );

        } else {

            await navigator.clipboard.writeText(
                window.location.href
            );

            alert(
                "Batch link copied."
            );

        }

    } catch (error) {

        /*
         * User cancelled share.
         */

        console.log(
            "Share cancelled."
        );

    }

}



/* ============================================================
   ERROR
============================================================ */

function showError() {

    loader.classList.add(
        "hidden"
    );


    app.classList.add(
        "hidden"
    );


    errorState.classList.remove(
        "hidden"
    );

}



/* ============================================================
   SHOW APP
============================================================ */

function showApp() {

    app.classList.remove(
        "hidden"
    );


    loader.classList.add(
        "hidden"
    );

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


function escapeCssUrl(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "\\",
            "\\\\"
        )
        .replaceAll(
            '"',
            '\\"'
        )
        .replaceAll(
            ")",
            "\\)"
        );

}

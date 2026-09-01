import {
    db
} from "../../../../firebase/firebase-config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* ============================================================
   URL
============================================================ */

const params =
    new URLSearchParams(
        window.location.search
    );


const batchId =
    params.get("id");


/* ============================================================
   ELEMENTS
============================================================ */

const loader =
    document.getElementById(
        "pageLoader"
    );


const app =
    document.getElementById(
        "checkoutApp"
    );


const errorState =
    document.getElementById(
        "errorState"
    );


const batchImage =
    document.getElementById(
        "batchImage"
    );


const batchClass =
    document.getElementById(
        "batchClass"
    );


const batchTitle =
    document.getElementById(
        "batchTitle"
    );


const batchSubtitle =
    document.getElementById(
        "batchSubtitle"
    );


const originalPrice =
    document.getElementById(
        "originalPrice"
    );


const discountRow =
    document.getElementById(
        "discountRow"
    );


const discountAmount =
    document.getElementById(
        "discountAmount"
    );


const finalPrice =
    document.getElementById(
        "finalPrice"
    );


const bottomPrice =
    document.getElementById(
        "bottomPrice"
    );


const studentName =
    document.getElementById(
        "studentName"
    );


const studentEmail =
    document.getElementById(
        "studentEmail"
    );


const payButton =
    document.getElementById(
        "payButton"
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


        const batch = {

            id:
                snapshot.id,

            ...snapshot.data()

        };


        if (
            batch.active !== true
        ) {

            showError();

            return;

        }


        renderBatch(
            batch
        );


        loadStudentPreview();


        showApp();


    } catch (error) {

        console.error(
            "Checkout batch error:",
            error
        );


        showError();

    }

}


/* ============================================================
   RENDER BATCH
============================================================ */

function renderBatch(
    batch
) {

    if (
        batch.thumbnailUrl
    ) {

        batchImage.style.backgroundImage =
            `url("${escapeCssUrl(
                batch.thumbnailUrl
            )}")`;

    }


    const classes =
        Array.isArray(
            batch.targetClasses
        )
            ? batch.targetClasses
            : [];


    batchClass.textContent =
        classes.length
            ? classes.join(
                " • "
            )
            : "LEARNING PROGRAM";


    batchTitle.textContent =
        batch.title ||
        "Batch";


    batchSubtitle.textContent =
        batch.subtitle ||
        "";


    const price =
        Number(
            batch.price ||
            0
        );


    const final =
        Number(
            batch.finalPrice ??
            price
        );


    const saved =
        Math.max(
            0,
            price - final
        );


    if (
        batch.isPaid === false
    ) {

        originalPrice.textContent =
            "FREE";

        finalPrice.textContent =
            "FREE";

        bottomPrice.textContent =
            "FREE";

        discountRow.classList.add(
            "hidden"
        );

        payButton.textContent =
            "START LEARNING";

        return;

    }


    originalPrice.textContent =
        formatCurrency(
            price
        );


    finalPrice.textContent =
        formatCurrency(
            final
        );


    bottomPrice.textContent =
        formatCurrency(
            final
        );


    if (
        saved > 0
    ) {

        discountAmount.textContent =
            `-${formatCurrency(
                saved
            )}`;


        discountRow.classList.remove(
            "hidden"
        );

    }

}


/* ============================================================
   STUDENT PREVIEW
============================================================ */

function loadStudentPreview() {

    /*
     * We intentionally do not force login
     * on this development version.
     *
     * If Firebase Auth is connected later,
     * this section will display the real
     * student's name and email.
     */

    studentName.textContent =
        "Student account";


    studentEmail.textContent =
        "Ready for payment";

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
                    "../?id=" +
                    encodeURIComponent(
                        batchId
                    );

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
                    "../?id=" +
                    encodeURIComponent(
                        batchId
                    );

            }
        );


    payButton
        .addEventListener(
            "click",
            beginPayment
        );

}


/* ============================================================
   PAYMENT
============================================================ */

function beginPayment() {

    /*
     * PAYMENT IS NOT CONNECTED YET.
     *
     * Do not mark the student as purchased here.
     * The real payment gateway will be connected
     * after the checkout UI is verified.
     */

    console.log(
        "Payment requested for batch:",
        batchId
    );


    payButton.disabled =
        true;


    payButton.textContent =
        "PAYMENT SETUP PENDING";


    setTimeout(
        () => {

            payButton.disabled =
                false;

            payButton.textContent =
                "CONTINUE TO PAYMENT";

        },
        1800
    );

}


/* ============================================================
   SHOW APP
============================================================ */

function showApp() {

    loader.classList.add(
        "hidden"
    );


    app.classList.remove(
        "hidden"
    );

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
   FORMAT
============================================================ */

function formatCurrency(
    value
) {

    return `₹${Number(
        value || 0
    ).toLocaleString(
        "en-IN"
    )}`;

}


/* ============================================================
   ESCAPING
============================================================ */

function escapeCssUrl(
    value
) {

    return String(
        value || ""
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

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
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";



/* =========================================
   ELEMENTS
========================================= */

const loading =
    document.getElementById(
        "loading"
    );


const app =
    document.getElementById(
        "app"
    );


const errorScreen =
    document.getElementById(
        "error"
    );


const errorMessage =
    document.getElementById(
        "errorMessage"
    );


const backButton =
    document.getElementById(
        "backButton"
    );


const errorBack =
    document.getElementById(
        "errorBack"
    );


const batchImage =
    document.getElementById(
        "batchImage"
    );


const batchName =
    document.getElementById(
        "batchName"
    );


const batchTag =
    document.getElementById(
        "batchTag"
    );


const batchShortDescription =
    document.getElementById(
        "batchShortDescription"
    );


const batchPrice =
    document.getElementById(
        "batchPrice"
    );


const batchDescription =
    document.getElementById(
        "batchDescription"
    );


const detailsGrid =
    document.getElementById(
        "detailsGrid"
    );


const featuresSection =
    document.getElementById(
        "featuresSection"
    );


const featuresList =
    document.getElementById(
        "featuresList"
    );


const subjectsSection =
    document.getElementById(
        "subjectsSection"
    );


const subjectsList =
    document.getElementById(
        "subjectsList"
    );


const bottomBatchName =
    document.getElementById(
        "bottomBatchName"
    );


const buyButton =
    document.getElementById(
        "buyButton"
    );


const bottomBuyButton =
    document.getElementById(
        "bottomBuyButton"
    );



/* =========================================
   COURSE ID
========================================= */

const params =
    new URLSearchParams(
        window.location.search
    );


const courseId =
    params.get(
        "courseId"
    );



/* =========================================
   AUTH
========================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.replace(
                "../../account/login/"
            );

            return;

        }


        if (!courseId) {

            showError(
                "No batch was selected."
            );

            return;

        }


        await loadBatch();

    }
);



/* =========================================
   LOAD BATCH
========================================= */

async function loadBatch() {

    try {

        const batchRef =
            doc(
                db,
                "zen2Courses",
                courseId
            );


        const snapshot =
            await getDoc(
                batchRef
            );


        if (!snapshot.exists()) {

            showError(
                "This batch does not exist."
            );

            return;

        }


        const batch =
            snapshot.data();


        renderBatch(
            batch
        );


        await loadSubjects();


        showApp();

    }

    catch (error) {

        console.error(
            "Batch details error:",
            error
        );


        showError(
            "Unable to load this batch."
        );

    }

}



/* =========================================
   RENDER BATCH
========================================= */

function renderBatch(
    batch
) {

    const name =
        batch.name ||
        batch.title ||
        batch.courseName ||
        batch.batchName ||
        "Zenova Batch";


    const image =
        batch.thumbnailUrl ||
        batch.imageUrl ||
        batch.thumbnail ||
        batch.bannerUrl ||
        "";


    const shortDescription =
        batch.shortDescription ||
        batch.tagline ||
        "";


    const description =
        batch.description ||
        batch.fullDescription ||
        batch.details ||
        "Batch information will be available soon.";


    const price =
        batch.price ??
        batch.fee ??
        batch.courseFee ??
        null;


    const tag =
        batch.tag ||
        batch.mode ||
        batch.medium ||
        "";



    /* IMAGE */

    if (image) {

        batchImage.src =
            image;

    }

    else {

        batchImage.style.display =
            "none";

    }



    /* NAME */

    batchName.textContent =
        name;


    bottomBatchName.textContent =
        name;



    /* SHORT DESCRIPTION */

    batchShortDescription.textContent =
        shortDescription;



    /* DESCRIPTION */

    batchDescription.textContent =
        description;



    /* PRICE */

    if (
        price !== null &&
        price !== undefined &&
        price !== ""
    ) {

        const numericPrice =
            Number(
                price
            );


        batchPrice.textContent =
            Number.isFinite(
                numericPrice
            )
                ? `₹${numericPrice.toLocaleString("en-IN")}`
                : `₹${price}`;

    }

    else {

        batchPrice.textContent =
            "";

    }



    /* TAG */

    if (tag) {

        batchTag.textContent =
            tag;

        batchTag.classList.remove(
            "hidden"
        );

    }



    /* DETAILS */

    renderDetails(
        batch
    );



    /* FEATURES */

    renderFeatures(
        batch
    );

}



/* =========================================
   DETAILS
========================================= */

function renderDetails(
    batch
) {

    const details = [];


    addDetail(
        details,
        "Class",
        batch.className ||
        batch.class ||
        batch.standard
    );


    addDetail(
        details,
        "Medium",
        batch.medium ||
        batch.language
    );


    addDetail(
        details,
        "Mode",
        batch.mode ||
        batch.batchMode
    );


    addDetail(
        details,
        "Duration",
        batch.duration ||
        batch.courseDuration
    );


    addDetail(
        details,
        "Faculty",
        batch.faculty ||
        batch.facultyName
    );


    addDetail(
        details,
        "Validity",
        batch.validity ||
        batch.accessValidity
    );


    detailsGrid.innerHTML =
        details
            .map(
                item => `

                    <div
                        class="detail-card"
                    >

                        <div
                            class="detail-label"
                        >
                            ${escapeHtml(
                                item.label
                            )}
                        </div>

                        <div
                            class="detail-value"
                        >
                            ${escapeHtml(
                                item.value
                            )}
                        </div>

                    </div>

                `
            )
            .join("");


}



/* =========================================
   ADD DETAIL
========================================= */

function addDetail(
    array,
    label,
    value
) {

    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {

        return;

    }


    array.push({

        label,

        value:
            String(
                value
            )

    });

}



/* =========================================
   FEATURES
========================================= */

function renderFeatures(
    batch
) {

    let features =
        batch.features ||
        batch.benefits ||
        batch.inclusions ||
        [];


    if (
        typeof features ===
        "string"
    ) {

        features =
            features
                .split("\n")
                .map(
                    item =>
                        item.trim()
                )
                .filter(Boolean);

    }


    if (
        !Array.isArray(
            features
        ) ||
        !features.length
    ) {

        featuresSection.classList.add(
            "hidden"
        );

        return;

    }


    featuresSection.classList.remove(
        "hidden"
    );


    featuresList.innerHTML =
        features
            .map(
                feature => `

                    <div
                        class="feature"
                    >
                        ${escapeHtml(
                            typeof feature === "string"
                                ? feature
                                : feature.name ||
                                  feature.title ||
                                  ""
                        )}
                    </div>

                `
            )
            .join("");

}



/* =========================================
   SUBJECTS
========================================= */

async function loadSubjects() {

    try {

        const q =
            query(
                collection(
                    db,
                    "zen2Subjects"
                ),

                where(
                    "courseId",
                    "==",
                    courseId
                )
            );


        const snapshot =
            await getDocs(
                q
            );


        if (
            snapshot.empty
        ) {

            subjectsSection.classList.add(
                "hidden"
            );

            return;

        }


        subjectsSection.classList.remove(
            "hidden"
        );


        subjectsList.innerHTML =
            snapshot.docs
                .map(
                    item => {

                        const data =
                            item.data();


                        const name =
                            data.name ||
                            data.title ||
                            data.subjectName ||
                            data.subject ||
                            "Subject";


                        return `

                            <div
                                class="subject-card"
                            >

                                ${escapeHtml(
                                    name
                                )}

                            </div>

                        `;

                    }
                )
                .join("");

    }

    catch (error) {

        console.warn(
            "Unable to load subjects:",
            error
        );


        subjectsSection.classList.add(
            "hidden"
        );

    }

}



/* =========================================
   BUY NOW
========================================= */

function openPurchase() {

    /*
     * Purchase page will be connected
     * separately to the ZEN2 enrollment
     * system.
     */

    window.location.href =
        `../checkout/?courseId=${
            encodeURIComponent(
                courseId
            )
        }`;

}


buyButton.addEventListener(
    "click",
    openPurchase
);


bottomBuyButton.addEventListener(
    "click",
    openPurchase
);



/* =========================================
   BACK
========================================= */

backButton.addEventListener(
    "click",
    () => {

        if (
            window.history.length > 1
        ) {

            window.history.back();

            return;

        }


        window.location.href =
            "../";

    }
);


errorBack.addEventListener(
    "click",
    () => {

        window.history.back();

    }
);



/* =========================================
   SHOW APP
========================================= */

function showApp() {

    loading.classList.add(
        "hidden"
    );


    app.classList.remove(
        "hidden"
    );

}



/* =========================================
   ERROR
========================================= */

function showError(
    text
) {

    loading.classList.add(
        "hidden"
    );


    app.classList.add(
        "hidden"
    );


    errorMessage.textContent =
        text;


    errorScreen.classList.remove(
        "hidden"
    );

}



/* =========================================
   ESCAPE HTML
========================================= */

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

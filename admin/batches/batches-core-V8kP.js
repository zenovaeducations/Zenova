import {
    auth,
    db
} from "../../firebase/firebase-config.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    collection,
    query,
    orderBy,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";



/* ============================================================
   STATE
============================================================ */

let currentUser = null;

let batches = [];

let editingBatchId = null;

let deletingBatchId = null;

let activeFilter = "all";

let searchTerm = "";



/* ============================================================
   ELEMENTS
============================================================ */

const loader =
    document.getElementById(
        "adminLoader"
    );


const app =
    document.getElementById(
        "adminApp"
    );


const batchList =
    document.getElementById(
        "batchList"
    );


const emptyState =
    document.getElementById(
        "emptyState"
    );


const noResults =
    document.getElementById(
        "noResults"
    );


const batchModal =
    document.getElementById(
        "batchModal"
    );


const deleteModal =
    document.getElementById(
        "deleteModal"
    );


const form =
    document.getElementById(
        "batchForm"
    );


const thumbnailInput =
    document.getElementById(
        "thumbnailInput"
    );


const thumbnailPreview =
    document.getElementById(
        "thumbnailPreview"
    );


const titleInput =
    document.getElementById(
        "titleInput"
    );


const subtitleInput =
    document.getElementById(
        "subtitleInput"
    );


const descriptionInput =
    document.getElementById(
        "descriptionInput"
    );


const boardInput =
    document.getElementById(
        "boardInput"
    );


const combinationInput =
    document.getElementById(
        "combinationInput"
    );


const examInput =
    document.getElementById(
        "examInput"
    );


const priceInput =
    document.getElementById(
        "priceInput"
    );


const discountInput =
    document.getElementById(
        "discountInput"
    );


const paidInput =
    document.getElementById(
        "paidInput"
    );


const activeInput =
    document.getElementById(
        "activeInput"
    );


const priorityInput =
    document.getElementById(
        "priorityInput"
    );


const saveButton =
    document.getElementById(
        "saveButton"
    );


const modalTitle =
    document.getElementById(
        "modalTitle"
    );


const pricePreview =
    document.getElementById(
        "pricePreview"
    );


const toast =
    document.getElementById(
        "toast"
    );



/* ============================================================
   ADMIN AUTHORIZATION
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


        /*
         * Firebase Authentication custom claim.
         *
         * Admin account must have:
         *
         * admin: true
         */

        try {

            


            currentUser =
                user;


            await loadBatches();


            setupEvents();


            showApp();


        } catch (error) {

            console.error(
                "Admin authentication:",
                error
            );


            showAccessDenied();

        }

    }
);



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
            orderBy(
                "priority",
                "desc"
            )
        );


    const snapshot =
        await getDocs(
            batchesQuery
        );


    batches =
        snapshot.docs.map(
            item => ({

                id:
                    item.id,

                ...item.data()

            })
        );


    render();

}



/* ============================================================
   EVENTS
============================================================ */

function setupEvents() {


    document
        .getElementById(
            "addBatchButton"
        )
        .addEventListener(
            "click",
            openCreateModal
        );


    document
        .getElementById(
            "emptyAddButton"
        )
        .addEventListener(
            "click",
            openCreateModal
        );


    document
        .getElementById(
            "closeModal"
        )
        .addEventListener(
            "click",
            closeBatchModal
        );


    document
        .getElementById(
            "cancelButton"
        )
        .addEventListener(
            "click",
            closeBatchModal
        );


    document
        .getElementById(
            "cancelDelete"
        )
        .addEventListener(
            "click",
            closeDeleteModal
        );


    document
        .getElementById(
            "confirmDelete"
        )
        .addEventListener(
            "click",
            deleteBatch
        );


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
            "searchInput"
        )
        .addEventListener(
            "input",
            event => {

                searchTerm =
                    event.target.value
                        .trim()
                        .toLowerCase();

                render();

            }
        );


    document
        .querySelectorAll(
            ".filter-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".filter-button"
                            )
                            .forEach(
                                item =>
                                    item.classList.remove(
                                        "active"
                                    )
                            );


                        button.classList.add(
                            "active"
                        );


                        activeFilter =
                            button.dataset.filter;


                        render();

                    }
                );

            }
        );


    thumbnailInput.addEventListener(
        "change",
        previewThumbnail
    );


    priceInput.addEventListener(
        "input",
        updatePricePreview
    );


    discountInput.addEventListener(
        "input",
        updatePricePreview
    );


    form.addEventListener(
        "submit",
        saveBatch
    );


    batchModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                batchModal
            ) {

                closeBatchModal();

            }

        }
    );


    deleteModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                deleteModal
            ) {

                closeDeleteModal();

            }

        }
    );

}



/* ============================================================
   CREATE MODAL
============================================================ */

function openCreateModal() {

    editingBatchId =
        null;


    form.reset();


    document
        .querySelectorAll(
            "#classOptions input"
        )
        .forEach(
            input => {

                input.checked =
                    false;

            }
        );


    document
        .querySelector(
            'input[name="mode"][value="Online"]'
        )
        .checked =
        true;


    thumbnailPreview.innerHTML =
        "<span>No image selected</span>";


    modalTitle.textContent =
        "Create Batch";


    saveButton.textContent =
        "CREATE BATCH";


    batchModal.classList.remove(
        "hidden"
    );


    updatePricePreview();

}



/* ============================================================
   EDIT MODAL
============================================================ */

function openEditModal(
    batchId
) {

    const batch =
        batches.find(
            item =>
                item.id ===
                batchId
        );


    if (
        !batch
    ) {

        return;

    }


    editingBatchId =
        batchId;


    modalTitle.textContent =
        "Edit Batch";


    saveButton.textContent =
        "SAVE CHANGES";


    titleInput.value =
        batch.title || "";


    subtitleInput.value =
        batch.subtitle || "";


    descriptionInput.value =
        batch.description || "";


    boardInput.value =
        batch.board || "";


    combinationInput.value =
        Array.isArray(
            batch.targetCombinations
        )
            ? batch.targetCombinations.join(
                ", "
            )
            : "";


    examInput.value =
        Array.isArray(
            batch.targetExams
        )
            ? batch.targetExams.join(
                ", "
            )
            : "";


    document
        .querySelectorAll(
            "#classOptions input"
        )
        .forEach(
            input => {

                input.checked =
                    Array.isArray(
                        batch.targetClasses
                    ) &&
                    batch.targetClasses.includes(
                        input.value
                    );

            }
        );


    document
        .querySelectorAll(
            'input[name="mode"]'
        )
        .forEach(
            input => {

                input.checked =
                    input.value ===
                    batch.mode;

            }
        );


    priceInput.value =
        Number(
            batch.price || 0
        );


    discountInput.value =
        Number(
            batch.discount || 0
        );


    paidInput.checked =
        batch.isPaid !== false;


    activeInput.checked =
        batch.active === true;


    priorityInput.value =
        Number(
            batch.priority || 0
        );


    if (
        batch.thumbnailUrl
    ) {

        thumbnailPreview.innerHTML = `

            <img
                src="${escapeAttr(
                    batch.thumbnailUrl
                )}"
                alt=""
            >

        `;

    } else {

        thumbnailPreview.innerHTML =
            "<span>No image selected</span>";

    }


    updatePricePreview();


    batchModal.classList.remove(
        "hidden"
    );

}



/* ============================================================
   CLOSE MODAL
============================================================ */

function closeBatchModal() {

    batchModal.classList.add(
        "hidden"
    );


    editingBatchId =
        null;

}



/* ============================================================
   THUMBNAIL PREVIEW
============================================================ */

function previewThumbnail(
    event
) {

    const file =
        event.target.files[0];


    if (
        !file
    ) {

        return;

    }


    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        thumbnailInput.value =
            "";

        showToast(
            "Please select an image."
        );

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        event => {

            thumbnailPreview.innerHTML = `

                <img
                    src="${event.target.result}"
                    alt=""
                >

            `;

        };


    reader.readAsDataURL(
        file
    );

}



/* ============================================================
   PRICE
============================================================ */

function updatePricePreview() {

    const price =
        Number(
            priceInput.value || 0
        );


    const discount =
        Number(
            discountInput.value || 0
        );


    const finalPrice =
        Math.max(
            0,
            Math.round(
                price -
                (
                    price *
                    discount /
                    100
                )
            )
        );


    pricePreview.innerHTML = `

        Final price:
        <strong>
            ₹${finalPrice.toLocaleString(
                "en-IN"
            )}
        </strong>

    `;

}



/* ============================================================
   SAVE BATCH
============================================================ */

async function saveBatch(
    event
) {

    event.preventDefault();


    const title =
        titleInput.value.trim();


    if (
        !title
    ) {

        showToast(
            "Batch title is required."
        );

        titleInput.focus();

        return;

    }


    const selectedClasses =
        Array.from(
            document.querySelectorAll(
                "#classOptions input:checked"
            )
        ).map(
            input =>
                input.value
        );


    if (
        !selectedClasses.length
    ) {

        showToast(
            "Select at least one class."
        );

        return;

    }


    const mode =
        document.querySelector(
            'input[name="mode"]:checked'
        )?.value ||
        "Online";


    const price =
        Math.max(
            0,
            Number(
                priceInput.value || 0
            )
        );


    const discount =
        Math.max(
            0,
            Math.min(
                100,
                Number(
                    discountInput.value || 0
                )
            )
        );


    const finalPrice =
        Math.max(
            0,
            Math.round(
                price -
                (
                    price *
                    discount /
                    100
                )
            )
        );


    const batchData = {

        title,

        subtitle:
            subtitleInput.value.trim(),

        description:
            descriptionInput.value.trim(),

        targetClasses:
            selectedClasses,

        board:
            boardInput.value.trim(),

        targetCombinations:
            parseCommaValues(
                combinationInput.value
            ),

        targetExams:
            parseCommaValues(
                examInput.value
            ),

        mode,

        price,

        discount,

        finalPrice,

        isPaid:
            paidInput.checked,

        active:
            activeInput.checked,

        priority:
            Math.max(
                0,
                Number(
                    priorityInput.value || 0
                )
            ),

        updatedAt:
            serverTimestamp()

    };


    /*
     * IMPORTANT:
     *
     * Thumbnail upload is intentionally
     * handled separately once Firebase
     * Storage is configured.
     *
     * For now, editing an existing thumbnail
     * keeps its current URL.
     */

    try {

        saveButton.disabled =
            true;


        saveButton.textContent =
            "SAVING...";


        if (
            editingBatchId
        ) {

            await updateDoc(
                doc(
                    db,
                    "batches",
                    editingBatchId
                ),
                batchData
            );


            showToast(
                "Batch updated successfully."
            );

        } else {

            batchData.createdAt =
                serverTimestamp();


            batchData.createdBy =
                currentUser.uid;


            batchData.thumbnailUrl =
                "";


            await addDoc(
                collection(
                    db,
                    "batches"
                ),
                batchData
            );


            showToast(
                "Batch created successfully."
            );

        }


        closeBatchModal();


        await loadBatches();


    } catch (error) {

        console.error(
            "Save batch:",
            error
        );


        showToast(
            "Unable to save batch."
        );

    } finally {

        saveButton.disabled =
            false;

    }

}



/* ============================================================
   DELETE
============================================================ */

function openDeleteModal(
    batchId
) {

    deletingBatchId =
        batchId;


    deleteModal.classList.remove(
        "hidden"
    );

}


function closeDeleteModal() {

    deleteModal.classList.add(
        "hidden"
    );


    deletingBatchId =
        null;

}


async function deleteBatch() {

    if (
        !deletingBatchId
    ) {

        return;

    }


    try {

        await deleteDoc(
            doc(
                db,
                "batches",
                deletingBatchId
            )
        );


        closeDeleteModal();


        showToast(
            "Batch deleted."
        );


        await loadBatches();


    } catch (error) {

        console.error(
            "Delete batch:",
            error
        );


        showToast(
            "Unable to delete batch."
        );

    }

}



/* ============================================================
   RENDER
============================================================ */

function render() {

    updateStats();


    const filtered =
        batches.filter(
            batch => {

                if (
                    activeFilter ===
                    "active" &&
                    batch.active !== true
                ) {

                    return false;

                }


                if (
                    activeFilter ===
                    "inactive" &&
                    batch.active === true
                ) {

                    return false;

                }


                if (
                    searchTerm
                ) {

                    const text =
                        [

                            batch.title,

                            batch.subtitle,

                            batch.description,

                            batch.board,

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
                        !text.includes(
                            searchTerm
                        )
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );


    if (
        !batches.length
    ) {

        batchList.innerHTML =
            "";

        emptyState.classList.remove(
            "hidden"
        );

        noResults.classList.add(
            "hidden"
        );

        return;

    }


    emptyState.classList.add(
        "hidden"
    );


    if (
        !filtered.length
    ) {

        batchList.innerHTML =
            "";

        noResults.classList.remove(
            "hidden"
        );

        return;

    }


    noResults.classList.add(
        "hidden"
    );


    batchList.innerHTML =
        filtered
            .map(
                batch =>
                    createBatchRow(
                        batch
                    )
            )
            .join("");


    attachRowEvents();

}



/* ============================================================
   STATS
============================================================ */

function updateStats() {

    document.getElementById(
        "totalCount"
    ).textContent =
        batches.length;


    document.getElementById(
        "activeCount"
    ).textContent =
        batches.filter(
            batch =>
                batch.active === true
        ).length;


    document.getElementById(
        "inactiveCount"
    ).textContent =
        batches.filter(
            batch =>
                batch.active !== true
        ).length;

}



/* ============================================================
   ROW
============================================================ */

function createBatchRow(
    batch
) {

    const thumbnail =
        batch.thumbnailUrl
            ? `

                <img
                    src="${escapeAttr(
                        batch.thumbnailUrl
                    )}"
                    alt=""
                >

            `
            : "";


    const classes =
        Array.isArray(
            batch.targetClasses
        )
            ? batch.targetClasses.join(
                " • "
            )
            : "";


    const price =
        batch.isPaid === false
            ? "FREE"
            : `₹${Number(
                batch.finalPrice ??
                batch.price ??
                0
            ).toLocaleString(
                "en-IN"
            )}`;


    return `

        <article
            class="batch-row"
        >


            <div
                class="batch-row-image"
            >

                ${thumbnail}

            </div>



            <div
                class="batch-row-content"
            >

                <div
                    class="batch-row-title"
                >
                    ${escapeHtml(
                        batch.title ||
                        ""
                    )}
                </div>


                <div
                    class="batch-row-subtitle"
                >
                    ${escapeHtml(
                        batch.subtitle ||
                        batch.description ||
                        ""
                    )}
                </div>


                <div
                    class="batch-row-meta"
                >

                    <span
                        class="meta-pill"
                    >
                        ${escapeHtml(
                            classes
                        )}
                    </span>


                    ${
                        batch.mode
                            ? `
                                <span
                                    class="meta-pill"
                                >
                                    ${escapeHtml(
                                        batch.mode
                                    )}
                                </span>
                            `
                            : ""
                    }


                    <span
                        class="meta-pill ${
                            batch.active
                                ? "published"
                                : ""
                        }"
                    >
                        ${
                            batch.active
                                ? "PUBLISHED"
                                : "DRAFT"
                        }
                    </span>

                </div>


                <div
                    class="batch-row-price"
                >
                    ${price}
                </div>

            </div>



            <div
                class="batch-row-actions"
            >

                <button
                    class="row-action edit"
                    data-id="${escapeAttr(
                        batch.id
                    )}"
                    aria-label="Edit"
                >

                    <svg viewBox="0 0 24 24">

                        <path
                            d="M4 20h4L19 9l-4-4L4 16z"
                        ></path>

                        <path
                            d="M13 6l4 4"
                        ></path>

                    </svg>

                </button>


                <button
                    class="row-action delete"
                    data-id="${escapeAttr(
                        batch.id
                    )}"
                    aria-label="Delete"
                >

                    <svg viewBox="0 0 24 24">

                        <path
                            d="M4 7h16"
                        ></path>

                        <path
                            d="M10 11v6"
                        ></path>

                        <path
                            d="M14 11v6"
                        ></path>

                        <path
                            d="M6 7l1 14h10l1-14"
                        ></path>

                        <path
                            d="M9 7V4h6v3"
                        ></path>

                    </svg>

                </button>

            </div>


        </article>

    `;

}



/* ============================================================
   ROW EVENTS
============================================================ */

function attachRowEvents() {

    document
        .querySelectorAll(
            ".row-action.edit"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openEditModal(
                            button.dataset.id
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".row-action.delete"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openDeleteModal(
                            button.dataset.id
                        );

                    }
                );

            }
        );

}



/* ============================================================
   HELPERS
============================================================ */

function parseCommaValues(
    value
) {

    return String(
        value || ""
    )
        .split(",")
        .map(
            item =>
                item.trim()
        )
        .filter(Boolean);

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
   TOAST
============================================================ */

let toastTimer;


function showToast(
    message
) {

    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2500
        );

}



/* ============================================================
   APP
============================================================ */

function showApp() {

    app.classList.remove(
        "hidden"
    );


    setTimeout(
        () => {

            loader.classList.add(
                "hidden"
            );

        },
        200
    );

}


function showAccessDenied() {

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
                You do not have permission
                to access this area.
            </p>


            <button
                onclick="location.href='../../home/'"
                style="
                    margin-top:18px;
                    padding:10px 15px;
                    border:0;
                    border-radius:7px;
                    background:#111;
                    color:#fff;
                    font-size:8px;
                    font-weight:800;
                "
            >
                GO HOME
            </button>

        </div>

    `;

}

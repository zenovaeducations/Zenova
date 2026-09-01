import {
    db,
    storage
} from "../firebase/firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";


/* ============================================================
   STATE
============================================================ */

let banners = [];

let editingBannerId = null;

let editingBannerImageUrl = "";

let deletingBannerId = null;


/* ============================================================
   ELEMENTS
============================================================ */

const pages =
    document.querySelectorAll(
        ".admin-page"
    );

const navItems =
    document.querySelectorAll(
        ".nav-item"
    );

const pageTitle =
    document.getElementById(
        "pageTitle"
    );

const bannerModal =
    document.getElementById(
        "bannerModal"
    );

const bannerForm =
    document.getElementById(
        "bannerForm"
    );

const bannerList =
    document.getElementById(
        "bannerList"
    );

const imageInput =
    document.getElementById(
        "bannerImage"
    );

const imagePreview =
    document.getElementById(
        "imagePreview"
    );

const modalTitle =
    document.getElementById(
        "modalTitle"
    );

const toast =
    document.getElementById(
        "toast"
    );

const confirmModal =
    document.getElementById(
        "confirmModal"
    );


/* ============================================================
   PAGE TITLES
============================================================ */

const titles = {

    dashboard:
        "Dashboard",

    home:
        "Home Management",

    banners:
        "Home Banners",

    announcements:
        "Announcements",

    recommendations:
        "Recommended Batches",

    students:
        "Students",

    batches:
        "Batches",

    live:
        "Live Classes",

    tests:
        "Tests",

    content:
        "Study Content",

    payments:
        "Payments",

    notifications:
        "Notifications",

    settings:
        "Settings"

};


/* ============================================================
   INITIALIZE
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        setupNavigation();

        setupBannerModal();

        setupMobileMenu();

        await loadBanners();

    }
);


/* ============================================================
   NAVIGATION
============================================================ */

function setupNavigation() {

    document
        .querySelectorAll(
            "[data-page]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    () => {

                        const page =
                            element.dataset.page;

                        openPage(
                            page
                        );

                    }
                );

            }
        );

}


function openPage(
    page
) {

    pages.forEach(
        section => {

            section.classList.remove(
                "active"
            );

        }
    );


    const target =
        document.getElementById(
            `${page}Page`
        );


    if (target) {

        target.classList.add(
            "active"
        );

    } else {

        document
            .getElementById(
                "dashboardPage"
            )
            .classList.add(
                "active"
            );

        page =
            "dashboard";

    }


    navItems.forEach(
        item => {

            item.classList.toggle(
                "active",
                item.dataset.page === page
            );

        }
    );


    pageTitle.textContent =
        titles[page] ||
        "Dashboard";


    if (
        page === "banners"
    ) {

        loadBanners();

    }

}


/* ============================================================
   FIREBASE — LOAD BANNERS
============================================================ */

async function loadBanners() {

    if (!bannerList) {
        return;
    }


    bannerList.innerHTML = `

        <div class="loading-state">

            <div class="small-spinner"></div>

            <span>
                Loading banners...
            </span>

        </div>

    `;


    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "homeBanners"
                )
            );


        banners =
            snapshot.docs.map(
                item => ({

                    id:
                        item.id,

                    ...item.data()

                })
            );


        banners.sort(
            (a, b) => {

                return (
                    Number(
                        a.order || 999
                    ) -
                    Number(
                        b.order || 999
                    )
                );

            }
        );


        renderBanners();


    } catch (error) {

        console.error(
            "Could not load banners:",
            error
        );


        bannerList.innerHTML = `

            <div class="empty-admin-page">

                <h2>
                    Could not load banners
                </h2>

                <span>
                    Check your Firebase
                    configuration and Firestore rules.
                </span>

            </div>

        `;

    }

}


/* ============================================================
   RENDER BANNERS
============================================================ */

function renderBanners() {

    if (
        !banners.length
    ) {

        bannerList.innerHTML = `

            <div class="empty-admin-page">

                <p>
                    HOME BANNERS
                </p>

                <h2>
                    No banners yet.
                </h2>

                <span>
                    Add your first real homepage
                    banner using the button above.
                </span>

            </div>

        `;

        return;

    }


    bannerList.innerHTML =
        banners.map(
            banner => `

                <article
                    class="banner-admin-card"
                >

                    <div
                        class="banner-admin-image"
                    >

                        <img
                            src="${escapeAttr(
                                banner.imageUrl
                            )}"
                            alt=""
                        >

                    </div>


                    <div
                        class="banner-admin-info"
                    >

                        <h3>
                            ${
                                escapeHtml(
                                    banner.title ||
                                    "Untitled banner"
                                )
                            }
                        </h3>


                        <p>
                            ${
                                escapeHtml(
                                    banner.description ||
                                    "No description"
                                )
                            }
                        </p>


                        <div
                            class="banner-meta"
                        >

                            <span
                                class="banner-status ${
                                    banner.active
                                        ? ""
                                        : "inactive"
                                }"
                            >
                                ${
                                    banner.active
                                        ? "ACTIVE"
                                        : "DISABLED"
                                }
                            </span>


                            <span
                                class="banner-order"
                            >
                                Order:
                                ${
                                    Number(
                                        banner.order ||
                                        0
                                    )
                                }
                            </span>

                        </div>

                    </div>


                    <div
                        class="banner-actions"
                    >

                        <button
                            class="banner-action"
                            data-action="edit"
                            data-id="${
                                escapeAttr(
                                    banner.id
                                )
                            }"
                        >
                            Edit
                        </button>


                        <button
                            class="banner-action"
                            data-action="toggle"
                            data-id="${
                                escapeAttr(
                                    banner.id
                                )
                            }"
                        >
                            ${
                                banner.active
                                    ? "Disable"
                                    : "Enable"
                            }
                        </button>


                        <button
                            class="banner-action"
                            data-action="delete"
                            data-id="${
                                escapeAttr(
                                    banner.id
                                )
                            }"
                        >
                            Delete
                        </button>

                    </div>

                </article>

            `
        ).join("");


    bannerList
        .querySelectorAll(
            "[data-action]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.id;

                        const action =
                            button.dataset.action;


                        if (
                            action === "edit"
                        ) {

                            openEditBanner(
                                id
                            );

                        }


                        if (
                            action === "toggle"
                        ) {

                            toggleBanner(
                                id
                            );

                        }


                        if (
                            action === "delete"
                        ) {

                            openDeleteConfirmation(
                                id
                            );

                        }

                    }
                );

            }
        );

}


/* ============================================================
   ADD / EDIT FORM
============================================================ */

function setupBannerModal() {

    document
        .getElementById(
            "addBannerButton"
        )
        .addEventListener(
            "click",
            () => {

                openAddBanner();

            }
        );


    document
        .getElementById(
            "closeBannerModal"
        )
        .addEventListener(
            "click",
            closeBannerModal
        );


    document
        .getElementById(
            "cancelBannerButton"
        )
        .addEventListener(
            "click",
            closeBannerModal
        );


    bannerModal
        .querySelector(
            ".modal-backdrop"
        )
        .addEventListener(
            "click",
            closeBannerModal
        );


    imageInput.addEventListener(
        "change",
        previewSelectedImage
    );


    bannerForm.addEventListener(
        "submit",
        saveBanner
    );


    document
        .getElementById(
            "cancelDelete"
        )
        .addEventListener(
            "click",
            closeDeleteConfirmation
        );


    document
        .getElementById(
            "confirmDelete"
        )
        .addEventListener(
            "click",
            deleteBanner
        );

}


/* ============================================================
   ADD BANNER
============================================================ */

function openAddBanner() {

    editingBannerId =
        null;

    editingBannerImageUrl =
        "";


    bannerForm.reset();


    document
        .getElementById(
            "bannerActive"
        )
        .checked =
        true;


    document
        .getElementById(
            "bannerOrder"
        )
        .value =
        getNextOrder();


    modalTitle.textContent =
        "Add Banner";


    resetImagePreview();


    bannerModal.classList.remove(
        "hidden"
    );

}


/* ============================================================
   EDIT BANNER
============================================================ */

function openEditBanner(
    id
) {

    const banner =
        banners.find(
            item =>
                item.id === id
        );


    if (!banner) {
        return;
    }


    editingBannerId =
        id;


    editingBannerImageUrl =
        banner.imageUrl ||
        "";


    document
        .getElementById(
            "bannerTitle"
        )
        .value =
        banner.title ||
        "";


    document
        .getElementById(
            "bannerDescription"
        )
        .value =
        banner.description ||
        "";


    document
        .getElementById(
            "bannerButtonText"
        )
        .value =
        banner.buttonText ||
        "";


    document
        .getElementById(
            "bannerLink"
        )
        .value =
        banner.link ||
        "";


    document
        .getElementById(
            "bannerOrder"
        )
        .value =
        Number(
            banner.order ||
            1
        );


    document
        .getElementById(
            "bannerActive"
        )
        .checked =
        banner.active === true;


    imageInput.value =
        "";


    showExistingImage(
        banner.imageUrl
    );


    modalTitle.textContent =
        "Edit Banner";


    bannerModal.classList.remove(
        "hidden"
    );

}


/* ============================================================
   IMAGE PREVIEW
============================================================ */

function previewSelectedImage(
    event
) {

    const file =
        event.target.files[0];


    if (!file) {
        return;
    }


    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        showToast(
            "Please select an image."
        );

        imageInput.value =
            "";

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        event => {

            imagePreview.classList.add(
                "has-image"
            );


            imagePreview.innerHTML = `

                <img
                    src="${event.target.result}"
                    alt="Banner preview"
                >

            `;

        };


    reader.readAsDataURL(
        file
    );

}


function showExistingImage(
    url
) {

    if (!url) {

        resetImagePreview();

        return;

    }


    imagePreview.classList.add(
        "has-image"
    );


    imagePreview.innerHTML = `

        <img
            src="${escapeAttr(url)}"
            alt="Current banner"
        >

    `;

}


function resetImagePreview() {

    imagePreview.classList.remove(
        "has-image"
    );


    imagePreview.innerHTML = `

        <svg viewBox="0 0 24 24">

            <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
            ></rect>

            <circle
                cx="8"
                cy="10"
                r="1.5"
            ></circle>

            <path
                d="M4 17l5-5 3 3 3-3 5 5"
            ></path>

        </svg>


        <strong>
            Upload Banner
        </strong>


        <span>
            Recommended ratio 2.35 : 1
        </span>

    `;

}


/* ============================================================
   SAVE BANNER
============================================================ */

async function saveBanner(
    event
) {

    event.preventDefault();


    const saveButton =
        document.getElementById(
            "saveBannerButton"
        );


    const file =
        imageInput.files[0];


    /*
     * New banner requires an image.
     */

    if (
        !editingBannerId &&
        !file
    ) {

        showToast(
            "Please upload a banner image."
        );

        return;

    }


    try {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "Saving...";


        let imageUrl =
            editingBannerImageUrl;


        /*
         * Upload new image.
         */

        if (file) {

            const safeName =
                createSafeFileName(
                    file.name
                );


            const storagePath =
                `homeBanners/${Date.now()}_${safeName}`;


            const imageRef =
                ref(
                    storage,
                    storagePath
                );


            await uploadBytes(
                imageRef,
                file
            );


            imageUrl =
                await getDownloadURL(
                    imageRef
                );

        }


        const bannerData = {

            imageUrl,

            title:
                document
                    .getElementById(
                        "bannerTitle"
                    )
                    .value
                    .trim(),

            description:
                document
                    .getElementById(
                        "bannerDescription"
                    )
                    .value
                    .trim(),

            buttonText:
                document
                    .getElementById(
                        "bannerButtonText"
                    )
                    .value
                    .trim(),

            link:
                document
                    .getElementById(
                        "bannerLink"
                    )
                    .value
                    .trim(),

            order:
                Number(
                    document
                        .getElementById(
                            "bannerOrder"
                        )
                        .value
                ),

            active:
                document
                    .getElementById(
                        "bannerActive"
                    )
                    .checked

        };


        /*
         * CREATE
         */

        if (
            !editingBannerId
        ) {

            await addDoc(
                collection(
                    db,
                    "homeBanners"
                ),
                {
                    ...bannerData,
                    createdAt:
                        serverTimestamp(),
                    updatedAt:
                        serverTimestamp()
                }
            );


            showToast(
                "Banner added successfully."
            );

        }


        /*
         * UPDATE
         */

        else {

            await updateDoc(
                doc(
                    db,
                    "homeBanners",
                    editingBannerId
                ),
                {
                    ...bannerData,
                    updatedAt:
                        serverTimestamp()
                }
            );


            showToast(
                "Banner updated successfully."
            );

        }


        closeBannerModal();

        await loadBanners();


    } catch (error) {

        console.error(
            "Save banner error:",
            error
        );


        showToast(
            "Could not save banner."
        );

    } finally {

        saveButton.disabled =
            false;

        saveButton.textContent =
            "Save Banner";

    }

}


/* ============================================================
   ENABLE / DISABLE
============================================================ */

async function toggleBanner(
    id
) {

    const banner =
        banners.find(
            item =>
                item.id === id
        );


    if (!banner) {
        return;
    }


    try {

        await updateDoc(
            doc(
                db,
                "homeBanners",
                id
            ),
            {

                active:
                    !banner.active,

                updatedAt:
                    serverTimestamp()

            }
        );


        showToast(
            banner.active
                ? "Banner disabled."
                : "Banner enabled."
        );


        await loadBanners();


    } catch (error) {

        console.error(
            "Toggle banner error:",
            error
        );


        showToast(
            "Could not update banner."
        );

    }

}


/* ============================================================
   DELETE CONFIRMATION
============================================================ */

function openDeleteConfirmation(
    id
) {

    deletingBannerId =
        id;


    confirmModal.classList.remove(
        "hidden"
    );

}


function closeDeleteConfirmation() {

    deletingBannerId =
        null;


    confirmModal.classList.add(
        "hidden"
    );

}


/* ============================================================
   DELETE BANNER
============================================================ */

async function deleteBanner() {

    if (
        !deletingBannerId
    ) {
        return;
    }


    const banner =
        banners.find(
            item =>
                item.id ===
                deletingBannerId
        );


    const id =
        deletingBannerId;


    try {

        const deleteButton =
            document.getElementById(
                "confirmDelete"
            );


        deleteButton.disabled =
            true;

        deleteButton.textContent =
            "Deleting...";


        /*
         * Delete Firestore document.
         */

        await deleteDoc(
            doc(
                db,
                "homeBanners",
                id
            )
        );


        /*
         * Delete Storage image if we
         * can identify its Firebase
         * storage path.
         *
         * Existing external URLs are
         * left untouched.
         */

        if (
            banner &&
            banner.storagePath
        ) {

            try {

                await deleteObject(
                    ref(
                        storage,
                        banner.storagePath
                    )
                );

            } catch (
                storageError
            ) {

                console.warn(
                    "Storage image could not be deleted:",
                    storageError
                );

            }

        }


        closeDeleteConfirmation();


        showToast(
            "Banner deleted."
        );


        await loadBanners();


    } catch (error) {

        console.error(
            "Delete banner error:",
            error
        );


        showToast(
            "Could not delete banner."
        );

    } finally {

        const deleteButton =
            document.getElementById(
                "confirmDelete"
            );


        deleteButton.disabled =
            false;

        deleteButton.textContent =
            "Delete";

    }

}


/* ============================================================
   CLOSE BANNER MODAL
============================================================ */

function closeBannerModal() {

    bannerModal.classList.add(
        "hidden"
    );


    editingBannerId =
        null;

    editingBannerImageUrl =
        "";

}


/* ============================================================
   MOBILE MENU
============================================================ */

function setupMobileMenu() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    document
        .getElementById(
            "mobileMenuButton"
        )
        .addEventListener(
            "click",
            () => {

                sidebar.classList.toggle(
                    "open"
                );

            }
        );


    navItems.forEach(
        item => {

            item.addEventListener(
                "click",
                () => {

                    sidebar.classList.remove(
                        "open"
                    );

                }
            );

        }
    );

}


/* ============================================================
   NEXT ORDER
============================================================ */

function getNextOrder() {

    if (
        !banners.length
    ) {

        return 1;

    }


    return Math.max(
        ...banners.map(
            banner =>
                Number(
                    banner.order ||
                    0
                )
        )
    ) + 1;

}


/* ============================================================
   FILE NAME
============================================================ */

function createSafeFileName(
    name
) {

    return name
        .toLowerCase()
        .replace(
            /[^a-z0-9.]+/g,
            "-"
        )
        .replace(
            /^-+|-+$/g,
            ""
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
            3000
        );

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

/* =========================================================
   ZENOVA EDUCATONS
   HOME BANNERS ADMIN
   ========================================================= */

import {
    auth,
    db,
    storage
} from "../../../firebase/firebase-config.js";


import {
    collection,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let banners = [];

let editingBannerId = null;

let selectedImageSource = "url";

let selectedImageFile = null;


/* =========================================================
   ELEMENTS
========================================================= */

const backButton =
    document.getElementById(
        "backButton"
    );


const addBannerButton =
    document.getElementById(
        "addBannerButton"
    );


const emptyAddButton =
    document.getElementById(
        "emptyAddButton"
    );


const modalOverlay =
    document.getElementById(
        "modalOverlay"
    );


const closeModalButton =
    document.getElementById(
        "closeModalButton"
    );


const cancelButton =
    document.getElementById(
        "cancelButton"
    );


const saveButton =
    document.getElementById(
        "saveButton"
    );


const modalTitle =
    document.getElementById(
        "modalTitle"
    );


const urlSourceButton =
    document.getElementById(
        "urlSourceButton"
    );


const uploadSourceButton =
    document.getElementById(
        "uploadSourceButton"
    );


const urlSource =
    document.getElementById(
        "urlSource"
    );


const uploadSource =
    document.getElementById(
        "uploadSource"
    );


const imageUrlInput =
    document.getElementById(
        "imageUrlInput"
    );


const imageFileInput =
    document.getElementById(
        "imageFileInput"
    );


const imagePreviewWrapper =
    document.getElementById(
        "imagePreviewWrapper"
    );


const imagePreview =
    document.getElementById(
        "imagePreview"
    );


const labelInput =
    document.getElementById(
        "labelInput"
    );


const titleInput =
    document.getElementById(
        "titleInput"
    );


const descriptionInput =
    document.getElementById(
        "descriptionInput"
    );


const buttonTextInput =
    document.getElementById(
        "buttonTextInput"
    );


const linkInput =
    document.getElementById(
        "linkInput"
    );


const priorityInput =
    document.getElementById(
        "priorityInput"
    );


const activeInput =
    document.getElementById(
        "activeInput"
    );


const bannerList =
    document.getElementById(
        "bannerList"
    );


const emptyState =
    document.getElementById(
        "emptyState"
    );


const statusFilter =
    document.getElementById(
        "statusFilter"
    );


const totalCount =
    document.getElementById(
        "totalCount"
    );


const activeCount =
    document.getElementById(
        "activeCount"
    );


const hiddenCount =
    document.getElementById(
        "hiddenCount"
    );


const toast =
    document.getElementById(
        "toast"
    );


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    user => {

        if (!user) {

            window.location.href =
                "../../login/";

            return;

        }


        currentUser =
            user;


        startBannerListener();

    }
);


/* =========================================================
   REALTIME BANNERS
========================================================= */

function startBannerListener() {

    const bannersRef =
        collection(
            db,
            "homeBanners"
        );


    onSnapshot(

        bannersRef,

        snapshot => {

            banners =
                snapshot.docs.map(
                    item => ({
                        id: item.id,
                        ...item.data()
                    })
                );


            sortBanners();

            renderStats();

            renderBanners();

        },

        error => {

            console.error(
                "Banner listener error:",
                error
            );

            showToast(
                "Unable to load banners."
            );

        }

    );

}


/* =========================================================
   SORT
========================================================= */

function sortBanners() {

    banners.sort(
        (a, b) => {

            const priorityA =
                Number(
                    a.priority ?? 999999
                );


            const priorityB =
                Number(
                    b.priority ?? 999999
                );


            if (
                priorityA !==
                priorityB
            ) {

                return (
                    priorityA -
                    priorityB
                );

            }


            const aTime =
                getTime(
                    a.createdAt
                );


            const bTime =
                getTime(
                    b.createdAt
                );


            return bTime - aTime;

        }
    );

}


/* =========================================================
   RENDER STATS
========================================================= */

function renderStats() {

    const total =
        banners.length;


    const active =
        banners.filter(
            banner =>
                banner.active === true
        ).length;


    const hidden =
        total - active;


    totalCount.textContent =
        total;


    activeCount.textContent =
        active;


    hiddenCount.textContent =
        hidden;

}


/* =========================================================
   RENDER BANNERS
========================================================= */

function renderBanners() {

    const filter =
        statusFilter.value;


    const filtered =
        banners.filter(
            banner => {

                if (
                    filter === "ACTIVE"
                ) {

                    return (
                        banner.active === true
                    );

                }


                if (
                    filter === "HIDDEN"
                ) {

                    return (
                        banner.active !== true
                    );

                }


                return true;

            }
        );


    bannerList.innerHTML =
        "";


    if (!filtered.length) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "empty-state";


        empty.innerHTML = `

            <div class="empty-icon">
                +
            </div>

            <h3>
                No banners found
            </h3>

            <p>
                Add a banner or change the filter.
            </p>

            <button
                class="primary-button"
                id="filteredAddButton"
                type="button"
            >
                Add Banner
            </button>

        `;


        bannerList.appendChild(
            empty
        );


        document
            .getElementById(
                "filteredAddButton"
            )
            ?.addEventListener(
                "click",
                openAddModal
            );


        return;

    }


    filtered.forEach(
        banner => {

            bannerList.appendChild(
                createBannerCard(
                    banner
                )
            );

        }
    );

}


/* =========================================================
   CREATE CARD
========================================================= */

function createBannerCard(
    banner
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "banner-card";


    const image =
        banner.imageUrl ||
        "";


    const label =
        banner.label ||
        "";


    const title =
        banner.title ||
        "Untitled Banner";


    const description =
        banner.description ||
        "No description";


    const active =
        banner.active === true;


    card.innerHTML = `

        <div class="banner-image-wrapper">

            ${
                image
                    ? `
                        <img
                            class="banner-image"
                            src="${escapeHtml(image)}"
                            alt="${escapeHtml(title)}"
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
                                color:#6d28d9;
                                font-weight:800;
                                font-size:28px;
                            "
                        >
                            Z
                        </div>
                    `
            }

        </div>


        <div class="banner-info">

            ${
                label
                    ? `
                        <span class="banner-label">
                            ${escapeHtml(label)}
                        </span>
                    `
                    : ""
            }


            <h3 class="banner-title">
                ${escapeHtml(title)}
            </h3>


            <p class="banner-description">
                ${escapeHtml(description)}
            </p>


            <div class="banner-meta">

                <span class="meta-pill">
                    Priority:
                    ${Number(banner.priority ?? 999)}
                </span>


                <span
                    class="
                        meta-pill
                        ${
                            active
                                ? "status-active"
                                : "status-hidden"
                        }
                    "
                >
                    ${
                        active
                            ? "ACTIVE"
                            : "HIDDEN"
                    }
                </span>

            </div>

        </div>


        <div class="banner-actions">

            <button
                class="action-button"
                data-action="toggle"
            >
                ${
                    active
                        ? "Hide"
                        : "Show"
                }
            </button>


            <button
                class="action-button"
                data-action="edit"
            >
                Edit
            </button>


            <button
                class="action-button delete"
                data-action="delete"
            >
                Delete
            </button>

        </div>

    `;


    card
        .querySelector(
            '[data-action="toggle"]'
        )
        .addEventListener(
            "click",
            () => {

                toggleBanner(
                    banner
                );

            }
        );


    card
        .querySelector(
            '[data-action="edit"]'
        )
        .addEventListener(
            "click",
            () => {

                openEditModal(
                    banner
                );

            }
        );


    card
        .querySelector(
            '[data-action="delete"]'
        )
        .addEventListener(
            "click",
            () => {

                deleteBanner(
                    banner
                );

            }
        );


    return card;

}


/* =========================================================
   OPEN ADD
========================================================= */

function openAddModal() {

    editingBannerId =
        null;


    modalTitle.textContent =
        "Add Banner";


    saveButton.textContent =
        "Save Banner";


    resetForm();


    modalOverlay.classList.remove(
        "hidden"
    );

}


/* =========================================================
   OPEN EDIT
========================================================= */

function openEditModal(
    banner
) {

    editingBannerId =
        banner.id;


    modalTitle.textContent =
        "Edit Banner";


    saveButton.textContent =
        "Update Banner";


    imageUrlInput.value =
        banner.imageUrl ||
        "";


    labelInput.value =
        banner.label ||
        "";


    titleInput.value =
        banner.title ||
        "";


    descriptionInput.value =
        banner.description ||
        "";


    buttonTextInput.value =
        banner.buttonText ||
        "";


    linkInput.value =
        banner.link ||
        "";


    priorityInput.value =
        Number(
            banner.priority ?? 1
        );


    activeInput.checked =
        banner.active === true;


    selectedImageSource =
        "url";


    selectedImageFile =
        null;


    setImageSource(
        "url"
    );


    if (banner.imageUrl) {

        showPreview(
            banner.imageUrl
        );

    } else {

        hidePreview();

    }


    modalOverlay.classList.remove(
        "hidden"
    );

}


/* =========================================================
   RESET FORM
========================================================= */

function resetForm() {

    imageUrlInput.value =
        "";


    imageFileInput.value =
        "";


    labelInput.value =
        "";


    titleInput.value =
        "";


    descriptionInput.value =
        "";


    buttonTextInput.value =
        "";


    linkInput.value =
        "";


    priorityInput.value =
        "1";


    activeInput.checked =
        true;


    selectedImageSource =
        "url";


    selectedImageFile =
        null;


    setImageSource(
        "url"
    );


    hidePreview();

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal() {

    modalOverlay.classList.add(
        "hidden"
    );


    editingBannerId =
        null;

}


closeModalButton.addEventListener(
    "click",
    closeModal
);


cancelButton.addEventListener(
    "click",
    closeModal
);


modalOverlay.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            modalOverlay
        ) {

            closeModal();

        }

    }
);


/* =========================================================
   IMAGE SOURCE
========================================================= */

urlSourceButton.addEventListener(
    "click",
    () => {

        setImageSource(
            "url"
        );

    }
);


uploadSourceButton.addEventListener(
    "click",
    () => {

        setImageSource(
            "upload"
        );

    }
);


function setImageSource(
    source
) {

    selectedImageSource =
        source;


    if (
        source === "url"
    ) {

        urlSourceButton.classList.add(
            "active"
        );

        uploadSourceButton.classList.remove(
            "active"
        );


        urlSource.classList.remove(
            "hidden"
        );

        uploadSource.classList.add(
            "hidden"
        );


    } else {

        uploadSourceButton.classList.add(
            "active"
        );

        urlSourceButton.classList.remove(
            "active"
        );


        uploadSource.classList.remove(
            "hidden"
        );

        urlSource.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   URL PREVIEW
========================================================= */

imageUrlInput.addEventListener(
    "input",
    () => {

        const url =
            imageUrlInput.value.trim();


        if (!url) {

            hidePreview();

            return;

        }


        showPreview(
            url
        );

    }
);


/* =========================================================
   FILE PREVIEW
========================================================= */

imageFileInput.addEventListener(
    "change",
    event => {

        const file =
            event.target.files?.[0];


        if (!file) {

            selectedImageFile =
                null;

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

            imageFileInput.value =
                "";

            return;

        }


        selectedImageFile =
            file;


        const objectUrl =
            URL.createObjectURL(
                file
            );


        showPreview(
            objectUrl
        );

    }
);


/* =========================================================
   PREVIEW
========================================================= */

function showPreview(
    url
) {

    if (!url) {
        return;
    }


    imagePreview.src =
        url;


    imagePreviewWrapper.classList.remove(
        "hidden"
    );


    imagePreview.onerror =
        () => {

            hidePreview();

            showToast(
                "Unable to preview image."
            );

        };

}


function hidePreview() {

    imagePreviewWrapper.classList.add(
        "hidden"
    );


    imagePreview.src =
        "";

}


/* =========================================================
   SAVE
========================================================= */

saveButton.addEventListener(
    "click",
    saveBanner
);


async function saveBanner() {

    if (!currentUser) {

        showToast(
            "Please sign in again."
        );

        return;

    }


    const title =
        titleInput.value.trim();


    if (!title) {

        showToast(
            "Please enter a banner title."
        );

        titleInput.focus();

        return;

    }


    let imageUrl =
        imageUrlInput.value.trim();


    /*
     * Upload image if selected.
     */

    try {

        saveButton.disabled =
            true;


        saveButton.textContent =
            "Saving...";


        if (
            selectedImageSource ===
            "upload"
        ) {

            if (
                !selectedImageFile
            ) {

                showToast(
                    "Please select an image."
                );

                saveButton.disabled =
                    false;

                saveButton.textContent =
                    editingBannerId
                        ? "Update Banner"
                        : "Save Banner";

                return;

            }


            imageUrl =
                await uploadBannerImage(
                    selectedImageFile
                );

        }


        if (!imageUrl) {

            showToast(
                "Please add a banner image."
            );

            saveButton.disabled =
                false;

            saveButton.textContent =
                editingBannerId
                    ? "Update Banner"
                    : "Save Banner";

            return;

        }


        const bannerData = {

            imageUrl,

            title,

            label:
                labelInput.value.trim(),

            description:
                descriptionInput.value.trim(),

            buttonText:
                buttonTextInput.value.trim(),

            link:
                linkInput.value.trim(),

            priority:
                Number(
                    priorityInput.value
                ) || 1,

            active:
                activeInput.checked,

            updatedAt:
                serverTimestamp(),

            updatedBy:
                currentUser.uid

        };


        /*
         * UPDATE
         */

        if (
            editingBannerId
        ) {

            await updateDoc(
                doc(
                    db,
                    "homeBanners",
                    editingBannerId
                ),
                bannerData
            );


            showToast(
                "Banner updated successfully."
            );


        }

        /*
         * CREATE
         */

        else {

            await addDoc(
                collection(
                    db,
                    "homeBanners"
                ),
                {

                    ...bannerData,

                    createdAt:
                        serverTimestamp(),

                    createdBy:
                        currentUser.uid

                }
            );


            showToast(
                "Banner added successfully."
            );

        }


        closeModal();


    } catch (error) {

        console.error(
            "SAVE BANNER ERROR:",
            error
        );


        showToast(
            getReadableError(
                error
            )
        );

    } finally {

        saveButton.disabled =
            false;


        saveButton.textContent =
            editingBannerId
                ? "Update Banner"
                : "Save Banner";

    }

}


/* =========================================================
   UPLOAD IMAGE
========================================================= */

async function uploadBannerImage(
    file
) {

    const extension =
        getExtension(
            file.name
        );


    const fileName =
        `${Date.now()}_${randomString(8)}.${extension}`;


    const storagePath =
        `home/banners/${fileName}`;


    const storageRef =
        ref(
            storage,
            storagePath
        );


    await uploadBytes(
        storageRef,
        file
    );


    const url =
        await getDownloadURL(
            storageRef
        );


    return url;

}


/* =========================================================
   TOGGLE
========================================================= */

async function toggleBanner(
    banner
) {

    try {

        await updateDoc(

            doc(
                db,
                "homeBanners",
                banner.id
            ),

            {

                active:
                    banner.active !== true,

                updatedAt:
                    serverTimestamp(),

                updatedBy:
                    currentUser.uid

            }

        );


        showToast(
            banner.active === true
                ? "Banner hidden."
                : "Banner is now active."
        );


    } catch (error) {

        console.error(
            "TOGGLE BANNER ERROR:",
            error
        );


        showToast(
            getReadableError(
                error
            )
        );

    }

}


/* =========================================================
   DELETE
========================================================= */

async function deleteBanner(
    banner
) {

    const confirmed =
        window.confirm(
            "Delete this banner permanently?"
        );


    if (!confirmed) {
        return;
    }


    try {

        /*
         * Delete Firestore document.
         */

        await deleteDoc(
            doc(
                db,
                "homeBanners",
                banner.id
            )
        );


        /*
         * Try to delete Firebase Storage
         * image if it belongs to our
         * home/banners/ folder.
         *
         * If image was a URL from another
         * source, simply ignore this.
         */

        if (
            banner.imageUrl &&
            banner.imageUrl.includes(
                "firebasestorage.googleapis.com"
            )
        ) {

            try {

                const storageRef =
                    ref(
                        storage,
                        banner.imageUrl
                    );


                await deleteObject(
                    storageRef
                );

            } catch (storageError) {

                console.warn(
                    "Storage image could not be deleted:",
                    storageError
                );

            }

        }


        showToast(
            "Banner deleted."
        );


    } catch (error) {

        console.error(
            "DELETE BANNER ERROR:",
            error
        );


        showToast(
            getReadableError(
                error
            )
        );

    }

}


/* =========================================================
   FILTER
========================================================= */

statusFilter.addEventListener(
    "change",
    renderBanners
);


/* =========================================================
   ADD BUTTONS
========================================================= */

addBannerButton.addEventListener(
    "click",
    openAddModal
);


emptyAddButton.addEventListener(
    "click",
    openAddModal
);


/* =========================================================
   BACK
========================================================= */

backButton.addEventListener(
    "click",
    () => {

        window.history.back();

    }
);


/* =========================================================
   TOAST
========================================================= */

let toastTimeout;


function showToast(
    message
) {

    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimeout
    );


    toastTimeout =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2800
        );

}


/* =========================================================
   HELPERS
========================================================= */

function getTime(
    timestamp
) {

    if (
        !timestamp
    ) {
        return 0;
    }


    if (
        typeof timestamp.toMillis ===
        "function"
    ) {

        return timestamp.toMillis();

    }


    if (
        timestamp.seconds
    ) {

        return (
            timestamp.seconds *
            1000
        );

    }


    return 0;

}


function getExtension(
    fileName
) {

    const parts =
        fileName.split(".");


    return (
        parts.pop() ||
        "jpg"
    ).toLowerCase();

}


function randomString(
    length
) {

    const chars =
        "abcdefghijklmnopqrstuvwxyz0123456789";


    let result =
        "";


    for (
        let i = 0;
        i < length;
        i++
    ) {

        result +=
            chars[
                Math.floor(
                    Math.random() *
                    chars.length
                )
            ];

    }


    return result;

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


function getReadableError(
    error
) {

    if (
        error?.code ===
        "permission-denied"
    ) {

        return (
            "You do not have permission to manage banners."
        );

    }


    if (
        error?.code ===
        "storage/unauthorized"
    ) {

        return (
            "You do not have permission to upload this image."
        );

    }


    if (
        error?.code ===
        "storage/canceled"
    ) {

        return (
            "Image upload was cancelled."
        );

    }


    return (
        error?.message ||
        "Something went wrong."
    );

  }

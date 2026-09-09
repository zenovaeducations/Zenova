import {
    auth,
    db,
    storage
} from "../../../firebase/firebase-config.js";

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    serverTimestamp,
    query,
    orderBy
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


/* =====================================
   ELEMENTS
===================================== */

const bannerGrid =
    document.getElementById("bannerGrid");

const emptyState =
    document.getElementById("emptyState");

const totalCount =
    document.getElementById("totalCount");

const activeCount =
    document.getElementById("activeCount");

const inactiveCount =
    document.getElementById("inactiveCount");

const searchInput =
    document.getElementById("searchInput");

const statusFilter =
    document.getElementById("statusFilter");

const addBannerBtn =
    document.getElementById("addBannerBtn");

const emptyAddBtn =
    document.getElementById("emptyAddBtn");

const modal =
    document.getElementById("bannerModal");

const closeModal =
    document.getElementById("closeModal");

const cancelBtn =
    document.getElementById("cancelBtn");

const bannerForm =
    document.getElementById("bannerForm");

const modalTitle =
    document.getElementById("modalTitle");

const bannerId =
    document.getElementById("bannerId");

const imageInput =
    document.getElementById("imageInput");

const uploadArea =
    document.getElementById("uploadArea");

const uploadPlaceholder =
    document.getElementById("uploadPlaceholder");

const imagePreview =
    document.getElementById("imagePreview");

const imageStatus =
    document.getElementById("imageStatus");

const labelInput =
    document.getElementById("label");

const titleInput =
    document.getElementById("title");

const descriptionInput =
    document.getElementById("description");

const buttonTextInput =
    document.getElementById("buttonText");

const linkInput =
    document.getElementById("link");

const priorityInput =
    document.getElementById("priority");

const activeInput =
    document.getElementById("active");

const saveBtn =
    document.getElementById("saveBtn");

const backBtn =
    document.getElementById("backBtn");


/* =====================================
   STATE
===================================== */

let currentUser = null;

let banners = [];

let editingBanner = null;

let selectedImageFile = null;


/* =====================================
   AUTH
===================================== */

onAuthStateChanged(auth, user => {

    if (!user) {

        window.location.href =
            "../../login/index.html";

        return;
    }

    currentUser = user;

    startBannerListener();

});


/* =====================================
   FIRESTORE LISTENER
===================================== */

function startBannerListener() {

    const bannersRef =
        collection(db, "homeBanners");

    const bannersQuery =
        query(
            bannersRef,
            orderBy("priority", "asc")
        );

    onSnapshot(
        bannersQuery,
        snapshot => {

            banners = snapshot.docs.map(
                item => ({
                    id: item.id,
                    ...item.data()
                })
            );

            updateSummary();

            renderBanners();

        },
        error => {

            console.error(
                "Banner listener error:",
                error
            );

            alert(
                "Unable to load banners."
            );

        }
    );

}


/* =====================================
   SUMMARY
===================================== */

function updateSummary() {

    const total =
        banners.length;

    const active =
        banners.filter(
            banner => banner.active === true
        ).length;

    const inactive =
        total - active;

    totalCount.textContent =
        total;

    activeCount.textContent =
        active;

    inactiveCount.textContent =
        inactive;

}


/* =====================================
   RENDER
===================================== */

function renderBanners() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();

    const status =
        statusFilter.value;

    let filtered =
        banners.filter(banner => {

            const matchesSearch =
                !search ||
                String(banner.title || "")
                    .toLowerCase()
                    .includes(search) ||
                String(banner.label || "")
                    .toLowerCase()
                    .includes(search) ||
                String(banner.description || "")
                    .toLowerCase()
                    .includes(search);

            const matchesStatus =
                status === "ALL" ||
                (
                    status === "ACTIVE" &&
                    banner.active === true
                ) ||
                (
                    status === "INACTIVE" &&
                    banner.active !== true
                );

            return matchesSearch &&
                   matchesStatus;

        });


    bannerGrid.innerHTML = "";


    if (filtered.length === 0) {

        bannerGrid.style.display = "none";

        emptyState.style.display = "flex";

        return;
    }


    emptyState.style.display = "none";

    bannerGrid.style.display = "grid";


    filtered.forEach(banner => {

        const card =
            createBannerCard(banner);

        bannerGrid.appendChild(card);

    });

}


/* =====================================
   CREATE CARD
===================================== */

function createBannerCard(banner) {

    const card =
        document.createElement("article");

    card.className =
        "banner-card";


    const image =
        escapeAttribute(
            banner.imageUrl || ""
        );

    const label =
        escapeHtml(
            banner.label || ""
        );

    const title =
        escapeHtml(
            banner.title || "Untitled Banner"
        );

    const description =
        escapeHtml(
            banner.description || ""
        );

    const priority =
        Number(banner.priority || 1);

    const active =
        banner.active === true;


    card.innerHTML = `

        <div class="banner-image-wrapper">

            <img
                class="banner-image"
                src="${image}"
                alt="${title}"
            >

            <div class="priority-badge">
                Priority ${priority}
            </div>

        </div>


        <div class="banner-body">

            <div class="banner-top">

                <div>

                    ${
                        label
                        ? `<span class="banner-label">
                            ${label}
                           </span>`
                        : ""
                    }

                    <div class="banner-title">
                        ${title}
                    </div>

                </div>


                <span class="status ${
                    active
                    ? "active"
                    : "inactive"
                }">

                    ${
                        active
                        ? "ACTIVE"
                        : "INACTIVE"
                    }

                </span>

            </div>


            <p class="banner-description">
                ${description}
            </p>


            <div class="banner-footer">

                <small>
                    ${
                        banner.buttonText
                        ? escapeHtml(
                            banner.buttonText
                        )
                        : "No button"
                    }
                </small>


                <div class="banner-actions">

                    <button
                        class="icon-btn"
                        data-action="toggle"
                        title="${
                            active
                            ? "Hide"
                            : "Show"
                        }"
                    >
                        ${
                            active
                            ? "◉"
                            : "○"
                        }
                    </button>


                    <button
                        class="icon-btn"
                        data-action="edit"
                        title="Edit"
                    >
                        ✎
                    </button>


                    <button
                        class="icon-btn delete"
                        data-action="delete"
                        title="Delete"
                    >
                        ×
                    </button>

                </div>

            </div>

        </div>

    `;


    card.querySelector(
        '[data-action="toggle"]'
    ).addEventListener(
        "click",
        () => toggleBanner(banner)
    );


    card.querySelector(
        '[data-action="edit"]'
    ).addEventListener(
        "click",
        () => openEditModal(banner)
    );


    card.querySelector(
        '[data-action="delete"]'
    ).addEventListener(
        "click",
        () => deleteBanner(banner)
    );


    return card;

}


/* =====================================
   OPEN ADD
===================================== */

function openAddModal() {

    editingBanner = null;

    selectedImageFile = null;

    bannerForm.reset();

    bannerId.value = "";

    modalTitle.textContent =
        "Add Banner";

    saveBtn.textContent =
        "Save Banner";

    priorityInput.value = "1";

    activeInput.checked = true;

    resetImagePreview();

    imageStatus.textContent =
        "Image is required for a new banner.";

    modal.classList.add("show");

}


/* =====================================
   OPEN EDIT
===================================== */

function openEditModal(banner) {

    editingBanner = banner;

    selectedImageFile = null;

    bannerId.value =
        banner.id;

    labelInput.value =
        banner.label || "";

    titleInput.value =
        banner.title || "";

    descriptionInput.value =
        banner.description || "";

    buttonTextInput.value =
        banner.buttonText || "";

    linkInput.value =
        banner.link || "";

    priorityInput.value =
        banner.priority || 1;

    activeInput.checked =
        banner.active !== false;


    modalTitle.textContent =
        "Edit Banner";

    saveBtn.textContent =
        "Update Banner";


    if (banner.imageUrl) {

        imagePreview.src =
            banner.imageUrl;

        imagePreview.classList.add(
            "show"
        );

        uploadPlaceholder.style.display =
            "none";

        imageStatus.textContent =
            "Current banner image";

    } else {

        resetImagePreview();

    }


    modal.classList.add("show");

}


/* =====================================
   CLOSE MODAL
===================================== */

function closeBannerModal() {

    modal.classList.remove(
        "show"
    );

    editingBanner = null;

    selectedImageFile = null;

}


/* =====================================
   IMAGE
===================================== */

uploadArea.addEventListener(
    "click",
    () => imageInput.click()
);


imageInput.addEventListener(
    "change",
    event => {

        const file =
            event.target.files?.[0];

        if (!file) return;


        const allowedTypes = [
            "image/png",
            "image/jpeg",
            "image/webp"
        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            alert(
                "Please upload PNG, JPG or WEBP."
            );

            imageInput.value = "";

            return;
        }


        if (
            file.size >
            10 * 1024 * 1024
        ) {

            alert(
                "Image must be smaller than 10 MB."
            );

            imageInput.value = "";

            return;
        }


        selectedImageFile =
            file;


        const previewUrl =
            URL.createObjectURL(file);

        imagePreview.src =
            previewUrl;

        imagePreview.classList.add(
            "show"
        );

        uploadPlaceholder.style.display =
            "none";

        imageStatus.textContent =
            file.name;

    }
);


/* =====================================
   SAVE
===================================== */

bannerForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!currentUser) {

            alert(
                "Please login first."
            );

            return;
        }


        const title =
            titleInput.value.trim();


        if (!title) {

            alert(
                "Please enter a banner title."
            );

            return;
        }


        if (
            !editingBanner &&
            !selectedImageFile
        ) {

            alert(
                "Please upload a banner image."
            );

            return;
        }


        saveBtn.disabled = true;

        saveBtn.textContent =
            editingBanner
            ? "Updating..."
            : "Saving...";


        try {

            let imageUrl =
                editingBanner?.imageUrl || "";

            let storagePath =
                editingBanner?.storagePath || "";


            /* -------------------------
               Upload new image
            -------------------------- */

            if (selectedImageFile) {

                const safeName =
                    selectedImageFile.name
                        .replace(
                            /[^a-zA-Z0-9._-]/g,
                            "_"
                        );


                const uniqueName =
                    `${Date.now()}_${safeName}`;


                storagePath =
                    `home-banners/${uniqueName}`;


                const storageRef =
                    ref(
                        storage,
                        storagePath
                    );


                await uploadBytes(
                    storageRef,
                    selectedImageFile
                );


                imageUrl =
                    await getDownloadURL(
                        storageRef
                    );


                /* Delete old image */

                if (
                    editingBanner?.storagePath
                ) {

                    try {

                        await deleteObject(
                            ref(
                                storage,
                                editingBanner.storagePath
                            )
                        );

                    } catch (error) {

                        console.warn(
                            "Old image could not be deleted:",
                            error
                        );

                    }

                }

            }


            const data = {

                imageUrl,

                storagePath,

                label:
                    labelInput.value.trim(),

                title,

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


            /* -------------------------
               Update
            -------------------------- */

            if (editingBanner) {

                await updateDoc(
                    doc(
                        db,
                        "homeBanners",
                        editingBanner.id
                    ),
                    data
                );

            }

            /* -------------------------
               Create
            -------------------------- */

            else {

                await addDoc(
                    collection(
                        db,
                        "homeBanners"
                    ),
                    {
                        ...data,

                        createdAt:
                            serverTimestamp(),

                        createdBy:
                            currentUser.uid
                    }
                );

            }


            closeBannerModal();

        } catch (error) {

            console.error(
                "Banner save error:",
                error
            );

            alert(
                "Unable to save banner. Please try again."
            );

        } finally {

            saveBtn.disabled = false;

            saveBtn.textContent =
                editingBanner
                ? "Update Banner"
                : "Save Banner";

        }

    }
);


/* =====================================
   TOGGLE
===================================== */

async function toggleBanner(banner) {

    if (!currentUser) return;


    try {

        await updateDoc(
            doc(
                db,
                "homeBanners",
                banner.id
            ),
            {
                active:
                    !banner.active,

                updatedAt:
                    serverTimestamp(),

                updatedBy:
                    currentUser.uid
            }
        );

    } catch (error) {

        console.error(error);

        alert(
            "Unable to change banner status."
        );

    }

}


/* =====================================
   DELETE
===================================== */

async function deleteBanner(banner) {

    const confirmed =
        confirm(
            `Delete "${banner.title || "this banner"}"?\n\nThis action cannot be undone.`
        );


    if (!confirmed) return;


    try {

        /* Delete Firestore */

        await deleteDoc(
            doc(
                db,
                "homeBanners",
                banner.id
            )
        );


        /* Delete Storage image */

        if (banner.storagePath) {

            try {

                await deleteObject(
                    ref(
                        storage,
                        banner.storagePath
                    )
                );

            } catch (error) {

                console.warn(
                    "Storage image could not be deleted:",
                    error
                );

            }

        }

    } catch (error) {

        console.error(
            "Delete banner error:",
            error
        );

        alert(
            "Unable to delete banner."
        );

    }

}


/* =====================================
   RESET IMAGE
===================================== */

function resetImagePreview() {

    imagePreview.src = "";

    imagePreview.classList.remove(
        "show"
    );

    uploadPlaceholder.style.display =
        "flex";

    imageStatus.textContent =
        "";

    imageInput.value = "";

}


/* =====================================
   EVENTS
===================================== */

addBannerBtn.addEventListener(
    "click",
    openAddModal
);

emptyAddBtn.addEventListener(
    "click",
    openAddModal
);

closeModal.addEventListener(
    "click",
    closeBannerModal
);

cancelBtn.addEventListener(
    "click",
    closeBannerModal
);


modal.addEventListener(
    "click",
    event => {

        if (
            event.target === modal
        ) {

            closeBannerModal();

        }

    }
);


searchInput.addEventListener(
    "input",
    renderBanners
);

statusFilter.addEventListener(
    "change",
    renderBanners
);


backBtn.addEventListener(
    "click",
    () => {

        if (
            window.history.length > 1
        ) {

            window.history.back();

        } else {

            window.location.href =
                "../../index.html";

        }

    }
);


/* =====================================
   ESCAPE
===================================== */

function escapeHtml(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function escapeAttribute(value) {

    return escapeHtml(value);

}

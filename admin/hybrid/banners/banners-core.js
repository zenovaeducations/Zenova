import {
    auth,
    db
} from "../../../firebase/firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =====================================================
   ELEMENTS
===================================================== */

const loader =
    document.getElementById("loader");

const app =
    document.getElementById("app");

const bannerList =
    document.getElementById("bannerList");

const emptyState =
    document.getElementById("emptyState");

const modal =
    document.getElementById("modal");

const bannerForm =
    document.getElementById("bannerForm");

const modalTitle =
    document.getElementById("modalTitle");

const imageUrl =
    document.getElementById("imageUrl");

const link =
    document.getElementById("link");

const label =
    document.getElementById("label");

const title =
    document.getElementById("title");

const description =
    document.getElementById("description");

const priority =
    document.getElementById("priority");

const active =
    document.getElementById("active");

const imagePreview =
    document.getElementById("imagePreview");

const previewPlaceholder =
    document.getElementById(
        "previewPlaceholder"
    );

const formError =
    document.getElementById("formError");


/* =====================================================
   STATE
===================================================== */

let currentUser = null;
let editingBannerId = null;
let banners = [];


/* =====================================================
   AUTH
===================================================== */

onAuthStateChanged(
    auth,
    user => {

        if (!user) {

            window.location.replace(
                "../../index.html"
            );

            return;
        }

        currentUser = user;

        loader.classList.add("hidden");
        app.classList.remove("hidden");

        startBannerListener();
    }
);


/* =====================================================
   REALTIME FIREBASE LISTENER
===================================================== */

function startBannerListener() {

    onSnapshot(
        collection(
            db,
            "hybridBanners"
        ),

        snapshot => {

            banners =
                snapshot.docs.map(
                    document => ({
                        id: document.id,
                        ...document.data()
                    })
                );


            banners.sort(
                (a, b) =>
                    Number(
                        b.priority || 0
                    ) -
                    Number(
                        a.priority || 0
                    )
            );


            renderBanners();

        },

        error => {

            console.error(
                "BANNER REALTIME ERROR:",
                error
            );

            bannerList.innerHTML = `
                <div class="empty-state">
                    <strong>
                        Unable to load banners
                    </strong>

                    <p>
                        ${escapeHtml(
                            error.message ||
                            "Firestore error"
                        )}
                    </p>
                </div>
            `;
        }
    );
}


/* =====================================================
   RENDER
===================================================== */

function renderBanners() {

    const visible =
        banners.filter(
            banner =>
                banner.active !== false
        );


    if (!banners.length) {

        bannerList.innerHTML = "";

        emptyState.classList.remove(
            "hidden"
        );

        return;
    }


    emptyState.classList.add(
        "hidden"
    );


    bannerList.innerHTML =
        banners.map(
            banner => {

                const isActive =
                    banner.active !== false;

                return `

                    <article
                        class="banner-card"
                    >

                        <div
                            class="banner-image"
                        >

                            <img
                                src="${escapeAttr(
                                    banner.imageUrl || ""
                                )}"
                                alt="${escapeAttr(
                                    banner.title || "Banner"
                                )}"
                            >

                            <span
                                class="
                                    banner-status
                                    ${isActive ? "" : "inactive"}
                                "
                            >
                                ${
                                    isActive
                                        ? "PUBLISHED"
                                        : "HIDDEN"
                                }
                            </span>

                        </div>


                        <div
                            class="banner-info"
                        >

                            <div
                                class="banner-main"
                            >

                                <h3>
                                    ${escapeHtml(
                                        banner.title ||
                                        "Untitled Banner"
                                    )}
                                </h3>

                                <p>
                                    ${escapeHtml(
                                        banner.link ||
                                        "No redirect link"
                                    )}
                                </p>

                                <div
                                    class="banner-meta"
                                >
                                    <span>
                                        PRIORITY:
                                        ${
                                            Number(
                                                banner.priority || 1
                                            )
                                        }
                                    </span>

                                    ${
                                        banner.label
                                            ? `
                                                <span>
                                                    ${escapeHtml(
                                                        banner.label
                                                    )}
                                                </span>
                                            `
                                            : ""
                                    }
                                </div>

                            </div>


                            <div
                                class="banner-actions"
                            >

                                <button
                                    class="action-button"
                                    data-edit="${banner.id}"
                                    type="button"
                                >
                                    EDIT
                                </button>

                                <button
                                    class="
                                        action-button
                                        delete
                                    "
                                    data-delete="${banner.id}"
                                    type="button"
                                >
                                    DELETE
                                </button>

                            </div>

                        </div>

                    </article>

                `;
            }
        ).join("");


    attachBannerEvents();
}


/* =====================================================
   EVENTS
===================================================== */

function attachBannerEvents() {

    document
        .querySelectorAll(
            "[data-edit]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openEditModal(
                            button.dataset.edit
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            "[data-delete]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteBanner(
                            button.dataset.delete
                        );

                    }
                );

            }
        );
}


/* =====================================================
   ADD
===================================================== */

function openAddModal() {

    editingBannerId = null;

    modalTitle.textContent =
        "Add Banner";

    bannerForm.reset();

    priority.value = "1";
    active.checked = true;

    clearPreview();
    hideError();

    modal.classList.remove(
        "hidden"
    );

}


/* =====================================================
   EDIT
===================================================== */

function openEditModal(id) {

    const banner =
        banners.find(
            item =>
                item.id === id
        );

    if (!banner) {
        return;
    }


    editingBannerId = id;

    modalTitle.textContent =
        "Edit Banner";


    imageUrl.value =
        banner.imageUrl || "";

    link.value =
        banner.link || "";

    label.value =
        banner.label || "";

    title.value =
        banner.title || "";

    description.value =
        banner.description || "";

    priority.value =
        banner.priority || 1;

    active.checked =
        banner.active !== false;


    updatePreview();

    hideError();

    modal.classList.remove(
        "hidden"
    );
}


/* =====================================================
   SAVE
===================================================== */

bannerForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        hideError();


        const image =
            imageUrl.value.trim();

        const redirect =
            link.value.trim();

        const bannerTitle =
            title.value.trim();

        const bannerLabel =
            label.value.trim();

        const bannerDescription =
            description.value.trim();

        const bannerPriority =
            Number(
                priority.value
            );

        const bannerActive =
            active.checked;


        if (!isValidImageUrl(image)) {

            showError(
                "Please enter a valid image URL."
            );

            return;
        }


        if (
            redirect &&
            !isValidLink(redirect)
        ) {

            showError(
                "Please enter a valid redirect link."
            );

            return;
        }


        if (
            !Number.isFinite(
                bannerPriority
            ) ||
            bannerPriority < 1
        ) {

            showError(
                "Enter a valid priority."
            );

            return;
        }


        const saveButton =
            document.getElementById(
                "saveButton"
            );


        saveButton.disabled = true;
        saveButton.textContent =
            "SAVING...";


        try {

            const data = {

                imageUrl:
                    image,

                link:
                    redirect,

                title:
                    bannerTitle,

                description:
                    bannerDescription,

                label:
                    bannerLabel,

                priority:
                    bannerPriority,

                active:
                    bannerActive,

                updatedAt:
                    serverTimestamp(),

                updatedBy:
                    currentUser.uid

            };


            if (editingBannerId) {

                await updateDoc(
                    doc(
                        db,
                        "hybridBanners",
                        editingBannerId
                    ),
                    data
                );

            } else {

                await addDoc(
                    collection(
                        db,
                        "hybridBanners"
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


            closeModal();

        } catch (error) {

            console.error(
                "SAVE BANNER ERROR:",
                error
            );

            showError(
                error.message ||
                "Could not save banner."
            );

        } finally {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "SAVE BANNER";
        }

    }
);


/* =====================================================
   DELETE
===================================================== */

async function deleteBanner(id) {

    const banner =
        banners.find(
            item =>
                item.id === id
        );

    if (!banner) {
        return;
    }


    const confirmed =
        confirm(
            `Delete "${banner.title || "this banner"}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        await deleteDoc(
            doc(
                db,
                "hybridBanners",
                id
            )
        );

    } catch (error) {

        console.error(
            "DELETE BANNER ERROR:",
            error
        );

        alert(
            error.message ||
            "Could not delete banner."
        );
    }
}


/* =====================================================
   PREVIEW
===================================================== */

imageUrl.addEventListener(
    "input",
    updatePreview
);


function updatePreview() {

    const url =
        imageUrl.value.trim();


    if (!url) {

        clearPreview();

        return;
    }


    imagePreview.src =
        url;

    imagePreview.style.display =
        "block";

    previewPlaceholder.style.display =
        "none";


    imagePreview.onerror =
        () => {

            clearPreview();

            showError(
                "The image could not be loaded."
            );

        };
}


function clearPreview() {

    imagePreview.removeAttribute(
        "src"
    );

    imagePreview.style.display =
        "none";

    previewPlaceholder.style.display =
        "grid";
}


/* =====================================================
   MODAL
===================================================== */

function closeModal() {

    modal.classList.add(
        "hidden"
    );

    editingBannerId = null;

}


document
    .getElementById("addBannerButton")
    .addEventListener(
        "click",
        openAddModal
    );


document
    .getElementById("emptyAddButton")
    .addEventListener(
        "click",
        openAddModal
    );


document
    .getElementById("closeModal")
    .addEventListener(
        "click",
        closeModal
    );


document
    .getElementById("cancelButton")
    .addEventListener(
        "click",
        closeModal
    );


document
    .getElementById("backButton")
    .addEventListener(
        "click",
        () => {

            window.location.href =
                "../";

        }
    );


modal.addEventListener(
    "click",
    event => {

        if (
            event.target === modal
        ) {
            closeModal();
        }

    }
);


/* =====================================================
   VALIDATION
===================================================== */

function isValidImageUrl(value) {

    try {

        const url =
            new URL(value);

        return (
            url.protocol === "https:" ||
            url.protocol === "http:"
        );

    } catch {

        return false;
    }
}


function isValidLink(value) {

    /*
     * Allow normal website URLs.
     */
    try {

        const url =
            new URL(
                value,
                window.location.origin
            );

        return (
            url.protocol === "https:" ||
            url.protocol === "http:"
        );

    } catch {

        return false;
    }
}


/* =====================================================
   ERROR
===================================================== */

function showError(message) {

    formError.textContent =
        message;

    formError.classList.remove(
        "hidden"
    );
}


function hideError() {

    formError.textContent =
        "";

    formError.classList.add(
        "hidden"
    );
}


/* =====================================================
   ESCAPE
===================================================== */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function escapeAttr(value) {

    return escapeHtml(value);
}

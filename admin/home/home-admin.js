import {
    db,
    storage
} from "../../firebase/firebase-config.js";

import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";


/* ============================================================
   ELEMENTS
============================================================ */

const bannerList =
    document.getElementById("bannerList");

const bannerLoading =
    document.getElementById("bannerLoading");

const bannerEmpty =
    document.getElementById("bannerEmpty");

const modal =
    document.getElementById("bannerModal");

const form =
    document.getElementById("bannerForm");

const imageInput =
    document.getElementById("bannerImage");

const imagePreview =
    document.getElementById("imagePreview");

const uploadPlaceholder =
    document.getElementById("uploadPlaceholder");

const modalTitle =
    document.getElementById("modalTitle");

const firebaseDot =
    document.getElementById("firebaseDot");

const firebaseText =
    document.getElementById("firebaseText");


let editingBannerId = null;
let editingBannerImage = null;


/* ============================================================
   START
============================================================ */

loadBanners();


/* ============================================================
   LOAD BANNERS
============================================================ */

async function loadBanners() {

    showLoading();


    try {

        const bannersRef =
            collection(
                db,
                "homeBanners"
            );


        const bannersQuery =
            query(
                bannersRef,
                orderBy(
                    "order",
                    "asc"
                )
            );


        const snapshot =
            await getDocs(
                bannersQuery
            );


        const banners =
            snapshot.docs.map(
                item => ({
                    id: item.id,
                    ...item.data()
                })
            );


        setFirebaseConnected();


        renderBanners(
            banners
        );


    } catch (error) {

        console.error(
            "Unable to load banners:",
            error
        );


        setFirebaseError();


        hideLoading();


        bannerList.classList.add(
            "hidden"
        );


        bannerEmpty.classList.remove(
            "hidden"
        );


        bannerEmpty.querySelector(
            "h3"
        ).textContent =
            "Unable to load banners";


        bannerEmpty.querySelector(
            "p"
        ).textContent =
            "Check your Firebase configuration and Firestore permissions.";

    }

}


/* ============================================================
   RENDER
============================================================ */

function renderBanners(
    banners
) {

    hideLoading();


    bannerList.innerHTML = "";


    if (
        banners.length === 0
    ) {

        bannerList.classList.add(
            "hidden"
        );

        bannerEmpty.classList.remove(
            "hidden"
        );

        return;

    }


    bannerEmpty.classList.add(
        "hidden"
    );

    bannerList.classList.remove(
        "hidden"
    );


    banners.forEach(
        banner => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "banner-row";


            row.innerHTML = `

                <div class="banner-thumb">

                    <img
                        src="${escapeAttr(
                            banner.imageUrl || ""
                        )}"
                        alt=""
                    >

                </div>


                <div class="banner-info">

                    <span>
                        ORDER ${Number(
                            banner.order || 0
                        )}
                    </span>

                    <h3>
                        ${escapeHtml(
                            banner.title || ""
                        )}
                    </h3>

                    ${
                        banner.description
                            ? `
                                <p>
                                    ${escapeHtml(
                                        banner.description
                                    )}
                                </p>
                            `
                            : ""
                    }


                    <div
                        class="banner-status ${
                            banner.active
                                ? "active"
                                : "disabled"
                        }"
                    >

                        ${
                            banner.active
                                ? "ACTIVE"
                                : "DISABLED"
                        }

                    </div>

                </div>


                <div class="banner-actions">

                    <button
                        class="small-button edit"
                        data-id="${banner.id}"
                    >
                        Edit
                    </button>


                    <button
                        class="small-button toggle-status"
                        data-id="${banner.id}"
                    >

                        ${
                            banner.active
                                ? "Disable"
                                : "Enable"
                        }

                    </button>


                    <button
                        class="small-button delete"
                        data-id="${banner.id}"
                    >
                        Delete
                    </button>

                </div>

            `;


            bannerList.appendChild(
                row
            );

        }
    );


    attachBannerActions(
        banners
    );

}


/* ============================================================
   ACTIONS
============================================================ */

function attachBannerActions(
    banners
) {

    document
        .querySelectorAll(
            ".edit"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const banner =
                            banners.find(
                                item =>
                                    item.id ===
                                    button.dataset.id
                            );


                        if (banner) {

                            openEditModal(
                                banner
                            );

                        }

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".toggle-status"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        await toggleBanner(
                            button.dataset.id,
                            banners
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".delete"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        await removeBanner(
                            button.dataset.id,
                            banners
                        );

                    }
                );

            }
        );

}


/* ============================================================
   ADD BANNER
============================================================ */

function openAddModal() {

    editingBannerId =
        null;

    editingBannerImage =
        null;


    modalTitle.textContent =
        "Add Banner";


    form.reset();


    document.getElementById(
        "bannerActive"
    ).checked =
        true;


    document.getElementById(
        "bannerOrder"
    ).value =
        "1";


    imagePreview.classList.add(
        "hidden"
    );


    uploadPlaceholder.classList.remove(
        "hidden"
    );


    modal.classList.remove(
        "hidden"
    );

}


document
    .getElementById(
        "addBannerButton"
    )
    .addEventListener(
        "click",
        openAddModal
    );


document
    .getElementById(
        "emptyAddButton"
    )
    .addEventListener(
        "click",
        openAddModal
    );


/* ============================================================
   EDIT
============================================================ */

function openEditModal(
    banner
) {

    editingBannerId =
        banner.id;

    editingBannerImage =
        banner.imageUrl || "";


    modalTitle.textContent =
        "Edit Banner";


    document.getElementById(
        "bannerTitle"
    ).value =
        banner.title || "";


    document.getElementById(
        "bannerDescription"
    ).value =
        banner.description || "";


    document.getElementById(
        "bannerLink"
    ).value =
        banner.link || "";


    document.getElementById(
        "bannerOrder"
    ).value =
        Number(
            banner.order || 1
        );


    document.getElementById(
        "bannerActive"
    ).checked =
        banner.active === true;


    if (
        banner.imageUrl
    ) {

        imagePreview.src =
            banner.imageUrl;

        imagePreview.classList.remove(
            "hidden"
        );

        uploadPlaceholder.classList.add(
            "hidden"
        );

    }


    modal.classList.remove(
        "hidden"
    );

}


/* ============================================================
   IMAGE PREVIEW
============================================================ */

imageInput.addEventListener(
    "change",
    () => {

        const file =
            imageInput.files[0];


        if (!file) {

            return;

        }


        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            alert(
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

                imagePreview.src =
                    event.target.result;


                imagePreview.classList.remove(
                    "hidden"
                );


                uploadPlaceholder.classList.add(
                    "hidden"
                );

            };


        reader.readAsDataURL(
            file
        );

    }
);


/* ============================================================
   SAVE
============================================================ */

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const saveButton =
            document.getElementById(
                "saveBannerButton"
            );


        const file =
            imageInput.files[0];


        const title =
            document.getElementById(
                "bannerTitle"
            ).value.trim();


        const description =
            document.getElementById(
                "bannerDescription"
            ).value.trim();


        const link =
            document.getElementById(
                "bannerLink"
            ).value.trim();


        const order =
            Number(
                document.getElementById(
                    "bannerOrder"
                ).value
            );


        const active =
            document.getElementById(
                "bannerActive"
            ).checked;


        if (!title) {

            alert(
                "Please enter a banner title."
            );

            return;

        }


        if (
            !editingBannerId &&
            !file
        ) {

            alert(
                "Please upload a banner image."
            );

            return;

        }


        saveButton.disabled =
            true;

        saveButton.textContent =
            "Saving...";


        try {

            let imageUrl =
                editingBannerImage;


            /*
             * Upload a new image if selected.
             */

            if (file) {

                const fileExtension =
                    file.name
                        .split(".")
                        .pop()
                        .toLowerCase();


                const safeName =
                    Date.now() +
                    "-" +
                    crypto.randomUUID() +
                    "." +
                    fileExtension;


                const imageRef =
                    ref(
                        storage,
                        `homeBanners/${safeName}`
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


            const data = {

                title,

                description,

                link,

                imageUrl,

                order,

                active,

                updatedAt:
                    serverTimestamp()

            };


            if (
                editingBannerId
            ) {

                await updateDoc(
                    doc(
                        db,
                        "homeBanners",
                        editingBannerId
                    ),
                    data
                );

            } else {

                await addDoc(
                    collection(
                        db,
                        "homeBanners"
                    ),
                    {

                        ...data,

                        createdAt:
                            serverTimestamp()

                    }
                );

            }


            closeModal();


            await loadBanners();


        } catch (error) {

            console.error(
                "Save banner:",
                error
            );


            alert(
                "Banner could not be saved. Check Firebase permissions."
            );

        } finally {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Save Banner";

        }

    }
);


/* ============================================================
   ENABLE / DISABLE
============================================================ */

async function toggleBanner(
    id,
    banners
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


        await loadBanners();


    } catch (error) {

        console.error(
            error
        );

        alert(
            "Unable to update banner."
        );

    }

}


/* ============================================================
   DELETE
============================================================ */

async function removeBanner(
    id,
    banners
) {

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
                id
            )
        );


        /*
         * Storage cleanup is attempted
         * only if we can derive the
         * Storage reference from the URL.
         */

        if (
            banner.imageUrl
        ) {

            try {

                const imageRef =
                    ref(
                        storage,
                        banner.imageUrl
                    );

                await deleteObject(
                    imageRef
                );

            } catch (
                storageError
            ) {

                /*
                 * Firestore deletion has
                 * already succeeded.
                 *
                 * Storage cleanup failure
                 * should not block the UI.
                 */

                console.warn(
                    "Storage cleanup:",
                    storageError
                );

            }

        }


        await loadBanners();


    } catch (error) {

        console.error(
            "Delete banner:",
            error
        );


        alert(
            "Unable to delete banner."
        );

    }

}


/* ============================================================
   MODAL
============================================================ */

function closeModal() {

    modal.classList.add(
        "hidden"
    );


    form.reset();


    imagePreview.src =
        "";


    imagePreview.classList.add(
        "hidden"
    );


    uploadPlaceholder.classList.remove(
        "hidden"
    );


    editingBannerId =
        null;

    editingBannerImage =
        null;

}


document
    .getElementById(
        "closeModal"
    )
    .addEventListener(
        "click",
        closeModal
    );


document
    .getElementById(
        "cancelButton"
    )
    .addEventListener(
        "click",
        closeModal
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


/* ============================================================
   MOBILE MENU
============================================================ */

document
    .getElementById(
        "mobileMenu"
    )
    .addEventListener(
        "click",
        () => {

            document
                .getElementById(
                    "sidebar"
                )
                .classList.toggle(
                    "open"
                );

        }
    );


/* ============================================================
   FIREBASE STATUS
============================================================ */

function setFirebaseConnected() {

    firebaseDot.classList.add(
        "connected"
    );

    firebaseText.textContent =
        "CONNECTED";

}


function setFirebaseError() {

    firebaseDot.classList.remove(
        "connected"
    );

    firebaseText.textContent =
        "CONNECTION ERROR";

}


/* ============================================================
   LOADING
============================================================ */

function showLoading() {

    bannerLoading.classList.remove(
        "hidden"
    );

    bannerList.classList.add(
        "hidden"
    );

    bannerEmpty.classList.add(
        "hidden"
    );

}


function hideLoading() {

    bannerLoading.classList.add(
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


function escapeAttr(
    value
) {

    return escapeHtml(
        value
    );

}

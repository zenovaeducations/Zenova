/* ============================================================
   ZENOVA ADMIN
   STUDENT HOME → BANNER MANAGEMENT

   FLOW:

   Computer
       ↓
   Firebase Storage
       ↓
   downloadURL
       ↓
   Firestore
       ↓
   Student Home

   Firestore stores the URL.
   The actual image is stored in Firebase Storage.
============================================================ */


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

const loading =
    document.getElementById("loading");

const bannerList =
    document.getElementById("bannerList");

const empty =
    document.getElementById("empty");

const modal =
    document.getElementById("modal");

const form =
    document.getElementById("bannerForm");

const imageInput =
    document.getElementById("bannerImage");

const preview =
    document.getElementById("preview");

const uploadMessage =
    document.getElementById("uploadMessage");

const saveButton =
    document.getElementById("saveBanner");

const firebaseDot =
    document.getElementById("firebaseDot");

const firebaseStatus =
    document.getElementById("firebaseStatus");

const sidebar =
    document.getElementById("sidebar");



/* ============================================================
   MOBILE MENU
============================================================ */

document
    .getElementById("mobileMenu")
    .addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

        }
    );



/* ============================================================
   LOAD BANNERS
============================================================ */

loadBanners();



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
                document => ({

                    id:
                        document.id,

                    ...document.data()

                })
            );


        firebaseConnected();


        renderBanners(
            banners
        );


    } catch (error) {

        console.error(
            "LOAD BANNERS ERROR:",
            error
        );


        firebaseError();


        hideLoading();


        bannerList.classList.add(
            "hidden"
        );


        empty.classList.remove(
            "hidden"
        );


        empty.querySelector(
            "h3"
        ).textContent =
            "Unable to load Home";


        empty.querySelector(
            "p"
        ).textContent =
            getFirebaseErrorMessage(
                error
            );

    }

}



/* ============================================================
   RENDER
============================================================ */

function renderBanners(
    banners
) {

    hideLoading();


    bannerList.innerHTML =
        "";


    if (
        banners.length === 0
    ) {

        bannerList.classList.add(
            "hidden"
        );


        empty.classList.remove(
            "hidden"
        );


        empty.querySelector(
            "h3"
        ).textContent =
            "No Home banners";


        empty.querySelector(
            "p"
        ).textContent =
            "There are currently no banners configured for Student Home.";


        return;

    }


    empty.classList.add(
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

                <div class="banner-image">

                    <img
                        src="${safeAttribute(
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
                        ${safeHtml(
                            banner.title || ""
                        )}
                    </h3>


                    ${
                        banner.description
                            ? `
                                <p>
                                    ${safeHtml(
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
                        class="small-button toggle-button"
                        data-id="${banner.id}"
                    >

                        ${
                            banner.active
                                ? "Disable"
                                : "Enable"
                        }

                    </button>


                    <button
                        class="small-button delete-button"
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
   BANNER ACTIONS
============================================================ */

function attachBannerActions(
    banners
) {


    document
        .querySelectorAll(
            ".toggle-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const banner =
                            banners.find(
                                item =>
                                    item.id ===
                                    button.dataset.id
                            );


                        if (!banner) {
                            return;
                        }


                        button.disabled =
                            true;


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
                                        serverTimestamp()

                                }

                            );


                            await loadBanners();


                        } catch (error) {

                            console.error(
                                "STATUS ERROR:",
                                error
                            );


                            alert(
                                "Unable to change banner status."
                            );


                            button.disabled =
                                false;

                        }

                    }
                );

            }
        );



    document
        .querySelectorAll(
            ".delete-button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const banner =
                            banners.find(
                                item =>
                                    item.id ===
                                    button.dataset.id
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


                        button.disabled =
                            true;


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
                             * Delete actual Storage file.
                             */

                            if (
                                banner.storagePath
                            ) {

                                try {

                                    const storageReference =
                                        ref(
                                            storage,
                                            banner.storagePath
                                        );


                                    await deleteObject(
                                        storageReference
                                    );


                                } catch (
                                    storageError
                                ) {

                                    console.warn(
                                        "Storage deletion failed:",
                                        storageError
                                    );

                                }

                            }


                            await loadBanners();


                        } catch (error) {

                            console.error(
                                "DELETE ERROR:",
                                error
                            );


                            alert(
                                "Unable to delete banner."
                            );


                            button.disabled =
                                false;

                        }

                    }
                );

            }
        );

}



/* ============================================================
   OPEN ADD BANNER
============================================================ */

function openAddBanner() {

    form.reset();


    preview.src =
        "";


    preview.classList.add(
        "hidden"
    );


    uploadMessage.classList.remove(
        "hidden"
    );


    document.getElementById(
        "bannerActive"
    ).checked =
        true;


    document.getElementById(
        "bannerOrder"
    ).value =
        "1";


    modal.classList.remove(
        "hidden"
    );

}



document
    .getElementById("addBanner")
    .addEventListener(
        "click",
        openAddBanner
    );


document
    .getElementById("emptyAdd")
    .addEventListener(
        "click",
        openAddBanner
    );



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


        /*
         * File type.
         */

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            alert(
                "Please select JPG, PNG or WebP."
            );


            imageInput.value =
                "";


            return;

        }


        /*
         * Maximum 10 MB.
         */

        if (
            file.size >
            10 * 1024 * 1024
        ) {

            alert(
                "Image must be smaller than 10 MB."
            );


            imageInput.value =
                "";


            return;

        }


        const reader =
            new FileReader();


        reader.onload =
            event => {

                preview.src =
                    event.target.result;


                preview.classList.remove(
                    "hidden"
                );


                uploadMessage.classList.add(
                    "hidden"
                );

            };


        reader.readAsDataURL(
            file
        );

    }
);



/* ============================================================
   UPLOAD IMAGE
============================================================ */

async function uploadBannerImage(
    file
) {

    /*
     * Unique filename.
     */

    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    const fileName =
        `${Date.now()}-${crypto.randomUUID()}.${extension}`;


    /*
     * Storage path.
     */

    const storagePath =
        `homeBanners/${fileName}`;


    const storageReference =
        ref(
            storage,
            storagePath
        );


    /*
     * Upload actual file.
     */

    await uploadBytes(
        storageReference,
        file,
        {
            contentType:
                file.type,

            cacheControl:
                "public,max-age=31536000"
        }
    );


    /*
     * Get public download URL.
     */

    const imageUrl =
        await getDownloadURL(
            storageReference
        );


    return {

        imageUrl,

        storagePath

    };

}



/* ============================================================
   SAVE BANNER
============================================================ */

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


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



        /* --------------------------------------------
           VALIDATION
        --------------------------------------------- */

        if (!file) {

            alert(
                "Please choose a banner image."
            );

            return;

        }


        if (!title) {

            alert(
                "Please enter a banner title."
            );

            return;

        }


        if (
            !Number.isInteger(order) ||
            order < 1
        ) {

            alert(
                "Display order must be 1 or higher."
            );

            return;

        }



        /* --------------------------------------------
           BUTTON
        --------------------------------------------- */

        saveButton.disabled =
            true;


        saveButton.textContent =
            "Uploading...";



        try {

            /*
             * Upload image.
             */

            const uploaded =
                await uploadBannerImage(
                    file
                );


            saveButton.textContent =
                "Saving...";


            /*
             * Firestore stores:
             *
             * imageUrl → URL
             * storagePath → location of file
             *
             * It does NOT store the image itself.
             */

            await addDoc(

                collection(
                    db,
                    "homeBanners"
                ),

                {

                    title,

                    description,

                    imageUrl:
                        uploaded.imageUrl,

                    storagePath:
                        uploaded.storagePath,

                    link,

                    order,

                    active,

                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()

                }

            );


            /*
             * Success.
             */

            closeModal();


            await loadBanners();


        } catch (error) {

            console.error(
                "BANNER SAVE ERROR:",
                error
            );


            alert(
                getFirebaseErrorMessage(
                    error
                )
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
   CLOSE MODAL
============================================================ */

function closeModal() {

    modal.classList.add(
        "hidden"
    );


    form.reset();


    preview.src =
        "";


    preview.classList.add(
        "hidden"
    );


    uploadMessage.classList.remove(
        "hidden"
    );

}



document
    .getElementById("closeModal")
    .addEventListener(
        "click",
        closeModal
    );


document
    .getElementById("cancelModal")
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
   LOADING
============================================================ */

function showLoading() {

    loading.classList.remove(
        "hidden"
    );


    bannerList.classList.add(
        "hidden"
    );


    empty.classList.add(
        "hidden"
    );

}



function hideLoading() {

    loading.classList.add(
        "hidden"
    );

}



/* ============================================================
   FIREBASE STATUS
============================================================ */

function firebaseConnected() {

    firebaseDot.classList.add(
        "connected"
    );


    firebaseStatus.textContent =
        "CONNECTED";

}



function firebaseError() {

    firebaseDot.classList.remove(
        "connected"
    );


    firebaseStatus.textContent =
        "ERROR";

}



/* ============================================================
   ERROR MESSAGE
============================================================ */

function getFirebaseErrorMessage(
    error
) {

    const code =
        error?.code || "";


    if (
        code.includes(
            "storage/unauthorized"
        )
    ) {

        return (
            "Firebase Storage permission denied. " +
            "Check your Storage Rules."
        );

    }


    if (
        code.includes(
            "storage/cors"
        )
    ) {

        return (
            "Firebase Storage CORS is blocking the upload. " +
            "The Storage bucket configuration needs to be fixed."
        );

    }


    if (
        code.includes(
            "permission-denied"
        )
    ) {

        return (
            "Firestore permission denied. " +
            "Check your Firestore Rules."
        );

    }


    if (
        code.includes(
            "storage/unknown"
        )
    ) {

        return (
            "Firebase Storage rejected the upload. " +
            "Check the Storage bucket and configuration."
        );

    }


    return (
        error?.message ||
        "Something went wrong while saving the banner."
    );

}



/* ============================================================
   HTML SAFETY
============================================================ */

function safeHtml(
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


function safeAttribute(
    value
) {

    return safeHtml(
        value
    );

}

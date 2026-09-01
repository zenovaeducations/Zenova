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
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";



/* ============================================================
   ELEMENTS
============================================================ */

const sidebar =
    document.getElementById("sidebar");


const mobileMenu =
    document.getElementById("mobileMenu");


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



/* ============================================================
   MOBILE MENU
============================================================ */

mobileMenu.addEventListener(
    "click",
    () => {

        sidebar.classList.toggle(
            "open"
        );

    }
);



/* ============================================================
   LOAD
============================================================ */

loadBanners();



/* ============================================================
   LOAD BANNERS FROM FIRESTORE
============================================================ */

async function loadBanners() {

    showLoading();


    try {

        const bannerQuery =
            query(
                collection(
                    db,
                    "homeBanners"
                ),
                orderBy(
                    "order",
                    "asc"
                )
            );


        const snapshot =
            await getDocs(
                bannerQuery
            );


        const banners =
            snapshot.docs.map(
                item => ({

                    id: item.id,

                    ...item.data()

                })
            );


        firebaseDot.classList.add(
            "connected"
        );


        firebaseStatus.textContent =
            "CONNECTED";


        renderBanners(
            banners
        );


    } catch (error) {

        console.error(
            "Firebase:",
            error
        );


        firebaseStatus.textContent =
            "ERROR";


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
            "Unable to load banners";


        empty.querySelector(
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
                        src="${safeAttr(
                            banner.imageUrl
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
                            banner.title
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
                        class="small-button toggle"
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


    attachActions(
        banners
    );

}



/* ============================================================
   ACTIONS
============================================================ */

function attachActions(
    banners
) {

    document
        .querySelectorAll(
            ".toggle"
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
                                error
                            );

                            alert(
                                "Unable to update banner."
                            );

                        }

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

                        const confirmed =
                            confirm(
                                "Delete this banner?"
                            );


                        if (!confirmed) {
                            return;
                        }


                        try {

                            await deleteDoc(

                                doc(
                                    db,
                                    "homeBanners",
                                    button.dataset.id
                                )

                            );


                            await loadBanners();


                        } catch (error) {

                            console.error(
                                error
                            );

                            alert(
                                "Unable to delete banner."
                            );

                        }

                    }
                );

            }
        );

}



/* ============================================================
   ADD BANNER
============================================================ */

function openModal() {

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


    modal.classList.remove(
        "hidden"
    );

}


document
    .getElementById(
        "addBanner"
    )
    .addEventListener(
        "click",
        openModal
    );


document
    .getElementById(
        "emptyAdd"
    )
    .addEventListener(
        "click",
        openModal
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
   SAVE
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


        if (!file) {

            alert(
                "Please choose a banner image."
            );

            return;

        }


        if (!title) {

            alert(
                "Please enter a title."
            );

            return;

        }


        saveButton.disabled =
            true;


        saveButton.textContent =
            "Uploading...";


        try {

            /*
             * Create unique storage name.
             */

            const extension =
                file.name
                    .split(".")
                    .pop()
                    .toLowerCase();


            const fileName =
                `${Date.now()}-${crypto.randomUUID()}.${extension}`;


            /*
             * Firebase Storage
             */

            const storageReference =
                ref(
                    storage,
                    `homeBanners/${fileName}`
                );


            await uploadBytes(
                storageReference,
                file
            );


            /*
             * Get download URL.
             */

            const imageUrl =
                await getDownloadURL(
                    storageReference
                );


            saveButton.textContent =
                "Saving...";


            /*
             * Firestore stores the URL,
             * NOT the image.
             */

            await addDoc(

                collection(
                    db,
                    "homeBanners"
                ),

                {

                    title,

                    description,

                    imageUrl,

                    link,

                    order,

                    active,

                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()

                }

            );


            closeModal();


            await loadBanners();


        } catch (error) {

            console.error(
                "SAVE BANNER ERROR:",
                error
            );


            alert(
                error.message ||
                "Unable to save banner."
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
    .getElementById(
        "closeModal"
    )
    .addEventListener(
        "click",
        closeModal
    );


document
    .getElementById(
        "cancelModal"
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
   HTML SAFETY
============================================================ */

function safeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


function safeAttr(
    value
) {

    return safeHtml(
        value
    );

}

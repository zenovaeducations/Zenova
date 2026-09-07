import { auth, db, storage } from "../../../firebase/firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
  collection,
  doc,
  setDoc,
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


// ======================================================
// ELEMENTS
// ======================================================

const loader = document.getElementById("loader");
const app = document.getElementById("app");

const bannerList = document.getElementById("bannerList");
const bannerCount = document.getElementById("bannerCount");

const addBannerBtn = document.getElementById("addBannerBtn");
const backBtn = document.getElementById("backBtn");

const bannerModal = document.getElementById("bannerModal");
const modalTitle = document.getElementById("modalTitle");

const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");

const imageInput = document.getElementById("imageInput");
const chooseImageBtn = document.getElementById("chooseImageBtn");
const changeImageBtn = document.getElementById("changeImageBtn");

const uploadPlaceholder = document.getElementById("uploadPlaceholder");
const imagePreviewWrapper =
  document.getElementById("imagePreviewWrapper");

const imagePreview =
  document.getElementById("imagePreview");

const imageInfo =
  document.getElementById("imageInfo");

const linkInput =
  document.getElementById("linkInput");

const labelInput =
  document.getElementById("labelInput");

const titleInput =
  document.getElementById("titleInput");

const descriptionInput =
  document.getElementById("descriptionInput");

const priorityInput =
  document.getElementById("priorityInput");

const activeInput =
  document.getElementById("activeInput");

const activeText =
  document.getElementById("activeText");

const saveBtn =
  document.getElementById("saveBtn");

const formError =
  document.getElementById("formError");


// ======================================================
// STATE
// ======================================================

let currentUser = null;

let banners = [];

let editingBanner = null;

let selectedImageFile = null;

let selectedImagePreviewUrl = null;


// ======================================================
// AUTH
// ======================================================

onAuthStateChanged(auth, (user) => {

  if (!user) {

    window.location.href = "../../index.html";

    return;
  }

  currentUser = user;

  loader.classList.add("hidden");
  app.classList.remove("hidden");

  startBannerListener();

});


// ======================================================
// REALTIME BANNER LISTENER
// ======================================================

function startBannerListener() {

  const bannersRef = collection(db, "hybridBanners");

  onSnapshot(
    bannersRef,

    (snapshot) => {

      banners = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));

      banners.sort((a, b) => {

        const priorityA = Number(a.priority || 0);
        const priorityB = Number(b.priority || 0);

        return priorityB - priorityA;

      });

      renderBanners();

    },

    (error) => {

      console.error("Banner listener error:", error);

      bannerList.innerHTML = `
        <div class="empty-state">
          Unable to load banners.
          <br><br>
          ${escapeHtml(error.message)}
        </div>
      `;

    }
  );

}


// ======================================================
// RENDER BANNERS
// ======================================================

function renderBanners() {

  bannerCount.textContent =
    `${banners.length} banner${banners.length === 1 ? "" : "s"}`;


  if (!banners.length) {

    bannerList.innerHTML = `
      <div class="empty-state">
        No banners added yet.
      </div>
    `;

    return;
  }


  bannerList.innerHTML = banners.map((banner) => {

    const statusClass =
      banner.active
        ? "status-active"
        : "status-inactive";

    const statusText =
      banner.active
        ? "Active"
        : "Inactive";


    return `

      <div class="banner-card">

        <img
          class="banner-image"
          src="${escapeAttribute(banner.imageUrl || "")}"
          alt="${escapeAttribute(banner.title || "Banner")}"
          onerror="this.style.opacity='0.3'"
        >


        <div class="banner-info">

          <div>

            ${
              banner.label
                ? `
                  <div class="banner-label">
                    ${escapeHtml(banner.label)}
                  </div>
                `
                : ""
            }


            <div class="banner-top">

              <div>

                <div class="banner-title">

                  ${
                    escapeHtml(
                      banner.title || "Untitled Banner"
                    )
                  }

                </div>


                ${
                  banner.description
                    ? `
                      <div class="banner-description">
                        ${escapeHtml(banner.description)}
                      </div>
                    `
                    : ""
                }

              </div>

            </div>


            <div class="banner-meta">

              <span class="meta-pill ${statusClass}">
                ${statusText}
              </span>

              <span class="meta-pill">
                Priority ${Number(banner.priority || 0)}
              </span>

              ${
                banner.link
                  ? `
                    <span class="meta-pill">
                      Link Added
                    </span>
                  `
                  : `
                    <span class="meta-pill">
                      No Link
                    </span>
                  `
              }

            </div>

          </div>


          <div class="banner-actions">

            <button
              class="edit-btn"
              data-action="edit"
              data-id="${banner.id}"
            >
              Edit
            </button>

            <button
              class="delete-btn"
              data-action="delete"
              data-id="${banner.id}"
            >
              Delete
            </button>

          </div>

        </div>

      </div>

    `;

  }).join("");

}


// ======================================================
// OPEN ADD MODAL
// ======================================================

addBannerBtn.addEventListener("click", () => {

  editingBanner = null;

  resetForm();

  modalTitle.textContent = "Add Banner";

  saveBtn.textContent = "Save Banner";

  openModal();

});


// ======================================================
// OPEN EDIT / DELETE
// ======================================================

bannerList.addEventListener("click", (event) => {

  const button = event.target.closest("button");

  if (!button) return;

  const action = button.dataset.action;
  const id = button.dataset.id;

  const banner =
    banners.find((item) => item.id === id);

  if (!banner) return;


  if (action === "edit") {

    openEditModal(banner);

  }


  if (action === "delete") {

    deleteBanner(banner);

  }

});


// ======================================================
// EDIT MODAL
// ======================================================

function openEditModal(banner) {

  editingBanner = banner;

  selectedImageFile = null;

  clearImagePreview();


  linkInput.value =
    banner.link || "";

  labelInput.value =
    banner.label || "";

  titleInput.value =
    banner.title || "";

  descriptionInput.value =
    banner.description || "";

  priorityInput.value =
    Number(banner.priority || 0);

  activeInput.checked =
    banner.active !== false;

  updateActiveText();


  if (banner.imageUrl) {

    imagePreview.src = banner.imageUrl;

    uploadPlaceholder.classList.add("hidden");

    imagePreviewWrapper.classList.remove("hidden");

    imageInfo.textContent =
      "Current banner image will be kept unless you select a new image.";

  }


  modalTitle.textContent = "Edit Banner";

  saveBtn.textContent = "Update Banner";

  openModal();

}


// ======================================================
// IMAGE PICKER
// ======================================================

chooseImageBtn.addEventListener("click", () => {

  imageInput.click();

});


changeImageBtn.addEventListener("click", () => {

  imageInput.click();

});


imageInput.addEventListener("change", async () => {

  const file = imageInput.files[0];

  if (!file) return;


  clearError();


  if (!file.type.startsWith("image/")) {

    showError("Please select a valid image.");

    imageInput.value = "";

    return;
  }


  // 10 MB limit

  if (file.size > 10 * 1024 * 1024) {

    showError(
      "Image is too large. Maximum allowed size is 10 MB."
    );

    imageInput.value = "";

    return;
  }


  try {

    const dimensions =
      await getImageDimensions(file);


    const ratio =
      dimensions.width / dimensions.height;


    const targetRatio =
      16 / 9;


    const difference =
      Math.abs(ratio - targetRatio);


    // Allow a very small tolerance

    if (difference > 0.02) {

      showError(
        `Please upload a 16:9 image. Your image is ${dimensions.width} × ${dimensions.height}.`
      );

      imageInput.value = "";

      return;
    }


    selectedImageFile = file;


    if (selectedImagePreviewUrl) {

      URL.revokeObjectURL(
        selectedImagePreviewUrl
      );

    }


    selectedImagePreviewUrl =
      URL.createObjectURL(file);


    imagePreview.src =
      selectedImagePreviewUrl;


    uploadPlaceholder.classList.add("hidden");

    imagePreviewWrapper.classList.remove("hidden");


    imageInfo.textContent =
      `${dimensions.width} × ${dimensions.height} • ${formatFileSize(file.size)}`;


  } catch (error) {

    console.error(error);

    showError(
      "Unable to read this image."
    );

  }

});


// ======================================================
// IMAGE DIMENSIONS
// ======================================================

function getImageDimensions(file) {

  return new Promise((resolve, reject) => {

    const image = new Image();

    const url =
      URL.createObjectURL(file);


    image.onload = () => {

      const width =
        image.naturalWidth;

      const height =
        image.naturalHeight;

      URL.revokeObjectURL(url);

      resolve({
        width,
        height
      });

    };


    image.onerror = () => {

      URL.revokeObjectURL(url);

      reject(
        new Error("Invalid image")
      );

    };


    image.src = url;

  });

}


// ======================================================
// SAVE BANNER
// ======================================================

saveBtn.addEventListener("click", async () => {

  clearError();


  if (!currentUser) {

    showError("You are not authenticated.");

    return;
  }


  // New banner requires image

  if (!editingBanner && !selectedImageFile) {

    showError(
      "Please upload a banner image."
    );

    return;
  }


  const link =
    linkInput.value.trim();

  const label =
    labelInput.value.trim();

  const title =
    titleInput.value.trim();

  const description =
    descriptionInput.value.trim();

  const priority =
    Number(priorityInput.value || 0);

  const active =
    activeInput.checked;


  // Validate link if entered

  if (link) {

    if (!isValidLink(link)) {

      showError(
        "Please enter a valid redirect link."
      );

      return;
    }

  }


  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";


  try {

    let bannerId;


    // ==============================================
    // CREATE NEW DOCUMENT ID FIRST
    // ==============================================

    if (editingBanner) {

      bannerId =
        editingBanner.id;

    } else {

      const bannerDoc =
        doc(collection(db, "hybridBanners"));

      bannerId =
        bannerDoc.id;

    }


    let imageUrl =
      editingBanner?.imageUrl || "";

    let storagePath =
      editingBanner?.storagePath || "";


    // ==============================================
    // UPLOAD NEW IMAGE
    // ==============================================

    if (selectedImageFile) {

      const safeFileName =
        createSafeFileName(
          selectedImageFile.name
        );


      const newStoragePath =
        `hybrid-banners/${bannerId}/${Date.now()}-${safeFileName}`;


      const imageRef =
        ref(storage, newStoragePath);


      await uploadBytes(
        imageRef,
        selectedImageFile,
        {
          contentType:
            selectedImageFile.type
        }
      );


      imageUrl =
        await getDownloadURL(imageRef);


      // Delete old image if there was one

      if (
        editingBanner &&
        editingBanner.storagePath &&
        editingBanner.storagePath !== newStoragePath
      ) {

        try {

          const oldImageRef =
            ref(
              storage,
              editingBanner.storagePath
            );

          await deleteObject(
            oldImageRef
          );

        } catch (deleteError) {

          console.warn(
            "Old image could not be deleted:",
            deleteError
          );

        }

      }


      storagePath =
        newStoragePath;

    }


    // ==============================================
    // FIRESTORE DATA
    // ==============================================

    const bannerData = {

      imageUrl,

      storagePath,

      link,

      title,

      description,

      label,

      priority,

      active,

      updatedAt:
        serverTimestamp(),

      updatedBy:
        currentUser.uid

    };


    // ==============================================
    // CREATE
    // ==============================================

    if (!editingBanner) {

      bannerData.createdAt =
        serverTimestamp();

      bannerData.createdBy =
        currentUser.uid;


      await setDoc(
        doc(db, "hybridBanners", bannerId),
        bannerData
      );

    }


    // ==============================================
    // UPDATE
    // ==============================================

    else {

      await updateDoc(
        doc(
          db,
          "hybridBanners",
          bannerId
        ),
        bannerData
      );

    }


    closeModal();

    resetForm();


  } catch (error) {

    console.error(
      "Banner save error:",
      error
    );


    showError(
      getFriendlyFirebaseError(error)
    );

  } finally {

    saveBtn.disabled = false;

    saveBtn.textContent =
      editingBanner
        ? "Update Banner"
        : "Save Banner";

  }

});


// ======================================================
// DELETE BANNER
// ======================================================

async function deleteBanner(banner) {

  const confirmed =
    confirm(
      "Delete this banner?\n\nThe banner image will also be removed from Firebase Storage."
    );


  if (!confirmed) return;


  try {

    // Delete image from Storage

    if (banner.storagePath) {

      try {

        const imageRef =
          ref(
            storage,
            banner.storagePath
          );

        await deleteObject(
          imageRef
        );

      } catch (storageError) {

        console.warn(
          "Storage image could not be deleted:",
          storageError
        );

      }

    }


    // Delete Firestore document

    await deleteDoc(
      doc(
        db,
        "hybridBanners",
        banner.id
      )
    );


  } catch (error) {

    console.error(
      "Delete banner error:",
      error
    );


    alert(
      getFriendlyFirebaseError(error)
    );

  }

}


// ======================================================
// ACTIVE TOGGLE
// ======================================================

activeInput.addEventListener("change", () => {

  updateActiveText();

});


function updateActiveText() {

  activeText.textContent =
    activeInput.checked
      ? "Active"
      : "Inactive";

}


// ======================================================
// MODAL
// ======================================================

function openModal() {

  bannerModal.classList.remove("hidden");

  document.body.style.overflow =
    "hidden";

}


function closeModal() {

  bannerModal.classList.add("hidden");

  document.body.style.overflow =
    "";

}


closeModalBtn.addEventListener(
  "click",
  closeModal
);


cancelBtn.addEventListener(
  "click",
  closeModal
);


document
  .querySelector(".modal-overlay")
  .addEventListener(
    "click",
    closeModal
  );


// ======================================================
// BACK
// ======================================================

backBtn.addEventListener("click", () => {

  window.location.href =
    "../";

});


// ======================================================
// RESET FORM
// ======================================================

function resetForm() {

  editingBanner = null;

  selectedImageFile = null;


  if (selectedImagePreviewUrl) {

    URL.revokeObjectURL(
      selectedImagePreviewUrl
    );

    selectedImagePreviewUrl = null;

  }


  imageInput.value = "";

  linkInput.value = "";

  labelInput.value = "";

  titleInput.value = "";

  descriptionInput.value = "";

  priorityInput.value = "1";

  activeInput.checked = true;

  updateActiveText();

  clearImagePreview();

  clearError();

}


function clearImagePreview() {

  imagePreview.src = "";

  imagePreviewWrapper.classList.add(
    "hidden"
  );

  uploadPlaceholder.classList.remove(
    "hidden"
  );

  imageInfo.textContent = "";

}


// ======================================================
// VALIDATE LINK
// ======================================================

function isValidLink(value) {

  // Relative link

  if (
    value.startsWith("./") ||
    value.startsWith("../") ||
    value.startsWith("/")
  ) {

    return true;

  }


  // Absolute URL

  try {

    const url =
      new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );

  } catch {

    return false;

  }

}


// ======================================================
// FILE NAME
// ======================================================

function createSafeFileName(fileName) {

  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");

}


// ======================================================
// FILE SIZE
// ======================================================

function formatFileSize(bytes) {

  if (bytes < 1024) {

    return `${bytes} B`;

  }

  if (bytes < 1024 * 1024) {

    return `${(bytes / 1024).toFixed(1)} KB`;

  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

}


// ======================================================
// ERRORS
// ======================================================

function showError(message) {

  formError.textContent =
    message;

  formError.classList.remove(
    "hidden"
  );

}


function clearError() {

  formError.textContent = "";

  formError.classList.add(
    "hidden"
  );

}


// ======================================================
// FIREBASE ERROR
// ======================================================

function getFriendlyFirebaseError(error) {

  if (!error) {

    return "Something went wrong.";

  }


  console.error(error);


  if (
    error.code ===
    "storage/unauthorized"
  ) {

    return "Firebase Storage permission denied. Please check your Storage rules.";

  }


  if (
    error.code ===
    "storage/unknown"
  ) {

    return "Firebase Storage returned an unknown error.";

  }


  if (
    error.code ===
    "permission-denied"
  ) {

    return "Firestore permission denied. Please check your Firestore rules.";

  }


  if (
    error.code ===
    "storage/quota-exceeded"
  ) {

    return "Firebase Storage quota has been exceeded.";

  }


  return error.message ||
    "Unable to save banner.";

}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {

  return escapeHtml(value);

}

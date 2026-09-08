/* =========================================================
   ZENOVA CRM — SCHOOL MASTER
   Firebase Firestore Realtime CRUD
========================================================= */

import { auth, db } from "../../firebase/firebase-config.js";

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


/* =========================================================
   STATE
========================================================= */

let currentUser = null;
let schools = [];
let districts = [];
let taluks = [];

let editingId = null;
let deleteTarget = null;

let unsubscribeSchools = null;
let unsubscribeDistricts = null;
let unsubscribeTaluks = null;


/* =========================================================
   DOM
========================================================= */

const appLoader = document.getElementById("appLoader");
const crmApp = document.getElementById("crmApp");

const schoolModal = document.getElementById("schoolModal");
const deleteModal = document.getElementById("deleteModal");

const schoolForm = document.getElementById("schoolForm");

const districtSelect =
  document.getElementById("districtSelect");

const talukSelect =
  document.getElementById("talukSelect");

const schoolName =
  document.getElementById("schoolName");

const schoolCode =
  document.getElementById("schoolCode");

const schoolActive =
  document.getElementById("schoolActive");

const modalTitle =
  document.getElementById("modalTitle");

const saveButton =
  document.getElementById("saveButton");

const formError =
  document.getElementById("formError");

const tableBody =
  document.getElementById("tableBody");

const tableSearch =
  document.getElementById("tableSearch");

const globalSearch =
  document.getElementById("globalSearch");

const tableInfo =
  document.getElementById("tableInfo");

const emptyState =
  document.getElementById("emptyState");

const addButton =
  document.getElementById("addButton");

const emptyAddButton =
  document.getElementById("emptyAddButton");

const toast =
  document.getElementById("toast");

const toastTitle =
  document.getElementById("toastTitle");

const toastMessage =
  document.getElementById("toastMessage");

const toastIcon =
  document.getElementById("toastIcon");


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(auth, (user) => {

  if (!user) {

    window.location.href = "../../index.html";

    return;
  }

  currentUser = user;

  setupUserUI();

  startRealtimeListeners();

  crmApp.classList.remove("hidden");

  appLoader.classList.add("hidden");

});


/* =========================================================
   USER UI
========================================================= */

function setupUserUI() {

  const email =
    currentUser.email || "Administrator";

  const displayName =
    currentUser.displayName ||
    email.split("@")[0] ||
    "Admin";

  const initial =
    displayName
      .trim()
      .charAt(0)
      .toUpperCase() || "Z";

  document.getElementById(
    "sidebarUserName"
  ).textContent = displayName;

  document.getElementById(
    "sidebarUserEmail"
  ).textContent = email;

  document.getElementById(
    "topbarName"
  ).textContent = displayName;

  document.getElementById(
    "sidebarAvatar"
  ).textContent = initial;

  document.getElementById(
    "topbarAvatar"
  ).textContent = initial;
}


/* =========================================================
   REALTIME LISTENERS
========================================================= */

function startRealtimeListeners() {

  unsubscribeDistricts =
    onSnapshot(
      collection(db, "crmDistricts"),
      (snapshot) => {

        districts = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data()
          }))
          .filter(
            (item) => item.crmActive !== false
          )
          .sort(sortDistricts);

        populateDistrictSelect();

        updateStats();

      },
      (error) => {

        console.error(
          "District listener error:",
          error
        );

        showToast(
          "Error",
          "Could not load districts.",
          true
        );

      }
    );


  unsubscribeTaluks =
    onSnapshot(
      collection(db, "crmTaluks"),
      (snapshot) => {

        taluks = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data()
          }))
          .filter(
            (item) => item.crmActive !== false
          )
          .sort(sortTaluks);

        updateTalukDropdown();

        updateStats();

      },
      (error) => {

        console.error(
          "Taluk listener error:",
          error
        );

        showToast(
          "Error",
          "Could not load taluks.",
          true
        );

      }
    );


  unsubscribeSchools =
    onSnapshot(
      collection(db, "crmSchools"),
      (snapshot) => {

        schools = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data()
          }))
          .sort(
            (a, b) =>
              String(
                a.crmSchoolName || ""
              ).localeCompare(
                String(
                  b.crmSchoolName || ""
                )
              )
          );

        renderTable();

        updateStats();

      },
      (error) => {

        console.error(
          "School listener error:",
          error
        );

        showToast(
          "Error",
          "Could not load schools.",
          true
        );

      }
    );

}


/* =========================================================
   SORT
========================================================= */

function sortDistricts(a, b) {

  return String(
    a.crmDistrictName || ""
  ).localeCompare(
    String(
      b.crmDistrictName || ""
    )
  );

}


function sortTaluks(a, b) {

  return String(
    a.crmTalukName || ""
  ).localeCompare(
    String(
      b.crmTalukName || ""
    )
  );

}


/* =========================================================
   STATS
========================================================= */

function updateStats() {

  document.getElementById(
    "schoolCount"
  ).textContent = schools.length;


  const districtIds =
    new Set(
      schools
        .map(
          (school) =>
            school.crmDistrictId
        )
        .filter(Boolean)
    );

  document.getElementById(
    "districtCount"
  ).textContent = districtIds.size;


  const talukIds =
    new Set(
      schools
        .map(
          (school) =>
            school.crmTalukId
        )
        .filter(Boolean)
    );

  document.getElementById(
    "talukCount"
  ).textContent = talukIds.size;


  const activeCount =
    schools.filter(
      (school) =>
        school.crmActive !== false
    ).length;

  document.getElementById(
    "activeSchoolCount"
  ).textContent = activeCount;

}


/* =========================================================
   TABLE
========================================================= */

function renderTable() {

  const search =
    (
      tableSearch.value.trim() ||
      globalSearch.value.trim()
    ).toLowerCase();


  let data = [...schools];


  if (search) {

    data =
      data.filter((school) => {

        const text = [

          school.crmSchoolName,

          school.crmSchoolCode,

          school.crmDistrictName,

          school.crmTalukName

        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return text.includes(search);

      });

  }


  tableBody.innerHTML = "";

  tableInfo.textContent =
    `${data.length} ${
      data.length === 1
        ? "record"
        : "records"
    }`;


  if (!data.length) {

    emptyState.classList.remove(
      "hidden"
    );

    return;
  }


  emptyState.classList.add(
    "hidden"
  );


  data.forEach((school) => {

    tableBody.appendChild(
      createSchoolRow(school)
    );

  });

}


/* =========================================================
   TABLE ROW
========================================================= */

function createSchoolRow(school) {

  const tr =
    document.createElement("tr");

  const active =
    school.crmActive !== false;


  tr.innerHTML = `

    <td>

      <div class="name-cell">

        <div class="school-mini-icon">
          ▣
        </div>

        <div class="school-name">
          ${escapeHtml(
            school.crmSchoolName || "—"
          )}
        </div>

      </div>

    </td>


    <td class="muted-cell">
      ${escapeHtml(
        school.crmSchoolCode || "—"
      )}
    </td>


    <td class="muted-cell">
      ${escapeHtml(
        school.crmTalukName || "—"
      )}
    </td>


    <td class="muted-cell">
      ${escapeHtml(
        school.crmDistrictName || "—"
      )}
    </td>


    <td>

      ${
        active
          ? `
            <span class="status-pill">
              <span class="status-dot"></span>
              Active
            </span>
          `
          : `
            <span class="status-pill"
              style="
                background:#f2f3f5;
                color:#777;
              "
            >
              Inactive
            </span>
          `
      }

    </td>


    <td class="actions-cell">

      <button
        class="action-button"
        title="Edit"
        data-action="edit"
        data-id="${school.id}"
      >
        ✎
      </button>

      <button
        class="action-button delete"
        title="Delete"
        data-action="delete"
        data-id="${school.id}"
      >
        ×
      </button>

    </td>

  `;


  return tr;

}


/* =========================================================
   DISTRICT DROPDOWN
========================================================= */

function populateDistrictSelect(
  selectedId = ""
) {

  districtSelect.innerHTML = `

    <option value="">
      Select district
    </option>

    ${
      districts
        .map(
          (district) => `

            <option
              value="${district.id}"
              ${
                district.id === selectedId
                  ? "selected"
                  : ""
              }
            >
              ${escapeHtml(
                district.crmDistrictName || ""
              )}
            </option>

          `
        )
        .join("")
    }

  `;

}


/* =========================================================
   TALUK DROPDOWN
========================================================= */

function updateTalukDropdown(
  selectedId = ""
) {

  const districtId =
    districtSelect.value;


  talukSelect.innerHTML = `

    <option value="">
      Select taluk
    </option>

  `;


  if (!districtId) {

    talukSelect.disabled = true;

    return;

  }


  const filtered =
    taluks.filter(
      (taluk) =>
        taluk.crmDistrictId ===
        districtId
    );


  talukSelect.innerHTML +=

    filtered
      .map(
        (taluk) => `

          <option
            value="${taluk.id}"
            ${
              taluk.id === selectedId
                ? "selected"
                : ""
            }
          >
            ${escapeHtml(
              taluk.crmTalukName || ""
            )}
          </option>

        `
      )
      .join("");


  talukSelect.disabled =
    filtered.length === 0;

}


/* =========================================================
   DISTRICT CHANGE
========================================================= */

districtSelect.addEventListener(
  "change",
  () => {

    updateTalukDropdown();

  }
);


/* =========================================================
   ADD
========================================================= */

addButton.addEventListener(
  "click",
  openAddModal
);


emptyAddButton.addEventListener(
  "click",
  openAddModal
);


function openAddModal() {

  editingId = null;

  modalTitle.textContent =
    "Add School";

  saveButton.textContent =
    "Save School";

  schoolForm.reset();

  schoolActive.checked = true;

  formError.classList.add(
    "hidden"
  );

  populateDistrictSelect();

  talukSelect.innerHTML = `
    <option value="">
      Select taluk
    </option>
  `;

  talukSelect.disabled = true;

  schoolModal.classList.remove(
    "hidden"
  );

  setTimeout(
    () => schoolName.focus(),
    100
  );

}


/* =========================================================
   EDIT
========================================================= */

function openEditModal(id) {

  const school =
    schools.find(
      (item) =>
        item.id === id
    );

  if (!school) return;


  editingId = id;

  modalTitle.textContent =
    "Edit School";

  saveButton.textContent =
    "Update School";

  formError.classList.add(
    "hidden"
  );


  populateDistrictSelect(
    school.crmDistrictId || ""
  );


  updateTalukDropdown(
    school.crmTalukId || ""
  );


  schoolName.value =
    school.crmSchoolName || "";

  schoolCode.value =
    school.crmSchoolCode || "";

  schoolActive.checked =
    school.crmActive !== false;


  schoolModal.classList.remove(
    "hidden"
  );

}


/* =========================================================
   SAVE
========================================================= */

schoolForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    formError.classList.add(
      "hidden"
    );


    const name =
      schoolName.value.trim();

    const code =
      schoolCode.value.trim();

    const districtId =
      districtSelect.value;

    const talukId =
      talukSelect.value;

    const active =
      schoolActive.checked;


    if (!name) {

      showFormError(
        "Please enter the school name."
      );

      return;

    }


    if (!districtId) {

      showFormError(
        "Please select a district."
      );

      return;

    }


    if (!talukId) {

      showFormError(
        "Please select a taluk."
      );

      return;

    }


    const district =
      districts.find(
        (item) =>
          item.id === districtId
      );


    const taluk =
      taluks.find(
        (item) =>
          item.id === talukId
      );


    if (!district || !taluk) {

      showFormError(
        "Selected district or taluk was not found."
      );

      return;

    }


    const duplicate =
      schools.some(
        (school) =>

          school.id !== editingId &&

          school.crmTalukId === talukId &&

          String(
            school.crmSchoolName || ""
          )
            .trim()
            .toLowerCase() ===
          name.toLowerCase()
      );


    if (duplicate) {

      showFormError(
        "This school already exists under the selected taluk."
      );

      return;

    }


    saveButton.disabled = true;

    saveButton.textContent =
      editingId
        ? "Updating..."
        : "Saving...";


    try {

      const data = {

        crmSchoolName:
          name,

        crmSchoolCode:
          code || createSchoolCode(
            name
          ),

        crmDistrictId:
          district.id,

        crmDistrictName:
          district.crmDistrictName,

        crmTalukId:
          taluk.id,

        crmTalukName:
          taluk.crmTalukName,

        crmActive:
          active,

        crmUpdatedAt:
          serverTimestamp(),

        crmUpdatedBy:
          currentUser.uid

      };


      if (editingId) {

        await updateDoc(

          doc(
            db,
            "crmSchools",
            editingId
          ),

          data

        );

      } else {

        await addDoc(

          collection(
            db,
            "crmSchools"
          ),

          {
            ...data,

            crmCreatedAt:
              serverTimestamp(),

            crmCreatedBy:
              currentUser.uid
          }

        );

      }


      closeSchoolModal();


      showToast(
        "Success",
        editingId
          ? "School updated successfully."
          : "School added successfully."
      );

    }

    catch (error) {

      console.error(
        "Save school error:",
        error
      );

      showFormError(
        getFriendlyFirebaseError(
          error
        )
      );

    }

    finally {

      saveButton.disabled =
        false;

      saveButton.textContent =
        editingId
          ? "Update School"
          : "Save School";

    }

  }
);


/* =========================================================
   TABLE ACTIONS
========================================================= */

tableBody.addEventListener(
  "click",
  (event) => {

    const button =
      event.target.closest(
        "[data-action]"
      );

    if (!button) return;


    const id =
      button.dataset.id;

    const action =
      button.dataset.action;


    if (action === "edit") {

      openEditModal(id);

    }


    if (action === "delete") {

      openDeleteModal(id);

    }

  }
);


/* =========================================================
   DELETE
========================================================= */

function openDeleteModal(id) {

  const school =
    schools.find(
      (item) =>
        item.id === id
    );

  if (!school) return;


  deleteTarget = school;


  document.getElementById(
    "deleteMessage"
  ).textContent =

    `Are you sure you want to delete "${school.crmSchoolName}"? This action cannot be undone.`;


  deleteModal.classList.remove(
    "hidden"
  );

}


document.getElementById(
  "deleteConfirm"
).addEventListener(
  "click",
  async () => {

    if (!deleteTarget) return;


    const id =
      deleteTarget.id;

    const name =
      deleteTarget.crmSchoolName;


    try {

      await deleteDoc(
        doc(
          db,
          "crmSchools",
          id
        )
      );


      closeDeleteModal();


      showToast(
        "Deleted",
        `School "${name}" deleted.`
      );

    }

    catch (error) {

      console.error(
        "Delete school error:",
        error
      );

      showToast(
        "Error",
        getFriendlyFirebaseError(
          error
        ),
        true
      );

    }

  }
);


/* =========================================================
   MODALS
========================================================= */

function closeSchoolModal() {

  schoolModal.classList.add(
    "hidden"
  );

  editingId = null;

  schoolForm.reset();

  formError.classList.add(
    "hidden"
  );

}


function closeDeleteModal() {

  deleteModal.classList.add(
    "hidden"
  );

  deleteTarget = null;

}


document.getElementById(
  "modalClose"
).addEventListener(
  "click",
  closeSchoolModal
);


document.getElementById(
  "modalCancel"
).addEventListener(
  "click",
  closeSchoolModal
);


document.getElementById(
  "deleteCancel"
).addEventListener(
  "click",
  closeDeleteModal
);


/* =========================================================
   BACK TO CRM
========================================================= */

document.getElementById(
  "backToCRM"
).addEventListener(
  "click",
  () => {

    window.location.href = "../";

  }
);


/* =========================================================
   SEARCH
========================================================= */

tableSearch.addEventListener(
  "input",
  renderTable
);

globalSearch.addEventListener(
  "input",
  renderTable
);


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

const sidebar =
  document.getElementById(
    "sidebar"
  );

const sidebarOverlay =
  document.getElementById(
    "sidebarOverlay"
  );


document.getElementById(
  "sidebarOpen"
).addEventListener(
  "click",
  () => {

    sidebar.classList.add(
      "open"
    );

    sidebarOverlay.classList.add(
      "show"
    );

  }
);


document.getElementById(
  "sidebarClose"
).addEventListener(
  "click",
  closeSidebar
);


sidebarOverlay.addEventListener(
  "click",
  closeSidebar
);


function closeSidebar() {

  sidebar.classList.remove(
    "open"
  );

  sidebarOverlay.classList.remove(
    "show"
  );

}


/* =========================================================
   ESC
========================================================= */

document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Escape"
    ) {

      closeSchoolModal();

      closeDeleteModal();

    }

  }
);


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function showToast(
  title,
  message,
  isError = false
) {

  toastTitle.textContent =
    title;

  toastMessage.textContent =
    message;

  toast.classList.toggle(
    "error",
    isError
  );

  toastIcon.textContent =
    isError ? "!" : "✓";

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
      3200
    );

}


/* =========================================================
   FORM ERROR
========================================================= */

function showFormError(
  message
) {

  formError.textContent =
    message;

  formError.classList.remove(
    "hidden"
  );

}


/* =========================================================
   SCHOOL CODE
========================================================= */

function createSchoolCode(
  name
) {

  const cleaned =
    name
      .trim()
      .replace(
        /[^a-zA-Z0-9]/g,
        ""
      )
      .toUpperCase();

  return (
    "SCH-" +
    cleaned.substring(
      0,
      6
    )
  );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {

  return String(
    value ?? ""
  )
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


/* =========================================================
   FIREBASE ERROR
========================================================= */

function getFriendlyFirebaseError(
  error
) {

  if (
    error?.message &&
    !error.code
  ) {

    return error.message;

  }


  if (
    error?.code ===
    "permission-denied"
  ) {

    return (
      "Permission denied. Check your Firestore security rules."
    );

  }


  if (
    error?.code ===
    "unavailable"
  ) {

    return (
      "Firebase is temporarily unavailable. Please try again."
    );

  }


  return (
    error?.message ||
    "Something went wrong. Please try again."
  );

}


/* =========================================================
   INITIAL
========================================================= */

renderTable();

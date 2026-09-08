/* =========================================================
   ZENOVA CRM — LOCATION MASTER
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

let activeTab = "districts";

let editingId = null;

let deleteTarget = null;

let districts = [];
let taluks = [];
let gps = [];
let villages = [];

let unsubscribeDistricts = null;
let unsubscribeTaluks = null;
let unsubscribeGPs = null;
let unsubscribeVillages = null;


/* =========================================================
   COLLECTION CONFIG
========================================================= */

const COLLECTIONS = {

  districts: {
    collection: "crmDistricts",
    label: "District",
    plural: "Districts"
  },

  taluks: {
    collection: "crmTaluks",
    label: "Taluk",
    plural: "Taluks"
  },

  gps: {
    collection: "crmGramPanchayats",
    label: "Gram Panchayat",
    plural: "Gram Panchayats"
  },

  villages: {
    collection: "crmVillages",
    label: "Village",
    plural: "Villages"
  }

};


/* =========================================================
   DOM
========================================================= */

const appLoader = document.getElementById("appLoader");
const crmApp = document.getElementById("crmApp");

const locationModal = document.getElementById("locationModal");
const deleteModal = document.getElementById("deleteModal");

const locationForm = document.getElementById("locationForm");

const locationName = document.getElementById("locationName");

const parentFields = document.getElementById("parentFields");

const modalTitle = document.getElementById("modalTitle");
const nameLabel = document.getElementById("nameLabel");

const saveButton = document.getElementById("saveButton");

const formError = document.getElementById("formError");

const tableHead = document.getElementById("tableHead");
const tableBody = document.getElementById("tableBody");

const tableSearch = document.getElementById("tableSearch");
const globalSearch = document.getElementById("globalSearch");

const tableInfo = document.getElementById("tableInfo");

const emptyState = document.getElementById("emptyState");

const addButton = document.getElementById("addButton");
const addButtonText = document.getElementById("addButtonText");

const emptyAddButton = document.getElementById("emptyAddButton");

const toast = document.getElementById("toast");
const toastTitle = document.getElementById("toastTitle");
const toastMessage = document.getElementById("toastMessage");
const toastIcon = document.getElementById("toastIcon");


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(auth, async (user) => {

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

  document.getElementById("sidebarUserName").textContent =
    displayName;

  document.getElementById("sidebarUserEmail").textContent =
    email;

  document.getElementById("topbarName").textContent =
    displayName;

  document.getElementById("sidebarAvatar").textContent =
    initial;

  document.getElementById("topbarAvatar").textContent =
    initial;

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
          .sort(sortByName);

        render();

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
          .sort(sortByName);

        render();

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


  unsubscribeGPs =
    onSnapshot(
      collection(db, "crmGramPanchayats"),
      (snapshot) => {

        gps = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data()
          }))
          .sort(sortByName);

        render();

      },
      (error) => {

        console.error(
          "GP listener error:",
          error
        );

        showToast(
          "Error",
          "Could not load gram panchayats.",
          true
        );

      }
    );


  unsubscribeVillages =
    onSnapshot(
      collection(db, "crmVillages"),
      (snapshot) => {

        villages = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data()
          }))
          .sort(sortByName);

        render();

      },
      (error) => {

        console.error(
          "Village listener error:",
          error
        );

        showToast(
          "Error",
          "Could not load villages.",
          true
        );

      }
    );

}


/* =========================================================
   SORT
========================================================= */

function sortByName(a, b) {

  return String(
    a.crmDistrictName ||
    a.crmTalukName ||
    a.crmGPName ||
    a.crmVillageName ||
    ""
  )
    .localeCompare(
      String(
        b.crmDistrictName ||
        b.crmTalukName ||
        b.crmGPName ||
        b.crmVillageName ||
        ""
      )
    );

}


/* =========================================================
   RENDER
========================================================= */

function render() {

  updateStats();

  updateTabs();

  renderTable();

}


/* =========================================================
   STATS
========================================================= */

function updateStats() {

  document.getElementById("districtCount").textContent =
    districts.length;

  document.getElementById("talukCount").textContent =
    taluks.length;

  document.getElementById("gpCount").textContent =
    gps.length;

  document.getElementById("villageCount").textContent =
    villages.length;

}


/* =========================================================
   TAB COUNTS
========================================================= */

function updateTabs() {

  document.getElementById("districtTabCount").textContent =
    districts.length;

  document.getElementById("talukTabCount").textContent =
    taluks.length;

  document.getElementById("gpTabCount").textContent =
    gps.length;

  document.getElementById("villageTabCount").textContent =
    villages.length;

}


/* =========================================================
   TABLE
========================================================= */

function renderTable() {

  const config =
    COLLECTIONS[activeTab];

  const query =
    getSearchTerm();

  let data =
    getActiveData();

  if (query) {

    data = data.filter((item) =>
      JSON.stringify(item)
        .toLowerCase()
        .includes(query.toLowerCase())
    );

  }

  renderTableHead();

  tableBody.innerHTML = "";

  tableInfo.textContent =
    `${data.length} ${
      data.length === 1 ? "record" : "records"
    }`;

  if (!data.length) {

    tableBody.innerHTML = "";

    emptyState.classList.remove("hidden");

    return;
  }

  emptyState.classList.add("hidden");

  data.forEach((item) => {

    const row =
      createTableRow(item);

    tableBody.appendChild(row);

  });

}


function getActiveData() {

  switch (activeTab) {

    case "districts":
      return districts;

    case "taluks":
      return taluks;

    case "gps":
      return gps;

    case "villages":
      return villages;

    default:
      return [];

  }

}


function getSearchTerm() {

  const tableValue =
    tableSearch.value.trim();

  const globalValue =
    globalSearch.value.trim();

  return tableValue || globalValue;

}


/* =========================================================
   TABLE HEADER
========================================================= */

function renderTableHead() {

  let html = "";

  if (activeTab === "districts") {

    html = `
      <tr>
        <th>District</th>
        <th>Code</th>
        <th>Status</th>
        <th>Created</th>
        <th></th>
      </tr>
    `;

  }


  if (activeTab === "taluks") {

    html = `
      <tr>
        <th>Taluk</th>
        <th>District</th>
        <th>Status</th>
        <th></th>
      </tr>
    `;

  }


  if (activeTab === "gps") {

    html = `
      <tr>
        <th>Gram Panchayat</th>
        <th>Taluk</th>
        <th>District</th>
        <th>Status</th>
        <th></th>
      </tr>
    `;

  }


  if (activeTab === "villages") {

    html = `
      <tr>
        <th>Village</th>
        <th>Gram Panchayat</th>
        <th>Taluk</th>
        <th>District</th>
        <th>Status</th>
        <th></th>
      </tr>
    `;

  }

  tableHead.innerHTML = html;

}


/* =========================================================
   TABLE ROW
========================================================= */

function createTableRow(item) {

  const tr =
    document.createElement("tr");

  const active =
    item.crmActive !== false;

  const statusHTML = `
    <span class="status-pill">
      <span class="status-dot"></span>
      Active
    </span>
  `;


  if (activeTab === "districts") {

    tr.innerHTML = `
      <td>
        <div class="name-cell">
          <div class="location-mini-icon">⌖</div>

          <div class="location-name">
            ${escapeHtml(item.crmDistrictName || "—")}
          </div>
        </div>
      </td>

      <td class="muted-cell">
        ${escapeHtml(item.crmDistrictCode || "—")}
      </td>

      <td>
        ${active ? statusHTML : ""}
      </td>

      <td class="muted-cell">
        ${formatDate(item.crmCreatedAt)}
      </td>

      <td class="actions-cell">
        ${actionButtons(item)}
      </td>
    `;

  }


  if (activeTab === "taluks") {

    tr.innerHTML = `
      <td>
        <div class="name-cell">
          <div class="location-mini-icon">⌑</div>

          <div class="location-name">
            ${escapeHtml(item.crmTalukName || "—")}
          </div>
        </div>
      </td>

      <td class="muted-cell">
        ${escapeHtml(item.crmDistrictName || "—")}
      </td>

      <td>
        ${active ? statusHTML : ""}
      </td>

      <td class="actions-cell">
        ${actionButtons(item)}
      </td>
    `;

  }


  if (activeTab === "gps") {

    tr.innerHTML = `
      <td>
        <div class="name-cell">
          <div class="location-mini-icon">⌂</div>

          <div class="location-name">
            ${escapeHtml(item.crmGPName || "—")}
          </div>
        </div>
      </td>

      <td class="muted-cell">
        ${escapeHtml(item.crmTalukName || "—")}
      </td>

      <td class="muted-cell">
        ${escapeHtml(item.crmDistrictName || "—")}
      </td>

      <td>
        ${active ? statusHTML : ""}
      </td>

      <td class="actions-cell">
        ${actionButtons(item)}
      </td>
    `;

  }


  if (activeTab === "villages") {

    tr.innerHTML = `
      <td>
        <div class="name-cell">
          <div class="location-mini-icon">⌖</div>

          <div class="location-name">
            ${escapeHtml(item.crmVillageName || "—")}
          </div>
        </div>
      </td>

      <td class="muted-cell">
        ${escapeHtml(item.crmGPName || "—")}
      </td>

      <td class="muted-cell">
        ${escapeHtml(item.crmTalukName || "—")}
      </td>

      <td class="muted-cell">
        ${escapeHtml(item.crmDistrictName || "—")}
      </td>

      <td>
        ${active ? statusHTML : ""}
      </td>

      <td class="actions-cell">
        ${actionButtons(item)}
      </td>
    `;

  }


  return tr;

}


/* =========================================================
   ACTION BUTTONS
========================================================= */

function actionButtons(item) {

  return `
    <button
      class="action-button"
      title="Edit"
      data-action="edit"
      data-id="${item.id}"
    >
      ✎
    </button>

    <button
      class="action-button delete"
      title="Delete"
      data-action="delete"
      data-id="${item.id}"
    >
      ×
    </button>
  `;

}


/* =========================================================
   TAB SWITCHING
========================================================= */

document.querySelectorAll(".location-tab")
  .forEach((button) => {

    button.addEventListener("click", () => {

      activeTab =
        button.dataset.tab;

      document
        .querySelectorAll(".location-tab")
        .forEach((tab) =>
          tab.classList.remove("active")
        );

      button.classList.add("active");

      tableSearch.value = "";

      updateAddButton();

      renderTable();

    });

  });


/* =========================================================
   ADD BUTTON
========================================================= */

addButton.addEventListener(
  "click",
  () => openAddModal()
);

emptyAddButton.addEventListener(
  "click",
  () => openAddModal()
);


/* =========================================================
   OPEN ADD MODAL
========================================================= */

function openAddModal() {

  editingId = null;

  modalTitle.textContent =
    `Add ${COLLECTIONS[activeTab].label}`;

  nameLabel.textContent =
    `${COLLECTIONS[activeTab].label} Name`;

  saveButton.textContent =
    `Save ${COLLECTIONS[activeTab].label}`;

  locationName.value = "";

  formError.classList.add("hidden");

  buildParentFields();

  locationModal.classList.remove("hidden");

  setTimeout(() => {

    locationName.focus();

  }, 100);

}


/* =========================================================
   OPEN EDIT MODAL
========================================================= */

function openEditModal(id) {

  const item =
    getActiveData().find(
      (entry) => entry.id === id
    );

  if (!item) return;

  editingId = id;

  modalTitle.textContent =
    `Edit ${COLLECTIONS[activeTab].label}`;

  nameLabel.textContent =
    `${COLLECTIONS[activeTab].label} Name`;

  saveButton.textContent =
    `Update ${COLLECTIONS[activeTab].label}`;

  formError.classList.add("hidden");

  buildParentFields(item);

  locationName.value =
    getItemName(item);

  locationModal.classList.remove("hidden");

}


/* =========================================================
   ITEM NAME
========================================================= */

function getItemName(item) {

  if (activeTab === "districts")
    return item.crmDistrictName || "";

  if (activeTab === "taluks")
    return item.crmTalukName || "";

  if (activeTab === "gps")
    return item.crmGPName || "";

  if (activeTab === "villages")
    return item.crmVillageName || "";

  return "";

}


/* =========================================================
   PARENT FIELDS
========================================================= */

function buildParentFields(item = {}) {

  parentFields.innerHTML = "";

  if (activeTab === "districts") {

    parentFields.innerHTML = "";

    return;
  }


  if (activeTab === "taluks") {

    parentFields.innerHTML = `
      <div class="form-group">
        <label>District</label>

        <select id="districtSelect" required>
          <option value="">Select district</option>

          ${districts.map((district) => `
            <option
              value="${district.id}"
              ${
                district.id === item.crmDistrictId
                  ? "selected"
                  : ""
              }
            >
              ${escapeHtml(
                district.crmDistrictName || ""
              )}
            </option>
          `).join("")}

        </select>
      </div>
    `;

    return;
  }


  if (activeTab === "gps") {

    parentFields.innerHTML = `
      <div class="form-group">
        <label>District</label>

        <select id="districtSelect" required>
          <option value="">Select district</option>

          ${districts.map((district) => `
            <option
              value="${district.id}"
              ${
                district.id === item.crmDistrictId
                  ? "selected"
                  : ""
              }
            >
              ${escapeHtml(
                district.crmDistrictName || ""
              )}
            </option>
          `).join("")}

        </select>
      </div>

      <div class="form-group">
        <label>Taluk</label>

        <select
          id="talukSelect"
          required
        >
          <option value="">
            Select taluk
          </option>
        </select>
      </div>
    `;

    const districtSelect =
      document.getElementById(
        "districtSelect"
      );

    districtSelect.addEventListener(
      "change",
      () => {

        populateTalukSelect(
          districtSelect.value,
          item.crmTalukId || ""
        );

      }
    );

    populateTalukSelect(
      item.crmDistrictId || "",
      item.crmTalukId || ""
    );

    return;
  }


  if (activeTab === "villages") {

    parentFields.innerHTML = `
      <div class="form-group">
        <label>District</label>

        <select id="districtSelect" required>
          <option value="">Select district</option>

          ${districts.map((district) => `
            <option
              value="${district.id}"
              ${
                district.id === item.crmDistrictId
                  ? "selected"
                  : ""
              }
            >
              ${escapeHtml(
                district.crmDistrictName || ""
              )}
            </option>
          `).join("")}

        </select>
      </div>

      <div class="form-group">
        <label>Taluk</label>

        <select id="talukSelect" required>
          <option value="">
            Select taluk
          </option>
        </select>
      </div>

      <div class="form-group">
        <label>Gram Panchayat</label>

        <select id="gpSelect" required>
          <option value="">
            Select Gram Panchayat
          </option>
        </select>
      </div>
    `;


    const districtSelect =
      document.getElementById(
        "districtSelect"
      );

    const talukSelect =
      document.getElementById(
        "talukSelect"
      );

    districtSelect.addEventListener(
      "change",
      () => {

        populateTalukSelect(
          districtSelect.value
        );

        const gpSelect =
          document.getElementById(
            "gpSelect"
          );

        gpSelect.innerHTML = `
          <option value="">
            Select Gram Panchayat
          </option>
        `;

      }
    );


    talukSelect.addEventListener(
      "change",
      () => {

        populateGPSelect(
          districtSelect.value,
          talukSelect.value
        );

      }
    );


    populateTalukSelect(
      item.crmDistrictId || "",
      item.crmTalukId || ""
    );


    populateGPSelect(
      item.crmDistrictId || "",
      item.crmTalukId || "",
      item.crmGPId || ""
    );

  }

}


/* =========================================================
   TALUK DROPDOWN
========================================================= */

function populateTalukSelect(
  districtId,
  selectedId = ""
) {

  const select =
    document.getElementById(
      "talukSelect"
    );

  if (!select) return;

  const filtered =
    taluks.filter(
      (taluk) =>
        taluk.crmDistrictId === districtId
    );


  select.innerHTML = `
    <option value="">
      Select taluk
    </option>

    ${filtered.map((taluk) => `
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
    `).join("")}
  `;

}


/* =========================================================
   GP DROPDOWN
========================================================= */

function populateGPSelect(
  districtId,
  talukId,
  selectedId = ""
) {

  const select =
    document.getElementById(
      "gpSelect"
    );

  if (!select) return;

  const filtered =
    gps.filter(
      (gp) =>
        gp.crmDistrictId === districtId &&
        gp.crmTalukId === talukId
    );


  select.innerHTML = `
    <option value="">
      Select Gram Panchayat
    </option>

    ${filtered.map((gp) => `
      <option
        value="${gp.id}"
        ${
          gp.id === selectedId
            ? "selected"
            : ""
        }
      >
        ${escapeHtml(
          gp.crmGPName || ""
        )}
      </option>
    `).join("")}
  `;

}


/* =========================================================
   SAVE
========================================================= */

locationForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    formError.classList.add("hidden");

    const name =
      locationName.value.trim();

    if (!name) {

      showFormError(
        "Please enter a name."
      );

      return;
    }


    saveButton.disabled = true;

    saveButton.textContent =
      editingId
        ? "Updating..."
        : "Saving...";


    try {

      if (activeTab === "districts") {

        await saveDistrict(name);

      }

      else if (activeTab === "taluks") {

        await saveTaluk(name);

      }

      else if (activeTab === "gps") {

        await saveGP(name);

      }

      else if (activeTab === "villages") {

        await saveVillage(name);

      }


      closeLocationModal();

      showToast(
        "Success",
        editingId
          ? `${COLLECTIONS[activeTab].label} updated.`
          : `${COLLECTIONS[activeTab].label} added.`
      );

    }

    catch (error) {

      console.error(
        "Save location error:",
        error
      );

      showFormError(
        getFriendlyFirebaseError(error)
      );

    }

    finally {

      saveButton.disabled = false;

      saveButton.textContent =
        editingId
          ? `Update ${COLLECTIONS[activeTab].label}`
          : `Save ${COLLECTIONS[activeTab].label}`;

    }

  }
);


/* =========================================================
   SAVE DISTRICT
========================================================= */

async function saveDistrict(name) {

  const duplicate =
    districts.some(
      (district) =>
        district.crmDistrictName
          ?.trim()
          .toLowerCase() === name.toLowerCase() &&
        district.id !== editingId
    );

  if (duplicate) {

    throw new Error(
      "A district with this name already exists."
    );

  }


  const data = {

    crmDistrictName: name,

    crmDistrictCode:
      createCode(name),

    crmActive: true,

    crmUpdatedAt:
      serverTimestamp(),

    crmUpdatedBy:
      currentUser.uid

  };


  if (editingId) {

    await updateDoc(
      doc(
        db,
        "crmDistricts",
        editingId
      ),
      data
    );

  }

  else {

    await addDoc(
      collection(
        db,
        "crmDistricts"
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

}


/* =========================================================
   SAVE TALUK
========================================================= */

async function saveTaluk(name) {

  const districtId =
    document.getElementById(
      "districtSelect"
    )?.value;


  if (!districtId) {

    throw new Error(
      "Please select a district."
    );

  }


  const district =
    districts.find(
      (item) =>
        item.id === districtId
    );


  if (!district) {

    throw new Error(
      "Selected district was not found."
    );

  }


  const duplicate =
    taluks.some(
      (taluk) =>
        taluk.crmDistrictId === districtId &&
        taluk.crmTalukName
          ?.trim()
          .toLowerCase() === name.toLowerCase() &&
        taluk.id !== editingId
    );


  if (duplicate) {

    throw new Error(
      "This taluk already exists under the selected district."
    );

  }


  const data = {

    crmTalukName: name,

    crmDistrictId:
      district.id,

    crmDistrictName:
      district.crmDistrictName,

    crmActive: true,

    crmUpdatedAt:
      serverTimestamp(),

    crmUpdatedBy:
      currentUser.uid

  };


  if (editingId) {

    await updateDoc(
      doc(
        db,
        "crmTaluks",
        editingId
      ),
      data
    );

  }

  else {

    await addDoc(
      collection(
        db,
        "crmTaluks"
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

}


/* =========================================================
   SAVE GP
========================================================= */

async function saveGP(name) {

  const districtId =
    document.getElementById(
      "districtSelect"
    )?.value;

  const talukId =
    document.getElementById(
      "talukSelect"
    )?.value;


  if (!districtId) {

    throw new Error(
      "Please select a district."
    );

  }


  if (!talukId) {

    throw new Error(
      "Please select a taluk."
    );

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

    throw new Error(
      "Selected location was not found."
    );

  }


  const duplicate =
    gps.some(
      (gp) =>
        gp.crmTalukId === talukId &&
        gp.crmGPName
          ?.trim()
          .toLowerCase() === name.toLowerCase() &&
        gp.id !== editingId
    );


  if (duplicate) {

    throw new Error(
      "This Gram Panchayat already exists under the selected taluk."
    );

  }


  const data = {

    crmGPName: name,

    crmDistrictId:
      district.id,

    crmDistrictName:
      district.crmDistrictName,

    crmTalukId:
      taluk.id,

    crmTalukName:
      taluk.crmTalukName,

    crmActive: true,

    crmUpdatedAt:
      serverTimestamp(),

    crmUpdatedBy:
      currentUser.uid

  };


  if (editingId) {

    await updateDoc(
      doc(
        db,
        "crmGramPanchayats",
        editingId
      ),
      data
    );

  }

  else {

    await addDoc(
      collection(
        db,
        "crmGramPanchayats"
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

}


/* =========================================================
   SAVE VILLAGE
========================================================= */

async function saveVillage(name) {

  const districtId =
    document.getElementById(
      "districtSelect"
    )?.value;

  const talukId =
    document.getElementById(
      "talukSelect"
    )?.value;

  const gpId =
    document.getElementById(
      "gpSelect"
    )?.value;


  if (!districtId) {

    throw new Error(
      "Please select a district."
    );

  }


  if (!talukId) {

    throw new Error(
      "Please select a taluk."
    );

  }


  if (!gpId) {

    throw new Error(
      "Please select a Gram Panchayat."
    );

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

  const gp =
    gps.find(
      (item) =>
        item.id === gpId
    );


  if (!district || !taluk || !gp) {

    throw new Error(
      "Selected location was not found."
    );

  }


  const duplicate =
    villages.some(
      (village) =>
        village.crmGPId === gpId &&
        village.crmVillageName
          ?.trim()
          .toLowerCase() === name.toLowerCase() &&
        village.id !== editingId
    );


  if (duplicate) {

    throw new Error(
      "This village already exists under the selected Gram Panchayat."
    );

  }


  const data = {

    crmVillageName: name,

    crmDistrictId:
      district.id,

    crmDistrictName:
      district.crmDistrictName,

    crmTalukId:
      taluk.id,

    crmTalukName:
      taluk.crmTalukName,

    crmGPId:
      gp.id,

    crmGPName:
      gp.crmGPName,

    crmActive: true,

    crmUpdatedAt:
      serverTimestamp(),

    crmUpdatedBy:
      currentUser.uid

  };


  if (editingId) {

    await updateDoc(
      doc(
        db,
        "crmVillages",
        editingId
      ),
      data
    );

  }

  else {

    await addDoc(
      collection(
        db,
        "crmVillages"
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

}


/* =========================================================
   TABLE ACTION EVENTS
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

  const item =
    getActiveData().find(
      (entry) =>
        entry.id === id
    );

  if (!item) return;

  deleteTarget = item;

  document.getElementById(
    "deleteMessage"
  ).textContent =
    `Are you sure you want to delete "${getItemName(item)}"? This action cannot be undone.`;

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

    const label =
      getItemName(deleteTarget);

    try {

      await deleteDoc(
        doc(
          db,
          COLLECTIONS[activeTab].collection,
          id
        )
      );

      closeDeleteModal();

      showToast(
        "Deleted",
        `${COLLECTIONS[activeTab].label} "${label}" deleted.`
      );

    }

    catch (error) {

      console.error(
        "Delete error:",
        error
      );

      showToast(
        "Error",
        getFriendlyFirebaseError(error),
        true
      );

    }

  }
);


/* =========================================================
   MODAL CLOSE
========================================================= */

function closeLocationModal() {

  locationModal.classList.add(
    "hidden"
  );

  editingId = null;

  locationForm.reset();

  parentFields.innerHTML = "";

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
  closeLocationModal
);


document.getElementById(
  "modalCancel"
).addEventListener(
  "click",
  closeLocationModal
);


document.getElementById(
  "deleteCancel"
).addEventListener(
  "click",
  closeDeleteModal
);


/* =========================================================
   CLICK OUTSIDE MODAL
========================================================= */

locationModal.addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
      locationModal
    ) {

      closeLocationModal();

    }

  }
);


deleteModal.addEventListener(
  "click",
  (event) => {

    if (
      event.target ===
      deleteModal
    ) {

      closeDeleteModal();

    }

  }
);


/* =========================================================
   SEARCH
========================================================= */

tableSearch.addEventListener(
  "input",
  () => renderTable()
);


globalSearch.addEventListener(
  "input",
  () => renderTable()
);


/* =========================================================
   ADD BUTTON TEXT
========================================================= */

function updateAddButton() {

  const label =
    COLLECTIONS[activeTab].label;

  addButtonText.textContent =
    `Add ${label}`;

}


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
   ESC KEY
========================================================= */

document.addEventListener(
  "keydown",
  (event) => {

    if (event.key === "Escape") {

      closeLocationModal();
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

  clearTimeout(toastTimer);

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

function showFormError(message) {

  formError.textContent =
    message;

  formError.classList.remove(
    "hidden"
  );

}


/* =========================================================
   DATE
========================================================= */

function formatDate(timestamp) {

  if (!timestamp) {
    return "—";
  }

  try {

    const date =
      timestamp.toDate
        ? timestamp.toDate()
        : new Date(timestamp);

    return new Intl.DateTimeFormat(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    ).format(date);

  }

  catch {

    return "—";

  }

}


/* =========================================================
   DISTRICT CODE
========================================================= */

function createCode(name) {

  const cleaned =
    name
      .trim()
      .replace(
        /[^a-zA-Z0-9]/g,
        ""
      )
      .toUpperCase();

  return cleaned.substring(
    0,
    4
  );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {

  return String(value ?? "")
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
   INITIAL UI
========================================================= */

updateAddButton();

renderTable();

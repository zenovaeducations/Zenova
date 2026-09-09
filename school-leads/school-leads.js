/* =========================================================
   ZENOVA - SCHOOL LEAD TRACKER
   Completely separate from crmStudents / crmLeads
========================================================= */

import { auth, db } from "../../../firebase/firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   COLLECTIONS
========================================================= */

const LEADS_COLLECTION = "schoolLeadRecords";
const SCHOOLS_COLLECTION = "crmSchools";


/* =========================================================
   STATE
========================================================= */

let currentUser = null;
let leads = [];
let schools = [];
let editingId = null;


/* =========================================================
   STATUS
========================================================= */

const STATUSES = [
    "NEW",
    "VISITING",
    "NOT_VISITING",
    "REJECTED",
    "PAYMENT_PENDING",
    "PAYMENT_COMPLETED"
];


function statusLabel(status) {

    const labels = {
        NEW: "New",
        VISITING: "Visiting",
        NOT_VISITING: "Not Visiting",
        REJECTED: "Rejected",
        PAYMENT_PENDING: "Payment Pending",
        PAYMENT_COMPLETED: "Payment Completed"
    };

    return labels[status] || status;

}


/* =========================================================
   DOM
========================================================= */

const addLeadBtn =
    document.getElementById("addLeadBtn");

const emptyAddBtn =
    document.getElementById("emptyAddBtn");

const modalBackdrop =
    document.getElementById("modalBackdrop");

const closeModalBtn =
    document.getElementById("closeModalBtn");

const cancelBtn =
    document.getElementById("cancelBtn");

const leadForm =
    document.getElementById("leadForm");

const modalTitle =
    document.getElementById("modalTitle");

const saveBtn =
    document.getElementById("saveBtn");

const studentNameInput =
    document.getElementById("studentName");

const phoneInput =
    document.getElementById("phone");

const schoolSelect =
    document.getElementById("schoolSelect");

const statusSelect =
    document.getElementById("status");

const detailsInput =
    document.getElementById("details");

const searchInput =
    document.getElementById("searchInput");

const schoolFilter =
    document.getElementById("schoolFilter");

const statusFilter =
    document.getElementById("statusFilter");

const leadTableBody =
    document.getElementById("leadTableBody");

const recordInfo =
    document.getElementById("recordInfo");

const emptyState =
    document.getElementById("emptyState");

const schoolGrid =
    document.getElementById("schoolGrid");

const backBtn =
    document.getElementById("backBtn");


/* =========================================================
   VERY IMPORTANT
   BUTTON EVENTS ARE REGISTERED IMMEDIATELY
========================================================= */

if (addLeadBtn) {
    addLeadBtn.onclick = function () {
        openAddModal();
    };
}

if (emptyAddBtn) {
    emptyAddBtn.onclick = function () {
        openAddModal();
    };
}

if (closeModalBtn) {
    closeModalBtn.onclick = function () {
        closeModal();
    };
}

if (cancelBtn) {
    cancelBtn.onclick = function () {
        closeModal();
    };
}

if (backBtn) {
    backBtn.onclick = function () {

        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = "../";
        }

    };
}


/* =========================================================
   OPEN ADD MODAL
========================================================= */

function openAddModal() {

    editingId = null;

    if (modalTitle) {
        modalTitle.textContent = "Add Student";
    }

    if (saveBtn) {
        saveBtn.textContent = "Save Student";
        saveBtn.disabled = false;
    }

    if (leadForm) {
        leadForm.reset();
    }

    if (statusSelect) {
        statusSelect.value = "NEW";
    }

    if (modalBackdrop) {
        modalBackdrop.classList.remove("hidden");
        modalBackdrop.style.display = "flex";
    }

    setTimeout(() => {

        if (studentNameInput) {
            studentNameInput.focus();
        }

    }, 100);

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal() {

    editingId = null;

    if (modalBackdrop) {
        modalBackdrop.classList.add("hidden");
        modalBackdrop.style.display = "none";
    }

}


/* =========================================================
   CLICK OUTSIDE MODAL
========================================================= */

if (modalBackdrop) {

    modalBackdrop.onclick = function (event) {

        if (event.target === modalBackdrop) {
            closeModal();
        }

    };

}


/* =========================================================
   ESC KEY
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {
            closeModal();
        }

    }
);


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    function (user) {

        if (!user) {

            console.log(
                "No authenticated user."
            );

            return;
        }

        currentUser = user;

        loadSchools();
        loadLeads();

    }
);


/* =========================================================
   LOAD SCHOOLS
========================================================= */

function loadSchools() {

    const ref =
        collection(
            db,
            SCHOOLS_COLLECTION
        );


    onSnapshot(
        ref,

        function (snapshot) {

            schools = [];

            snapshot.forEach(
                function (item) {

                    const data =
                        item.data();

                    if (
                        data.crmActive === false
                    ) {
                        return;
                    }

                    schools.push({

                        id: item.id,

                        ...data

                    });

                }
            );


            schools.sort(
                function (a, b) {

                    const nameA =
                        getSchoolName(a)
                            .toLowerCase();

                    const nameB =
                        getSchoolName(b)
                            .toLowerCase();

                    return nameA.localeCompare(
                        nameB
                    );

                }
            );


            populateSchools();

        },

        function (error) {

            console.error(
                "School loading failed:",
                error
            );

            /*
             * IMPORTANT:
             * Do NOT stop the application.
             * The Add Student button still works.
             */

            schoolSelect.innerHTML = `
                <option value="">
                    Unable to load schools
                </option>
            `;

        }
    );

}


/* =========================================================
   SCHOOL NAME
========================================================= */

function getSchoolName(school) {

    return (
        school.crmSchoolName ||
        school.schoolName ||
        school.name ||
        "Unnamed School"
    );

}


/* =========================================================
   POPULATE SCHOOL DROPDOWNS
========================================================= */

function populateSchools() {

    if (!schoolSelect) {
        return;
    }


    schoolSelect.innerHTML = `
        <option value="">
            Select School
        </option>
    `;


    schoolFilter.innerHTML = `
        <option value="">
            All Schools
        </option>
    `;


    schools.forEach(
        function (school) {

            const name =
                getSchoolName(school);


            const option1 =
                document.createElement(
                    "option"
                );

            option1.value =
                school.id;

            option1.textContent =
                name;

            schoolSelect.appendChild(
                option1
            );


            const option2 =
                document.createElement(
                    "option"
                );

            option2.value =
                school.id;

            option2.textContent =
                name;

            schoolFilter.appendChild(
                option2
            );

        }
    );

}


/* =========================================================
   LOAD LEADS
========================================================= */

function loadLeads() {

    const ref =
        collection(
            db,
            LEADS_COLLECTION
        );


    onSnapshot(

        ref,

        function (snapshot) {

            leads = [];

            snapshot.forEach(
                function (item) {

                    leads.push({

                        id: item.id,

                        ...item.data()

                    });

                }
            );


            leads.sort(
                function (a, b) {

                    const timeA =
                        getTime(a.createdAt);

                    const timeB =
                        getTime(b.createdAt);

                    return timeB - timeA;

                }
            );


            render();

        },

        function (error) {

            console.error(
                "Lead loading failed:",
                error
            );

            leads = [];

            render();

        }

    );

}


/* =========================================================
   TIMESTAMP
========================================================= */

function getTime(timestamp) {

    if (!timestamp) {
        return 0;
    }

    if (
        typeof timestamp.toMillis ===
        "function"
    ) {
        return timestamp.toMillis();
    }

    if (timestamp.seconds) {
        return timestamp.seconds * 1000;
    }

    return 0;

}


/* =========================================================
   SAVE FORM
========================================================= */

if (leadForm) {

    leadForm.onsubmit = async function (event) {

        event.preventDefault();


        const studentName =
            studentNameInput.value
                .trim();


        const phone =
            phoneInput.value
                .replace(/\D/g, "");


        const schoolId =
            schoolSelect.value;


        const status =
            statusSelect.value;


        const details =
            detailsInput.value
                .trim();


        /* -------------------------
           VALIDATION
        ------------------------- */

        if (
            studentName.length < 2
        ) {

            alert(
                "Please enter student name."
            );

            return;

        }


        if (
            !/^[6-9][0-9]{9}$/.test(
                phone
            )
        ) {

            alert(
                "Enter a valid 10-digit mobile number."
            );

            return;

        }


        if (!schoolId) {

            alert(
                "Please select a school."
            );

            return;

        }


        const school =
            schools.find(
                function (item) {
                    return item.id === schoolId;
                }
            );


        if (!school) {

            alert(
                "School not found."
            );

            return;

        }


        /* -------------------------
           DISABLE BUTTON
        ------------------------- */

        saveBtn.disabled = true;

        saveBtn.textContent =
            editingId
                ? "Updating..."
                : "Saving...";


        try {

            const schoolName =
                getSchoolName(school);


            /* =================================================
               EDIT EXISTING
            ================================================= */

            if (editingId) {

                await updateDoc(

                    doc(
                        db,
                        LEADS_COLLECTION,
                        editingId
                    ),

                    {

                        studentName:
                            studentName,

                        phone:
                            phone,

                        schoolId:
                            schoolId,

                        schoolName:
                            schoolName,

                        status:
                            status,

                        details:
                            details,

                        updatedAt:
                            serverTimestamp(),

                        updatedBy:
                            currentUser
                                ? currentUser.uid
                                : ""

                    }

                );

            }


            /* =================================================
               CREATE NEW
            ================================================= */

            else {

                await addDoc(

                    collection(
                        db,
                        LEADS_COLLECTION
                    ),

                    {

                        /*
                         * THIS IS A COMPLETELY
                         * INDEPENDENT RECORD.
                         *
                         * NO crmStudentId
                         * NO crmLeadId
                         * NO enrollment
                         * NO course
                         */

                        studentName:
                            studentName,

                        phone:
                            phone,

                        schoolId:
                            schoolId,

                        schoolName:
                            schoolName,

                        status:
                            status,

                        details:
                            details,

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp(),

                        createdBy:
                            currentUser
                                ? currentUser.uid
                                : "",

                        createdByEmail:
                            currentUser
                                ? (
                                    currentUser.email ||
                                    ""
                                )
                                : ""

                    }

                );

            }


            closeModal();

        }

        catch (error) {

            console.error(
                "SAVE ERROR:",
                error
            );

            alert(
                "Could not save student.\n\n" +
                error.message
            );

        }

        finally {

            saveBtn.disabled =
                false;

            saveBtn.textContent =
                editingId
                    ? "Update Student"
                    : "Save Student";

        }

    };

}


/* =========================================================
   RENDER
========================================================= */

function render() {

    updateSummary();

    renderSchoolWise();

    renderTable();

}


/* =========================================================
   SUMMARY
========================================================= */

function updateSummary() {

    const count =
        function (status) {

            return leads.filter(
                function (lead) {
                    return lead.status === status;
                }
            ).length;

        };


    setText(
        "totalCount",
        leads.length
    );

    setText(
        "newCount",
        count("NEW")
    );

    setText(
        "visitingCount",
        count("VISITING")
    );

    setText(
        "notVisitingCount",
        count("NOT_VISITING")
    );

    setText(
        "rejectedCount",
        count("REJECTED")
    );

    setText(
        "paymentPendingCount",
        count("PAYMENT_PENDING")
    );

    setText(
        "paymentCompletedCount",
        count("PAYMENT_COMPLETED")
    );

}


/* =========================================================
   SCHOOL-WISE
========================================================= */

function renderSchoolWise() {

    if (!schoolGrid) {
        return;
    }


    const grouped = {};


    leads.forEach(
        function (lead) {

            const id =
                lead.schoolId ||
                "unknown";


            if (!grouped[id]) {

                grouped[id] = {

                    name:
                        lead.schoolName ||
                        "Unknown School",

                    count: 0

                };

            }


            grouped[id].count++;

        }
    );


    const items =
        Object.entries(grouped)
            .sort(
                function (a, b) {

                    return (
                        b[1].count -
                        a[1].count
                    );

                }
            );


    if (!items.length) {

        schoolGrid.innerHTML = `
            <div style="
                padding:20px;
                color:#737373;
                font-size:13px;
            ">
                No school leads yet.
            </div>
        `;

        return;

    }


    schoolGrid.innerHTML =
        items.map(
            function ([schoolId, data]) {

                return `

                    <div
                        class="school-card"
                        data-school="${escapeHtml(
                            schoolId
                        )}"
                    >

                        <div class="school-name">
                            ${escapeHtml(
                                data.name
                            )}
                        </div>

                        <div>

                            <span class="school-number">
                                ${data.count}
                            </span>

                            <span class="school-label">
                                students
                            </span>

                        </div>

                    </div>

                `;

            }
        ).join("");


    schoolGrid
        .querySelectorAll(
            ".school-card"
        )
        .forEach(
            function (card) {

                card.onclick =
                    function () {

                        schoolFilter.value =
                            card.dataset.school;

                        renderTable();

                    };

            }
        );

}


/* =========================================================
   FILTER
========================================================= */

function getFilteredLeads() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const selectedSchool =
        schoolFilter.value;


    const selectedStatus =
        statusFilter.value;


    return leads.filter(
        function (lead) {

            const name =
                String(
                    lead.studentName || ""
                ).toLowerCase();


            const phone =
                String(
                    lead.phone || ""
                );


            const matchesSearch =
                !search ||
                name.includes(search) ||
                phone.includes(search);


            const matchesSchool =
                !selectedSchool ||
                lead.schoolId ===
                    selectedSchool;


            const matchesStatus =
                !selectedStatus ||
                lead.status ===
                    selectedStatus;


            return (
                matchesSearch &&
                matchesSchool &&
                matchesStatus
            );

        }
    );

}


/* =========================================================
   TABLE
========================================================= */

function renderTable() {

    const data =
        getFilteredLeads();


    if (recordInfo) {

        recordInfo.textContent =
            `${data.length} ${
                data.length === 1
                    ? "record"
                    : "records"
            }`;

    }


    if (!leadTableBody) {
        return;
    }


    leadTableBody.innerHTML = "";


    if (!data.length) {

        emptyState.classList.add(
            "visible"
        );

        return;

    }


    emptyState.classList.remove(
        "visible"
    );


    data.forEach(
        function (lead) {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>

                    <div class="student-name">
                        ${escapeHtml(
                            lead.studentName ||
                            "—"
                        )}
                    </div>

                </td>


                <td>

                    ${
                        lead.phone
                            ? `
                                <a
                                    href="tel:${escapeHtml(
                                        lead.phone
                                    )}"
                                    class="phone-link"
                                >
                                    ${escapeHtml(
                                        lead.phone
                                    )}
                                </a>
                            `
                            : "—"
                    }

                </td>


                <td>

                    <div class="school-cell">
                        ${escapeHtml(
                            lead.schoolName ||
                            "—"
                        )}
                    </div>

                </td>


                <td>

                    <select
                        class="status-select"
                        data-id="${escapeHtml(
                            lead.id
                        )}"
                    >

                        ${STATUSES.map(
                            function (status) {

                                return `

                                    <option
                                        value="${status}"
                                        ${
                                            lead.status ===
                                            status
                                                ? "selected"
                                                : ""
                                        }
                                    >
                                        ${statusLabel(
                                            status
                                        )}
                                    </option>

                                `;

                            }
                        ).join("")}

                    </select>

                </td>


                <td>

                    <div class="details-cell">

                        ${escapeHtml(
                            lead.details ||
                            "—"
                        )}

                    </div>

                </td>


                <td>
                    ${formatDate(
                        lead.createdAt
                    )}
                </td>


                <td>

                    <div class="action-buttons">

                        <button
                            class="icon-btn edit-btn"
                            data-id="${escapeHtml(
                                lead.id
                            )}"
                            type="button"
                        >
                            ✎
                        </button>


                        <button
                            class="icon-btn delete delete-btn"
                            data-id="${escapeHtml(
                                lead.id
                            )}"
                            type="button"
                        >
                            ×
                        </button>

                    </div>

                </td>

            `;


            leadTableBody.appendChild(
                row
            );

        }
    );


    attachTableEvents();

}


/* =========================================================
   TABLE EVENTS
========================================================= */

function attachTableEvents() {


    leadTableBody
        .querySelectorAll(
            ".status-select"
        )
        .forEach(
            function (select) {

                select.onchange =
                    function () {

                        updateStatus(
                            select.dataset.id,
                            select.value
                        );

                    };

            }
        );


    leadTableBody
        .querySelectorAll(
            ".edit-btn"
        )
        .forEach(
            function (button) {

                button.onclick =
                    function () {

                        editLead(
                            button.dataset.id
                        );

                    };

            }
        );


    leadTableBody
        .querySelectorAll(
            ".delete-btn"
        )
        .forEach(
            function (button) {

                button.onclick =
                    function () {

                        removeLead(
                            button.dataset.id
                        );

                    };

            }
        );

}


/* =========================================================
   UPDATE STATUS
========================================================= */

async function updateStatus(
    id,
    status
) {

    try {

        await updateDoc(

            doc(
                db,
                LEADS_COLLECTION,
                id
            ),

            {

                status:
                    status,

                updatedAt:
                    serverTimestamp(),

                updatedBy:
                    currentUser
                        ? currentUser.uid
                        : ""

            }

        );

    }

    catch (error) {

        console.error(
            error
        );

        alert(
            "Could not update status."
        );

    }

}


/* =========================================================
   EDIT LEAD
========================================================= */

function editLead(id) {

    const lead =
        leads.find(
            function (item) {
                return item.id === id;
            }
        );


    if (!lead) {
        return;
    }


    editingId = id;


    modalTitle.textContent =
        "Edit Student";


    saveBtn.textContent =
        "Update Student";


    studentNameInput.value =
        lead.studentName || "";


    phoneInput.value =
        lead.phone || "";


    schoolSelect.value =
        lead.schoolId || "";


    statusSelect.value =
        lead.status || "NEW";


    detailsInput.value =
        lead.details || "";


    modalBackdrop.classList.remove(
        "hidden"
    );

    modalBackdrop.style.display =
        "flex";

}


/* =========================================================
   DELETE
========================================================= */

async function removeLead(id) {

    const lead =
        leads.find(
            function (item) {
                return item.id === id;
            }
        );


    if (!lead) {
        return;
    }


    const yes =
        confirm(
            `Delete "${lead.studentName}"?`
        );


    if (!yes) {
        return;
    }


    try {

        await deleteDoc(

            doc(
                db,
                LEADS_COLLECTION,
                id
            )

        );

    }

    catch (error) {

        console.error(
            error
        );

        alert(
            "Could not delete student."
        );

    }

}


/* =========================================================
   FILTER EVENTS
========================================================= */

if (searchInput) {

    searchInput.oninput =
        function () {

            renderTable();

        };

}


if (schoolFilter) {

    schoolFilter.onchange =
        function () {

            renderTable();

        };

}


if (statusFilter) {

    statusFilter.onchange =
        function () {

            renderTable();

        };

}


/* =========================================================
   PHONE
========================================================= */

if (phoneInput) {

    phoneInput.oninput =
        function () {

            phoneInput.value =
                phoneInput.value
                    .replace(/\D/g, "")
                    .slice(0, 10);

        };

}


/* =========================================================
   DATE
========================================================= */

function formatDate(timestamp) {

    const time =
        getTime(timestamp);


    if (!time) {
        return "—";
    }


    return new Date(time)
        .toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent = value;
    }

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
   START
========================================================= */

console.log(
    "Zenova School Lead Tracker loaded."
);

/* =========================================================
   ZENOVA SCHOOL LEADS CRM
   Completely independent lead system
========================================================= */

import {
    auth,
    db
} from "../../../firebase/firebase-config.js";


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
    serverTimestamp,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   COLLECTIONS
========================================================= */

const LEADS_COLLECTION =
    "schoolLeadRecords";

const SCHOOLS_COLLECTION =
    "crmSchools";


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let leads = [];

let schools = [];

let editingId = null;

let activeSchoolId = "";


/* =========================================================
   STATUS
========================================================= */

const STATUS_OPTIONS = [
    {
        value: "NEW",
        label: "New"
    },
    {
        value: "VISITING",
        label: "Visiting"
    },
    {
        value: "NOT_VISITING",
        label: "Not Visiting"
    },
    {
        value: "REJECTED",
        label: "Rejected"
    },
    {
        value: "PAYMENT_PENDING",
        label: "Payment Pending"
    },
    {
        value: "PAYMENT_COMPLETED",
        label: "Payment Completed"
    }
];


const STATUS_LABELS = Object.fromEntries(
    STATUS_OPTIONS.map(item => [
        item.value,
        item.label
    ])
);


/* =========================================================
   DOM
========================================================= */

const totalCount =
    document.getElementById("totalCount");

const newCount =
    document.getElementById("newCount");

const visitingCount =
    document.getElementById("visitingCount");

const notVisitingCount =
    document.getElementById("notVisitingCount");

const rejectedCount =
    document.getElementById("rejectedCount");

const paymentPendingCount =
    document.getElementById("paymentPendingCount");

const paymentCompletedCount =
    document.getElementById("paymentCompletedCount");


const schoolGrid =
    document.getElementById("schoolGrid");

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


const addLeadBtn =
    document.getElementById("addLeadBtn");

const emptyAddBtn =
    document.getElementById("emptyAddBtn");

const backBtn =
    document.getElementById("backBtn");


/* =========================================================
   MODAL DOM
========================================================= */

const modalBackdrop =
    document.getElementById("modalBackdrop");

const modalTitle =
    document.getElementById("modalTitle");

const closeModalBtn =
    document.getElementById("closeModalBtn");

const cancelBtn =
    document.getElementById("cancelBtn");

const leadForm =
    document.getElementById("leadForm");

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

const saveBtn =
    document.getElementById("saveBtn");


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "../";

            return;
        }

        currentUser = user;

        await Promise.all([
            loadSchools(),
            loadLeads()
        ]);

    }
);


/* =========================================================
   LOAD SCHOOLS
========================================================= */

function loadSchools() {

    const schoolsRef =
        collection(
            db,
            SCHOOLS_COLLECTION
        );

    const schoolsQuery =
        query(
            schoolsRef,
            orderBy(
                "crmSchoolName"
            )
        );

    onSnapshot(
        schoolsQuery,
        (snapshot) => {

            schools =
                snapshot.docs
                    .map(item => ({
                        id: item.id,
                        ...item.data()
                    }))
                    .filter(
                        item =>
                            item.crmActive !== false
                    );

            populateSchoolSelects();

            renderSchoolWise();

        },
        (error) => {

            console.error(
                "School loading error:",
                error
            );

            alert(
                "Unable to load schools."
            );

        }
    );
}


/* =========================================================
   LOAD LEADS
========================================================= */

function loadLeads() {

    const leadsRef =
        collection(
            db,
            LEADS_COLLECTION
        );

    const leadsQuery =
        query(
            leadsRef,
            orderBy(
                "createdAt",
                "desc"
            )
        );

    onSnapshot(
        leadsQuery,
        (snapshot) => {

            leads =
                snapshot.docs.map(
                    item => ({
                        id: item.id,
                        ...item.data()
                    })
                );

            renderAll();

        },
        (error) => {

            console.error(
                "Lead loading error:",
                error
            );

            alert(
                "Unable to load school leads."
            );

        }
    );
}


/* =========================================================
   POPULATE SCHOOL SELECTS
========================================================= */

function populateSchoolSelects() {

    const currentFormValue =
        schoolSelect.value;

    const currentFilterValue =
        schoolFilter.value;


    const options = schools
        .sort(
            (a, b) =>
                String(
                    a.crmSchoolName || ""
                ).localeCompare(
                    String(
                        b.crmSchoolName || ""
                    )
                )
        )
        .map(
            school => `
                <option value="${escapeHtml(
                    school.id
                )}">
                    ${escapeHtml(
                        school.crmSchoolName ||
                        "Unnamed School"
                    )}
                </option>
            `
        )
        .join("");


    schoolSelect.innerHTML = `
        <option value="">
            Select School
        </option>

        ${options}
    `;


    schoolFilter.innerHTML = `
        <option value="">
            All Schools
        </option>

        ${options}
    `;


    if (
        schools.some(
            school =>
                school.id ===
                currentFormValue
        )
    ) {

        schoolSelect.value =
            currentFormValue;

    }


    if (
        schools.some(
            school =>
                school.id ===
                currentFilterValue
        )
    ) {

        schoolFilter.value =
            currentFilterValue;

    }

}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

    updateSummary();

    renderSchoolWise();

    renderTable();

}


/* =========================================================
   SUMMARY
========================================================= */

function updateSummary() {

    const count = status =>

        leads.filter(
            lead =>
                lead.status === status
        ).length;


    totalCount.textContent =
        leads.length;

    newCount.textContent =
        count("NEW");

    visitingCount.textContent =
        count("VISITING");

    notVisitingCount.textContent =
        count("NOT_VISITING");

    rejectedCount.textContent =
        count("REJECTED");

    paymentPendingCount.textContent =
        count("PAYMENT_PENDING");

    paymentCompletedCount.textContent =
        count("PAYMENT_COMPLETED");

}


/* =========================================================
   SCHOOL WISE
========================================================= */

function renderSchoolWise() {

    const grouped = {};


    leads.forEach(
        lead => {

            const schoolId =
                lead.schoolId ||
                "unknown";

            if (!grouped[schoolId]) {

                grouped[schoolId] = {
                    name:
                        lead.schoolName ||
                        "Unknown School",

                    count: 0
                };

            }

            grouped[schoolId].count++;

        }
    );


    const schoolData =
        Object.entries(grouped)
            .sort(
                (a, b) =>
                    b[1].count -
                    a[1].count
            );


    if (!schoolData.length) {

        schoolGrid.innerHTML = `
            <div class="school-empty">
                No school data yet.
            </div>
        `;

        return;
    }


    schoolGrid.innerHTML =
        schoolData.map(
            ([schoolId, data]) => {

                const active =
                    activeSchoolId ===
                    schoolId;

                return `
                    <div
                        class="school-card ${
                            active
                                ? "active"
                                : ""
                        }"
                        data-school-id="${escapeHtml(
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
            card => {

                card.addEventListener(
                    "click",
                    () => {

                        const schoolId =
                            card.dataset.schoolId;

                        if (
                            activeSchoolId ===
                            schoolId
                        ) {

                            activeSchoolId =
                                "";

                            schoolFilter.value =
                                "";

                        }
                        else {

                            activeSchoolId =
                                schoolId;

                            schoolFilter.value =
                                schoolId;

                        }

                        renderSchoolWise();

                        renderTable();

                    }
                );

            }
        );

}


/* =========================================================
   FILTER DATA
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
        lead => {

            const matchesSearch =
                !search ||
                String(
                    lead.studentName || ""
                )
                    .toLowerCase()
                    .includes(search) ||
                String(
                    lead.phone || ""
                )
                    .includes(search);


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


    recordInfo.textContent =
        `${data.length} ${
            data.length === 1
                ? "record"
                : "records"
        }`;


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
        lead => {

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
                                    class="phone-link"
                                    href="tel:${escapeHtml(
                                        lead.phone
                                    )}"
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

                        ${STATUS_OPTIONS.map(
                            option => `
                                <option
                                    value="${option.value}"
                                    ${
                                        lead.status ===
                                        option.value
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    ${option.label}
                                </option>
                            `
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
                            class="icon-btn edit"
                            data-id="${escapeHtml(
                                lead.id
                            )}"
                            title="Edit"
                        >
                            ✎
                        </button>

                        <button
                            class="icon-btn delete"
                            data-id="${escapeHtml(
                                lead.id
                            )}"
                            title="Delete"
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

    document
        .querySelectorAll(
            ".status-select"
        )
        .forEach(
            select => {

                select.addEventListener(
                    "change",
                    async () => {

                        const id =
                            select.dataset.id;

                        await changeStatus(
                            id,
                            select.value
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            ".edit"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        editLead(
                            button.dataset.id
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
                    () => {

                        deleteLead(
                            button.dataset.id
                        );

                    }
                );

            }
        );

}


/* =========================================================
   CHANGE STATUS
========================================================= */

async function changeStatus(
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
                status,
                updatedAt:
                    serverTimestamp(),

                updatedBy:
                    currentUser.uid
            }
        );

    }
    catch (error) {

        console.error(
            "Status update error:",
            error
        );

        alert(
            "Unable to update status."
        );

    }

}


/* =========================================================
   OPEN ADD MODAL
========================================================= */

function openAddModal() {

    editingId = null;

    modalTitle.textContent =
        "Add Student";

    saveBtn.textContent =
        "Save Student";

    leadForm.reset();

    statusSelect.value =
        "NEW";

    modalBackdrop.classList.remove(
        "hidden"
    );

    setTimeout(
        () =>
            studentNameInput.focus(),
        50
    );

}


/* =========================================================
   EDIT
========================================================= */

function editLead(id) {

    const lead =
        leads.find(
            item =>
                item.id === id
        );


    if (!lead) return;


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

}


/* =========================================================
   SAVE
========================================================= */

leadForm.addEventListener(
    "submit",
    async event => {

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


        if (
            studentName.length < 2
        ) {

            alert(
                "Please enter the student name."
            );

            return;

        }


        if (
            !/^[6-9]\d{9}$/.test(
                phone
            )
        ) {

            alert(
                "Please enter a valid 10-digit Indian mobile number."
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
                item =>
                    item.id ===
                    schoolId
            );


        if (!school) {

            alert(
                "Selected school was not found."
            );

            return;

        }


        saveBtn.disabled =
            true;

        saveBtn.textContent =
            "Saving...";


        try {

            if (editingId) {

                await updateDoc(
                    doc(
                        db,
                        LEADS_COLLECTION,
                        editingId
                    ),
                    {

                        studentName,

                        phone,

                        schoolId,

                        schoolName:
                            school.crmSchoolName ||
                            "",

                        status,

                        details,

                        updatedAt:
                            serverTimestamp(),

                        updatedBy:
                            currentUser.uid

                    }
                );

            }
            else {

                await addDoc(
                    collection(
                        db,
                        LEADS_COLLECTION
                    ),
                    {

                        /*
                         * IMPORTANT:
                         * This record intentionally
                         * has NO crmStudentId,
                         * crmLeadId, courseId,
                         * enrollmentId, etc.
                         */

                        studentName,

                        phone,

                        schoolId,

                        schoolName:
                            school.crmSchoolName ||
                            "",

                        status,

                        details,

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp(),

                        createdBy:
                            currentUser.uid,

                        createdByEmail:
                            currentUser.email ||
                            ""

                    }
                );

            }


            closeModal();

        }
        catch (error) {

            console.error(
                "Save lead error:",
                error
            );

            alert(
                "Unable to save student."
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

    }
);


/* =========================================================
   DELETE
========================================================= */

async function deleteLead(id) {

    const lead =
        leads.find(
            item =>
                item.id === id
        );


    if (!lead) return;


    const confirmed =
        confirm(
            `Delete ${lead.studentName || "this student"} from School Leads?`
        );


    if (!confirmed) return;


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
            "Delete error:",
            error
        );

        alert(
            "Unable to delete student."
        );

    }

}


/* =========================================================
   MODAL
========================================================= */

function closeModal() {

    modalBackdrop.classList.add(
        "hidden"
    );

    editingId = null;

    leadForm.reset();

    statusSelect.value =
        "NEW";

}


addLeadBtn.addEventListener(
    "click",
    openAddModal
);


emptyAddBtn.addEventListener(
    "click",
    openAddModal
);


closeModalBtn.addEventListener(
    "click",
    closeModal
);


cancelBtn.addEventListener(
    "click",
    closeModal
);


modalBackdrop.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            modalBackdrop
        ) {

            closeModal();

        }

    }
);


/* =========================================================
   FILTER EVENTS
========================================================= */

searchInput.addEventListener(
    "input",
    renderTable
);


statusFilter.addEventListener(
    "change",
    renderTable
);


schoolFilter.addEventListener(
    "change",
    () => {

        activeSchoolId =
            schoolFilter.value;

        renderSchoolWise();

        renderTable();

    }
);


/* =========================================================
   PHONE INPUT
========================================================= */

phoneInput.addEventListener(
    "input",
    () => {

        phoneInput.value =
            phoneInput.value
                .replace(/\D/g, "")
                .slice(0, 10);

    }
);


/* =========================================================
   BACK
========================================================= */

backBtn.addEventListener(
    "click",
    () => {

        if (
            window.history.length >
            1
        ) {

            window.history.back();

        }
        else {

            window.location.href =
                "../";

        }

    }
);


/* =========================================================
   ESCAPE KEY
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            !modalBackdrop.classList.contains(
                "hidden"
            )
        ) {

            closeModal();

        }

    }
);


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    timestamp
) {

    if (!timestamp) {
        return "—";
    }


    let date;


    if (
        typeof timestamp.toDate ===
        "function"
    ) {

        date =
            timestamp.toDate();

    }
    else if (
        timestamp.seconds
    ) {

        date =
            new Date(
                timestamp.seconds *
                    1000
            );

    }
    else {

        date =
            new Date(timestamp);

    }


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================================
   ESCAPE HTML
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

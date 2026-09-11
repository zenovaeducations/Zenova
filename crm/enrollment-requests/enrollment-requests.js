import {
    auth,
    db
} from "../../firebase/firebase-config.js";

import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =====================================================
   STATE
===================================================== */

let currentAdmin = null;

let requests = [];

let filteredRequests = [];

let selectedRequest = null;

let unsubscribeRequests = null;


/* =====================================================
   ELEMENTS
===================================================== */

const appLoader =
    document.getElementById(
        "appLoader"
    );

const crmApp =
    document.getElementById(
        "crmApp"
    );

const requestsTable =
    document.getElementById(
        "requestsTable"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );

const tableSearch =
    document.getElementById(
        "tableSearch"
    );

const globalSearch =
    document.getElementById(
        "globalSearch"
    );

const statusFilter =
    document.getElementById(
        "statusFilter"
    );

const paymentFilter =
    document.getElementById(
        "paymentFilter"
    );

const pendingCount =
    document.getElementById(
        "pendingCount"
    );

const paymentCount =
    document.getElementById(
        "paymentCount"
    );

const approvedCount =
    document.getElementById(
        "approvedCount"
    );

const rejectedCount =
    document.getElementById(
        "rejectedCount"
    );

const sidebarPendingCount =
    document.getElementById(
        "sidebarPendingCount"
    );

const detailsModal =
    document.getElementById(
        "detailsModal"
    );

const modalContent =
    document.getElementById(
        "modalContent"
    );

const modalClose =
    document.getElementById(
        "modalClose"
    );

const modalOverlay =
    document.getElementById(
        "modalOverlay"
    );


/* =====================================================
   AUTH
===================================================== */

onAuthStateChanged(
    auth,
    user => {

        if (!user) {

            window.location.href =
                "../../login/";

            return;

        }


        currentAdmin =
            user;


        updateAdminUI();


        /*
         * IMPORTANT:
         *
         * Production Firestore rules must verify
         * the admin custom claim.
         *
         * This frontend check does NOT provide security.
         */

        startRequestsListener();


        showApp();

    }
);


/* =====================================================
   ADMIN UI
===================================================== */

function updateAdminUI() {

    const name =
        currentAdmin.displayName ||
        "Admin";


    const email =
        currentAdmin.email ||
        "";


    document.getElementById(
        "sidebarUserName"
    ).textContent =
        name;


    document.getElementById(
        "sidebarUserEmail"
    ).textContent =
        email;


    document.getElementById(
        "topbarName"
    ).textContent =
        name;


    const initial =
        name
            .trim()
            .charAt(0)
            .toUpperCase() ||
        "Z";


    document.getElementById(
        "sidebarAvatar"
    ).textContent =
        initial;


    document.getElementById(
        "topbarAvatar"
    ).textContent =
        initial;

}


/* =====================================================
   FIRESTORE
===================================================== */

function startRequestsListener() {

    if (
        unsubscribeRequests
    ) {

        unsubscribeRequests();

    }


    const requestsRef =
        collection(
            db,
            "courseEnrollmentRequests"
        );


    /*
     * We use createdAt ordering.
     *
     * If your existing documents don't have
     * createdAt yet, Firestore may exclude them
     * from this query. New requests created by
     * the Student Payment page do have it.
     */

    const requestsQuery =
        query(
            requestsRef,
            orderBy(
                "createdAt",
                "desc"
            )
        );


    unsubscribeRequests =
        onSnapshot(

            requestsQuery,

            snapshot => {

                requests =
                    snapshot.docs.map(
                        item => ({
                            id: item.id,
                            ...item.data()
                        })
                    );


                updateStatistics();

                applyFilters();

            },

            error => {

                console.error(
                    "ENROLLMENT REQUEST LISTENER ERROR:",
                    error
                );


                requestsTable.innerHTML = `

                    <tr>

                        <td
                            colspan="8"
                            class="table-loading"
                        >
                            Unable to load enrollment requests.
                        </td>

                    </tr>

                `;

            }

        );

}


/* =====================================================
   STATISTICS
===================================================== */

function updateStatistics() {

    const pending =
        requests.filter(
            item =>
                String(
                    item.status || ""
                ).toUpperCase() ===
                "PENDING"
        ).length;


    const paymentReceived =
        requests.filter(
            item =>
                String(
                    item.status || ""
                ).toUpperCase() ===
                "PAYMENT_RECEIVED"
        ).length;


    const approved =
        requests.filter(
            item =>
                String(
                    item.status || ""
                ).toUpperCase() ===
                "APPROVED"
        ).length;


    const rejected =
        requests.filter(
            item =>
                String(
                    item.status || ""
                ).toUpperCase() ===
                "REJECTED"
        ).length;


    pendingCount.textContent =
        pending;


    paymentCount.textContent =
        paymentReceived;


    approvedCount.textContent =
        approved;


    rejectedCount.textContent =
        rejected;


    sidebarPendingCount.textContent =
        pending;

}


/* =====================================================
   FILTERS
===================================================== */

tableSearch.addEventListener(
    "input",
    applyFilters
);

globalSearch.addEventListener(
    "input",
    () => {

        tableSearch.value =
            globalSearch.value;

        applyFilters();

    }
);

statusFilter.addEventListener(
    "change",
    applyFilters
);

paymentFilter.addEventListener(
    "change",
    applyFilters
);


function applyFilters() {

    const search =
        String(
            tableSearch.value || ""
        )
            .trim()
            .toLowerCase();


    const status =
        statusFilter.value;


    const payment =
        paymentFilter.value;


    filteredRequests =
        requests.filter(
            item => {

                const searchable = [

                    item.studentName,

                    item.phone,

                    item.email,

                    item.courseName,

                    item.courseCode,

                    item.courseClass

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                const searchMatch =
                    !search ||
                    searchable.includes(
                        search
                    );


                const statusMatch =
                    status === "ALL" ||
                    String(
                        item.status || ""
                    ).toUpperCase() ===
                    status;


                const paymentMatch =
                    payment === "ALL" ||
                    String(
                        item.paymentStatus || ""
                    ).toUpperCase() ===
                    payment;


                return (
                    searchMatch &&
                    statusMatch &&
                    paymentMatch
                );

            }
        );


    renderTable();

}


/* =====================================================
   TABLE
===================================================== */

function renderTable() {

    if (
        !filteredRequests.length
    ) {

        requestsTable.innerHTML =
            "";

        emptyState.classList.remove(
            "hidden"
        );

        return;

    }


    emptyState.classList.add(
        "hidden"
    );


    requestsTable.innerHTML =
        filteredRequests
            .map(
                request =>
                    createTableRow(
                        request
                    )
            )
            .join("");


    requestsTable
        .querySelectorAll(
            "[data-view]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.view;


                        const request =
                            requests.find(
                                item =>
                                    item.id === id
                            );


                        if (
                            request
                        ) {

                            openDetails(
                                request
                            );

                        }

                    }
                );

            }
        );

}


/* =====================================================
   TABLE ROW
===================================================== */

function createTableRow(
    request
) {

    const name =
        request.studentName ||
        "Unknown Student";


    const initial =
        name
            .trim()
            .charAt(0)
            .toUpperCase() ||
        "S";


    const phone =
        request.phone ||
        "No phone";


    const course =
        request.courseName ||
        "Unknown Course";


    const courseCode =
        request.courseCode ||
        "";


    const className =
        formatClass(
            request.courseClass ||
            request.className ||
            ""
        );


    const amount =
        formatMoney(
            request.finalPrice ??
            0
        );


    const status =
        String(
            request.status ||
            "PENDING"
        ).toUpperCase();


    const payment =
        String(
            request.paymentStatus ||
            "MANUAL_PAYMENT_PENDING"
        ).toUpperCase();


    return `

        <tr>

            <td>

                <div class="student-cell">

                    <div class="student-avatar">
                        ${escapeHtml(initial)}
                    </div>

                    <div>

                        <div class="student-name">
                            ${escapeHtml(name)}
                        </div>

                        <div class="student-phone">
                            ${escapeHtml(phone)}
                        </div>

                    </div>

                </div>

            </td>


            <td>

                <div class="course-name">
                    ${escapeHtml(course)}
                </div>

                ${
                    courseCode
                        ? `
                            <div class="course-code">
                                ${escapeHtml(courseCode)}
                            </div>
                        `
                        : ""
                }

            </td>


            <td>
                ${escapeHtml(className || "—")}
            </td>


            <td>

                <span class="amount">
                    ${amount}
                </span>

            </td>


            <td>

                <span class="badge ${paymentBadgeClass(payment)}">
                    ${paymentLabel(payment)}
                </span>

            </td>


            <td>

                <span class="badge ${statusBadgeClass(status)}">
                    ${statusLabel(status)}
                </span>

            </td>


            <td>
                ${formatDate(request.createdAt)}
            </td>


            <td>

                <button
                    class="view-button"
                    data-view="${escapeAttribute(request.id)}"
                >
                    View
                </button>

            </td>

        </tr>

    `;

}


/* =====================================================
   DETAILS
===================================================== */

function openDetails(
    request
) {

    selectedRequest =
        request;


    modalContent.innerHTML =
        createDetailsHTML(
            request
        );


    detailsModal.classList.remove(
        "hidden"
    );


    bindModalActions();

}


function createDetailsHTML(
    request
) {

    const status =
        String(
            request.status ||
            "PENDING"
        ).toUpperCase();


    const payment =
        String(
            request.paymentStatus ||
            "MANUAL_PAYMENT_PENDING"
        ).toUpperCase();


    return `

        <!-- STUDENT -->

        <section class="detail-section">

            <div class="detail-section-title">
                STUDENT INFORMATION
            </div>


            <div class="detail-grid">

                ${detail(
                    "Student Name",
                    request.studentName
                )}

                ${detail(
                    "Phone",
                    request.phone
                )}

                ${detail(
                    "Email",
                    request.email
                )}

                ${detail(
                    "Date of Birth",
                    request.dateOfBirth
                )}

                ${detail(
                    "Gender",
                    request.gender
                )}

            </div>

        </section>



        <!-- ACADEMIC -->

        <section class="detail-section">

            <div class="detail-section-title">
                ACADEMIC INFORMATION
            </div>


            <div class="detail-grid">

                ${detail(
                    "Class",
                    formatClass(
                        request.className ||
                        request.courseClass
                    )
                )}

                ${detail(
                    "Board",
                    request.board
                )}

                ${detail(
                    "Medium",
                    request.medium
                )}

                ${detail(
                    "Combination",
                    request.combination
                )}

                ${detail(
                    "Target",
                    request.target
                )}

                ${detail(
                    "School",
                    request.school
                )}

            </div>

        </section>



        <!-- LOCATION -->

        <section class="detail-section">

            <div class="detail-section-title">
                LOCATION
            </div>


            <div class="detail-grid">

                ${detail(
                    "District",
                    request.district
                )}

                ${detail(
                    "Taluk",
                    request.taluk
                )}

                ${detail(
                    "Gram Panchayat",
                    request.gramPanchayat
                )}

                ${detail(
                    "Village",
                    request.village
                )}

            </div>

        </section>



        <!-- COURSE -->

        <section class="detail-section">

            <div class="detail-section-title">
                COURSE
            </div>


            <div class="detail-grid">

                ${detail(
                    "Course",
                    request.courseName
                )}

                ${detail(
                    "Course Code",
                    request.courseCode
                )}

                ${detail(
                    "Course Class",
                    formatClass(
                        request.courseClass
                    )
                )}

                ${detail(
                    "Course Board",
                    request.courseBoard
                )}

                ${detail(
                    "Course Medium",
                    request.courseMedium
                )}

                ${detail(
                    "Selected Language",
                    request.selectedLanguage
                )}

            </div>

        </section>



        <!-- PAYMENT -->

        <section class="detail-section">

            <div class="detail-section-title">
                PAYMENT & ACCESS
            </div>


            <div class="verification-card">

                <div class="verification-row">

                    <span>
                        Course Price
                    </span>

                    <strong>
                        ${formatMoney(
                            request.coursePrice
                        )}
                    </strong>

                </div>


                <div class="verification-row">

                    <span>
                        Discount
                    </span>

                    <strong>
                        ${formatMoney(
                            request.discount
                        )}
                    </strong>

                </div>


                <div class="verification-row">

                    <span>
                        Amount to Pay
                    </span>

                    <strong>
                        ${formatMoney(
                            request.finalPrice
                        )}
                    </strong>

                </div>


                <div class="verification-row">

                    <span>
                        Payment Status
                    </span>

                    <span
                        class="badge ${paymentBadgeClass(payment)}"
                    >
                        ${paymentLabel(payment)}
                    </span>

                </div>


                <div class="verification-row">

                    <span>
                        Request Status
                    </span>

                    <span
                        class="badge ${statusBadgeClass(status)}"
                    >
                        ${statusLabel(status)}
                    </span>

                </div>

            </div>

        </section>



        <!-- ADMIN NOTES -->

        <section class="detail-section">

            <div class="detail-section-title">
                ADMIN NOTES
            </div>


            <textarea
                id="adminNotes"
                class="admin-notes"
                placeholder="Add internal notes..."
            >${escapeHtml(
                request.adminNotes || ""
            )}</textarea>


            <!-- ACTIONS -->

            <div class="modal-actions">


                <button
                    id="markPaymentButton"
                    class="action-button payment"
                    ${
                        payment === "PAID"
                            ? "disabled"
                            : ""
                    }
                >

                    ₹ Mark Payment Received

                </button>


                <button
                    id="approveButton"
                    class="action-button approve"
                    ${
                        payment !== "PAID"
                            ? "disabled"
                            : ""
                    }
                >

                    ✓ Give Access

                </button>


                <button
                    id="rejectButton"
                    class="action-button reject"
                >

                    × Reject Request

                </button>


            </div>

        </section>

    `;

}


/* =====================================================
   DETAIL ITEM
===================================================== */

function detail(
    label,
    value
) {

    return `

        <div class="detail-item">

            <span>
                ${escapeHtml(label)}
            </span>

            <strong>
                ${escapeHtml(
                    value || "—"
                )}
            </strong>

        </div>

    `;

}


/* =====================================================
   MODAL ACTIONS
===================================================== */

function bindModalActions() {

    const markPaymentButton =
        document.getElementById(
            "markPaymentButton"
        );


    const approveButton =
        document.getElementById(
            "approveButton"
        );


    const rejectButton =
        document.getElementById(
            "rejectButton"
        );


    if (
        markPaymentButton
    ) {

        markPaymentButton.addEventListener(
            "click",
            markPaymentReceived
        );

    }


    if (
        approveButton
    ) {

        approveButton.addEventListener(
            "click",
            giveAccess
        );

    }


    if (
        rejectButton
    ) {

        rejectButton.addEventListener(
            "click",
            rejectRequest
        );

    }

}


/* =====================================================
   SAVE NOTES
===================================================== */

async function saveAdminNotes() {

    if (
        !selectedRequest
    ) {

        return;

    }


    const notes =
        document.getElementById(
            "adminNotes"
        )?.value || "";


    const requestRef =
        doc(
            db,
            "courseEnrollmentRequests",
            selectedRequest.id
        );


    await updateDoc(
        requestRef,
        {

            adminNotes:
                notes,

            updatedAt:
                serverTimestamp(),

            updatedBy:
                currentAdmin.uid

        }
    );

}


/* =====================================================
   MARK PAYMENT
===================================================== */

async function markPaymentReceived() {

    if (
        !selectedRequest
    ) {

        return;

    }


    const confirmed =
        confirm(
            "Confirm that payment has been received for this enrollment request?"
        );


    if (
        !confirmed
    ) {

        return;

    }


    try {

        await saveAdminNotes();


        const requestRef =
            doc(
                db,
                "courseEnrollmentRequests",
                selectedRequest.id
            );


        await updateDoc(
            requestRef,
            {

                status:
                    "PAYMENT_RECEIVED",

                paymentStatus:
                    "PAID",

                paymentVerifiedAt:
                    serverTimestamp(),

                paymentVerifiedBy:
                    currentAdmin.uid,

                updatedAt:
                    serverTimestamp(),

                updatedBy:
                    currentAdmin.uid

            }
        );


        alert(
            "Payment marked as received."
        );


        closeModal();

    } catch (error) {

        console.error(
            "PAYMENT UPDATE ERROR:",
            error
        );


        alert(
            "Unable to update payment status."
        );

    }

}


/* =====================================================
   GIVE ACCESS
===================================================== */

async function giveAccess() {

    if (
        !selectedRequest
    ) {

        return;

    }


    const payment =
        String(
            selectedRequest.paymentStatus ||
            ""
        ).toUpperCase();


    if (
        payment !== "PAID"
    ) {

        alert(
            "Payment must be marked as received before giving course access."
        );

        return;

    }


    const confirmed =
        confirm(
            `Give course access to ${selectedRequest.studentName || "this student"}?`
        );


    if (
        !confirmed
    ) {

        return;

    }


    try {

        await saveAdminNotes();


        /*
         * -------------------------------------------------
         * CREATE ACTUAL STUDENT ENROLLMENT
         * -------------------------------------------------
         */

        const enrollmentData = {

            studentUid:
                selectedRequest.studentUid,

            crmCourseId:
                selectedRequest.crmCourseId,

            courseName:
                selectedRequest.courseName,

            courseCode:
                selectedRequest.courseCode,

            batchMode:
                selectedRequest.batchMode ||
                "ONLINE",

            selectedLanguage:
                selectedRequest.selectedLanguage ||
                "",

            amountPaid:
                Number(
                    selectedRequest.finalPrice ||
                    0
                ),

            paymentStatus:
                "PAID",

            status:
                "ACTIVE",

            progress:
                0,

            accessGranted:
                true,

            purchasedAt:
                selectedRequest.createdAt ||
                serverTimestamp(),

            accessStartDate:
                serverTimestamp(),

            approvedAt:
                serverTimestamp(),

            approvedBy:
                currentAdmin.uid,

            source:
                "CRM_ENROLLMENT_APPROVAL",

            enrollmentRequestId:
                selectedRequest.id,

            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };


        const enrollmentsRef =
            collection(
                db,
                "studentEnrollments"
            );


        const enrollmentDoc =
            await addDoc(
                enrollmentsRef,
                enrollmentData
            );


        /*
         * -------------------------------------------------
         * UPDATE REQUEST
         * -------------------------------------------------
         */

        const requestRef =
            doc(
                db,
                "courseEnrollmentRequests",
                selectedRequest.id
            );


        await updateDoc(
            requestRef,
            {

                status:
                    "APPROVED",

                accessGranted:
                    true,

                paymentStatus:
                    "PAID",

                enrollmentId:
                    enrollmentDoc.id,

                approvedAt:
                    serverTimestamp(),

                approvedBy:
                    currentAdmin.uid,

                updatedAt:
                    serverTimestamp(),

                updatedBy:
                    currentAdmin.uid

            }
        );


        alert(
            "Course access has been given successfully."
        );


        closeModal();

    } catch (error) {

        console.error(
            "GIVE ACCESS ERROR:",
            error
        );


        alert(
            "Unable to give course access. Please try again."
        );

    }

}


/* =====================================================
   REJECT
===================================================== */

async function rejectRequest() {

    if (
        !selectedRequest
    ) {

        return;

    }


    const reason =
        prompt(
            "Enter rejection reason:"
        );


    if (
        reason === null
    ) {

        return;

    }


    try {

        const requestRef =
            doc(
                db,
                "courseEnrollmentRequests",
                selectedRequest.id
            );


        await updateDoc(
            requestRef,
            {

                status:
                    "REJECTED",

                accessGranted:
                    false,

                rejectionReason:
                    reason,

                rejectedAt:
                    serverTimestamp(),

                rejectedBy:
                    currentAdmin.uid,

                updatedAt:
                    serverTimestamp(),

                updatedBy:
                    currentAdmin.uid

            }
        );


        alert(
            "Enrollment request rejected."
        );


        closeModal();

    } catch (error) {

        console.error(
            "REJECT ERROR:",
            error
        );


        alert(
            "Unable to reject request."
        );

    }

}


/* =====================================================
   CLOSE MODAL
===================================================== */

modalClose.addEventListener(
    "click",
    closeModal
);

modalOverlay.addEventListener(
    "click",
    closeModal
);


function closeModal() {

    detailsModal.classList.add(
        "hidden"
    );

    selectedRequest =
        null;

    modalContent.innerHTML =
        "";

}


/* =====================================================
   SIDEBAR
===================================================== */

const sidebar =
    document.getElementById(
        "sidebar"
    );

const sidebarOpen =
    document.getElementById(
        "sidebarOpen"
    );

const sidebarClose =
    document.getElementById(
        "sidebarClose"
    );

const sidebarOverlay =
    document.getElementById(
        "sidebarOverlay"
    );


sidebarOpen.addEventListener(
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


sidebarClose.addEventListener(
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


/* =====================================================
   LOADING
===================================================== */

function showApp() {

    appLoader.classList.add(
        "hidden"
    );

    crmApp.classList.remove(
        "hidden"
    );

}


/* =====================================================
   FORMAT
===================================================== */

function formatMoney(
    value
) {

    return (
        "₹" +
        Number(
            value || 0
        ).toLocaleString(
            "en-IN"
        )
    );

}


function formatDate(
    timestamp
) {

    if (
        !timestamp
    ) {

        return "—";

    }


    try {

        const date =
            timestamp.toDate
                ? timestamp.toDate()
                : new Date(timestamp);


        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    } catch {

        return "—";

    }

}


function formatClass(
    value
) {

    const classes = {

        UNDER_8TH:
            "Under 8th",

        "8TH":
            "8th",

        "9TH":
            "9th",

        "10TH":
            "10th",

        "1ST_PUC":
            "1st PUC",

        "2ND_PUC":
            "2nd PUC"

    };


    return (
        classes[value] ||
        String(
            value || ""
        )
            .replace(
                /_/g,
                " "
            )
    );

}


/* =====================================================
   STATUS
===================================================== */

function statusLabel(
    status
) {

    const labels = {

        PENDING:
            "PENDING",

        PAYMENT_RECEIVED:
            "PAYMENT RECEIVED",

        APPROVED:
            "APPROVED",

        REJECTED:
            "REJECTED"

    };


    return (
        labels[status] ||
        status
    );

}


function statusBadgeClass(
    status
) {

    if (
        status === "APPROVED"
    ) {

        return "approved";

    }


    if (
        status === "REJECTED"
    ) {

        return "rejected";

    }


    if (
        status === "PAYMENT_RECEIVED"
    ) {

        return "payment";

    }


    return "pending";

}


function paymentLabel(
    payment
) {

    if (
        payment === "PAID"
    ) {

        return "PAID";

    }


    return "PAYMENT PENDING";

}


function paymentBadgeClass(
    payment
) {

    return payment === "PAID"
        ? "approved"
        : "payment";

}


/* =====================================================
   HTML SAFETY
===================================================== */

function escapeHtml(
    value
) {

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


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );

}


/* =====================================================
   CLEANUP
===================================================== */

window.addEventListener(
    "beforeunload",
    () => {

        if (
            unsubscribeRequests
        ) {

            unsubscribeRequests();

        }

    }
);

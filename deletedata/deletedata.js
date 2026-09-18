import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs,
    writeBatch,
    doc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { app } from "../firebase/firebase-config.js";


/* =========================================================
   FIREBASE
========================================================= */

const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================================
   COLLECTIONS
   These are the existing Firestore collections identified
   in the current Zenova project.
========================================================= */

const COLLECTIONS = [
    {
        id: "crmCourses",
        name: "crmCourses",
        description: "CRM courses / batches"
    },

    {
        id: "crmDistricts",
        name: "crmDistricts",
        description: "CRM districts"
    },

    {
        id: "crmTaluks",
        name: "crmTaluks",
        description: "CRM taluks"
    },

    {
        id: "crmGramPanchayats",
        name: "crmGramPanchayats",
        description: "CRM gram panchayats"
    },

    {
        id: "crmVillages",
        name: "crmVillages",
        description: "CRM villages"
    },

    {
        id: "crmSchools",
        name: "crmSchools",
        description: "CRM schools"
    },

    {
        id: "crmStudents",
        name: "crmStudents",
        description: "CRM student records"
    },

    {
        id: "hybridSubjects",
        name: "hybridSubjects",
        description: "Course subjects"
    },

    {
        id: "hybridChapters",
        name: "hybridChapters",
        description: "Subject chapters"
    },

    {
        id: "hybridContent",
        name: "hybridContent",
        description: "Videos, notes and learning content"
    },

    {
        id: "students",
        name: "students",
        description: "Student profiles"
    },

    {
        id: "studentAccounts",
        name: "studentAccounts",
        description: "Student account data"
    },

    {
        id: "studentEnrollments",
        name: "studentEnrollments",
        description: "Approved student enrollments"
    },

    {
        id: "courseEnrollmentRequests",
        name: "courseEnrollmentRequests",
        description: "Course enrollment requests"
    },

    {
        id: "homeBanners",
        name: "homeBanners",
        description: "Student home banners"
    },

    {
        id: "studyPlans",
        name: "studyPlans",
        description: "Daily study plans"
    },

    {
        id: "liveClasses",
        name: "liveClasses",
        description: "Live / upcoming classes"
    },

    {
        id: "schoolLeadRecords",
        name: "schoolLeadRecords",
        description: "School lead records"
    }
];


/* =========================================================
   STATE
========================================================= */

const collectionState = new Map();

let isDeleting = false;


/* =========================================================
   DOM
========================================================= */

const collectionsContainer =
    document.getElementById("collectionsContainer");

const selectAllButton =
    document.getElementById("selectAllButton");

const selectedCountElement =
    document.getElementById("selectedCount");

const totalDocumentsElement =
    document.getElementById("totalDocuments");

const deleteButton =
    document.getElementById("deleteButton");

const connectionStatus =
    document.getElementById("connectionStatus");

const confirmationModal =
    document.getElementById("confirmationModal");

const deleteConfirmation =
    document.getElementById("deleteConfirmation");

const cancelDeleteButton =
    document.getElementById("cancelDeleteButton");

const confirmDeleteButton =
    document.getElementById("confirmDeleteButton");

const modalSelectedCollections =
    document.getElementById("modalSelectedCollections");

const progressSection =
    document.getElementById("progressSection");

const progressText =
    document.getElementById("progressText");

const progressPercentage =
    document.getElementById("progressPercentage");

const progressBar =
    document.getElementById("progressBar");

const currentCollection =
    document.getElementById("currentCollection");

const resultSection =
    document.getElementById("resultSection");

const resultIcon =
    document.getElementById("resultIcon");

const resultTitle =
    document.getElementById("resultTitle");

const resultMessage =
    document.getElementById("resultMessage");

const refreshButton =
    document.getElementById("refreshButton");


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        setConnectionStatus(
            "Not signed in",
            "error"
        );

        disableInterface();

        return;
    }

    setConnectionStatus(
        "Connected",
        "connected"
    );

    await loadCollectionCounts();

});


/* =========================================================
   INITIALIZE COLLECTION STATE
========================================================= */

function initializeState() {

    COLLECTIONS.forEach((item) => {

        collectionState.set(item.id, {
            ...item,
            selected: false,
            count: null,
            loading: false
        });

    });

}


/* =========================================================
   RENDER COLLECTIONS
========================================================= */

function renderCollections() {

    collectionsContainer.innerHTML = "";

    COLLECTIONS.forEach((item) => {

        const state = collectionState.get(item.id);

        const wrapper =
            document.createElement("label");

        wrapper.className =
            "collection-item";

        wrapper.dataset.collection =
            item.id;

        if (state.selected) {
            wrapper.classList.add("selected");
        }


        const checkbox =
            document.createElement("input");

        checkbox.type = "checkbox";

        checkbox.className =
            "collection-checkbox";

        checkbox.checked =
            state.selected;

        checkbox.dataset.collection =
            item.id;


        checkbox.addEventListener(
            "change",
            () => {

                state.selected =
                    checkbox.checked;

                updateCollectionVisual(
                    wrapper,
                    state.selected
                );

                updateSummary();

            }
        );


        const info =
            document.createElement("div");

        info.className =
            "collection-info";


        const name =
            document.createElement("span");

        name.className =
            "collection-name";

        name.textContent =
            item.name;


        const description =
            document.createElement("span");

        description.className =
            "collection-description";

        description.textContent =
            item.description;


        info.appendChild(name);
        info.appendChild(description);


        const count =
            document.createElement("span");

        count.className =
            "collection-count loading";

        count.id =
            `count-${item.id}`;

        count.textContent =
            "...";


        wrapper.appendChild(checkbox);
        wrapper.appendChild(info);
        wrapper.appendChild(count);

        collectionsContainer.appendChild(wrapper);

    });

}


/* =========================================================
   COLLECTION VISUAL
========================================================= */

function updateCollectionVisual(
    wrapper,
    selected
) {

    if (selected) {
        wrapper.classList.add("selected");
    } else {
        wrapper.classList.remove("selected");
    }

}


/* =========================================================
   LOAD COUNTS
========================================================= */

async function loadCollectionCounts() {

    if (isDeleting) {
        return;
    }

    for (const item of COLLECTIONS) {

        const state =
            collectionState.get(item.id);

        state.loading = true;

        updateCountElement(
            item.id,
            null,
            true
        );

    }


    for (const item of COLLECTIONS) {

        try {

            const snapshot =
                await getDocs(
                    collection(db, item.id)
                );

            const state =
                collectionState.get(item.id);

            state.count =
                snapshot.size;

            state.loading = false;

            updateCountElement(
                item.id,
                snapshot.size,
                false
            );

        } catch (error) {

            console.error(
                `Error reading ${item.id}:`,
                error
            );

            const state =
                collectionState.get(item.id);

            state.count = null;
            state.loading = false;

            updateCountElement(
                item.id,
                null,
                false,
                true
            );

        }

    }

    updateSummary();

}


/* =========================================================
   UPDATE COUNT UI
========================================================= */

function updateCountElement(
    collectionId,
    count,
    loading = false,
    error = false
) {

    const element =
        document.getElementById(
            `count-${collectionId}`
        );

    if (!element) {
        return;
    }

    element.classList.toggle(
        "loading",
        loading
    );


    if (loading) {

        element.textContent =
            "...";

        return;
    }


    if (error) {

        element.textContent =
            "Error";

        return;
    }


    element.textContent =
        Number(count || 0).toLocaleString();

}


/* =========================================================
   SUMMARY
========================================================= */

function updateSummary() {

    let selectedCollections = 0;

    let totalDocuments = 0;


    collectionState.forEach((state) => {

        if (state.selected) {

            selectedCollections++;

            if (typeof state.count === "number") {

                totalDocuments +=
                    state.count;

            }

        }

    });


    selectedCountElement.textContent =
        selectedCollections;


    totalDocumentsElement.textContent =
        totalDocuments.toLocaleString();


    deleteButton.disabled =
        selectedCollections === 0 ||
        isDeleting;


    const allSelected =
        selectedCollections === COLLECTIONS.length;


    selectAllButton.textContent =
        allSelected
            ? "Deselect All"
            : "Select All";

}


/* =========================================================
   SELECT ALL
========================================================= */

selectAllButton.addEventListener(
    "click",
    () => {

        if (isDeleting) {
            return;
        }

        const allSelected =
            COLLECTIONS.every(
                (item) =>
                    collectionState.get(item.id).selected
            );


        COLLECTIONS.forEach((item) => {

            const state =
                collectionState.get(item.id);

            state.selected =
                !allSelected;

        });


        renderCollections();

        updateSummary();

    }
);


/* =========================================================
   DELETE BUTTON
========================================================= */

deleteButton.addEventListener(
    "click",
    () => {

        if (isDeleting) {
            return;
        }

        const selected =
            getSelectedCollections();

        if (!selected.length) {
            return;
        }

        showConfirmationModal(
            selected
        );

    }
);


/* =========================================================
   GET SELECTED
========================================================= */

function getSelectedCollections() {

    return COLLECTIONS.filter(
        (item) =>
            collectionState.get(item.id).selected
    );

}


/* =========================================================
   SHOW MODAL
========================================================= */

function showConfirmationModal(
    selected
) {

    modalSelectedCollections.innerHTML =
        "";


    selected.forEach((item) => {

        const row =
            document.createElement("div");

        row.className =
            "modal-collection-name";

        const state =
            collectionState.get(item.id);


        const count =
            typeof state.count === "number"
                ? ` (${state.count.toLocaleString()} documents)`
                : "";


        row.textContent =
            `${item.name}${count}`;


        modalSelectedCollections.appendChild(
            row
        );

    });


    deleteConfirmation.value = "";

    confirmDeleteButton.disabled =
        true;


    confirmationModal.classList.remove(
        "hidden"
    );


    setTimeout(() => {

        deleteConfirmation.focus();

    }, 50);

}


/* =========================================================
   CONFIRMATION INPUT
========================================================= */

deleteConfirmation.addEventListener(
    "input",
    () => {

        const value =
            deleteConfirmation.value
                .trim()
                .toUpperCase();


        confirmDeleteButton.disabled =
            value !== "DELETE";

    }
);


/* =========================================================
   CANCEL
========================================================= */

cancelDeleteButton.addEventListener(
    "click",
    closeConfirmationModal
);


document
    .querySelector(".modal-overlay")
    .addEventListener(
        "click",
        closeConfirmationModal
    );


function closeConfirmationModal() {

    if (isDeleting) {
        return;
    }

    confirmationModal.classList.add(
        "hidden"
    );

    deleteConfirmation.value = "";

}


/* =========================================================
   CONFIRM DELETE
========================================================= */

confirmDeleteButton.addEventListener(
    "click",
    async () => {

        if (isDeleting) {
            return;
        }


        const value =
            deleteConfirmation.value
                .trim()
                .toUpperCase();


        if (value !== "DELETE") {
            return;
        }


        const selected =
            getSelectedCollections();


        if (!selected.length) {
            closeConfirmationModal();
            return;
        }


        closeConfirmationModal();

        await deleteSelectedCollections(
            selected
        );

    }
);


/* =========================================================
   DELETE SELECTED COLLECTIONS
========================================================= */

async function deleteSelectedCollections(
    selected
) {

    isDeleting = true;

    deleteButton.disabled =
        true;

    selectAllButton.disabled =
        true;


    progressSection.classList.remove(
        "hidden"
    );

    resultSection.classList.add(
        "hidden"
    );


    let totalDocumentsToDelete = 0;

    let deletedDocuments = 0;


    selected.forEach((item) => {

        const state =
            collectionState.get(item.id);

        if (typeof state.count === "number") {

            totalDocumentsToDelete +=
                state.count;

        }

    });


    const totalCollections =
        selected.length;


    try {

        for (
            let collectionIndex = 0;
            collectionIndex < selected.length;
            collectionIndex++
        ) {

            const item =
                selected[collectionIndex];


            currentCollection.textContent =
                `Deleting ${item.name}...`;


            progressText.textContent =
                `Deleting collection ${collectionIndex + 1} of ${totalCollections}`;


            const deleted =
                await deleteCollection(
                    item.id,
                    (count) => {

                        deletedDocuments += count;

                        updateProgress(
                            deletedDocuments,
                            totalDocumentsToDelete
                        );

                    }
                );


            const state =
                collectionState.get(item.id);

            state.count = 0;


            updateCountElement(
                item.id,
                0
            );


            console.log(
                `Deleted ${deleted} documents from ${item.id}`
            );

        }


        updateProgress(
            totalDocumentsToDelete,
            totalDocumentsToDelete
        );


        currentCollection.textContent =
            "Deletion completed.";


        showResult(
            true,
            deletedDocuments,
            selected
        );


    } catch (error) {

        console.error(
            "Deletion failed:",
            error
        );


        showResult(
            false,
            deletedDocuments,
            selected,
            error
        );

    }


    isDeleting = false;

    deleteButton.disabled = false;

    selectAllButton.disabled = false;

    updateSummary();

}


/* =========================================================
   DELETE ONE COLLECTION
========================================================= */

async function deleteCollection(
    collectionName,
    onBatchDeleted
) {

    let totalDeleted = 0;


    while (true) {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    collectionName
                )
            );


        if (snapshot.empty) {
            break;
        }


        /*
         * Firestore batched writes support
         * a maximum of 500 operations.
         *
         * We intentionally use 400 here so the
         * batch stays safely below the limit.
         */

        const docsToDelete =
            snapshot.docs.slice(0, 400);


        const batch =
            writeBatch(db);


        docsToDelete.forEach((documentSnapshot) => {

            batch.delete(
                doc(
                    db,
                    collectionName,
                    documentSnapshot.id
                )
            );

        });


        await batch.commit();


        const batchCount =
            docsToDelete.length;


        totalDeleted +=
            batchCount;


        if (typeof onBatchDeleted === "function") {

            onBatchDeleted(
                batchCount
            );

        }


        /*
         * If fewer than 400 were returned,
         * this was the last batch.
         */

        if (docsToDelete.length < 400) {
            break;
        }

    }


    return totalDeleted;

}


/* =========================================================
   PROGRESS
========================================================= */

function updateProgress(
    current,
    total
) {

    let percentage = 0;


    if (total > 0) {

        percentage =
            Math.round(
                (current / total) * 100
            );

    } else {

        percentage = 100;

    }


    percentage =
        Math.max(
            0,
            Math.min(
                100,
                percentage
            )
        );


    progressBar.style.width =
        `${percentage}%`;


    progressPercentage.textContent =
        `${percentage}%`;

}


/* =========================================================
   RESULT
========================================================= */

function showResult(
    success,
    deletedDocuments,
    selected,
    error = null
) {

    resultSection.classList.remove(
        "hidden"
    );


    if (success) {

        resultIcon.textContent =
            "✓";

        resultTitle.textContent =
            "Deletion Complete";

        resultMessage.textContent =
            `${deletedDocuments.toLocaleString()} Firestore document${
                deletedDocuments === 1
                    ? ""
                    : "s"
            } deleted from ${
                selected.length
            } collection${
                selected.length === 1
                    ? ""
                    : "s"
            }.`;

        resultSection.style.background =
            "#f7fcf8";

        resultSection.style.borderColor =
            "#dce9df";


    } else {

        resultIcon.textContent =
            "!";

        resultTitle.textContent =
            "Deletion Stopped";

        resultMessage.textContent =
            `Deletion stopped after ${
                deletedDocuments.toLocaleString()
            } document${
                deletedDocuments === 1
                    ? ""
                    : "s"
            }. ${
                error?.message ||
                "An unknown error occurred."
            }`;

        resultSection.style.background =
            "#fff7f7";

        resultSection.style.borderColor =
            "#efd5d5";

    }

}


/* =========================================================
   REFRESH
========================================================= */

refreshButton.addEventListener(
    "click",
    async () => {

        if (isDeleting) {
            return;
        }

        resultSection.classList.add(
            "hidden"
        );

        await loadCollectionCounts();

    }
);


/* =========================================================
   CONNECTION STATUS
========================================================= */

function setConnectionStatus(
    text,
    type
) {

    connectionStatus.textContent =
        text;

    connectionStatus.className =
        `status ${type}`;

}


/* =========================================================
   DISABLE INTERFACE
========================================================= */

function disableInterface() {

    deleteButton.disabled =
        true;

    selectAllButton.disabled =
        true;

    connectionStatus.textContent =
        "Sign in required";

}


/* =========================================================
   INITIALIZATION
========================================================= */

initializeState();

renderCollections();

updateSummary();

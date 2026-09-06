import {
    auth,
    db
} from "../../../firebase/firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    collection,
    doc,
    getDocs,
    setDoc,
    updateDoc,
    serverTimestamp,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   ELEMENTS
========================================================= */

const loader = document.getElementById("pageLoader");
const app = document.getElementById("app");

const errorBox = document.getElementById("errorBox");

const subjectsGrid = document.getElementById("subjectsGrid");
const emptyState = document.getElementById("emptyState");

const totalSubjects = document.getElementById("totalSubjects");
const activeSubjects = document.getElementById("activeSubjects");
const inactiveSubjects = document.getElementById("inactiveSubjects");

const searchInput = document.getElementById("searchInput");

const modal = document.getElementById("subjectModal");
const modalTitle = document.getElementById("modalTitle");

const subjectForm = document.getElementById("subjectForm");

const subjectIdInput = document.getElementById("subjectId");
const subjectName = document.getElementById("subjectName");
const subjectDescription = document.getElementById("subjectDescription");
const subjectMedium = document.getElementById("subjectMedium");
const subjectPriority = document.getElementById("subjectPriority");
const subjectActive = document.getElementById("subjectActive");

const saveBtn = document.getElementById("saveBtn");


/* =========================================================
   STATE
========================================================= */

let currentUser = null;
let subjects = [];

let editingSubjectId = null;


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "../../../index.html";
        return;
    }

    currentUser = user;

    try {

        await loadSubjects();

        showApplication();

    } catch (error) {

        console.error("Hybrid Subjects Error:", error);

        showError(
            "We couldn't load the subjects. " +
            (error?.message || "Please try again.")
        );

        showApplication();
    }

});


/* =========================================================
   LOAD SUBJECTS
========================================================= */

async function loadSubjects() {

    clearError();

    subjectsGrid.innerHTML = "";

    /*
        IMPORTANT:

        We intentionally query only:

            active == true

        first, because older versions of the admin page
        used this field and we want to avoid composite indexes.

        However, inactive subjects must also be visible for
        management.

        Therefore we fetch the collection and sort/filter
        locally.
    */

    const snapshot = await getDocs(
        collection(db, "hybridSubjects")
    );

    subjects = [];

    snapshot.forEach((documentSnapshot) => {

        subjects.push({
            id: documentSnapshot.id,
            ...documentSnapshot.data()
        });

    });

    /*
        Sort using the existing priority field.
    */

    subjects.sort((a, b) => {

        const priorityA = Number(a.priority ?? 0);
        const priorityB = Number(b.priority ?? 0);

        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        return String(a.name || "")
            .localeCompare(
                String(b.name || ""),
                undefined,
                {
                    sensitivity: "base"
                }
            );
    });

    renderStats();
    renderSubjects();
}


/* =========================================================
   RENDER STATS
========================================================= */

function renderStats() {

    const total = subjects.length;

    const active = subjects.filter(
        subject => subject.active !== false
    ).length;

    const inactive = total - active;

    totalSubjects.textContent = total;
    activeSubjects.textContent = active;
    inactiveSubjects.textContent = inactive;
}


/* =========================================================
   RENDER SUBJECTS
========================================================= */

function renderSubjects() {

    const search = searchInput.value
        .trim()
        .toLowerCase();

    const filtered = subjects.filter(subject => {

        const name = String(
            subject.name || ""
        ).toLowerCase();

        const description = String(
            subject.description || ""
        ).toLowerCase();

        return (
            name.includes(search) ||
            description.includes(search)
        );
    });


    subjectsGrid.innerHTML = "";


    if (filtered.length === 0) {

        subjectsGrid.classList.add("hidden");
        emptyState.classList.remove("hidden");

        return;
    }


    subjectsGrid.classList.remove("hidden");
    emptyState.classList.add("hidden");


    filtered.forEach(subject => {

        const card = createSubjectCard(subject);

        subjectsGrid.appendChild(card);

    });
}


/* =========================================================
   SUBJECT CARD
========================================================= */

function createSubjectCard(subject) {

    const card = document.createElement("article");

    card.className = "subject-card";


    const isActive = subject.active !== false;

    const targetClasses =
        Array.isArray(subject.targetClasses)
            ? subject.targetClasses
            : [];


    const classesHTML =
        targetClasses.length
            ? targetClasses
                .slice(0, 4)
                .map(
                    className =>
                        `<span class="meta-pill">
                            ${escapeHTML(className)}
                        </span>`
                )
                .join("")
            : `<span class="meta-pill">
                    All Classes
               </span>`;


    const moreClasses =
        targetClasses.length > 4
            ? `<span class="meta-pill">
                    +${targetClasses.length - 4}
               </span>`
            : "";


    card.innerHTML = `

        <div class="subject-top">

            <h3 class="subject-name">
                ${escapeHTML(subject.name || "Untitled Subject")}
            </h3>

            <span class="badge ${isActive ? "active" : "inactive"}">
                ${isActive ? "ACTIVE" : "INACTIVE"}
            </span>

        </div>


        <p class="subject-description">
            ${
                escapeHTML(
                    subject.description ||
                    "No description added."
                )
            }
        </p>


        <div class="subject-meta">

            <span class="meta-pill">
                ${escapeHTML(subject.medium || "Kannada")}
            </span>

            ${classesHTML}
            ${moreClasses}

        </div>


        <div class="subject-footer">

            <span class="priority">
                Priority ${Number(subject.priority ?? 0)}
            </span>

            <div class="card-actions">

                <button
                    class="card-btn chapter-btn"
                    data-action="chapters"
                    data-id="${subject.id}"
                >
                    Chapters
                </button>

                <button
                    class="card-btn"
                    data-action="edit"
                    data-id="${subject.id}"
                >
                    Edit
                </button>

                <button
                    class="card-btn"
                    data-action="toggle"
                    data-id="${subject.id}"
                >
                    ${isActive ? "Deactivate" : "Activate"}
                </button>

            </div>

        </div>
    `;


    card
        .querySelectorAll(".card-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                handleCardAction
            );

        });


    return card;
}


/* =========================================================
   CARD ACTIONS
========================================================= */

function handleCardAction(event) {

    const button = event.currentTarget;

    const action = button.dataset.action;
    const id = button.dataset.id;


    const subject = subjects.find(
        item => item.id === id
    );

    if (!subject) {
        return;
    }


    if (action === "edit") {

        openEditModal(subject);
        return;
    }


    if (action === "toggle") {

        toggleSubject(subject);
        return;
    }


    if (action === "chapters") {

        /*
            THIS IS THE IMPORTANT CONNECTION.

            The actual Firestore document ID is passed
            automatically to the chapter page.
        */

        window.location.href =
            `../addchapter/?subjectId=${encodeURIComponent(id)}`;

    }

}


/* =========================================================
   OPEN ADD MODAL
========================================================= */

function openAddModal() {

    editingSubjectId = null;

    modalTitle.textContent = "Add Subject";

    saveBtn.textContent = "Save Subject";

    subjectForm.reset();

    subjectIdInput.value = "";

    subjectMedium.value = "Kannada";

    subjectPriority.value = "0";

    subjectActive.checked = true;

    document
        .querySelectorAll(".class-checkbox")
        .forEach(checkbox => {
            checkbox.checked = false;
        });


    modal.classList.remove("hidden");

    setTimeout(() => {
        subjectName.focus();
    }, 50);
}


/* =========================================================
   OPEN EDIT MODAL
========================================================= */

function openEditModal(subject) {

    editingSubjectId = subject.id;

    modalTitle.textContent = "Edit Subject";

    saveBtn.textContent = "Update Subject";


    subjectIdInput.value = subject.id;

    subjectName.value =
        subject.name || "";

    subjectDescription.value =
        subject.description || "";

    subjectMedium.value =
        normalizeMedium(subject.medium);

    subjectPriority.value =
        Number(subject.priority ?? 0);

    subjectActive.checked =
        subject.active !== false;


    const targetClasses =
        Array.isArray(subject.targetClasses)
            ? subject.targetClasses
            : [];


    document
        .querySelectorAll(".class-checkbox")
        .forEach(checkbox => {

            checkbox.checked =
                targetClasses.includes(
                    checkbox.value
                );

        });


    modal.classList.remove("hidden");

    setTimeout(() => {
        subjectName.focus();
    }, 50);
}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal() {

    modal.classList.add("hidden");

    editingSubjectId = null;

    subjectForm.reset();
}


/* =========================================================
   SAVE SUBJECT
========================================================= */

subjectForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        clearError();


        const name =
            subjectName.value.trim();

        const description =
            subjectDescription.value.trim();

        const medium =
            normalizeMedium(subjectMedium.value);

        const priority =
            Number(subjectPriority.value || 0);

        const active =
            subjectActive.checked;


        const targetClasses =
            Array.from(
                document.querySelectorAll(
                    ".class-checkbox:checked"
                )
            ).map(
                checkbox => checkbox.value
            );


        if (!name) {

            showError(
                "Please enter a subject name."
            );

            subjectName.focus();

            return;
        }


        saveBtn.disabled = true;

        saveBtn.textContent =
            editingSubjectId
                ? "Updating..."
                : "Saving...";


        try {

            if (editingSubjectId) {

                /*
                    UPDATE EXISTING SUBJECT
                */

                const subjectRef = doc(
                    db,
                    "hybridSubjects",
                    editingSubjectId
                );


                await updateDoc(
                    subjectRef,
                    {
                        name,
                        description,
                        medium,
                        targetClasses,
                        priority,
                        active,
                        updatedAt:
                            serverTimestamp()
                    }
                );

            } else {

                /*
                    CREATE NEW SUBJECT
                */

                const subjectRef = doc(
                    collection(
                        db,
                        "hybridSubjects"
                    )
                );


                await setDoc(
                    subjectRef,
                    {
                        name,
                        description,
                        medium,
                        targetClasses,
                        priority,
                        active,

                        createdBy:
                            currentUser.uid,

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()
                    }
                );

            }


            closeModal();

            await loadSubjects();


        } catch (error) {

            console.error(
                "Save subject error:",
                error
            );

            showError(
                "Unable to save subject. " +
                (error?.message || "")
            );

        } finally {

            saveBtn.disabled = false;

            saveBtn.textContent =
                editingSubjectId
                    ? "Update Subject"
                    : "Save Subject";
        }

    }
);


/* =========================================================
   TOGGLE ACTIVE
========================================================= */

async function toggleSubject(subject) {

    const newStatus =
        subject.active === false;


    try {

        await updateDoc(
            doc(
                db,
                "hybridSubjects",
                subject.id
            ),
            {
                active: newStatus,
                updatedAt:
                    serverTimestamp()
            }
        );


        await loadSubjects();


    } catch (error) {

        console.error(
            "Toggle subject error:",
            error
        );

        showError(
            "Unable to update subject status. " +
            (error?.message || "")
        );
    }
}


/* =========================================================
   MEDIUM
========================================================= */

function normalizeMedium(value) {

    if (!value) {
        return "Kannada";
    }

    const medium =
        String(value)
            .trim()
            .toLowerCase();


    if (
        medium === "both" ||
        medium === "all"
    ) {
        return "Both";
    }


    if (
        medium === "english" ||
        medium === "english medium"
    ) {
        return "English";
    }


    return "Kannada";
}


/* =========================================================
   SEARCH
========================================================= */

searchInput.addEventListener(
    "input",
    renderSubjects
);


/* =========================================================
   BUTTONS
========================================================= */

document
    .getElementById("addSubjectBtn")
    .addEventListener(
        "click",
        openAddModal
    );


document
    .getElementById("emptyAddBtn")
    .addEventListener(
        "click",
        openAddModal
    );


document
    .getElementById("closeModalBtn")
    .addEventListener(
        "click",
        closeModal
    );


document
    .getElementById("cancelBtn")
    .addEventListener(
        "click",
        closeModal
    );


document
    .querySelector(".modal-backdrop")
    .addEventListener(
        "click",
        closeModal
    );


document
    .getElementById("backBtn")
    .addEventListener(
        "click",
        () => {
            window.location.href = "../";
        }
    );


/* =========================================================
   SHOW APP
========================================================= */

function showApplication() {

    loader.classList.add("hidden");

    app.classList.remove("hidden");
}


/* =========================================================
   ERROR
========================================================= */

function showError(message) {

    errorBox.textContent = message;

    errorBox.classList.remove("hidden");
}


function clearError() {

    errorBox.textContent = "";

    errorBox.classList.add("hidden");
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
      }

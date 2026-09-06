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
    addDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================
   ELEMENTS
========================= */

const loader = document.getElementById("loader");
const app = document.getElementById("app");

const subjectsElement =
    document.getElementById("subjects");

const empty =
    document.getElementById("empty");

const errorBox =
    document.getElementById("errorBox");

const search =
    document.getElementById("search");

const modal =
    document.getElementById("modal");

const modalTitle =
    document.getElementById("modalTitle");

const form =
    document.getElementById("subjectForm");

const nameInput =
    document.getElementById("name");

const descriptionInput =
    document.getElementById("description");

const mediumInput =
    document.getElementById("medium");

const priorityInput =
    document.getElementById("priority");

const activeInput =
    document.getElementById("active");

const saveBtn =
    document.getElementById("saveBtn");

const formError =
    document.getElementById("formError");


/* =========================
   STATE
========================= */

let currentUser = null;

let subjects = [];

let editingId = null;


/* =========================
   AUTH
========================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.replace(
            "../../../index.html"
        );

        return;
    }

    currentUser = user;

    try {

        await loadSubjects();

        showApp();

    } catch (error) {

        console.error(
            "SUBJECT PAGE ERROR:",
            error
        );

        showError(
            "Unable to load subjects: " +
            error.message
        );

        showApp();
    }

});


/* =========================
   LOAD FIRESTORE
========================= */

async function loadSubjects() {

    clearError();

    const snapshot = await getDocs(
        collection(
            db,
            "hybridSubjects"
        )
    );

    subjects = snapshot.docs.map(
        item => ({
            id: item.id,
            ...item.data()
        })
    );


    subjects.sort((a, b) => {

        const priorityA =
            Number(a.priority ?? 0);

        const priorityB =
            Number(b.priority ?? 0);

        if (priorityA !== priorityB) {

            return priorityA - priorityB;
        }

        return String(a.name || "")
            .localeCompare(
                String(b.name || "")
            );
    });


    updateStats();

    renderSubjects();
}


/* =========================
   STATS
========================= */

function updateStats() {

    const total =
        subjects.length;

    const active =
        subjects.filter(
            subject =>
                subject.active !== false
        ).length;

    document.getElementById(
        "totalCount"
    ).textContent = total;

    document.getElementById(
        "activeCount"
    ).textContent = active;

    document.getElementById(
        "inactiveCount"
    ).textContent =
        total - active;
}


/* =========================
   RENDER
========================= */

function renderSubjects() {

    const term =
        search.value
            .trim()
            .toLowerCase();


    const filtered =
        subjects.filter(subject => {

            const name =
                String(
                    subject.name || ""
                ).toLowerCase();

            const description =
                String(
                    subject.description || ""
                ).toLowerCase();

            return (
                name.includes(term) ||
                description.includes(term)
            );
        });


    subjectsElement.innerHTML = "";


    if (!filtered.length) {

        subjectsElement.classList.add(
            "hidden"
        );

        empty.classList.remove(
            "hidden"
        );

        return;
    }


    subjectsElement.classList.remove(
        "hidden"
    );

    empty.classList.add(
        "hidden"
    );


    filtered.forEach(subject => {

        subjectsElement.appendChild(
            createSubjectCard(subject)
        );

    });
}


/* =========================
   CARD
========================= */

function createSubjectCard(subject) {

    const card =
        document.createElement("article");

    card.className =
        "subject-card";


    const isActive =
        subject.active !== false;


    const targetClasses =
        Array.isArray(
            subject.targetClasses
        )
            ? subject.targetClasses
            : [];


    const classHTML =
        targetClasses.length
            ? targetClasses
                .map(
                    item =>
                        `<span>${escapeHTML(item)}</span>`
                )
                .join("")
            : "<span>All Classes</span>";


    card.innerHTML = `

        <div class="subject-title-row">

            <div class="subject-title">
                ${escapeHTML(
                    subject.name ||
                    "Untitled Subject"
                )}
            </div>

            <div class="status ${
                isActive
                    ? "active"
                    : "inactive"
            }">

                ${
                    isActive
                        ? "ACTIVE"
                        : "INACTIVE"
                }

            </div>

        </div>


        <div class="subject-description">

            ${escapeHTML(
                subject.description ||
                "No description added."
            )}

        </div>


        <div class="meta">

            <span>
                ${escapeHTML(
                    subject.medium ||
                    "Kannada"
                )}
            </span>

            ${classHTML}

        </div>


        <div class="subject-footer">

            <span class="priority">
                Priority ${
                    Number(
                        subject.priority ?? 0
                    )
                }
            </span>


            <div class="card-actions">

                <button
                    class="card-btn chapter-btn"
                    data-action="chapters"
                >
                    Chapters
                </button>

                <button
                    class="card-btn"
                    data-action="edit"
                >
                    Edit
                </button>

                <button
                    class="card-btn"
                    data-action="toggle"
                >
                    ${
                        isActive
                            ? "Deactivate"
                            : "Activate"
                    }
                </button>

            </div>

        </div>
    `;


    card
        .querySelectorAll(".card-btn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const action =
                        button.dataset.action;


                    if (
                        action === "chapters"
                    ) {

                        /*
                         * IMPORTANT:
                         * Pass the real Firestore
                         * document ID.
                         */

                        window.location.href =
                            `../addchapter/?subjectId=${encodeURIComponent(
                                subject.id
                            )}`;

                        return;
                    }


                    if (
                        action === "edit"
                    ) {

                        openEdit(subject);

                        return;
                    }


                    if (
                        action === "toggle"
                    ) {

                        toggleSubject(subject);

                    }

                }
            );

        });


    return card;
}


/* =========================
   ADD
========================= */

function openAdd() {

    editingId = null;

    modalTitle.textContent =
        "Add Subject";

    saveBtn.textContent =
        "Save Subject";

    form.reset();

    mediumInput.value =
        "Kannada";

    priorityInput.value =
        "0";

    activeInput.checked =
        true;


    document
        .querySelectorAll(
            ".classes input"
        )
        .forEach(
            checkbox =>
                checkbox.checked = false
        );


    clearFormError();

    modal.classList.remove(
        "hidden"
    );

    nameInput.focus();
}


/* =========================
   EDIT
========================= */

function openEdit(subject) {

    editingId =
        subject.id;

    modalTitle.textContent =
        "Edit Subject";

    saveBtn.textContent =
        "Update Subject";


    nameInput.value =
        subject.name || "";

    descriptionInput.value =
        subject.description || "";

    mediumInput.value =
        normalizeMedium(
            subject.medium
        );

    priorityInput.value =
        Number(
            subject.priority ?? 0
        );

    activeInput.checked =
        subject.active !== false;


    const targetClasses =
        Array.isArray(
            subject.targetClasses
        )
            ? subject.targetClasses
            : [];


    document
        .querySelectorAll(
            ".classes input"
        )
        .forEach(checkbox => {

            checkbox.checked =
                targetClasses.includes(
                    checkbox.value
                );

        });


    clearFormError();

    modal.classList.remove(
        "hidden"
    );

    nameInput.focus();
}


/* =========================
   SAVE
========================= */

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        clearFormError();


        const name =
            nameInput.value.trim();

        if (!name) {

            showFormError(
                "Subject name is required."
            );

            return;
        }


        const targetClasses =
            Array.from(
                document.querySelectorAll(
                    ".classes input:checked"
                )
            ).map(
                checkbox =>
                    checkbox.value
            );


        const data = {

            name,

            description:
                descriptionInput.value.trim(),

            medium:
                mediumInput.value,

            targetClasses,

            priority:
                Number(
                    priorityInput.value || 0
                ),

            active:
                activeInput.checked,

            updatedAt:
                serverTimestamp()
        };


        saveBtn.disabled = true;

        saveBtn.textContent =
            editingId
                ? "Updating..."
                : "Saving...";


        try {

            if (editingId) {

                await updateDoc(
                    doc(
                        db,
                        "hybridSubjects",
                        editingId
                    ),
                    data
                );

            } else {

                await addDoc(
                    collection(
                        db,
                        "hybridSubjects"
                    ),
                    {
                        ...data,

                        createdBy:
                            currentUser.uid,

                        createdAt:
                            serverTimestamp()
                    }
                );

            }


            closeModal();

            await loadSubjects();


        } catch (error) {

            console.error(
                "SAVE SUBJECT ERROR:",
                error
            );

            showFormError(
                error.message
            );

        } finally {

            saveBtn.disabled = false;

            saveBtn.textContent =
                editingId
                    ? "Update Subject"
                    : "Save Subject";
        }

    }
);


/* =========================
   TOGGLE
========================= */

async function toggleSubject(
    subject
) {

    try {

        await updateDoc(
            doc(
                db,
                "hybridSubjects",
                subject.id
            ),
            {
                active:
                    subject.active === false,

                updatedAt:
                    serverTimestamp()
            }
        );


        await loadSubjects();

    } catch (error) {

        console.error(
            "TOGGLE ERROR:",
            error
        );

        showError(
            error.message
        );
    }
}


/* =========================
   CLOSE
========================= */

function closeModal() {

    modal.classList.add(
        "hidden"
    );

    editingId = null;
}


/* =========================
   BUTTONS
========================= */

document
    .getElementById("addBtn")
    .addEventListener(
        "click",
        openAdd
    );


document
    .getElementById("emptyAddBtn")
    .addEventListener(
        "click",
        openAdd
    );


document
    .getElementById("closeBtn")
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
    .getElementById("modalOverlay")
    .addEventListener(
        "click",
        closeModal
    );


document
    .getElementById("backBtn")
    .addEventListener(
        "click",
        () => {

            window.location.href =
                "../";

        }
    );


search.addEventListener(
    "input",
    renderSubjects
);


/* =========================
   UI
========================= */

function showApp() {

    loader.classList.add(
        "hidden"
    );

    app.classList.remove(
        "hidden"
    );
}


function showError(message) {

    errorBox.textContent =
        message;

    errorBox.classList.remove(
        "hidden"
    );
}


function clearError() {

    errorBox.textContent = "";

    errorBox.classList.add(
        "hidden"
    );
}


function showFormError(message) {

    formError.textContent =
        message;

    formError.classList.remove(
        "hidden"
    );
}


function clearFormError() {

    formError.textContent = "";

    formError.classList.add(
        "hidden"
    );
}


/* =========================
   MEDIUM
========================= */

function normalizeMedium(value) {

    if (!value) {
        return "Kannada";
    }

    const v =
        String(value)
            .trim()
            .toLowerCase();


    if (
        v === "english" ||
        v === "english medium"
    ) {
        return "English";
    }


    if (
        v === "both" ||
        v === "all"
    ) {
        return "Both";
    }


    return "Kannada";
}


/* =========================
   HTML SAFETY
========================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
        }

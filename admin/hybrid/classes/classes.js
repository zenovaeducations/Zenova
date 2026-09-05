import {
    auth,
    db
} from "../../../firebase/firebase-config.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   ELEMENTS
========================================================= */

const loader =
    document.getElementById("loader");

const app =
    document.getElementById("app");

const subjectsGrid =
    document.getElementById("subjectsGrid");

const subjectCount =
    document.getElementById("subjectCount");

const emptyState =
    document.getElementById("emptyState");

const errorState =
    document.getElementById("errorState");

const errorText =
    document.getElementById("errorText");

const retryBtn =
    document.getElementById("retryBtn");

const addSubjectBtn =
    document.getElementById("addSubjectBtn");

const emptyAddBtn =
    document.getElementById("emptyAddBtn");

const backBtn =
    document.getElementById("backBtn");


/* =========================================================
   MODAL
========================================================= */

const subjectModal =
    document.getElementById("subjectModal");

const modalBackdrop =
    document.getElementById("modalBackdrop");

const closeModalBtn =
    document.getElementById("closeModalBtn");

const cancelBtn =
    document.getElementById("cancelBtn");

const modalTitle =
    document.getElementById("modalTitle");

const subjectForm =
    document.getElementById("subjectForm");

const subjectName =
    document.getElementById("subjectName");

const subjectDescription =
    document.getElementById(
        "subjectDescription"
    );

const subjectPriority =
    document.getElementById(
        "subjectPriority"
    );

const subjectActive =
    document.getElementById(
        "subjectActive"
    );

const saveBtn =
    document.getElementById("saveBtn");


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let editingSubjectId = null;

let unsubscribeSubjects = null;


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    (user) => {

        if (!user) {

            window.location.replace(
                "../../login/"
            );

            return;
        }


        currentUser = user;

        showApp();

        loadSubjects();

    }
);


/* =========================================================
   SHOW APP
========================================================= */

function showApp() {

    loader.classList.add(
        "hidden"
    );

    app.classList.remove(
        "hidden"
    );
}


/* =========================================================
   LOAD SUBJECTS
========================================================= */

function loadSubjects() {

    hideError();


    if (unsubscribeSubjects) {

        unsubscribeSubjects();

    }


    /*
     * Only query active status.
     *
     * No orderBy = no unnecessary
     * composite index.
     *
     * We sort locally.
     */

    const subjectsRef =
        collection(
            db,
            "hybridSubjects"
        );


    const subjectsQuery =
        query(
            subjectsRef,
            where(
                "active",
                "==",
                true
            )
        );


    unsubscribeSubjects =
        onSnapshot(

            subjectsQuery,

            (snapshot) => {

                const subjects =
                    snapshot.docs.map(
                        item => ({

                            id:
                                item.id,

                            ...item.data()

                        })
                    );


                subjects.sort(
                    (a, b) => {

                        return (
                            Number(
                                a.priority ?? 9999
                            ) -
                            Number(
                                b.priority ?? 9999
                            )
                        );

                    }
                );


                renderSubjects(
                    subjects
                );

            },

            (error) => {

                console.error(
                    "Hybrid Subjects:",
                    error
                );


                showError(
                    getFirebaseError(
                        error
                    )
                );

            }

        );
}


/* =========================================================
   RENDER
========================================================= */

function renderSubjects(
    subjects
) {

    subjectsGrid.innerHTML = "";

    errorState.classList.add(
        "hidden"
    );


    subjectCount.textContent =
        `${subjects.length} ${
            subjects.length === 1
                ? "subject"
                : "subjects"
        }`;


    if (!subjects.length) {

        emptyState.classList.remove(
            "hidden"
        );

        return;
    }


    emptyState.classList.add(
        "hidden"
    );


    subjects.forEach(
        (subject, index) => {

            subjectsGrid.appendChild(
                createSubjectCard(
                    subject,
                    index
                )
            );

        }
    );
}


/* =========================================================
   CREATE SUBJECT CARD
========================================================= */

function createSubjectCard(
    subject,
    index
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "subject-card";


    const medium =
        subject.medium ||
        "Kannada";


    const classes =
        Array.isArray(
            subject.targetClasses
        )
            ? subject.targetClasses
            : [];


    const classText =
        classes.length
            ? classes.join(", ")
            : "All classes";


    card.innerHTML = `

        <div>

            <div class="subject-card-top">

                <div class="subject-number">
                    ${String(index + 1).padStart(2, "0")}
                </div>


                <div class="subject-menu">

                    <button
                        class="small-btn edit-btn"
                        type="button"
                        title="Edit"
                    >
                        ✎
                    </button>


                    <button
                        class="small-btn delete delete-btn"
                        type="button"
                        title="Delete"
                    >
                        ×
                    </button>

                </div>

            </div>


            <h3>
                ${escapeHTML(
                    subject.name ||
                    "Unnamed Subject"
                )}
            </h3>


            <p class="subject-card-description">

                ${escapeHTML(
                    subject.description ||
                    "No description"
                )}

            </p>

        </div>


        <div class="subject-footer">

            <span class="medium-badge">

                <span class="medium-dot"></span>

                ${escapeHTML(medium)}

            </span>


            <span class="class-text">

                ${escapeHTML(classText)}

            </span>

        </div>

    `;


    const editBtn =
        card.querySelector(
            ".edit-btn"
        );


    const deleteBtn =
        card.querySelector(
            ".delete-btn"
        );


    editBtn.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            openEditSubject(
                subject
            );

        }
    );


    deleteBtn.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            deleteSubject(
                subject
            );

        }
    );


    /*
     * For now clicking the card does
     * nothing.
     *
     * Later it will open:
     *
     * Subject → Chapters
     */

    return card;
}


/* =========================================================
   ADD SUBJECT
========================================================= */

function openAddSubject() {

    editingSubjectId = null;


    modalTitle.textContent =
        "Add Subject";


    saveBtn.textContent =
        "Save Subject";


    subjectForm.reset();


    /*
     * Defaults
     */

    document.querySelector(
        'input[name="medium"][value="Kannada"]'
    ).checked = true;


    subjectPriority.value =
        "1";


    subjectActive.checked =
        true;


    clearClassCheckboxes();


    subjectModal.classList.remove(
        "hidden"
    );


    setTimeout(
        () => {

            subjectName.focus();

        },
        50
    );
}


/* =========================================================
   EDIT SUBJECT
========================================================= */

function openEditSubject(
    subject
) {

    editingSubjectId =
        subject.id;


    modalTitle.textContent =
        "Edit Subject";


    saveBtn.textContent =
        "Update Subject";


    subjectName.value =
        subject.name || "";


    subjectDescription.value =
        subject.description || "";


    subjectPriority.value =
        Number(
            subject.priority ?? 1
        );


    subjectActive.checked =
        subject.active !== false;


    /*
     * Medium
     */

    const medium =
        subject.medium ||
        "Kannada";


    const mediumRadio =
        document.querySelector(
            `input[name="medium"][value="${CSS.escape(
                medium
            )}"]`
        );


    /*
     * Old documents may contain
     * something unexpected.
     */

    if (mediumRadio) {

        mediumRadio.checked =
            true;

    } else {

        document.querySelector(
            'input[name="medium"][value="Kannada"]'
        ).checked = true;

    }


    /*
     * Classes
     */

    clearClassCheckboxes();


    if (
        Array.isArray(
            subject.targetClasses
        )
    ) {

        document
            .querySelectorAll(
                ".class-checkbox"
            )
            .forEach(
                checkbox => {

                    checkbox.checked =
                        subject.targetClasses.includes(
                            checkbox.value
                        );

                }
            );

    }


    subjectModal.classList.remove(
        "hidden"
    );


    setTimeout(
        () => {

            subjectName.focus();

        },
        50
    );
}


/* =========================================================
   SAVE
========================================================= */

subjectForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const name =
            subjectName.value.trim();


        const description =
            subjectDescription.value.trim();


        const medium =
            document.querySelector(
                'input[name="medium"]:checked'
            )?.value ||
            "Kannada";


        const priority =
            Math.max(
                1,
                Number(
                    subjectPriority.value ||
                    1
                )
            );


        const active =
            subjectActive.checked;


        const targetClasses =
            Array.from(
                document.querySelectorAll(
                    ".class-checkbox:checked"
                )
            ).map(
                checkbox =>
                    checkbox.value
            );


        if (!name) {

            subjectName.focus();

            return;

        }


        saveBtn.disabled =
            true;


        saveBtn.textContent =
            editingSubjectId
                ? "Updating..."
                : "Saving...";


        try {

            const data = {

                name,

                description,

                medium,

                targetClasses,

                priority,

                active,

                updatedAt:
                    serverTimestamp()

            };


            if (editingSubjectId) {

                /*
                 * UPDATE
                 */

                const subjectRef =
                    doc(
                        db,
                        "hybridSubjects",
                        editingSubjectId
                    );


                await updateDoc(
                    subjectRef,
                    data
                );


            } else {

                /*
                 * CREATE
                 */

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

        } catch (error) {

            console.error(
                "Save subject:",
                error
            );


            alert(
                getFirebaseError(
                    error
                )
            );

        } finally {

            saveBtn.disabled =
                false;

            saveBtn.textContent =
                editingSubjectId
                    ? "Update Subject"
                    : "Save Subject";

        }

    }
);


/* =========================================================
   DELETE
========================================================= */

async function deleteSubject(
    subject
) {

    const subjectName =
        subject.name ||
        "this subject";


    const confirmed =
        confirm(
            `Delete "${subjectName}"?\n\n` +
            `This should only be done if the subject ` +
            `has no chapters or learning content.`
        );


    if (!confirmed) {

        return;

    }


    try {

        await deleteDoc(
            doc(
                db,
                "hybridSubjects",
                subject.id
            )
        );

    } catch (error) {

        console.error(
            "Delete subject:",
            error
        );


        alert(
            getFirebaseError(
                error
            )
        );

    }
}


/* =========================================================
   CLASS CHECKBOXES
========================================================= */

function clearClassCheckboxes() {

    document
        .querySelectorAll(
            ".class-checkbox"
        )
        .forEach(
            checkbox => {

                checkbox.checked =
                    false;

            }
        );
}


/* =========================================================
   MODAL
========================================================= */

function closeModal() {

    subjectModal.classList.add(
        "hidden"
    );

    editingSubjectId =
        null;

}


addSubjectBtn.addEventListener(
    "click",
    openAddSubject
);


emptyAddBtn.addEventListener(
    "click",
    openAddSubject
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
    closeModal
);


/* =========================================================
   NAVIGATION
========================================================= */

backBtn.addEventListener(
    "click",
    () => {

        window.location.href =
            "../";

    }
);


retryBtn.addEventListener(
    "click",
    () => {

        loadSubjects();

    }
);


/* =========================================================
   ERROR
========================================================= */

function showError(
    message
) {

    subjectsGrid.innerHTML = "";

    emptyState.classList.add(
        "hidden"
    );

    errorText.textContent =
        message;

    errorState.classList.remove(
        "hidden"
    );
}


function hideError() {

    errorState.classList.add(
        "hidden"
    );
}


function getFirebaseError(
    error
) {

    console.error(
        error
    );


    if (
        error?.code ===
        "permission-denied"
    ) {

        return (
            "Permission denied by Firebase. " +
            "Check your Firestore rules."
        );

    }


    if (
        error?.code ===
        "unavailable"
    ) {

        return (
            "Firebase is temporarily unavailable. " +
            "Please try again."
        );

    }


    return (
        error?.message ||
        "Something went wrong with Firebase."
    );
}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}

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
    getDoc,
    getDocs,
    query,
    where,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* ============================================================
   ELEMENTS
============================================================ */

const loader =
    document.getElementById("loader");

const app =
    document.getElementById("app");

const subjectName =
    document.getElementById("subjectName");

const subjectTitle =
    document.getElementById("subjectTitle");

const subjectDescription =
    document.getElementById("subjectDescription");

const chaptersList =
    document.getElementById("chaptersList");

const emptyState =
    document.getElementById("emptyState");

const addChapterButton =
    document.getElementById("addChapterButton");

const emptyAddButton =
    document.getElementById("emptyAddButton");

const backButton =
    document.getElementById("backButton");

const modal =
    document.getElementById("chapterModal");

const closeModal =
    document.getElementById("closeModal");

const modalTitle =
    document.getElementById("modalTitle");

const form =
    document.getElementById("chapterForm");

const chapterNumber =
    document.getElementById("chapterNumber");

const chapterTitle =
    document.getElementById("chapterTitle");

const chapterDescription =
    document.getElementById("chapterDescription");

const chapterPriority =
    document.getElementById("chapterPriority");

const chapterActive =
    document.getElementById("chapterActive");

const formError =
    document.getElementById("formError");

const saveButton =
    document.getElementById("saveButton");


/* ============================================================
   STATE
============================================================ */

let currentUser = null;

let currentSubject = null;

let editingChapterId = null;

const params =
    new URLSearchParams(
        window.location.search
    );

const subjectId =
    params.get("subjectId");


/* ============================================================
   START
============================================================ */

if (!subjectId) {

    alert(
        "No subject selected."
    );

    window.location.href =
        "../";

}


/* ============================================================
   AUTH
============================================================ */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "../../../";

            return;
        }

        currentUser = user;

        await initialize();

    }
);


/* ============================================================
   INITIALIZE
============================================================ */

async function initialize() {

    try {

        await loadSubject();

        await loadChapters();

        showApp();

    } catch (error) {

        console.error(
            "Chapter page error:",
            error
        );

        alert(
            "Unable to load chapters. Check Firestore rules and try again."
        );

        showApp();

    }

}


/* ============================================================
   LOAD SUBJECT
============================================================ */

async function loadSubject() {

    const subjectRef =
        doc(
            db,
            "hybridSubjects",
            subjectId
        );

    const snapshot =
        await getDoc(
            subjectRef
        );


    if (!snapshot.exists()) {

        alert(
            "Subject not found."
        );

        window.location.href =
            "../";

        return;

    }


    currentSubject = {
        id: snapshot.id,
        ...snapshot.data()
    };


    subjectName.textContent =
        currentSubject.name ||
        "Subject";


    subjectTitle.textContent =
        currentSubject.name ||
        "Subject";


    subjectDescription.textContent =
        currentSubject.description ||
        "Manage chapters for this subject.";

}


/* ============================================================
   LOAD CHAPTERS
============================================================ */

async function loadChapters() {

    chaptersList.innerHTML = "";

    emptyState.classList.add(
        "hidden"
    );


    const ref =
        collection(
            db,
            "hybridChapters"
        );


    /*
     * Only query by subjectId.
     *
     * We sort locally so Firestore
     * does not require a composite index.
     */

    const q =
        query(
            ref,
            where(
                "subjectId",
                "==",
                subjectId
            )
        );


    const snapshot =
        await getDocs(q);


    let chapters =
        snapshot.docs.map(
            item => ({
                id: item.id,
                ...item.data()
            })
        );


    chapters.sort(
        (a, b) => {

            const numberA =
                Number(
                    a.chapterNumber ||
                    9999
                );

            const numberB =
                Number(
                    b.chapterNumber ||
                    9999
                );


            if (
                numberA !==
                numberB
            ) {

                return (
                    numberA -
                    numberB
                );

            }


            return (
                Number(
                    b.priority ||
                    0
                ) -
                Number(
                    a.priority ||
                    0
                )
            );

        }
    );


    if (!chapters.length) {

        emptyState.classList.remove(
            "hidden"
        );

        return;

    }


    chapters.forEach(
        chapter => {

            chaptersList.appendChild(
                createChapterCard(
                    chapter
                )
            );

        }
    );

}


/* ============================================================
   CREATE CHAPTER CARD
============================================================ */

function createChapterCard(
    chapter
) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "chapter-card";


    const number =
        Number(
            chapter.chapterNumber ||
            0
        );


    const active =
        chapter.active !== false;


    card.innerHTML = `

        <div class="chapter-left">

            <div class="chapter-number">
                ${String(number).padStart(2, "0")}
            </div>

            <div class="chapter-content">

                <h3>
                    ${escapeHtml(
                        chapter.title ||
                        "Untitled Chapter"
                    )}
                </h3>

                <p>
                    ${escapeHtml(
                        chapter.description ||
                        "No description"
                    )}
                </p>

                <div class="chapter-meta">

                    <span
                        class="status ${
                            active
                                ? ""
                                : "inactive"
                        }"
                    >
                        ${
                            active
                                ? "ACTIVE"
                                : "INACTIVE"
                        }
                    </span>

                    <span
                        style="
                            font-size:9px;
                            color:#999;
                        "
                    >
                        Priority:
                        ${Number(
                            chapter.priority ||
                            0
                        )}
                    </span>

                </div>

            </div>

        </div>


        <div class="chapter-actions">

            <button
                class="action-button edit-button"
            >
                EDIT
            </button>

            <button
                class="action-button delete delete-button"
            >
                DELETE
            </button>

        </div>

    `;


    card
        .querySelector(
            ".edit-button"
        )
        .addEventListener(
            "click",
            () => {

                openEditModal(
                    chapter
                );

            }
        );


    card
        .querySelector(
            ".delete-button"
        )
        .addEventListener(
            "click",
            () => {

                deleteChapter(
                    chapter
                );

            }
        );


    return card;

}


/* ============================================================
   OPEN ADD MODAL
============================================================ */

function openAddModal() {

    editingChapterId =
        null;


    modalTitle.textContent =
        "Add Chapter";


    form.reset();


    chapterPriority.value =
        "0";


    chapterActive.value =
        "true";


    hideFormError();


    modal.classList.remove(
        "hidden"
    );


    setTimeout(
        () => {

            chapterNumber.focus();

        },
        100
    );

}


/* ============================================================
   OPEN EDIT MODAL
============================================================ */

function openEditModal(
    chapter
) {

    editingChapterId =
        chapter.id;


    modalTitle.textContent =
        "Edit Chapter";


    chapterNumber.value =
        chapter.chapterNumber ||
        "";


    chapterTitle.value =
        chapter.title ||
        "";


    chapterDescription.value =
        chapter.description ||
        "";


    chapterPriority.value =
        chapter.priority ||
        0;


    chapterActive.value =
        chapter.active === false
            ? "false"
            : "true";


    hideFormError();


    modal.classList.remove(
        "hidden"
    );

}


/* ============================================================
   CLOSE MODAL
============================================================ */

function closeChapterModal() {

    modal.classList.add(
        "hidden"
    );

    editingChapterId =
        null;

}


/* ============================================================
   SAVE CHAPTER
============================================================ */

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        hideFormError();


        const number =
            Number(
                chapterNumber.value
            );


        const title =
            chapterTitle.value
                .trim();


        const description =
            chapterDescription.value
                .trim();


        const priority =
            Number(
                chapterPriority.value ||
                0
            );


        const active =
            chapterActive.value ===
            "true";


        if (
            !number ||
            number < 1
        ) {

            showFormError(
                "Enter a valid chapter number."
            );

            return;

        }


        if (!title) {

            showFormError(
                "Enter the chapter title."
            );

            return;

        }


        saveButton.disabled =
            true;

        saveButton.textContent =
            "SAVING...";


        try {

            const data = {

                subjectId:
                    subjectId,

                title:
                    title,

                description:
                    description,

                chapterNumber:
                    number,

                priority:
                    priority,

                active:
                    active,

                updatedAt:
                    serverTimestamp()

            };


            if (
                editingChapterId
            ) {

                const chapterRef =
                    doc(
                        db,
                        "hybridChapters",
                        editingChapterId
                    );


                await updateDoc(
                    chapterRef,
                    data
                );


            } else {

                await addDoc(
                    collection(
                        db,
                        "hybridChapters"
                    ),
                    {
                        ...data,

                        createdAt:
                            serverTimestamp(),

                        createdBy:
                            currentUser.uid

                    }
                );

            }


            closeChapterModal();

            await loadChapters();


        } catch (error) {

            console.error(
                "Save chapter failed:",
                error
            );


            showFormError(
                getFirebaseErrorMessage(
                    error
                )
            );

        } finally {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "SAVE CHAPTER";

        }

    }
);


/* ============================================================
   DELETE CHAPTER
============================================================ */

async function deleteChapter(
    chapter
) {

    const confirmed =
        confirm(
            `Delete "${chapter.title}"?\n\nThis will permanently delete the chapter.`
        );


    if (!confirmed) {

        return;

    }


    try {

        await deleteDoc(
            doc(
                db,
                "hybridChapters",
                chapter.id
            )
        );


        await loadChapters();


    } catch (error) {

        console.error(
            "Delete chapter failed:",
            error
        );


        alert(
            getFirebaseErrorMessage(
                error
            )
        );

    }

}


/* ============================================================
   BUTTONS
============================================================ */

addChapterButton.addEventListener(
    "click",
    openAddModal
);


emptyAddButton.addEventListener(
    "click",
    openAddModal
);


closeModal.addEventListener(
    "click",
    closeChapterModal
);


backButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "../";

    }
);


/* Close when clicking outside */

modal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            modal
        ) {

            closeChapterModal();

        }

    }
);


/* ESC */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape" &&
            !modal.classList.contains(
                "hidden"
            )
        ) {

            closeChapterModal();

        }

    }
);


/* ============================================================
   HELPERS
============================================================ */

function showApp() {

    loader.classList.add(
        "hidden"
    );

    app.classList.remove(
        "hidden"
    );

}


function showFormError(
    message
) {

    formError.textContent =
        message;

    formError.classList.remove(
        "hidden"
    );

}


function hideFormError() {

    formError.textContent =
        "";

    formError.classList.add(
        "hidden"
    );

}


function escapeHtml(
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


function getFirebaseErrorMessage(
    error
) {

    if (
        error?.code ===
        "permission-denied"
    ) {

        return (
            "Permission denied. Add Firestore access for hybridChapters in your rules."
        );

    }


    return (
        error?.message ||
        "Something went wrong while saving."
    );

}

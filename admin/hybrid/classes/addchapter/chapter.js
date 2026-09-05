import {
    auth,
    db
} from "../../../../firebase/firebase-config.js";


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

const errorScreen =
    document.getElementById("errorScreen");

const errorMessage =
    document.getElementById("errorMessage");

const retryButton =
    document.getElementById("retryButton");

const errorBackButton =
    document.getElementById("errorBackButton");

const backButton =
    document.getElementById("backButton");

const subjectTitle =
    document.getElementById("subjectTitle");

const subjectDescription =
    document.getElementById(
        "subjectDescription"
    );

const chaptersList =
    document.getElementById(
        "chaptersList"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );

const addChapterButton =
    document.getElementById(
        "addChapterButton"
    );

const emptyAddButton =
    document.getElementById(
        "emptyAddButton"
    );

const modal =
    document.getElementById(
        "chapterModal"
    );

const modalTitle =
    document.getElementById(
        "modalTitle"
    );

const closeModal =
    document.getElementById(
        "closeModal"
    );

const form =
    document.getElementById(
        "chapterForm"
    );

const chapterNumber =
    document.getElementById(
        "chapterNumber"
    );

const chapterTitle =
    document.getElementById(
        "chapterTitle"
    );

const chapterDescription =
    document.getElementById(
        "chapterDescription"
    );

const chapterPriority =
    document.getElementById(
        "chapterPriority"
    );

const chapterActive =
    document.getElementById(
        "chapterActive"
    );

const formError =
    document.getElementById(
        "formError"
    );

const saveButton =
    document.getElementById(
        "saveButton"
    );



/* ============================================================
   STATE
============================================================ */

let currentUser = null;

let currentSubject = null;

let editingChapterId = null;


const urlParams =
    new URLSearchParams(
        window.location.search
    );


const subjectId =
    urlParams.get(
        "subjectId"
    );



/* ============================================================
   START
============================================================ */

if (!subjectId) {

    showError(
        "No subject was selected. Open a subject from the Hybrid Classes page."
    );

} else {

    startAuthentication();

}



/* ============================================================
   AUTHENTICATION
============================================================ */

function startAuthentication() {

    onAuthStateChanged(
        auth,
        async user => {

            if (!user) {

                showError(
                    "You are not signed in. Please sign in to access the admin portal."
                );

                return;

            }


            currentUser =
                user;


            await initialize();

        }
    );

}



/* ============================================================
   INITIALIZE
============================================================ */

async function initialize() {

    try {

        await loadSubject();

        await loadChapters();

        showApplication();

    } catch (error) {

        console.error(
            "Hybrid Chapters Error:",
            error
        );


        showError(
            getErrorMessage(
                error
            )
        );

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

        throw new Error(
            "The selected subject does not exist in Firestore."
        );

    }


    currentSubject = {

        id:
            snapshot.id,

        ...snapshot.data()

    };


    subjectTitle.textContent =
        currentSubject.name ||
        "Unnamed Subject";


    subjectDescription.textContent =
        currentSubject.description ||
        "Manage chapters for this subject.";

}



/* ============================================================
   LOAD CHAPTERS
============================================================ */

async function loadChapters() {

    chaptersList.innerHTML =
        "";


    emptyState.classList.add(
        "hidden"
    );


    const chaptersRef =
        collection(
            db,
            "hybridChapters"
        );


    /*
     * Only query subjectId.
     *
     * Sorting happens locally.
     *
     * This avoids composite-index
     * problems.
     */

    const chaptersQuery =
        query(
            chaptersRef,
            where(
                "subjectId",
                "==",
                subjectId
            )
        );


    const snapshot =
        await getDocs(
            chaptersQuery
        );


    let chapters =
        snapshot.docs.map(
            item => ({

                id:
                    item.id,

                ...item.data()

            })
        );


    chapters.sort(
        (a, b) => {

            const numberA =
                Number(
                    a.chapterNumber ??
                    999999
                );


            const numberB =
                Number(
                    b.chapterNumber ??
                    999999
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
                    a.priority ??
                    0
                ) -
                Number(
                    b.priority ??
                    0
                )
            );

        }
    );


    if (
        chapters.length ===
        0
    ) {

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
            chapter.chapterNumber ??
            0
        );


    const active =
        chapter.active !==
        false;


    const title =
        chapter.title ||
        "Untitled Chapter";


    const description =
        chapter.description ||
        "No description";


    const priority =
        Number(
            chapter.priority ??
            0
        );


    card.innerHTML = `

        <div class="chapter-main">

            <div class="chapter-number">

                ${String(
                    number
                ).padStart(
                    2,
                    "0"
                )}

            </div>


            <div class="chapter-info">

                <h3>
                    ${escapeHtml(
                        title
                    )}
                </h3>


                <p>
                    ${escapeHtml(
                        description
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


                    <span class="priority">

                        Priority:
                        ${priority}

                    </span>

                </div>

            </div>

        </div>


        <div class="chapter-actions">

            <button
                type="button"
                class="action-button edit-button"
            >
                EDIT
            </button>


            <button
                type="button"
                class="action-button delete delete-button"
            >
                DELETE
            </button>

        </div>

    `;


    const editButton =
        card.querySelector(
            ".edit-button"
        );


    const deleteButton =
        card.querySelector(
            ".delete-button"
        );


    editButton.addEventListener(
        "click",
        () => {

            openEditModal(
                chapter
            );

        }
    );


    deleteButton.addEventListener(
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
   ADD CHAPTER
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
   EDIT CHAPTER
============================================================ */

function openEditModal(
    chapter
) {

    editingChapterId =
        chapter.id;


    modalTitle.textContent =
        "Edit Chapter";


    chapterNumber.value =
        chapter.chapterNumber ??
        "";


    chapterTitle.value =
        chapter.title ??
        "";


    chapterDescription.value =
        chapter.description ??
        "";


    chapterPriority.value =
        chapter.priority ??
        0;


    chapterActive.value =
        chapter.active ===
        false
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
   SAVE
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
            !Number.isInteger(
                number
            ) ||
            number < 1
        ) {

            showFormError(
                "Enter a valid chapter number."
            );

            return;

        }


        if (
            !title
        ) {

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

            const chapterData = {

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
                    chapterData
                );

            } else {

                await addDoc(
                    collection(
                        db,
                        "hybridChapters"
                    ),
                    {

                        ...chapterData,

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
                "Save chapter error:",
                error
            );


            showFormError(
                getErrorMessage(
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
   DELETE
============================================================ */

async function deleteChapter(
    chapter
) {

    const confirmed =
        window.confirm(
            `Delete "${chapter.title}"?\n\nThis will permanently delete the chapter.`
        );


    if (
        !confirmed
    ) {

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
            "Delete chapter error:",
            error
        );


        alert(
            getErrorMessage(
                error
            )
        );

    }

}



/* ============================================================
   NAVIGATION
============================================================ */

backButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "../";

    }
);


errorBackButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "../";

    }
);


retryButton.addEventListener(
    "click",
    () => {

        window.location.reload();

    }
);



/* ============================================================
   MODAL EVENTS
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


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            if (
                !modal.classList.contains(
                    "hidden"
                )
            ) {

                closeChapterModal();

            }

        }

    }
);



/* ============================================================
   UI
============================================================ */

function showApplication() {

    loader.classList.add(
        "hidden"
    );


    errorScreen.classList.add(
        "hidden"
    );


    app.classList.remove(
        "hidden"
    );

}


function showError(
    message
) {

    loader.classList.add(
        "hidden"
    );


    app.classList.add(
        "hidden"
    );


    errorMessage.textContent =
        message;


    errorScreen.classList.remove(
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



/* ============================================================
   FIREBASE ERROR HANDLING
============================================================ */

function getErrorMessage(
    error
) {

    if (
        error?.code ===
        "permission-denied"
    ) {

        return (
            "Firestore permission denied. Add access for hybridChapters in your Firestore rules."
        );

    }


    if (
        error?.code ===
        "not-found"
    ) {

        return (
            "The requested Firestore document was not found."
        );

    }


    if (
        error?.message
    ) {

        return error.message;

    }


    return (
        "Something went wrong while loading the chapters."
    );

}



/* ============================================================
   HTML ESCAPE
============================================================ */

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

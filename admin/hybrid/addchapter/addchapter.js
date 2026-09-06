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
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   ELEMENTS
========================================================= */

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

const chapterCount =
    document.getElementById("chapterCount");

const chaptersList =
    document.getElementById("chaptersList");

const emptyState =
    document.getElementById("emptyState");

const errorBox =
    document.getElementById("errorBox");

const modal =
    document.getElementById("chapterModal");

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


/* =========================================================
   URL
========================================================= */

const params =
    new URLSearchParams(
        window.location.search
    );

const subjectId =
    params.get("subjectId");


/*
 * THIS PAGE REQUIRES A SUBJECT.
 *
 * It should only be opened by clicking a subject
 * from /admin/hybrid/addsubject/
 */

if (!subjectId) {

    showFatalError(
        "No subject was selected. Please open Add Chapter from the Subjects page."
    );

} else {

    start();

}


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let currentSubject = null;

let chapters = [];

let editingChapterId = null;


/* =========================================================
   START
========================================================= */

function start() {

    onAuthStateChanged(
        auth,
        async user => {

            if (!user) {

                window.location.replace(
                    "../../../index.html"
                );

                return;
            }


            currentUser = user;


            try {

                await loadSubject();

                await loadChapters();

                showApp();

            } catch (error) {

                console.error(
                    "ADD CHAPTER ERROR:",
                    error
                );

                showError(
                    "Unable to load this page. " +
                    error.message
                );

                showApp();
            }

        }
    );

}


/* =========================================================
   LOAD SUBJECT
========================================================= */

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
            "The selected subject no longer exists."
        );
    }


    currentSubject = {
        id: snapshot.id,
        ...snapshot.data()
    };


    const name =
        currentSubject.name ||
        "Subject";


    subjectName.textContent =
        name;

    subjectTitle.textContent =
        name;

    subjectDescription.textContent =
        currentSubject.description ||
        "Manage chapters for this subject.";
}


/* =========================================================
   LOAD CHAPTERS
========================================================= */

async function loadChapters() {

    chaptersList.innerHTML = "";

    emptyState.classList.add(
        "hidden"
    );


    /*
     * IMPORTANT:
     *
     * Only query by subjectId.
     *
     * Sorting is done locally.
     *
     * This avoids requiring a composite
     * Firestore index.
     */

    const chapterQuery =
        query(
            collection(
                db,
                "hybridChapters"
            ),
            where(
                "subjectId",
                "==",
                subjectId
            )
        );


    const snapshot =
        await getDocs(
            chapterQuery
        );


    chapters =
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
                    a.chapterNumber ?? 9999
                );

            const numberB =
                Number(
                    b.chapterNumber ?? 9999
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
                    a.priority ?? 0
                ) -
                Number(
                    b.priority ?? 0
                )
            );
        }
    );


    chapterCount.textContent =
        chapters.length;


    renderChapters();
}


/* =========================================================
   RENDER CHAPTERS
========================================================= */

function renderChapters() {

    chaptersList.innerHTML = "";


    if (!chapters.length) {

        emptyState.classList.remove(
            "hidden"
        );

        return;
    }


    emptyState.classList.add(
        "hidden"
    );


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


/* =========================================================
   CHAPTER CARD
========================================================= */

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
            chapter.chapterNumber || 0
        );


    const isActive =
        chapter.active !== false;


    card.innerHTML = `

        <div class="chapter-number">
            ${number || "—"}
        </div>


        <div class="chapter-main">

            <h3>
                ${escapeHTML(
                    chapter.title ||
                    "Untitled Chapter"
                )}
            </h3>

            <p>
                ${escapeHTML(
                    chapter.description ||
                    "No description added."
                )}
            </p>


            <div class="chapter-meta">

                <span>
                    Priority ${
                        Number(
                            chapter.priority ?? 0
                        )
                    }
                </span>

                <span class="chapter-status ${
                    isActive
                        ? "active"
                        : "inactive"
                }">

                    ${
                        isActive
                            ? "ACTIVE"
                            : "INACTIVE"
                    }

                </span>

            </div>

        </div>


        <div class="chapter-actions">

            <button
                type="button"
                class="chapter-btn"
                data-action="edit"
            >
                Edit
            </button>

            <button
                type="button"
                class="chapter-btn"
                data-action="toggle"
            >
                ${
                    isActive
                        ? "Deactivate"
                        : "Activate"
                }
            </button>

        </div>
    `;


    card
        .querySelectorAll(
            ".chapter-btn"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const action =
                        button.dataset.action;


                    if (
                        action === "edit"
                    ) {

                        openEdit(
                            chapter
                        );

                    }


                    if (
                        action === "toggle"
                    ) {

                        await toggleChapter(
                            chapter
                        );

                    }

                }
            );

        });


    return card;
}


/* =========================================================
   OPEN ADD
========================================================= */

function openAdd() {

    editingChapterId = null;

    modalTitle.textContent =
        "Add Chapter";

    saveButton.textContent =
        "Save Chapter";


    form.reset();


    chapterNumber.value =
        String(
            getNextChapterNumber()
        );


    chapterPriority.value =
        "0";


    chapterActive.checked =
        true;


    clearFormError();


    modal.classList.remove(
        "hidden"
    );


    chapterTitle.focus();
}


/* =========================================================
   NEXT CHAPTER NUMBER
========================================================= */

function getNextChapterNumber() {

    if (!chapters.length) {
        return 1;
    }


    const numbers =
        chapters
            .map(
                chapter =>
                    Number(
                        chapter.chapterNumber
                    )
            )
            .filter(
                number =>
                    Number.isFinite(
                        number
                    ) &&
                    number > 0
            );


    if (!numbers.length) {
        return 1;
    }


    return (
        Math.max(...numbers) +
        1
    );
}


/* =========================================================
   OPEN EDIT
========================================================= */

function openEdit(
    chapter
) {

    editingChapterId =
        chapter.id;


    modalTitle.textContent =
        "Edit Chapter";

    saveButton.textContent =
        "Update Chapter";


    chapterNumber.value =
        Number(
            chapter.chapterNumber || 1
        );


    chapterTitle.value =
        chapter.title || "";


    chapterDescription.value =
        chapter.description || "";


    chapterPriority.value =
        Number(
            chapter.priority ?? 0
        );


    chapterActive.checked =
        chapter.active !== false;


    clearFormError();


    modal.classList.remove(
        "hidden"
    );


    chapterTitle.focus();
}


/* =========================================================
   SAVE
========================================================= */

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        clearFormError();


        const number =
            Number(
                chapterNumber.value
            );

        const title =
            chapterTitle.value.trim();

        const description =
            chapterDescription.value.trim();

        const priority =
            Number(
                chapterPriority.value || 0
            );

        const active =
            chapterActive.checked;


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
                "Chapter title is required."
            );

            return;
        }


        /*
         * Prevent duplicate chapter numbers
         * within the same subject.
         */

        const duplicate =
            chapters.find(
                chapter =>
                    chapter.id !==
                        editingChapterId &&
                    Number(
                        chapter.chapterNumber
                    ) === number
            );


        if (duplicate) {

            showFormError(
                `Chapter ${number} already exists for this subject.`
            );

            return;
        }


        saveButton.disabled =
            true;

        saveButton.textContent =
            editingChapterId
                ? "Updating..."
                : "Saving...";


        try {

            if (editingChapterId) {

                /*
                 * UPDATE EXISTING CHAPTER
                 */

                await updateDoc(
                    doc(
                        db,
                        "hybridChapters",
                        editingChapterId
                    ),
                    {
                        title,
                        description,
                        chapterNumber:
                            number,
                        priority,
                        active,
                        updatedAt:
                            serverTimestamp()
                    }
                );

            } else {

                /*
                 * CREATE NEW CHAPTER
                 */

                await addDoc(
                    collection(
                        db,
                        "hybridChapters"
                    ),
                    {
                        subjectId,

                        title,

                        description,

                        chapterNumber:
                            number,

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

            await loadChapters();


        } catch (error) {

            console.error(
                "SAVE CHAPTER ERROR:",
                error
            );

            showFormError(
                error.message
            );

        } finally {

            saveButton.disabled =
                false;

            saveButton.textContent =
                editingChapterId
                    ? "Update Chapter"
                    : "Save Chapter";
        }

    }
);


/* =========================================================
   TOGGLE
========================================================= */

async function toggleChapter(
    chapter
) {

    try {

        await updateDoc(
            doc(
                db,
                "hybridChapters",
                chapter.id
            ),
            {
                active:
                    chapter.active === false,

                updatedAt:
                    serverTimestamp()
            }
        );


        await loadChapters();


    } catch (error) {

        console.error(
            "TOGGLE CHAPTER ERROR:",
            error
        );

        showError(
            error.message
        );
    }
}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal() {

    modal.classList.add(
        "hidden"
    );

    editingChapterId =
        null;

    clearFormError();
}


/* =========================================================
   BUTTONS
========================================================= */

document
    .getElementById(
        "addChapterButton"
    )
    .addEventListener(
        "click",
        openAdd
    );


document
    .getElementById(
        "emptyAddButton"
    )
    .addEventListener(
        "click",
        openAdd
    );


document
    .getElementById(
        "closeModal"
    )
    .addEventListener(
        "click",
        closeModal
    );


document
    .getElementById(
        "cancelButton"
    )
    .addEventListener(
        "click",
        closeModal
    );


document
    .getElementById(
        "modalOverlay"
    )
    .addEventListener(
        "click",
        closeModal
    );


document
    .getElementById(
        "backButton"
    )
    .addEventListener(
        "click",
        () => {

            window.location.href =
                "../addsubject/";

        }
    );


/* =========================================================
   UI
========================================================= */

function showApp() {

    loader.classList.add(
        "hidden"
    );

    app.classList.remove(
        "hidden"
    );
}


function showError(
    message
) {

    errorBox.textContent =
        message;

    errorBox.classList.remove(
        "hidden"
    );
}


function showFatalError(
    message
) {

    loader.innerHTML = `

        <div style="
            max-width:420px;
            padding:25px;
            text-align:center;
        ">

            <strong style="
                display:block;
                font-size:17px;
                margin-bottom:8px;
            ">
                ${escapeHTML(message)}
            </strong>

            <button
                id="fatalBackButton"
                style="
                    margin-top:15px;
                    padding:10px 16px;
                    border:0;
                    border-radius:8px;
                    background:#111;
                    color:#fff;
                    font-weight:700;
                    cursor:pointer;
                "
            >
                Back to Subjects
            </button>

        </div>
    `;


    document
        .getElementById(
            "fatalBackButton"
        )
        .addEventListener(
            "click",
            () => {

                window.location.href =
                    "../addsubject/";

            }
        );
}


function clearError() {

    errorBox.textContent =
        "";

    errorBox.classList.add(
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


function clearFormError() {

    formError.textContent =
        "";

    formError.classList.add(
        "hidden"
    );
}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(
    value
) {

    return String(value)
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

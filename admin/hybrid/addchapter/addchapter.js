import { auth, db, storage } from "../../../firebase/firebase-config.js";

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

import {
    ref,
    uploadBytesResumable,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";


// ======================================================
// ELEMENTS
// ======================================================

const pageLoader = document.getElementById("pageLoader");
const app = document.getElementById("app");

const backBtn = document.getElementById("backBtn");

const subjectName = document.getElementById("subjectName");
const subjectDescription = document.getElementById("subjectDescription");

const chapterList = document.getElementById("chapterList");
const emptyState = document.getElementById("emptyState");
const chapterCount = document.getElementById("chapterCount");

const addChapterBtn = document.getElementById("addChapterBtn");
const emptyAddBtn = document.getElementById("emptyAddBtn");

const chapterModal = document.getElementById("chapterModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const cancelBtn = document.getElementById("cancelBtn");

const chapterForm = document.getElementById("chapterForm");

const modalTitle = document.getElementById("modalTitle");
const modalEyebrow = document.getElementById("modalEyebrow");

const chapterNameInput =
    document.getElementById("chapterName");

const chapterNumberInput =
    document.getElementById("chapterNumber");

const orderPreview =
    document.getElementById("orderPreview");

const videoUrlInput =
    document.getElementById("videoUrl");

const pdfFileInput =
    document.getElementById("pdfFile");

const currentPdf =
    document.getElementById("currentPdf");

const lockToggle =
    document.getElementById("lockToggle");

const lockIcon =
    document.getElementById("lockIcon");

const lockText =
    document.getElementById("lockText");

const saveBtn =
    document.getElementById("saveBtn");

const uploadProgress =
    document.getElementById("uploadProgress");

const progressBar =
    document.getElementById("progressBar");

const progressText =
    document.getElementById("progressText");

const toast =
    document.getElementById("toast");


// ======================================================
// STATE
// ======================================================

let currentUser = null;

let subjectId = null;

let subjectData = null;

let chapters = [];

let editingChapterId = null;

let editingChapterData = null;

let isLocked = false;


// ======================================================
// GET SUBJECT ID
// ======================================================

const params = new URLSearchParams(
    window.location.search
);

subjectId = params.get("subjectId");


// ======================================================
// INITIALIZATION
// ======================================================

if (!subjectId) {

    hideLoader();

    showToast(
        "Subject ID is missing.",
        true
    );

    setTimeout(() => {
        window.location.href = "../addsubject/";
    }, 1200);

} else {

    onAuthStateChanged(auth, async (user) => {

        if (!user) {

            window.location.href = "../../../index.html";

            return;
        }

        currentUser = user;

        try {

            await loadSubject();

            await loadChapters();

            showApp();

        } catch (error) {

            console.error(
                "Add Chapter initialization error:",
                error
            );

            hideLoader();

            showToast(
                "Unable to load chapter data.",
                true
            );

        }

    });

}


// ======================================================
// LOAD SUBJECT
// ======================================================

async function loadSubject() {

    const subjectRef = doc(
        db,
        "hybridSubjects",
        subjectId
    );

    const subjectSnap = await getDoc(subjectRef);

    if (!subjectSnap.exists()) {

        throw new Error(
            "Subject does not exist."
        );
    }

    subjectData = {
        id: subjectSnap.id,
        ...subjectSnap.data()
    };

    subjectName.textContent =
        subjectData.name || "Untitled Subject";

    subjectDescription.textContent =
        subjectData.description ||
        "Manage textbook chapters and learning content.";
}


// ======================================================
// LOAD CHAPTERS
// ======================================================

async function loadChapters() {

    const chaptersRef =
        collection(db, "hybridChapters");

    const q = query(
        chaptersRef,
        where("subjectId", "==", subjectId)
    );

    const snapshot = await getDocs(q);

    chapters = [];

    snapshot.forEach((chapterDoc) => {

        chapters.push({
            id: chapterDoc.id,
            ...chapterDoc.data()
        });

    });

    // Textbook order
    chapters.sort((a, b) => {

        const numberA =
            Number(a.chapterNumber || 0);

        const numberB =
            Number(b.chapterNumber || 0);

        return numberA - numberB;

    });

    renderChapters();
}


// ======================================================
// RENDER CHAPTERS
// ======================================================

function renderChapters() {

    chapterList.innerHTML = "";

    const count = chapters.length;

    chapterCount.textContent =
        `${count} ${count === 1 ? "Chapter" : "Chapters"}`;


    if (count === 0) {

        emptyState.classList.remove("hidden");

        return;
    }

    emptyState.classList.add("hidden");


    chapters.forEach((chapter) => {

        const card =
            createChapterCard(chapter);

        chapterList.appendChild(card);

    });
}


// ======================================================
// CREATE CHAPTER CARD
// ======================================================

function createChapterCard(chapter) {

    const card =
        document.createElement("div");

    card.className = "chapter-card";


    // Number
    const number =
        document.createElement("div");

    number.className = "chapter-number";

    number.textContent =
        chapter.chapterNumber || "-";


    // Info
    const info =
        document.createElement("div");

    info.className = "chapter-info";


    const title =
        document.createElement("h3");

    title.textContent =
        chapter.chapterName ||
        chapter.title ||
        "Untitled Chapter";


    const meta =
        document.createElement("div");

    meta.className = "chapter-meta";


    // Video
    if (chapter.videoUrl) {

        const videoPill =
            document.createElement("span");

        videoPill.className =
            "content-pill video";

        videoPill.textContent =
            "VIDEO";

        meta.appendChild(videoPill);
    }


    // PDF
    if (chapter.pdfUrl) {

        const pdfPill =
            document.createElement("span");

        pdfPill.className =
            "content-pill pdf";

        pdfPill.textContent =
            "PDF";

        meta.appendChild(pdfPill);
    }


    // No content
    if (
        !chapter.videoUrl &&
        !chapter.pdfUrl
    ) {

        const emptyPill =
            document.createElement("span");

        emptyPill.className =
            "content-pill";

        emptyPill.textContent =
            "NO CONTENT";

        meta.appendChild(emptyPill);
    }


    // Lock status
    const lockPill =
        document.createElement("span");

    lockPill.className =
        `lock-pill ${
            chapter.locked
                ? "locked"
                : "unlocked"
        }`;

    lockPill.textContent =
        chapter.locked
            ? "🔒 LOCKED"
            : "🔓 UNLOCKED";

    meta.appendChild(lockPill);


    info.appendChild(title);
    info.appendChild(meta);


    // Actions
    const actions =
        document.createElement("div");

    actions.className =
        "chapter-actions";


    // Lock button
    const lockButton =
        document.createElement("button");

    lockButton.type = "button";

    lockButton.className =
        `action-btn lock ${
            chapter.locked
                ? "locked"
                : "unlocked"
        }`;

    lockButton.textContent =
        chapter.locked
            ? "Unlock"
            : "Lock";


    lockButton.addEventListener(
        "click",
        async () => {

            await toggleChapterLock(
                chapter
            );

        }
    );


    // Edit button
    const editButton =
        document.createElement("button");

    editButton.type = "button";

    editButton.className =
        "action-btn";

    editButton.textContent =
        "Edit";


    editButton.addEventListener(
        "click",
        () => {

            openEditModal(
                chapter
            );

        }
    );


    actions.appendChild(lockButton);
    actions.appendChild(editButton);


    card.appendChild(number);
    card.appendChild(info);
    card.appendChild(actions);

    return card;
}


// ======================================================
// OPEN ADD MODAL
// ======================================================

function openAddModal() {

    editingChapterId = null;

    editingChapterData = null;

    chapterForm.reset();

    modalEyebrow.textContent =
        "NEW CHAPTER";

    modalTitle.textContent =
        "Add Chapter";

    saveBtn.textContent =
        "Save Chapter";

    currentPdf.classList.add("hidden");

    currentPdf.innerHTML = "";

    uploadProgress.classList.add(
        "hidden"
    );

    progressBar.style.width = "0%";

    progressText.textContent =
        "Uploading 0%";


    // Default next chapter number
    const nextNumber =
        getNextChapterNumber();

    chapterNumberInput.value =
        nextNumber;

    updateOrderPreview();

    setLocked(false);

    chapterModal.classList.remove(
        "hidden"
    );

    setTimeout(() => {
        chapterNameInput.focus();
    }, 100);
}


// ======================================================
// OPEN EDIT MODAL
// ======================================================

function openEditModal(chapter) {

    editingChapterId =
        chapter.id;

    editingChapterData =
        chapter;

    modalEyebrow.textContent =
        "EDIT CHAPTER";

    modalTitle.textContent =
        "Edit Chapter";

    saveBtn.textContent =
        "Update Chapter";


    chapterNameInput.value =
        chapter.chapterName ||
        chapter.title ||
        "";

    chapterNumberInput.value =
        chapter.chapterNumber || "";

    videoUrlInput.value =
        chapter.videoUrl || "";


    // Existing PDF
    if (chapter.pdfUrl) {

        currentPdf.classList.remove(
            "hidden"
        );

        currentPdf.innerHTML = `
            Current PDF:
            <strong>${escapeHtml(
                chapter.pdfName ||
                "Uploaded PDF"
            )}</strong>
        `;

    } else {

        currentPdf.classList.add(
            "hidden"
        );

        currentPdf.innerHTML = "";
    }


    pdfFileInput.value = "";

    uploadProgress.classList.add(
        "hidden"
    );

    setLocked(
        chapter.locked === true
    );

    updateOrderPreview();

    chapterModal.classList.remove(
        "hidden"
    );

    setTimeout(() => {
        chapterNameInput.focus();
    }, 100);
}


// ======================================================
// CLOSE MODAL
// ======================================================

function closeModal() {

    chapterModal.classList.add(
        "hidden"
    );

    chapterForm.reset();

    editingChapterId = null;

    editingChapterData = null;

    setLocked(false);
}


// ======================================================
// NEXT CHAPTER NUMBER
// ======================================================

function getNextChapterNumber() {

    if (chapters.length === 0) {
        return 1;
    }

    const numbers =
        chapters
            .map(c =>
                Number(c.chapterNumber || 0)
            )
            .filter(n => n > 0);

    if (numbers.length === 0) {
        return 1;
    }

    return Math.max(...numbers) + 1;
}


// ======================================================
// ORDER PREVIEW
// ======================================================

function updateOrderPreview() {

    const number =
        Number(
            chapterNumberInput.value
        );

    orderPreview.textContent =
        number > 0
            ? `Chapter ${number}`
            : "Chapter —";
}


// ======================================================
// LOCK TOGGLE
// ======================================================

function setLocked(value) {

    isLocked = value;

    if (isLocked) {

        lockToggle.className =
            "status-toggle locked";

        lockIcon.textContent =
            "🔒";

        lockText.textContent =
            "Locked";

    } else {

        lockToggle.className =
            "status-toggle unlocked";

        lockIcon.textContent =
            "🔓";

        lockText.textContent =
            "Unlocked";
    }
}


// ======================================================
// SAVE / UPDATE CHAPTER
// ======================================================

chapterForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const name =
            chapterNameInput.value.trim();

        const number =
            Number(
                chapterNumberInput.value
            );

        const videoUrl =
            videoUrlInput.value.trim();


        // Validation
        if (!name) {

            showToast(
                "Enter the chapter name.",
                true
            );

            chapterNameInput.focus();

            return;
        }

        if (
            !Number.isInteger(number) ||
            number < 1
        ) {

            showToast(
                "Enter a valid chapter number.",
                true
            );

            chapterNumberInput.focus();

            return;
        }


        // Duplicate chapter number
        const duplicate =
            chapters.find((chapter) => {

                if (
                    editingChapterId &&
                    chapter.id === editingChapterId
                ) {
                    return false;
                }

                return Number(
                    chapter.chapterNumber
                ) === number;

            });


        if (duplicate) {

            showToast(
                `Chapter ${number} already exists.`,
                true
            );

            return;
        }


        // Video URL validation
        if (videoUrl) {

            try {

                new URL(videoUrl);

            } catch {

                showToast(
                    "Enter a valid video URL.",
                    true
                );

                return;
            }
        }


        try {

            saveBtn.disabled = true;

            saveBtn.textContent =
                editingChapterId
                    ? "Updating..."
                    : "Saving...";


            // PDF
            let pdfUrl =
                editingChapterData?.pdfUrl ||
                "";

            let pdfName =
                editingChapterData?.pdfName ||
                "";


            const selectedFile =
                pdfFileInput.files[0];


            if (selectedFile) {

                if (
                    selectedFile.type !==
                    "application/pdf"
                ) {

                    throw new Error(
                        "Only PDF files are allowed."
                    );
                }


                if (
                    selectedFile.size >
                    20 * 1024 * 1024
                ) {

                    throw new Error(
                        "PDF must be smaller than 20 MB."
                    );
                }


                const result =
                    await uploadPDF(
                        selectedFile
                    );

                pdfUrl =
                    result.url;

                pdfName =
                    selectedFile.name;
            }


            const chapterData = {

                subjectId: subjectId,

                chapterName: name,

                chapterNumber: number,

                videoUrl: videoUrl,

                pdfUrl: pdfUrl,

                pdfName: pdfName,

                locked: isLocked,

                active: true,

                updatedAt:
                    serverTimestamp()

            };


            // ADD
            if (!editingChapterId) {

                chapterData.createdAt =
                    serverTimestamp();

                chapterData.createdBy =
                    currentUser.uid;


                await addDoc(
                    collection(
                        db,
                        "hybridChapters"
                    ),
                    chapterData
                );


                showToast(
                    "Chapter added successfully."
                );

            }

            // UPDATE
            else {

                await updateDoc(
                    doc(
                        db,
                        "hybridChapters",
                        editingChapterId
                    ),
                    chapterData
                );


                showToast(
                    "Chapter updated successfully."
                );
            }


            closeModal();

            await loadChapters();

        } catch (error) {

            console.error(
                "Save chapter error:",
                error
            );

            showToast(
                error.message ||
                "Unable to save chapter.",
                true
            );

        } finally {

            saveBtn.disabled = false;

            saveBtn.textContent =
                editingChapterId
                    ? "Update Chapter"
                    : "Save Chapter";
        }

    }
);


// ======================================================
// UPLOAD PDF
// ======================================================

function uploadPDF(file) {

    return new Promise(
        (resolve, reject) => {

            uploadProgress.classList.remove(
                "hidden"
            );

            progressBar.style.width =
                "0%";

            progressText.textContent =
                "Uploading 0%";


            const safeName =
                file.name
                    .replace(
                        /[^a-zA-Z0-9._-]/g,
                        "_"
                    );


            const filePath =
                `hybrid-chapters/${subjectId}/${Date.now()}_${safeName}`;


            const storageRef =
                ref(
                    storage,
                    filePath
                );


            const uploadTask =
                uploadBytesResumable(
                    storageRef,
                    file
                );


            uploadTask.on(

                "state_changed",

                (snapshot) => {

                    const percent =
                        Math.round(
                            (
                                snapshot.bytesTransferred /
                                snapshot.totalBytes
                            ) * 100
                        );

                    progressBar.style.width =
                        `${percent}%`;

                    progressText.textContent =
                        `Uploading ${percent}%`;

                },

                (error) => {

                    console.error(
                        "PDF upload error:",
                        error
                    );

                    reject(
                        new Error(
                            "PDF upload failed."
                        )
                    );

                },

                async () => {

                    try {

                        const url =
                            await getDownloadURL(
                                uploadTask.snapshot
                                    .ref
                            );

                        progressText.textContent =
                            "Upload complete";

                        resolve({
                            url,
                            path: filePath
                        });

                    } catch (error) {

                        reject(
                            new Error(
                                "Could not get PDF URL."
                            )
                        );
                    }

                }
            );

        }
    );
}


// ======================================================
// LOCK / UNLOCK EXISTING CHAPTER
// ======================================================

async function toggleChapterLock(
    chapter
) {

    const newLocked =
        chapter.locked !== true;


    try {

        await updateDoc(
            doc(
                db,
                "hybridChapters",
                chapter.id
            ),
            {
                locked: newLocked,
                updatedAt:
                    serverTimestamp()
            }
        );


        showToast(
            newLocked
                ? "Chapter locked."
                : "Chapter unlocked."
        );


        await loadChapters();

    } catch (error) {

        console.error(
            "Lock update error:",
            error
        );

        showToast(
            "Could not change chapter status.",
            true
        );
    }
}


// ======================================================
// EVENTS
// ======================================================

addChapterBtn.addEventListener(
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

lockToggle.addEventListener(
    "click",
    () => {

        setLocked(
            !isLocked
        );

    }
);

chapterNumberInput.addEventListener(
    "input",
    updateOrderPreview
);

pdfFileInput.addEventListener(
    "change",
    () => {

        const file =
            pdfFileInput.files[0];

        if (!file) {
            return;
        }

        currentPdf.classList.remove(
            "hidden"
        );

        currentPdf.innerHTML = `
            Selected PDF:
            <strong>${escapeHtml(
                file.name
            )}</strong>
        `;

    }
);


// Close when clicking backdrop
chapterModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target.classList.contains(
                "modal-backdrop"
            )
        ) {

            closeModal();
        }

    }
);


// Escape key
document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            !chapterModal.classList.contains(
                "hidden"
            )
        ) {

            closeModal();
        }

    }
);


// Back
backBtn.addEventListener(
    "click",
    () => {

        window.location.href =
            "../addsubject/";

    }
);


// ======================================================
// UI
// ======================================================

function showApp() {

    pageLoader.classList.add(
        "hidden"
    );

    app.classList.remove(
        "hidden"
    );
}

function hideLoader() {

    pageLoader.classList.add(
        "hidden"
    );
}


// ======================================================
// TOAST
// ======================================================

let toastTimer;

function showToast(
    message,
    error = false
) {

    clearTimeout(
        toastTimer
    );

    toast.textContent =
        message;

    toast.classList.toggle(
        "error",
        error
    );

    toast.classList.add(
        "show"
    );


    toastTimer =
        setTimeout(() => {

            toast.classList.remove(
                "show"
            );

        }, 3000);
}


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(value) {

    return String(value)
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

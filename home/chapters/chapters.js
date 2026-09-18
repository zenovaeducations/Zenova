import {
    auth,
    db
} from "../../firebase/firebase-config.js";


import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";



/* =========================================================
   ELEMENTS
========================================================= */

const backButton =
    document.getElementById(
        "backButton"
    );


const subjectName =
    document.getElementById(
        "subjectName"
    );


const subjectMeta =
    document.getElementById(
        "subjectMeta"
    );


const courseName =
    document.getElementById(
        "courseName"
    );


const languageBadge =
    document.getElementById(
        "languageBadge"
    );


const chapterCount =
    document.getElementById(
        "chapterCount"
    );


const loadingState =
    document.getElementById(
        "loadingState"
    );


const errorState =
    document.getElementById(
        "errorState"
    );


const errorMessage =
    document.getElementById(
        "errorMessage"
    );


const emptyState =
    document.getElementById(
        "emptyState"
    );


const chaptersList =
    document.getElementById(
        "chaptersList"
    );


const retryButton =
    document.getElementById(
        "retryButton"
    );



/* =========================================================
   URL
========================================================= */

const params =
    new URLSearchParams(
        window.location.search
    );


const courseId =
    (
        params.get("courseId") ||
        params.get("id") ||
        ""
    ).trim();


const subjectId =
    (
        params.get("subjectId") ||
        ""
    ).trim();


const urlLanguage =
    (
        params.get("language") ||
        ""
    ).trim();



/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let currentCourse = null;

let currentSubject = null;

let currentLanguage =
    urlLanguage;



/* =========================================================
   BACK BUTTON
========================================================= */

backButton.addEventListener(
    "click",
    () => {

        if (
            window.history.length > 1
        ) {

            window.history.back();

            return;

        }


        window.location.href =
            "../study/";

    }
);



/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "../login/";

            return;

        }


        currentUser = user;


        await start();

    }
);



/* =========================================================
   START
========================================================= */

async function start() {

    try {

        showLoading();


        if (!subjectId) {

            throw new Error(
                "No subject was selected."
            );

        }


        /*
         * Load course if supplied.
         */

        if (courseId) {

            await loadCourse();

        }


        /*
         * Load subject.
         */

        await loadSubject();


        /*
         * Determine language.
         */

        currentLanguage =
            getSubjectLanguage(
                currentSubject
            ) ||
            currentLanguage ||
            "";


        /*
         * Show subject header.
         */

        renderSubjectHeader();


        /*
         * Load chapters.
         */

        await loadChapters();


        hideLoading();

    }
    catch (error) {

        console.error(
            "CHAPTER PAGE ERROR:",
            error
        );


        showError(
            getReadableError(error)
        );

    }

}



/* =========================================================
   LOAD COURSE
========================================================= */

async function loadCourse() {

    const courseRef =
        doc(
            db,
            "crmCourses",
            courseId
        );


    const snapshot =
        await getDoc(
            courseRef
        );


    if (
        !snapshot.exists()
    ) {

        console.warn(
            "Course not found:",
            courseId
        );

        return;

    }


    currentCourse = {

        id:
            snapshot.id,

        ...snapshot.data()

    };

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


    if (
        !snapshot.exists()
    ) {

        throw new Error(
            "The selected subject could not be found."
        );

    }


    currentSubject = {

        id:
            snapshot.id,

        ...snapshot.data()

    };

}



/* =========================================================
   LANGUAGE
========================================================= */

function getSubjectLanguage(
    subject
) {

    if (!subject) {

        return "";

    }


    return (
        subject.language ||
        subject.medium ||
        subject.subjectLanguage ||
        subject.crmMedium ||
        ""
    ).toString().trim();

}



/* =========================================================
   RENDER HEADER
========================================================= */

function renderSubjectHeader() {

    const name =
        currentSubject.name ||
        currentSubject.subjectName ||
        currentSubject.title ||
        currentSubject.crmSubjectName ||
        "Subject";


    subjectName.textContent =
        name;


    /*
     * Course
     */

    const courseTitle =
        currentCourse?.crmCourseName ||
        currentCourse?.courseName ||
        currentSubject.courseName ||
        "Course";


    courseName.textContent =
        courseTitle;


    /*
     * Language
     */

    if (currentLanguage) {

        languageBadge.textContent =
            currentLanguage;

    }
    else {

        languageBadge.textContent =
            "All Languages";

    }


    /*
     * Meta
     */

    const parts = [];


    if (
        currentSubject.className ||
        currentSubject.crmClass
    ) {

        parts.push(
            currentSubject.className ||
            currentSubject.crmClass
        );

    }


    if (
        currentLanguage
    ) {

        parts.push(
            currentLanguage
        );

    }


    subjectMeta.textContent =
        parts.length
            ? parts.join(" • ")
            : "Course chapters";

}



/* =========================================================
   LOAD CHAPTERS
========================================================= */

async function loadChapters() {

    const chaptersRef =
        collection(
            db,
            "hybridChapters"
        );


    /*
     * IMPORTANT:
     *
     * We query ONLY subjectId.
     *
     * This avoids requiring a composite
     * Firestore index.
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
            document => ({

                id:
                    document.id,

                ...document.data()

            })
        );


    /*
     * Only active chapters.
     */

    chapters =
        chapters.filter(
            chapter =>
                chapter.active !== false
        );


    /*
     * Course filter.
     *
     * Only apply it if URL contains
     * courseId and chapter has courseId.
     */

    if (courseId) {

        chapters =
            chapters.filter(
                chapter => {

                    if (
                        !chapter.courseId
                    ) {

                        return true;

                    }


                    return (
                        String(
                            chapter.courseId
                        ) ===
                        String(
                            courseId
                        )
                    );

                }
            );

    }


    /*
     * Language filter.
     *
     * If chapter has no language,
     * don't hide it.
     */

    if (currentLanguage) {

        chapters =
            chapters.filter(
                chapter => {

                    const language =
                        getContentLanguage(
                            chapter
                        );


                    if (!language) {

                        return true;

                    }


                    return (
                        normalizeLanguage(
                            language
                        ) ===
                        normalizeLanguage(
                            currentLanguage
                        )
                    );

                }
            );

    }


    /*
     * Sort by chapter number.
     */

    chapters.sort(
        (a, b) => {

            return (
                Number(
                    a.chapterNumber ||
                    a.order ||
                    9999
                ) -

                Number(
                    b.chapterNumber ||
                    b.order ||
                    9999
                )
            );

        }
    );


    /*
     * Remove accidental duplicate
     * chapter documents.
     */

    chapters =
        deduplicateChapters(
            chapters
        );


    chapterCount.textContent =
        `${chapters.length} ${
            chapters.length === 1
                ? "Chapter"
                : "Chapters"
        }`;


    if (
        chapters.length === 0
    ) {

        showEmpty();

        return;

    }


    /*
     * Load all content for the subject
     * once, then group it by chapter.
     */

    const contentMap =
        await loadContentForSubject();


    renderChapters(
        chapters,
        contentMap
    );

}



/* =========================================================
   LOAD CONTENT
========================================================= */

async function loadContentForSubject() {

    const contentMap =
        new Map();


    try {

        const contentRef =
            collection(
                db,
                "hybridContent"
            );


        const contentQuery =
            query(
                contentRef,

                where(
                    "subjectId",
                    "==",
                    subjectId
                )
            );


        const snapshot =
            await getDocs(
                contentQuery
            );


        snapshot.forEach(
            document => {

                const content = {

                    id:
                        document.id,

                    ...document.data()

                };


                if (
                    content.active === false
                ) {

                    return;

                }


                /*
                 * Course filter.
                 */

                if (
                    courseId &&
                    content.courseId &&
                    String(
                        content.courseId
                    ) !==
                    String(
                        courseId
                    )
                ) {

                    return;

                }


                /*
                 * Language filter.
                 */

                if (
                    currentLanguage
                ) {

                    const language =
                        getContentLanguage(
                            content
                        );


                    if (
                        language &&
                        normalizeLanguage(
                            language
                        ) !==
                        normalizeLanguage(
                            currentLanguage
                        )
                    ) {

                        return;

                    }

                }


                const chapterId =
                    content.chapterId;


                if (!chapterId) {

                    return;

                }


                if (
                    !contentMap.has(
                        chapterId
                    )
                ) {

                    contentMap.set(
                        chapterId,
                        []
                    );

                }


                contentMap
                    .get(chapterId)
                    .push(content);

            }
        );


    }
    catch (error) {

        /*
         * Content count is optional.
         *
         * Even if content cannot be loaded,
         * chapters should still display.
         */

        console.warn(
            "Unable to load chapter content:",
            error
        );

    }


    return contentMap;

}



/* =========================================================
   RENDER CHAPTERS
========================================================= */

function renderChapters(
    chapters,
    contentMap
) {

    chaptersList.innerHTML = "";


    chapters.forEach(
        (chapter, index) => {

            const contents =
                contentMap.get(
                    chapter.id
                ) || [];


            const videoCount =
                contents.filter(
                    item =>
                        String(
                            item.contentType ||
                            ""
                        ).toUpperCase()
                        ===
                        "VIDEO"
                ).length;


            const noteCount =
                contents.filter(
                    item =>
                        [
                            "NOTE",
                            "PDF",
                            "NOTES"
                        ].includes(
                            String(
                                item.contentType ||
                                ""
                            ).toUpperCase()
                        )
                ).length;


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "chapter-card";


            const chapterNumber =
                chapter.chapterNumber ||
                chapter.order ||
                index + 1;


            const title =
                chapter.chapterName ||
                chapter.name ||
                chapter.title ||
                "Untitled Chapter";


            const description =
                chapter.description ||
                "Start learning this chapter.";


            card.innerHTML = `

                <div
                    class="chapter-number"
                >
                    ${escapeHTML(
                        chapterNumber
                    )}
                </div>


                <div
                    class="chapter-body"
                >

                    <div
                        class="chapter-title"
                    >
                        ${escapeHTML(
                            title
                        )}
                    </div>


                    <div
                        class="chapter-description"
                    >
                        ${escapeHTML(
                            description
                        )}
                    </div>


                    <div
                        class="chapter-stats"
                    >

                        ${
                            videoCount > 0
                                ? `
                                    <span
                                        class="chapter-stat"
                                    >
                                        ▶
                                        ${videoCount}
                                        ${
                                            videoCount === 1
                                                ? "Video"
                                                : "Videos"
                                        }
                                    </span>
                                `
                                : ""
                        }


                        ${
                            noteCount > 0
                                ? `
                                    <span
                                        class="chapter-stat"
                                    >
                                        ▣
                                        ${noteCount}
                                        ${
                                            noteCount === 1
                                                ? "Note"
                                                : "Notes"
                                        }
                                    </span>
                                `
                                : ""
                        }


                        ${
                            videoCount === 0 &&
                            noteCount === 0
                                ? `
                                    <span
                                        class="chapter-stat"
                                    >
                                        Content available
                                    </span>
                                `
                                : ""
                        }

                    </div>

                </div>


                <div
                    class="chapter-arrow"
                >
                    →
                </div>

            `;


            card.addEventListener(
                "click",
                () => {

                    openChapter(
                        chapter
                    );

                }
            );


            chaptersList.appendChild(
                card
            );

        }
    );

}



/* =========================================================
   OPEN CHAPTER
========================================================= */

function openChapter(
    chapter
) {

    const params =
        new URLSearchParams();


    if (courseId) {

        params.set(
            "courseId",
            courseId
        );

    }


    params.set(
        "subjectId",
        subjectId
    );


    params.set(
        "chapterId",
        chapter.id
    );


    if (currentLanguage) {

        params.set(
            "language",
            currentLanguage
        );

    }


    /*
     * This page will be created next:
     *
     * home/content/
     *
     * where videos and notes for the
     * selected chapter will appear.
     */

    window.location.href =
        `../content/?${params.toString()}`;

}



/* =========================================================
   DEDUPLICATE
========================================================= */

function deduplicateChapters(
    chapters
) {

    const map =
        new Map();


    chapters.forEach(
        chapter => {

            /*
             * Firestore ID is normally enough.
             */

            const id =
                chapter.id;


            if (
                !map.has(id)
            ) {

                map.set(
                    id,
                    chapter
                );

            }

        }
    );


    return Array.from(
        map.values()
    );

}



/* =========================================================
   LANGUAGE HELPERS
========================================================= */

function getContentLanguage(
    item
) {

    return (
        item.language ||
        item.medium ||
        item.contentLanguage ||
        item.subjectLanguage ||
        ""
    )
        .toString()
        .trim();

}


function normalizeLanguage(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase()
        .replace(
            /\s+/g,
            " "
        );

}



/* =========================================================
   UI STATES
========================================================= */

function showLoading() {

    loadingState.classList.remove(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

    emptyState.classList.add(
        "hidden"
    );

    chaptersList.innerHTML = "";

}


function hideLoading() {

    loadingState.classList.add(
        "hidden"
    );

}


function showEmpty() {

    loadingState.classList.add(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

    emptyState.classList.remove(
        "hidden"
    );

    chaptersList.innerHTML = "";

}


function showError(
    message
) {

    loadingState.classList.add(
        "hidden"
    );

    emptyState.classList.add(
        "hidden"
    );

    chaptersList.innerHTML = "";

    errorMessage.textContent =
        message ||
        "Something went wrong.";

    errorState.classList.remove(
        "hidden"
    );

}



/* =========================================================
   RETRY
========================================================= */

retryButton.addEventListener(
    "click",
    () => {

        start();

    }
);



/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
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



/* =========================================================
   FIREBASE ERROR
========================================================= */

function getReadableError(
    error
) {

    if (!error) {

        return "Unknown error.";

    }


    if (
        error.code ===
        "permission-denied"
    ) {

        return (
            "Firebase denied access to the chapters."
        );

    }


    if (
        error.code ===
        "unavailable"
    ) {

        return (
            "Firebase is temporarily unavailable."
        );

    }


    return (
        error.message ||
        "Unable to load chapters."
    );

}

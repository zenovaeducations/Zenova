import { auth, db } from "../../firebase/firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* --------------------------------
   URL PARAMETERS
-------------------------------- */

const params = new URLSearchParams(window.location.search);

const courseId = params.get("courseId");
const subjectId = params.get("subjectId");
const chapterId = params.get("chapterId");


/* --------------------------------
   ELEMENTS
-------------------------------- */

const loaderScreen = document.getElementById("loaderScreen");
const chapterPage = document.getElementById("chapterPage");
const errorScreen = document.getElementById("errorScreen");

const errorMessage = document.getElementById("errorMessage");

const chapterTitle = document.getElementById("chapterTitle");
const subjectTitle = document.getElementById("subjectTitle");

const videoList = document.getElementById("videoList");
const pdfList = document.getElementById("pdfList");

const videoCount = document.getElementById("videoCount");
const pdfCount = document.getElementById("pdfCount");

const noVideos = document.getElementById("noVideos");
const noPdfs = document.getElementById("noPdfs");

const profileInitial = document.getElementById("profileInitial");

const backBtn = document.getElementById("backBtn");
const errorBackBtn = document.getElementById("errorBackBtn");


/* --------------------------------
   STATE
-------------------------------- */

let currentUser = null;
let currentStudent = null;
let currentCourse = null;
let currentSubject = null;
let currentChapter = null;


/* --------------------------------
   BACK BUTTON
-------------------------------- */

function goBackToSubject() {

    if (!courseId || !subjectId) {
        window.location.href = "../revision/";
        return;
    }

    window.location.href =
        `../subjectdetails/?courseId=${encodeURIComponent(courseId)}&subjectId=${encodeURIComponent(subjectId)}`;
}

backBtn.addEventListener("click", goBackToSubject);
errorBackBtn.addEventListener("click", goBackToSubject);


/* --------------------------------
   HELPERS
-------------------------------- */

function showError(message) {

    loaderScreen.classList.add("hidden");
    chapterPage.classList.add("hidden");

    errorMessage.textContent = message;

    errorScreen.classList.remove("hidden");
}


function getName(data) {

    return (
        data?.name ||
        data?.studentName ||
        data?.fullName ||
        data?.displayName ||
        "Student"
    );
}


function getContentType(data) {

    const type = String(
        data?.contentType ||
        data?.type ||
        ""
    ).toLowerCase();

    if (
        type === "pdf" ||
        type === "document" ||
        type === "notes"
    ) {
        return "pdf";
    }

    return "video";
}


function getContentTitle(data) {

    return (
        data?.title ||
        data?.contentName ||
        data?.name ||
        "Untitled Content"
    );
}


function getOrder(data) {

    const value =
        data?.order ??
        data?.contentOrder ??
        data?.position ??
        999999;

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 999999;
}


/* --------------------------------
   PURCHASE CHECK
-------------------------------- */

function isCoursePurchased(student, course) {

    if (!student || !course) {
        return false;
    }

    const id = course.id;

    /*
       Supports common ZEN2 purchase structures
       without changing the Firestore architecture.
    */

    const purchasedCourses =
        student.purchasedCourses ||
        student.purchasedBatches ||
        student.enrolledCourses ||
        student.enrolledBatches ||
        [];

    if (Array.isArray(purchasedCourses)) {

        return purchasedCourses.some(item => {

            if (typeof item === "string") {
                return item === id;
            }

            if (typeof item === "object" && item !== null) {

                return (
                    item.courseId === id ||
                    item.batchId === id ||
                    item.id === id
                );
            }

            return false;
        });
    }


    if (typeof purchasedCourses === "object") {

        return (
            purchasedCourses[id] === true ||
            purchasedCourses[id]?.status === "ACTIVE" ||
            purchasedCourses[id]?.purchased === true
        );
    }


    if (student.purchasedCourseIds?.includes?.(id)) {
        return true;
    }

    if (student.enrolledCourseIds?.includes?.(id)) {
        return true;
    }

    return false;
}


/* --------------------------------
   IS FREE
-------------------------------- */

function isFreeContent(data) {

    if (data?.isFree === true) {
        return true;
    }

    if (data?.requiresPurchase === false) {
        return true;
    }

    if (
        String(data?.accessType || "").toUpperCase() === "FREE"
    ) {
        return true;
    }

    return false;
}


/* --------------------------------
   OPEN CONTENT
-------------------------------- */

function openContent(content) {

    const contentId = content.id;

    /*
       Open the content through a dedicated viewer later.
       For now, video/PDF URL can be opened directly.
    */

    const url =
        content.videoUrl ||
        content.pdfUrl ||
        content.fileUrl ||
        content.url ||
        content.downloadURL ||
        content.thumbnailUrl;

    if (!url) {

        alert("This content is not available yet.");
        return;
    }

    window.open(url, "_blank");
}


/* --------------------------------
   BUY NOW
-------------------------------- */

function buyNow() {

    /*
       Purchase flow will be connected here.
       We keep the chapter page independent from
       the old CRM enrollment architecture.
    */

    window.location.href =
        `../buy/?courseId=${encodeURIComponent(courseId)}`;
}


/* --------------------------------
   CREATE CONTENT CARD
-------------------------------- */

function createContentCard(content, purchased) {

    const type = getContentType(content);
    const title = getContentTitle(content);

    const free = isFreeContent(content);

    const locked = !free && !purchased;

    const card = document.createElement("div");

    card.className =
        `content-card ${locked ? "locked" : ""}`;


    /* ICON */

    const icon = document.createElement("div");

    icon.className =
        `content-icon ${type === "pdf" ? "pdf-icon" : "video-icon"}`;

    icon.innerHTML =
        type === "pdf"
            ? "PDF"
            : "▶";


    /* INFO */

    const info = document.createElement("div");

    info.className = "content-info";


    const titleElement = document.createElement("h3");

    titleElement.textContent = title;


    const meta = document.createElement("div");

    meta.className = "content-meta";


    const metaText = document.createElement("span");

    metaText.className = "meta-text";

    metaText.textContent =
        type === "pdf"
            ? "Study Material"
            : "Video Lesson";


    const badge = document.createElement("span");

    if (free) {

        badge.className = "free-badge";
        badge.textContent = "FREE";

    } else {

        badge.className = "paid-badge";

        badge.textContent =
            locked
                ? "LOCKED"
                : "PAID";
    }


    meta.appendChild(metaText);
    meta.appendChild(badge);

    info.appendChild(titleElement);
    info.appendChild(meta);


    /* ACTION */

    const action = document.createElement("div");

    action.className = "content-action";


    const button = document.createElement("button");


    if (locked) {

        button.className = "buy-btn";
        button.textContent = "BUY NOW";

        button.addEventListener("click", buyNow);

    } else {

        button.className = "open-btn";

        button.textContent =
            type === "pdf"
                ? "OPEN PDF"
                : "WATCH";

        button.addEventListener(
            "click",
            () => openContent(content)
        );
    }


    action.appendChild(button);


    card.appendChild(icon);
    card.appendChild(info);
    card.appendChild(action);


    return card;
}


/* --------------------------------
   LOAD CHAPTER
-------------------------------- */

async function loadChapter() {

    try {

        if (!courseId || !subjectId || !chapterId) {

            showError(
                "Chapter information is missing."
            );

            return;
        }


        /* STUDENT */

        const studentRef =
            doc(
                db,
                "zen2Students",
                currentUser.uid
            );

        const studentSnap =
            await getDoc(studentRef);


        if (!studentSnap.exists()) {

            showError(
                "Student profile was not found."
            );

            return;
        }


        currentStudent =
            studentSnap.data();


        /* PROFILE */

        const studentName =
            getName(currentStudent);

        profileInitial.textContent =
            studentName
                .charAt(0)
                .toUpperCase();


        /* COURSE */

        const courseRef =
            doc(
                db,
                "zen2Courses",
                courseId
            );

        const courseSnap =
            await getDoc(courseRef);


        if (!courseSnap.exists()) {

            showError(
                "Course was not found."
            );

            return;
        }


        currentCourse = {
            id: courseSnap.id,
            ...courseSnap.data()
        };


        /* SUBJECT */

        const subjectRef =
            doc(
                db,
                "zen2Subjects",
                subjectId
            );

        const subjectSnap =
            await getDoc(subjectRef);


        if (!subjectSnap.exists()) {

            showError(
                "Subject was not found."
            );

            return;
        }


        currentSubject = {
            id: subjectSnap.id,
            ...subjectSnap.data()
        };


        /* VERIFY SUBJECT */

        if (
            currentSubject.courseId &&
            currentSubject.courseId !== courseId
        ) {

            showError(
                "This subject does not belong to this course."
            );

            return;
        }


        /* CHAPTER */

        const chapterRef =
            doc(
                db,
                "zen2Chapters",
                chapterId
            );

        const chapterSnap =
            await getDoc(chapterRef);


        if (!chapterSnap.exists()) {

            showError(
                "Chapter was not found."
            );

            return;
        }


        currentChapter = {
            id: chapterSnap.id,
            ...chapterSnap.data()
        };


        /* VERIFY CHAPTER */

        if (
            currentChapter.subjectId &&
            currentChapter.subjectId !== subjectId
        ) {

            showError(
                "This chapter does not belong to this subject."
            );

            return;
        }


        /* DISPLAY */

        chapterTitle.textContent =
            currentChapter.chapterName ||
            currentChapter.name ||
            currentChapter.title ||
            "Chapter";


        subjectTitle.textContent =
            currentSubject.subjectName ||
            currentSubject.name ||
            currentSubject.title ||
            "Subject";


        /* PURCHASE */

        const purchased =
            isCoursePurchased(
                currentStudent,
                currentCourse
            );


        /* CONTENT */

        const contentQuery =
            query(
                collection(db, "zen2Content"),
                where(
                    "chapterId",
                    "==",
                    chapterId
                )
            );


        const contentSnapshot =
            await getDocs(contentQuery);


        const contents = [];


        contentSnapshot.forEach(docSnap => {

            contents.push({
                id: docSnap.id,
                ...docSnap.data()
            });

        });


        /* SORT */

        contents.sort(
            (a, b) =>
                getOrder(a) -
                getOrder(b)
        );


        /* SPLIT */

        const videos =
            contents.filter(
                item =>
                    getContentType(item) === "video"
            );

        const pdfs =
            contents.filter(
                item =>
                    getContentType(item) === "pdf"
            );


        /* COUNTS */

        videoCount.textContent =
            videos.length;

        pdfCount.textContent =
            pdfs.length;


        /* VIDEOS */

        videoList.innerHTML = "";

        if (videos.length === 0) {

            noVideos.classList.remove("hidden");

        } else {

            noVideos.classList.add("hidden");

            videos.forEach(video => {

                videoList.appendChild(
                    createContentCard(
                        video,
                        purchased
                    )
                );

            });
        }


        /* PDFS */

        pdfList.innerHTML = "";

        if (pdfs.length === 0) {

            noPdfs.classList.remove("hidden");

        } else {

            noPdfs.classList.add("hidden");

            pdfs.forEach(pdf => {

                pdfList.appendChild(
                    createContentCard(
                        pdf,
                        purchased
                    )
                );

            });
        }


        /* SHOW */

        loaderScreen.classList.add("hidden");
        errorScreen.classList.add("hidden");
        chapterPage.classList.remove("hidden");

    } catch (error) {

        console.error(
            "Chapter details error:",
            error
        );

        showError(
            "Unable to load this chapter. Please try again."
        );
    }
}


/* --------------------------------
   AUTH
-------------------------------- */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.replace(
                "../../account/login/"
            );

            return;
        }

        currentUser = user;

        await loadChapter();
    }
);

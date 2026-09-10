import { auth, db } from "../../firebase/firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   DOM
========================================================= */

const loadingScreen = document.getElementById("loadingScreen");

const backButton = document.getElementById("backButton");

const notificationButton =
    document.getElementById("notificationButton");

const courseImage =
    document.getElementById("courseImage");

const courseBadge =
    document.getElementById("courseBadge");

const courseClass =
    document.getElementById("courseClass");

const courseTitle =
    document.getElementById("courseTitle");

const courseCode =
    document.getElementById("courseCode");

const courseMeta =
    document.getElementById("courseMeta");

const coursePrice =
    document.getElementById("coursePrice");

const originalPrice =
    document.getElementById("originalPrice");

const mainActionButton =
    document.getElementById("mainActionButton");

const courseDescription =
    document.getElementById("courseDescription");

const subjectsValue =
    document.getElementById("subjectsValue");

const durationValue =
    document.getElementById("durationValue");

const classesValue =
    document.getElementById("classesValue");

const infoClass =
    document.getElementById("infoClass");

const infoBoard =
    document.getElementById("infoBoard");

const infoMedium =
    document.getElementById("infoMedium");

const infoCode =
    document.getElementById("infoCode");



/* =========================================================
   STATE
========================================================= */

let currentUser = null;
let courseId = null;
let course = null;
let enrollment = null;

let unsubscribeCourse = null;
let unsubscribeEnrollment = null;


/* =========================================================
   GET COURSE ID
========================================================= */

const params =
    new URLSearchParams(window.location.search);

courseId =
    params.get("id");


console.log(
    "Batch Details Course ID:",
    courseId
);


/* =========================================================
   CHECK COURSE ID
========================================================= */

if (!courseId) {

    showError(
        "Course ID is missing."
    );

} else {

    startAuthentication();

}


/* =========================================================
   AUTHENTICATION
========================================================= */

function startAuthentication() {

    onAuthStateChanged(
        auth,
        async (user) => {

            if (!user) {

                window.location.href =
                    "../../account/login/";

                return;

            }

            currentUser = user;

            console.log(
                "Logged in:",
                currentUser.uid
            );


            await loadCourse();

            startEnrollmentListener();

        }
    );

}


/* =========================================================
   LOAD COURSE
========================================================= */

async function loadCourse() {

    try {

        const courseRef =
            doc(
                db,
                "crmCourses",
                courseId
            );


        /*
           First get the course.
        */

        const courseSnapshot =
            await getDoc(courseRef);


        if (!courseSnapshot.exists()) {

            showError(
                "This course could not be found."
            );

            return;

        }


        course = {
            id: courseSnapshot.id,
            ...courseSnapshot.data()
        };


        console.log(
            "Course loaded:",
            course
        );


        renderCourse();

        hideLoading();


        /*
           Realtime listener.

           If Admin changes the course in CRM,
           Batch Details updates automatically.
        */

        unsubscribeCourse =
            onSnapshot(
                courseRef,
                (snapshot) => {

                    if (!snapshot.exists()) {

                        showError(
                            "This course is no longer available."
                        );

                        return;

                    }


                    course = {
                        id: snapshot.id,
                        ...snapshot.data()
                    };


                    renderCourse();

                },
                (error) => {

                    console.error(
                        "Realtime course error:",
                        error
                    );

                }
            );


    } catch (error) {

        console.error(
            "Load course error:",
            error
        );

        showError(
            "Unable to load this course."
        );

    }

}


/* =========================================================
   ENROLLMENT
========================================================= */

async function startEnrollmentListener() {

    if (!currentUser || !courseId) {
        return;
    }


    /*
       Primary planned structure:

       studentEnrollments/{uid}_{courseId}
    */

    const enrollmentRef =
        doc(
            db,
            "studentEnrollments",
            `${currentUser.uid}_${courseId}`
        );


    try {

        const enrollmentSnapshot =
            await getDoc(
                enrollmentRef
            );


        if (
            enrollmentSnapshot.exists()
        ) {

            enrollment = {
                id: enrollmentSnapshot.id,
                ...enrollmentSnapshot.data()
            };

        } else {

            enrollment = null;

        }


        renderPurchaseState();


        unsubscribeEnrollment =
            onSnapshot(
                enrollmentRef,
                (snapshot) => {

                    if (
                        snapshot.exists()
                    ) {

                        enrollment = {
                            id: snapshot.id,
                            ...snapshot.data()
                        };

                    } else {

                        enrollment = null;

                    }


                    renderPurchaseState();

                },
                (error) => {

                    console.warn(
                        "Enrollment realtime error:",
                        error
                    );

                }
            );


    } catch (error) {

        console.warn(
            "Enrollment check failed:",
            error
        );

        enrollment = null;

        renderPurchaseState();

    }

}


/* =========================================================
   RENDER COURSE
========================================================= */

function renderCourse() {

    if (!course) {
        return;
    }


    const title =
        course.crmCourseName ||
        course.courseName ||
        "Untitled Course";


    const image =
        course.crmImageUrl ||
        course.imageUrl ||
        course.thumbnailUrl ||
        getFallbackImage();


    const className =
        displayClass(
            course.crmClass ||
            course.className ||
            course.class
        );


    const board =
        course.crmBoard ||
        course.board ||
        "—";


    const medium =
        getCourseMedium();


    const code =
        course.crmCourseCode ||
        course.courseCode ||
        "";


    /*
       Image
    */

    courseImage.src = image;

    courseImage.alt = title;

    courseImage.onerror = () => {

        courseImage.onerror = null;

        courseImage.src =
            getFallbackImage();

    };


    /*
       Basic information
    */

    courseClass.textContent =
        className;


    courseTitle.textContent =
        title;


    courseCode.textContent =
        code
            ? `Course Code: ${code}`
            : "";


    courseMeta.textContent =
        [
            className,
            board,
            medium
        ]
        .filter(Boolean)
        .join(" • ");


    /*
       Description
    */

    courseDescription.textContent =
        course.crmDescription ||
        course.description ||
        "Course details will be updated by Zenova Educations.";


    /*
       Information
    */

    infoClass.textContent =
        className;

    infoBoard.textContent =
        board;

    infoMedium.textContent =
        medium || "—";

    infoCode.textContent =
        code || "—";


    /*
       Price
    */

    renderPrice();


    /*
       Highlights
    */

    renderHighlights();


    /*
       Language requirements
    */

    renderLanguages();

}


/* =========================================================
   MEDIUM
========================================================= */

function getCourseMedium() {

    /*
       New CRM structure
    */

    if (
        Array.isArray(course.crmMediums) &&
        course.crmMediums.length > 0
    ) {

        return course.crmMediums.join(", ");

    }


    /*
       Old CRM structure
    */

    if (course.crmMedium) {

        return course.crmMedium;

    }


    /*
       Other compatibility fields
    */

    if (course.medium) {

        return course.medium;

    }


    return "All Mediums";

}


/* =========================================================
   CLASS
========================================================= */

function normalizeClass(value) {

    if (!value) {
        return "";
    }


    const v =
        String(value)
            .trim()
            .toUpperCase()
            .replace(/\s+/g, " ");


    if (
        [
            "10",
            "10TH",
            "SSLC",
            "10TH STANDARD"
        ].includes(v)
    ) {

        return "10TH";

    }


    if (
        [
            "9",
            "9TH",
            "9TH STANDARD"
        ].includes(v)
    ) {

        return "9TH";

    }


    if (
        [
            "8",
            "8TH",
            "8TH STANDARD"
        ].includes(v)
    ) {

        return "8TH";

    }


    if (
        [
            "7",
            "7TH",
            "7TH STANDARD"
        ].includes(v)
    ) {

        return "7TH";

    }


    if (
        [
            "6",
            "6TH",
            "6TH STANDARD"
        ].includes(v)
    ) {

        return "6TH";

    }


    if (
        [
            "1ST PUC",
            "1 PUC",
            "PUC 1",
            "PUC-1"
        ].includes(v)
    ) {

        return "1ST_PUC";

    }


    if (
        [
            "2ND PUC",
            "2 PUC",
            "PUC 2",
            "PUC-2"
        ].includes(v)
    ) {

        return "2ND_PUC";

    }


    return v;

}


function displayClass(value) {

    const normalized =
        normalizeClass(value);


    const names = {

        "10TH": "10th",

        "9TH": "9th",

        "8TH": "8th",

        "7TH": "7th",

        "6TH": "6th",

        "1ST_PUC": "1st PUC",

        "2ND_PUC": "2nd PUC"

    };


    return (
        names[normalized] ||
        value ||
        "Course"
    );

}


/* =========================================================
   PRICE
========================================================= */

function getFinalPrice() {

    const crmFinalPrice =
        Number(
            course.crmFinalPrice
        );


    if (
        Number.isFinite(
            crmFinalPrice
        )
    ) {

        return Math.max(
            0,
            crmFinalPrice
        );

    }


    const price =
        Number(
            course.crmPrice || 0
        );


    const discount =
        Number(
            course.crmDiscount || 0
        );


    return Math.max(
        0,
        price - discount
    );

}


function renderPrice() {

    const price =
        Number(
            course.crmPrice || 0
        );


    const finalPrice =
        getFinalPrice();


    if (finalPrice <= 0) {

        coursePrice.textContent =
            "FREE";

        originalPrice.textContent =
            "";

        return;

    }


    coursePrice.textContent =
        `₹${formatPrice(finalPrice)}`;


    if (
        price > finalPrice
    ) {

        originalPrice.textContent =
            `₹${formatPrice(price)}`;

    } else {

        originalPrice.textContent =
            "";

    }

}


/* =========================================================
   HIGHLIGHTS
========================================================= */

function renderHighlights() {

    const totalSubjects =
        course.subjectCount ??
        course.totalSubjects ??
        course.subjectsCount;


    const totalClasses =
        course.totalClasses ??
        course.classes ??
        course.totalLectures;


    const duration =
        course.durationMonths ??
        course.duration;


    subjectsValue.textContent =
        totalSubjects
            ? String(totalSubjects)
            : "Multiple";


    if (duration) {

        durationValue.textContent =
            String(duration)
                .toLowerCase()
                .includes("month")
                    ? duration
                    : `${duration} months`;

    } else {

        durationValue.textContent =
            "Flexible";

    }


    classesValue.textContent =
        totalClasses
            ? String(totalClasses)
            : "Recorded + Live";

}


/* =========================================================
   ENROLLMENT STATE
========================================================= */

function renderPurchaseState() {

    if (
        isActiveEnrollment(
            enrollment
        )
    ) {

        courseBadge.classList.remove(
            "hidden"
        );

        mainActionButton.classList.add(
            "enrolled"
        );

        mainActionButton.disabled =
            false;

        mainActionButton.textContent =
            "CONTINUE LEARNING →";

        return;

    }


    courseBadge.classList.add(
        "hidden"
    );

    mainActionButton.classList.remove(
        "enrolled"
    );

    mainActionButton.disabled =
        false;


    if (
        getFinalPrice() <= 0
    ) {

        mainActionButton.textContent =
            "START LEARNING";

    } else {

        mainActionButton.textContent =
            "BUY NOW";

    }

}


/* =========================================================
   ACTIVE ENROLLMENT
========================================================= */

function isActiveEnrollment(record) {

    if (!record) {
        return false;
    }


    const status =
        String(
            record.status || ""
        ).trim().toUpperCase();


    const paymentStatus =
        String(
            record.paymentStatus || ""
        ).trim().toUpperCase();


    if (
        [
            "CANCELLED",
            "REJECTED",
            "INACTIVE",
            "SUSPENDED"
        ].includes(status)
    ) {

        return false;

    }


    if (
        status === "ACTIVE"
    ) {

        return true;

    }


    if (
        !status &&
        [
            "PAID",
            "COMPLETED",
            "SUCCESS"
        ].includes(paymentStatus)
    ) {

        return true;

    }


    return false;

}


/* =========================================================
   MAIN ACTION
========================================================= */

mainActionButton.addEventListener(
    "click",
    () => {

        if (!courseId) {
            return;
        }


        /*
           Purchased
        */

        if (
            isActiveEnrollment(
                enrollment
            )
        ) {

            window.location.href =
                `../study/?courseId=${encodeURIComponent(courseId)}`;

            return;

        }


        /*
           Not purchased
        */

        window.location.href =
            `../checkout/?courseId=${encodeURIComponent(courseId)}`;

    }
);


/* =========================================================
   BACK BUTTON
========================================================= */

backButton.addEventListener(
    "click",
    () => {

        /*
           ALWAYS return to Courses.
        */

        window.location.href =
            "../batches/";

    }
);


/* =========================================================
   NOTIFICATIONS
========================================================= */

notificationButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "../notifications/";

    }
);


/* =========================================================
   FALLBACK IMAGE
========================================================= */

function getFallbackImage() {

    const svg = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="800"
            height="450"
            viewBox="0 0 800 450"
        >

            <rect
                width="800"
                height="450"
                fill="#f3f3f3"
            />

            <text
                x="400"
                y="245"
                text-anchor="middle"
                font-family="Arial"
                font-size="70"
                font-weight="700"
                fill="#6d28d9"
            >
                Z
            </text>

        </svg>
    `;


    return (
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(svg)
    );

}


/* =========================================================
   FORMAT PRICE
========================================================= */

function formatPrice(value) {

    return Number(value)
        .toLocaleString(
            "en-IN",
            {
                maximumFractionDigits: 0
            }
        );

}


/* =========================================================
   ERROR
========================================================= */

function showError(message) {

    console.error(
        "Batch Details:",
        message
    );


    if (courseTitle) {
        courseTitle.textContent =
            message;
    }


    if (courseDescription) {
        courseDescription.textContent =
            "Please go back to Courses and select another batch.";
    }


    if (mainActionButton) {

        mainActionButton.disabled =
            true;

    }


    hideLoading();

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   HIDE LOADING
========================================================= */

function hideLoading() {

    if (!loadingScreen) {
        return;
    }


    setTimeout(
        () => {

            loadingScreen.classList.add(
                "hidden"
            );

        },
        200
    );

}


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (unsubscribeCourse) {
            unsubscribeCourse();
        }

        if (unsubscribeEnrollment) {
            unsubscribeEnrollment();
        }

    }
);

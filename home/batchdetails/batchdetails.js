import {
    auth,
    db
} from "../../firebase/firebase-config.js";

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

const loadingScreen =
    document.getElementById("loadingScreen");

const backButton =
    document.getElementById("backButton");

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

const languageSection =
    document.getElementById("languageSection");

const languageOptions =
    document.getElementById("languageOptions");


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
   COURSE ID
========================================================= */

const params =
    new URLSearchParams(
        window.location.search
    );

courseId =
    params.get("id");


/* =========================================================
   START
========================================================= */

if (!courseId) {

    showError(
        "Course not found."
    );

} else {

    onAuthStateChanged(
        auth,
        async (user) => {

            if (!user) {

                window.location.href =
                    "../../account/login/";

                return;
            }

            currentUser = user;

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

                    hideLoading();

                },
                (error) => {

                    console.error(
                        "Course error:",
                        error
                    );

                    showError(
                        "Unable to load this course."
                    );

                }
            );

    } catch (error) {

        console.error(error);

        showError(
            "Unable to load course."
        );

    }

}


/* =========================================================
   ENROLLMENT LISTENER
========================================================= */

function startEnrollmentListener() {

    const enrollmentRef =
        doc(
            db,
            "studentEnrollments",
            `${currentUser.uid}_${courseId}`
        );


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

                /*
                   If your payment system uses
                   automatically generated enrollment IDs
                   instead of uid_courseId, this listener
                   should later be changed to a query.
                */

                console.warn(
                    "Enrollment listener:",
                    error
                );

            }
        );

}


/* =========================================================
   RENDER COURSE
========================================================= */

function renderCourse() {

    const title =
        course.crmCourseName ||
        "Untitled Course";

    const image =
        course.crmImageUrl ||
        course.imageUrl ||
        course.thumbnailUrl ||
        getFallbackImage();

    const className =
        displayClass(
            getCourseClass()
        );

    const medium =
        getCourseMedium();

    const board =
        course.crmBoard ||
        "—";

    const code =
        course.crmCourseCode ||
        course.courseCode ||
        "";

    courseImage.src = image;

    courseImage.onerror = () => {

        courseImage.src =
            getFallbackImage();

    };


    courseImage.alt = title;


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


    courseDescription.textContent =
        course.crmDescription ||
        "Course details will be updated by Zenova Educations.";


    infoClass.textContent =
        className;

    infoBoard.textContent =
        board;

    infoMedium.textContent =
        medium || "—";

    infoCode.textContent =
        code || "—";


    renderPrice();

    renderHighlights();

    renderLanguages();

}


/* =========================================================
   PRICE
========================================================= */

function renderPrice() {

    const price =
        Number(
            course.crmPrice || 0
        );

    const discount =
        Number(
            course.crmDiscount || 0
        );

    let finalPrice =
        Number(
            course.crmFinalPrice
        );


    if (
        !Number.isFinite(finalPrice)
    ) {

        finalPrice =
            Math.max(
                0,
                price - discount
            );

    }


    if (
        finalPrice <= 0
    ) {

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

    const totalClasses =
        course.totalClasses ??
        course.classes ??
        course.totalLectures ??
        0;

    const duration =
        course.durationMonths ??
        course.duration ??
        "";


    /*
       If CRM later adds a subjectCount,
       this will automatically use it.
    */

    const subjectCount =
        course.subjectCount ??
        course.totalSubjects ??
        course.subjectsCount ??
        "";


    subjectsValue.textContent =
        subjectCount
            ? subjectCount
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
            ? totalClasses
            : "Live + Recorded";

}


/* =========================================================
   LANGUAGE CONFIG
========================================================= */

function renderLanguages() {

    const config =
        course.languageConfig;


    if (!config) {

        languageSection.classList.add(
            "hidden"
        );

        return;

    }


    const slots = [
        {
            key: "firstLanguage",
            label: "First Language",
            short: "FIRST"
        },
        {
            key: "secondLanguage",
            label: "Second Language",
            short: "SECOND"
        },
        {
            key: "thirdLanguage",
            label: "Third Language",
            short: "THIRD"
        }
    ];


    const enabledSlots =
        slots.filter(
            slot =>
                config[slot.key]?.enabled === true
        );


    if (!enabledSlots.length) {

        languageSection.classList.add(
            "hidden"
        );

        return;

    }


    languageSection.classList.remove(
        "hidden"
    );


    languageOptions.innerHTML =
        enabledSlots
            .map(slot => {

                const settings =
                    config[slot.key];

                const options =
                    Array.isArray(
                        settings.options
                    )
                        ? settings.options
                        : [];


                const required =
                    settings.required === true;


                return `
                    <div class="language-option">

                        <div>

                            <div class="language-option-title">
                                ${escapeHtml(slot.label)}
                                ${required ? "*" : ""}
                            </div>

                            <div class="language-option-subtitle">
                                Choose your language
                            </div>

                        </div>

                        <select
                            data-language-slot="${escapeHtml(slot.key)}"
                            ${required ? "required" : ""}
                        >

                            <option value="">
                                Select
                            </option>

                            ${options
                                .map(
                                    option =>
                                        `<option value="${escapeHtml(option)}">
                                            ${escapeHtml(option)}
                                        </option>`
                                )
                                .join("")
                            }

                        </select>

                    </div>
                `;

            })
            .join("");

}


/* =========================================================
   PURCHASE STATE
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

    const price =
        getFinalPrice();


    if (price <= 0) {

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

function isActiveEnrollment(
    record
) {

    if (!record) {
        return false;
    }


    const status =
        String(
            record.status || ""
        ).toUpperCase();


    const paymentStatus =
        String(
            record.paymentStatus || ""
        ).toUpperCase();


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

        if (!course) {
            return;
        }


        /*
           Already enrolled
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
           Free course
        */

        if (
            getFinalPrice() <= 0
        ) {

            startFreeCourse();

            return;

        }


        /*
           Paid course

           Connect this to your actual
           payment/checkout page.
        */

        window.location.href =
            `../checkout/?courseId=${encodeURIComponent(courseId)}`;

    }
);


/* =========================================================
   FREE COURSE
========================================================= */

async function startFreeCourse() {

    /*
       We should eventually create the enrollment
       through a trusted backend/Cloud Function.

       Do NOT trust client-side payment/access
       writes in production.
    */

    console.log(
        "Free course selected:",
        courseId
    );


    window.location.href =
        `../checkout/?courseId=${encodeURIComponent(courseId)}`;

}


/* =========================================================
   CLASS
========================================================= */

function getCourseClass() {

    return (
        course.crmClass ||
        course.className ||
        course.class ||
        "Course"
    );

}


function normalizeClass(value) {

    if (!value) {
        return "";
    }

    const v =
        String(value)
            .trim()
            .toUpperCase();


    if (
        ["10", "10TH", "SSLC"].includes(v)
    ) {
        return "10TH";
    }

    if (
        ["9", "9TH"].includes(v)
    ) {
        return "9TH";
    }

    if (
        ["8", "8TH"].includes(v)
    ) {
        return "8TH";
    }

    if (
        ["7", "7TH"].includes(v)
    ) {
        return "7TH";
    }

    if (
        ["1ST PUC", "1 PUC", "PUC 1"].includes(v)
    ) {
        return "1ST_PUC";
    }

    if (
        ["2ND PUC", "2 PUC", "PUC 2"].includes(v)
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
   MEDIUM
========================================================= */

function getCourseMedium() {

    if (
        Array.isArray(
            course.crmMediums
        ) &&
        course.crmMediums.length
    ) {

        return course.crmMediums.join(
            ", "
        );

    }


    return (
        course.crmMedium ||
        "All Mediums"
    );

}


/* =========================================================
   FINAL PRICE
========================================================= */

function getFinalPrice() {

    const finalPrice =
        Number(
            course.crmFinalPrice
        );

    if (
        Number.isFinite(finalPrice)
    ) {

        return Math.max(
            0,
            finalPrice
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
                y="235"
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
   PRICE FORMAT
========================================================= */

function formatPrice(value) {

    return Number(value).toLocaleString(
        "en-IN",
        {
            maximumFractionDigits: 0
        }
    );

}


/* =========================================================
   BACK
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
   ERROR
========================================================= */

function showError(message) {

    courseTitle.textContent =
        message;

    courseDescription.textContent =
        "Please go back and select another course.";

    mainActionButton.disabled = true;

    hideLoading();

}


/* =========================================================
   ESCAPE
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   LOADING
========================================================= */

function hideLoading() {

    setTimeout(() => {

        loadingScreen.classList.add(
            "hidden"
        );

    }, 250);

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

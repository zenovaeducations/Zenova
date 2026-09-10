import {
    auth,
    db
} from "../../firebase/firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================
   ELEMENTS
========================= */

const loadingScreen =
    document.getElementById("loadingScreen");

const app =
    document.getElementById("app");

const errorSection =
    document.getElementById("errorSection");

const errorMessage =
    document.getElementById("errorMessage");

const errorBackButton =
    document.getElementById("errorBackButton");

const backButton =
    document.getElementById("backButton");

const courseImage =
    document.getElementById("courseImage");

const courseImageFallback =
    document.getElementById("courseImageFallback");

const courseName =
    document.getElementById("courseName");

const courseMeta =
    document.getElementById("courseMeta");

const courseCode =
    document.getElementById("courseCode");

const languageSection =
    document.getElementById("languageSection");

const languageOptions =
    document.getElementById("languageOptions");

const summaryCourseName =
    document.getElementById("summaryCourseName");

const summaryClass =
    document.getElementById("summaryClass");

const summaryLanguageRow =
    document.getElementById("summaryLanguageRow");

const summaryLanguage =
    document.getElementById("summaryLanguage");

const originalPrice =
    document.getElementById("originalPrice");

const discountRow =
    document.getElementById("discountRow");

const discountAmount =
    document.getElementById("discountAmount");

const finalPrice =
    document.getElementById("finalPrice");

const bottomPrice =
    document.getElementById("bottomPrice");

const paymentBar =
    document.getElementById("paymentBar");

const payNowButton =
    document.getElementById("payNowButton");


/* =========================
   STATE
========================= */

let currentUser = null;

let currentCourse = null;

let selectedLanguage = null;


/* =========================
   HELPERS
========================= */

function getCourseId() {

    const params =
        new URLSearchParams(window.location.search);

    return params.get("id");

}


function formatCurrency(value) {

    const amount =
        Number(value || 0);

    return "₹" + amount.toLocaleString("en-IN");

}


function showApp() {

    loadingScreen.classList.add("hidden");

    app.classList.remove("hidden");

}


function showError(message) {

    loadingScreen.classList.add("hidden");

    app.classList.remove("hidden");

    errorMessage.textContent =
        message || "Something went wrong.";

    errorSection.classList.remove("hidden");

    document
        .querySelector(".checkout-content")
        .querySelectorAll(
            ".course-card, .section, .secure-note, .bottom-space"
        )
        .forEach(element => {

            element.classList.add("hidden");

        });

    paymentBar.classList.add("hidden");

}


function cleanClassName(value) {

    if (!value) {
        return "—";
    }

    const map = {

        "UNDER_8TH": "Under 8th",

        "8TH": "8th",

        "9TH": "9th",

        "10TH": "10th",

        "1ST_PUC": "1st PUC",

        "2ND_PUC": "2nd PUC"

    };

    return map[value] || value;

}


/* =========================
   LANGUAGE NORMALIZATION
========================= */

function getCourseLanguages(course) {

    /*
     * Supports common language field formats.
     *
     * Preferred:
     * course.languages
     *
     * Also supports:
     * course.availableLanguages
     * course.crmLanguages
     * course.languageOptions
     */

    let languages =
        course.languages ??
        course.availableLanguages ??
        course.crmLanguages ??
        course.languageOptions ??
        null;


    if (!languages) {

        return [];

    }


    if (typeof languages === "string") {

        languages =
            languages
                .split(",")
                .map(item => item.trim())
                .filter(Boolean);

    }


    if (!Array.isArray(languages)) {

        return [];

    }


    return languages
        .map(item => {

            if (typeof item === "string") {

                return {
                    name: item,
                    description: `${item} medium`
                };

            }


            if (item && typeof item === "object") {

                return {

                    name:
                        item.name ??
                        item.language ??
                        item.title ??
                        "",

                    description:
                        item.description ??
                        `${item.name ?? item.language ?? ""} medium`

                };

            }


            return null;

        })
        .filter(item => item && item.name);

}


/* =========================
   IMAGE
========================= */

function loadCourseImage(url) {

    if (!url) {

        courseImage.classList.add("hidden");

        courseImageFallback.classList.remove("hidden");

        return;

    }


    courseImage.src = url;

}


courseImage.addEventListener(
    "error",
    () => {

        courseImage.classList.add("hidden");

        courseImageFallback.classList.remove("hidden");

    }
);


/* =========================
   LANGUAGE UI
========================= */

function renderLanguages(languages) {

    languageOptions.innerHTML = "";

    if (!languages.length) {

        languageSection.classList.add("hidden");

        summaryLanguageRow.classList.add("hidden");

        return;

    }


    languageSection.classList.remove("hidden");

    summaryLanguageRow.classList.remove("hidden");


    /*
     * If only one language exists,
     * automatically select it.
     */

    if (languages.length === 1) {

        selectedLanguage =
            languages[0].name;

    }


    languages.forEach(language => {

        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            "language-option";


        if (
            selectedLanguage ===
            language.name
        ) {

            button.classList.add("selected");

        }


        button.innerHTML = `

            <span class="language-main">

                <span class="language-name">
                    ${escapeHtml(language.name)}
                </span>

                <span class="language-description">
                    ${escapeHtml(language.description)}
                </span>

            </span>

            <span class="language-check">

                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M5 12l4 4L19 6"/>
                </svg>

            </span>

        `;


        button.addEventListener(
            "click",
            () => {

                selectedLanguage =
                    language.name;

                renderLanguages(languages);

                updateSummary();

            }
        );


        languageOptions.appendChild(button);

    });


    updateSummary();

}


/* =========================
   SUMMARY
========================= */

function updateSummary() {

    if (!currentCourse) {
        return;
    }


    summaryCourseName.textContent =
        currentCourse.crmCourseName ||
        "Course";


    summaryClass.textContent =
        cleanClassName(
            currentCourse.crmClass
        );


    if (selectedLanguage) {

        summaryLanguage.textContent =
            selectedLanguage;

        summaryLanguageRow.classList.remove(
            "hidden"
        );

    } else {

        summaryLanguageRow.classList.add(
            "hidden"
        );

    }


    const original =
        Number(
            currentCourse.crmPrice ??
            0
        );


    const final =
        Number(
            currentCourse.crmFinalPrice ??
            currentCourse.crmPrice ??
            0
        );


    const discount =
        Math.max(
            0,
            original - final
        );


    originalPrice.textContent =
        formatCurrency(original);


    if (discount > 0) {

        discountRow.classList.remove(
            "hidden"
        );

        discountAmount.textContent =
            "-" + formatCurrency(discount);

    } else {

        discountRow.classList.add(
            "hidden"
        );

    }


    finalPrice.textContent =
        formatCurrency(final);

    bottomPrice.textContent =
        formatCurrency(final);


    /*
     * If the course has multiple languages,
     * don't allow payment until one is selected.
     */

    const languages =
        getCourseLanguages(currentCourse);


    if (
        languages.length > 1 &&
        !selectedLanguage
    ) {

        payNowButton.disabled = true;

        payNowButton.textContent =
            "SELECT LANGUAGE";

    } else {

        payNowButton.disabled = false;

        payNowButton.innerHTML =
            `PAY NOW <span>→</span>`;

    }

}


/* =========================
   LOAD COURSE
========================= */

async function loadCourse(courseId) {

    try {

        if (!courseId) {

            showError(
                "No course was selected."
            );

            return;

        }


        const courseRef =
            doc(
                db,
                "crmCourses",
                courseId
            );


        const snapshot =
            await getDoc(courseRef);


        if (!snapshot.exists()) {

            showError(
                "This course could not be found."
            );

            return;

        }


        const course =
            snapshot.data();


        if (
            course.crmActive === false
        ) {

            showError(
                "This course is currently unavailable."
            );

            return;

        }


        currentCourse = {

            id: snapshot.id,

            ...course

        };

paymentBar.classList.remove("hidden");

showApp();
        /* =========================
           COURSE UI
        ========================== */

        courseName.textContent =
            currentCourse.crmCourseName ||
            "Zenova Course";


        courseMeta.textContent =
            `${cleanClassName(
                currentCourse.crmClass
            )} • ${
                currentCourse.crmMedium ||
                "English"
            }`;


        courseCode.textContent =
            currentCourse.crmCourseCode ||
            "";


        loadCourseImage(
            currentCourse.crmImageUrl
        );


        /* =========================
           LANGUAGE
        ========================== */

        const languages =
            getCourseLanguages(
                currentCourse
            );


        renderLanguages(languages);


        /* =========================
           SUMMARY
        ========================== */

        updateSummary();


        paymentBar.classList.remove(
            "hidden"
        );


        showApp();

    } catch (error) {

        console.error(
            "Checkout course load error:",
            error
        );

        showError(
            "Unable to load this course. Please try again."
        );

    }

}


/* =========================
   PAY NOW
========================= */

payNowButton.addEventListener(
    "click",
    async () => {

        if (!currentCourse) {
            return;
        }


        const languages =
            getCourseLanguages(
                currentCourse
            );


        if (
            languages.length > 1 &&
            !selectedLanguage
        ) {

            return;

        }


        /*
         * IMPORTANT:
         *
         * Do NOT create the student enrollment here.
         *
         * Payment gateway integration should happen next.
         *
         * After successful verified payment:
         *
         * payment → enrollment → access
         */


        const checkoutData = {

            crmCourseId:
                currentCourse.id,

            courseName:
                currentCourse.crmCourseName,

            crmClass:
                currentCourse.crmClass,

            selectedLanguage:
                selectedLanguage,

            amount:
                Number(
                    currentCourse.crmFinalPrice ??
                    currentCourse.crmPrice ??
                    0
                )

        };


        console.log(
            "Checkout ready:",
            checkoutData
        );


        /*
         * TEMPORARY:
         *
         * Replace this with Razorpay/payment
         * gateway integration.
         */

        alert(
            "Payment gateway will open here."
        );

    }
);


/* =========================
   BACK
========================= */

backButton.addEventListener(
    "click",
    () => {

        if (
            window.history.length > 1
        ) {

            window.history.back();

        } else {

            window.location.href =
                "../batches/";

        }

    }
);


errorBackButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "../batches/";

    }
);


/* =========================
   NOTIFICATIONS
========================= */

document
    .getElementById("notificationButton")
    .addEventListener(
        "click",
        () => {

            window.location.href =
                "../notifications/";

        }
    );


/* =========================
   HTML ESCAPE
========================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================
   AUTH
========================= */

onAuthStateChanged(auth, async (user) => {
    console.log("Checkout auth state:", user);

    if (!user) {
        window.location.href = "../login/";
        return;
    }

    currentUser = user;

    const courseId = getCourseId();

    console.log("Checkout course ID:", courseId);

    if (!courseId) {
        showError("No course was selected.");
        return;
    }

    try {
        await loadCourse(courseId);
    } catch (error) {
        console.error("Checkout initialization error:", error);

        showError(
            error?.message ||
            "Unable to load checkout."
        );
    }
});

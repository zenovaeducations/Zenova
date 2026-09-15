/* =========================================================
   ZENOVA EDUCATIONS
   CHECKOUT
   ---------------------------------------------------------
   Flow:

   Batch Details
        ↓
   Checkout
        ↓
   Select First / Second / Third Language
        ↓
   Save checkout data in sessionStorage
        ↓
   Payment page

   Firebase:
   crmCourses/{courseId}
   students/{uid}

   Checkout storage:
   zenova_checkout
========================================================= */

import {
    auth,
    db
} from "../../firebase/firebase-config.js";

import {
    doc,
    getDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================================
   STATE
========================================================= */

let currentUser = null;
let currentStudent = null;
let currentCourse = null;

let selectedLanguages = {
    first: "",
    second: "",
    third: ""
};

let courseUnsubscribe = null;


/* =========================================================
   ELEMENTS
========================================================= */

const loadingScreen =
    document.getElementById("loadingScreen");

const app =
    document.getElementById("app");

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

const summaryCourse =
    document.getElementById("summaryCourse");

const summaryClass =
    document.getElementById("summaryClass");

const coursePrice =
    document.getElementById("coursePrice");

const discountRow =
    document.getElementById("discountRow");

const discountAmount =
    document.getElementById("discountAmount");

const finalPrice =
    document.getElementById("finalPrice");

const payNowButton =
    document.getElementById("payNowButton");


/* =========================================================
   LANGUAGE UI
   ---------------------------------------------------------
   We support up to 3 languages.

   If the HTML already contains:
       #languageSection
       #languageOptions

   we use them.

   If not, we create the language selector dynamically.
========================================================= */

let languageSection =
    document.getElementById("languageSection");

let languageOptions =
    document.getElementById("languageOptions");

let firstLanguageSelect = null;
let secondLanguageSelect = null;
let thirdLanguageSelect = null;


/* =========================================================
   START
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "../login/";

            return;
        }


        currentUser = user;


        const courseId =
            getCourseId();


        if (!courseId) {

            showError(
                "Your course information could not be found. Please return to Batch Details."
            );

            return;
        }


        try {

            await loadStudent(
                user.uid
            );


            await loadCourse(
                courseId
            );


        } catch (error) {

            console.error(
                "CHECKOUT START ERROR:",
                error
            );

            showError(
                "Unable to load checkout details. Please try again."
            );

        }

    }
);


/* =========================================================
   GET COURSE ID
   ---------------------------------------------------------
   Supports both:
       ?id=COURSE_ID
       ?courseId=COURSE_ID

   This prevents route mismatch between
   Batch Details / Batches / Checkout.
========================================================= */

function getCourseId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return (
        params.get("courseId") ||
        params.get("id") ||
        ""
    ).trim();

}


/* =========================================================
   LOAD STUDENT
========================================================= */

async function loadStudent(uid) {

    try {

        const studentRef =
            doc(
                db,
                "students",
                uid
            );


        const snapshot =
            await getDoc(
                studentRef
            );


        if (snapshot.exists()) {

            currentStudent =
                snapshot.data();

        } else {

            currentStudent = {};

        }

    } catch (error) {

        console.error(
            "STUDENT LOAD ERROR:",
            error
        );

        currentStudent = {};

    }

}


/* =========================================================
   LOAD COURSE
   ---------------------------------------------------------
   CRM course is the single source of truth.
========================================================= */

async function loadCourse(courseId) {

    const courseRef =
        doc(
            db,
            "crmCourses",
            courseId
        );


    courseUnsubscribe =
        onSnapshot(

            courseRef,

            (snapshot) => {

                if (!snapshot.exists()) {

                    showError(
                        "This course is no longer available."
                    );

                    return;
                }


                currentCourse = {
                    id: snapshot.id,
                    ...snapshot.data()
                };


                console.log(
                    "CHECKOUT COURSE:",
                    currentCourse
                );


                renderCheckout();

            },

            (error) => {

                console.error(
                    "COURSE LISTENER ERROR:",
                    error
                );

                showError(
                    "Unable to load course details."
                );

            }

        );

}


/* =========================================================
   RENDER CHECKOUT
========================================================= */

function renderCheckout() {

    if (!currentCourse) {
        return;
    }


    const name =
        currentCourse.crmCourseName ||
        currentCourse.name ||
        currentCourse.title ||
        "Zenova Course";


    const code =
        currentCourse.crmCourseCode ||
        "";


    const className =
        formatClass(
            currentCourse.crmClass ||
            ""
        );


    const medium =
        currentCourse.crmMedium ||
        "";


    const image =
        currentCourse.crmImageUrl ||
        currentCourse.imageUrl ||
        currentCourse.courseImageUrl ||
        "";


    /* -----------------------------------------------------
       COURSE
    ----------------------------------------------------- */

    if (courseName) {
        courseName.textContent =
            name;
    }


    if (courseCode) {
        courseCode.textContent =
            code;
    }


    if (courseMeta) {

        courseMeta.textContent =
            [
                className,
                medium
            ]
                .filter(Boolean)
                .join(" • ") ||
            "Zenova Educations";

    }


    if (summaryCourse) {
        summaryCourse.textContent =
            name;
    }


    if (summaryClass) {
        summaryClass.textContent =
            className || "—";
    }


    /* -----------------------------------------------------
       IMAGE
    ----------------------------------------------------- */

    renderCourseImage(
        image
    );


    /* -----------------------------------------------------
       PRICE
    ----------------------------------------------------- */

    const pricing =
        getCoursePricing();


    if (coursePrice) {

        coursePrice.textContent =
            formatMoney(
                pricing.price
            );

    }


    if (discountRow && discountAmount) {

        if (pricing.discount > 0) {

            discountRow.classList.remove(
                "hidden"
            );

            discountAmount.textContent =
                `-${formatMoney(
                    pricing.discount
                )}`;

        } else {

            discountRow.classList.add(
                "hidden"
            );

        }

    }


    if (finalPrice) {

        finalPrice.textContent =
            formatMoney(
                pricing.finalPrice
            );

    }


    /* -----------------------------------------------------
       LANGUAGE SELECTION
    ----------------------------------------------------- */

    setupLanguageSelection();


    /* -----------------------------------------------------
       DISPLAY
    ----------------------------------------------------- */

    hideLoading();

}


/* =========================================================
   COURSE IMAGE
========================================================= */

function renderCourseImage(imageUrl) {

    if (!courseImage) {
        return;
    }


    if (!imageUrl) {

        courseImage.classList.add(
            "hidden"
        );

        if (courseImageFallback) {

            courseImageFallback.style.display =
                "flex";

        }

        return;
    }


    courseImage.src =
        imageUrl;


    courseImage.classList.remove(
        "hidden"
    );


    if (courseImageFallback) {

        courseImageFallback.style.display =
            "none";

    }


    courseImage.onerror =
        () => {

            courseImage.classList.add(
                "hidden"
            );

            if (courseImageFallback) {

                courseImageFallback.style.display =
                    "flex";

            }

        };

}


/* =========================================================
   PRICING
========================================================= */

function getCoursePricing() {

    const price =
        Number(
            currentCourse?.crmPrice ??
            0
        );


    const discount =
        Number(
            currentCourse?.crmDiscount ??
            0
        );


    let finalPrice =
        Number(
            currentCourse?.crmFinalPrice
        );


    if (
        !Number.isFinite(
            finalPrice
        )
    ) {

        finalPrice =
            Math.max(
                0,
                price - discount
            );

    }


    return {

        price:
            Number.isFinite(price)
                ? price
                : 0,

        discount:
            Number.isFinite(discount)
                ? discount
                : 0,

        finalPrice:
            Math.max(
                0,
                finalPrice
            )

    };

}


/* =========================================================
   LANGUAGE SOURCE
   ---------------------------------------------------------
   We check several possible CRM fields so the checkout
   remains compatible with the course structure.

   Priority:
       languages
       crmLanguages
       mediums
       crmMedium
========================================================= */

function getAvailableLanguages() {

    if (!currentCourse) {
        return [];
    }


    const candidates = [];


    const fields = [

        currentCourse.languages,

        currentCourse.crmLanguages,

        currentCourse.mediums

    ];


    fields.forEach(
        value => {

            if (
                Array.isArray(value)
            ) {

                value.forEach(
                    item => {

                        if (
                            typeof item === "string"
                        ) {

                            candidates.push(
                                item
                            );

                        } else if (
                            item &&
                            typeof item === "object"
                        ) {

                            candidates.push(
                                item.name ||
                                item.language ||
                                item.medium ||
                                item.label ||
                                ""
                            );

                        }

                    }
                );

            }

        }
    );


    /* -----------------------------------------------------
       Fallback to crmMedium

       Example:
       "Kannada, English"
    ----------------------------------------------------- */

    if (
        candidates.length === 0 &&
        currentCourse.crmMedium
    ) {

        String(
            currentCourse.crmMedium
        )
            .split(",")
            .forEach(
                item => {

                    candidates.push(
                        item
                    );

                }
            );

    }


    /* -----------------------------------------------------
       CLEAN + REMOVE DUPLICATES
    ----------------------------------------------------- */

    const unique =
        [];


    const seen =
        new Set();


    candidates.forEach(
        item => {

            const value =
                String(
                    item || ""
                )
                    .trim();


            if (!value) {
                return;
            }


            const key =
                value.toLowerCase();


            if (
                seen.has(key)
            ) {

                return;

            }


            seen.add(key);

            unique.push(
                value
            );

        }
    );


    return unique;

}


/* =========================================================
   LANGUAGE UI SETUP
========================================================= */

function setupLanguageSelection() {

    const languages =
        getAvailableLanguages();


    console.log(
        "AVAILABLE LANGUAGES:",
        languages
    );


    ensureLanguageContainer();


    if (
        !languageOptions
    ) {
        return;
    }


    languageOptions.innerHTML =
        "";


    if (
        languages.length === 0
    ) {

        if (languageSection) {

            languageSection.classList.add(
                "hidden"
            );

        }

        return;
    }


    if (languageSection) {

        languageSection.classList.remove(
            "hidden"
        );

    }


    /* -----------------------------------------------------
       CREATE FIRST
    ----------------------------------------------------- */

    firstLanguageSelect =
        createLanguageSelect(
            "firstLanguage",
            "First Language",
            languages
        );


    languageOptions.appendChild(
        firstLanguageSelect.wrapper
    );


    /* -----------------------------------------------------
       SECOND
    ----------------------------------------------------- */

    secondLanguageSelect =
        createLanguageSelect(
            "secondLanguage",
            "Second Language",
            languages
        );


    languageOptions.appendChild(
        secondLanguageSelect.wrapper
    );


    /* -----------------------------------------------------
       THIRD
    ----------------------------------------------------- */

    thirdLanguageSelect =
        createLanguageSelect(
            "thirdLanguage",
            "Third Language",
            languages
        );


    languageOptions.appendChild(
        thirdLanguageSelect.wrapper
    );


    /* -----------------------------------------------------
       RESTORE PREVIOUS SELECTION
    ----------------------------------------------------- */

    restoreLanguageSelections();


    /* -----------------------------------------------------
       LISTEN
    ----------------------------------------------------- */

    firstLanguageSelect.select.addEventListener(
        "change",
        handleLanguageChange
    );


    secondLanguageSelect.select.addEventListener(
        "change",
        handleLanguageChange
    );


    thirdLanguageSelect.select.addEventListener(
        "change",
        handleLanguageChange
    );


    updateLanguageOptions();


    updateLanguageSummary();

}


/* =========================================================
   ENSURE LANGUAGE CONTAINER
   ---------------------------------------------------------
   This means you don't have to completely depend on
   the old Checkout HTML.

   If #languageSection / #languageOptions don't exist,
   JS creates them.
========================================================= */

function ensureLanguageContainer() {

    if (
        languageSection &&
        languageOptions
    ) {

        return;
    }


    const summaryCard =
        document.querySelector(
            ".summary-card"
        );


    if (!summaryCard) {
        return;
    }


    languageSection =
        document.createElement(
            "section"
        );


    languageSection.id =
        "languageSection";


    languageSection.className =
        "section language-section";


    languageSection.innerHTML = `

        <div class="section-heading">

            <span>
                LANGUAGE
            </span>

            <h2>
                Select Languages
            </h2>

        </div>

        <div
            id="languageOptions"
            class="language-options"
        ></div>

    `;


    summaryCard
        .closest(".section")
        ?.after(
            languageSection
        );


    languageOptions =
        languageSection.querySelector(
            "#languageOptions"
        );

}


/* =========================================================
   CREATE LANGUAGE SELECT
========================================================= */

function createLanguageSelect(
    fieldName,
    label,
    languages
) {

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "language-select-wrapper";


    const labelElement =
        document.createElement(
            "label"
        );


    labelElement.textContent =
        label;


    labelElement.setAttribute(
        "for",
        fieldName
    );


    const select =
        document.createElement(
            "select"
        );


    select.id =
        fieldName;


    select.name =
        fieldName;


    select.className =
        "language-select";


    const placeholder =
        document.createElement(
            "option"
        );


    placeholder.value =
        "";


    placeholder.textContent =
        `Select ${label}`;


    placeholder.disabled =
        true;


    placeholder.selected =
        true;


    select.appendChild(
        placeholder
    );


    languages.forEach(
        language => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                language;


            option.textContent =
                language;


            select.appendChild(
                option
            );

        }
    );


    wrapper.appendChild(
        labelElement
    );


    wrapper.appendChild(
        select
    );


    return {

        wrapper,
        select

    };

}


/* =========================================================
   LANGUAGE CHANGE
========================================================= */

function handleLanguageChange() {

    selectedLanguages.first =
        firstLanguageSelect?.select.value ||
        "";


    selectedLanguages.second =
        secondLanguageSelect?.select.value ||
        "";


    selectedLanguages.third =
        thirdLanguageSelect?.select.value ||
        "";


    updateLanguageOptions();


    updateLanguageSummary();


    saveTemporaryCheckoutData();

}


/* =========================================================
   PREVENT DUPLICATE LANGUAGE
   ---------------------------------------------------------
   Same language cannot be selected 2 or 3 times.
========================================================= */

function updateLanguageOptions() {

    const selected =
        [

            selectedLanguages.first,

            selectedLanguages.second,

            selectedLanguages.third

        ]
            .filter(Boolean);


    const selects =
        [

            firstLanguageSelect?.select,

            secondLanguageSelect?.select,

            thirdLanguageSelect?.select

        ]
            .filter(Boolean);


    selects.forEach(
        select => {

            Array.from(
                select.options
            )
                .forEach(
                    option => {

                        if (
                            !option.value
                        ) {

                            return;

                        }


                        const selectedByAnother =
                            selected.includes(
                                option.value
                            ) &&
                            select.value !==
                                option.value;


                        option.disabled =
                            selectedByAnother;

                    }
                );

        }
    );

}


/* =========================================================
   RESTORE LANGUAGE SELECTIONS
========================================================= */

function restoreLanguageSelections() {

    let data = null;


    try {

        const raw =
            sessionStorage.getItem(
                "zenova_checkout"
            );


        if (raw) {

            data =
                JSON.parse(
                    raw
                );

            }

    } catch (error) {

        console.warn(
            "Unable to restore checkout:",
            error
        );

    }


    if (!data) {
        return;
    }


    const languages =
        data.selectedLanguages || {};


    selectedLanguages.first =
        data.firstLanguage ||
        languages.first ||
        "";


    selectedLanguages.second =
        data.secondLanguage ||
        languages.second ||
        "";


    selectedLanguages.third =
        data.thirdLanguage ||
        languages.third ||
        "";


    if (firstLanguageSelect) {

        firstLanguageSelect.select.value =
            selectedLanguages.first;

    }


    if (secondLanguageSelect) {

        secondLanguageSelect.select.value =
            selectedLanguages.second;

    }


    if (thirdLanguageSelect) {

        thirdLanguageSelect.select.value =
            selectedLanguages.third;

    }

}


/* =========================================================
   LANGUAGE SUMMARY
   ---------------------------------------------------------
   If old HTML has #languageRow and #summaryLanguage,
   keep them updated.

   We show all selected languages together:
       Kannada • English • Hindi
========================================================= */

function updateLanguageSummary() {

    const values =
        [

            selectedLanguages.first,

            selectedLanguages.second,

            selectedLanguages.third

        ]
            .filter(Boolean);


    const languageText =
        values.join(
            " • "
        );


    const languageRow =
        document.getElementById(
            "languageRow"
        );


    const summaryLanguage =
        document.getElementById(
            "summaryLanguage"
        );


    if (
        languageRow &&
        summaryLanguage
    ) {

        if (languageText) {

            languageRow.classList.remove(
                "hidden"
            );

            summaryLanguage.textContent =
                languageText;

        } else {

            languageRow.classList.add(
                "hidden"
            );

            summaryLanguage.textContent =
                "—";

        }

    }

}


/* =========================================================
   TEMPORARY CHECKOUT SAVE
   ---------------------------------------------------------
   Saves selections while user remains on Checkout.
========================================================= */

function saveTemporaryCheckoutData() {

    if (!currentCourse) {
        return;
    }


    const pricing =
        getCoursePricing();


    const data = {

        courseId:
            currentCourse.id,

        courseName:
            currentCourse.crmCourseName ||
            "",

        courseCode:
            currentCourse.crmCourseCode ||
            "",

        className:
            currentCourse.crmClass ||
            "",

        board:
            currentCourse.crmBoard ||
            "",

        medium:
            currentCourse.crmMedium ||
            "",

        firstLanguage:
            selectedLanguages.first,

        secondLanguage:
            selectedLanguages.second,

        thirdLanguage:
            selectedLanguages.third,

        selectedLanguages: {

            first:
                selectedLanguages.first,

            second:
                selectedLanguages.second,

            third:
                selectedLanguages.third

        },

        selectedLanguageList:
            [

                selectedLanguages.first,

                selectedLanguages.second,

                selectedLanguages.third

            ]
                .filter(Boolean),

        price:
            pricing.price,

        discount:
            pricing.discount,

        finalPrice:
            pricing.finalPrice,

        studentUid:
            currentUser?.uid ||
            "",

        savedAt:
            Date.now()

    };


    sessionStorage.setItem(
        "zenova_checkout",
        JSON.stringify(data)
    );

}


/* =========================================================
   PAY NOW
   ---------------------------------------------------------
   IMPORTANT:
   The Payment page you uploaded reads:
       sessionStorage["zenova_checkout"]

   Therefore we save EVERYTHING before navigation.

   We ALSO send courseId in URL as a safety/fallback.
========================================================= */

if (payNowButton) {

    payNowButton.addEventListener(
        "click",
        goToPayment
    );

}


/* Support older button IDs too */

const alternatePayButtons =
    document.querySelectorAll(
        "#checkoutPayButton, #buyNowButton, #continuePaymentButton"
    );


alternatePayButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            goToPayment
        );

    }
);


function goToPayment() {

    if (
        !currentUser ||
        !currentCourse
    ) {

        alert(
            "Course information is still loading. Please wait."
        );

        return;
    }


    /* -----------------------------------------------------
       VALIDATE LANGUAGES
    ----------------------------------------------------- */

    const availableLanguages =
        getAvailableLanguages();


    const selected =
        [

            selectedLanguages.first,

            selectedLanguages.second,

            selectedLanguages.third

        ]
            .filter(Boolean);


    /*
     * If the course has language options,
     * require at least the first language.
     */

    if (
        availableLanguages.length > 0 &&
        !selectedLanguages.first
    ) {

        alert(
            "Please select the First Language before continuing."
        );


        firstLanguageSelect?.select?.focus();

        return;

    }


    /*
     * Make absolutely sure the same language
     * isn't selected twice.
     */

    const unique =
        new Set(
            selected.map(
                value =>
                    value.toLowerCase()
            )
        );


    if (
        unique.size !==
        selected.length
    ) {

        alert(
            "Please select different languages."
        );

        return;

    }


    /* -----------------------------------------------------
       PRICING
    ----------------------------------------------------- */

    const pricing =
        getCoursePricing();


    /* -----------------------------------------------------
       COMPLETE CHECKOUT DATA
    ----------------------------------------------------- */

    const data = {

        /* COURSE */

        courseId:
            currentCourse.id,

        courseName:
            currentCourse.crmCourseName ||
            currentCourse.name ||
            currentCourse.title ||
            "",

        courseCode:
            currentCourse.crmCourseCode ||
            "",

        className:
            currentCourse.crmClass ||
            "",

        board:
            currentCourse.crmBoard ||
            "",

        medium:
            currentCourse.crmMedium ||
            "",


        /* LANGUAGES */

        firstLanguage:
            selectedLanguages.first,

        secondLanguage:
            selectedLanguages.second,

        thirdLanguage:
            selectedLanguages.third,

        selectedLanguages: {

            first:
                selectedLanguages.first,

            second:
                selectedLanguages.second,

            third:
                selectedLanguages.third

        },

        selectedLanguageList:
            selected,


        /*
         * Compatibility with your CURRENT
         * Payment page.
         *
         * It currently reads:
         * checkoutData.selectedLanguage
         */

        selectedLanguage:
            selected.join(
                " • "
            ),


        /* PRICE */

        price:
            pricing.price,

        discount:
            pricing.discount,

        finalPrice:
            pricing.finalPrice,


        /* STUDENT */

        studentUid:
            currentUser.uid,

        studentName:
            currentStudent?.name ||
            currentStudent?.fullName ||
            currentUser.displayName ||
            "",

        phone:
            currentStudent?.phone ||
            currentStudent?.mobile ||
            currentStudent?.phoneNumber ||
            "",

        email:
            currentStudent?.email ||
            currentUser.email ||
            "",


        /* TIMESTAMP */

        savedAt:
            Date.now()

    };


    console.log(
        "FINAL CHECKOUT DATA:",
        data
    );


    /* -----------------------------------------------------
       SAVE
    ----------------------------------------------------- */

    try {

        sessionStorage.setItem(
            "zenova_checkout",
            JSON.stringify(data)
        );

    } catch (error) {

        console.error(
            "CHECKOUT STORAGE ERROR:",
            error
        );

        alert(
            "Unable to save your checkout details. Please try again."
        );

        return;

    }


    /* -----------------------------------------------------
       PAYMENT ROUTE
       -----------------------------------------------------

       Checkout:
           /home/checkout/

       Payment:
           /home/payment/

       Therefore:
           ../payment/

       Course ID is also included in URL as backup.
    ----------------------------------------------------- */

    const params =
        new URLSearchParams();


    params.set(
        "courseId",
        currentCourse.id
    );


    if (
        selectedLanguages.first
    ) {

        params.set(
            "firstLanguage",
            selectedLanguages.first
        );

    }


    if (
        selectedLanguages.second
    ) {

        params.set(
            "secondLanguage",
            selectedLanguages.second
        );

    }


    if (
        selectedLanguages.third
    ) {

        params.set(
            "thirdLanguage",
            selectedLanguages.third
        );

    }


    const paymentUrl =
        `../payment/?${params.toString()}`;


    console.log(
        "GOING TO PAYMENT:",
        paymentUrl
    );


    window.location.href =
        paymentUrl;

}


/* =========================================================
   BACK BUTTON
========================================================= */

const backButton =
    document.getElementById(
        "backButton"
    );


if (backButton) {

    backButton.addEventListener(
        "click",
        () => {

            if (
                window.history.length > 1
            ) {

                window.history.back();

            } else {

                window.location.href =
                    "../batchdetails/";

            }

        }
    );

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

const notificationButton =
    document.getElementById(
        "notificationButton"
    );


if (notificationButton) {

    notificationButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "../notifications/";

        }
    );

}


/* =========================================================
   BOTTOM NAV
========================================================= */

document
    .querySelectorAll(
        "[data-nav]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const destination =
                        button.dataset.nav;


                    const routes = {

                        home:
                            "../",

                        courses:
                            "../batches/",

                        study:
                            "../study/",

                        ai:
                            "../ai/",

                        profile:
                            "../profile/"

                    };


                    if (
                        routes[destination]
                    ) {

                        window.location.href =
                            routes[destination];

                    }

                }
            );

        }
    );


/* =========================================================
   LOADING
========================================================= */

function hideLoading() {

    if (loadingScreen) {

        loadingScreen.classList.add(
            "hidden"
        );

    }


    if (app) {

        app.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   ERROR
========================================================= */

function showError(message) {

    if (loadingScreen) {

        loadingScreen.classList.add(
            "hidden"
        );

    }


    if (app) {

        app.classList.remove(
            "hidden"
        );

    }


    console.error(
        "CHECKOUT ERROR:",
        message
    );


    alert(
        message
    );

}


/* =========================================================
   MONEY
========================================================= */

function formatMoney(amount) {

    return (
        "₹" +
        Number(
            amount || 0
        ).toLocaleString(
            "en-IN"
        )
    );

}


/* =========================================================
   CLASS
========================================================= */

function formatClass(value) {

    const classes = {

        UNDER_8TH:
            "Under 8th",

        "8TH":
            "8th",

        "9TH":
            "9th",

        "10TH":
            "10th",

        "1ST_PUC":
            "1st PUC",

        "2ND_PUC":
            "2nd PUC"

    };


    return (
        classes[value] ||
        String(
            value || ""
        )
            .replace(
                /_/g,
                " "
            )
    );

}


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (
            typeof courseUnsubscribe ===
            "function"
        ) {

            courseUnsubscribe();

        }

    }
);

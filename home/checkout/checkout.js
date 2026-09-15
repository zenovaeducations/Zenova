/* =========================================================
   ZENOVA EDUCATONS
   CHECKOUT
   ========================================================= */

import {
    auth,
    db
} from "../../firebase/firebase-config.js";


import {
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let currentCourse = null;

let unsubscribeCourse = null;

let isPaying = false;


/*
 * Stores selected languages:
 *
 * {
 *   first: "Kannada",
 *   second: "English",
 *   third: "Hindi"
 * }
 */

const selectedLanguages = {
    first: "",
    second: "",
    third: ""
};


/* =========================================================
   ELEMENT HELPER
========================================================= */

function el(id) {
    return document.getElementById(id);
}


/* =========================================================
   ELEMENTS
========================================================= */

const loadingScreen =
    el("loadingScreen");

const app =
    el("app");


const backButton =
    el("backButton");

const notificationButton =
    el("notificationButton");


const courseImage =
    el("courseImage");

const courseImageFallback =
    el("courseImageFallback");

const courseName =
    el("courseName");

const courseClass =
    el("courseClass");

const courseCode =
    el("courseCode");


const languageSection =
    el("languageSection");

const languageSelectors =
    el("languageSelectors");

const languageError =
    el("languageError");


const subjectsList =
    el("subjectsList");

const noSubjects =
    el("noSubjects");


const summaryCourseName =
    el("summaryCourseName");

const summaryClass =
    el("summaryClass");

const summaryLanguages =
    el("summaryLanguages");

const summaryLanguageList =
    el("summaryLanguageList");


const originalPrice =
    el("originalPrice");

const discountRow =
    el("discountRow");

const discountAmount =
    el("discountAmount");

const finalPrice =
    el("finalPrice");


const bottomPrice =
    el("bottomPrice");

const payNowButton =
    el("payNowButton");


const errorSection =
    el("errorSection");

const errorMessage =
    el("errorMessage");

const errorBackButton =
    el("errorBackButton");


/* =========================================================
   URL
========================================================= */

function getCourseId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return (
        params.get("id") ||
        params.get("courseId") ||
        ""
    ).trim();
}


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        try {

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
                    "Course information is missing."
                );

                return;
            }


            startCourseListener(
                courseId
            );

        } catch (error) {

            console.error(
                "ZENOVA CHECKOUT AUTH ERROR:",
                error
            );

            showError(
                "Unable to open checkout."
            );

        }

    }
);


/* =========================================================
   COURSE LISTENER
========================================================= */

function startCourseListener(courseId) {

    if (unsubscribeCourse) {

        unsubscribeCourse();

        unsubscribeCourse = null;
    }


    const courseRef =
        doc(
            db,
            "crmCourses",
            courseId
        );


    unsubscribeCourse =
        onSnapshot(
            courseRef,

            snapshot => {

                if (!snapshot.exists()) {

                    showError(
                        "This course is no longer available."
                    );

                    return;
                }


                currentCourse = {

                    id:
                        snapshot.id,

                    ...snapshot.data()

                };


                renderCheckout(
                    currentCourse
                );


                hideLoading();

            },


            error => {

                console.error(
                    "CHECKOUT COURSE ERROR:",
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

function renderCheckout(course) {

    if (!course) {
        return;
    }


    /* =====================================================
       COURSE DETAILS
    ====================================================== */

    const name =
        course.crmCourseName ||
        course.name ||
        course.title ||
        "Zenova Course";


    const className =
        course.crmClass ||
        course.className ||
        course.class ||
        course.standard ||
        "";


    const code =
        course.crmCourseCode ||
        course.courseCode ||
        course.code ||
        "";


    courseName.textContent =
        name;


    courseClass.textContent =
        formatClass(className);


    courseCode.textContent =
        code
            ? `Course Code: ${code}`
            : "";


    summaryCourseName.textContent =
        name;


    summaryClass.textContent =
        formatClass(className);


    /* =====================================================
       IMAGE
    ====================================================== */

    const imageUrl =
        course.imageUrl ||
        course.courseImageUrl ||
        course.image ||
        "";


    if (imageUrl) {

        courseImage.src =
            imageUrl;

        courseImage.classList.remove(
            "hidden"
        );

        courseImageFallback.classList.add(
            "hidden"
        );

        courseImage.onerror =
            () => {

                courseImage.classList.add(
                    "hidden"
                );

                courseImageFallback.classList.remove(
                    "hidden"
                );

            };

    } else {

        courseImage.classList.add(
            "hidden"
        );

        courseImageFallback.classList.remove(
            "hidden"
        );

    }


    /* =====================================================
       LANGUAGES
    ====================================================== */

    const languages =
        getCourseLanguages(course);


    renderLanguageSelectors(
        languages
    );


    /* =====================================================
       SUBJECTS
    ====================================================== */

    const subjects =
        getCourseSubjects(course);


    renderSubjects(
        subjects
    );


    /* =====================================================
       PRICE
    ====================================================== */

    renderPricing(
        course
    );


    updatePayButton();
}


/* =========================================================
   GET COURSE LANGUAGES
========================================================= */

function getCourseLanguages(course) {

    let languages = [];


    /*
     * PRIMARY CURRENT STRUCTURE
     *
     * mediums: [
     *   "Kannada",
     *   "English",
     *   "Hindi"
     * ]
     */

    if (
        Array.isArray(
            course.mediums
        )
    ) {

        languages =
            course.mediums;

    }


    /*
     * Compatibility:
     * crmMediums
     */

    if (
        languages.length === 0 &&
        Array.isArray(
            course.crmMediums
        )
    ) {

        languages =
            course.crmMediums;

    }


    /*
     * Compatibility:
     * availableLanguages
     */

    if (
        languages.length === 0 &&
        Array.isArray(
            course.availableLanguages
        )
    ) {

        languages =
            course.availableLanguages;

    }


    /*
     * Compatibility:
     * comma-separated crmMedium
     */

    if (
        languages.length === 0 &&
        typeof course.crmMedium === "string"
    ) {

        languages =
            course.crmMedium
                .split(",")
                .map(
                    value =>
                        value.trim()
                )
                .filter(Boolean);

    }


    /*
     * Normalize + remove duplicates
     */

    const unique =
        new Map();


    languages.forEach(
        language => {

            const value =
                String(language || "")
                    .trim();


            if (!value) {
                return;
            }


            const key =
                value.toLowerCase();


            if (
                !unique.has(key)
            ) {

                unique.set(
                    key,
                    value
                );

            }

        }
    );


    return [
        ...unique.values()
    ];
}


/* =========================================================
   RENDER LANGUAGE SELECTORS
========================================================= */

function renderLanguageSelectors(
    languages
) {

    languageSelectors.innerHTML =
        "";


    selectedLanguages.first =
        "";

    selectedLanguages.second =
        "";

    selectedLanguages.third =
        "";


    /*
     * No languages created by Admin
     */

    if (
        languages.length === 0
    ) {

        languageSection.classList.add(
            "hidden"
        );

        updateSummaryLanguages();

        return;
    }


    languageSection.classList.remove(
        "hidden"
    );


    /*
     * Maximum 3 language slots.
     *
     * If Admin created:
     *
     * 1 language → First
     * 2 languages → First + Second
     * 3 languages → First + Second + Third
     *
     * We never create a fourth slot.
     */

    const slotCount =
        Math.min(
            languages.length,
            3
        );


    const slots = [
        {
            key: "first",
            label: "First Language"
        },
        {
            key: "second",
            label: "Second Language"
        },
        {
            key: "third",
            label: "Third Language"
        }
    ];


    slots
        .slice(0, slotCount)
        .forEach(
            slot => {

                const wrapper =
                    document.createElement(
                        "div"
                    );


                wrapper.className =
                    "language-field";


                const label =
                    document.createElement(
                        "label"
                    );


                label.className =
                    "language-label";


                label.textContent =
                    slot.label;


                label.htmlFor =
                    `language-${slot.key}`;


                const select =
                    document.createElement(
                        "select"
                    );


                select.className =
                    "language-select";


                select.id =
                    `language-${slot.key}`;


                select.dataset.slot =
                    slot.key;


                const placeholder =
                    document.createElement(
                        "option"
                    );


                placeholder.value =
                    "";


                placeholder.textContent =
                    `Select ${slot.label}`;


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


                select.addEventListener(
                    "change",
                    () => {

                        selectedLanguages[
                            slot.key
                        ] =
                            select.value;


                        validateLanguageSelections(
                            languages
                        );


                        updateSummaryLanguages();

                        updatePayButton();

                    }
                );


                wrapper.appendChild(
                    label
                );

                wrapper.appendChild(
                    select
                );


                languageSelectors.appendChild(
                    wrapper
                );

            }
        );


    validateLanguageSelections(
        languages
    );

    updateSummaryLanguages();
}


/* =========================================================
   VALIDATE LANGUAGES
========================================================= */

function validateLanguageSelections(
    languages
) {

    const selects =
        languageSelectors.querySelectorAll(
            ".language-select"
        );


    const values =
        [...selects]
            .map(
                select =>
                    select.value
            );


    const allSelected =
        values.every(
            value =>
                Boolean(value)
        );


    const uniqueSelected =
        new Set(values)
            .size === values.length;


    selects.forEach(
        select => {

            select.classList.remove(
                "invalid"
            );

        }
    );


    if (
        values.some(
            value => value
        ) &&
        !uniqueSelected
    ) {

        selects.forEach(
            select => {

                const duplicate =
                    values.filter(
                        value =>
                            value &&
                            value ===
                            select.value
                    ).length > 1;


                if (
                    duplicate
                ) {

                    select.classList.add(
                        "invalid"
                    );

                }

            }
        );

        languageError.textContent =
            "Each language must be different.";

        languageError.classList.remove(
            "hidden"
        );

        return false;
    }


    if (
        !allSelected
    ) {

        languageError.textContent =
            "Please select all required languages.";

        languageError.classList.add(
            "hidden"
        );

        return false;
    }


    languageError.classList.add(
        "hidden"
    );


    return true;
}


/* =========================================================
   PREVENT DUPLICATE OPTIONS
========================================================= */

function updateLanguageOptionAvailability() {

    const selects =
        languageSelectors.querySelectorAll(
            ".language-select"
        );


    const selectedValues =
        [...selects]
            .map(
                select =>
                    select.value
            );


    selects.forEach(
        select => {

            const ownValue =
                select.value;


            [...select.options]
                .forEach(
                    option => {

                        if (
                            !option.value
                        ) {
                            return;
                        }


                        const selectedElsewhere =
                            selectedValues.includes(
                                option.value
                            ) &&
                            option.value !==
                                ownValue;


                        option.disabled =
                            selectedElsewhere;

                    }
                );

        }
    );
}


/* =========================================================
   GET COURSE SUBJECTS
========================================================= */

function getCourseSubjects(course) {

    let subjects = [];


    /*
     * Primary CRM course structure
     */

    if (
        Array.isArray(
            course.subjects
        )
    ) {

        subjects =
            course.subjects;

    }


    /*
     * Compatibility
     */

    if (
        subjects.length === 0 &&
        Array.isArray(
            course.courseSubjects
        )
    ) {

        subjects =
            course.courseSubjects;

    }


    /*
     * Normalize different possible
     * subject representations.
     */

    const normalized = [];


    subjects.forEach(
        subject => {

            let name = "";


            if (
                typeof subject ===
                "string"
            ) {

                name =
                    subject.trim();

            } else if (
                subject &&
                typeof subject ===
                "object"
            ) {

                name =
                    subject.name ||
                    subject.subjectName ||
                    subject.title ||
                    subject.label ||
                    "";

                name =
                    String(name)
                        .trim();

            }


            if (name) {

                normalized.push(
                    name
                );

            }

        }
    );


    /*
     * Remove duplicate subjects.
     */

    const seen =
        new Set();


    return normalized.filter(
        subject => {

            const key =
                subject.toLowerCase();


            if (
                seen.has(key)
            ) {

                return false;

            }


            seen.add(key);

            return true;

        }
    );
}


/* =========================================================
   RENDER SUBJECTS
========================================================= */

function renderSubjects(
    subjects
) {

    subjectsList.innerHTML =
        "";


    if (
        subjects.length === 0
    ) {

        noSubjects.classList.remove(
            "hidden"
        );

        return;
    }


    noSubjects.classList.add(
        "hidden"
    );


    subjects.forEach(
        subject => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "subject-item";


            item.innerHTML = `

                <div class="subject-check">
                    ✓
                </div>

                <div class="subject-name">
                    ${escapeHtml(subject)}
                </div>

            `;


            subjectsList.appendChild(
                item
            );

        }
    );
}


/* =========================================================
   PRICING
========================================================= */

function renderPricing(course) {

    const price =
        getNumber(
            course.crmPrice ??
            course.price ??
            0
        );


    const discount =
        getNumber(
            course.crmDiscount ??
            course.discount ??
            0
        );


    let final =
        course.crmFinalPrice;


    if (
        final === undefined ||
        final === null ||
        final === ""
    ) {

        final =
            price -
            discount;

    }


    final =
        Math.max(
            0,
            getNumber(final)
        );


    originalPrice.textContent =
        formatCurrency(price);


    if (
        discount > 0
    ) {

        discountRow.classList.remove(
            "hidden"
        );


        discountAmount.textContent =
            `- ${formatCurrency(discount)}`;

    } else {

        discountRow.classList.add(
            "hidden"
        );

    }


    finalPrice.textContent =
        formatCurrency(final);


    bottomPrice.textContent =
        formatCurrency(final);
}


/* =========================================================
   UPDATE SUMMARY LANGUAGES
========================================================= */

function updateSummaryLanguages() {

    const values = [
        {
            label: "First Language",
            value: selectedLanguages.first
        },
        {
            label: "Second Language",
            value: selectedLanguages.second
        },
        {
            label: "Third Language",
            value: selectedLanguages.third
        }
    ].filter(
        item =>
            item.value
    );


    summaryLanguageList.innerHTML =
        "";


    if (
        values.length === 0
    ) {

        summaryLanguages.classList.add(
            "hidden"
        );

        return;
    }


    summaryLanguages.classList.remove(
        "hidden"
    );


    values.forEach(
        item => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "summary-language-item";


            row.innerHTML = `

                <span>
                    ${escapeHtml(item.label)}
                </span>

                <strong>
                    ${escapeHtml(item.value)}
                </strong>

            `;


            summaryLanguageList.appendChild(
                row
            );

        }
    );


    updateLanguageOptionAvailability();
}


/* =========================================================
   UPDATE PAY BUTTON
========================================================= */

function updatePayButton() {

    if (!currentCourse) {

        payNowButton.disabled =
            true;

        return;
    }


    const languages =
        getCourseLanguages(
            currentCourse
        );


    let languagesValid =
        true;


    if (
        languages.length > 0
    ) {

        const values = [
            selectedLanguages.first,
            selectedLanguages.second,
            selectedLanguages.third
        ].slice(
            0,
            Math.min(
                languages.length,
                3
            )
        );


        languagesValid =
            values.length ===
                Math.min(
                    languages.length,
                    3
                ) &&

            values.every(
                Boolean
            ) &&

            new Set(values).size ===
                values.length;

    }


    payNowButton.disabled =
        !languagesValid ||
        isPaying;
}


/* =========================================================
   PAYMENT
========================================================= */

payNowButton.addEventListener(
    "click",
    async () => {

        if (
            !currentCourse ||
            isPaying
        ) {

            return;
        }


        const languages =
            getCourseLanguages(
                currentCourse
            );


        if (
            languages.length > 0
        ) {

            const valid =
                validateLanguageSelections(
                    languages
                );


            if (!valid) {

                return;
            }

        }


        const selectedLanguageData =
            getSelectedLanguageData();


        try {

            isPaying =
                true;


            updatePayButton();


            /*
             * Save checkout selection temporarily.
             *
             * The final enrollment/payment
             * should be created by the payment
             * flow/backend after successful payment.
             */

            const checkoutData = {

                crmCourseId:
                    currentCourse.id,

                courseName:
                    currentCourse.crmCourseName ||
                    "",

                firstLanguage:
                    selectedLanguageData.first,

                secondLanguage:
                    selectedLanguageData.second,

                thirdLanguage:
                    selectedLanguageData.third,

                subjects:
                    getCourseSubjects(
                        currentCourse
                    ),

                amount:
                    getFinalPrice(
                        currentCourse
                    )

            };


            sessionStorage.setItem(
                "zenova_checkout",
                JSON.stringify(
                    checkoutData
                )
            );


            /*
             * IMPORTANT:
             *
             * Keep this destination connected
             * to your actual payment page/backend.
             *
             * For now we send the complete
             * checkout data through the URL.
             */

            const params =
                new URLSearchParams();


            params.set(
                "id",
                currentCourse.id
            );


            if (
                selectedLanguageData.first
            ) {

                params.set(
                    "firstLanguage",
                    selectedLanguageData.first
                );

            }


            if (
                selectedLanguageData.second
            ) {

                params.set(
                    "secondLanguage",
                    selectedLanguageData.second
                );

            }


            if (
                selectedLanguageData.third
            ) {

                params.set(
                    "thirdLanguage",
                    selectedLanguageData.third
                );

            }


            /*
             * Change this to your actual
             * payment route when payment
             * gateway is connected.
             */

            window.location.href =
                `../payment/?${params.toString()}`;


        } catch (error) {

            console.error(
                "CHECKOUT PAYMENT ERROR:",
                error
            );


            isPaying =
                false;


            updatePayButton();

            alert(
                "Unable to continue to payment."
            );

        }

    }
);


/* =========================================================
   SELECTED LANGUAGE DATA
========================================================= */

function getSelectedLanguageData() {

    return {

        first:
            selectedLanguages.first ||
            "",

        second:
            selectedLanguages.second ||
            "",

        third:
            selectedLanguages.third ||
            ""

    };
}


/* =========================================================
   FINAL PRICE
========================================================= */

function getFinalPrice(course) {

    const price =
        getNumber(
            course.crmPrice ??
            course.price ??
            0
        );


    const discount =
        getNumber(
            course.crmDiscount ??
            course.discount ??
            0
        );


    if (
        course.crmFinalPrice !==
            undefined &&
        course.crmFinalPrice !==
            null &&
        course.crmFinalPrice !==
            ""
    ) {

        return Math.max(
            0,
            getNumber(
                course.crmFinalPrice
            )
        );

    }


    return Math.max(
        0,
        price - discount
    );
}


/* =========================================================
   NUMBER
========================================================= */

function getNumber(value) {

    const number =
        Number(
            String(value)
                .replace(
                    /[^0-9.-]/g,
                    ""
                )
        );


    return Number.isFinite(number)
        ? number
        : 0;
}


/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(value) {

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(
        Number(value) || 0
    );
}


/* =========================================================
   CLASS
========================================================= */

function formatClass(value) {

    if (!value) {
        return "Course";
    }


    const map = {

        "UNDER_8TH":
            "Under 8th",

        "8TH":
            "8th Standard",

        "9TH":
            "9th Standard",

        "10TH":
            "10th Standard",

        "1ST_PUC":
            "1st PUC",

        "2ND_PUC":
            "2nd PUC"

    };


    return (
        map[
            String(value)
                .trim()
                .toUpperCase()
        ] ||
        String(value)
    );
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
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
   ERROR BACK
========================================================= */

errorBackButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "../batches/";

    }
);


/* =========================================================
   LOADING
========================================================= */

function hideLoading() {

    loadingScreen.classList.add(
        "hidden"
    );


    app.classList.remove(
        "hidden"
    );
}


/* =========================================================
   ERROR
========================================================= */

function showError(
    message
) {

    console.error(
        "ZENOVA CHECKOUT:",
        message
    );


    loadingScreen.classList.add(
        "hidden"
    );


    app.classList.remove(
        "hidden"
    );


    document
        .querySelector(
            ".checkout-content"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .querySelector(
            ".payment-bar"
        )
        ?.classList.add(
            "hidden"
        );


    document
        .querySelector(
            ".bottom-nav"
        )
        ?.classList.add(
            "hidden"
        );


    errorMessage.textContent =
        message;


    errorSection.classList.remove(
        "hidden"
    );
}

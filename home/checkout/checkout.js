/* =========================================================
   ZENOVA EDUCATONS
   NEW CHECKOUT
   ========================================================= */

import {
    auth,
    db
} from "../../firebase/firebase-config.js";


import {
    doc,
    onSnapshot,
    collection,
    addDoc,
    serverTimestamp
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
    New language state.

    Example:

    {
        firstLanguage: "Kannada",
        secondLanguage: "English",
        thirdLanguage: "Hindi"
    }
*/

const selectedLanguages = {

    firstLanguage: "",

    secondLanguage: "",

    thirdLanguage: ""

};



/*
    Languages actually available
    in the CRM course.
*/

let availableLanguages = [];



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

const courseMeta =
    el("courseMeta");

const courseCode =
    el("courseCode");


const languageSection =
    el("languageSection");

const languageSelectors =
    el("languageSelectors");

const languageError =
    el("languageError");


const summaryCourseName =
    el("summaryCourseName");

const summaryClass =
    el("summaryClass");

const summaryBoardRow =
    el("summaryBoardRow");

const summaryBoard =
    el("summaryBoard");


const summaryFirstLanguageRow =
    el("summaryFirstLanguageRow");

const summaryFirstLanguage =
    el("summaryFirstLanguage");


const summarySecondLanguageRow =
    el("summarySecondLanguageRow");

const summarySecondLanguage =
    el("summarySecondLanguage");


const summaryThirdLanguageRow =
    el("summaryThirdLanguageRow");

const summaryThirdLanguage =
    el("summaryThirdLanguage");


const subjectsSection =
    el("subjectsSection");

const subjectsList =
    el("subjectsList");


const originalPrice =
    el("originalPrice");

const discountRow =
    el("discountRow");

const discountAmount =
    el("discountAmount");

const finalPrice =
    el("finalPrice");


const paymentBar =
    el("paymentBar");

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
   COURSE ID
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
    user => {

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


        startCourseListener(courseId);

    }
);



/* =========================================================
   COURSE REALTIME LISTENER
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


                const data =
                    snapshot.data();


                currentCourse = {

                    id: snapshot.id,

                    ...data

                };


                /*
                    CRM is the source of truth.
                */

                if (
                    currentCourse.crmActive === false
                ) {

                    showError(
                        "This course is currently unavailable."
                    );

                    return;
                }


                renderCheckout(
                    currentCourse
                );


                hideLoading();

            },

            error => {

                console.error(
                    "Zenova Checkout Firebase Error:",
                    error
                );


                showError(
                    getReadableError(error)
                );

            }

        );

}



/* =========================================================
   RENDER CHECKOUT
========================================================= */

function renderCheckout(course) {

    const name =
        course.crmCourseName ||
        "Zenova Course";


    const className =
        displayClass(
            course.crmClass || ""
        );


    const board =
        course.crmBoard ||
        course.board ||
        "";


    const code =
        course.crmCourseCode ||
        "";


    const languages =
        getCourseLanguages(course);


    availableLanguages =
        languages;


    /*
        COURSE CARD
    */

    setText(
        courseName,
        name
    );


    setText(
        courseMeta,
        buildCourseMeta(
            className,
            board
        )
    );


    setText(
        courseCode,
        code
            ? `Course Code: ${code}`
            : ""
    );


    /*
        COURSE IMAGE
    */

    loadCourseImage(course);


    /*
        COURSE SUMMARY
    */

    setText(
        summaryCourseName,
        name
    );


    setText(
        summaryClass,
        className || "—"
    );


    if (board) {

        summaryBoardRow
            ?.classList
            .remove("hidden");

        setText(
            summaryBoard,
            board
        );

    } else {

        summaryBoardRow
            ?.classList
            .add("hidden");

    }



    /*
        LANGUAGES
    */

    setupLanguageSelectors(
        languages
    );


    /*
        SUBJECTS
    */

    renderSubjects(
        course.subjects
    );


    /*
        PRICE
    */

    const pricing =
        calculatePricing(course);


    renderPricing(
        pricing
    );


    setText(
        bottomPrice,
        formatPrice(
            pricing.finalPrice
        )
    );


    updatePayButton(
        pricing.finalPrice
    );


    paymentBar
        ?.classList
        .remove("hidden");

}



/* =========================================================
   COURSE LANGUAGES
========================================================= */

function getCourseLanguages(course) {

    let languages = [];


    /*
        NEW CRM STRUCTURE

        mediums: [
            "Kannada",
            "English",
            "Hindi"
        ]
    */

    if (
        Array.isArray(course.mediums)
    ) {

        languages =
            course.mediums;

    }


    /*
        Backward compatibility
        with existing data.
    */

    else if (
        typeof course.crmMedium === "string"
    ) {

        languages =
            course.crmMedium
                .split(",")
                .map(
                    item =>
                        item.trim()
                );

    }


    else if (
        Array.isArray(course.crmMediums)
    ) {

        languages =
            course.crmMediums;

    }


    /*
        CLEAN + DEDUPLICATE

        This is important because
        the same language should never
        appear twice in checkout.
    */

    const unique = [];

    const seen =
        new Set();


    languages.forEach(
        language => {

            const clean =
                String(language)
                    .trim();


            if (!clean) {
                return;
            }


            const key =
                clean.toLowerCase();


            if (
                seen.has(key)
            ) {
                return;
            }


            seen.add(key);

            unique.push(clean);

        }
    );


    return unique;

}



/* =========================================================
   LANGUAGE SELECTORS
========================================================= */

function setupLanguageSelectors(
    languages
) {

    languageSelectors.innerHTML = "";


    /*
        Reset previous selection
        whenever CRM course changes.
    */

    selectedLanguages.firstLanguage = "";

    selectedLanguages.secondLanguage = "";

    selectedLanguages.thirdLanguage = "";


    hideLanguageSummary();


    /*
        No languages configured.
    */

    if (!languages.length) {

        languageSection
            ?.classList
            .add("hidden");

        updatePayButton();

        return;
    }


    /*
        Only one language.

        No need to make the student
        select something unnecessarily.

        Automatically assign it
        to First Language.
    */

    if (languages.length === 1) {

        selectedLanguages.firstLanguage =
            languages[0];


        languageSection
            ?.classList
            .add("hidden");


        updateLanguageSummary();

        return;
    }


    /*
        Two or three languages.

        Show the appropriate selectors.
    */

    languageSection
        ?.classList
        .remove("hidden");


    createLanguageSelector(
        "firstLanguage",
        "First Language",
        languages
    );


    /*
        Second language exists when
        CRM has at least two languages.
    */

    if (languages.length >= 2) {

        createLanguageSelector(
            "secondLanguage",
            "Second Language",
            languages
        );

    }


    /*
        Third language exists only when
        CRM has at least three languages.
    */

    if (languages.length >= 3) {

        createLanguageSelector(
            "thirdLanguage",
            "Third Language",
            languages
        );

    }


    updatePayButton();

}



/* =========================================================
   CREATE LANGUAGE SELECTOR
========================================================= */

function createLanguageSelector(
    key,
    label,
    languages
) {

    const box =
        document.createElement("div");


    box.className =
        "language-box";


    const top =
        document.createElement("div");


    top.className =
        "language-box-top";


    const number =
        document.createElement("span");


    number.className =
        "language-number";


    number.textContent =
        label;


    const required =
        document.createElement("span");


    required.className =
        "language-required";


    required.textContent =
        "Required";


    top.appendChild(number);

    top.appendChild(required);


    const wrapper =
        document.createElement("div");


    wrapper.className =
        "language-select-wrapper";


    const select =
        document.createElement("select");


    select.className =
        "language-select";


    select.dataset.languageKey =
        key;


    /*
        Placeholder
    */

    const placeholder =
        document.createElement("option");


    placeholder.value = "";

    placeholder.textContent =
        `Select ${label}`;


    placeholder.disabled =
        false;


    placeholder.selected =
        true;


    select.appendChild(
        placeholder
    );


    /*
        Language options
    */

    languages.forEach(
        language => {

            const option =
                document.createElement("option");


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

            handleLanguageChange(
                key,
                select.value
            );

        }
    );


    wrapper.appendChild(
        select
    );


    box.appendChild(
        top
    );


    box.appendChild(
        wrapper
    );


    languageSelectors.appendChild(
        box
    );

}



/* =========================================================
   LANGUAGE CHANGE
========================================================= */

function handleLanguageChange(
    key,
    value
) {

    clearLanguageError();


    /*
        Check if another selector
        already has the same language.
    */

    const duplicate =
        Object.entries(
            selectedLanguages
        ).some(
            ([otherKey, otherValue]) => {

                return (
                    otherKey !== key &&
                    otherValue &&
                    otherValue.toLowerCase() ===
                    value.toLowerCase()
                );

            }
        );


    if (duplicate) {

        showLanguageError(
            "The same language cannot be selected more than once."
        );


        /*
            Reset the current selector.
        */

        selectedLanguages[key] =
            "";


        const currentSelect =
            document.querySelector(
                `select[data-language-key="${key}"]`
            );


        if (currentSelect) {

            currentSelect.value =
                "";

        }


        updateLanguageOptionStates();

        updateLanguageSummary();

        updatePayButton();

        return;
    }


    selectedLanguages[key] =
        value;


    updateLanguageOptionStates();

    updateLanguageSummary();

    updatePayButton();

}



/* =========================================================
   DISABLE DUPLICATE OPTIONS
========================================================= */

function updateLanguageOptionStates() {

    const selects =
        document.querySelectorAll(
            ".language-select"
        );


    selects.forEach(
        select => {

            const currentKey =
                select.dataset.languageKey;


            const currentValue =
                selectedLanguages[currentKey];


            Array.from(
                select.options
            ).forEach(
                option => {

                    if (!option.value) {

                        option.disabled =
                            false;

                        return;
                    }


                    const selectedElsewhere =
                        Object.entries(
                            selectedLanguages
                        ).some(
                            ([key, value]) => {

                                return (
                                    key !== currentKey &&
                                    value &&
                                    value.toLowerCase() ===
                                    option.value.toLowerCase()
                                );

                            }
                        );


                    option.disabled =
                        selectedElsewhere;


                    /*
                        Keep current selection
                        enabled.
                    */

                    if (
                        currentValue &&
                        option.value.toLowerCase() ===
                        currentValue.toLowerCase()
                    ) {

                        option.disabled =
                            false;

                    }

                }
            );

        }
    );

}



/* =========================================================
   LANGUAGE VALIDATION
========================================================= */

function validateLanguages() {

    const count =
        availableLanguages.length;


    /*
        0 languages
        = nothing to validate.
    */

    if (count === 0) {

        return true;

    }


    /*
        One language
        = automatically selected.
    */

    if (count === 1) {

        return Boolean(
            selectedLanguages.firstLanguage
        );

    }


    /*
        Two languages.
    */

    if (count === 2) {

        if (
            !selectedLanguages.firstLanguage ||
            !selectedLanguages.secondLanguage
        ) {

            showLanguageError(
                "Please select your First Language and Second Language."
            );

            return false;

        }

    }


    /*
        Three languages.
    */

    if (count >= 3) {

        if (
            !selectedLanguages.firstLanguage ||
            !selectedLanguages.secondLanguage ||
            !selectedLanguages.thirdLanguage
        ) {

            showLanguageError(
                "Please select your First, Second and Third Language."
            );

            return false;

        }

    }


    /*
        No duplicate.
    */

    const values =
        Object.values(
            selectedLanguages
        )
        .filter(Boolean)
        .map(
            value =>
                value.toLowerCase()
        );


    if (
        new Set(values).size !==
        values.length
    ) {

        showLanguageError(
            "Each language must be different."
        );

        return false;

    }


    return true;

}



/* =========================================================
   LANGUAGE SUMMARY
========================================================= */

function updateLanguageSummary() {

    updateSummaryRow(
        summaryFirstLanguageRow,
        summaryFirstLanguage,
        selectedLanguages.firstLanguage
    );


    updateSummaryRow(
        summarySecondLanguageRow,
        summarySecondLanguage,
        selectedLanguages.secondLanguage
    );


    updateSummaryRow(
        summaryThirdLanguageRow,
        summaryThirdLanguage,
        selectedLanguages.thirdLanguage
    );

}


function updateSummaryRow(
    row,
    valueElement,
    value
) {

    if (!row || !valueElement) {
        return;
    }


    if (value) {

        row.classList.remove(
            "hidden"
        );

        valueElement.textContent =
            value;

    } else {

        row.classList.add(
            "hidden"
        );

        valueElement.textContent =
            "—";

    }

}


function hideLanguageSummary() {

    [
        summaryFirstLanguageRow,
        summarySecondLanguageRow,
        summaryThirdLanguageRow
    ]
    .forEach(
        row => {

            row?.classList.add(
                "hidden"
            );

        }
    );

}



/* =========================================================
   LANGUAGE ERROR
========================================================= */

function showLanguageError(
    message
) {

    if (!languageError) {
        return;
    }


    languageError.textContent =
        message;


    languageError.classList.remove(
        "hidden"
    );

}


function clearLanguageError() {

    languageError
        ?.classList
        .add("hidden");

}



/* =========================================================
   SUBJECTS
========================================================= */

function renderSubjects(
    subjects
) {

    subjectsList.innerHTML = "";


    if (
        !Array.isArray(subjects) ||
        !subjects.length
    ) {

        subjectsSection
            ?.classList
            .add("hidden");

        return;
    }


    /*
        Defensive deduplication.

        If old Firestore data contains
        the same subject more than once,
        Checkout still displays it only once.
    */

    const uniqueSubjects = [];

    const seen =
        new Set();


    subjects.forEach(
        subject => {

            const name =
                String(subject)
                    .trim();


            if (!name) {
                return;
            }


            const key =
                name.toLowerCase();


            if (
                seen.has(key)
            ) {
                return;
            }


            seen.add(key);

            uniqueSubjects.push(name);

        }
    );


    uniqueSubjects.forEach(
        subject => {

            const chip =
                document.createElement("div");


            chip.className =
                "subject-chip";


            chip.textContent =
                subject;


            subjectsList.appendChild(
                chip
            );

        }
    );


    subjectsSection
        ?.classList
        .remove("hidden");

}



/* =========================================================
   IMAGE
========================================================= */

function loadCourseImage(course) {

    const imageUrl =
        course.crmImageUrl ||
        course.imageUrl ||
        "";


    if (!imageUrl) {

        showImageFallback();

        return;
    }


    courseImage
        ?.classList
        .remove("hidden");


    courseImageFallback
        ?.classList
        .add("hidden");


    courseImage.src =
        imageUrl;

}


courseImage?.addEventListener(
    "error",
    showImageFallback
);


function showImageFallback() {

    courseImage
        ?.classList
        .add("hidden");


    courseImageFallback
        ?.classList
        .remove("hidden");

}



/* =========================================================
   PRICING
========================================================= */

function calculatePricing(course) {

    const original =
        toNumber(
            course.crmPrice
        );


    let final =
        toNumber(
            course.crmFinalPrice
        );


    /*
        If CRM final price is not
        available, calculate it.
    */

    if (
        !Number.isFinite(final) ||
        final < 0
    ) {

        const discount =
            toNumber(
                course.crmDiscount
            );


        final =
            Math.max(
                0,
                original - discount
            );

    }


    /*
        Never allow final price
        above original price.
    */

    final =
        Math.min(
            final,
            original
        );


    const discount =
        Math.max(
            0,
            original - final
        );


    return {

        originalPrice: original,

        discountAmount: discount,

        finalPrice: final

    };

}



/* =========================================================
   RENDER PRICING
========================================================= */

function renderPricing(
    pricing
) {

    setText(
        originalPrice,
        formatPrice(
            pricing.originalPrice
        )
    );


    if (
        pricing.discountAmount > 0
    ) {

        discountRow
            ?.classList
            .remove("hidden");


        setText(
            discountAmount,
            "-" +
            formatPrice(
                pricing.discountAmount
            )
        );

    } else {

        discountRow
            ?.classList
            .add("hidden");

    }


    setText(
        finalPrice,
        formatPrice(
            pricing.finalPrice
        )
    );

}



/* =========================================================
   PAY BUTTON
========================================================= */

function updatePayButton(
    price = null
) {

    if (!payNowButton) {
        return;
    }


    const languagesValid =
        validateLanguagesSilently();


    payNowButton.disabled =
        !languagesValid ||
        isPaying;


    if (price !== null) {

        setText(
            bottomPrice,
            formatPrice(price)
        );

    }

}



/* =========================================================
   SILENT LANGUAGE VALIDATION
========================================================= */

function validateLanguagesSilently() {

    const count =
        availableLanguages.length;


    if (count <= 1) {

        return Boolean(
            selectedLanguages.firstLanguage
        );

    }


    if (
        !selectedLanguages.firstLanguage
    ) {

        return false;

    }


    if (
        count >= 2 &&
        !selectedLanguages.secondLanguage
    ) {

        return false;

    }


    if (
        count >= 3 &&
        !selectedLanguages.thirdLanguage
    ) {

        return false;

    }


    const values =
        Object.values(
            selectedLanguages
        )
        .filter(Boolean)
        .map(
            value =>
                value.toLowerCase()
        );


    return (
        new Set(values).size ===
        values.length
    );

}



/* =========================================================
   PAY NOW
========================================================= */

payNowButton?.addEventListener(
    "click",
    async () => {

        if (isPaying) {
            return;
        }


        if (!currentUser) {

            window.location.href =
                "../login/";

            return;
        }


        /*
            Validate language selection.
        */

        if (
            !validateLanguages()
        ) {

            return;
        }


        if (!currentCourse) {

            showError(
                "Course information is unavailable."
            );

            return;
        }


        const pricing =
            calculatePricing(
                currentCourse
            );


        isPaying = true;


        payNowButton.disabled =
            true;


        payNowButton.innerHTML =
            "PROCESSING...";


        try {

            /*
                Prepare the exact language
                structure that will follow
                the student into enrollment
                and Study.
            */

            const languageSelection = {

                firstLanguage:
                    selectedLanguages.firstLanguage ||
                    "",

                secondLanguage:
                    selectedLanguages.secondLanguage ||
                    "",

                thirdLanguage:
                    selectedLanguages.thirdLanguage ||
                    ""

            };


            /*
                Save checkout information
                temporarily.

                Payment gateway can then
                continue from here.
            */

            const checkoutData = {

                courseId:
                    currentCourse.id,

                courseName:
                    currentCourse.crmCourseName ||
                    "",

                className:
                    currentCourse.crmClass ||
                    "",

                board:
                    currentCourse.crmBoard ||
                    "",

                languages:
                    languageSelection,

                price:
                    pricing.finalPrice,

                originalPrice:
                    pricing.originalPrice,

                discount:
                    pricing.discountAmount,

                createdAt:
                    Date.now()

            };


            sessionStorage.setItem(
                "zenova_checkout",
                JSON.stringify(
                    checkoutData
                )
            );


            /*
                ------------------------------------------------
                IMPORTANT
                ------------------------------------------------

                Payment gateway can be connected here.

                For FREE courses we can immediately
                create/access the enrollment.

                For PAID courses the payment gateway
                should verify payment on the backend
                before creating APPROVED enrollment.
            */

            if (
                pricing.finalPrice <= 0
            ) {

                await createFreeEnrollment(
                    checkoutData
                );


                window.location.href =
                    `../study/?courseId=${encodeURIComponent(
                        currentCourse.id
                    )}`;

                return;

            }


            /*
                Temporary payment route.

                Replace this with the actual
                payment gateway page when connected.
            */

            window.location.href =
                `../payment/?courseId=${encodeURIComponent(
                    currentCourse.id
                )}`;

        }

        catch (error) {

            console.error(
                "Zenova Checkout Payment Error:",
                error
            );


            showLanguageError(
                "Unable to continue checkout. Please try again."
            );


            isPaying = false;


            payNowButton.disabled =
                false;


            payNowButton.innerHTML =
                'PAY NOW <span>→</span>';

        }

    }
);



/* =========================================================
   FREE ENROLLMENT
========================================================= */

async function createFreeEnrollment(
    checkoutData
) {

    /*
        This is intentionally kept simple.

        The final production version should
        preferably create enrollments through
        a trusted backend/Cloud Function so
        students cannot manufacture their own
        paid enrollments.
    */


    const enrollment = {

        studentUid:
            currentUser.uid,

        crmCourseId:
            checkoutData.courseId,

        courseName:
            checkoutData.courseName,

        className:
            checkoutData.className,

        board:
            checkoutData.board,

        firstLanguage:
            checkoutData.languages.firstLanguage,

        secondLanguage:
            checkoutData.languages.secondLanguage,

        thirdLanguage:
            checkoutData.languages.thirdLanguage,

        status:
            "ACTIVE",

        paymentStatus:
            "FREE",

        price:
            0,

        source:
            "STUDENT_CHECKOUT",

        createdAt:
            serverTimestamp(),

        updatedAt:
            serverTimestamp()

    };


    await addDoc(
        collection(
            db,
            "studentEnrollments"
        ),
        enrollment
    );

}



/* =========================================================
   BACK BUTTON
========================================================= */

backButton?.addEventListener(
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



/* =========================================================
   NOTIFICATIONS
========================================================= */

notificationButton?.addEventListener(
    "click",
    () => {

        window.location.href =
            "../notifications/";

    }
);



/* =========================================================
   ERROR BACK
========================================================= */

errorBackButton?.addEventListener(
    "click",
    () => {

        window.location.href =
            "../batches/";

    }
);



/* =========================================================
   UI HELPERS
========================================================= */

function hideLoading() {

    loadingScreen
        ?.classList
        .add("hidden");


    app
        ?.classList
        .remove("hidden");

}


function showError(
    message
) {

    loadingScreen
        ?.classList
        .add("hidden");


    app
        ?.classList
        .remove("hidden");


    errorSection
        ?.classList
        .remove("hidden");


    setText(
        errorMessage,
        message
    );


    languageSection
        ?.classList
        .add("hidden");


    paymentBar
        ?.classList
        .add("hidden");

}


function setText(
    element,
    value
) {

    if (!element) {
        return;
    }


    element.textContent =
        value ?? "";

}


function toNumber(
    value
) {

    const number =
        Number(value);


    return Number.isFinite(number)
        ? number
        : 0;

}


function formatPrice(
    value
) {

    const number =
        toNumber(value);


    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(number);

}


function displayClass(
    value
) {

    if (!value) {
        return "";
    }


    const map = {

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
        map[value] ||
        String(value)
    );

}


function buildCourseMeta(
    className,
    board
) {

    const parts = [];


    if (className) {

        parts.push(
            className
        );

    }


    if (board) {

        parts.push(
            board
        );

    }


    return parts.length
        ? parts.join(" • ")
        : "Course details";

}


function getReadableError(
    error
) {

    if (!error) {

        return "Something went wrong.";

    }


    if (
        error.code ===
        "permission-denied"
    ) {

        return (
            "You do not have permission to access this course."
        );

    }


    if (
        error.code ===
        "unavailable"
    ) {

        return (
            "Network unavailable. Please try again."
        );

    }


    return (
        error.message ||
        "Unable to load the course."
    );

}

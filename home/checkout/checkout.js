/* =========================================================
   ZENOVA EDUCATIONS
   CHECKOUT
   =========================================================

   SOURCE OF TRUTH
   ----------------
   Course:
       crmCourses/{courseId}

   Student:
       students/{uid}

   HANDOFF TO PAYMENT
   ------------------
   sessionStorage:
       zenova_checkout

   URL:
       ../payment/?courseId={courseId}

   LANGUAGE STRUCTURE
   ------------------
   firstLanguage
   secondLanguage
   thirdLanguage

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

let unsubscribeCourse = null;

let isProcessing = false;

let selectedLanguages = {
    first: "",
    second: "",
    third: ""
};


/* =========================================================
   ELEMENT HELPERS
========================================================= */

function $(id) {
    return document.getElementById(id);
}


/* =========================================================
   ELEMENTS
========================================================= */

const loadingScreen =
    $("loadingScreen");

const app =
    $("app");

const courseImage =
    $("courseImage");

const courseImageFallback =
    $("courseImageFallback");

const courseName =
    $("courseName");

const courseClass =
    $("courseClass");

const courseMedium =
    $("courseMedium");

const courseCode =
    $("courseCode");

const courseDescription =
    $("courseDescription");

const originalPrice =
    $("originalPrice");

const coursePrice =
    $("coursePrice");

const discountRow =
    $("discountRow");

const discountAmount =
    $("discountAmount");

const finalPrice =
    $("finalPrice");

const bottomPrice =
    $("bottomPrice");

const payNowButton =
    $("payNowButton");

const languageSection =
    $("languageSection");

const languageOptions =
    $("languageOptions");

const summaryLanguageRow =
    $("summaryLanguageRow");

const summaryLanguage =
    $("summaryLanguage");

const backButton =
    $("backButton");

const notificationButton =
    $("notificationButton");

const errorSection =
    $("errorSection");

const errorMessage =
    $("errorMessage");

const errorBackButton =
    $("errorBackButton");

const paymentBar =
    $("paymentBar");


/* =========================================================
   AUTH START
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "../login/";

            return;
        }


        currentUser =
            user;


        const courseId =
            getCourseId();


        if (!courseId) {

            showError(
                "Course information is missing. Please return to Batch Details."
            );

            return;
        }


        try {

            await loadStudent(
                user.uid
            );


            startCourseListener(
                courseId
            );

        } catch (error) {

            console.error(
                "CHECKOUT START ERROR:",
                error
            );

            showError(
                "Unable to load checkout. Please try again."
            );

        }

    }
);


/* =========================================================
   COURSE ID
   ---------------------------------------------------------
   Supports both:
       ?id=
       ?courseId=
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
   ---------------------------------------------------------
   Student-facing profile is:
       students/{uid}
========================================================= */

async function loadStudent(uid) {

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


    if (
        snapshot.exists()
    ) {

        currentStudent =
            snapshot.data();

    } else {

        currentStudent = {};

    }

}


/* =========================================================
   CRM COURSE LISTENER
   ---------------------------------------------------------
   IMPORTANT:

   Checkout NEVER trusts course information
   coming from the previous page.

   It uses the course ID only to read:
       crmCourses/{courseId}

   Therefore Admin changes to price/course information
   are reflected here.
========================================================= */

function startCourseListener(
    courseId
) {

    if (
        unsubscribeCourse
    ) {

        unsubscribeCourse();

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

            (snapshot) => {

                if (
                    !snapshot.exists()
                ) {

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


                console.log(
                    "CRM COURSE:",
                    currentCourse
                );


                renderCheckout();

            },

            (error) => {

                console.error(
                    "CRM COURSE LISTENER ERROR:",
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

    if (
        !currentCourse
    ) {

        return;

    }


    const name =
        currentCourse.crmCourseName ||
        currentCourse.name ||
        currentCourse.title ||
        "Zenova Course";


    const className =
        formatClass(
            currentCourse.crmClass ||
            ""
        );


    const medium =
        getCourseMedium();


    const code =
        currentCourse.crmCourseCode ||
        "";


    const description =
        currentCourse.crmDescription ||
        currentCourse.description ||
        "";


    /* -----------------------------------------------------
       BASIC COURSE INFORMATION
    ----------------------------------------------------- */

    setText(
        courseName,
        name
    );


    setText(
        courseClass,
        className || "—"
    );


    setText(
        courseMedium,
        medium || "—"
    );


    setText(
        courseCode,
        code
    );


    if (
        courseDescription
    ) {

        setText(
            courseDescription,
            description
        );

        if (!description) {

            courseDescription.classList.add(
                "hidden"
            );

        } else {

            courseDescription.classList.remove(
                "hidden"
            );

        }

    }


    /* -----------------------------------------------------
       IMAGE
    ----------------------------------------------------- */

    renderCourseImage();


    /* -----------------------------------------------------
       PRICE
    ----------------------------------------------------- */

    const pricing =
        calculatePricing(
            currentCourse
        );


    renderPricing(
        pricing
    );


    /* -----------------------------------------------------
       LANGUAGES
    ----------------------------------------------------- */

    renderLanguageSelection();


    /* -----------------------------------------------------
       PAY BUTTON
    ----------------------------------------------------- */

    updatePayButton(
        pricing.finalPrice
    );


    hideLoader();

}


/* =========================================================
   GET MEDIUM
   ---------------------------------------------------------
   CRM stores:
       mediums: [...]
       crmMedium: "Kannada, English"
========================================================= */

function getCourseMedium() {

    if (
        Array.isArray(
            currentCourse?.mediums
        )
    ) {

        return currentCourse.mediums
            .filter(Boolean)
            .map(
                item =>
                    String(item).trim()
            )
            .filter(Boolean)
            .join(", ");

    }


    return String(
        currentCourse?.crmMedium ||
        currentCourse?.medium ||
        ""
    ).trim();

}


/* =========================================================
   COURSE IMAGE
========================================================= */

function renderCourseImage() {

    if (
        !courseImage
    ) {

        return;

    }


    const imageUrl =
        currentCourse.crmImageUrl ||
        currentCourse.imageUrl ||
        currentCourse.courseImageUrl ||
        "";


    if (!imageUrl) {

        showImageFallback();

        return;

    }


    courseImage.classList.remove(
        "hidden"
    );


    if (
        courseImageFallback
    ) {

        courseImageFallback.classList.add(
            "hidden"
        );

    }


    courseImage.src =
        imageUrl;


    courseImage.onerror =
        () => {

            showImageFallback();

        };

}


/* =========================================================
   IMAGE FALLBACK
========================================================= */

function showImageFallback() {

    if (
        courseImage
    ) {

        courseImage.classList.add(
            "hidden"
        );

    }


    if (
        courseImageFallback
    ) {

        courseImageFallback.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   PRICING
========================================================= */

function calculatePricing(
    course
) {

    let price =
        numberValue(
            course.crmPrice
        );


    let discount =
        numberValue(
            course.crmDiscount
        );


    let total =
        numberValue(
            course.crmFinalPrice
        );


    const courseType =
        String(
            course.courseType ||
            course.type ||
            ""
        )
            .toUpperCase();


    /* FREE COURSE */

    if (
        courseType === "FREE" ||
        course.isPaid === false
    ) {

        return {

            price: 0,

            discount: 0,

            finalPrice: 0

        };

    }


    /* DISCOUNT CANNOT EXCEED PRICE */

    if (
        discount > price
    ) {

        discount =
            price;

    }


    /* CALCULATE FINAL */

    if (
        total <= 0 &&
        price > 0
    ) {

        total =
            Math.max(
                0,
                price - discount
            );

    }


    if (
        price <= 0 &&
        total > 0
    ) {

        price =
            total;

        discount =
            0;

    }


    return {

        price,

        discount,

        finalPrice:
            Math.max(
                0,
                total
            )

    };

}


/* =========================================================
   RENDER PRICING
========================================================= */

function renderPricing(
    pricing
) {

    if (
        originalPrice
    ) {

        originalPrice.textContent =
            pricing.finalPrice <= 0
                ? "Free"
                : formatPrice(
                    pricing.price
                );

    }


    if (
        coursePrice
    ) {

        coursePrice.textContent =
            pricing.finalPrice <= 0
                ? "Free"
                : formatPrice(
                    pricing.price
                );

    }


    if (
        discountRow &&
        discountAmount
    ) {

        if (
            pricing.discount > 0
        ) {

            setText(
                discountAmount,
                "-" +
                formatPrice(
                    pricing.discount
                )
            );


            discountRow.classList.remove(
                "hidden"
            );

        } else {

            discountRow.classList.add(
                "hidden"
            );

        }

    }


    if (
        finalPrice
    ) {

        finalPrice.textContent =
            pricing.finalPrice > 0
                ? formatPrice(
                    pricing.finalPrice
                )
                : "Free";

    }


    if (
        bottomPrice
    ) {

        bottomPrice.textContent =
            pricing.finalPrice > 0
                ? formatPrice(
                    pricing.finalPrice
                )
                : "Free";

    }

}


/* =========================================================
   LANGUAGE SOURCE
   ---------------------------------------------------------
   CRM source:

       mediums: [...]

   Example:
       ["Kannada", "English", "Hindi"]

   Duplicate values are removed.
========================================================= */

function getAvailableLanguages() {

    if (
        !currentCourse
    ) {

        return [];

    }


    let languages = [];


    if (
        Array.isArray(
            currentCourse.mediums
        )
    ) {

        languages =
            currentCourse.mediums
                .map(
                    value =>
                        String(
                            value || ""
                        ).trim()
                )
                .filter(Boolean);

    }


    /* fallback */

    if (
        languages.length === 0 &&
        currentCourse.crmMedium
    ) {

        languages =
            String(
                currentCourse.crmMedium
            )
                .split(",")
                .map(
                    value =>
                        value.trim()
                )
                .filter(Boolean);

    }


    /* REMOVE DUPLICATES */

    const seen =
        new Set();


    return languages.filter(
        language => {

            const key =
                language.toLowerCase();


            if (
                seen.has(key)
            ) {

                return false;

            }


            seen.add(
                key
            );


            return true;

        }
    );

}


/* =========================================================
   LANGUAGE SELECTION UI
========================================================= */

function renderLanguageSelection() {

    if (
        !languageSection ||
        !languageOptions
    ) {

        console.warn(
            "Language section not found in Checkout HTML."
        );

        return;

    }


    const languages =
        getAvailableLanguages();


    languageOptions.innerHTML =
        "";


    /*
     * No languages configured.
     */

    if (
        languages.length === 0
    ) {

        languageSection.classList.add(
            "hidden"
        );

        return;

    }


    languageSection.classList.remove(
        "hidden"
    );


    /* -----------------------------------------------------
       CREATE THREE SELECTORS
    ----------------------------------------------------- */

    const first =
        createLanguageField(
            "firstLanguage",
            "First Language",
            languages
        );


    const second =
        createLanguageField(
            "secondLanguage",
            "Second Language",
            languages
        );


    const third =
        createLanguageField(
            "thirdLanguage",
            "Third Language",
            languages
        );


    languageOptions.appendChild(
        first.wrapper
    );


    languageOptions.appendChild(
        second.wrapper
    );


    languageOptions.appendChild(
        third.wrapper
    );


    /* -----------------------------------------------------
       RESTORE PREVIOUS DATA
    ----------------------------------------------------- */

    first.select.value =
        selectedLanguages.first || "";


    second.select.value =
        selectedLanguages.second || "";


    third.select.value =
        selectedLanguages.third || "";


    /* -----------------------------------------------------
       CHANGE EVENTS
    ----------------------------------------------------- */

    first.select.addEventListener(
        "change",
        () => {

            selectedLanguages.first =
                first.select.value;

            updateLanguageAvailability(
                first.select,
                second.select,
                third.select
            );

            updateLanguageSummary();

            saveDraftCheckout();

        }
    );


    second.select.addEventListener(
        "change",
        () => {

            selectedLanguages.second =
                second.select.value;

            updateLanguageAvailability(
                first.select,
                second.select,
                third.select
            );

            updateLanguageSummary();

            saveDraftCheckout();

        }
    );


    third.select.addEventListener(
        "change",
        () => {

            selectedLanguages.third =
                third.select.value;

            updateLanguageAvailability(
                first.select,
                second.select,
                third.select
            );

            updateLanguageSummary();

            saveDraftCheckout();

        }
    );


    updateLanguageAvailability(
        first.select,
        second.select,
        third.select
    );


    updateLanguageSummary();

}


/* =========================================================
   CREATE LANGUAGE FIELD
========================================================= */

function createLanguageField(
    id,
    label,
    languages
) {

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "checkout-language-field";


    const labelElement =
        document.createElement(
            "label"
        );


    labelElement.htmlFor =
        id;


    labelElement.textContent =
        label;


    const select =
        document.createElement(
            "select"
        );


    select.id =
        id;


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
   PREVENT DUPLICATE LANGUAGES
========================================================= */

function updateLanguageAvailability(
    first,
    second,
    third
) {

    const selects =
        [
            first,
            second,
            third
        ];


    const selectedValues =
        selects
            .map(
                select =>
                    select.value
            )
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


                        const usedElsewhere =
                            selectedValues.includes(
                                option.value
                            ) &&
                            select.value !==
                                option.value;


                        option.disabled =
                            usedElsewhere;

                    }
                );

        }
    );

}


/* =========================================================
   LANGUAGE SUMMARY
========================================================= */

function updateLanguageSummary() {

    const languages =
        [

            selectedLanguages.first,

            selectedLanguages.second,

            selectedLanguages.third

        ]
            .filter(Boolean);


    if (
        !summaryLanguageRow ||
        !summaryLanguage
    ) {

        return;

    }


    if (
        languages.length === 0
    ) {

        summaryLanguageRow.classList.add(
            "hidden"
        );

        summaryLanguage.textContent =
            "—";

        return;

    }


    summaryLanguageRow.classList.remove(
        "hidden"
    );


    summaryLanguage.textContent =
        languages.join(
            " • "
        );

}


/* =========================================================
   SAVE DRAFT
   ---------------------------------------------------------
   This is saved whenever the student changes language.

   It means refresh/back/forward does not lose selections.
========================================================= */

function saveDraftCheckout() {

    if (
        !currentCourse ||
        !currentUser
    ) {

        return;

    }


    const pricing =
        calculatePricing(
            currentCourse
        );


    const checkoutData =
        createCheckoutData(
            pricing
        );


    sessionStorage.setItem(
        "zenova_checkout",
        JSON.stringify(
            checkoutData
        )
    );

}


/* =========================================================
   CREATE COMPLETE CHECKOUT DATA
========================================================= */

function createCheckoutData(
    pricing
) {

    const languages =
        [

            selectedLanguages.first,

            selectedLanguages.second,

            selectedLanguages.third

        ]
            .filter(Boolean);


    return {

        /* -----------------------------------------------
           COURSE
        ----------------------------------------------- */

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
            getCourseMedium(),


        /* -----------------------------------------------
           LANGUAGES
        ----------------------------------------------- */

        firstLanguage:
            selectedLanguages.first ||
            "",

        secondLanguage:
            selectedLanguages.second ||
            "",

        thirdLanguage:
            selectedLanguages.third ||
            "",

        selectedLanguages: {

            first:
                selectedLanguages.first ||
                "",

            second:
                selectedLanguages.second ||
                "",

            third:
                selectedLanguages.third ||
                ""

        },

        selectedLanguageList:
            languages,


        /*
         * Compatibility field for the CURRENT
         * Payment page.
         *
         * Payment currently reads:
         * checkoutData.selectedLanguage
         */

        selectedLanguage:
            languages.join(
                " • "
            ),


        /* -----------------------------------------------
           PRICING
        ----------------------------------------------- */

        price:
            pricing.price,

        discount:
            pricing.discount,

        finalPrice:
            pricing.finalPrice,


        /* -----------------------------------------------
           STUDENT
        ----------------------------------------------- */

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


        /* -----------------------------------------------
           TIMESTAMP
        ----------------------------------------------- */

        createdAt:
            Date.now()

    };

}


/* =========================================================
   PAY BUTTON
========================================================= */

function updatePayButton(
    amount
) {

    if (
        !payNowButton
    ) {

        return;

    }


    if (
        Number(amount) <= 0
    ) {

        payNowButton.innerHTML =
            `GET COURSE <span>→</span>`;

        payNowButton.dataset.action =
            "free";

        return;

    }


    payNowButton.innerHTML =
        `PAY NOW <span>→</span>`;

    payNowButton.dataset.action =
        "payment";

}


/* =========================================================
   PAY BUTTON CLICK
========================================================= */

if (
    payNowButton
) {

    payNowButton.addEventListener(
        "click",
        async () => {

            if (
                isProcessing
            ) {

                return;

            }


            if (
                !currentUser
            ) {

                window.location.href =
                    "../login/";

                return;

            }


            if (
                !currentCourse
            ) {

                showError(
                    "Course information is not available."
                );

                return;

            }


            const languages =
                getAvailableLanguages();


            /*
             * If CRM has language options,
             * First Language is mandatory.
             */

            if (
                languages.length > 0 &&
                !selectedLanguages.first
            ) {

                showToast(
                    "Please select the First Language."
                );


                languageSection?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });


                return;

            }


            /*
             * Check duplicate selections.
             */

            const selected =
                [

                    selectedLanguages.first,

                    selectedLanguages.second,

                    selectedLanguages.third

                ]
                    .filter(Boolean);


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

                showToast(
                    "Please select different languages."
                );

                return;

            }


            const pricing =
                calculatePricing(
                    currentCourse
                );


            /*
             * FREE
             */

            if (
                pricing.finalPrice <= 0
            ) {

                await handleFreeCourse(
                    pricing
                );

                return;

            }


            /*
             * PAID
             */

            await handlePaidCourse(
                pricing
            );

        }
    );

}


/* =========================================================
   PAID COURSE
   ---------------------------------------------------------
   THIS IS THE IMPORTANT PART.

   1. Read live CRM course
   2. Build complete checkout object
   3. Save sessionStorage
   4. Go to Payment

   Payment page can therefore read:
       zenova_checkout
========================================================= */

async function handlePaidCourse(
    pricing
) {

    try {

        setPayingState(
            true,
            "PROCESSING..."
        );


        const checkoutData =
            createCheckoutData(
                pricing
            );


        console.log(
            "ZENOVA CHECKOUT DATA:",
            checkoutData
        );


        /* -------------------------------------------------
           SAVE COMPLETE DATA
        ------------------------------------------------- */

        sessionStorage.setItem(
            "zenova_checkout",
            JSON.stringify(
                checkoutData
            )
        );


        /* -------------------------------------------------
           PAYMENT URL

           Payment folder:
               home/payment/

           Checkout folder:
               home/checkout/

           Therefore:
               ../payment/
        ------------------------------------------------- */

        const paymentUrl =
            `../payment/?courseId=${encodeURIComponent(
                currentCourse.id
            )}`;


        console.log(
            "ZENOVA PAYMENT URL:",
            paymentUrl
        );


        window.location.href =
            paymentUrl;


    } catch (error) {

        console.error(
            "PAYMENT START ERROR:",
            error
        );


        showToast(
            "Unable to start payment."
        );


        setPayingState(
            false
        );

    }

}


/* =========================================================
   FREE COURSE
========================================================= */

async function handleFreeCourse(
    pricing
) {

    try {

        setPayingState(
            true,
            "PROCESSING..."
        );


        const checkoutData =
            createCheckoutData(
                pricing
            );


        sessionStorage.setItem(
            "zenova_checkout",
            JSON.stringify(
                checkoutData
            )
        );


        window.location.href =
            `../success/?courseId=${encodeURIComponent(
                currentCourse.id
            )}&type=FREE`;


    } catch (error) {

        console.error(
            "FREE COURSE ERROR:",
            error
        );


        showToast(
            "Unable to continue."
        );


        setPayingState(
            false
        );

    }

}


/* =========================================================
   PAY BUTTON STATE
========================================================= */

function setPayingState(
    paying,
    text = "PAY NOW →"
) {

    isProcessing =
        paying;


    if (
        !payNowButton
    ) {

        return;

    }


    payNowButton.disabled =
        paying;


    if (
        paying
    ) {

        payNowButton.textContent =
            text;

    } else {

        const amount =
            currentCourse
                ? calculatePricing(
                    currentCourse
                ).finalPrice
                : 0;


        payNowButton.innerHTML =
            Number(amount) <= 0
                ? `GET COURSE <span>→</span>`
                : `PAY NOW <span>→</span>`;

    }

}


/* =========================================================
   BACK
========================================================= */

if (
    backButton
) {

    backButton.addEventListener(
        "click",
        () => {

            if (
                document.referrer &&
                window.history.length > 1
            ) {

                window.history.back();

                return;

            }


            window.location.href =
                "../batchdetails/";

        }
    );

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

if (
    notificationButton
) {

    notificationButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "../notifications/";

        }
    );

}


/* =========================================================
   ERROR BACK
========================================================= */

if (
    errorBackButton
) {

    errorBackButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "../batches/";

        }
    );

}


/* =========================================================
   BOTTOM NAVIGATION
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

                    const route =
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
                        routes[route]
                    ) {

                        window.location.href =
                            routes[route];

                    }

                }
            );

        }
    );


/* =========================================================
   LOADER
========================================================= */

function hideLoader() {

    loadingScreen?.classList.add(
        "hidden"
    );


    app?.classList.remove(
        "hidden"
    );


    errorSection?.classList.add(
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
        "ZENOVA CHECKOUT ERROR:",
        message
    );


    loadingScreen?.classList.add(
        "hidden"
    );


    app?.classList.remove(
        "hidden"
    );


    document
        .querySelector(
            ".checkout-content"
        )
        ?.classList.add(
            "hidden"
        );


    paymentBar?.classList.add(
        "hidden"
    );


    errorSection?.classList.remove(
        "hidden"
    );


    setText(
        errorMessage,
        message
    );

}


/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;


function showToast(
    message
) {

    let toast =
        $("toast");


    if (
        !toast
    ) {

        toast =
            document.createElement(
                "div"
            );


        toast.id =
            "toast";


        toast.className =
            "toast";


        document.body.appendChild(
            toast
        );

    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            2800
        );

}


/* =========================================================
   TEXT
========================================================= */

function setText(
    element,
    value
) {

    if (
        element
    ) {

        element.textContent =
            value ?? "";

    }

}


/* =========================================================
   NUMBER
========================================================= */

function numberValue(
    value
) {

    const number =
        Number(
            value
        );


    return Number.isFinite(
        number
    )
        ? number
        : 0;

}


/* =========================================================
   MONEY
========================================================= */

function formatPrice(
    amount
) {

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

function formatClass(
    value
) {

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
    "pagehide",
    () => {

        if (
            typeof unsubscribeCourse ===
            "function"
        ) {

            unsubscribeCourse();

        }

    }
);

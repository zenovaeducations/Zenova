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

let selectedLanguage = "";


/* =========================================================
   ELEMENT HELPER
   ========================================================= */

function el(id) {
    return document.getElementById(id);
}


/* =========================================================
   ELEMENTS
   ========================================================= */

/* Loader / App */

const loadingScreen =
    el("loadingScreen");

const app =
    el("app");


/* Header */

const backButton =
    el("backButton");

const notificationButton =
    el("notificationButton");


/* Course */

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


/* Language */

const languageSection =
    el("languageSection");

const languageOptions =
    el("languageOptions");

const summaryLanguageRow =
    el("summaryLanguageRow");

const summaryLanguage =
    el("summaryLanguage");


/* Course summary */

const summaryCourseName =
    el("summaryCourseName");

const summaryClass =
    el("summaryClass");


/* Pricing */

const originalPrice =
    el("originalPrice");

const discountRow =
    el("discountRow");

const discountAmount =
    el("discountAmount");

const finalPrice =
    el("finalPrice");


/* Payment */

const paymentBar =
    el("paymentBar");

const bottomPrice =
    el("bottomPrice");

const payNowButton =
    el("payNowButton");


/* Error */

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
   AUTHENTICATION
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


            currentUser =
                user;


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
                "Zenova Checkout Authentication Error:",
                error
            );

            showError(
                getReadableError(error)
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

        unsubscribeCourse =
            null;
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

                try {

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
                        "Zenova Checkout Course:",
                        currentCourse
                    );


                    /*
                     * If CRM explicitly marks
                     * the course inactive,
                     * do not allow checkout.
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


                } catch (error) {

                    console.error(
                        "Checkout render error:",
                        error
                    );

                    showError(
                        "Unable to display course details."
                    );

                }

            },

            error => {

                console.error(
                    "CHECKOUT FIREBASE ERROR:",
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

    if (!course) {
        return;
    }


    /* =====================================================
       COURSE NAME
       ===================================================== */

    const name =
        course.crmCourseName ||
        course.courseName ||
        course.name ||
        course.title ||
        "Zenova Course";


    /* =====================================================
       CLASS
       ===================================================== */

    const className =
        displayClass(
            course.crmClass ||
            course.className ||
            course.targetClass ||
            ""
        );


    /* =====================================================
       MEDIUM
       ===================================================== */

    const medium =
        getCourseMediumText(
            course
        );


    /* =====================================================
       COURSE CODE
       ===================================================== */

    const code =
        course.crmCourseCode ||
        course.courseCode ||
        "";


    /* =====================================================
       IMAGE
       ===================================================== */

    loadCourseImage(
        course
    );


    /* =====================================================
       TOP COURSE CARD
       ===================================================== */

    setText(
        courseName,
        name
    );


    setText(
        courseMeta,
        buildCourseMeta(
            className,
            medium
        )
    );


    setText(
        courseCode,
        code
            ? `Course Code: ${code}`
            : ""
    );


    /* =====================================================
       COURSE SUMMARY
       ===================================================== */

    setText(
        summaryCourseName,
        name
    );


    setText(
        summaryClass,
        className || "—"
    );


    /* =====================================================
       LANGUAGE
       ===================================================== */

    setupLanguages(
        course
    );


    /* =====================================================
       PRICE
       ===================================================== */

    const pricing =
        calculatePricing(
            course
        );


    renderPricing(
        pricing
    );


    /* =====================================================
       PAYMENT BAR
       ===================================================== */

    setText(
        bottomPrice,
        formatPrice(
            pricing.finalPrice
        )
    );


    updatePayButton(
        pricing.finalPrice
    );


    if (paymentBar) {

        paymentBar.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   COURSE META
   ========================================================= */

function buildCourseMeta(
    className,
    medium
) {

    const parts = [];

    if (className) {
        parts.push(className);
    }

    if (medium) {
        parts.push(medium);
    }

    return parts.length
        ? parts.join(" • ")
        : "Course details";

}


/* =========================================================
   IMAGE
   ========================================================= */

function loadCourseImage(course) {

    const imageUrl =
        course?.crmImageUrl ||
        course?.imageUrl ||
        course?.courseImageUrl ||
        "";


    console.log(
        "Checkout thumbnail:",
        imageUrl
    );


    if (!courseImage) {
        return;
    }


    if (!imageUrl) {

        showImageFallback();

        return;
    }


    courseImage.classList.remove(
        "hidden"
    );


    if (courseImageFallback) {

        courseImageFallback.classList.add(
            "hidden"
        );

    }


    courseImage.src =
        imageUrl;

}


/* =========================================================
   IMAGE ERROR
   ========================================================= */

if (courseImage) {

    courseImage.addEventListener(
        "error",
        () => {

            console.error(
                "Checkout image failed:",
                courseImage.src
            );

            showImageFallback();

        }
    );

}


/* =========================================================
   IMAGE FALLBACK
   ========================================================= */

function showImageFallback() {

    if (courseImage) {

        courseImage.classList.add(
            "hidden"
        );

    }


    if (courseImageFallback) {

        courseImageFallback.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   LANGUAGE
   ========================================================= */

function setupLanguages(course) {

    if (!languageSection) {
        return;
    }


    if (!languageOptions) {
        return;
    }


    let languages = [];


    /*
     * Support different CRM formats.
     */

    if (
        Array.isArray(
            course.languages
        )
    ) {

        languages =
            course.languages;

    } else if (
        Array.isArray(
            course.availableLanguages
        )
    ) {

        languages =
            course.availableLanguages;

    } else if (
        Array.isArray(
            course.mediums
        )
    ) {

        languages =
            course.mediums;

    } else if (
        Array.isArray(
            course.crmMediums
        )
    ) {

        languages =
            course.crmMediums;

    } else if (
        typeof course.crmMedium ===
        "string"
    ) {

        languages =
            course.crmMedium
                .split(",")
                .map(
                    item =>
                        item.trim()
                )
                .filter(Boolean);

    } else if (
        typeof course.medium ===
        "string"
    ) {

        languages =
            course.medium
                .split(",")
                .map(
                    item =>
                        item.trim()
                )
                .filter(Boolean);

    }


    /*
     * Remove duplicates.
     */

    languages =
        [
            ...new Set(
                languages
                    .map(
                        item =>
                            String(item)
                                .trim()
                    )
                    .filter(Boolean)
            )
        ];


    /*
     * No language information.
     */

    if (!languages.length) {

        languageSection.classList.add(
            "hidden"
        );

        if (summaryLanguageRow) {

            summaryLanguageRow.classList.add(
                "hidden"
            );

        }

        selectedLanguage = "";

        return;
    }


    /*
     * One language only.
     * Automatically select it.
     */

    if (languages.length === 1) {

        selectedLanguage =
            languages[0];


        languageSection.classList.add(
            "hidden"
        );


        showSelectedLanguage(
            selectedLanguage
        );


        return;
    }


    /*
     * Multiple languages.
     * Show selection.
     */

    languageSection.classList.remove(
        "hidden"
    );


    languageOptions.innerHTML =
        "";


    /*
     * Reset until user chooses.
     */

    selectedLanguage =
        "";


    if (summaryLanguageRow) {

        summaryLanguageRow.classList.add(
            "hidden"
        );

    }


    languages.forEach(
        language => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "language-option";


            button.innerHTML = `
                <div class="language-main">
                    <span class="language-name">
                        ${escapeHtml(language)}
                    </span>

                    <span class="language-description">
                        Study in ${escapeHtml(language)}
                    </span>
                </div>

                <div class="language-check">
                    ✓
                </div>
            `;


            button.addEventListener(
                "click",
                () => {

                    selectLanguage(
                        language
                    );

                }
            );


            languageOptions.appendChild(
                button
            );

        }
    );

}


/* =========================================================
   SELECT LANGUAGE
   ========================================================= */

function selectLanguage(
    language
) {

    selectedLanguage =
        language;


    document
        .querySelectorAll(
            ".language-option"
        )
        .forEach(
            button => {

                const name =
                    button.querySelector(
                        ".language-name"
                    )?.textContent
                    ?.trim();


                button.classList.toggle(
                    "selected",
                    name === language
                );

            }
        );


    showSelectedLanguage(
        language
    );

}


/* =========================================================
   SHOW SELECTED LANGUAGE
   ========================================================= */

function showSelectedLanguage(
    language
) {

    if (
        !language ||
        !summaryLanguage
    ) {
        return;
    }


    setText(
        summaryLanguage,
        language
    );


    if (summaryLanguageRow) {

        summaryLanguageRow.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   GET MEDIUM TEXT
   ========================================================= */

function getCourseMediumText(
    course
) {

    if (
        Array.isArray(
            course.crmMedium
        )
    ) {

        return course.crmMedium.join(
            ", "
        );

    }


    if (
        course.crmMedium
    ) {

        return String(
            course.crmMedium
        );

    }


    if (
        Array.isArray(
            course.mediums
        )
    ) {

        return course.mediums.join(
            ", "
        );

    }


    if (
        course.medium
    ) {

        return String(
            course.medium
        );

    }


    return "";

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


    let finalPrice =
        numberValue(
            course.crmFinalPrice
        );


    const courseType =
        String(
            course.courseType ||
            course.type ||
            ""
        ).toUpperCase();


    /*
     * FREE COURSE
     */

    if (
        courseType === "FREE" ||
        course.isPaid === false
    ) {

        price = 0;
        discount = 0;
        finalPrice = 0;

    }


    /*
     * If final price is missing,
     * calculate it.
     */

    if (
        finalPrice <= 0 &&
        price > 0
    ) {

        finalPrice =
            Math.max(
                0,
                price - discount
            );

    }


    /*
     * If only final price exists.
     */

    if (
        price <= 0 &&
        finalPrice > 0
    ) {

        price =
            finalPrice;

        discount = 0;

    }


    /*
     * Discount cannot exceed price.
     */

    if (
        discount > price
    ) {

        discount =
            price;

    }


    /*
     * Final safety calculation.
     */

    if (
        price > 0 &&
        finalPrice <= 0
    ) {

        finalPrice =
            Math.max(
                0,
                price - discount
            );

    }


    return {

        type:
            finalPrice > 0
                ? "PAID"
                : "FREE",

        price,

        discount,

        finalPrice

    };

}


/* =========================================================
   RENDER PRICING
   ========================================================= */

function renderPricing(
    pricing
) {

    if (!pricing) {
        return;
    }


    const {
        type,
        price,
        discount,
        finalPrice: total
    } = pricing;


    /*
     * FREE
     */

    if (
        type === "FREE"
    ) {

        setText(
            originalPrice,
            "Free"
        );


        setText(
            discountAmount,
            "₹0"
        );


        setText(
            finalPrice,
            "Free"
        );


        setText(
            bottomPrice,
            "₹0"
        );


        if (discountRow) {

            discountRow.classList.add(
                "hidden"
            );

        }


        return;
    }


    /*
     * PAID
     */

    setText(
        originalPrice,
        formatPrice(
            price
        )
    );


    if (
        discount > 0
    ) {

        setText(
            discountAmount,
            "-" +
            formatPrice(
                discount
            )
        );


        if (discountRow) {

            discountRow.classList.remove(
                "hidden"
            );

        }

    } else {

        if (discountRow) {

            discountRow.classList.add(
                "hidden"
            );

        }

    }


    setText(
        finalPrice,
        formatPrice(
            total
        )
    );


    setText(
        bottomPrice,
        formatPrice(
            total
        )
    );

}


/* =========================================================
   PAY BUTTON
   ========================================================= */

function updatePayButton(
    amount
) {

    if (!payNowButton) {
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

if (payNowButton) {

    payNowButton.addEventListener(
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


            if (!currentCourse) {

                showError(
                    "Course information is not available."
                );

                return;
            }


            /*
             * If multiple languages exist,
             * require selection.
             */

            const languageButtons =
                document.querySelectorAll(
                    ".language-option"
                );


            if (
                languageButtons.length > 1 &&
                !selectedLanguage
            ) {

                showToast(
                    "Please select a language."
                );

                if (languageSection) {

                    languageSection.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                }

                return;
            }


            const pricing =
                calculatePricing(
                    currentCourse
                );


            if (
                pricing.finalPrice <= 0
            ) {

                await handleFreeCourse();

                return;
            }


            await handlePaidCourse(
                pricing
            );

        }
    );

}


/* =========================================================
   FREE COURSE
   ========================================================= */

async function handleFreeCourse() {

    try {

        setPayingState(
            true,
            "PROCESSING..."
        );


        const courseId =
            currentCourse.id;


        let url =
            `../success/?courseId=${encodeURIComponent(
                courseId
            )}&type=FREE`;


        if (selectedLanguage) {

            url +=
                `&language=${encodeURIComponent(
                    selectedLanguage
                )}`;

        }


        window.location.href =
            url;


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
   PAID COURSE
   ========================================================= */

async function handlePaidCourse(
    pricing
) {

    try {

        setPayingState(
            true,
            "PROCESSING..."
        );


        const checkoutData = {

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

            medium:
                currentCourse.crmMedium ||
                "",

            language:
                selectedLanguage ||
                "",

            price:
                pricing.price,

            discount:
                pricing.discount,

            finalPrice:
                pricing.finalPrice,

            studentUid:
                currentUser.uid,

            createdAt:
                Date.now()

        };


        sessionStorage.setItem(
            "zenova_checkout",
            JSON.stringify(
                checkoutData
            )
        );


        let url =
            `../payment/?courseId=${encodeURIComponent(
                currentCourse.id
            )}`;


        if (selectedLanguage) {

            url +=
                `&language=${encodeURIComponent(
                    selectedLanguage
                )}`;

        }


        window.location.href =
            url;


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
   PAYING STATE
   ========================================================= */

function setPayingState(
    paying,
    text = "PAY NOW  →"
) {

    isPaying =
        paying;


    if (!payNowButton) {
        return;
    }


    payNowButton.disabled =
        paying;


    if (paying) {

        payNowButton.innerHTML =
            `${escapeHtml(text)}`;

    } else {

        const amount =
            currentCourse
                ? calculatePricing(
                    currentCourse
                ).finalPrice
                : 0;


        if (
            Number(amount) <= 0
        ) {

            payNowButton.innerHTML =
                `GET COURSE <span>→</span>`;

        } else {

            payNowButton.innerHTML =
                `PAY NOW <span>→</span>`;

        }

    }

}


/* =========================================================
   BACK BUTTON
   ========================================================= */

if (backButton) {

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
                "../batches/";

        }
    );

}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

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
   ERROR BACK BUTTON
   ========================================================= */

if (errorBackButton) {

    errorBackButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "../batches/";

        }
    );

}


/* =========================================================
   LOADING
   ========================================================= */

function hideLoading() {

    /*
     * THIS IS THE IMPORTANT FIX.
     *
     * HTML uses:
     * #loadingScreen
     *
     * not:
     * #loader
     */

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

function showError(
    message
) {

    console.error(
        "ZENOVA CHECKOUT ERROR:",
        message
    );


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


    /*
     * Hide normal checkout
     * sections when there is an error.
     */

    const content =
        document.querySelector(
            ".checkout-content"
        );


    if (content) {

        content
            .querySelectorAll(
                ".course-card, .section, .secure-note, .bottom-space"
            )
            .forEach(
                element => {

                    element.classList.add(
                        "hidden"
                    );

                }
            );

    }


    if (paymentBar) {

        paymentBar.classList.add(
            "hidden"
        );

    }


    if (errorSection) {

        errorSection.classList.remove(
            "hidden"
        );

    }


    setText(
        errorMessage,
        message ||
        "Something went wrong."
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
        document.getElementById(
            "zenovaCheckoutToast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );


        toast.id =
            "zenovaCheckoutToast";


        toast.style.position =
            "fixed";

        toast.style.left =
            "50%";

        toast.style.bottom =
            "105px";

        toast.style.transform =
            "translateX(-50%)";

        toast.style.zIndex =
            "99999";

        toast.style.background =
            "#171717";

        toast.style.color =
            "#ffffff";

        toast.style.padding =
            "11px 16px";

        toast.style.borderRadius =
            "10px";

        toast.style.fontSize =
            "13px";

        toast.style.fontWeight =
            "600";

        toast.style.whiteSpace =
            "nowrap";

        document.body.appendChild(
            toast
        );

    }


    toast.textContent =
        message;


    toast.style.opacity =
        "1";


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.style.opacity =
                    "0";

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

    if (!element) {
        return;
    }


    element.textContent =
        value ?? "";

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
   PRICE
   ========================================================= */

function formatPrice(
    value
) {

    const number =
        numberValue(
            value
        );


    if (
        number <= 0
    ) {

        return "₹0";

    }


    return (
        "₹" +
        number.toLocaleString(
            "en-IN"
        )
    );

}


/* =========================================================
   CLASS
   ========================================================= */

function displayClass(
    value
) {

    const names = {

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


    if (!value) {
        return "";
    }


    return (
        names[value] ||
        String(value)
            .replace(
                /_/g,
                " "
            )
    );

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   FIREBASE ERROR
   ========================================================= */

function getReadableError(
    error
) {

    if (
        error?.code ===
        "permission-denied"
    ) {

        return (
            "You do not have permission to view this course."
        );

    }


    if (
        error?.code ===
        "not-found"
    ) {

        return (
            "This course could not be found."
        );

    }


    return (
        error?.message ||
        "Unable to load course details."
    );

}


/* =========================================================
   CLEANUP
   ========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (
            unsubscribeCourse
        ) {

            unsubscribeCourse();

        }

    }
);


/* =========================================================
   INITIAL STATE
   ========================================================= */

if (app) {

    app.classList.add(
        "hidden"
    );

}


if (errorSection) {

    errorSection.classList.add(
        "hidden"
    );

}

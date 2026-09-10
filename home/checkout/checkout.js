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
let currentCourse = null;
let unsubscribeCourse = null;

let isLoading = true;
let isPaying = false;


/* =========================================================
   ELEMENT HELPERS
========================================================= */

function getElement(id) {
    return document.getElementById(id);
}


/* =========================================================
   ELEMENTS
========================================================= */

const courseImage =
    getElement("courseImage");

const courseImageFallback =
    getElement("courseImageFallback");

const courseName =
    getElement("courseName");

const courseClass =
    getElement("courseClass");

const courseMedium =
    getElement("courseMedium");

const courseCode =
    getElement("courseCode");

const coursePrice =
    getElement("coursePrice");

const courseDiscount =
    getElement("courseDiscount");

const courseFinalPrice =
    getElement("courseFinalPrice");

const totalAmount =
    getElement("totalAmount");

const payNowBtn =
    getElement("payNowBtn");

const loader =
    getElement("loader");

const app =
    getElement("app");

const errorState =
    getElement("errorState");

const errorMessage =
    getElement("errorMessage");

const backBtn =
    getElement("backBtn");

const notificationBtn =
    getElement("notificationBtn");


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

    }
);


/* =========================================================
   COURSE LISTENER
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

            snapshot => {

                if (
                    !snapshot.exists()
                ) {

                    showError(
                        "This course is no longer available."
                    );

                    return;
                }

                currentCourse = {
                    id: snapshot.id,
                    ...snapshot.data()
                };

                renderCheckout(
                    currentCourse
                );

                hideLoader();

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

function renderCheckout(
    course
) {

    if (!course) {
        return;
    }


    /* -----------------------------------------------------
       BASIC COURSE DETAILS
    ----------------------------------------------------- */

    const name =
        course.crmCourseName ||
        course.name ||
        course.title ||
        "Zenova Course";

    const className =
        displayClass(
            course.crmClass ||
            course.className ||
            ""
        );

    const medium =
        course.crmMedium ||
        (
            Array.isArray(
                course.mediums
            )
                ? course.mediums.join(
                    ", "
                )
                : ""
        ) ||
        course.medium ||
        "English";

    const code =
        course.crmCourseCode ||
        course.courseCode ||
        "";


    /* -----------------------------------------------------
       COURSE IMAGE
    ----------------------------------------------------- */

    loadCourseImage(
        course
    );


    /* -----------------------------------------------------
       TEXT
    ----------------------------------------------------- */

    setText(
        courseName,
        name
    );

    setText(
        courseClass,
        className
    );

    setText(
        courseMedium,
        medium
    );

    setText(
        courseCode,
        code
    );


    /* -----------------------------------------------------
       PRICING
    ----------------------------------------------------- */

    const pricing =
        calculatePricing(
            course
        );

    renderPricing(
        pricing
    );


    /* -----------------------------------------------------
       PAY BUTTON
    ----------------------------------------------------- */

    updatePayButton(
        pricing.finalPrice,
        name
    );

}


/* =========================================================
   IMAGE
========================================================= */

function loadCourseImage(
    course
) {

    const imageUrl =
        course?.crmImageUrl ||
        course?.imageUrl ||
        course?.courseImageUrl ||
        "";

    console.log(
        "Checkout thumbnail URL:",
        imageUrl
    );


    if (!imageUrl) {

        showImageFallback();

        return;
    }


    if (!courseImage) {

        console.warn(
            "courseImage element not found."
        );

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
                "Checkout thumbnail failed:",
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

        return;
    }


    /*
     * If the fallback element does not
     * exist in HTML, create a simple
     * fallback inside the image parent.
     */

    if (
        courseImage &&
        courseImage.parentElement
    ) {

        const parent =
            courseImage.parentElement;

        let fallback =
            parent.querySelector(
                ".checkout-image-fallback"
            );

        if (!fallback) {

            fallback =
                document.createElement(
                    "div"
                );

            fallback.className =
                "checkout-image-fallback";

            fallback.innerHTML =
                "Z";

            parent.appendChild(
                fallback
            );

        }

        fallback.classList.remove(
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

    const type =
        String(
            course.courseType ||
            ""
        ).toUpperCase();


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


    /*
     * FREE COURSE
     */

    if (
        type === "FREE"
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
     * If price is missing but
     * final price exists.
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
     * Never allow discount greater
     * than course price.
     */

    if (
        discount > price
    ) {

        discount =
            price;

    }


    /*
     * Final calculation protection.
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
            type || (
                finalPrice > 0
                    ? "PAID"
                    : "FREE"
            ),

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
        finalPrice
    } = pricing;


    /*
     * FREE COURSE
     */

    if (
        type === "FREE"
    ) {

        setText(
            coursePrice,
            "Free"
        );

        setText(
            courseDiscount,
            "₹0"
        );

        setText(
            courseFinalPrice,
            "Free"
        );

        setText(
            totalAmount,
            "₹0"
        );

        return;

    }


    /*
     * PAID COURSE
     */

    setText(
        coursePrice,
        formatPrice(
            price
        )
    );


    if (
        discount > 0
    ) {

        setText(
            courseDiscount,
            "-" +
            formatPrice(
                discount
            )
        );

        if (
            courseDiscount
        ) {

            courseDiscount.classList.remove(
                "hidden"
            );

        }

    } else {

        setText(
            courseDiscount,
            "₹0"
        );

    }


    setText(
        courseFinalPrice,
        formatPrice(
            finalPrice
        )
    );

    setText(
        totalAmount,
        formatPrice(
            finalPrice
        )
    );

}


/* =========================================================
   PAY BUTTON
========================================================= */

function updatePayButton(
    amount,
    name
) {

    if (!payNowBtn) {
        return;
    }


    if (
        Number(amount) <= 0
    ) {

        payNowBtn.textContent =
            "GET COURSE  →";

        payNowBtn.dataset.action =
            "free";

        return;

    }


    payNowBtn.textContent =
        "PAY NOW  →";

    payNowBtn.dataset.action =
        "payment";

    payNowBtn.dataset.courseName =
        name || "";

}


/* =========================================================
   PAY NOW
========================================================= */

if (payNowBtn) {

    payNowBtn.addEventListener(
        "click",
        async () => {

            if (
                isPaying
            ) {
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


            const pricing =
                calculatePricing(
                    currentCourse
                );


            /*
             * FREE COURSE
             */

            if (
                pricing.finalPrice <= 0
            ) {

                await handleFreeCourse();

                return;

            }


            /*
             * PAID COURSE
             */

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

    if (!currentUser) {

        window.location.href =
            "../login/";

        return;

    }


    try {

        setPayingState(
            true,
            "PROCESSING..."
        );


        /*
         * IMPORTANT:
         *
         * This only moves to the
         * next step.
         *
         * Actual enrollment should
         * be created by the trusted
         * backend/admin/payment flow.
         */

        window.location.href =
            `../success/?courseId=${encodeURIComponent(
                currentCourse.id
            )}&type=FREE`;

    }
    catch (error) {

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

    if (!currentUser) {

        window.location.href =
            "../login/";

        return;

    }


    try {

        setPayingState(
            true,
            "PROCESSING..."
        );


        /*
         * Store only the course reference
         * and amount needed for the payment
         * page.
         *
         * The payment gateway should verify
         * the amount again server-side.
         */

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


        /*
         * Continue to your payment
         * gateway page.
         *
         * Change this route only if
         * your payment page has another
         * folder name.
         */

        window.location.href =
            `../payment/?courseId=${encodeURIComponent(
                currentCourse.id
            )}`;

    }
    catch (error) {

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
   PAY BUTTON STATE
========================================================= */

function setPayingState(
    paying,
    text = "PAY NOW  →"
) {

    isPaying =
        paying;


    if (!payNowBtn) {
        return;
    }


    payNowBtn.disabled =
        paying;


    payNowBtn.textContent =
        paying
            ? text
            : "PAY NOW  →";

}


/* =========================================================
   BACK BUTTON
========================================================= */

if (backBtn) {

    backBtn.addEventListener(
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

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

if (notificationBtn) {

    notificationBtn.addEventListener(
        "click",
        () => {

            window.location.href =
                "../notifications/";

        }
    );

}


/* =========================================================
   BOTTOM NAVIGATION
========================================================= */

document
    .querySelectorAll(
        "[data-route]"
    )
    .forEach(
        element => {

            element.addEventListener(
                "click",
                () => {

                    const route =
                        element.dataset.route;

                    navigate(
                        route
                    );

                }
            );

        }
    );


/* =========================================================
   NAVIGATION
========================================================= */

function navigate(
    route
) {

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
            "../profile/",

        notifications:
            "../notifications/"

    };


    const destination =
        routes[route];


    if (
        destination
    ) {

        window.location.href =
            destination;

    }

}


/* =========================================================
   LOADER
========================================================= */

function hideLoader() {

    isLoading =
        false;


    if (app) {

        app.classList.remove(
            "hidden"
        );

    }


    if (loader) {

        loader.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   ERROR STATE
========================================================= */

function showError(
    message
) {

    console.error(
        "CHECKOUT ERROR:",
        message
    );


    if (loader) {

        loader.classList.add(
            "hidden"
        );

    }


    if (app) {

        app.classList.add(
            "hidden"
        );

    }


    if (errorState) {

        errorState.classList.remove(
            "hidden"
        );

    }


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
        document.getElementById(
            "toast"
        );


    if (!toast) {

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
   TEXT HELPER
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
   NUMBER HELPER
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
   PRICE FORMAT
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
   CLASS FORMAT
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


    return (
        names[value] ||
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
            unsubscribeCourse
        ) {

            unsubscribeCourse();

        }

    }
);


/* =========================================================
   INITIAL UI
========================================================= */

if (app) {

    app.classList.add(
        "hidden"
    );

}

if (errorState) {

    errorState.classList.add(
        "hidden"
    );

}

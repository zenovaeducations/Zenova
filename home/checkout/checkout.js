/* =========================================================
   ZENOVA EDUCATIONS
   CHECKOUT
=========================================================

   FLOW

   Batch Details
        ↓
   Checkout
        ↓
   Select 1st Language
   Select 2nd Language
   Select 3rd Language
        ↓
   Save complete checkout data
        ↓
   Payment / Request Page


   FIRESTORE

   Course:
       crmCourses/{courseId}

   Student:
       students/{uid}


   LANGUAGE SOURCE

   Course languages are read from:

       crmCourses.mediums

   Example:

       mediums: [
           "Kannada",
           "English",
           "Hindi"
       ]

========================================================= */


/* =========================================================
   FIREBASE
========================================================= */

import {
    auth,
    db
} from "../../firebase/firebase-config.js";


import {
    doc,
    getDoc,
    getDocs,
    collection,
    query,
    where,
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
   HELPERS
========================================================= */

function $(id) {

    return document.getElementById(id);

}


function setText(element, value) {

    if (!element) {

        return;

    }

    element.textContent =
        value ?? "";

}


function numberValue(value) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : 0;

}


function formatMoney(value) {

    const amount =
        numberValue(value);

    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }
    ).format(amount);

}


function formatClass(value) {

    const text =
        String(value || "").trim();

    if (!text) {

        return "";

    }

    return text
        .replace(
            /class/gi,
            ""
        )
        .trim();

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


const courseCode =
    $("courseCode");


const languageSelectors =
    $("languageSelectors");


const languageSection =
    $("languageSection");


const languageError =
    $("languageError");


const languageConfigError =
    $("languageConfigError");


const subjectsList =
    $("subjectsList");


const noSubjects =
    $("noSubjects");


const summaryCourseName =
    $("summaryCourseName");


const summaryClass =
    $("summaryClass");


const summaryLanguageList =
    $("summaryLanguageList");


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


const continueButton =
    $("continueButton");


const backButton =
    $("backButton");


const errorSection =
    $("errorSection");


const errorMessage =
    $("errorMessage");


const errorBackButton =
    $("errorBackButton");


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

                    id:
                        snapshot.id,

                    ...snapshot.data()

                };


                renderCheckout();

            },

            error => {

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

async function renderCheckout() {

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
            currentCourse.className ||
            ""
        );


    const code =
        currentCourse.crmCourseCode ||
        currentCourse.code ||
        "";


    setText(
        courseName,
        name
    );


    setText(
        courseClass,
        className || "—"
    );


    setText(
        courseCode,
        code || "—"
    );


    setText(
        summaryCourseName,
        name
    );


    setText(
        summaryClass,
        className || "—"
    );


    renderCourseImage();


    renderPricing();


    renderLanguageSelection();


    await loadSubjects();


    updateContinueButton();


    hideLoading();

}


/* =========================================================
   COURSE IMAGE
========================================================= */

function renderCourseImage() {

    if (!courseImage) {

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


    courseImage.src =
        imageUrl;


    courseImage.classList.remove(
        "hidden"
    );


    courseImageFallback?.classList.add(
        "hidden"
    );


    courseImage.onerror =
        () => {

            showImageFallback();

        };

}


function showImageFallback() {

    courseImage?.classList.add(
        "hidden"
    );


    courseImageFallback?.classList.remove(
        "hidden"
    );

}


/* =========================================================
   PRICING
========================================================= */

function getPricing() {

    const price =
        numberValue(
            currentCourse?.crmPrice
        );


    const discount =
        Math.min(
            numberValue(
                currentCourse?.crmDiscount
            ),
            price
        );


    let finalPrice =
        numberValue(
            currentCourse?.crmFinalPrice
        );


    if (
        finalPrice <= 0
    ) {

        finalPrice =
            Math.max(
                0,
                price - discount
            );

    }


    const courseType =
        String(
            currentCourse?.courseType ||
            currentCourse?.type ||
            ""
        ).toUpperCase();


    if (
        courseType === "FREE" ||
        currentCourse?.isPaid === false
    ) {

        return {

            price: 0,

            discount: 0,

            finalPrice: 0

        };

    }


    return {

        price,

        discount,

        finalPrice

    };

}


function renderPricing() {

    const pricing =
        getPricing();


    setText(
        coursePrice,
        formatMoney(
            pricing.price
        )
    );


    if (
        pricing.discount > 0
    ) {

        discountRow?.classList.remove(
            "hidden"
        );


        setText(
            discountAmount,
            `-${formatMoney(
                pricing.discount
            )}`
        );

    } else {

        discountRow?.classList.add(
            "hidden"
        );

    }


    setText(
        finalPrice,
        pricing.finalPrice > 0
            ? formatMoney(
                pricing.finalPrice
            )
            : "Free"
    );


    setText(
        bottomPrice,
        pricing.finalPrice > 0
            ? formatMoney(
                pricing.finalPrice
            )
            : "Free"
    );

}


/* =========================================================
   LANGUAGE SOURCE
========================================================= */

function getAvailableLanguages() {

    if (!currentCourse) {

        return [];

    }


    let languages = [];


    /*
     * PRIMARY SOURCE
     *
     * crmCourses.mediums
     */

    if (
        Array.isArray(
            currentCourse.mediums
        )
    ) {

        languages =
            currentCourse.mediums;

    }


    /*
     * FALLBACK
     *
     * crmMedium
     */

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
                    item =>
                        item.trim()
                );

    }


    /*
     * CLEAN + REMOVE DUPLICATES
     */

    const seen =
        new Set();


    return languages
        .map(
            language =>
                String(
                    language || ""
                ).trim()
        )
        .filter(Boolean)
        .filter(
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
   LANGUAGE SELECTION
========================================================= */

function renderLanguageSelection() {

    if (
        !languageSelectors
    ) {

        return;

    }


    const languages =
        getAvailableLanguages();


    languageSelectors.innerHTML =
        "";


    languageError?.classList.add(
        "hidden"
    );


    languageConfigError?.classList.add(
        "hidden"
    );


    /*
     * IMPORTANT:
     *
     * We require THREE languages.
     *
     * If Admin configured fewer than
     * three languages, student cannot
     * continue.
     */

    if (
        languages.length < 3
    ) {

        languageConfigError?.classList.remove(
            "hidden"
        );


        updateContinueButton();


        return;

    }


    /*
     * Restore existing selections
     */

    const fields = [

        createLanguageField(
            "first",
            "1st Language",
            languages
        ),

        createLanguageField(
            "second",
            "2nd Language",
            languages
        ),

        createLanguageField(
            "third",
            "3rd Language",
            languages
        )

    ];


    fields.forEach(
        field => {

            languageSelectors.appendChild(
                field.wrapper
            );

        }
    );


    /*
     * Restore session data if
     * student returns to checkout.
     */

    fields[0].select.value =
        selectedLanguages.first || "";


    fields[1].select.value =
        selectedLanguages.second || "";


    fields[2].select.value =
        selectedLanguages.third || "";


    fields.forEach(
        field => {

            field.select.addEventListener(
                "change",
                () => {

                    selectedLanguages[
                        field.key
                    ] =
                        field.select.value;


                    updateLanguageAvailability(
                        fields
                    );


                    updateLanguageSummary();


                    clearLanguageError();


                    saveDraftCheckout();


                    updateContinueButton();

                }
            );

        }
    );


    updateLanguageAvailability(
        fields
    );


    updateLanguageSummary();


    updateContinueButton();

}


/* =========================================================
   CREATE LANGUAGE FIELD
========================================================= */

function createLanguageField(
    key,
    label,
    languages
) {

    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "language-field";


    const labelElement =
        document.createElement(
            "label"
        );


    labelElement.innerHTML =
        `${label} <span>*</span>`;


    const select =
        document.createElement(
            "select"
        );


    select.className =
        "language-select";


    select.setAttribute(
        "aria-label",
        label
    );


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

        key,

        wrapper,

        select

    };

}


/* =========================================================
   PREVENT DUPLICATES
========================================================= */

function updateLanguageAvailability(
    fields
) {

    const selected =
        fields
            .map(
                field =>
                    field.select.value
            )
            .filter(Boolean);


    fields.forEach(
        field => {

            Array.from(
                field.select.options
            ).forEach(
                option => {

                    if (
                        !option.value
                    ) {

                        return;

                    }


                    const selectedByOther =
                        selected.includes(
                            option.value
                        ) &&
                        field.select.value !==
                            option.value;


                    option.disabled =
                        selectedByOther;

                }
            );

        }
    );

}


/* =========================================================
   VALIDATE LANGUAGES
========================================================= */

function validateLanguages() {

    const languages =
        getAvailableLanguages();


    if (
        languages.length < 3
    ) {

        return {

            valid: false,

            message:
                "This course does not have three languages configured by Admin."

        };

    }


    const first =
        selectedLanguages.first;


    const second =
        selectedLanguages.second;


    const third =
        selectedLanguages.third;


    if (
        !first
    ) {

        return {

            valid: false,

            message:
                "Please select your 1st Language."

        };

    }


    if (
        !second
    ) {

        return {

            valid: false,

            message:
                "Please select your 2nd Language."

        };

    }


    if (
        !third
    ) {

        return {

            valid: false,

            message:
                "Please select your 3rd Language."

        };

    }


    const values = [

        first.toLowerCase(),

        second.toLowerCase(),

        third.toLowerCase()

    ];


    const unique =
        new Set(values);


    if (
        unique.size !== 3
    ) {

        return {

            valid: false,

            message:
                "Please select three different languages."

        };

    }


    return {

        valid: true,

        message: ""

    };

}


/* =========================================================
   LANGUAGE SUMMARY
========================================================= */

function updateLanguageSummary() {

    if (
        !summaryLanguageList
    ) {

        return;

    }


    const items = [

        {
            label: "1st Language",
            value: selectedLanguages.first
        },

        {
            label: "2nd Language",
            value: selectedLanguages.second
        },

        {
            label: "3rd Language",
            value: selectedLanguages.third
        }

    ];


    summaryLanguageList.innerHTML =
        "";


    items.forEach(
        item => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "summary-language";


            const label =
                document.createElement(
                    "span"
                );


            label.textContent =
                item.label;


            const value =
                document.createElement(
                    "strong"
                );


            value.textContent =
                item.value ||
                "Not selected";


            row.appendChild(
                label
            );


            row.appendChild(
                value
            );


            summaryLanguageList.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   LOAD SUBJECTS
========================================================= */

async function loadSubjects() {

    if (
        !subjectsList ||
        !currentCourse
    ) {

        return;

    }


    subjectsList.innerHTML =
        "";


    noSubjects?.classList.add(
        "hidden"
    );


    try {

        const subjectsRef =
            collection(
                db,
                "hybridSubjects"
            );


        /*
         * Existing app uses courseId /
         * crmCourseId depending on page.
         *
         * We check both.
         */

        const queries = [];


        queries.push(
            getDocs(
                query(
                    subjectsRef,
                    where(
                        "courseId",
                        "==",
                        currentCourse.id
                    )
                )
            )
        );


        queries.push(
            getDocs(
                query(
                    subjectsRef,
                    where(
                        "crmCourseId",
                        "==",
                        currentCourse.id
                    )
                )
            )
        );


        const snapshots =
            await Promise.all(
                queries
            );


        const subjectMap =
            new Map();


        snapshots.forEach(
            snapshot => {

                snapshot.forEach(
                    subjectDoc => {

                        subjectMap.set(
                            subjectDoc.id,
                            {
                                id:
                                    subjectDoc.id,

                                ...subjectDoc.data()
                            }
                        );

                    }
                );

            }
        );


        const subjects =
            Array.from(
                subjectMap.values()
            )
                .sort(
                    (a, b) =>
                        numberValue(
                            a.order ??
                            a.position
                        )
                        -
                        numberValue(
                            b.order ??
                            b.position
                        )
                );


        if (
            subjects.length === 0
        ) {

            noSubjects?.classList.remove(
                "hidden"
            );

            return;

        }


        subjects.forEach(
            subject => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "subject-item";


                const name =
                    document.createElement(
                        "div"
                    );


                name.className =
                    "subject-name";


                name.textContent =
                    subject.name ||
                    subject.subjectName ||
                    subject.title ||
                    "Subject";


                item.appendChild(
                    name
                );


                const language =
                    subject.language ||
                    subject.medium ||
                    subject.selectedLanguage ||
                    "";


                if (
                    language
                ) {

                    const languageText =
                        document.createElement(
                            "div"
                        );


                    languageText.className =
                        "subject-language";


                    languageText.textContent =
                        language;


                    item.appendChild(
                        languageText
                    );

                }


                subjectsList.appendChild(
                    item
                );

            }
        );


    } catch (error) {

        /*
         * Subjects are informational on
         * Checkout. A subject-read failure
         * should not destroy the checkout
         * if course + languages are valid.
         */

        console.error(
            "SUBJECT LOAD ERROR:",
            error
        );

        noSubjects?.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   SAVE DRAFT
========================================================= */

function saveDraftCheckout() {

    if (
        !currentCourse ||
        !currentUser
    ) {

        return;

    }


    const pricing =
        getPricing();


    const data =
        createCheckoutData(
            pricing
        );


    sessionStorage.setItem(
        "zenova_checkout",
        JSON.stringify(
            data
        )
    );

}


/* =========================================================
   CREATE COMPLETE CHECKOUT DATA
========================================================= */

function createCheckoutData(
    pricing
) {

    const languageList = [

        selectedLanguages.first,

        selectedLanguages.second,

        selectedLanguages.third

    ];


    return {

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
            currentCourse.code ||
            "",

        className:
            currentCourse.crmClass ||
            currentCourse.className ||
            "",

        board:
            currentCourse.crmBoard ||
            currentCourse.board ||
            "",

        medium:
            getCourseMedium(),


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
            languageList,


        /*
         * Compatibility field.
         *
         * Existing payment code can still
         * read this, but the three separate
         * fields above are the real data.
         */

        selectedLanguage:
            languageList.join(
                " • "
            ),


        /* PRICING */

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

        createdAt:
            Date.now()

    };

}


/* =========================================================
   COURSE MEDIUM
========================================================= */

function getCourseMedium() {

    const languages =
        getAvailableLanguages();


    if (
        languages.length
    ) {

        return languages.join(
            ", "
        );

    }


    return String(
        currentCourse?.crmMedium ||
        currentCourse?.medium ||
        ""
    ).trim();

}


/* =========================================================
   CONTINUE BUTTON
========================================================= */

function updateContinueButton() {

    if (
        !continueButton
    ) {

        return;

    }


    const validation =
        validateLanguages();


    const courseReady =
        Boolean(
            currentCourse
        );


    continueButton.disabled =
        !courseReady ||
        !validation.valid ||
        isProcessing;

}


/* =========================================================
   CONTINUE CLICK
========================================================= */

continueButton?.addEventListener(
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


        const validation =
            validateLanguages();


        if (
            !validation.valid
        ) {

            showLanguageError(
                validation.message
            );

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


        try {

            isProcessing =
                true;


            continueButton.disabled =
                true;


            continueButton.innerHTML =
                "SAVING...";


            const pricing =
                getPricing();


            /*
             * Build the FINAL checkout
             * object.
             */

            const checkoutData =
                createCheckoutData(
                    pricing
                );


            /*
             * Save it.
             *
             * Payment page will read
             * exactly this object.
             */

            sessionStorage.setItem(
                "zenova_checkout",
                JSON.stringify(
                    checkoutData
                )
            );


            console.log(
                "ZENOVA CHECKOUT DATA:",
                checkoutData
            );


            /*
             * Go to payment page.
             *
             * NO PAYMENT IS MADE HERE.
             */

            const paymentUrl =
                `../payment/?courseId=${encodeURIComponent(
                    currentCourse.id
                )}`;


            window.location.href =
                paymentUrl;


        } catch (error) {

            console.error(
                "CHECKOUT CONTINUE ERROR:",
                error
            );


            showLanguageError(
                "Unable to continue. Please try again."
            );


            isProcessing =
                false;


            continueButton.innerHTML =
                `CONTINUE <span>→</span>`;


            updateContinueButton();

        }

    }
);


/* =========================================================
   SHOW LANGUAGE ERROR
========================================================= */

function showLanguageError(
    message
) {

    if (
        !languageError
    ) {

        return;

    }


    languageError.textContent =
        message;


    languageError.classList.remove(
        "hidden"
    );


    languageSection?.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


/* =========================================================
   CLEAR ERROR
========================================================= */

function clearLanguageError() {

    languageError?.classList.add(
        "hidden"
    );

}


/* =========================================================
   BACK
========================================================= */

backButton?.addEventListener(
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
   ERROR
========================================================= */

function showError(
    message
) {

    setText(
        errorMessage,
        message
    );


    errorSection?.classList.remove(
        "hidden"
    );


    hideLoading();

}


/* =========================================================
   LOADING
========================================================= */

function hideLoading() {

    loadingScreen?.classList.add(
        "hidden"
    );


    app?.classList.remove(
        "hidden"
    );

}

/* =========================================================
   ZENOVA EDUCATONS
   CHECKOUT
   =========================================================

   OLD ZENOVA APP CHECKOUT

   IMPORTANT:
   - Course source: crmCourses
   - Subject source: hybridSubjects
   - Checkout data: sessionStorage -> zenova_checkout

   LANGUAGE SYSTEM:
   0 languages -> no selection
   1 language  -> automatically selected
   2 languages -> 1st + 2nd
   3 languages -> 1st + 2nd + 3rd

   SUBJECT SYSTEM:
   - Reads courseId + crmCourseId
   - Deduplicates logical duplicates
   ========================================================= */

/* =========================================================
   FIREBASE
   ========================================================= */

import {
    auth,
    db
} from "../../firebase/firebase-config.js";

import {
    collection,
    doc,
    getDocs,
    onSnapshot,
    query,
    where
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
 * SOURCE OF TRUTH FOR LANGUAGES
 *
 * Never use selectedLanguage as the source of truth.
 */

let selectedLanguages = {
    first: "",
    second: "",
    third: ""
};

/*
 * Languages actually configured for this course.
 */

let availableLanguages = [];

/*
 * Subjects loaded for this course.
 */

let courseSubjects = [];

/* =========================================================
   ELEMENT HELPER
   ========================================================= */

function el(id) {
    return document.getElementById(id);
}

/* =========================================================
   ELEMENTS
   ========================================================= */

/* ---------------------------------------------------------
   LOADING / APP
--------------------------------------------------------- */

const loadingScreen =
    el("loadingScreen");

const app =
    el("app");

/* ---------------------------------------------------------
   HEADER
--------------------------------------------------------- */

const backButton =
    el("backButton");

const notificationButton =
    el("notificationButton");

/* ---------------------------------------------------------
   COURSE
--------------------------------------------------------- */

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

/* ---------------------------------------------------------
   LANGUAGE
--------------------------------------------------------- */

const languageSection =
    el("languageSection");

const languageOptions =
    el("languageOptions");

/*
 * Existing old HTML has:
 *
 * summaryLanguageRow
 * summaryLanguage
 *
 * We will reuse them.
 */

const summaryLanguageRow =
    el("summaryLanguageRow");

const summaryLanguage =
    el("summaryLanguage");

/* ---------------------------------------------------------
   COURSE SUMMARY
--------------------------------------------------------- */

const summaryCourseName =
    el("summaryCourseName");

const summaryClass =
    el("summaryClass");

/* ---------------------------------------------------------
   PRICING
--------------------------------------------------------- */

const originalPrice =
    el("originalPrice");

const discountRow =
    el("discountRow");

const discountAmount =
    el("discountAmount");

const finalPrice =
    el("finalPrice");

/* ---------------------------------------------------------
   PAYMENT
--------------------------------------------------------- */

const paymentBar =
    el("paymentBar");

const bottomPrice =
    el("bottomPrice");

const payNowButton =
    el("payNowButton");

/* ---------------------------------------------------------
   ERROR
--------------------------------------------------------- */

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

function startCourseListener(
    courseId
) {

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

            async snapshot => {

                try {

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

                    console.log(
                        "ZENOVA CHECKOUT COURSE:",
                        currentCourse
                    );

                    /*
                     * Inactive course protection.
                     */

                    if (
                        currentCourse.crmActive === false
                    ) {

                        showError(
                            "This course is currently unavailable."
                        );

                        return;
                    }

                    /*
                     * Render main course.
                     */

                    renderCheckout(
                        currentCourse
                    );

                    /*
                     * Load subjects for this course.
                     */

                    await loadSubjects(
                        currentCourse.id
                    );

                    /*
                     * Make application visible.
                     */

                    hideLoading();

                } catch (error) {

                    console.error(
                        "Checkout render error:",
                        error
                    );

                    showError(
                        getReadableError(error)
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

function renderCheckout(
    course
) {

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
       LANGUAGES
    ===================================================== */

    setupLanguages(
        course
    );

    /* =====================================================
       PRICING
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

        parts.push(
            className
        );

    }

    if (medium) {

        parts.push(
            medium
        );

    }

    return parts.length
        ? parts.join(" • ")
        : "Course details";

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
   LANGUAGE SYSTEM
   ========================================================= */

/*
 * Get languages configured for THIS COURSE.
 *
 * Supported Firebase structures:
 *
 * languages: [...]
 * availableLanguages: [...]
 * mediums: [...]
 * crmMediums: [...]
 *
 * crmMedium can also be a string.
 */

function getAvailableLanguages(
    course
) {

    let languages = [];

    /* -----------------------------------------------------
       ARRAY FORMATS
    ----------------------------------------------------- */

    if (
        Array.isArray(
            course?.languages
        )
    ) {

        languages =
            course.languages;

    }

    else if (
        Array.isArray(
            course?.availableLanguages
        )
    ) {

        languages =
            course.availableLanguages;

    }

    else if (
        Array.isArray(
            course?.mediums
        )
    ) {

        languages =
            course.mediums;

    }

    else if (
        Array.isArray(
            course?.crmMediums
        )
    ) {

        languages =
            course.crmMediums;

    }

    /* -----------------------------------------------------
       STRING FORMATS
    ----------------------------------------------------- */

    else if (
        typeof course?.crmMedium ===
        "string"
    ) {

        languages =
            splitLanguageString(
                course.crmMedium
            );

    }

    else if (
        typeof course?.medium ===
        "string"
    ) {

        languages =
            splitLanguageString(
                course.medium
            );

    }

    /*
     * Normalize.
     */

    languages =
        languages
            .map(
                item =>
                    normalizeLanguageValue(
                        item
                    )
            )
            .filter(Boolean);

    /*
     * Remove duplicates while preserving
     * the configured order.
     */

    const unique = [];

    const seen =
        new Set();

    languages.forEach(
        language => {

            const key =
                language
                    .toLowerCase()
                    .trim();

            if (
                seen.has(key)
            ) {

                return;

            }

            seen.add(key);

            unique.push(
                language
            );

        }
    );

    return unique;

}

/* =========================================================
   SPLIT LANGUAGE STRING
   ========================================================= */

function splitLanguageString(
    value
) {

    if (!value) {
        return [];
    }

    let text =
        String(value)
            .trim();

    /*
     * "Both" is NOT automatically treated as
     * Kannada + English here.
     *
     * We only expand it when it is clearly
     * being used as a course language config.
     */

    if (
        text.toLowerCase() ===
        "both"
    ) {

        return [
            "Kannada",
            "English"
        ];

    }

    /*
     * Common separators.
     */

    return text
        .split(
            /[,|/;]+/
        )
        .map(
            item =>
                item.trim()
        )
        .filter(Boolean);

}

/* =========================================================
   NORMALIZE LANGUAGE
   ========================================================= */

function normalizeLanguageValue(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    /*
     * If CRM stores objects:
     *
     * { name: "Kannada" }
     */

    if (
        typeof value ===
        "object"
    ) {

        return String(
            value.name ||
            value.language ||
            value.medium ||
            value.label ||
            ""
        ).trim();

    }

    const text =
        String(value)
            .trim();

    if (!text) {
        return "";
    }

    const lower =
        text.toLowerCase();

    if (
        lower ===
        "kannada medium"
    ) {

        return "Kannada";

    }

    if (
        lower ===
        "english medium"
    ) {

        return "English";

    }

    if (
        lower ===
        "hindi medium"
    ) {

        return "Hindi";

    }

    return text;

}

/* =========================================================
   SETUP LANGUAGES
   ========================================================= */

function setupLanguages(
    course
) {

    if (!languageSection) {
        return;
    }

    if (!languageOptions) {
        return;
    }

    /*
     * Get only languages configured
     * for this particular course.
     */

    availableLanguages =
        getAvailableLanguages(
            course
        );

    console.log(
        "AVAILABLE COURSE LANGUAGES:",
        availableLanguages
    );

    /*
     * Clear previous UI.
     */

    languageOptions.innerHTML =
        "";

    /*
     * Reset selection.
     */

    selectedLanguages = {

        first: "",
        second: "",
        third: ""

    };

    /* =====================================================
       ZERO LANGUAGES
    ===================================================== */

    if (
        availableLanguages.length ===
        0
    ) {

        languageSection.classList.add(
            "hidden"
        );

        if (summaryLanguageRow) {

            summaryLanguageRow.classList.add(
                "hidden"
            );

        }

        return;
    }

    /* =====================================================
       ONE LANGUAGE
    ===================================================== */

    if (
        availableLanguages.length ===
        1
    ) {

        selectedLanguages.first =
            availableLanguages[0];

        languageSection.classList.add(
            "hidden"
        );

        renderLanguageSummary();

        return;
    }

    /* =====================================================
       TWO OR THREE LANGUAGES
    ===================================================== */

    languageSection.classList.remove(
        "hidden"
    );

    /*
     * Create exactly the number of
     * positions configured.
     *
     * 2 -> first + second
     * 3 -> first + second + third
     */

    const positions = [
        {
            key: "first",
            label: "1st Language"
        },
        {
            key: "second",
            label: "2nd Language"
        },
        {
            key: "third",
            label: "3rd Language"
        }
    ];

    positions
        .slice(
            0,
            Math.min(
                availableLanguages.length,
                3
            )
        )
        .forEach(
            position => {

                const field =
                    createLanguageField(
                        position.key,
                        position.label
                    );

                languageOptions.appendChild(
                    field
                );

            }
        );

    updateLanguageAvailability();

    renderLanguageSummary();

}

/* =========================================================
   CREATE LANGUAGE FIELD
   ========================================================= */

function createLanguageField(
    key,
    label
) {

    const wrapper =
        document.createElement(
            "div"
        );

    wrapper.className =
        "language-field";

    const title =
        document.createElement(
            "label"
        );

    title.className =
        "language-field-label";

    title.textContent =
        label;

    const select =
        document.createElement(
            "select"
        );

    select.className =
        "language-select";

    select.dataset.languageKey =
        key;

    select.setAttribute(
        "aria-label",
        label
    );

    /*
     * Placeholder.
     */

    const placeholder =
        document.createElement(
            "option"
        );

    placeholder.value =
        "";

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
     * Add available languages.
     */

    availableLanguages.forEach(
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

    /*
     * Change event.
     */

    select.addEventListener(
        "change",
        () => {

            selectedLanguages[key] =
                select.value;

            /*
             * Remove invalid
             * duplicate selections.
             */

            updateLanguageAvailability();

            /*
             * Update summary.
             */

            renderLanguageSummary();

            /*
             * Enable / disable continue.
             */

            updateContinueState();

            /*
             * Save draft.
             */

            saveCheckoutDraft();

        }
    );

    wrapper.appendChild(
        title
    );

    wrapper.appendChild(
        select
    );

    return wrapper;

}

/* =========================================================
   LANGUAGE AVAILABILITY
   ========================================================= */

function updateLanguageAvailability() {

    if (!languageOptions) {
        return;
    }

    const selects =
        Array.from(
            languageOptions.querySelectorAll(
                ".language-select"
            )
        );

    /*
     * Current selections.
     */

    const selectedValues =
        selects
            .map(
                select =>
                    select.value
            )
            .filter(Boolean);

    /*
     * Disable a language if it is
     * already selected in another field.
     */

    selects.forEach(
        select => {

            Array.from(
                select.options
            ).forEach(
                option => {

                    if (!option.value) {
                        return;
                    }

                    const selectedElsewhere =
                        selectedValues.includes(
                            option.value
                        ) &&
                        select.value !==
                        option.value;

                    option.disabled =
                        selectedElsewhere;

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
     * No language configured.
     */

    if (
        count ===
        0
    ) {

        return {

            valid: true,

            message: ""

        };

    }

    const selections = [];

    if (
        count >= 1
    ) {

        selections.push(
            selectedLanguages.first
        );

    }

    if (
        count >= 2
    ) {

        selections.push(
            selectedLanguages.second
        );

    }

    if (
        count >= 3
    ) {

        selections.push(
            selectedLanguages.third
        );

    }

    /*
     * Every configured position
     * must have a selection.
     */

    for (
        let i = 0;
        i < selections.length;
        i++
    ) {

        if (
            !selections[i]
        ) {

            const position =
                i === 0
                    ? "1st"
                    : i === 1
                        ? "2nd"
                        : "3rd";

            return {

                valid: false,

                message:
                    `Please select your ${position} Language.`

            };

        }

    }

    /*
     * No duplicate language.
     */

    const normalized =
        selections.map(
            value =>
                value
                    .trim()
                    .toLowerCase()
        );

    if (
        new Set(
            normalized
        ).size !==
        normalized.length
    ) {

        return {

            valid: false,

            message:
                "Please select different languages for each position."

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

function renderLanguageSummary() {

    if (!summaryLanguageRow) {
        return;
    }

    /*
     * No languages.
     */

    if (
        availableLanguages.length ===
        0
    ) {

        summaryLanguageRow.classList.add(
            "hidden"
        );

        return;
    }

    /*
     * We use the existing summaryLanguage
     * element and make it contain all
     * selected positions.
     */

    if (!summaryLanguage) {
        return;
    }

    summaryLanguage.innerHTML =
        "";

    const selections = [];

    if (
        availableLanguages.length >=
        1
    ) {

        selections.push({

            label:
                "1st Language",

            value:
                selectedLanguages.first

        });

    }

    if (
        availableLanguages.length >=
        2
    ) {

        selections.push({

            label:
                "2nd Language",

            value:
                selectedLanguages.second

        });

    }

    if (
        availableLanguages.length >=
        3
    ) {

        selections.push({

            label:
                "3rd Language",

            value:
                selectedLanguages.third

        });

    }

    selections.forEach(
        item => {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "summary-language-item";

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

            summaryLanguage.appendChild(
                row
            );

        }
    );

    summaryLanguageRow.classList.remove(
        "hidden"
    );

}

/* =========================================================
   SAVE CHECKOUT DRAFT
   ========================================================= */

function saveCheckoutDraft() {

    if (!currentCourse) {
        return;
    }

    const pricing =
        calculatePricing(
            currentCourse
        );

    const languageList =
        getSelectedLanguageList();

    const checkoutData = {

        /* -------------------------------------------------
           COURSE
        ------------------------------------------------- */

        courseId:
            currentCourse.id,

        courseName:
            currentCourse.crmCourseName ||
            currentCourse.courseName ||
            currentCourse.name ||
            currentCourse.title ||
            "",

        courseCode:
            currentCourse.crmCourseCode ||
            currentCourse.courseCode ||
            "",

        className:
            currentCourse.crmClass ||
            currentCourse.className ||
            currentCourse.targetClass ||
            "",

        board:
            currentCourse.crmBoard ||
            currentCourse.board ||
            "",

        medium:
            getCourseMediumText(
                currentCourse
            ),

        /* -------------------------------------------------
           LANGUAGE SOURCE OF TRUTH
        ------------------------------------------------- */

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
            languageList,

        /*
         * OLD COMPATIBILITY FIELD.
         *
         * Do NOT use this as source of truth.
         */

        selectedLanguage:
            languageList.join(
                " • "
            ),

        /* -------------------------------------------------
           SUBJECTS
        ------------------------------------------------- */

        subjects:
            courseSubjects.map(
                subject => ({

                    id:
                        subject.id,

                    name:
                        subject.name,

                    language:
                        subject.language,

                    medium:
                        subject.medium

                })
            ),

        /* -------------------------------------------------
           PRICE
        ------------------------------------------------- */

        price:
            pricing.price,

        discount:
            pricing.discount,

        finalPrice:
            pricing.finalPrice,

        /* -------------------------------------------------
           STUDENT
        ------------------------------------------------- */

        studentUid:
            currentUser?.uid ||
            "",

        studentName:
            currentUser?.displayName ||
            "",

        email:
            currentUser?.email ||
            "",

        /* -------------------------------------------------
           TIMESTAMP
        ------------------------------------------------- */

        createdAt:
            Date.now()

    };

    sessionStorage.setItem(
        "zenova_checkout",
        JSON.stringify(
            checkoutData
        )
    );

    console.log(
        "ZENOVA CHECKOUT DRAFT:",
        checkoutData
    );

}

/* =========================================================
   GET SELECTED LANGUAGE LIST
   ========================================================= */

function getSelectedLanguageList() {

    const list = [];

    if (
        availableLanguages.length >=
        1 &&
        selectedLanguages.first
    ) {

        list.push(
            selectedLanguages.first
        );

    }

    if (
        availableLanguages.length >=
        2 &&
        selectedLanguages.second
    ) {

        list.push(
            selectedLanguages.second
        );

    }

    if (
        availableLanguages.length >=
        3 &&
        selectedLanguages.third
    ) {

        list.push(
            selectedLanguages.third
        );

    }

    return list;

}

/* =========================================================
   SUBJECT LOADING
   ========================================================= */

/*
 * IMPORTANT:
 *
 * The old checkout was effectively getting
 * duplicate logical subjects because the same
 * subject could be returned through:
 *
 * courseId
 * crmCourseId
 *
 * We query both because the old database may
 * contain either field.
 *
 * Then we deduplicate locally.
 *
 * Firestore returns documents from queries;
 * logical duplicates across different documents
 * need application-level handling. :contentReference[oaicite:1]{index=1}
 */

async function loadSubjects(
    courseId
) {

    courseSubjects = [];

    if (!courseId) {
        return;
    }

    try {

        const subjectsCollection =
            collection(
                db,
                "hybridSubjects"
            );

        /*
         * Query #1
         *
         * courseId
         */

        const courseIdQuery =
            query(
                subjectsCollection,
                where(
                    "courseId",
                    "==",
                    courseId
                )
            );

        /*
         * Query #2
         *
         * crmCourseId
         */

        const crmCourseIdQuery =
            query(
                subjectsCollection,
                where(
                    "crmCourseId",
                    "==",
                    courseId
                )
            );

        const [
            courseIdSnapshot,
            crmCourseIdSnapshot
        ] =
            await Promise.all([
                getDocs(
                    courseIdQuery
                ),
                getDocs(
                    crmCourseIdQuery
                )
            ]);

        /*
         * Store every document first.
         */

        const rawSubjects = [];

        courseIdSnapshot.forEach(
            subjectDoc => {

                rawSubjects.push({

                    id:
                        subjectDoc.id,

                    ...subjectDoc.data()

                });

            }
        );

        crmCourseIdSnapshot.forEach(
            subjectDoc => {

                rawSubjects.push({

                    id:
                        subjectDoc.id,

                    ...subjectDoc.data()

                });

            }
        );

        console.log(
            "RAW CHECKOUT SUBJECTS:",
            rawSubjects
        );

        /*
         * DEDUPLICATION
         */

        const subjectMap =
            new Map();

        rawSubjects.forEach(
            subject => {

                /*
                 * Subject name.
                 */

                const subjectName =
                    String(
                        subject.name ||
                        subject.subjectName ||
                        subject.title ||
                        ""
                    ).trim();

                if (!subjectName) {
                    return;
                }

                /*
                 * Subject language / medium.
                 */

                const subjectLanguage =
                    String(
                        subject.language ||
                        subject.medium ||
                        subject.selectedLanguage ||
                        subject.crmMedium ||
                        ""
                    ).trim();

                /*
                 * Normalize name.
                 */

                const normalizedName =
                    normalizeForKey(
                        subjectName
                    );

                /*
                 * Normalize language.
                 */

                const normalizedLanguage =
                    normalizeForKey(
                        subjectLanguage
                    );

                /*
                 * IMPORTANT:
                 *
                 * Same subject + same language
                 * = same logical subject.
                 *
                 * Example:
                 *
                 * Mathematics + Both
                 * Mathematics + Both
                 *
                 * -> ONE
                 *
                 *
                 * But:
                 *
                 * Mathematics + Kannada
                 * Mathematics + English
                 *
                 * -> TWO
                 */

                const uniqueKey =
                    `${normalizedName}__${normalizedLanguage}`;

                if (
                    subjectMap.has(
                        uniqueKey
                    )
                ) {

                    /*
                     * Already have the same
                     * logical subject.
                     */

                    return;

                }

                subjectMap.set(
                    uniqueKey,
                    {

                        ...subject,

                        id:
                            subject.id,

                        name:
                            subjectName,

                        language:
                            subjectLanguage,

                        medium:
                            subject.medium ||
                            subjectLanguage

                    }
                );

            }
        );

        /*
         * Convert map to array.
         */

        courseSubjects =
            Array.from(
                subjectMap.values()
            );

        /*
         * Sort.
         */

        courseSubjects.sort(
            sortSubjects
        );

        console.log(
            "DEDUPLICATED CHECKOUT SUBJECTS:",
            courseSubjects
        );

        /*
         * Render.
         */

        renderSubjects(
            courseSubjects
        );

        /*
         * Save updated draft.
         */

        saveCheckoutDraft();

    } catch (error) {

        console.error(
            "CHECKOUT SUBJECT LOAD ERROR:",
            error
        );

        /*
         * Do NOT stop checkout just because
         * subjects failed.
         *
         * Course/payment can still continue.
         */

        courseSubjects = [];

        renderSubjects(
            []
        );

    }

}

/* =========================================================
   SUBJECT SORT
   ========================================================= */

function sortSubjects(
    a,
    b
) {

    const priorityA =
        Number(
            a.priority ??
            a.order ??
            a.position ??
            9999
        );

    const priorityB =
        Number(
            b.priority ??
            b.order ??
            b.position ??
            9999
        );

    if (
        priorityA !==
        priorityB
    ) {

        return (
            priorityA -
            priorityB
        );

    }

    return String(
        a.name ||
        ""
    ).localeCompare(
        String(
            b.name ||
            ""
        )
    );

}

/* =========================================================
   NORMALIZE FOR KEY
   ========================================================= */

function normalizeForKey(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase()
        .replace(
            /\s+/g,
            " "
        );

}

/* =========================================================
   RENDER SUBJECTS
   ========================================================= */

function renderSubjects(
    subjects
) {

    /*
     * Try to find an existing subjects
     * container from the current/older HTML.
     */

    let subjectsContainer =
        el("subjectsContainer");

    if (!subjectsContainer) {

        subjectsContainer =
            el("subjectList");

    }

    if (!subjectsContainer) {

        subjectsContainer =
            el("subjectsList");

    }

    if (!subjectsContainer) {

        subjectsContainer =
            el("subjectsGrid");

    }

    /*
     * If old HTML doesn't have a subjects
     * container, create one automatically.
     */

    if (!subjectsContainer) {

        subjectsContainer =
            createSubjectsContainer();

    }

    if (!subjectsContainer) {
        return;
    }

    subjectsContainer.innerHTML =
        "";

    /*
     * No subjects.
     */

    if (
        !subjects ||
        subjects.length ===
        0
    ) {

        /*
         * Keep container hidden rather than
         * showing an empty subject block.
         */

        subjectsContainer.classList.add(
            "hidden"
        );

        return;
    }

    subjectsContainer.classList.remove(
        "hidden"
    );

    /*
     * Render one card per logical subject.
     */

    subjects.forEach(
        subject => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "checkout-subject-card";

            const name =
                document.createElement(
                    "strong"
                );

            name.className =
                "checkout-subject-name";

            name.textContent =
                subject.name ||
                "Subject";

            const medium =
                document.createElement(
                    "span"
                );

            medium.className =
                "checkout-subject-medium";

            medium.textContent =
                subject.medium ||
                subject.language ||
                "";

            card.appendChild(
                name
            );

            if (
                medium.textContent
            ) {

                card.appendChild(
                    medium
                );

            }

            subjectsContainer.appendChild(
                card
            );

        }
    );

}

/* =========================================================
   CREATE SUBJECT CONTAINER
   ========================================================= */

function createSubjectsContainer() {

    const checkoutContent =
        document.querySelector(
            ".checkout-content"
        );

    if (!checkoutContent) {
        return null;
    }

    /*
     * Create section.
     */

    const section =
        document.createElement(
            "section"
        );

    section.id =
        "subjectsContainer";

    section.className =
        "section checkout-subjects-section";

    /*
     * Heading.
     */

    const heading =
        document.createElement(
            "div"
        );

    heading.className =
        "section-heading";

    const headingInner =
        document.createElement(
            "div"
        );

    const label =
        document.createElement(
            "span"
        );

    label.className =
        "section-label";

    label.textContent =
        "YOUR COURSE";

    const title =
        document.createElement(
            "h2"
        );

    title.textContent =
        "Subjects";

    headingInner.appendChild(
        label
    );

    headingInner.appendChild(
        title
    );

    heading.appendChild(
        headingInner
    );

    section.appendChild(
        heading
    );

    /*
     * Subject list.
     */

    const list =
        document.createElement(
            "div"
        );

    list.id =
        "checkoutSubjectList";

    list.className =
        "checkout-subject-list";

    section.appendChild(
        list
    );

    /*
     * Insert before Course Details.
     */

    const sections =
        checkoutContent.querySelectorAll(
            ".section"
        );

    if (
        sections.length > 0
    ) {

        checkoutContent.insertBefore(
            section,
            sections[0]
        );

    } else {

        checkoutContent.prepend(
            section
        );

    }

    return list;

}

/* =========================================================
   CONTINUE STATE
   ========================================================= */

function updateContinueState() {

    if (!payNowButton) {
        return;
    }

    const validation =
        validateLanguages();

    if (
        !validation.valid
    ) {

        payNowButton.disabled =
            false;

        return;

    }

    payNowButton.disabled =
        false;

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
        courseType ===
        "FREE" ||
        course.isPaid ===
        false
    ) {

        price = 0;

        discount = 0;

        finalPrice = 0;

    }

    /*
     * Missing final price.
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
     * Only final price exists.
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
     * Discount safety.
     */

    if (
        discount >
        price
    ) {

        discount =
            price;

    }

    /*
     * Final safety.
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
    } =
        pricing;

    /*
     * FREE
     */

    if (
        type ===
        "FREE"
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
        discount >
        0
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
   PAYMENT BUTTON
   ========================================================= */

function updatePayButton(
    amount
) {

    if (!payNowButton) {
        return;
    }

    if (
        Number(amount) <=
        0
    ) {

        payNowButton.innerHTML =
            `GET COURSE <span>→</span>`;

        payNowButton.dataset.action =
            "free";

        return;
    }

    payNowButton.innerHTML =
        `CONTINUE <span>→</span>`;

    payNowButton.dataset.action =
        "payment";

}

/* =========================================================
   PAYMENT BUTTON CLICK
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
             * Validate languages.
             */

            const validation =
                validateLanguages();

            if (
                !validation.valid
            ) {

                showToast(
                    validation.message
                );

                if (languageSection) {

                    languageSection.scrollIntoView({

                        behavior:
                            "smooth",

                        block:
                            "center"

                    });

                }

                return;

            }

            /*
             * Save final checkout data.
             */

            saveCheckoutDraft();

            const pricing =
                calculatePricing(
                    currentCourse
                );

            /*
             * FREE
             */

            if (
                pricing.finalPrice <=
                0
            ) {

                await handleFreeCourse();

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
   FREE COURSE
   ========================================================= */

async function handleFreeCourse() {

    try {

        setPayingState(
            true,
            "PROCESSING..."
        );

        /*
         * Make sure latest data is saved.
         */

        saveCheckoutDraft();

        const courseId =
            currentCourse.id;

        let url =
            `../success/?courseId=${encodeURIComponent(
                courseId
            )}&type=FREE`;

        const languages =
            getSelectedLanguageList();

        if (
            languages.length
        ) {

            url +=
                `&languages=${encodeURIComponent(
                    languages.join(",")
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

        /*
         * Make absolutely sure
         * final language selections
         * are valid.
         */

        const validation =
            validateLanguages();

        if (
            !validation.valid
        ) {

            showToast(
                validation.message
            );

            setPayingState(
                false
            );

            return;

        }

        const languageList =
            getSelectedLanguageList();

        /*
         * COMPLETE CHECKOUT OBJECT
         */

        const checkoutData = {

            /* ---------------------------------------------
               COURSE
            ---------------------------------------------- */

            courseId:
                currentCourse.id,

            courseName:
                currentCourse.crmCourseName ||
                currentCourse.courseName ||
                currentCourse.name ||
                currentCourse.title ||
                "",

            courseCode:
                currentCourse.crmCourseCode ||
                currentCourse.courseCode ||
                "",

            className:
                currentCourse.crmClass ||
                currentCourse.className ||
                currentCourse.targetClass ||
                "",

            board:
                currentCourse.crmBoard ||
                currentCourse.board ||
                "",

            medium:
                getCourseMediumText(
                    currentCourse
                ),

            /* ---------------------------------------------
               LANGUAGE SOURCE OF TRUTH
            ---------------------------------------------- */

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
                languageList,

            /*
             * Compatibility with old payment code.
             */

            selectedLanguage:
                languageList.join(
                    " • "
                ),

            /* ---------------------------------------------
               SUBJECTS
            ---------------------------------------------- */

            subjects:
                courseSubjects.map(
                    subject => ({

                        id:
                            subject.id,

                        name:
                            subject.name,

                        language:
                            subject.language ||
                            "",

                        medium:
                            subject.medium ||
                            ""

                    })
                ),

            /* ---------------------------------------------
               PRICE
            ---------------------------------------------- */

            price:
                pricing.price,

            discount:
                pricing.discount,

            finalPrice:
                pricing.finalPrice,

            /* ---------------------------------------------
               STUDENT
            ---------------------------------------------- */

            studentUid:
                currentUser.uid,

            studentName:
                currentUser.displayName ||
                "",

            email:
                currentUser.email ||
                "",

            /* ---------------------------------------------
               TIMESTAMP
            ---------------------------------------------- */

            createdAt:
                Date.now()

        };

        /*
         * SAVE.
         */

        sessionStorage.setItem(
            "zenova_checkout",
            JSON.stringify(
                checkoutData
            )
        );

        console.log(
            "FINAL ZENOVA CHECKOUT DATA:",
            checkoutData
        );

        /*
         * PAYMENT PAGE
         */

        const url =
            `../payment/?courseId=${encodeURIComponent(
                currentCourse.id
            )}`;

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
    text = "CONTINUE →"
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
            escapeHtml(
                text
            );

        return;

    }

    const amount =
        currentCourse
            ? calculatePricing(
                currentCourse
            ).finalPrice
            : 0;

    if (
        Number(amount) <=
        0
    ) {

        payNowButton.innerHTML =
            `GET COURSE <span>→</span>`;

    } else {

        payNowButton.innerHTML =
            `CONTINUE <span>→</span>`;

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
                window.history.length >
                1
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

let toastTimer =
    null;

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

        toast.style.transition =
            "opacity .25s ease";

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
        value ??
        "";

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
        number <=
        0
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
   COURSE MEDIUM
   ========================================================= */

function getCourseMediumText(
    course
) {

    if (
        Array.isArray(
            course?.crmMedium
        )
    ) {

        return course.crmMedium.join(
            ", "
        );

    }

    if (
        course?.crmMedium
    ) {

        return String(
            course.crmMedium
        );

    }

    if (
        Array.isArray(
            course?.mediums
        )
    ) {

        return course.mediums.join(
            ", "
        );

    }

    if (
        Array.isArray(
            course?.crmMediums
        )
    ) {

        return course.crmMediums.join(
            ", "
        );

    }

    if (
        course?.medium
    ) {

        return String(
            course.medium
        );

    }

    return "";

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

    const normalized =
        String(value)
            .trim()
            .toUpperCase();

    return (
        names[normalized] ||
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
        value ??
        ""
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
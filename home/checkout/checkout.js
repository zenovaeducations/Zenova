/* =========================================================
   ZENOVA CHECKOUT
   Completely new checkout logic

   Source of truth:
   firstLanguage
   secondLanguage
   thirdLanguage

   Compatibility:
   selectedLanguage
========================================================= */

import { auth, db } from "../../firebase/firebase-config.js";

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
   DOM
========================================================= */

const loadingScreen =
    document.getElementById("loadingScreen");

const checkoutApp =
    document.getElementById("checkoutApp");

const errorScreen =
    document.getElementById("errorScreen");

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

const courseClass =
    document.getElementById("courseClass");

const courseBoard =
    document.getElementById("courseBoard");

const courseCode =
    document.getElementById("courseCode");

const subjectsSection =
    document.getElementById("subjectsSection");

const subjectsList =
    document.getElementById("subjectsList");

const subjectsEmpty =
    document.getElementById("subjectsEmpty");

const subjectCount =
    document.getElementById("subjectCount");

const languageSection =
    document.getElementById("languageSection");

const languageOptions =
    document.getElementById("languageOptions");

const languageError =
    document.getElementById("languageError");

const summaryCourseName =
    document.getElementById("summaryCourseName");

const summaryClass =
    document.getElementById("summaryClass");

const summaryLanguageFirstRow =
    document.getElementById("summaryLanguageFirstRow");

const summaryLanguageSecondRow =
    document.getElementById("summaryLanguageSecondRow");

const summaryLanguageThirdRow =
    document.getElementById("summaryLanguageThirdRow");

const summaryLanguageFirst =
    document.getElementById("summaryLanguageFirst");

const summaryLanguageSecond =
    document.getElementById("summaryLanguageSecond");

const summaryLanguageThird =
    document.getElementById("summaryLanguageThird");

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

const continueButton =
    document.getElementById("continueButton");


/* =========================================================
   STATE
========================================================= */

let currentCourse = null;

let currentUser = null;

let currentSubjects = [];

let availableLanguages = [];

let selectedLanguages = {
    first: "",
    second: "",
    third: ""
};

let unsubscribeCourse = null;


/* =========================================================
   URL
========================================================= */

const params = new URLSearchParams(
    window.location.search
);

const courseId =
    params.get("courseId");


/* =========================================================
   HELPERS
========================================================= */

function normalize(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .trim()
        .replace(/\s+/g, " ");
}


function normalizeKey(value) {

    return normalize(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
}


function escapeHtml(value) {

    return normalize(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function showLoading() {

    loadingScreen.classList.remove("hidden");
    checkoutApp.classList.add("hidden");
    errorScreen.classList.add("hidden");
}


function showApp() {

    loadingScreen.classList.add("hidden");
    errorScreen.classList.add("hidden");
    checkoutApp.classList.remove("hidden");
}


function showError(message) {

    loadingScreen.classList.add("hidden");
    checkoutApp.classList.add("hidden");

    errorMessage.textContent =
        message || "Something went wrong.";

    errorScreen.classList.remove("hidden");
}


function formatMoney(value) {

    const number = Number(value) || 0;

    return "₹" + number.toLocaleString("en-IN");
}


function firstExisting(data, keys) {

    for (const key of keys) {

        const value = data?.[key];

        if (
            value !== undefined &&
            value !== null &&
            normalize(value) !== ""
        ) {
            return value;
        }
    }

    return "";
}


/* =========================================================
   COURSE LANGUAGE EXTRACTION
========================================================= */

function extractLanguages(course) {

    const result = [];


    function add(value) {

        if (!value) return;


        if (Array.isArray(value)) {

            value.forEach(add);

            return;
        }


        if (typeof value === "object") {

            const possibleValue =
                firstExisting(
                    value,
                    [
                        "name",
                        "language",
                        "label",
                        "value",
                        "medium"
                    ]
                );

            if (possibleValue) {
                add(possibleValue);
            }

            return;
        }


        const text = normalize(value);

        if (!text) return;


        /*
         * Support strings such as:
         *
         * Kannada
         * Kannada, English
         * Kannada • English • Hindi
         * Kannada / English / Hindi
         */

        text
            .split(/[•,|/]+/)
            .map(item => normalize(item))
            .filter(Boolean)
            .forEach(language => {

                const key =
                    normalizeKey(language);

                if (!key) return;

                if (
                    !result.some(
                        item =>
                            normalizeKey(item) === key
                    )
                ) {
                    result.push(language);
                }
            });
    }


    /*
     * Preferred course-level language arrays.
     */
    add(course?.languages);

    add(course?.availableLanguages);

    add(course?.mediums);

    add(course?.crmMediums);


    /*
     * Existing old-course fields.
     */
    add(course?.crmMedium);

    add(course?.medium);


    /*
     * Some old records may store language
     * configuration under other common fields.
     */
    add(course?.languagesAvailable);

    add(course?.languageOptions);


    return result.slice(0, 3);
}


/* =========================================================
   RENDER LANGUAGE SECTION
========================================================= */

function renderLanguageSection() {

    languageOptions.innerHTML = "";

    languageError.textContent = "";

    languageError.classList.add("hidden");


    selectedLanguages = {
        first: "",
        second: "",
        third: ""
    };


    /*
     * 0 languages
     *
     * No language UI.
     */
    if (availableLanguages.length === 0) {

        languageSection.classList.add("hidden");

        updateLanguageSummary();

        return;
    }


    /*
     * 1 language
     *
     * Automatically selected.
     */
    if (availableLanguages.length === 1) {

        selectedLanguages.first =
            availableLanguages[0];

        languageSection.classList.remove("hidden");

        createLanguageField(
            1,
            availableLanguages,
            selectedLanguages.first
        );

        const firstSelect =
            document.getElementById(
                "languageSelect1"
            );

        if (firstSelect) {
            firstSelect.disabled = true;
        }

        updateLanguageSummary();

        return;
    }


    /*
     * 2 or 3 languages.
     */
    languageSection.classList.remove("hidden");


    for (
        let position = 1;
        position <= availableLanguages.length;
        position++
    ) {

        createLanguageField(
            position,
            availableLanguages,
            ""
        );
    }


    updateLanguageSummary();
}


/* =========================================================
   CREATE LANGUAGE FIELD
========================================================= */

function createLanguageField(
    position,
    languages,
    selectedValue
) {

    const field =
        document.createElement("div");

    field.className =
        "language-field";


    const label =
        document.createElement("label");

    label.setAttribute(
        "for",
        `languageSelect${position}`
    );

    label.textContent =
        `${position}${getOrdinalSuffix(position)} Language`;


    const select =
        document.createElement("select");

    select.id =
        `languageSelect${position}`;

    select.dataset.position =
        String(position);


    const placeholder =
        document.createElement("option");

    placeholder.value = "";

    placeholder.textContent =
        `Select ${position}${getOrdinalSuffix(position)} language`;

    placeholder.disabled = true;

    placeholder.selected =
        !selectedValue;

    select.appendChild(placeholder);


    languages.forEach(language => {

        const option =
            document.createElement("option");

        option.value = language;

        option.textContent = language;

        option.selected =
            normalizeKey(language) ===
            normalizeKey(selectedValue);

        select.appendChild(option);
    });


    select.addEventListener(
        "change",
        handleLanguageChange
    );


    field.appendChild(label);

    field.appendChild(select);

    languageOptions.appendChild(field);
}


/* =========================================================
   ORDINAL
========================================================= */

function getOrdinalSuffix(number) {

    if (number === 1) return "st";

    if (number === 2) return "nd";

    if (number === 3) return "rd";

    return "th";
}


/* =========================================================
   LANGUAGE CHANGE
========================================================= */

function handleLanguageChange(event) {

    const position =
        Number(event.target.dataset.position);

    const value =
        normalize(event.target.value);


    /*
     * Re-read all selections.
     */
    selectedLanguages.first =
        document.getElementById("languageSelect1")
            ?.value || "";

    selectedLanguages.second =
        document.getElementById("languageSelect2")
            ?.value || "";

    selectedLanguages.third =
        document.getElementById("languageSelect3")
            ?.value || "";


    /*
     * Prevent duplicate language selections.
     */
    const selections = [
        selectedLanguages.first,
        selectedLanguages.second,
        selectedLanguages.third
    ].filter(Boolean);


    const keys =
        selections.map(normalizeKey);


    const duplicateExists =
        keys.length !== new Set(keys).size;


    if (duplicateExists) {

        showLanguageError(
            "You cannot select the same language more than once."
        );


        /*
         * Reset the changed field.
         */
        if (position === 1) {
            selectedLanguages.first = "";
        }

        if (position === 2) {
            selectedLanguages.second = "";
        }

        if (position === 3) {
            selectedLanguages.third = "";
        }


        event.target.value = "";

        updateLanguageSummary();

        return;
    }


    clearLanguageError();

    updateLanguageSelectOptions();

    updateLanguageSummary();
}


/* =========================================================
   UPDATE LANGUAGE OPTIONS
========================================================= */

function updateLanguageSelectOptions() {

    const selects =
        languageOptions.querySelectorAll(
            "select"
        );


    selects.forEach(select => {

        const currentValue =
            select.value;


        const otherValues = [
            selectedLanguages.first,
            selectedLanguages.second,
            selectedLanguages.third
        ]
            .filter(Boolean)
            .filter(
                value =>
                    normalizeKey(value) !==
                    normalizeKey(currentValue)
            );


        Array.from(
            select.options
        ).forEach(option => {

            if (!option.value) return;


            const shouldDisable =
                otherValues.some(
                    value =>
                        normalizeKey(value) ===
                        normalizeKey(option.value)
                );


            option.disabled =
                shouldDisable;
        });
    });
}


/* =========================================================
   LANGUAGE ERROR
========================================================= */

function showLanguageError(message) {

    languageError.textContent =
        message;

    languageError.classList.remove(
        "hidden"
    );
}


function clearLanguageError() {

    languageError.textContent = "";

    languageError.classList.add(
        "hidden"
    );
}


/* =========================================================
   LANGUAGE SUMMARY
========================================================= */

function updateLanguageSummary() {

    updateSummaryRow(
        summaryLanguageFirstRow,
        summaryLanguageFirst,
        selectedLanguages.first
    );

    updateSummaryRow(
        summaryLanguageSecondRow,
        summaryLanguageSecond,
        selectedLanguages.second
    );

    updateSummaryRow(
        summaryLanguageThirdRow,
        summaryLanguageThird,
        selectedLanguages.third
    );
}


function updateSummaryRow(
    row,
    valueElement,
    value
) {

    if (value) {

        row.classList.remove("hidden");

        valueElement.textContent =
            value;

    } else {

        row.classList.add("hidden");

        valueElement.textContent =
            "—";
    }
}


/* =========================================================
   LOAD COURSE
========================================================= */

async function loadCourse() {

    if (!courseId) {

        showError(
            "No course was selected. Please return and select a course."
        );

        return;
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


                renderCourse();

                await loadSubjects();


                availableLanguages =
                    extractLanguages(
                        currentCourse
                    );


                renderLanguageSection();

                renderPricing();

                saveCheckoutDraft();

                showApp();
            },

            error => {

                console.error(
                    "Course listener error:",
                    error
                );

                showError(
                    "Unable to load this course. Please try again."
                );
            }
        );
}


/* =========================================================
   RENDER COURSE
========================================================= */

function renderCourse() {

    const course =
        currentCourse;


    const name =
        firstExisting(
            course,
            [
                "crmCourseName",
                "courseName",
                "name",
                "title"
            ]
        ) || "Course";


    const className =
        firstExisting(
            course,
            [
                "crmClass",
                "className",
                "class",
                "standard"
            ]
        ) || "—";


    const board =
        firstExisting(
            course,
            [
                "crmBoard",
                "board"
            ]
        ) || "—";


    const code =
        firstExisting(
            course,
            [
                "crmCourseCode",
                "courseCode",
                "code"
            ]
        );


    const image =
        firstExisting(
            course,
            [
                "crmImageUrl",
                "imageUrl",
                "image",
                "thumbnail"
            ]
        );


    courseName.textContent =
        name;

    courseClass.textContent =
        className;

    courseBoard.textContent =
        board;


    if (code) {

        courseCode.textContent =
            code;

        courseCode.classList.remove(
            "hidden"
        );

    } else {

        courseCode.classList.add(
            "hidden"
        );
    }


    if (image) {

        courseImage.src =
            image;

        courseImage.classList.remove(
            "hidden"
        );

        courseImageFallback.classList.add(
            "hidden"
        );

    } else {

        showCourseFallback();
    }


    courseImage.onerror = () => {

        showCourseFallback();
    };


    summaryCourseName.textContent =
        name;

    summaryClass.textContent =
        className;
}


/* =========================================================
   IMAGE FALLBACK
========================================================= */

function showCourseFallback() {

    courseImage.classList.add(
        "hidden"
    );

    courseImageFallback.classList.remove(
        "hidden"
    );
}


/* =========================================================
   LOAD SUBJECTS
========================================================= */

async function loadSubjects() {

    subjectsList.innerHTML = "";

    subjectsEmpty.classList.add(
        "hidden"
    );


    const subjectMap =
        new Map();


    try {

        /*
         * Query using courseId.
         */
        const courseIdQuery =
            query(
                collection(
                    db,
                    "hybridSubjects"
                ),
                where(
                    "courseId",
                    "==",
                    currentCourse.id
                )
            );


        /*
         * Query using old crmCourseId.
         */
        const crmCourseIdQuery =
            query(
                collection(
                    db,
                    "hybridSubjects"
                ),
                where(
                    "crmCourseId",
                    "==",
                    currentCourse.id
                )
            );


        const [
            courseIdSnapshot,
            crmCourseIdSnapshot
        ] = await Promise.all([
            getDocs(courseIdQuery),
            getDocs(crmCourseIdQuery)
        ]);


        /*
         * Add documents into a Map.
         *
         * IMPORTANT:
         * We don't simply concatenate the two
         * Firestore query results.
         *
         * The same logical subject may exist
         * in both query results.
         */
        const documents = [
            ...courseIdSnapshot.docs,
            ...crmCourseIdSnapshot.docs
        ];


        documents.forEach(documentSnapshot => {

            const data =
                documentSnapshot.data();


            const name =
                firstExisting(
                    data,
                    [
                        "subjectName",
                        "name",
                        "title",
                        "subject"
                    ]
                );


            if (!name) return;


            const language =
                firstExisting(
                    data,
                    [
                        "language",
                        "medium",
                        "subjectLanguage",
                        "subjectMedium"
                    ]
                ) || "Both";


            /*
             * Logical uniqueness:
             *
             * Mathematics + Both
             *
             * is one subject.
             *
             * Mathematics + Kannada
             *
             * and
             *
             * Mathematics + English
             *
             * remain different.
             */
            const key =
                `${normalizeKey(name)}__${normalizeKey(language)}`;


            if (!subjectMap.has(key)) {

                subjectMap.set(
                    key,
                    {
                        id: documentSnapshot.id,
                        name: normalize(name),
                        language: normalize(language)
                    }
                );
            }
        });


        currentSubjects =
            Array.from(
                subjectMap.values()
            );


        renderSubjects();

    } catch (error) {

        console.error(
            "Subject loading error:",
            error
        );


        /*
         * Don't break checkout merely because
         * subject metadata cannot be read.
         */
        currentSubjects = [];

        renderSubjects();
    }
}


/* =========================================================
   RENDER SUBJECTS
========================================================= */

function renderSubjects() {

    subjectsList.innerHTML = "";


    subjectCount.textContent =
        String(currentSubjects.length);


    if (currentSubjects.length === 0) {

        subjectsEmpty.classList.remove(
            "hidden"
        );

        return;
    }


    subjectsEmpty.classList.add(
        "hidden"
    );


    currentSubjects.forEach(
        (subject, index) => {

            const item =
                document.createElement("div");

            item.className =
                "subject-item";


            item.innerHTML = `
                <div class="subject-left">

                    <div class="subject-number">
                        ${index + 1}
                    </div>

                    <div class="subject-name">
                        ${escapeHtml(subject.name)}
                    </div>

                </div>

                <div class="subject-medium">
                    ${escapeHtml(subject.language || "Both")}
                </div>
            `;


            subjectsList.appendChild(item);
        }
    );
}


/* =========================================================
   PRICING
========================================================= */

function renderPricing() {

    const course =
        currentCourse;


    const rawPrice =
        firstExisting(
            course,
            [
                "crmPrice",
                "price",
                "coursePrice",
                "originalPrice"
            ]
        );


    const rawDiscount =
        firstExisting(
            course,
            [
                "crmDiscount",
                "discount",
                "discountAmount"
            ]
        );


    const rawFinal =
        firstExisting(
            course,
            [
                "crmFinalPrice",
                "finalPrice",
                "salePrice"
            ]
        );


    const price =
        Number(rawPrice) || 0;


    const discount =
        Number(rawDiscount) || 0;


    let finalAmount;


    if (
        rawFinal !== "" &&
        rawFinal !== null &&
        rawFinal !== undefined
    ) {

        finalAmount =
            Number(rawFinal) || 0;

    } else {

        finalAmount =
            Math.max(
                0,
                price - discount
            );
    }


    originalPrice.textContent =
        formatMoney(price);


    if (discount > 0) {

        discountRow.classList.remove(
            "hidden"
        );

        discountAmount.textContent =
            `-${formatMoney(discount)}`;

    } else {

        discountRow.classList.add(
            "hidden"
        );
    }


    finalPrice.textContent =
        formatMoney(finalAmount);

    bottomPrice.textContent =
        formatMoney(finalAmount);
}


/* =========================================================
   BUILD CHECKOUT DATA
========================================================= */

function buildCheckoutData() {

    const course =
        currentCourse;


    const courseNameValue =
        firstExisting(
            course,
            [
                "crmCourseName",
                "courseName",
                "name",
                "title"
            ]
        );


    const className =
        firstExisting(
            course,
            [
                "crmClass",
                "className",
                "class",
                "standard"
            ]
        );


    const board =
        firstExisting(
            course,
            [
                "crmBoard",
                "board"
            ]
        );


    const courseCodeValue =
        firstExisting(
            course,
            [
                "crmCourseCode",
                "courseCode",
                "code"
            ]
        );


    const price =
        Number(
            firstExisting(
                course,
                [
                    "crmPrice",
                    "price",
                    "coursePrice",
                    "originalPrice"
                ]
            )
        ) || 0;


    const discount =
        Number(
            firstExisting(
                course,
                [
                    "crmDiscount",
                    "discount",
                    "discountAmount"
                ]
            )
        ) || 0;


    let finalAmount =
        firstExisting(
            course,
            [
                "crmFinalPrice",
                "finalPrice",
                "salePrice"
            ]
        );


    if (
        finalAmount === "" ||
        finalAmount === null ||
        finalAmount === undefined
    ) {

        finalAmount =
            Math.max(
                0,
                price - discount
            );

    } else {

        finalAmount =
            Number(finalAmount) || 0;
    }


    const selectedLanguageList = [
        selectedLanguages.first,
        selectedLanguages.second,
        selectedLanguages.third
    ].filter(Boolean);


    return {

        /*
         * Course
         */
        courseId: course.id,

        courseName:
            normalize(courseNameValue),

        courseCode:
            normalize(courseCodeValue),

        className:
            normalize(className),

        board:
            normalize(board),


        /*
         * Language source of truth
         */
        firstLanguage:
            selectedLanguages.first || "",

        secondLanguage:
            selectedLanguages.second || "",

        thirdLanguage:
            selectedLanguages.third || "",


        selectedLanguages: {

            first:
                selectedLanguages.first || "",

            second:
                selectedLanguages.second || "",

            third:
                selectedLanguages.third || ""
        },


        selectedLanguageList,


        /*
         * Old compatibility field.
         */
        selectedLanguage:
            selectedLanguageList.join(" • "),


        /*
         * Price
         */
        price,

        discount,

        finalPrice:
            finalAmount,


        /*
         * Subjects
         */
        subjects:
            currentSubjects.map(
                subject => ({
                    id: subject.id,
                    name: subject.name,
                    language: subject.language
                })
            ),


        /*
         * Student
         */
        studentUid:
            currentUser?.uid || "",

        studentName:
            currentUser?.displayName || "",

        phone:
            currentUser?.phoneNumber || "",

        email:
            currentUser?.email || "",


        /*
         * Timestamp handled later.
         */
        createdAt:
            new Date().toISOString()
    };
}


/* =========================================================
   SAVE CHECKOUT DRAFT
========================================================= */

function saveCheckoutDraft() {

    try {

        const checkoutData =
            buildCheckoutData();


        sessionStorage.setItem(
            "zenova_checkout",
            JSON.stringify(checkoutData)
        );

    } catch (error) {

        console.error(
            "Unable to save checkout draft:",
            error
        );
    }
}


/* =========================================================
   VALIDATE LANGUAGE
========================================================= */

function validateLanguageSelection() {

    clearLanguageError();


    /*
     * No language configuration.
     */
    if (
        availableLanguages.length === 0
    ) {
        return true;
    }


    const requiredCount =
        availableLanguages.length;


    const selections = [
        selectedLanguages.first,
        selectedLanguages.second,
        selectedLanguages.third
    ].slice(
        0,
        requiredCount
    );


    /*
     * Every configured language position
     * must have a selection.
     */
    if (
        selections.some(
            value => !normalize(value)
        )
    ) {

        showLanguageError(
            `Please select all ${requiredCount} language position${requiredCount > 1 ? "s" : ""}.`
        );

        return false;
    }


    /*
     * No duplicate languages.
     */
    const keys =
        selections.map(normalizeKey);


    if (
        keys.length !==
        new Set(keys).size
    ) {

        showLanguageError(
            "The same language cannot be selected more than once."
        );

        return false;
    }


    /*
     * Every selected language must actually
     * belong to the course configuration.
     */
    const allowedKeys =
        availableLanguages.map(
            normalizeKey
        );


    const invalid =
        selections.some(
            value =>
                !allowedKeys.includes(
                    normalizeKey(value)
                )
        );


    if (invalid) {

        showLanguageError(
            "Please select only languages available for this course."
        );

        return false;
    }


    return true;
}


/* =========================================================
   CONTINUE
========================================================= */

async function handleContinue() {

    if (!currentCourse) {

        showError(
            "Course information is not available."
        );

        return;
    }


    if (
        !validateLanguageSelection()
    ) {

        languageSection.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        return;
    }


    /*
     * Save the latest state before moving
     * to payment.
     */
    saveCheckoutDraft();


    /*
     * Payment is NOT a gateway.
     *
     * The next page is the payment /
     * enrollment-request page.
     */
    const url =
        new URL(
            "../payment/",
            window.location.href
        );


    url.searchParams.set(
        "courseId",
        currentCourse.id
    );


    window.location.href =
        url.toString();
}


/* =========================================================
   AUTH
========================================================= */

function initializeAuth() {

    onAuthStateChanged(
        auth,
        user => {

            currentUser = user || null;

            /*
             * We don't block course checkout
             * purely because the browser auth
             * state is still resolving.
             */

            if (currentCourse) {
                saveCheckoutDraft();
            }
        }
    );
}


/* =========================================================
   NAVIGATION
========================================================= */

backButton.addEventListener(
    "click",
    () => {

        if (
            window.history.length > 1
        ) {

            window.history.back();

        } else {

            window.location.href =
                "../";
        }
    }
);


errorBackButton.addEventListener(
    "click",
    () => {

        if (
            window.history.length > 1
        ) {

            window.history.back();

        } else {

            window.location.href =
                "../";
        }
    }
);


continueButton.addEventListener(
    "click",
    handleContinue
);


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (unsubscribeCourse) {
            unsubscribeCourse();
        }
    }
);


/* =========================================================
   START
========================================================= */

showLoading();

initializeAuth();

loadCourse();

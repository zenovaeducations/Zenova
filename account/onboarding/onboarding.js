/* ============================================================
   ZENOVA STUDENT — ONBOARDING
   Login → Onboarding → Home

   IMPORTANT:
   - No portalAccess
   - No approval
   - No pending status
   - Already onboarded users go directly to Home
============================================================ */

import {
    auth,
    db
} from "../../firebase/firebase-config.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* ============================================================
   ELEMENTS
============================================================ */

const loader =
    document.getElementById("zenovaLoader");

const app =
    document.getElementById("onboardingApp");

const progressBar =
    document.getElementById("progressBar");

const stepText =
    document.getElementById("stepText");

const formError =
    document.getElementById("formError");


const fullNameInput =
    document.getElementById("fullName");

const dobInput =
    document.getElementById("dob");

const genderSelect =
    document.getElementById("gender");

const classSelect =
    document.getElementById("className");

const boardSelect =
    document.getElementById("board");

const mediumSelect =
    document.getElementById("medium");

const combinationSelect =
    document.getElementById("combination");

const targetSelect =
    document.getElementById("target");


const districtSelect =
    document.getElementById("district");

const talukSelect =
    document.getElementById("taluk");

const gpSelect =
    document.getElementById("gramPanchayat");

const villageSelect =
    document.getElementById("village");

const schoolSelect =
    document.getElementById("school");


const tenthFields =
    document.getElementById("tenthFields");

const pucFields =
    document.getElementById("pucFields");


const step1Next =
    document.getElementById("step1Next");

const step2Back =
    document.getElementById("step2Back");

const step2Next =
    document.getElementById("step2Next");

const step3Back =
    document.getElementById("step3Back");

const finishBtn =
    document.getElementById("finishBtn");


/* ============================================================
   STATE
============================================================ */

let currentUser = null;

let currentStep = 1;


/*
 * CRM master data
 */
let districts = [];
let taluks = [];
let gramPanchayats = [];
let villages = [];
let schools = [];


/* ============================================================
   AUTHENTICATION + ONBOARDING GUARD
============================================================ */

onAuthStateChanged(
    auth,
    async (user) => {

        /*
         * User is not logged in.
         *
         * Do not allow onboarding to open.
         */
        if (!user) {

            window.location.replace(
                "../login/"
            );

            return;
        }


        currentUser = user;


        try {

            /*
             * Check student profile.
             */
            const studentRef =
                doc(
                    db,
                    "students",
                    user.uid
                );


            const studentSnapshot =
                await getDoc(
                    studentRef
                );


            /*
             * IMPORTANT:
             *
             * If onboarding is already complete,
             * this page must NEVER be shown.
             */
            if (
                studentSnapshot.exists() &&
                studentSnapshot.data()
                    .onboardingComplete === true
            ) {

                window.location.replace(
                    "../../home/"
                );

                return;
            }


            /*
             * Prefill Google account name.
             */
            if (
                user.displayName &&
                !fullNameInput.value
            ) {

                fullNameInput.value =
                    user.displayName;

            }


            /*
             * Load all CRM master data.
             */
            await loadMasterData();


            /*
             * Show onboarding.
             */
            hideLoader();

            showApp();


            /*
             * Start at step 1.
             */
            showStep(1);


        } catch (error) {

            console.error(
                "ONBOARDING INITIALIZATION ERROR:",
                error
            );


            hideLoader();

            showApp();


            showError(
                "Unable to load onboarding data. Please refresh and try again."
            );

        }

    }
);


/* ============================================================
   LOADER
============================================================ */

function hideLoader() {

    if (loader) {
        loader.classList.add("hidden");
    }

}


function showApp() {

    if (app) {
        app.classList.remove("hidden");
    }

}


/* ============================================================
   STEP NAVIGATION
============================================================ */

function showStep(step) {

    currentStep = step;


    document
        .querySelectorAll(".step")
        .forEach(
            section => {
                section.classList.remove(
                    "active"
                );
            }
        );


    const selectedStep =
        document.getElementById(
            `step${step}`
        );


    if (selectedStep) {

        selectedStep.classList.add(
            "active"
        );

    }


    if (stepText) {

        stepText.textContent =
            `${step} of 3`;

    }


    if (progressBar) {

        progressBar.style.width =
            `${(step / 3) * 100}%`;

    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* ============================================================
   STEP 1
============================================================ */

step1Next?.addEventListener(
    "click",
    () => {

        clearError();


        const name =
            fullNameInput.value.trim();

        const dob =
            dobInput.value;

        const gender =
            genderSelect.value;


        if (name.length < 2) {

            showError(
                "Please enter your full name."
            );

            fullNameInput.focus();

            return;
        }


        if (!dob) {

            showError(
                "Please select your date of birth."
            );

            dobInput.focus();

            return;
        }


        if (!gender) {

            showError(
                "Please select your gender."
            );

            genderSelect.focus();

            return;
        }


        showStep(2);

    }
);


/* ============================================================
   CLASS CHANGE
============================================================ */

classSelect?.addEventListener(
    "change",
    updateAcademicFields
);


function updateAcademicFields() {

    const className =
        classSelect.value;


    /*
     * Hide everything first.
     */
    tenthFields?.classList.remove(
        "show"
    );

    pucFields?.classList.remove(
        "show"
    );


    /*
     * 10th
     */
    if (
        className === "10th"
    ) {

        tenthFields?.classList.add(
            "show"
        );

    }


    /*
     * PUC
     */
    if (
        className === "1st PUC" ||
        className === "2nd PUC"
    ) {

        pucFields?.classList.add(
            "show"
        );

    }

}


/* ============================================================
   STEP 2 BACK
============================================================ */

step2Back?.addEventListener(
    "click",
    () => {

        clearError();

        showStep(1);

    }
);


/* ============================================================
   STEP 2 NEXT
============================================================ */

step2Next?.addEventListener(
    "click",
    () => {

        clearError();


        const className =
            classSelect.value;

        const medium =
            mediumSelect.value;


        if (!className) {

            showError(
                "Please select your current class."
            );

            classSelect.focus();

            return;
        }


        if (!medium) {

            showError(
                "Please select your medium."
            );

            mediumSelect.focus();

            return;
        }


        /*
         * 10th requires board.
         */
        if (
            className === "10th"
        ) {

            if (!boardSelect.value) {

                showError(
                    "Please select your board."
                );

                boardSelect.focus();

                return;
            }

        }


        /*
         * PUC requires combination
         * and target.
         */
        if (
            className === "1st PUC" ||
            className === "2nd PUC"
        ) {

            if (
                !combinationSelect.value
            ) {

                showError(
                    "Please select your combination."
                );

                combinationSelect.focus();

                return;
            }


            if (
                !targetSelect.value
            ) {

                showError(
                    "Please select your target."
                );

                targetSelect.focus();

                return;
            }

        }


        showStep(3);

    }
);


/* ============================================================
   STEP 3 BACK
============================================================ */

step3Back?.addEventListener(
    "click",
    () => {

        clearError();

        showStep(2);

    }
);


/* ============================================================
   LOAD ALL CRM MASTER DATA
============================================================ */

async function loadMasterData() {

    /*
     * Load everything once.
     *
     * Then filtering is done locally.
     *
     * This matches the CRM location architecture.
     */

    const [
        districtSnapshot,
        talukSnapshot,
        gpSnapshot,
        villageSnapshot,
        schoolSnapshot
    ] = await Promise.all([

        getDocs(
            collection(
                db,
                "crmDistricts"
            )
        ),

        getDocs(
            collection(
                db,
                "crmTaluks"
            )
        ),

        getDocs(
            collection(
                db,
                "crmGramPanchayats"
            )
        ),

        getDocs(
            collection(
                db,
                "crmVillages"
            )
        ),

        getDocs(
            collection(
                db,
                "crmSchools"
            )
        )

    ]);


    /*
     * DISTRICTS
     */
    districts =
        districtSnapshot.docs
            .map(item => ({
                id: item.id,
                ...item.data()
            }))
            .filter(
                item =>
                    item.crmActive !== false
            )
            .sort(
                sortByDistrictName
            );


    /*
     * TALUKS
     *
     * Exact CRM field:
     * crmDistrictId
     */
    taluks =
        talukSnapshot.docs
            .map(item => ({
                id: item.id,
                ...item.data()
            }))
            .filter(
                item =>
                    item.crmActive !== false
            )
            .sort(
                sortByTalukName
            );


    /*
     * GRAM PANCHAYATS
     *
     * Exact CRM fields:
     * crmTalukId
     * crmGPName
     */
    gramPanchayats =
        gpSnapshot.docs
            .map(item => ({
                id: item.id,
                ...item.data()
            }))
            .filter(
                item =>
                    item.crmActive !== false
            )
            .sort(
                sortByGPName
            );


    /*
     * VILLAGES
     *
     * Exact CRM fields:
     * crmGPId
     * crmVillageName
     */
    villages =
        villageSnapshot.docs
            .map(item => ({
                id: item.id,
                ...item.data()
            }))
            .filter(
                item =>
                    item.crmActive !== false
            )
            .sort(
                sortByVillageName
            );


    /*
     * SCHOOLS
     *
     * Loaded once and filtered by
     * Taluk locally.
     */
    schools =
        schoolSnapshot.docs
            .map(item => ({
                id: item.id,
                ...item.data()
            }))
            .filter(
                item =>
                    item.crmActive !== false
            )
            .sort(
                sortBySchoolName
            );


    /*
     * Populate district dropdown.
     */
    populateDistricts();

}


/* ============================================================
   DISTRICTS
============================================================ */

function populateDistricts() {

    clearSelect(
        districtSelect,
        "Select district"
    );


    districts.forEach(
        district => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                district.id;


            option.textContent =
                district.crmDistrictName ||
                "District";


            districtSelect.appendChild(
                option
            );

        }
    );

}


/* ============================================================
   DISTRICT CHANGE
============================================================ */

districtSelect?.addEventListener(
    "change",
    () => {

        clearError();


        const districtId =
            districtSelect.value;


        /*
         * Reset everything below.
         */
        clearSelect(
            talukSelect,
            "Select taluk"
        );

        clearSelect(
            gpSelect,
            "Select Gram Panchayat"
        );

        clearSelect(
            villageSelect,
            "Select village"
        );

        clearSelect(
            schoolSelect,
            "Select your school"
        );


        if (!districtId) {

            return;

        }


        /*
         * EXACT FIELD:
         *
         * crmDistrictId
         */
        const matchingTaluks =
            taluks.filter(
                taluk =>
                    taluk.crmDistrictId ===
                    districtId
            );


        matchingTaluks.forEach(
            taluk => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    taluk.id;


                option.textContent =
                    taluk.crmTalukName ||
                    "Taluk";


                talukSelect.appendChild(
                    option
                );

            }
        );


        if (
            matchingTaluks.length > 0
        ) {

            talukSelect.disabled =
                false;

        }

    }
);


/* ============================================================
   TALUK CHANGE
============================================================ */

talukSelect?.addEventListener(
    "change",
    () => {

        clearError();


        const talukId =
            talukSelect.value;


        /*
         * Reset lower fields.
         */
        clearSelect(
            gpSelect,
            "Select Gram Panchayat"
        );

        clearSelect(
            villageSelect,
            "Select village"
        );

        clearSelect(
            schoolSelect,
            "Select your school"
        );


        if (!talukId) {

            return;

        }


        /*
         * =====================================================
         * GRAM PANCHAYATS
         *
         * Exact CRM field:
         * crmTalukId
         * =====================================================
         */

        const matchingGPs =
            gramPanchayats.filter(
                gp =>
                    gp.crmTalukId ===
                    talukId
            );


        matchingGPs.forEach(
            gp => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    gp.id;


                option.textContent =
                    gp.crmGPName ||
                    "Gram Panchayat";


                gpSelect.appendChild(
                    option
                );

            }
        );


        if (
            matchingGPs.length > 0
        ) {

            gpSelect.disabled =
                false;

        }


        /*
         * =====================================================
         * SCHOOLS
         *
         * School selection is based on TALUK.
         *
         * Students can study outside their GP.
         * =====================================================
         */

        loadSchoolsForTaluk(
            talukId
        );

    }
);


/* ============================================================
   LOAD SCHOOLS FOR TALUK
============================================================ */

function loadSchoolsForTaluk(
    talukId
) {

    clearSelect(
        schoolSelect,
        "Select your school"
    );


    if (!talukId) {

        return;

    }


    /*
     * Primary expected CRM field:
     *
     * crmTalukId
     */
    const matchingSchools =
        schools.filter(
            school =>
                school.crmTalukId ===
                talukId
        );


    /*
     * If schools have been created with
     * district/taluk information but the
     * taluk ID is missing, we do NOT guess.
     *
     * Only exact CRM Taluk ID matches
     * are shown.
     */

    matchingSchools.forEach(
        school => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                school.id;


            option.textContent =
                school.crmSchoolName ||
                school.schoolName ||
                school.name ||
                "School";


            schoolSelect.appendChild(
                option
            );

        }
    );


    if (
        matchingSchools.length > 0
    ) {

        schoolSelect.disabled =
            false;

    }

}


/* ============================================================
   GP CHANGE
============================================================ */

gpSelect?.addEventListener(
    "change",
    () => {

        clearError();


        const gpId =
            gpSelect.value;


        /*
         * Reset village.
         */
        clearSelect(
            villageSelect,
            "Select village"
        );


        if (!gpId) {

            return;

        }


        /*
         * Exact CRM field:
         *
         * crmGPId
         */
        const matchingVillages =
            villages.filter(
                village =>
                    village.crmGPId ===
                    gpId
            );


        matchingVillages.forEach(
            village => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    village.id;


                option.textContent =
                    village.crmVillageName ||
                    "Village";


                villageSelect.appendChild(
                    option
                );

            }
        );


        if (
            matchingVillages.length > 0
        ) {

            villageSelect.disabled =
                false;

        }

    }
);


/* ============================================================
   FINISH
============================================================ */

finishBtn?.addEventListener(
    "click",
    completeOnboarding
);


async function completeOnboarding() {

    clearError();


    if (!currentUser) {

        window.location.replace(
            "../login/"
        );

        return;
    }


    /*
     * Basic location validation.
     */
    const districtId =
        districtSelect.value;

    const talukId =
        talukSelect.value;

    const gpId =
        gpSelect.value;

    const villageId =
        villageSelect.value;

    const schoolId =
        schoolSelect.value;


    if (!districtId) {

        showError(
            "Please select your district."
        );

        districtSelect.focus();

        return;
    }


    if (!talukId) {

        showError(
            "Please select your taluk."
        );

        talukSelect.focus();

        return;
    }


    if (!schoolId) {

        showError(
            "Please select your school."
        );

        schoolSelect.focus();

        return;
    }


    /*
     * Get selected master records.
     */
    const district =
        districts.find(
            item =>
                item.id ===
                districtId
        );


    const taluk =
        taluks.find(
            item =>
                item.id ===
                talukId
        );


    const gp =
        gramPanchayats.find(
            item =>
                item.id ===
                gpId
        );


    const village =
        villages.find(
            item =>
                item.id ===
                villageId
        );


    const school =
        schools.find(
            item =>
                item.id ===
                schoolId
        );


    /*
     * Make sure selected IDs are valid.
     */
    if (
        !district ||
        !taluk ||
        !school
    ) {

        showError(
            "Please check your location and school selection."
        );

        return;
    }


    /*
     * Button loading.
     */
    finishBtn.disabled =
        true;

    finishBtn.innerHTML =
        "Saving...";


    try {

        const className =
            classSelect.value;


        /*
         * =====================================================
         * STUDENT PROFILE
         * =====================================================
         */

        const studentData = {

            /*
             * Firebase Auth
             */
            uid:
                currentUser.uid,


            /*
             * Google account
             */
            email:
                currentUser.email || "",


            /*
             * Name entered/confirmed
             */
            name:
                fullNameInput.value.trim(),


            /*
             * Phone is available only if
             * Firebase Auth has one.
             *
             * Otherwise empty.
             */
            phone:
                currentUser.phoneNumber || "",


            /*
             * Personal
             */
            dateOfBirth:
                dobInput.value,

            gender:
                genderSelect.value,


            /*
             * Academic
             */
            className:
                className,

            board:
                className === "10th"
                    ? boardSelect.value
                    : "",

            medium:
                mediumSelect.value,

            combination:
                (
                    className === "1st PUC" ||
                    className === "2nd PUC"
                )
                    ? combinationSelect.value
                    : "",

            target:
                (
                    className === "1st PUC" ||
                    className === "2nd PUC"
                )
                    ? targetSelect.value
                    : "",


            /*
             * =================================================
             * LOCATION
             *
             * Save both IDs and names.
             * This makes the student profile easy
             * to display later.
             * =================================================
             */

            districtId:
                district.id,

            districtName:
                district.crmDistrictName || "",


            talukId:
                taluk.id,

            talukName:
                taluk.crmTalukName || "",


            gramPanchayatId:
                gp?.id || "",

            gramPanchayatName:
                gp?.crmGPName || "",


            villageId:
                village?.id || "",

            villageName:
                village?.crmVillageName || "",


            schoolId:
                school.id,

            schoolName:
                school.crmSchoolName ||
                school.schoolName ||
                school.name ||
                "",


            /*
             * =================================================
             * ONBOARDING STATUS
             *
             * ONLY THIS.
             *
             * No portalAccess.
             * No approval.
             * No pending.
             * =================================================
             */
            onboardingComplete:
                true,


            updatedAt:
                serverTimestamp(),

            createdAt:
                serverTimestamp()

        };


        /*
         * Save to:
         *
         * students/{Firebase Auth UID}
         */
        await setDoc(
            doc(
                db,
                "students",
                currentUser.uid
            ),
            studentData,
            {
                merge: true
            }
        );


        /*
         * =====================================================
         * FINISHED
         *
         * Go directly to Home.
         * =====================================================
         */

        window.location.replace(
            "../../home/"
        );


    } catch (error) {

        console.error(
            "ONBOARDING SAVE ERROR:",
            error
        );


        showError(
            getFirebaseErrorMessage(error)
        );


        finishBtn.disabled =
            false;


        finishBtn.innerHTML =
            `Finish <span>→</span>`;

    }

}


/* ============================================================
   CLEAR SELECT
============================================================ */

function clearSelect(
    select,
    placeholder
) {

    if (!select) return;


    select.innerHTML =
        "";


    const option =
        document.createElement(
            "option"
        );


    option.value =
        "";


    option.textContent =
        placeholder;


    select.appendChild(
        option
    );


    select.disabled =
        true;

}


/* ============================================================
   ERRORS
============================================================ */

function showError(message) {

    if (!formError) return;


    formError.textContent =
        message;

}


function clearError() {

    if (!formError) return;


    formError.textContent =
        "";

}


/* ============================================================
   FIREBASE ERROR MESSAGE
============================================================ */

function getFirebaseErrorMessage(
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
            "You don't have permission to save this information."
        );

    }


    if (
        error.code ===
        "unavailable"
    ) {

        return (
            "Internet connection problem. Please try again."
        );

    }


    if (error.message) {

        return error.message;

    }


    return (
        "Something went wrong. Please try again."
    );

}


/* ============================================================
   SORTING
============================================================ */

function sortByDistrictName(
    a,
    b
) {

    return String(
        a.crmDistrictName || ""
    ).localeCompare(
        String(
            b.crmDistrictName || ""
        )
    );

}


function sortByTalukName(
    a,
    b
) {

    return String(
        a.crmTalukName || ""
    ).localeCompare(
        String(
            b.crmTalukName || ""
        )
    );

}


function sortByGPName(
    a,
    b
) {

    return String(
        a.crmGPName || ""
    ).localeCompare(
        String(
            b.crmGPName || ""
        )
    );

}


function sortByVillageName(
    a,
    b
) {

    return String(
        a.crmVillageName || ""
    ).localeCompare(
        String(
            b.crmVillageName || ""
        )
    );

}


function sortBySchoolName(
    a,
    b
) {

    const nameA =
        a.crmSchoolName ||
        a.schoolName ||
        a.name ||
        "";

    const nameB =
        b.crmSchoolName ||
        b.schoolName ||
        b.name ||
        "";


    return String(nameA)
        .localeCompare(
            String(nameB)
        );

}

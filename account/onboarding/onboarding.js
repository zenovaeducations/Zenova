/* ============================================================
   ZENOVA 2
   STUDENT ONBOARDING

   CURRENT PRODUCT:

   10th Standard
   One Zenova course
   Kannada / English medium

   STUDENT DATA:

   zen2Students/{Firebase Auth UID}

   CRM MASTER DATA REMAINS:

   crmDistricts
   crmTaluks
   crmGramPanchayats
   crmVillages
   crmSchools

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
   DOM
============================================================ */

const loader =
    document.getElementById(
        "zenovaLoader"
    );

const app =
    document.getElementById(
        "onboardingApp"
    );

const progressBar =
    document.getElementById(
        "progressBar"
    );

const stepText =
    document.getElementById(
        "stepText"
    );


const step1 =
    document.getElementById(
        "step1"
    );

const step2 =
    document.getElementById(
        "step2"
    );

const step3 =
    document.getElementById(
        "step3"
    );


const step1Next =
    document.getElementById(
        "step1Next"
    );

const step2Next =
    document.getElementById(
        "step2Next"
    );

const step2Back =
    document.getElementById(
        "step2Back"
    );

const step3Back =
    document.getElementById(
        "step3Back"
    );

const finishBtn =
    document.getElementById(
        "finishBtn"
    );


const fullNameInput =
    document.getElementById(
        "fullName"
    );

const dobInput =
    document.getElementById(
        "dob"
    );

const genderSelect =
    document.getElementById(
        "gender"
    );

const boardSelect =
    document.getElementById(
        "board"
    );

const mediumSelect =
    document.getElementById(
        "medium"
    );


const districtSelect =
    document.getElementById(
        "district"
    );

const talukSelect =
    document.getElementById(
        "taluk"
    );

const gpSelect =
    document.getElementById(
        "gramPanchayat"
    );

const villageSelect =
    document.getElementById(
        "village"
    );

const schoolSelect =
    document.getElementById(
        "school"
    );


const toughCount =
    document.getElementById(
        "toughCount"
    );

const toughSubjectButtons =
    document.querySelectorAll(
        ".subject-option"
    );


/* ============================================================
   STATE
============================================================ */

let currentUser = null;

let currentStep = 1;

let selectedToughSubjects = [];


/*
 * CRM master data
 */

let districts = [];

let taluks = [];

let gramPanchayats = [];

let villages = [];

let schools = [];


/* ============================================================
   AUTH
============================================================ */

onAuthStateChanged(
    auth,
    async (user) => {

        /*
         * Not logged in.
         */

        if (!user) {

            window.location.replace(
                "../../login/"
            );

            return;

        }


        currentUser =
            user;


        /*
         * Prefill Google name.
         */

        if (
            user.displayName &&
            !fullNameInput.value
        ) {

            fullNameInput.value =
                user.displayName;

        }


        try {

            /*
             * Check whether onboarding
             * is already complete.
             */

            const studentRef =
                doc(
                    db,
                    "zen2Students",
                    user.uid
                );


            const studentSnapshot =
                await getDoc(
                    studentRef
                );


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
             * Load CRM master data.
             */

            await loadMasterData();


            /*
             * Show application.
             */

            loader.classList.add(
                "hidden"
            );

            app.classList.remove(
                "hidden"
            );


            updateStepUI();


        } catch (error) {

            console.error(
                "Onboarding initialization error:",
                error
            );


            showError(
                1,
                "Unable to load your profile setup. Please refresh and try again."
            );


            loader.classList.add(
                "hidden"
            );

            app.classList.remove(
                "hidden"
            );

        }

    }
);


/* ============================================================
   STEP 1
============================================================ */

step1Next.addEventListener(
    "click",
    () => {

        clearAllErrors();


        const name =
            fullNameInput.value.trim();

        const dob =
            dobInput.value;

        const gender =
            genderSelect.value;


        if (!name) {

            showError(
                1,
                "Please enter your full name."
            );

            fullNameInput.focus();

            return;

        }


        if (name.length < 2) {

            showError(
                1,
                "Please enter a valid full name."
            );

            fullNameInput.focus();

            return;

        }


        if (!dob) {

            showError(
                1,
                "Please select your date of birth."
            );

            dobInput.focus();

            return;

        }


        if (!gender) {

            showError(
                1,
                "Please select your gender."
            );

            genderSelect.focus();

            return;

        }


        showStep(2);

    }
);


/* ============================================================
   STEP 2
============================================================ */

step2Back.addEventListener(
    "click",
    () => {

        clearAllErrors();

        showStep(1);

    }
);


step2Next.addEventListener(
    "click",
    () => {

        clearAllErrors();


        const board =
            boardSelect.value;

        const medium =
            mediumSelect.value;


        if (!board) {

            showError(
                2,
                "Please select your board."
            );

            boardSelect.focus();

            return;

        }


        if (!medium) {

            showError(
                2,
                "Please select your medium."
            );

            mediumSelect.focus();

            return;

        }


        if (
            selectedToughSubjects.length !== 2
        ) {

            showError(
                2,
                "Please select exactly 2 tough subjects."
            );

            return;

        }


        showStep(3);

    }
);


/* ============================================================
   TOUGH SUBJECTS
============================================================ */

toughSubjectButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                const subject =
                    button.dataset.subject;


                const index =
                    selectedToughSubjects.indexOf(
                        subject
                    );


                /*
                 * Already selected.
                 * Remove it.
                 */

                if (index !== -1) {

                    selectedToughSubjects.splice(
                        index,
                        1
                    );

                    button.classList.remove(
                        "selected"
                    );

                    updateToughCount();

                    return;

                }


                /*
                 * Already two selected.
                 */

                if (
                    selectedToughSubjects.length >= 2
                ) {

                    showError(
                        2,
                        "You can select only 2 tough subjects."
                    );

                    return;

                }


                /*
                 * Select.
                 */

                selectedToughSubjects.push(
                    subject
                );

                button.classList.add(
                    "selected"
                );

                updateToughCount();

            }
        );

    }
);


/* ============================================================
   TOUGH COUNT
============================================================ */

function updateToughCount() {

    toughCount.textContent =
        `${selectedToughSubjects.length} / 2`;

}


/* ============================================================
   STEP 3 BACK
============================================================ */

step3Back.addEventListener(
    "click",
    () => {

        clearAllErrors();

        showStep(2);

    }
);


/* ============================================================
   LOAD CRM MASTER DATA
============================================================ */

async function loadMasterData() {

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
            .map(
                (item) => ({
                    id: item.id,
                    ...item.data()
                })
            )
            .filter(
                (item) =>
                    item.crmActive !== false
            )
            .sort(
                (a, b) =>
                    String(
                        a.crmDistrictName || ""
                    ).localeCompare(
                        String(
                            b.crmDistrictName || ""
                        )
                    )
            );


    /*
     * TALUKS
     */

    taluks =
        talukSnapshot.docs
            .map(
                (item) => ({
                    id: item.id,
                    ...item.data()
                })
            )
            .filter(
                (item) =>
                    item.crmActive !== false
            );


    /*
     * GP
     */

    gramPanchayats =
        gpSnapshot.docs
            .map(
                (item) => ({
                    id: item.id,
                    ...item.data()
                })
            )
            .filter(
                (item) =>
                    item.crmActive !== false
            );


    /*
     * VILLAGES
     */

    villages =
        villageSnapshot.docs
            .map(
                (item) => ({
                    id: item.id,
                    ...item.data()
                })
            )
            .filter(
                (item) =>
                    item.crmActive !== false
            );


    /*
     * SCHOOLS
     */

    schools =
        schoolSnapshot.docs
            .map(
                (item) => ({
                    id: item.id,
                    ...item.data()
                })
            )
            .filter(
                (item) =>
                    item.crmActive !== false
            );


    /*
     * Populate districts.
     */

    populateDistricts();

}


/* ============================================================
   DISTRICT
============================================================ */

districtSelect.addEventListener(
    "change",
    () => {

        clearAllErrors();

        const districtId =
            districtSelect.value;


        resetSelect(
            talukSelect,
            "Select taluk"
        );

        resetSelect(
            gpSelect,
            "Select Gram Panchayat"
        );

        resetSelect(
            villageSelect,
            "Select village"
        );

        resetSelect(
            schoolSelect,
            "Select your school"
        );


        talukSelect.disabled =
            true;

        gpSelect.disabled =
            true;

        villageSelect.disabled =
            true;

        schoolSelect.disabled =
            true;


        if (!districtId) {
            return;
        }


        const matchingTaluks =
            taluks
                .filter(
                    (item) =>
                        item.crmDistrictId ===
                        districtId
                )
                .sort(
                    sortByTaluk
                );


        appendOptions(
            talukSelect,
            matchingTaluks,
            "crmTalukName"
        );


        talukSelect.disabled =
            matchingTaluks.length === 0;

    }
);


/* ============================================================
   TALUK
============================================================ */

talukSelect.addEventListener(
    "change",
    () => {

        clearAllErrors();

        const talukId =
            talukSelect.value;


        resetSelect(
            gpSelect,
            "Select Gram Panchayat"
        );

        resetSelect(
            villageSelect,
            "Select village"
        );

        resetSelect(
            schoolSelect,
            "Select your school"
        );


        gpSelect.disabled =
            true;

        villageSelect.disabled =
            true;

        schoolSelect.disabled =
            true;


        if (!talukId) {
            return;
        }


        const matchingGPs =
            gramPanchayats
                .filter(
                    (item) =>
                        item.crmTalukId ===
                        talukId
                )
                .sort(
                    sortByGP
                );


        appendOptions(
            gpSelect,
            matchingGPs,
            "crmGPName"
        );


        gpSelect.disabled =
            matchingGPs.length === 0;


        /*
         * Schools are also associated
         * with the taluk in the existing
         * CRM system.
         */

        populateSchoolsForTaluk(
            talukId
        );

    }
);


/* ============================================================
   GP
============================================================ */

gpSelect.addEventListener(
    "change",
    () => {

        clearAllErrors();

        const gpId =
            gpSelect.value;


        resetSelect(
            villageSelect,
            "Select village"
        );


        villageSelect.disabled =
            true;


        if (!gpId) {
            return;
        }


        const matchingVillages =
            villages
                .filter(
                    (item) =>
                        item.crmGPId ===
                        gpId
                )
                .sort(
                    sortByVillage
                );


        appendOptions(
            villageSelect,
            matchingVillages,
            "crmVillageName"
        );


        villageSelect.disabled =
            matchingVillages.length === 0;

    }
);


/* ============================================================
   VILLAGE
============================================================ */

villageSelect.addEventListener(
    "change",
    () => {

        /*
         * School list has already been
         * filtered by taluk.
         *
         * We additionally try to match
         * village where the CRM data
         * provides that relationship.
         */

        const villageId =
            villageSelect.value;


        const talukId =
            talukSelect.value;


        if (!talukId) {
            return;
        }


        let matchingSchools =
            schools.filter(
                (school) =>
                    school.crmTalukId ===
                    talukId
            );


        /*
         * If schools contain village
         * relationship information,
         * use it.
         */

        const villageMatched =
            matchingSchools.filter(
                (school) =>
                    school.crmVillageId ===
                    villageId
            );


        if (
            villageMatched.length > 0
        ) {

            matchingSchools =
                villageMatched;

        }


        matchingSchools.sort(
            sortBySchool
        );


        resetSelect(
            schoolSelect,
            "Select your school"
        );


        appendOptions(
            schoolSelect,
            matchingSchools,
            getSchoolNameField
        );


        schoolSelect.disabled =
            matchingSchools.length === 0;

    }
);


/* ============================================================
   POPULATE DISTRICTS
============================================================ */

function populateDistricts() {

    resetSelect(
        districtSelect,
        "Select district"
    );


    districts.forEach(
        (district) => {

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
   POPULATE SCHOOLS
============================================================ */

function populateSchoolsForTaluk(
    talukId
) {

    let matchingSchools =
        schools.filter(
            (school) =>
                school.crmTalukId ===
                talukId
        );


    matchingSchools.sort(
        sortBySchool
    );


    resetSelect(
        schoolSelect,
        "Select your school"
    );


    /*
     * Don't enable the school yet.
     *
     * The user will choose village
     * first.
     */

    schoolSelect.disabled =
        true;

}


/* ============================================================
   APPEND OPTIONS
============================================================ */

function appendOptions(
    select,
    items,
    nameField
) {

    items.forEach(
        (item) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                item.id;


            option.textContent =
                typeof nameField === "function"
                    ? nameField(item)
                    : (
                        item[nameField] ||
                        "Select"
                    );


            select.appendChild(
                option
            );

        }
    );

}


/* ============================================================
   RESET SELECT
============================================================ */

function resetSelect(
    select,
    placeholder
) {

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


    select.value =
        "";

}


/* ============================================================
   FINISH ONBOARDING
============================================================ */

finishBtn.addEventListener(
    "click",
    completeOnboarding
);


async function completeOnboarding() {

    clearAllErrors();


    if (!currentUser) {

        window.location.replace(
            "../../login/"
        );

        return;

    }


    /*
     * Validate location.
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
            3,
            "Please select your district."
        );

        districtSelect.focus();

        return;

    }


    if (!talukId) {

        showError(
            3,
            "Please select your taluk."
        );

        talukSelect.focus();

        return;

    }


    if (!gpId) {

        showError(
            3,
            "Please select your Gram Panchayat."
        );

        gpSelect.focus();

        return;

    }


    if (!villageId) {

        showError(
            3,
            "Please select your village."
        );

        villageSelect.focus();

        return;

    }


    if (!schoolId) {

        showError(
            3,
            "Please select your school."
        );

        schoolSelect.focus();

        return;

    }


    /*
     * Find actual CRM records.
     */

    const district =
        districts.find(
            (item) =>
                item.id === districtId
        );


    const taluk =
        taluks.find(
            (item) =>
                item.id === talukId
        );


    const gp =
        gramPanchayats.find(
            (item) =>
                item.id === gpId
        );


    const village =
        villages.find(
            (item) =>
                item.id === villageId
        );


    const school =
        schools.find(
            (item) =>
                item.id === schoolId
        );


    if (
        !district ||
        !taluk ||
        !gp ||
        !village ||
        !school
    ) {

        showError(
            3,
            "The selected location could not be verified. Please select again."
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

        /*
         * Existing profile, if any.
         */

        const studentRef =
            doc(
                db,
                "zen2Students",
                currentUser.uid
            );


        const existingSnapshot =
            await getDoc(
                studentRef
            );


        const existingData =
            existingSnapshot.exists()
                ? existingSnapshot.data()
                : {};


        /*
         * =====================================================
         * NEW ZENOVA STUDENT PROFILE
         * =====================================================
         */

        const studentData = {

            /*
             * AUTH
             */

            uid:
                currentUser.uid,

            email:
                currentUser.email || "",

            phone:
                currentUser.phoneNumber || "",


            /*
             * GOOGLE PROFILE
             */

            photoURL:
                currentUser.photoURL || "",

            googleDisplayName:
                currentUser.displayName || "",


            /*
             * PERSONAL
             */

            name:
                fullNameInput.value.trim(),

            dateOfBirth:
                dobInput.value,

            gender:
                genderSelect.value,


            /*
             * CURRENT COURSE
             *
             * Current Zenova product is
             * only 10th Standard.
             */

            className:
                "10th",

            classDisplayName:
                "10th Standard",

            board:
                boardSelect.value,

            medium:
                mediumSelect.value,


            /*
             * TOUGH SUBJECTS
             */

            toughSubjects:
                [...selectedToughSubjects],


            /*
             * LOCATION IDS
             */

            districtId:
                district.id,

            talukId:
                taluk.id,

            gramPanchayatId:
                gp.id,

            villageId:
                village.id,

            schoolId:
                school.id,


            /*
             * LOCATION NAMES
             */

            districtName:
                district.crmDistrictName || "",

            talukName:
                taluk.crmTalukName || "",

            gramPanchayatName:
                gp.crmGPName || "",

            villageName:
                village.crmVillageName || "",

            schoolName:
                getSchoolNameField(
                    school
                ),


            /*
             * ZENOVA VERSION
             */

            appVersion:
                "ZEN2",

            profileVersion:
                1,


            /*
             * ONBOARDING
             */

            onboardingComplete:
                true,

            onboardingCompletedAt:
                serverTimestamp(),


            /*
             * UPDATE
             */

            updatedAt:
                serverTimestamp()

        };


        /*
         * Only create createdAt for
         * a brand-new student.
         */

        if (
            !existingSnapshot.exists()
        ) {

            studentData.createdAt =
                serverTimestamp();

        } else if (
            existingData.createdAt
        ) {

            studentData.createdAt =
                existingData.createdAt;

        }


        /*
         * SAVE
         *
         * zen2Students/{uid}
         */

        await setDoc(
            studentRef,
            studentData,
            {
                merge: true
            }
        );


        console.log(
            "ZEN2 onboarding saved:",
            currentUser.uid
        );


        /*
         * HOME
         */

        window.location.replace(
            "../../home/"
        );


    } catch (error) {

        console.error(
            "ZEN2 ONBOARDING ERROR:",
            error
        );


        showError(
            3,
            getFirebaseErrorMessage(
                error
            )
        );


        finishBtn.disabled =
            false;

        finishBtn.innerHTML =
            `Finish <span>→</span>`;

    }

}


/* ============================================================
   STEP UI
============================================================ */

function showStep(
    step
) {

    currentStep =
        step;

    updateStepUI();

}


/* ============================================================
   UPDATE STEP UI
============================================================ */

function updateStepUI() {

    step1.classList.remove(
        "active"
    );

    step2.classList.remove(
        "active"
    );

    step3.classList.remove(
        "active"
    );


    if (currentStep === 1) {

        step1.classList.add(
            "active"
        );

    }


    if (currentStep === 2) {

        step2.classList.add(
            "active"
        );

    }


    if (currentStep === 3) {

        step3.classList.add(
            "active"
        );

    }


    stepText.textContent =
        `${currentStep} of 3`;


    progressBar.style.width =
        `${(
            currentStep / 3
        ) * 100}%`;

}


/* ============================================================
   ERRORS
============================================================ */

function showError(
    step,
    message
) {

    clearAllErrors();


    const errorElement =
        document.getElementById(
            `step${step}Error`
        );


    if (!errorElement) {
        return;
    }


    errorElement.textContent =
        message;


    errorElement.classList.add(
        "show"
    );

}


function clearAllErrors() {

    document
        .querySelectorAll(
            ".form-error"
        )
        .forEach(
            (element) => {

                element.textContent =
                    "";

                element.classList.remove(
                    "show"
                );

            }
        );

}


/* ============================================================
   SORTING
============================================================ */

function sortByTaluk(
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


function sortByGP(
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


function sortByVillage(
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


function sortBySchool(
    a,
    b
) {

    return getSchoolNameField(
        a
    ).localeCompare(
        getSchoolNameField(
            b
        )
    );

}


/* ============================================================
   SCHOOL NAME
============================================================ */

function getSchoolNameField(
    school
) {

    return (
        school.crmSchoolName ||
        school.schoolName ||
        school.name ||
        ""
    );

}


/* ============================================================
   FIREBASE ERROR
============================================================ */

function getFirebaseErrorMessage(
    error
) {

    switch (error?.code) {

        case "permission-denied":

            return "You don't have permission to save your profile. Please contact Zenova.";

        case "unavailable":

            return "Firebase is temporarily unavailable. Please check your internet connection.";

        case "failed-precondition":

            return "Firebase needs additional configuration. Please contact Zenova.";

        default:

            return (
                error?.message ||
                "Unable to save your profile. Please try again."
            );

    }

}

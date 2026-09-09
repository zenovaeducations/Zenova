import { auth, db } from "../../firebase/firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    collection,
    query,
    where,
    getDocs,
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


let currentUser = null;
let currentStep = 1;


/* ============================================================
   AUTH GUARD
============================================================ */

onAuthStateChanged(auth, async (user) => {

    /*
     * NOT LOGGED IN
     *
     * Onboarding cannot be opened directly.
     */
    if (!user) {

        window.location.replace("../login/");
        return;
    }


    currentUser = user;


    try {

        /*
         * Check existing student account.
         */
        const studentRef =
            doc(
                db,
                "students",
                user.uid
            );

        const studentSnap =
            await getDoc(studentRef);


        /*
         * If onboarding is already completed,
         * NEVER show this page.
         */
        if (
            studentSnap.exists() &&
            studentSnap.data().onboardingComplete === true
        ) {

            window.location.replace("../../home/");
            return;
        }


        /*
         * Fill Google information if available.
         */
        prefillUser();


        /*
         * User is authenticated but onboarding
         * is not completed.
         */
        hideLoader();
        showApp();

        loadDistricts();

    } catch (error) {

        console.error(
            "Onboarding authentication error:",
            error
        );

        hideLoader();
        showApp();

    }

});


/* ============================================================
   GOOGLE USER DATA
============================================================ */

function prefillUser() {

    const nameInput =
        document.getElementById("fullName");

    if (
        currentUser.displayName &&
        !nameInput.value
    ) {
        nameInput.value =
            currentUser.displayName;
    }

}


/* ============================================================
   UI
============================================================ */

function hideLoader() {

    loader.classList.add("hidden");

}

function showApp() {

    app.classList.remove("hidden");

}


/* ============================================================
   STEP NAVIGATION
============================================================ */

function showStep(step) {

    currentStep = step;


    document
        .querySelectorAll(".step")
        .forEach(section => {

            section.classList.remove("active");

        });


    const target =
        document.getElementById(
            `step${step}`
        );

    target.classList.add("active");


    stepText.textContent =
        `${step} of 3`;


    progressBar.style.width =
        `${(step / 3) * 100}%`;


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* ============================================================
   STEP 1
============================================================ */

document
    .getElementById("step1Next")
    .addEventListener("click", () => {

        const name =
            document
                .getElementById("fullName")
                .value
                .trim();

        const dob =
            document
                .getElementById("dob")
                .value;

        const gender =
            document
                .getElementById("gender")
                .value;


        if (name.length < 2) {

            alert(
                "Please enter your full name."
            );

            return;
        }


        if (!dob) {

            alert(
                "Please select your date of birth."
            );

            return;
        }


        if (!gender) {

            alert(
                "Please select your gender."
            );

            return;
        }


        showStep(2);

    });


/* ============================================================
   CLASS CHANGE
============================================================ */

document
    .getElementById("className")
    .addEventListener("change", updateClassFields);


function updateClassFields() {

    const className =
        document
            .getElementById("className")
            .value;


    const tenthFields =
        document.getElementById(
            "tenthFields"
        );

    const pucFields =
        document.getElementById(
            "pucFields"
        );


    tenthFields.classList.remove("show");
    pucFields.classList.remove("show");


    if (className === "10th") {

        tenthFields.classList.add("show");

    }


    if (
        className === "1st PUC" ||
        className === "2nd PUC"
    ) {

        pucFields.classList.add("show");

    }

}


/* ============================================================
   STEP 2
============================================================ */

document
    .getElementById("step2Back")
    .addEventListener(
        "click",
        () => showStep(1)
    );


document
    .getElementById("step2Next")
    .addEventListener("click", () => {

        const className =
            document
                .getElementById("className")
                .value;

        const medium =
            document
                .getElementById("medium")
                .value;


        if (!className) {

            alert(
                "Please select your current class."
            );

            return;
        }


        if (!medium) {

            alert(
                "Please select your medium."
            );

            return;
        }


        if (className === "10th") {

            const board =
                document
                    .getElementById("board")
                    .value;

            if (!board) {

                alert(
                    "Please select your board."
                );

                return;
            }

        }


        if (
            className === "1st PUC" ||
            className === "2nd PUC"
        ) {

            const combination =
                document
                    .getElementById("combination")
                    .value;

            const target =
                document
                    .getElementById("target")
                    .value;


            if (!combination) {

                alert(
                    "Please select your combination."
                );

                return;
            }


            if (!target) {

                alert(
                    "Please select your target."
                );

                return;
            }

        }


        showStep(3);

    });


/* ============================================================
   STEP 3 BACK
============================================================ */

document
    .getElementById("step3Back")
    .addEventListener(
        "click",
        () => showStep(2)
    );


/* ============================================================
   FIREBASE MASTER DATA
============================================================ */

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


function resetSelect(
    select,
    placeholder
) {

    select.innerHTML =
        `<option value="">${placeholder}</option>`;

    select.disabled = true;

}


/* ============================================================
   DISTRICTS
============================================================ */

async function loadDistricts() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "crmDistricts"
                )
            );


        snapshot.forEach(item => {

            const data =
                item.data();


            const option =
                document.createElement("option");


            option.value =
                item.id;

            option.textContent =
                data.crmDistrictName ||
                data.districtName ||
                data.name ||
                "District";


            districtSelect.appendChild(
                option
            );

        });


    } catch (error) {

        console.error(
            "District loading error:",
            error
        );

    }

}


/*/* ============================================================
   TALUKS
============================================================ */

districtSelect.addEventListener(
    "change",
    async () => {

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

        if (!districtId) return;

        try {

            const q = query(
                collection(
                    db,
                    "crmTaluks"
                ),

                // YOUR FIRESTORE FIELD
                where(
                    "crmDistrictId",
                    "==",
                    districtId
                )
            );

            const snapshot =
                await getDocs(q);

            snapshot.forEach(item => {

                const data =
                    item.data();

                const option =
                    document.createElement("option");

                option.value =
                    item.id;

                option.textContent =
                    data.crmTalukName || "Taluk";

                talukSelect.appendChild(
                    option
                );

            });

            talukSelect.disabled = false;

        } catch (error) {

            console.error(
                "Taluk loading error:",
                error
            );

        }

    }
);
/* ============================================================
   GRAM PANCHAYAT
============================================================ */

talukSelect.addEventListener(
    "change",
    async () => {

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


        if (!talukId) return;


        try {

            const q =
                query(
                    collection(
                        db,
                        "crmGramPanchayats"
                    ),
                    where(
                        "talukId",
                        "==",
                        talukId
                    )
                );


            const snapshot =
                await getDocs(q);


            snapshot.forEach(item => {

                const data =
                    item.data();


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    item.id;

                option.textContent =
                    data.crmGramPanchayatName ||
                    data.gramPanchayatName ||
                    data.name ||
                    "Gram Panchayat";


                gpSelect.appendChild(
                    option
                );

            });


            gpSelect.disabled =
                false;


        } catch (error) {

            console.error(
                "GP loading error:",
                error
            );

        }

    }
);


/* ============================================================
   VILLAGES
============================================================ */

gpSelect.addEventListener(
    "change",
    async () => {

        const gpId =
            gpSelect.value;


        resetSelect(
            villageSelect,
            "Select village"
        );


        if (!gpId) return;


        try {

            const q =
                query(
                    collection(
                        db,
                        "crmVillages"
                    ),
                    where(
                        "gramPanchayatId",
                        "==",
                        gpId
                    )
                );


            const snapshot =
                await getDocs(q);


            snapshot.forEach(item => {

                const data =
                    item.data();


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    item.id;

                option.textContent =
                    data.crmVillageName ||
                    data.villageName ||
                    data.name ||
                    "Village";


                villageSelect.appendChild(
                    option
                );

            });


            villageSelect.disabled =
                false;


        } catch (error) {

            console.error(
                "Village loading error:",
                error
            );

        }

    }
);


/* ============================================================
   SCHOOLS
   School is filtered by TALUK,
   not Gram Panchayat.
============================================================ */

talukSelect.addEventListener(
    "change",
    async () => {

        /*
         * We intentionally load schools by
         * Taluk because students may study
         * outside their Gram Panchayat.
         */

        await loadSchoolsForTaluk(
            talukSelect.value
        );

    }
);


async function loadSchoolsForTaluk(
    talukId
) {

    resetSelect(
        schoolSelect,
        "Select your school"
    );


    if (!talukId) return;


    try {

        const q =
            query(
                collection(
                    db,
                    "crmSchools"
                ),
                where(
                    "crmTalukId",
                    "==",
                    talukId
                )
            );


        const snapshot =
            await getDocs(q);


        snapshot.forEach(item => {

            const data =
                item.data();


            if (
                data.crmActive === false
            ) {
                return;
            }


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                item.id;

            option.textContent =
                data.crmSchoolName ||
                data.schoolName ||
                data.name ||
                "School";


            schoolSelect.appendChild(
                option
            );

        });


        schoolSelect.disabled =
            false;


    } catch (error) {

        console.error(
            "School loading error:",
            error
        );

    }

}


/* ============================================================
   FINISH ONBOARDING
============================================================ */

document
    .getElementById("finishBtn")
    .addEventListener(
        "click",
        completeOnboarding
    );


async function completeOnboarding() {

    formError.textContent = "";


    if (!currentUser) {
        window.location.replace("../login/");
        return;
    }


    const district =
        districtSelect.value;

    const taluk =
        talukSelect.value;

    const gramPanchayat =
        gpSelect.value;

    const village =
        villageSelect.value;

    const school =
        schoolSelect.value;


    if (!district) {

        formError.textContent =
            "Please select your district.";

        return;
    }


    if (!taluk) {

        formError.textContent =
            "Please select your taluk.";

        return;
    }


    if (!school) {

        formError.textContent =
            "Please select your school.";

        return;
    }


    const finishBtn =
        document.getElementById(
            "finishBtn"
        );


    finishBtn.disabled = true;

    finishBtn.innerHTML =
        "Saving...";


    try {

        const className =
            document
                .getElementById("className")
                .value;


        const studentData = {

            uid: currentUser.uid,

            name:
                document
                    .getElementById("fullName")
                    .value
                    .trim(),

            email:
                currentUser.email || "",

            phone:
                currentUser.phoneNumber || "",

            dateOfBirth:
                document
                    .getElementById("dob")
                    .value,

            gender:
                document
                    .getElementById("gender")
                    .value,

            className,

            board:
                className === "10th"
                    ? document
                        .getElementById("board")
                        .value
                    : "",

            medium:
                document
                    .getElementById("medium")
                    .value,

            combination:
                className === "1st PUC" ||
                className === "2nd PUC"
                    ? document
                        .getElementById(
                            "combination"
                        )
                        .value
                    : "",

            target:
                className === "1st PUC" ||
                className === "2nd PUC"
                    ? document
                        .getElementById(
                            "target"
                        )
                        .value
                    : "",

            districtId:
                district,

            talukId:
                taluk,

            gramPanchayatId:
                gramPanchayat || "",

            villageId:
                village || "",

            schoolId:
                school,

            onboardingComplete:
                true,

            updatedAt:
                serverTimestamp(),

            createdAt:
                serverTimestamp()

        };


        /*
         * Student profile.
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
         * IMPORTANT:
         *
         * Onboarding is finished.
         * No portalAccess.
         * No approval.
         * No pending state.
         *
         * Go directly to Home.
         */
        window.location.replace(
            "../../home/"
        );


    } catch (error) {

        console.error(
            "Onboarding save error:",
            error
        );


        formError.textContent =
            "Something went wrong while saving. Please try again.";


        finishBtn.disabled = false;

        finishBtn.innerHTML =
            `Finish <span>→</span>`;

    }

}

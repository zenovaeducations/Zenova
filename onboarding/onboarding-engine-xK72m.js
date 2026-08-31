import {
    auth,
    db
} from "../firebase/firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ============================================================
// STATE
// ============================================================

let currentUser = null;

let currentStep = 1;

let selectedClass = "";

let selectedBoard = "";

let selectedCombination = "";

let selectedTarget = "";

let selectedStudyMode = "";


// ============================================================
// ELEMENTS
// ============================================================

const loader =
    document.getElementById("pageLoader");

const app =
    document.getElementById(
        "onboardingApp"
    );

const step1 =
    document.getElementById("step1");

const step2 =
    document.getElementById("step2");

const step3 =
    document.getElementById("step3");

const nameInput =
    document.getElementById(
        "studentName"
    );

const nameError =
    document.getElementById(
        "nameError"
    );

const classError =
    document.getElementById(
        "classError"
    );

const detailsError =
    document.getElementById(
        "detailsError"
    );

const conditionalContent =
    document.getElementById(
        "conditionalContent"
    );

const progressBar =
    document.getElementById(
        "progressBar"
    );

const stepText =
    document.getElementById(
        "stepText"
    );

const progressPercent =
    document.getElementById(
        "progressPercent"
    );

const savingMessage =
    document.getElementById(
        "savingMessage"
    );


// ============================================================
// AUTH
// ============================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.replace(
                "../login/"
            );

            return;

        }


        currentUser = user;


        /*
         * Check whether onboarding was
         * already completed.
         *
         * If yes, don't show onboarding again.
         */

        try {

            const ref =
                doc(
                    db,
                    "students",
                    user.uid
                );

            const snapshot =
                await getDoc(ref);


            if (
                snapshot.exists()
            ) {

                const data =
                    snapshot.data();


                if (
                    isProfileComplete(
                        data
                    )
                ) {

                    window.location.replace(
                        "../home/"
                    );

                    return;

                }

            }


            hideLoader();

            app.classList.remove(
                "hidden"
            );

        } catch (error) {

            console.error(
                "Onboarding check failed:",
                error
            );

            /*
             * We stay on onboarding.
             *
             * NEVER send the user to Home
             * when verification fails.
             */

            hideLoader();

            app.classList.remove(
                "hidden"
            );

        }

    }
);


// ============================================================
// NAME
// ============================================================

document
    .getElementById("nextName")
    .addEventListener(
        "click",
        () => {

            const name =
                nameInput.value.trim();


            nameError.textContent = "";


            if (!name) {

                nameError.textContent =
                    "Please enter your name.";

                nameInput.focus();

                return;

            }


            if (
                name.length < 2
            ) {

                nameError.textContent =
                    "Please enter your full name.";

                nameInput.focus();

                return;

            }


            goToStep(2);

        }
    );


// ============================================================
// CLASS
// ============================================================

document
    .querySelectorAll(
        ".class-option"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    selectedClass =
                        button.dataset.class;


                    document
                        .querySelectorAll(
                            ".class-option"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "selected"
                                )
                        );


                    button.classList.add(
                        "selected"
                    );


                    classError.textContent =
                        "";


                    /*
                     * Move to conditional
                     * information.
                     */

                    buildConditionalStep();

                    goToStep(3);

                }
            );

        }
    );


// ============================================================
// BACK
// ============================================================

document
    .getElementById(
        "backToName"
    )
    .addEventListener(
        "click",
        () => {

            goToStep(1);

        }
    );


document
    .getElementById(
        "backToClass"
    )
    .addEventListener(
        "click",
        () => {

            goToStep(2);

        }
    );


// ============================================================
// CONDITIONAL FORM
// ============================================================

function buildConditionalStep() {

    selectedBoard = "";
    selectedCombination = "";
    selectedTarget = "";
    selectedStudyMode = "";


    /*
     * UNDER 8TH / 8TH / 9TH
     */

    if (
        selectedClass === "Under 8th" ||
        selectedClass === "8th" ||
        selectedClass === "9th"
    ) {

        conditionalContent.innerHTML = `

            <div class="detail-heading">
                Almost there.
            </div>

            <p class="detail-description">
                Confirm how you currently study.
            </p>


            <div class="detail-field">

                <label>
                    Learning mode
                </label>

                <div
                    class="detail-options"
                    id="studyModeOptions"
                >

                    ${studyModeOption(
                        "Online"
                    )}

                    ${studyModeOption(
                        "Offline"
                    )}

                    ${studyModeOption(
                        "Hybrid"
                    )}

                </div>

            </div>

        `;

    }


    /*
     * 10TH
     */

    else if (
        selectedClass === "10th"
    ) {

        conditionalContent.innerHTML = `

            <div class="detail-heading">
                Tell us about your SSLC.
            </div>

            <p class="detail-description">
                This helps us show you the right
                academic content.
            </p>


            <div class="detail-field">

                <label>
                    Select your board
                </label>


                <div
                    class="detail-options"
                    id="boardOptions"
                >

                    ${option(
                        "Karnataka State Board"
                    )}

                    ${option(
                        "CBSE"
                    )}

                    ${option(
                        "ICSE"
                    )}

                    ${option(
                        "Other"
                    )}

                </div>

            </div>


            <div class="detail-field">

                <label>
                    Learning mode
                </label>


                <div
                    class="detail-options"
                    id="studyModeOptions"
                >

                    ${studyModeOption(
                        "Online"
                    )}

                    ${studyModeOption(
                        "Offline"
                    )}

                    ${studyModeOption(
                        "Hybrid"
                    )}

                </div>

            </div>

        `;

    }


    /*
     * PUC
     */

    else {

        conditionalContent.innerHTML = `

            <div class="detail-heading">
                Let's personalise your PUC journey.
            </div>

            <p class="detail-description">
                Select your combination and
                preparation goal.
            </p>


            <div class="detail-field">

                <label>
                    Combination
                </label>


                <div
                    class="detail-options"
                    id="combinationOptions"
                >

                    ${option("PCMB")}

                    ${option("PCMC")}

                    ${option("PCMS")}

                    ${option("CEBA")}

                    ${option("HEBA")}

                    ${option("Other")}

                </div>

            </div>


            <div class="detail-field">

                <label>
                    Preparation
                </label>


                <div
                    class="detail-options"
                    id="targetOptions"
                >

                    ${option("PUC Board")}

                    ${option("KCET")}

                    ${option("NEET")}

                    ${option("JEE")}

                    ${option("Board + Entrance")}

                </div>

            </div>


            <div class="detail-field">

                <label>
                    Learning mode
                </label>


                <div
                    class="detail-options"
                    id="studyModeOptions"
                >

                    ${studyModeOption(
                        "Online"
                    )}

                    ${studyModeOption(
                        "Offline"
                    )}

                    ${studyModeOption(
                        "Hybrid"
                    )}

                </div>

            </div>

        `;

    }


    attachConditionalEvents();

}


// ============================================================
// OPTION HTML
// ============================================================

function option(
    value
) {

    return `

        <button
            type="button"
            class="detail-option"
            data-value="${escapeHtml(value)}"
        >
            ${escapeHtml(value)}
        </button>

    `;

}


function studyModeOption(
    value
) {

    return option(value);

}


// ============================================================
// CONDITIONAL EVENTS
// ============================================================

function attachConditionalEvents() {

    const boardOptions =
        document.getElementById(
            "boardOptions"
        );


    if (boardOptions) {

        boardOptions
            .querySelectorAll(
                ".detail-option"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            selectedBoard =
                                button.dataset.value;

                            selectButton(
                                boardOptions,
                                button
                            );

                        }
                    );

                }
            );

    }


    const combinationOptions =
        document.getElementById(
            "combinationOptions"
        );


    if (combinationOptions) {

        combinationOptions
            .querySelectorAll(
                ".detail-option"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            selectedCombination =
                                button.dataset.value;

                            selectButton(
                                combinationOptions,
                                button
                            );

                        }
                    );

                }
            );

    }


    const targetOptions =
        document.getElementById(
            "targetOptions"
        );


    if (targetOptions) {

        targetOptions
            .querySelectorAll(
                ".detail-option"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            selectedTarget =
                                button.dataset.value;

                            selectButton(
                                targetOptions,
                                button
                            );

                        }
                    );

                }
            );

    }


    const studyModeOptions =
        document.getElementById(
            "studyModeOptions"
        );


    if (studyModeOptions) {

        studyModeOptions
            .querySelectorAll(
                ".detail-option"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            selectedStudyMode =
                                button.dataset.value;

                            selectButton(
                                studyModeOptions,
                                button
                            );

                        }
                    );

                }
            );

    }

}


// ============================================================
// SELECT BUTTON
// ============================================================

function selectButton(
    container,
    selected
) {

    container
        .querySelectorAll(
            ".detail-option"
        )
        .forEach(
            button =>
                button.classList.remove(
                    "selected"
                )
        );


    selected.classList.add(
        "selected"
    );


    detailsError.textContent =
        "";

}


// ============================================================
// COMPLETE ONBOARDING
// ============================================================

document
    .getElementById(
        "completeButton"
    )
    .addEventListener(
        "click",
        completeOnboarding
    );


async function completeOnboarding() {

    detailsError.textContent =
        "";

    const name =
        nameInput.value.trim();


    /*
     * FINAL VALIDATION
     *
     * Nothing gets saved until EVERYTHING
     * required is present.
     */

    if (!name) {

        goToStep(1);

        nameError.textContent =
            "Please enter your name.";

        return;

    }


    if (!selectedClass) {

        goToStep(2);

        classError.textContent =
            "Please select your class.";

        return;

    }


    /*
     * 10TH
     */

    if (
        selectedClass === "10th"
    ) {

        if (!selectedBoard) {

            detailsError.textContent =
                "Please select your board.";

            return;

        }

        if (!selectedStudyMode) {

            detailsError.textContent =
                "Please select your learning mode.";

            return;

        }

    }


    /*
     * PUC
     */

    if (
        selectedClass === "1st PUC" ||
        selectedClass === "2nd PUC"
    ) {

        if (!selectedCombination) {

            detailsError.textContent =
                "Please select your combination.";

            return;

        }


        if (!selectedTarget) {

            detailsError.textContent =
                "Please select your preparation goal.";

            return;

        }


        if (!selectedStudyMode) {

            detailsError.textContent =
                "Please select your learning mode.";

            return;

        }

    }


    /*
     * FOUNDATION CLASSES
     */

    if (
        selectedClass === "Under 8th" ||
        selectedClass === "8th" ||
        selectedClass === "9th"
    ) {

        if (!selectedStudyMode) {

            detailsError.textContent =
                "Please select your learning mode.";

            return;

        }

    }


    /*
     * Disable button
     */

    const button =
        document.getElementById(
            "completeButton"
        );

    button.disabled = true;


    savingMessage.classList.remove(
        "hidden"
    );


    try {

        const profile = {

            uid:
                currentUser.uid,

            name:
                name,

            email:
                currentUser.email || "",

            className:
                selectedClass,

            board:
                selectedBoard || null,

            combination:
                selectedCombination || null,

            target:
                selectedTarget || null,

            studyMode:
                selectedStudyMode,

            onboardingComplete:
                true,

            profileVersion:
                1,

            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };


        /*
         * SAVE TO FIRESTORE
         */

        await setDoc(
            doc(
                db,
                "students",
                currentUser.uid
            ),
            profile,
            {
                merge: true
            }
        );


        /*
         * CRITICAL:
         *
         * Read the document AGAIN.
         *
         * Only after Firebase confirms that
         * onboardingComplete == true do we
         * allow Home.
         */

        const verification =
            await getDoc(
                doc(
                    db,
                    "students",
                    currentUser.uid
                )
            );


        if (
            !verification.exists()
        ) {

            throw new Error(
                "Profile could not be verified."
            );

        }


        const savedProfile =
            verification.data();


        if (
            !isProfileComplete(
                savedProfile
            )
        ) {

            throw new Error(
                "Profile is still incomplete."
            );

        }


        /*
         * EVERYTHING IS COMPLETE.
         *
         * NOW — AND ONLY NOW —
         * go to Home.
         */

        window.location.replace(
            "../home/"
        );

    } catch (error) {

        console.error(
            "ONBOARDING SAVE ERROR:",
            error
        );


        savingMessage.classList.add(
            "hidden"
        );


        button.disabled =
            false;


        detailsError.textContent =
            "We couldn't save your details. Please try again.";

    }

}


// ============================================================
// PROFILE VALIDATION
// ============================================================

function isProfileComplete(
    data
) {

    if (!data) {
        return false;
    }


    if (
        !data.onboardingComplete
    ) {

        return false;

    }


    if (
        !data.name ||
        typeof data.name !== "string" ||
        data.name.trim().length < 2
    ) {

        return false;

    }


    const validClasses = [

        "Under 8th",
        "8th",
        "9th",
        "10th",
        "1st PUC",
        "2nd PUC"

    ];


    if (
        !validClasses.includes(
            data.className
        )
    ) {

        return false;

    }


    /*
     * 10th requires board + study mode
     */

    if (
        data.className === "10th"
    ) {

        if (!data.board) {
            return false;
        }

        if (!data.studyMode) {
            return false;
        }

    }


    /*
     * PUC requires combination,
     * preparation and mode.
     */

    if (
        data.className === "1st PUC" ||
        data.className === "2nd PUC"
    ) {

        if (!data.combination) {
            return false;
        }

        if (!data.target) {
            return false;
        }

        if (!data.studyMode) {
            return false;
        }

    }


    /*
     * Under 8th / 8th / 9th
     */

    if (
        data.className === "Under 8th" ||
        data.className === "8th" ||
        data.className === "9th"
    ) {

        if (!data.studyMode) {
            return false;
        }

    }


    return true;

}


// ============================================================
// STEP NAVIGATION
// ============================================================

function goToStep(
    step
) {

    currentStep =
        step;


    step1.classList.remove(
        "active"
    );

    step2.classList.remove(
        "active"
    );

    step3.classList.remove(
        "active"
    );


    if (step === 1) {

        step1.classList.add(
            "active"
        );

    }


    if (step === 2) {

        step2.classList.add(
            "active"
        );

    }


    if (step === 3) {

        step3.classList.add(
            "active"
        );

    }


    const percentage =
        step === 1
            ? 33
            : step === 2
                ? 66
                : 100;


    progressBar.style.width =
        `${percentage}%`;


    progressPercent.textContent =
        `${percentage}%`;


    stepText.textContent =
        `Step ${step} of 3`;


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ============================================================
// LOADER
// ============================================================

function hideLoader() {

    loader.classList.add(
        "hidden"
    );

}


// ============================================================
// SECURITY HELPERS
// ============================================================

function escapeHtml(
    value
) {

    return String(value)
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

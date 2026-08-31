// ============================================================
// ZENOVA EDUCATONS
// STUDENT ONBOARDING
// ============================================================

import {
    auth,
    db
} from "../firebase/firebase-config.js";

import {
    onAuthStateChanged
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from
    "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// ============================================================
// STATE
// ============================================================

const profile = {

    name: "",
    className: "",
    board: "",
    stream: "",
    combination: "",
    goal: ""

};


let currentUser = null;


// ============================================================
// ELEMENTS
// ============================================================

const nameStep =
    document.getElementById("nameStep");

const classStep =
    document.getElementById("classStep");

const boardStep =
    document.getElementById("boardStep");

const streamStep =
    document.getElementById("streamStep");

const combinationStep =
    document.getElementById("combinationStep");

const goalStep =
    document.getElementById("goalStep");

const completeStep =
    document.getElementById("completeStep");

const stepCounter =
    document.getElementById("stepCounter");

const progressBar =
    document.getElementById("progressBar");

const studentName =
    document.getElementById("studentName");

const nameError =
    document.getElementById("nameError");

const classError =
    document.getElementById("classError");

const welcomeName =
    document.getElementById("welcomeName");


// ============================================================
// AUTH CHECK
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
         * If profile already exists,
         * onboarding should never appear again.
         */

        try {

            const profileRef =
                doc(
                    db,
                    "students",
                    user.uid
                );

            const profileSnapshot =
                await getDoc(profileRef);


            if (profileSnapshot.exists()) {

                window.location.replace(
                    "../home/"
                );

            }

        } catch (error) {

            console.error(
                "Profile check failed:",
                error
            );

        }

    }
);


// ============================================================
// STEP CONTROL
// ============================================================

function showStep(step) {

    document
        .querySelectorAll(".step")
        .forEach(
            element => {
                element.classList.remove(
                    "active"
                );
            }
        );


    step.classList.add("active");


    updateProgress(step);

}


function updateProgress(step) {

    const steps = [

        nameStep,
        classStep,
        boardStep,
        streamStep,
        combinationStep,
        goalStep,
        completeStep

    ];


    const index =
        steps.indexOf(step);


    const total =
        steps.length;


    let visibleStep =
        index + 1;


    /*
     * We don't want the user seeing
     * confusing internal step counts.
     */

    stepCounter.textContent =
        `${visibleStep} / ${total}`;


    progressBar.style.width =
        `${(visibleStep / total) * 100}%`;

}


// ============================================================
// NAME
// ============================================================

document
    .getElementById("nameContinue")
    .addEventListener(
        "click",
        () => {

            const value =
                studentName.value.trim();


            if (!value) {

                nameError.textContent =
                    "Please enter your name.";

                studentName.focus();

                return;

            }


            if (value.length < 2) {

                nameError.textContent =
                    "Please enter your full name.";

                studentName.focus();

                return;

            }


            nameError.textContent = "";


            profile.name =
                value;


            showStep(
                classStep
            );

        }
    );


// ============================================================
// CLASS
// ============================================================

document
    .querySelectorAll(
        ".option-card"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    profile.className =
                        button.dataset.class;


                    classError.textContent =
                        "";


                    /*
                     * 10th:
                     * Ask ONLY board.
                     */

                    if (
                        profile.className ===
                        "10th"
                    ) {

                        showStep(
                            boardStep
                        );

                        return;

                    }


                    /*
                     * PUC:
                     * Ask stream and then
                     * academic details.
                     */

                    if (
                        profile.className ===
                        "1st PUC" ||
                        profile.className ===
                        "2nd PUC"
                    ) {

                        document
                            .getElementById(
                                "pucLabel"
                            )
                            .textContent =
                            profile.className
                                .toUpperCase();


                        showStep(
                            streamStep
                        );

                        return;

                    }


                    /*
                     * 8th / 9th:
                     * No unnecessary questions.
                     */

                    finishProfile();

                }
            );

        }
    );


// ============================================================
// BOARD
// ============================================================

document
    .querySelectorAll(
        "[data-board]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    profile.board =
                        button.dataset.board;


                    finishProfile();

                }
            );

        }
    );


// ============================================================
// PUC STREAM
// ============================================================

document
    .querySelectorAll(
        "[data-stream]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    profile.stream =
                        button.dataset.stream;


                    if (
                        profile.stream ===
                        "Science"
                    ) {

                        showStep(
                            combinationStep
                        );

                    } else {

                        /*
                         * For Commerce / Arts
                         * we can add their detailed
                         * subject structure later.
                         *
                         * For now ask their goal.
                         */

                        showStep(
                            goalStep
                        );

                    }

                }
            );

        }
    );


// ============================================================
// COMBINATION
// ============================================================

document
    .querySelectorAll(
        "[data-combination]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    profile.combination =
                        button.dataset.combination;


                    showStep(
                        goalStep
                    );

                }
            );

        }
    );


// ============================================================
// GOAL
// ============================================================

document
    .querySelectorAll(
        "[data-goal]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    profile.goal =
                        button.dataset.goal;


                    finishProfile();

                }
            );

        }
    );


// ============================================================
// BACK BUTTONS
// ============================================================

document
    .querySelectorAll(
        "[data-back]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const target =
                        button.dataset.back;


                    if (
                        target ===
                        "class"
                    ) {

                        showStep(
                            classStep
                        );

                    }

                    else if (
                        target ===
                        "stream"
                    ) {

                        showStep(
                            streamStep
                        );

                    }

                    else if (
                        target ===
                        "previous"
                    ) {

                        if (
                            profile.stream ===
                            "Science"
                        ) {

                            showStep(
                                combinationStep
                            );

                        } else {

                            showStep(
                                streamStep
                            );

                        }

                    }

                }
            );

        }
    );


// ============================================================
// SAVE PROFILE
// ============================================================

async function finishProfile() {

    if (!currentUser) {

        return;

    }


    showLoading();


    try {

        const profileData = {

            uid:
                currentUser.uid,

            name:
                profile.name,

            email:
                currentUser.email || "",

            photoURL:
                currentUser.photoURL || "",

            className:
                profile.className,

            board:
                profile.board || null,

            stream:
                profile.stream || null,

            combination:
                profile.combination || null,

            goal:
                profile.goal || null,

            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };


        await setDoc(

            doc(
                db,
                "students",
                currentUser.uid
            ),

            profileData

        );


        welcomeName.textContent =
            `Welcome, ${profile.name}. Your personalised learning space is ready.`;


        hideLoading();


        showStep(
            completeStep
        );


    } catch (error) {

        console.error(
            "Unable to save student profile:",
            error
        );


        hideLoading();


        alert(
            "We couldn't save your profile. Please check your connection and try again."
        );

    }

}


// ============================================================
// ENTER ZENOVA
// ============================================================

document
    .getElementById("enterZenova")
    .addEventListener(
        "click",
        () => {

            window.location.replace(
                "../home/"
            );

        }
    );


// ============================================================
// LOADING
// ============================================================

function showLoading() {

    document.body.classList.add(
        "saving"
    );

}


function hideLoading() {

    document.body.classList.remove(
        "saving"
    );

}


// ============================================================
// INITIAL STEP
// ============================================================

showStep(
    nameStep
);

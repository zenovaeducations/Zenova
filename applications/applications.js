/* =========================================================
   ZENOVA STUDENT SCHOOL LEAD APPLICATION
========================================================= */

import {
    db
} from "../firebase/firebase-config.js";


import {
    collection,
    addDoc,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   COLLECTIONS
========================================================= */

const SCHOOLS_COLLECTION =
    "crmSchools";

const LEADS_COLLECTION =
    "schoolLeadRecords";


/* =========================================================
   DOM
========================================================= */

const applicationForm =
    document.getElementById(
        "applicationForm"
    );

const studentName =
    document.getElementById(
        "studentName"
    );

const phone =
    document.getElementById(
        "phone"
    );

const schoolSelect =
    document.getElementById(
        "schoolSelect"
    );

const submitBtn =
    document.getElementById(
        "submitBtn"
    );

const successScreen =
    document.getElementById(
        "successScreen"
    );

const errorMessage =
    document.getElementById(
        "errorMessage"
    );


/* =========================================================
   LOAD SCHOOLS
========================================================= */

function loadSchools() {

    const schoolsRef =
        collection(
            db,
            SCHOOLS_COLLECTION
        );


    onSnapshot(

        schoolsRef,

        (snapshot) => {

            const schools = [];


            snapshot.forEach(
                (doc) => {

                    const data =
                        doc.data();


                    /*
                     * Ignore inactive schools
                     */

                    if (
                        data.crmActive === false
                    ) {
                        return;
                    }


                    schools.push({

                        id: doc.id,

                        ...data

                    });

                }
            );


            schools.sort(
                (a, b) => {

                    return getSchoolName(a)
                        .localeCompare(
                            getSchoolName(b)
                        );

                }
            );


            populateSchools(
                schools
            );

        },

        (error) => {

            console.error(
                "School loading error:",
                error
            );


            showError(
                "Unable to load schools. Please try again."
            );

        }

    );

}


/* =========================================================
   SCHOOL NAME
========================================================= */

function getSchoolName(
    school
) {

    return (

        school.crmSchoolName ||

        school.schoolName ||

        school.name ||

        "Unnamed School"

    );

}


/* =========================================================
   POPULATE SCHOOLS
========================================================= */

function populateSchools(
    schools
) {

    schoolSelect.innerHTML = `

        <option value="">
            Select your school
        </option>

    `;


    schools.forEach(
        (school) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                school.id;


            option.textContent =
                getSchoolName(
                    school
                );


            schoolSelect.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   PHONE INPUT
========================================================= */

phone.addEventListener(
    "input",
    () => {

        phone.value =
            phone.value
                .replace(
                    /\D/g,
                    ""
                )
                .slice(
                    0,
                    10
                );

    }
);


/* =========================================================
   SUBMIT
========================================================= */

applicationForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        hideError();


        const name =
            studentName.value
                .trim();


        const mobile =
            phone.value
                .replace(
                    /\D/g,
                    ""
                );


        const schoolId =
            schoolSelect.value;


        /* -----------------------------------------------
           VALIDATE NAME
        ------------------------------------------------ */

        if (
            name.length < 2
        ) {

            showError(
                "Please enter your full name."
            );

            studentName.focus();

            return;

        }


        /* -----------------------------------------------
           VALIDATE PHONE
        ------------------------------------------------ */

        if (
            !/^[6-9][0-9]{9}$/.test(
                mobile
            )
        ) {

            showError(
                "Please enter a valid 10-digit mobile number."
            );

            phone.focus();

            return;

        }


        /* -----------------------------------------------
           VALIDATE SCHOOL
        ------------------------------------------------ */

        if (!schoolId) {

            showError(
                "Please select your school."
            );

            schoolSelect.focus();

            return;

        }


        /* -----------------------------------------------
           GET SELECTED SCHOOL
        ------------------------------------------------ */

        const selectedOption =
            schoolSelect.options[
                schoolSelect.selectedIndex
            ];


        const schoolName =
            selectedOption.textContent
                .trim();


        /* -----------------------------------------------
           DISABLE BUTTON
        ------------------------------------------------ */

        submitBtn.disabled =
            true;

        submitBtn.textContent =
            "Submitting...";


        try {

            /* ============================================
               CREATE COMPLETELY NEW SCHOOL LEAD
            ============================================ */

            await addDoc(

                collection(
                    db,
                    LEADS_COLLECTION
                ),

                {

                    /*
                     * Student information
                     */

                    studentName:
                        name,

                    phone:
                        mobile,


                    /*
                     * School
                     */

                    schoolId:
                        schoolId,

                    schoolName:
                        schoolName,


                    /*
                     * AUTOMATIC STATUS
                     *
                     * Student never chooses this.
                     */

                    status:
                        "NEW",


                    /*
                     * Student application
                     * has no extra details.
                     */

                    details:
                        "",


                    /*
                     * Source
                     */

                    source:
                        "STUDENT_APPLICATION",


                    /*
                     * Timestamps
                     */

                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()

                }

            );


            /* -------------------------------------------
               SUCCESS
            -------------------------------------------- */

            applicationForm.style.display =
                "none";


            successScreen.classList.add(
                "show"
            );


        }

        catch (error) {

            console.error(
                "APPLICATION ERROR:",
                error
            );


            showError(
                "Something went wrong. Please try again."
            );


            submitBtn.disabled =
                false;

            submitBtn.textContent =
                "Submit Application";

        }

    }
);


/* =========================================================
   ERROR
========================================================= */

function showError(
    message
) {

    errorMessage.textContent =
        message;

    errorMessage.classList.add(
        "show"
    );

}


function hideError() {

    errorMessage.textContent =
        "";

    errorMessage.classList.remove(
        "show"
    );

}


/* =========================================================
   START
========================================================= */

loadSchools();

console.log(
    "Zenova Student School Application loaded."
);

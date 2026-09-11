import {
    auth,
    db
} from "../../firebase/firebase-config.js";

import {
    doc,
    getDoc,
    collection,
    addDoc,
    serverTimestamp,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =====================================================
   CONFIG
===================================================== */

/*
 * CHANGE THIS NUMBER TO ZENOVA ADMIN'S
 * WHATSAPP NUMBER.
 *
 * Country code included.
 *
 * Example format:
 * 919876543210
 */

const ADMIN_WHATSAPP_NUMBER =
    "919591711820";


/* =====================================================
   STATE
===================================================== */

let currentUser = null;

let currentStudent = null;

let currentCourse = null;

let checkoutData = null;

let requestSubmitted = false;


/* =====================================================
   ELEMENTS
===================================================== */

const loadingScreen =
    document.getElementById(
        "loadingScreen"
    );

const app =
    document.getElementById(
        "app"
    );

const courseImage =
    document.getElementById(
        "courseImage"
    );

const courseImageFallback =
    document.getElementById(
        "courseImageFallback"
    );

const courseName =
    document.getElementById(
        "courseName"
    );

const courseMeta =
    document.getElementById(
        "courseMeta"
    );

const courseCode =
    document.getElementById(
        "courseCode"
    );

const summaryCourse =
    document.getElementById(
        "summaryCourse"
    );

const summaryClass =
    document.getElementById(
        "summaryClass"
    );

const summaryLanguage =
    document.getElementById(
        "summaryLanguage"
    );

const languageRow =
    document.getElementById(
        "languageRow"
    );

const coursePrice =
    document.getElementById(
        "coursePrice"
    );

const discountRow =
    document.getElementById(
        "discountRow"
    );

const discountAmount =
    document.getElementById(
        "discountAmount"
    );

const finalPrice =
    document.getElementById(
        "finalPrice"
    );

const contactAdminButton =
    document.getElementById(
        "contactAdminButton"
    );

const enrollButton =
    document.getElementById(
        "enrollButton"
    );

const enrollButtonText =
    document.getElementById(
        "enrollButtonText"
    );

const successState =
    document.getElementById(
        "successState"
    );

const successContactButton =
    document.getElementById(
        "successContactButton"
    );

const goCoursesButton =
    document.getElementById(
        "goCoursesButton"
    );


/* =====================================================
   START
===================================================== */

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


        checkoutData =
            readCheckoutData();


        if (
            !checkoutData?.courseId
        ) {

            showError(
                "Your course information could not be found. Please return to Batch Details."
            );

            return;

        }


        await Promise.all([
            loadStudent(user.uid),
            loadCourse(
                checkoutData.courseId
            )
        ]);


        hideLoading();

    }
);


/* =====================================================
   READ CHECKOUT
===================================================== */

function readCheckoutData() {

    try {

        const raw =
            sessionStorage.getItem(
                "zenova_checkout"
            );


        if (!raw) {

            return null;

        }


        return JSON.parse(
            raw
        );

    } catch (error) {

        console.error(
            "CHECKOUT DATA ERROR:",
            error
        );

        return null;

    }

}


/* =====================================================
   LOAD STUDENT
===================================================== */

async function loadStudent(
    uid
) {

    try {

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

    } catch (error) {

        console.error(
            "STUDENT LOAD ERROR:",
            error
        );

        currentStudent = {};

    }

}


/* =====================================================
   LOAD COURSE
===================================================== */

async function loadCourse(
    courseId
) {

    try {

        const courseRef =
            doc(
                db,
                "crmCourses",
                courseId
            );


        /*
         * One realtime listener.
         *
         * If Admin changes price/image/course
         * information before enrollment, this
         * page receives the latest data.
         */

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


                renderCourse();

            },

            error => {

                console.error(
                    "COURSE LOAD ERROR:",
                    error
                );

                showError(
                    "Unable to load course details."
                );

            }

        );

    } catch (error) {

        console.error(
            "COURSE ERROR:",
            error
        );

        showError(
            "Unable to load course details."
        );

    }

}


/* =====================================================
   RENDER COURSE
===================================================== */

function renderCourse() {

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


    const code =
        currentCourse.crmCourseCode ||
        "";


    const className =
        formatClass(
            currentCourse.crmClass ||
            ""
        );


    const medium =
        currentCourse.crmMedium ||
        "";


    const image =
        currentCourse.crmImageUrl ||
        currentCourse.imageUrl ||
        currentCourse.courseImageUrl ||
        "";


    courseName.textContent =
        name;


    courseMeta.textContent =
        [className, medium]
            .filter(Boolean)
            .join(" • ") ||
        "Zenova Educations";


    courseCode.textContent =
        code;


    summaryCourse.textContent =
        name;


    summaryClass.textContent =
        className || "—";


    if (
        checkoutData?.selectedLanguage
    ) {

        languageRow.classList.remove(
            "hidden"
        );

        summaryLanguage.textContent =
            checkoutData.selectedLanguage;

    }


    const price =
        Number(
            checkoutData?.price ??
            currentCourse.crmPrice ??
            0
        );


    const discount =
        Number(
            checkoutData?.discount ??
            currentCourse.crmDiscount ??
            0
        );


    const final =
        Number(
            checkoutData?.finalPrice ??
            currentCourse.crmFinalPrice ??
            Math.max(
                0,
                price - discount
            )
        );


    coursePrice.textContent =
        formatMoney(price);


    if (
        discount > 0
    ) {

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
        formatMoney(final);


    if (
        image
    ) {

        courseImage.src =
            image;

        courseImage.classList.remove(
            "hidden"
        );

        courseImageFallback.style.display =
            "none";


        courseImage.onerror =
            () => {

                courseImage.classList.add(
                    "hidden"
                );

                courseImageFallback.style.display =
                    "flex";

            };

    } else {

        courseImage.classList.add(
            "hidden"
        );

        courseImageFallback.style.display =
            "flex";

    }

}


/* =====================================================
   ENROLL REQUEST
===================================================== */

enrollButton.addEventListener(
    "click",
    submitEnrollmentRequest
);


async function submitEnrollmentRequest() {

    if (
        requestSubmitted
    ) {

        return;

    }


    if (
        !currentUser ||
        !currentCourse
    ) {

        alert(
            "Course information is not ready yet."
        );

        return;

    }


    try {

        setEnrollState(
            true
        );


        /*
         * ---------------------------------------------
         * CURRENT COURSE PRICING
         * ---------------------------------------------
         */

        const price =
            Number(
                checkoutData?.price ??
                currentCourse.crmPrice ??
                0
            );


        const discount =
            Number(
                checkoutData?.discount ??
                currentCourse.crmDiscount ??
                0
            );


        const finalPrice =
            Number(
                checkoutData?.finalPrice ??
                currentCourse.crmFinalPrice ??
                Math.max(
                    0,
                    price - discount
                )
            );


        /*
         * ---------------------------------------------
         * COMPLETE STUDENT INFORMATION
         * ---------------------------------------------
         */

        const student =
            currentStudent || {};


        const request = {

            /* -----------------------------------------
               AUTH
            ------------------------------------------ */

            studentUid:
                currentUser.uid,


            /* -----------------------------------------
               STUDENT IDENTITY
            ------------------------------------------ */

            studentName:
                student.name ||
                student.fullName ||
                currentUser.displayName ||
                "",

            phone:
                student.phone ||
                student.mobile ||
                student.phoneNumber ||
                "",

            email:
                student.email ||
                currentUser.email ||
                "",

            dateOfBirth:
                student.dateOfBirth ||
                student.dob ||
                "",

            gender:
                student.gender ||
                "",


            /* -----------------------------------------
               ACADEMIC
            ------------------------------------------ */

            className:
                student.className ||
                student.crmClass ||
                currentCourse.crmClass ||
                "",

            board:
                student.board ||
                student.crmBoard ||
                currentCourse.crmBoard ||
                "",

            combination:
                student.combination ||
                student.stream ||
                "",

            target:
                student.target ||
                student.targetExam ||
                "",

            medium:
                student.medium ||
                student.crmMedium ||
                currentCourse.crmMedium ||
                "",


            /* -----------------------------------------
               LOCATION
            ------------------------------------------ */

            district:
                student.district ||
                student.districtName ||
                "",

            taluk:
                student.taluk ||
                student.talukName ||
                "",

            gramPanchayat:
                student.gramPanchayat ||
                student.gramPanchayatName ||
                "",

            village:
                student.village ||
                student.villageName ||
                "",

            school:
                student.school ||
                student.schoolName ||
                "",


            /* -----------------------------------------
               COURSE
            ------------------------------------------ */

            crmCourseId:
                currentCourse.id,

            courseName:
                currentCourse.crmCourseName ||
                "",

            courseCode:
                currentCourse.crmCourseCode ||
                "",

            courseClass:
                currentCourse.crmClass ||
                "",

            courseBoard:
                currentCourse.crmBoard ||
                "",

            courseMedium:
                currentCourse.crmMedium ||
                "",


            /* -----------------------------------------
               PURCHASE
            ------------------------------------------ */

            selectedLanguage:
                checkoutData?.selectedLanguage ||
                "",

            coursePrice:
                price,

            discount:
                discount,

            finalPrice:
                finalPrice,


            /* -----------------------------------------
               REQUEST STATUS
            ------------------------------------------ */

            status:
                "PENDING",

            paymentStatus:
                "MANUAL_PAYMENT_PENDING",

            source:
                "STUDENT_APP",

            requestType:
                "COURSE_ENROLLMENT",


            /* -----------------------------------------
               ADMIN ACCESS
            ------------------------------------------ */

            accessGranted:
                false,

            approvedAt:
                null,

            approvedBy:
                null,


            /* -----------------------------------------
               TIMESTAMPS
            ------------------------------------------ */

            createdAt:
                serverTimestamp(),

            updatedAt:
                serverTimestamp()

        };


        /*
         * ---------------------------------------------
         * SAVE
         * ---------------------------------------------
         */

        const requestsRef =
            collection(
                db,
                "courseEnrollmentRequests"
            );


        const requestDoc =
            await addDoc(
                requestsRef,
                request
            );


        console.log(
            "Enrollment request created:",
            requestDoc.id
        );


        requestSubmitted =
            true;


        /*
         * Clear old checkout data
         * after successfully saving request.
         */

        sessionStorage.removeItem(
            "zenova_checkout"
        );


        showSuccess();

    } catch (error) {

        console.error(
            "ENROLLMENT REQUEST ERROR:",
            error
        );


        alert(
            "Unable to submit your enrollment request. Please try again."
        );


        setEnrollState(
            false
        );

    }

}


/* =====================================================
   SUCCESS
===================================================== */

function showSuccess() {

    document
        .querySelectorAll(
            ".section, .notice-card, .enroll-section"
        )
        .forEach(
            element => {

                element.classList.add(
                    "hidden"
                );

            }
        );


    successState.classList.remove(
        "hidden"
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =====================================================
   CONTACT ADMIN
===================================================== */

contactAdminButton.addEventListener(
    "click",
    contactAdmin
);


successContactButton.addEventListener(
    "click",
    contactAdmin
);


function contactAdmin() {

    const name =
        currentStudent?.name ||
        currentStudent?.fullName ||
        currentUser?.displayName ||
        "Student";


    const course =
        currentCourse?.crmCourseName ||
        "course";


    const requestMessage =
        `Hello Zenova Educations,

I am ${name}.

I want to enroll in:
${course}

Course Code:
${currentCourse?.crmCourseCode || "N/A"}

Class:
${currentCourse?.crmClass || "N/A"}

Amount:
${formatMoney(
    Number(
        checkoutData?.finalPrice ??
        currentCourse?.crmFinalPrice ??
        0
    )
)}

I have submitted my enrollment request through the Zenova Student App.

Please guide me regarding payment and activation.

Thank you.`;


    const encodedMessage =
        encodeURIComponent(
            requestMessage
        );


    /*
     * Replace ADMIN_WHATSAPP_NUMBER
     * above with Zenova's actual number.
     */

    if (
        ADMIN_WHATSAPP_NUMBER &&
        !ADMIN_WHATSAPP_NUMBER.includes(
            "X"
        )
    ) {

        window.location.href =
            `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${encodedMessage}`;

        return;

    }


    alert(
        "Please configure the Zenova Admin WhatsApp number in payment.js."
    );

}


/* =====================================================
   GO TO COURSES
===================================================== */

goCoursesButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "../batches/";

    }
);


/* =====================================================
   BACK
===================================================== */

document
    .getElementById(
        "backButton"
    )
    .addEventListener(
        "click",
        () => {

            if (
                window.history.length > 1
            ) {

                window.history.back();

            } else {

                window.location.href =
                    "../batchdetails/";

            }

        }
    );


/* =====================================================
   NOTIFICATION
===================================================== */

document
    .getElementById(
        "notificationButton"
    )
    .addEventListener(
        "click",
        () => {

            window.location.href =
                "../notifications/";

        }
    );


/* =====================================================
   BOTTOM NAV
===================================================== */

document
    .querySelectorAll(
        "[data-nav]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const destination =
                        button.dataset.nav;


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
                            "../profile/"

                    };


                    if (
                        routes[destination]
                    ) {

                        window.location.href =
                            routes[destination];

                    }

                }
            );

        }
    );


/* =====================================================
   BUTTON STATE
===================================================== */

function setEnrollState(
    loading
) {

    enrollButton.disabled =
        loading;


    if (
        loading
    ) {

        enrollButtonText.textContent =
            "SUBMITTING...";

    } else {

        enrollButtonText.textContent =
            "CLICK HERE TO ENROLL";

    }

}


/* =====================================================
   LOADING
===================================================== */

function hideLoading() {

    loadingScreen.classList.add(
        "hidden"
    );

    app.classList.remove(
        "hidden"
    );

}


function showError(
    message
) {

    loadingScreen.classList.add(
        "hidden"
    );

    app.classList.remove(
        "hidden"
    );


    alert(
        message
    );

}


/* =====================================================
   MONEY
===================================================== */

function formatMoney(
    amount
) {

    return (
        "₹" +
        Number(
            amount || 0
        ).toLocaleString(
            "en-IN"
        )
    );

}


/* =====================================================
   CLASS
===================================================== */

function formatClass(
    value
) {

    const classes = {

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
        classes[value] ||
        String(
            value || ""
        )
            .replace(
                /_/g,
                " "
            )
    );

              }

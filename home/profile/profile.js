import {
    auth,
    db
} from "../../firebase/firebase-config.js";

import {
    doc,
    onSnapshot,
    collection,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


/* =========================================================
   STATE
========================================================= */

let currentUser = null;
let unsubscribeStudent = null;
let unsubscribeEnrollments = null;


/* =========================================================
   ELEMENTS
========================================================= */

const loadingScreen =
    document.getElementById(
        "loadingScreen"
    );

const app =
    document.getElementById(
        "app"
    );

const errorState =
    document.getElementById(
        "errorState"
    );

const errorMessage =
    document.getElementById(
        "errorMessage"
    );

const studentName =
    document.getElementById(
        "studentName"
    );

const studentEmail =
    document.getElementById(
        "studentEmail"
    );

const studentId =
    document.getElementById(
        "studentId"
    );

const studentClass =
    document.getElementById(
        "studentClass"
    );

const avatar =
    document.getElementById(
        "avatar"
    );

const courseCount =
    document.getElementById(
        "courseCount"
    );

const progressValue =
    document.getElementById(
        "progressValue"
    );

const testCount =
    document.getElementById(
        "testCount"
    );

const backButton =
    document.getElementById(
        "backButton"
    );

const notificationButton =
    document.getElementById(
        "notificationButton"
    );

const editProfileButton =
    document.getElementById(
        "editProfileButton"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

const errorBackButton =
    document.getElementById(
        "errorBackButton"
    );


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    user => {

        if (!user) {

            window.location.href =
                "../login/";

            return;

        }


        currentUser =
            user;


        loadStudentProfile(
            user.uid
        );


        loadLearningStats(
            user.uid
        );

    }
);


/* =========================================================
   STUDENT PROFILE
========================================================= */

function loadStudentProfile(
    uid
) {

    if (
        unsubscribeStudent
    ) {

        unsubscribeStudent();

    }


    const studentRef =
        doc(
            db,
            "students",
            uid
        );


    unsubscribeStudent =
        onSnapshot(

            studentRef,

            snapshot => {

                if (
                    !snapshot.exists()
                ) {

                    showError(
                        "Your student profile could not be found."
                    );

                    return;

                }


                const student =
                    snapshot.data();


                renderStudent(
                    student
                );


                hideLoading();

            },

            error => {

                console.error(
                    "Student profile error:",
                    error
                );


                showError(
                    "Unable to load your profile."
                );

            }

        );

}


/* =========================================================
   RENDER STUDENT
========================================================= */

function renderStudent(
    student
) {

    const name =
        student.name ||
        student.fullName ||
        currentUser?.displayName ||
        "Student";


    const email =
        student.email ||
        currentUser?.email ||
        "—";


    const id =
        student.crmStudentId ||
        student.studentId ||
        student.studentCode ||
        "Not assigned";


    const className =
        formatClass(
            student.className ||
            student.crmClass ||
            student.class ||
            ""
        );


    setText(
        studentName,
        name
    );


    setText(
        studentEmail,
        email
    );


    setText(
        studentId,
        id
    );


    setText(
        studentClass,
        className || "—"
    );


    /*
     * First letter avatar
     */

    const firstLetter =
        name
            .trim()
            .charAt(0)
            .toUpperCase();


    if (avatar) {

        avatar.textContent =
            firstLetter || "Z";

    }

}


/* =========================================================
   LEARNING STATS
========================================================= */

function loadLearningStats(
    uid
) {

    const enrollmentsRef =
        collection(
            db,
            "studentEnrollments"
        );


    const enrollmentQuery =
        query(
            enrollmentsRef,
            where(
                "studentUid",
                "==",
                uid
            )
        );


    unsubscribeEnrollments =
        onSnapshot(

            enrollmentQuery,

            snapshot => {

                const enrollments =
                    snapshot.docs.map(
                        item => ({
                            id: item.id,
                            ...item.data()
                        })
                    );


                const activeEnrollments =
                    enrollments.filter(
                        enrollment => {

                            const status =
                                String(
                                    enrollment.status ||
                                    ""
                                ).toUpperCase();


                            return (
                                status ===
                                    "ACTIVE" ||
                                status ===
                                    "ENROLLED" ||
                                status ===
                                    "APPROVED" ||
                                !status
                            );

                        }
                    );


                setText(
                    courseCount,
                    activeEnrollments.length
                );


                /*
                 * Calculate average progress
                 */

                let progressTotal =
                    0;

                let progressItems =
                    0;


                activeEnrollments.forEach(
                    enrollment => {

                        const progress =
                            Number(
                                enrollment.progress ??
                                enrollment.progressPercent ??
                                0
                            );


                        if (
                            Number.isFinite(
                                progress
                            )
                        ) {

                            progressTotal +=
                                Math.max(
                                    0,
                                    Math.min(
                                        100,
                                        progress
                                    )
                                );

                            progressItems++;

                        }

                    }
                );


                const averageProgress =
                    progressItems
                        ? Math.round(
                            progressTotal /
                            progressItems
                        )
                        : 0;


                setText(
                    progressValue,
                    `${averageProgress}%`
                );


                /*
                 * Tests are loaded separately
                 * if your test collection uses
                 * studentUid.
                 */

                loadTestCount(
                    uid
                );

            },

            error => {

                console.warn(
                    "Enrollment stats error:",
                    error
                );


                setText(
                    courseCount,
                    "0"
                );

                setText(
                    progressValue,
                    "0%"
                );

                loadTestCount(
                    uid
                );

            }

        );

}


/* =========================================================
   TEST COUNT
========================================================= */

function loadTestCount(
    uid
) {

    /*
     * We intentionally do not make the
     * profile fail if your test collection
     * has a different structure.
     *
     * The count remains 0 until the test
     * system is connected here.
     */

    setText(
        testCount,
        "0"
    );

}


/* =========================================================
   NAVIGATION
========================================================= */

document
    .querySelectorAll(
        "[data-route]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const route =
                        button.dataset.route;


                    if (
                        route
                    ) {

                        window.location.href =
                            route;

                    }

                }
            );

        }
    );


/* =========================================================
   BOTTOM NAV
========================================================= */

document
    .querySelectorAll(
        "[data-nav]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const route =
                        button.dataset.nav;


                    switch (route) {

                        case "home":

                            window.location.href =
                                "../";

                            break;


                        case "courses":

                            window.location.href =
                                "../batches/";

                            break;


                        case "study":

                            window.location.href =
                                "../study/";

                            break;


                        case "ai":

                            window.location.href =
                                "../ai/";

                            break;


                        case "profile":

                            break;

                    }

                }
            );

        }
    );


/* =========================================================
   BACK
========================================================= */

if (backButton) {

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
   EDIT PROFILE
========================================================= */

if (editProfileButton) {

    editProfileButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "./personal/";

        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            const confirmed =
                window.confirm(
                    "Are you sure you want to log out?"
                );


            if (!confirmed) {
                return;
            }


            try {

                await signOut(
                    auth
                );


                window.location.href =
                    "../login/";

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }
    );

}


/* =========================================================
   ERROR BACK
========================================================= */

if (errorBackButton) {

    errorBackButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "../";

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

    if (loadingScreen) {

        loadingScreen.classList.add(
            "hidden"
        );

    }


    if (app) {

        app.classList.add(
            "hidden"
        );

    }


    if (errorState) {

        errorState.classList.remove(
            "hidden"
        );

    }


    setText(
        errorMessage,
        message
    );

}


/* =========================================================
   HELPERS
========================================================= */

function setText(
    element,
    value
) {

    if (!element) {
        return;
    }


    element.textContent =
        value ?? "";

}


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
        String(value || "")
            .replace(
                /_/g,
                " "
            )
    );

}


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (
            unsubscribeStudent
        ) {

            unsubscribeStudent();

        }


        if (
            unsubscribeEnrollments
        ) {

            unsubscribeEnrollments();

        }

    }
);

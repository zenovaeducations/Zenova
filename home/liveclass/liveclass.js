import {
    auth,
    db
} from "../../firebase/firebase-config.js";


import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    getFunctions,
    httpsCallable
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-functions.js";


/* =========================================================
   FIREBASE FUNCTIONS
========================================================= */

const functions =
    getFunctions(
        undefined,
        "asia-south1"
    );


const getZoomMeetingSignature =
    httpsCallable(
        functions,
        "getZoomMeetingSignature"
    );


/* =========================================================
   DOM
========================================================= */

const loadingScreen =
    document.getElementById(
        "loadingScreen"
    );


const loadingText =
    document.getElementById(
        "loadingText"
    );


const errorScreen =
    document.getElementById(
        "errorScreen"
    );


const errorText =
    document.getElementById(
        "errorText"
    );


const meetingSDKElement =
    document.getElementById(
        "meetingSDKElement"
    );


/* =========================================================
   URL
========================================================= */

const params =
    new URLSearchParams(
        window.location.search
    );


const liveClassId =
    params.get(
        "liveClassId"
    );


/* =========================================================
   START
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        try {

            if (!user) {

                showError(
                    "Please login to join the live class."
                );

                return;

            }


            if (!liveClassId) {

                showError(
                    "Live class ID is missing."
                );

                return;

            }


            await startStudentClass(
                user
            );


        } catch (error) {

            console.error(
                "LIVE CLASS ERROR:",
                error
            );


            showError(
                getErrorMessage(
                    error
                )
            );

        }

    }
);


/* =========================================================
   START STUDENT CLASS
========================================================= */

async function startStudentClass(
    user
) {

    loadingText.textContent =
        "Loading live class...";


    /* ---------------------------------
       LOAD FIRESTORE LIVE CLASS
    --------------------------------- */

    const liveClassRef =
        doc(
            db,
            "liveClasses",
            liveClassId
        );


    const liveClassSnapshot =
        await getDoc(
            liveClassRef
        );


    if (
        !liveClassSnapshot.exists()
    ) {

        throw new Error(
            "Live class not found."
        );

    }


    const liveClass =
        liveClassSnapshot.data();


    console.log(
        "LIVE CLASS:",
        liveClass
    );


    /* ---------------------------------
       CHECK ZOOM
    --------------------------------- */

    if (
        liveClass.liveType !==
        "ZOOM" &&
        liveClass.mode !==
        "ZOOM"
    ) {

        throw new Error(
            "This live class is not configured for Zoom."
        );

    }


    const meetingNumber =
        String(
            liveClass.zoomMeetingNumber ||
            liveClass.zoomMeetingId ||
            ""
        ).trim();


    const password =
        String(
            liveClass.zoomPassword ||
            ""
        );


    if (!meetingNumber) {

        throw new Error(
            "Zoom meeting number is missing."
        );

    }


    /* ---------------------------------
       GET STUDENT NAME
    --------------------------------- */

    const studentName =
        await getStudentName(
            user
        );


    /* ---------------------------------
       GET ZOOM SIGNATURE
    --------------------------------- */

    loadingText.textContent =
        "Authenticating with Zoom...";


    const result =
        await getZoomMeetingSignature({
            meetingNumber:
                meetingNumber
        });


    const data =
        result.data;


    console.log(
        "ZOOM SIGNATURE RESPONSE:",
        data
    );


    if (
        !data ||
        !data.signature
    ) {

        throw new Error(
            "Zoom authorization was not returned."
        );

    }


    /* ---------------------------------
       INITIALIZE ZOOM
    --------------------------------- */

    loadingText.textContent =
        "Starting live classroom...";


    await initializeZoom(
        {
            signature:
                data.signature,

            meetingNumber:
                meetingNumber,

            password:
                password,

            userName:
                data.userName ||
                studentName,

            userEmail:
                data.userEmail ||
                user.email ||
                ""
        }
    );

}


/* =========================================================
   GET STUDENT NAME
========================================================= */

async function getStudentName(
    user
) {

    try {

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
            studentSnapshot.exists()
        ) {

            const student =
                studentSnapshot.data();


            return (
                student.name ||
                student.studentName ||
                user.displayName ||
                "Zenova Student"
            );

        }

    } catch (error) {

        console.warn(
            "Could not load student name:",
            error
        );

    }


    return (
        user.displayName ||
        "Zenova Student"
    );

}


/* =========================================================
   INITIALIZE ZOOM
========================================================= */

function initializeZoom(
    zoomData
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {


            if (
                typeof ZoomMtg ===
                "undefined"
            ) {

                reject(
                    new Error(
                        "Zoom Meeting SDK failed to load."
                    )
                );

                return;

            }


            try {

                /*
                 * Zoom SDK preparation
                 */

                if (
                    typeof ZoomMtg.preLoadWasm ===
                    "function"
                ) {

                    ZoomMtg.preLoadWasm();

                }


                if (
                    typeof ZoomMtg.prepareWebSDK ===
                    "function"
                ) {

                    ZoomMtg.prepareWebSDK();

                }


                /*
                 * Initialize Zoom
                 */

                ZoomMtg.init({

                    leaveUrl:
                        window.location.origin +
                        "/Zenova/home/live/",

                    disablePreview:
                        false,

                    leaveOnPageUnload:
                        true,

                    success:
                        function () {

                            console.log(
                                "Zoom SDK initialized."
                            );


                            joinZoom(
                                zoomData,
                                resolve,
                                reject
                            );

                        },

                    error:
                        function (
                            error
                        ) {

                            console.error(
                                "Zoom INIT ERROR:",
                                error
                            );


                            reject(
                                new Error(
                                    formatZoomError(
                                        error
                                    )
                                )
                            );

                        }

                });

            } catch (error) {

                reject(
                    error
                );

            }

        }
    );

}


/* =========================================================
   JOIN ZOOM
========================================================= */

function joinZoom(
    zoomData,
    resolve,
    reject
) {

    console.log(
        "Joining Zoom meeting:",
        zoomData.meetingNumber
    );


    ZoomMtg.join({

        signature:
            zoomData.signature,

        meetingNumber:
            zoomData.meetingNumber,

        passWord:
            zoomData.password,

        userName:
            zoomData.userName,

        userEmail:
            zoomData.userEmail,

        success:
            function (
                result
            ) {

                console.log(
                    "ZOOM JOIN SUCCESS:",
                    result
                );


                loadingScreen.style.display =
                    "none";


                resolve(
                    result
                );

            },

        error:
            function (
                error
            ) {

                console.error(
                    "ZOOM JOIN ERROR:",
                    error
                );


                reject(
                    new Error(
                        formatZoomError(
                            error
                        )
                    )
                );

            }

    });

}


/* =========================================================
   ERROR
========================================================= */

function showError(
    message
) {

    console.error(
        message
    );


    loadingScreen.style.display =
        "none";


    errorText.textContent =
        message ||
        "Unable to join the live class.";


    errorScreen.style.display =
        "flex";

}


/* =========================================================
   FORMAT ERROR
========================================================= */

function formatZoomError(
    error
) {

    if (!error) {

        return "Unknown Zoom error.";

    }


    if (
        typeof error ===
        "string"
    ) {

        return error;

    }


    return (
        error.message ||
        error.reason ||
        error.error ||
        JSON.stringify(
            error
        )
    );

}


/* =========================================================
   ERROR MESSAGE
========================================================= */

function getErrorMessage(
    error
) {

    if (
        error?.details
    ) {

        return error.details;

    }


    if (
        error?.message
    ) {

        return error.message;

    }


    return "Unable to connect to the live classroom.";

}

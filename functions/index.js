const {
    onCall,
    HttpsError
} = require("firebase-functions/v2/https");

const {
    defineSecret
} = require("firebase-functions/params");

const admin = require("firebase-admin");

const jwt = require("jsonwebtoken");

const {
    setGlobalOptions
} = require("firebase-functions/v2");


/* ============================================================
   FIREBASE
============================================================ */

admin.initializeApp();

const db = admin.firestore();

setGlobalOptions({
    region: "asia-south1"
});


/* ============================================================
   ZOOM SECRETS
============================================================ */

const ZOOM_ACCOUNT_ID =
    defineSecret("ZOOM_ACCOUNT_ID");

const ZOOM_S2S_CLIENT_ID =
    defineSecret("ZOOM_S2S_CLIENT_ID");

const ZOOM_S2S_CLIENT_SECRET =
    defineSecret("ZOOM_S2S_CLIENT_SECRET");

const ZOOM_MEETING_SDK_CLIENT_ID =
    defineSecret("ZOOM_MEETING_SDK_CLIENT_ID");

const ZOOM_MEETING_SDK_CLIENT_SECRET =
    defineSecret("ZOOM_MEETING_SDK_CLIENT_SECRET");


/* ============================================================
   CONSTANTS
============================================================ */

const LIVE_CLASSES =
    "liveClasses";


/* ============================================================
   HELPERS
============================================================ */

function clean(value) {

    return String(
        value ?? ""
    ).trim();

}


function requireAuth(request) {

    if (!request.auth) {

        throw new HttpsError(
            "unauthenticated",
            "You must be logged in."
        );

    }

    return request.auth;

}


/* ============================================================
   ZOOM ACCESS TOKEN
============================================================ */

async function getZoomAccessToken() {

    try {

        const accountId =
            clean(
                ZOOM_ACCOUNT_ID.value()
            );

        const clientId =
            clean(
                ZOOM_S2S_CLIENT_ID.value()
            );

        const clientSecret =
            clean(
                ZOOM_S2S_CLIENT_SECRET.value()
            );


        console.log(
            "========== ZOOM TOKEN CHECK =========="
        );

        console.log(
            "Account ID present:",
            !!accountId
        );

        console.log(
            "Client ID present:",
            !!clientId
        );

        console.log(
            "Client Secret present:",
            !!clientSecret
        );

        console.log(
            "======================================"
        );


        if (!accountId) {

            throw new Error(
                "ZOOM_ACCOUNT_ID secret is empty or unavailable."
            );

        }

        if (!clientId) {

            throw new Error(
                "ZOOM_S2S_CLIENT_ID secret is empty or unavailable."
            );

        }

        if (!clientSecret) {

            throw new Error(
                "ZOOM_S2S_CLIENT_SECRET secret is empty or unavailable."
            );

        }


        const basicAuth =
            Buffer
                .from(
                    `${clientId}:${clientSecret}`
                )
                .toString("base64");


        const response =
            await fetch(
                "https://zoom.us/oauth/token",
                {

                    method:
                        "POST",

                    headers: {

                        "Authorization":
                            `Basic ${basicAuth}`,

                        "Content-Type":
                            "application/x-www-form-urlencoded"

                    },

                    body:
                        new URLSearchParams({

                            grant_type:
                                "account_credentials",

                            account_id:
                                accountId

                        })

                }
            );


        const responseText =
            await response.text();


        let data = {};

        try {

            data =
                responseText
                    ? JSON.parse(
                        responseText
                    )
                    : {};

        } catch {

            data = {

                raw:
                    responseText

            };

        }


        console.log(
            "========== ZOOM TOKEN RESPONSE =========="
        );

        console.log(
            "HTTP STATUS:",
            response.status
        );

        console.log(
            "ZOOM RESPONSE:",
            JSON.stringify(
                data
            )
        );

        console.log(
            "=========================================="
        );


        if (!response.ok) {

            const zoomMessage =
                data?.message ||
                data?.error ||
                data?.error_description ||
                data?.raw ||
                "Unknown Zoom authentication error";


            throw new Error(
                `Zoom OAuth error (${response.status}): ${zoomMessage}`
            );

        }


        if (!data.access_token) {

            throw new Error(
                "Zoom OAuth succeeded but no access_token was returned."
            );

        }


        return data.access_token;


    } catch (error) {

        console.error(
            "========== ZOOM TOKEN FAILURE =========="
        );

        console.error(
            error
        );

        console.error(
            "========================================="
        );

        throw error;

    }

}


/* ============================================================
   CREATE ZOOM MEETING
============================================================ */

exports.createZoomMeeting =
    onCall(

        {

            region:
                "asia-south1",

            secrets: [

                ZOOM_ACCOUNT_ID,

                ZOOM_S2S_CLIENT_ID,

                ZOOM_S2S_CLIENT_SECRET

            ]

        },

        async request => {

            try {

                const auth =
                    requireAuth(
                        request
                    );


                const data =
                    request.data || {};


                const title =
                    clean(
                        data.title
                    );


                const scheduledDate =
                    clean(
                        data.scheduledDate
                    );


                const scheduledTime =
                    clean(
                        data.scheduledTime
                    );


                const duration =
                    Number(
                        data.duration || 60
                    );


                console.log(
                    "========== CREATE ZOOM MEETING =========="
                );

                console.log(
                    "Title:",
                    title
                );

                console.log(
                    "Date:",
                    scheduledDate
                );

                console.log(
                    "Time:",
                    scheduledTime
                );

                console.log(
                    "Duration:",
                    duration
                );

                console.log(
                    "User:",
                    auth.token?.email || auth.uid
                );

                console.log(
                    "=========================================="
                );


                /* ----------------------------------------
                   VALIDATION
                ---------------------------------------- */

                if (!title) {

                    throw new HttpsError(
                        "invalid-argument",
                        "Class title is required."
                    );

                }


                if (!scheduledDate) {

                    throw new HttpsError(
                        "invalid-argument",
                        "Scheduled date is required."
                    );

                }


                if (!scheduledTime) {

                    throw new HttpsError(
                        "invalid-argument",
                        "Scheduled time is required."
                    );

                }


                if (
                    !duration ||
                    duration <= 0
                ) {

                    throw new HttpsError(
                        "invalid-argument",
                        "Valid duration is required."
                    );

                }


                /* ----------------------------------------
                   GET ZOOM TOKEN
                ---------------------------------------- */

                const accessToken =
                    await getZoomAccessToken();


                console.log(
                    "Zoom access token obtained successfully."
                );


                /* ----------------------------------------
                   CREATE MEETING
                ---------------------------------------- */

                const startTime =
                    `${scheduledDate}T${scheduledTime}:00+05:30`;


                console.log(
                    "Zoom start time:",
                    startTime
                );


                const zoomResponse =
                    await fetch(
                        "https://api.zoom.us/v2/users/me/meetings",
                        {

                            method:
                                "POST",

                            headers: {

                                "Authorization":
                                    `Bearer ${accessToken}`,

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    topic:
                                        title,

                                    type:
                                        2,

                                    start_time:
                                        startTime,

                                    duration:
                                        duration,

                                    timezone:
                                        "Asia/Kolkata",

                                    settings: {

                                        waiting_room:
                                            true,

                                        join_before_host:
                                            false,

                                        mute_upon_entry:
                                            true,

                                        auto_recording:
                                            "cloud",

                                        participant_video:
                                            true,

                                        host_video:
                                            true

                                    }

                                })

                        }
                    );


                const responseText =
                    await zoomResponse.text();


                let zoom = {};

                try {

                    zoom =
                        responseText
                            ? JSON.parse(
                                responseText
                            )
                            : {};

                } catch {

                    zoom = {

                        raw:
                            responseText

                    };

                }


                /* ----------------------------------------
                   ZOOM RESPONSE LOG
                ---------------------------------------- */

                console.log(
                    "========== ZOOM MEETING RESPONSE =========="
                );

                console.log(
                    "HTTP STATUS:",
                    zoomResponse.status
                );

                console.log(
                    "ZOOM RESPONSE:",
                    JSON.stringify(
                        zoom
                    )
                );

                console.log(
                    "============================================"
                );


                /* ----------------------------------------
                   ZOOM ERROR
                ---------------------------------------- */

                if (
                    !zoomResponse.ok
                ) {

                    const zoomMessage =
                        zoom?.message ||
                        zoom?.error ||
                        zoom?.error_description ||
                        zoom?.raw ||
                        "Unknown Zoom API error";


                    throw new HttpsError(
                        "internal",

                        `Zoom API error (${zoomResponse.status}): ${zoomMessage}`
                    );

                }


                if (
                    !zoom.id
                ) {

                    throw new HttpsError(
                        "internal",
                        "Zoom returned no meeting ID."
                    );

                }


                /* ----------------------------------------
                   SUCCESS
                ---------------------------------------- */

                console.log(
                    "========== ZOOM MEETING CREATED =========="
                );

                console.log(
                    "Meeting ID:",
                    zoom.id
                );

                console.log(
                    "Join URL:",
                    zoom.join_url
                );

                console.log(
                    "=========================================="
                );


                return {

                    success:
                        true,

                    meetingId:
                        String(
                            zoom.id
                        ),

                    meetingNumber:
                        String(
                            zoom.id
                        ),

                    password:
                        zoom.password ||
                        "",

                    joinUrl:
                        zoom.join_url ||
                        "",

                    startUrl:
                        zoom.start_url ||
                        "",

                    hostEmail:
                        auth.token?.email ||
                        ""

                };


            } catch (error) {

                console.error(
                    "========== CREATE ZOOM ERROR =========="
                );

                console.error(
                    "NAME:",
                    error?.name
                );

                console.error(
                    "MESSAGE:",
                    error?.message
                );

                console.error(
                    "CODE:",
                    error?.code
                );

                console.error(
                    "DETAILS:",
                    error?.details
                );

                console.error(
                    "STACK:",
                    error?.stack
                );

                console.error(
                    "======================================="
                );


                /*
                 * Preserve Firebase HttpsError.
                 */

                if (
                    error instanceof HttpsError
                ) {

                    throw error;

                }


                throw new HttpsError(
                    "internal",

                    error?.message ||
                    "Unable to create Zoom meeting."
                );

            }

        }

    );


/* ============================================================
   GENERATE ZOOM MEETING SDK SIGNATURE
============================================================ */

exports.getZoomMeetingSignature =
    onCall(

        {

            region:
                "asia-south1",

            secrets: [

                ZOOM_MEETING_SDK_CLIENT_ID,

                ZOOM_MEETING_SDK_CLIENT_SECRET

            ]

        },

        async request => {

            const auth =
                requireAuth(
                    request
                );


            const data =
                request.data || {};


            const meetingNumber =
                clean(
                    data.meetingNumber
                );


            if (!meetingNumber) {

                throw new HttpsError(
                    "invalid-argument",
                    "Meeting number is required."
                );

            }


            const studentRef =
                db
                    .collection(
                        "zen2Students"
                    )
                    .doc(
                        auth.uid
                    );


            const studentSnapshot =
                await studentRef.get();


            if (
                !studentSnapshot.exists
            ) {

                throw new HttpsError(
                    "permission-denied",
                    "Student profile not found."
                );

            }


            const student =
                studentSnapshot.data();


            const studentName =
                clean(
                    student.name ||
                    student.studentName ||
                    auth.token.name ||
                    "Zenova Student"
                );


            const clientId =
                ZOOM_MEETING_SDK_CLIENT_ID.value();


            const clientSecret =
                ZOOM_MEETING_SDK_CLIENT_SECRET.value();


            const now =
                Math.floor(
                    Date.now() / 1000
                );


            const expiration =
                now +
                (60 * 60 * 2);


            const payload = {

                appKey:
                    clientId,

                mn:
                    meetingNumber,

                role:
                    0,

                iat:
                    now - 30,

                exp:
                    expiration,

                tokenExp:
                    expiration

            };


            const signature =
                jwt.sign(
                    payload,
                    clientSecret,
                    {

                        algorithm:
                            "HS256"

                    }
                );


            return {

                success:
                    true,

                signature:
                    signature,

                meetingNumber:
                    meetingNumber,

                userName:
                    studentName,

                userEmail:
                    auth.token?.email ||
                    ""

            };

        }

    );


/* ============================================================
   ATTACH ZOOM MEETING TO LIVE CLASS
============================================================ */

exports.attachZoomMeetingToLiveClass =
    onCall(

        {

            region:
                "asia-south1",

            secrets: [

                ZOOM_ACCOUNT_ID,

                ZOOM_S2S_CLIENT_ID,

                ZOOM_S2S_CLIENT_SECRET

            ]

        },

        async request => {

            requireAuth(
                request
            );


            const data =
                request.data || {};


            const liveClassId =
                clean(
                    data.liveClassId
                );


            if (!liveClassId) {

                throw new HttpsError(
                    "invalid-argument",
                    "Live class ID is required."
                );

            }


            const meeting =
                data.meeting || {};


            const ref =
                db
                    .collection(
                        LIVE_CLASSES
                    )
                    .doc(
                        liveClassId
                    );


            const snapshot =
                await ref.get();


            if (
                !snapshot.exists
            ) {

                throw new HttpsError(
                    "not-found",
                    "Live class not found."
                );

            }


            await ref.update({

                liveType:
                    "ZOOM",

                mode:
                    "ZOOM",

                zoomMeetingId:
                    clean(
                        meeting.meetingId
                    ),

                zoomMeetingNumber:
                    clean(
                        meeting.meetingNumber
                    ),

                zoomPassword:
                    clean(
                        meeting.password
                    ),

                zoomJoinUrl:
                    clean(
                        meeting.joinUrl
                    ),

                zoomCreated:
                    true,

                zoomCreatedAt:
                    admin.firestore
                        .FieldValue
                        .serverTimestamp()

            });


            return {

                success:
                    true,

                liveClassId:
                    liveClassId

            };

        }

    );

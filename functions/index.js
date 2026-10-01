const {
    onCall,
    HttpsError
} = require("firebase-functions/v2/https");

const {
    defineSecret
} = require("firebase-functions/params");

const admin = require("firebase-admin");

const jwt = require("jsonwebtoken");

const crypto = require("crypto");

const {
    setGlobalOptions
} = require("firebase-functions/v2");

admin.initializeApp();

const db = admin.firestore();

setGlobalOptions({
    region: "asia-south1"
});


/* ============================================================
   SECRETS
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
   ZOOM SERVER-TO-SERVER ACCESS TOKEN
============================================================ */

async function getZoomAccessToken() {

    const accountId =
        ZOOM_ACCOUNT_ID.value();

    const clientId =
        ZOOM_S2S_CLIENT_ID.value();

    const clientSecret =
        ZOOM_S2S_CLIENT_SECRET.value();


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

                method: "POST",

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


    const data =
        await response.json();


    if (!response.ok) {

        console.error(
            "Zoom token error:",
            data
        );

        throw new Error(
            "Unable to authenticate with Zoom."
        );

    }


    return data.access_token;

}


/* ============================================================
   CREATE ZOOM MEETING
============================================================ */

exports.createZoomMeeting =
    onCall(

        {
            region: "asia-south1",

            secrets: [

                ZOOM_ACCOUNT_ID,

                ZOOM_S2S_CLIENT_ID,

                ZOOM_S2S_CLIENT_SECRET

            ]

        },

        async request => {

            const auth =
                requireAuth(request);


            const data =
                request.data || {};


            const title =
                clean(data.title);

            const scheduledDate =
                clean(data.scheduledDate);

            const scheduledTime =
                clean(data.scheduledTime);

            const duration =
                Number(
                    data.duration || 60
                );


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


            const accessToken =
                await getZoomAccessToken();


            const zoomResponse =
                await fetch(
                    "https://api.zoom.us/v2/users/me/meetings",
                    {

                        method: "POST",

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
                                    `${scheduledDate}T${scheduledTime}:00+05:30`,

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


            const zoom =
                await zoomResponse.json();

if (!zoomResponse.ok) {

    console.error(
        "========== ZOOM API ERROR =========="
    );

    console.error(
        "HTTP STATUS:",
        zoomResponse.status
    );

    console.error(
        "ZOOM RESPONSE:",
        JSON.stringify(zoom)
    );

    console.error(
        "===================================="
    );


    const zoomMessage =
        zoom?.message ||
        zoom?.error ||
        "Unknown Zoom API error";


    throw new HttpsError(
        "internal",
        `Zoom API error (${zoomResponse.status}): ${zoomMessage}`
    );

}
        


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
                    auth.token.email ||
                    ""

            };

        }

    );


/* ============================================================
   GENERATE MEETING SDK JWT
============================================================ */

exports.getZoomMeetingSignature =
    onCall(

        {
            region: "asia-south1",

            secrets: [

                ZOOM_MEETING_SDK_CLIENT_ID,

                ZOOM_MEETING_SDK_CLIENT_SECRET

            ]

        },

        async request => {

            const auth =
                requireAuth(request);


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


            /*
             * Only students authenticated
             * through Firebase can request
             * a signature.
             */

            const studentRef =
                db
                    .collection("zen2Students")
                    .doc(auth.uid);


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


            /*
             * Zoom Meeting SDK JWT
             *
             * role 0 = participant
             */

            const now =
                Math.floor(
                    Date.now() / 1000
                );


            const expiration =
                now + (60 * 60 * 2);


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

                    auth.token.email ||
                    ""

            };

        }

    );


/* ============================================================
   SAVE ZOOM DETAILS TO LIVE CLASS
============================================================ */

exports.attachZoomMeetingToLiveClass =
    onCall(

        {
            region: "asia-south1",

            secrets: [

                ZOOM_ACCOUNT_ID,

                ZOOM_S2S_CLIENT_ID,

                ZOOM_S2S_CLIENT_SECRET

            ]

        },

        async request => {

            requireAuth(request);


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
                    admin.firestore.FieldValue
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

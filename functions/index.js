const {
    onCall,
    HttpsError
} = require("firebase-functions/v2/https");

const admin = require("firebase-admin");

const jwt = require("jsonwebtoken");

const crypto = require("crypto");

const {
    setGlobalOptions
} = require("firebase-functions/v2");


/* =========================================================
   FIREBASE
========================================================= */

admin.initializeApp();

const db = admin.firestore();

setGlobalOptions({
    region: "asia-south1"
});


/* =========================================================
   CONSTANTS
========================================================= */

const LIVE_CLASSES =
    "liveClasses";

const ZOOM_CONFIG_COLLECTION =
    "systemConfig";

const ZOOM_CONFIG_DOCUMENT =
    "zoom";

const ADMIN_EMAIL =
    "zenovaeducations@gmail.com";


/* =========================================================
   HELPERS
========================================================= */

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


function requireAdmin(request) {

    const auth =
        requireAuth(request);

    const email =
        clean(
            auth.token?.email
        ).toLowerCase();

    if (
        email !==
        ADMIN_EMAIL
    ) {

        throw new HttpsError(
            "permission-denied",
            "You are not authorized."
        );

    }

    return auth;

}


/* =========================================================
   READ ZOOM CONFIGURATION FROM FIRESTORE
========================================================= */

async function getZoomConfig() {

    const ref =
        db
            .collection(
                ZOOM_CONFIG_COLLECTION
            )
            .doc(
                ZOOM_CONFIG_DOCUMENT
            );


    const snapshot =
        await ref.get();


    if (
        !snapshot.exists
    ) {

        throw new Error(
            "Zoom configuration has not been saved."
        );

    }


    const data =
        snapshot.data();


    const accountId =
        clean(
            data.accountId
        );

    const s2sClientId =
        clean(
            data.s2sClientId
        );

    const s2sClientSecret =
        clean(
            data.s2sClientSecret
        );

    const meetingSdkClientId =
        clean(
            data.meetingSdkClientId
        );

    const meetingSdkClientSecret =
        clean(
            data.meetingSdkClientSecret
        );


    if (
        !accountId ||
        !s2sClientId ||
        !s2sClientSecret ||
        !meetingSdkClientId ||
        !meetingSdkClientSecret
    ) {

        throw new Error(
            "Zoom configuration is incomplete."
        );

    }


    return {

        accountId,

        s2sClientId,

        s2sClientSecret,

        meetingSdkClientId,

        meetingSdkClientSecret

    };

}


/* =========================================================
   SAVE ZOOM CONFIGURATION
   CRM / KEYS PAGE
========================================================= */

exports.saveZoomConfig =
    onCall(

        {
            region: "asia-south1"
        },

        async request => {

            const auth =
                requireAdmin(
                    request
                );


            const data =
                request.data ||
                {};


            const accountId =
                clean(
                    data.accountId
                );

            const s2sClientId =
                clean(
                    data.s2sClientId
                );

            const s2sClientSecret =
                clean(
                    data.s2sClientSecret
                );

            const meetingSdkClientId =
                clean(
                    data.meetingSdkClientId
                );

            const meetingSdkClientSecret =
                clean(
                    data.meetingSdkClientSecret
                );


            if (
                !accountId ||
                !s2sClientId ||
                !s2sClientSecret ||
                !meetingSdkClientId ||
                !meetingSdkClientSecret
            ) {

                throw new HttpsError(
                    "invalid-argument",
                    "All five Zoom credentials are required."
                );

            }


            await db
                .collection(
                    ZOOM_CONFIG_COLLECTION
                )
                .doc(
                    ZOOM_CONFIG_DOCUMENT
                )
                .set(

                    {

                        accountId,

                        s2sClientId,

                        s2sClientSecret,

                        meetingSdkClientId,

                        meetingSdkClientSecret,

                        updatedAt:
                            admin.firestore.FieldValue
                                .serverTimestamp(),

                        updatedBy:
                            auth.token?.email ||
                            ADMIN_EMAIL

                    },

                    {
                        merge: true
                    }

                );


            return {

                success:
                    true,

                message:
                    "Zoom configuration saved."

            };

        }

    );


/* =========================================================
   GET ZOOM CONFIGURATION
   CRM / KEYS PAGE
========================================================= */

exports.getZoomConfig =
    onCall(

        {
            region: "asia-south1"
        },

        async request => {

            requireAdmin(
                request
            );


            const config =
                await getZoomConfig();


            return {

                success:
                    true,

                ...config

            };

        }

    );


/* =========================================================
   ZOOM SERVER-TO-SERVER ACCESS TOKEN
========================================================= */

async function getZoomAccessToken() {

    const config =
        await getZoomConfig();


    const accountId =
        config.accountId;

    const clientId =
        config.s2sClientId;

    const clientSecret =
        config.s2sClientSecret;


    const basicAuth =
        Buffer
            .from(
                `${clientId}:${clientSecret}`
            )
            .toString(
                "base64"
            );


    const url =
        new URL(
            "https://zoom.us/oauth/token"
        );


    url.searchParams.set(
        "grant_type",
        "account_credentials"
    );


    url.searchParams.set(
        "account_id",
        accountId
    );


    const response =
        await fetch(
            url.toString(),
            {

                method:
                    "POST",

                headers: {

                    "Authorization":
                        `Basic ${basicAuth}`,

                    "Content-Type":
                        "application/x-www-form-urlencoded"

                }

            }
        );


    const data =
        await response.json();


    if (
        !response.ok
    ) {

        console.error(
            "========== ZOOM TOKEN ERROR =========="
        );

        console.error(
            "HTTP STATUS:",
            response.status
        );

        console.error(
            "ZOOM RESPONSE:",
            JSON.stringify(
                data
            )
        );

        console.error(
            "======================================"
        );


        throw new Error(
            data?.reason ||
            data?.error ||
            "Unable to authenticate with Zoom."
        );

    }


    return data.access_token;

}


/* =========================================================
   CREATE ZOOM MEETING
========================================================= */

exports.createZoomMeeting =
    onCall(

        {
            region: "asia-south1"
        },

        async request => {

            const auth =
                requireAuth(
                    request
                );


            const data =
                request.data ||
                {};


            /*
             * Supports BOTH the old CRM format
             * and the new CRM format.
             */

            const title =
                clean(
                    data.title ||
                    data.topic
                );


            const scheduledDate =
                clean(
                    data.scheduledDate ||
                    (
                        data.startTime
                            ? String(
                                data.startTime
                            ).substring(
                                0,
                                10
                            )
                            : ""
                    )
                );


            let scheduledTime =
                clean(
                    data.scheduledTime
                );


            if (
                !scheduledTime &&
                data.startTime
            ) {

                const raw =
                    String(
                        data.startTime
                    );

                if (
                    raw.includes("T")
                ) {

                    scheduledTime =
                        raw
                            .split("T")[1]
                            .substring(
                                0,
                                5
                            );

                }

            }


            const duration =
                Number(
                    data.duration ||
                    60
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


            if (
                !Number.isFinite(
                    duration
                ) ||
                duration <= 0
            ) {

                throw new HttpsError(
                    "invalid-argument",
                    "Invalid duration."
                );

            }


            const accessToken =
                await getZoomAccessToken();


            const startTime =
                `${scheduledDate}T${scheduledTime}:00+05:30`;


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
                            JSON.stringify(

                                {

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

                                }

                            )

                    }

                );


            const zoom =
                await zoomResponse.json();


            if (
                !zoomResponse.ok
            ) {

                console.error(
                    "========== ZOOM API ERROR =========="
                );

                console.error(
                    "HTTP STATUS:",
                    zoomResponse.status
                );

                console.error(
                    "ZOOM RESPONSE:",
                    JSON.stringify(
                        zoom
                    )
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
                    auth.token?.email ||
                    ""

            };

        }

    );


/* =========================================================
   GENERATE ZOOM MEETING SDK SIGNATURE
========================================================= */

exports.getZoomMeetingSignature =
    onCall(

        {
            region: "asia-south1"
        },

        async request => {

            const auth =
                requireAuth(
                    request
                );


            const data =
                request.data ||
                {};


            const meetingNumber =
                clean(
                    data.meetingNumber ||
                    data.meetingId
                );


            if (
                !meetingNumber
            ) {

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

                    auth.token?.name ||

                    "Zenova Student"

                );


            const config =
                await getZoomConfig();


            const clientId =
                config.meetingSdkClientId;

            const clientSecret =
                config.meetingSdkClientSecret;


            const now =
                Math.floor(
                    Date.now() /
                    1000
                );


            const expiration =
                now +
                (
                    60 *
                    60 *
                    2
                );


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

                signature,

                meetingNumber,

                userName:
                    studentName,

                userEmail:
                    auth.token?.email ||
                    ""

            };

        }

    );


/* =========================================================
   SAVE ZOOM DETAILS TO LIVE CLASS
========================================================= */

exports.attachZoomMeetingToLiveClass =
    onCall(

        {
            region: "asia-south1"
        },

        async request => {

            requireAuth(
                request
            );


            const data =
                request.data ||
                {};


            const liveClassId =
                clean(
                    data.liveClassId
                );


            if (
                !liveClassId
            ) {

                throw new HttpsError(
                    "invalid-argument",
                    "Live class ID is required."
                );

            }


            const meeting =
                data.meeting ||
                {};


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


            await ref.update(

                {

                    liveType:
                        "ZOOM",

                    mode:
                        "ZOOM",

                    zoomMeetingId:
                        clean(
                            meeting.meetingId ||
                            meeting.meetingNumber
                        ),

                    zoomMeetingNumber:
                        clean(
                            meeting.meetingNumber ||
                            meeting.meetingId
                        ),

                    zoomPassword:
                        clean(
                            meeting.password
                        ),

                    zoomJoinUrl:
                        clean(
                            meeting.joinUrl
                        ),

                    zoomStartUrl:
                        clean(
                            meeting.startUrl
                        ),

                    zoomCreated:
                        true,

                    zoomCreatedAt:
                        admin.firestore.FieldValue
                            .serverTimestamp()

                }

            );


            return {

                success:
                    true,

                liveClassId

            };

        }

    );

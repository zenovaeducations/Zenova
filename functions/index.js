// ============================================================
// ZENOVA FACULTY LIVE — SECURE ZOOM HOST DATA
// Add below the existing exports in functions/index.js
// ============================================================

const ZOOM_HOST_ALLOWED_EMAILS =
    defineSecret("ZOOM_HOST_ALLOWED_EMAILS");

const ZOOM_HOST_ZOOM_USER_ID =
    defineSecret("ZOOM_HOST_ZOOM_USER_ID");

exports.getZoomHostJoinData = onCall(
    {
        region: "asia-south1",
        secrets: [
            ZOOM_ACCOUNT_ID,
            ZOOM_S2S_CLIENT_ID,
            ZOOM_S2S_CLIENT_SECRET,
            ZOOM_MEETING_SDK_CLIENT_ID,
            ZOOM_MEETING_SDK_CLIENT_SECRET,
            ZOOM_HOST_ALLOWED_EMAILS,
            ZOOM_HOST_ZOOM_USER_ID
        ]
    },
    async (request) => {
        try {
            // 1. Require Firebase Authentication.
            if (!request.auth) {
                throw new HttpsError(
                    "unauthenticated",
                    "Please sign in before starting a live class."
                );
            }

            // 2. Verify faculty email against a server-side allowlist.
            const email = String(
                request.auth.token.email || ""
            ).trim().toLowerCase();

            const allowedEmails = ZOOM_HOST_ALLOWED_EMAILS
                .value()
                .split(",")
                .map(value => value.trim().toLowerCase())
                .filter(Boolean);

            if (!email || !allowedEmails.includes(email)) {
                throw new HttpsError(
                    "permission-denied",
                    "This account is not authorized to host live classes."
                );
            }

            // 3. Validate the requested class.
            const data = request.data || {};
            const liveClassId = String(
                data.liveClassId || ""
            ).trim();

            if (!liveClassId) {
                throw new HttpsError(
                    "invalid-argument",
                    "Live class ID is required."
                );
            }

            const classRef = db
                .collection("liveClasses")
                .doc(liveClassId);

            const classSnapshot = await classRef.get();

            if (!classSnapshot.exists) {
                throw new HttpsError(
                    "not-found",
                    "Scheduled live class was not found."
                );
            }

            const liveClass = classSnapshot.data() || {};

            const meetingNumber = String(
                liveClass.zoomMeetingNumber ||
                liveClass.zoomMeetingId ||
                ""
            ).trim();

            const requestedMeetingNumber = String(
                data.meetingNumber || ""
            ).trim();

            if (
                !meetingNumber ||
                meetingNumber !== requestedMeetingNumber
            ) {
                throw new HttpsError(
                    "failed-precondition",
                    "The Zoom meeting does not match this scheduled class."
                );
            }

            // 4. Obtain a server-to-server Zoom access token.
            const accountId = ZOOM_ACCOUNT_ID.value();
            const clientId = ZOOM_S2S_CLIENT_ID.value();
            const clientSecret = ZOOM_S2S_CLIENT_SECRET.value();

            const basicAuth = Buffer.from(
                `${clientId}:${clientSecret}`
            ).toString("base64");

            const tokenResponse = await fetch(
                "https://zoom.us/oauth/token",
                {
                    method: "POST",
                    headers: {
                        Authorization: `Basic ${basicAuth}`,
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    },
                    body: new URLSearchParams({
                        grant_type: "account_credentials",
                        account_id: accountId
                    })
                }
            );

            const tokenData = await tokenResponse.json();

            if (
                !tokenResponse.ok ||
                !tokenData.access_token
            ) {
                console.error(
                    "Zoom OAuth failed:",
                    tokenResponse.status,
                    tokenData.error || tokenData.message
                );

                throw new HttpsError(
                    "internal",
                    "Could not authenticate with Zoom."
                );
            }

            const accessToken = tokenData.access_token;

            // 5. Retrieve a ZAK for the configured Zoom host user.
            const zoomHostUserId =
                ZOOM_HOST_ZOOM_USER_ID.value().trim();

            if (!zoomHostUserId) {
                throw new HttpsError(
                    "failed-precondition",
                    "The Zoom host account is not configured."
                );
            }

            const zakUrl = new URL(
                `https://api.zoom.us/v2/users/${
                    encodeURIComponent(zoomHostUserId)
                }/token`
            );

            zakUrl.searchParams.set("type", "zak");

            const zakResponse = await fetch(zakUrl, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            const zakData = await zakResponse.json();

            if (!zakResponse.ok || !zakData.token) {
                console.error(
                    "Zoom ZAK request failed:",
                    zakResponse.status,
                    zakData.message || zakData.code
                );

                throw new HttpsError(
                    "internal",
                    "Could not retrieve Zoom host credentials."
                );
            }

            // 6. Generate a Zoom Meeting SDK HOST signature.
            const sdkKey =
                ZOOM_MEETING_SDK_CLIENT_ID.value();

            const sdkSecret =
                ZOOM_MEETING_SDK_CLIENT_SECRET.value();

            const now = Math.floor(Date.now() / 1000);
            const expiration = now + 60 * 60;

            const signature = jwt.sign(
                {
                    appKey: sdkKey,
                    mn: meetingNumber,
                    role: 1,
                    iat: now - 30,
                    exp: expiration,
                    tokenExp: expiration
                },
                sdkSecret,
                {
                    algorithm: "HS256"
                }
            );

            // 7. Return host credentials to the authenticated caller.
            // Never log the signature or ZAK.
            return {
                success: true,
                liveClassId,
                meetingNumber,
                signature,
                zak: zakData.token,
                sdkKey,
                userName:
                    request.auth.token.name ||
                    email
            };

        } catch (error) {
            if (error instanceof HttpsError) {
                throw error;
            }

            console.error(
                "getZoomHostJoinData failed:",
                error.message
            );

            throw new HttpsError(
                "internal",
                "Unable to prepare the Zoom host session."
            );
        }
    }
);

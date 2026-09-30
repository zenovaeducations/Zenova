/* =========================================================
   ZENOVA STUDENT LIVE CLASS
   STUDENT SIDE ONLY
========================================================= */


/* =========================================================
   FIREBASE
========================================================= */

import {
    auth,
    db
} from "../../firebase/firebase-config.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   DOM
========================================================= */

const loader =
    document.getElementById(
        "loader"
    );


const errorState =
    document.getElementById(
        "errorState"
    );


const errorMessage =
    document.getElementById(
        "errorMessage"
    );


const app =
    document.getElementById(
        "app"
    );


const backButton =
    document.getElementById(
        "backButton"
    );


const backFromError =
    document.getElementById(
        "backFromError"
    );


const leaveButton =
    document.getElementById(
        "leaveButton"
    );


const classTitle =
    document.getElementById(
        "classTitle"
    );


const subjectBadge =
    document.getElementById(
        "subjectBadge"
    );


const courseName =
    document.getElementById(
        "courseName"
    );


const subjectName =
    document.getElementById(
        "subjectName"
    );


const chapterName =
    document.getElementById(
        "chapterName"
    );


const teacherName =
    document.getElementById(
        "teacherName"
    );


const teacherInitial =
    document.getElementById(
        "teacherInitial"
    );


const classDescription =
    document.getElementById(
        "classDescription"
    );


const studentName =
    document.getElementById(
        "studentName"
    );


const watermark =
    document.getElementById(
        "watermark"
    );


const playerContainer =
    document.getElementById(
        "playerContainer"
    );


const youtubePlayer =
    document.getElementById(
        "youtubePlayer"
    );


const videoPlayer =
    document.getElementById(
        "videoPlayer"
    );


const externalPlayer =
    document.getElementById(
        "externalPlayer"
    );


const waitingPlayer =
    document.getElementById(
        "waitingPlayer"
    );


const playButton =
    document.getElementById(
        "playButton"
    );


const muteButton =
    document.getElementById(
        "muteButton"
    );


const fullscreenButton =
    document.getElementById(
        "fullscreenButton"
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
   PLAYER STATE
========================================================= */

let youtubeApiLoaded = false;

let youtubePlayerInstance = null;

let currentProvider = null;

let currentLiveClass = null;

let currentStudent = null;


/* =========================================================
   INIT
========================================================= */

if (!liveClassId) {

    showError(
        "Live class information is missing."
    );

}
else {

    onAuthStateChanged(
        auth,
        async user => {

            if (!user) {

                window.location.replace(
                    "../../account/login/"
                );

                return;

            }


            await initialize(
                user
            );

        }
    );

}


/* =========================================================
   INITIALIZE
========================================================= */

async function initialize(
    user
) {

    try {

        const studentRef =
            doc(
                db,
                "zen2Students",
                user.uid
            );


        const studentSnap =
            await getDoc(
                studentRef
            );


        if (!studentSnap.exists()) {

            showError(
                "Student profile was not found."
            );

            return;

        }


        currentStudent =
            studentSnap.data();


        const liveRef =
            doc(
                db,
                "liveClasses",
                liveClassId
            );


        const liveSnap =
            await getDoc(
                liveRef
            );


        if (!liveSnap.exists()) {

            showError(
                "This live class no longer exists."
            );

            return;

        }


        currentLiveClass =
            {
                id: liveSnap.id,
                ...liveSnap.data()
            };


        /*
         * Make sure this is not
         * a deleted/inactive class.
         */

        if (
            currentLiveClass.active === false
        ) {

            showError(
                "This live class is no longer available."
            );

            return;

        }


        /*
         * Check that the class is
         * actually currently live.
         */

        if (
            !isClassLive(
                currentLiveClass
            )
        ) {

            showError(
                getClassStatusMessage(
                    currentLiveClass
                )
            );

            return;

        }


        await loadRelatedData();


        renderStudent();


        renderClass();


        setupWatermark();


        setupButtons();


        await setupLivePlayer();


        loader.classList.add(
            "hidden"
        );


        app.classList.remove(
            "hidden"
        );

    }

    catch (error) {

        console.error(
            "LIVE CLASS ERROR:",
            error
        );


        showError(
            "Unable to open the live class. Please try again."
        );

    }

}


/* =========================================================
   RELATED DATA
========================================================= */

async function loadRelatedData() {

    const live =
        currentLiveClass;


    /*
     * If names already exist
     * in liveClasses, use them.
     */

    let course =
        {
            name:
                live.courseName ||
                "Zenova Batch"
        };


    let subject =
        {
            name:
                live.subjectName ||
                "Live Class"
        };


    let chapter =
        {
            name:
                live.chapterName ||
                ""
        };


    /*
     * Course
     */

    if (live.courseId) {

        try {

            const snap =
                await getDoc(
                    doc(
                        db,
                        "zen2Courses",
                        live.courseId
                    )
                );


            if (snap.exists()) {

                const data =
                    snap.data();


                course.name =
                    data.name ||
                    data.title ||
                    data.courseName ||
                    live.courseName ||
                    course.name;

            }

        }

        catch (error) {

            console.warn(
                "Course load failed:",
                error
            );

        }

    }


    /*
     * Subject
     */

    if (live.subjectId) {

        try {

            const snap =
                await getDoc(
                    doc(
                        db,
                        "zen2Subjects",
                        live.subjectId
                    )
                );


            if (snap.exists()) {

                const data =
                    snap.data();


                subject.name =
                    data.name ||
                    data.title ||
                    data.subjectName ||
                    data.subject ||
                    live.subjectName ||
                    subject.name;

            }

        }

        catch (error) {

            console.warn(
                "Subject load failed:",
                error
            );

        }

    }


    /*
     * Chapter
     */

    if (live.chapterId) {

        try {

            const snap =
                await getDoc(
                    doc(
                        db,
                        "zen2Chapters",
                        live.chapterId
                    )
                );


            if (snap.exists()) {

                const data =
                    snap.data();


                chapter.name =
                    data.name ||
                    data.title ||
                    data.chapterName ||
                    data.chapterTitle ||
                    live.chapterName ||
                    chapter.name;

            }

        }

        catch (error) {

            console.warn(
                "Chapter load failed:",
                error
            );

        }

    }


    currentLiveClass._courseName =
        course.name;


    currentLiveClass._subjectName =
        subject.name;


    currentLiveClass._chapterName =
        chapter.name;

}


/* =========================================================
   RENDER STUDENT
========================================================= */

function renderStudent() {

    const name =
        getStudentName(
            currentStudent
        );


    studentName.textContent =
        name;

}


/* =========================================================
   RENDER CLASS
========================================================= */

function renderClass() {

    const live =
        currentLiveClass;


    classTitle.textContent =
        live.title ||
        "Live Class";


    subjectBadge.textContent =
        live._subjectName ||
        "Live Class";


    courseName.textContent =
        live._courseName ||
        "Zenova Batch";


    subjectName.textContent =
        live._subjectName ||
        "Subject";


    chapterName.textContent =
        live._chapterName ||
        "Live Session";


    const teacher =
        live.teacherName ||
        live.facultyName ||
        live.teacher ||
        "Zenova Faculty";


    teacherName.textContent =
        teacher;


    teacherInitial.textContent =
        getInitial(
            teacher
        );


    if (
        live.description &&
        String(
            live.description
        ).trim()
    ) {

        classDescription.textContent =
            live.description;

        classDescription.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   WATERMARK
========================================================= */

function setupWatermark() {

    const name =
        getStudentName(
            currentStudent
        );


    const phone =
        getStudentPhone(
            currentStudent
        );


    watermark.textContent =
        `${name} • ${maskPhone(phone)}`;

}


/* =========================================================
   LIVE PLAYER
========================================================= */

async function setupLivePlayer() {

    const live =
        currentLiveClass;


    /*
     * Current supported
     * provider order:
     *
     * 1. Zoom
     * 2. YouTube Live
     * 3. HLS / direct external stream
     */


    /*
     * ZOOM
     *
     * The actual Zoom SDK connection
     * should be added here when your
     * secure Zoom backend is connected.
     */

    if (
        live.liveType === "ZOOM" ||
        live.mode === "ZOOM"
    ) {

        currentProvider =
            "ZOOM";


        showWaitingPlayer();


        /*
         * We do NOT put Zoom
         * client secret in this page.
         *
         * A secure backend must create
         * the Zoom SDK signature/token.
         */

        waitingPlayer.querySelector(
            "h3"
        ).textContent =
            "Connecting to Zoom";


        waitingPlayer.querySelector(
            "p"
        ).textContent =
            "The live classroom is being connected.";


        /*
         * Placeholder until Zoom SDK
         * backend is connected.
         */

        return;

    }


    /*
     * YOUTUBE LIVE
     */

    const youtubeUrl =
        live.youtubeLiveUrl ||
        live.youtubeUrl;


    if (youtubeUrl) {

        const videoId =
            getYouTubeId(
                youtubeUrl
            );


        if (videoId) {

            currentProvider =
                "YOUTUBE";


            await loadYouTubePlayer(
                videoId
            );


            return;

        }

    }


    /*
     * EXTERNAL / HLS
     */

    const source =
        live.externalVideoUrl ||
        live.videoUrl ||
        live.liveStreamUrl ||
        live.hlsUrl;


    if (source) {

        currentProvider =
            "VIDEO";


        await setupVideoSource(
            source
        );


        return;

    }


    /*
     * Nothing configured
     */

    showWaitingPlayer();

    waitingPlayer.querySelector(
        "h3"
    ).textContent =
        "Live stream not configured";


    waitingPlayer.querySelector(
        "p"
    ).textContent =
        "Please wait for the live stream to start.";

}


/* =========================================================
   YOUTUBE
========================================================= */

async function loadYouTubePlayer(
    videoId
) {

    hideAllPlayers();


    youtubePlayer.classList.remove(
        "hidden"
    );


    if (
        !window.YT ||
        !window.YT.Player
    ) {

        await loadYouTubeAPI();

    }


    youtubePlayerInstance =
        new YT.Player(
            "youtubePlayer",
            {

                videoId,

                playerVars: {

                    autoplay: 1,

                    controls: 0,

                    rel: 0,

                    modestbranding: 1,

                    playsinline: 1,

                    fs: 0,

                    iv_load_policy: 3,

                    disablekb: 1

                },

                events: {

                    onReady:
                        event => {

                            try {

                                event.target.playVideo();

                            }

                            catch (
                                error
                            ) {

                                console.warn(
                                    error
                                );

                            }

                        },

                    onStateChange:
                        event => {

                            if (
                                event.data ===
                                YT.PlayerState.PLAYING
                            ) {

                                hideWaiting();

                            }

                        }

                }

            }
        );

}


/* =========================================================
   LOAD YOUTUBE API
========================================================= */

function loadYouTubeAPI() {

    return new Promise(
        resolve => {

            if (
                window.YT &&
                window.YT.Player
            ) {

                resolve();

                return;

            }


            const script =
                document.createElement(
                    "script"
                );


            script.src =
                "https://www.youtube.com/iframe_api";


            document.head.appendChild(
                script
            );


            window.onYouTubeIframeAPIReady =
                () => {

                    youtubeApiLoaded =
                        true;

                    resolve();

                };

        }
    );

}


/* =========================================================
   VIDEO / HLS
========================================================= */

async function setupVideoSource(
    source
) {

    hideAllPlayers();


    videoPlayer.classList.remove(
        "hidden"
    );


    /*
     * HLS
     */

    if (
        source
            .toLowerCase()
            .includes(
                ".m3u8"
            )
    ) {

        if (
            videoPlayer.canPlayType(
                "application/vnd.apple.mpegurl"
            )
        ) {

            videoPlayer.src =
                source;

        }
        else {

            await loadHlsJS();


            if (
                window.Hls &&
                Hls.isSupported()
            ) {

                const hls =
                    new Hls();


                hls.loadSource(
                    source
                );


                hls.attachMedia(
                    videoPlayer
                );

            }
            else {

                showToast(
                    "This browser cannot play the live stream."
                );

                return;

            }

        }

    }
    else {

        videoPlayer.src =
            source;

    }


    try {

        await videoPlayer.play();

    }

    catch (error) {

        console.warn(
            "Autoplay blocked:",
            error
        );

    }

}


/* =========================================================
   HLS.JS
========================================================= */

function loadHlsJS() {

    return new Promise(
        resolve => {

            if (
                window.Hls
            ) {

                resolve();

                return;

            }


            const script =
                document.createElement(
                    "script"
                );


            script.src =
                "https://cdn.jsdelivr.net/npm/hls.js@latest";


            script.onload =
                () => resolve();


            script.onerror =
                () => resolve();


            document.head.appendChild(
                script
            );

        }
    );

}


/* =========================================================
   PLAYER BUTTONS
========================================================= */

function setupButtons() {


    playButton.addEventListener(
        "click",
        togglePlay
    );


    muteButton.addEventListener(
        "click",
        toggleMute
    );


    fullscreenButton.addEventListener(
        "click",
        enterFullscreen
    );


    leaveButton.addEventListener(
        "click",
        leaveClass
    );


    backButton.addEventListener(
        "click",
        goBack
    );


    backFromError.addEventListener(
        "click",
        goBack
    );


    videoPlayer.addEventListener(
        "play",
        () => {

            playButton.textContent =
                "Ⅱ";

        }
    );


    videoPlayer.addEventListener(
        "pause",
        () => {

            playButton.textContent =
                "▶";

        }
    );


    videoPlayer.addEventListener(
        "volumechange",
        updateMuteIcon
    );


    /*
     * Prevent context menu
     * on classroom player.
     *
     * This is only UI deterrence.
     * It is NOT security.
     */

    playerContainer.addEventListener(
        "contextmenu",
        event => {

            event.preventDefault();

        }
    );

}


/* =========================================================
   PLAY / PAUSE
========================================================= */

function togglePlay() {

    if (
        currentProvider ===
        "YOUTUBE"
    ) {

        if (
            !youtubePlayerInstance
        ) {

            return;

        }


        const state =
            youtubePlayerInstance.getPlayerState();


        if (
            state ===
            YT.PlayerState.PLAYING
        ) {

            youtubePlayerInstance.pauseVideo();

            playButton.textContent =
                "▶";

        }
        else {

            youtubePlayerInstance.playVideo();

            playButton.textContent =
                "Ⅱ";

        }


        return;

    }


    if (
        currentProvider ===
        "VIDEO"
    ) {

        if (
            videoPlayer.paused
        ) {

            videoPlayer.play();

        }
        else {

            videoPlayer.pause();

        }

    }

}


/* =========================================================
   MUTE
========================================================= */

function toggleMute() {

    if (
        currentProvider ===
        "YOUTUBE"
    ) {

        if (
            !youtubePlayerInstance
        ) {

            return;

        }


        if (
            youtubePlayerInstance.isMuted()
        ) {

            youtubePlayerInstance.unMute();

            muteButton.textContent =
                "🔊";

        }
        else {

            youtubePlayerInstance.mute();

            muteButton.textContent =
                "🔇";

        }


        return;

    }


    if (
        currentProvider ===
        "VIDEO"
    ) {

        videoPlayer.muted =
            !videoPlayer.muted;

        updateMuteIcon();

    }

}


/* =========================================================
   MUTE ICON
========================================================= */

function updateMuteIcon() {

    if (
        videoPlayer.muted
    ) {

        muteButton.textContent =
            "🔇";

    }
    else {

        muteButton.textContent =
            "🔊";

    }

}


/* =========================================================
   FULLSCREEN
========================================================= */

function enterFullscreen() {

    if (
        playerContainer.requestFullscreen
    ) {

        playerContainer.requestFullscreen();

    }
    else if (
        playerContainer.webkitRequestFullscreen
    ) {

        playerContainer.webkitRequestFullscreen();

    }

}


/* =========================================================
   PLAYER VISIBILITY
========================================================= */

function hideAllPlayers() {

    youtubePlayer.classList.add(
        "hidden"
    );


    videoPlayer.classList.add(
        "hidden"
    );


    externalPlayer.classList.add(
        "hidden"
    );


    waitingPlayer.classList.add(
        "hidden"
    );

}


function showWaitingPlayer() {

    hideAllPlayers();


    waitingPlayer.classList.remove(
        "hidden"
    );

}


function hideWaiting() {

    waitingPlayer.classList.add(
        "hidden"
    );

}


/* =========================================================
   CLASS STATUS
========================================================= */

function isClassLive(
    live
) {

    const start =
        getStartDate(
            live
        );


    const end =
        getEndDate(
            live,
            start
        );


    if (
        !start
    ) {

        /*
         * If the admin's old
         * document doesn't contain
         * a complete timestamp,
         * allow the class.
         */

        return true;

    }


    const now =
        new Date();


    return (
        now >= start &&
        (
            !end ||
            now <= end
        )
    );

}


/* =========================================================
   STATUS MESSAGE
========================================================= */

function getClassStatusMessage(
    live
) {

    const start =
        getStartDate(
            live
        );


    const end =
        getEndDate(
            live,
            start
        );


    const now =
        new Date();


    if (
        start &&
        now < start
    ) {

        return (
            `This class has not started yet. ` +
            `Please join at the scheduled time.`
        );

    }


    if (
        end &&
        now > end
    ) {

        return (
            "This live class has already ended. " +
            "Please watch the recording from Live Classes."
        );

    }


    return (
        "This live class is currently unavailable."
    );

}


/* =========================================================
   DATE HELPERS
========================================================= */

function getStartDate(
    live
) {

    if (
        live.startDateTime
    ) {

        const value =
            convertTimestamp(
                live.startDateTime
            );


        if (
            value
        ) {

            return value;

        }

    }


    if (
        live.startTime
    ) {

        const value =
            convertTimestamp(
                live.startTime
            );


        if (
            value
        ) {

            return value;

        }

    }


    if (
        live.scheduledDate &&
        live.scheduledTime
    ) {

        return parseIST(
            live.scheduledDate,
            live.scheduledTime
        );

    }


    return null;

}


function getEndDate(
    live,
    start
) {

    if (
        live.endDateTime
    ) {

        const value =
            convertTimestamp(
                live.endDateTime
            );


        if (
            value
        ) {

            return value;

        }

    }


    if (
        live.endTime
    ) {

        if (
            live.endDate
        ) {

            return parseIST(
                live.endDate,
                live.endTime
            );

        }


        if (
            start
        ) {

            const date =
                new Date(
                    start
                );


            const parts =
                String(
                    live.endTime
                ).split(
                    ":"
                );


            date.setHours(
                Number(
                    parts[0]
                ),
                Number(
                    parts[1]
                ) || 0,
                0,
                0
            );


            return date;

        }

    }


    /*
     * If there is no end time,
     * use 2 hours from start.
     */

    if (
        start
    ) {

        return new Date(
            start.getTime() +
            (
                2 *
                60 *
                60 *
                1000
            )
        );

    }


    return null;

}


/* =========================================================
   FIREBASE TIMESTAMP
========================================================= */

function convertTimestamp(
    value
) {

    if (
        !value
    ) {

        return null;

    }


    if (
        typeof value.toDate ===
        "function"
    ) {

        return value.toDate();

    }


    if (
        value instanceof Date
    ) {

        return value;

    }


    const date =
        new Date(
            value
        );


    if (
        !Number.isNaN(
            date.getTime()
        )
    ) {

        return date;

    }


    return null;

}


/* =========================================================
   INDIA DATE
========================================================= */

function parseIST(
    dateString,
    timeString
) {

    if (
        !dateString ||
        !timeString
    ) {

        return null;

    }


    const value =
        `${dateString}T${timeString}:00+05:30`;


    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return date;

}


/* =========================================================
   YOUTUBE ID
========================================================= */

function getYouTubeId(
    url
) {

    try {

        const parsed =
            new URL(
                url
            );


        const host =
            parsed.hostname
                .replace(
                    "www.",
                    ""
                );


        if (
            host ===
            "youtu.be"
        ) {

            return parsed.pathname
                .replace(
                    "/",
                    ""
                );

        }


        if (
            host ===
            "youtube.com" ||
            host ===
            "m.youtube.com"
        ) {

            if (
                parsed.searchParams.get(
                    "v"
                )
            ) {

                return parsed.searchParams.get(
                    "v"
                );

            }


            const parts =
                parsed.pathname
                    .split(
                        "/"
                    )
                    .filter(
                        Boolean
                    );


            if (
                parts[0] === "live" ||
                parts[0] === "embed" ||
                parts[0] === "shorts"
            ) {

                return parts[1] ||
                    null;

            }

        }

    }

    catch (error) {

        console.warn(
            "Invalid YouTube URL:",
            error
        );

    }


    return null;

}


/* =========================================================
   STUDENT NAME
========================================================= */

function getStudentName(
    student
) {

    return (
        student.name ||
        student.fullName ||
        student.studentName ||
        student.displayName ||
        "Student"
    );

}


/* =========================================================
   STUDENT PHONE
========================================================= */

function getStudentPhone(
    student
) {

    return (
        student.phone ||
        student.phoneNumber ||
        student.mobile ||
        student.mobileNumber ||
        ""
    );

}


/* =========================================================
   MASK PHONE
========================================================= */

function maskPhone(
    phone
) {

    const value =
        String(
            phone || ""
        ).replace(
            /\D/g,
            ""
        );


    if (
        value.length < 4
    ) {

        return "Private";

    }


    return (
        "******" +
        value.slice(-4)
    );

}


/* =========================================================
   INITIAL
========================================================= */

function getInitial(
    value
) {

    return String(
        value || "Z"
    )
        .trim()
        .charAt(0)
        .toUpperCase() || "Z";

}


/* =========================================================
   NAVIGATION
========================================================= */

function goBack() {

    /*
     * Always return to the
     * student's Live Classes page.
     */

    window.location.href =
        "../live/";

}


function leaveClass() {

    window.location.href =
        "../live/";

}


/* =========================================================
   ERROR
========================================================= */

function showError(
    message
) {

    loader.classList.add(
        "hidden"
    );


    app.classList.add(
        "hidden"
    );


    errorMessage.textContent =
        message;


    errorState.classList.remove(
        "hidden"
    );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message
) {

    const toast =
        document.getElementById(
            "toast"
        );


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        3000
    );

}

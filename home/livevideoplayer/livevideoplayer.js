/* =========================================================
   ZENOVA EDUCATIONS
   ACTUAL LIVE VIDEO PLAYER

   This player is ONLY for currently live classes.

   URL:

   /home/livevideoplayer/?liveClassId=XXXXX

   Recorded classes DO NOT come here.
   Recorded classes use:

   /home/videoplayer/?liveClassId=XXXXX
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
   STATE
========================================================= */

let currentUser = null;

let student = null;

let liveClass = null;

let course = null;

let subject = null;

let chapter = null;

let youtubePlayer = null;

let youtubeReady = false;

let youtubeVideoId = null;

let controlsTimer = null;

/* =========================================================
   DOM
========================================================= */

const loading =
    document.getElementById(
        "loading"
    );

const error =
    document.getElementById(
        "error"
    );

const errorText =
    document.getElementById(
        "errorText"
    );

const liveApp =
    document.getElementById(
        "liveApp"
    );

const errorBack =
    document.getElementById(
        "errorBack"
    );

const backButton =
    document.getElementById(
        "backButton"
    );

const player =
    document.getElementById(
        "player"
    );

const stage =
    document.getElementById(
        "stage"
    );

const liveVideo =
    document.getElementById(
        "liveVideo"
    );

const youtubeContainer =
    document.getElementById(
        "youtubeContainer"
    );

const playerLoading =
    document.getElementById(
        "playerLoading"
    );

const centerPlay =
    document.getElementById(
        "centerPlay"
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

const liveTime =
    document.getElementById(
        "liveTime"
    );

const studentName =
    document.getElementById(
        "studentName"
    );

const studentPhone =
    document.getElementById(
        "studentPhone"
    );

const classTime =
    document.getElementById(
        "classTime"
    );

const classTitle =
    document.getElementById(
        "classTitle"
    );

const classHierarchy =
    document.getElementById(
        "classHierarchy"
    );

const facultyAvatar =
    document.getElementById(
        "facultyAvatar"
    );

const facultyName =
    document.getElementById(
        "facultyName"
    );

const descriptionBox =
    document.getElementById(
        "descriptionBox"
    );

const description =
    document.getElementById(
        "description"
    );

const sessionTitle =
    document.getElementById(
        "sessionTitle"
    );

const sessionDate =
    document.getElementById(
        "sessionDate"
    );

const sessionTime =
    document.getElementById(
        "sessionTime"
    );

const toast =
    document.getElementById(
        "toast"
    );

/* =========================================================
   INITIAL
========================================================= */

if (!liveClassId) {

    showError(
        "No live class was selected."
    );

} else {

    onAuthStateChanged(
        auth,
        async (user) => {

            if (!user) {

                window.location.href =
                    "../../account/login/";

                return;
            }

            currentUser =
                user;

            await initialize();

        }
    );
}

/* =========================================================
   INITIALIZE
========================================================= */

async function initialize() {

    try {

        showLoading();

        await loadStudent();

        await loadLiveClass();

        await loadHierarchy();

        renderInformation();

        renderWatermark();

        setupPlayer();

        setupControls();

        setupFullscreen();

        setupMouseControls();

        hideLoading();

    } catch (err) {

        console.error(
            err
        );

        showError(
            err?.message ||
            "Unable to connect to the live class."
        );
    }
}

/* =========================================================
   STUDENT
========================================================= */

async function loadStudent() {

    const ref =
        doc(
            db,
            "zen2Students",
            currentUser.uid
        );

    const snapshot =
        await getDoc(ref);

    if (!snapshot.exists()) {

        throw new Error(
            "Student profile was not found."
        );
    }

    student = {
        id: snapshot.id,
        ...snapshot.data()
    };
}

/* =========================================================
   LIVE CLASS
========================================================= */

async function loadLiveClass() {

    const ref =
        doc(
            db,
            "liveClasses",
            liveClassId
        );

    const snapshot =
        await getDoc(ref);

    if (!snapshot.exists()) {

        throw new Error(
            "Live class was not found."
        );
    }

    liveClass = {
        id: snapshot.id,
        ...snapshot.data()
    };

    if (
        liveClass.active === false
    ) {

        throw new Error(
            "This live class is not active."
        );
    }

    /*
       IMPORTANT:

       If this class is actually a recorded
       video, don't play it in the live player.

       It belongs in /videoplayer/.
    */

    const type =
        String(
            liveClass.liveType ||
            liveClass.mode ||
            ""
        ).toUpperCase();

    if (
        type === "RECORDED" ||
        type === "RECORDED_VIDEO"
    ) {

        throw new Error(
            "This class is a recorded class. Please open it from the recorded videos section."
        );
    }
}

/* =========================================================
   HIERARCHY
========================================================= */

async function loadHierarchy() {

    if (
        liveClass.courseId
    ) {

        course =
            await getDocument(
                "zen2Courses",
                liveClass.courseId
            );
    }

    if (
        liveClass.subjectId
    ) {

        subject =
            await getDocument(
                "zen2Subjects",
                liveClass.subjectId
            );
    }

    if (
        liveClass.chapterId
    ) {

        chapter =
            await getDocument(
                "zen2Chapters",
                liveClass.chapterId
            );
    }
}

/* =========================================================
   GENERIC DOCUMENT
========================================================= */

async function getDocument(
    collectionName,
    id
) {

    if (!id) {
        return null;
    }

    const ref =
        doc(
            db,
            collectionName,
            id
        );

    const snapshot =
        await getDoc(ref);

    if (!snapshot.exists()) {
        return null;
    }

    return {
        id: snapshot.id,
        ...snapshot.data()
    };
}

/* =========================================================
   RENDER INFORMATION
========================================================= */

function renderInformation() {

    const title =
        liveClass.title ||
        liveClass.classTitle ||
        liveClass.liveTitle ||
        liveClass.topic ||
        "Live Class";

    classTitle.textContent =
        title;

    sessionTitle.textContent =
        title;

    const batchName =
        liveClass.courseName ||
        course?.name ||
        course?.title ||
        "Zenova";

    const subjectName =
        liveClass.subjectName ||
        subject?.name ||
        subject?.title ||
        "Subject";

    const chapterName =
        liveClass.chapterName ||
        chapter?.name ||
        chapter?.title ||
        "Chapter";

    classHierarchy.textContent =
        `${batchName} • ${subjectName} • ${chapterName}`;

    const teacher =
        liveClass.teacherName ||
        liveClass.facultyName ||
        liveClass.teacher ||
        liveClass.faculty ||
        "Zenova Faculty";

    facultyName.textContent =
        teacher;

    facultyAvatar.textContent =
        getInitial(
            teacher
        );

    const desc =
        liveClass.description ||
        liveClass.classDescription ||
        "";

    if (
        desc.trim()
    ) {

        descriptionBox.classList.remove(
            "hidden"
        );

        description.textContent =
            desc;

    } else {

        descriptionBox.classList.add(
            "hidden"
        );
    }

    const date =
        liveClass.scheduledDate ||
        liveClass.classDate ||
        liveClass.liveDate ||
        "";

    const start =
        liveClass.scheduledTime ||
        liveClass.startTime ||
        liveClass.classTime ||
        "";

    const end =
        liveClass.endTime ||
        "";

    sessionDate.textContent =
        formatDate(
            date
        );

    sessionTime.textContent =
        formatTimeRange(
            start,
            end
        );

    classTime.textContent =
        formatTimeRange(
            start,
            end
        );
}

/* =========================================================
   WATERMARK
========================================================= */

function renderWatermark() {

    const name =
        student.name ||
        student.studentName ||
        student.fullName ||
        "Zenova Student";

    const phone =
        student.phone ||
        student.phoneNumber ||
        student.mobile ||
        "";

    studentName.textContent =
        name;

    studentPhone.textContent =
        maskPhone(
            phone
        );
}

/* =========================================================
   PLAYER SOURCE
========================================================= */

function setupPlayer() {

    /*
       Actual YouTube Live
    */

    const youtubeSource =
        liveClass.youtubeLiveUrl ||
        liveClass.youtubeUrl ||
        (
            String(
                liveClass.liveType ||
                ""
            ).toUpperCase() ===
            "YOUTUBE"
                ? liveClass.videoUrl
                : null
        );

    const youtubeId =
        extractYouTubeId(
            youtubeSource
        );

    if (youtubeId) {

        setupYouTube(
            youtubeId
        );

        return;
    }

    /*
       Direct live stream / external source
    */

    const external =
        liveClass.externalVideoUrl ||
        (
            String(
                liveClass.liveType ||
                ""
            ).toUpperCase() ===
            "EXTERNAL"
                ? liveClass.videoUrl
                : null
        );

    if (external) {

        setupHTMLLive(
            external
        );

        return;
    }

    /*
       Cloudflare / other HLS URL
       can also be placed in videoUrl.
    */

    if (
        liveClass.videoUrl
    ) {

        setupHTMLLive(
            liveClass.videoUrl
        );

        return;
    }

    throw new Error(
        "No live stream source is configured for this class."
    );
}

/* =========================================================
   YOUTUBE LIVE
========================================================= */

function setupYouTube(
    videoId
) {

    youtubeVideoId =
        videoId;

    youtubeContainer.classList.remove(
        "hidden"
    );

    liveVideo.classList.add(
        "hidden"
    );

    if (
        window.YT &&
        window.YT.Player
    ) {

        createYouTubePlayer();

    } else {

        window.onYouTubeIframeAPIReady =
            createYouTubePlayer;
    }
}

/* =========================================================
   YOUTUBE PLAYER
========================================================= */

function createYouTubePlayer() {

    youtubePlayer =
        new YT.Player(
            youtubeContainer,
            {
                videoId:
                    youtubeVideoId,

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
                        onYouTubeReady,

                    onStateChange:
                        onYouTubeStateChange,

                    onError:
                        onYouTubeError
                }
            }
        );
}

/* =========================================================
   YOUTUBE READY
========================================================= */

function onYouTubeReady() {

    youtubeReady =
        true;

    playerLoading.classList.add(
        "hidden"
    );

    updatePlayButton();

    startLiveClock();

    /*
       Try autoplay.
    */

    try {

        youtubePlayer.playVideo();

    } catch (error) {

        centerPlay.classList.remove(
            "hidden"
        );
    }
}

/* =========================================================
   YOUTUBE STATE
========================================================= */

function onYouTubeStateChange(
    event
) {

    if (
        event.data ===
        YT.PlayerState.PLAYING
    ) {

        playButton.textContent =
            "❚❚";

        centerPlay.classList.add(
            "hidden"
        );

        player.classList.remove(
            "controls-hidden"
        );

        scheduleControlsHide();

    } else {

        playButton.textContent =
            "▶";

        centerPlay.classList.remove(
            "hidden"
        );

        player.classList.remove(
            "controls-hidden"
        );
    }
}

/* =========================================================
   YOUTUBE ERROR
========================================================= */

function onYouTubeError(
    event
) {

    console.error(
        "YouTube live error:",
        event
    );

    showError(
        "The live stream is currently unavailable."
    );
}

/* =========================================================
   HTML LIVE
========================================================= */

function setupHTMLLive(
    url
) {

    liveVideo.classList.remove(
        "hidden"
    );

    youtubeContainer.classList.add(
        "hidden"
    );

    liveVideo.src =
        url;

    /*
       HLS (.m3u8) works natively on
       Safari/iOS. Chrome may require
       hls.js later.

       We keep the player ready for
       direct MP4/WebM/HLS sources.
    */

    liveVideo.addEventListener(
        "loadedmetadata",
        () => {

            playerLoading.classList.add(
                "hidden"
            );

            startLiveClock();

        }
    );

    liveVideo.addEventListener(
        "canplay",
        () => {

            playerLoading.classList.add(
                "hidden"
            );

        }
    );

    liveVideo.addEventListener(
        "playing",
        () => {

            playButton.textContent =
                "❚❚";

            centerPlay.classList.add(
                "hidden"
            );

            startLiveClock();
        }
    );

    liveVideo.addEventListener(
        "pause",
        () => {

            playButton.textContent =
                "▶";

            centerPlay.classList.remove(
                "hidden"
            );
        }
    );

    liveVideo.addEventListener(
        "volumechange",
        updateMuteButton
    );

    liveVideo.addEventListener(
        "error",
        () => {

            showError(
                "The live stream is currently unavailable."
            );
        }
    );

    /*
       Try autoplay.

       Muted autoplay is normally allowed.
    */

    liveVideo.play()
        .catch(
            () => {

                centerPlay.classList.remove(
                    "hidden"
                );

            }
        );
}

/* =========================================================
   CONTROLS
========================================================= */

function setupControls() {

    playButton.addEventListener(
        "click",
        togglePlay
    );

    centerPlay.addEventListener(
        "click",
        togglePlay
    );

    muteButton.addEventListener(
        "click",
        toggleMute
    );

    /*
       There is deliberately NO:

       - progress bar
       - seek
       - back 10
       - forward 10

       because this is an actual LIVE player.
    */
}

/* =========================================================
   PLAY / PAUSE
========================================================= */

function togglePlay() {

    if (
        youtubePlayer &&
        youtubeReady
    ) {

        const state =
            youtubePlayer.getPlayerState();

        if (
            state ===
            YT.PlayerState.PLAYING
        ) {

            youtubePlayer.pauseVideo();

        } else {

            youtubePlayer.playVideo();
        }

        return;
    }

    if (
        liveVideo &&
        liveVideo.src
    ) {

        if (
            liveVideo.paused
        ) {

            liveVideo.play()
                .catch(
                    console.error
                );

        } else {

            liveVideo.pause();
        }
    }
}

/* =========================================================
   MUTE
========================================================= */

function toggleMute() {

    if (
        youtubePlayer &&
        youtubeReady
    ) {

        if (
            youtubePlayer.isMuted()
        ) {

            youtubePlayer.unMute();

        } else {

            youtubePlayer.mute();
        }

        updateMuteButton();

        return;
    }

    if (
        liveVideo &&
        liveVideo.src
    ) {

        liveVideo.muted =
            !liveVideo.muted;

        updateMuteButton();
    }
}

/* =========================================================
   MUTE UI
========================================================= */

function updateMuteButton() {

    if (
        youtubePlayer &&
        youtubeReady
    ) {

        muteButton.textContent =
            youtubePlayer.isMuted()
                ? "🔇"
                : "🔊";

        return;
    }

    muteButton.textContent =
        liveVideo.muted
            ? "🔇"
            : "🔊";
}

/* =========================================================
   FULLSCREEN
========================================================= */

function setupFullscreen() {

    fullscreenButton.addEventListener(
        "click",
        toggleFullscreen
    );
}

async function toggleFullscreen() {

    try {

        if (
            document.fullscreenElement
        ) {

            await document.exitFullscreen();

            return;
        }

        if (
            player.requestFullscreen
        ) {

            await player.requestFullscreen();

        } else if (
            player.webkitRequestFullscreen
        ) {

            player.webkitRequestFullscreen();
        }

    } catch (error) {

        console.warn(
            "Fullscreen failed:",
            error
        );
    }
}

/* =========================================================
   MOUSE / TOUCH
========================================================= */

function setupMouseControls() {

    stage.addEventListener(
        "mousemove",
        showControls
    );

    stage.addEventListener(
        "touchstart",
        showControls,
        {
            passive: true
        }
    );

    stage.addEventListener(
        "mouseleave",
        scheduleControlsHide
    );

    /*
       Clicking video itself:

       For HTML live video → play/pause.

       YouTube iframe handles its own internal
       surface, so custom center button is used.
    */

    stage.addEventListener(
        "click",
        (event) => {

            if (
                event.target.closest(
                    "button"
                )
            ) {
                return;
            }

            if (
                !youtubePlayer &&
                liveVideo &&
                !liveVideo.classList.contains(
                    "hidden"
                )
            ) {

                togglePlay();
            }
        }
    );
}

function showControls() {

    player.classList.remove(
        "controls-hidden"
    );

    scheduleControlsHide();
}

function scheduleControlsHide() {

    clearTimeout(
        controlsTimer
    );

    controlsTimer =
        setTimeout(
            () => {

                if (
                    isPlaying()
                ) {

                    player.classList.add(
                        "controls-hidden"
                    );
                }

            },
            3000
        );
}

function isPlaying() {

    if (
        youtubePlayer &&
        youtubeReady
    ) {

        return (
            youtubePlayer.getPlayerState() ===
            YT.PlayerState.PLAYING
        );
    }

    return (
        liveVideo &&
        !liveVideo.paused
    );
}

/* =========================================================
   LIVE CLOCK
========================================================= */

function startLiveClock() {

    updateLiveClock();

    setInterval(
        updateLiveClock,
        1000
    );
}

function updateLiveClock() {

    liveTime.textContent =
        "LIVE";
}

/* =========================================================
   DATE / TIME
========================================================= */

function formatDate(
    value
) {

    if (!value) {
        return "—";
    }

    try {

        const date =
            new Date(
                `${value}T00:00:00`
            );

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return value;
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

    } catch (error) {

        return value;
    }
}

function formatTimeRange(
    start,
    end
) {

    if (
        start &&
        end
    ) {

        return `${start} – ${end}`;
    }

    if (start) {

        return start;
    }

    return "—";
}

/* =========================================================
   PHONE
========================================================= */

function maskPhone(
    phone
) {

    const digits =
        String(
            phone || ""
        )
            .replace(
                /\D/g,
                ""
            );

    if (
        digits.length < 6
    ) {

        return "XXXXX";
    }

    return (
        digits.slice(
            0,
            2
        ) +
        "XXXXX" +
        digits.slice(
            -2
        )
    );
}

/* =========================================================
   YOUTUBE ID
========================================================= */

function extractYouTubeId(
    value
) {

    if (!value) {
        return null;
    }

    const text =
        String(
            value
        ).trim();

    if (
        /^[a-zA-Z0-9_-]{11}$/.test(
            text
        )
    ) {

        return text;
    }

    try {

        const url =
            new URL(
                text
            );

        if (
            url.hostname.includes(
                "youtu.be"
            )
        ) {

            return url.pathname
                .replace(
                    "/",
                    ""
                )
                .slice(
                    0,
                    11
                );
        }

        if (
            url.hostname.includes(
                "youtube.com"
            )
        ) {

            const id =
                url.searchParams.get(
                    "v"
                );

            if (id) {
                return id;
            }

            const parts =
                url.pathname
                    .split("/")
                    .filter(Boolean);

            const index =
                parts.findIndex(
                    part =>
                        [
                            "live",
                            "embed",
                            "shorts"
                        ].includes(
                            part
                        )
                );

            if (
                index >= 0 &&
                parts[index + 1]
            ) {

                return parts[
                    index + 1
                ].slice(
                    0,
                    11
                );
            }
        }

    } catch (error) {

        console.warn(
            "YouTube URL parsing failed:",
            error
        );
    }

    return null;
}

/* =========================================================
   INITIAL UI
========================================================= */

function showLoading() {

    loading.classList.remove(
        "hidden"
    );

    error.classList.add(
        "hidden"
    );

    liveApp.classList.add(
        "hidden"
    );
}

function hideLoading() {

    loading.classList.add(
        "hidden"
    );

    error.classList.add(
        "hidden"
    );

    liveApp.classList.remove(
        "hidden"
    );
}

function showError(
    message
) {

    loading.classList.add(
        "hidden"
    );

    liveApp.classList.add(
        "hidden"
    );

    error.classList.remove(
        "hidden"
    );

    errorText.textContent =
        message;
}

/* =========================================================
   BACK
========================================================= */

backButton.addEventListener(
    "click",
    goBack
);

errorBack.addEventListener(
    "click",
    goBack
);

function goBack() {

    /*
       Prefer the actual previous page.
    */

    try {

        if (
            document.referrer
        ) {

            const referrer =
                new URL(
                    document.referrer
                );

            if (
                referrer.origin ===
                window.location.origin
            ) {

                window.location.href =
                    document.referrer;

                return;
            }
        }

    } catch (error) {

        console.warn(
            error
        );
    }

    /*
       Browser fallback.
    */

    if (
        window.history.length > 1
    ) {

        window.history.back();

        return;
    }

    window.location.href =
        "../live/";
}

/* =========================================================
   TOAST
========================================================= */

let toastTimer = null;

function showToast(
    message
) {

    toast.textContent =
        message;

    toast.classList.remove(
        "hidden"
    );

    clearTimeout(
        toastTimer
    );

    toastTimer =
        setTimeout(
            () => {

                toast.classList.add(
                    "hidden"
                );

            },
            2500
        );
}

/* =========================================================
   INITIAL PLAY BUTTON
========================================================= */

playButton.textContent =
    "▶";

muteButton.textContent =
    "🔇";

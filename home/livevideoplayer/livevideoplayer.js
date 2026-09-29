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

const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const errorMessage = document.getElementById("errorMessage");
const errorBackButton = document.getElementById("errorBackButton");

const playerApp = document.getElementById("playerApp");

const backButton = document.getElementById("backButton");

const videoShell = document.getElementById("videoShell");
const videoPlayer = document.getElementById("videoPlayer");

const youtubeContainer =
    document.getElementById("youtubeContainer");

const playerOverlay =
    document.getElementById("playerOverlay");

const liveBadge =
    document.getElementById("liveBadge");

const recordedBadge =
    document.getElementById("recordedBadge");

const centerPlayButton =
    document.getElementById("centerPlayButton");

const playPauseButton =
    document.getElementById("playPauseButton");

const progressContainer =
    document.getElementById("progressContainer");

const progressBar =
    document.getElementById("progressBar");

const timeDisplay =
    document.getElementById("timeDisplay");

const goLiveButton =
    document.getElementById("goLiveButton");

const fullscreenButton =
    document.getElementById("fullscreenButton");

const watermark =
    document.getElementById("watermark");

const watermarkName =
    document.getElementById("watermarkName");

const watermarkPhone =
    document.getElementById("watermarkPhone");

const liveLockMessage =
    document.getElementById("liveLockMessage");

const classStatusBadge =
    document.getElementById("classStatusBadge");

const classTimeText =
    document.getElementById("classTimeText");

const classTitle =
    document.getElementById("classTitle");

const courseName =
    document.getElementById("courseName");

const subjectName =
    document.getElementById("subjectName");

const chapterName =
    document.getElementById("chapterName");

const facultyName =
    document.getElementById("facultyName");

const descriptionSection =
    document.getElementById("descriptionSection");

const classDescription =
    document.getElementById("classDescription");


/* =========================================================
   URL
========================================================= */

const params = new URLSearchParams(window.location.search);

const liveClassId =
    params.get("liveClassId") ||
    params.get("id");


/* =========================================================
   STATE
========================================================= */

let currentStudent = null;
let currentLiveClass = null;
let currentContent = null;

let currentCourse = null;
let currentSubject = null;
let currentChapter = null;

let playerMode = "LIVE";

let youtubePlayer = null;
let youtubeApiReady = false;
let youtubeReadyPromise = null;

let liveTicker = null;
let watermarkTicker = null;
let controlsHideTimer = null;

let isDraggingProgress = false;
let suppressTimeGuard = false;

let videoDuration = 0;


/* =========================================================
   INITIALIZATION
========================================================= */

if (!liveClassId) {

    showError(
        "No live class was selected."
    );

} else {

    initialize();
}


/* =========================================================
   AUTH
========================================================= */

function initialize() {

    onAuthStateChanged(auth, async (user) => {

        if (!user) {

            window.location.href =
                "../../account/login/";

            return;
        }

        try {

            await loadLiveClass(user.uid);

        } catch (error) {

            console.error(error);

            showError(
                error.message ||
                "Unable to load this live class."
            );
        }

    });
}


/* =========================================================
   LOAD LIVE CLASS
========================================================= */

async function loadLiveClass(uid) {

    const studentRef =
        doc(db, "zen2Students", uid);

    const liveRef =
        doc(db, "liveClasses", liveClassId);

    const [studentSnap, liveSnap] =
        await Promise.all([
            getDoc(studentRef),
            getDoc(liveRef)
        ]);

    if (!studentSnap.exists()) {

        throw new Error(
            "Student profile was not found."
        );
    }

    if (!liveSnap.exists()) {

        throw new Error(
            "This live class no longer exists."
        );
    }

    currentStudent = {
        id: uid,
        ...studentSnap.data()
    };

    currentLiveClass = {
        id: liveSnap.id,
        ...liveSnap.data()
    };

    await loadRelatedData();

    prepareStudentWatermark();

    prepareClassInformation();

    await preparePlayer();

    startWatermarkMovement();

    hideLoading();

}


/* =========================================================
   RELATED DATA
========================================================= */

async function loadRelatedData() {

    const live = currentLiveClass;

    let courseId =
        live.courseId ||
        live.batchId ||
        live.crmCourseId ||
        null;

    let subjectId =
        live.subjectId ||
        null;

    let chapterId =
        live.chapterId ||
        null;

    let contentId =
        live.contentId ||
        live.videoContentId ||
        live.recordingContentId ||
        null;


    /*
       Load CONTENT first if available.
    */

    if (contentId) {

        const snap =
            await getDoc(
                doc(db, "zen2Content", contentId)
            );

        if (snap.exists()) {

            currentContent = {
                id: snap.id,
                ...snap.data()
            };

            courseId =
                courseId ||
                currentContent.courseId ||
                null;

            subjectId =
                subjectId ||
                currentContent.subjectId ||
                null;

            chapterId =
                chapterId ||
                currentContent.chapterId ||
                null;
        }
    }


    /*
       Course
    */

    if (courseId) {

        const snap =
            await getDoc(
                doc(db, "zen2Courses", courseId)
            );

        if (snap.exists()) {

            currentCourse = {
                id: snap.id,
                ...snap.data()
            };
        }
    }


    /*
       Subject
    */

    if (subjectId) {

        const snap =
            await getDoc(
                doc(db, "zen2Subjects", subjectId)
            );

        if (snap.exists()) {

            currentSubject = {
                id: snap.id,
                ...snap.data()
            };
        }
    }


    /*
       Chapter
    */

    if (chapterId) {

        const snap =
            await getDoc(
                doc(db, "zen2Chapters", chapterId)
            );

        if (snap.exists()) {

            currentChapter = {
                id: snap.id,
                ...snap.data()
            };
        }
    }

}


/* =========================================================
   STUDENT WATERMARK
========================================================= */

function prepareStudentWatermark() {

    const student = currentStudent || {};

    const name =
        student.name ||
        student.fullName ||
        student.studentName ||
        student.displayName ||
        auth.currentUser?.displayName ||
        "Zenova Student";

    const phone =
        student.phone ||
        student.phoneNumber ||
        student.mobile ||
        student.mobileNumber ||
        auth.currentUser?.phoneNumber ||
        "";

    watermarkName.textContent =
        name;

    watermarkPhone.textContent =
        maskPhone(phone);
}


function maskPhone(phone) {

    const clean =
        String(phone || "")
            .replace(/\D/g, "");

    if (!clean) {
        return "XXXXX";
    }

    if (clean.length <= 4) {
        return "XXXXX";
    }

    const lastFive =
        clean.slice(-5);

    return "XXXXX" + lastFive;
}


/* =========================================================
   CLASS INFORMATION
========================================================= */

function prepareClassInformation() {

    const live = currentLiveClass;

    const title =
        live.title ||
        live.classTitle ||
        live.liveTitle ||
        live.topic ||
        currentContent?.title ||
        "Live Class";

    const course =
        currentCourse?.name ||
        currentCourse?.title ||
        currentCourse?.courseName ||
        live.courseName ||
        live.batchName ||
        "Zenova";

    const subject =
        currentSubject?.name ||
        currentSubject?.title ||
        currentSubject?.subjectName ||
        live.subjectName ||
        live.subject ||
        "Subject";

    const chapter =
        currentChapter?.name ||
        currentChapter?.title ||
        currentChapter?.chapterName ||
        live.chapterName ||
        live.chapter ||
        "Chapter";

    const faculty =
        live.facultyName ||
        live.teacherName ||
        live.teacher ||
        live.faculty ||
        "Zenova Faculty";

    classTitle.textContent =
        title;

    courseName.textContent =
        course;

    subjectName.textContent =
        subject;

    chapterName.textContent =
        chapter;

    facultyName.textContent =
        faculty;


    const description =
        live.description ||
        live.classDescription ||
        currentContent?.description ||
        "";

    if (description) {

        classDescription.textContent =
            description;

        descriptionSection.classList.remove(
            "hidden"
        );

    } else {

        descriptionSection.classList.add(
            "hidden"
        );
    }

    classTimeText.textContent =
        formatClassTime(live);

}


/* =========================================================
   PLAYER PREPARATION
========================================================= */

async function preparePlayer() {

    const liveType =
        normalizeLiveType(
            currentLiveClass.liveType ||
            currentLiveClass.mode ||
            currentLiveClass.provider ||
            "RECORDED_VIDEO"
        );


    /*
       Scheduled prerecorded video
    */

    if (
        liveType === "RECORDED_VIDEO" ||
        liveType === "RECORDED_LIVE" ||
        liveType === "VIDEO"
    ) {

        await prepareRecordedLivePlayer();

        return;
    }


    /*
       YouTube
    */

    if (
        liveType === "YOUTUBE" ||
        liveType === "YOUTUBE_LIVE"
    ) {

        await prepareYouTubePlayer();

        return;
    }


    /*
       External URL
    */

    if (
        liveType === "EXTERNAL_URL" ||
        liveType === "EXTERNAL"
    ) {

        await prepareExternalPlayer();

        return;
    }


    /*
       Fallback
    */

    await prepareRecordedLivePlayer();

}


/* =========================================================
   RECORDED VIDEO AS LIVE
========================================================= */

async function prepareRecordedLivePlayer() {

    if (!currentContent) {

        const contentId =
            currentLiveClass.contentId ||
            currentLiveClass.videoContentId ||
            currentLiveClass.recordingContentId;

        if (contentId) {

            const snap =
                await getDoc(
                    doc(db, "zen2Content", contentId)
                );

            if (snap.exists()) {

                currentContent = {
                    id: snap.id,
                    ...snap.data()
                };
            }
        }
    }


    const videoUrl =
        currentLiveClass.videoUrl ||
        currentLiveClass.playbackUrl ||
        currentContent?.videoUrl ||
        currentContent?.playbackUrl ||
        currentContent?.fileUrl ||
        currentContent?.url;


    if (!videoUrl) {

        throw new Error(
            "No video has been attached to this live class."
        );
    }


    playerMode = "LIVE";

    setLiveUI();

    videoPlayer.src =
        videoUrl;

    videoPlayer.load();

    videoPlayer.addEventListener(
        "loadedmetadata",
        handleVideoMetadata,
        {
            once: true
        }
    );

    videoPlayer.addEventListener(
        "timeupdate",
        handleTimeUpdate
    );

    videoPlayer.addEventListener(
        "play",
        updatePlayButton
    );

    videoPlayer.addEventListener(
        "pause",
        updatePlayButton
    );

    videoPlayer.addEventListener(
        "ended",
        handleVideoEnded
    );

    videoPlayer.addEventListener(
        "seeking",
        handleSeeking
    );

    videoPlayer.addEventListener(
        "ratechange",
        preventPlaybackRateChange
    );


    /*
       Clicking center play.
    */

    centerPlayButton.onclick =
        togglePlay;

    playPauseButton.onclick =
        togglePlay;


    /*
       Go LIVE.
    */

    goLiveButton.onclick =
        jumpToLive;


    /*
       Fullscreen.
    */

    fullscreenButton.onclick =
        toggleFullscreen;


    /*
       Progress is disabled while live.
    */

    progressContainer.onclick =
        handleProgressClick;


    /*
       Start server-time synchronization.
    */

    startLiveTicker();

}


/* =========================================================
   VIDEO METADATA
========================================================= */

function handleVideoMetadata() {

    videoDuration =
        videoPlayer.duration || 0;

    updateLivePosition();

}


/* =========================================================
   LIVE TICKER
========================================================= */

function startLiveTicker() {

    stopLiveTicker();

    updateLivePosition();

    liveTicker =
        setInterval(
            updateLivePosition,
            1000
        );
}


function stopLiveTicker() {

    if (liveTicker) {

        clearInterval(liveTicker);

        liveTicker = null;
    }
}


/* =========================================================
   CALCULATE LIVE POSITION
========================================================= */

function updateLivePosition() {

    if (
        playerMode !== "LIVE" ||
        !videoDuration
    ) {
        return;
    }


    const startTime =
        getStartTimestamp(
            currentLiveClass
        );

    if (!startTime) {
        return;
    }


    const now =
        Date.now();

    let position =
        (now - startTime) / 1000;


    /*
       Before class.
    */

    if (position < 0) {

        position = 0;

        updateClassStatus(
            "UPCOMING"
        );

        return;
    }


    /*
       Class finished.
    */

    if (
        position >= videoDuration
    ) {

        switchToRecordedMode();

        return;
    }


    /*
       Keep player around live edge.
    */

    const current =
        videoPlayer.currentTime || 0;


    const difference =
        Math.abs(
            current - position
        );


    /*
       Don't continuously fight the player
       if the difference is tiny.
    */

    if (
        difference > 2 &&
        !isDraggingProgress
    ) {

        suppressTimeGuard = true;

        try {

            videoPlayer.currentTime =
                position;

        } catch (error) {

            console.warn(
                "Unable to sync live position",
                error
            );
        }

        setTimeout(
            () => {
                suppressTimeGuard = false;
            },
            100
        );
    }


    updateProgressUI(
        position
    );

    updateLiveTimeDisplay(
        position
    );
}


/* =========================================================
   SEEKING PROTECTION
========================================================= */

function handleSeeking() {

    if (
        playerMode !== "LIVE" ||
        suppressTimeGuard
    ) {
        return;
    }


    const livePosition =
        getCurrentLivePosition();

    if (
        livePosition === null
    ) {
        return;
    }


    const difference =
        Math.abs(
            videoPlayer.currentTime -
            livePosition
        );


    /*
       Student attempted seek.
    */

    if (
        difference > 2
    ) {

        suppressTimeGuard = true;

        videoPlayer.currentTime =
            Math.max(
                0,
                livePosition
            );

        setTimeout(
            () => {
                suppressTimeGuard = false;
            },
            100
        );
    }
}


/* =========================================================
   CURRENT LIVE POSITION
========================================================= */

function getCurrentLivePosition() {

    const startTime =
        getStartTimestamp(
            currentLiveClass
        );

    if (!startTime) {
        return null;
    }

    const position =
        (Date.now() - startTime) / 1000;

    if (position < 0) {
        return 0;
    }

    if (
        videoDuration &&
        position > videoDuration
    ) {
        return videoDuration;
    }

    return position;
}


/* =========================================================
   PLAY / PAUSE
========================================================= */

function togglePlay() {

    if (
        playerMode === "LIVE" &&
        isClassNotStarted()
    ) {
        return;
    }


    if (videoPlayer.paused) {

        videoPlayer.play()
            .catch(() => {});

    } else {

        videoPlayer.pause();
    }
}


function updatePlayButton() {

    if (videoPlayer.paused) {

        playPauseButton.textContent =
            "▶";

        centerPlayButton.innerHTML =
            "<span>▶</span>";

        centerPlayButton.classList.remove(
            "hidden"
        );

    } else {

        playPauseButton.textContent =
            "Ⅱ";

        centerPlayButton.classList.add(
            "hidden"
        );
    }
}


/* =========================================================
   PROGRESS UI
========================================================= */

function updateProgressUI(seconds) {

    if (!videoDuration) {
        return;
    }

    const percentage =
        Math.min(
            100,
            Math.max(
                0,
                (seconds / videoDuration) * 100
            )
        );

    progressBar.style.width =
        `${percentage}%`;
}


function handleProgressClick(event) {

    if (
        playerMode === "LIVE"
    ) {

        /*
           LIVE mode does not allow seeking.
        */

        jumpToLive();

        return;
    }


    if (!videoDuration) {
        return;
    }


    const rect =
        progressContainer.getBoundingClientRect();

    const ratio =
        (
            event.clientX -
            rect.left
        ) / rect.width;

    videoPlayer.currentTime =
        Math.max(
            0,
            Math.min(
                videoDuration,
                ratio * videoDuration
            )
        );
}


/* =========================================================
   TIME
========================================================= */

function handleTimeUpdate() {

    if (
        playerMode === "RECORDED"
    ) {

        updateProgressUI(
            videoPlayer.currentTime
        );

        timeDisplay.textContent =
            `${formatSeconds(
                videoPlayer.currentTime
            )} / ${formatSeconds(
                videoDuration
            )}`;

        return;
    }


    if (
        playerMode === "LIVE"
    ) {

        const position =
            getCurrentLivePosition();

        if (
            position !== null
        ) {

            updateProgressUI(
                position
            );

            updateLiveTimeDisplay(
                position
            );
        }
    }
}


function updateLiveTimeDisplay(seconds) {

    timeDisplay.textContent =
        `${formatSeconds(seconds)} / ${formatSeconds(videoDuration)}`;
}


/* =========================================================
   JUMP TO LIVE
========================================================= */

function jumpToLive() {

    if (
        playerMode !== "LIVE"
    ) {
        return;
    }

    const position =
        getCurrentLivePosition();

    if (
        position === null
    ) {
        return;
    }

    suppressTimeGuard = true;

    videoPlayer.currentTime =
        position;

    setTimeout(
        () => {
            suppressTimeGuard = false;
        },
        100
    );

    videoPlayer.play()
        .catch(() => {});

}


/* =========================================================
   CLASS STATUS
========================================================= */

function setLiveUI() {

    videoShell.classList.add(
        "live-mode"
    );

    liveBadge.classList.remove(
        "hidden"
    );

    recordedBadge.classList.add(
        "hidden"
    );

    liveLockMessage.classList.remove(
        "hidden"
    );

    goLiveButton.classList.remove(
        "hidden"
    );

    progressContainer.style.cursor =
        "default";

    classStatusBadge.textContent =
        "LIVE NOW";

    classStatusBadge.className =
        "status-badge live";

    updateClassStatus(
        "LIVE"
    );
}


function setRecordedUI() {

    videoShell.classList.remove(
        "live-mode"
    );

    liveBadge.classList.add(
        "hidden"
    );

    recordedBadge.classList.remove(
        "hidden"
    );

    liveLockMessage.classList.add(
        "hidden"
    );

    goLiveButton.classList.add(
        "hidden"
    );

    progressContainer.style.cursor =
        "pointer";

    classStatusBadge.textContent =
        "RECORDED";

    classStatusBadge.className =
        "status-badge recorded";
}


function updateClassStatus(status) {

    if (status === "UPCOMING") {

        classStatusBadge.textContent =
            "UPCOMING";

        classStatusBadge.className =
            "status-badge upcoming";

        return;
    }

    if (status === "LIVE") {

        classStatusBadge.textContent =
            "LIVE NOW";

        classStatusBadge.className =
            "status-badge live";

        return;
    }

    if (status === "RECORDED") {

        classStatusBadge.textContent =
            "RECORDED";

        classStatusBadge.className =
            "status-badge recorded";
    }
}


/* =========================================================
   SWITCH LIVE → RECORDED
========================================================= */

function switchToRecordedMode() {

    if (
        playerMode === "RECORDED"
    ) {
        return;
    }

    playerMode =
        "RECORDED";

    stopLiveTicker();

    setRecordedUI();

    videoPlayer.controls =
        false;

    /*
       We keep our custom controls.
       Recorded mode allows seeking.
    */

    videoPlayer.removeEventListener(
        "seeking",
        handleSeeking
    );

    classStatusBadge.textContent =
        "RECORDED";

    classStatusBadge.className =
        "status-badge recorded";

    updateRecordedControls();

}


/* =========================================================
   RECORDED CONTROLS
========================================================= */

function updateRecordedControls() {

    progressContainer.style.cursor =
        "pointer";

    goLiveButton.classList.add(
        "hidden"
    );

    centerPlayButton.onclick =
        togglePlay;

    playPauseButton.onclick =
        togglePlay;

}


/* =========================================================
   VIDEO END
========================================================= */

function handleVideoEnded() {

    if (
        playerMode === "LIVE"
    ) {

        switchToRecordedMode();

        return;
    }

    updatePlayButton();
}


/* =========================================================
   PLAYBACK RATE
========================================================= */

function preventPlaybackRateChange() {

    /*
       Keep live mode at normal speed.
    */

    if (
        playerMode === "LIVE" &&
        videoPlayer.playbackRate !== 1
    ) {

        videoPlayer.playbackRate =
            1;
    }
}


/* =========================================================
   EXTERNAL VIDEO
========================================================= */

async function prepareExternalPlayer() {

    const url =
        currentLiveClass.videoUrl ||
        currentLiveClass.playbackUrl ||
        currentLiveClass.externalVideoUrl ||
        currentLiveClass.url ||
        currentContent?.videoUrl ||
        currentContent?.fileUrl;

    if (!url) {

        throw new Error(
            "No external video URL was provided."
        );
    }

    playerMode =
        "LIVE";

    setLiveUI();

    videoPlayer.src =
        url;

    videoPlayer.load();

    videoPlayer.addEventListener(
        "loadedmetadata",
        handleVideoMetadata,
        {
            once: true
        }
    );

    videoPlayer.addEventListener(
        "timeupdate",
        handleTimeUpdate
    );

    videoPlayer.addEventListener(
        "play",
        updatePlayButton
    );

    videoPlayer.addEventListener(
        "pause",
        updatePlayButton
    );

    videoPlayer.addEventListener(
        "seeking",
        handleSeeking
    );

    videoPlayer.addEventListener(
        "ended",
        handleVideoEnded
    );

    centerPlayButton.onclick =
        togglePlay;

    playPauseButton.onclick =
        togglePlay;

    goLiveButton.onclick =
        jumpToLive;

    fullscreenButton.onclick =
        toggleFullscreen;

    startLiveTicker();
}


/* =========================================================
   YOUTUBE
========================================================= */

async function prepareYouTubePlayer() {

    const url =
        currentLiveClass.youtubeLiveUrl ||
        currentLiveClass.youtubeUrl ||
        currentLiveClass.videoUrl ||
        currentLiveClass.externalVideoUrl ||
        currentLiveClass.youtubeLiveId ||
        currentLiveClass.youtubeVideoId;

    const videoId =
        extractYouTubeId(
            url
        );

    if (!videoId) {

        throw new Error(
            "Invalid YouTube Live video ID or URL."
        );
    }


    playerMode =
        "LIVE";

    setLiveUI();

    videoPlayer.classList.add(
        "hidden"
    );

    youtubeContainer.classList.remove(
        "hidden"
    );

    await loadYouTubeAPI();

    await createYouTubePlayer(
        videoId
    );

    fullscreenButton.onclick =
        toggleFullscreen;

}


/* =========================================================
   YOUTUBE API
========================================================= */

function loadYouTubeAPI() {

    if (
        youtubeReadyPromise
    ) {
        return youtubeReadyPromise;
    }

    youtubeReadyPromise =
        new Promise((resolve) => {

            if (
                window.YT &&
                window.YT.Player
            ) {

                youtubeApiReady = true;

                resolve();

                return;
            }


            window.onYouTubeIframeAPIReady =
                () => {

                    youtubeApiReady =
                        true;

                    resolve();
                };


            const script =
                document.createElement(
                    "script"
                );

            script.src =
                "https://www.youtube.com/iframe_api";

            document.head.appendChild(
                script
            );

        });

    return youtubeReadyPromise;
}


function createYouTubePlayer(videoId) {

    return new Promise((resolve) => {

        youtubePlayer =
            new YT.Player(
                youtubeContainer,
                {
                    videoId,

                    playerVars: {
                        autoplay: 0,
                        controls: 0,
                        rel: 0,
                        modestbranding: 1,
                        playsinline: 1,
                        fs: 0
                    },

                    events: {

                        onReady: () => {

                            resolve();

                            startYouTubeLiveGuard();
                        },

                        onStateChange:
                            handleYouTubeState

                    }
                }
            );

    });
}


function handleYouTubeState(event) {

    if (
        !youtubePlayer
    ) {
        return;
    }

    /*
       Prevent pause/seek from
       being treated as a free
       recorded player.
    */

    if (
        playerMode === "LIVE"
    ) {

        if (
            event.data ===
            YT.PlayerState.PAUSED
        ) {

            /*
               We allow the player to
               pause, but when resumed
               it jumps back to live.
            */
        }
    }
}


function startYouTubeLiveGuard() {

    if (
        liveTicker
    ) {
        clearInterval(
            liveTicker
        );
    }

    liveTicker =
        setInterval(
            syncYouTubeLive,
            1000
        );
}


function syncYouTubeLive() {

    if (
        playerMode !== "LIVE" ||
        !youtubePlayer
    ) {
        return;
    }

    const startTime =
        getStartTimestamp(
            currentLiveClass
        );

    if (!startTime) {
        return;
    }

    const target =
        Math.max(
            0,
            (Date.now() - startTime) / 1000
        );

    let current = 0;

    try {

        current =
            youtubePlayer.getCurrentTime();

    } catch {
        return;
    }

    if (
        Math.abs(
            current - target
        ) > 3
    ) {

        youtubePlayer.seekTo(
            target,
            true
        );
    }

    updateLiveTimeDisplay(
        target
    );
}


/* =========================================================
   YOUTUBE ID
========================================================= */

function extractYouTubeId(value) {

    if (!value) {
        return null;
    }

    const text =
        String(value).trim();


    /*
       Direct 11 character ID.
    */

    if (
        /^[a-zA-Z0-9_-]{11}$/.test(
            text
        )
    ) {

        return text;
    }


    try {

        const url =
            new URL(text);


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
                .split(
                    "/"
                )[0] || null;
        }


        if (
            url.searchParams.has(
                "v"
            )
        ) {

            return url.searchParams.get(
                "v"
            );
        }


        const parts =
            url.pathname
                .split("/")
                .filter(Boolean);


        const embedIndex =
            parts.indexOf(
                "embed"
            );

        if (
            embedIndex !== -1 &&
            parts[embedIndex + 1]
        ) {

            return parts[
                embedIndex + 1
            ];
        }


        const shortsIndex =
            parts.indexOf(
                "shorts"
            );

        if (
            shortsIndex !== -1 &&
            parts[shortsIndex + 1]
        ) {

            return parts[
                shortsIndex + 1
            ];
        }

    } catch {
        return null;
    }

    return null;
}


/* =========================================================
   FULLSCREEN
========================================================= */

async function toggleFullscreen() {

    try {

        if (
            document.fullscreenElement
        ) {

            await document.exitFullscreen();

            return;
        }


        if (
            videoShell.requestFullscreen
        ) {

            await videoShell.requestFullscreen();

        } else if (
            videoShell.webkitRequestFullscreen
        ) {

            videoShell.webkitRequestFullscreen();
        }

    } catch (error) {

        console.warn(
            "Fullscreen failed",
            error
        );
    }
}


/* =========================================================
   WATERMARK MOVEMENT
========================================================= */

function startWatermarkMovement() {

    stopWatermarkMovement();

    moveWatermark();

    watermarkTicker =
        setInterval(
            moveWatermark,
            12000
        );
}


function stopWatermarkMovement() {

    if (
        watermarkTicker
    ) {

        clearInterval(
            watermarkTicker
        );

        watermarkTicker = null;
    }
}


function moveWatermark() {

    const positions = [

        {
            top: "18%",
            left: "7%"
        },

        {
            top: "18%",
            left: "74%"
        },

        {
            top: "70%",
            left: "7%"
        },

        {
            top: "70%",
            left: "72%"
        },

        {
            top: "44%",
            left: "43%"
        }

    ];

    const position =
        positions[
            Math.floor(
                Math.random() *
                positions.length
            )
        ];

    watermark.style.top =
        position.top;

    watermark.style.left =
        position.left;
}


/* =========================================================
   CLASS START TIME
========================================================= */

function getStartTimestamp(live) {

    if (!live) {
        return null;
    }


    /*
       Timestamp fields.
    */

    const timestampCandidates = [

        live.startAt,

        live.scheduledAt,

        live.scheduledDateTime,

        live.startDateTime,

        live.liveStart

    ];


    for (
        const candidate
        of timestampCandidates
    ) {

        const value =
            parseFirebaseTimestamp(
                candidate
            );

        if (value) {
            return value;
        }
    }


    /*
       Date + time fields.
    */

    const date =
        live.scheduledDate ||
        live.classDate ||
        live.liveDate ||
        live.date ||
        live.startDate;

    const time =
        live.startTime ||
        live.classTime ||
        live.liveTime ||
        live.scheduledTime ||
        live.startClockTime;


    if (
        date &&
        time
    ) {

        const parsed =
            parseDateAndTime(
                date,
                time
            );

        if (parsed) {
            return parsed;
        }
    }


    return null;
}


/* =========================================================
   FIREBASE TIMESTAMP PARSER
========================================================= */

function parseFirebaseTimestamp(value) {

    if (!value) {
        return null;
    }


    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {

        return value.toDate().getTime();
    }


    if (
        typeof value === "object" &&
        typeof value.seconds === "number"
    ) {

        return value.seconds * 1000;
    }


    if (
        typeof value === "number"
    ) {

        /*
           Support milliseconds and seconds.
        */

        if (
            value < 10000000000
        ) {

            return value * 1000;
        }

        return value;
    }


    if (
        typeof value === "string"
    ) {

        const parsed =
            Date.parse(value);

        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }


    return null;
}


/* =========================================================
   DATE + TIME
========================================================= */

function parseDateAndTime(
    dateValue,
    timeValue
) {

    if (!dateValue || !timeValue) {
        return null;
    }


    const dateString =
        String(dateValue)
            .trim();


    const timeString =
        String(timeValue)
            .trim();


    /*
       If date is already ISO.
    */

    const direct =
        Date.parse(
            `${dateString} ${timeString}`
        );


    if (
        !Number.isNaN(
            direct
        )
    ) {

        return direct;
    }


    /*
       Explicit YYYY-MM-DD.
    */

    const match =
        dateString.match(
            /^(\d{4})-(\d{1,2})-(\d{1,2})$/
        );


    if (
        match
    ) {

        const year =
            Number(match[1]);

        const month =
            Number(match[2]) - 1;

        const day =
            Number(match[3]);


        const timeParts =
            parseTime(
                timeString
            );


        if (
            timeParts
        ) {

            const date =
                new Date(
                    year,
                    month,
                    day,
                    timeParts.hours,
                    timeParts.minutes,
                    timeParts.seconds
                );

            return date.getTime();
        }
    }


    return null;
}


function parseTime(value) {

    if (!value) {
        return null;
    }


    const match =
        String(value)
            .trim()
            .match(
                /^(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(AM|PM)?$/i
            );


    if (!match) {
        return null;
    }


    let hours =
        Number(match[1]);

    const minutes =
        Number(match[2] || 0);

    const seconds =
        Number(match[3] || 0);

    const ampm =
        match[4]
            ? match[4].toUpperCase()
            : null;


    if (ampm === "PM" && hours < 12) {
        hours += 12;
    }

    if (ampm === "AM" && hours === 12) {
        hours = 0;
    }


    return {
        hours,
        minutes,
        seconds
    };
}


/* =========================================================
   CLASS TIME DISPLAY
========================================================= */

function formatClassTime(live) {

    const start =
        getStartTimestamp(
            live
        );

    if (!start) {
        return "";
    }


    const end =
        getEndTimestamp(
            live
        );


    const startText =
        new Date(start)
            .toLocaleTimeString(
                [],
                {
                    hour: "numeric",
                    minute: "2-digit"
                }
            );


    if (!end) {
        return startText;
    }


    const endText =
        new Date(end)
            .toLocaleTimeString(
                [],
                {
                    hour: "numeric",
                    minute: "2-digit"
                }
            );


    return `${startText} – ${endText}`;
}


/* =========================================================
   END TIME
========================================================= */

function getEndTimestamp(live) {

    if (!live) {
        return null;
    }


    const candidates = [

        live.endAt,

        live.endedAt,

        live.liveEnd,

        live.scheduledEnd,

        live.endDateTime

    ];


    for (
        const candidate
        of candidates
    ) {

        const value =
            parseFirebaseTimestamp(
                candidate
            );

        if (value) {
            return value;
        }
    }


    const date =
        live.scheduledDate ||
        live.classDate ||
        live.liveDate ||
        live.date ||
        live.startDate;

    const time =
        live.endTime ||
        live.classEndTime ||
        live.liveEndTime ||
        live.scheduledEndTime;


    if (
        date &&
        time
    ) {

        return parseDateAndTime(
            date,
            time
        );
    }


    return null;
}


/* =========================================================
   CLASS NOT STARTED
========================================================= */

function isClassNotStarted() {

    const start =
        getStartTimestamp(
            currentLiveClass
        );

    if (!start) {
        return false;
    }

    return Date.now() < start;
}


/* =========================================================
   NORMALIZE LIVE TYPE
========================================================= */

function normalizeLiveType(value) {

    const type =
        String(
            value || ""
        )
        .trim()
        .toUpperCase()
        .replace(
            /[\s-]+/g,
            "_"
        );


    if (
        type === "RECORDED" ||
        type === "RECORDED_VIDEO" ||
        type === "RECORDED_LIVE" ||
        type === "VIDEO"
    ) {

        return "RECORDED_VIDEO";
    }


    if (
        type === "YOUTUBE" ||
        type === "YOUTUBE_LIVE"
    ) {

        return "YOUTUBE";
    }


    if (
        type === "EXTERNAL" ||
        type === "EXTERNAL_URL"
    ) {

        return "EXTERNAL_URL";
    }


    return "RECORDED_VIDEO";
}


/* =========================================================
   FORMAT SECONDS
========================================================= */

function formatSeconds(seconds) {

    if (
        !Number.isFinite(seconds)
    ) {
        return "00:00";
    }


    seconds =
        Math.max(
            0,
            Math.floor(seconds)
        );


    const hours =
        Math.floor(
            seconds / 3600
        );

    const minutes =
        Math.floor(
            (seconds % 3600) / 60
        );

    const secs =
        seconds % 60;


    if (hours > 0) {

        return [
            String(hours).padStart(2, "0"),
            String(minutes).padStart(2, "0"),
            String(secs).padStart(2, "0")
        ].join(":");
    }


    return [
        String(minutes).padStart(2, "0"),
        String(secs).padStart(2, "0")
    ].join(":");
}


/* =========================================================
   BACK
========================================================= */

backButton.onclick =
    goBack;

errorBackButton.onclick =
    goBack;


function goBack() {

    if (
        document.referrer.includes(
            "/home/live/"
        )
    ) {

        window.location.href =
            "../live/";

        return;
    }


    window.history.back();
}


/* =========================================================
   FULLSCREEN EVENTS
========================================================= */

document.addEventListener(
    "fullscreenchange",
    () => {

        /*
           Nothing required currently.
           Kept for future player UI.
        */

    }
);


/* =========================================================
   CONTROLS VISIBILITY
========================================================= */

videoShell.addEventListener(
    "mousemove",
    showControlsTemporarily
);

videoShell.addEventListener(
    "touchstart",
    showControlsTemporarily,
    {
        passive: true
    }
);


function showControlsTemporarily() {

    videoShell.classList.remove(
        "controls-hidden"
    );

    clearTimeout(
        controlsHideTimer
    );

    controlsHideTimer =
        setTimeout(
            () => {

                if (
                    !videoPlayer.paused
                ) {

                    videoShell.classList.add(
                        "controls-hidden"
                    );
                }

            },
            3000
        );
}


/* =========================================================
   LOADING / ERROR
========================================================= */

function hideLoading() {

    loadingState.classList.add(
        "hidden"
    );

    playerApp.classList.remove(
        "hidden"
    );

    updatePlayButton();
}


function showError(message) {

    loadingState.classList.add(
        "hidden"
    );

    playerApp.classList.add(
        "hidden"
    );

    errorMessage.textContent =
        message ||
        "Something went wrong.";

    errorState.classList.remove(
        "hidden"
    );
}


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        stopLiveTicker();

        stopWatermarkMovement();

        clearTimeout(
            controlsHideTimer
        );

    }
);

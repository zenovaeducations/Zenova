/* =========================================================
   ZENOVA VIDEO PLAYER
   ZEN2
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
   ELEMENTS
========================================================= */

const loader =
    document.getElementById(
        "loader"
    );


const playerApp =
    document.getElementById(
        "playerApp"
    );


const errorScreen =
    document.getElementById(
        "errorScreen"
    );


const errorMessage =
    document.getElementById(
        "errorMessage"
    );


const retryButton =
    document.getElementById(
        "retryButton"
    );


const backButton =
    document.getElementById(
        "backButton"
    );


const videoPlayerWrapper =
    document.getElementById(
        "videoPlayerWrapper"
    );


const videoElement =
    document.getElementById(
        "videoElement"
    );


const youtubeContainer =
    document.getElementById(
        "youtubeContainer"
    );


const youtubePlayerElement =
    document.getElementById(
        "youtubePlayer"
    );


const playerLoading =
    document.getElementById(
        "playerLoading"
    );


const centerPlayButton =
    document.getElementById(
        "centerPlayButton"
    );


const controls =
    document.getElementById(
        "controls"
    );


const playButton =
    document.getElementById(
        "playButton"
    );


const muteButton =
    document.getElementById(
        "muteButton"
    );


const volumeBar =
    document.getElementById(
        "volumeBar"
    );


const progressBar =
    document.getElementById(
        "progressBar"
    );


const currentTimeElement =
    document.getElementById(
        "currentTime"
    );


const durationElement =
    document.getElementById(
        "duration"
    );


const speedButton =
    document.getElementById(
        "speedButton"
    );


const fullscreenButton =
    document.getElementById(
        "fullscreenButton"
    );


const resumeMessage =
    document.getElementById(
        "resumeMessage"
    );


/* =========================================================
   INFORMATION ELEMENTS
========================================================= */

const batchName =
    document.getElementById(
        "batchName"
    );


const subjectName =
    document.getElementById(
        "subjectName"
    );


const chapterName =
    document.getElementById(
        "chapterName"
    );


const videoTitle =
    document.getElementById(
        "videoTitle"
    );


const accessBadge =
    document.getElementById(
        "accessBadge"
    );


const videoTypeBadge =
    document.getElementById(
        "videoTypeBadge"
    );


const infoTitle =
    document.getElementById(
        "infoTitle"
    );


const infoBatch =
    document.getElementById(
        "infoBatch"
    );


const infoSubject =
    document.getElementById(
        "infoSubject"
    );


const infoChapter =
    document.getElementById(
        "infoChapter"
    );


const infoContent =
    document.getElementById(
        "infoContent"
    );


const videoDescription =
    document.getElementById(
        "videoDescription"
    );


/* =========================================================
   URL
========================================================= */

const params =
    new URLSearchParams(
        window.location.search
    );


const contentId =
    params.get(
        "contentId"
    );


/* =========================================================
   STATE
========================================================= */

let currentUser =
    null;


let currentStudent =
    null;


let currentContent =
    null;


let currentCourse =
    null;


let currentSubject =
    null;


let currentChapter =
    null;


let youtubePlayer =
    null;


let isYouTube =
    false;


let youtubeReady =
    false;


let directVideoReady =
    false;


let controlsTimer =
    null;


let saveTimer =
    null;


/* =========================================================
   PLAYBACK SPEEDS
========================================================= */

const playbackSpeeds = [
    1,
    1.25,
    1.5,
    1.75,
    2
];


let speedIndex =
    0;


/* =========================================================
   START
========================================================= */

if (!contentId) {

    showError(
        "No video was selected."
    );

} else {

    waitForAuth();

}


/* =========================================================
   AUTH
========================================================= */

function waitForAuth() {

    onAuthStateChanged(
        auth,
        async user => {

            if (!user) {

                window.location.href =
                    "../../account/login/";

                return;
            }


            currentUser =
                user;


            try {

                await loadVideo();

            } catch (error) {

                console.error(
                    "Zenova Video Player Error:",
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

}


/* =========================================================
   LOAD VIDEO
========================================================= */

async function loadVideo() {

    showLoading();


    /*
     * -------------------------------------------------------
     * STUDENT
     * -------------------------------------------------------
     */

    const studentRef =
        doc(
            db,
            "zen2Students",
            currentUser.uid
        );


    const studentSnapshot =
        await getDoc(
            studentRef
        );


    if (
        studentSnapshot.exists()
    ) {

        currentStudent =
            studentSnapshot.data();

    } else {

        currentStudent =
            null;

    }


    /*
     * -------------------------------------------------------
     * CONTENT
     * -------------------------------------------------------
     */

    const contentRef =
        doc(
            db,
            "zen2Content",
            contentId
        );


    const contentSnapshot =
        await getDoc(
            contentRef
        );


    if (
        !contentSnapshot.exists()
    ) {

        throw new Error(
            "This video does not exist."
        );

    }


    currentContent = {

        id:
            contentSnapshot.id,

        ...contentSnapshot.data()

    };


    /*
     * Must be video.
     */

    if (
        String(
            currentContent.contentType ||
            ""
        ).toUpperCase()
        !==
        "VIDEO"
    ) {

        throw new Error(
            "This content is not a video."
        );

    }


    /*
     * -------------------------------------------------------
     * COURSE
     * -------------------------------------------------------
     */

    if (
        currentContent.courseId
    ) {

        const courseRef =
            doc(
                db,
                "zen2Courses",
                currentContent.courseId
            );


        const courseSnapshot =
            await getDoc(
                courseRef
            );


        if (
            courseSnapshot.exists()
        ) {

            currentCourse = {

                id:
                    courseSnapshot.id,

                ...courseSnapshot.data()

            };

        }

    }


    /*
     * -------------------------------------------------------
     * SUBJECT
     * -------------------------------------------------------
     */

    if (
        currentContent.subjectId
    ) {

        const subjectRef =
            doc(
                db,
                "zen2Subjects",
                currentContent.subjectId
            );


        const subjectSnapshot =
            await getDoc(
                subjectRef
            );


        if (
            subjectSnapshot.exists()
        ) {

            currentSubject = {

                id:
                    subjectSnapshot.id,

                ...subjectSnapshot.data()

            };

        }

    }


    /*
     * -------------------------------------------------------
     * CHAPTER
     * -------------------------------------------------------
     */

    if (
        currentContent.chapterId
    ) {

        const chapterRef =
            doc(
                db,
                "zen2Chapters",
                currentContent.chapterId
            );


        const chapterSnapshot =
            await getDoc(
                chapterRef
            );


        if (
            chapterSnapshot.exists()
        ) {

            currentChapter = {

                id:
                    chapterSnapshot.id,

                ...chapterSnapshot.data()

            };

        }

    }


    /*
     * -------------------------------------------------------
     * DISPLAY
     * -------------------------------------------------------
     */

    renderInformation();


    /*
     * -------------------------------------------------------
     * VIDEO URL
     * -------------------------------------------------------
     */

    const videoUrl =
        String(
            currentContent.videoUrl ||
            ""
        ).trim();


    if (!videoUrl) {

        throw new Error(
            "No video URL has been added to this content."
        );

    }


    /*
     * YouTube?
     */

    const youtubeId =
        extractYouTubeId(
            videoUrl
        );


    if (youtubeId) {

        setupYouTubePlayer(
            youtubeId
        );

    } else {

        setupDirectVideo(
            videoUrl
        );

    }


    /*
     * Show page.
     */

    loader.classList.add(
        "hidden"
    );


    playerApp.classList.remove(
        "hidden"
    );

}


/* =========================================================
   INFORMATION
========================================================= */

function renderInformation() {

    const courseTitle =
        currentCourse?.name ||
        currentCourse?.courseName ||
        currentCourse?.title ||
        "Zenova Batch";


    const subjectTitle =
        currentSubject?.name ||
        currentSubject?.subjectName ||
        currentSubject?.title ||
        "Subject";


    const chapterTitle =
        currentChapter?.title ||
        currentChapter?.chapterName ||
        currentChapter?.name ||
        "Chapter";


    const title =
        currentContent?.title ||
        "Recorded Class";


    batchName.textContent =
        courseTitle;


    subjectName.textContent =
        subjectTitle;


    chapterName.textContent =
        chapterTitle;


    videoTitle.textContent =
        title;


    infoTitle.textContent =
        title;


    infoBatch.textContent =
        courseTitle;


    infoSubject.textContent =
        subjectTitle;


    infoChapter.textContent =
        chapterTitle;


    infoContent.textContent =
        title;


    videoDescription.textContent =
        currentContent?.description ||
        "";


    const access =
        String(
            currentContent?.accessType ||
            (
                currentContent?.isFree
                    ? "FREE"
                    : "PAID"
            )
        ).toUpperCase();


    accessBadge.textContent =
        access === "PAID"
            ? "PAID CONTENT"
            : "FREE CONTENT";


    videoTypeBadge.textContent =
        "RECORDED CLASS";

}


/* =========================================================
   YOUTUBE
========================================================= */

function setupYouTubePlayer(
    youtubeId
) {

    isYouTube =
        true;


    videoElement.classList.add(
        "hidden"
    );


    youtubeContainer.classList.remove(
        "hidden"
    );


    /*
     * YouTube API might not be ready yet.
     */

    if (
        window.YT &&
        window.YT.Player
    ) {

        createYouTubePlayer(
            youtubeId
        );

    } else {

        window.onYouTubeIframeAPIReady =
            () => {

                createYouTubePlayer(
                    youtubeId
                );

            };

    }

}


/* =========================================================
   CREATE YOUTUBE PLAYER
========================================================= */

function createYouTubePlayer(
    youtubeId
) {

    youtubePlayer =
        new YT.Player(
            youtubePlayerElement,
            {

                videoId:
                    youtubeId,

                playerVars: {

                    autoplay: 0,

                    controls: 0,

                    rel: 0,

                    modestbranding: 1,

                    playsinline: 1,

                    fs: 0,

                    iv_load_policy: 3

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

function onYouTubeReady(
    event
) {

    youtubeReady =
        true;


    hidePlayerLoading();


    const saved =
        getSavedPosition();


    if (
        saved > 5 &&
        saved <
            event.target.getDuration() - 5
    ) {

        event.target.seekTo(
            saved,
            true
        );


        showResumeMessage();

    }


    updateYouTubeUI();

}


/* =========================================================
   YOUTUBE STATE
========================================================= */

function onYouTubeStateChange(
    event
) {

    if (
        !youtubePlayer
    ) {

        return;

    }


    if (
        event.data ===
        YT.PlayerState.PLAYING
    ) {

        updatePlayUI(
            true
        );

        hideCenterPlay();


        startYouTubeTimer();


    } else if (
        event.data ===
        YT.PlayerState.PAUSED
    ) {

        updatePlayUI(
            false
        );

        showCenterPlay();


        saveCurrentPosition();


    } else if (
        event.data ===
        YT.PlayerState.ENDED
    ) {

        updatePlayUI(
            false
        );

        showCenterPlay();


        saveCurrentPosition(
            true
        );

    }

}


/* =========================================================
   YOUTUBE TIMER
========================================================= */

let youtubeTimer =
    null;


function startYouTubeTimer() {

    clearInterval(
        youtubeTimer
    );


    youtubeTimer =
        setInterval(
            () => {

                updateYouTubeUI();

            },
            500
        );

}


/* =========================================================
   UPDATE YOUTUBE UI
========================================================= */

function updateYouTubeUI() {

    if (
        !youtubeReady ||
        !youtubePlayer
    ) {

        return;

    }


    const current =
        youtubePlayer.getCurrentTime() ||
        0;


    const duration =
        youtubePlayer.getDuration() ||
        0;


    if (
        duration > 0
    ) {

        progressBar.value =
            (
                current /
                duration
            ) * 100;

    }


    currentTimeElement.textContent =
        formatTime(
            current
        );


    durationElement.textContent =
        formatTime(
            duration
        );

}


/* =========================================================
   DIRECT VIDEO
========================================================= */

function setupDirectVideo(
    url
) {

    isYouTube =
        false;


    youtubeContainer.classList.add(
        "hidden"
    );


    videoElement.classList.remove(
        "hidden"
    );


    videoElement.src =
        url;


    videoElement.load();


    videoElement.addEventListener(
        "loadedmetadata",
        () => {

            directVideoReady =
                true;


            hidePlayerLoading();


            const saved =
                getSavedPosition();


            if (
                saved > 5 &&
                saved <
                    videoElement.duration - 5
            ) {

                videoElement.currentTime =
                    saved;


                showResumeMessage();

            }


            updateDirectVideoUI();

        }
    );


    videoElement.addEventListener(
        "timeupdate",
        updateDirectVideoUI
    );


    videoElement.addEventListener(
        "play",
        () => {

            updatePlayUI(
                true
            );

            hideCenterPlay();

        }
    );


    videoElement.addEventListener(
        "pause",
        () => {

            updatePlayUI(
                false
            );

            showCenterPlay();

            saveCurrentPosition();

        }
    );


    videoElement.addEventListener(
        "ended",
        () => {

            updatePlayUI(
                false
            );

            showCenterPlay();

            saveCurrentPosition(
                true
            );

        }
    );


    videoElement.addEventListener(
        "volumechange",
        updateVolumeUI
    );


    videoElement.addEventListener(
        "error",
        () => {

            showError(
                "This video URL could not be played by the browser."
            );

        }
    );

}


/* =========================================================
   DIRECT VIDEO UI
========================================================= */

function updateDirectVideoUI() {

    if (
        !directVideoReady
    ) {

        return;

    }


    const current =
        videoElement.currentTime ||
        0;


    const duration =
        videoElement.duration ||
        0;


    if (
        duration > 0
    ) {

        progressBar.value =
            (
                current /
                duration
            ) * 100;

    }


    currentTimeElement.textContent =
        formatTime(
            current
        );


    durationElement.textContent =
        formatTime(
            duration
        );

}


/* =========================================================
   PLAY / PAUSE
========================================================= */

function togglePlay() {

    if (
        isYouTube
    ) {

        if (
            !youtubeReady ||
            !youtubePlayer
        ) {

            return;

        }


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
        videoElement.paused
    ) {

        videoElement.play();

    } else {

        videoElement.pause();

    }

}


/* =========================================================
   PLAY BUTTON
========================================================= */

playButton.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        togglePlay();

    }
);


centerPlayButton.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        togglePlay();

    }
);


/* =========================================================
   MUTE
========================================================= */

muteButton.addEventListener(
    "click",
    event => {

        event.stopPropagation();


        if (
            isYouTube
        ) {

            if (
                !youtubePlayer
            ) {

                return;

            }


            if (
                youtubePlayer.isMuted()
            ) {

                youtubePlayer.unMute();

            } else {

                youtubePlayer.mute();

            }


            updateMuteUI();


            return;

        }


        videoElement.muted =
            !videoElement.muted;


        updateMuteUI();

    }
);


/* =========================================================
   VOLUME
========================================================= */

volumeBar.addEventListener(
    "input",
    event => {

        const value =
            Number(
                event.target.value
            );


        if (
            isYouTube
        ) {

            if (
                youtubePlayer
            ) {

                youtubePlayer.unMute();

                youtubePlayer.setVolume(
                    value * 100
                );

            }

        } else {

            videoElement.volume =
                value;

            videoElement.muted =
                value === 0;

        }


        updateMuteUI();

    }
);


/* =========================================================
   UPDATE VOLUME
========================================================= */

function updateVolumeUI() {

    if (
        isYouTube
    ) {

        return;

    }


    volumeBar.value =
        videoElement.volume;


    updateMuteUI();

}


function updateMuteUI() {

    let muted =
        false;


    if (
        isYouTube
    ) {

        muted =
            youtubePlayer
                ? youtubePlayer.isMuted()
                : false;

    } else {

        muted =
            videoElement.muted ||
            videoElement.volume === 0;

    }


    muteButton.textContent =
        muted
            ? "🔇"
            : "🔊";

}


/* =========================================================
   PROGRESS SEEK
========================================================= */

progressBar.addEventListener(
    "input",
    event => {

        const percentage =
            Number(
                event.target.value
            );


        if (
            isYouTube
        ) {

            if (
                !youtubePlayer
            ) {

                return;

            }


            const duration =
                youtubePlayer.getDuration();


            if (
                duration
            ) {

                youtubePlayer.seekTo(
                    (
                        percentage /
                        100
                    ) * duration,
                    true
                );

            }

        } else {

            if (
                videoElement.duration
            ) {

                videoElement.currentTime =
                    (
                        percentage /
                        100
                    ) *
                    videoElement.duration;

            }

        }

    }
);


/* =========================================================
   SPEED
========================================================= */

speedButton.addEventListener(
    "click",
    event => {

        event.stopPropagation();


        speedIndex =
            (
                speedIndex + 1
            ) %
            playbackSpeeds.length;


        const speed =
            playbackSpeeds[
                speedIndex
            ];


        speedButton.textContent =
            `${speed}x`;


        if (
            isYouTube
        ) {

            if (
                youtubePlayer
            ) {

                youtubePlayer.setPlaybackRate(
                    speed
                );

            }

        } else {

            videoElement.playbackRate =
                speed;

        }

    }
);


/* =========================================================
   FULLSCREEN
========================================================= */

fullscreenButton.addEventListener(
    "click",
    event => {

        event.stopPropagation();


        if (
            document.fullscreenElement
        ) {

            document.exitFullscreen();

            return;

        }


        if (
            videoPlayerWrapper.requestFullscreen
        ) {

            videoPlayerWrapper.requestFullscreen();

        }

    }
);


/* =========================================================
   PLAY UI
========================================================= */

function updatePlayUI(
    playing
) {

    playButton.textContent =
        playing
            ? "❚❚"
            : "▶";

}


function hideCenterPlay() {

    centerPlayButton.classList.add(
        "hidden"
    );

}


function showCenterPlay() {

    centerPlayButton.classList.remove(
        "hidden"
    );

}


/* =========================================================
   PLAYER LOADING
========================================================= */

function showLoading() {

    playerLoading.classList.remove(
        "hidden"
    );

}


function hidePlayerLoading() {

    playerLoading.classList.add(
        "hidden"
    );

}


/* =========================================================
   RESUME
========================================================= */

function getStorageKey() {

    return (
        "zenova_video_position_" +
        contentId
    );

}


function getSavedPosition() {

    const value =
        localStorage.getItem(
            getStorageKey()
        );


    const number =
        Number(
            value
        );


    return Number.isFinite(
        number
    )
        ? number
        : 0;

}


/* =========================================================
   SAVE POSITION
========================================================= */

function saveCurrentPosition(
    completed = false
) {

    let position =
        0;


    if (
        isYouTube
    ) {

        if (
            youtubePlayer
        ) {

            position =
                youtubePlayer.getCurrentTime() ||
                0;

        }

    } else {

        position =
            videoElement.currentTime ||
            0;

    }


    if (
        completed
    ) {

        localStorage.removeItem(
            getStorageKey()
        );

        return;

    }


    if (
        position > 5
    ) {

        localStorage.setItem(
            getStorageKey(),
            String(
                Math.floor(
                    position
                )
            )
        );

    }

}


function showResumeMessage() {

    resumeMessage.classList.remove(
        "hidden"
    );


    setTimeout(
        () => {

            resumeMessage.classList.add(
                "hidden"
            );

        },
        4000
    );

}


/* =========================================================
   PERIODIC SAVE
========================================================= */

saveTimer =
    setInterval(
        () => {

            saveCurrentPosition();

        },
        10000
    );


/* =========================================================
   CONTROLS AUTO HIDE
========================================================= */

videoPlayerWrapper.addEventListener(
    "mousemove",
    () => {

        controls.classList.remove(
            "hide"
        );


        clearTimeout(
            controlsTimer
        );


        controlsTimer =
            setTimeout(
                () => {

                    controls.classList.add(
                        "hide"
                    );

                },
                3500
            );

    }
);


/* =========================================================
   BACK
========================================================= */

backButton.addEventListener(
    "click",
    () => {

        /*
         * Go back to chapter details.
         */

        if (
            document.referrer &&
            document.referrer.includes(
                "chapterdetails"
            )
        ) {

            window.history.back();

            return;

        }


        /*
         * Fallback.
         */

        window.location.href =
            "../revision/";

    }
);


/* =========================================================
   RETRY
========================================================= */

retryButton.addEventListener(
    "click",
    () => {

        window.location.reload();

    }
);


/* =========================================================
   YOUTUBE ERROR
========================================================= */

function onYouTubeError(
    event
) {

    console.error(
        "YouTube Player Error:",
        event
    );


    showError(
        "This YouTube video cannot be played here. The video may be private, removed, or embedding may be disabled."
    );

}


/* =========================================================
   YOUTUBE ID
========================================================= */

function extractYouTubeId(
    url
) {

    if (!url) {

        return null;

    }


    const value =
        String(
            url
        ).trim();


    /*
     * Direct 11-character ID.
     */

    if (
        /^[a-zA-Z0-9_-]{11}$/.test(
            value
        )
    ) {

        return value;

    }


    try {

        const parsed =
            new URL(
                value
            );


        const hostname =
            parsed.hostname
                .toLowerCase();


        /*
         * youtu.be/VIDEO_ID
         */

        if (
            hostname ===
                "youtu.be" ||
            hostname.endsWith(
                ".youtu.be"
            )
        ) {

            const id =
                parsed.pathname
                    .split("/")
                    .filter(Boolean)[0];


            if (
                id &&
                /^[a-zA-Z0-9_-]{11}$/.test(
                    id
                )
            ) {

                return id;

            }

        }


        /*
         * youtube.com
         */

        if (
            hostname.includes(
                "youtube.com"
            )
        ) {

            /*
             * ?v=ID
             */

            const queryId =
                parsed.searchParams.get(
                    "v"
                );


            if (
                queryId
            ) {

                return queryId;

            }


            /*
             * /embed/ID
             */

            const embedMatch =
                parsed.pathname.match(
                    /\/embed\/([^/]+)/i
                );


            if (
                embedMatch
            ) {

                return embedMatch[1];

            }


            /*
             * /shorts/ID
             */

            const shortsMatch =
                parsed.pathname.match(
                    /\/shorts\/([^/]+)/i
                );


            if (
                shortsMatch
            ) {

                return shortsMatch[1];

            }


            /*
             * /live/ID
             */

            const liveMatch =
                parsed.pathname.match(
                    /\/live\/([^/]+)/i
                );


            if (
                liveMatch
            ) {

                return liveMatch[1];

            }

        }

    } catch (error) {

        console.warn(
            "Invalid video URL:",
            error
        );

    }


    return null;

}


/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(
    seconds
) {

    if (
        !Number.isFinite(
            seconds
        ) ||
        seconds < 0
    ) {

        return "00:00";

    }


    seconds =
        Math.floor(
            seconds
        );


    const hours =
        Math.floor(
            seconds / 3600
        );


    const minutes =
        Math.floor(
            (
                seconds % 3600
            ) / 60
        );


    const secs =
        seconds % 60;


    if (
        hours > 0
    ) {

        return (
            String(hours)
                .padStart(2, "0") +
            ":" +
            String(minutes)
                .padStart(2, "0") +
            ":" +
            String(secs)
                .padStart(2, "0")
        );

    }


    return (
        String(minutes)
            .padStart(2, "0") +
        ":" +
        String(secs)
            .padStart(2, "0")
    );

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


    playerApp.classList.add(
        "hidden"
    );


    errorMessage.textContent =
        message ||
        "Unable to load the video.";


    errorScreen.classList.remove(
        "hidden"
    );

}


function getErrorMessage(
    error
) {

    if (
        error?.code ===
        "permission-denied"
    ) {

        return (
            "You do not have permission to access this video."
        );

    }


    return (
        error?.message ||
        "Something went wrong while loading the video."
    );

}

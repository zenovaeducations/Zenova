/* =========================================================
   ZENOVA EDUCATIONS
   COMMON VIDEO PLAYER

   Supports:

   ?contentId=XXXXX
       → Revision / normal recorded video

   ?liveClassId=XXXXX
       → Recorded Live Class

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
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

/* =========================================================
   URL
   ========================================================= */

const params = new URLSearchParams(window.location.search);

const contentId = params.get("contentId");
const liveClassId = params.get("liveClassId");

const returnUrl = params.get("returnUrl");

/* =========================================================
   STATE
   ========================================================= */

let currentUser = null;

let currentStudent = null;

let currentItem = null;

let currentCourse = null;

let currentSubject = null;

let currentChapter = null;

let relatedItems = [];

let playerType = null;

let htmlVideo = null;

let youtubePlayer = null;

let youtubeReady = false;

let youtubeVideoId = null;

let controlsTimer = null;

let isDraggingProgress = false;

let isLoadingVideo = true;

/* =========================================================
   DOM
   ========================================================= */

const loadingState =
    document.getElementById("loadingState");

const errorState =
    document.getElementById("errorState");

const errorMessage =
    document.getElementById("errorMessage");

const errorBackButton =
    document.getElementById("errorBackButton");

const playerApp =
    document.getElementById("playerApp");

const backButton =
    document.getElementById("backButton");

const videoPlayer =
    document.getElementById("videoPlayer");

const videoStage =
    document.getElementById("videoStage");

const htmlVideoElement =
    document.getElementById("htmlVideo");

const youtubeContainer =
    document.getElementById("youtubeContainer");

const playerLoading =
    document.getElementById("playerLoading");

const centerPlayButton =
    document.getElementById("centerPlayButton");

const playPauseButton =
    document.getElementById("playPauseButton");

const back10Button =
    document.getElementById("back10Button");

const forward10Button =
    document.getElementById("forward10Button");

const muteButton =
    document.getElementById("muteButton");

const progressBar =
    document.getElementById("progressBar");

const timeDisplay =
    document.getElementById("timeDisplay");

const fullscreenButton =
    document.getElementById("fullscreenButton");

const speedButton =
    document.getElementById("speedButton");

const speedMenu =
    document.getElementById("speedMenu");

const videoTypeBadge =
    document.getElementById("videoTypeBadge");

const videoStatus =
    document.getElementById("videoStatus");

const videoStatusText =
    document.getElementById("videoStatusText");

const liveDateTime =
    document.getElementById("liveDateTime");

const videoTitle =
    document.getElementById("videoTitle");

const videoHierarchy =
    document.getElementById("videoHierarchy");

const facultyAvatar =
    document.getElementById("facultyAvatar");

const facultyName =
    document.getElementById("facultyName");

const descriptionSection =
    document.getElementById("descriptionSection");

const videoDescription =
    document.getElementById("videoDescription");

const relatedVideos =
    document.getElementById("relatedVideos");

const relatedEmpty =
    document.getElementById("relatedEmpty");

const studentWatermark =
    document.getElementById("studentWatermark");

const watermarkName =
    document.getElementById("watermarkName");

const watermarkPhone =
    document.getElementById("watermarkPhone");

const toast =
    document.getElementById("toast");

htmlVideo = htmlVideoElement;

/* =========================================================
   INITIAL CHECK
   ========================================================= */

if (!contentId && !liveClassId) {

    showError(
        "No video was selected. Please open a video from Zenova."
    );

} else {

    onAuthStateChanged(auth, async (user) => {

        if (!user) {

            window.location.href =
                "../../account/login/";

            return;
        }

        currentUser = user;

        await initializePlayer();

    });

}

/* =========================================================
   INITIALIZE
   ========================================================= */

async function initializePlayer() {

    try {

        showLoading();

        await loadStudent();

        if (liveClassId) {

            playerType = "LIVE_RECORDING";

            await loadLiveClass();

        } else {

            playerType = "CONTENT";

            await loadContent();

        }

        await loadRelatedVideos();

        renderInformation();

        setupWatermark();

        setupPlayer();

        hideLoading();

    } catch (error) {

        console.error(
            "Video player error:",
            error
        );

        showError(
            error?.message ||
            "Unable to load this video."
        );
    }
}

/* =========================================================
   LOAD STUDENT
   ========================================================= */

async function loadStudent() {

    const studentRef =
        doc(
            db,
            "zen2Students",
            currentUser.uid
        );

    const snapshot =
        await getDoc(studentRef);

    if (!snapshot.exists()) {

        throw new Error(
            "Student profile was not found."
        );
    }

    currentStudent = {
        id: snapshot.id,
        ...snapshot.data()
    };
}

/* =========================================================
   LOAD NORMAL CONTENT
   ========================================================= */

async function loadContent() {

    const contentRef =
        doc(
            db,
            "zen2Content",
            contentId
        );

    const snapshot =
        await getDoc(contentRef);

    if (!snapshot.exists()) {

        throw new Error(
            "This video could not be found."
        );
    }

    const data = snapshot.data();

    if (
        data.active === false
    ) {

        throw new Error(
            "This video is currently unavailable."
        );
    }

    currentItem = {
        id: snapshot.id,
        ...data
    };

    currentCourse =
        await getCourse(
            currentItem.courseId
        );

    currentSubject =
        await getSubject(
            currentItem.subjectId
        );

    currentChapter =
        await getChapter(
            currentItem.chapterId
        );
}

/* =========================================================
   LOAD LIVE RECORDING
   ========================================================= */

async function loadLiveClass() {

    const liveRef =
        doc(
            db,
            "liveClasses",
            liveClassId
        );

    const snapshot =
        await getDoc(liveRef);

    if (!snapshot.exists()) {

        throw new Error(
            "This live class could not be found."
        );
    }

    const data = snapshot.data();

    if (data.active === false) {

        throw new Error(
            "This live class is currently unavailable."
        );
    }

    currentItem = {
        id: snapshot.id,
        ...data
    };

    /*
       A recorded live class may point to an existing
       zen2Content video using contentId.
    */

    let linkedContent = null;

    if (currentItem.contentId) {

        try {

            const contentRef =
                doc(
                    db,
                    "zen2Content",
                    currentItem.contentId
                );

            const contentSnapshot =
                await getDoc(contentRef);

            if (contentSnapshot.exists()) {

                linkedContent = {
                    id: contentSnapshot.id,
                    ...contentSnapshot.data()
                };
            }

        } catch (error) {

            console.warn(
                "Could not load linked content:",
                error
            );
        }
    }

    /*
       Course
    */

    currentCourse =
        await getCourse(
            currentItem.courseId ||
            linkedContent?.courseId
        );

    /*
       Subject
    */

    currentSubject =
        await getSubject(
            currentItem.subjectId ||
            linkedContent?.subjectId
        );

    /*
       Chapter
    */

    currentChapter =
        await getChapter(
            currentItem.chapterId ||
            linkedContent?.chapterId
        );

    /*
       Keep linked content available as fallback
       for the actual video source.
    */

    currentItem._linkedContent =
        linkedContent;
}

/* =========================================================
   COURSE
   ========================================================= */

async function getCourse(courseId) {

    if (!courseId) {
        return null;
    }

    try {

        const snapshot =
            await getDoc(
                doc(
                    db,
                    "zen2Courses",
                    courseId
                )
            );

        if (!snapshot.exists()) {
            return null;
        }

        return {
            id: snapshot.id,
            ...snapshot.data()
        };

    } catch (error) {

        console.warn(
            "Course loading failed:",
            error
        );

        return null;
    }
}

/* =========================================================
   SUBJECT
   ========================================================= */

async function getSubject(subjectId) {

    if (!subjectId) {
        return null;
    }

    try {

        const snapshot =
            await getDoc(
                doc(
                    db,
                    "zen2Subjects",
                    subjectId
                )
            );

        if (!snapshot.exists()) {
            return null;
        }

        return {
            id: snapshot.id,
            ...snapshot.data()
        };

    } catch (error) {

        console.warn(
            "Subject loading failed:",
            error
        );

        return null;
    }
}

/* =========================================================
   CHAPTER
   ========================================================= */

async function getChapter(chapterId) {

    if (!chapterId) {
        return null;
    }

    try {

        const snapshot =
            await getDoc(
                doc(
                    db,
                    "zen2Chapters",
                    chapterId
                )
            );

        if (!snapshot.exists()) {
            return null;
        }

        return {
            id: snapshot.id,
            ...snapshot.data()
        };

    } catch (error) {

        console.warn(
            "Chapter loading failed:",
            error
        );

        return null;
    }
}

/* =========================================================
   RELATED VIDEOS
   ========================================================= */

async function loadRelatedVideos() {

    relatedItems = [];

    /*
       Revision content
    */

    if (
        currentItem?.chapterId
    ) {

        try {

            const q =
                query(
                    collection(
                        db,
                        "zen2Content"
                    ),
                    where(
                        "chapterId",
                        "==",
                        currentItem.chapterId
                    )
                );

            const snapshot =
                await getDocs(q);

            snapshot.forEach((docSnapshot) => {

                const data =
                    docSnapshot.data();

                if (
                    data.active === false
                ) {
                    return;
                }

                if (
                    String(
                        data.contentType || ""
                    ).toUpperCase() !== "VIDEO"
                ) {
                    return;
                }

                if (
                    docSnapshot.id ===
                    currentItem.id &&
                    playerType === "CONTENT"
                ) {
                    return;
                }

                relatedItems.push({
                    id: docSnapshot.id,
                    sourceType: "CONTENT",
                    ...data
                });

            });

        } catch (error) {

            console.warn(
                "Content related videos failed:",
                error
            );
        }
    }

    /*
       Recorded live classes from same chapter
    */

    if (
        currentItem?.chapterId
    ) {

        try {

            const q =
                query(
                    collection(
                        db,
                        "liveClasses"
                    ),
                    where(
                        "chapterId",
                        "==",
                        currentItem.chapterId
                    )
                );

            const snapshot =
                await getDocs(q);

            snapshot.forEach((docSnapshot) => {

                const data =
                    docSnapshot.data();

                if (
                    data.active === false
                ) {
                    return;
                }

                /*
                   Don't show the currently opened
                   live class.
                */

                if (
                    playerType ===
                        "LIVE_RECORDING" &&
                    docSnapshot.id ===
                        currentItem.id
                ) {
                    return;
                }

                /*
                   Only recorded live classes should
                   appear as videos.
                */

                const hasRecording =
                    Boolean(
                        data.recordingUrl ||
                        data.recordedUrl ||
                        data.replayUrl ||
                        data.videoUrl ||
                        data.externalVideoUrl ||
                        data.youtubeUrl ||
                        data.youtubeLiveUrl ||
                        data.contentId
                    );

                if (!hasRecording) {
                    return;
                }

                relatedItems.push({
                    id: docSnapshot.id,
                    sourceType: "LIVE_RECORDING",
                    ...data
                });

            });

        } catch (error) {

            console.warn(
                "Live related videos failed:",
                error
            );
        }
    }

    /*
       Sort
    */

    relatedItems.sort(
        (a, b) => {

            const aOrder =
                Number(
                    a.order ??
                    a.videoOrder ??
                    a.chapterNumber ??
                    999999
                );

            const bOrder =
                Number(
                    b.order ??
                    b.videoOrder ??
                    b.chapterNumber ??
                    999999
                );

            return aOrder - bOrder;
        }
    );

    renderRelatedVideos();
}

/* =========================================================
   RENDER RELATED
   ========================================================= */

function renderRelatedVideos() {

    relatedVideos.innerHTML = "";

    if (!relatedItems.length) {

        relatedEmpty.classList.remove(
            "hidden"
        );

        return;
    }

    relatedEmpty.classList.add(
        "hidden"
    );

    relatedItems.forEach((item) => {

        const card =
            document.createElement("article");

        card.className =
            "related-card";

        const thumbnail =
            getThumbnail(item);

        const title =
            item.title ||
            item.classTitle ||
            item.liveTitle ||
            item.topic ||
            "Untitled video";

        const subject =
            item.subjectName ||
            currentSubject?.name ||
            currentSubject?.title ||
            "Subject";

        const chapter =
            item.chapterName ||
            currentChapter?.name ||
            currentChapter?.title ||
            "Chapter";

        const type =
            item.sourceType ===
            "LIVE_RECORDING"
                ? "Recorded Live"
                : "Revision";

        const image =
            thumbnail
                ? `<img src="${escapeAttribute(thumbnail)}" alt="">`
                : `<div style="
                    width:100%;
                    height:100%;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    background:#e9e9e9;
                    color:#777;
                    font-weight:600;
                    font-size:12px;
                ">ZENOVA</div>`;

        card.innerHTML = `

            <div class="related-thumbnail">

                ${image}

                <div class="related-play">
                    ▶
                </div>

            </div>

            <div class="related-content">

                <h3>
                    ${escapeHTML(title)}
                </h3>

                <div class="related-meta">
                    ${escapeHTML(subject)}
                    •
                    ${escapeHTML(chapter)}
                </div>

                <div class="related-type">
                    ${escapeHTML(type)}
                </div>

            </div>
        `;

        card.addEventListener(
            "click",
            () => {

                if (
                    item.sourceType ===
                    "LIVE_RECORDING"
                ) {

                    navigateToVideo(
                        "liveClassId",
                        item.id
                    );

                } else {

                    navigateToVideo(
                        "contentId",
                        item.id
                    );
                }
            }
        );

        relatedVideos.appendChild(card);
    });
}

/* =========================================================
   NAVIGATE TO VIDEO
   ========================================================= */

function navigateToVideo(
    idType,
    id
) {

    const url =
        new URL(
            window.location.href
        );

    url.search = "";

    url.searchParams.set(
        idType,
        id
    );

    /*
       Save current page so Back can return
       correctly.
    */

    try {

        sessionStorage.setItem(
            "zenovaVideoReturn",
            window.location.href
        );

    } catch (error) {
        console.warn(error);
    }

    window.location.href =
        url.toString();
}

/* =========================================================
   RENDER INFORMATION
   ========================================================= */

function renderInformation() {

    const title =
        currentItem.title ||
        currentItem.classTitle ||
        currentItem.liveTitle ||
        currentItem.topic ||
        currentItem.name ||
        "Zenova Video";

    videoTitle.textContent =
        title;

    const courseName =
        currentItem.courseName ||
        currentCourse?.name ||
        currentCourse?.title ||
        "Zenova";

    const subjectName =
        currentItem.subjectName ||
        currentSubject?.name ||
        currentSubject?.title ||
        "Subject";

    const chapterName =
        currentItem.chapterName ||
        currentChapter?.name ||
        currentChapter?.title ||
        "Chapter";

    videoHierarchy.textContent =
        `${courseName} • ${subjectName} • ${chapterName}`;

    const faculty =
        currentItem.teacherName ||
        currentItem.facultyName ||
        currentItem.teacher ||
        currentItem.faculty ||
        currentItem.teacher ||
        "Zenova Faculty";

    facultyName.textContent =
        faculty;

    facultyAvatar.textContent =
        getInitial(
            faculty
        );

    const description =
        currentItem.description ||
        currentItem.classDescription ||
        currentItem.about ||
        "";

    if (
        description.trim()
    ) {

        descriptionSection.classList.remove(
            "hidden"
        );

        videoDescription.textContent =
            description;

    } else {

        descriptionSection.classList.add(
            "hidden"
        );
    }

    /*
       Recorded Live UI
    */

    if (
        playerType ===
        "LIVE_RECORDING"
    ) {

        videoStatus.classList.remove(
            "hidden"
        );

        videoTypeBadge.classList.remove(
            "hidden"
        );

        videoTypeBadge.textContent =
            "RECORDED LIVE";

        videoStatusText.textContent =
            "RECORDED LIVE";

        const dateTime =
            formatLiveDateTime(
                currentItem
            );

        if (dateTime) {

            liveDateTime.textContent =
                dateTime;

        } else {

            liveDateTime.textContent =
                "";
        }

    } else {

        videoStatus.classList.add(
            "hidden"
        );

        videoTypeBadge.classList.add(
            "hidden"
        );
    }
}

/* =========================================================
   PLAYER SETUP
   ========================================================= */

function setupPlayer() {

    /*
       Determine video source.
    */

    const source =
        getVideoSource();

    if (!source) {

        showError(
            "No playable video source was found for this class."
        );

        return;
    }

    if (
        source.type ===
        "youtube"
    ) {

        setupYouTube(
            source.videoId
        );

    } else {

        setupHTMLVideo(
            source.url
        );
    }

    setupControls();

    setupFullscreen();

    setupKeyboardControls();

    setupMouseControls();
}

/* =========================================================
   SOURCE
   ========================================================= */

function getVideoSource() {

    let item =
        currentItem;

    /*
       For live recording, a linked content
       video can be the actual source.
    */

    const linked =
        currentItem?._linkedContent;

    const candidates = [

        currentItem?.recordingUrl,

        currentItem?.recordedUrl,

        currentItem?.replayUrl,

        currentItem?.videoUrl,

        currentItem?.externalVideoUrl,

        currentItem?.youtubeUrl,

        currentItem?.youtubeLiveUrl,

        linked?.videoUrl

    ];

    for (
        const candidate
        of candidates
    ) {

        if (!candidate) {
            continue;
        }

        const youtubeId =
            extractYouTubeId(
                candidate
            );

        if (youtubeId) {

            return {
                type: "youtube",
                videoId: youtubeId
            };
        }

        if (
            typeof candidate ===
            "string" &&
            candidate.trim()
        ) {

            return {
                type: "html",
                url: candidate.trim()
            };
        }
    }

    return null;
}

/* =========================================================
   YOUTUBE
   ========================================================= */

function setupYouTube(
    videoId
) {

    playerType = playerType;

    youtubeVideoId =
        videoId;

    htmlVideo.classList.add(
        "hidden"
    );

    youtubeContainer.classList.remove(
        "hidden"
    );

    /*
       If API is already loaded.
    */

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
   CREATE YOUTUBE PLAYER
   ========================================================= */

function createYouTubePlayer() {

    if (!youtubeVideoId) {
        return;
    }

    youtubePlayer =
        new YT.Player(
            youtubeContainer,
            {
                videoId:
                    youtubeVideoId,

                playerVars: {
                    autoplay: 0,
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

    youtubeReady = true;

    playerLoading.classList.add(
        "hidden"
    );

    updatePlayerUI();

    startProgressLoop();
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

        updatePlayButton(
            true
        );

        centerPlayButton.classList.add(
            "hidden"
        );

    } else {

        updatePlayButton(
            false
        );

        centerPlayButton.classList.remove(
            "hidden"
        );
    }

    if (
        event.data ===
        YT.PlayerState.ENDED
    ) {

        handleVideoCompleted();
    }
}

/* =========================================================
   YOUTUBE ERROR
   ========================================================= */

function onYouTubeError(
    event
) {

    console.error(
        "YouTube error:",
        event
    );

    showToast(
        "This video could not be played."
    );
}

/* =========================================================
   HTML VIDEO
   ========================================================= */

function setupHTMLVideo(
    url
) {

    youtubeContainer.classList.add(
        "hidden"
    );

    htmlVideo.classList.remove(
        "hidden"
    );

    htmlVideo.src =
        url;

    htmlVideo.addEventListener(
        "loadedmetadata",
        () => {

            playerLoading.classList.add(
                "hidden"
            );

            updateTimeDisplay();

            restorePlaybackPosition();

        }
    );

    htmlVideo.addEventListener(
        "timeupdate",
        () => {

            if (
                !isDraggingProgress
            ) {

                updateHTMLProgress();

            }

            updateTimeDisplay();

            savePlaybackPosition();
        }
    );

    htmlVideo.addEventListener(
        "play",
        () => {

            updatePlayButton(
                true
            );

            centerPlayButton.classList.add(
                "hidden"
            );
        }
    );

    htmlVideo.addEventListener(
        "pause",
        () => {

            updatePlayButton(
                false
            );

            centerPlayButton.classList.remove(
                "hidden"
            );
        }
    );

    htmlVideo.addEventListener(
        "ended",
        () => {

            updatePlayButton(
                false
            );

            handleVideoCompleted();
        }
    );

    htmlVideo.addEventListener(
        "volumechange",
        updateMuteButton
    );

    htmlVideo.addEventListener(
        "error",
        () => {

            showError(
                "This video source could not be played."
            );
        }
    );
}

/* =========================================================
   CONTROLS
   ========================================================= */

function setupControls() {

    /* Play pause */

    playPauseButton.addEventListener(
        "click",
        togglePlay
    );

    centerPlayButton.addEventListener(
        "click",
        togglePlay
    );

    /* Back */

    back10Button.addEventListener(
        "click",
        () => {

            seekRelative(
                -10
            );
        }
    );

    /* Forward */

    forward10Button.addEventListener(
        "click",
        () => {

            seekRelative(
                10
            );
        }
    );

    /* Mute */

    muteButton.addEventListener(
        "click",
        toggleMute
    );

    /* Progress */

    progressBar.addEventListener(
        "input",
        () => {

            isDraggingProgress = true;

            const percentage =
                Number(
                    progressBar.value
                );

            const duration =
                getDuration();

            if (
                duration > 0
            ) {

                const target =
                    duration *
                    (
                        percentage /
                        100
                    );

                seekTo(
                    target
                );

                updateTimeDisplay();
            }
        }
    );

    progressBar.addEventListener(
        "change",
        () => {

            isDraggingProgress =
                false;
        }
    );

    /* Speed */

    speedButton.addEventListener(
        "click",
        (event) => {

            event.stopPropagation();

            speedMenu.classList.toggle(
                "hidden"
            );
        }
    );

    speedMenu
        .querySelectorAll(
            "button[data-speed]"
        )
        .forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    const speed =
                        Number(
                            button.dataset.speed
                        );

                    setPlaybackSpeed(
                        speed
                    );

                    speedMenu.classList.add(
                        "hidden"
                    );
                }
            );
        });

    document.addEventListener(
        "click",
        (event) => {

            if (
                !speedMenu.contains(
                    event.target
                ) &&
                event.target !==
                    speedButton
            ) {

                speedMenu.classList.add(
                    "hidden"
                );
            }
        }
    );
}

/* =========================================================
   PLAY / PAUSE
   ========================================================= */

function togglePlay() {

    if (
        playerType ===
        "LIVE_RECORDING" ||
        playerType ===
        "CONTENT"
    ) {

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
            htmlVideo &&
            htmlVideo.src
        ) {

            if (
                htmlVideo.paused
            ) {

                htmlVideo.play()
                    .catch(
                        console.error
                    );

            } else {

                htmlVideo.pause();
            }
        }
    }
}

/* =========================================================
   PLAY BUTTON UI
   ========================================================= */

function updatePlayButton(
    playing
) {

    playPauseButton.textContent =
        playing
            ? "❚❚"
            : "▶";

    playPauseButton.setAttribute(
        "aria-label",
        playing
            ? "Pause"
            : "Play"
    );
}

/* =========================================================
   SEEK
   ========================================================= */

function seekRelative(
    seconds
) {

    const current =
        getCurrentTime();

    const duration =
        getDuration();

    if (
        !duration
    ) {
        return;
    }

    let target =
        current +
        seconds;

    target =
        Math.max(
            0,
            Math.min(
                target,
                duration
            )
        );

    seekTo(
        target
    );
}

/* =========================================================
   SEEK TO
   ========================================================= */

function seekTo(
    seconds
) {

    if (
        youtubePlayer &&
        youtubeReady
    ) {

        youtubePlayer.seekTo(
            seconds,
            true
        );

        return;
    }

    if (
        htmlVideo &&
        htmlVideo.src
    ) {

        htmlVideo.currentTime =
            seconds;
    }
}

/* =========================================================
   CURRENT TIME
   ========================================================= */

function getCurrentTime() {

    if (
        youtubePlayer &&
        youtubeReady
    ) {

        return (
            youtubePlayer.getCurrentTime() ||
            0
        );
    }

    if (
        htmlVideo &&
        htmlVideo.src
    ) {

        return (
            htmlVideo.currentTime ||
            0
        );
    }

    return 0;
}

/* =========================================================
   DURATION
   ========================================================= */

function getDuration() {

    if (
        youtubePlayer &&
        youtubeReady
    ) {

        return (
            youtubePlayer.getDuration() ||
            0
        );
    }

    if (
        htmlVideo &&
        htmlVideo.src
    ) {

        return (
            htmlVideo.duration ||
            0
        );
    }

    return 0;
}

/* =========================================================
   PROGRESS
   ========================================================= */

function updateHTMLProgress() {

    const duration =
        htmlVideo.duration;

    if (
        !duration ||
        !Number.isFinite(
            duration
        )
    ) {
        return;
    }

    const percentage =
        (
            htmlVideo.currentTime /
            duration
        ) * 100;

    progressBar.value =
        percentage;
}

/* =========================================================
   PROGRESS LOOP
   ========================================================= */

function startProgressLoop() {

    function loop() {

        if (
            youtubePlayer &&
            youtubeReady &&
            !isDraggingProgress
        ) {

            const duration =
                youtubePlayer.getDuration();

            const current =
                youtubePlayer.getCurrentTime();

            if (
                duration > 0
            ) {

                progressBar.value =
                    (
                        current /
                        duration
                    ) * 100;
            }

            updateTimeDisplay();
        }

        requestAnimationFrame(
            loop
        );
    }

    requestAnimationFrame(
        loop
    );
}

/* =========================================================
   TIME
   ========================================================= */

function updateTimeDisplay() {

    const current =
        getCurrentTime();

    const duration =
        getDuration();

    timeDisplay.textContent =
        `${formatTime(current)} / ${formatTime(duration)}`;
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

        return [
            hours,
            minutes,
            secs
        ]
            .map(
                (
                    value
                ) =>
                    String(
                        value
                    ).padStart(
                        2,
                        "0"
                    )
            )
            .join(":");
    }

    return [
        minutes,
        secs
    ]
        .map(
            (
                value
            ) =>
                String(
                    value
                ).padStart(
                    2,
                    "0"
                )
        )
        .join(":");
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
        htmlVideo &&
        htmlVideo.src
    ) {

        htmlVideo.muted =
            !htmlVideo.muted;

        updateMuteButton();
    }
}

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
        htmlVideo.muted
            ? "🔇"
            : "🔊";
}

/* =========================================================
   SPEED
   ========================================================= */

function setPlaybackSpeed(
    speed
) {

    speedButton.textContent =
        `${speed}x`;

    if (
        youtubePlayer &&
        youtubeReady
    ) {

        youtubePlayer.setPlaybackRate(
            speed
        );

        return;
    }

    if (
        htmlVideo &&
        htmlVideo.src
    ) {

        htmlVideo.playbackRate =
            speed;
    }
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
            videoPlayer.requestFullscreen
        ) {

            await videoPlayer.requestFullscreen();

        } else if (
            videoPlayer.webkitRequestFullscreen
        ) {

            videoPlayer.webkitRequestFullscreen();
        }

    } catch (error) {

        console.warn(
            "Fullscreen failed:",
            error
        );
    }
}

/* =========================================================
   KEYBOARD
   ========================================================= */

function setupKeyboardControls() {

    document.addEventListener(
        "keydown",
        (event) => {

            /*
               Don't hijack typing.
            */

            const tag =
                document.activeElement?.tagName;

            if (
                tag === "INPUT" ||
                tag === "TEXTAREA"
            ) {
                return;
            }

            switch (
                event.key.toLowerCase()
            ) {

                case " ":

                    event.preventDefault();

                    togglePlay();

                    break;

                case "arrowleft":

                    event.preventDefault();

                    seekRelative(
                        -10
                    );

                    break;

                case "arrowright":

                    event.preventDefault();

                    seekRelative(
                        10
                    );

                    break;

                case "m":

                    toggleMute();

                    break;

                case "f":

                    toggleFullscreen();

                    break;
            }

        }
    );
}

/* =========================================================
   PLAYER MOUSE / TOUCH
   ========================================================= */

function setupMouseControls() {

    videoStage.addEventListener(
        "mousemove",
        () => {

            showControls();
        }
    );

    videoStage.addEventListener(
        "touchstart",
        () => {

            showControls();
        },
        {
            passive: true
        }
    );

    videoStage.addEventListener(
        "mouseleave",
        () => {

            scheduleHideControls();
        }
    );

    videoStage.addEventListener(
        "click",
        (event) => {

            /*
               Don't toggle play when clicking
               buttons or controls.
            */

            if (
                event.target.closest(
                    "button"
                ) ||
                event.target.closest(
                    "input"
                )
            ) {
                return;
            }

            /*
               Clicking video itself toggles play
               for HTML video.

               For YouTube, this is intentionally
               disabled because iframe interaction
               can conflict with the custom controls.
            */

            if (
                htmlVideo &&
                !htmlVideo.classList.contains(
                    "hidden"
                )
            ) {

                togglePlay();
            }

        }
    );
}

function showControls() {

    videoPlayer.classList.remove(
        "controls-hidden"
    );

    clearTimeout(
        controlsTimer
    );

    scheduleHideControls();
}

function scheduleHideControls() {

    clearTimeout(
        controlsTimer
    );

    controlsTimer =
        setTimeout(
            () => {

                /*
                   Don't hide while paused.
                */

                if (
                    isVideoPlaying()
                ) {

                    videoPlayer.classList.add(
                        "controls-hidden"
                    );
                }

            },
            3000
        );
}

function isVideoPlaying() {

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
        htmlVideo &&
        !htmlVideo.paused
    );
}

/* =========================================================
   PLAYBACK POSITION
   ========================================================= */

function getStorageKey() {

    return (
        "zenova_video_progress_" +
        (
            currentItem?.id ||
            "unknown"
        )
    );
}

function savePlaybackPosition() {

    if (
        !htmlVideo ||
        !htmlVideo.src ||
        !currentItem
    ) {
        return;
    }

    try {

        localStorage.setItem(
            getStorageKey(),
            String(
                htmlVideo.currentTime
            )
        );

    } catch (error) {
        console.warn(error);
    }
}

function restorePlaybackPosition() {

    if (
        !htmlVideo ||
        !currentItem
    ) {
        return;
    }

    try {

        const saved =
            localStorage.getItem(
                getStorageKey()
            );

        if (!saved) {
            return;
        }

        const position =
            Number(saved);

        if (
            position > 5 &&
            position <
                htmlVideo.duration - 5
        ) {

            htmlVideo.currentTime =
                position;

            showToast(
                "Resumed from where you stopped."
            );
        }

    } catch (error) {
        console.warn(error);
    }
}

/* =========================================================
   VIDEO COMPLETED
   ========================================================= */

function handleVideoCompleted() {

    /*
       FUTURE FEATURE:

       This is where we will later open
       the question system.

       Example future flow:

       Video completed
             ↓
       Questions
             ↓
       Student answers
             ↓
       Correct?
          /       \
        YES        NO
         ↓         ↓
       Next      Retry
       video
    */

    showToast(
        "Video completed."
    );
}

/* =========================================================
   WATERMARK
   ========================================================= */

function setupWatermark() {

    const name =
        currentStudent?.name ||
        currentStudent?.studentName ||
        currentStudent?.fullName ||
        "Zenova Student";

    const phone =
        currentStudent?.phone ||
        currentStudent?.phoneNumber ||
        currentStudent?.mobile ||
        "";

    watermarkName.textContent =
        name;

    watermarkPhone.textContent =
        maskPhone(
            phone
        );

    studentWatermark.classList.remove(
        "hidden"
    );
}

/* =========================================================
   MASK PHONE
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
   THUMBNAIL
   ========================================================= */

function getThumbnail(
    item
) {

    if (
        item.thumbnailUrl
    ) {

        return item.thumbnailUrl;
    }

    if (
        item.thumbnail
    ) {

        return item.thumbnail;
    }

    const candidates = [

        item.videoUrl,

        item.youtubeUrl,

        item.youtubeLiveUrl,

        item.recordingUrl,

        item.recordedUrl,

        item.replayUrl,

        item.externalVideoUrl

    ];

    for (
        const candidate
        of candidates
    ) {

        const youtubeId =
            extractYouTubeId(
                candidate
            );

        if (youtubeId) {

            return (
                "https://img.youtube.com/vi/" +
                youtubeId +
                "/hqdefault.jpg"
            );
        }
    }

    return "";
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
        String(value).trim();

    /*
       Already an ID
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

            return (
                url.pathname
                    .replace(
                        "/",
                        ""
                    )
                    .slice(
                        0,
                        11
                    )
            );
        }

        if (
            url.hostname.includes(
                "youtube.com"
            )
        ) {

            const watchId =
                url.searchParams.get(
                    "v"
                );

            if (watchId) {
                return watchId;
            }

            const parts =
                url.pathname
                    .split("/")
                    .filter(Boolean);

            const index =
                parts.findIndex(
                    (part) =>
                        [
                            "embed",
                            "shorts",
                            "live"
                        ].includes(
                            part
                        )
                );

            if (
                index >= 0 &&
                parts[index + 1]
            ) {

                return (
                    parts[index + 1]
                        .slice(
                            0,
                            11
                        )
                );
            }
        }

    } catch (error) {

        /*
           Ignore malformed URL.
        */
    }

    return null;
}

/* =========================================================
   LIVE DATE / TIME
   ========================================================= */

function formatLiveDateTime(
    item
) {

    const date =
        item.scheduledDate ||
        item.classDate ||
        item.liveDate ||
        item.startDate ||
        "";

    const start =
        item.scheduledTime ||
        item.startTime ||
        item.classTime ||
        item.startClockTime ||
        "";

    const end =
        item.endTime ||
        "";

    if (
        !date
    ) {

        return "";
    }

    let dateText =
        date;

    try {

        const parsed =
            new Date(
                `${date}T${start || "00:00"}`
            );

        if (
            !Number.isNaN(
                parsed.getTime()
            )
        ) {

            dateText =
                parsed.toLocaleDateString(
                    "en-IN",
                    {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                    }
                );
        }

    } catch (error) {
        console.warn(error);
    }

    if (
        start &&
        end
    ) {

        return (
            `${dateText} • ${start} – ${end}`
        );
    }

    if (start) {

        return (
            `${dateText} • ${start}`
        );
    }

    return dateText;
}

/* =========================================================
   ERROR / LOADING
   ========================================================= */

function showLoading() {

    loadingState.classList.remove(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

    playerApp.classList.add(
        "hidden"
    );
}

function hideLoading() {

    loadingState.classList.add(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

    playerApp.classList.remove(
        "hidden"
    );
}

function showError(
    message
) {

    loadingState.classList.add(
        "hidden"
    );

    playerApp.classList.add(
        "hidden"
    );

    errorState.classList.remove(
        "hidden"
    );

    errorMessage.textContent =
        message;
}

/* =========================================================
   BACK
   ========================================================= */

backButton.addEventListener(
    "click",
    goBack
);

errorBackButton.addEventListener(
    "click",
    goBack
);

function goBack() {

    /*
       1. Explicit returnUrl
    */

    if (returnUrl) {

        try {

            window.location.href =
                decodeURIComponent(
                    returnUrl
                );

            return;

        } catch (error) {
            console.warn(error);
        }
    }

    /*
       2. Stored Zenova return URL
    */

    try {

        const stored =
            sessionStorage.getItem(
                "zenovaVideoReturn"
            );

        if (stored) {

            sessionStorage.removeItem(
                "zenovaVideoReturn"
            );

            window.location.href =
                stored;

            return;
        }

    } catch (error) {
        console.warn(error);
    }

    /*
       3. Same-origin browser referrer
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
        console.warn(error);
    }

    /*
       4. Browser history
    */

    if (
        window.history.length > 1
    ) {

        window.history.back();

        return;
    }

    /*
       5. Final fallback
    */

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
   INITIAL PLAYER UI
   ========================================================= */

function updatePlayerUI() {

    updatePlayButton(
        false
    );

    updateMuteButton();

    updateTimeDisplay();
}

/* =========================================================
   HELPERS
   ========================================================= */

function getInitial(
    name
) {

    return String(
        name || "Z"
    )
        .trim()
        .charAt(0)
        .toUpperCase() || "Z";
}

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

function escapeAttribute(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

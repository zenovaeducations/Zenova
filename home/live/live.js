/* ============================================================
   ZENOVA LIVE
============================================================ */

:root {

    --black: #111111;
    --dark: #181818;

    --text: #171717;
    --muted: #777777;
    --light-muted: #9a9a9a;

    --border: #e8e8e8;

    --background: #f7f7f8;
    --white: #ffffff;

    --purple: #6c4df6;
    --purple-dark: #5940d8;
    --purple-light: #f0edff;

    --green: #20a464;
    --green-light: #eaf8f0;

    --red: #e53935;
    --red-light: #fff0f0;

    --orange: #f39b27;
    --orange-light: #fff6e8;

    --shadow:
        0 8px 30px rgba(0, 0, 0, 0.05);

}


* {

    box-sizing: border-box;

    margin: 0;

    padding: 0;

}


html {

    scroll-behavior: smooth;

}


body {

    font-family:
        "Poppins",
        sans-serif;

    background:
        var(--background);

    color:
        var(--text);

    min-height: 100vh;

    padding-bottom: 90px;

}


button {

    font-family:
        inherit;

}


.hidden {

    display: none !important;

}



/* ============================================================
   PAGE
============================================================ */

.page {

    width: 100%;

    max-width: 1180px;

    margin: 0 auto;

}



/* ============================================================
   TOP BAR
============================================================ */

.topbar {

    height: 76px;

    background:
        rgba(247, 247, 248, 0.94);

    backdrop-filter:
        blur(15px);

    display: flex;

    align-items: center;

    gap: 15px;

    padding:
        0 24px;

    position: sticky;

    top: 0;

    z-index: 50;

    border-bottom:
        1px solid rgba(0, 0, 0, 0.04);

}


.back-button {

    width: 42px;

    height: 42px;

    border-radius: 13px;

    border:
        1px solid var(--border);

    background:
        var(--white);

    font-size: 23px;

    cursor: pointer;

    display: flex;

    align-items: center;

    justify-content: center;

    transition:
        0.2s ease;

}


.back-button:hover {

    transform:
        translateX(-2px);

}


.topbar-title {

    flex: 1;

}


.topbar-eyebrow {

    display: block;

    font-size: 9px;

    font-weight: 700;

    letter-spacing: 1.7px;

    color:
        var(--purple);

}


.topbar-title h1 {

    font-size: 19px;

    font-weight: 700;

    line-height: 1.25;

}


.live-dot-wrap {

    display: flex;

    align-items: center;

    gap: 7px;

    font-size: 10px;

    font-weight: 700;

    color:
        var(--red);

    letter-spacing: 0.7px;

}


.live-dot {

    width: 8px;

    height: 8px;

    border-radius: 50%;

    background:
        var(--red);

    animation:
        pulse 1.5s infinite;

}


@keyframes pulse {

    0% {

        opacity: 1;

        transform: scale(1);

    }

    50% {

        opacity: 0.45;

        transform: scale(0.75);

    }

    100% {

        opacity: 1;

        transform: scale(1);

    }

}



/* ============================================================
   LOADING
============================================================ */

.loading-screen {

    min-height:
        calc(100vh - 76px);

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;

    gap: 15px;

    color:
        var(--muted);

    font-size: 13px;

}


.loader {

    width: 36px;

    height: 36px;

    border:
        3px solid #e5e5e5;

    border-top-color:
        var(--purple);

    border-radius: 50%;

    animation:
        spin 0.8s linear infinite;

}


@keyframes spin {

    to {

        transform:
            rotate(360deg);

    }

}



/* ============================================================
   ERROR
============================================================ */

.error-section {

    min-height:
        calc(100vh - 160px);

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;

    text-align: center;

    padding: 30px;

}


.error-icon {

    width: 56px;

    height: 56px;

    border-radius: 50%;

    background:
        var(--red-light);

    color:
        var(--red);

    display: flex;

    align-items: center;

    justify-content: center;

    font-weight: 700;

    font-size: 25px;

    margin-bottom: 18px;

}


.error-section h2 {

    font-size: 20px;

    margin-bottom: 7px;

}


.error-section p {

    color:
        var(--muted);

    font-size: 13px;

    max-width: 400px;

    margin-bottom: 22px;

}



/* ============================================================
   APP
============================================================ */

.app {

    padding:
        28px 24px 50px;

}



/* ============================================================
   WELCOME
============================================================ */

.welcome-section {

    padding:
        8px 0 30px;

}


.section-eyebrow {

    display: inline-block;

    font-size: 10px;

    font-weight: 700;

    letter-spacing: 1.5px;

    color:
        var(--purple);

    margin-bottom: 7px;

}


.welcome-section h2 {

    font-size:
        clamp(26px, 4vw, 38px);

    line-height: 1.2;

    letter-spacing: -1px;

    max-width: 600px;

}


.welcome-section h2 span {

    color:
        var(--purple);

}


.welcome-section p {

    color:
        var(--muted);

    font-size: 13px;

    margin-top: 10px;

    max-width: 600px;

}



/* ============================================================
   SECTION
============================================================ */

.section {

    margin-top: 34px;

}


.section-header {

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 20px;

    margin-bottom: 16px;

}


.small-label {

    display: block;

    font-size: 9px;

    font-weight: 700;

    letter-spacing: 1.4px;

    color:
        var(--purple);

    margin-bottom: 4px;

}


.section-header h2 {

    font-size: 21px;

    line-height: 1.25;

}


.count-pill {

    min-width: 31px;

    height: 28px;

    padding:
        0 9px;

    border-radius: 20px;

    background:
        var(--purple-light);

    color:
        var(--purple);

    display: flex;

    align-items: center;

    justify-content: center;

    font-size: 11px;

    font-weight: 700;

}


.section-description {

    color:
        var(--muted);

    font-size: 12px;

    margin:
        -5px 0 16px;

}



/* ============================================================
   LIVE LIST
============================================================ */

.live-list {

    display: grid;

    grid-template-columns:
        repeat(2, minmax(0, 1fr));

    gap: 15px;

}


.live-card {

    background:
        var(--white);

    border:
        1px solid var(--border);

    border-radius: 18px;

    padding: 18px;

    box-shadow:
        var(--shadow);

    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;

}


.live-card:hover {

    transform:
        translateY(-2px);

    box-shadow:
        0 12px 35px rgba(0, 0, 0, 0.07);

}


.live-card-top {

    display: flex;

    align-items: flex-start;

    justify-content: space-between;

    gap: 12px;

}


.live-subject {

    font-size: 10px;

    font-weight: 700;

    color:
        var(--purple);

    text-transform: uppercase;

    letter-spacing: 0.7px;

}


.live-status {

    padding:
        5px 9px;

    border-radius: 20px;

    font-size: 8px;

    font-weight: 700;

    letter-spacing: 0.5px;

    white-space: nowrap;

}


.live-status.now {

    background:
        var(--red-light);

    color:
        var(--red);

}


.live-status.upcoming {

    background:
        var(--orange-light);

    color:
        #b66a00;

}


.live-status.ended {

    background:
        #f0f0f0;

    color:
        #777;

}


.live-card h3 {

    font-size: 17px;

    line-height: 1.35;

    margin:
        10px 0 5px;

}


.live-topic {

    color:
        var(--muted);

    font-size: 11px;

    line-height: 1.5;

}


.live-meta {

    display: flex;

    flex-wrap: wrap;

    gap: 9px;

    margin-top: 15px;

}


.meta-item {

    display: flex;

    align-items: center;

    gap: 5px;

    color:
        #666;

    font-size: 10px;

}


.meta-icon {

    color:
        var(--purple);

    font-weight: 700;

}


.live-card-bottom {

    border-top:
        1px solid #f0f0f0;

    margin-top: 15px;

    padding-top: 14px;

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 12px;

}


.time-block strong {

    display: block;

    font-size: 15px;

}


.time-block span {

    color:
        var(--muted);

    font-size: 9px;

}


.join-button {

    border: none;

    border-radius: 11px;

    padding:
        10px 15px;

    background:
        var(--black);

    color:
        var(--white);

    font-size: 10px;

    font-weight: 700;

    cursor: pointer;

    transition:
        0.2s ease;

}


.join-button:hover {

    background:
        var(--purple);

}


.join-button.live {

    background:
        var(--red);

}


.join-button.watch {

    background:
        var(--purple);

}


.join-button:disabled {

    background:
        #e9e9e9;

    color:
        #999;

    cursor:
        default;

}



/* ============================================================
   MISSED
============================================================ */

.missed-section {

    margin-top: 34px;

    background:
        var(--black);

    color:
        var(--white);

    border-radius: 20px;

    padding:
        22px;

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 20px;

}


.missed-content {

    display: flex;

    align-items: center;

    gap: 15px;

}


.missed-icon {

    width: 45px;

    height: 45px;

    flex:
        0 0 45px;

    border-radius: 14px;

    background:
        rgba(255,255,255,0.1);

    display: flex;

    align-items: center;

    justify-content: center;

    font-size: 16px;

}


.missed-content > div > span {

    color:
        #bdbdbd;

    font-size: 8px;

    letter-spacing: 1.2px;

    font-weight: 700;

}


.missed-content h3 {

    font-size: 15px;

    margin-top: 3px;

}


.missed-content p {

    color:
        #999;

    font-size: 10px;

    margin-top: 3px;

}


.outline-button {

    flex-shrink: 0;

    border:
        1px solid #555;

    background:
        transparent;

    color:
        white;

    border-radius: 10px;

    padding:
        10px 14px;

    font-size: 9px;

    font-weight: 700;

    cursor: pointer;

}



/* ============================================================
   DATE SELECTOR
============================================================ */

.date-picker-card {

    background:
        var(--white);

    border:
        1px solid var(--border);

    border-radius: 18px;

    min-height: 76px;

    display: flex;

    align-items: center;

    justify-content: space-between;

    padding:
        10px 14px;

    box-shadow:
        var(--shadow);

}


.date-arrow {

    width: 43px;

    height: 43px;

    border:
        1px solid var(--border);

    border-radius: 12px;

    background:
        #fafafa;

    font-size: 28px;

    line-height: 1;

    cursor: pointer;

    color:
        var(--text);

}


.date-arrow:hover {

    border-color:
        var(--purple);

    color:
        var(--purple);

}


.selected-date {

    text-align: center;

}


.selected-date-day {

    display: block;

    font-size: 9px;

    text-transform: uppercase;

    letter-spacing: 1px;

    color:
        var(--purple);

    font-weight: 700;

    margin-bottom: 2px;

}


.selected-date strong {

    display: block;

    font-size: 15px;

}



/* ============================================================
   DATE CLASSES
============================================================ */

.date-class-list {

    display: flex;

    flex-direction: column;

    gap: 10px;

    margin-top: 14px;

}


.date-class-card {

    background:
        var(--white);

    border:
        1px solid var(--border);

    border-radius: 15px;

    padding:
        15px;

    display: flex;

    align-items: center;

    gap: 15px;

}


.date-class-time {

    min-width: 70px;

    text-align: center;

}


.date-class-time strong {

    display: block;

    font-size: 13px;

}


.date-class-time span {

    display: block;

    font-size: 8px;

    color:
        var(--muted);

    margin-top: 2px;

}


.date-class-divider {

    width: 1px;

    height: 40px;

    background:
        var(--border);

}


.date-class-info {

    flex: 1;

    min-width: 0;

}


.date-class-info .subject {

    font-size: 9px;

    color:
        var(--purple);

    font-weight: 700;

    text-transform: uppercase;

}


.date-class-info h3 {

    font-size: 13px;

    margin-top: 2px;

}


.date-class-info p {

    color:
        var(--muted);

    font-size: 9px;

    margin-top: 2px;

}


.small-watch-button {

    border: none;

    background:
        var(--purple-light);

    color:
        var(--purple);

    border-radius: 9px;

    padding:
        9px 12px;

    font-size: 9px;

    font-weight: 700;

    cursor: pointer;

}



/* ============================================================
   SUBJECT GRID
============================================================ */

.subject-grid {

    display: grid;

    grid-template-columns:
        repeat(4, minmax(0, 1fr));

    gap: 12px;

}


.subject-card {

    background:
        var(--white);

    border:
        1px solid var(--border);

    border-radius: 17px;

    padding:
        18px;

    cursor: pointer;

    transition:
        0.2s ease;

}


.subject-card:hover {

    transform:
        translateY(-2px);

    border-color:
        #dcd7ff;

    box-shadow:
        var(--shadow);

}


.subject-icon {

    width: 38px;

    height: 38px;

    border-radius: 12px;

    background:
        var(--purple-light);

    color:
        var(--purple);

    display: flex;

    align-items: center;

    justify-content: center;

    font-size: 15px;

    font-weight: 700;

    margin-bottom: 12px;

}


.subject-card h3 {

    font-size: 13px;

    line-height: 1.3;

}


.subject-card p {

    color:
        var(--muted);

    font-size: 9px;

    margin-top: 4px;

}


.subject-arrow {

    margin-top: 13px;

    color:
        var(--purple);

    font-size: 10px;

    font-weight: 700;

}



/* ============================================================
   SUBJECT RECORDINGS
============================================================ */

.subject-classes-section {

    scroll-margin-top:
        90px;

}


.close-button {

    width: 32px;

    height: 32px;

    border:
        1px solid var(--border);

    border-radius: 10px;

    background:
        var(--white);

    color:
        #777;

    font-size: 20px;

    cursor: pointer;

}


.subject-class-list {

    display: flex;

    flex-direction: column;

    gap: 10px;

}


.subject-class-card {

    background:
        var(--white);

    border:
        1px solid var(--border);

    border-radius: 16px;

    padding:
        16px;

    display: flex;

    align-items: center;

    gap: 15px;

}


.subject-class-thumbnail {

    width: 105px;

    height: 65px;

    border-radius: 11px;

    overflow: hidden;

    flex-shrink: 0;

    background:
        linear-gradient(
            135deg,
            #191919,
            #373737
        );

    display: flex;

    align-items: center;

    justify-content: center;

    color:
        white;

    position: relative;

}


.subject-class-thumbnail img {

    width: 100%;

    height: 100%;

    object-fit: cover;

}


.thumbnail-play {

    position: absolute;

    width: 28px;

    height: 28px;

    border-radius: 50%;

    background:
        rgba(255,255,255,0.94);

    color:
        var(--black);

    display: flex;

    align-items: center;

    justify-content: center;

    font-size: 10px;

}


.subject-class-info {

    flex: 1;

    min-width: 0;

}


.subject-class-info .subject-label {

    font-size: 8px;

    color:
        var(--purple);

    text-transform: uppercase;

    font-weight: 700;

    letter-spacing: 0.7px;

}


.subject-class-info h3 {

    font-size: 14px;

    margin-top: 3px;

    white-space: nowrap;

    overflow: hidden;

    text-overflow: ellipsis;

}


.subject-class-info p {

    color:
        var(--muted);

    font-size: 9px;

    margin-top: 4px;

}


.watch-button {

    border: none;

    background:
        var(--black);

    color:
        white;

    border-radius: 10px;

    padding:
        10px 14px;

    font-size: 9px;

    font-weight: 700;

    cursor: pointer;

    flex-shrink: 0;

}


.watch-button:hover {

    background:
        var(--purple);

}



/* ============================================================
   EMPTY
============================================================ */

.empty-card {

    background:
        var(--white);

    border:
        1px dashed #dcdcdc;

    border-radius: 18px;

    padding:
        30px 20px;

    text-align: center;

}


.empty-icon {

    width: 42px;

    height: 42px;

    border-radius: 13px;

    background:
        #f3f3f3;

    color:
        #888;

    display: flex;

    align-items: center;

    justify-content: center;

    margin:
        0 auto 12px;

    font-size: 17px;

}


.empty-card h3 {

    font-size: 14px;

}


.empty-card p {

    color:
        var(--muted);

    font-size: 10px;

    margin-top: 5px;

}



/* ============================================================
   BUTTON
============================================================ */

.dark-button {

    border: none;

    background:
        var(--black);

    color:
        white;

    padding:
        11px 17px;

    border-radius: 10px;

    font-size: 9px;

    font-weight: 700;

    cursor: pointer;

}



/* ============================================================
   BOTTOM NAV
============================================================ */

.bottom-nav {

    position: fixed;

    bottom: 0;

    left: 50%;

    transform:
        translateX(-50%);

    width:
        min(100%, 1180px);

    height: 72px;

    background:
        rgba(255,255,255,0.96);

    backdrop-filter:
        blur(18px);

    border-top:
        1px solid var(--border);

    display: grid;

    grid-template-columns:
        repeat(4, 1fr);

    z-index: 100;

    padding:
        7px 10px;

}


.nav-item {

    border: none;

    background: transparent;

    color:
        #8b8b8b;

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;

    gap: 3px;

    font-size: 9px;

    font-weight: 600;

    cursor: pointer;

}


.nav-icon {

    font-size: 18px;

    line-height: 1;

}


.nav-item.active {

    color:
        var(--purple);

}



/* ============================================================
   RESPONSIVE
============================================================ */

@media (max-width: 850px) {

    .live-list {

        grid-template-columns:
            1fr;

    }


    .subject-grid {

        grid-template-columns:
            repeat(2, minmax(0, 1fr));

    }

}


@media (max-width: 600px) {

    body {

        padding-bottom: 78px;

    }


    .topbar {

        height: 66px;

        padding:
            0 15px;

    }


    .app {

        padding:
            20px 15px 35px;

    }


    .back-button {

        width: 38px;

        height: 38px;

        border-radius: 11px;

    }


    .topbar-title h1 {

        font-size: 17px;

    }


    .welcome-section {

        padding-top: 5px;

    }


    .welcome-section h2 {

        font-size: 27px;

    }


    .section-header h2 {

        font-size: 18px;

    }


    .missed-section {

        flex-direction: column;

        align-items: stretch;

    }


    .missed-content {

        align-items: flex-start;

    }


    .outline-button {

        width: 100%;

    }


    .subject-grid {

        grid-template-columns:
            repeat(2, minmax(0, 1fr));

    }


    .date-class-card {

        padding: 12px;

        gap: 10px;

    }


    .date-class-time {

        min-width: 55px;

    }


    .date-class-info h3 {

        font-size: 12px;

    }


    .small-watch-button {

        padding:
            8px 9px;

    }


    .subject-class-card {

        align-items: flex-start;

    }


    .subject-class-thumbnail {

        width: 88px;

        height: 58px;

    }


    .subject-class-info h3 {

        white-space: normal;

    }


    .watch-button {

        padding:
            8px 10px;

    }


    .bottom-nav {

        height: 66px;

    }

}


@media (max-width: 400px) {

    .subject-grid {

        grid-template-columns:
            1fr;

    }


    .subject-class-thumbnail {

        width: 76px;

    }

}

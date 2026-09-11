/* =========================================================
   ZENOVA STUDY NOW
========================================================= */

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

html {
    scroll-behavior: smooth;
}

body {
    font-family: "Poppins", sans-serif;
    background: #ffffff;
    color: #111111;
}

button,
a {
    font-family: inherit;
}

button {
    border: 0;
}

a {
    text-decoration: none;
    color: inherit;
}

.hidden {
    display: none !important;
}


/* =========================================================
   APP
========================================================= */

.app {
    width: 100%;
    min-height: 100vh;
    background: #ffffff;
}


/* =========================================================
   LOADER
========================================================= */

.loader-screen {
    position: fixed;
    inset: 0;
    z-index: 9999;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    background: #ffffff;
}

.loader-ring {
    width: 58px;
    height: 58px;

    border: 2px solid #eeeeee;
    border-top-color: #6c35de;

    border-radius: 50%;

    display: flex;
    align-items: center;
    justify-content: center;

    animation: loaderSpin 1s linear infinite;
}

.loader-z {
    font-size: 20px;
    font-weight: 700;
    color: #6c35de;

    animation: loaderCounterSpin 1s linear infinite;
}

.loader-text {
    margin-top: 15px;

    color: #777777;

    font-size: 12px;
    font-weight: 500;
}

@keyframes loaderSpin {
    to {
        transform: rotate(360deg);
    }
}

@keyframes loaderCounterSpin {
    to {
        transform: rotate(-360deg);
    }
}


/* =========================================================
   HEADER
========================================================= */

.top-header {
    position: sticky;
    top: 0;
    z-index: 100;

    height: 64px;

    display: grid;
    grid-template-columns: 44px 1fr 44px;
    align-items: center;

    padding: 0 16px;

    background: rgba(255, 255, 255, 0.97);

    border-bottom: 1px solid #eeeeee;
}

.back-button,
.notification-button {
    width: 38px;
    height: 38px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 11px;

    background: #f7f7f8;

    color: #111111;

    cursor: pointer;

    transition: 0.2s;
}

.back-button:hover,
.notification-button:hover {
    background: #eeeeee;
}

.back-button i,
.notification-button i {
    font-size: 20px;
}

.brand {
    text-align: center;
    line-height: 1;
}

.brand-name {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 2px;
}

.brand-subtitle {
    margin-top: 4px;

    font-size: 7px;
    font-weight: 600;

    letter-spacing: 4px;

    color: #777777;
}


/* =========================================================
   MAIN
========================================================= */

.main-content {
    width: min(100%, 900px);

    margin: 0 auto;

    padding:
        24px 18px
        calc(100px + env(safe-area-inset-bottom))
        18px;
}


/* =========================================================
   PAGE HEADING
========================================================= */

.page-heading {
    margin-bottom: 25px;
}

.eyebrow {
    display: block;

    margin-bottom: 4px;

    color: #6c35de;

    font-size: 10px;
    font-weight: 700;

    letter-spacing: 1.5px;
}

.page-heading h1 {
    font-size: 25px;
    font-weight: 700;

    line-height: 1.2;
}

.page-heading p {
    margin-top: 5px;

    color: #777777;

    font-size: 12px;
}


/* =========================================================
   SECTION
========================================================= */

.section {
    margin-bottom: 30px;
}

.section-heading {
    display: flex;

    align-items: center;
    justify-content: space-between;

    margin-bottom: 13px;
}

.section-heading span {
    display: block;

    margin-bottom: 2px;

    color: #888888;

    font-size: 9px;
    font-weight: 700;

    letter-spacing: 1.3px;
}

.section-heading h2 {
    font-size: 18px;
    font-weight: 700;
}

.section-heading > i {
    width: 38px;
    height: 38px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 11px;

    background: #f5f1ff;

    color: #6c35de;

    font-size: 19px;
}


/* =========================================================
   PURCHASED COURSE
========================================================= */

.course-card {
    display: flex;

    overflow: hidden;

    min-height: 145px;

    border: 1px solid #e8e8e8;
    border-radius: 16px;

    background: #ffffff;

    cursor: pointer;

    transition:
        transform 0.2s,
        border-color 0.2s;
}

.course-card:hover {
    transform: translateY(-1px);
    border-color: #d7d7d7;
}

.course-image-wrapper {
    width: 38%;

    min-width: 145px;

    background: #f3f3f3;

    overflow: hidden;
}

.course-image-wrapper img {
    width: 100%;
    height: 100%;

    display: block;

    object-fit: cover;
}

.course-card-content {
    flex: 1;

    padding: 15px;
}

.course-badge {
    display: inline-flex;

    padding: 4px 8px;

    border-radius: 6px;

    background: #f1ecff;

    color: #6c35de;

    font-size: 8px;
    font-weight: 700;

    letter-spacing: 0.7px;
}

.course-card h3 {
    margin-top: 8px;

    font-size: 16px;
    font-weight: 700;

    line-height: 1.3;
}

.course-card p {
    margin-top: 3px;

    color: #777777;

    font-size: 10px;
}

.progress-area {
    margin-top: 15px;
}

.progress-label {
    display: flex;

    justify-content: space-between;

    margin-bottom: 6px;

    color: #777777;

    font-size: 9px;
}

.progress-label strong {
    color: #111111;
}

.progress-track {
    width: 100%;
    height: 5px;

    overflow: hidden;

    border-radius: 10px;

    background: #eeeeee;
}

.progress-bar {
    width: 0%;
    height: 100%;

    border-radius: inherit;

    background: #6c35de;

    transition: width 0.3s ease;
}


/* =========================================================
   FREE CONTENT
========================================================= */

.free-content-list {
    display: grid;

    grid-template-columns:
        repeat(2, minmax(0, 1fr));

    gap: 12px;
}

.free-card {
    overflow: hidden;

    border: 1px solid #e8e8e8;

    border-radius: 14px;

    background: #ffffff;

    cursor: pointer;

    transition: 0.2s;
}

.free-card:hover {
    transform: translateY(-1px);
}

.free-thumbnail {
    position: relative;

    aspect-ratio: 16 / 9;

    overflow: hidden;

    background: #eeeeee;
}

.free-thumbnail img {
    width: 100%;
    height: 100%;

    display: block;

    object-fit: cover;
}

.free-play {
    position: absolute;

    left: 10px;
    bottom: 10px;

    width: 31px;
    height: 31px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 50%;

    background: #ffffff;

    color: #6c35de;

    font-size: 17px;
}

.free-info {
    padding: 11px;
}

.free-label {
    color: #6c35de;

    font-size: 8px;
    font-weight: 700;

    letter-spacing: 0.8px;
}

.free-info h3 {
    margin-top: 4px;

    font-size: 13px;
    font-weight: 600;

    line-height: 1.35;
}

.free-info p {
    margin-top: 3px;

    color: #888888;

    font-size: 9px;
}


/* =========================================================
   LIVE CLASSES
========================================================= */

.live-list,
.schedule-list {
    display: flex;
    flex-direction: column;

    gap: 10px;
}

.live-card,
.schedule-card {
    display: flex;

    gap: 12px;

    padding: 11px;

    border: 1px solid #e8e8e8;

    border-radius: 14px;

    background: #ffffff;
}

.live-thumbnail {
    width: 110px;
    min-width: 110px;

    aspect-ratio: 16 / 9;

    overflow: hidden;

    border-radius: 9px;

    background: #eeeeee;
}

.live-thumbnail img {
    width: 100%;
    height: 100%;

    display: block;

    object-fit: cover;
}

.live-content {
    flex: 1;

    min-width: 0;
}

.live-status {
    display: inline-flex;

    align-items: center;

    gap: 4px;

    color: #6c35de;

    font-size: 8px;
    font-weight: 700;

    letter-spacing: 0.7px;
}

.live-status-dot {
    width: 6px;
    height: 6px;

    border-radius: 50%;

    background: #6c35de;
}

.live-content h3 {
    margin-top: 4px;

    font-size: 13px;
    font-weight: 600;
}

.live-content p {
    margin-top: 3px;

    color: #777777;

    font-size: 9px;
}

.join-button {
    align-self: center;

    min-width: 76px;
    height: 34px;

    padding: 0 11px;

    border-radius: 9px;

    background: #6c35de;

    color: #ffffff;

    font-size: 9px;
    font-weight: 600;

    cursor: pointer;
}

.join-button.disabled {
    background: #eeeeee;
    color: #888888;

    cursor: default;
}


/* =========================================================
   DATE SELECTOR
========================================================= */

.date-selector {
    display: flex;

    align-items: center;

    gap: 7px;

    margin-bottom: 12px;
}

.date-arrow {
    width: 34px;
    height: 42px;

    min-width: 34px;

    display: flex;
    align-items: center;
    justify-content: center;

    border: 1px solid #e8e8e8;

    border-radius: 10px;

    background: #ffffff;

    cursor: pointer;
}

.date-list {
    flex: 1;

    display: grid;

    grid-template-columns:
        repeat(5, minmax(0, 1fr));

    gap: 6px;
}

.date-item {
    height: 42px;

    display: flex;
    flex-direction: column;

    align-items: center;
    justify-content: center;

    border: 1px solid #e8e8e8;

    border-radius: 10px;

    background: #ffffff;

    cursor: pointer;
}

.date-item .day {
    color: #888888;

    font-size: 8px;
}

.date-item .number {
    margin-top: 1px;

    font-size: 12px;
    font-weight: 600;
}

.date-item.active {
    border-color: #6c35de;

    background: #6c35de;

    color: #ffffff;
}

.date-item.active .day {
    color: #ffffff;
}


/* =========================================================
   SCHEDULE
========================================================= */

.schedule-card {
    align-items: center;
}

.schedule-time {
    width: 65px;
    min-width: 65px;

    color: #6c35de;

    font-size: 10px;
    font-weight: 600;
}

.schedule-content {
    flex: 1;
}

.schedule-content h3 {
    font-size: 13px;
    font-weight: 600;
}

.schedule-content p {
    margin-top: 2px;

    color: #888888;

    font-size: 9px;
}

.schedule-type {
    padding: 5px 7px;

    border-radius: 6px;

    background: #f5f5f5;

    color: #777777;

    font-size: 8px;
    font-weight: 600;
}


/* =========================================================
   SUBJECTS
========================================================= */

.subjects-list {
    display: flex;
    flex-direction: column;

    gap: 9px;
}

.subject-card {
    display: flex;

    align-items: center;

    gap: 12px;

    padding: 13px;

    border: 1px solid #e8e8e8;

    border-radius: 14px;

    background: #ffffff;

    cursor: pointer;

    transition: 0.2s;
}

.subject-card:hover {
    border-color: #d8d8d8;
    transform: translateY(-1px);
}

.subject-icon {
    width: 43px;
    height: 43px;

    min-width: 43px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 11px;

    background: #f5f1ff;

    color: #6c35de;

    font-size: 20px;
}

.subject-info {
    flex: 1;

    min-width: 0;
}

.subject-info h3 {
    font-size: 14px;
    font-weight: 600;
}

.subject-info p {
    margin-top: 2px;

    color: #888888;

    font-size: 9px;
}

.subject-arrow {
    color: #999999;

    font-size: 18px;
}


/* =========================================================
   EMPTY / LOADING
========================================================= */

.section-loading {
    padding: 20px;

    text-align: center;

    border: 1px dashed #dddddd;

    border-radius: 12px;

    color: #999999;

    font-size: 10px;
}

.empty-message {
    padding: 22px;

    text-align: center;

    border: 1px dashed #dddddd;

    border-radius: 12px;

    color: #888888;

    font-size: 10px;
}


/* =========================================================
   ERROR
========================================================= */

.error-state {
    padding: 35px 20px;

    text-align: center;

    border: 1px solid #eeeeee;

    border-radius: 15px;
}

.error-icon {
    width: 45px;
    height: 45px;

    margin: 0 auto 10px;

    display: flex;
    align-items: center;
    justify-content: center;

    border-radius: 50%;

    background: #f5f1ff;

    color: #6c35de;

    font-size: 22px;
}

.error-state h3 {
    font-size: 15px;
}

.error-state p {
    margin-top: 5px;

    color: #888888;

    font-size: 10px;
}

.primary-button {
    margin-top: 15px;

    height: 38px;

    padding: 0 18px;

    border-radius: 9px;

    background: #6c35de;

    color: #ffffff;

    font-size: 10px;
    font-weight: 600;

    cursor: pointer;
}


/* =========================================================
   BOTTOM NAV
========================================================= */

.bottom-nav {
    position: fixed;

    left: 0;
    right: 0;
    bottom: 0;

    z-index: 200;

    height: calc(68px + env(safe-area-inset-bottom));

    display: grid;

    grid-template-columns:
        repeat(5, 1fr);

    align-items: start;

    padding:
        8px 8px
        env(safe-area-inset-bottom);

    background: #ffffff;

    border-top: 1px solid #eeeeee;
}

.nav-item {
    height: 52px;

    display: flex;
    flex-direction: column;

    align-items: center;
    justify-content: center;

    gap: 3px;

    color: #888888;

    font-size: 8px;
    font-weight: 500;
}

.nav-item i {
    font-size: 19px;
}

.nav-item.active {
    color: #6c35de;
}

.nav-item.active i {
    font-weight: 600;
}


/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 520px) {

    .main-content {
        padding-left: 15px;
        padding-right: 15px;
    }

    .page-heading h1 {
        font-size: 23px;
    }

    .course-image-wrapper {
        width: 40%;
        min-width: 120px;
    }

    .course-card-content {
        padding: 12px;
    }

    .course-card h3 {
        font-size: 14px;
    }

    .free-content-list {
        gap: 9px;
    }

    .free-info {
        padding: 9px;
    }

    .free-info h3 {
        font-size: 11px;
    }

    .live-thumbnail {
        width: 95px;
        min-width: 95px;
    }

    .join-button {
        min-width: 64px;
        height: 32px;

        padding: 0 8px;

        font-size: 8px;
    }
}


@media (max-width: 380px) {

    .top-header {
        padding: 0 12px;
    }

    .brand-name {
        font-size: 18px;
    }

    .main-content {
        padding-top: 20px;
    }

    .course-card {
        min-height: 125px;
    }

    .course-image-wrapper {
        width: 37%;
        min-width: 105px;
    }

    .course-card-content {
        padding: 10px;
    }

    .course-card h3 {
        font-size: 13px;
    }

    .free-content-list {
        grid-template-columns: 1fr 1fr;
    }

    .live-card {
        gap: 8px;
    }

    .live-thumbnail {
        width: 82px;
        min-width: 82px;
    }

    .date-list {
        gap: 4px;
    }

    .date-item {
        height: 40px;
    }

    .date-item .number {
        font-size: 11px;
    }

    .subject-card {
        padding: 11px;
    }

    .subject-icon {
        width: 39px;
        height: 39px;
        min-width: 39px;
    }
}

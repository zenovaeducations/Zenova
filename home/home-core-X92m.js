import {
    auth,
    db
} from "../firebase/firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const loader =
    document.getElementById("zenovaLoader");

const app =
    document.getElementById("zenovaApp");


let currentUser = null;
let student = null;



/* ============================================================
   AUTH + ONBOARDING GATE
============================================================ */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.replace(
                "../login/"
            );

            return;

        }


        currentUser = user;


        try {

            const studentRef =
                doc(
                    db,
                    "students",
                    user.uid
                );


            const snapshot =
                await getDoc(
                    studentRef
                );


            if (!snapshot.exists()) {

                window.location.replace(
                    "../onboarding/"
                );

                return;

            }


            student =
                snapshot.data();


            if (
                !isProfileComplete(
                    student
                )
            ) {

                window.location.replace(
                    "../onboarding/"
                );

                return;

            }


            renderStudent();

            setupNavigation();

            setupSlider();

            showApp();


        } catch (error) {

            console.error(
                "Home loading error:",
                error
            );

            loader.innerHTML = `

                <div
                    style="
                        text-align:center;
                        padding:30px;
                    "
                >

                    <strong
                        style="
                            font-size:20px;
                            letter-spacing:3px;
                        "
                    >
                        ZENOVA
                    </strong>

                    <p
                        style="
                            margin-top:12px;
                            color:#777;
                            font-size:11px;
                        "
                    >
                        We couldn't load your
                        learning space.
                    </p>

                    <button
                        onclick="location.reload()"
                        style="
                            margin-top:18px;
                            padding:11px 18px;
                            border:0;
                            border-radius:7px;
                            background:#111;
                            color:#fff;
                            font-size:9px;
                            font-weight:700;
                        "
                    >
                        TRY AGAIN
                    </button>

                </div>

            `;

        }

    }
);



/* ============================================================
   PROFILE VALIDATION
============================================================ */

function isProfileComplete(data) {

    if (!data) {
        return false;
    }


    if (
        data.onboardingComplete !== true
    ) {

        return false;

    }


    if (
        !data.name ||
        typeof data.name !== "string" ||
        data.name.trim().length < 2
    ) {

        return false;

    }


    const validClasses = [

        "Under 8th",
        "8th",
        "9th",
        "10th",
        "1st PUC",
        "2nd PUC"

    ];


    if (
        !validClasses.includes(
            data.className
        )
    ) {

        return false;

    }


    if (
        data.className === "10th"
    ) {

        if (!data.board) {
            return false;
        }

        if (!data.studyMode) {
            return false;
        }

    }


    if (
        data.className === "1st PUC" ||
        data.className === "2nd PUC"
    ) {

        if (!data.combination) {
            return false;
        }

        if (!data.target) {
            return false;
        }

        if (!data.studyMode) {
            return false;
        }

    }


    if (
        data.className === "Under 8th" ||
        data.className === "8th" ||
        data.className === "9th"
    ) {

        if (!data.studyMode) {
            return false;
        }

    }


    return true;

}



/* ============================================================
   STUDENT INFORMATION
============================================================ */

function renderStudent() {

    const name =
        student.name ||
        "Student";


    document.getElementById(
        "studentName"
    ).textContent =
        name;


    document.getElementById(
        "profileInitial"
    ).textContent =
        name
            .charAt(0)
            .toUpperCase();


    let academic =
        student.className || "";


    if (student.board) {

        academic +=
            ` • ${student.board}`;

    }


    if (student.combination) {

        academic +=
            ` • ${student.combination}`;

    }


    document.getElementById(
        "studentAcademic"
    ).textContent =
        academic;

}



/* ============================================================
   BANNER SLIDER
============================================================ */

function setupSlider() {

    const slides =
        document.querySelectorAll(
            ".hero-slide"
        );


    const dots =
        document.querySelectorAll(
            ".hero-dot"
        );


    if (
        slides.length <= 1
    ) {

        return;

    }


    let current = 0;


    function showSlide(index) {

        current =
            (index + slides.length) %
            slides.length;


        slides.forEach(
            (slide, i) => {

                slide.classList.toggle(
                    "active",
                    i === current
                );

            }
        );


        dots.forEach(
            (dot, i) => {

                dot.classList.toggle(
                    "active",
                    i === current
                );

            }
        );

    }


    dots.forEach(
        dot => {

            dot.addEventListener(
                "click",
                () => {

                    showSlide(
                        Number(
                            dot.dataset.index
                        )
                    );

                }
            );

        }
    );


    setInterval(
        () => {

            showSlide(
                current + 1
            );

        },
        5000
    );

}



/* ============================================================
   NAVIGATION
============================================================ */

function setupNavigation() {

    const routes = {

        home:
            "../home/",

        batches:
            "../batches/",

        study:
            "../study/",

        tests:
            "../tests/",

        results:
            "../results/",

        live:
            "../live/",

        profile:
            "../profile/",

        free:
            "../free/",

        announcements:
            "../announcements/",

        timetable:
            "../timetable/",

        library:
            "../library/",

        ai:
            "../ai/",

        doubts:
            "../doubts/",

        support:
            "../support/"

    };


    document
        .querySelectorAll(
            "[data-route]"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    () => {

                        const route =
                            element.dataset.route;


                        if (
                            routes[route]
                        ) {

                            window.location.href =
                                routes[route];

                        }

                    }
                );

            }
        );


    document
        .getElementById(
            "profileShortcut"
        )
        .addEventListener(
            "click",
            () => {

                window.location.href =
                    "../profile/";

            }
        );


    document
        .getElementById(
            "notificationButton"
        )
        .addEventListener(
            "click",
            () => {

                window.location.href =
                    "../notifications/";

            }
        );


    document
        .getElementById(
            "aiButton"
        )
        .addEventListener(
            "click",
            () => {

                window.location.href =
                    "../ai/";

            }
        );


    setupMenu();

}



/* ============================================================
   SIDE MENU
============================================================ */

function setupMenu() {

    const menu =
        document.getElementById(
            "sideMenu"
        );

    const overlay =
        document.getElementById(
            "menuOverlay"
        );


    document
        .getElementById(
            "menuButton"
        )
        .addEventListener(
            "click",
            () => {

                menu.classList.add(
                    "open"
                );

                overlay.classList.remove(
                    "hidden"
                );

            }
        );


    document
        .getElementById(
            "closeMenu"
        )
        .addEventListener(
            "click",
            closeMenu
        );


    overlay.addEventListener(
        "click",
        closeMenu
    );


    function closeMenu() {

        menu.classList.remove(
            "open"
        );

        overlay.classList.add(
            "hidden"
        );

    }

}



/* ============================================================
   SHOW APP
============================================================ */

function showApp() {

    app.classList.remove(
        "hidden"
    );


    setTimeout(
        () => {

            loader.classList.add(
                "fade-out"
            );

        },
        100
    );

}

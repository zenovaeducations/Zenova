import {
    auth,
    db
} from "../../firebase/firebase-config.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    collection,
    query,
    where,
    limit,
    onSnapshot,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   ELEMENTS
========================================================= */

const pageLoader =
    document.getElementById(
        "pageLoader"
    );


const todayClasses =
    document.getElementById(
        "todayClasses"
    );


const upcomingClasses =
    document.getElementById(
        "upcomingClasses"
    );


const recordedClasses =
    document.getElementById(
        "recordedClasses"
    );


const todayCount =
    document.getElementById(
        "todayCount"
    );


const upcomingCount =
    document.getElementById(
        "upcomingCount"
    );


const recordedCount =
    document.getElementById(
        "recordedCount"
    );


const studentMeta =
    document.getElementById(
        "studentMeta"
    );


const backButton =
    document.getElementById(
        "backButton"
    );


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let student = null;

let allClasses = [];


/* =========================================================
   BACK
========================================================= */

backButton.addEventListener(
    "click",
    () => {

        window.location.href =
            "../";

    }
);


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.replace(
                "../../login/"
            );

            return;
        }


        currentUser =
            user;


        try {

            await loadStudent();

            startClassesListener();

        } catch (error) {

            console.error(
                "CLASSES AUTH ERROR:",
                error
            );

            showFatalError();

        }

    }
);


/* =========================================================
   STUDENT
========================================================= */

async function loadStudent() {

    const studentRef =
        doc(
            db,
            "students",
            currentUser.uid
        );


    const snapshot =
        await getDoc(
            studentRef
        );


    if (!snapshot.exists()) {

        throw new Error(
            "Student profile not found."
        );

    }


    student =
        snapshot.data();


    const details = [];


    if (student.className) {

        details.push(
            student.className
        );

    }


    if (student.combination) {

        details.push(
            student.combination
        );

    }


    studentMeta.textContent =
        details.length
            ? details.join(" • ")
            : "Your academic classes";

}


/* =========================================================
   CLASSES LISTENER
========================================================= */

function startClassesListener() {

    console.log(
        "ZENOVA HYBRID: Starting classes listener"
    );


    const classesQuery =
        query(
            collection(
                db,
                "hybridClasses"
            ),

            where(
                "active",
                "==",
                true
            ),

            limit(200)
        );


    onSnapshot(

        classesQuery,

        (snapshot) => {

            console.log(
                "ZENOVA HYBRID: Classes received:",
                snapshot.size
            );


            allClasses =
                snapshot.docs.map(
                    item => ({

                        id:
                            item.id,

                        ...item.data()

                    })
                );


            /*
             * Sort everything locally.
             * No composite Firestore index needed.
             */

            allClasses.sort(
                (a, b) => {

                    const dateA =
                        String(
                            a.dateKey || ""
                        );

                    const dateB =
                        String(
                            b.dateKey || ""
                        );


                    if (
                        dateA !==
                        dateB
                    ) {

                        return dateA.localeCompare(
                            dateB
                        );

                    }


                    return String(
                        a.startTime || ""
                    ).localeCompare(
                        String(
                            b.startTime || ""
                        )
                    );

                }
            );


            renderClasses();

            hideLoader();

        },

        (error) => {

            console.error(
                "HYBRID CLASSES FIREBASE ERROR:",
                error
            );


            showClassesError(
                error
            );


            hideLoader();

        }

    );

}


/* =========================================================
   RENDER
========================================================= */

function renderClasses() {

    const today =
        getDateKey(
            new Date()
        );


    const today =
        allClasses.filter(
            item =>
                String(
                    item.dateKey || ""
                ) ===
                today
        );


    const upcoming =
        allClasses
            .filter(
                item =>
                    String(
                        item.dateKey || ""
                    ) > today
            )
            .slice(
                0,
                20
            );


    const recorded =
        allClasses
            .filter(
                item =>
                    String(
                        item.type || ""
                    ).toLowerCase()
                    ===
                    "recorded"
            )
            .slice(
                0,
                20
            );


    renderToday(
        today
    );


    renderUpcoming(
        upcoming
    );


    renderRecorded(
        recorded
    );

}


/* =========================================================
   TODAY
========================================================= */

function renderToday(
    classes
) {

    todayCount.textContent =
        `${classes.length} ${
            classes.length === 1
                ? "class"
                : "classes"
        }`;


    if (!classes.length) {

        todayClasses.innerHTML =
            emptyState(
                "No classes scheduled today.",
                "Your schedule will appear here when the college publishes it."
            );

        return;

    }


    todayClasses.innerHTML =
        classes
            .map(
                renderClassCard
            )
            .join("");

}


/* =========================================================
   UPCOMING
========================================================= */

function renderUpcoming(
    classes
) {

    upcomingCount.textContent =
        `${classes.length} ${
            classes.length === 1
                ? "class"
                : "classes"
        }`;


    if (!classes.length) {

        upcomingClasses.innerHTML =
            emptyState(
                "No upcoming classes.",
                "New classes will appear here automatically."
            );

        return;

    }


    upcomingClasses.innerHTML =
        classes
            .map(
                renderClassCard
            )
            .join("");

}


/* =========================================================
   RECORDED
========================================================= */

function renderRecorded(
    classes
) {

    recordedCount.textContent =
        `${classes.length} ${
            classes.length === 1
                ? "recording"
                : "recordings"
        }`;


    if (!classes.length) {

        recordedClasses.innerHTML =
            emptyState(
                "No recorded classes yet.",
                "Recorded lessons will appear here after they are published."
            );

        return;

    }


    recordedClasses.innerHTML =
        classes
            .map(
                renderClassCard
            )
            .join("");

}


/* =========================================================
   CLASS CARD
========================================================= */

function renderClassCard(
    item
) {

    const type =
        String(
            item.type || "class"
        ).toLowerCase();


    const isRecorded =
        type ===
        "recorded";


    const isLive =
        type ===
        "live";


    let action = "";


    if (
        isLive &&
        item.meetingUrl
    ) {

        action = `

            <a
                class="action-button"
                href="${escapeAttr(
                    item.meetingUrl
                )}"
                target="_blank"
                rel="noopener noreferrer"
            >
                JOIN LIVE
            </a>

        `;

    }


    else if (
        isRecorded &&
        item.videoUrl
    ) {

        action = `

            <a
                class="
                    action-button
                    recorded
                "
                href="${escapeAttr(
                    item.videoUrl
                )}"
                target="_blank"
                rel="noopener noreferrer"
            >
                WATCH
            </a>

        `;

    }


    else {

        action = `

            <span
                style="
                    color:#aaa;
                    font-size:10px;
                    font-weight:700;
                "
            >
                ${isLive
                    ? "LINK NOT ADDED"
                    : "VIDEO NOT ADDED"}
            </span>

        `;

    }


    return `

        <article
            class="class-card"
        >


            <div
                class="class-time"
            >

                <strong>
                    ${escapeHtml(
                        item.startTime ||
                        "--:--"
                    )}
                </strong>


                ${
                    item.endTime
                        ? `
                            <span>
                                to
                                ${escapeHtml(
                                    item.endTime
                                )}
                            </span>
                        `
                        : ""
                }


                ${
                    item.dateKey
                        ? `
                            <span>
                                ${formatDateKey(
                                    item.dateKey
                                )}
                            </span>
                        `
                        : ""
                }

            </div>


            <div
                class="class-details"
            >

                <span
                    class="class-badge"
                >
                    ${escapeHtml(
                        item.type ||
                        "CLASS"
                    )}
                </span>


                <h3
                    class="class-subject"
                >
                    ${escapeHtml(
                        item.subject ||
                        "Class"
                    )}
                </h3>


                ${
                    item.topic
                        ? `
                            <div
                                class="class-topic"
                            >
                                ${escapeHtml(
                                    item.topic
                                )}
                            </div>
                        `
                        : ""
                }


                ${
                    item.teacherName
                        ? `
                            <div
                                class="class-teacher"
                            >
                                ${escapeHtml(
                                    item.teacherName
                                )}
                            </div>
                        `
                        : ""
                }

            </div>


            <div
                class="class-action"
            >
                ${action}
            </div>


        </article>

    `;

}


/* =========================================================
   EMPTY
========================================================= */

function emptyState(
    title,
    description
) {

    return `

        <div
            class="empty-state"
        >

            <strong>
                ${escapeHtml(
                    title
                )}
            </strong>

            <span>
                ${escapeHtml(
                    description
                )}
            </span>

        </div>

    `;

}


/* =========================================================
   ERROR
========================================================= */

function showClassesError(
    error
) {

    todayClasses.innerHTML =
        errorState();


    upcomingClasses.innerHTML =
        errorState();


    recordedClasses.innerHTML =
        errorState();

}


function errorState() {

    return `

        <div
            class="error-state"
        >

            <strong>
                Unable to load classes
            </strong>

            <span
                style="
                    color:#888;
                    font-size:12px;
                "
            >
                Please try again.
            </span>


            <br>


            <button
                class="retry-button"
                onclick="location.reload()"
            >
                TRY AGAIN
            </button>

        </div>

    `;

}


/* =========================================================
   LOADER
========================================================= */

function hideLoader() {

    if (!pageLoader) {
        return;
    }


    pageLoader.style.opacity =
        "0";


    pageLoader.style.pointerEvents =
        "none";


    setTimeout(
        () => {

            pageLoader.style.display =
                "none";

        },
        200
    );

}


function showFatalError() {

    pageLoader.innerHTML = `

        <div
            style="
                text-align:center;
                font-family:Arial,sans-serif;
            "
        >

            <strong
                style="
                    display:block;
                    font-size:16px;
                    letter-spacing:2px;
                "
            >
                ZENOVA
            </strong>


            <p
                style="
                    color:#777;
                    font-size:12px;
                "
            >
                We couldn't load your classes.
            </p>


            <button
                class="retry-button"
                onclick="location.reload()"
            >
                TRY AGAIN
            </button>

        </div>

    `;

}


/* =========================================================
   DATE
========================================================= */

function getDateKey(
    date
) {

    return [

        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        ),

        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        )

    ].join("-");

}


function formatDateKey(
    value
) {

    if (!value) {
        return "";
    }


    const parts =
        String(
            value
        ).split("-");


    if (
        parts.length !== 3
    ) {

        return value;

    }


    const date =
        new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );


    return date.toLocaleDateString(
        "en-IN",
        {
            day:"numeric",
            month:"short"
        }
    );

}


/* =========================================================
   SECURITY / HTML
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


function escapeAttr(
    value
) {

    return escapeHtml(
        value
    );

}

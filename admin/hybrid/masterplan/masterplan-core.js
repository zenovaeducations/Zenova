import {
    auth,
    db
} from "../../../firebase/firebase-config.js";

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
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   ELEMENTS
========================================================= */

const loader =
    document.getElementById("loader");

const app =
    document.getElementById("app");

const planDate =
    document.getElementById("planDate");

const priority =
    document.getElementById("priority");

const active =
    document.getElementById("active");

const taskList =
    document.getElementById("taskList");

const emptyTasks =
    document.getElementById("emptyTasks");

const taskModal =
    document.getElementById("taskModal");

const saveButton =
    document.getElementById("saveButton");

const saveMessage =
    document.getElementById("saveMessage");

const statusDot =
    document.getElementById("statusDot");

const statusText =
    document.getElementById("statusText");


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let currentPlanId = null;

let tasks = [];

let unsubscribePlan = null;


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    user => {

        if (!user) {

            window.location.replace(
                "../../index.html"
            );

            return;
        }


        currentUser = user;


        initialize();

    }
);


/* =========================================================
   INITIALIZE
========================================================= */

function initialize() {

    /*
     * Default to today.
     */

    const today =
        getDateKey(
            new Date()
        );


    planDate.value =
        today;


    setupEvents();

    startPlanListener();

    showApp();

}


/* =========================================================
   REALTIME PLAN LISTENER
========================================================= */

function startMasterPlanListener() {

    const today =
        getDateKey(new Date());

    console.log(
        "ZENOVA HYBRID: Loading Master Plan:",
        today
    );

    const baseQuery =
        query(
            collection(
                db,
                "hybridMasterPlans"
            ),

            where(
                "dateKey",
                "==",
                today
            ),

            limit(10)
        );


    onSnapshot(

        baseQuery,

        async (snapshot) => {

            try {

                console.log(
                    "MASTER PLAN DOCUMENTS:",
                    snapshot.size
                );


                if (snapshot.empty) {

                    masterPlanTasks = [];

                    renderMasterPlan();

                    return;
                }


                let plans =
                    snapshot.docs.map(
                        item => ({
                            id: item.id,
                            ...item.data()
                        })
                    );


                /*
                 * Only published plans.
                 */
                plans =
                    plans.filter(
                        plan =>
                            plan.active === true
                    );


                if (!plans.length) {

                    console.log(
                        "No ACTIVE Master Plan for",
                        today
                    );

                    masterPlanTasks = [];

                    renderMasterPlan();

                    return;
                }


                /*
                 * Highest priority plan wins.
                 */
                plans.sort(
                    (a, b) =>
                        Number(
                            a.priority || 0
                        ) -
                        Number(
                            b.priority || 0
                        )
                );


                const plan =
                    plans[plans.length - 1];


                console.log(
                    "ACTIVE MASTER PLAN:",
                    plan
                );


                const planTasks =
                    Array.isArray(
                        plan.tasks
                    )
                        ? plan.tasks
                        : [];


                masterPlanTasks =
                    await Promise.all(

                        planTasks.map(
                            async task => {

                                let completed =
                                    false;

                                try {

                                    completed =
                                        await getCompletion(
                                            plan.id,
                                            task.id
                                        );

                                } catch (error) {

                                    console.error(
                                        "TASK COMPLETION ERROR:",
                                        error
                                    );

                                }


                                return {

                                    ...task,

                                    planId:
                                        plan.id,

                                    completed

                                };

                            }
                        )

                    );


                renderMasterPlan();


            } catch (error) {

                console.error(
                    "MASTER PLAN ERROR:",
                    error
                );

                masterPlanTasks = [];

                renderMasterPlan();

            }

        },

        error => {

            console.error(
                "MASTER PLAN FIREBASE ERROR:",
                error
            );

            masterPlanTasks = [];

            renderMasterPlan();

        }

    );
}

/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    document
        .getElementById("backButton")
        .addEventListener(
            "click",
            () => {

                window.location.href =
                    "../";

            }
        );


    planDate.addEventListener(
        "change",
        () => {

            tasks = [];

            currentPlanId = null;

            startPlanListener();

        }
    );


    active.addEventListener(
        "change",
        updateStatus
    );


    document
        .getElementById("addTaskButton")
        .addEventListener(
            "click",
            openModal
        );


    document
        .getElementById("closeModal")
        .addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById("cancelTask")
        .addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById("addTask")
        .addEventListener(
            "click",
            addTask
        );


    saveButton.addEventListener(
        "click",
        savePlan
    );

}


/* =========================================================
   MODAL
========================================================= */

function openModal() {

    clearTaskForm();

    taskModal.classList.remove(
        "hidden"
    );

}


function closeModal() {

    taskModal.classList.add(
        "hidden"
    );

}


function clearTaskForm() {

    document.getElementById(
        "taskType"
    ).value = "VIDEO";

    document.getElementById(
        "taskTime"
    ).value = "";

    document.getElementById(
        "taskSubject"
    ).value = "";

    document.getElementById(
        "taskTitle"
    ).value = "";

    document.getElementById(
        "taskChapter"
    ).value = "";

    document.getElementById(
        "resourceUrl"
    ).value = "";

}


/* =========================================================
   ADD TASK
========================================================= */

function addTask() {

    const type =
        document.getElementById(
            "taskType"
        ).value;

    const time =
        document.getElementById(
            "taskTime"
        ).value.trim();

    const subject =
        document.getElementById(
            "taskSubject"
        ).value.trim();

    const title =
        document.getElementById(
            "taskTitle"
        ).value.trim();

    const chapter =
        document.getElementById(
            "taskChapter"
        ).value.trim();

    const resourceUrl =
        document.getElementById(
            "resourceUrl"
        ).value.trim();


    if (!subject) {

        alert(
            "Please enter the subject."
        );

        return;
    }


    if (!title) {

        alert(
            "Please enter the task title."
        );

        return;
    }


    const task = {

        id:
            generateTaskId(),

        type,

        time,

        subject,

        title,

        chapter,

        resourceUrl

    };


    tasks.push(
        task
    );


    /*
     * Sort by time.
     */

    tasks.sort(
        (a, b) =>
            String(
                a.time || ""
            ).localeCompare(
                String(
                    b.time || ""
                )
            )
    );


    renderTasks();

    closeModal();

}


/* =========================================================
   RENDER TASKS
========================================================= */

function renderTasks() {

    if (!tasks.length) {

        taskList.innerHTML = "";

        emptyTasks.classList.remove(
            "hidden"
        );

        return;
    }


    emptyTasks.classList.add(
        "hidden"
    );


    taskList.innerHTML =
        tasks.map(
            (task, index) => `

                <article
                    class="task-row"
                >

                    <div class="task-time">

                        ${
                            escapeHtml(
                                task.time ||
                                "--:--"
                            )
                        }

                    </div>


                    <div class="task-info">

                        <strong>
                            ${escapeHtml(
                                task.subject ||
                                ""
                            )}
                        </strong>


                        <span>
                            ${escapeHtml(
                                task.title ||
                                ""
                            )}
                        </span>


                        ${
                            task.chapter
                                ? `
                                    <span>
                                        ${escapeHtml(
                                            task.chapter
                                        )}
                                    </span>
                                `
                                : ""
                        }


                        <span class="task-type">
                            ${escapeHtml(
                                task.type ||
                                "STUDY"
                            )}
                        </span>

                    </div>


                    <div class="task-actions">

                        ${
                            index > 0
                                ? `
                                    <button
                                        data-up="${index}"
                                        type="button"
                                    >
                                        ↑
                                    </button>
                                `
                                : ""
                        }


                        ${
                            index <
                            tasks.length - 1
                                ? `
                                    <button
                                        data-down="${index}"
                                        type="button"
                                    >
                                        ↓
                                    </button>
                                `
                                : ""
                        }


                        <button
                            class="delete"
                            data-delete="${index}"
                            type="button"
                        >
                            ×
                        </button>

                    </div>

                </article>

            `
        ).join("");


    attachTaskActions();

}


/* =========================================================
   TASK ACTIONS
========================================================= */

function attachTaskActions() {

    taskList
        .querySelectorAll(
            "[data-up]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                button.dataset.up
                            );

                        [
                            tasks[index - 1],
                            tasks[index]
                        ] = [
                            tasks[index],
                            tasks[index - 1]
                        ];

                        renderTasks();

                    }
                );

            }
        );


    taskList
        .querySelectorAll(
            "[data-down]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                button.dataset.down
                            );

                        [
                            tasks[index],
                            tasks[index + 1]
                        ] = [
                            tasks[index + 1],
                            tasks[index]
                        ];

                        renderTasks();

                    }
                );

            }
        );


    taskList
        .querySelectorAll(
            "[data-delete]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                button.dataset.delete
                            );


                        tasks.splice(
                            index,
                            1
                        );


                        renderTasks();

                    }
                );

            }
        );

}


/* =========================================================
   SAVE
========================================================= */
async function savePlan() {

    const dateKey = planDate.value;

    if (!dateKey) {
        alert("Please select a date.");
        return;
    }

    if (!tasks.length) {
        alert("Add at least one task.");
        return;
    }

    saveButton.disabled = true;
    saveButton.textContent = "SAVING...";
    saveMessage.textContent = "";

    try {

        /*
         * One fixed document per date.
         * This prevents duplicate Master Plans
         * for the same day.
         */
        const planId = `${dateKey}_master`;

        const planRef = doc(
            db,
            "hybridMasterPlans",
            planId
        );

        await setDoc(
            planRef,
            {
                dateKey: dateKey,

                active: active.checked,

                priority: Number(
                    priority.value || 1
                ),

                tasks: tasks,

                updatedAt: serverTimestamp(),

                updatedBy: currentUser.uid,

                createdBy: currentUser.uid
            },
            {
                merge: true
            }
        );

        currentPlanId = planId;

        saveMessage.textContent =
            active.checked
                ? "Master Plan published successfully."
                : "Master Plan saved as draft.";

    } catch (error) {

        console.error(
            "MASTER PLAN SAVE ERROR:",
            error
        );

        saveMessage.textContent =
            error.message ||
            "Could not save Master Plan.";

    } finally {

        saveButton.disabled = false;

        saveButton.textContent =
            "SAVE MASTER PLAN";
    }
}

/* =========================================================
   STATUS
========================================================= */

function updateStatus() {

    const isActive =
        active.checked;


    statusDot.classList.toggle(
        "active",
        isActive
    );


    statusText.textContent =
        isActive
            ? "ACTIVE"
            : "INACTIVE";

}


/* =========================================================
   APP
========================================================= */

function showApp() {

    app.classList.remove(
        "hidden"
    );


    setTimeout(
        () => {

            loader.classList.add(
                "hidden"
            );

        },
        150
    );

}


/* =========================================================
   HELPERS
========================================================= */

function generateTaskId() {

    return (
        "task_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .slice(2, 8)
    );

}


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

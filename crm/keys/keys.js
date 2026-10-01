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
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


/* =========================================================
   CONFIG
========================================================= */

const ALLOWED_EMAIL =
    "zenovaeducations@gmail.com";

const CONFIG_COLLECTION =
    "systemConfig";

const CONFIG_DOCUMENT =
    "zoom";


/* =========================================================
   DOM
========================================================= */

const userEmail =
    document.getElementById(
        "userEmail"
    );

const form =
    document.getElementById(
        "keysForm"
    );

const message =
    document.getElementById(
        "message"
    );

const saveButton =
    document.getElementById(
        "saveButton"
    );

const saveText =
    document.getElementById(
        "saveText"
    );


const accountId =
    document.getElementById(
        "accountId"
    );

const s2sClientId =
    document.getElementById(
        "s2sClientId"
    );

const s2sClientSecret =
    document.getElementById(
        "s2sClientSecret"
    );

const meetingSdkClientId =
    document.getElementById(
        "meetingSdkClientId"
    );

const meetingSdkClientSecret =
    document.getElementById(
        "meetingSdkClientSecret"
    );


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(
    text,
    type = ""
) {

    message.textContent =
        text;

    message.className =
        "message";

    if (type) {

        message.classList.add(
            type
        );

    }

}


/* =========================================================
   ACCESS DENIED
========================================================= */

function denyAccess() {

    document.body.innerHTML = `
        <div style="
            min-height:100vh;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:30px;
            background:#f5f7fb;
            font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
        ">

            <div style="
                width:min(430px,100%);
                background:white;
                border:1px solid #e5e7eb;
                border-radius:20px;
                padding:35px;
                text-align:center;
                box-shadow:0 15px 40px rgba(0,0,0,.06);
            ">

                <div style="
                    width:58px;
                    height:58px;
                    margin:0 auto 18px;
                    border-radius:16px;
                    background:#fef2f2;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:26px;
                ">
                    🔒
                </div>

                <h2 style="
                    margin:0;
                    color:#111827;
                    font-size:21px;
                ">
                    Access Denied
                </h2>

                <p style="
                    margin:10px 0 0;
                    color:#6b7280;
                    font-size:14px;
                    line-height:21px;
                ">
                    You are not authorized to access
                    Zenova Developer Settings.
                </p>

            </div>

        </div>
    `;

}


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.replace(
                "../../account/login/"
            );

            return;

        }


        const email =
            String(
                user.email || ""
            )
            .trim()
            .toLowerCase();


        userEmail.textContent =
            user.email || "";


        if (
            email !==
            ALLOWED_EMAIL
        ) {

            denyAccess();

            return;

        }


        await loadKeys();

    }
);


/* =========================================================
   LOAD KEYS
========================================================= */

async function loadKeys() {

    try {

        const configRef =
            doc(
                db,
                CONFIG_COLLECTION,
                CONFIG_DOCUMENT
            );


        const snapshot =
            await getDoc(
                configRef
            );


        if (
            !snapshot.exists()
        ) {

            showMessage(
                "No Zoom configuration saved yet."
            );

            return;

        }


        const data =
            snapshot.data();


        accountId.value =
            data.accountId ||
            "";

        s2sClientId.value =
            data.s2sClientId ||
            "";

        s2sClientSecret.value =
            data.s2sClientSecret ||
            "";

        meetingSdkClientId.value =
            data.meetingSdkClientId ||
            "";

        meetingSdkClientSecret.value =
            data.meetingSdkClientSecret ||
            "";


        showMessage(
            "Existing Zoom configuration loaded."
        );

    }

    catch (error) {

        console.error(
            "Load Zoom configuration error:",
            error
        );


        showMessage(
            "Unable to load configuration. Check Firestore permissions.",
            "error"
        );

    }

}


/* =========================================================
   SAVE KEYS
========================================================= */

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const user =
            auth.currentUser;


        if (!user) {

            showMessage(
                "Please log in again.",
                "error"
            );

            return;

        }


        const email =
            String(
                user.email || ""
            )
            .trim()
            .toLowerCase();


        if (
            email !==
            ALLOWED_EMAIL
        ) {

            denyAccess();

            return;

        }


        const values = {

            accountId:
                accountId.value.trim(),

            s2sClientId:
                s2sClientId.value.trim(),

            s2sClientSecret:
                s2sClientSecret.value.trim(),

            meetingSdkClientId:
                meetingSdkClientId.value.trim(),

            meetingSdkClientSecret:
                meetingSdkClientSecret.value.trim()

        };


        if (
            !values.accountId ||
            !values.s2sClientId ||
            !values.s2sClientSecret ||
            !values.meetingSdkClientId ||
            !values.meetingSdkClientSecret
        ) {

            showMessage(
                "Please enter all five Zoom credentials.",
                "error"
            );

            return;

        }


        saveButton.disabled =
            true;

        saveText.textContent =
            "Saving...";

        showMessage("");


        try {

            const configRef =
                doc(
                    db,
                    CONFIG_COLLECTION,
                    CONFIG_DOCUMENT
                );


            await setDoc(
                configRef,
                {

                    accountId:
                        values.accountId,

                    s2sClientId:
                        values.s2sClientId,

                    s2sClientSecret:
                        values.s2sClientSecret,

                    meetingSdkClientId:
                        values.meetingSdkClientId,

                    meetingSdkClientSecret:
                        values.meetingSdkClientSecret,

                    updatedAt:
                        serverTimestamp(),

                    updatedBy:
                        user.email

                },
                {
                    merge: true
                }
            );


            showMessage(
                "Zoom configuration saved successfully.",
                "success"
            );

        }

        catch (error) {

            console.error(
                "Save Zoom configuration error:",
                error
            );


            showMessage(
                error?.message ||
                "Unable to save Zoom configuration.",
                "error"
            );

        }

        finally {

            saveButton.disabled =
                false;

            saveText.textContent =
                "Save Zoom Configuration";

        }

    }
);


/* =========================================================
   SHOW / HIDE
========================================================= */

document
    .querySelectorAll(
        ".copy-toggle"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const target =
                        document.getElementById(
                            button.dataset.target
                        );


                    if (
                        target.type ===
                        "password"
                    ) {

                        target.type =
                            "text";

                        button.textContent =
                            "Hide";

                    } else {

                        target.type =
                            "password";

                        button.textContent =
                            "Show";

                    }

                }
            );

        }
    );

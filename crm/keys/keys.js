import {
    auth
} from "../../firebase/firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFunctions,
    httpsCallable
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-functions.js";


const ALLOWED_EMAIL =
    "zenovaeducations@gmail.com";


const functions =
    getFunctions(
        undefined,
        "asia-south1"
    );


const saveZoomConfig =
    httpsCallable(
        functions,
        "saveZoomConfig"
    );


const getZoomConfig =
    httpsCallable(
        functions,
        "getZoomConfig"
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

const userEmail =
    document.getElementById(
        "userEmail"
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


function denyAccess() {

    document.body.innerHTML = `
        <div style="
            min-height:100vh;
            display:flex;
            align-items:center;
            justify-content:center;
            font-family:Arial,sans-serif;
            background:#f5f7fb;
        ">

            <div style="
                background:white;
                padding:40px;
                border-radius:20px;
                text-align:center;
                box-shadow:0 10px 40px rgba(0,0,0,.08);
            ">

                <h2>Access Denied</h2>

                <p>
                    You are not authorized to access this page.
                </p>

            </div>

        </div>
    `;

}


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


async function loadKeys() {

    try {

        showMessage(
            "Checking Firestore configuration..."
        );


        const result =
            await getZoomConfig();


        const data =
            result.data ||
            {};


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
            "Firestore configuration loaded.",
            "success"
        );

    }

    catch (error) {

        console.error(
            error
        );


        if (
            error?.code ===
            "functions/not-found"
        ) {

            showMessage(
                "Zoom configuration has not been saved yet.",
                "error"
            );

        } else {

            showMessage(
                error?.message ||
                "Unable to check Firestore configuration.",
                "error"
            );

        }

    }

}


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


        const data = {

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
            !data.accountId ||
            !data.s2sClientId ||
            !data.s2sClientSecret ||
            !data.meetingSdkClientId ||
            !data.meetingSdkClientSecret
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
            "Saving to Firestore...";


        try {

            const result =
                await saveZoomConfig(
                    data
                );


            if (
                result.data?.success
            ) {

                showMessage(
                    "Zoom keys saved successfully to Firestore.",
                    "success"
                );

            } else {

                throw new Error(
                    "Firestore save failed."
                );

            }

        }

        catch (error) {

            console.error(
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

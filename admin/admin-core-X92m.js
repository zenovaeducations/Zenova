/* ============================================================
   ZENOVA ADMIN DASHBOARD
   TESTING VERSION

   IMPORTANT:
   Admin authentication is intentionally NOT enabled yet.
   This will be added before production.

   Firebase connection is checked here so the dashboard
   foundation is ready for the real Admin modules.
============================================================ */


import {
    db
} from "../firebase/firebase-config.js";

import {
    collection,
    limit,
    query,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";



/* ============================================================
   FIREBASE STATUS
============================================================ */

const firebaseStatus =
    document.getElementById(
        "firebaseStatus"
    );


const firebaseStatusDot =
    document.getElementById(
        "firebaseStatusDot"
    );


async function checkFirebase() {

    try {

        /*
         * We perform a very small read.
         * This verifies that the Firebase
         * Firestore connection is reachable.
         *
         * We don't depend on any fake document.
         */

        const q =
            query(
                collection(
                    db,
                    "homeBanners"
                ),
                limit(1)
            );


        await getDocs(q);


        firebaseStatus.textContent =
            "CONNECTED";


        firebaseStatus.classList.add(
            "ready"
        );


        firebaseStatusDot.classList.add(
            "status-ready"
        );


    } catch (error) {

        console.error(
            "Firebase connection:",
            error
        );


        firebaseStatus.textContent =
            "CHECK FAILED";


        firebaseStatusDot.classList.remove(
            "status-ready"
        );

    }

}


checkFirebase();



/* ============================================================
   MOBILE SIDEBAR
============================================================ */

const sidebar =
    document.getElementById(
        "sidebar"
    );


const mobileMenuButton =
    document.getElementById(
        "mobileMenuButton"
    );


if (
    mobileMenuButton
) {

    mobileMenuButton.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

        }
    );

}


/*
 * Close the mobile sidebar when
 * a navigation link is selected.
 */

document
    .querySelectorAll(
        ".nav-item"
    )
    .forEach(
        item => {

            item.addEventListener(
                "click",
                () => {

                    sidebar.classList.remove(
                        "open"
                    );

                }
            );

        }
    );

/* ============================================================
   ZENOVA PURCHASE SUCCESS EXPERIENCE
============================================================ */


/* ============================================================
   URL
============================================================ */

const params =
    new URLSearchParams(
        window.location.search
    );


const batchId =
    params.get("id");


/* ============================================================
   ELEMENTS
============================================================ */

const introScene =
    document.getElementById(
        "introScene"
    );


const brandScene =
    document.getElementById(
        "brandScene"
    );


const messageScene =
    document.getElementById(
        "messageScene"
    );


const batchScene =
    document.getElementById(
        "batchScene"
    );


const batchName =
    document.getElementById(
        "batchName"
    );


const batchSubtitle =
    document.getElementById(
        "batchSubtitle"
    );


const continueButton =
    document.getElementById(
        "continueButton"
    );


const canvas =
    document.getElementById(
        "particleCanvas"
    );


const ctx =
    canvas.getContext(
        "2d"
    );


/* ============================================================
   PARTICLES
============================================================ */

let particles = [];

let animationFrame;

let width = 0;

let height = 0;



function resizeCanvas() {

    const ratio =
        Math.min(
            window.devicePixelRatio || 1,
            2
        );


    width =
        window.innerWidth;


    height =
        window.innerHeight;


    canvas.width =
        width * ratio;


    canvas.height =
        height * ratio;


    canvas.style.width =
        width + "px";


    canvas.style.height =
        height + "px";


    ctx.setTransform(
        ratio,
        0,
        0,
        ratio,
        0,
        0
    );

}


window.addEventListener(
    "resize",
    resizeCanvas
);


resizeCanvas();



/* ============================================================
   PAPER BLAST
============================================================ */

function createPaperBlast() {

    particles = [];


    const count =
        window.innerWidth < 600
            ? 110
            : 180;


    const centerX =
        width / 2;


    const centerY =
        height / 2;


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const angle =
            Math.random() *
            Math.PI *
            2;


        const speed =
            2.5 +
            Math.random() *
            10;


        const size =
            2 +
            Math.random() *
            7;


        particles.push({

            x:
                centerX,

            y:
                centerY,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            size,

            rotation:
                Math.random() *
                Math.PI *
                2,

            rotationSpeed:
                (
                    Math.random() -
                    .5
                ) *
                .25,

            gravity:
                .025 +
                Math.random() *
                .05,

            life:
                1,

            decay:
                .006 +
                Math.random() *
                .008

        });

    }


    if (
        !animationFrame
    ) {

        animateParticles();

    }

}


function animateParticles() {

    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    particles =
        particles.filter(
            particle =>
                particle.life > 0
        );


    particles.forEach(
        particle => {

            particle.x +=
                particle.vx;


            particle.y +=
                particle.vy;


            particle.vy +=
                particle.gravity;


            particle.rotation +=
                particle.rotationSpeed;


            particle.life -=
                particle.decay;


            ctx.save();


            ctx.translate(
                particle.x,
                particle.y
            );


            ctx.rotate(
                particle.rotation
            );


            ctx.globalAlpha =
                Math.max(
                    particle.life,
                    0
                );


            /*
             * Paper-like white pieces.
             */

            ctx.fillStyle =
                "#ffffff";


            ctx.fillRect(
                -particle.size / 2,
                -particle.size / 3,
                particle.size,
                particle.size * .65
            );


            ctx.restore();

        }
    );


    if (
        particles.length
    ) {

        animationFrame =
            requestAnimationFrame(
                animateParticles
            );

    } else {

        animationFrame =
            null;

    }

}



/* ============================================================
   SCENE TRANSITIONS
============================================================ */

function showScene(
    scene
) {

    scene.classList.remove(
        "hidden"
    );

}



/* ============================================================
   LOAD BATCH INFORMATION
============================================================ */

async function loadBatchInfo() {

    /*
     * The success animation itself does not depend
     * on Firestore.
     *
     * We can read the batch information from the
     * URL/localStorage temporarily.
     *
     * Once the real purchase system is connected,
     * this will be replaced by the confirmed
     * purchase record.
     */

    const storedTitle =
        sessionStorage.getItem(
            "zenovaPurchasedBatchTitle"
        );


    const storedSubtitle =
        sessionStorage.getItem(
            "zenovaPurchasedBatchSubtitle"
        );


    batchName.textContent =
        storedTitle ||
        "Your New Learning Journey";


    batchSubtitle.textContent =
        storedSubtitle ||
        "Your learning experience starts now.";

}



/* ============================================================
   MAIN ANIMATION
============================================================ */

async function startExperience() {

    /*
     * 0–2.1 sec
     *
     * Z animation
     */

    setTimeout(
        () => {

            createPaperBlast();

        },
        1500
    );


    /*
     * 2.1 sec
     *
     * ZENOVA
     */

    setTimeout(
        () => {

            introScene.classList.add(
                "hidden"
            );


            showScene(
                brandScene
            );

        },
        2100
    );


    /*
     * 4.3 sec
     *
     * ZENOVITES
     */

    setTimeout(
        () => {

            brandScene.classList.add(
                "hidden"
            );


            showScene(
                messageScene
            );

            createPaperBlast();

        },
        4300
    );


    /*
     * 7 sec
     *
     * Batch reveal
     */

    setTimeout(
        () => {

            messageScene.classList.add(
                "hidden"
            );


            showScene(
                batchScene
            );

        },
        7000
    );

}



/* ============================================================
   CONTINUE
============================================================ */

continueButton.addEventListener(
    "click",
    () => {

        /*
         * Later this will go directly to
         * the purchased batch study dashboard.
         */

        if (
            batchId
        ) {

            window.location.href =
                `../../../study/?id=${encodeURIComponent(
                    batchId
                )}`;

        } else {

            window.location.href =
                "../../../";

        }

    }
);



/* ============================================================
   START
============================================================ */

loadBatchInfo();

startExperience();

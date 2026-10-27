/* =========================================================
   DOM ELEMENTS
========================================================= */

const header =
    document.getElementById("header");

const navMenu =
    document.getElementById("navMenu");

const menuButton =
    document.getElementById("menuButton");

const themeButton =
    document.getElementById("themeButton");

const themeIcon =
    document.getElementById("themeIcon");

const scrollProgress =
    document.getElementById("scrollProgress");

const backTop =
    document.getElementById("backTop");

const currentYear =
    document.getElementById("currentYear");

const mouseGlow =
    document.getElementById("mouseGlow");

const navLinks =
    document.querySelectorAll(".nav-link");

const sections =
    document.querySelectorAll("section[id]");

const glassCards =
    document.querySelectorAll(".glass-card");



/* =========================================================
   CURRENT YEAR
========================================================= */

if (currentYear) {

    currentYear.textContent =
        new Date().getFullYear();
}



/* =========================================================
   AUTOMATIC DAY / NIGHT THEME

   Visitor local device time:

   06:00 AM - 05:59 PM = Light Mode
   06:00 PM - 05:59 AM = Dark Mode

   Manual theme selection works until page refresh.
========================================================= */

let manualThemeOverride =
    false;



function getAutomaticTheme() {

    const currentHour =
        new Date().getHours();


    if (
        currentHour >= 18 ||
        currentHour < 6
    ) {

        return "dark";
    }


    return "light";
}



/* =========================================================
   THREE.JS VARIABLES
========================================================= */

let threeRenderer =
    null;

let threeScene =
    null;

let threeCamera =
    null;

let particleSystem =
    null;

let particleMaterial =
    null;

let secondaryParticleMaterial =
    null;

let secondaryParticleSystem =
    null;

let threeMouseX =
    0;

let threeMouseY =
    0;

let threeAnimationFrame =
    null;



/* =========================================================
   APPLY THEME
========================================================= */

function setTheme(theme) {

    const light =
        theme === "light";


    document.body.classList.toggle(
        "light-theme",
        light
    );


    if (themeIcon) {

        themeIcon.textContent =
            light
                ? "☾"
                : "☀";
    }


    if (themeButton) {

        themeButton.setAttribute(
            "title",
            light
                ? "Switch to Dark Mode"
                : "Switch to Light Mode"
        );


        themeButton.setAttribute(
            "aria-label",
            light
                ? "Switch to dark mode"
                : "Switch to light mode"
        );
    }


    updateThreeTheme(theme);
}



/* =========================================================
   AUTOMATIC THEME
========================================================= */

function applyAutomaticTheme() {

    if (manualThemeOverride) {
        return;
    }


    setTheme(
        getAutomaticTheme()
    );
}



/* APPLY IMMEDIATELY */

applyAutomaticTheme();



/* =========================================================
   MANUAL THEME BUTTON
========================================================= */

if (themeButton) {

    themeButton.addEventListener(
        "click",
        () => {

            manualThemeOverride =
                true;


            const currentlyLight =
                document.body
                    .classList
                    .contains(
                        "light-theme"
                    );


            setTheme(
                currentlyLight
                    ? "dark"
                    : "light"
            );
        }
    );
}



/* =========================================================
   CHECK THE TIME EVERY MINUTE
========================================================= */

setInterval(
    applyAutomaticTheme,
    60000
);



/* =========================================================
   HEADER
========================================================= */

function updateHeader() {

    if (!header) {
        return;
    }


    header.classList.toggle(
        "scrolled",
        window.scrollY > 30
    );
}


window.addEventListener(
    "scroll",
    updateHeader,
    {
        passive: true
    }
);


updateHeader();



/* =========================================================
   MOBILE MENU
========================================================= */

function toggleMenu() {

    if (
        !navMenu ||
        !menuButton
    ) {

        return;
    }


    navMenu.classList.toggle(
        "open"
    );


    menuButton.classList.toggle(
        "active"
    );


    document.body.classList.toggle(
        "menu-open"
    );
}



function closeMenu() {

    if (
        !navMenu ||
        !menuButton
    ) {

        return;
    }


    navMenu.classList.remove(
        "open"
    );


    menuButton.classList.remove(
        "active"
    );


    document.body.classList.remove(
        "menu-open"
    );
}



if (menuButton) {

    menuButton.addEventListener(
        "click",
        toggleMenu
    );
}



navLinks.forEach(
    (link) => {

        link.addEventListener(
            "click",
            closeMenu
        );
    }
);



/* =========================================================
   SCROLL PROGRESS
========================================================= */

function updateScrollProgress() {

    if (!scrollProgress) {
        return;
    }


    const maxScroll =
        document.documentElement.scrollHeight -
        window.innerHeight;


    const percentage =
        maxScroll > 0
            ? (
                window.scrollY /
                maxScroll
            ) * 100
            : 0;


    scrollProgress.style.width =
        `${percentage}%`;
}


window.addEventListener(
    "scroll",
    updateScrollProgress,
    {
        passive: true
    }
);


updateScrollProgress();



/* =========================================================
   ACTIVE NAVIGATION
========================================================= */

function updateActiveNavigation() {

    let current =
        "home";


    const point =
        window.scrollY + 240;


    sections.forEach(
        (section) => {

            if (
                point >=
                section.offsetTop
            ) {

                current =
                    section.id;
            }
        }
    );


    navLinks.forEach(
        (link) => {

            const href =
                link.getAttribute("href");


            if (!href) {
                return;
            }


            const target =
                href.replace(
                    "#",
                    ""
                );


            link.classList.toggle(
                "active",
                target === current
            );
        }
    );
}


window.addEventListener(
    "scroll",
    updateActiveNavigation,
    {
        passive: true
    }
);


window.addEventListener(
    "resize",
    updateActiveNavigation
);


updateActiveNavigation();



/* =========================================================
   SMOOTH INTERNAL LINKS
========================================================= */

document
    .querySelectorAll(
        'a[href^="#"]'
    )
    .forEach(
        (anchor) => {

            anchor.addEventListener(
                "click",
                function (event) {

                    const targetId =
                        this.getAttribute(
                            "href"
                        );


                    if (
                        !targetId ||
                        targetId === "#"
                    ) {

                        return;
                    }


                    const target =
                        document.querySelector(
                            targetId
                        );


                    if (!target) {
                        return;
                    }


                    event.preventDefault();


                    target.scrollIntoView({

                        behavior:
                            "smooth",

                        block:
                            "start"
                    });
                }
            );
        }
    );



/* =========================================================
   GLASS CARD CURSOR LIGHT
========================================================= */

glassCards.forEach(
    (card) => {

        card.addEventListener(
            "mousemove",
            (event) => {

                const rect =
                    card.getBoundingClientRect();


                const x =
                    event.clientX -
                    rect.left;


                const y =
                    event.clientY -
                    rect.top;


                card.style.setProperty(
                    "--mouse-x",
                    `${
                        (
                            x /
                            rect.width
                        ) * 100
                    }%`
                );


                card.style.setProperty(
                    "--mouse-y",
                    `${
                        (
                            y /
                            rect.height
                        ) * 100
                    }%`
                );
            }
        );
    }
);



/* =========================================================
   GLOBAL MOUSE GLOW
========================================================= */

if (mouseGlow) {

    document.addEventListener(
        "mousemove",
        (event) => {

            if (
                window.innerWidth <= 680
            ) {

                return;
            }


            mouseGlow.style.left =
                `${event.clientX}px`;


            mouseGlow.style.top =
                `${event.clientY}px`;


            mouseGlow.style.opacity =
                "1";
        }
    );


    document.addEventListener(
        "mouseleave",
        () => {

            mouseGlow.style.opacity =
                "0";
        }
    );
}



/* =========================================================
   BACK TO TOP
========================================================= */

function updateBackTop() {

    if (!backTop) {
        return;
    }


    backTop.classList.toggle(
        "visible",
        window.scrollY > 700
    );
}


window.addEventListener(
    "scroll",
    updateBackTop,
    {
        passive: true
    }
);


if (backTop) {

    backTop.addEventListener(
        "click",
        () => {

            window.scrollTo({

                top: 0,

                behavior:
                    "smooth"
            });
        }
    );
}



/* =========================================================
   GSAP
========================================================= */

function initializeGSAP() {

    /* -----------------------------------------------------
       FALLBACK

       If GSAP does not load because of internet/CDN issues,
       content must still remain visible.
    ----------------------------------------------------- */

    if (
        typeof gsap === "undefined"
    ) {

        document
            .querySelectorAll(
                ".hero-gsap, .hero-profile-gsap, .gsap-section, .glass-card"
            )
            .forEach(
                (element) => {

                    element.style.opacity =
                        "1";

                    element.style.transform =
                        "none";
                }
            );


        return;
    }



    const reducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;


    if (reducedMotion) {

        gsap.set(
            [
                ".hero-gsap",
                ".hero-profile-gsap",
                ".section-heading",
                ".glass-card"
            ],
            {

                opacity:
                    1,

                clearProps:
                    "transform"
            }
        );


        return;
    }



    /* =====================================================
       SCROLLTRIGGER CHECK

       If ScrollTrigger fails to load, only use animations
       that do not depend on scrolling.
    ====================================================== */

    const scrollTriggerAvailable =
        typeof ScrollTrigger !==
        "undefined";


    if (
        scrollTriggerAvailable
    ) {

        gsap.registerPlugin(
            ScrollTrigger
        );
    }



    /* =====================================================
       HERO INTRO
    ====================================================== */

    const heroElements =
        document.querySelectorAll(
            ".hero-gsap"
        );


    if (
        heroElements.length
    ) {

        gsap.fromTo(
            heroElements,

            {

                y:
                    34,

                opacity:
                    0
            },

            {

                y:
                    0,

                opacity:
                    1,

                duration:
                    .85,

                stagger:
                    .11,

                ease:
                    "power3.out",

                clearProps:
                    "transform"
            }
        );
    }



    const heroProfile =
        document.querySelector(
            ".hero-profile-gsap"
        );


    if (heroProfile) {

        gsap.fromTo(
            heroProfile,

            {

                x:
                    55,

                opacity:
                    0
            },

            {

                x:
                    0,

                opacity:
                    1,

                duration:
                    1,

                delay:
                    .32,

                ease:
                    "power3.out",

                clearProps:
                    "transform"
            }
        );
    }



    /* =====================================================
       PROFILE LOGOS

       Smooth GSAP movement.
       Profile photo/card themselves stay completely stable.
    ====================================================== */

    const floatingBC =
        document.querySelector(
            ".floating-logo-bc"
        );


    if (floatingBC) {

        gsap.to(
            floatingBC,
            {

                y:
                    -5,

                x:
                    1,

                duration:
                    3.8,

                ease:
                    "sine.inOut",

                repeat:
                    -1,

                yoyo:
                    true
            }
        );
    }



    const floatingAzure =
        document.querySelector(
            ".floating-logo-azure"
        );


    if (floatingAzure) {

        gsap.to(
            floatingAzure,
            {

                y:
                    5,

                x:
                    -1,

                duration:
                    4.4,

                ease:
                    "sine.inOut",

                repeat:
                    -1,

                yoyo:
                    true
            }
        );
    }



    const floatingNAV =
        document.querySelector(
            ".floating-logo-nav"
        );


    if (floatingNAV) {

        gsap.to(
            floatingNAV,
            {

                y:
                    4,

                x:
                    1,

                duration:
                    4.1,

                ease:
                    "sine.inOut",

                repeat:
                    -1,

                yoyo:
                    true
            }
        );
    }



    /* =====================================================
       IF SCROLLTRIGGER DID NOT LOAD

       Keep all scroll content visible.
    ====================================================== */

    if (
        !scrollTriggerAvailable
    ) {

        gsap.set(
            [
                ".section-heading",
                "#about .glass-card",
                ".stagger-group > *",
                ".education-card",
                ".contact-card"
            ],
            {

                opacity:
                    1,

                clearProps:
                    "transform"
            }
        );


        return;
    }



    /* =====================================================
       SECTION HEADINGS

       ONE animation per heading.
    ====================================================== */

    document
        .querySelectorAll(
            ".gsap-section .section-heading"
        )
        .forEach(
            (heading) => {

                gsap.fromTo(
                    heading,

                    {

                        y:
                            40,

                        opacity:
                            0
                    },

                    {

                        y:
                            0,

                        opacity:
                            1,

                        duration:
                            .9,

                        ease:
                            "power3.out",

                        clearProps:
                            "transform",

                        scrollTrigger: {

                            trigger:
                                heading,

                            start:
                                "top 88%",

                            once:
                                true
                        }
                    }
                );
            }
        );



    /* =====================================================
       ABOUT

       Important fix:
       These cards are animated ONLY HERE.
       No duplicate GSAP animation.
    ====================================================== */

    const aboutCards =
        document.querySelectorAll(
            "#about .glass-card"
        );


    if (
        aboutCards.length
    ) {

        gsap.fromTo(
            aboutCards,

            {

                y:
                    42,

                opacity:
                    0
            },

            {

                y:
                    0,

                opacity:
                    1,

                duration:
                    .85,

                stagger:
                    .14,

                ease:
                    "power3.out",

                clearProps:
                    "transform",

                scrollTrigger: {

                    trigger:
                        "#about .about-layout",

                    start:
                        "top 86%",

                    once:
                        true
                }
            }
        );
    }



    /* =====================================================
       STAGGER GROUPS

       Approach
       Skills
       Projects
       Achievements
       Certifications

       Each item gets ONE animation only.
    ====================================================== */

    document
        .querySelectorAll(
            ".stagger-group"
        )
        .forEach(
            (group) => {

                const children =
                    Array.from(
                        group.children
                    );


                if (
                    !children.length
                ) {

                    return;
                }


                gsap.fromTo(
                    children,

                    {

                        y:
                            42,

                        opacity:
                            0
                    },

                    {

                        y:
                            0,

                        opacity:
                            1,

                        duration:
                            .82,

                        stagger:
                            .09,

                        ease:
                            "power3.out",

                        clearProps:
                            "transform",

                        scrollTrigger: {

                            trigger:
                                group,

                            start:
                                "top 86%",

                            once:
                                true
                        }
                    }
                );
            }
        );



    /* =====================================================
       EDUCATION

       Only ONE animation.
    ====================================================== */

    const educationCard =
        document.querySelector(
            ".education-card"
        );


    if (
        educationCard
    ) {

        gsap.fromTo(
            educationCard,

            {

                y:
                    38,

                scale:
                    .985,

                opacity:
                    0
            },

            {

                y:
                    0,

                scale:
                    1,

                opacity:
                    1,

                duration:
                    .9,

                ease:
                    "power3.out",

                clearProps:
                    "transform",

                scrollTrigger: {

                    trigger:
                        educationCard,

                    start:
                        "top 88%",

                    once:
                        true
                }
            }
        );
    }



    /* =====================================================
       CONTACT

       Only ONE animation.
    ====================================================== */

    const contactCard =
        document.querySelector(
            ".contact-card"
        );


    if (
        contactCard
    ) {

        gsap.fromTo(
            contactCard,

            {

                y:
                    38,

                scale:
                    .985,

                opacity:
                    0
            },

            {

                y:
                    0,

                scale:
                    1,

                opacity:
                    1,

                duration:
                    .95,

                ease:
                    "power3.out",

                clearProps:
                    "transform",

                scrollTrigger: {

                    trigger:
                        contactCard,

                    start:
                        "top 88%",

                    once:
                        true
                }
            }
        );
    }



    /* =====================================================
       REFRESH SCROLLTRIGGER

       Important after images/layout are loaded.
    ====================================================== */

    requestAnimationFrame(
        () => {

            ScrollTrigger.refresh();
        }
    );
}



/* =========================================================
   THREE.JS / WEBGL
========================================================= */

function initializeThreeJS() {

    const canvas =
        document.getElementById(
            "threeCanvas"
        );


    if (
        !canvas ||
        typeof THREE === "undefined"
    ) {

        return;
    }



    const reducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;



    /* =====================================================
       SCENE
    ====================================================== */

    threeScene =
        new THREE.Scene();



    /* =====================================================
       CAMERA
    ====================================================== */

    threeCamera =
        new THREE.PerspectiveCamera(

            65,

            window.innerWidth /
            window.innerHeight,

            .1,

            100
        );


    threeCamera.position.z =
        5;



    /* =====================================================
       RENDERER
    ====================================================== */

    threeRenderer =
        new THREE.WebGLRenderer({

            canvas:
                canvas,

            alpha:
                true,

            antialias:
                false,

            powerPreference:
                "high-performance"
        }
    );


    threeRenderer.setSize(
        window.innerWidth,
        window.innerHeight,
        false
    );


    threeRenderer.setPixelRatio(

        Math.min(
            window.devicePixelRatio,
            1.5
        )
    );



    /* =====================================================
       MAIN PARTICLES
    ====================================================== */

    const particleCount =
        window.innerWidth <= 680
            ? 180
            : 520;


    const positions =
        new Float32Array(
            particleCount * 3
        );


    for (
        let i = 0;
        i < particleCount;
        i++
    ) {

        const index =
            i * 3;


        positions[index] =
            (
                Math.random() -
                .5
            ) * 12;


        positions[index + 1] =
            (
                Math.random() -
                .5
            ) * 8;


        positions[index + 2] =
            (
                Math.random() -
                .5
            ) * 7;
    }



    const geometry =
        new THREE.BufferGeometry();


    geometry.setAttribute(

        "position",

        new THREE.BufferAttribute(
            positions,
            3
        )
    );



    particleMaterial =
        new THREE.PointsMaterial({

            color:
                0x43dff1,

            size:
                window.innerWidth <= 680
                    ? .024
                    : .031,

            transparent:
                true,

            opacity:
                .48,

            depthWrite:
                false,

            blending:
                THREE.AdditiveBlending
        }
    );



    particleSystem =
        new THREE.Points(
            geometry,
            particleMaterial
        );


    threeScene.add(
        particleSystem
    );



    /* =====================================================
       SECOND PARTICLE CLOUD
    ====================================================== */

    const secondGeometry =
        geometry.clone();


    secondaryParticleMaterial =
        new THREE.PointsMaterial({

            color:
                0x8066ff,

            size:
                .018,

            transparent:
                true,

            opacity:
                .25,

            depthWrite:
                false,

            blending:
                THREE.AdditiveBlending
        }
    );


    secondaryParticleSystem =
        new THREE.Points(

            secondGeometry,

            secondaryParticleMaterial
        );


    secondaryParticleSystem.rotation.x =
        .75;


    secondaryParticleSystem.rotation.z =
        .30;


    threeScene.add(
        secondaryParticleSystem
    );



    /* =====================================================
       MOUSE
    ====================================================== */

    window.addEventListener(
        "mousemove",
        (event) => {

            threeMouseX =
                (
                    event.clientX /
                    window.innerWidth
                ) * 2 - 1;


            threeMouseY =
                -(
                    event.clientY /
                    window.innerHeight
                ) * 2 + 1;
        }
    );



    /* =====================================================
       ANIMATION
    ====================================================== */

    function animateThree() {

        threeAnimationFrame =
            requestAnimationFrame(
                animateThree
            );


        if (
            !particleSystem ||
            !threeRenderer ||
            !threeScene ||
            !threeCamera
        ) {

            return;
        }


        if (
            !reducedMotion
        ) {

            particleSystem.rotation.y +=
                .00022;


            secondaryParticleSystem.rotation.y -=
                .00012;


            const targetRotationX =
                threeMouseY *
                .045;


            const targetRotationY =
                threeMouseX *
                .065;


            particleSystem.rotation.x +=
                (
                    targetRotationX -
                    particleSystem.rotation.x
                ) *
                .003;


            particleSystem.rotation.y +=
                (
                    targetRotationY -
                    particleSystem.rotation.y
                ) *
                .002;
        }


        threeRenderer.render(
            threeScene,
            threeCamera
        );
    }


    animateThree();



    /* =====================================================
       THREE RESIZE
    ====================================================== */

    window.addEventListener(
        "resize",
        resizeThreeJS
    );



    updateThreeTheme(
        document.body
            .classList
            .contains(
                "light-theme"
            )
            ? "light"
            : "dark"
    );
}



/* =========================================================
   THREE.JS RESIZE
========================================================= */

function resizeThreeJS() {

    if (
        !threeCamera ||
        !threeRenderer
    ) {

        return;
    }


    threeCamera.aspect =
        window.innerWidth /
        window.innerHeight;


    threeCamera.updateProjectionMatrix();


    threeRenderer.setSize(
        window.innerWidth,
        window.innerHeight,
        false
    );


    threeRenderer.setPixelRatio(

        Math.min(
            window.devicePixelRatio,
            1.5
        )
    );
}



/* =========================================================
   THREE.JS THEME
========================================================= */

function updateThreeTheme(theme) {

    if (
        !particleMaterial
    ) {

        return;
    }


    if (
        theme === "light"
    ) {

        particleMaterial.color.set(
            0x168aa8
        );


        particleMaterial.opacity =
            .22;


        if (
            secondaryParticleMaterial
        ) {

            secondaryParticleMaterial.color.set(
                0x536ed9
            );


            secondaryParticleMaterial.opacity =
                .13;
        }

    } else {

        particleMaterial.color.set(
            0x43dff1
        );


        particleMaterial.opacity =
            .48;


        if (
            secondaryParticleMaterial
        ) {

            secondaryParticleMaterial.color.set(
                0x8066ff
            );


            secondaryParticleMaterial.opacity =
                .25;
        }
    }
}



/* =========================================================
   ESCAPE
========================================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape"
        ) {

            closeMenu();
        }
    }
);



/* =========================================================
   GENERAL RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        if (
            window.innerWidth > 1180
        ) {

            closeMenu();
        }


        updateActiveNavigation();
    }
);



/* =========================================================
   INITIAL LOAD
========================================================= */

window.addEventListener(
    "load",
    () => {

        updateHeader();

        updateScrollProgress();

        updateActiveNavigation();

        updateBackTop();


        /* THREE FIRST */

        initializeThreeJS();


        /* THEN GSAP */

        initializeGSAP();
    }
);
import "../styles/main.scss";

import {
    initTheme
} from "./theme";

import {
    initAnimations
} from "./animations";

import {
    initWebGL
} from "./webgl";

import {
    initProjectShowcase
} from "./project-showcase";



/* =========================================================
   ELEMENTS
========================================================= */

const header =
    document.getElementById(
        "siteHeader"
    );


const navLinksContainer =
    document.getElementById(
        "navLinks"
    );


const menuToggle =
    document.getElementById(
        "menuToggle"
    );


const scrollProgress =
    document.getElementById(
        "scrollProgress"
    );


const cursorGlow =
    document.getElementById(
        "cursorGlow"
    );


const backTop =
    document.getElementById(
        "backTop"
    );


const currentYear =
    document.getElementById(
        "currentYear"
    );


const navLinks =
    document.querySelectorAll<HTMLAnchorElement>(
        ".nav-link"
    );


const sections =
    document.querySelectorAll<HTMLElement>(
        "section[id]"
    );


const glassPanels =
    document.querySelectorAll<HTMLElement>(
        ".glass-panel"
    );


const companyMotionControl =
    document.getElementById("companyMotionToggle");

const companyTrack =
    document.getElementById("companyTrack");



/* =========================================================
   YEAR
========================================================= */

if (currentYear) {

    currentYear.textContent =
        new Date()
            .getFullYear()
            .toString();
}



/* =========================================================
   THEME FIRST
========================================================= */

initTheme();



/* =========================================================
   HEADER
========================================================= */

function updateHeader(): void {

    header?.classList.toggle(
        "scrolled",
        window.scrollY > 30
    );
}



/* =========================================================
   MENU
========================================================= */

function setMenuOpen(open: boolean): void {

    navLinksContainer?.classList.toggle("open", open);
    menuToggle?.classList.toggle("active", open);
    menuToggle?.setAttribute("aria-expanded", String(open));
    menuToggle?.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    document.body.classList.toggle("menu-open", open);
}



function toggleMenu(): void {

    setMenuOpen(!navLinksContainer?.classList.contains("open"));
}



function closeMenu(): void {

    setMenuOpen(false);
}



menuToggle?.addEventListener(
    "click",
    toggleMenu
);


document.addEventListener("click", (event) => {

    if (
        !window.matchMedia("(max-width: 1180px)").matches ||
        !navLinksContainer?.classList.contains("open") ||
        !(event.target instanceof Node) ||
        navLinksContainer.contains(event.target) ||
        menuToggle?.contains(event.target)
    ) {
        return;
    }

    closeMenu();
});


navLinks.forEach(
    (link) => {

        link.addEventListener(
            "click",
            closeMenu
        );
    }
);



/* =========================================================
   COMPANY SCROLLING
========================================================= */

companyMotionControl?.addEventListener("click", () => {

    if (!companyTrack) {
        return;
    }

    const paused =
        companyTrack.classList.toggle("is-paused");

    const label = paused
        ? "Resume company scrolling"
        : "Pause company scrolling";

    companyMotionControl.setAttribute("data-paused", String(paused));
    companyMotionControl.setAttribute("aria-label", label);
    companyMotionControl.setAttribute("title", label);
});



/* =========================================================
   SCROLL PROGRESS
========================================================= */

function updateScrollProgress(): void {

    if (!scrollProgress) {
        return;
    }


    const maxScroll =
        document.documentElement
            .scrollHeight -
        window.innerHeight;


    const progress =
        maxScroll > 0

            ? (
                window.scrollY /
                maxScroll
            ) * 100

            : 0;


    scrollProgress.style.width =
        `${progress}%`;
}



/* =========================================================
   ACTIVE NAV
========================================================= */

function updateActiveNav(): void {

    let current =
        "home";


    const point =
        (
            header?.getBoundingClientRect().bottom ??
            0
        ) + 120;


    sections.forEach(
        (section) => {

            if (
                section.getBoundingClientRect().top <=
                point
            ) {

                current =
                    section.id;
            }
        }
    );


    if (
        window.scrollY > 0 &&
        window.scrollY + window.innerHeight >=
            document.documentElement.scrollHeight - 2
    ) {

        current =
            sections[sections.length - 1]?.id ??
            current;
    }


    navLinks.forEach(
        (link) => {

            const target =
                link
                    .getAttribute(
                        "href"
                    )
                    ?.replace(
                        "#",
                        ""
                    );


            const active =
                target === current;


            link.classList.toggle(
                "active",
                active
            );


            if (active) {

                link.setAttribute(
                    "aria-current",
                    "location"
                );

            } else {

                link.removeAttribute(
                    "aria-current"
                );
            }
        }
    );
}



/* =========================================================
   BACK TOP
========================================================= */

function updateBackTop(): void {

    backTop?.classList.toggle(
        "visible",
        window.scrollY > 700
    );
}



backTop?.addEventListener(
    "click",
    () => {

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
);



/* =========================================================
   GLASS PANEL LIGHT
========================================================= */

glassPanels.forEach(
    (panel) => {

        panel.addEventListener(
            "mousemove",
            (event) => {

                const rect =
                    panel.getBoundingClientRect();


                const x =
                    event.clientX -
                    rect.left;


                const y =
                    event.clientY -
                    rect.top;


                panel.style.setProperty(
                    "--mouse-x",
                    `${
                        (
                            x /
                            rect.width
                        ) * 100
                    }%`
                );


                panel.style.setProperty(
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
   GLOBAL CURSOR LIGHT
========================================================= */

if (cursorGlow) {

    document.addEventListener(
        "mousemove",
        (event) => {

            if (
                window.innerWidth <= 680
            ) {

                return;
            }


            cursorGlow.style.left =
                `${event.clientX}px`;


            cursorGlow.style.top =
                `${event.clientY}px`;


            cursorGlow.style.opacity =
                "1";
        }
    );


    document.addEventListener(
        "mouseleave",
        () => {

            cursorGlow.style.opacity =
                "0";
        }
    );
}



/* =========================================================
   SMOOTH ANCHORS
========================================================= */

document
    .querySelectorAll<HTMLAnchorElement>(
        'a[href^="#"]'
    )
    .forEach(
        (anchor) => {

            anchor.addEventListener(
                "click",
                (event) => {

                    const targetId =
                        anchor.getAttribute(
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
                        behavior: "smooth",
                        block: "start"
                    });
                }
            );
        }
    );



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
   SCROLL
========================================================= */

window.addEventListener(
    "scroll",
    () => {

        updateHeader();

        updateScrollProgress();

        updateActiveNav();

        updateBackTop();
    },
    {
        passive: true
    }
);



/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        if (
            window.innerWidth >
            1180
        ) {

            closeMenu();
        }


        updateActiveNav();
    }
);



/* =========================================================
   INITIAL
========================================================= */

window.addEventListener(
    "load",
    updateActiveNav
);

window.addEventListener(
    "hashchange",
    updateActiveNav
);


updateHeader();

updateScrollProgress();

updateActiveNav();

updateBackTop();



/* =========================================================
   PROJECT SHOWCASE
========================================================= */

document.getElementById("projectShowcase")?.addEventListener("projectshowcasechange", () => {
    updateActiveNav();
    updateScrollProgress();
});

initProjectShowcase();

updateActiveNav();

updateScrollProgress();


/* =========================================================
   WEBGL
========================================================= */

try {

    initWebGL();

} catch (error) {

    console.warn(
        "WebGL background could not be initialized.",
        error
    );
}



/* =========================================================
   GSAP
========================================================= */

initAnimations();

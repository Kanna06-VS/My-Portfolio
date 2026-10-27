export type PortfolioTheme =
    "light" | "dark";


let manualThemeOverride =
    false;


function getAutomaticTheme(): PortfolioTheme {

    const hour =
        new Date().getHours();


    /*
        Visitor device local time:

        06:00 - 17:59 = Light
        18:00 - 05:59 = Dark
    */

    if (
        hour >= 18 ||
        hour < 6
    ) {

        return "dark";
    }


    return "light";
}



function applyTheme(
    theme: PortfolioTheme
): void {

    const light =
        theme === "light";


    document.body.classList.toggle(
        "light-theme",
        light
    );


    const themeIcon =
        document.getElementById(
            "themeIcon"
        );


    const themeToggle =
        document.getElementById(
            "themeToggle"
        );


    if (themeIcon) {

        themeIcon.textContent =
            light
                ? "☾"
                : "☀";
    }


    if (themeToggle) {

        themeToggle.removeAttribute("title");


        themeToggle.setAttribute(
            "aria-label",
            light
                ? "Switch to dark mode"
                : "Switch to light mode"
        );
    }

    const tooltip = document.getElementById("themeTooltip");
    const tooltipState = document.getElementById("themeTooltipState");
    const tooltipTitle = document.getElementById("themeTooltipTitle");
    const tooltipTime = document.getElementById("themeTooltipTime");
    const tooltipNote = document.getElementById("themeTooltipNote");
    if (tooltip) tooltip.dataset.mode = light ? "night" : "day";
    if (tooltipState) tooltipState.textContent = manualThemeOverride ? "Manual choice" : "Automatic theme";
    if (tooltipTitle) tooltipTitle.textContent = light ? "Switch to night mode" : "Switch to day mode";
    if (tooltipTime) tooltipTime.textContent = light ? "6:00 PM – 6:00 AM" : "6:00 AM – 6:00 PM";
    if (tooltipNote) tooltipNote.textContent = manualThemeOverride
        ? "Refresh to resume automatic changes."
        : "Changes automatically with the time. Click to switch now.";



    /* Tell WebGL that theme changed */

    window.dispatchEvent(
        new CustomEvent(
            "portfolio-theme-change",
            {
                detail: {
                    theme
                }
            }
        )
    );
}



function applyAutomaticTheme(): void {

    if (
        manualThemeOverride
    ) {

        return;
    }


    applyTheme(
        getAutomaticTheme()
    );
}



export function initTheme(): void {

    const themeToggle =
        document.getElementById(
            "themeToggle"
        );


    applyAutomaticTheme();

    const control = document.getElementById("themeControl");
    const tooltip = document.getElementById("themeTooltip");
    if (control && tooltip && themeToggle) {
        let pointerInside = false;
        let dismissed = false;

        const positionTooltip = (): void => {
            tooltip.style.setProperty("--theme-tooltip-shift", "0px");
            const bounds = tooltip.getBoundingClientRect();
            const shift = Math.max(0, 12 - bounds.left) + Math.min(0, window.innerWidth - 12 - bounds.right);
            tooltip.style.setProperty("--theme-tooltip-shift", `${shift}px`);
        };

        const setTooltipOpen = (open: boolean): void => {
            control.dataset.tooltipOpen = String(open);
            tooltip.setAttribute("aria-hidden", String(!open));
            if (open) positionTooltip();
        };

        control.addEventListener("pointerenter", (event) => {
            if (event.pointerType === "touch") return;
            pointerInside = true;
            dismissed = false;
            setTooltipOpen(true);
        });
        control.addEventListener("pointerleave", () => {
            pointerInside = false;
            if (!themeToggle.matches(":focus-visible") || dismissed) setTooltipOpen(false);
        });
        themeToggle.addEventListener("focus", () => {
            if (!themeToggle.matches(":focus-visible")) return;
            dismissed = false;
            setTooltipOpen(true);
        });
        themeToggle.addEventListener("blur", () => {
            if (!pointerInside || dismissed) setTooltipOpen(false);
        });
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                dismissed = true;
                setTooltipOpen(false);
            }
        });
        window.addEventListener("resize", () => {
            if (control.dataset.tooltipOpen === "true") positionTooltip();
        });
    }



    themeToggle?.addEventListener(
        "click",
        () => {

            manualThemeOverride =
                true;


            const light =
                document.body
                    .classList
                    .contains(
                        "light-theme"
                    );


            applyTheme(
                light
                    ? "dark"
                    : "light"
            );
        }
    );



    /*
        Re-check every minute.

        If page is open at 5:59 PM,
        night mode switches around 6:00 PM.
    */

    window.setInterval(
        applyAutomaticTheme,
        60000
    );
}

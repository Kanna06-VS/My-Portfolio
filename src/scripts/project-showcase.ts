import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type ProjectPhase = { arrival: number; readingStart: number; readingEnd: number };
type ReadingBookmark = { index: number; fraction: number; inside: boolean; below: boolean; scrollY: number; start: number; end: number };

/** Native page scrolling reads each project, then carries the track sideways. */
export function initProjectShowcase(): void {
    const root = document.getElementById("projectShowcase");
    if (!root || root.classList.contains("is-enhanced")) return;
    const clients = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-project-select]"));
    const panels = Array.from(root.querySelectorAll<HTMLElement>(".project-engagement"));
    const rail = root.querySelector<HTMLElement>(".project-client-list");
    const stage = root.querySelector<HTMLElement>(".project-detail-stage");
    const track = root.querySelector<HTMLElement>(".project-detail-track");
    const top = root.querySelector<HTMLElement>(".project-showcase-top");
    if (!clients.length || clients.length !== panels.length || !rail || !stage || !track || !top) return;
    const showcase = root;
    const reader = stage;
    const horizontalTrack = track;
    const indicator = root.querySelector<HTMLElement>("[data-project-indicator]");
    const counter = root.querySelector<HTMLElement>("[data-project-counter]");
    const steps = Array.from(root.querySelectorAll<HTMLElement>("[data-project-step]"));
    const status = root.querySelector<HTMLElement>(".project-showcase-status");
    const hint = root.querySelector<HTMLElement>(".project-scroll-hint");
    const hintLabel = root.querySelector<HTMLElement>("[data-project-scroll-label]");
    const header = document.getElementById("siteHeader");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    // The small viewport stays stable when a phone's address bar expands or hides.
    const viewportSizer = document.createElement("span");
    viewportSizer.setAttribute("aria-hidden", "true");
    viewportSizer.style.cssText = "position:fixed;top:0;left:0;display:block;width:0;height:100vh;visibility:hidden;pointer-events:none;overflow:hidden;";
    if (CSS.supports("height", "100svh")) viewportSizer.style.height = "100svh";
    document.body.append(viewportSizer);
    const viewportHeight = (): number => viewportSizer.getBoundingClientRect().height;
    let current = 0;
    let rebuilding = false;
    let story: ScrollTrigger | null = null;
    let timeline: gsap.core.Timeline | null = null;
    let jump: gsap.core.Tween | null = null;
    let linearTriggers: ScrollTrigger[] = [];
    let phases: ProjectPhase[] = [];
    let transitionMidpoints: number[] = [];
    let lastWidth = window.innerWidth;
    let lastViewportHeight = viewportHeight();
    let lastReaderHeight = 0;
    let resizeFrame = 0;
    let layoutDirty = false;
    let bookmark: ReadingBookmark | null = null;

    const pinTop = (): number => Math.ceil(header?.getBoundingClientRect().bottom ?? 80) + 12;
    const shouldPin = (): boolean => !reducedMotion.matches &&
        viewportHeight() >= (window.innerWidth > 900 ? 640 : 480);
    const stopJump = (): void => { jump?.kill(); jump = null; };

    function moveIndicator(animate = false): void {
        if (!indicator) return;
        gsap.killTweensOf(indicator);
        const position = { y: clients[current].offsetTop, height: clients[current].offsetHeight };
        if (animate && !reducedMotion.matches) gsap.to(indicator, { ...position, duration: 0.25, ease: "power2.out" });
        else gsap.set(indicator, position);
    }

    function setActive(index: number, announce = false, force = false): void {
        if (rebuilding || (!force && index === current)) return;
        current = index;
        const horizontal = showcase.classList.contains("is-scroll-driven");
        panels.forEach((panel, position) => {
            const active = position === index;
            panel.hidden = false;
            panel.inert = horizontal && !active;
            panel.setAttribute("aria-hidden", String(horizontal && !active));
            panel.classList.toggle("is-active", active);
            clients[position].classList.toggle("is-active", active);
            clients[position].setAttribute("aria-pressed", String(active));
        });
        steps.forEach((step, position) => {
            step.classList.toggle("is-active", position === index);
            step.classList.toggle("is-complete", position < index);
        });
        if (counter) counter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(panels.length).padStart(2, "0")}`;
        if (hintLabel) hintLabel.textContent = index === panels.length - 1
            ? "Continue scrolling to Recognition"
            : "Scroll to explore \u00b7 Select a client to jump";
        showcase.dataset.currentProject = String(index + 1);
        moveIndicator(!force);
        if (announce && status) status.textContent = `${panels[index].dataset.projectName}, project ${index + 1} of ${panels.length}.`;
        showcase.dispatchEvent(new CustomEvent("projectshowcasechange", { bubbles: true }));
    }

    function syncFromTimeline(): void {
        if (!timeline || rebuilding || layoutDirty || window.innerWidth !== lastWidth) return;
        let index = 0;
        transitionMidpoints.forEach((point, position) => { if (timeline!.time() >= point) index = position + 1; });
        setActive(index);
        rememberPosition();
    }

    function rememberPosition(): void {
        if (rebuilding || layoutDirty || window.innerWidth !== lastWidth) return;
        if (!story) {
            const bounds = showcase.getBoundingClientRect();
            const panel = panels[current].getBoundingClientRect();
            const overflow = panels[current].scrollHeight - Math.max(200, viewportHeight() - pinTop() - 60);
            bookmark = {
                index: current,
                fraction: overflow > 0 ? gsap.utils.clamp(0, 1, (pinTop() - panel.top) / overflow) : 0,
                inside: bounds.top <= pinTop() && bounds.bottom > pinTop(),
                below: false, scrollY: window.scrollY, start: 0, end: 0,
            };
            return;
        }
        const phase = phases[current];
        const fraction = phase && timeline && phase.readingEnd > phase.readingStart
            ? gsap.utils.clamp(0, 1, (timeline.time() - phase.readingStart) / (phase.readingEnd - phase.readingStart)) : 0;
        bookmark = {
            index: current, fraction,
            inside: window.scrollY >= story.start && window.scrollY <= story.end,
            below: window.scrollY > story.end,
            scrollY: window.scrollY, start: story.start, end: story.end,
        };
    }

    function publishPositions(trigger: ScrollTrigger): void {
        showcase.dataset.projectScrollStart = String(trigger.start);
        showcase.dataset.projectScrollEnd = String(trigger.end);
        showcase.dataset.projectScrollPhases = JSON.stringify(phases.map(phase => ({
            arrival: trigger.start + phase.arrival,
            readingStart: trigger.start + phase.readingStart,
            readingEnd: trigger.start + phase.readingEnd,
        })));
    }

    function clearLayout(): void {
        stopJump();
        story?.kill(true);
        story = null;
        timeline?.kill();
        timeline = null;
        linearTriggers.forEach(trigger => trigger.kill());
        linearTriggers = [];
        gsap.killTweensOf(indicator);
        gsap.set([horizontalTrack, ...panels], { clearProps: "transform,opacity" });
        showcase.classList.remove("is-scroll-driven", "is-linear");
        panels.forEach(panel => { panel.hidden = false; panel.inert = false; panel.setAttribute("aria-hidden", "false"); });
        delete showcase.dataset.projectScrollStart;
        delete showcase.dataset.projectScrollEnd;
        delete showcase.dataset.projectScrollPhases;
    }

    function createStory(): void {
        showcase.classList.add("is-scroll-driven");
        showcase.style.setProperty("--project-pin-top", `${pinTop()}px`);
        if (hint) hint.hidden = false;
        const width = reader.clientWidth;
        const height = reader.clientHeight;
        const pause = Math.max(180, height * 0.3);
        const slide = Math.max(320, width * 0.48, height * 0.65);
        phases = [];
        transitionMidpoints = [];
        gsap.set(horizontalTrack, { x: 0 });
        gsap.set(panels, { y: 0 });
        timeline = gsap.timeline({ paused: true, onUpdate: syncFromTimeline });
        panels.forEach((panel, index) => {
            const overflow = Math.max(0, panel.scrollHeight - height);
            const arrival = timeline!.duration();
            timeline!.to({}, { duration: pause });
            const readingStart = timeline!.duration();
            if (overflow > 0) timeline!.to(panel, { y: -overflow, duration: overflow, ease: "none" });
            phases.push({ arrival, readingStart, readingEnd: timeline!.duration() });
            timeline!.to({}, { duration: pause });
            if (index < panels.length - 1) {
                transitionMidpoints.push(timeline!.duration() + slide / 2);
                timeline!.to(horizontalTrack, { x: -width * (index + 1), duration: slide, ease: "none" });
            }
        });
        story = ScrollTrigger.create({
            id: "project-showcase-scroll",
            trigger: showcase,
            pin: showcase,
            start: () => `top ${pinTop()}`,
            end: () => `+=${timeline!.duration()}`,
            animation: timeline,
            scrub: 0.2,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: publishPositions,
        });
        publishPositions(story);
    }

    function createLinear(): void {
        showcase.classList.add("is-linear");
        if (hint) hint.hidden = true;
        linearTriggers = panels.map((panel, index) => ScrollTrigger.create({
            trigger: panel,
            start: "top center",
            end: "bottom center",
            onEnter: () => setActive(index),
            onEnterBack: () => setActive(index),
        }));
    }

    function configureLayout(): void {
        const previous = bookmark;
        const oldIndex = previous?.index ?? current;
        const oldY = previous?.scrollY ?? window.scrollY;
        const oldStart = previous?.start ?? 0;
        const oldEnd = previous?.end ?? 0;
        const inside = previous?.inside ?? false;
        const below = previous?.below ?? false;
        const readFraction = previous?.fraction ?? 0;
        rebuilding = true;
        clearLayout();
        if (shouldPin()) createStory();
        else createLinear();
        ScrollTrigger.refresh();
        if (inside && story && timeline) {
            const nextPhase = phases[oldIndex];
            const position = readFraction > 0
                ? nextPhase.readingStart + (nextPhase.readingEnd - nextPhase.readingStart) * readFraction
                : nextPhase.arrival + 1;
            window.scrollTo({ top: story.start + position, behavior: "instant" });
            ScrollTrigger.update();
            story.getTween()?.progress(1);
            timeline.totalTime(position, true);
        } else if (inside) {
            window.scrollTo({ top: window.scrollY + panels[oldIndex].getBoundingClientRect().top - pinTop(), behavior: "instant" });
        } else if (below) {
            window.scrollTo({ top: oldY + (story ? story.end - story.start : 0) - (oldEnd - oldStart), behavior: "instant" });
            ScrollTrigger.update();
        }
        lastWidth = window.innerWidth;
        lastViewportHeight = viewportHeight();
        lastReaderHeight = showcase.getBoundingClientRect().height;
        layoutDirty = false;
        rebuilding = false;
        if (story) syncFromTimeline();
        setActive(inside ? oldIndex : current, false, true);
        rememberPosition();
    }

    function jumpToProject(index: number): void {
        if (index < 0 || index >= panels.length) return;
        stopJump();
        if (status) status.textContent = `${panels[index].dataset.projectName}, project ${index + 1} of ${panels.length}.`;
        if (!story) {
            setActive(index);
            panels[index].scrollIntoView({ behavior: reducedMotion.matches ? "instant" : "smooth", block: "start" });
            return;
        }
        const trigger = story;
        const target = trigger.start + phases[index].arrival + 1;
        const position = { y: window.scrollY };
        jump = gsap.to(position, {
            y: target,
            duration: 0.7,
            ease: "power2.inOut",
            onUpdate: () => { window.scrollTo({ top: position.y, behavior: "instant" }); ScrollTrigger.update(); },
            onComplete: () => { ScrollTrigger.update(); trigger.getTween()?.progress(1); syncFromTimeline(); jump = null; },
        });
    }

    clients.forEach((client, index) => {
        client.addEventListener("click", () => jumpToProject(index));
        client.addEventListener("keydown", event => {
            let target: number;
            if (event.key === "ArrowDown" || event.key === "ArrowRight") target = (index + 1) % clients.length;
            else if (event.key === "ArrowUp" || event.key === "ArrowLeft") target = (index - 1 + clients.length) % clients.length;
            else if (event.key === "Home") target = 0;
            else if (event.key === "End") target = clients.length - 1;
            else return;
            event.preventDefault();
            clients[target].focus({ preventScroll: true });
            jumpToProject(target);
        });
    });

    showcase.classList.add("is-enhanced");
    rail.hidden = false;
    top.hidden = false;
    configureLayout();
    window.addEventListener("wheel", stopJump, { passive: true });
    window.addEventListener("touchstart", stopJump, { passive: true });
    window.addEventListener("pointerdown", stopJump, { passive: true });
    window.addEventListener("scroll", rememberPosition, { passive: true });
    window.addEventListener("keydown", event => {
        if (!rail.contains(event.target as Node) && ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) stopJump();
    });
    window.addEventListener("resize", () => {
        cancelAnimationFrame(resizeFrame);
        const changed = window.innerWidth !== lastWidth ||
            viewportHeight() !== lastViewportHeight ||
            Math.abs(showcase.getBoundingClientRect().height - lastReaderHeight) > 1 ||
            shouldPin() !== showcase.classList.contains("is-scroll-driven");
        layoutDirty = changed;
        resizeFrame = requestAnimationFrame(() => {
            if (changed) configureLayout();
            else moveIndicator();
        });
    });
    reducedMotion.addEventListener("change", configureLayout);
    void document.fonts.ready.then(configureLayout);
    window.addEventListener("load", configureLayout, { once: true });
}

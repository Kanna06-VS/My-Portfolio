import gsap from "gsap";
import { createProjectPaperTurn } from "./project-book-paper";

export function initProjectBook(): void {
    const root = document.getElementById("projectBook");
    if (!root || root.classList.contains("is-ready")) return;

    const spreads = Array.from(root.querySelectorAll<HTMLElement>(".project-book-spread"));
    const frame = root.querySelector<HTMLElement>(".project-book-frame");
    const cover = root.querySelector<HTMLButtonElement>(".project-book-cover");
    const navigation = root.querySelector<HTMLElement>(".project-book-navigation");
    const edgeControls = root.querySelector<HTMLElement>(".project-book-edge-controls");
    const previous = root.querySelector<HTMLButtonElement>('[data-book-action="previous"]');
    const next = root.querySelector<HTMLButtonElement>('[data-book-action="next"]');
    const counter = root.querySelector<HTMLElement>("[data-book-counter]");
    const status = root.querySelector<HTMLElement>("[data-book-status]");
    const hold = root.querySelector<HTMLElement>(".project-book-hold");
    const turn = root.querySelector<HTMLElement>(".project-book-turn");
    const front = turn?.querySelector<HTMLElement>(".project-book-turn-front");
    const back = turn?.querySelector<HTMLElement>(".project-book-turn-back");

    const namePages = spreads.map((spread) => spread.querySelector<HTMLElement>(".project-book-name"));
    const detailPages = spreads.map((spread) => spread.querySelector<HTMLElement>(".project-book-details"));

    if (
        !spreads.length || !frame || !cover || !navigation || !edgeControls || !previous ||
        !next || !counter || !status || !hold || !turn || !front || !back ||
        namePages.some((page) => !page) || detailPages.some((page) => !page)
    ) return;

    spreads.forEach((spread) => {
        spread.querySelectorAll<HTMLImageElement>("img").forEach((image) => { image.loading = "eager"; });
    });

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const compactLayout = window.matchMedia("(max-width: 900px)");
    const paperTurn = createProjectPaperTurn(frame);
    const header = document.getElementById("siteHeader");
    const count = String(spreads.length).padStart(2, "0");
    const cloneScrollOffsets = new WeakMap<HTMLElement, number>();
    const strips: HTMLElement[] = [];
    let current = -1;
    let busy = false;
    let animation: ReturnType<typeof gsap.timeline> | null = null;
    let finishTurn: (() => void) | null = null;
    let pointerPosition: { x: number; y: number } | null = null;

    function pageEdgeAt(x: number, y: number): "previous" | "next" | null {
        if (current < 0 || busy) return null;
        const bounds = frame!.getBoundingClientRect();
        if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) return null;
        const edgeWidth = Math.max(44, previous!.getBoundingClientRect().width);
        if (x - bounds.left <= edgeWidth && !previous!.disabled) return "previous";
        if (bounds.right - x <= edgeWidth && !next!.disabled) return "next";
        return null;
    }

    function updateEdgeHint(): void {
        const edge = pointerPosition && pageEdgeAt(pointerPosition.x, pointerPosition.y);
        if (edge) root!.dataset.bookEdge = edge;
        else delete root!.dataset.bookEdge;
    }

    function updateReaderFocus(): void {
        spreads.forEach((spread, position) => {
            const active = position === current;
            spread.tabIndex = active && compactLayout.matches ? 0 : -1;
            [namePages[position], detailPages[position]].forEach((page) => {
                if (page) {
                    page.tabIndex = active && !compactLayout.matches &&
                        page.scrollHeight > page.clientHeight + 1 ? 0 : -1;
                }
            });
        });
    }

    function updateBookLayout(): void {
        const headerBottom = Math.max(0, header?.getBoundingClientRect().bottom ?? 90);
        root!.style.setProperty("--book-sticky-top", `${Math.ceil(headerBottom + 10)}px`);
        updateReaderFocus();
        updateEdgeHint();
    }

    function alignOpeningBook(): void {
        const bounds = root!.getBoundingClientRect();
        const headerBottom = Math.max(0, header?.getBoundingClientRect().bottom ?? 90);
        if (bounds.top < headerBottom + 12 || bounds.bottom > window.innerHeight - 12) {
            window.scrollTo({
                top: Math.max(0, window.scrollY + bounds.top - headerBottom - 12),
                behavior: reducedMotion.matches ? "instant" : "smooth"
            });
        }
    }

    function renderState(index: number): void {
        const changed = current !== index;
        current = index;
        const open = index >= 0;
        root!.classList.toggle("is-open", open);
        cover!.hidden = open;
        cover!.inert = open;
        edgeControls!.hidden = !open;
        edgeControls!.inert = !open;
        navigation!.inert = !open;
        navigation!.setAttribute("aria-hidden", String(!open));

        spreads.forEach((spread, position) => {
            const active = position === index;
            spread.classList.toggle("is-active", active);
            spread.inert = !active;
            spread.setAttribute("aria-hidden", String(!active));
            if (!active || changed) {
                spread.scrollTop = 0;
                if (namePages[position]) namePages[position]!.scrollTop = 0;
                if (detailPages[position]) detailPages[position]!.scrollTop = 0;
            }
        });

        updateReaderFocus();

        previous!.disabled = !open;
        next!.disabled = !open || index === spreads.length - 1;
        counter!.textContent = `Project ${String(Math.max(index, 0) + 1).padStart(2, "0")} / ${count}`;
        updateEdgeHint();
    }

    // Animation faces are decorative copies; the stationary articles remain the content.
    function clonePage(source: HTMLElement | null): HTMLElement {
        let copy: HTMLElement;
        if (!source) {
            copy = document.createElement("div");
            copy.className = "project-book-blank-page";
        } else if (source instanceof HTMLButtonElement) {
            copy = document.createElement("div");
            copy.className = source.className;
            Array.from(source.childNodes).forEach((child) => copy.append(child.cloneNode(true)));
        } else {
            copy = source.cloneNode(true) as HTMLElement;
        }

        copy.classList.add("project-book-leaf-content");
        copy.hidden = false;
        copy.inert = true;
        copy.setAttribute("aria-hidden", "true");
        cloneScrollOffsets.set(copy, source?.scrollTop ?? 0);

        [copy, ...Array.from(copy.querySelectorAll<HTMLElement>("*"))].forEach((element) => {
            element.removeAttribute("id");
            element.removeAttribute("data-book-action");
            element.removeAttribute("aria-controls");
            element.removeAttribute("aria-labelledby");
            element.removeAttribute("aria-describedby");
            element.removeAttribute("autofocus");
            element.removeAttribute("tabindex");
        });
        copy.querySelectorAll<HTMLImageElement>("img").forEach((image) => {
            image.loading = "eager";
        });
        return copy;
    }

    function restoreCopyScroll(container: HTMLElement): void {
        container.querySelectorAll<HTMLElement>(".project-book-leaf-content").forEach((copy) => {
            copy.scrollTop = cloneScrollOffsets.get(copy) ?? 0;
        });
    }

    // A DOM fallback remains available if the paper texture cannot be captured.
    function createCurvedSheet(
        sourceFront: HTMLElement | null,
        sourceBack: HTMLElement | null,
        backward: boolean
    ): (progress: number) => void {
        const width = frame!.getBoundingClientRect().width / 2;
        const height = frame!.clientHeight;
        const stripCount = 28;
        const stripWidth = width / stripCount;
        turn!.classList.add("is-curved");

        for (let i = 0; i < stripCount; i += 1) {
            const strip = document.createElement("div");
            strip.className = "project-book-strip";
            strip.style.width = `${stripWidth}px`;
            strip.style.height = `${height}px`;

            const addFace = (side: "front" | "back", source: HTMLElement | null): void => {
                const face = document.createElement("div");
                face.className = `project-book-strip-${side}`;
                const copy = clonePage(source);
                const forwardCrop = i * stripWidth;
                const reverseCrop = width - (i + 1) * stripWidth;
                const crop = (side === "front") !== backward ? forwardCrop : reverseCrop;
                copy.style.width = `${width}px`;
                copy.style.height = `${height}px`;
                copy.style.transform = `translateX(${-crop}px)`;
                face.append(copy);
                strip.append(face);
            };

            addFace("front", sourceFront);
            addFace("back", sourceBack);
            strips.push(strip);
            turn!.append(strip);
        }
        restoreCopyScroll(turn!);

        return (progress: number): void => {
            const baseAngle = Math.PI * progress;
            const curl = 0.78 * Math.sin(baseAngle);
            let x = 0;
            let z = 0;

            strips.forEach((strip, i) => {
                const angle = progress <= 0 ? 0 : progress >= 1 ? Math.PI :
                    baseAngle + curl * (2 * (i + 0.5) / stripCount - 1);
                const dx = progress <= 0 ? stripWidth : progress >= 1 ? -stripWidth :
                    stripWidth * Math.cos(angle);
                const dz = progress <= 0 || progress >= 1 ? 0 : stripWidth * Math.sin(angle);
                const left = backward ? -(x + dx) : x;
                const depth = backward ? z + dz : z;
                strip.style.transform = `translate3d(${left}px, 0, ${depth}px) rotateY(${backward ? angle : -angle}rad)`;
                strip.style.setProperty("--leaf-shade", String(Math.max(0, 0.17 * Math.sin(angle))));
                x += dx;
                z += dz;
            });
        };
    }

    function goTo(index: number, originY = 0.78): void {
        if (busy || index < -1 || index >= spreads.length || index === current) return;

        const from = current;
        const focusedAtStart = document.activeElement;
        busy = true;
        root!.dataset.turning = "true";
        root!.setAttribute("aria-busy", "true");
        updateEdgeHint();

        let finished = false;
        let openingAligned = false;
        const displayDestination = (): void => {
            renderState(index);
            if (from < 0 && index >= 0 && !openingAligned) {
                openingAligned = true;
                alignOpeningBook();
            }
        };
        const finish = (): void => {
            if (finished) return;
            finished = true;
            displayDestination();
            paperTurn.clear();
            hold!.hidden = true;
            turn!.hidden = true;
            hold!.replaceChildren();
            front!.replaceChildren();
            back!.replaceChildren();
            strips.splice(0).forEach((strip) => strip.remove());
            hold!.classList.remove("is-right");
            turn!.classList.remove("is-backward", "is-curved");
            gsap.set(turn, { clearProps: "transform,--turn-shade" });
            gsap.set(frame, { clearProps: "opacity" });
            animation = null;
            finishTurn = null;
            busy = false;
            root!.dataset.turning = "false";
            root!.setAttribute("aria-busy", "false");
            updateEdgeHint();

            status!.textContent = index < 0
                ? "Projects book closed."
                : `Project ${index + 1} of ${spreads.length}: ${spreads[index].dataset.projectName || namePages[index]?.textContent?.trim() || "Client engagement"}.`;

            const focusRemainsInBook = root!.contains(document.activeElement) ||
                document.activeElement === document.body;
            if (focusRemainsInBook) {
                if (index < 0) {
                    cover!.focus({ preventScroll: true });
                } else if (from < 0) {
                    (next!.disabled ? previous! : next!).focus({ preventScroll: true });
                } else if (
                    next!.disabled && focusedAtStart === next &&
                    (document.activeElement === next || document.activeElement === document.body)
                ) {
                    previous!.focus({ preventScroll: true });
                } else if (
                    focusedAtStart instanceof HTMLElement &&
                    spreads.some((spread) => spread.contains(focusedAtStart)) &&
                    document.activeElement === document.body
                ) {
                    const reader = compactLayout.matches ? spreads[index] : detailPages[index];
                    (reader?.tabIndex === 0 ? reader : root!).focus({ preventScroll: true });
                }
            }
            root!.dispatchEvent(new CustomEvent("projectbookchange", { bubbles: true }));
        };
        finishTurn = finish;

        try {
            if (reducedMotion.matches) {
                finish();
                return;
            }

            if (compactLayout.matches) {
                animation = gsap.timeline({ onComplete: finish });
                animation
                    .to(frame, { opacity: 0, duration: 0.09, ease: "power1.out" })
                    .add(displayDestination)
                    .to(frame, { opacity: 1, duration: 0.09, ease: "power1.in" });
                return;
            }

            const backward = index < from;
            const oldName = from >= 0 ? namePages[from] : null;
            const oldDetails = from >= 0 ? detailPages[from] : null;
            const newName = index >= 0 ? namePages[index] : null;
            const newDetails = index >= 0 ? detailPages[index] : null;

            hold!.classList.toggle("is-right", backward);
            turn!.classList.toggle("is-backward", backward);
            hold!.replaceChildren(clonePage(backward ? oldDetails : oldName));
            hold!.hidden = false;
            turn!.hidden = false;
            gsap.set(turn, { rotationY: 0, "--turn-shade": 0 });
            restoreCopyScroll(hold!);

            if (from >= 0 && index >= 0) {
                const sourceFront = backward ? oldName : oldDetails;
                const sourceBack = backward ? newDetails : newName;
                const drawPaper = sourceFront && sourceBack
                    ? paperTurn.start(sourceFront, sourceBack, backward, originY)
                    : null;
                const drawSheet = drawPaper ?? createCurvedSheet(sourceFront, sourceBack, backward);
                if (drawPaper) turn!.hidden = true;
                drawSheet(0);
                displayDestination();
                const sheet = { progress: 0 };
                animation = gsap.timeline({ onComplete: finish });
                animation.to(sheet, {
                    progress: 1,
                    duration: 1.35,
                    ease: "sine.inOut",
                    onUpdate: () => drawSheet(sheet.progress)
                });
                return;
            }

            // A hardcover board stays rigid; only the paper between projects bends.
            front!.replaceChildren(clonePage(backward ? oldName : cover));
            back!.replaceChildren(clonePage(backward ? cover : newName));
            restoreCopyScroll(turn!);
            displayDestination();

            animation = gsap.timeline({ onComplete: finish });
            animation
                .to(turn, {
                    rotationY: backward ? 180 : -180,
                    duration: 1,
                    ease: "power2.inOut"
                }, 0)
                .to(turn, { "--turn-shade": 0.45, duration: 0.5, ease: "power1.in" }, 0)
                .to(turn, { "--turn-shade": 0, duration: 0.5, ease: "power1.out" }, 0.5);
        } catch {
            animation?.kill();
            finish();
        }
    }

    cover.addEventListener("click", () => goTo(0));
    previous.addEventListener("click", () => goTo(current - 1));
    next.addEventListener("click", () => goTo(current + 1));

    // Let the real page receive pointer gestures so text selection and the compact
    // reader's vertical scrolling work normally beneath the transparent edge controls.
    frame.addEventListener("click", (event: MouseEvent) => {
        if (event.defaultPrevented || event.button !== 0) return;
        if (event.target instanceof Element && event.target.closest("a, button, input, textarea, select, [contenteditable='true']")) return;
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed && root!.contains(selection.anchorNode)) return;
        const edge = pageEdgeAt(event.clientX, event.clientY);
        if (!edge) return;
        event.preventDefault();
        const bounds = frame!.getBoundingClientRect();
        const originY = Math.min(0.88, Math.max(0.12, (event.clientY - bounds.top) / bounds.height));
        root!.focus({ preventScroll: true });
        goTo(current + (edge === "next" ? 1 : -1), originY);
    });
    frame.addEventListener("pointermove", (event: PointerEvent) => {
        if (event.pointerType === "touch") return;
        pointerPosition = { x: event.clientX, y: event.clientY };
        updateEdgeHint();
    });
    frame.addEventListener("pointerleave", () => {
        pointerPosition = null;
        updateEdgeHint();
    });

    root.addEventListener("keydown", (event: KeyboardEvent) => {
        if (
            busy || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
            !root.contains(document.activeElement) ||
            (event.target instanceof HTMLElement && (
                event.target.isContentEditable ||
                /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)
            ))
        ) return;

        let target: number;
        switch (event.key) {
            case "ArrowRight": target = current + 1; break;
            case "ArrowLeft": target = current - 1; break;
            case "Home": target = 0; break;
            case "End": target = spreads.length - 1; break;
            case "Escape": target = -1; break;
            default: return;
        }
        event.preventDefault();
        goTo(target);
    });

    const settleTurn = (): void => {
        animation?.kill();
        finishTurn?.();
        updateBookLayout();
    };
    reducedMotion.addEventListener("change", settleTurn);
    compactLayout.addEventListener("change", settleTurn);
    window.addEventListener("resize", settleTurn);

    root.tabIndex = 0;
    hold.inert = true;
    turn.inert = true;
    navigation.hidden = false;
    status.textContent = "";
    root.classList.add("is-ready");
    root.dataset.turning = "false";
    renderState(-1);
    updateBookLayout();
}

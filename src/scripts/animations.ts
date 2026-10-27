import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Text and light carry the motion; the portrait and its containers stay fixed. */
export function initAnimations(): void {
    const motion = gsap.matchMedia();
    motion.add("(prefers-reduced-motion: no-preference)", () => {
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        const opening = document.querySelectorAll(".availability-pill, .hero-role");
        const name = document.querySelectorAll("[data-hero-line]");
        const supporting = document.querySelectorAll(
            ".hero-summary, .hero-secondary, .hero-actions, .hero-tags, .hero-scroll-cue"
        );
        intro.fromTo(opening, { opacity: 0, y: 12 }, {
            opacity: 1, y: 0, duration: 0.6, stagger: 0.08, clearProps: "opacity,transform",
        }, 0.05).fromTo(name, { yPercent: 112 }, {
            yPercent: 0, duration: 1.05, stagger: 0.13, ease: "power4.out", clearProps: "transform",
        }, 0.16).fromTo(supporting, { opacity: 0, y: 16 }, {
            opacity: 1, y: 0, duration: 0.65, stagger: 0.075, clearProps: "opacity,transform",
        }, 0.55);

        // Only product badges float; the portrait's ancestor chain never animates.
        [
            { target: ".badge-bc .floating-badge", y: -3, duration: 5.2 },
            { target: ".badge-azure .floating-badge", y: 3, duration: 5.8 },
            { target: ".badge-nav .floating-badge", y: 2, duration: 6.1 },
        ].forEach(({ target, y, duration }) => {
            gsap.to(target, { y, duration, ease: "sine.inOut", repeat: -1, yoyo: true });
        });

        document.querySelectorAll<HTMLElement>(".section-heading").forEach(heading => {
            const targets = [
                heading.querySelector(".section-eyebrow"),
                heading.querySelector("h2"),
                heading.querySelector("p"),
            ].filter((element): element is Element => element !== null);
            if (!targets.length) return;
            gsap.fromTo(targets, { opacity: 0, y: 22 }, {
                opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out",
                clearProps: "opacity,transform",
                scrollTrigger: { trigger: heading, start: "top 90%", once: true },
            });
        });

        document.querySelectorAll<HTMLElement>(".reveal-card").forEach(card => {
            if (card.closest(".hero-profile, #projectShowcase")) return;
            const siblings = Array.from(card.parentElement?.children ?? []).filter(
                element => element.classList.contains("reveal-card")
            );
            const delay = Math.max(0, siblings.indexOf(card) % 3) * 0.07;
            gsap.fromTo(card, { opacity: 0, y: 24 }, {
                opacity: 1, y: 0, duration: 0.75, delay, ease: "power3.out",
                clearProps: "opacity,transform",
                scrollTrigger: { trigger: card, start: "top 94%", once: true },
            });
        });
    });

    // Reverting the media context restores visible base styles when motion is reduced.
    void document.fonts.ready.then(() => ScrollTrigger.refresh());
    window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
}

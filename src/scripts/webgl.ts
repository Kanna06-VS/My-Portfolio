/// <reference types="vite/client" />

import * as THREE from "three";
import vertexShader from "../shaders/aurora.vert?raw";
import fragmentShader from "../shaders/aurora.frag?raw";

interface ThemeChangeDetail { theme: "light" | "dark" }

/** A slow ambient light pass; the portrait and page geometry stay untouched. */
export function initWebGL(): void {
    const canvas = document.getElementById("webglCanvas") as HTMLCanvasElement | null;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "low-power" });
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
        uTime: { value: 0.5 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uTheme: { value: document.body.classList.contains("light-theme") ? 1 : 0 },
    };
    let targetTheme = uniforms.uTheme.value;
    const targetMouse = new THREE.Vector2(0.5, 0.5);
    const material = new THREE.ShaderMaterial({
        vertexShader, fragmentShader, uniforms, transparent: true, depthWrite: false, depthTest: false,
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let previousRender = 0;
    let contextLost = false;
    let elapsed = 0.5;

    const draw = (): void => { renderer.render(scene, camera); };
    const stop = (): void => {
        cancelAnimationFrame(frame);
        frame = 0;
        previousRender = 0;
    };

    function animate(now: number): void {
        frame = 0;
        if (document.hidden || reducedMotion.matches || contextLost) return;
        frame = requestAnimationFrame(animate);
        // The slow lighting needs only 30 renders per second, including on high-refresh displays.
        if (previousRender && now - previousRender < 1000 / 30) return;
        const delta = previousRender ? Math.min((now - previousRender) / 1000, 0.1) : 1 / 30;
        previousRender = now;
        elapsed += delta;
        uniforms.uTime.value = elapsed;
        uniforms.uMouse.value.lerp(targetMouse, 1 - Math.exp(-delta * 2));
        uniforms.uTheme.value += (targetTheme - uniforms.uTheme.value) * (1 - Math.exp(-delta * 6));
        draw();
    }

    function start(): void {
        if (frame || document.hidden || contextLost) return;
        if (reducedMotion.matches) {
            uniforms.uTime.value = 0.5;
            uniforms.uTheme.value = targetTheme;
            uniforms.uMouse.value.set(0.5, 0.5);
            draw();
        } else frame = requestAnimationFrame(animate);
    }

    function resize(): void {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.innerWidth <= 680 ? 1 : 1.25));
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
        if (!contextLost && !document.hidden) draw();
    }

    window.addEventListener("pointermove", event => {
        if (reducedMotion.matches || event.pointerType === "touch") return;
        targetMouse.set(event.clientX / window.innerWidth, 1 - event.clientY / window.innerHeight);
    }, { passive: true });
    window.addEventListener("portfolio-theme-change", event => {
        targetTheme = (event as CustomEvent<ThemeChangeDetail>).detail.theme === "light" ? 1 : 0;
        if (reducedMotion.matches) { uniforms.uTheme.value = targetTheme; start(); }
    });
    document.addEventListener("visibilitychange", () => { stop(); start(); });
    reducedMotion.addEventListener("change", () => { stop(); start(); });
    window.addEventListener("resize", resize, { passive: true });
    canvas.addEventListener("webglcontextlost", () => { contextLost = true; stop(); });
    canvas.addEventListener("webglcontextrestored", () => { contextLost = false; resize(); start(); });
    resize();
    start();
}

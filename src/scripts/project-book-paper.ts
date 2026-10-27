// Three.js is already used by the portfolio; this workspace does not install its optional typings.
// @ts-ignore The existing Three.js dependency has no declaration package.
import * as THREE from "three";

type DrawTurn = (progress: number) => void;
type PaperTurn = {
    start(front: HTMLElement, back: HTMLElement, backward: boolean, originY?: number): DrawTurn | null;
    clear(): void;
};
type Point = { x: number; y: number; z: number; u: number; v: number };
type Projected = Point & { screenX: number; screenY: number };

const COLUMNS = 32;
const ROWS = 8;
const MARGIN = 40;
const CAMERA_DISTANCE = 4000;

function roundedRect(
    context: CanvasRenderingContext2D,
    x: number, y: number, width: number, height: number, radius: number
): void {
    context.beginPath();
    context.roundRect(x, y, Math.max(0, width), Math.max(0, height), Math.max(0, radius));
}

function transparent(color: string): boolean {
    return !color || color === "transparent" || /rgba\([^)]*,\s*0(?:\.0+)?\s*\)/.test(color);
}

/** Paint the existing, laid-out page rather than reflowing its text in another renderer. */
function photographPage(page: HTMLElement, width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    const density = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(width * density);
    canvas.height = Math.ceil(height * density);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Page capture is unavailable");
    context.scale(density, density);

    const bounds = page.getBoundingClientRect();
    const scaleX = bounds.width / width || 1;
    const scaleY = bounds.height / height || 1;
    const rootStyle = getComputedStyle(page);
    const book = page.closest<HTMLElement>(".project-book") ?? page;
    const bookStyle = getComputedStyle(book);
    const variable = (name: string, fallback: string): string => bookStyle.getPropertyValue(name).trim() || fallback;
    const rect = (element: Element): { x: number; y: number; width: number; height: number } => {
        const box = element.getBoundingClientRect();
        return {
            x: (box.left - bounds.left) / scaleX,
            y: (box.top - bounds.top) / scaleY,
            width: box.width / scaleX,
            height: box.height / scaleY
        };
    };

    // The alpha contour follows the same small page bow as the stationary HTML sheets.
    const reference = rootStyle.clipPath.match(/#([^"')]+)/)?.[1] ??
        (page.classList.contains("project-book-name") ? "projectBookLeftEdge" : "projectBookRightEdge");
    const outline = document.getElementById(reference)?.querySelector("path")?.getAttribute("d");
    context.save();
    if (outline) {
        context.scale(width, height);
        context.clip(new Path2D(outline));
        context.scale(1 / width, 1 / height);
    }
    context.fillStyle = transparent(rootStyle.backgroundColor) ? variable("--book-paper", "#edf5ff") : rootStyle.backgroundColor;
    context.fillRect(0, 0, width, height);

    const foldedAtRight = page.classList.contains("project-book-name");
    const fold = context.createLinearGradient(foldedAtRight ? width : 0, 0, foldedAtRight ? width - width * 0.11 : width * 0.11, 0);
    fold.addColorStop(0, variable("--book-fold", "rgba(21,47,78,.20)"));
    fold.addColorStop(0.55, "rgba(21,47,78,.025)");
    fold.addColorStop(1, "rgba(21,47,78,0)");
    context.fillStyle = fold;
    context.fillRect(0, 0, width, height);
    context.fillStyle = variable("--book-grain", "rgba(42,80,120,.018)");
    for (let y = 3; y < height; y += 4) context.fillRect(0, y, width, 0.5);

    function fillBox(element: HTMLElement, style: CSSStyleDeclaration, pseudo = false): void {
        const box = rect(element);
        if (pseudo) {
            const left = Number.parseFloat(style.left) || 0;
            const right = Number.parseFloat(style.right) || 0;
            const top = Number.parseFloat(style.top) || 0;
            const bottom = Number.parseFloat(style.bottom) || 0;
            box.x += left;
            box.y += top;
            box.width -= left + right;
            box.height -= top + bottom;
        }
        const radius = Number.parseFloat(style.borderTopLeftRadius) || 0;
        if (!transparent(style.backgroundColor)) {
            roundedRect(context!, box.x, box.y, box.width, box.height, radius);
            context!.fillStyle = style.backgroundColor;
            context!.fill();
        }
        const borders = [
            [style.borderTopWidth, style.borderTopColor, box.x, box.y, box.width, 0],
            [style.borderRightWidth, style.borderRightColor, box.x + box.width, box.y, 0, box.height],
            [style.borderBottomWidth, style.borderBottomColor, box.x, box.y + box.height, box.width, 0],
            [style.borderLeftWidth, style.borderLeftColor, box.x, box.y, 0, box.height]
        ] as const;
        const uniform = borders.every(([stroke, color]) => stroke === borders[0][0] && color === borders[0][1]);
        if (uniform && Number.parseFloat(borders[0][0]) > 0) {
            const stroke = Number.parseFloat(borders[0][0]);
            roundedRect(context!, box.x + stroke / 2, box.y + stroke / 2, box.width - stroke, box.height - stroke, radius);
            context!.lineWidth = stroke;
            context!.strokeStyle = borders[0][1];
            context!.stroke();
        } else {
            borders.forEach(([stroke, color, x, y, w, h]) => {
                if (Number.parseFloat(stroke) <= 0 || transparent(color)) return;
                context!.beginPath();
                context!.moveTo(x, y);
                context!.lineTo(x + w, y + h);
                context!.lineWidth = Number.parseFloat(stroke);
                context!.strokeStyle = color;
                context!.stroke();
            });
        }
    }

    function paintText(node: Text, style: CSSStyleDeclaration): void {
        if (!node.textContent?.trim()) return;
        context!.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        context!.fillStyle = style.color;
        context!.textBaseline = "alphabetic";
        const metrics = context!.measureText("Mg");
        const fontSize = Number.parseFloat(style.fontSize);
        const ascent = metrics.fontBoundingBoxAscent || fontSize * 0.8;
        const descent = metrics.fontBoundingBoxDescent || fontSize * 0.2;
        const range = document.createRange();
        // Browser ranges preserve the actual wrap, font metrics, kerning and letter spacing.
        for (let offset = 0; offset < node.length; offset += 1) {
            const original = node.data[offset];
            if (/\s/.test(original)) continue;
            range.setStart(node, offset);
            range.setEnd(node, offset + 1);
            const character = range.getClientRects()[0];
            if (!character || character.width < 0.01 || character.height < 0.01) continue;
            const x = (character.left - bounds.left) / scaleX;
            const y = (character.top - bounds.top) / scaleY;
            const lineHeight = character.height / scaleY;
            let value = original;
            if (style.textTransform === "uppercase") value = value.toLocaleUpperCase();
            if (style.textTransform === "lowercase") value = value.toLocaleLowerCase();
            context!.fillText(value, x, y + (lineHeight - ascent - descent) / 2 + ascent);
        }
        range.detach();
    }

    function paintImage(image: HTMLImageElement, style: CSSStyleDeclaration): void {
        if (!image.complete || !image.naturalWidth) return;
        const box = rect(image);
        let drawWidth = box.width;
        let drawHeight = box.height;
        if (style.objectFit === "contain" || style.objectFit === "scale-down" || style.objectFit === "cover") {
            const ratio = (style.objectFit === "cover" ? Math.max : Math.min)(box.width / image.naturalWidth, box.height / image.naturalHeight);
            drawWidth = image.naturalWidth * ratio;
            drawHeight = image.naturalHeight * ratio;
        }
        context!.save();
        context!.beginPath();
        context!.rect(box.x, box.y, box.width, box.height);
        context!.clip();
        context!.drawImage(image, box.x + (box.width - drawWidth) / 2, box.y + (box.height - drawHeight) / 2, drawWidth, drawHeight);
        context!.restore();
    }

    function paint(element: HTMLElement, isRoot = false): void {
        const style = getComputedStyle(element);
        // An inactive spread is visibility:hidden but keeps exactly the layout we need.
        if (style.display === "none" || element.hidden || style.opacity === "0") return;
        context!.save();
        context!.globalAlpha *= Number.parseFloat(style.opacity) || 1;
        if (!isRoot) fillBox(element, style);
        if (element.classList.contains("project-book-identity")) {
            fillBox(element, getComputedStyle(element, "::before"), true);
        }
        if (element.parentElement?.classList.contains("project-book-responsibilities")) {
            const box = rect(element);
            const number = Array.prototype.indexOf.call(element.parentElement.children, element) + 1;
            const numberStyle = getComputedStyle(element, "::before");
            context!.font = `${numberStyle.fontWeight} ${numberStyle.fontSize} ${numberStyle.fontFamily}`;
            context!.fillStyle = numberStyle.color;
            context!.textBaseline = "middle";
            context!.fillText(String(number).padStart(2, "0"), box.x, box.y + box.height / 2);
        }
        if (element instanceof HTMLImageElement) {
            paintImage(element, style);
        } else {
            if (!isRoot && (style.overflowX === "hidden" || style.overflowY === "hidden")) {
                const box = rect(element);
                roundedRect(context!, box.x, box.y, box.width, box.height, Number.parseFloat(style.borderTopLeftRadius) || 0);
                context!.clip();
            }
            element.childNodes.forEach((child) => {
                if (child instanceof HTMLElement) paint(child);
                else if (child instanceof Text) paintText(child, style);
            });
        }
        context!.restore();
    }
    paint(page, true);
    context.restore();
    return canvas;
}

function deform(progress: number, width: number, height: number, originY = 0.78): Point[] {
    const p = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
    const curl = p === 0 || p === 1 ? 0 : Math.sin(Math.PI * p);
    const grip = Number.isFinite(originY) ? Math.max(0.12, Math.min(0.88, originY)) : 0.78;
    const corner = grip >= 0.5 ? 1 : -1;
    const gripStrength = 0.62 + 0.38 * Math.abs(2 * grip - 1);
    const points: Point[] = [];
    for (let row = 0; row <= ROWS; row += 1) {
        const v = row / ROWS;
        const cornerDistance = corner > 0 ? v : 1 - v;
        const cornerWeight = cornerDistance * cornerDistance * (3 - 2 * cornerDistance);
        let x = 0;
        let z = 0;
        points.push({ x, y: height / 2 - v * height, z, u: 0, v });
        for (let column = 0; column < COLUMNS; column += 1) {
            const u = (column + 0.5) / COLUMNS;
            const edge = (column + 1) / COLUMNS;
            // Integrating the row tangent preserves its paper length. The grip adds a
            // smooth twist near the free edge, so the chosen corner leads the turn.
            // The combined bend stays below one radian and never folds through itself.
            const angle = Math.PI * p + curl * (
                0.50 * (2 * u - 1) + 0.42 * gripStrength * (2 * cornerWeight - 1) * u * u
            );
            x += width / COLUMNS * Math.cos(angle);
            z += width / COLUMNS * Math.sin(angle);
            // A hand-drawn corner moves slightly inward while the sheet is lifted.
            // This vanishes at the binding and both resting poses; rows remain ordered.
            const drawIn = corner * height * 0.035 * gripStrength * curl * curl * edge ** 3 * (0.15 + 0.85 * cornerWeight);
            points.push({
                x: p === 0 ? width * edge : p === 1 ? -width * edge : x,
                y: height / 2 - v * height + drawIn,
                z: p === 0 || p === 1 ? 0 : z,
                u: edge,
                v
            });
        }
    }
    return points;
}

/** One continuous sheet, with a projected Canvas fallback when a GPU is unavailable. */
export function createProjectPaperTurn(frame: HTMLElement): PaperTurn {
    let canvas: HTMLCanvasElement | null = null;
    let renderer: any = null;
    let unavailableWebGL = false;
    let releaseTurn: (() => void) | null = null;

    function getCanvas(): HTMLCanvasElement {
        if (!canvas) {
            canvas = document.createElement("canvas");
            canvas.className = "project-book-paper-surface";
            canvas.setAttribute("aria-hidden", "true");
            canvas.inert = true;
            canvas.hidden = true;
            frame.append(canvas);
        }
        return canvas;
    }

    function clear(): void {
        releaseTurn?.();
        releaseTurn = null;
        if (canvas) canvas.hidden = true;
        if (renderer) renderer.clear();
    }

    function start(front: HTMLElement, back: HTMLElement, backward: boolean, originY = 0.78): DrawTurn | null {
        clear();
        const grip = Number.isFinite(originY) ? Math.max(0.12, Math.min(0.88, originY)) : 0.78;
        const width = frame.clientWidth / 2;
        const height = frame.clientHeight;
        if (width < 1 || height < 1) return null;
        let frontImage: HTMLCanvasElement;
        let backImage: HTMLCanvasElement;
        try {
            frontImage = photographPage(front, width, height);
            backImage = photographPage(back, width, height);
        } catch {
            return null;
        }
        let surface = getCanvas();
        const canvasWidth = width * 2 + MARGIN * 2;
        const canvasHeight = height + MARGIN * 2;
        const density = Math.min(window.devicePixelRatio || 1, 2);
        surface.style.width = `${canvasWidth}px`;
        surface.style.height = `${canvasHeight}px`;

        if (!unavailableWebGL && !renderer) {
            try {
                const context = surface.getContext("webgl2", { alpha: true, antialias: true, powerPreference: "low-power" });
                if (!context) throw new Error("WebGL is unavailable");
                renderer = new THREE.WebGLRenderer({ canvas: surface, context, alpha: true, antialias: true, powerPreference: "low-power" });
                renderer.setClearColor(0x000000, 0);
                renderer.outputColorSpace = THREE.SRGBColorSpace;
            } catch {
                unavailableWebGL = true;
                // A failed WebGL context can reserve its canvas. Replace only our decorative surface.
                const fallback = document.createElement("canvas");
                fallback.className = surface.className;
                fallback.setAttribute("aria-hidden", "true");
                fallback.inert = true;
                fallback.style.cssText = surface.style.cssText;
                surface.replaceWith(fallback);
                canvas = surface = fallback;
            }
        }

        if (renderer) {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(
                2 * Math.atan(canvasHeight / (2 * CAMERA_DISTANCE)) * 180 / Math.PI,
                canvasWidth / canvasHeight, 1, CAMERA_DISTANCE * 2
            );
            camera.position.set(0, 0, CAMERA_DISTANCE);
            renderer.setPixelRatio(density);
            renderer.setSize(canvasWidth, canvasHeight, false);
            const geometry = new THREE.PlaneGeometry(width, height, COLUMNS, ROWS);
            const reverseGeometry = geometry.clone();
            reverseGeometry.setAttribute("position", geometry.getAttribute("position"));
            const frontUV = geometry.getAttribute("uv");
            const backUV = reverseGeometry.getAttribute("uv");
            for (let index = 0; index < frontUV.count; index += 1) {
                const u = (index % (COLUMNS + 1)) / COLUMNS;
                frontUV.setX(index, backward ? 1 - u : u);
                backUV.setX(index, backward ? u : 1 - u);
            }
            const frontTexture = new THREE.CanvasTexture(frontImage);
            const backTexture = new THREE.CanvasTexture(backImage);
            [frontTexture, backTexture].forEach((texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
            });
            const frontMaterial = new THREE.MeshLambertMaterial({ map: frontTexture, side: THREE.FrontSide, transparent: true, alphaTest: 0.025 });
            const backMaterial = new THREE.MeshLambertMaterial({ map: backTexture, side: THREE.BackSide, transparent: true, alphaTest: 0.025 });
            const sheet = new THREE.Group();
            sheet.scale.x = backward ? -1 : 1;
            sheet.add(new THREE.Mesh(geometry, frontMaterial));
            sheet.add(new THREE.Mesh(reverseGeometry, backMaterial));
            scene.add(sheet);
            scene.add(new THREE.AmbientLight(0xffffff, 2.5));
            const light = new THREE.DirectionalLight(0xffffff, 0.35);
            light.position.set(-width, height, CAMERA_DISTANCE);
            scene.add(light);

            const shadowImage = document.createElement("canvas");
            shadowImage.width = shadowImage.height = 128;
            const shadowContext = shadowImage.getContext("2d")!;
            const gradient = shadowContext.createRadialGradient(64, 64, 0, 64, 64, 64);
            gradient.addColorStop(0, "rgba(9,24,50,.6)");
            gradient.addColorStop(0.4, "rgba(9,24,50,.24)");
            gradient.addColorStop(1, "rgba(9,24,50,0)");
            shadowContext.fillStyle = gradient;
            shadowContext.fillRect(0, 0, 128, 128);
            const shadowTexture = new THREE.CanvasTexture(shadowImage);
            const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false, opacity: 0 });
            const shadowGeometry = new THREE.PlaneGeometry(1, 1);
            const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
            shadow.position.z = -0.2;
            scene.add(shadow);
            surface.hidden = false;
            surface.dataset.renderer = "webgl";
            releaseTurn = () => {
                geometry.dispose(); reverseGeometry.dispose();
                frontMaterial.dispose(); backMaterial.dispose();
                frontTexture.dispose(); backTexture.dispose();
                shadowMaterial.dispose(); shadowTexture.dispose(); shadowGeometry.dispose();
            };
            return (progress) => {
                const points = deform(progress, width, height, grip);
                const positions = geometry.getAttribute("position");
                points.forEach((point, index) => positions.setXYZ(index, point.x, point.y, point.z));
                positions.needsUpdate = true;
                geometry.computeVertexNormals();
                reverseGeometry.setAttribute("normal", geometry.getAttribute("normal"));
                const lift = Math.sin(Math.PI * Math.max(0, Math.min(1, progress)));
                const outer = points[Math.round(grip * ROWS) * (COLUMNS + 1) + COLUMNS];
                shadow.position.x = (backward ? -1 : 1) * outer.x * 0.44;
                shadow.scale.set(Math.max(width * 0.18, Math.abs(outer.x) * 1.2), height * 1.11, 1);
                shadowMaterial.opacity = lift * 0.52;
                renderer.render(scene, camera);
            };
        }

        const context = surface.getContext("2d");
        if (!context) return null;
        surface.width = Math.ceil(canvasWidth * density);
        surface.height = Math.ceil(canvasHeight * density);
        surface.hidden = false;
        surface.dataset.renderer = "canvas2d";
        releaseTurn = () => context.clearRect(0, 0, surface.width, surface.height);

        function triangle(a: Projected, b: Projected, c: Projected, image: HTMLCanvasElement, isBack: boolean): void {
            const source = [a, b, c].map((point) => ({
                x: (isBack !== backward ? 1 - point.u : point.u) * image.width,
                y: point.v * image.height
            }));
            const [s0, s1, s2] = source;
            const determinant = (s1.x - s0.x) * (s2.y - s0.y) - (s2.x - s0.x) * (s1.y - s0.y);
            if (Math.abs(determinant) < 0.001) return;
            context!.save();
            context!.setTransform(density, 0, 0, density, 0, 0);
            context!.beginPath();
            const corners = [a, b, c];
            const orientation = Math.sign((b.screenX - a.screenX) * (c.screenY - a.screenY) -
                (c.screenX - a.screenX) * (b.screenY - a.screenY));
            const normals = corners.map((point, index) => {
                const next = corners[(index + 1) % 3];
                const dx = next.screenX - point.screenX;
                const dy = next.screenY - point.screenY;
                const length = Math.hypot(dx, dy) || 1;
                return { x: orientation * dy / length, y: -orientation * dx / length };
            });
            corners.forEach((point, index) => {
                const previousNormal = normals[(index + 2) % 3];
                const nextNormal = normals[index];
                // Offset the actual edges, rather than expanding radially from the centroid.
                // Radial expansion barely moves the long edges of these narrow triangles.
                const miter = 0.8 / Math.max(0.035, 1 + previousNormal.x * nextNormal.x + previousNormal.y * nextNormal.y);
                const x = point.screenX + (previousNormal.x + nextNormal.x) * miter;
                const y = point.screenY + (previousNormal.y + nextNormal.y) * miter;
                if (!index) context!.moveTo(x, y); else context!.lineTo(x, y);
            });
            context!.closePath();
            context!.clip();
            const dx1 = b.screenX - a.screenX, dx2 = c.screenX - a.screenX;
            const dy1 = b.screenY - a.screenY, dy2 = c.screenY - a.screenY;
            const sx1 = s1.x - s0.x, sx2 = s2.x - s0.x;
            const sy1 = s1.y - s0.y, sy2 = s2.y - s0.y;
            const aa = (dx1 * sy2 - dx2 * sy1) / determinant;
            const bb = (dy1 * sy2 - dy2 * sy1) / determinant;
            const cc = (dx2 * sx1 - dx1 * sx2) / determinant;
            const dd = (dy2 * sx1 - dy1 * sx2) / determinant;
            context!.setTransform(density * aa, density * bb, density * cc, density * dd,
                density * (a.screenX - aa * s0.x - cc * s0.y), density * (a.screenY - bb * s0.x - dd * s0.y));
            context!.drawImage(image, 0, 0);
            context!.restore();
        }

        return (progress) => {
            context.setTransform(density, 0, 0, density, 0, 0);
            context.clearRect(0, 0, canvasWidth, canvasHeight);
            const lift = Math.sin(Math.PI * Math.max(0, Math.min(1, progress)));
            const points: Projected[] = deform(progress, width, height, grip).map((point) => {
                const perspective = CAMERA_DISTANCE / (CAMERA_DISTANCE - point.z);
                return {
                    ...point,
                    screenX: canvasWidth / 2 + (backward ? -point.x : point.x) * perspective,
                    screenY: canvasHeight / 2 - point.y * perspective
                };
            });
            const outer = points[Math.round(grip * ROWS) * (COLUMNS + 1) + COLUMNS];
            const shadowX = canvasWidth / 2 + (outer.screenX - canvasWidth / 2) * 0.43;
            context.save();
            context.translate(shadowX, canvasHeight / 2 + 5);
            context.scale(Math.max(width * 0.2, Math.abs(outer.screenX - canvasWidth / 2) * 0.65), height * 0.58);
            const gradient = context.createRadialGradient(0, 0, 0.05, 0, 0, 1);
            gradient.addColorStop(0, `rgba(10,24,48,${lift * 0.22})`);
            gradient.addColorStop(1, "rgba(10,24,48,0)");
            context.fillStyle = gradient;
            context.fillRect(-1, -1, 2, 2);
            context.restore();
            const triangles: [Projected, Projected, Projected][] = [];
            for (let row = 0; row < ROWS; row += 1) {
                for (let column = 0; column < COLUMNS; column += 1) {
                    const index = row * (COLUMNS + 1) + column;
                    const a = points[index], b = points[index + 1];
                    const c = points[index + COLUMNS + 1], d = points[index + COLUMNS + 2];
                    triangles.push([a, b, c], [b, d, c]);
                }
            }
            triangles.sort((a, b) => (a[0].z + a[1].z + a[2].z) - (b[0].z + b[1].z + b[2].z));
            triangles.forEach(([a, b, c]) => {
                const winding = (b.screenX - a.screenX) * (c.screenY - a.screenY) - (c.screenX - a.screenX) * (b.screenY - a.screenY);
                if (Math.abs(winding) < 0.02) return;
                const isBack = (winding < 0) !== backward;
                triangle(a, b, c, isBack ? backImage : frontImage, isBack);
            });
            // Shade the completed opaque sheet once. Per-triangle shading accumulates at
            // antialiased overlaps and produces a visible grid on CPU-only browsers.
            context.save();
            context.setTransform(density, 0, 0, density, 0, 0);
            context.globalCompositeOperation = "source-atop";
            const left = Math.min(...points.map((point) => point.screenX));
            const right = Math.max(...points.map((point) => point.screenX));
            const paperShade = context.createLinearGradient(left, 0, Math.max(left + 1, right), 0);
            paperShade.addColorStop(0, `rgba(12,24,48,${lift * 0.035})`);
            paperShade.addColorStop(0.48, `rgba(12,24,48,${lift * 0.11})`);
            paperShade.addColorStop(1, "rgba(12,24,48,0)");
            context.fillStyle = paperShade;
            context.fillRect(0, 0, canvasWidth, canvasHeight);
            context.restore();
        };
    }

    return { start, clear };
}

import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import config from "../vite.config.js";

const root = fileURLToPath(new URL("../", import.meta.url));

const server = await createServer({
    ...config,
    root,
    configFile: false,
    cacheDir: ".vite-preview-cache",
    optimizeDeps: { noDiscovery: true, include: [] },
    server: {
        ...config.server,
        host: "127.0.0.1",
        port: 5173,
        strictPort: true
    }
});

await server.listen();
server.printUrls();

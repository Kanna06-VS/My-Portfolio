import { defineConfig } from "vite";

export default defineConfig({
    base: "./",

    server: {
        hmr: false
    },

    build: {
        outDir: "dist",
        emptyOutDir: true
    }
});
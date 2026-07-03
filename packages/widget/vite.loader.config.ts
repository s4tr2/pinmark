import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/loader.ts",
      formats: ["iife"],
      name: "PinmarkLoader",
      fileName: () => "w.js",
    },
    outDir: "../../apps/web/public",
    emptyOutDir: false,
    minify: true,
    target: "es2020",
  },
});

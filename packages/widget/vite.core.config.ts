import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/core/index.ts",
      formats: ["es"],
      fileName: () => "widget.core.js",
    },
    outDir: "../../apps/web/public",
    emptyOutDir: false,
    minify: true,
    target: "es2020",
  },
});

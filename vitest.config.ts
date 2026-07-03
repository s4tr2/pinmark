import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: {
            "@": fileURLToPath(new URL("./apps/web/src", import.meta.url)),
          },
        },
        test: {
          name: "web",
          environment: "node",
          include: ["apps/web/src/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "widget",
          environment: "jsdom",
          include: ["packages/widget/src/**/*.test.ts"],
        },
      },
    ],
  },
});

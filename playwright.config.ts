import { defineConfig } from "@playwright/test";

// E2E strategy: fixtures are served statically (no Next.js, no database) and
// /api/v1/* is intercepted with an in-memory fake per test. This exercises
// the full widget: loader, closed shadow DOM, comment mode, anchoring,
// persistence, hermetically. Real-stack e2e arrives with the docker-compose
// self-host verification (M6).
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://127.0.0.1:4173",
  },
  webServer: {
    command: "npx http-server apps/web/public -p 4173 --silent",
    url: "http://127.0.0.1:4173/test.html",
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});

/**
 * Playwright config — a11y-сценарии на собранную PWA.
 *
 * Запуск: `npm run test:a11y --workspace=pwa` (см. package.json scripts).
 * В CI поднимается из workflow .github/workflows/ci.yml job a11y.
 *
 * Только chromium (быстрее, ставить меньше). WebKit/Firefox добавим позже
 * когда захотим smoke против VoiceOver/Firefox accessibility tree.
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/a11y",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.A11Y_BASE_URL ?? "http://localhost:4173",
    locale: "ru-RU",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.A11Y_BASE_URL ? undefined : {
    command: "npm run build && npm run preview -- --port 4173",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

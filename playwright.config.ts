import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;
// Optional: point at a pre-installed Chromium instead of Playwright's download.
const executablePath = process.env.CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "tests/e2e",
  // Tests share one seeded database, so run them in order.
  workers: 1,
  fullyParallel: false,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: { executablePath },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], launchOptions: { executablePath } } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        // Production build against a throwaway database, with demo mode on for the demo-login test.
        command: `node scripts/e2e-db.mjs && npx next build && npx next start -p ${PORT}`,
        url: baseURL,
        timeout: 300_000,
        reuseExistingServer: !process.env.CI,
        env: { DATABASE_URL: "file:./e2e.db", DEMO_MODE: "true", NEXT_TELEMETRY_DISABLED: "1" },
      },
});

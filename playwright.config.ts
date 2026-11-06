import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/**
 * End-to-end tests against a production build. Every /api request is mocked in the browser
 * (see e2e/mock-api.ts), so no backend, Google account or LLM is needed.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
      testIgnore: /mobile\.spec\.ts/,
    },
    { name: "phone", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 240_000,
    // Unreachable on purpose: the browser-level mocks must answer every API call.
    env: { API_URL: "http://127.0.0.1:9" },
  },
});

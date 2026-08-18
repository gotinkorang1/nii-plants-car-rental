import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const e2ePort = "3001";
const e2eBaseUrl = `http://127.0.0.1:${e2ePort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: e2eBaseUrl,
    trace: "on-first-retry",
  },
  webServer: {
    command: `npm run start -- --hostname 127.0.0.1 --port ${e2ePort}`,
    url: e2eBaseUrl,
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      ...process.env,
      PAYSTACK_MOCK: "1",
      EMAIL_DEV_OUTBOX: "1",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      testMatch: /cross-browser-smoke\.spec\.ts/,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      testMatch: /cross-browser-smoke\.spec\.ts/,
      use: { ...devices["Desktop Safari"] },
    },
  ],
});

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  outputDir: "./e2e/artifacts/test-results",
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    actionTimeout: 10_000,
  },
  webServer: [
    {
      command: "pnpm --filter @dragonwake/server start",
      url: "http://localhost:3001/health",
      timeout: 120_000,
      reuseExistingServer: false,
      env: { DEV_FAST_TIME: "1", DEV_SKIP_TUTORIAL: "0", PORT: "3001" },
    },
    {
      command: "pnpm dev:web",
      url: "http://localhost:5173",
      timeout: 120_000,
      reuseExistingServer: false,
      env: { DEV_FAST_TIME: "1" },
    },
  ],
});

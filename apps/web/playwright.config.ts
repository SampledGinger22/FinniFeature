import { defineConfig, devices } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// E2E + visual-regression config. Step 3 uses it for the kitchen-sink snapshot (§14); the full
// happy-path E2E suite lands in Step 6. Default export is required by Playwright.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: BASE_URL },
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'bun run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

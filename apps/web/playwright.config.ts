import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const API_HEALTH_URL = 'http://localhost:3001/api/health';

// E2E + visual-regression config. Starts the web dev server and the @finni/api dev server (the
// latter in zero-config pglite demo mode), so the caseload slice runs end-to-end. Default export
// is required by Playwright.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: BASE_URL },
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'bun run dev',
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'bun run dev',
      cwd: fileURLToPath(new URL('../api', import.meta.url)),
      url: API_HEALTH_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});

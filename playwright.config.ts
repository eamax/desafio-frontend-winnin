import { defineConfig, devices } from '@playwright/test';

const externalBaseUrl = process.env.E2E_BASE_URL;
const visualTests = process.env.VISUAL_TESTS === '1';
export default defineConfig({
  testDir: './e2e',
  testMatch: visualTests ? '**/visual.spec.ts' : '**/*.spec.ts',
  testIgnore: visualTests ? [] : ['**/visual.spec.ts'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: externalBaseUrl || 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: 'npm run dev -- --port 4173 --strictPort',
        url: 'http://127.0.0.1:4173',
        reuseExistingServer: !process.env.CI,
      },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
      },
    },
  ],
});

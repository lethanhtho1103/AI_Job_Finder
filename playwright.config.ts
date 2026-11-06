import { defineConfig, devices } from '@playwright/test';
import { randomBytes } from 'node:crypto';

export default defineConfig({
  testDir: './tests/e2e',
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.TEST_DATABASE_URL ? 1 : undefined,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:3100', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' },
    },
  ],
  webServer: {
    command:
      process.env.AUTH_E2E_DEVELOPMENT === '1'
        ? 'npm run dev -- --hostname 127.0.0.1 --port 3100'
        : 'npm run start -- --hostname 127.0.0.1 --port 3100',
    env: {
      NEXTAUTH_SECRET: randomBytes(32).toString('base64'),
      NEXTAUTH_URL: 'http://127.0.0.1:3100',
      ...(process.env.TEST_DATABASE_URL
        ? { DATABASE_URL: process.env.TEST_DATABASE_URL }
        : {}),
    },
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});

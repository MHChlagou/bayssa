import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const BASE_URL = `http://localhost:${PORT}/nafissa/`
/** One swappable server per engine, so the update tests cannot disturb each other. */
export const UPDATE_SERVER_PORTS = { chromium: 4180, firefox: 4181, webkit: 4182 } as const

// End-to-end tests run against the production build, served the way GitHub
// Pages serves it (under /nafissa/), with the real service worker.
// Firefox is not tested: see "Browser support" in the README.
// These are engine tests on a desktop machine: "mobile-safari" and
// "android-chrome" emulate the screen and user agent, not the real devices.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // In CI every attempt is listed in the log, and the JSON report feeds scripts/report-test-attempts.ts,
  // which states which tests passed only after a retry.
  reporter: process.env.CI ? [['list'], ['github'], ['json', { outputFile: 'test-reports/e2e.json' }], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: BASE_URL, locale: 'ar-EG', trace: 'retain-on-failure' },
  projects: [
    { name: 'android-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 860 } } },
    { name: 'desktop-safari', use: { ...devices['Desktop Safari'], viewport: { width: 1366, height: 860 } } },
    // An iPhone is shown how to install the app on every screen until that notice is closed.
    // It starts closed here so it does not cover what other tests press. Its own tests open it again.
    { name: 'mobile-safari', use: { ...devices['iPhone 14'], storageState: { cookies: [], origins: [{ origin: `http://localhost:${PORT}`, localStorage: [{ name: 'md:v1:install-notice', value: '{"version":1,"data":{"isDismissed":true}}' }] }] } } },
  ],
  webServer: [
    { command: `npm run preview -- --port ${PORT} --strictPort`, url: BASE_URL, reuseExistingServer: !process.env.CI, timeout: 60_000 },
    ...Object.values(UPDATE_SERVER_PORTS).map((port) => ({
      command: `node tests/support/versioned-server.ts ${port}`,
      url: `http://localhost:${port}/nafissa/`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    })),
  ],
})

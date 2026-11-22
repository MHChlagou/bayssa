import { defineConfig, devices } from '@playwright/test'

// Not 4190: Firefox and WebKit refuse that port (it is reserved for another protocol).
const PORT = 4178
const BASE_URL = `http://localhost:${PORT}/bayssa/`
// The private repository builds the public variant into dist-public. A public checkout builds it into dist.
const DIST = process.env.PUBLIC_DIST ?? 'dist-public'

// Smoke tests for the public build (`npm run build:public`), which carries
// only content whose redistribution is documented.
export default defineConfig({
  testDir: 'tests/public',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: 'list',
  use: { baseURL: BASE_URL, locale: 'ar-EG', trace: 'retain-on-failure' },
  projects: [
    { name: 'android-chrome', use: { ...devices['Pixel 7'] } },
    { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: `npx vite preview --outDir ${DIST} --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})

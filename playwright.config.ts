import { defineConfig, devices } from '@playwright/test'

const headless = process.env.E2E_HEADLESS === 'true'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3100',
    headless,
    trace: 'on',
    screenshot: 'on',
    video: 'on',
    actionTimeout: 20_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'PORT=3100 pnpm dev',
    url: 'http://localhost:3100',
    reuseExistingServer: true,
    timeout: 180_000,
  },
})

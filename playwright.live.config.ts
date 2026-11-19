import { defineConfig } from '@playwright/test'
import { assertLiveChain, loadDotEnv } from './e2e/live/support/env'

loadDotEnv()
assertLiveChain()

const port = process.env.E2E_LIVE_PORT ?? '3200'

export default defineConfig({
  testDir: './e2e/live',
  testMatch: '**/*.live.ts',
  outputDir: './test-results/live-artifacts',
  timeout: 420_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['./e2e/live/support/markdown-reporter.ts']],
  use: { actionTimeout: 30_000 },
  webServer:
    process.env.E2E_KEPLR_SETUP === '1'
      ? undefined
      : {
          command: `PORT=${port} pnpm dev`,
          url: `http://localhost:${port}`,
          reuseExistingServer: true,
          timeout: 180_000,
        },
})

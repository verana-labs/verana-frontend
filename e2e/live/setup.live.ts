import { test } from '@playwright/test'
import { loadDotEnv, readLiveEnv } from './support/env'
import { launchKeplrContext } from './support/keplr'

loadDotEnv()

test('one-time Keplr profile setup, import the test wallet and set the password by hand', async ({ playwright }) => {
  test.skip(process.env.E2E_KEPLR_SETUP !== '1', 'set E2E_KEPLR_SETUP=1 to open the profile for manual setup')
  test.setTimeout(0)
  const context = await launchKeplrContext(readLiveEnv(), playwright.chromium)
  const page = context.pages()[0] ?? (await context.newPage())
  await page.goto('about:blank')
  await page.pause()
  await context.close()
})

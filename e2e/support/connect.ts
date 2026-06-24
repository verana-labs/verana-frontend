import { expect, type Page } from '@playwright/test'
import { installKeplrMock } from './keplr-mock'

type ConnectOptions = {
  prefix?: string
  gotoTimeout?: number
  connectedTimeout?: number
}

/**
 * Reusable wallet-connect helper extracted from connect.spec.ts / create-ecosystem.spec.ts.
 *
 * Installs the postMessage Keplr mock (signing delegated to a CosmJS wallet in Node), loads
 * /dashboard, opens the connect modal, picks Keplr, and asserts the Connected state. No chain
 * write happens here — connect only triggers wallet `enable` + `getKey`, both faked by the mock.
 */
export async function connectWallet(page: Page, opts: ConnectOptions = {}) {
  const { prefix = 'verana', connectedTimeout = 20_000 } = opts

  await installKeplrMock(page, { prefix })

  await page.goto('/dashboard')
  await page.waitForLoadState('domcontentloaded')

  await page
    .getByRole('button', { name: /connect/i })
    .first()
    .click()
  await page.getByText(/keplr/i).first().click()

  await expect(page.getByText(/connected/i).first()).toBeVisible({ timeout: connectedTimeout })
}

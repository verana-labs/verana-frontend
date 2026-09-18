import { expect, type Page, test } from '@playwright/test'
import en from '../app/i18n/dataview/en.json'
import { connectWallet } from './support/connect'

const CHAIN_ID = 'vna-faucet-e2e'

// Body of GET /v1/info with every field that parseInfo in useFaucet.ts requires.
function infoBody(overrides: Record<string, unknown> = {}) {
  return {
    chainId: CHAIN_ID,
    denom: 'uvna',
    defaultAmount: '1000000',
    maxAmountPerHour: '5000000',
    maxAmountPerDay: '20000000',
    available: true,
    unavailableReason: null,
    auth: { challengePrefix: 'Verana faucet challenge: ', nonceTtlSeconds: 120, tokenTtlSeconds: 3600 },
    ...overrides,
  }
}

async function openGetVNA(page: Page, info: Record<string, unknown>) {
  await page.route('**/v1/info', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(info),
    })
  )
  // Per [VFE-PAGE-ACCT-3]: the deep link opens the Get VNA card on the account page.
  await page.goto('/account?getVNA=true')
  await expect(page.getByText(CHAIN_ID)).toBeVisible()
}

test.describe('Get VNA panel', () => {
  test.beforeEach(async ({ page }) => {
    await connectWallet(page)
  })

  test('shows the faucet info and rejects an amount out of bounds (VFE-PAGE-ACCT-4)', async ({ page }) => {
    await openGetVNA(page, infoBody())

    await expect(page.getByText(en['getvna.limitHour'])).toBeVisible()
    const requestButton = page.getByRole('button', { name: en['getvna.request'] })
    await expect(requestButton).toBeEnabled()

    await page.locator('#getvna-amount').fill('0')
    await expect(requestButton).toBeDisabled()
    await expect(page.getByText(en['getvna.amount.invalid'].replace('{max}', '5 VNA'))).toBeVisible()
  })

  test('shows the unavailable state and disables the action (VFE-PAGE-ACCT-4)', async ({ page }) => {
    await openGetVNA(page, infoBody({ available: false, unavailableReason: 'LOW_BALANCE' }))

    await expect(page.getByRole('alert').getByText(en['getvna.unavailable.LOW_BALANCE'])).toBeVisible()
    await expect(page.getByRole('button', { name: en['getvna.request'] })).toBeDisabled()
  })
})

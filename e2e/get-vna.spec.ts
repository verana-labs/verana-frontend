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

const TX_HASH = '0B90A74FB6BEC5A0080AB9FF919B35809D7199A7D30ED31AFBA1C68A1C937EBE'

// Stubs the challenge and token routes of the faucet. The token is issued for the account that asked the challenge.
async function stubFaucetAuth(page: Page) {
  let account = ''
  await page.route('**/v1/auth/challenge', async (route) => {
    account = String(route.request().postDataJSON()?.account ?? '')
    await route.fulfill({ json: { nonce: 'nonce-1', expiresAt: '2099-01-01T00:00:00.000Z' } })
  })
  await page.route('**/v1/auth/token', async (route) => {
    const body = route.request().postDataJSON() ?? {}
    // The wallet signature must reach the faucet as the ADR-036 exchange sends it.
    if (body.account !== account || body.nonce !== 'nonce-1' || !body.pubKey || !body.signature) {
      await route.fulfill({ status: 401, json: { error: { code: 'AUTH_FAILED', message: 'bad exchange' } } })
      return
    }
    await route.fulfill({ json: { token: 'token-1', expiresAt: '2099-01-01T00:00:00.000Z', account } })
  })
  return () => account
}

function dispenseBody(status: 'confirmed' | 'pending', recipient: string) {
  return {
    status,
    txHash: TX_HASH,
    ...(status === 'confirmed' ? { height: '1234567' } : {}),
    recipient,
    amount: '1000000',
    denom: 'uvna',
    quota: {},
  }
}

async function requestVNA(page: Page) {
  await page.getByRole('button', { name: en['getvna.request'] }).click()
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

  test('signs the challenge, shows the received amount and links the hash after a 200 (VFE-PAGE-ACCT-5/6)', async ({
    page,
  }) => {
    const account = await stubFaucetAuth(page)
    let authorization = ''
    await page.route('**/v1/faucet', async (route) => {
      authorization = route.request().headers().authorization ?? ''
      await route.fulfill({ status: 200, json: dispenseBody('confirmed', account()) })
    })
    await openGetVNA(page, infoBody())

    await requestVNA(page)

    await expect(
      page.getByRole('status').getByText(en['getvna.result.received'].replace('{amount}', '1 VNA'))
    ).toBeVisible()
    const link = page.getByRole('link', { name: TX_HASH }).first()
    await expect(link).toHaveAttribute('href', /\/tx\/0B90A74F/)
    await expect(page.locator('.notify-success .notify-msg-link')).toHaveAttribute('href', /\/tx\/0B90A74F/)
    expect(authorization).toBe('Bearer token-1')
  })

  test('shows the pending state with the hash after a 202 (VFE-PAGE-ACCT-6)', async ({ page }) => {
    const account = await stubFaucetAuth(page)
    await page.route('**/v1/faucet', (route) =>
      route.fulfill({ status: 202, json: dispenseBody('pending', account()) })
    )
    await openGetVNA(page, infoBody())

    await requestVNA(page)

    await expect(
      page.getByRole('status').getByText(en['getvna.result.pending'].replace('{amount}', '1 VNA'))
    ).toBeVisible()
    await expect(page.getByRole('link', { name: TX_HASH }).first()).toBeVisible()
  })

  test('names the binding window and its reset time on QUOTA_EXCEEDED (VFE-PAGE-ACCT-7)', async ({ page }) => {
    await stubFaucetAuth(page)
    const window = { limit: '5000000', used: '5000000', remaining: '0', resetsAt: '2099-01-01T10:30:00.000Z' }
    await page.route('**/v1/faucet', (route) =>
      route.fulfill({
        status: 429,
        json: {
          error: {
            code: 'QUOTA_EXCEEDED',
            message: 'per-account hourly quota exceeded',
            details: {
              window: 'hour',
              quota: { hour: window, day: { ...window, resetsAt: null }, global: { ...window, resetsAt: null } },
            },
          },
        },
      })
    )
    await openGetVNA(page, infoBody())

    await requestVNA(page)

    // The panel notice, not the toast (both have role="alert").
    const alert = page.locator('[role="alert"]:not(.notify-notification)').filter({ hasText: en['getvna.window.hour'] })
    await expect(alert).toBeVisible()
    await expect(alert).not.toContainText('QUOTA_EXCEEDED')
    await expect(alert).toContainText(/2099/)
    // Per issue §3 the raw code stays in the notification details.
    await expect(page.locator('.notify-error')).toContainText('QUOTA_EXCEEDED')
  })
})

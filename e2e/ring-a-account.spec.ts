import { expect, type Page, test } from '@playwright/test'
import { connectWallet } from './support/connect'
import { HARNESS_ADDRESS, HARNESS_MNEMONIC, installCorporationStubs, seedActingCorporation } from './support/corp-stubs'

test('the account address copies, shows a local QR dialog and links the explorer', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  const qrRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('qrserver')) qrRequests.push(request.url())
  })
  await installCorporationStubs(page)
  await seedActingCorporation(page, 13)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/account')
  const main = page.getByRole('main')
  await expect(main.getByText(HARNESS_ADDRESS, { exact: true })).toBeVisible({ timeout: 15_000 })

  await main.getByRole('button', { name: 'Copy Address' }).click()
  await expect(main.getByRole('button', { name: 'Copied!' })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(HARNESS_ADDRESS)

  await expect(main.getByRole('link', { name: 'Pingpub' })).toHaveAttribute(
    'href',
    new RegExp(`/account/${HARNESS_ADDRESS}$`)
  )

  await main.getByRole('button', { name: 'Address QR Code' }).click()
  const dialog = page.getByRole('dialog', { name: 'Account QR Code' })
  await expect(dialog.getByText(HARNESS_ADDRESS, { exact: true })).toBeVisible()
  await expect(dialog.locator('svg title')).toHaveText('Account QR Code')
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  expect(qrRequests).toEqual([])
})

test('opening a membership switches the acting corporation and lands on the corporation page', async ({ page }) => {
  await installCorporationStubs(page)
  await seedActingCorporation(page, 12)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/account')
  const card = page.locator('div', { has: page.getByRole('heading', { name: 'Corporations' }) }).last()
  const list = card.getByRole('list')
  const acme = list.getByRole('button', { name: /Acme Trust AG/ })
  await expect(acme).toBeVisible({ timeout: 15_000 })
  await expect(list.getByRole('button', { name: /did:web:keplr/ })).toHaveAttribute('aria-current', 'true')
  await expect(acme).toContainText('Operator')
  await expect(acme).toContainText('Member ×3')
  await expect(acme.getByLabel('1 Proposals awaiting your vote')).toBeVisible()
  await expect(page.getByText('Corporations are created and managed on the Corporation page.')).toBeVisible()
  await expect(page.getByRole('main').getByRole('button', { name: /create|new corporation/i })).toHaveCount(0)

  await acme.click()
  await expect(page).toHaveURL(/\/corporation(\?|$)/)
  await expect(page.getByRole('heading', { name: /Acme Trust AG/ })).toBeVisible({ timeout: 15_000 })

  await page.locator('aside a[href="/account"]').click()
  await expect(
    page
      .getByRole('main')
      .getByRole('list')
      .getByRole('button', { name: /Acme Trust AG/ })
  ).toHaveAttribute('aria-current', 'true', { timeout: 15_000 })
})

test('a failed discovery is not presented as an empty membership list', async ({ page }) => {
  await installCorporationStubs(page, { fresh: true })
  await page.route('**/v4/group/corporations-by-member*', (route) =>
    route.fulfill({ status: 502, json: { error: 'indexer unavailable', code: 502 } })
  )
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/account')
  const main = page.getByRole('main')
  await expect(main.getByText('Discovery failed, so this list may be incomplete.')).toBeVisible({ timeout: 15_000 })
  await expect(main.getByRole('button', { name: 'Retry discovery' })).toBeVisible()
  await expect(main.getByText('This wallet is not an operator or a member of any corporation yet.')).toBeHidden()
})

const getVNACard = (page: Page) => page.getByRole('button', { name: /get vna tokens/i })

async function unsetFaucetUrl(page: Page) {
  await page.addInitScript(() => {
    let stored: Record<string, string | undefined> | undefined
    Object.defineProperty(window, '__ENV', {
      configurable: true,
      get: () => stored,
      set: (value: Record<string, string | undefined>) => {
        stored = { ...value, NEXT_PUBLIC_VERANA_FAUCET_URL: undefined }
      },
    })
  })
}

test('Ring A, the Get VNA card is shown when the faucet url is set', async ({ page }) => {
  await installCorporationStubs(page)
  await seedActingCorporation(page, 12)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/account')
  await expect(page.getByRole('heading', { name: 'Account', exact: true })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: /claim yield/i }).first()).toBeVisible({ timeout: 15_000 })
  await expect(getVNACard(page).first()).toBeVisible()
})

test('Ring A, the Get VNA card is hidden when the faucet url is unset', async ({ page }) => {
  await unsetFaucetUrl(page)
  await installCorporationStubs(page)
  await seedActingCorporation(page, 12)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/account?getVNA=true')
  await expect(page.getByRole('heading', { name: 'Account', exact: true })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: /claim yield/i }).first()).toBeVisible({ timeout: 15_000 })
  await expect(getVNACard(page)).toHaveCount(0)
})

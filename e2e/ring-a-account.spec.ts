import { expect, type Page, test } from '@playwright/test'
import { connectWallet } from './support/connect'
import { HARNESS_MNEMONIC, installCorporationStubs, seedActingCorporation } from './support/corp-stubs'

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

import { expect, test } from '@playwright/test'
import { connectWallet } from './support/connect'
import { HARNESS_MNEMONIC, installCorporationStubs, seedActingCorporation } from './support/corp-stubs'

const EMPTY = 'No pending validation tasks.'
const FAILED = 'Pending tasks could not be loaded.'
const LOADED_ONLY = 'This list may be incomplete, only the first 1024 ecosystems with pending tasks were loaded.'

test('pending tasks explain an empty list', async ({ page }) => {
  await installCorporationStubs(page)
  await seedActingCorporation(page, 12)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/pendingtasks')
  await expect(page.getByText(EMPTY)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(FAILED)).toBeHidden()
  await expect(page.getByText(LOADED_ONLY)).toBeHidden()
})

test('a full pending tasks window says the tree holds the loaded results only', async ({ page }) => {
  await installCorporationStubs(page)
  const ecosystems = Array.from({ length: 1024 }, (_, index) => ({
    id: index + 1,
    did: null,
    pending_tasks: 1,
    participants: 1,
    schemas: [],
  }))
  await page.route('**/v4/participant/pending/flat*', (route) =>
    route.fulfill({ json: { ecosystems: route.request().url().includes('corporation_id=13') ? ecosystems : [] } })
  )
  await seedActingCorporation(page, 13)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/pendingtasks')
  await expect(page.getByText('Ecosystem 1', { exact: true })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(LOADED_ONLY)).toBeVisible()
})

test('pending tasks never read a failed load as an empty list', async ({ page }) => {
  await installCorporationStubs(page)
  await page.route('**/v4/participant/pending/flat*', (route) =>
    route.fulfill({ status: 503, json: { error: 'indexer unavailable', code: 503 } })
  )
  await seedActingCorporation(page, 12)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/pendingtasks')
  await expect(page.getByText(FAILED)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(EMPTY)).toBeHidden()
})

test('switching corporation drops the previous tasks when the new list fails', async ({ page }) => {
  await installCorporationStubs(page)
  await page.route('**/v4/participant/pending/flat*', (route) =>
    route.request().url().includes('corporation_id=13')
      ? route.fulfill({
          json: { ecosystems: [{ id: 1, did: null, pending_tasks: 1, participants: 1, schemas: [] }] },
        })
      : route.fulfill({ status: 503, json: { error: 'indexer unavailable', code: 503 } })
  )
  await seedActingCorporation(page, 13)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/pendingtasks')
  await expect(page.getByText('Ecosystem 1')).toBeVisible({ timeout: 15_000 })

  await page
    .getByRole('button', { name: /Acme Trust AG/ })
    .first()
    .click()
  await page.getByRole('menuitem', { name: /did:web:kepl/ }).click()
  await expect(page.getByText(FAILED)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Ecosystem 1')).toBeHidden()
})

test('the pending tasks badge adds the proposals awaiting a vote and the page links to them', async ({ page }) => {
  await installCorporationStubs(page)
  await page.route('**/v4/participant/pending/flat*', (route) =>
    route.fulfill({ json: { ecosystems: [{ id: 1, did: null, pending_tasks: 2, participants: 2, schemas: [] }] } })
  )
  await seedActingCorporation(page, 13)
  await connectWallet(page, { mnemonic: HARNESS_MNEMONIC })

  await page.goto('/pendingtasks')
  await expect(page.locator('[data-nav-item="/pendingtasks"] [data-nav-badge]')).toHaveText('3', {
    timeout: 15_000,
  })
  await expect(page.locator('[data-nav-item="/corporation"] [data-nav-badge]')).toHaveText('1')
  await expect(page.getByText('Proposals awaiting your vote: 1.')).toBeVisible()

  await page.getByRole('link', { name: 'Open the proposals' }).click()
  await expect(page).toHaveURL(/\/corporation\?tab=proposals/)
})

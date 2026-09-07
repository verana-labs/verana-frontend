import { randomUUID } from 'node:crypto'
import { expect, type Page, test } from '@playwright/test'
import { connectWallet } from './support/connect'
import { createEcosystem } from './support/flows'
import { requireFundedMnemonic } from './support/mnemonic'

const confirmIfPresent = async (page: Page) => {
  const confirm = page.locator('.btn-action-confirm')
  if (await confirm.isVisible().catch(() => false)) await confirm.click().catch(() => {})
}

const archivedPill = (page: Page) =>
  page
    .locator('section')
    .filter({ has: page.locator('h1') })
    .getByText('ARCHIVED', { exact: true })

const mutableSection = (page: Page) =>
  page.locator('section').filter({ has: page.getByRole('heading', { name: /mutable configuration/i }) })

test('archive then unarchive an ecosystem (real devnet broadcast)', async ({ page }) => {
  test.setTimeout(300_000)
  await connectWallet(page, { mnemonic: requireFundedMnemonic() })

  const did = `did:web:e2e-archive-${randomUUID().replace(/-/g, '').slice(0, 8)}.devnet.verana.network`
  const ecosystemId = await createEcosystem(page, { did })
  console.log(`created ecosystem ${ecosystemId}`)

  await test.step('archive', async () => {
    await expect(archivedPill(page)).toHaveCount(0)
    await mutableSection(page)
      .getByRole('button', { name: /^archive$/i })
      .click()
    await confirmIfPresent(page)
    await expect(archivedPill(page)).toBeVisible({ timeout: 120_000 })
  })

  await test.step('unarchive', async () => {
    await mutableSection(page)
      .getByRole('button', { name: /^unarchive$/i })
      .click()
    await confirmIfPresent(page)
    await expect(archivedPill(page)).toHaveCount(0, { timeout: 120_000 })
    await expect(mutableSection(page).getByRole('button', { name: /^archive$/i })).toBeVisible({ timeout: 20_000 })
  })
})

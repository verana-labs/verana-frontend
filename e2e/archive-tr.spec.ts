import { expect, test } from '@playwright/test'
import { installKeplrMock } from './mocks/keplrMock'
import { requireFundedMnemonic } from './support/mnemonic'

const SHOT = 'e2e/artifacts'
const DOC_URL =
  'https://raw.githubusercontent.com/verana-labs/mosip-playground/0835414ea1ec121153666c74538d4ff608d3c941/docs/egf/mosip-pilot-egf.md'

const labelInput = (page: import('@playwright/test').Page, label: string) =>
  page.locator(`label.data-edit-label:has-text("${label}")`).locator('xpath=following-sibling::input[1]')

// The noForm archive/unarchive modal auto-submits once the fee simulation and balance checks
// resolve, so the confirm button can disappear before we click it. Click only if it is still
// present; either path broadcasts the same MsgArchiveTrustRegistry.
const confirmIfPresent = async (page: import('@playwright/test').Page) => {
  const confirm = page.locator('.btn-action-confirm')
  if (await confirm.isVisible().catch(() => false)) {
    await confirm.click().catch(() => {})
  }
}

// The ARCHIVED pill lives in EcosystemHeader (the section that carries the h1 displayName).
// Scoping there avoids matching the "ARCHIVED" badge a credential-schema card would render.
const archivedPill = (page: import('@playwright/test').Page) =>
  page
    .locator('section')
    .filter({ has: page.locator('h1') })
    .getByText('ARCHIVED', { exact: true })

// The Archive/Unarchive controls live in the "Mutable Configuration" section header.
// Scoping there avoids colliding with the "Show Archived" filter label elsewhere on the page.
const mutableSection = (page: import('@playwright/test').Page) =>
  page.locator('section').filter({ has: page.getByRole('heading', { name: /mutable configuration/i }) })

test('archive-tr: sign + broadcast MsgArchiveTrustRegistry then unarchive on testnet', async ({ page }) => {
  test.setTimeout(300_000)
  const stamp = Date.now().toString(36)
  const did = `did:web:e2e-archive-${stamp}.testnet.verana.network`
  const aka = `https://e2e-archive-${stamp}.testnet.verana.network`

  const mnemonic = requireFundedMnemonic()
  await installKeplrMock(page, { mnemonic })

  await test.step('connect', async () => {
    await page.goto('/dashboard')
    await page
      .getByRole('button', { name: /connect/i })
      .first()
      .click()
    await page.getByText(/keplr/i).first().click()
    await expect(page.getByText(/connected/i).first()).toBeVisible({ timeout: 20_000 })
  })

  let trId: string | undefined

  await test.step('create a trust registry we own', async () => {
    await page.goto('/tr')
    await page
      .getByRole('button', { name: /create ecosystem/i })
      .first()
      .click()
    await expect(page.getByText(/basic information/i)).toBeVisible()

    await page.getByPlaceholder('Healthcare Credentials Ecosystem').fill('E2E Archive Ecosystem')
    await page.getByPlaceholder('Healthcare Trust Registry').fill('E2E Archive Trust Registry')
    await page.getByPlaceholder('did:method:identifier').first().fill(did)
    await labelInput(page, 'AKA').fill(aka)

    await page.getByPlaceholder(/search languages/i).fill('English')
    await page
      .getByRole('option', { name: /english/i })
      .first()
      .click()

    await labelInput(page, 'Document URL').fill(DOC_URL)

    await page.locator('.btn-action-confirm').click()
    await page.waitForURL(/\/tr\/\d+(\?|$)/, { timeout: 90_000 })
    await expect(page.getByText(did).first()).toBeVisible()
    trId = page.url().match(/\/tr\/(\d+)/)?.[1]
    console.log(`CREATED TR ${trId}, ${did}`)
    expect(trId).toBeTruthy()
  })

  await test.step('archive the trust registry', async () => {
    const archiveBtn = mutableSection(page).getByRole('button', { name: /^archive$/i })
    await expect(archiveBtn).toBeVisible({ timeout: 20_000 })
    await expect(archivedPill(page)).toHaveCount(0)
    await archiveBtn.click()

    await confirmIfPresent(page)

    await expect(archivedPill(page)).toBeVisible({ timeout: 120_000 })
    await page.screenshot({ path: `${SHOT}/archive-tr-archived.png`, fullPage: true })
    console.log(`ARCHIVED TR ${trId}`)
  })

  await test.step('assert archived state', async () => {
    await expect(archivedPill(page)).toBeVisible()
    await expect(mutableSection(page).getByRole('button', { name: /^unarchive$/i })).toBeVisible({ timeout: 20_000 })
  })

  await test.step('unarchive the trust registry', async () => {
    const unarchiveBtn = mutableSection(page).getByRole('button', { name: /^unarchive$/i })
    await unarchiveBtn.click()

    await confirmIfPresent(page)

    await expect(archivedPill(page)).toHaveCount(0, { timeout: 120_000 })
    await expect(mutableSection(page).getByRole('button', { name: /^archive$/i })).toBeVisible({ timeout: 20_000 })
    await page.screenshot({ path: `${SHOT}/archive-tr-unarchived.png`, fullPage: true })
    console.log(`UNARCHIVED TR ${trId}`)
  })
})

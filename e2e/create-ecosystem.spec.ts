import { expect, test } from '@playwright/test'
import { installKeplrMock } from './support/keplr-mock'

const SHOT = 'e2e/artifacts'
// A real, reachable governance doc so /api/sri can fetch it and compute the digest.
const DOC_URL =
  'https://raw.githubusercontent.com/verana-labs/mosip-playground/0835414ea1ec121153666c74538d4ff608d3c941/docs/egf/mosip-pilot-egf.md'

const labelInput = (page: import('@playwright/test').Page, label: string) =>
  page.locator(`label.data-edit-label:has-text("${label}")`).locator('xpath=following-sibling::input[1]')

test('create ecosystem: sign + broadcast MsgCreateTrustRegistry to testnet', async ({ page }) => {
  test.setTimeout(180_000)
  const stamp = Date.now().toString(36)
  const did = `did:web:e2e-${stamp}.testnet.verana.network`
  const aka = `https://e2e-${stamp}.testnet.verana.network`

  await installKeplrMock(page, { prefix: 'verana' })

  await test.step('connect', async () => {
    await page.goto('/dashboard')
    await page
      .getByRole('button', { name: /connect/i })
      .first()
      .click()
    await page.getByText(/keplr/i).first().click()
    await expect(page.getByText(/connected/i).first()).toBeVisible({ timeout: 20_000 })
  })

  await test.step('open + fill create-ecosystem form', async () => {
    await page.goto('/tr')
    await page
      .getByRole('button', { name: /create ecosystem/i })
      .first()
      .click()
    await expect(page.getByText(/basic information/i)).toBeVisible()

    await page.getByPlaceholder('Healthcare Credentials Ecosystem').fill('E2E Test Ecosystem')
    await page.getByPlaceholder('Healthcare Trust Registry').fill('E2E Trust Registry')
    await page.getByPlaceholder('did:method:identifier').first().fill(did)
    await labelInput(page, 'AKA').fill(aka)

    await page.getByPlaceholder(/search languages/i).fill('English')
    await page
      .getByRole('option', { name: /english/i })
      .first()
      .click()

    await labelInput(page, 'Document URL').fill(DOC_URL)
    await page.screenshot({ path: `${SHOT}/06-filled.png`, fullPage: true })
  })

  await test.step('broadcast and verify success', async () => {
    await page.locator('.btn-action-confirm').click()
    // Success = the app redirects to the new trust registry's detail page.
    await page.waitForURL(/\/tr\/\d+(\?|$)/, { timeout: 90_000 })
    await expect(page.getByText(did).first()).toBeVisible()
    const trId = page.url().match(/\/tr\/(\d+)/)?.[1]
    await page.screenshot({ path: `${SHOT}/07-broadcast-result.png`, fullPage: true })
    console.log(`CREATED TR ${trId} — ${did}`)
    expect(trId).toBeTruthy()
  })
})

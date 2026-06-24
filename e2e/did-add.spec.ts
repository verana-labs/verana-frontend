import { expect, test } from '@playwright/test'
import { installKeplrMock } from './support/keplr-mock'

const SHOT = 'e2e/artifacts'

// The years field is a native <select> rendered as an unassociated `label.data-edit-label` sibling,
// so we walk from the label to the next sibling control rather than relying on for/id association.
const labelSelect = (page: import('@playwright/test').Page, label: string) =>
  page.locator(`label.data-edit-label:has-text("${label}")`).locator('xpath=following-sibling::select[1]')

test('add DID: sign + broadcast MsgAddDID to testnet', async ({ page }) => {
  test.setTimeout(180_000)
  const stamp = Date.now().toString(36)
  const did = `did:web:e2e-did-${stamp}.testnet.verana.network`
  const years = '2'

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

  await test.step('open + fill add-DID form', async () => {
    await page.goto('/did')
    await page
      .getByRole('button', { name: /add did/i })
      .first()
      .click()

    const didInput = page.getByPlaceholder('did:method:identifier')
    await expect(didInput).toBeVisible()
    await didInput.fill(did)
    await labelSelect(page, 'Registration/Extension Period (years)').selectOption({ label: years })

    await page.screenshot({ path: `${SHOT}/08-did-filled.png`, fullPage: true })
  })

  await test.step('broadcast and verify success', async () => {
    await page.locator('.btn-action-confirm').click()
    // No redirect here (modal flow). Success = the success toast naming our DID; `.notify-success`
    // distinguishes it from the in-progress (`notify-in-progress`) and failure (`notify-error`) toasts,
    // which all reuse the same message container and DID text.
    await expect(page.locator('.notify-success', { hasText: did })).toBeVisible({ timeout: 90_000 })
    await page.screenshot({ path: `${SHOT}/09-did-broadcast-result.png`, fullPage: true })
    console.log(`ADDED DID ${did}`)
  })
})

import { expect, test } from '@playwright/test'
import { installKeplrMock } from './mocks/keplrMock'
import { requireFundedMnemonic } from './support/mnemonic'

const SHOT = 'e2e/artifacts'

const labelSelect = (page: import('@playwright/test').Page, label: string) =>
  page.locator(`label.data-edit-label:has-text("${label}")`).locator('xpath=following-sibling::select[1]')

test('add DID: sign + broadcast MsgAddDID to testnet', async ({ page }) => {
  test.setTimeout(180_000)
  const stamp = Date.now().toString(36)
  const did = `did:web:e2e-did-${stamp}.testnet.verana.network`
  const years = '2'

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
    await expect(page.locator('.notify-success', { hasText: did })).toBeVisible({ timeout: 90_000 })
    await page.screenshot({ path: `${SHOT}/09-did-broadcast-result.png`, fullPage: true })
    console.log(`ADDED DID ${did}`)
  })
})

import { expect, test } from '@playwright/test'
import { installKeplrMock } from './mocks/keplrMock'
import { requireFundedMnemonic } from './support/mnemonic'

const SHOT = 'e2e/artifacts'

test('reclaim yield: trigger MsgReclaimTrustDepositYield from /account', async ({ page }) => {
  test.setTimeout(180_000)

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

  await test.step('open account and trigger claim-yield action', async () => {
    await page.goto('/account')
    await page.waitForLoadState('networkidle')

    const claimYield = page.getByRole('button', { name: /claim yield/i }).first()
    await expect(claimYield).toBeVisible({ timeout: 20_000 })
    await claimYield.click()

    await expect(page.getByText(/yield available|no yield available yet/i).first()).toBeVisible({ timeout: 20_000 })
    await page.screenshot({ path: `${SHOT}/reclaim-yield-01-expanded.png`, fullPage: true })
  })

  await test.step('broadcast if yield is available, otherwise accept the benign no-yield state', async () => {
    const noYieldCard = page.getByText(/no yield available yet/i).first()
    // EditableDataView only renders the confirm button when the yield card is "available";
    // with no yield the button never mounts and nothing is broadcast.
    const confirmBtn = page.locator('.btn-action-confirm')

    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click()
      // Success is a toast here, not a redirect: this flow has no detail page to land on.
      const successToast = page.locator('.notify-success')
      const errorToast = page.locator('.notify-error')
      await expect(successToast.or(errorToast)).toBeVisible({ timeout: 90_000 })
      await expect(errorToast).toHaveCount(0)
      await expect(successToast).toContainText(/yield successfully claimed/i)
    } else {
      await expect(noYieldCard).toBeVisible()
      await expect(confirmBtn).toHaveCount(0)
    }

    await page.screenshot({ path: `${SHOT}/reclaim-yield-02-result.png`, fullPage: true })
  })
})

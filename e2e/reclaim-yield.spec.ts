import { expect, test } from '@playwright/test'
import { connectWallet } from './support/connect'
import { requireFundedMnemonic } from './support/mnemonic'

test('reclaim yield from /account (MsgReclaimTrustDepositYield)', async ({ page }) => {
  test.setTimeout(180_000)
  await connectWallet(page, { mnemonic: requireFundedMnemonic() })

  await page.goto('/account')
  await page.waitForLoadState('networkidle')
  await page
    .getByRole('button', { name: /claim yield/i })
    .first()
    .click()
  await expect(page.getByText(/yield available|no yield available yet/i).first()).toBeVisible({ timeout: 20_000 })

  const confirmBtn = page.locator('.btn-action-confirm')
  if (await confirmBtn.isVisible().catch(() => false)) {
    await confirmBtn.click()
    const successToast = page.locator('.notify-success')
    const errorToast = page.locator('.notify-error')
    await expect(successToast.or(errorToast)).toBeVisible({ timeout: 90_000 })
    await expect(errorToast).toHaveCount(0)
    await expect(successToast).toContainText(/yield successfully claimed/i)
  } else {
    await expect(page.getByText(/no yield available yet/i).first()).toBeVisible()
    await expect(confirmBtn).toHaveCount(0)
  }
})

import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { connectWallet } from './support/connect'
import { labelSelect } from './support/forms'
import { requireFundedMnemonic } from './support/mnemonic'

test('add a DID (real testnet broadcast)', async ({ page }) => {
  test.setTimeout(180_000)
  await connectWallet(page, { mnemonic: requireFundedMnemonic() })

  const did = `did:web:e2e-did-${randomUUID().replace(/-/g, '').slice(0, 8)}.testnet.verana.network`

  await page.goto('/did')
  await page
    .getByRole('button', { name: /add did/i })
    .first()
    .click()
  const didInput = page.getByPlaceholder('did:method:identifier')
  await expect(didInput).toBeVisible()
  await didInput.fill(did)
  await labelSelect(page, 'Registration/Extension Period (years)').selectOption({ label: '2' })

  await page.locator('.btn-action-confirm').click()
  await expect(page.locator('.notify-success', { hasText: did })).toBeVisible({ timeout: 90_000 })
  console.log(`added DID ${did}`)
})

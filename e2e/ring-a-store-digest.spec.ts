import { expect, test } from '@playwright/test'
import { connectWallet } from './support/connect'
import { installMockChain } from './support/mock-chain'

const RPC_METHODS = ['status', 'abci_query', 'broadcast_tx_sync', 'tx_search']

test('Ring A — store digest uses V4 corporation authority without a real chain write', async ({ page }) => {
  test.setTimeout(90_000)
  const digest = `sha384-${Date.now().toString(36)}`
  const wallet = await connectWallet(page)
  const mock = await installMockChain(page, { address: wallet.bech32Address, storedDigest: digest })

  await page.locator('a[href="/digests"]').first().click()
  await expect(page).toHaveURL(/\/digests$/)
  await page.getByLabel('SRI digest').fill(digest)
  await page.getByRole('button', { name: /store digest/i }).click()

  await expect(page.locator('.notify-success')).toContainText(/digest successfully stored/i, { timeout: 60_000 })
  await expect(page.getByRole('heading', { name: /digest found/i })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText(digest, { exact: true })).toBeVisible()

  const methods = mock.seenMethods()
  for (const method of RPC_METHODS) expect(methods).toContain(method)
  await mock.teardown()
})

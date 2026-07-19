import { expect, test } from '@playwright/test'
import { connectWallet } from './support/connect'
import { fillEcosystemForm } from './support/flows'
import { installMockChain } from './support/mock-chain'

const FAKE_ECOSYSTEM_ID = '777'
const RPC_METHODS = ['status', 'abci_query', 'broadcast_tx_sync', 'tx_search']

test('Ring A — create ecosystem reaches faked success without a real chain write', async ({ page }) => {
  test.setTimeout(90_000)
  const stamp = Date.now().toString(36)

  const wallet = await connectWallet(page)
  const mock = await installMockChain(page, { address: wallet.bech32Address, ecosystemId: FAKE_ECOSYSTEM_ID })

  await fillEcosystemForm(page, {
    did: `did:web:ring-a-${stamp}.devnet.verana.network`,
    docUrl: `https://ring-a-${stamp}.example/egf.md`,
  })
  await page.locator('.btn-action-confirm').click()

  const ecosystemUrl = new RegExp(`/ecosystems/${FAKE_ECOSYSTEM_ID}(\\?|$)`)
  await expect.poll(() => page.url(), { timeout: 60_000 }).toMatch(ecosystemUrl)

  const methods = mock.seenMethods()
  for (const m of RPC_METHODS) expect(methods).toContain(m)
  expect(methods.filter((method) => method === 'broadcast_tx_sync')).toHaveLength(1)
  await mock.teardown()
})

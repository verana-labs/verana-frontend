import { expect, type Page, test } from '@playwright/test'
import { connectWallet } from './support/connect'
import { fillEcosystemForm } from './support/flows'
import { installMockChain } from './support/mock-chain'

const FAKE_TR_ID = '777'
const RPC_METHODS = ['status', 'abci_query', 'broadcast_tx_sync', 'tx_search']

const walletAddress = (page: Page) =>
  page.evaluate(async () => {
    // biome-ignore lint/suspicious/noExplicitAny: page global exposed by the keplr mock
    const k = await (window as any).__mock_getKey()
    return k.bech32Address as string
  })

test('Ring A — create ecosystem reaches faked success without a real chain write', async ({ page }) => {
  test.setTimeout(90_000)
  const stamp = Date.now().toString(36)

  await connectWallet(page)
  const address = await walletAddress(page)
  const mock = await installMockChain(page, { address, trustRegistryId: FAKE_TR_ID })

  await fillEcosystemForm(page, {
    did: `did:web:ring-a-${stamp}.testnet.verana.network`,
    docUrl: `https://ring-a-${stamp}.example/egf.md`,
    orgName: 'Ring A Ecosystem',
  })
  await page.locator('.btn-action-confirm').click()

  await page.waitForURL(new RegExp(`/tr/${FAKE_TR_ID}(\\?|$)`), { timeout: 60_000 })
  expect(page.url()).toMatch(new RegExp(`/tr/${FAKE_TR_ID}(\\?|$)`))

  const methods = mock.seenMethods()
  for (const m of RPC_METHODS) expect(methods).toContain(m)
  await mock.teardown()
})

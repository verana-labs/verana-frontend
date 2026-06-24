import { expect, type Page, test } from '@playwright/test'
import { connectWallet } from './support/connect'
import { installMockChain } from './support/mock-chain'

const SHOT = 'e2e/artifacts'
const FAKE_TR_ID = '777'

const labelInput = (page: Page, label: string) =>
  page.locator(`label.data-edit-label:has-text("${label}")`).locator('xpath=following-sibling::input[1]')

const walletAddress = (page: Page) =>
  page.evaluate(async () => {
    // biome-ignore lint/suspicious/noExplicitAny: page global exposed by the keplr mock
    const k = await (window as any).__mock_getKey()
    return k.bech32Address as string
  })

// Ring A is fund-free: the tx is signed for real but installMockChain intercepts the RPC, so nothing
// broadcasts. Success is the app's redirect to /tr/<id> driven by the faked create_trust_registry event.
test('Ring A — create ecosystem reaches faked success without a real chain write', async ({ page }) => {
  test.setTimeout(90_000)

  const stamp = Date.now().toString(36)
  const did = `did:web:ring-a-${stamp}.testnet.verana.network`
  const aka = `https://ring-a-${stamp}.testnet.verana.network`
  const docUrl = `https://ring-a-${stamp}.example/egf.md`

  await connectWallet(page)

  const address = await walletAddress(page)
  const mock = await installMockChain(page, { address, trustRegistryId: FAKE_TR_ID })

  await test.step('open + fill create-ecosystem form', async () => {
    await page.goto('/tr')
    await page
      .getByRole('button', { name: /create ecosystem/i })
      .first()
      .click()
    await expect(page.getByText(/basic information/i)).toBeVisible()

    await page.getByPlaceholder('Healthcare Credentials Ecosystem').fill('Ring A Ecosystem')
    await page.getByPlaceholder('Healthcare Trust Registry').fill('Ring A Trust Registry')
    await page.getByPlaceholder('did:method:identifier').first().fill(did)
    await labelInput(page, 'AKA').fill(aka)

    await page.getByPlaceholder(/search languages/i).fill('English')
    await page
      .getByRole('option', { name: /english/i })
      .first()
      .click()

    await labelInput(page, 'Document URL').fill(docUrl)
    await page.screenshot({ path: `${SHOT}/ring-a-01-filled.png`, fullPage: true })
  })

  await test.step('sign + faked broadcast, assert redirect to the new TR', async () => {
    await page.locator('.btn-action-confirm').click()

    await page.waitForURL(new RegExp(`/tr/${FAKE_TR_ID}(\\?|$)`), { timeout: 60_000 })
    await page.screenshot({ path: `${SHOT}/ring-a-02-faked-success.png`, fullPage: true })

    expect(page.url()).toMatch(new RegExp(`/tr/${FAKE_TR_ID}(\\?|$)`))
  })

  // Prove signing actually ran through the amino flow against the interceptor, not a stub shortcut.
  const methods = mock.seenMethods()
  expect(methods).toContain('status')
  expect(methods).toContain('abci_query')
  expect(methods).toContain('broadcast_tx_sync')
  expect(methods).toContain('tx_search')

  await mock.teardown()
})

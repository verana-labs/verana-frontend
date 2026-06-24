import { randomUUID } from 'node:crypto'
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import { StargateClient } from '@cosmjs/stargate'
import { expect, type Page, test } from '@playwright/test'
import { VERANA_TESTNET_CHAIN_INFO } from './mocks/chainInfo'
import { installKeplrMock } from './mocks/keplrMock'
import { requireFundedMnemonic } from './support/mnemonic'

const MIN_BALANCE_UVNA = BigInt(11_000_000)
const DOC_URL =
  'https://raw.githubusercontent.com/verana-labs/mosip-playground/0835414ea1ec121153666c74538d4ff608d3c941/docs/egf/mosip-pilot-egf.md'

const labelInput = (page: Page, label: string) =>
  page.locator(`label.data-edit-label:has-text("${label}")`).locator('xpath=following-sibling::input[1]')

// The dApp swallows simulate/broadcast failures, so watch the RPC responses for a chain rejection.
function watchChainErrors(page: Page) {
  const host = new URL(VERANA_TESTNET_CHAIN_INFO.rpc).host
  const state: { error?: string } = {}
  page.on('response', async (resp) => {
    if (resp.request().method() !== 'POST' || !resp.url().includes(host)) return
    try {
      const parsed = JSON.parse(await resp.text())
      const inner = parsed?.result?.response ?? parsed?.result
      if (inner?.code && inner.code !== 0 && !state.error) {
        state.error = `chain rejected tx: code=${inner.code} log=${String(inner?.log ?? '').slice(0, 400)}`
      } else if (parsed?.error && !state.error) {
        state.error = `RPC error: ${JSON.stringify(parsed.error).slice(0, 400)}`
      }
    } catch {}
  })
  return state
}

test('connect mocked Keplr and create an ecosystem (real testnet broadcast)', async ({ page }) => {
  test.setTimeout(300_000)
  const mnemonic = requireFundedMnemonic()
  const prefix = VERANA_TESTNET_CHAIN_INFO.bech32Config.bech32PrefixAccAddr
  const [account] = await (await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix })).getAccounts()

  const rpc = await StargateClient.connect(VERANA_TESTNET_CHAIN_INFO.rpc)
  const balance = BigInt((await rpc.getBalance(account.address, 'uvna')).amount)
  rpc.disconnect()
  if (balance < MIN_BALANCE_UVNA) {
    throw new Error(
      `Test wallet ${account.address} has ${Number(balance) / 1e6} VNA, needs >= ${Number(MIN_BALANCE_UVNA) / 1e6} (10 deposit + ~1 gas).`
    )
  }

  await installKeplrMock(page, { mnemonic })
  const chainErrors = watchChainErrors(page)

  await page.goto('/dashboard')
  expect(
    await page.evaluate(() => (window as unknown as { keplrRequestMetaIdSupport?: unknown }).keplrRequestMetaIdSupport)
  ).toBe(true)

  await page
    .getByRole('button', { name: /connect wallet|connect/i })
    .first()
    .click()
  await page
    .getByText(/^keplr/i)
    .first()
    .click()
  await expect(page.locator('body')).toContainText(account.address.slice(-5), { timeout: 20_000 })
  await expect(page.getByText(/connected/i).first()).toBeVisible({ timeout: 5_000 })

  await page.goto('/tr')
  await page
    .getByRole('button', { name: /create ecosystem/i })
    .first()
    .click()
  await expect(page.getByText(/basic information/i)).toBeVisible()

  const did = `did:web:e2e-${randomUUID().replace(/-/g, '').slice(0, 8)}.testnet.verana.network`
  await page.getByPlaceholder('Healthcare Credentials Ecosystem').fill('E2E Test Ecosystem')
  await page.getByPlaceholder('Healthcare Trust Registry').fill('E2E Trust Registry')
  await page.getByPlaceholder('did:method:identifier').first().fill(did)
  await labelInput(page, 'AKA').fill(`https://${did.split(':').pop()}`)
  await page.getByPlaceholder(/search languages/i).fill('English')
  await page
    .getByRole('option', { name: /english/i })
    .first()
    .click()
  await labelInput(page, 'Document URL').fill(DOC_URL)

  await page.locator('.btn-action-confirm').click()

  const success = expect(page.getByRole('heading', { name: did }))
    .toBeVisible({ timeout: 240_000 })
    .then(() => 'ok' as const)
  const failure = new Promise<'error'>((resolve) => {
    const timer = setInterval(() => {
      if (chainErrors.error) {
        clearInterval(timer)
        resolve('error')
      }
    }, 250)
  })
  if ((await Promise.race([success, failure])) === 'error') {
    throw new Error(`testnet rejected the create-ecosystem tx: ${chainErrors.error}`)
  }
  console.log(`created ecosystem ${did}`)
})

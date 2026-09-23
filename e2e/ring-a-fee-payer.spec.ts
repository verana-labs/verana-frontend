import { fromBase64 } from '@cosmjs/encoding'
import { expect, type Page, test } from '@playwright/test'
import { AuthInfo, TxRaw } from 'cosmjs-types/cosmos/tx/v1beta1/tx'
import { connectWallet } from './support/connect'
import { ACME_POLICY_ADDRESS } from './support/corp-fixtures'
import { fillEcosystemForm } from './support/flows'
import { installMockChain, stubCorporationRoutes } from './support/mock-chain'

const CORPORATION_ID = 7
const SHORT_BALANCE_UVNA = '500000'
const SHORTFALL_TEXT = /Your balance of 0\.5 VNA does not cover/

function broadcastGranter(tx: string): string {
  return AuthInfo.decode(TxRaw.decode(fromBase64(tx)).authInfoBytes).fee?.granter ?? ''
}

async function openConfirmation(page: Page, balanceUvna?: string) {
  await stubCorporationRoutes(page, CORPORATION_ID, ACME_POLICY_ADDRESS)
  const wallet = await connectWallet(page)
  const mock = await installMockChain(page, {
    address: wallet.bech32Address,
    corporationId: CORPORATION_ID,
    corporationPolicyAddress: ACME_POLICY_ADDRESS,
    balanceUvna,
  })
  const stamp = Date.now().toString(36)
  await fillEcosystemForm(page, {
    did: `did:web:ring-a-${stamp}.devnet.verana.network`,
    docUrl: `https://ring-a-${stamp}.example/egf.md`,
  })
  await page.locator('.btn-action-confirm').click()
  const dialog = page.getByRole('dialog', { name: 'Confirm transaction' })
  await expect(dialog).toBeVisible({ timeout: 30_000 })
  return { wallet, mock, dialog }
}

test('a covering fee grant makes the corporation the fee granter', async ({ page }) => {
  test.setTimeout(120_000)
  const lookups: URLSearchParams[] = []
  await page.route('**/v4/delegation/fee-grants*', (route) => {
    lookups.push(new URL(route.request().url()).searchParams)
    return route.fulfill({
      json: { fee_grants: [{ msg_types: [], spend_limit: null, remaining_spend: null, expiration: null }] },
    })
  })
  const { wallet, mock, dialog } = await openConfirmation(page, SHORT_BALANCE_UVNA)

  await expect(dialog.getByText('The corporation covers this network fee with a fee grant.')).toBeVisible({
    timeout: 30_000,
  })
  await expect(dialog.getByText('Paid by').locator('..')).not.toContainText('(you)')
  await expect(dialog.getByText(SHORTFALL_TEXT)).toHaveCount(0)
  expect(lookups[0]?.get('grantor_corporation_id')).toBe(String(CORPORATION_ID))
  expect(lookups[0]?.get('grantee')).toBe(wallet.bech32Address)
  expect(lookups[0]?.get('msg_type')).toBe('/verana.ec.v1.MsgCreateEcosystem')
  expect(lookups[0]?.get('only_active')).toBe('true')

  await dialog.getByRole('button', { name: 'Confirm' }).click()
  await expect.poll(() => mock.broadcastTxs().length, { timeout: 30_000 }).toBeGreaterThan(0)
  expect(broadcastGranter(mock.broadcastTxs()[0])).toBe(ACME_POLICY_ADDRESS)
  await mock.teardown()
})

test('a failed fee grant lookup leaves the account as fee payer', async ({ page }) => {
  test.setTimeout(120_000)
  await page.route('**/v4/delegation/fee-grants*', (route) =>
    route.fulfill({ status: 500, json: { error: 'relation "fee_grants" does not exist', code: 500 } })
  )
  const { mock, dialog } = await openConfirmation(page, SHORT_BALANCE_UVNA)

  await expect(dialog.getByText('The fee grant could not be checked, your account pays this network fee.')).toBeVisible(
    { timeout: 30_000 }
  )
  await expect(dialog.getByText('Paid by').locator('..')).toContainText('(you)')
  await expect(dialog.getByText(SHORTFALL_TEXT)).toBeVisible()

  await dialog.getByRole('button', { name: 'Confirm' }).click()
  await expect.poll(() => mock.broadcastTxs().length, { timeout: 30_000 }).toBeGreaterThan(0)
  expect(broadcastGranter(mock.broadcastTxs()[0])).toBe('')
  await mock.teardown()
})

test('a limited grant whose remaining spend is below the fee leaves the account as fee payer', async ({ page }) => {
  test.setTimeout(120_000)
  await page.route('**/v4/delegation/fee-grants*', (route) =>
    route.fulfill({
      json: {
        fee_grants: [
          {
            msg_types: [],
            spend_limit: [{ denom: 'uvna', amount: '1000000' }],
            remaining_spend: [{ denom: 'uvna', amount: '1' }],
          },
        ],
      },
    })
  )
  const { mock, dialog } = await openConfirmation(page)

  await expect(dialog.getByText('Network fee').locator('..')).toContainText(/VNA/, { timeout: 30_000 })
  await expect(dialog.getByText('Paid by').locator('..')).toContainText('(you)')
  await expect(dialog.getByText('The corporation covers this network fee with a fee grant.')).toHaveCount(0)

  await dialog.getByRole('button', { name: 'Confirm' }).click()
  await expect.poll(() => mock.broadcastTxs().length, { timeout: 30_000 }).toBeGreaterThan(0)
  expect(broadcastGranter(mock.broadcastTxs()[0])).toBe('')
  await mock.teardown()
})

test('a lookup still in flight holds Confirm and names no payer', async ({ page }) => {
  test.setTimeout(120_000)
  let release: () => void = () => {}
  const released = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/v4/delegation/fee-grants*', async (route) => {
    await released
    await route.fulfill({
      json: { fee_grants: [{ msg_types: [], spend_limit: null, remaining_spend: null }] },
    })
  })
  const { mock, dialog } = await openConfirmation(page)
  const confirm = dialog.getByRole('button', { name: 'Confirm' })

  await expect(dialog.getByText('Network fee').locator('..')).toContainText(/VNA/, { timeout: 30_000 })
  await expect(dialog.getByText('Checking the fee grant…')).toBeVisible()
  await expect(dialog.getByText('Paid by').locator('..')).not.toContainText('verana1')
  await expect(confirm).toBeDisabled()

  release()
  await expect(dialog.getByText('The corporation covers this network fee with a fee grant.')).toBeVisible()
  await expect(confirm).toBeEnabled()
  await confirm.click()
  await expect.poll(() => mock.broadcastTxs().length, { timeout: 30_000 }).toBeGreaterThan(0)
  expect(broadcastGranter(mock.broadcastTxs()[0])).toBe(ACME_POLICY_ADDRESS)
  await mock.teardown()
})

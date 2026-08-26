import { randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { VERANA_DEVNET_CHAIN_INFO } from './mocks/chainInfo'
import { watchChainErrors } from './support/chain'
import { connectWallet } from './support/connect'
import { DEFAULT_DOC_URL } from './support/flows'
import { requireFundedMnemonic } from './support/mnemonic'

const LCD = VERANA_DEVNET_CHAIN_INFO.rest
const INDEXER = 'https://idx.devnet.verana.network/v4'

async function json(url: string): Promise<Record<string, unknown>> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url} responded ${response.status}`)
  return (await response.json()) as Record<string, unknown>
}

async function activeGrants(address: string): Promise<Record<string, unknown>[]> {
  const payload = await json(`${INDEXER}/delegation/operator-authorizations?operator=${address}&only_active=true`)
  return Array.isArray(payload.authorizations) ? (payload.authorizations as Record<string, unknown>[]) : []
}

test('bootstrap a corporation and self-grant the wallet as operator (real devnet broadcast)', async ({ page }) => {
  test.setTimeout(400_000)
  const wallet = await connectWallet(page, { mnemonic: requireFundedMnemonic() })
  const address = wallet.bech32Address
  test.skip(
    (await activeGrants(address)).length > 0,
    `${address} already operates a corporation, fund a fresh wallet to exercise the bootstrap`
  )

  const chainErrors = watchChainErrors(page)
  await page.goto('/account')
  await expect(page.getByRole('heading', { name: /corporation setup/i })).toBeVisible({ timeout: 30_000 })

  const did = `did:web:e2e-corp-${randomUUID().replace(/-/g, '').slice(0, 8)}.devnet.verana.network`
  await page.getByLabel('Corporation DID').fill(did)
  await page.getByLabel('CGF language').fill('en')
  await page.getByLabel('CGF document URL').fill(DEFAULT_DOC_URL)
  await page.getByLabel('Policy funding (uvna)').fill('200000000')
  await page.getByRole('button', { name: /complete corporation setup/i }).click()

  const errorToast = page.locator('.notify-error')
  await expect
    .poll(
      async () => {
        if (chainErrors.error) return chainErrors.error
        if ((await errorToast.count()) > 0) return `toast: ${await errorToast.first().innerText()}`
        return (await activeGrants(address)).length > 0 ? 'granted' : 'pending'
      },
      { timeout: 300_000, intervals: [3_000] }
    )
    .toBe('granted')

  const [grant] = await activeGrants(address)
  const corporation = (await json(`${INDEXER}/corporation/get/${grant.corporation_id}`)).corporation as Record<
    string,
    unknown
  >
  expect(corporation.did).toBe(did)
  const chainGrants = await json(`${LCD}/de/v1/authz/list?operator=${address}`)
  expect(
    Array.isArray(chainGrants.operator_authorizations) && chainGrants.operator_authorizations.length
  ).toBeGreaterThan(0)
  const groups = await json(`${LCD}/cosmos/group/v1/groups_by_member/${address}`)
  expect(Array.isArray(groups.groups) && groups.groups.length).toBeGreaterThan(0)
  console.log(`bootstrap ok: corporation ${grant.corporation_id} (${did}) operated by ${address}`)
})

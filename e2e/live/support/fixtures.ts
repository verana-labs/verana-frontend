import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import { type BrowserContext, test as base, expect, type Page } from '@playwright/test'
import {
  assertTxSucceeded,
  type FetchedTx,
  hashFromPage,
  type ProposalOutcome,
  TxWatcher,
  uvnaBalance,
  waitForTx,
} from './chain-tx'
import { type LiveEnv, readLiveEnv } from './env'
import {
  approveInKeplr,
  assertKeplrReady,
  autoApproveSetupPopups,
  expectKeplrPopup,
  launchKeplrContext,
  rejectInKeplr,
} from './keplr'

export type SignExpectation = {
  popupTypes: string[]
  chainTypes?: string[]
  outcome?: ProposalOutcome
}

export type LiveSession = {
  env: LiveEnv
  context: BrowserContext
  txs: TxWatcher
}

export type Signed = FetchedTx & { hash: string }

export const test = base.extend<{ app: Page }, { live: LiveSession }>({
  live: [
    async ({ playwright }, use) => {
      const env = readLiveEnv()
      const context = await launchKeplrContext(env, playwright.chromium)
      try {
        await assertKeplrReady(context)
        await use({ env, context, txs: new TxWatcher(context) })
      } finally {
        await context.close()
      }
    },
    { scope: 'worker', timeout: 120_000 },
  ],
  app: async ({ live }, use, testInfo) => {
    const page = await live.context.newPage()
    await use(page)
    if (testInfo.status !== testInfo.expectedStatus) {
      const body = await page.screenshot().catch(() => undefined)
      if (body) await testInfo.attach('app-on-failure', { body, contentType: 'image/png' })
    }
    await page.close()
  },
})

export { expect }

export async function signWithKeplr(
  live: LiveSession,
  page: Page,
  trigger: () => Promise<void>,
  expected: SignExpectation
): Promise<Signed> {
  const mark = live.txs.mark()
  const popup = expectKeplrPopup(live.context)
  await trigger()
  await approveInKeplr(await popup, {
    chainId: live.env.chainId,
    chainName: live.env.chainName,
    messageTypes: expected.popupTypes,
  })
  const hash = (await live.txs.next(mark, 60_000)) ?? (await hashFromPage(page, 90_000))
  if (!hash) throw new Error('Keplr approved but no broadcast was seen, and no transaction link appeared in the app')
  const fetched = await waitForTx(live.env, hash)
  assertTxSucceeded(fetched, expected.chainTypes ?? expected.popupTypes, expected.outcome)
  test.info().annotations.push({ type: 'tx', description: hash })
  return { ...fetched, hash }
}

export async function rejectWithKeplr(live: LiveSession, trigger: () => Promise<void>): Promise<number> {
  const mark = live.txs.mark()
  const popup = expectKeplrPopup(live.context)
  await trigger()
  await rejectInKeplr(await popup)
  await new Promise((resolve) => setTimeout(resolve, 5_000))
  const broadcasts = live.txs.mark() - mark
  expect(broadcasts, 'a rejected signature must not broadcast').toBe(0)
  return broadcasts
}

export async function connectApp(live: LiveSession, page: Page): Promise<string> {
  await page.goto('/account')
  const stop = autoApproveSetupPopups(live.context, { chainId: live.env.chainId, chainName: live.env.chainName })
  try {
    const connected = page.getByText(/connected/i).first()
    if (!(await connected.isVisible({ timeout: 8_000 }).catch(() => false))) {
      await page
        .getByRole('button', { name: /connect/i })
        .first()
        .click()
      await page.getByText(/keplr/i).first().click()
      await expect(connected).toBeVisible({ timeout: 90_000 })
    }
  } finally {
    stop()
  }
  const address = await page.evaluate(async (chainId) => {
    const keplr = (window as unknown as { keplr?: { getKey(id: string): Promise<{ bech32Address: string }> } }).keplr
    if (!keplr) throw new Error('window.keplr is missing, the extension did not inject into the page')
    return (await keplr.getKey(chainId)).bech32Address
  }, live.env.chainId)
  return address
}

export async function assertFunded(live: LiveSession, address: string): Promise<bigint> {
  const balance = await uvnaBalance(live.env, address)
  if (balance < live.env.minUvna) {
    throw new Error(
      `${address} holds ${balance} uvna on ${live.env.chainId}, the suite needs at least ${live.env.minUvna}. Fund it from the faucet.`
    )
  }
  return balance
}

export async function throwawayAddress(): Promise<string> {
  const wallet = await DirectSecp256k1HdWallet.generate(12, { prefix: 'verana' })
  const [account] = await wallet.getAccounts()
  return account.address
}

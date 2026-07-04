import type { Page } from '@playwright/test'
import { VERANA_TESTNET_CHAIN_INFO } from '../mocks/chainInfo'

// The dApp swallows simulate/broadcast failures, so surface chain rejections from the RPC responses.
export function watchChainErrors(page: Page) {
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

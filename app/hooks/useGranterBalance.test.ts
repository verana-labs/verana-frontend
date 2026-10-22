import { toBase64 } from '@cosmjs/encoding'
import { QuerySpendableBalanceByDenomResponse } from 'cosmjs-types/cosmos/bank/v1beta1/query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FEE_GRANT_LOOKUP_TIMEOUT_MS } from '@/hooks/useFeeGrant'
import { logger } from '@/lib/logger'
import { parseBalanceQuery, startGranterBalanceLookup } from './useGranterBalance'

const RPC = 'https://rpc.example'
const GRANTER = 'verana1granter'

function balancePayload(amount: string, code = 0) {
  const value = QuerySpendableBalanceByDenomResponse.encode({ balance: { denom: 'uvna', amount } }).finish()
  return { jsonrpc: '2.0', id: 1, result: { response: { code, value: toBase64(value) } } }
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('parseBalanceQuery', () => {
  it('reads the native amount from the abci_query response', () => {
    expect(parseBalanceQuery(balancePayload('4200'))).toBe('4200')
  })

  it('rejects a failed query instead of reading it as an empty balance', () => {
    expect(() => parseBalanceQuery(balancePayload('0', 5))).toThrow()
    expect(() => parseBalanceQuery({ result: {} })).toThrow()
  })

  it('rejects a response without a balance instead of reading it as zero', () => {
    expect(() => parseBalanceQuery({ result: { response: { code: 0, value: '' } } })).toThrow()
  })
})

describe('startGranterBalanceLookup', () => {
  it('reports the granter balance', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => balancePayload('4200') }) as unknown as Response)
    )
    const settled = vi.fn()

    startGranterBalanceLookup(RPC, GRANTER, settled)

    await vi.waitFor(() => expect(settled).toHaveBeenCalledWith({ status: 'ready', amount: '4200' }))
  })

  it('aborts the query and reports an unknown balance when the node does not answer within the deadline', async () => {
    vi.useFakeTimers()
    vi.spyOn(logger, 'error').mockImplementation(() => {})
    let signal: AbortSignal | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            signal = init?.signal ?? undefined
            signal?.addEventListener('abort', () => reject(new Error('aborted')))
          })
      )
    )
    const settled = vi.fn()

    startGranterBalanceLookup(RPC, GRANTER, settled)
    await vi.advanceTimersByTimeAsync(FEE_GRANT_LOOKUP_TIMEOUT_MS - 1)
    expect(settled).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)

    expect(signal?.aborted).toBe(true)
    expect(settled).toHaveBeenCalledWith({ status: 'failed' })
  })

  it('aborts the query when cancelled and reports nothing', async () => {
    let signal: AbortSignal | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        signal = init?.signal ?? undefined
        return new Promise<Response>(() => {})
      })
    )
    const settled = vi.fn()

    const cancel = startGranterBalanceLookup(RPC, GRANTER, settled)
    cancel()

    expect(signal?.aborted).toBe(true)
    expect(settled).not.toHaveBeenCalled()
  })
})

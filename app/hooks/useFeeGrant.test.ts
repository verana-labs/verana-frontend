import { afterEach, describe, expect, it, vi } from 'vitest'
import { logger } from '@/lib/logger'
import { FEE_GRANT_LOOKUP_TIMEOUT_MS, feeGrantsUrl, startFeeGrantLookup } from './useFeeGrant'

const ENDPOINT = 'https://indexer.example/v4/delegation'
const QUERY = { corporationId: 12, grantee: 'verana1me', msgType: '/verana.ec.v1.MsgCreateEcosystem' }

function grantsResponse(msgType: string): Response {
  return { ok: true, json: async () => ({ fee_grants: [{ msg_types: [msgType] }] }) } as unknown as Response
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('feeGrantsUrl', () => {
  it('filters on the acting corporation, the connected account and the message type', () => {
    expect(
      feeGrantsUrl('https://indexer.example/v4/delegation', {
        corporationId: 12,
        grantee: 'verana1me',
        msgType: '/verana.ec.v1.MsgCreateEcosystem',
      })
    ).toBe(
      'https://indexer.example/v4/delegation/fee-grants?grantor_corporation_id=12&grantee=verana1me&msg_type=%2Fverana.ec.v1.MsgCreateEcosystem&only_active=true'
    )
  })
})

describe('startFeeGrantLookup', () => {
  it('falls back to the account when the indexer does not answer within the deadline', async () => {
    vi.useFakeTimers()
    vi.spyOn(logger, 'error').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new Error('aborted')))
          })
      )
    )
    const settled = vi.fn()

    startFeeGrantLookup(ENDPOINT, QUERY, settled)
    expect(settled).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(FEE_GRANT_LOOKUP_TIMEOUT_MS)

    expect(settled).toHaveBeenCalledWith({ status: 'failed' })
  })

  it('keeps a superseded lookup from overwriting the current one', async () => {
    const pending: ((response: Response) => void)[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            pending.push(resolve)
          })
      )
    )
    const superseded = vi.fn()
    const current = vi.fn()

    const cancel = startFeeGrantLookup(ENDPOINT, QUERY, superseded)
    cancel()
    startFeeGrantLookup(ENDPOINT, { ...QUERY, msgType: '/verana.ec.v1.MsgUpdateEcosystem' }, current)
    pending[1]?.(grantsResponse('/verana.ec.v1.MsgUpdateEcosystem'))
    pending[0]?.(grantsResponse('/verana.ec.v1.MsgCreateEcosystem'))
    await vi.waitFor(() => expect(current).toHaveBeenCalled())

    expect(superseded).not.toHaveBeenCalled()
    expect(current).toHaveBeenCalledWith({
      status: 'ready',
      grants: [
        {
          msgTypes: ['/verana.ec.v1.MsgUpdateEcosystem'],
          spendLimit: null,
          remainingSpend: null,
          expiration: null,
        },
      ],
    })
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/config/env', () => ({
  VERANA_REST_ENDPOINT: 'https://chain.example',
  VERANA_REST_ENDPOINT_CORPORATION: 'https://indexer.example/v4/corporation',
  VERANA_REST_ENDPOINT_DELEGATION: 'https://indexer.example/v4/delegation',
}))
vi.mock('@/hooks/useVeranaChain', () => ({
  useVeranaChain: () => ({ chain_name: 'VeranaDevnet1' }),
}))
vi.mock('@cosmos-kit/react', () => ({
  useChain: () => ({ address: undefined }),
}))

import { OPERATOR_GRANT_MESSAGE_TYPES } from '@/msg/constants/operatorGrantMessageTypes'
import { resolveUserCorporation } from './useUserCorporation'

describe('resolveUserCorporation', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resolves an active V4 operator authorization through the indexer', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authorizations: [
            {
              id: 1,
              corporation_id: 7,
              operator: 'verana1operator',
              msg_types: [...OPERATOR_GRANT_MESSAGE_TYPES],
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          corporation: {
            id: 7,
            policy_address: 'verana1policy',
            did: 'did:web:corporation.example',
          },
          block_height: 123,
        }),
      })
    vi.stubGlobal('fetch', fetchMock)

    await expect(resolveUserCorporation('verana1operator')).resolves.toEqual({
      corporation: {
        id: 7,
        policyAddress: 'verana1policy',
        did: 'did:web:corporation.example',
      },
      hasOperatorGrant: true,
    })
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://indexer.example/v4/delegation/operator-authorizations?operator=verana1operator&only_active=true&limit=1024'
    )
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://indexer.example/v4/corporation/get/7')
  })

  it('keeps the corporation but requires an upgrade for a partial operator authorization', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authorizations: [
            {
              id: 1,
              corporation_id: 7,
              operator: 'verana1operator',
              msg_types: OPERATOR_GRANT_MESSAGE_TYPES.filter((msgType) => msgType !== '/verana.di.v1.MsgStoreDigest'),
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          corporation: {
            id: 7,
            policy_address: 'verana1policy',
            did: 'did:web:corporation.example',
          },
          block_height: 123,
        }),
      })
    vi.stubGlobal('fetch', fetchMock)

    await expect(resolveUserCorporation('verana1operator')).resolves.toEqual({
      corporation: {
        id: 7,
        policyAddress: 'verana1policy',
        did: 'did:web:corporation.example',
      },
      hasOperatorGrant: false,
    })
  })

  it('rejects malformed V4 operator authorization message types', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          authorizations: [
            {
              id: 1,
              corporation_id: 7,
              operator: 'verana1operator',
              msg_types: '/verana.di.v1.MsgStoreDigest',
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          corporation: {
            id: 7,
            policy_address: 'verana1policy',
            did: 'did:web:corporation.example',
          },
        }),
      })
    vi.stubGlobal('fetch', fetchMock)

    await expect(resolveUserCorporation('verana1operator')).rejects.toThrow(
      'Invalid corporation response: authorizations[0].msg_types'
    )
  })

  it('fails clearly when the authorization endpoint fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({ error: 'unavailable', code: 503 }),
      })
    )

    await expect(resolveUserCorporation('verana1operator')).rejects.toThrow(
      'Unable to resolve operator authorizations: 503'
    )
  })
})

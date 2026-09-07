import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/config/env', () => ({
  VERANA_REST_ENDPOINT_CORPORATION: 'https://indexer.example/v4/corporation',
  VERANA_REST_ENDPOINT_GROUP: 'https://indexer.example/v4/group',
  VERANA_REST_ENDPOINT_DELEGATION: 'https://indexer.example/v4/delegation',
}))
vi.mock('@/hooks/useVeranaChain', () => ({
  useVeranaChain: () => ({ chain_name: 'VeranaDevnet1' }),
}))
vi.mock('@cosmos-kit/react', () => ({
  useChain: () => ({ address: undefined }),
}))

import { resolveUserCorporation } from './useUserCorporation'

const GRANTED_MESSAGE_TYPES = [
  '/verana.ec.v1.MsgCreateEcosystem',
  '/verana.cs.v1.MsgCreateCredentialSchema',
  '/verana.di.v1.MsgStoreDigest',
]

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
              msg_types: [...GRANTED_MESSAGE_TYPES],
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
      grantedMessageTypes: [...GRANTED_MESSAGE_TYPES],
    })
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://indexer.example/v4/delegation/operator-authorizations?operator=verana1operator&only_active=true&limit=1024'
    )
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'https://indexer.example/v4/corporation/get/7')
  })

  it('keeps a partial operator authorization as the granted message types', async () => {
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
              msg_types: GRANTED_MESSAGE_TYPES.filter((msgType) => msgType !== '/verana.di.v1.MsgStoreDigest'),
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
      grantedMessageTypes: GRANTED_MESSAGE_TYPES.filter((msgType) => msgType !== '/verana.di.v1.MsgStoreDigest'),
    })
  })

  it('falls back to group membership when the wallet has no operator authorization', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ authorizations: [] }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          memberships: [{ corporation_id: 7, weight: '1', metadata: '', added_at: '2026-08-25T00:00:00Z' }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          corporation: { id: 7, policy_address: 'verana1policy', did: 'did:web:corporation.example' },
        }),
      })
    vi.stubGlobal('fetch', fetchMock)

    await expect(resolveUserCorporation('verana1member')).resolves.toEqual({
      corporation: { id: 7, policyAddress: 'verana1policy', did: 'did:web:corporation.example' },
      hasOperatorGrant: false,
      grantedMessageTypes: [],
    })
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://indexer.example/v4/group/corporations-by-member?account=verana1member'
    )
    expect(fetchMock).toHaveBeenNthCalledWith(3, 'https://indexer.example/v4/corporation/get/7')
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

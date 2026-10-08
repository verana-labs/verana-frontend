import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchActivityHistory, parseActivityHistory } from './activity-history'

describe('parseActivityHistory', () => {
  it('reads the live activity shape newest first and tolerates a missing account', () => {
    const rows = parseActivityHistory({
      entity_type: 'Corporation',
      entity_id: '13',
      activity: [
        {
          id: 1,
          timestamp: '2026-08-30T09:00:00Z',
          block_height: 404000,
          entity_type: 'Corporation',
          entity_id: '13',
          msg: 'SlashTrustDeposit',
          changes: null,
        },
        {
          id: 3,
          timestamp: '2026-09-01T11:00:00Z',
          block_height: 405300,
          entity_type: 'Corporation',
          entity_id: '13',
          msg: 'UpdateCorporation',
          changes: { did: 'did:web:acme-trust.ch' },
          account: 'verana1policy',
        },
        {
          id: 2,
          timestamp: '2026-09-01T10:00:00Z',
          block_height: 405000,
          entity_type: 'Corporation',
          entity_id: '13',
          msg: 'CreateCorporation',
          changes: { did: 'did:web:old.example' },
          account: 'verana1aaa',
        },
      ],
    })
    expect(rows.map((row) => row.msg)).toEqual(['UpdateCorporation', 'CreateCorporation', 'SlashTrustDeposit'])
    expect(rows[2]).toEqual({
      id: 1,
      timestamp: '2026-08-30T09:00:00Z',
      blockHeight: 404000,
      msg: 'SlashTrustDeposit',
      account: null,
      changes: {},
    })
  })

  it('rejects an envelope without the activity list', () => {
    expect(() => parseActivityHistory({ history: [] })).toThrow('activity')
  })

  it('reads a block height sent as a string and drops the indexer stats rows', () => {
    const rows = parseActivityHistory({
      entity_type: 'CredentialSchema',
      entity_id: '1',
      activity: [
        { id: 44, timestamp: '2026-09-30T10:00:00Z', block_height: 47394, msg: 'StatsUpdate', changes: {} },
        {
          id: 1,
          timestamp: '2026-09-29T10:24:51Z',
          block_height: '9384',
          msg: 'CreateCredentialSchema',
          account: 'verana1policy',
          changes: { title: 'Keplr Check 0929' },
        },
      ],
    })
    expect(rows).toEqual([
      {
        id: 1,
        timestamp: '2026-09-29T10:24:51Z',
        blockHeight: 9384,
        msg: 'CreateCredentialSchema',
        account: 'verana1policy',
        changes: { title: 'Keplr Check 0929' },
      },
    ])
  })
})

function item(id: number, msg: string) {
  return {
    id,
    timestamp: `2026-09-${String(1 + (id % 28)).padStart(2, '0')}T10:00:00Z`,
    block_height: id,
    msg,
    changes: {},
  }
}

describe('fetchActivityHistory', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('pages past a full page of stats rows with the max_id cursor', async () => {
    const statsPage = Array.from({ length: 64 }, (_, index) => item(200 - index, 'StatsUpdate'))
    const fetchMock = vi.fn(async (url: string) => ({
      ok: true,
      json: async () => ({
        activity: new URL(url).searchParams.has('max_id') ? [item(5, 'CreateCredentialSchema')] : statsPage,
      }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const { rows, partial } = await fetchActivityHistory('https://indexer.example/v4/credential-schema/history/1')

    expect(rows.map((row) => row.msg)).toEqual(['CreateCredentialSchema'])
    expect(partial).toBe(false)
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'https://indexer.example/v4/credential-schema/history/1?limit=64',
      'https://indexer.example/v4/credential-schema/history/1?limit=64&max_id=137',
    ])
  })

  it('stops after one request when the first page is not full', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ activity: [item(1, 'CreateEcosystem')] }) }))
    vi.stubGlobal('fetch', fetchMock)

    const { rows, partial } = await fetchActivityHistory('https://indexer.example/v4/ecosystem/history/1')

    expect(rows).toHaveLength(1)
    expect(partial).toBe(false)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('flags a partial window when it stops at the row cap', async () => {
    const fullPage = Array.from({ length: 64 }, (_, index) => item(200 - index, 'UpdateEcosystem'))
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ activity: fullPage }) }))
    vi.stubGlobal('fetch', fetchMock)

    const { rows, partial } = await fetchActivityHistory('https://indexer.example/v4/ecosystem/history/1')

    expect(rows).toHaveLength(64)
    expect(partial).toBe(true)
    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('fails instead of reading an unavailable history as empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 502, json: async () => ({}) }))
    )

    await expect(fetchActivityHistory('https://indexer.example/v4/ecosystem/history/1')).rejects.toThrow('502')
  })
})

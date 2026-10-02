import { describe, expect, it } from 'vitest'
import { parseActivityHistory } from './activity-history'

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

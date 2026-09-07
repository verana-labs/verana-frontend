import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/config/env', () => ({
  VERANA_REST_ENDPOINT_CORPORATION: 'https://indexer.example/v4/corporation',
  VERANA_REST_ENDPOINT_DELEGATION: 'https://indexer.example/v4/delegation',
  VERANA_REST_ENDPOINT_GROUP: 'https://indexer.example/v4/group',
  VERANA_REST_ENDPOINT_TRUST_DEPOSIT: 'https://indexer.example/v4/trust-deposit',
}))

import { logger } from '@/lib/logger'
import {
  fetchCorporationHistory,
  parseGovernance,
  parseGroup,
  parseHistory,
  parseOperatorAuthorizations,
  parseProfile,
  parseProposals,
  parseTrustDeposit,
  parseVsOperatorAuthorizations,
} from './useCorporationDetails'

describe('parseProfile', () => {
  it('reads the live corporation shape and tolerates a missing language', () => {
    const profile = parseProfile({
      block_height: 1,
      corporation: {
        id: 12,
        did: 'did:web:corp.example',
        policy_address: 'verana1policy',
        created: '2026-08-25T20:34:20.109Z',
        modified: null,
      },
    })
    expect(profile).toEqual({
      id: 12,
      did: 'did:web:corp.example',
      policyAddress: 'verana1policy',
      language: '',
      created: '2026-08-25T20:34:20.109Z',
      modified: null,
    })
  })

  it('rejects a payload without the corporation envelope', () => {
    expect(() => parseProfile({})).toThrow('corporation')
  })
})

describe('parseGovernance', () => {
  it('reads the gf_data=all shape of the live indexer', () => {
    expect(
      parseGovernance({
        corporation: {
          id: 13,
          active_version: 1,
          versions: [
            {
              id: 15,
              corporation_id: 13,
              ecosystem_id: null,
              version: 1,
              created: '2026-09-01T08:38:50.104Z',
              active_since: '2026-09-01T08:38:50.104Z',
              gfv_id: 35,
              documents: [
                {
                  id: 15,
                  gfv_id: 15,
                  language: 'en',
                  url: 'https://example.com/cgf.md',
                  digest_sri: 'sha384-abc',
                  created: '2026-09-01T08:38:50.104Z',
                  gfd_id: 35,
                },
              ],
            },
            { id: 16, version: 2, active_since: null, documents: [] },
          ],
        },
      })
    ).toEqual({
      activeVersion: 1,
      versions: [
        {
          id: '15',
          version: 1,
          activeSince: '2026-09-01T08:38:50.104Z',
          documents: [{ id: '15', url: 'https://example.com/cgf.md', language: 'en', digestSri: 'sha384-abc' }],
        },
        { id: '16', version: 2, activeSince: null, documents: [] },
      ],
    })
  })

  it('defaults to no versions when the payload carries none', () => {
    expect(parseGovernance({ corporation: { id: 12 } })).toEqual({ activeVersion: 0, versions: [] })
  })

  it('rejects a malformed document', () => {
    expect(() =>
      parseGovernance({ corporation: { active_version: 1, versions: [{ id: 1, version: 1, documents: [{ id: 1 }] }] } })
    ).toThrow('corporation.versions[0].documents[0].url')
  })
})

describe('parseGroup', () => {
  const payload = {
    group: {
      corporation_id: 12,
      group_id: 12,
      version: 2,
      total_weight: '5',
      created_at: '2026-08-25T20:34:20.109Z',
      policy: {
        address: 'verana1policy',
        version: 2,
        decision_policy: {
          '@type': '/cosmos.group.v1.ThresholdDecisionPolicy',
          threshold: '3',
          windows: { voting_period: '300s', min_execution_period: '0s' },
        },
      },
      members: [
        { address: 'verana1aaa', weight: '3', metadata: '', added_at: '2026-08-25T20:34:20.109Z' },
        { address: 'verana1bbb', weight: '2', metadata: '' },
      ],
    },
  }

  it('extracts members and the decision policy from the live group shape', () => {
    const { members, policy } = parseGroup(payload)
    expect(members).toEqual([
      { address: 'verana1aaa', weight: '3', addedAt: '2026-08-25T20:34:20.109Z' },
      { address: 'verana1bbb', weight: '2', addedAt: null },
    ])
    expect(policy).toEqual({ threshold: '3', votingPeriod: '300s', totalWeight: '5', groupId: 12 })
  })

  it('tolerates an empty member list', () => {
    const noMembers = structuredClone(payload)
    noMembers.group.members = []
    expect(parseGroup(noMembers).members).toEqual([])
  })
})

describe('parseTrustDeposit', () => {
  it('reads the live trust deposit payload keys', () => {
    const deposit = parseTrustDeposit({
      trust_deposit: {
        corporation_id: 12,
        deposit: 100000,
        slashed_deposit: 20000,
        repaid_deposit: 20000,
        claimable: 0,
        share: 100000,
        slash_count: 1,
        last_slashed: '2026-08-27T20:27:51Z',
        last_repaid: '2026-08-27T20:41:16Z',
        refunded: 0,
      },
    })
    expect(deposit).toEqual({
      deposit: 100000,
      slashedDeposit: 20000,
      repaidDeposit: 20000,
      slashCount: 1,
      lastSlashed: '2026-08-27T20:27:51Z',
      lastRepaid: '2026-08-27T20:41:16Z',
    })
  })
})

describe('parseOperatorAuthorizations', () => {
  it('keeps every grant row with its message types', () => {
    const rows = parseOperatorAuthorizations({
      authorizations: [
        { id: 11, corporation_id: 12, operator: 'verana1op', msg_types: ['/verana.ec.v1.MsgCreateEcosystem'] },
      ],
    })
    expect(rows).toEqual([{ id: 11, operator: 'verana1op', msgTypes: ['/verana.ec.v1.MsgCreateEcosystem'] }])
  })

  it('returns an empty list when the envelope has no rows', () => {
    expect(parseOperatorAuthorizations({ authorizations: [] })).toEqual([])
  })
})

describe('parseVsOperatorAuthorizations', () => {
  it('flattens the participant records nested under each VS operator', () => {
    const rows = parseVsOperatorAuthorizations({
      authorizations: [
        {
          id: 12,
          corporation_id: 6,
          vs_operator: 'verana1vs',
          records: [
            {
              participant_id: 102,
              msg_types: ['/verana.pp.v1.MsgTriggerResolver'],
              with_feegrant: true,
              expiration: '2026-08-27T12:11:01.742Z',
            },
            {
              participant_id: 98,
              msg_types: ['/verana.pp.v1.MsgCreateOrUpdateParticipantSession'],
              with_feegrant: true,
            },
          ],
        },
        { id: 11, corporation_id: 6, vs_operator: 'verana1idle', records: [] },
      ],
    })
    expect(rows).toEqual([
      {
        vsOperator: 'verana1vs',
        participantId: 102,
        msgTypes: ['/verana.pp.v1.MsgTriggerResolver'],
        expiration: '2026-08-27T12:11:01.742Z',
      },
      {
        vsOperator: 'verana1vs',
        participantId: 98,
        msgTypes: ['/verana.pp.v1.MsgCreateOrUpdateParticipantSession'],
        expiration: null,
      },
    ])
  })

  it('rejects a record without its participant', () => {
    expect(() =>
      parseVsOperatorAuthorizations({ authorizations: [{ vs_operator: 'verana1vs', records: [{ msg_types: [] }] }] })
    ).toThrow('participant_id')
  })
})

describe('parseProposals', () => {
  it('reads the live proposal shape with decoded messages', () => {
    const rows = parseProposals({
      proposals: [
        {
          id: 22,
          corporation_id: 12,
          group_policy_address: 'verana1policy',
          metadata: '',
          proposers: ['verana1aaa'],
          submit_time: '2026-08-25T20:34:46.407Z',
          group_version: 2,
          group_policy_version: 2,
          status: 'ACCEPTED',
          voting_period_end: '2026-08-25T20:35:46.407Z',
          executor_result: 'SUCCESS',
          messages: [{ '@type': '/verana.de.v1.MsgGrantOperatorAuthorization', grantee: 'verana1aaa' }],
          final_tally_result: { no_count: '0', yes_count: '3', abstain_count: '0', no_with_veto_count: '0' },
          tally: { yes_count: '3', no_count: '0', abstain_count: '0', no_with_veto_count: '0' },
        },
      ],
    })
    expect(rows[0]).toMatchObject({
      id: 22,
      status: 'ACCEPTED',
      executorResult: 'SUCCESS',
      proposers: ['verana1aaa'],
      tally: { yes: 3, no: 0, abstain: 0, veto: 0 },
    })
    expect(rows[0].messages[0]['@type']).toBe('/verana.de.v1.MsgGrantOperatorAuthorization')
  })

  it('defaults a missing status and tolerates absent optional fields', () => {
    const tally = { yes_count: '0', no_count: '2', abstain_count: '1', no_with_veto_count: '0' }
    const rows = parseProposals({ proposals: [{ id: 9, tally }] })
    expect(rows[0]).toEqual({
      id: 9,
      status: 'UNKNOWN',
      submitTime: null,
      votingPeriodEnd: null,
      executorResult: null,
      proposers: [],
      messages: [],
      tally: { yes: 0, no: 2, abstain: 1, veto: 0 },
    })
  })

  it('rejects a proposal without its running tally', () => {
    expect(() => parseProposals({ proposals: [{ id: 9 }] })).toThrow('tally')
  })
})

describe('parseHistory', () => {
  it('reads the live activity shape newest first and tolerates a missing account', () => {
    const rows = parseHistory({
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
    expect(() => parseHistory({ history: [] })).toThrow('activity')
  })
})

describe('fetchCorporationHistory', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('requests the corporation history endpoint with the page limit', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ entity_type: 'Corporation', entity_id: '13', activity: [] }),
    }))
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchCorporationHistory(13)).resolves.toEqual([])
    expect(fetchMock).toHaveBeenCalledWith('https://indexer.example/v4/corporation/history/13?limit=64')
  })

  it('degrades a 404 to an empty history and logs it', async () => {
    const error = vi.spyOn(logger, 'error').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) }))
    )
    await expect(fetchCorporationHistory(13)).resolves.toEqual([])
    expect(error).toHaveBeenCalledOnce()
  })

  it('degrades a malformed payload to an empty history', async () => {
    vi.spyOn(logger, 'error').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ activity: [{ id: 'nope' }] }) }))
    )
    await expect(fetchCorporationHistory(13)).resolves.toEqual([])
  })
})

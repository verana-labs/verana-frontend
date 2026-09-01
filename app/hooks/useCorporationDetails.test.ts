import { describe, expect, it, vi } from 'vitest'

vi.mock('@/config/env', () => ({
  VERANA_REST_ENDPOINT_CORPORATION: 'https://indexer.example/v4/corporation',
  VERANA_REST_ENDPOINT_DELEGATION: 'https://indexer.example/v4/delegation',
  VERANA_REST_ENDPOINT_GROUP: 'https://indexer.example/v4/group',
  VERANA_REST_ENDPOINT_TRUST_DEPOSIT: 'https://indexer.example/v4/trust-deposit',
}))

import {
  parseGroup,
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
  it('accepts vs_operator or operator keys and missing optional fields', () => {
    const rows = parseVsOperatorAuthorizations({
      authorizations: [
        {
          vs_operator: 'verana1vs',
          participant_id: 42,
          msg_types: ['/verana.pp.v1.MsgRenewParticipantOP'],
          expiration: null,
        },
        { operator: 'verana1legacy' },
      ],
    })
    expect(rows).toEqual([
      {
        vsOperator: 'verana1vs',
        participantId: 42,
        msgTypes: ['/verana.pp.v1.MsgRenewParticipantOP'],
        expiration: null,
      },
      { vsOperator: 'verana1legacy', participantId: null, msgTypes: [], expiration: null },
    ])
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
        },
      ],
    })
    expect(rows[0]).toMatchObject({
      id: 22,
      status: 'ACCEPTED',
      executorResult: 'SUCCESS',
      proposers: ['verana1aaa'],
    })
    expect(rows[0].messages[0]['@type']).toBe('/verana.de.v1.MsgGrantOperatorAuthorization')
  })

  it('defaults a missing status and tolerates absent optional fields', () => {
    const rows = parseProposals({ proposals: [{ id: 9 }] })
    expect(rows[0]).toEqual({
      id: 9,
      status: 'UNKNOWN',
      submitTime: null,
      votingPeriodEnd: null,
      executorResult: null,
      proposers: [],
      messages: [],
    })
  })
})

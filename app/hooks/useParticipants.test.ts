import { describe, expect, it } from 'vitest'
import { parseParticipantsResponse, participantsPageKey } from '@/hooks/useParticipants'

const participant = {
  id: 1,
  schema_id: 1,
  role: 'ECOSYSTEM',
  did: 'did:web:participant.example',
  corporation_id: 1,
  participant_state: 'ACTIVE',
  corporation_available_actions: ['SetParticipantEffectiveUntil'],
  validator_available_actions: [],
}

describe('parseParticipantsResponse', () => {
  it('requires the V4 participants envelope', () => {
    expect(parseParticipantsResponse({ participants: [participant] })).toHaveLength(1)
    expect(() => parseParticipantsResponse({ permissions: [participant] })).toThrow('participants envelope')
  })
})

const trustData = {
  did: 'did:web:participant.example',
  trusted: true,
  expiresAtTime: null,
  ecsCredentials: [{ ecsSchema: 'ServiceCredential', credentialSubject: { name: 'Acme Verifier' } }],
}

describe('participant rows carry the inline trust_data', () => {
  it('maps a full payload to the row enrichment', () => {
    const row = parseParticipantsResponse({ participants: [{ ...participant, trust_data: trustData }] })[0]
    expect(row.trustData?.trustStatus).toBe('TRUSTED')
    expect(row.trustData?.serviceName).toBe('Acme Verifier')
  })
})

describe('participantsPageKey', () => {
  it('separates two sibling sets of the same schema', () => {
    const issuers = participantsPageKey({ schema: '9', role: 'ISSUER', validator: '4' })
    const verifiers = participantsPageKey({ schema: '9', role: 'VERIFIER', validator: '4' })
    expect(issuers).not.toBe(verifiers)
    expect(participantsPageKey({ schema: '9', role: 'ISSUER', validator: '7' })).not.toBe(issuers)
  })
})

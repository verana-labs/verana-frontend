import { describe, expect, it } from 'vitest'
import { parseParticipantsResponse } from '@/hooks/useParticipants'

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

  it('accepts the nullable V4 expire-soon flag', () => {
    expect(
      parseParticipantsResponse({ participants: [{ ...participant, expire_soon: null }] })[0]?.expire_soon
    ).toBeNull()
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

  it('maps a null payload to unresolved', () => {
    const row = parseParticipantsResponse({ participants: [{ ...participant, trust_data: null }] })[0]
    expect(row.trustData?.trustStatus).toBe('UNRESOLVED')
  })

  it('leaves the enrichment unset when the request asked for no trust_data', () => {
    expect(parseParticipantsResponse({ participants: [participant] })[0].trustData).toBeUndefined()
  })

  it('leaves the enrichment unset for a participant with no DID', () => {
    const row = parseParticipantsResponse({ participants: [{ ...participant, did: null, trust_data: null }] })[0]
    expect(row.trustData).toBeUndefined()
  })
})

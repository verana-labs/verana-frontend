import { describe, expect, it } from 'vitest'
import { parseParticipantsResponse, participantListQuery } from '@/hooks/useParticipants'

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

describe('participantListQuery', () => {
  it('asks for the full trust data of every node in the requested folder', () => {
    expect(participantListQuery('26', 'ISSUER', '105').toString()).toBe(
      'schema_id=26&limit=1024&sort=%2Bid&trust_data=full&role=ISSUER&validator_participant_id=105'
    )
  })
})

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

  it('leaves trust undefined when the payload carries no trust data', () => {
    expect(parseParticipantsResponse({ participants: [participant] })[0]?.trust).toBeUndefined()
  })

  it('maps the inline trust data of a participant', () => {
    const [parsed] = parseParticipantsResponse({
      participants: [
        {
          ...participant,
          trust_data: {
            did: participant.did,
            trusted: true,
            expiresAtTime: null,
            ecsCredentials: [{ ecsSchema: 'ServiceCredential', credentialSubject: { name: 'Acme Portal' } }],
          },
        },
      ],
    })
    expect(parsed.trust).toMatchObject({ trustStatus: 'TRUSTED', serviceName: 'Acme Portal' })
  })

  it('reports an unresolved trust state as null', () => {
    expect(parseParticipantsResponse({ participants: [{ ...participant, trust_data: null }] })[0]?.trust).toBeNull()
  })
})

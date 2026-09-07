import { describe, expect, it } from 'vitest'
import { parseParticipantsResponse, participantListQuery, siblingRequest } from '@/hooks/useParticipants'
import { keysetWindow } from '@/lib/keyset'

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
  it('over-fetches a window of 25 siblings with full trust data and no state filter', () => {
    expect(participantListQuery('26', 'ISSUER', '105').toString()).toBe(
      'limit=26&sort=%2Bid&schema_id=26&trust_data=full&role=ISSUER&validator_participant_id=105'
    )
  })

  it('continues after the last loaded sibling with an inclusive min_id', () => {
    expect(participantListQuery('26', 'ISSUER', '105', { afterId: '140' }).toString()).toBe(
      'limit=26&sort=%2Bid&min_id=141&schema_id=26&trust_data=full&role=ISSUER&validator_participant_id=105'
    )
  })

  it('honours a caller page size', () => {
    expect(participantListQuery('26', 'ECOSYSTEM', undefined, { pageSize: 1024 }).get('limit')).toBe('1025')
  })
})

describe('siblingRequest', () => {
  it('flags a further page only when the window overflows', () => {
    const rows = Array.from({ length: 26 }, (_, index) => ({ id: index + 1 }))
    expect(keysetWindow(siblingRequest(), rows)).toMatchObject({ hasNext: true })
    expect(keysetWindow(siblingRequest(), rows.slice(0, 25))).toMatchObject({ hasNext: false })
    expect(keysetWindow(siblingRequest(), rows).rows).toHaveLength(25)
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

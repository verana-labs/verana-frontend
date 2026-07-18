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

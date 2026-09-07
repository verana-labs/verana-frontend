import { describe, expect, it, vi } from 'vitest'
import { mergeParticipantDetailActions, parseParticipantResponse, refreshParticipantSources } from './useParticipant'

const participant = {
  id: 4,
  schema_id: 1,
  role: 'VERIFIER',
  did: 'did:web:participant.example',
  corporation_id: 3,
  participant_state: 'ACTIVE',
  corporation_available_actions: ['SetParticipantEffectiveUntil'],
  validator_available_actions: [],
}

describe('parseParticipantResponse', () => {
  it('accepts the V4 participant detail envelope', () => {
    expect(parseParticipantResponse({ participant })).toMatchObject({
      id: '4',
      schema_id: '1',
      corporation_id: 3,
      role: 'VERIFIER',
      participant_state: 'ACTIVE',
    })
  })

  it('rejects missing action arrays', () => {
    expect(() =>
      parseParticipantResponse({
        participant: { ...participant, corporation_available_actions: undefined },
      })
    ).toThrow('participant.corporation_available_actions')
  })
})

describe('mergeParticipantDetailActions', () => {
  it('reuses the current participant when the merged detail is unchanged', () => {
    const current = parseParticipantResponse({
      participant: {
        ...participant,
        id: 10,
        role: 'ISSUER',
        op_state: 'VALIDATED',
        corporation_available_actions: ['RenewParticipantOP', 'RevokeParticipant'],
        validator_available_actions: ['SlashParticipantTrustDeposit'],
      },
    })
    const refreshed = parseParticipantResponse({
      participant: {
        ...participant,
        id: 10,
        role: 'ISSUER',
        op_state: 'VALIDATED',
        corporation_available_actions: ['RevokeParticipant'],
        validator_available_actions: ['SlashParticipantTrustDeposit'],
      },
    })

    expect(mergeParticipantDetailActions(current, refreshed)).toBe(current)
  })

  it('preserves validator-aware list actions when the detail state is unchanged', () => {
    const current = parseParticipantResponse({
      participant: {
        ...participant,
        id: 10,
        role: 'ISSUER',
        op_state: 'VALIDATED',
        corporation_available_actions: ['RenewParticipantOP', 'RevokeParticipant'],
        validator_available_actions: ['SlashParticipantTrustDeposit'],
      },
    })
    const refreshed = parseParticipantResponse({
      participant: {
        ...participant,
        id: 10,
        role: 'ISSUER',
        op_state: 'VALIDATED',
        corporation_available_actions: ['RevokeParticipant'],
        validator_available_actions: ['SlashParticipantTrustDeposit'],
      },
    })

    expect(mergeParticipantDetailActions(current, refreshed).corporation_available_actions).toEqual([
      'RenewParticipantOP',
      'RevokeParticipant',
    ])
  })

  it('uses refreshed actions when the participant state changes', () => {
    const current = parseParticipantResponse({
      participant: {
        ...participant,
        id: 10,
        role: 'ISSUER',
        participant_state: 'INACTIVE',
        op_state: 'PENDING',
        corporation_available_actions: ['CancelParticipantOPLastRequest'],
      },
    })
    const refreshed = parseParticipantResponse({
      participant: {
        ...participant,
        id: 10,
        role: 'ISSUER',
        participant_state: 'ACTIVE',
        op_state: 'VALIDATED',
        corporation_available_actions: ['RevokeParticipant'],
      },
    })

    expect(mergeParticipantDetailActions(current, refreshed).corporation_available_actions).toEqual([
      'RevokeParticipant',
    ])
  })
})

describe('refreshParticipantSources', () => {
  it('refreshes both detail data and list-derived actions after a transaction', async () => {
    const refetchDetail = vi.fn().mockResolvedValue(undefined)
    const refetchList = vi.fn().mockResolvedValue(undefined)
    const refetchHistory = vi.fn().mockResolvedValue(undefined)

    await refreshParticipantSources('10', refetchDetail, refetchList, refetchHistory)

    expect(refetchDetail).toHaveBeenCalledWith('10')
    expect(refetchList).toHaveBeenCalledOnce()
    expect(refetchHistory).toHaveBeenCalledWith('10')
  })
})

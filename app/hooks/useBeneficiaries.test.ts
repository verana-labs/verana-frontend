import { describe, expect, it } from 'vitest'
import { beneficiariesQuery, beneficiariesUrl, parseBeneficiariesResponse } from './useBeneficiaries'

const ecosystem = {
  id: 72,
  schema_id: 20,
  role: 'ECOSYSTEM',
  did: 'did:web:eco.example',
  corporation_id: 5,
  participant_state: 'ACTIVE',
  corporation_available_actions: [],
  validator_available_actions: [],
  issuance_fees: 300000,
  verification_fees: 0,
}

describe('beneficiariesQuery', () => {
  it('asks by issuer or verifier id and skips the other roles', () => {
    expect(beneficiariesQuery({ id: '114', role: 'ISSUER' })).toEqual({ issuerParticipantId: '114' })
    expect(beneficiariesQuery({ id: '9', role: 'VERIFIER' })).toEqual({ verifierParticipantId: '9' })
    expect(beneficiariesQuery({ id: '1', role: 'ECOSYSTEM' })).toBeNull()
    expect(beneficiariesQuery({ id: '2', role: 'ISSUER_GRANTOR' })).toBeNull()
  })
})

describe('beneficiariesUrl', () => {
  it('builds the IDX-PP-QRY-4 query', () => {
    expect(beneficiariesUrl('https://indexer/v4/participant', { issuerParticipantId: '114' })).toBe(
      'https://indexer/v4/participant/beneficiaries?issuer_participant_id=114'
    )
    expect(beneficiariesUrl('https://indexer/v4/participant', { verifierParticipantId: '9' })).toBe(
      'https://indexer/v4/participant/beneficiaries?verifier_participant_id=9'
    )
  })
})

describe('parseBeneficiariesResponse', () => {
  it('reads the participants envelope', () => {
    expect(parseBeneficiariesResponse({ participants: [ecosystem] })).toEqual([
      expect.objectContaining({ id: '72', role: 'ECOSYSTEM', issuance_fees: 300000 }),
    ])
    expect(parseBeneficiariesResponse({ participants: [] })).toEqual([])
  })

  it('rejects a payload without the envelope', () => {
    expect(() => parseBeneficiariesResponse({ error: 'Participant not found', code: 404 })).toThrow(
      'missing participants envelope'
    )
    expect(() => parseBeneficiariesResponse({ participants: [{ id: 1 }] })).toThrow('participants[0].role')
  })
})

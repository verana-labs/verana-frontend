import { describe, expect, it, vi } from 'vitest'
import { beneficiariesQuery, beneficiariesUrl, loadBeneficiaries, parseBeneficiariesResponse } from './useBeneficiaries'

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
    expect(beneficiariesQuery({ id: '114', role: 'ISSUER', participant_state: 'ACTIVE' })).toEqual({
      issuerParticipantId: '114',
    })
    expect(beneficiariesQuery({ id: '9', role: 'VERIFIER', participant_state: 'ACTIVE' })).toEqual({
      verifierParticipantId: '9',
    })
    expect(beneficiariesQuery({ id: '1', role: 'ECOSYSTEM', participant_state: 'ACTIVE' })).toBeNull()
    expect(beneficiariesQuery({ id: '2', role: 'ISSUER_GRANTOR', participant_state: 'ACTIVE' })).toBeNull()
  })

  it('skips a participant the indexer would refuse because it is not active', () => {
    expect(beneficiariesQuery({ id: '107', role: 'ISSUER', participant_state: 'REVOKED' })).toBeNull()
    expect(beneficiariesQuery({ id: '106', role: 'VERIFIER', participant_state: 'REPAID' })).toBeNull()
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

describe('loadBeneficiaries', () => {
  const BENEFICIARIES_URL = 'https://indexer/v4/participant/beneficiaries?issuer_participant_id=114'
  const respond = (status: number, body: unknown) =>
    vi.fn(async () => ({ ok: status < 400, status, json: async () => body }) as Response)

  it('keeps an empty beneficiary set apart from a failed request', async () => {
    await expect(loadBeneficiaries(BENEFICIARIES_URL, respond(200, { participants: [] }))).resolves.toEqual({
      status: 'ready',
      beneficiaries: [],
    })
    await expect(loadBeneficiaries(BENEFICIARIES_URL, respond(500, { error: 'boom' }))).resolves.toEqual({
      status: 'failed',
    })
  })

  it('reads a malformed payload or a network error as failed', async () => {
    await expect(loadBeneficiaries(BENEFICIARIES_URL, respond(200, { error: 'nope' }))).resolves.toEqual({
      status: 'failed',
    })
    const offline = vi.fn(async () => {
      throw new TypeError('Failed to fetch')
    })
    await expect(loadBeneficiaries(BENEFICIARIES_URL, offline)).resolves.toEqual({ status: 'failed' })
  })

  it('returns the parsed beneficiaries', async () => {
    const result = await loadBeneficiaries(BENEFICIARIES_URL, respond(200, { participants: [ecosystem] }))
    expect(result).toEqual({ status: 'ready', beneficiaries: [expect.objectContaining({ id: '72' })] })
  })
})

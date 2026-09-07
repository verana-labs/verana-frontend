import { describe, expect, it } from 'vitest'
import { ecosystemMembership, ecosystemRoles, ecosystemRolesQuery, parseEcosystemRoles } from './ecosystem-membership'

describe('ecosystemRolesQuery', () => {
  it('asks for the active participants of the corporation inside one ecosystem', () => {
    expect(ecosystemRolesQuery(13, '5').toString()).toBe(
      'corporation_id=13&ecosystem_id=5&participant_state=ACTIVE&limit=64'
    )
  })
})

describe('parseEcosystemRoles', () => {
  it('keeps the distinct active roles in canonical order', () => {
    expect(
      parseEcosystemRoles({
        participants: [
          { id: 1, role: 'VERIFIER', participant_state: 'ACTIVE' },
          { id: 2, role: 'ISSUER', participant_state: 'ACTIVE' },
          { id: 3, role: 'ISSUER', participant_state: 'ACTIVE' },
          { id: 4, role: 'HOLDER', participant_state: 'REVOKED' },
        ],
      })
    ).toEqual(['ISSUER', 'VERIFIER'])
  })

  it('rejects a payload without the participants envelope', () => {
    expect(() => parseEcosystemRoles({ roles: [] })).toThrow('participants envelope')
  })
})

describe('ecosystemRoles', () => {
  it('reads the comma separated role field, ignoring unknown tokens', () => {
    expect(ecosystemRoles({ role: 'holder, ISSUER,bogus' })).toEqual(['ISSUER', 'HOLDER'])
    expect(ecosystemRoles({ role: '' })).toEqual([])
    expect(ecosystemRoles({})).toEqual([])
  })
})

describe('ecosystemMembership', () => {
  it('is controlled when the acting corporation owns the ecosystem', () => {
    expect(ecosystemMembership({ corporationId: 13, role: '' }, 13)).toBe('controlled')
  })

  it('is joined when the acting corporation only holds active roles', () => {
    expect(ecosystemMembership({ corporationId: 8, role: 'ISSUER' }, 13)).toBe('joined')
  })

  it('is null without an acting corporation or without any relation', () => {
    expect(ecosystemMembership({ corporationId: 8, role: 'ISSUER' }, undefined)).toBeNull()
    expect(ecosystemMembership({ corporationId: 8, role: '' }, 13)).toBeNull()
  })
})

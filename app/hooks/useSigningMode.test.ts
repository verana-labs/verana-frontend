import { describe, expect, it, vi } from 'vitest'

vi.mock('@/hooks/useUserCorporation', () => ({ useUserCorporation: () => ({ acting: null, loading: false }) }))

import type { CorporationMembership } from '@/lib/corporation-discovery'
import { resolveActionSigning } from './useSigningMode'

const ARCHIVE = '/verana.ec.v1.MsgArchiveEcosystem'

function membership(overrides: Partial<CorporationMembership> = {}): CorporationMembership {
  return {
    corporation: { id: 13, policyAddress: 'verana1policy', did: 'did:web:acme.example' },
    operator: true,
    member: true,
    weight: '1',
    grantedMessageTypes: [ARCHIVE],
    ...overrides,
  }
}

describe('resolveActionSigning', () => {
  it('leaves non-delegable actions alone', () => {
    expect(resolveActionSigning('copy', membership({ grantedMessageTypes: [], member: false }), false)).toEqual({
      mode: null,
      disabled: false,
      reason: undefined,
    })
  })

  it('disables without a reason while discovery is loading', () => {
    expect(resolveActionSigning('MsgArchiveEcosystem', null, true)).toEqual({
      mode: null,
      disabled: true,
      reason: undefined,
    })
  })

  it('stays enabled without an acting corporation so the click can ask for one', () => {
    expect(resolveActionSigning('MsgArchiveEcosystem', null, false).disabled).toBe(false)
  })

  it('is operator mode when the grant covers the message type', () => {
    expect(resolveActionSigning('MsgArchiveEcosystem', membership(), false).mode).toBe('operator')
    expect(resolveActionSigning('MsgUnarchiveEcosystem', membership(), false).mode).toBe('operator')
  })

  it('falls back to a proposal for members without the grant', () => {
    const signing = resolveActionSigning('MsgArchiveEcosystem', membership({ grantedMessageTypes: [] }), false)
    expect(signing).toEqual({ mode: 'proposal', disabled: false, reason: undefined })
  })

  it('disables with the capability reason when the account is neither granted nor a member', () => {
    const signing = resolveActionSigning(
      'MsgArchiveEcosystem',
      membership({ grantedMessageTypes: [], member: false }),
      false
    )
    expect(signing.mode).toBeNull()
    expect(signing.disabled).toBe(true)
    expect(signing.reason).toMatch(/authorization/i)
  })
})

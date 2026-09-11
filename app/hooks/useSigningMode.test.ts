import { describe, expect, it, vi } from 'vitest'

vi.mock('@/hooks/useUserCorporation', () => ({
  useUserCorporation: () => ({ actingCorporation: null, loading: false }),
}))

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
    expect(resolveActionSigning('copy', membership({ grantedMessageTypes: [], member: false }), false, true)).toEqual({
      mode: null,
      disabled: false,
      reason: undefined,
    })
  })

  it('disables without a reason while discovery is loading', () => {
    expect(resolveActionSigning('MsgArchiveEcosystem', null, true, true)).toEqual({
      mode: null,
      disabled: true,
      reason: undefined,
    })
  })

  it('leaves the action alone for a visitor with no wallet connected', () => {
    expect(resolveActionSigning('MsgArchiveEcosystem', null, false, false)).toEqual({
      mode: null,
      disabled: false,
      reason: undefined,
    })
  })

  it('disables with the selection reason when a wallet is connected but no corporation acts', () => {
    const signing = resolveActionSigning('MsgArchiveEcosystem', null, false, true)
    expect(signing.mode).toBeNull()
    expect(signing.disabled).toBe(true)
    expect(signing.reason).toBe('Create or select a corporation before continuing.')
  })

  it('is operator mode when the grant covers the message type', () => {
    expect(resolveActionSigning('MsgArchiveEcosystem', membership(), false, true).mode).toBe('operator')
    expect(resolveActionSigning('MsgUnarchiveEcosystem', membership(), false, true).mode).toBe('operator')
  })

  it('falls back to a proposal for members without the grant', () => {
    const signing = resolveActionSigning('MsgArchiveEcosystem', membership({ grantedMessageTypes: [] }), false, true)
    expect(signing).toEqual({ mode: 'proposal', disabled: false, reason: undefined })
  })

  it('disables with the capability reason when the account is neither granted nor a member', () => {
    const signing = resolveActionSigning(
      'MsgArchiveEcosystem',
      membership({ grantedMessageTypes: [], member: false }),
      false,
      true
    )
    expect(signing.mode).toBeNull()
    expect(signing.disabled).toBe(true)
    expect(signing.reason).toMatch(/authorization/i)
  })
})

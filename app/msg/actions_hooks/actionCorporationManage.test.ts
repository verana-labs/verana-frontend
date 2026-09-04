import { MsgUpdateCorporation } from '@verana-labs/verana-types/codec/verana/co/v1/tx'
import {
  MsgGrantOperatorAuthorization,
  MsgRevokeOperatorAuthorization,
} from '@verana-labs/verana-types/codec/verana/de/v1/tx'
import { MsgRepaySlashedTrustDeposit } from '@verana-labs/verana-types/codec/verana/td/v1/tx'
import {
  Exec,
  MsgSubmitProposal,
  MsgUpdateGroupMembers,
  MsgUpdateGroupPolicyDecisionPolicy,
} from 'cosmjs-types/cosmos/group/v1/tx'
import { ThresholdDecisionPolicy, VoteOption } from 'cosmjs-types/cosmos/group/v1/types'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@cosmos-kit/react', () => ({ useChain: () => ({ address: undefined, isWalletConnected: false }) }))
vi.mock('@/hooks/useVeranaChain', () => ({ useVeranaChain: () => ({ chain_name: 'VeranaDevnet1' }) }))
vi.mock('@/providers/indexer-events-provider', () => ({ useIndexerEvents: () => ({ waitForBlock: vi.fn() }) }))
vi.mock('@/providers/notification-provider', () => ({ useNotification: () => ({ notify: vi.fn() }) }))
vi.mock('@/msg/util/sendTxDetectingMode', () => ({ useSendTxDetectingMode: () => vi.fn() }))
vi.mock('@/providers/tx-confirm-provider', () => ({
  useTxConfirm: () => ({ confirmTx: vi.fn().mockResolvedValue({}) }),
}))

import type { CorporationMembership } from '@/lib/corporation-discovery'
import {
  buildGrantOperatorMessage,
  buildRepaySlashedMessage,
  buildRevokeOperatorMessage,
  buildUpdateCorporationMessage,
  buildUpdateDecisionPolicyMessage,
  buildUpdateMembersMessage,
  corporationSigningMode,
  delegablePreview,
  proposalMeta,
  VOTE_OPTIONS,
  wrapInProposal,
} from './actionCorporationManage'

const POLICY = 'verana1policyaddress'

function membership(overrides: Partial<CorporationMembership> = {}): CorporationMembership {
  return {
    corporation: { id: 12, policyAddress: POLICY, did: 'did:web:corp.example' },
    operator: true,
    member: true,
    weight: '1',
    grantedMessageTypes: ['/verana.co.v1.MsgUpdateCorporation'],
    ...overrides,
  }
}

describe('corporationSigningMode', () => {
  it('is operator when the acting grant covers the message type', () => {
    expect(corporationSigningMode('/verana.co.v1.MsgUpdateCorporation', membership())).toBe('operator')
  })

  it('falls back to a proposal for group members without the grant', () => {
    expect(corporationSigningMode('/verana.td.v1.MsgRepaySlashedTrustDeposit', membership())).toBe('proposal')
    expect(corporationSigningMode('/verana.co.v1.MsgUpdateCorporation', membership({ grantedMessageTypes: [] }))).toBe(
      'proposal'
    )
  })

  it('is null for non-members without a grant and without a membership', () => {
    expect(
      corporationSigningMode(
        '/verana.co.v1.MsgUpdateCorporation',
        membership({ grantedMessageTypes: [], member: false })
      )
    ).toBeNull()
    expect(corporationSigningMode('/verana.co.v1.MsgUpdateCorporation', null)).toBeNull()
  })
})

describe('delegable message builders', () => {
  it('round-trips the DID rotation with corporation and operator', () => {
    const message = buildUpdateCorporationMessage(membership(), 'did:web:next.example', 'verana1operator')
    const value = MsgUpdateCorporation.decode(
      MsgUpdateCorporation.encode(message.value as MsgUpdateCorporation).finish()
    )
    expect(message.typeUrl).toBe('/verana.co.v1.MsgUpdateCorporation')
    expect(value).toEqual({ corporation: POLICY, operator: 'verana1operator', did: 'did:web:next.example' })
  })

  it('round-trips the operator grant with its message types and no fee grant', () => {
    const message = buildGrantOperatorMessage(
      membership(),
      'verana1grantee',
      ['/verana.ec.v1.MsgCreateEcosystem'],
      POLICY
    )
    const value = MsgGrantOperatorAuthorization.decode(
      MsgGrantOperatorAuthorization.encode(message.value as MsgGrantOperatorAuthorization).finish()
    )
    expect(value.corporation).toBe(POLICY)
    expect(value.operator).toBe(POLICY)
    expect(value.grantee).toBe('verana1grantee')
    expect(value.msgTypes).toEqual(['/verana.ec.v1.MsgCreateEcosystem'])
    expect(value.withFeegrant).toBe(false)
  })

  it('round-trips the revoke and the slashed-deposit repayment', () => {
    const revoke = buildRevokeOperatorMessage(membership(), 'verana1grantee', 'verana1operator')
    expect(
      MsgRevokeOperatorAuthorization.decode(
        MsgRevokeOperatorAuthorization.encode(revoke.value as MsgRevokeOperatorAuthorization).finish()
      )
    ).toEqual({ corporation: POLICY, operator: 'verana1operator', grantee: 'verana1grantee' })

    const repay = buildRepaySlashedMessage(membership(), 20000, 'verana1operator')
    expect(
      MsgRepaySlashedTrustDeposit.decode(
        MsgRepaySlashedTrustDeposit.encode(repay.value as MsgRepaySlashedTrustDeposit).finish()
      )
    ).toEqual({ corporation: POLICY, operator: 'verana1operator', deposit: 20000 })
  })
})

describe('group admin builders', () => {
  it('round-trips the member update with the policy as admin', () => {
    const message = buildUpdateMembersMessage(membership(), 12, [
      { address: 'verana1aaa', weight: '2' },
      { address: 'verana1bbb', weight: '0' },
    ])
    const value = MsgUpdateGroupMembers.decode(
      MsgUpdateGroupMembers.encode(message.value as MsgUpdateGroupMembers).finish()
    )
    expect(message.typeUrl).toBe('/cosmos.group.v1.MsgUpdateGroupMembers')
    expect(value.admin).toBe(POLICY)
    expect(value.groupId).toBe(BigInt(12))
    expect(value.memberUpdates).toEqual([
      { address: 'verana1aaa', weight: '2', metadata: '' },
      { address: 'verana1bbb', weight: '0', metadata: '' },
    ])
  })

  it('round-trips the decision policy update', () => {
    const message = buildUpdateDecisionPolicyMessage(membership(), '3', 300)
    const value = MsgUpdateGroupPolicyDecisionPolicy.decode(
      MsgUpdateGroupPolicyDecisionPolicy.encode(message.value as MsgUpdateGroupPolicyDecisionPolicy).finish()
    )
    expect(value.admin).toBe(POLICY)
    expect(value.groupPolicyAddress).toBe(POLICY)
    expect(value.decisionPolicy?.typeUrl).toBe('/cosmos.group.v1.ThresholdDecisionPolicy')
    const decision = ThresholdDecisionPolicy.decode(value.decisionPolicy?.value ?? new Uint8Array())
    expect(decision.threshold).toBe('3')
    expect(decision.windows?.votingPeriod?.seconds).toBe(BigInt(300))
  })
})

describe('wrapInProposal', () => {
  it('wraps the exact message on the policy address with EXEC_TRY', () => {
    const inner = buildUpdateCorporationMessage(membership(), 'did:web:next.example', POLICY)
    const proposal = wrapInProposal(membership(), 'verana1member', inner, 'Rotate DID', 'Rotate DID')
    const value = MsgSubmitProposal.decode(MsgSubmitProposal.encode(proposal.value as MsgSubmitProposal).finish())

    expect(proposal.typeUrl).toBe('/cosmos.group.v1.MsgSubmitProposal')
    expect(value.groupPolicyAddress).toBe(POLICY)
    expect(value.proposers).toEqual(['verana1member'])
    expect(value.exec).toBe(Exec.EXEC_TRY)
    expect(value.messages).toHaveLength(1)
    expect(value.messages[0].typeUrl).toBe('/verana.co.v1.MsgUpdateCorporation')
    const wrapped = MsgUpdateCorporation.decode(value.messages[0].value)
    expect(wrapped.corporation).toBe(POLICY)
    expect(wrapped.operator).toBe(POLICY)
  })
})

describe('delegablePreview', () => {
  it('describes an operator revoke as irreversible with its warning', () => {
    const preview = delegablePreview(
      '/verana.de.v1.MsgRevokeOperatorAuthorization',
      'operator',
      membership(),
      'verana1me',
      'Revoke',
      { operator: 'verana1grantee' }
    )
    expect(preview.mode).toBe('operator')
    expect(preview.payer).toBe('verana1me')
    expect(preview.severity).toBe('irreversible')
    expect(preview.warning).toMatch(/^Irreversible\./)
    expect(preview.effect).toBe('Revoke the operator access of verana1grantee on did:web:corp.example.')
    expect(preview.proposalTitle).toBeUndefined()
  })

  it('carries the proposal title only in proposal mode and leaves the repayment unflagged', () => {
    const preview = delegablePreview(
      '/verana.td.v1.MsgRepaySlashedTrustDeposit',
      'proposal',
      membership(),
      'verana1me',
      'Repay',
      { amount: '2 VNA' }
    )
    expect(preview.mode).toBe('proposal')
    expect(preview.severity).toBeUndefined()
    expect(preview.warning).toBeUndefined()
    expect(preview.proposalTitle).toBe('Repay')
    expect(preview.effect).toBe('Repay 2 VNA of slashed trust deposit for did:web:corp.example.')
  })
})

describe('proposalMeta', () => {
  it('falls back to the default title and mirrors it into the summary', () => {
    expect(proposalMeta({}, 'Rotate DID')).toEqual({ title: 'Rotate DID', summary: 'Rotate DID' })
    expect(proposalMeta({ proposalTitle: '  ', proposalSummary: '' }, 'Rotate DID')).toEqual({
      title: 'Rotate DID',
      summary: 'Rotate DID',
    })
  })

  it('keeps what the composer typed', () => {
    expect(proposalMeta({ proposalTitle: 'Custom', proposalSummary: 'Why' }, 'Rotate DID')).toEqual({
      title: 'Custom',
      summary: 'Why',
    })
  })
})

describe('VOTE_OPTIONS', () => {
  it('maps every choice to the x/group enum', () => {
    expect(VOTE_OPTIONS).toEqual({
      yes: VoteOption.VOTE_OPTION_YES,
      no: VoteOption.VOTE_OPTION_NO,
      abstain: VoteOption.VOTE_OPTION_ABSTAIN,
      veto: VoteOption.VOTE_OPTION_NO_WITH_VETO,
    })
  })
})

import { MsgCreateEcosystem } from '@verana-labs/verana-types/codec/verana/ec/v1/tx'
import { Exec, MsgSubmitProposal } from 'cosmjs-types/cosmos/group/v1/tx'
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
import { delegableTypeUrl, proposalTitleFrom, resolveDelegableMsgs } from './delegable-msgs'

const POLICY = 'verana1policyaddress'
const ME = 'verana1me'
const CREATE = '/verana.ec.v1.MsgCreateEcosystem'

function membership(overrides: Partial<CorporationMembership> = {}): CorporationMembership {
  return {
    corporation: { id: 12, policyAddress: POLICY, did: 'did:web:corp.example' },
    operator: true,
    member: true,
    weight: '1',
    grantedMessageTypes: [CREATE],
    ...overrides,
  }
}

function build(corporation: string, operator: string) {
  return {
    typeUrl: CREATE,
    value: MsgCreateEcosystem.fromPartial({
      corporation,
      operator,
      did: 'did:web:eco.example',
      language: 'en',
      docUrl: 'https://example.com/egf.md',
      docDigestSri: 'sha384-x',
    }),
  }
}

describe('resolveDelegableMsgs', () => {
  it('signs directly as operator with the policy as corporation and the wallet as operator', () => {
    const resolved = resolveDelegableMsgs({
      membership: membership(),
      address: ME,
      typeUrl: CREATE,
      build,
      proposalTitle: 'Create ecosystem',
      proposalSummary: 'Create ecosystem',
    })
    expect(resolved?.mode).toBe('operator')
    expect(resolved?.msgs).toHaveLength(1)
    expect(resolved?.msgs[0].typeUrl).toBe(CREATE)
    const value = resolved?.msgs[0].value as MsgCreateEcosystem
    expect(value.corporation).toBe(POLICY)
    expect(value.operator).toBe(ME)
  })

  it('wraps the policy-operated message in a group proposal for members without the grant', () => {
    const resolved = resolveDelegableMsgs({
      membership: membership({ grantedMessageTypes: [] }),
      address: ME,
      typeUrl: CREATE,
      build,
      proposalTitle: 'Create ecosystem',
      proposalSummary: 'Because',
    })
    expect(resolved?.mode).toBe('proposal')
    expect(resolved?.msgs).toHaveLength(1)
    expect(resolved?.msgs[0].typeUrl).toBe('/cosmos.group.v1.MsgSubmitProposal')
    const proposal = MsgSubmitProposal.decode(
      MsgSubmitProposal.encode(resolved?.msgs[0].value as MsgSubmitProposal).finish()
    )
    expect(proposal.groupPolicyAddress).toBe(POLICY)
    expect(proposal.proposers).toEqual([ME])
    expect(proposal.exec).toBe(Exec.EXEC_TRY)
    expect(proposal.title).toBe('Create ecosystem')
    expect(proposal.summary).toBe('Because')
    expect(proposal.messages[0].typeUrl).toBe(CREATE)
    const inner = MsgCreateEcosystem.decode(proposal.messages[0].value)
    expect(inner.corporation).toBe(POLICY)
    expect(inner.operator).toBe(POLICY)
  })

  it('is null when the account is neither granted nor a member', () => {
    expect(
      resolveDelegableMsgs({
        membership: membership({ grantedMessageTypes: [], member: false }),
        address: ME,
        typeUrl: CREATE,
        build,
        proposalTitle: 'x',
        proposalSummary: 'x',
      })
    ).toBeNull()
  })
})

describe('delegableTypeUrl', () => {
  it('maps entity message names to their delegable type url', () => {
    expect(delegableTypeUrl('MsgCreateEcosystem')).toBe(CREATE)
    expect(delegableTypeUrl('MsgReclaimTrustDepositYield')).toBe('/verana.td.v1.MsgReclaimTrustDepositYield')
    expect(delegableTypeUrl('MsgRevokeParticipant')).toBe('/verana.pp.v1.MsgRevokeParticipant')
  })

  it('folds the unarchive actions onto the archive messages', () => {
    expect(delegableTypeUrl('MsgUnarchiveEcosystem')).toBe('/verana.ec.v1.MsgArchiveEcosystem')
    expect(delegableTypeUrl('MsgUnarchiveCredentialSchema')).toBe('/verana.cs.v1.MsgArchiveCredentialSchema')
  })

  it('is null for non-delegable and unknown actions', () => {
    expect(delegableTypeUrl('MsgCreateCorporation')).toBeNull()
    expect(delegableTypeUrl('MsgVote')).toBeNull()
    expect(delegableTypeUrl('GetVNATrustDeposit')).toBeNull()
  })
})

describe('proposalTitleFrom', () => {
  it('drops the sentence period of an effect', () => {
    expect(proposalTitleFrom('Archive ecosystem #7.')).toBe('Archive ecosystem #7')
    expect(proposalTitleFrom('Archive ecosystem #7')).toBe('Archive ecosystem #7')
  })
})

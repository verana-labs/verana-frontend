import { MsgCreateEcosystem } from '@verana-labs/verana-types/codec/verana/ec/v1/tx'
import { MsgRevokeParticipant } from '@verana-labs/verana-types/codec/verana/pp/v1/tx'
import { MsgSubmitProposal } from 'cosmjs-types/cosmos/group/v1/tx'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@cosmos-kit/react', () => ({ useChain: () => ({ address: undefined, isWalletConnected: false }) }))
vi.mock('@/hooks/useVeranaChain', () => ({ useVeranaChain: () => ({ chain_name: 'VeranaDevnet1' }) }))
vi.mock('@/hooks/useUserCorporation', () => ({ useUserCorporation: () => ({ acting: null, loading: false }) }))
vi.mock('@/providers/indexer-events-provider', () => ({ useIndexerEvents: () => ({ waitForBlock: vi.fn() }) }))
vi.mock('@/providers/notification-provider', () => ({ useNotification: () => ({ notify: vi.fn() }) }))
vi.mock('@/msg/util/sendTxDetectingMode', () => ({ useSendTxDetectingMode: () => vi.fn() }))
vi.mock('@/providers/tx-confirm-provider', () => ({ useTxConfirm: () => ({ confirmTx: vi.fn() }) }))

import type { CorporationMembership } from '@/lib/corporation-discovery'
import type { TxConfirmRequest, TxConfirmResult } from '@/lib/tx-preview'
import { confirmDelegableMsgs, type DelegableMsgsDeps } from './useDelegableMsgs'

const POLICY = 'verana1policyaddress'
const ME = 'verana1me'
const CREATE = '/verana.ec.v1.MsgCreateEcosystem'
const REVOKE = '/verana.pp.v1.MsgRevokeParticipant'

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
    value: MsgCreateEcosystem.fromPartial({ corporation, operator, did: 'did:web:eco.example' }),
  }
}

function deps(overrides: Partial<DelegableMsgsDeps> = {}, confirmResult: TxConfirmResult | null = {}) {
  const acting = 'acting' in overrides ? (overrides.acting ?? null) : membership()
  const notify = vi.fn(async () => {})
  const confirmTx = vi.fn(async (_request: TxConfirmRequest) => confirmResult)
  const requestSelection = vi.fn()
  const value: DelegableMsgsDeps = {
    address: ME,
    acting,
    loading: false,
    actingNow: () => acting,
    requestSelection,
    notify,
    confirmTx,
    ...overrides,
  }
  return { deps: value, notify, confirmTx, requestSelection }
}

const args = {
  typeUrl: CREATE,
  build,
  effect: 'Create an ecosystem.',
  proposalTitle: 'Create an ecosystem',
  simulate: false,
}

describe('confirmDelegableMsgs', () => {
  it('does nothing without a wallet address', async () => {
    const { deps: d, notify, confirmTx } = deps({ address: undefined })
    expect(await confirmDelegableMsgs(d, args)).toBeNull()
    expect(notify).not.toHaveBeenCalled()
    expect(confirmTx).not.toHaveBeenCalled()
  })

  it('waits for the provider instead of resolving a corporation itself', async () => {
    const { deps: d, notify, confirmTx } = deps({ loading: true })
    expect(await confirmDelegableMsgs(d, args)).toBeNull()
    expect(notify).toHaveBeenCalledWith('Loading your corporations…', 'info')
    expect(confirmTx).not.toHaveBeenCalled()

    const silent = deps({ loading: true })
    expect(await confirmDelegableMsgs(silent.deps, { ...args, simulate: true })).toBeNull()
    expect(silent.notify).not.toHaveBeenCalled()
  })

  it('asks for a selection when no corporation is acting', async () => {
    const { deps: d, notify, confirmTx, requestSelection } = deps({ acting: null })
    expect(await confirmDelegableMsgs(d, args)).toBeNull()
    expect(requestSelection).toHaveBeenCalledOnce()
    expect(notify).toHaveBeenCalledWith('Select an acting corporation first.', 'info')
    expect(confirmTx).not.toHaveBeenCalled()
  })

  it('refuses when the account is neither operator nor member', async () => {
    const { deps: d, notify, confirmTx } = deps({ acting: membership({ grantedMessageTypes: [], member: false }) })
    expect(await confirmDelegableMsgs(d, args)).toBeNull()
    expect(notify).toHaveBeenCalledWith(
      'This corporation has not authorized your wallet for MsgCreateEcosystem.',
      'error'
    )
    expect(confirmTx).not.toHaveBeenCalled()
  })

  it('skips the confirmation on simulate', async () => {
    const { deps: d, confirmTx } = deps()
    const resolved = await confirmDelegableMsgs(d, { ...args, simulate: true })
    expect(resolved?.mode).toBe('operator')
    expect((resolved?.msgs[0].value as MsgCreateEcosystem).operator).toBe(ME)
    expect(confirmTx).not.toHaveBeenCalled()
  })

  it('has no side effects when the user cancels', async () => {
    const { deps: d, notify } = deps({}, null)
    expect(await confirmDelegableMsgs(d, args)).toBeNull()
    expect(notify).not.toHaveBeenCalled()
  })

  it('confirms the operator message with effect, payer and mode', async () => {
    const { deps: d, confirmTx } = deps()
    const resolved = await confirmDelegableMsgs(d, args)
    expect(resolved?.mode).toBe('operator')
    expect(resolved?.msgs[0].typeUrl).toBe(CREATE)
    const request = confirmTx.mock.calls[0][0]
    expect(request).toMatchObject({
      titleKey: 'txconfirm.title.default',
      effect: 'Create an ecosystem.',
      mode: 'operator',
      payer: ME,
    })
    expect(request.severity).toBeUndefined()
    expect(request.warning).toBeUndefined()
    expect(request.proposalTitle).toBeUndefined()
  })

  it('carries the severity and the existing warning copy of a revocation', async () => {
    const { deps: d, confirmTx } = deps({ acting: membership({ grantedMessageTypes: [REVOKE] }) })
    await confirmDelegableMsgs(d, {
      ...args,
      typeUrl: REVOKE,
      build: (corporation, operator) => ({
        typeUrl: REVOKE,
        value: MsgRevokeParticipant.fromPartial({ corporation, operator, id: 7 }),
      }),
    })
    const request = confirmTx.mock.calls[0][0]
    expect(request.severity).toBe('irreversible')
    expect(request.warning).toMatch(/cannot be undone/)
  })

  it('falls back to a proposal and applies the composer title and summary', async () => {
    const { deps: d, confirmTx } = deps(
      { acting: membership({ grantedMessageTypes: [] }) },
      { proposalTitle: 'Custom', proposalSummary: 'Why' }
    )
    const resolved = await confirmDelegableMsgs(d, args)
    expect(resolved?.mode).toBe('proposal')
    expect(confirmTx.mock.calls[0][0]).toMatchObject({ mode: 'proposal', proposalTitle: 'Create an ecosystem' })
    const proposal = MsgSubmitProposal.decode(
      MsgSubmitProposal.encode(resolved?.msgs[0].value as MsgSubmitProposal).finish()
    )
    expect(proposal.title).toBe('Custom')
    expect(proposal.summary).toBe('Why')
    expect(proposal.messages[0].typeUrl).toBe(CREATE)
  })

  it('refuses to broadcast when the acting corporation changed while confirming', async () => {
    const { deps: d, notify } = deps({
      actingNow: () => membership({ corporation: { id: 99, policyAddress: 'x', did: 'y' } }),
    })
    expect(await confirmDelegableMsgs(d, args)).toBeNull()
    expect(notify).toHaveBeenCalledWith(expect.stringMatching(/acting corporation changed/i), 'error')
  })
})

'use client'

import type { EncodeObject } from '@cosmjs/proto-signing'
import type { DeliverTxResponse } from '@cosmjs/stargate'
import { useChain } from '@cosmos-kit/react'
import { MsgUpdateCorporation } from '@verana-labs/verana-types/codec/verana/co/v1/tx'
import {
  MsgGrantOperatorAuthorization,
  MsgRevokeOperatorAuthorization,
} from '@verana-labs/verana-types/codec/verana/de/v1/tx'
import { MsgRepaySlashedTrustDeposit } from '@verana-labs/verana-types/codec/verana/td/v1/tx'
import {
  Exec,
  MsgExec,
  MsgSubmitProposal,
  MsgUpdateGroupMembers,
  MsgUpdateGroupPolicyDecisionPolicy,
  MsgVote,
  MsgWithdrawProposal,
} from 'cosmjs-types/cosmos/group/v1/tx'
import { ThresholdDecisionPolicy, VoteOption } from 'cosmjs-types/cosmos/group/v1/types'
import { useRef } from 'react'
import { veranaRegistry } from '@/config/veranaChain.sign.client'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { notifyChainRejection } from '@/lib/chain-error'
import type { CorporationMembership } from '@/lib/corporation-discovery'
import { msgShortName, type TxConfirmRequest, type TxConfirmResult, txSeverity } from '@/lib/tx-preview'
import { runAfterIndexerCatchesUp, successfulTxNotification, waitForIndexerAfterTx } from '@/msg/util/indexerWait'
import { useSendTxDetectingMode } from '@/msg/util/sendTxDetectingMode'
import { extractTxHeight } from '@/msg/util/signerUtil'
import { useIndexerEvents } from '@/providers/indexer-events-provider'
import { useNotification } from '@/providers/notification-provider'
import { useTxConfirm } from '@/providers/tx-confirm-provider'
import type { I18nValues } from '@/ui/dataview/types'
import { formatVNAFromUVNA, shortenMiddle } from '@/util/util'

export type CorporationSigningMode = 'operator' | 'proposal'

export function corporationSigningMode(
  msgTypeUrl: string,
  membership: CorporationMembership | null
): CorporationSigningMode | null {
  if (!membership) return null
  if (membership.grantedMessageTypes.includes(msgTypeUrl)) return 'operator'
  if (membership.member) return 'proposal'
  return null
}

export function buildUpdateCorporationMessage(
  membership: CorporationMembership,
  did: string,
  operator: string
): EncodeObject {
  return {
    typeUrl: '/verana.co.v1.MsgUpdateCorporation',
    value: MsgUpdateCorporation.fromPartial({
      corporation: membership.corporation.policyAddress,
      operator,
      did,
    }),
  }
}

export function buildRevokeOperatorMessage(
  membership: CorporationMembership,
  grantee: string,
  operator: string
): EncodeObject {
  return {
    typeUrl: '/verana.de.v1.MsgRevokeOperatorAuthorization',
    value: MsgRevokeOperatorAuthorization.fromPartial({
      corporation: membership.corporation.policyAddress,
      operator,
      grantee,
    }),
  }
}

export function buildGrantOperatorMessage(
  membership: CorporationMembership,
  grantee: string,
  msgTypes: string[],
  operator: string
): EncodeObject {
  return {
    typeUrl: '/verana.de.v1.MsgGrantOperatorAuthorization',
    value: MsgGrantOperatorAuthorization.fromPartial({
      corporation: membership.corporation.policyAddress,
      operator,
      grantee,
      msgTypes,
      expiration: undefined,
      authzSpendLimit: [],
      authzSpendLimitPeriod: undefined,
      withFeegrant: false,
      feegrantSpendLimit: [],
      feegrantSpendLimitPeriod: undefined,
    }),
  }
}

export function buildRepaySlashedMessage(
  membership: CorporationMembership,
  depositUvna: number,
  operator: string
): EncodeObject {
  return {
    typeUrl: '/verana.td.v1.MsgRepaySlashedTrustDeposit',
    value: MsgRepaySlashedTrustDeposit.fromPartial({
      corporation: membership.corporation.policyAddress,
      operator,
      deposit: depositUvna,
    }),
  }
}

export interface GroupMemberUpdate {
  address: string
  weight: string
}

export function buildUpdateMembersMessage(
  membership: CorporationMembership,
  groupId: number,
  updates: GroupMemberUpdate[]
): EncodeObject {
  return {
    typeUrl: '/cosmos.group.v1.MsgUpdateGroupMembers',
    value: MsgUpdateGroupMembers.fromPartial({
      admin: membership.corporation.policyAddress,
      groupId: BigInt(groupId),
      memberUpdates: updates.map((update) => ({ address: update.address, weight: update.weight, metadata: '' })),
    }),
  }
}

export function buildUpdateDecisionPolicyMessage(
  membership: CorporationMembership,
  threshold: string,
  votingPeriodSeconds: number
): EncodeObject {
  const policy = ThresholdDecisionPolicy.fromPartial({
    threshold,
    windows: {
      votingPeriod: { seconds: BigInt(votingPeriodSeconds), nanos: 0 },
      minExecutionPeriod: { seconds: BigInt(0), nanos: 0 },
    },
  })
  return {
    typeUrl: '/cosmos.group.v1.MsgUpdateGroupPolicyDecisionPolicy',
    value: MsgUpdateGroupPolicyDecisionPolicy.fromPartial({
      admin: membership.corporation.policyAddress,
      groupPolicyAddress: membership.corporation.policyAddress,
      decisionPolicy: {
        typeUrl: '/cosmos.group.v1.ThresholdDecisionPolicy',
        value: ThresholdDecisionPolicy.encode(policy).finish(),
      },
    }),
  }
}

export function wrapInProposal(
  membership: CorporationMembership,
  proposer: string,
  message: EncodeObject,
  title: string,
  summary: string
): EncodeObject {
  return {
    typeUrl: '/cosmos.group.v1.MsgSubmitProposal',
    value: MsgSubmitProposal.fromPartial({
      groupPolicyAddress: membership.corporation.policyAddress,
      proposers: [proposer],
      metadata: '',
      messages: [veranaRegistry.encodeAsAny(message)],
      exec: Exec.EXEC_TRY,
      title,
      summary,
    }),
  }
}

export const VOTE_OPTIONS = {
  yes: VoteOption.VOTE_OPTION_YES,
  no: VoteOption.VOTE_OPTION_NO,
  abstain: VoteOption.VOTE_OPTION_ABSTAIN,
  veto: VoteOption.VOTE_OPTION_NO_WITH_VETO,
} as const

export type VoteChoice = keyof typeof VOTE_OPTIONS

export type TxPreview = Omit<TxConfirmRequest, 'msgs'>

export function buildVoteMessage(proposalId: number, voter: string, choice: VoteChoice): EncodeObject {
  return {
    typeUrl: '/cosmos.group.v1.MsgVote',
    value: MsgVote.fromPartial({
      proposalId: BigInt(proposalId),
      voter,
      option: VOTE_OPTIONS[choice],
      metadata: '',
      exec: Exec.EXEC_TRY,
    }),
  }
}

function txHeight(result: DeliverTxResponse): number {
  const height = extractTxHeight(result)
  if (height === undefined) throw new Error('Successful transaction did not include a block height')
  return height
}

export function delegablePreview(
  typeUrl: string,
  mode: CorporationSigningMode,
  membership: CorporationMembership,
  payer: string,
  proposalTitle: string,
  effectValues: I18nValues
): TxPreview {
  const name = msgShortName(typeUrl)
  const severity = txSeverity(typeUrl) ?? undefined
  return {
    titleKey: 'txconfirm.title.default',
    effect: translate(`txconfirm.effect.${name}`, {
      corporation: shortenMiddle(membership.corporation.did, 32),
      ...effectValues,
    }),
    mode,
    payer,
    severity,
    warning: severity ? translate(`txconfirm.warning.${name}`) : undefined,
    proposalTitle: mode === 'proposal' ? proposalTitle : undefined,
    corporationLabel: shortenMiddle(membership.corporation.did, 32),
  }
}

export function proposalMeta(result: TxConfirmResult, fallbackTitle: string): { title: string; summary: string } {
  const title = result.proposalTitle?.trim() || fallbackTitle
  return { title, summary: result.proposalSummary?.trim() || title }
}

function accountPreview(effect: string, payer: string): TxPreview {
  return { titleKey: 'txconfirm.title.default', effect, mode: 'account', payer }
}

export function useCorporationManage(onDone?: () => void) {
  const veranaChain = useVeranaChain()
  const { address, isWalletConnected } = useChain(veranaChain.chain_name)
  const { actingCorporation } = useUserCorporation()
  const { waitForBlock } = useIndexerEvents()
  const { notify } = useNotification()
  const { confirmTx } = useTxConfirm()
  const sendTx = useSendTxDetectingMode(veranaChain)
  const inFlight = useRef(false)
  const actingCorporationRef = useRef(actingCorporation)
  actingCorporationRef.current = actingCorporation
  const actingCorporationId = () => actingCorporationRef.current?.corporation.id ?? null

  async function broadcast(
    notificationKey: string,
    msgs: EncodeObject[],
    preview: TxPreview,
    finalize?: (confirmed: TxConfirmResult) => EncodeObject[]
  ): Promise<boolean> {
    if (!isWalletConnected || !address) {
      await notify(translate('notification.msg.connectwallet'), 'error')
      return false
    }
    if (inFlight.current) {
      await notify(translate('error.msg.pending.transaction'), 'error')
      return false
    }
    const actingBefore = actingCorporationId()
    const confirmed = await confirmTx({ ...preview, msgs })
    if (!confirmed) return false
    if (actingCorporationId() !== actingBefore) {
      await notify(translate('corporation.select.changed'), 'error')
      return false
    }
    const rejection = {
      corporation:
        preview.corporationLabel ?? (actingCorporation ? shortenMiddle(actingCorporation.corporation.did, 32) : ''),
      msg: msgShortName(msgs[0]?.typeUrl ?? ''),
    }
    inFlight.current = true
    try {
      void notify(translate(`notification.${notificationKey}.inprogress`), 'inProgress')
      const result = await sendTx({ msgs: finalize ? finalize(confirmed) : msgs, memo: notificationKey })
      if (!('code' in result)) throw new Error('Expected a transaction response')
      if (result.code !== 0) {
        await notifyChainRejection(
          notify,
          result.rawLog,
          `${translate(`notification.${notificationKey}.error`)} (${result.code}): ${result.rawLog}`,
          rejection
        )
        return false
      }
      const height = txHeight(result)
      const indexed = await waitForIndexerAfterTx(waitForBlock, height)
      const notification = successfulTxNotification(
        translate(`notification.${notificationKey}.success`),
        height,
        indexed
      )
      await notify(notification.message, notification.type, notification.title)
      if (indexed) onDone?.()
      else runAfterIndexerCatchesUp(waitForBlock, height, () => onDone?.())
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await notifyChainRejection(notify, message, message, rejection)
      return false
    } finally {
      inFlight.current = false
    }
  }

  async function sendDelegable(
    membership: CorporationMembership,
    build: (operator: string) => EncodeObject,
    notificationKey: string,
    proposalTitle: string,
    effectValues: I18nValues = {}
  ): Promise<boolean> {
    if (!address) {
      await notify(translate('notification.msg.connectwallet'), 'error')
      return false
    }
    const typeUrl = build(address).typeUrl
    const mode = corporationSigningMode(typeUrl, membership)
    if (!mode) {
      await notify(translate('error.msg.corporation.notauthorized', { msgType: typeUrl }), 'error')
      return false
    }
    const preview = delegablePreview(typeUrl, mode, membership, address, proposalTitle, effectValues)
    if (mode === 'operator') return broadcast(notificationKey, [build(address)], preview)
    const inner = build(membership.corporation.policyAddress)
    return broadcast(
      'MsgSubmitProposal',
      [wrapInProposal(membership, address, inner, proposalTitle, proposalTitle)],
      preview,
      (confirmed) => {
        const { title, summary } = proposalMeta(confirmed, proposalTitle)
        return [wrapInProposal(membership, address, inner, title, summary)]
      }
    )
  }

  return {
    updateCorporationDid: (membership: CorporationMembership, did: string) =>
      sendDelegable(
        membership,
        (operator) => buildUpdateCorporationMessage(membership, did, operator),
        'MsgUpdateCorporation',
        `Rotate corporation DID to ${did}`,
        { did }
      ),
    grantOperator: (membership: CorporationMembership, grantee: string, msgTypes: string[]) =>
      sendDelegable(
        membership,
        (operator) => buildGrantOperatorMessage(membership, grantee, msgTypes, operator),
        'MsgGrantOperatorAuthorization',
        `Grant operator authorization to ${grantee}`,
        { grantee: shortenMiddle(grantee, 24), count: msgTypes.length }
      ),
    revokeOperator: (membership: CorporationMembership, grantee: string) =>
      sendDelegable(
        membership,
        (operator) => buildRevokeOperatorMessage(membership, grantee, operator),
        'MsgRevokeOperatorAuthorization',
        `Revoke operator authorization of ${grantee}`,
        { operator: shortenMiddle(grantee, 24) }
      ),
    repaySlashed: (membership: CorporationMembership, depositUvna: number) =>
      sendDelegable(
        membership,
        (operator) => buildRepaySlashedMessage(membership, depositUvna, operator),
        'MsgRepaySlashedTrustDeposit',
        'Repay the slashed trust deposit',
        { amount: formatVNAFromUVNA(String(depositUvna)) }
      ),
    propose: async (membership: CorporationMembership, message: EncodeObject, title: string): Promise<boolean> => {
      if (!membership.member) {
        await notify(translate('error.msg.corporation.notauthorized'), 'error')
        return false
      }
      if (!address) {
        await notify(translate('notification.msg.connectwallet'), 'error')
        return false
      }
      return broadcast(
        'MsgSubmitProposal',
        [wrapInProposal(membership, address, message, title, title)],
        accountPreview(
          translate('txconfirm.effect.MsgSubmitProposal', {
            corporation: shortenMiddle(membership.corporation.did, 32),
          }),
          address
        )
      )
    },
    vote: (proposalId: number, choice: VoteChoice) =>
      broadcast(
        'MsgVote',
        [buildVoteMessage(proposalId, address ?? '', choice)],
        accountPreview(translate('txconfirm.effect.MsgVote', { option: choice, id: proposalId }), address ?? '')
      ),
    execute: (proposalId: number) =>
      broadcast(
        'MsgExec',
        [
          {
            typeUrl: '/cosmos.group.v1.MsgExec',
            value: MsgExec.fromPartial({ proposalId: BigInt(proposalId), executor: address ?? '' }),
          },
        ],
        accountPreview(translate('txconfirm.effect.MsgExec', { id: proposalId }), address ?? '')
      ),
    withdraw: (proposalId: number) =>
      broadcast(
        'MsgWithdrawProposal',
        [
          {
            typeUrl: '/cosmos.group.v1.MsgWithdrawProposal',
            value: MsgWithdrawProposal.fromPartial({ proposalId: BigInt(proposalId), address: address ?? '' }),
          },
        ],
        accountPreview(translate('txconfirm.effect.MsgWithdrawProposal', { id: proposalId }), address ?? '')
      ),
  }
}

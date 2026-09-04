'use client'

import type { EncodeObject } from '@cosmjs/proto-signing'
import type { DeliverTxResponse } from '@cosmjs/stargate'
import { useChain } from '@cosmos-kit/react'
import { MsgCreateCorporation } from '@verana-labs/verana-types/codec/verana/co/v1/tx'
import { MsgGrantOperatorAuthorization } from '@verana-labs/verana-types/codec/verana/de/v1/tx'
import { MsgSend } from 'cosmjs-types/cosmos/bank/v1beta1/tx'
import { Exec, MsgSubmitProposal } from 'cosmjs-types/cosmos/group/v1/tx'
import { ThresholdDecisionPolicy } from 'cosmjs-types/cosmos/group/v1/types'
import { useRef } from 'react'
import { findCorporationMembership, type UserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { notifyChainRejection } from '@/lib/chain-error'
import { saveActingCorporationId } from '@/lib/corporation-discovery'
import { OPERATOR_GRANT_MESSAGE_TYPES } from '@/msg/constants/operatorGrantMessageTypes'
import { runAfterIndexerCatchesUp, successfulTxNotification, waitForIndexerAfterTx } from '@/msg/util/indexerWait'
import { useSendTxDetectingMode } from '@/msg/util/sendTxDetectingMode'
import { extractTxHeight } from '@/msg/util/signerUtil'
import { findEventAttribute } from '@/msg/util/txEvents'
import { useIndexerEvents } from '@/providers/indexer-events-provider'
import { useNotification } from '@/providers/notification-provider'
import { resolveTranslatable } from '@/ui/dataview/types'
import { shortenMiddle } from '@/util/util'
import { isValidHttpUrl } from '@/util/validations'

const GROUP_VOTING_PERIOD_SECONDS = 60

export interface CorporationMemberInput {
  address: string
  weight: string
}

export interface BootstrapCorporationParams {
  did: string
  language: string
  docUrl: string
  fundingUvna?: string
  members?: CorporationMemberInput[]
  threshold?: string
  votingPeriodSeconds?: number
}

export function buildCreateCorporationMessage(
  params: BootstrapCorporationParams,
  signer: string,
  docDigestSri: string
): EncodeObject {
  const policy = ThresholdDecisionPolicy.fromPartial({
    threshold: params.threshold ?? '1',
    windows: {
      votingPeriod: { seconds: BigInt(params.votingPeriodSeconds ?? GROUP_VOTING_PERIOD_SECONDS), nanos: 0 },
      minExecutionPeriod: { seconds: BigInt(0), nanos: 0 },
    },
  })
  const members = (params.members?.length ? params.members : [{ address: signer, weight: '1' }]).map((member) => ({
    address: member.address,
    weight: member.weight,
    metadata: '',
  }))
  return {
    typeUrl: '/verana.co.v1.MsgCreateCorporation',
    value: MsgCreateCorporation.fromPartial({
      signer,
      members,
      groupMetadata: '',
      groupPolicyMetadata: '',
      decisionPolicy: {
        typeUrl: '/cosmos.group.v1.ThresholdDecisionPolicy',
        value: ThresholdDecisionPolicy.encode(policy).finish(),
      },
      did: params.did,
      language: params.language,
      docUrl: params.docUrl,
      docDigestSri,
    }),
  }
}

export function buildGrantOperatorMessages(
  corporation: UserCorporation,
  grantee: string,
  fundingUvna: string
): EncodeObject[] {
  if (!/^\d+$/.test(fundingUvna)) throw new Error('fundingUvna must be a non-negative integer')
  const grant = MsgGrantOperatorAuthorization.fromPartial({
    corporation: corporation.policyAddress,
    operator: corporation.policyAddress,
    grantee,
    msgTypes: [...OPERATOR_GRANT_MESSAGE_TYPES],
    expiration: undefined,
    authzSpendLimit: [],
    authzSpendLimitPeriod: undefined,
    withFeegrant: false,
    feegrantSpendLimit: [],
    feegrantSpendLimitPeriod: undefined,
  })
  const proposal: EncodeObject = {
    typeUrl: '/cosmos.group.v1.MsgSubmitProposal',
    value: MsgSubmitProposal.fromPartial({
      groupPolicyAddress: corporation.policyAddress,
      proposers: [grantee],
      metadata: '',
      messages: [
        {
          typeUrl: '/verana.de.v1.MsgGrantOperatorAuthorization',
          value: MsgGrantOperatorAuthorization.encode(grant).finish(),
        },
      ],
      exec: Exec.EXEC_TRY,
      title: 'Grant operator authorization',
      summary: `Authorize ${grantee} to operate for corporation ${corporation.id}`,
    }),
  }

  if (fundingUvna === '0') return [proposal]
  return [
    {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: MsgSend.fromPartial({
        fromAddress: grantee,
        toAddress: corporation.policyAddress,
        amount: [{ denom: 'uvna', amount: fundingUvna }],
      }),
    },
    proposal,
  ]
}

async function documentDigest(docUrl: string): Promise<string> {
  if (!isValidHttpUrl(docUrl)) throw new Error('Invalid document URL')
  const response = await fetch(`/api/sri?url=${encodeURIComponent(docUrl)}`)
  if (!response.ok) throw new Error('Unable to calculate the document digest')
  const payload: unknown = await response.json()
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw new Error('Invalid document digest response')
  }
  const sri = (payload as Record<string, unknown>).sri
  if (typeof sri !== 'string' || sri.length === 0) throw new Error('Invalid document digest response')
  return sri
}

export async function buildCreateCorporationMessages(
  params: BootstrapCorporationParams,
  signer: string
): Promise<EncodeObject[]> {
  return [buildCreateCorporationMessage(params, signer, await documentDigest(params.docUrl))]
}

function txHeight(result: DeliverTxResponse): number {
  const height = extractTxHeight(result)
  if (height === undefined) throw new Error('Successful transaction did not include a block height')
  return height
}

function t(key: string): string {
  return resolveTranslatable({ key }, translate) ?? key
}

export function useActionCorporation(onDone?: () => void) {
  const veranaChain = useVeranaChain()
  const { address, isWalletConnected } = useChain(veranaChain.chain_name)
  const { waitForBlock } = useIndexerEvents()
  const { notify } = useNotification()
  const sendTx = useSendTxDetectingMode(veranaChain)
  const inFlight = useRef(false)

  async function createCorporation(params: BootstrapCorporationParams, operator: string): Promise<UserCorporation> {
    void notify(t('notification.MsgCreateCorporation.inprogress'), 'inProgress')
    const result = await sendTx({
      msgs: await buildCreateCorporationMessages(params, operator),
      memo: 'MsgCreateCorporation',
    })
    if (!('code' in result)) throw new Error('Expected a transaction response')
    if (result.code !== 0)
      throw new Error(`${t('notification.MsgCreateCorporation.error')} (${result.code}): ${result.rawLog}`)

    const id = findEventAttribute(result.events, 'create_corporation', 'corporation_id')
    const policyAddress = findEventAttribute(result.events, 'create_corporation', 'policy_address')
    if (!id || !policyAddress) throw new Error('Create corporation transaction did not emit its identifiers')
    saveActingCorporationId(operator, Number(id))
    const height = txHeight(result)
    const indexed = await waitForIndexerAfterTx(waitForBlock, height)
    const notification = successfulTxNotification(t('notification.MsgCreateCorporation.success'), height, indexed)
    await notify(notification.message, notification.type, notification.title)
    return { id: Number(id), policyAddress, did: params.did }
  }

  async function grantOperator(
    corporation: UserCorporation,
    operator: string,
    fundingUvna: string
  ): Promise<'granted' | 'pending'> {
    void notify(t('notification.MsgGrantSelfOperatorAuthorization.inprogress'), 'inProgress')
    const result = await sendTx({
      msgs: buildGrantOperatorMessages(corporation, operator, fundingUvna),
      memo: 'MsgGrantSelfOperatorAuthorization',
    })
    if (!('code' in result)) throw new Error('Expected a transaction response')
    if (result.code !== 0) {
      throw new Error(`${t('notification.MsgGrantSelfOperatorAuthorization.error')} (${result.code}): ${result.rawLog}`)
    }

    const height = txHeight(result)
    const indexed = await waitForIndexerAfterTx(waitForBlock, height)
    if (indexed) {
      const membership = await findCorporationMembership(operator, corporation.id)
      if (!membership || membership.grantedMessageTypes.length === 0) {
        await notify(t('notification.MsgGrantSelfOperatorAuthorization.pending'), 'success')
        return 'pending'
      }
    }
    const notification = successfulTxNotification(
      t('notification.MsgGrantSelfOperatorAuthorization.success'),
      height,
      indexed
    )
    await notify(notification.message, notification.type, notification.title)
    if (!indexed) {
      runAfterIndexerCatchesUp(waitForBlock, height, () => onDone?.())
      return 'pending'
    }
    return 'granted'
  }

  async function createOnly(params: BootstrapCorporationParams): Promise<UserCorporation | null> {
    if (!isWalletConnected || !address) {
      await notify(t('notification.msg.connectwallet'), 'error')
      return null
    }
    if (inFlight.current) {
      await notify(t('error.msg.pending.transaction'), 'error')
      return null
    }
    inFlight.current = true
    try {
      return await createCorporation(params, address)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await notifyChainRejection(notify, message, message, {
        corporation: shortenMiddle(params.did, 32),
        msg: 'MsgCreateCorporation',
      })
      return null
    } finally {
      inFlight.current = false
    }
  }

  async function grantFirstOperator(
    corporation: UserCorporation,
    fundingUvna: string
  ): Promise<'granted' | 'pending' | 'failed'> {
    if (!isWalletConnected || !address) {
      await notify(t('notification.msg.connectwallet'), 'error')
      return 'failed'
    }
    if (inFlight.current) {
      await notify(t('error.msg.pending.transaction'), 'error')
      return 'failed'
    }
    inFlight.current = true
    try {
      return await grantOperator(corporation, address, fundingUvna)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      await notifyChainRejection(notify, message, message, {
        corporation: shortenMiddle(corporation.did, 32),
        msg: 'MsgGrantOperatorAuthorization',
      })
      return 'failed'
    } finally {
      inFlight.current = false
    }
  }

  return { createOnly, grantFirstOperator }
}

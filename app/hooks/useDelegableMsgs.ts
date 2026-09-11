'use client'

import { useChain } from '@cosmos-kit/react'
import { useRef } from 'react'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import type { CorporationMembership } from '@/lib/corporation-discovery'
import {
  msgShortName,
  proposalMetadata,
  type TxConfirmRequest,
  type TxConfirmResult,
  txSeverity,
} from '@/lib/tx-preview'
import { type DelegableBuild, type DelegableMsgs, resolveDelegableMsgs } from '@/msg/util/delegable-msgs'
import { useNotification } from '@/providers/notification-provider'
import { useTxConfirm } from '@/providers/tx-confirm-provider'
import { type I18nValues, resolveTranslatable } from '@/ui/dataview/types'

export interface DelegableMsgsArgs {
  typeUrl: string
  build: DelegableBuild
  effect: string
  proposalTitle: string
  simulate: boolean
  costLines?: { label: string; value: string }[]
}

export interface DelegableMsgsDeps {
  address: string | undefined
  actingCorporation: CorporationMembership | null
  loading: boolean
  actingCorporationNow: () => CorporationMembership | null
  notify: (message: string, type: 'info' | 'error') => Promise<void>
  confirmTx: (request: TxConfirmRequest) => Promise<TxConfirmResult | null>
}

function t(key: string, values?: I18nValues): string {
  return resolveTranslatable({ key, values }, translate) ?? key
}

function existing(key: string): string | undefined {
  const text = t(key)
  return text === key ? undefined : text
}

function warningFor(typeUrl: string): string | undefined {
  const name = msgShortName(typeUrl)
  return existing(`txconfirm.warning.${name}`) ?? existing(`messages.${name}.warning`)
}

export async function confirmDelegableMsgs(
  deps: DelegableMsgsDeps,
  args: DelegableMsgsArgs
): Promise<DelegableMsgs | null> {
  const { address, actingCorporation, loading, actingCorporationNow, notify, confirmTx } = deps
  const { typeUrl, build, effect, proposalTitle, simulate, costLines } = args
  if (!address) return null
  if (loading) {
    if (!simulate) await notify(t('corporation.select.loading'), 'info')
    return null
  }
  if (!actingCorporation) {
    if (!simulate) await notify(t('error.msg.corporation.required'), 'error')
    return null
  }
  const resolution = resolveDelegableMsgs({ membership: actingCorporation, address, typeUrl, build })
  if (!resolution) {
    if (!simulate) await notify(t('error.msg.corporation.notauthorized', { msgType: msgShortName(typeUrl) }), 'error')
    return null
  }
  const { mode } = resolution
  const msgs = resolution.build(proposalMetadata('', '', proposalTitle))
  if (simulate) return { msgs, mode }
  const severity = txSeverity(typeUrl) ?? undefined
  const confirmed = await confirmTx({
    titleKey: 'txconfirm.title.default',
    effect,
    msgs,
    mode,
    payer: address,
    severity,
    warning: severity ? warningFor(typeUrl) : undefined,
    proposalTitle: mode === 'proposal' ? proposalTitle : undefined,
    buildProposalMsgs: mode === 'proposal' ? resolution.build : undefined,
    feeGrant:
      mode === 'operator'
        ? {
            corporationId: actingCorporation.corporation.id,
            grantee: address,
            msgType: typeUrl,
            granterAddress: actingCorporation.corporation.policyAddress,
          }
        : undefined,
    costLines,
  })
  if (!confirmed) return null
  if (actingCorporationNow()?.corporation.id !== actingCorporation.corporation.id) {
    await notify(t('corporation.select.changed'), 'error')
    return null
  }
  return { msgs: confirmed.msgs, mode, granter: confirmed.granter }
}

export function useDelegableMsgs(): (args: DelegableMsgsArgs) => Promise<DelegableMsgs | null> {
  const veranaChain = useVeranaChain()
  const { address } = useChain(veranaChain.chain_name)
  const { actingCorporation, loading } = useUserCorporation()
  const { notify } = useNotification()
  const { confirmTx } = useTxConfirm()
  const actingCorporationRef = useRef(actingCorporation)
  actingCorporationRef.current = actingCorporation
  const actingCorporationNow = () => actingCorporationRef.current
  return (args) =>
    confirmDelegableMsgs({ address, actingCorporation, loading, actingCorporationNow, notify, confirmTx }, args)
}

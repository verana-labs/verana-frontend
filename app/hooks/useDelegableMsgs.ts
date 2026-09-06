'use client'

import { useChain } from '@cosmos-kit/react'
import { useRef } from 'react'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import type { CorporationMembership } from '@/lib/corporation-discovery'
import { type CostLine, msgShortName, type TxConfirmRequest, type TxConfirmResult, txSeverity } from '@/lib/tx-preview'
import { type DelegableBuild, type DelegableMsgs, resolveDelegableMsgs } from '@/msg/util/delegable-msgs'
import { useNotification } from '@/providers/notification-provider'
import { useTxConfirm } from '@/providers/tx-confirm-provider'
import { type I18nValues, resolveTranslatable } from '@/ui/dataview/types'
import { shortenMiddle } from '@/util/util'

export interface DelegableMsgsArgs {
  typeUrl: string
  build: DelegableBuild
  effect: string
  proposalTitle: string
  simulate: boolean
  costLines?: CostLine[]
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
  const resolve = (title: string, summary: string) =>
    resolveDelegableMsgs({
      membership: actingCorporation,
      address,
      typeUrl,
      build,
      proposalTitle: title,
      proposalSummary: summary,
    })
  const resolved = resolve(proposalTitle, proposalTitle)
  if (!resolved) {
    if (!simulate) await notify(t('error.msg.corporation.notauthorized', { msgType: msgShortName(typeUrl) }), 'error')
    return null
  }
  if (simulate) return resolved
  const severity = txSeverity(typeUrl) ?? undefined
  const proposal = resolved.mode === 'proposal'
  const confirmed = await confirmTx({
    titleKey: 'txconfirm.title.default',
    effect,
    msgs: resolved.msgs,
    mode: resolved.mode,
    payer: address,
    severity,
    warning: severity ? warningFor(typeUrl) : undefined,
    proposalTitle: proposal ? proposalTitle : undefined,
    rebuild: proposal ? ({ title, summary }) => resolve(title, summary)?.msgs ?? resolved.msgs : undefined,
    corporationLabel: shortenMiddle(actingCorporation.corporation.did, 32),
    costLines,
  })
  if (!confirmed) return null
  if (actingCorporationNow()?.corporation.id !== actingCorporation.corporation.id) {
    await notify(t('corporation.select.changed'), 'error')
    return null
  }
  return { ...resolved, msgs: confirmed.msgs }
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

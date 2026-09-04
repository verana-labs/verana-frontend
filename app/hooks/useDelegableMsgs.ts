'use client'

import { useChain } from '@cosmos-kit/react'
import { useRef } from 'react'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import type { CorporationMembership } from '@/lib/corporation-discovery'
import { msgShortName, type TxConfirmRequest, type TxConfirmResult, txSeverity } from '@/lib/tx-preview'
import { proposalMeta } from '@/msg/actions_hooks/actionCorporationManage'
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
  acting: CorporationMembership | null
  loading: boolean
  actingNow: () => CorporationMembership | null
  requestSelection: () => void
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
  const { address, acting, loading, actingNow, requestSelection, notify, confirmTx } = deps
  const { typeUrl, build, effect, proposalTitle, simulate, costLines } = args
  if (!address) return null
  if (loading) {
    if (!simulate) await notify(t('corporation.select.loading'), 'info')
    return null
  }
  if (!acting) {
    requestSelection()
    if (!simulate) await notify(t('corporation.select.required'), 'info')
    return null
  }
  const resolve = (title: string, summary: string) =>
    resolveDelegableMsgs({
      membership: acting,
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
  const confirmed = await confirmTx({
    titleKey: 'txconfirm.title.default',
    effect,
    msgs: resolved.msgs,
    mode: resolved.mode,
    payer: address,
    severity,
    warning: severity ? warningFor(typeUrl) : undefined,
    proposalTitle: resolved.mode === 'proposal' ? proposalTitle : undefined,
    costLines,
  })
  if (!confirmed) return null
  if (actingNow()?.corporation.id !== acting.corporation.id) {
    await notify(t('corporation.select.changed'), 'error')
    return null
  }
  if (resolved.mode === 'operator') return resolved
  const { title, summary } = proposalMeta(confirmed, proposalTitle)
  return resolve(title, summary)
}

export function useDelegableMsgs(): (args: DelegableMsgsArgs) => Promise<DelegableMsgs | null> {
  const veranaChain = useVeranaChain()
  const { address } = useChain(veranaChain.chain_name)
  const { acting, loading, requestSelection } = useUserCorporation()
  const { notify } = useNotification()
  const { confirmTx } = useTxConfirm()
  const actingRef = useRef(acting)
  actingRef.current = acting
  const actingNow = () => actingRef.current
  return (args) =>
    confirmDelegableMsgs({ address, acting, loading, actingNow, requestSelection, notify, confirmTx }, args)
}

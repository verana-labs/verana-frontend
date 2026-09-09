'use client'

import { useChain } from '@cosmos-kit/react'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import type { CorporationMembership } from '@/lib/corporation-discovery'
import { type CorporationSigningMode, corporationSigningMode } from '@/msg/actions_hooks/actionCorporationManage'
import { delegableTypeUrl } from '@/msg/util/delegable-msgs'
import { resolveTranslatable } from '@/ui/dataview/types'

export interface ActionSigning {
  mode: CorporationSigningMode | null
  disabled: boolean
  reason: string | undefined
}

const PLAIN: ActionSigning = { mode: null, disabled: false, reason: undefined }

function blocked(key: string): ActionSigning {
  return { mode: null, disabled: true, reason: resolveTranslatable({ key }, translate) }
}

export function resolveActionSigning(
  msgType: string,
  actingCorporation: CorporationMembership | null,
  loading: boolean,
  connected: boolean
): ActionSigning {
  const typeUrl = delegableTypeUrl(msgType)
  if (!typeUrl) return PLAIN
  if (loading) return { mode: null, disabled: true, reason: undefined }
  if (!actingCorporation) return connected ? blocked('corporation.capability.select') : PLAIN
  const mode = corporationSigningMode(typeUrl, actingCorporation)
  if (mode) return { mode, disabled: false, reason: undefined }
  return blocked('corporation.capability.none')
}

export function useSigningMode(typeUrl: string | undefined): CorporationSigningMode | null {
  const { actingCorporation, loading } = useUserCorporation()
  if (!typeUrl || loading || !actingCorporation) return null
  return corporationSigningMode(typeUrl, actingCorporation)
}

export function useActionSigning(msgType: string): ActionSigning {
  const veranaChain = useVeranaChain()
  const { address } = useChain(veranaChain.chain_name)
  const { actingCorporation, loading } = useUserCorporation()
  return resolveActionSigning(msgType, actingCorporation, loading, Boolean(address))
}

'use client'

import { useUserCorporation } from '@/hooks/useUserCorporation'
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

export function resolveActionSigning(
  msgType: string,
  actingCorporation: CorporationMembership | null,
  loading: boolean
): ActionSigning {
  const typeUrl = delegableTypeUrl(msgType)
  if (!typeUrl) return PLAIN
  if (loading) return { mode: null, disabled: true, reason: undefined }
  if (!actingCorporation) return PLAIN
  const mode = corporationSigningMode(typeUrl, actingCorporation)
  if (mode) return { mode, disabled: false, reason: undefined }
  return {
    mode: null,
    disabled: true,
    reason: resolveTranslatable({ key: 'corporation.capability.none' }, translate),
  }
}

export function useSigningMode(typeUrl: string | undefined): CorporationSigningMode | null {
  const { actingCorporation, loading } = useUserCorporation()
  if (!typeUrl || loading || !actingCorporation) return null
  return corporationSigningMode(typeUrl, actingCorporation)
}

export function useActionSigning(msgType: string): ActionSigning {
  const { actingCorporation, loading } = useUserCorporation()
  return resolveActionSigning(msgType, actingCorporation, loading)
}

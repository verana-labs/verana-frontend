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
  acting: CorporationMembership | null,
  loading: boolean
): ActionSigning {
  const typeUrl = delegableTypeUrl(msgType)
  if (!typeUrl) return PLAIN
  if (loading) return { mode: null, disabled: true, reason: undefined }
  if (!acting) return PLAIN
  const mode = corporationSigningMode(typeUrl, acting)
  if (mode) return { mode, disabled: false, reason: undefined }
  return {
    mode: null,
    disabled: true,
    reason: resolveTranslatable({ key: 'corporation.capability.none' }, translate),
  }
}

export function useSigningMode(typeUrl: string | undefined): CorporationSigningMode | null {
  const { acting, loading } = useUserCorporation()
  if (!typeUrl || loading || !acting) return null
  return corporationSigningMode(typeUrl, acting)
}

export function useActionSigning(msgType: string): ActionSigning {
  const { acting, loading } = useUserCorporation()
  return resolveActionSigning(msgType, acting, loading)
}

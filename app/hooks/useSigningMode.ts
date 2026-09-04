'use client'

import { useUserCorporation } from '@/hooks/useUserCorporation'
import { type CorporationSigningMode, corporationSigningMode } from '@/msg/actions_hooks/actionCorporationManage'
import { delegableTypeUrl } from '@/msg/util/delegable-msgs'

export function useSigningMode(typeUrl: string | undefined): CorporationSigningMode | null {
  const { acting, loading } = useUserCorporation()
  if (!typeUrl || loading || !acting) return null
  return corporationSigningMode(typeUrl, acting)
}

export function useActionSigning(msgType: string): { mode: CorporationSigningMode | null; disabled: boolean } {
  const typeUrl = delegableTypeUrl(msgType) ?? undefined
  const { loading } = useUserCorporation()
  return { mode: useSigningMode(typeUrl), disabled: typeUrl !== undefined && loading }
}

'use client'

import { useCorporationContext } from '@/providers/corporation-provider'

export {
  type CorporationMembership,
  resolveUserCorporation,
  type UserCorporation,
  type UserCorporationResolution,
} from '@/lib/corporation-discovery'

export function useUserCorporation() {
  const { memberships, acting, needsSelection, loading, errorCorporation, setActing, refetch } = useCorporationContext()
  return {
    corporation: acting?.corporation ?? null,
    hasOperatorGrant: (acting?.grantedMessageTypes.length ?? 0) > 0,
    grantedMessageTypes: acting?.grantedMessageTypes ?? [],
    memberships,
    acting,
    needsSelection,
    loading,
    errorCorporation,
    setActing,
    refetch,
  }
}

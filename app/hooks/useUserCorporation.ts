'use client'

import { useCorporationContext } from '@/providers/corporation-provider'

export {
  type CorporationMembership,
  findCorporationMembership,
  type UserCorporation,
} from '@/lib/corporation-discovery'

export function useUserCorporation() {
  const { memberships, acting, needsSelection, loading, errorCorporation, setActing, requestSelection, refetch } =
    useCorporationContext()
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
    requestSelection,
    refetch,
  }
}

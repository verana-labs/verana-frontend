'use client'

import { useContext } from 'react'
import { CorporationContext, type CorporationContextValue } from '@/providers/corporation-provider'

export function useUserCorporation(): CorporationContextValue {
  const context = useContext(CorporationContext)
  if (!context) throw new Error('useUserCorporation requires a CorporationProvider')
  return context
}

export function useActingPendingVotes(): number {
  const { actingCorporation, attention } = useUserCorporation()
  return actingCorporation ? (attention[actingCorporation.corporation.id]?.pendingVotes ?? 0) : 0
}

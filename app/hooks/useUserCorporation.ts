'use client'

import { useContext } from 'react'
import { CorporationContext, type CorporationContextValue } from '@/providers/corporation-provider'

export function useUserCorporation(): CorporationContextValue {
  const context = useContext(CorporationContext)
  if (!context) throw new Error('useUserCorporation requires a CorporationProvider')
  return context
}

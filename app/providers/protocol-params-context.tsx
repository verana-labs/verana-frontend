'use client'

import { createContext, useContext } from 'react'
import type { ProtocolParams } from '@/lib/protocolParams'

const ProtocolParamsContext = createContext<ProtocolParams | undefined>(undefined)

export function ProtocolParamsProvider({ value, children }: { value: ProtocolParams; children: React.ReactNode }) {
  return <ProtocolParamsContext.Provider value={value}>{children}</ProtocolParamsContext.Provider>
}

export function useProtocolParams() {
  const ctx = useContext(ProtocolParamsContext)
  if (!ctx) throw new Error('useProtocolParams must be used within <ClientLayout>')
  return ctx
}

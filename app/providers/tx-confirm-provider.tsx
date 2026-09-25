'use client'

import { createContext, type ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { TxConfirmRequest, TxConfirmResult } from '@/lib/tx-preview'
import { ConfirmTransactionModal } from '@/ui/common/confirm-transaction-modal'

type TxConfirmContextType = {
  confirmTx: (request: TxConfirmRequest) => Promise<TxConfirmResult | null>
}

const TxConfirmContext = createContext<TxConfirmContextType | undefined>(undefined)

export function useTxConfirm(): TxConfirmContextType {
  const context = useContext(TxConfirmContext)
  if (!context) throw new Error('useTxConfirm must be used within a TxConfirmProvider')
  return context
}

export function TxConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<TxConfirmRequest | null>(null)
  const resolver = useRef<((result: TxConfirmResult | null) => void) | null>(null)

  const settle = useCallback((result: TxConfirmResult | null) => {
    resolver.current?.(result)
    resolver.current = null
    setPending(null)
  }, [])

  const cancel = useCallback(() => settle(null), [settle])

  const confirmTx = useCallback((request: TxConfirmRequest) => {
    resolver.current?.(null)
    setPending(request)
    return new Promise<TxConfirmResult | null>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const value = useMemo(() => ({ confirmTx }), [confirmTx])

  return (
    <TxConfirmContext.Provider value={value}>
      {children}
      {pending ? <ConfirmTransactionModal request={pending} onCancel={cancel} onConfirm={settle} /> : null}
    </TxConfirmContext.Provider>
  )
}

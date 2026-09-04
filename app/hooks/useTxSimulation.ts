'use client'

import type { EncodeObject } from '@cosmjs/proto-signing'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { logger } from '@/lib/logger'
import { formatStdFee } from '@/lib/tx-preview'
import { useSendTxDetectingMode } from '@/msg/util/sendTxDetectingMode'

export type TxSimulation =
  | { status: 'simulating' }
  | { status: 'ready'; fee: string }
  | { status: 'failed'; message: string }

export function useTxSimulation(msgs: EncodeObject[]): { simulation: TxSimulation; simulate: () => () => void } {
  const veranaChain = useVeranaChain()
  const sendTx = useSendTxDetectingMode(veranaChain)
  const sendTxRef = useRef(sendTx)
  sendTxRef.current = sendTx
  const [simulation, setSimulation] = useState<TxSimulation>({ status: 'simulating' })

  const simulate = useCallback(() => {
    let cancelled = false
    setSimulation({ status: 'simulating' })
    sendTxRef
      .current({ msgs, simulate: true })
      .then((result) => {
        if (cancelled) return
        if ('gas' in result && 'amount' in result) setSimulation({ status: 'ready', fee: formatStdFee(result) })
        else setSimulation({ status: 'failed', message: 'Expected a simulated fee' })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        logger.error('transaction simulation', error)
        setSimulation({ status: 'failed', message: error instanceof Error ? error.message : String(error) })
      })
    return () => {
      cancelled = true
    }
  }, [msgs])

  useEffect(simulate, [simulate])

  return { simulation, simulate }
}

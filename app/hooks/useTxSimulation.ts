'use client'

import type { EncodeObject } from '@cosmjs/proto-signing'
import type { StdFee } from '@cosmjs/stargate'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { logger } from '@/lib/logger'
import { useSendTxDetectingMode } from '@/msg/util/sendTxDetectingMode'

export type TxSimulation =
  | { status: 'simulating' }
  | { status: 'ready'; fee: StdFee; msgs: EncodeObject[] }
  | { status: 'failed'; message: string; msgs: EncodeObject[] }

export function simulationFor(simulation: TxSimulation, msgs: EncodeObject[]): TxSimulation {
  if (simulation.status === 'simulating' || simulation.msgs === msgs) return simulation
  return { status: 'simulating' }
}

export function useTxSimulation(msgs: EncodeObject[]): { simulation: TxSimulation; simulate: () => () => void } {
  const veranaChain = useVeranaChain()
  const sendTx = useSendTxDetectingMode(veranaChain)
  const sendTxRef = useRef(sendTx)
  sendTxRef.current = sendTx
  const [simulation, setSimulation] = useState<TxSimulation>({ status: 'simulating' })
  const runRef = useRef(0)

  const simulate = useCallback(() => {
    const run = ++runRef.current
    setSimulation({ status: 'simulating' })
    sendTxRef
      .current({ msgs, simulate: true })
      .then((result) => {
        if (run !== runRef.current) return
        if ('gas' in result && 'amount' in result) setSimulation({ status: 'ready', fee: result, msgs })
        else setSimulation({ status: 'failed', message: 'Expected a simulated fee', msgs })
      })
      .catch((error: unknown) => {
        if (run !== runRef.current) return
        logger.error('transaction simulation', error)
        setSimulation({ status: 'failed', message: error instanceof Error ? error.message : String(error), msgs })
      })
    return () => {
      if (run === runRef.current) runRef.current += 1
    }
  }, [msgs])

  useEffect(simulate, [simulate])

  return { simulation, simulate }
}

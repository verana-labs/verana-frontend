'use client'

import { useChain } from '@cosmos-kit/react'
import { useEffect, useRef, useState } from 'react'
import { veranaDenom } from '@/config/veranaChain.sign.client'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { logger } from '@/lib/logger'

export type GranterBalance =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; amount: string }
  | { status: 'failed' }

const BALANCE_TIMEOUT_MS = 10_000

export function useGranterBalance(granter: string | undefined): GranterBalance {
  const veranaChain = useVeranaChain()
  const { getStargateClient } = useChain(veranaChain.chain_name)
  const getStargateClientRef = useRef(getStargateClient)
  const [balance, setBalance] = useState<GranterBalance>({ status: 'idle' })

  useEffect(() => {
    getStargateClientRef.current = getStargateClient
  }, [getStargateClient])

  useEffect(() => {
    if (!granter) {
      setBalance({ status: 'idle' })
      return
    }
    let active = true
    const settle = (next: GranterBalance) => {
      if (!active) return
      active = false
      clearTimeout(timer)
      setBalance(next)
    }
    const timer = setTimeout(() => settle({ status: 'failed' }), BALANCE_TIMEOUT_MS)
    setBalance({ status: 'loading' })
    getStargateClientRef
      .current()
      .then((client) => client.getBalance(granter, veranaDenom))
      .then((coin) => settle({ status: 'ready', amount: coin.amount }))
      .catch((error: unknown) => {
        logger.error('granter balance', error)
        settle({ status: 'failed' })
      })
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [granter])

  return balance
}

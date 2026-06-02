'use client'

import { useChain } from '@cosmos-kit/react'
import { env } from 'next-runtime-env'
import { useCallback, useEffect, useState } from 'react'
import { useVeranaChain } from '@/hooks/useVeranaChain'

export function useAccountTxCount() {
  const veranaChain = useVeranaChain()
  const { address, isWalletConnected } = useChain(veranaChain.chain_name)

  const getURL = env('NEXT_PUBLIC_VERANA_REST_ENDPOINT') || process.env.NEXT_PUBLIC_VERANA_REST_ENDPOINT

  const [txCount, setTxCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorTxCount, setError] = useState<string | null>(null)

  const fetchTxCount = useCallback(async () => {
    if (!address || !isWalletConnected || !getURL) {
      setTxCount(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const query = encodeURIComponent(`message.sender='${address}'`)
      const res = await fetch(`${getURL}/cosmos/tx/v1beta1/txs?query=${query}&order_by=ORDER_BY_DESC&limit=1`)
      const json = await res.json()
      if (!res.ok) {
        setError(typeof json?.message === 'string' ? json.message : `Error ${res.status}`)
        setTxCount(null)
        return
      }
      const total = Number(json?.total ?? json?.pagination?.total ?? 0)
      setTxCount(Number.isFinite(total) ? total : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setTxCount(null)
    } finally {
      setLoading(false)
    }
  }, [address, isWalletConnected, getURL])

  useEffect(() => {
    fetchTxCount()
  }, [fetchTxCount])

  return { txCount, loading, errorTxCount, refetch: fetchTxCount }
}

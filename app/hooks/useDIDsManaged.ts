'use client'

import { useChain } from '@cosmos-kit/react'
import { useCallback, useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_DID } from '@/config/env'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { ApiErrorResponse } from '@/types/apiErrorResponse'

export function useDIDsManaged() {
  const veranaChain = useVeranaChain()
  const { address, isWalletConnected } = useChain(veranaChain.chain_name)

  const getURL = VERANA_REST_ENDPOINT_DID

  const [didCount, setDidCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorDidCount, setError] = useState<string | null>(null)

  const fetchDidCount = useCallback(async () => {
    if (!address || !isWalletConnected || !getURL) {
      setDidCount(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${getURL}/list?account=${address}`)
      const json = await res.json()
      if (!res.ok) {
        const { error, code } = json as ApiErrorResponse
        setError(`Error ${code}: ${error}`)
        setDidCount(null)
        return
      }
      setDidCount(Array.isArray(json?.dids) ? json.dids.length : 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setDidCount(null)
    } finally {
      setLoading(false)
    }
  }, [address, isWalletConnected, getURL])

  useEffect(() => {
    fetchDidCount()
  }, [fetchDidCount])

  return { didCount, loading, errorDidCount, refetch: fetchDidCount }
}

'use client'

import { useEffect, useState } from 'react'
import { getProtocolParams, type ProtocolParams, protocolParamsInitialState } from '@/lib/protocolParams'

export function useProtocolParams() {
  const [params, setParams] = useState<ProtocolParams>(protocolParamsInitialState)
  const [loading, setLoading] = useState(false)
  const [errorProtocolParams, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const { params: nextParams, errorProtocolParams: error } = await getProtocolParams()
        if (cancelled) return

        setParams(nextParams)
        setError(error)
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          setError(message)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return {
    ...params,
    loading,
    errorProtocolParams,
  }
}

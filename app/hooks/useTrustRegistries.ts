'use client'

import { useChain } from '@cosmos-kit/react'
import { useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_TRUST_REGISTRY } from '@/config/env'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { ApiErrorResponse } from '@/types/apiErrorResponse'
import { TrList } from '@/ui/datatable/columnslist/tr'
import { resolveTranslatable } from '@/ui/dataview/types'

export function useTrustRegistries(all: boolean = false, onlyActive: boolean = true) {
  const veranaChain = useVeranaChain()
  const { address } = useChain(veranaChain.chain_name)

  const getTrURL = VERANA_REST_ENDPOINT_TRUST_REGISTRY

  const [trList, setTrList] = useState<TrList[]>([])
  const [loading, setLoading] = useState(true)
  const [errorTrList, setError] = useState<string | null>(null)

  const fetchTrList = async () => {
    if (!getTrURL || (!all && !address)) {
      setError(resolveTranslatable({ key: 'error.fetch.tr' }, translate) ?? 'Missing address or endpoint URL')
      setLoading(false)
      return
    }

    setError(null)
    try {
      setLoading(true)

      const params = new URLSearchParams()
      params.set('response_max_size', '1024')
      if (!all && address) params.set('participant', address)
      if (onlyActive) params.set('only_active', 'true')
      const urlTrList = `${getTrURL}/list?${params.toString()}`

      const resTrList = await fetch(urlTrList)
      const jsonTrList = await resTrList.json()
      if (!resTrList.ok) {
        const { error, code } = jsonTrList as ApiErrorResponse
        setError(`Error ${code}: ${error}`)
        return
      }
      const trListController: TrList[] = Array.isArray(jsonTrList.trust_registries) ? jsonTrList.trust_registries : []
      setTrList(trListController)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrList()
  }, [address])

  return { trList, loading, errorTrList, refetch: fetchTrList }
}

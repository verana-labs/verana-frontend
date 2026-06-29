'use client'

import { useChain } from '@cosmos-kit/react'
import { useEffect, useState } from 'react'
import { VERANA_REST_ENDPOINT_TRUST_DEPOSIT } from '@/config/env'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { ApiErrorResponse } from '@/types/apiErrorResponse'
import { resolveTranslatable } from '@/ui/dataview/types'

export type TrustDepositAccountData = {
  address: string | null
  balance: string | null
  totalTrustDeposit: string | null
  claimableInterests: string | null
  reclaimable: string | null
  message: string | null
  network: string | null
  slashCount: number | null
}

/**
 * Hook to fetch and format trust deposit account data for the connected wallet.
 * Returns: { data, loading, error, address, isWalletConnected }
 */
export function useTrustDepositAccountData() {
  const veranaChain = useVeranaChain()
  const { address, isWalletConnected, getStargateClient } = useChain(veranaChain.chain_name)

  const getAccountURL = VERANA_REST_ENDPOINT_TRUST_DEPOSIT

  const [accountData, setData] = useState<TrustDepositAccountData>({
    address: null,
    balance: null,
    totalTrustDeposit: null,
    claimableInterests: null,
    reclaimable: null,
    message: null,
    network: null,
    slashCount: null,
  })
  const [loading, setLoading] = useState(false)
  const [errorAccountData, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!address || !isWalletConnected || !getStargateClient || !getAccountURL) {
      setError(resolveTranslatable({ key: 'error.fetch.td.account' }, translate) ?? 'Wallet error or endpoint URL')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    let balance = null
    let totalTrustDeposit = null
    let claimableInterests = null
    let reclaimable = null
    let message = null
    let slashCount: number | null = null
    const network = veranaChain.chain_id

    try {
      const client = await getStargateClient()
      const balInfo = await client.getBalance(address, 'uvna')
      balance = balInfo.amount
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }

    try {
      const resp = await fetch(`${getAccountURL}/get/${address}`)
      const json = await resp.json()
      if (!resp.ok) {
        const { error, code } = json as ApiErrorResponse
        if (code === 404) {
          totalTrustDeposit = '0'
          claimableInterests = '0'
          reclaimable = '0'
          slashCount = 0
        } else {
          setError(`Error ${code}: ${error}`)
          // return;
        }
      }
      if (json.trust_deposit) {
        totalTrustDeposit = json.trust_deposit.amount
        claimableInterests = '0'
        reclaimable = json.trust_deposit.claimable
        slashCount = json.trust_deposit.slash_count ?? 0
      } else if (json.message) {
        message = json.message
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }

    setData({
      address,
      balance,
      totalTrustDeposit,
      claimableInterests,
      reclaimable,
      message,
      network,
      slashCount,
    })
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [address])

  return {
    accountData,
    loading,
    errorAccountData,
    address,
    isWalletConnected,
    refetch: fetchData,
  }
}

'use client'

import { useChain } from '@cosmos-kit/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useVeranaChain } from '@/hooks/useVeranaChain'

export type AccountBalanceData = {
  balance: string | null
  network: string | null
}

const EMPTY_ACCOUNT_DATA: AccountBalanceData = {
  balance: null,
  network: null,
}

export function useAccountBalance() {
  const veranaChain = useVeranaChain()
  const { address, isWalletConnected, getStargateClient } = useChain(veranaChain.chain_name)
  const getStargateClientRef = useRef(getStargateClient)
  const [accountData, setData] = useState<AccountBalanceData>(EMPTY_ACCOUNT_DATA)
  const [loading, setLoading] = useState(false)
  const [errorAccountData, setError] = useState<string | null>(null)

  const requestRef = useRef(0)

  const fetchData = useCallback(async () => {
    const request = ++requestRef.current
    if (!address || !isWalletConnected) {
      setData(EMPTY_ACCOUNT_DATA)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const client = await getStargateClientRef.current()
      const balance = (await client.getBalance(address, 'uvna')).amount
      if (request !== requestRef.current) return
      setData({ balance, network: veranaChain.chain_id })
    } catch (error) {
      if (request !== requestRef.current) return
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      if (request === requestRef.current) setLoading(false)
    }
  }, [address, isWalletConnected, veranaChain.chain_id])

  useEffect(() => {
    getStargateClientRef.current = getStargateClient
  }, [getStargateClient])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  return {
    accountData,
    loading,
    errorAccountData,
    address,
    isWalletConnected,
    refetch: fetchData,
  }
}

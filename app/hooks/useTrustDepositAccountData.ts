'use client'

import { useChain } from '@cosmos-kit/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { VERANA_REST_ENDPOINT_TRUST_DEPOSIT } from '@/config/env'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import type { ApiErrorResponse } from '@/types/apiErrorResponse'

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

type ParsedTrustDeposit = Pick<
  TrustDepositAccountData,
  'totalTrustDeposit' | 'claimableInterests' | 'reclaimable' | 'slashCount'
>

const ZERO_TRUST_DEPOSIT: ParsedTrustDeposit = {
  totalTrustDeposit: '0',
  claimableInterests: '0',
  reclaimable: '0',
  slashCount: 0,
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`Invalid trust deposit response: ${path}`)
  }
  return value as Record<string, unknown>
}

function string(value: unknown, path: string): string {
  if (typeof value !== 'string') throw new Error(`Invalid trust deposit response: ${path}`)
  return value
}

function integer(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Invalid trust deposit response: ${path}`)
  }
  return value
}

function scaledShare(value: unknown, path: string): number {
  // The V4 indexer serializes the 1e18-scaled share as a JSON number, so it is legitimately above MAX_SAFE_INTEGER.
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new Error(`Invalid trust deposit response: ${path}`)
  }
  return value
}

function nullableTimestamp(value: unknown, path: string): string | null {
  if (value === null) return null
  return string(value, path)
}

export function parseTrustDepositResponse(payload: unknown): ParsedTrustDeposit {
  const envelope = record(payload, 'response')
  const trustDeposit = record(envelope.trust_deposit, 'trust_deposit')
  string(trustDeposit.corporation, 'trust_deposit.corporation')
  const deposit = integer(trustDeposit.deposit, 'trust_deposit.deposit')
  scaledShare(trustDeposit.share, 'trust_deposit.share')
  const claimable = integer(trustDeposit.claimable, 'trust_deposit.claimable')
  integer(trustDeposit.slashed_deposit, 'trust_deposit.slashed_deposit')
  integer(trustDeposit.repaid_deposit, 'trust_deposit.repaid_deposit')
  nullableTimestamp(trustDeposit.last_slashed, 'trust_deposit.last_slashed')
  nullableTimestamp(trustDeposit.last_repaid, 'trust_deposit.last_repaid')
  const slashCount = integer(trustDeposit.slash_count, 'trust_deposit.slash_count')
  return {
    totalTrustDeposit: String(deposit),
    claimableInterests: String(claimable),
    reclaimable: String(claimable),
    slashCount,
  }
}

export function trustDepositAccountUrl(endpoint: string, policyAddress: string): string {
  return `${endpoint}/get/${encodeURIComponent(policyAddress)}`
}

const EMPTY_ACCOUNT_DATA: TrustDepositAccountData = {
  address: null,
  balance: null,
  totalTrustDeposit: null,
  claimableInterests: null,
  reclaimable: null,
  message: null,
  network: null,
  slashCount: null,
}

export function useTrustDepositAccountData() {
  const veranaChain = useVeranaChain()
  const { address, isWalletConnected, getStargateClient } = useChain(veranaChain.chain_name)
  const getStargateClientRef = useRef(getStargateClient)
  const { corporation, loading: corporationLoading } = useUserCorporation()
  const corporationPolicyAddress = corporation?.policyAddress
  const [accountData, setData] = useState<TrustDepositAccountData>(EMPTY_ACCOUNT_DATA)
  const [loading, setLoading] = useState(false)
  const [errorAccountData, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!address || !isWalletConnected) {
      setData(EMPTY_ACCOUNT_DATA)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    let balance: string | null = null
    let trustDeposit = ZERO_TRUST_DEPOSIT

    try {
      const client = await getStargateClientRef.current()
      balance = (await client.getBalance(address, 'uvna')).amount

      if (corporationPolicyAddress) {
        if (!VERANA_REST_ENDPOINT_TRUST_DEPOSIT) throw new Error('Missing trust deposit endpoint URL')
        const response = await fetch(
          trustDepositAccountUrl(VERANA_REST_ENDPOINT_TRUST_DEPOSIT, corporationPolicyAddress)
        )
        const json: unknown = await response.json()
        if (response.status === 404) {
          trustDeposit = ZERO_TRUST_DEPOSIT
        } else if (!response.ok) {
          const { error, code } = json as ApiErrorResponse
          throw new Error(`Error ${code}: ${error}`)
        } else {
          trustDeposit = parseTrustDepositResponse(json)
        }
      }

      setData({
        address,
        balance,
        ...trustDeposit,
        message: null,
        network: veranaChain.chain_id,
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
    } finally {
      setLoading(false)
    }
  }, [address, corporationPolicyAddress, isWalletConnected, veranaChain.chain_id])

  useEffect(() => {
    getStargateClientRef.current = getStargateClient
  }, [getStargateClient])

  useEffect(() => {
    if (!corporationLoading) void fetchData()
  }, [corporationLoading, fetchData])

  return {
    accountData,
    loading,
    errorAccountData,
    address,
    isWalletConnected,
    refetch: fetchData,
  }
}

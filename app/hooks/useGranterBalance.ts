'use client'

import { fromBase64, toHex } from '@cosmjs/encoding'
import { QueryBalanceRequest, QueryBalanceResponse } from 'cosmjs-types/cosmos/bank/v1beta1/query'
import { useEffect, useState } from 'react'
import { VERANA_RPC_ENDPOINT } from '@/config/env'
import { veranaDenom } from '@/config/veranaChain.sign.client'
import { FEE_GRANT_LOOKUP_TIMEOUT_MS } from '@/hooks/useFeeGrant'
import { logger } from '@/lib/logger'

export type GranterBalance =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; amount: string }
  | { status: 'failed' }

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function balanceQueryBody(granter: string): string {
  const data = toHex(QueryBalanceRequest.encode({ address: granter, denom: veranaDenom }).finish())
  return JSON.stringify({
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'abci_query',
    params: { path: '/cosmos.bank.v1beta1.Query/Balance', data, prove: false },
  })
}

export function parseBalanceQuery(payload: unknown): string {
  const response = asRecord(asRecord(asRecord(payload)?.result)?.response)
  if (!response || response.code !== 0 || typeof response.value !== 'string')
    throw new Error('granter balance: unexpected abci_query response')
  const amount = QueryBalanceResponse.decode(fromBase64(response.value)).balance?.amount
  if (amount === undefined) throw new Error('granter balance: missing balance in abci_query response')
  return amount
}

export function startGranterBalanceLookup(
  rpcEndpoint: string,
  granter: string,
  onSettled: (balance: GranterBalance) => void
): () => void {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FEE_GRANT_LOOKUP_TIMEOUT_MS)
  let active = true

  function settle(balance: GranterBalance): void {
    if (!active) return
    active = false
    clearTimeout(timeout)
    onSettled(balance)
  }

  fetch(rpcEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: balanceQueryBody(granter),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`granter balance: ${response.status}`)
      settle({ status: 'ready', amount: parseBalanceQuery((await response.json()) as unknown) })
    })
    .catch((error: unknown) => {
      if (!active) return
      logger.error('granter balance', error)
      settle({ status: 'failed' })
    })

  return () => {
    active = false
    clearTimeout(timeout)
    controller.abort()
  }
}

export function useGranterBalance(granter: string | undefined): GranterBalance {
  const [balance, setBalance] = useState<GranterBalance>({ status: 'idle' })

  useEffect(() => {
    if (!granter) {
      setBalance({ status: 'idle' })
      return
    }
    if (!VERANA_RPC_ENDPOINT) {
      setBalance({ status: 'failed' })
      return
    }
    setBalance({ status: 'loading' })
    return startGranterBalanceLookup(VERANA_RPC_ENDPOINT, granter, setBalance)
  }, [granter])

  return balance
}

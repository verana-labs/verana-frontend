'use client'

import { StdSignature } from '@cosmjs/amino'
import { useChain } from '@cosmos-kit/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { VERANA_FAUCET_URL } from '@/config/env'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { indexerValidators } from '@/lib/indexer-json'

export type FaucetErrorCode =
  | 'INVALID_REQUEST'
  | 'INVALID_ACCOUNT'
  | 'AUTH_FAILED'
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'QUOTA_EXCEEDED'
  | 'TX_FAILED'
  | 'NODE_ERROR'
  | 'FAUCET_UNAVAILABLE'
  | 'SIGN_ARBITRARY_UNSUPPORTED'
  | 'WALLET_NOT_CONNECTED'
  | 'NETWORK_ERROR'

const SERVICE_ERROR_CODES: ReadonlySet<string> = new Set([
  'INVALID_REQUEST',
  'INVALID_ACCOUNT',
  'AUTH_FAILED',
  'UNAUTHORIZED',
  'RATE_LIMITED',
  'QUOTA_EXCEEDED',
  'TX_FAILED',
  'NODE_ERROR',
  'FAUCET_UNAVAILABLE',
])

const SIGN_ARBITRARY_UNSUPPORTED_MESSAGE = 'The wallet does not support message signing'

export class FaucetError extends Error {
  readonly code: FaucetErrorCode
  readonly status: number | undefined
  readonly details: Record<string, unknown>

  constructor(code: FaucetErrorCode, message: string, status?: number, details: Record<string, unknown> = {}) {
    super(message)
    this.name = 'FaucetError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export interface FaucetInfo {
  chainId: string
  denom: string
  defaultAmount: string
  maxAmountPerHour: string
  maxAmountPerDay: string
  available: boolean
  unavailableReason: string | undefined
  auth: {
    challengePrefix: string
    nonceTtlSeconds: number
    tokenTtlSeconds: number
  }
}

export interface FaucetChallenge {
  nonce: string
  expiresAt: string
}

export interface FaucetToken {
  token: string
  expiresAt: string
  account: string
}

export type FaucetResult =
  | {
      status: 'confirmed'
      txHash: string
      height: number
      recipient: string
      amount: string
      denom: string
      quota: Record<string, unknown>
    }
  | { status: 'pending'; txHash: string; recipient: string; amount: string; denom: string }

export type FaucetPhase = 'idle' | 'signing' | 'requesting'

export type SignArbitrary = (signer: string, data: string | Uint8Array) => Promise<StdSignature>

const FETCH_TIMEOUT_MS = 10_000
const TOKEN_EXPIRY_MARGIN_MS = 5_000

const { record, string, number, integer, decimalAmount, optionalString } = indexerValidators('faucet')

function boolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`Invalid faucet response: ${path}`)
  return value
}

function faucetUrl(path: string): string {
  if (!VERANA_FAUCET_URL) throw new FaucetError('NETWORK_ERROR', 'Missing faucet URL')
  return `${VERANA_FAUCET_URL}${path}`
}

function serviceError(status: number, payload: unknown): FaucetError {
  const error = (payload as { error?: unknown } | null)?.error
  const { code, message, details } =
    typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : {}
  const text = typeof message === 'string' ? message : `Faucet responded ${status}`
  if (typeof code === 'string' && SERVICE_ERROR_CODES.has(code)) {
    const detailRecord = typeof details === 'object' && details !== null ? (details as Record<string, unknown>) : {}
    return new FaucetError(code as FaucetErrorCode, text, status, detailRecord)
  }
  return new FaucetError('NETWORK_ERROR', text, status)
}

interface FaucetRequest {
  method?: 'GET' | 'POST'
  body?: unknown
  token?: string
}

async function request<T>(
  path: string,
  parse: (status: number, payload: unknown) => T,
  init?: FaucetRequest
): Promise<T> {
  const url = faucetUrl(path)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  const headers: Record<string, string> = {}
  if (init?.body !== undefined) headers['content-type'] = 'application/json'
  if (init?.token) headers.authorization = `Bearer ${init.token}`

  let response: Response
  try {
    response = await fetch(url, {
      method: init?.method ?? 'GET',
      headers,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    })
  } catch (error) {
    throw new FaucetError('NETWORK_ERROR', error instanceof Error ? error.message : String(error))
  } finally {
    clearTimeout(timeoutId)
  }

  let payload: unknown = null
  try {
    payload = await response.json()
  } catch {
    if (response.ok) throw new FaucetError('NETWORK_ERROR', `Faucet responded ${response.status} without JSON`)
  }
  if (!response.ok) throw serviceError(response.status, payload)
  try {
    return parse(response.status, payload)
  } catch (error) {
    throw new FaucetError('NETWORK_ERROR', error instanceof Error ? error.message : String(error), response.status)
  }
}

function parseInfo(_status: number, payload: unknown): FaucetInfo {
  const info = record(payload, 'info')
  const auth = record(info.auth, 'info.auth')
  return {
    chainId: string(info.chainId, 'info.chainId'),
    denom: string(info.denom, 'info.denom'),
    defaultAmount: decimalAmount(info.defaultAmount, 'info.defaultAmount'),
    maxAmountPerHour: decimalAmount(info.maxAmountPerHour, 'info.maxAmountPerHour'),
    maxAmountPerDay: decimalAmount(info.maxAmountPerDay, 'info.maxAmountPerDay'),
    available: boolean(info.available, 'info.available'),
    unavailableReason: optionalString(info.unavailableReason ?? undefined, 'info.unavailableReason'),
    auth: {
      challengePrefix: string(auth.challengePrefix, 'info.auth.challengePrefix'),
      nonceTtlSeconds: number(auth.nonceTtlSeconds, 'info.auth.nonceTtlSeconds'),
      tokenTtlSeconds: number(auth.tokenTtlSeconds, 'info.auth.tokenTtlSeconds'),
    },
  }
}

function parseChallenge(_status: number, payload: unknown): FaucetChallenge {
  const challenge = record(payload, 'challenge')
  return {
    nonce: string(challenge.nonce, 'challenge.nonce'),
    expiresAt: string(challenge.expiresAt, 'challenge.expiresAt'),
  }
}

function parseToken(_status: number, payload: unknown): FaucetToken {
  const token = record(payload, 'token')
  return {
    token: string(token.token, 'token.token'),
    expiresAt: string(token.expiresAt, 'token.expiresAt'),
    account: string(token.account, 'token.account'),
  }
}

function parseFaucetResult(status: number, payload: unknown): FaucetResult {
  const result = record(payload, 'faucet')
  const base = {
    txHash: string(result.txHash, 'faucet.txHash'),
    recipient: string(result.recipient, 'faucet.recipient'),
    amount: decimalAmount(result.amount, 'faucet.amount'),
    denom: string(result.denom, 'faucet.denom'),
  }
  if (status === 202) return { status: 'pending', ...base }
  return {
    status: 'confirmed',
    ...base,
    height: integer(result.height, 'faucet.height'),
    quota: record(result.quota ?? {}, 'faucet.quota'),
  }
}

export function fetchFaucetInfo(): Promise<FaucetInfo> {
  return request('/v1/info', parseInfo)
}

export function requestFaucetChallenge(account: string): Promise<FaucetChallenge> {
  return request('/v1/auth/challenge', parseChallenge, { method: 'POST', body: { account } })
}

export function requestFaucetToken(account: string, nonce: string, signature: StdSignature): Promise<FaucetToken> {
  return request('/v1/auth/token', parseToken, {
    method: 'POST',
    body: { account, pubKey: signature.pub_key.value, signature: signature.signature, nonce },
  })
}

// Per [VFE-PAGE-ACCT-5] the token lives in memory only, so a module variable holds it across panel opens.
let cachedToken: FaucetToken | null = null
let pendingExchange: { account: string; promise: Promise<FaucetToken> } | null = null

export function resetFaucetToken(): void {
  cachedToken = null
  pendingExchange = null
}

function reusableToken(account: string): FaucetToken | null {
  if (!cachedToken || cachedToken.account !== account) return null
  const expiresAt = Date.parse(cachedToken.expiresAt)
  if (!Number.isFinite(expiresAt) || Date.now() + TOKEN_EXPIRY_MARGIN_MS >= expiresAt) return null
  return cachedToken
}

function isSignArbitraryUnsupported(error: unknown): boolean {
  return error instanceof Error && /signArbitrary not implemented/.test(error.message)
}

async function runExchange(
  account: string,
  challengePrefix: string,
  signArbitrary: SignArbitrary,
  onPhase?: (phase: FaucetPhase) => void
): Promise<FaucetToken> {
  const challenge = await requestFaucetChallenge(account)
  onPhase?.('signing')
  let signature: StdSignature
  try {
    signature = await signArbitrary(account, `${challengePrefix}${challenge.nonce}`)
  } catch (error) {
    if (isSignArbitraryUnsupported(error)) {
      throw new FaucetError('SIGN_ARBITRARY_UNSUPPORTED', SIGN_ARBITRARY_UNSUPPORTED_MESSAGE)
    }
    throw error
  }
  onPhase?.('requesting')
  const token = await requestFaucetToken(account, challenge.nonce, signature)
  if (token.account !== account) {
    throw new FaucetError('AUTH_FAILED', `Token issued for ${token.account}, expected ${account}`)
  }
  cachedToken = token
  return token
}

// One exchange at a time per account, so concurrent requests share a single wallet signature.
function exchangeToken(
  account: string,
  challengePrefix: string,
  signArbitrary: SignArbitrary | undefined,
  onPhase?: (phase: FaucetPhase) => void
): Promise<FaucetToken> {
  if (typeof signArbitrary !== 'function') {
    return Promise.reject(new FaucetError('SIGN_ARBITRARY_UNSUPPORTED', SIGN_ARBITRARY_UNSUPPORTED_MESSAGE))
  }
  if (pendingExchange?.account === account) return pendingExchange.promise
  const promise = runExchange(account, challengePrefix, signArbitrary, onPhase).finally(() => {
    if (pendingExchange?.promise === promise) pendingExchange = null
  })
  pendingExchange = { account, promise }
  return promise
}

export interface RequestFaucetFundsOptions {
  account: string
  challengePrefix: string
  signArbitrary: SignArbitrary | undefined
  amount?: string
  onPhase?: (phase: FaucetPhase) => void
}

export async function requestFaucetFunds(options: RequestFaucetFundsOptions): Promise<FaucetResult> {
  const { account, challengePrefix, signArbitrary, amount, onPhase } = options
  if (amount !== undefined && !/^(0|[1-9]\d*)$/.test(amount)) {
    throw new FaucetError('INVALID_REQUEST', `Invalid amount: ${amount}`)
  }
  const body = amount !== undefined ? { amount } : {}
  const send = (token: string) => request('/v1/faucet', parseFaucetResult, { method: 'POST', body, token })

  onPhase?.('requesting')
  let token = reusableToken(account) ?? (await exchangeToken(account, challengePrefix, signArbitrary, onPhase))
  try {
    return await send(token.token)
  } catch (error) {
    // Per [VFE-PAGE-ACCT-5] a 401 starts one new exchange. A second 401 is reported as is.
    if (!(error instanceof FaucetError) || error.status !== 401) throw error
    cachedToken = null
    token = await exchangeToken(account, challengePrefix, signArbitrary, onPhase)
    return await send(token.token)
  }
}

export function isAmountWithinLimit(amount: string, limit: string): boolean {
  try {
    const value = BigInt(amount)
    return value > BigInt(0) && value <= BigInt(limit)
  } catch {
    return false
  }
}

export function useFaucet() {
  const veranaChain = useVeranaChain()
  const { address, isWalletConnected, chainWallet, signArbitrary } = useChain(veranaChain.chain_name)
  const [phase, setPhase] = useState<FaucetPhase>('idle')
  const infoRef = useRef<FaucetInfo | null>(null)

  useEffect(() => {
    if (!isWalletConnected || cachedToken?.account !== address) resetFaucetToken()
  }, [address, isWalletConnected])

  const getInfo = useCallback(async (): Promise<FaucetInfo> => {
    const info = await fetchFaucetInfo()
    infoRef.current = info
    return info
  }, [])

  const requestFunds = useCallback(
    async (amount?: string): Promise<FaucetResult> => {
      if (!address || !isWalletConnected) throw new FaucetError('WALLET_NOT_CONNECTED', 'Wallet is not connected')
      const walletSigner = chainWallet?.client?.signArbitrary
      try {
        const info = infoRef.current ?? (await getInfo())
        return await requestFaucetFunds({
          account: address,
          challengePrefix: info.auth.challengePrefix,
          signArbitrary: typeof walletSigner === 'function' ? signArbitrary : undefined,
          amount,
          onPhase: setPhase,
        })
      } finally {
        setPhase('idle')
      }
    },
    [address, isWalletConnected, chainWallet, signArbitrary, getInfo]
  )

  return { getInfo, requestFunds, phase }
}

import { env } from 'next-runtime-env'

export const readEnv = (key: string): string | undefined => env(key) || process.env[key]

const read = readEnv

export const VERANA_CHAIN_ID = read('NEXT_PUBLIC_VERANA_CHAIN_ID')
export const VERANA_CHAIN_NAME = read('NEXT_PUBLIC_VERANA_CHAIN_NAME')
export const VERANA_RPC_ENDPOINT = read('NEXT_PUBLIC_VERANA_RPC_ENDPOINT')
export const VERANA_REST_ENDPOINT = read('NEXT_PUBLIC_VERANA_REST_ENDPOINT')
export const VERANA_EXPLORER_URL = read('NEXT_PUBLIC_VERANA_EXPLORER_URL')
export const VERANA_VISUALIZER_URL = read('NEXT_PUBLIC_VERANA_VISUALIZER_URL')
export const VERANA_TOPUP_VS = read('NEXT_PUBLIC_VERANA_TOPUP_VS')
export const VERANA_TOPUP_VS_HOST = VERANA_TOPUP_VS ? VERANA_TOPUP_VS.split(':')[2] : ''
export const VERANA_SIGN_DIRECT_MODE = read('NEXT_PUBLIC_VERANA_SIGN_DIRECT_MODE')

export const VERANA_INDEXER_BASE_URL = read('NEXT_PUBLIC_VERANA_INDEXER_BASE_URL')?.replace(/\/$/, '')

const indexerEndpoint = (path: string): string | undefined =>
  VERANA_INDEXER_BASE_URL ? `${VERANA_INDEXER_BASE_URL}/v4/${path}` : undefined

export const VERANA_REST_ENDPOINT_ECOSYSTEM = indexerEndpoint('ecosystem')
export const VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA = indexerEndpoint('credential-schema')
export const VERANA_REST_ENDPOINT_PARTICIPANT = indexerEndpoint('participant')
export const VERANA_REST_ENDPOINT_TRUST_DEPOSIT = indexerEndpoint('trust-deposit')
export const VERANA_REST_ENDPOINT_CORPORATION = indexerEndpoint('corporation')
export const VERANA_REST_ENDPOINT_DELEGATION = indexerEndpoint('delegation')
export const VERANA_REST_ENDPOINT_GROUP = indexerEndpoint('group')
export const VERANA_REST_ENDPOINT_INDEXER = indexerEndpoint('indexer')
export const VERANA_REST_ENDPOINT_STATS = indexerEndpoint('stats')
export const VERANA_REST_ENDPOINT_VERIFIABLE_TRUST = indexerEndpoint('verifiable-trust')

export const VERANA_WEBSOCKET = VERANA_INDEXER_BASE_URL
  ? `${VERANA_INDEXER_BASE_URL.replace(/^http/, 'ws')}/v4/indexer/subscribe`
  : undefined

export const VERANA_CHAIN_PROVIDER_PROJECT_ID = read('NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_PROJECT_ID')
export const VERANA_CHAIN_PROVIDER_RELAY_URL = read('NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_RELAY_URL')
export const VERANA_CHAIN_PROVIDER_METADATA_NAME = read('NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_METADATA_NAME')
export const VERANA_CHAIN_PROVIDER_METADATA_DESCRIPTION = read('NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_METADATA_DESCRIPTION')
export const VERANA_CHAIN_PROVIDER_METADATA_URL = read('NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_METADATA_URL')
export const VERANA_CHAIN_PROVIDER_METADATA_ICONS = read('NEXT_PUBLIC_VERANA_CHAIN_PROVIDER_METADATA_ICONS')

export const SESSION_LIFETIME_SECONDS = read('NEXT_PUBLIC_SESSION_LIFETIME_SECONDS')
export const LOW_BALANCE_WARN_UVNA = read('NEXT_PUBLIC_LOW_BALANCE_WARN_UVNA')
export const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION

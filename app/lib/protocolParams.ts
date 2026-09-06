import {
  VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA,
  VERANA_REST_ENDPOINT_ECOSYSTEM,
  VERANA_REST_ENDPOINT_TRUST_DEPOSIT,
} from '@/config/env'
import { translate } from '@/i18n/dataview'
import { resolveTranslatable } from '@/ui/dataview/types'

export type ProtocolParams = {
  trustUnitPrice: number | null
  ecosystemTrustDeposit: number | null
  trustDepositReclaimBurnRate: number | null
  trustDepositRate: number | null
  trustDepositShareValue: number | null
  userAgentRewardRate: number | null
  walletUserAgentRewardRate: number | null
  credentialSchemaSchemaMaxSize: number | null
  credentialSchemaTrustDeposit: number | null
}

export const protocolParamsInitialState: ProtocolParams = {
  trustUnitPrice: null,
  ecosystemTrustDeposit: null,
  trustDepositReclaimBurnRate: null,
  trustDepositRate: null,
  trustDepositShareValue: null,
  userAgentRewardRate: null,
  walletUserAgentRewardRate: null,
  credentialSchemaSchemaMaxSize: null,
  credentialSchemaTrustDeposit: null,
}

type ParamConfig = {
  key: keyof ProtocolParams
  responseKey: string
  endpoint: string | undefined
  optional?: boolean
  transform?: (value: number) => number
}

const CONFIGS: ParamConfig[] = [
  {
    key: 'trustUnitPrice',
    responseKey: 'trust_unit_price',
    endpoint: VERANA_REST_ENDPOINT_ECOSYSTEM,
  },
  {
    key: 'ecosystemTrustDeposit',
    responseKey: 'ecosystem_trust_deposit',
    endpoint: VERANA_REST_ENDPOINT_ECOSYSTEM,
    optional: true,
  },
  {
    key: 'trustDepositReclaimBurnRate',
    responseKey: 'trust_deposit_reclaim_burn_rate',
    endpoint: VERANA_REST_ENDPOINT_TRUST_DEPOSIT,
    transform: (value) => value * 100,
  },
  {
    key: 'trustDepositRate',
    responseKey: 'trust_deposit_rate',
    endpoint: VERANA_REST_ENDPOINT_TRUST_DEPOSIT,
  },
  {
    key: 'trustDepositShareValue',
    responseKey: 'trust_deposit_share_value',
    endpoint: VERANA_REST_ENDPOINT_TRUST_DEPOSIT,
  },
  {
    key: 'userAgentRewardRate',
    responseKey: 'user_agent_reward_rate',
    endpoint: VERANA_REST_ENDPOINT_TRUST_DEPOSIT,
  },
  {
    key: 'walletUserAgentRewardRate',
    responseKey: 'wallet_user_agent_reward_rate',
    endpoint: VERANA_REST_ENDPOINT_TRUST_DEPOSIT,
  },
  {
    key: 'credentialSchemaSchemaMaxSize',
    responseKey: 'credential_schema_schema_max_size',
    endpoint: VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA,
  },
  {
    key: 'credentialSchemaTrustDeposit',
    responseKey: 'credential_schema_trust_deposit',
    endpoint: VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA,
  },
]

function paramsEnvelope(payload: unknown): Record<string, unknown> {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw new Error('Invalid protocol params response')
  }
  const params = (payload as Record<string, unknown>).params
  if (typeof params !== 'object' || params === null || Array.isArray(params)) {
    throw new Error('Invalid protocol params response: missing params envelope')
  }
  return params as Record<string, unknown>
}

function numeric(value: unknown, key: string): number | null {
  if (value === null) return null
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(parsed)) throw new Error(`Invalid protocol param: ${key}`)
  return parsed
}

export type ProtocolParamsResult = {
  params: ProtocolParams
  errorProtocolParams: string | null
}

export async function getProtocolParams(): Promise<ProtocolParamsResult> {
  const params: ProtocolParams = { ...protocolParamsInitialState }
  const errors: string[] = []
  const responses = new Map<string, Promise<Record<string, unknown>>>()

  function load(base: string): Promise<Record<string, unknown>> {
    const existing = responses.get(base)
    if (existing) return existing
    const request = fetch(`${base}/params`).then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return paramsEnvelope(await response.json())
    })
    responses.set(base, request)
    return request
  }

  await Promise.all(
    CONFIGS.map(async ({ key, responseKey, endpoint, optional, transform }) => {
      if (!endpoint) {
        errors.push(`${resolveTranslatable({ key: 'error.fetch.td.param.missing' }, translate)} ${responseKey}`)
        return
      }
      try {
        const responseParams = await load(endpoint)
        if (!(responseKey in responseParams)) {
          if (optional) return
          throw new Error(`${responseKey} not found in response`)
        }
        const value = numeric(responseParams[responseKey], responseKey)
        params[key] = value === null ? null : (transform?.(value) ?? value)
      } catch (error) {
        errors.push(
          `${resolveTranslatable({ key: 'error.fetch.td.param.failed' }, translate)} ${responseKey}: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      }
    })
  )

  return { params, errorProtocolParams: errors.length > 0 ? errors.join(' | ') : null }
}

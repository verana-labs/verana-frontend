import { VERANA_REST_ENDPOINT_CREDENTIAL_SCHEMA, VERANA_REST_ENDPOINT_TRUST_DEPOSIT } from '@/config/env'
import { translate } from '@/i18n/dataview'
import { resolveTranslatable } from '@/ui/dataview/types'

export type ProtocolParams = {
  trustDepositRate: number | null
  credentialSchemaSchemaMaxSize: number | null
}

export const protocolParamsInitialState: ProtocolParams = {
  trustDepositRate: null,
  credentialSchemaSchemaMaxSize: null,
}

type ParamConfig = {
  key: keyof ProtocolParams
  responseKey: string
  endpoint: string | undefined
}

const CONFIGS: ParamConfig[] = [
  {
    key: 'trustDepositRate',
    responseKey: 'trust_deposit_rate',
    endpoint: VERANA_REST_ENDPOINT_TRUST_DEPOSIT,
  },
  {
    key: 'credentialSchemaSchemaMaxSize',
    responseKey: 'credential_schema_schema_max_size',
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

  async function load(base: string): Promise<Record<string, unknown>> {
    const response = await fetch(`${base}/params`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return paramsEnvelope(await response.json())
  }

  await Promise.all(
    CONFIGS.map(async ({ key, responseKey, endpoint }) => {
      if (!endpoint) {
        errors.push(`${resolveTranslatable({ key: 'error.fetch.td.param.missing' }, translate)} ${responseKey}`)
        return
      }
      try {
        const responseParams = await load(endpoint)
        if (!(responseKey in responseParams)) throw new Error(`${responseKey} not found in response`)
        params[key] = numeric(responseParams[responseKey], responseKey)
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

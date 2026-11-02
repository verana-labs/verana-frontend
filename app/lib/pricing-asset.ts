import { PricingAssetType, pricingAssetTypeToJSON } from '@verana-labs/verana-types/codec/verana/cs/v1/types'
import { veranaDenom } from '@/config/veranaChain.sign.client'
import { formatVNAFromUVNA } from '@/util/util'

export type SchemaPricing = {
  pricingAssetType: string | number | null
  pricingAsset: string | null
}

export const NATIVE_PRICING = { pricingAssetType: PricingAssetType.COIN, pricingAsset: veranaDenom } as const

export const FEE_BEARING_PARTICIPANT_ACTIONS: ReadonlySet<string> = new Set([
  'RenewParticipantOP',
  'SetParticipantOPtoValidated',
])

export function isNativePricing(schema: SchemaPricing): boolean {
  const coin = schema.pricingAssetType === 'COIN' || schema.pricingAssetType === NATIVE_PRICING.pricingAssetType
  return coin && schema.pricingAsset === NATIVE_PRICING.pricingAsset
}

export type FeeGateState = 'allowed' | 'unsupported' | 'unknown'

export function feeGateState(schema: SchemaPricing | null | undefined): FeeGateState {
  if (!schema) return 'unknown'
  return isNativePricing(schema) ? 'allowed' : 'unsupported'
}

export function pricingAssetLabel(schema: SchemaPricing): string {
  const type = schema.pricingAssetType
  const name = typeof type === 'number' ? pricingAssetTypeToJSON(type) : (type ?? 'UNKNOWN')
  return schema.pricingAsset ? `${name} (${schema.pricingAsset})` : name
}

export function formatSchemaAmount(value: string | number, schema: SchemaPricing | null | undefined): string {
  if (schema && isNativePricing(schema)) return formatVNAFromUVNA(String(value))
  return schema ? `${value} ${pricingAssetLabel(schema)}` : String(value)
}

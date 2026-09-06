import { PricingAssetType, pricingAssetTypeToJSON } from '@verana-labs/verana-types/codec/verana/cs/v1/types'
import { veranaDenom } from '@/config/veranaChain.sign.client'

export type SchemaPricing = {
  pricingAssetType: string | number | null
  pricingAsset: string | null
}

export const FEE_BEARING_PARTICIPANT_ACTIONS: ReadonlySet<string> = new Set([
  'RenewParticipantOP',
  'SetParticipantOPtoValidated',
])

export function isNativePricing(schema: SchemaPricing): boolean {
  const coin = schema.pricingAssetType === 'COIN' || schema.pricingAssetType === PricingAssetType.COIN
  return coin && schema.pricingAsset === veranaDenom
}

export function pricingAssetLabel(schema: SchemaPricing): string {
  const type = schema.pricingAssetType
  const name = typeof type === 'number' ? pricingAssetTypeToJSON(type) : (type ?? 'UNKNOWN')
  return schema.pricingAsset ? `${name} (${schema.pricingAsset})` : name
}

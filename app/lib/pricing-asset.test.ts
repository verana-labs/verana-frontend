import { PricingAssetType } from '@verana-labs/verana-types/codec/verana/cs/v1/types'
import { describe, expect, it } from 'vitest'
import { feeGateState, isNativePricing, pricingAssetLabel } from './pricing-asset'

describe('isNativePricing', () => {
  it('accepts the native coin as the indexer and the codec spell it', () => {
    expect(isNativePricing({ pricingAssetType: 'COIN', pricingAsset: 'uvna' })).toBe(true)
    expect(isNativePricing({ pricingAssetType: PricingAssetType.COIN, pricingAsset: 'uvna' })).toBe(true)
  })

  it('refuses trust units, fiat and non-native coins', () => {
    expect(isNativePricing({ pricingAssetType: 'TU', pricingAsset: 'tu' })).toBe(false)
    expect(isNativePricing({ pricingAssetType: 'FIAT', pricingAsset: 'USD' })).toBe(false)
    expect(isNativePricing({ pricingAssetType: 'COIN', pricingAsset: 'ibc/27394FB092D2ECCD56123C74F36E4C1F' })).toBe(
      false
    )
    expect(isNativePricing({ pricingAssetType: 'COIN', pricingAsset: 'VNA' })).toBe(false)
  })

  it('refuses an unset pricing', () => {
    expect(isNativePricing({ pricingAssetType: null, pricingAsset: null })).toBe(false)
    expect(isNativePricing({ pricingAssetType: 'COIN', pricingAsset: null })).toBe(false)
  })
})

describe('pricingAssetLabel', () => {
  it('names the asset type with its identifier', () => {
    expect(pricingAssetLabel({ pricingAssetType: 'TU', pricingAsset: 'tu' })).toBe('TU (tu)')
    expect(pricingAssetLabel({ pricingAssetType: PricingAssetType.FIAT, pricingAsset: 'USD' })).toBe('FIAT (USD)')
    expect(pricingAssetLabel({ pricingAssetType: 'FIAT', pricingAsset: null })).toBe('FIAT')
    expect(pricingAssetLabel({ pricingAssetType: null, pricingAsset: null })).toBe('UNKNOWN')
  })
})

describe('feeGateState', () => {
  it('allows only a schema it can positively read as natively priced', () => {
    expect(feeGateState({ pricingAssetType: 'COIN', pricingAsset: 'uvna' })).toBe('allowed')
    expect(feeGateState({ pricingAssetType: PricingAssetType.COIN, pricingAsset: 'uvna' })).toBe('allowed')
  })

  it('blocks a schema priced in another asset', () => {
    expect(feeGateState({ pricingAssetType: 'TU', pricingAsset: 'tu' })).toBe('unsupported')
    expect(feeGateState({ pricingAssetType: 'COIN', pricingAsset: 'uatom' })).toBe('unsupported')
  })

  it('blocks rather than allows when the schema could not be read', () => {
    expect(feeGateState(null)).toBe('unknown')
    expect(feeGateState(undefined)).toBe('unknown')
  })
})

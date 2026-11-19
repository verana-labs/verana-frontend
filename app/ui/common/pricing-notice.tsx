'use client'

import { TriangleAlertIcon } from 'lucide-react'
import { translate } from '@/i18n/dataview'
import { feeGateState, pricingAssetLabel, type SchemaPricing } from '@/lib/pricing-asset'
import { cn } from '@/lib/utils'
import { resolveTranslatable } from '@/ui/dataview/types'

export function unsupportedPricingReason(): string {
  return resolveTranslatable({ key: 'pricing.unsupported.short' }, translate) ?? 'Pricing asset not yet supported'
}

export function unknownPricingReason(): string {
  return resolveTranslatable({ key: 'pricing.unknown.short' }, translate) ?? 'Schema pricing could not be read'
}

export function feeBlockedReasonFor(schema: SchemaPricing | null | undefined): string | undefined {
  const state = feeGateState(schema)
  if (state === 'allowed') return undefined
  return state === 'unsupported' ? unsupportedPricingReason() : unknownPricingReason()
}

export function PricingNotice({ schema, className }: { schema: SchemaPricing | null; className?: string }) {
  const text = schema
    ? (resolveTranslatable(
        { key: 'pricing.unsupported.notice', values: { asset: pricingAssetLabel(schema) } },
        translate
      ) ?? unsupportedPricingReason())
    : unknownPricingReason()
  return (
    <div
      role="note"
      className={cn(
        'flex gap-2.5 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground dark:border-warning/40',
        className
      )}
    >
      <TriangleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
      <p>{text}</p>
    </div>
  )
}

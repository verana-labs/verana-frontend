'use client'

import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import clsx from 'clsx'
import { translate } from '@/i18n/dataview'
import { pricingAssetLabel, type SchemaPricing } from '@/lib/pricing-asset'
import { resolveTranslatable } from '@/ui/dataview/types'

export function unsupportedPricingReason(): string {
  return resolveTranslatable({ key: 'pricing.unsupported.short' }, translate) ?? 'Pricing asset not yet supported'
}

export function PricingNotice({ schema, className }: { schema: SchemaPricing; className?: string }) {
  const text =
    resolveTranslatable(
      { key: 'pricing.unsupported.notice', values: { asset: pricingAssetLabel(schema) } },
      translate
    ) ?? unsupportedPricingReason()
  return (
    <div
      role="note"
      className={clsx(
        'border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 rounded-r-lg p-4 flex gap-3',
        className
      )}
    >
      <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-500 mt-0.5" />
      <p className="text-sm text-amber-900 dark:text-amber-100">{text}</p>
    </div>
  )
}

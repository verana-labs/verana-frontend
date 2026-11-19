'use client'

import { translate } from '@/i18n/dataview'

export function ThresholdHint({ threshold, totalWeight }: { threshold: number; totalWeight: number }) {
  if (!Number.isFinite(totalWeight)) return null
  const unanimity = totalWeight > 0 && threshold >= totalWeight
  return (
    <p className="mt-2 text-sm text-muted-foreground">
      {translate('corporation.threshold.total', { total: totalWeight })}
      {unanimity ? (
        <span className="text-warning">{` ${translate('corporation.threshold.unanimity', { threshold })}`}</span>
      ) : null}
    </p>
  )
}

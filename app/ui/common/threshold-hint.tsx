'use client'

import { translate } from '@/i18n/dataview'

export function ThresholdHint({ threshold, totalWeight }: { threshold: number; totalWeight: number }) {
  if (!Number.isFinite(totalWeight)) return null
  const unanimity = totalWeight > 0 && threshold >= totalWeight
  return (
    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
      {translate('corporation.threshold.total', { total: totalWeight })}
      {unanimity ? ` ${translate('corporation.threshold.unanimity', { threshold })}` : ''}
    </p>
  )
}

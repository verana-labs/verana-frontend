'use client'

import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'

export function CorporationDiscoveryFailure() {
  const { error, loading, refetch } = useUserCorporation()
  if (!error) return null
  return (
    <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 dark:bg-red-900/30">
      <p className="text-sm font-medium text-red-800 dark:text-red-200">{translate('corporation.chooser.failed')}</p>
      <p className="mt-1 break-all text-xs text-red-700 dark:text-red-300">{error}</p>
      <button
        type="button"
        disabled={loading}
        onClick={() => void refetch()}
        className="mt-2 rounded-lg border border-red-300 px-2 py-1 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50 dark:border-red-700 dark:text-red-200 dark:hover:bg-red-900/50"
      >
        {translate('corporation.chooser.retry')}
      </button>
    </div>
  )
}

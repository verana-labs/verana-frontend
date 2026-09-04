'use client'

import { translate } from '@/i18n/dataview'
import type { UserCorporation } from '@/lib/corporation-discovery'
import { ChooserShell } from '@/ui/common/chooser-shell'
import { type I18nValues, resolveTranslatable } from '@/ui/dataview/types'
import { shortenMiddle } from '@/util/util'

function t(key: string, values?: I18nValues): string {
  return resolveTranslatable({ key, values }, translate) ?? key
}

export function CorporationLostModal({
  corporation,
  canChoose,
  onDismiss,
}: {
  corporation: UserCorporation
  canChoose: boolean
  onDismiss: () => void
}) {
  return (
    <ChooserShell
      title={t('corporation.lost.title', { corporation: shortenMiddle(corporation.did, 34) })}
      description={t('corporation.lost.desc')}
    >
      <button
        type="button"
        onClick={onDismiss}
        className="w-full px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium"
      >
        {t(canChoose ? 'corporation.lost.choose' : 'corporation.lost.guest')}
      </button>
    </ChooserShell>
  )
}

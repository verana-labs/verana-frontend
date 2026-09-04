'use client'

import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { type I18nValues, resolveTranslatable } from '@/ui/dataview/types'
import { shortenMiddle } from '@/util/util'

function t(key: string, values?: I18nValues): string {
  return resolveTranslatable({ key, values }, translate) ?? key
}

function keepOpen() {}

export function CorporationLostModal() {
  const { lost, memberships, dismissLost } = useUserCorporation()
  if (!lost) return null

  return (
    <Dialog open onClose={keepOpen} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-xl border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-surface p-6 shadow-xl">
          <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {t('corporation.lost.title', { corporation: shortenMiddle(lost.did, 34) })}
          </DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('corporation.lost.desc')}</p>
          <button
            type="button"
            onClick={dismissLost}
            className="w-full px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium"
          >
            {t(memberships.length > 0 ? 'corporation.lost.choose' : 'corporation.lost.guest')}
          </button>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

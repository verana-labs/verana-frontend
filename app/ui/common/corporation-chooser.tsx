'use client'

import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { CorporationMembershipRow } from '@/ui/common/corporation-membership-row'

function keepOpen() {}

export function CorporationChooser() {
  const { memberships, needsSelection, attention, setActingCorporation } = useUserCorporation()

  return (
    <Dialog open={needsSelection} onClose={keepOpen} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-xl border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-surface p-6 shadow-xl">
          <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            {translate('corporation.chooser.title')}
          </DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{translate('corporation.chooser.desc')}</p>
          <div className="space-y-2">
            {memberships.map((membership) => (
              <button
                key={membership.corporation.id}
                type="button"
                onClick={() => setActingCorporation(membership.corporation.id)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left text-sm border border-neutral-20 dark:border-neutral-70 hover:bg-surface-muted dark:hover:bg-neutral-70/30"
              >
                <CorporationMembershipRow
                  membership={membership}
                  isActing={false}
                  attention={attention[membership.corporation.id]}
                />
              </button>
            ))}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

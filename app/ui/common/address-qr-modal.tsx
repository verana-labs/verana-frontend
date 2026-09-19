'use client'

import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { QRCode } from '@interchain-ui/react'
import { translate } from '@/i18n/dataview'

export function AddressQrModal({ address, onClose }: { address: string; onClose: () => void }) {
  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white dark:bg-surface rounded-xl max-w-md w-full shadow-2xl">
          <div className="px-6 py-4 border-b border-neutral-20 dark:border-neutral-70 flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {translate('modalqrcode.title')}
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label={translate('modalqrcode.close')}
              className="p-2 text-neutral-70 hover:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-surface-muted dark:hover:bg-surface-muted transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
          <div className="p-6 flex flex-col items-center">
            <div className="w-64 h-64 bg-white p-4 rounded-lg border-2 border-neutral-20 dark:border-neutral-70 mb-4">
              <QRCode value={address} size={224} title={translate('modalqrcode.title')} className="w-full h-full" />
            </div>
            <p className="text-sm text-center text-neutral-70 mb-4">{translate('modalqrcode.msg')}</p>
            <div className="w-full p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs font-mono text-gray-900 dark:text-white text-center break-all">{address}</p>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

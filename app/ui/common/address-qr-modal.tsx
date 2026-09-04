'use client'

import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { translate } from '@/i18n/dataview'
import { resolveTranslatable } from '@/ui/dataview/types'

export function AddressQrModal({ address, onClose }: { address: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-surface rounded-xl max-w-md w-full shadow-2xl">
        <div className="px-6 py-4 border-b border-neutral-20 dark:border-neutral-70 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {resolveTranslatable({ key: 'modalqrcode.title' }, translate)}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-70 hover:text-gray-500 dark:hover:text-gray-300 rounded-lg hover:bg-surface-muted dark:hover:bg-surface-muted transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <div className="p-6">
          <div className="flex flex-col items-center">
            <div className="w-64 h-64 bg-white p-4 rounded-lg border-2 border-neutral-20 dark:border-neutral-70 mb-4">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${address}`}
                alt="Account QR Code"
                className="w-full h-full"
              />
            </div>
            <p className="text-sm text-center text-neutral-70 dark:text-neutral-70 mb-4">
              {resolveTranslatable({ key: 'modalqrcode.msg' }, translate)}
            </p>
            <div className="w-full p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs font-mono text-gray-900 dark:text-white text-center break-all">{address}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

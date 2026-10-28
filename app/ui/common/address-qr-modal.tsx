'use client'

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { QRCode } from '@interchain-ui/react'
import { XIcon } from 'lucide-react'
import { translate } from '@/i18n/dataview'
import { Button } from '@/ui/shadcn/button'

export function AddressQrModal({ address, onClose }: { address: string; onClose: () => void }) {
  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/20 duration-100 supports-backdrop-filter:backdrop-blur-xs data-closed:opacity-0 dark:bg-black/50"
      />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className="relative w-full max-w-md rounded-xl bg-popover p-4 text-sm text-popover-foreground shadow-overlay ring-1 ring-foreground/10 duration-100 data-closed:scale-95 data-closed:opacity-0 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4 pr-8">
              <DialogTitle className="text-lg font-semibold leading-snug text-foreground">
                {translate('modalqrcode.title')}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                aria-label={translate('modalqrcode.close')}
                className="absolute top-3 right-3 text-muted-foreground sm:top-4 sm:right-4"
              >
                <XIcon />
              </Button>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">{translate('modalqrcode.msg')}</p>
            <div className="mx-auto mt-5 size-64 rounded-lg bg-white p-4 ring-1 ring-foreground/10">
              <QRCode value={address} size={224} title={translate('modalqrcode.title')} className="h-full w-full" />
            </div>
            <div className="mt-5 rounded-lg bg-muted px-3 py-2.5 dark:bg-foreground/5">
              <p className="break-all text-center font-mono text-xs text-foreground">{address}</p>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}

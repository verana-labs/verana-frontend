'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { XIcon } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { translate } from '@/i18n/dataview'
import { DURATION, EASE } from '@/ui/motion/tokens'
import { Button } from '@/ui/shadcn/button'

type DetailSheetProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

const BACKGROUND = '[data-slot="sidebar-inset"], [data-shell="sidebar"], [data-shell="tab-bar"]'

function stackedModalOpen(): boolean {
  return document.querySelector('[data-modal-action]:not(.hidden)') !== null
}

export function DetailSheet({ open, title, onClose, children }: DetailSheetProps) {
  const reduced = useReducedMotion()
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    panelRef.current?.focus({ preventScroll: true })
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const background = Array.from(document.querySelectorAll<HTMLElement>(BACKGROUND)).filter(
      (element) => !element.inert
    )
    for (const element of background) element.inert = true
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || event.defaultPrevented || stackedModalOpen()) return
      event.preventDefault()
      onCloseRef.current()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      for (const element of background) element.inert = false
      if (opener?.isConnected) opener.focus({ preventScroll: true })
    }
  }, [open])

  const hidden = reduced ? { opacity: 0 } : { x: '100%' }
  const shown = reduced ? { opacity: 1 } : { x: 0 }

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            key="detail-sheet-backdrop"
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/20 supports-backdrop-filter:backdrop-blur-xs dark:bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: DURATION.fast, ease: EASE.exit } }}
            transition={{ duration: DURATION.base, ease: EASE.standard }}
            onClick={onClose}
          />
          <motion.div
            key="detail-sheet-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            data-slot="detail-sheet"
            className="fixed inset-y-0 end-0 z-40 flex w-full max-w-md flex-col bg-background shadow-overlay outline-none"
            initial={hidden}
            animate={shown}
            exit={{ ...hidden, transition: { duration: DURATION.base, ease: EASE.exit } }}
            transition={{ duration: DURATION.slow, ease: EASE.emphasized }}
          >
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <p id={titleId} className="min-w-0 flex-1 truncate text-sm font-semibold">
                {title}
              </p>
              <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={translate('common.close')}>
                <XIcon />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
              {children}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>,
    document.body
  )
}

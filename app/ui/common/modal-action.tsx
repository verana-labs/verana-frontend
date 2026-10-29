import { XIcon } from 'lucide-react'
import React, { useEffect, useRef } from 'react'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/shadcn/button'
import { resolveTranslatable } from '../dataview/types'

interface ModalActionProps {
  titleKey: string
  onClose: () => void
  children: React.ReactNode
  isActive: boolean
  classModal?: string
  modalHidden?: boolean
}

const PANEL_CLASS =
  'relative mx-auto my-4 w-[calc(100%-2rem)] max-w-2xl rounded-xl bg-popover p-4 text-sm text-popover-foreground shadow-overlay ring-1 ring-foreground/10 outline-none animate-in fade-in-0 zoom-in-95 duration-100 sm:my-16 sm:p-6'

const FOCUSABLE =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

const FOREIGN_LAYER =
  '[data-radix-popper-content-wrapper], [role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [data-sonner-toaster]'

function isTopmostModal(overlay: HTMLElement | null) {
  const shown = document.querySelectorAll('[data-modal-action]:not(.hidden)')
  return overlay !== null && shown[shown.length - 1] === overlay
}

export function trapTabKey(event: React.KeyboardEvent<HTMLElement>) {
  const panel = event.currentTarget
  if (event.key !== 'Tab' || !panel.contains(event.target as Node)) return
  const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => element.getClientRects().length > 0
  )
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = document.activeElement
  if (!first || !last) {
    event.preventDefault()
    panel.focus()
  } else if (event.shiftKey && (active === first || active === panel)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

export function restoreModalFocus(opener: HTMLElement | null) {
  if (opener?.isConnected && opener !== document.body && !opener.matches(':disabled')) {
    opener.focus({ preventScroll: true })
    return
  }
  const panels = document.querySelectorAll<HTMLElement>('[data-modal-action]:not(.hidden) [data-modal-action-panel]')
  panels[panels.length - 1]?.focus({ preventScroll: true })
}

export const ModalAction: React.FC<ModalActionProps> = ({
  titleKey,
  onClose,
  children,
  isActive,
  classModal,
  modalHidden,
}) => {
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isActive || modalHidden) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || event.defaultPrevented || !isTopmostModal(overlayRef.current)) return
      event.preventDefault()
      onCloseRef.current()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isActive, modalHidden])

  useEffect(() => {
    if (!isActive || modalHidden) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (!panelRef.current?.contains(opener)) panelRef.current?.focus({ preventScroll: true })
    function onFocusIn(event: FocusEvent) {
      const overlay = overlayRef.current
      const target = event.target
      if (!(target instanceof Element) || overlay?.contains(target) || !isTopmostModal(overlay)) return
      if (target.closest(FOREIGN_LAYER)) return
      panelRef.current?.focus({ preventScroll: true })
    }
    document.addEventListener('focusin', onFocusIn)
    return () => {
      document.removeEventListener('focusin', onFocusIn)
      restoreModalFocus(opener)
    }
  }, [isActive, modalHidden])

  if (!isActive) return null
  return (
    <div
      ref={overlayRef}
      data-modal-action
      className={`${modalHidden ? 'hidden' : ''} fixed inset-0 z-50 h-full w-full overflow-y-auto overscroll-contain`}
    >
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/20 animate-in fade-in-0 duration-100 supports-backdrop-filter:backdrop-blur-xs dark:bg-black/50"
      />
      <div
        ref={panelRef}
        data-modal-action-panel
        tabIndex={-1}
        onKeyDown={trapTabKey}
        className={cn(PANEL_CLASS, classModal)}
      >
        <div className="mb-4 flex items-start justify-between gap-4 pr-8">
          <h3 className="text-lg font-semibold leading-snug text-foreground">
            {resolveTranslatable({ key: titleKey }, translate)}
          </h3>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="absolute top-3 right-3 text-muted-foreground sm:top-4 sm:right-4"
            aria-label={translate('common.close')}
          >
            <XIcon />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}

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
  'relative w-full max-w-2xl rounded-2xl bg-popover p-4 text-sm text-popover-foreground shadow-overlay ring-1 ring-foreground/10 outline-none animate-in fade-in-0 zoom-in-[0.97] slide-in-from-bottom-2 duration-(--duration-slow) ease-standard motion-reduce:animate-none sm:p-6'

function isTopmostModal(overlay: HTMLElement | null) {
  const shown = document.querySelectorAll('[data-modal-action]:not(.hidden)')
  return overlay !== null && shown[shown.length - 1] === overlay
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

  if (!isActive) return null
  return (
    <div
      ref={overlayRef}
      data-modal-action
      className={`${modalHidden ? 'hidden' : ''} fixed inset-0 z-50 h-full w-full overflow-y-auto overscroll-contain`}
    >
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-black/25 animate-in fade-in-0 duration-(--duration-base) supports-backdrop-filter:backdrop-blur-sm motion-reduce:animate-none dark:bg-black/55"
      />
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div className={cn(PANEL_CLASS, classModal)}>
          <div className="mb-5 flex items-start justify-between gap-4 pe-8">
            <h3 className="text-lg leading-snug font-semibold tracking-[-0.015em] text-pretty text-foreground [overflow-wrap:anywhere]">
              {resolveTranslatable({ key: titleKey }, translate)}
            </h3>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="absolute end-3 top-3 text-muted-foreground sm:end-4 sm:top-4"
              aria-label={translate('common.close')}
            >
              <XIcon />
            </Button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

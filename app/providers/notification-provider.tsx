'use client'

import { ExternalLinkIcon } from 'lucide-react'
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { type ExternalToast, toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import { translate } from '@/i18n/dataview'
import { Toaster } from '@/ui/shadcn/sonner'
import { Spinner } from '@/ui/shadcn/spinner'

type NotificationType = 'success' | 'error' | 'info' | 'inProgress'

// Per [VFE-TX-UX-1] a notification can link a transaction hash to the explorer.
export type NotificationLink = {
  href: string
  label: string
}

type NotificationContextType = {
  // Notify shows a notification and returns a promise that resolves when the notification is closed
  notify: (message: string, type?: NotificationType, title?: string, link?: NotificationLink) => Promise<void>
}

type ShownToast = {
  id: string
  type: NotificationType
  settle: () => void
  abandon: () => void
}

const DURATION: Record<NotificationType, number> = {
  success: 5000,
  error: 10000,
  info: Number.POSITIVE_INFINITY,
  inProgress: Number.POSITIVE_INFINITY,
}

const TYPE_CLASS: Record<NotificationType, string> = {
  success: 'notify-success',
  error: 'notify-error',
  info: 'notify-info',
  inProgress: 'notify-in-progress',
}

const PHONE_OFFSET = { bottom: 'calc(var(--tab-bar-height) + 0.5rem)', right: 16, left: 16 }
const DESKTOP_OFFSET = { bottom: 24, right: 24 }

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotification must be used within a NotificationProvider')
  return context
}

function NotificationBody({ message, link }: { message?: string; link?: NotificationLink }) {
  return (
    <>
      {message ? <span className="block text-pretty [overflow-wrap:anywhere]">{message}</span> : null}
      {link ? (
        <a
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="notify-msg-link mt-1.5 inline-flex max-w-full items-center gap-1 rounded-sm font-mono text-xs text-primary underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="[overflow-wrap:anywhere]">{link.label}</span>
          <ExternalLinkIcon aria-hidden="true" className="size-3 shrink-0" />
        </a>
      ) : null}
    </>
  )
}

function showToast(entry: ShownToast, message: string, title?: string, link?: NotificationLink) {
  const { id, type, settle } = entry
  const options: ExternalToast = {
    id,
    description: title || link ? <NotificationBody message={title ? message : undefined} link={link} /> : undefined,
    duration: DURATION[type],
    className: `notify-notification ${TYPE_CLASS[type]}`,
    icon: undefined,
    onDismiss: settle,
    onAutoClose: settle,
  }
  const text = title || message
  const heading =
    type === 'error' ? (
      <span role="alert" data-toast-alert className="[overflow-wrap:anywhere]">
        {text}
      </span>
    ) : (
      <span className="[overflow-wrap:anywhere]">{text}</span>
    )
  if (type === 'success') toast.success(heading, options)
  else if (type === 'error') toast.error(heading, options)
  else if (type === 'info') toast.info(heading, options)
  else toast(heading, { ...options, icon: <Spinner aria-hidden="true" className="text-info" /> })
}

function updatesInPlace(previous: ShownToast, type: NotificationType): boolean {
  if (Number.isFinite(DURATION[previous.type])) return false
  return type !== 'inProgress' || previous.type === 'inProgress'
}

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const shown = useRef<ShownToast | null>(null)
  const sequence = useRef(0)
  const disposed = useRef(false)

  useEffect(() => {
    disposed.current = false
    return () => {
      disposed.current = true
      const current = shown.current
      if (!current) return
      current.abandon()
      shown.current = null
      toast.dismiss(current.id)
    }
  }, [])

  const notify = useCallback(
    (message: string, type: NotificationType = 'success', title?: string, link?: NotificationLink) => {
      // sonner's store outlives this provider, so a stale caller must not show a toast or continue after notify
      if (disposed.current) return new Promise<void>(() => {})
      const previous = shown.current
      previous?.settle()
      let id: string
      // sonner only resets remainingTime when duration changes, so a paused finite toast would resume short
      if (previous && updatesInPlace(previous, type)) {
        id = previous.id
      } else {
        if (previous) toast.dismiss(previous.id)
        sequence.current += 1
        id = `notification-${sequence.current}`
      }
      return new Promise<void>((resolve) => {
        let done = false
        let timer: ReturnType<typeof setTimeout> | undefined
        const entry: ShownToast = {
          id,
          type,
          settle: () => {
            if (done) return
            done = true
            clearTimeout(timer)
            if (shown.current === entry) shown.current = null
            resolve()
          },
          abandon: () => {
            done = true
            clearTimeout(timer)
          },
        }
        shown.current = entry
        showToast(entry, message, title, link)
        // sonner pauses its own timer on hover and hidden tabs, and callers await this before releasing the action
        if (Number.isFinite(DURATION[type])) {
          timer = setTimeout(() => {
            toast.dismiss(id)
            entry.settle()
          }, DURATION[type])
        }
      })
    },
    []
  )
  const contextValue = useMemo(() => ({ notify }), [notify])
  const isPhone = useIsMobile()

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <Toaster
        position={isPhone ? 'bottom-center' : 'bottom-right'}
        closeButton
        hotkey={[]}
        swipeDirections={[]}
        offset={isPhone ? PHONE_OFFSET : DESKTOP_OFFSET}
        mobileOffset={PHONE_OFFSET}
        containerAriaLabel={translate('notification.region')}
        toastOptions={{ closeButtonAriaLabel: translate('common.close') }}
      />
    </NotificationContext.Provider>
  )
}

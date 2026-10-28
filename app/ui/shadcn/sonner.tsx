'use client'

import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ toastOptions, ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-success" />,
        info: <InfoIcon className="size-4 text-info" />,
        warning: <TriangleAlertIcon className="size-4 text-warning" />,
        error: <OctagonXIcon className="size-4 text-destructive" />,
        loading: <Loader2Icon className="size-4 animate-spin text-info" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      {...props}
      toastOptions={{
        ...toastOptions,
        classNames: {
          toast: 'cn-toast items-start! gap-3! shadow-overlay!',
          success: 'border-success/30!',
          error: 'border-destructive/40!',
          icon: 'mt-0.5!',
          title: 'text-sm! font-medium! leading-5!',
          description: 'text-sm! leading-5! text-muted-foreground!',
          closeButton:
            'border-border! bg-popover! text-muted-foreground! hover:text-foreground! focus-visible:ring-3! focus-visible:ring-ring/50!',
          ...toastOptions?.classNames,
        },
      }}
    />
  )
}

export { Toaster }

'use client'

import { useChain } from '@cosmos-kit/react'
import { DownloadIcon, RotateCwIcon, WalletIcon } from 'lucide-react'
import { type ComponentProps, type ReactNode, useEffect, useRef } from 'react'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/shadcn/button'
import { Spinner } from '@/ui/shadcn/spinner'

type WalletProps = {
  autoConnect?: boolean
  className?: string
  size?: ComponentProps<typeof Button>['size']
  variant?: ComponentProps<typeof Button>['variant']
}

type WalletStatus = 'Disconnected' | 'Error' | 'Connecting' | 'Connected' | 'NotExist' | 'Rejected'

export default function Wallet({ autoConnect = false, className, size = 'default', variant = 'default' }: WalletProps) {
  const veranaChain = useVeranaChain()
  const { status, connect, openView } = useChain(veranaChain.chain_name)

  const attemptAutoConnect = useRef(false)
  useEffect(() => {
    if (!autoConnect) return
    if (attemptAutoConnect.current) return
    const canConnect = status === 'Disconnected' || status === 'Rejected' || status === 'Error'
    if (canConnect) {
      attemptAutoConnect.current = true
      connect()
    }
  }, [autoConnect, status, connect])

  if (autoConnect) return null

  const byStatus: Record<WalletStatus, { label: string; onClick?: () => void; icon: ReactNode }> = {
    Connected: { label: translate('wallet.wallet'), onClick: () => openView(), icon: <WalletIcon /> },
    Connecting: { label: translate('wallet.connecting'), icon: <Spinner /> },
    Disconnected: { label: translate('wallet.dashboard.connect'), onClick: () => void connect(), icon: <WalletIcon /> },
    Error: { label: translate('wallet.reconnect'), onClick: () => void connect(), icon: <RotateCwIcon /> },
    Rejected: { label: translate('wallet.reconnect'), onClick: () => void connect(), icon: <RotateCwIcon /> },
    NotExist: { label: translate('wallet.install'), onClick: () => openView(), icon: <DownloadIcon /> },
  }
  const current = byStatus[status as WalletStatus] ?? {
    label: translate('wallet.dashboard.connect'),
    onClick: () => void connect(),
    icon: <WalletIcon />,
  }

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      onClick={current.onClick}
      disabled={!current.onClick}
      aria-busy={status === 'Connecting' || undefined}
      className={cn('gap-2', className)}
    >
      {current.icon}
      {current.label}
    </Button>
  )
}

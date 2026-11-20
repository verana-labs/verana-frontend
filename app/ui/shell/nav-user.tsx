'use client'

import { useChain } from '@cosmos-kit/react'
import { ChevronDownIcon, CopyIcon, ExternalLinkIcon, LogOutIcon, QrCodeIcon, WalletIcon } from 'lucide-react'
import { useState } from 'react'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { AddressQrModal } from '@/ui/common/address-qr-modal'
import { Avatar, AvatarFallback } from '@/ui/shadcn/avatar'
import { Button } from '@/ui/shadcn/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/ui/shadcn/dropdown-menu'
import { Skeleton } from '@/ui/shadcn/skeleton'
import { shortenMiddle } from '@/util/util'

export function NavUser({ settling = false }: { settling?: boolean }) {
  const veranaChain = useVeranaChain()
  const explorerUrl = veranaChain.explorers?.[0]?.url
  const { status, address, connect, openView } = useChain(veranaChain.chain_name)
  const { copied, copy } = useCopyFeedback(address)
  const [qrOpen, setQrOpen] = useState(false)

  if (!address && settling) {
    return (
      <Skeleton role="status" aria-label={translate('wallet.connecting')} className="h-8 w-24 rounded-md sm:w-36" />
    )
  }

  if (!address) {
    return (
      <Button
        size="sm"
        title={translate('notconnected.nav.click')}
        onClick={() => (status === 'NotExist' || status === 'Connected' ? openView() : void connect())}
        disabled={status === 'Connecting'}
        className="h-8"
      >
        <WalletIcon />
        {translate('wallet.dashboard.connect')}
      </Button>
    )
  }

  const short = shortenMiddle(address, 13)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            data-shell="account"
            aria-label={address}
            title={address}
            className="h-8 gap-1.5 bg-background px-2 font-mono text-xs font-medium shadow-none data-[state=open]:bg-muted md:px-2.5"
          >
            <WalletIcon className="text-muted-foreground" />
            <span className="lg:hidden">…{address.slice(-6)}</span>
            <span className="hidden lg:inline">{short}</span>
            <ChevronDownIcon className="hidden text-muted-foreground lg:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-56 rounded-lg" align="end" sideOffset={6}>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="size-8 rounded-sm after:rounded-sm">
                <AvatarFallback className="rounded-sm bg-primary/10 text-primary">
                  <WalletIcon className="size-4" />
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-mono font-medium">{short}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {translate(copied ? 'copied.label' : 'connected.title')}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setQrOpen(true)}>
              <QrCodeIcon />
              {translate('navbar.qr.title')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void copy()}>
              <CopyIcon />
              {translate('navbar.addresscopy.title')}
            </DropdownMenuItem>
            {explorerUrl ? (
              <DropdownMenuItem onSelect={() => window.open(`${explorerUrl}/account/${address}`, '_blank')}>
                <ExternalLinkIcon />
                {translate('navbar.mintscan.title')}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => openView()}>
            <LogOutIcon />
            {translate('navbar.disconnect.title')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {qrOpen ? <AddressQrModal address={address} onClose={() => setQrOpen(false)} /> : null}
    </>
  )
}

'use client'

import { useChain } from '@cosmos-kit/react'
import { ArrowRightIcon, Building2Icon, WalletIcon } from 'lucide-react'
import Link from 'next/link'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { corporationDisplayName } from '@/ui/common/corporation-membership-row'
import { DotPattern } from '@/ui/dashboard/dot-pattern'
import { Button } from '@/ui/shadcn/button'
import { Card, CardDescription, CardFooter, CardHeader } from '@/ui/shadcn/card'
import { shortenMiddle } from '@/util/util'
import Wallet from '@/wallet/wallet'

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <Card
      data-dashboard="wallet-card"
      className={cn('relative justify-between bg-linear-to-br from-primary/10 via-card to-card', className)}
    >
      <DotPattern
        width={16}
        height={16}
        className="text-primary/25 [mask-image:radial-gradient(260px_circle_at_top_right,white,transparent)]"
      />
      {children}
    </Card>
  )
}

export function WalletCard({ noCorporation, className }: { noCorporation: boolean; className?: string }) {
  const veranaChain = useVeranaChain()
  const { address, isWalletConnected } = useChain(veranaChain.chain_name)
  const { actingCorporation } = useUserCorporation()

  if (!isWalletConnected)
    return (
      <Frame className={className}>
        <CardHeader className="relative">
          <span className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <WalletIcon aria-hidden="true" className="size-4" />
          </span>
          <h2 className="text-lg font-semibold tracking-tight">{translate('notconnected.dashboard.title')}</h2>
          <CardDescription>{translate('notconnected.dashboard.msg')}</CardDescription>
        </CardHeader>
        <CardFooter className="relative border-0 bg-transparent pb-(--card-spacing)">
          <Wallet size="default" />
        </CardFooter>
      </Frame>
    )

  if (noCorporation)
    return (
      <Frame className={className}>
        <CardHeader className="relative">
          <span className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2Icon aria-hidden="true" className="size-4" />
          </span>
          <h2 className="text-lg font-semibold tracking-tight">{translate('nocorporation.dashboard.title')}</h2>
          <CardDescription>{translate('nocorporation.dashboard.msg')}</CardDescription>
        </CardHeader>
        <CardFooter className="relative border-0 bg-transparent pb-(--card-spacing)">
          <Button asChild>
            <Link href="/corporation?create=1">
              <Building2Icon aria-hidden="true" />
              {translate('corporation.selector.create')}
            </Link>
          </Button>
        </CardFooter>
      </Frame>
    )

  const corporationName = actingCorporation
    ? (corporationDisplayName(actingCorporation.corporation.trustData) ?? actingCorporation.corporation.did)
    : null

  return (
    <Frame className={className}>
      <CardHeader className="relative">
        <CardDescription className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-success" />
          {translate('dashboard.wallet.connected')}
        </CardDescription>
        <p className="truncate font-mono text-lg font-semibold" title={address}>
          {address ? shortenMiddle(address, 21) : ''}
        </p>
        <CardDescription className="truncate">
          {corporationName
            ? translate('dashboard.wallet.acting', { name: corporationName })
            : translate('dashboard.wallet.manage')}
        </CardDescription>
      </CardHeader>
      <CardFooter className="relative flex-wrap gap-2 border-0 bg-transparent pb-(--card-spacing)">
        <Button asChild size="sm">
          <Link href="/account">
            {translate('dashboard.wallet.account')}
            <ArrowRightIcon aria-hidden="true" className="rtl:rotate-180" />
          </Link>
        </Button>
        <Wallet size="sm" variant="outline" />
      </CardFooter>
    </Frame>
  )
}

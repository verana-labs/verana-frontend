'use client'

import { Building2Icon, WalletIcon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { translate } from '@/i18n/dataview'
import { DotPattern } from '@/ui/dashboard/dot-pattern'
import { Button } from '@/ui/shadcn/button'
import { Card, CardDescription, CardHeader } from '@/ui/shadcn/card'
import Wallet from '@/wallet/wallet'

function CallToAction({
  icon,
  title,
  message,
  action,
}: {
  icon: ReactNode
  title: string
  message: string
  action: ReactNode
}) {
  return (
    <Card
      data-dashboard="wallet-card"
      className="relative flex-col gap-4 bg-linear-to-br from-primary/10 via-card to-card pe-(--card-spacing) sm:flex-row sm:items-center sm:justify-between"
    >
      <DotPattern
        width={16}
        height={16}
        className="text-primary/25 [mask-image:radial-gradient(260px_circle_at_top_right,white,transparent)]"
      />
      <CardHeader className="relative flex-1">
        <span className="mb-1 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <div className="relative shrink-0 ps-(--card-spacing) sm:ps-0">{action}</div>
    </Card>
  )
}

export function WalletCallToAction() {
  return (
    <CallToAction
      icon={<WalletIcon aria-hidden="true" className="size-4" />}
      title={translate('notconnected.dashboard.title')}
      message={translate('notconnected.dashboard.msg')}
      action={<Wallet size="default" />}
    />
  )
}

export function CorporationCallToAction() {
  return (
    <CallToAction
      icon={<Building2Icon aria-hidden="true" className="size-4" />}
      title={translate('nocorporation.dashboard.title')}
      message={translate('nocorporation.dashboard.msg')}
      action={
        <Button asChild>
          <Link href="/corporation?create=1">
            <Building2Icon aria-hidden="true" />
            {translate('corporation.selector.create')}
          </Link>
        </Button>
      }
    />
  )
}

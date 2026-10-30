'use client'

import { useChain } from '@cosmos-kit/react'
import { ArrowRightIcon, WalletIcon } from 'lucide-react'
import Link from 'next/link'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { DotPattern } from '@/lab/directions/bento-v3a/ui/dot-pattern'
import { ShimmerButton } from '@/lab/directions/bento-v3a/ui/shimmer-button'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/shadcn/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { shortenMiddle } from '@/util/util'

export function WalletCard({ className }: { className?: string }) {
  const veranaChain = useVeranaChain()
  const { status, address, connect, openView } = useChain(veranaChain.chain_name)

  return (
    <Card className={cn('relative justify-between bg-gradient-to-br from-primary/10 to-card', className)}>
      <DotPattern
        width={16}
        height={16}
        className="text-primary/25 [mask-image:radial-gradient(260px_circle_at_top_right,white,transparent)]"
      />
      <CardHeader className="relative">
        <CardDescription className="flex items-center gap-1.5">
          <WalletIcon className="size-3.5" />
          {address ? 'Wallet connected' : 'Wallet'}
        </CardDescription>
        <CardTitle className={cn('text-lg font-semibold', address && 'font-mono')}>
          {address ? shortenMiddle(address, 17) : 'Take part in Verana'}
        </CardTitle>
        <CardDescription>
          {address
            ? 'Manage your trust deposit, roles and pending tasks.'
            : 'Connect to join ecosystems, issue or verify credentials.'}
        </CardDescription>
      </CardHeader>
      <div className="relative flex flex-wrap items-center gap-2 px-4">
        {address ? (
          <>
            <Button asChild size="sm">
              <Link href="/account">
                Open account
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => openView()}>
              Manage wallet
            </Button>
          </>
        ) : (
          <ShimmerButton
            background="var(--primary)"
            borderRadius="10px"
            className="h-9 gap-2 px-4 text-sm font-medium"
            onClick={() => void connect()}
            disabled={status === 'Connecting'}
          >
            <WalletIcon className="size-4" />
            {status === 'Connecting' ? 'Connecting' : 'Connect wallet'}
          </ShimmerButton>
        )}
      </div>
    </Card>
  )
}

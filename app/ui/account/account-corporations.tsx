'use client'

import { useChain } from '@cosmos-kit/react'
import { ArrowRightIcon, Building2Icon, ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useId } from 'react'
import { useUserCorporation } from '@/hooks/useUserCorporation'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import type { CorporationMembership } from '@/lib/corporation-discovery'
import { cn } from '@/lib/utils'
import { CorporationDiscoveryFailure } from '@/ui/common/corporation-discovery-failure'
import { CorporationMembershipRow } from '@/ui/common/corporation-membership-row'
import { Shimmer } from '@/ui/motion/shimmer'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/ui/shadcn/empty'

export function AccountCorporations() {
  const router = useRouter()
  const veranaChain = useVeranaChain()
  const { address } = useChain(veranaChain.chain_name)
  const { memberships, actingCorporation, loading, error, attention, setActingCorporation } = useUserCorporation()
  const headingId = useId()
  const showEmpty = !loading && !error && memberships.length === 0

  if (!address) return null

  function openCorporation(membership: CorporationMembership) {
    setActingCorporation(membership.corporation.id)
    router.push('/corporation')
  }

  return (
    <Card
      role="region"
      aria-labelledby={headingId}
      className="shadow-card [--card-spacing:--spacing(5)] sm:[--card-spacing:--spacing(6)]"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <h2 id={headingId}>{translate('account.corporations.title')}</h2>
          {memberships.length > 0 ? (
            <Badge variant="secondary" className="tabular-nums">
              {memberships.length}
            </Badge>
          ) : null}
        </CardTitle>
        <CardDescription>{translate('account.corporations.notice')}</CardDescription>
        {showEmpty ? null : (
          <CardAction className="self-center">
            <OpenCorporationLink />
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <CorporationDiscoveryFailure />
        {loading && memberships.length === 0 ? (
          <div className="flex flex-col gap-2">
            <Shimmer className="h-16 w-full rounded-lg" />
            <Shimmer className="h-16 w-full rounded-lg" />
          </div>
        ) : null}
        {showEmpty ? (
          <Empty className="gap-4 border border-dashed border-border py-8">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Building2Icon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>{translate('account.corporations.empty.title')}</EmptyTitle>
              <EmptyDescription>{translate('account.corporations.empty')}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild variant="outline" size="sm">
                <Link href="/corporation">
                  {translate('account.corporations.notice.link')}
                  <ArrowRightIcon aria-hidden="true" data-icon="inline-end" className="rtl:rotate-180" />
                </Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : null}
        {memberships.length > 0 ? (
          <Stagger as="ul" className="overflow-hidden rounded-lg ring-1 ring-border divide-y divide-border">
            {memberships.map((membership) => {
              const isActing = actingCorporation?.corporation.id === membership.corporation.id
              return (
                <StaggerItem as="li" key={membership.corporation.id}>
                  <button
                    type="button"
                    aria-current={isActing ? 'true' : undefined}
                    onClick={() => openCorporation(membership)}
                    className={cn(
                      'group/row relative flex w-full items-center justify-between gap-3 px-4 py-3.5 text-start outline-none',
                      'transition-colors duration-(--duration-base) ease-standard hover:bg-muted/60',
                      'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset',
                      isActing && 'bg-light-selected-bg hover:bg-light-selected-bg'
                    )}
                  >
                    {isActing ? (
                      <span aria-hidden="true" className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-primary" />
                    ) : null}
                    <CorporationMembershipRow
                      membership={membership}
                      isActing={isActing}
                      attention={attention[membership.corporation.id]}
                    />
                    <ChevronRightIcon
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-base) ease-emphasized group-hover/row:translate-x-0.5 rtl:rotate-180 rtl:group-hover/row:-translate-x-0.5"
                    />
                  </button>
                </StaggerItem>
              )
            })}
          </Stagger>
        ) : null}
      </CardContent>
    </Card>
  )
}

function OpenCorporationLink() {
  return (
    <Link
      href="/corporation"
      className="group/link inline-flex items-center gap-1 rounded-sm text-sm font-medium whitespace-nowrap text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
    >
      {translate('account.corporations.notice.link')}
      <ArrowRightIcon
        aria-hidden="true"
        className="size-3.5 transition-transform duration-(--duration-base) ease-emphasized group-hover/link:translate-x-0.5 rtl:rotate-180"
      />
    </Link>
  )
}

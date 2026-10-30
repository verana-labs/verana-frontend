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
import { BlockHeader, BlockLinkButton } from '@/ui/common/block-card'
import { CorporationDiscoveryFailure } from '@/ui/common/corporation-discovery-failure'
import { CorporationMembershipRow } from '@/ui/common/corporation-membership-row'
import { ToneTag } from '@/ui/common/tone-tag'
import { Shimmer } from '@/ui/motion/shimmer'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
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
        <BlockHeader
          id={headingId}
          icon={<Building2Icon />}
          title={translate('account.corporations.title')}
          caption={translate('account.corporations.notice')}
          tag={
            memberships.length > 0 ? (
              <ToneTag tone="accent" className="tabular-nums">
                {memberships.length}
              </ToneTag>
            ) : null
          }
          actions={
            showEmpty ? null : (
              <BlockLinkButton
                href="/corporation"
                label={translate('account.corporations.notice.link')}
                className="text-primary hover:text-primary/80"
              />
            )
          }
        />
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
              <EmptyMedia variant="icon" className="bg-tint-accent text-primary">
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
          <Stagger as="ul" className="divide-y divide-border overflow-hidden rounded-lg shadow-hairline">
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

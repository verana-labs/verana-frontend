'use client'

import { BadgeCheckIcon, NetworkIcon, TriangleAlertIcon } from 'lucide-react'
import Link from 'next/link'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { EcosystemAvatar, ecosystemName, hasDisplayName } from '@/ui/dashboard/ecosystem-avatar'
import { formatCompact, formatCount } from '@/ui/dashboard/format'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import { Shimmer } from '@/ui/motion/shimmer'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/ui/shadcn/empty'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/shadcn/table'
import { shortenMiddle } from '@/util/util'

const TOP = 6

function byActivity(a: EcosystemListItem, b: EcosystemListItem): number {
  return b.issued - a.issued || b.participants - a.participants || Number(b.id) - Number(a.id)
}

export function EcosystemsCard({
  ecosystems,
  total,
  loading,
  error,
  onRetry,
  className,
}: {
  ecosystems: EcosystemListItem[] | null
  total: number | null
  loading: boolean
  error: boolean
  onRetry: () => void
  className?: string
}) {
  const ranked = [...(ecosystems ?? [])].sort(byActivity).slice(0, TOP)
  const count = Math.max(total ?? 0, ecosystems?.length ?? 0)

  return (
    <Card className={cn('@container/card', className)}>
      <CardHeader>
        <div className="flex min-w-0 items-center gap-3">
          {ranked.length > 0 && (
            <div className="hidden -space-x-2.5 @[420px]/card:flex" aria-hidden="true">
              {ranked.slice(0, 4).map((ecosystem) => (
                <EcosystemAvatar key={ecosystem.id} ecosystem={ecosystem} round className="size-8 ring-2 ring-card" />
              ))}
            </div>
          )}
          <div className="grid min-w-0 gap-1">
            <CardTitle className="flex items-center gap-2">
              <h2>{translate('dataview.dashboard.fields.ecosystems')}</h2>
              {ranked.length > 0 && count > 0 ? (
                <Badge variant="secondary" className="tabular-nums">
                  {translate('dashboard.ecosystems.showing', {
                    shown: formatCount(ranked.length),
                    total: formatCount(count),
                  })}
                </Badge>
              ) : null}
            </CardTitle>
            <CardDescription>{translate('dashboard.ecosystems.desc')}</CardDescription>
          </div>
        </div>
        <CardAction>
          <Button variant="outline" size="sm" asChild>
            <Link href="/discover">{translate('dashboard.ecosystems.viewAll')}</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 sm:px-4">
        {error && ranked.length === 0 ? (
          <Empty className="min-h-48 border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TriangleAlertIcon />
              </EmptyMedia>
              <EmptyTitle>{translate('dashboard.ecosystems.error')}</EmptyTitle>
            </EmptyHeader>
            <Button variant="outline" size="sm" onClick={onRetry}>
              {translate('dashboard.retry')}
            </Button>
          </Empty>
        ) : !loading && ranked.length === 0 ? (
          <Empty className="min-h-48 border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <NetworkIcon />
              </EmptyMedia>
              <EmptyTitle>{translate('dashboard.ecosystems.empty')}</EmptyTitle>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{translate('dashboard.ecosystems.col.name')}</TableHead>
                <TableHead className="hidden text-right @[560px]/card:table-cell">
                  {translate('dataview.dashboard.fields.schemas')}
                </TableHead>
                <TableHead className="hidden text-right @[560px]/card:table-cell">
                  {translate('dataview.dashboard.fields.participants')}
                </TableHead>
                <TableHead className="hidden text-right @[680px]/card:table-cell">
                  {translate('dashboard.ecosystems.col.deposit')}
                </TableHead>
                <TableHead className="text-right">{translate('dashboard.ecosystems.col.issued')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && ranked.length === 0
                ? Array.from({ length: TOP }, (_, i) => (
                    <TableRow key={`skeleton-${i}`} className="hover:bg-transparent">
                      <TableCell colSpan={5}>
                        <Shimmer className="h-9 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : ranked.map((ecosystem) => (
                    <TableRow key={ecosystem.id} className="relative">
                      <TableCell className="w-full max-w-0">
                        <Link
                          href={`/ecosystems/${ecosystem.id}`}
                          className="flex min-w-0 items-center gap-3 rounded-sm after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50 focus-visible:after:ring-inset"
                        >
                          <EcosystemAvatar ecosystem={ecosystem} className="size-9" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-medium">
                              <span
                                className={cn('truncate', !hasDisplayName(ecosystem) && 'font-mono text-[0.8125rem]')}
                                title={ecosystem.did}
                              >
                                {ecosystemName(ecosystem)}
                              </span>
                              {ecosystem.trustData?.trustStatus === 'TRUSTED' && (
                                <BadgeCheckIcon
                                  className="size-3.5 shrink-0 text-primary"
                                  aria-label={translate('dashboard.ecosystems.trusted')}
                                />
                              )}
                              {ecosystem.archived && (
                                <Badge variant="outline" className="text-muted-foreground">
                                  {translate('dashboard.ecosystems.archived')}
                                </Badge>
                              )}
                            </div>
                            {hasDisplayName(ecosystem) ? (
                              <div className="truncate font-mono text-xs text-muted-foreground" title={ecosystem.did}>
                                {shortenMiddle(ecosystem.did, 30)}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground tabular-nums">
                                {translate('dashboard.ecosystems.fallback', { id: ecosystem.id })}
                              </div>
                            )}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums @[560px]/card:table-cell">
                        {formatCount(ecosystem.activeSchemas)}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums @[560px]/card:table-cell">
                        {formatCount(ecosystem.participants)}
                      </TableCell>
                      <TableCell className="hidden text-right whitespace-nowrap tabular-nums @[680px]/card:table-cell">
                        {formatCompact(Number(ecosystem.weight || 0) / 1_000_000)} VNA
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCount(ecosystem.issued)}
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

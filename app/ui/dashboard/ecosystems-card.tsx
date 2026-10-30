'use client'

import { BadgeCheckIcon, NetworkIcon, TriangleAlertIcon } from 'lucide-react'
import Link from 'next/link'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { BlockHeader } from '@/ui/common/block-card'
import { GhostEmpty } from '@/ui/common/ghost-empty'
import { ScoreGauge } from '@/ui/common/score-gauge'
import { ToneTag } from '@/ui/common/tone-tag'
import { EcosystemAvatar, ecosystemName, hasDisplayName } from '@/ui/dashboard/ecosystem-avatar'
import { formatCompact, formatCount } from '@/ui/dashboard/format'
import { GhostRows } from '@/ui/dashboard/ghost-visuals'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import { Shimmer } from '@/ui/motion/shimmer'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
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
  const loaded = ecosystems ?? []
  const trusted = loaded.filter((ecosystem) => ecosystem.trustData?.trustStatus === 'TRUSTED').length
  const trustedShare = loaded.length > 0 ? (trusted / loaded.length) * 100 : 0
  const topIssued = Math.max(1, ...ranked.map((ecosystem) => ecosystem.issued))

  return (
    <Card className={cn('@container/card', className)}>
      <CardHeader className="gap-3">
        <BlockHeader
          title={translate('dataview.dashboard.fields.ecosystems')}
          caption={translate('dashboard.ecosystems.desc')}
          link={{ href: '/discover', label: translate('dashboard.ecosystems.viewAll') }}
          leading={
            ranked.length > 0 ? (
              <div className="hidden shrink-0 -space-x-2.5 pt-0.5 @[420px]/card:flex" aria-hidden="true">
                {ranked.slice(0, 4).map((ecosystem) => (
                  <EcosystemAvatar key={ecosystem.id} ecosystem={ecosystem} round className="size-8 ring-2 ring-card" />
                ))}
              </div>
            ) : null
          }
          tag={
            ranked.length > 0 && count > 0 ? (
              <ToneTag tone="accent" className="tabular-nums">
                {translate('dashboard.ecosystems.showing', {
                  shown: formatCount(ranked.length),
                  total: formatCount(count),
                })}
              </ToneTag>
            ) : null
          }
        />
        {loaded.length > 0 ? (
          <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-3 py-2 ring-1 ring-foreground/5">
            <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <BadgeCheckIcon aria-hidden="true" className="size-3.5 text-primary" />
              {translate('dashboard.ecosystems.trusted')}
            </span>
            <ScoreGauge
              percent={trustedShare}
              tone="brand"
              size="sm"
              className="max-w-40 flex-none basis-40"
              label={`${translate('dashboard.ecosystems.trusted')} ${formatCount(trusted)} / ${formatCount(loaded.length)}`}
            />
            <span className="shrink-0 text-xs font-semibold tabular-nums">
              {formatCount(trusted)}
              <span className="font-normal text-muted-foreground"> / {formatCount(loaded.length)}</span>
            </span>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="px-2 sm:px-4">
        {error && ranked.length === 0 ? (
          <GhostEmpty
            icon={<TriangleAlertIcon />}
            title={translate('dashboard.ecosystems.error')}
            action={
              <Button variant="outline" size="sm" onClick={onRetry}>
                {translate('dashboard.retry')}
              </Button>
            }
          >
            <GhostRows />
          </GhostEmpty>
        ) : !loading && ranked.length === 0 ? (
          <GhostEmpty icon={<NetworkIcon />} title={translate('dashboard.ecosystems.empty')}>
            <GhostRows />
          </GhostEmpty>
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
                    <TableRow key={ecosystem.id} className="relative transition-colors hover:bg-primary/[0.04]">
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
                              {ecosystem.archived && <ToneTag>{translate('dashboard.ecosystems.archived')}</ToneTag>}
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
                        <div className="flex items-center justify-end gap-2.5">
                          <span
                            aria-hidden="true"
                            className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-track @[480px]/card:block"
                          >
                            <span
                              className="block h-full rounded-full bg-linear-to-r from-primary/50 to-primary"
                              style={{ width: `${(ecosystem.issued / topIssued) * 100}%` }}
                            />
                          </span>
                          <span className="min-w-6">{formatCount(ecosystem.issued)}</span>
                        </div>
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

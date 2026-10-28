'use client'

import { BadgeCheckIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/shadcn/avatar'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { Skeleton } from '@/ui/shadcn/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/shadcn/table'
import { formatNumber, shortenMiddle } from '@/util/util'

const COMPACT = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

type Pager = { hasNext: boolean; hasPrevious: boolean; nextPage: () => void; previousPage: () => void }

function nameOf(ecosystem: EcosystemListItem): string {
  return ecosystem.trustData?.serviceName ?? ecosystem.trustData?.organizationName ?? shortenMiddle(ecosystem.did, 18)
}

function initials(name: string): string {
  const words = name
    .replace(/^did:[^:]+:/, '')
    .split(/[\s._:-]+/)
    .filter(Boolean)
  return (
    words
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || 'EC'
  )
}

function EcosystemAvatar({
  ecosystem,
  round = false,
  className,
}: {
  ecosystem: EcosystemListItem
  round?: boolean
  className?: string
}) {
  const logo = ecosystem.trustData?.serviceLogoUrl ?? ecosystem.trustData?.organizationLogoUrl
  return (
    <Avatar className={cn('bg-card', !round && 'rounded-lg after:rounded-lg *:rounded-lg', className)}>
      {logo && <AvatarImage src={logo} alt="" />}
      <AvatarFallback className={cn('bg-primary/10 text-xs font-semibold text-primary', !round && 'rounded-lg')}>
        {initials(nameOf(ecosystem))}
      </AvatarFallback>
    </Avatar>
  )
}

export function EcosystemsCard({
  ecosystems,
  loading,
  pager,
  className,
}: {
  ecosystems: EcosystemListItem[]
  loading: boolean
  pager: Pager
  className?: string
}) {
  const ranked = [...ecosystems].sort((a, b) => b.issued - a.issued)

  return (
    <Card className={cn('@container/card', className)}>
      <CardHeader>
        <div className="flex min-w-0 items-center gap-3">
          {ranked.length > 0 && (
            <div className="hidden -space-x-2.5 @[420px]/card:flex">
              {ranked.slice(0, 4).map((ecosystem) => (
                <EcosystemAvatar key={ecosystem.id} ecosystem={ecosystem} round className="size-8 ring-2 ring-card" />
              ))}
            </div>
          )}
          <div className="grid min-w-0 gap-1">
            <CardTitle>Ecosystems</CardTitle>
            <CardDescription>Trust registries ranked by credentials issued</CardDescription>
          </div>
        </div>
        <CardAction className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={pager.previousPage}
            disabled={!pager.hasPrevious}
          >
            <span className="sr-only">Previous page</span>
            <ChevronLeftIcon />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={pager.nextPage} disabled={!pager.hasNext}>
            <span className="sr-only">Next page</span>
            <ChevronRightIcon />
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/ecosystems">View all</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 sm:px-4">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Ecosystem</TableHead>
              <TableHead className="hidden text-right @[560px]/card:table-cell">Schemas</TableHead>
              <TableHead className="hidden text-right @[560px]/card:table-cell">Participants</TableHead>
              <TableHead className="hidden text-right @[680px]/card:table-cell">Deposit</TableHead>
              <TableHead className="text-right">Issued</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading
              ? Array.from({ length: 5 }, (_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-9 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              : ranked.map((ecosystem) => {
                  const name = nameOf(ecosystem)
                  return (
                    <TableRow key={ecosystem.id}>
                      <TableCell className="max-w-0 w-full">
                        <Link href={`/ecosystems/${ecosystem.id}`} className="flex min-w-0 items-center gap-3">
                          <EcosystemAvatar ecosystem={ecosystem} className="size-9" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 font-medium">
                              <span className="truncate">{name}</span>
                              {ecosystem.trustData?.trustStatus === 'TRUSTED' && (
                                <BadgeCheckIcon className="size-3.5 shrink-0 text-primary" aria-label="Trusted" />
                              )}
                              {ecosystem.archived && (
                                <Badge variant="outline" className="text-muted-foreground">
                                  archived
                                </Badge>
                              )}
                            </div>
                            <div className="truncate font-mono text-xs text-muted-foreground" title={ecosystem.did}>
                              {shortenMiddle(ecosystem.did, 30)}
                            </div>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums @[560px]/card:table-cell">
                        {formatNumber(ecosystem.activeSchemas, true, true)}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums @[560px]/card:table-cell">
                        {formatNumber(ecosystem.participants, true, true)}
                      </TableCell>
                      <TableCell className="hidden text-right whitespace-nowrap tabular-nums @[680px]/card:table-cell">
                        {COMPACT.format(Number(ecosystem.weight || 0) / 1_000_000)} VNA
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatNumber(ecosystem.issued, true, true)}
                      </TableCell>
                    </TableRow>
                  )
                })}
            {!loading && ranked.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No ecosystems yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

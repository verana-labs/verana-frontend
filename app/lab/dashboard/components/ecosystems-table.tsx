'use client'

import { ChevronLeftIcon, ChevronRightIcon, CircleCheckIcon, CircleDashedIcon, SearchIcon } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { DidTrustState } from '@/lib/resolverClient'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Input } from '@/ui/shadcn/input'
import { Skeleton } from '@/ui/shadcn/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/shadcn/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/ui/shadcn/tabs'
import { formatNumber, formatVNAFromUVNA, shortenMiddle } from '@/util/util'

type View = 'all' | 'trusted' | 'archived'

const TRUST_BADGE: Record<DidTrustState, string> = {
  TRUSTED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  UNTRUSTED: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400',
  UNRESOLVED: 'text-muted-foreground',
}

function ecosystemName(ecosystem: EcosystemListItem): string {
  return ecosystem.trustData?.serviceName ?? ecosystem.trustData?.organizationName ?? shortenMiddle(ecosystem.did, 18)
}

function inView(ecosystem: EcosystemListItem, view: View): boolean {
  if (view === 'trusted') return ecosystem.trustData?.trustStatus === 'TRUSTED'
  if (view === 'archived') return ecosystem.archived !== null
  return true
}

type Pager = {
  hasNext: boolean
  hasPrevious: boolean
  nextPage: () => void
  previousPage: () => void
}

export function EcosystemsTable({
  ecosystems,
  loading,
  pager,
}: {
  ecosystems: EcosystemListItem[]
  loading: boolean
  pager: Pager
}) {
  const [view, setView] = useState<View>('all')
  const [search, setSearch] = useState('')

  const counts = useMemo(
    () => ({
      trusted: ecosystems.filter((e) => inView(e, 'trusted')).length,
      archived: ecosystems.filter((e) => inView(e, 'archived')).length,
    }),
    [ecosystems]
  )

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return ecosystems.filter(
      (e) =>
        inView(e, view) &&
        (!q ||
          [e.did, e.trustData?.serviceName, e.trustData?.organizationName].some((v) => v?.toLowerCase().includes(q)))
    )
  }, [ecosystems, view, search])

  return (
    <Tabs
      value={view}
      onValueChange={(value) => setView(value as View)}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-6">
        <TabsList className="**:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1">
          <TabsTrigger value="all">Ecosystems</TabsTrigger>
          <TabsTrigger value="trusted">
            Trusted <Badge variant="secondary">{counts.trusted}</Badge>
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived <Badge variant="secondary">{counts.archived}</Badge>
          </TabsTrigger>
        </TabsList>
        <div className="relative w-full sm:w-64">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or DID"
            className="h-8 pl-8"
          />
        </div>
      </div>
      <TabsContent value={view} className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted">
              <TableRow>
                <TableHead>Ecosystem</TableHead>
                <TableHead>Trust</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Schemas</TableHead>
                <TableHead className="text-right">Participants</TableHead>
                <TableHead className="text-right">Issued</TableHead>
                <TableHead className="text-right">Verified</TableHead>
                <TableHead className="text-right">Deposit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && ecosystems.length === 0 ? (
                Array.from({ length: 5 }, (_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell colSpan={8}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length ? (
                rows.map((ecosystem) => {
                  const trust = ecosystem.trustData?.trustStatus ?? 'UNRESOLVED'
                  return (
                    <TableRow key={ecosystem.id}>
                      <TableCell className="max-w-72">
                        <Link
                          href={`/ecosystems/${ecosystem.id}`}
                          className="block truncate font-medium hover:underline"
                        >
                          {ecosystemName(ecosystem)}
                        </Link>
                        <div className="truncate font-mono text-xs text-muted-foreground" title={ecosystem.did}>
                          {shortenMiddle(ecosystem.did, 30)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={TRUST_BADGE[trust]}>
                          {trust.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="px-1.5 text-muted-foreground">
                          {ecosystem.archived ? (
                            <CircleDashedIcon />
                          ) : (
                            <CircleCheckIcon className="fill-emerald-500 stroke-background dark:fill-emerald-400" />
                          )}
                          {ecosystem.archived ? 'Archived' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(ecosystem.activeSchemas, true, true)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(ecosystem.participants, true, true)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(ecosystem.issued, true, true)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(ecosystem.verified, true, true)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap tabular-nums">
                        {formatVNAFromUVNA(ecosystem.weight)}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No ecosystems.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {rows.length} of {ecosystems.length} on this page
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={pager.previousPage}
              disabled={!pager.hasPrevious}
            >
              <span className="sr-only">Previous page</span>
              <ChevronLeftIcon />
            </Button>
            <Button variant="outline" size="icon" className="size-8" onClick={pager.nextPage} disabled={!pager.hasNext}>
              <span className="sr-only">Next page</span>
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

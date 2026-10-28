'use client'

import { FileJson2Icon } from 'lucide-react'
import Link from 'next/link'
import type { SchemaSummary } from '@/lab/directions/bento-v3a/network-extras'
import { cn } from '@/lib/utils'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/shadcn/card'
import { Skeleton } from '@/ui/shadcn/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/shadcn/table'
import { formatNumber, shortenMiddle } from '@/util/util'

const ONBOARDING: Record<string, string> = {
  OPEN: 'Open',
  ECOSYSTEM_ONBOARDING_PROCESS: 'Ecosystem approval',
}

function ecosystemNameOf(id: number, ecosystems: EcosystemListItem[]): string {
  const ecosystem = ecosystems.find((e) => Number(e.id) === id)
  if (!ecosystem) return `Ecosystem #${id}`
  return ecosystem.trustData?.serviceName ?? ecosystem.trustData?.organizationName ?? shortenMiddle(ecosystem.did, 18)
}

export function SchemasCard({
  schemas,
  ecosystems,
  className,
}: {
  schemas: SchemaSummary[] | null
  ecosystems: EcosystemListItem[]
  className?: string
}) {
  const ranked = [...(schemas ?? [])].sort((a, b) => b.participants - a.participants)

  return (
    <Card className={cn('@container/card', className)}>
      <CardHeader>
        <CardTitle>Credential schemas</CardTitle>
        <CardDescription>What you can issue and verify on Verana today</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm" asChild>
            <Link href="/discover">Discover</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 sm:px-4">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Schema</TableHead>
              <TableHead className="hidden @[720px]/card:table-cell">Ecosystem</TableHead>
              <TableHead className="hidden @[860px]/card:table-cell">Issuers join</TableHead>
              <TableHead className="hidden text-right @[560px]/card:table-cell">Participants</TableHead>
              <TableHead className="hidden text-right @[560px]/card:table-cell">Verified</TableHead>
              <TableHead className="text-right">Issued</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schemas === null
              ? Array.from({ length: 4 }, (_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-9 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              : ranked.map((schema) => (
                  <TableRow key={schema.id}>
                    <TableCell className="max-w-0 w-full">
                      <Link href={`/credential-schemas/${schema.id}`} className="flex min-w-0 items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <FileJson2Icon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate font-medium">{schema.title}</div>
                          <div className="truncate text-xs text-muted-foreground" title={schema.description}>
                            {schema.description}
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden max-w-48 truncate text-muted-foreground @[720px]/card:table-cell">
                      <Link href={`/ecosystems/${schema.ecosystem_id}`} className="hover:text-foreground">
                        {ecosystemNameOf(schema.ecosystem_id, ecosystems)}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden @[860px]/card:table-cell">
                      <Badge variant="outline" className="text-muted-foreground">
                        {ONBOARDING[schema.issuer_onboarding_mode] ?? schema.issuer_onboarding_mode}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums @[560px]/card:table-cell">
                      {formatNumber(schema.participants, true, true)}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums @[560px]/card:table-cell">
                      {formatNumber(schema.verified, true, true)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatNumber(schema.issued, true, true)}
                    </TableCell>
                  </TableRow>
                ))}
            {schemas !== null && ranked.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No credential schemas yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

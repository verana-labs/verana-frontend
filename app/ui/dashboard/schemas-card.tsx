'use client'

import { FileJson2Icon, TriangleAlertIcon } from 'lucide-react'
import Link from 'next/link'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { BlockHeader } from '@/ui/common/block-card'
import { GhostEmpty } from '@/ui/common/ghost-empty'
import { type Tone, ToneTag } from '@/ui/common/tone-tag'
import { ecosystemName, hasDisplayName } from '@/ui/dashboard/ecosystem-avatar'
import { formatCount } from '@/ui/dashboard/format'
import { GhostRows } from '@/ui/dashboard/ghost-visuals'
import type { SchemaSummary } from '@/ui/dashboard/network-data'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import { Shimmer } from '@/ui/motion/shimmer'
import { Button } from '@/ui/shadcn/button'
import { Card, CardContent, CardHeader } from '@/ui/shadcn/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/shadcn/table'

const TOP = 6

const ONBOARDING_MODES = new Set(['OPEN', 'ECOSYSTEM_ONBOARDING_PROCESS'])

const ONBOARDING_TONES: Record<string, Tone> = { OPEN: 'success', ECOSYSTEM_ONBOARDING_PROCESS: 'accent' }

function onboardingLabel(mode: string): string {
  return ONBOARDING_MODES.has(mode) ? translate(`dashboard.schemas.onboarding.${mode}`) : mode
}

function ecosystemLabel(id: number, ecosystems: Map<number, EcosystemListItem>): string {
  const ecosystem = ecosystems.get(id)
  return ecosystem && hasDisplayName(ecosystem)
    ? ecosystemName(ecosystem)
    : translate('dashboard.ecosystems.fallback', { id })
}

export function SchemasCard({
  schemas,
  total,
  error,
  onRetry,
  ecosystems,
  className,
}: {
  schemas: SchemaSummary[] | null
  total: number | null
  error: boolean
  onRetry: () => void
  ecosystems: EcosystemListItem[] | null
  className?: string
}) {
  const byId = new Map((ecosystems ?? []).map((ecosystem) => [Number(ecosystem.id), ecosystem]))
  const ranked = [...(schemas ?? [])].sort((a, b) => b.participants - a.participants || b.id - a.id).slice(0, TOP)
  const count = Math.max(total ?? 0, schemas?.length ?? 0)

  return (
    <Card className={cn('@container/card', className)}>
      <CardHeader>
        <BlockHeader
          icon={<FileJson2Icon />}
          title={translate('dashboard.schemas.title')}
          caption={translate('dashboard.schemas.desc')}
          link={{ href: '/discover', label: translate('dashboard.schemas.viewAll') }}
          tag={
            ranked.length > 0 && count > 0 ? (
              <ToneTag tone="accent" className="tabular-nums">
                {translate('dashboard.schemas.showing', {
                  shown: formatCount(ranked.length),
                  total: formatCount(count),
                })}
              </ToneTag>
            ) : null
          }
        />
      </CardHeader>
      <CardContent className="px-2 sm:px-4">
        {error ? (
          <GhostEmpty
            icon={<TriangleAlertIcon />}
            title={translate('dashboard.schemas.error')}
            action={
              <Button variant="outline" size="sm" onClick={onRetry}>
                {translate('dashboard.retry')}
              </Button>
            }
          >
            <GhostRows rows={4} />
          </GhostEmpty>
        ) : schemas !== null && ranked.length === 0 ? (
          <GhostEmpty icon={<FileJson2Icon />} title={translate('dashboard.schemas.empty')}>
            <GhostRows rows={4} />
          </GhostEmpty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{translate('dashboard.schemas.col.schema')}</TableHead>
                <TableHead className="hidden @[720px]/card:table-cell">
                  {translate('dashboard.ecosystems.col.name')}
                </TableHead>
                <TableHead className="hidden @[860px]/card:table-cell">
                  {translate('dashboard.schemas.col.onboarding')}
                </TableHead>
                <TableHead className="hidden text-right @[560px]/card:table-cell">
                  {translate('dataview.dashboard.fields.participants')}
                </TableHead>
                <TableHead className="hidden text-right @[560px]/card:table-cell">
                  {translate('dashboard.schemas.col.verified')}
                </TableHead>
                <TableHead className="text-right">{translate('dashboard.ecosystems.col.issued')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schemas === null
                ? Array.from({ length: 4 }, (_, i) => (
                    <TableRow key={`skeleton-${i}`} className="hover:bg-transparent">
                      <TableCell colSpan={6}>
                        <Shimmer className="h-9 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : ranked.map((schema) => (
                    <TableRow key={schema.id} className="transition-colors hover:bg-primary/[0.04]">
                      <TableCell className="w-full max-w-0">
                        <Link
                          href={`/credential-schemas/${schema.id}`}
                          className="flex min-w-0 items-center gap-3 rounded-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-tint-accent text-primary">
                            <FileJson2Icon aria-hidden="true" className="size-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{schema.title}</span>
                            <span className="block truncate text-xs text-muted-foreground" title={schema.description}>
                              {schema.description}
                            </span>
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden max-w-48 truncate text-muted-foreground @[720px]/card:table-cell">
                        <Link href={`/ecosystems/${schema.ecosystem_id}`} className="hover:text-foreground">
                          {ecosystemLabel(schema.ecosystem_id, byId)}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden @[860px]/card:table-cell">
                        <ToneTag tone={ONBOARDING_TONES[schema.issuer_onboarding_mode] ?? 'neutral'} dot>
                          {onboardingLabel(schema.issuer_onboarding_mode)}
                        </ToneTag>
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums @[560px]/card:table-cell">
                        {formatCount(schema.participants)}
                      </TableCell>
                      <TableCell className="hidden text-right tabular-nums @[560px]/card:table-cell">
                        {formatCount(schema.verified)}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCount(schema.issued)}
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

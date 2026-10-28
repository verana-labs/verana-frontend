'use client'

import { ArchiveIcon, ArrowUpRightIcon, FileCheckIcon, UsersIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { serviceAvatarUrl, serviceIdenticonUrl } from '@/lib/resolverClient'
import { cn } from '@/lib/utils'
import LogoImage from '@/ui/common/logo-image'
import TrustBadge from '@/ui/common/trust-badge'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import { ecosystemHref, useEcosystemIdentity } from '@/ui/ecosystems/ecosystem-identity'
import { statLabel, tr } from '@/ui/ecosystems/i18n'
import { Shimmer } from '@/ui/motion/shimmer'
import { Badge } from '@/ui/shadcn/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/shadcn/table'
import { formatNumber, formatVNAFromUVNA, shortenMiddle } from '@/util/util'

const COL = {
  participants: 'hidden @lg/eco-table:table-cell',
  issued: 'hidden @lg/eco-table:table-cell',
  egf: 'hidden @lg/eco-table:table-cell',
  value: 'hidden @xl/eco-table:table-cell',
  schemas: 'hidden @2xl/eco-table:table-cell',
  verified: 'hidden @3xl/eco-table:table-cell',
  org: 'hidden @4xl/eco-table:table-cell',
}

const EGF_LINK_CLASS =
  'inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 text-xs font-medium text-primary outline-none hover:bg-primary/10 focus-visible:ring-[3px] focus-visible:ring-ring/50'

const NUM = 'text-right tabular-nums'

const NUM_HEAD = 'w-24 py-2 text-right leading-tight whitespace-normal'

function Head() {
  return (
    <TableHeader className="bg-muted/40 [&_th]:text-xs [&_th]:text-muted-foreground">
      <TableRow className="hover:bg-transparent">
        <TableHead className="ps-4">{tr('ecosystem.title', 'Ecosystem')}</TableHead>
        <TableHead className={cn('w-56', COL.org)}>{tr('ecosystems.table.organization', 'Organization')}</TableHead>
        <TableHead className={cn(NUM_HEAD, COL.schemas)}>
          {statLabel('datatable.ecosystem.header.activeSchemas', 'Active Schemas')}
        </TableHead>
        <TableHead className={cn(NUM_HEAD, COL.participants)}>
          {statLabel('datatable.ecosystem.header.participants', 'Participants')}
        </TableHead>
        <TableHead className={cn(NUM_HEAD, COL.value)}>
          {statLabel('datatable.ecosystem.card.trustValue', 'Trust Value')}
        </TableHead>
        <TableHead className={cn(NUM_HEAD, COL.issued)}>
          {statLabel('datatable.ecosystem.header.issuedCredentials', 'Issued Credentials')}
        </TableHead>
        <TableHead className={cn(NUM_HEAD, COL.verified)}>
          {statLabel('datatable.ecosystem.header.verifiedCredentials', 'Verified Credentials')}
        </TableHead>
        <TableHead className={cn('w-12 pe-4', COL.egf)}>
          <span className="sr-only">{tr('datatable.ecosystem.card.egf', 'EGF')}</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  )
}

function EcosystemRow({ ecosystem }: { ecosystem: EcosystemListItem }) {
  const router = useRouter()
  const eco = useEcosystemIdentity(ecosystem, ecosystem.trustData)
  const href = ecosystemHref(ecosystem.id)
  const weight = formatVNAFromUVNA(ecosystem.weight == null ? null : String(ecosystem.weight))

  return (
    <TableRow
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('a')) return
        router.push(href)
      }}
      className={cn('group/row h-16 cursor-pointer', eco.archived && 'bg-muted/30')}
    >
      <TableCell className="w-full max-w-0 ps-4">
        <div className="flex min-w-0 items-center gap-3">
          <LogoImage
            src={eco.identity?.serviceLogoUrl}
            fallbackSrc={serviceIdenticonUrl(ecosystem.did)}
            className={cn(
              'size-9 shrink-0 rounded-lg bg-background object-contain ring-1 ring-border',
              eco.archived && 'grayscale'
            )}
          />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-1.5">
              <Link
                href={href}
                title={eco.nameIsDid ? ecosystem.did : eco.name}
                className={cn(
                  'truncate rounded-sm font-medium text-foreground outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50',
                  eco.nameIsDid && 'font-mono text-[13px]'
                )}
              >
                {eco.name}
              </Link>
              <TrustBadge state={eco.trustStatus} size="sm" />
              {eco.archived ? (
                <Badge variant="outline" className="text-muted-foreground">
                  <ArchiveIcon data-icon="inline-start" aria-hidden="true" />
                  {tr('ecosystems.card.archived', 'Archived')}
                </Badge>
              ) : null}
            </div>
            {eco.nameIsDid ? null : (
              <div className="truncate font-mono text-xs text-muted-foreground" title={ecosystem.did}>
                {shortenMiddle(ecosystem.did, 40)}
              </div>
            )}
            <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground tabular-nums @lg/eco-table:hidden">
              <InlineStat
                icon={<UsersIcon />}
                label={statLabel('datatable.ecosystem.header.participants', 'Participants')}
                value={ecosystem.participants}
              />
              <InlineStat
                icon={<FileCheckIcon />}
                label={statLabel('datatable.ecosystem.header.issuedCredentials', 'Issued Credentials')}
                value={ecosystem.issued}
              />
              {eco.egfHref ? (
                <a
                  href={eco.egfHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(EGF_LINK_CLASS, '-mx-1.5')}
                >
                  {tr('datatable.ecosystem.card.egf', 'EGF')}
                  <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className={cn('max-w-56', COL.org)}>
        <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
          {eco.orgName ? (
            <>
              <LogoImage
                src={eco.identity?.organizationLogoUrl}
                fallbackSrc={serviceAvatarUrl(eco.orgName)}
                className="size-5 shrink-0 rounded-sm object-contain"
              />
              <span className="truncate" title={eco.orgName}>
                {eco.orgName}
              </span>
            </>
          ) : (
            <span aria-hidden="true">—</span>
          )}
          {eco.flag ? (
            <span className="shrink-0" title={eco.countryCode} aria-hidden="true">
              {eco.flag}
            </span>
          ) : null}
        </div>
      </TableCell>
      <TableCell className={cn(NUM, COL.schemas)}>{formatNumber(ecosystem.activeSchemas, true, true)}</TableCell>
      <TableCell className={cn(NUM, COL.participants)}>{formatNumber(ecosystem.participants, true, true)}</TableCell>
      <TableCell className={cn(NUM, 'font-mono text-xs', COL.value)} title={weight}>
        {weight}
      </TableCell>
      <TableCell className={cn(NUM, 'font-medium', COL.issued)}>{formatNumber(ecosystem.issued, true, true)}</TableCell>
      <TableCell className={cn(NUM, COL.verified)}>{formatNumber(ecosystem.verified, true, true)}</TableCell>
      <TableCell className={cn('pe-4 text-right', COL.egf)}>
        {eco.egfHref ? (
          <a href={eco.egfHref} target="_blank" rel="noopener noreferrer" className={EGF_LINK_CLASS}>
            {tr('datatable.ecosystem.card.egf', 'EGF')}
            <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
          </a>
        ) : null}
      </TableCell>
    </TableRow>
  )
}

function InlineStat({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  const formatted = formatNumber(value, true, true)
  return (
    <span className="inline-flex items-center gap-1 [&_svg]:size-3.5" title={`${label}: ${formatted}`}>
      <span aria-hidden="true" className="inline-flex">
        {icon}
      </span>
      <span className="sr-only">{label}</span>
      {formatted}
    </span>
  )
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="@container/eco-table overflow-hidden rounded-xl bg-card shadow-card">
      <Table>
        <Head />
        <TableBody>{children}</TableBody>
      </Table>
    </div>
  )
}

export function EcosystemsTable({ ecosystems }: { ecosystems: EcosystemListItem[] }) {
  return (
    <Frame>
      {ecosystems.map((ecosystem) => (
        <EcosystemRow key={ecosystem.id} ecosystem={ecosystem} />
      ))}
    </Frame>
  )
}

export function EcosystemsTableSkeleton({ rows }: { rows: number }) {
  return (
    <div aria-hidden="true">
      <Frame>
        {Array.from({ length: rows }, (_, i) => (
          <TableRow key={i} className="h-16 hover:bg-transparent">
            <TableCell className="ps-4" colSpan={8}>
              <div className="flex items-center gap-3">
                <Shimmer className="size-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Shimmer className="h-4 w-48 max-w-full" />
                  <Shimmer className="h-3 w-64 max-w-full" />
                </div>
                <Shimmer className="hidden h-4 w-16 sm:block" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </Frame>
    </div>
  )
}

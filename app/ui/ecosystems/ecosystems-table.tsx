'use client'

import { ArrowUpRightIcon } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'
import { serviceAvatarUrl, serviceIdenticonUrl } from '@/lib/resolverClient'
import { cn } from '@/lib/utils'
import { DataTable, type DataTableColumn, dataTableColumns } from '@/ui/common/data-table/data-table'
import LogoImage from '@/ui/common/logo-image'
import { ToneTag } from '@/ui/common/tone-tag'
import TrustBadge from '@/ui/common/trust-badge'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import { ecosystemHref, useEcosystemIdentity } from '@/ui/ecosystems/ecosystem-identity'
import { statLabel, tr } from '@/ui/ecosystems/i18n'
import { formatNumber, formatVNAFromUVNA, shortenMiddle } from '@/util/util'

export type EcosystemTableRow = EcosystemListItem & { owned: boolean }

const EGF_LINK_CLASS =
  'inline-flex items-center gap-0.5 rounded-md px-1.5 py-1 text-xs font-medium text-primary outline-none transition-colors duration-(--duration-fast) hover:bg-tint-accent focus-visible:ring-[3px] focus-visible:ring-ring/50'

function IdentityCell({ row }: { row: EcosystemTableRow }) {
  const eco = useEcosystemIdentity(row, row.trustData)
  return (
    <div className="flex min-w-0 items-center gap-3">
      <LogoImage
        src={eco.identity?.serviceLogoUrl}
        fallbackSrc={serviceIdenticonUrl(row.did)}
        className={cn(
          'size-9 shrink-0 rounded-lg bg-background object-contain ring-1 ring-border',
          eco.archived && 'grayscale'
        )}
      />
      <div className="grid min-w-0 gap-0.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <Link
            href={ecosystemHref(row.id)}
            title={eco.nameIsDid ? row.did : eco.name}
            className={cn(
              'truncate rounded-sm font-medium tracking-[-0.01em] text-foreground outline-none hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50',
              eco.nameIsDid && 'font-mono text-[13px]'
            )}
          >
            {eco.nameIsDid ? shortenMiddle(row.did, 34) : eco.name}
          </Link>
          <TrustBadge state={eco.trustStatus} size="sm" />
          {row.owned ? (
            <ToneTag tone="accent" className="h-5">
              {tr('ecosystems.owned', 'Owned')}
            </ToneTag>
          ) : null}
          {eco.archived ? (
            <ToneTag dot className="h-5">
              {tr('ecosystems.card.archived', 'Archived')}
            </ToneTag>
          ) : null}
        </div>
        {eco.nameIsDid ? null : (
          <span className="truncate font-mono text-xs text-muted-foreground" title={row.did}>
            {shortenMiddle(row.did, 40)}
          </span>
        )}
      </div>
    </div>
  )
}

function OrganizationCell({ row }: { row: EcosystemTableRow }) {
  const eco = useEcosystemIdentity(row, row.trustData)
  if (!eco.orgName) return <span className="text-muted-foreground">—</span>
  return (
    <span className="flex max-w-52 min-w-0 items-center gap-2 text-muted-foreground">
      <LogoImage
        src={eco.identity?.organizationLogoUrl}
        fallbackSrc={serviceAvatarUrl(eco.orgName)}
        className="size-5 shrink-0 rounded-sm object-contain"
      />
      <span className="truncate" title={eco.orgName}>
        {eco.orgName}
      </span>
      {eco.flag ? (
        <span className="shrink-0" title={eco.countryCode} aria-hidden="true">
          {eco.flag}
        </span>
      ) : null}
    </span>
  )
}

function EgfCell({ row }: { row: EcosystemTableRow }) {
  const { egfHref } = useEcosystemIdentity(row, row.trustData)
  if (!egfHref) return null
  return (
    <a href={egfHref} target="_blank" rel="noopener noreferrer" className={EGF_LINK_CLASS}>
      {tr('datatable.ecosystem.card.egf', 'EGF')}
      <ArrowUpRightIcon className="size-3.5" aria-hidden="true" />
    </a>
  )
}

const NUM_HEAD = 'w-24 py-2 leading-tight whitespace-normal'

function count(value: number) {
  return <span className="font-medium tracking-[-0.01em]">{formatNumber(value, true, true)}</span>
}

const col = dataTableColumns<EcosystemTableRow>()

function buildColumns(): DataTableColumn<EcosystemTableRow>[] {
  return col.columns([
    col.accessor((row) => row.trustData?.serviceName ?? row.did, {
      id: 'ecosystem',
      header: tr('ecosystem.title', 'Ecosystem'),
      sortFn: 'text',
      meta: { mobile: 'primary', className: 'w-full max-w-0 min-w-64' },
      cell: ({ row }) => <IdentityCell row={row.original} />,
    }),
    col.accessor((row) => row.trustData?.organizationName ?? '', {
      id: 'organization',
      header: tr('ecosystems.table.organization', 'Organization'),
      sortFn: 'text',
      meta: { mobile: 'hidden', headerClassName: 'w-48' },
      cell: ({ row }) => <OrganizationCell row={row.original} />,
    }),
    col.accessor('activeSchemas', {
      header: statLabel('datatable.ecosystem.header.activeSchemas', 'Active Schemas'),
      sortFn: 'basic',
      enableGlobalFilter: false,
      meta: { align: 'end', mobile: 'field', headerClassName: NUM_HEAD },
      cell: ({ getValue }) => count(getValue()),
    }),
    col.accessor('participants', {
      header: statLabel('datatable.ecosystem.header.participants', 'Participants'),
      sortFn: 'basic',
      enableGlobalFilter: false,
      meta: { align: 'end', mobile: 'field', headerClassName: NUM_HEAD },
      cell: ({ getValue }) => count(getValue()),
    }),
    col.accessor((row) => Number(row.weight ?? 0), {
      id: 'weight',
      header: statLabel('datatable.ecosystem.card.trustValue', 'Trust Value'),
      sortFn: 'basic',
      enableGlobalFilter: false,
      meta: { align: 'end', mobile: 'hidden', headerClassName: NUM_HEAD, className: 'whitespace-nowrap' },
      cell: ({ row }) => (
        <span className="font-mono text-xs text-foreground">
          {formatVNAFromUVNA(row.original.weight == null ? null : String(row.original.weight))}
        </span>
      ),
    }),
    col.accessor('issued', {
      header: statLabel('datatable.ecosystem.header.issuedCredentials', 'Issued Credentials'),
      sortFn: 'basic',
      enableGlobalFilter: false,
      meta: { align: 'end', mobile: 'field', headerClassName: NUM_HEAD },
      cell: ({ getValue }) => count(getValue()),
    }),
    col.accessor('verified', {
      header: statLabel('datatable.ecosystem.header.verifiedCredentials', 'Verified Credentials'),
      sortFn: 'basic',
      enableGlobalFilter: false,
      meta: { align: 'end', mobile: 'hidden', headerClassName: NUM_HEAD },
      cell: ({ getValue }) => count(getValue()),
    }),
    col.display({
      id: 'egf',
      header: () => <span className="sr-only">{tr('datatable.ecosystem.card.egf', 'EGF')}</span>,
      enableSorting: false,
      meta: { align: 'end', mobile: 'end', label: tr('datatable.ecosystem.card.egf', 'EGF') },
      cell: ({ row }) => <EgfCell row={row.original} />,
    }),
  ])
}

export function EcosystemsTable({ rows, loading }: { rows: EcosystemTableRow[]; loading?: boolean }) {
  const columns = useMemo(buildColumns, [])
  return (
    <DataTable
      columns={columns}
      data={loading ? null : rows}
      label={tr('ecosystemList.title', 'Ecosystems')}
      getRowId={(row) => row.id}
      rowHref={(row) => ecosystemHref(row.id)}
      rowAttributes={(row) => ({ 'data-archived': row.archived ? 'true' : undefined })}
      skeletonRows={6}
    />
  )
}

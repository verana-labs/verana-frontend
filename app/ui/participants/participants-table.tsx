'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParticipants } from '@/hooks/useParticipants'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { DataTable, dataTableColumns } from '@/ui/common/data-table/data-table'
import { DataTableToolbar } from '@/ui/common/data-table/data-table-toolbar'
import { EmptyState } from '@/ui/common/empty-state'
import { ShowMoreButton } from '@/ui/common/keyset-pagination'
import { isParticipantShown, type ParticipantTreeFilterOptions } from '@/ui/common/participant-tree-filter'
import ServiceIdentity from '@/ui/common/service-identity'
import type { Participant, ParticipantRole } from '@/ui/dataview/datasections/participant'
import { resolveTranslatable } from '@/ui/dataview/types'
import { HiddenByFilters } from '@/ui/participants/tree-states'
import { formatNumber, formatVNAFromUVNA, participantStateBadgeClass, roleBadgeClass } from '@/util/util'

const ROLES: Array<{ role: ParticipantRole; key: string }> = [
  { role: 'ECOSYSTEM', key: 'ecosystem' },
  { role: 'ISSUER_GRANTOR', key: 'issuergrantor' },
  { role: 'VERIFIER_GRANTOR', key: 'verifiergrantor' },
  { role: 'ISSUER', key: 'issuer' },
  { role: 'VERIFIER', key: 'verifier' },
  { role: 'HOLDER', key: 'holder' },
]

const tr = (key: string, fallback: string) => resolveTranslatable({ key }, translate) ?? fallback

const PILL = 'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap'

function isRole(value: string): value is ParticipantRole {
  return ROLES.some((entry) => entry.role === value)
}

function roleName(role: string): string {
  const entry = ROLES.find((candidate) => candidate.role === role)
  return entry ? tr(`participantcard.role.singular.${entry.key}`, role) : role
}

function StateCell({ participant }: { participant: Participant }) {
  const badge = participantStateBadgeClass(participant.participant_state, false)
  if (!badge.labelParticipantState) return <span className="text-muted-foreground">-</span>
  return <span className={cn(PILL, badge.classParticipantState)}>{badge.labelParticipantState}</span>
}

function formatDay(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString()
}

export function ParticipantsTable({
  schemaId,
  selectedId,
  onSelect,
  filters,
  onShowAll,
  refreshToken,
}: {
  schemaId: string
  selectedId?: string
  onSelect: (id: string) => void
  filters: ParticipantTreeFilterOptions
  onShowAll: () => void
  refreshToken: number
}) {
  const [role, setRole] = useState<ParticipantRole>('ECOSYSTEM')
  const [search, setSearch] = useState('')
  const { participants, loading, errorParticipants, refetch, hasNext, loadMore } = useParticipants(schemaId, role)
  const shown = useMemo(
    () =>
      participants.filter((participant) =>
        isParticipantShown(participant, participant.trustData?.trustStatus, filters)
      ),
    [filters, participants]
  )
  const hiddenCount = participants.length - shown.length
  const refreshedWith = useRef(refreshToken)

  useEffect(() => {
    if (refreshedWith.current === refreshToken) return
    refreshedWith.current = refreshToken
    void refetch()
  }, [refetch, refreshToken])

  const columns = useMemo(() => {
    const col = dataTableColumns<Participant>()
    return col.columns([
      col.accessor((row) => row.trustData?.serviceName ?? row.did ?? row.id, {
        id: 'participant',
        header: tr('dataview.participant.fields.did', 'DID'),
        cell: ({ row }) => (
          <ServiceIdentity
            did={row.original.did ?? undefined}
            fallbackName={row.original.id}
            enrichment={row.original.trustData}
            showFlag={false}
            size="sm"
            className="max-w-full md:max-w-72 [&>span:first-of-type]:truncate"
          />
        ),
        meta: { mobile: 'primary' },
      }),
      col.accessor('role', {
        header: tr('dataview.participant.fields.role', 'Role'),
        cell: ({ row }) => (
          <span className={cn(PILL, roleBadgeClass(row.original.role))}>{roleName(row.original.role)}</span>
        ),
        meta: { mobile: 'field' },
      }),
      col.accessor((row) => row.participant_state ?? '', {
        id: 'state',
        header: tr('participants.table.state', 'State'),
        cell: ({ row }) => <StateCell participant={row.original} />,
        meta: { mobile: 'end' },
      }),
      col.accessor((row) => Number(row.deposit ?? 0), {
        id: 'deposit',
        header: tr('participantcard.meta.deposit', 'Deposit'),
        cell: ({ row }) => formatVNAFromUVNA(String(row.original.deposit ?? '0')) || '0',
        enableGlobalFilter: false,
        meta: { align: 'end', mobile: 'field', className: 'tabular-nums' },
      }),
      col.accessor((row) => Number(row.issued ?? 0), {
        id: 'issued',
        header: tr('participantcard.meta.issued', 'Issued'),
        cell: ({ row }) => formatNumber(row.original.issued, true),
        enableGlobalFilter: false,
        meta: { align: 'end', mobile: 'field', className: 'tabular-nums' },
      }),
      col.accessor((row) => Number(row.verified ?? 0), {
        id: 'verified',
        header: tr('participantcard.meta.verified', 'Verified'),
        cell: ({ row }) => formatNumber(row.original.verified, true),
        enableGlobalFilter: false,
        meta: { align: 'end', mobile: 'hidden', className: 'tabular-nums' },
      }),
      col.accessor((row) => row.created ?? '', {
        id: 'created',
        header: tr('participantcard.lifecycle.created', 'Created'),
        cell: ({ row }) => formatDay(row.original.created),
        enableGlobalFilter: false,
        meta: { align: 'end', mobile: 'hidden', className: 'tabular-nums text-muted-foreground' },
      }),
    ])
  }, [])

  const settled = !loading || participants.length > 0

  return (
    <div className="flex flex-col gap-3">
      <DataTableToolbar
        search={{ value: search, onChange: setSearch, label: tr('datatable.search', 'Search') }}
        scopes={{
          value: role,
          onChange: (next) => {
            if (isRole(next)) setRole(next)
          },
          label: tr('dataview.participant.fields.role', 'Role'),
          items: ROLES.map((entry) => ({
            value: entry.role,
            label: roleName(entry.role),
          })),
        }}
      />
      {hasNext ? (
        <p className="px-1 text-xs text-muted-foreground">
          {tr('pagination.loadedOnly', 'Sorting and filters apply to the loaded results only.')}
        </p>
      ) : null}
      {settled && shown.length > 0 ? <HiddenByFilters count={hiddenCount} all={false} onShowAll={onShowAll} /> : null}
      <DataTable
        columns={columns}
        data={settled ? shown : null}
        label={tr('participants.title', 'Participants')}
        getRowId={(row) => row.id}
        search={search}
        loading={loading && participants.length === 0}
        error={errorParticipants ? { message: errorParticipants, onRetry: () => void refetch() } : null}
        onRowClick={(row) => onSelect(row.id)}
        activeRowId={selectedId ?? null}
        rowAttributes={(row) => ({ 'data-participant-id': row.id })}
        variant="plain"
        empty={
          hiddenCount > 0 ? (
            <HiddenByFilters count={hiddenCount} all onShowAll={onShowAll} />
          ) : (
            <EmptyState outline={false} title={tr('participants.tree.empty', 'No participants yet.')} />
          )
        }
        footer={
          hasNext ? (
            <div className="px-1 pt-1">
              <ShowMoreButton onClick={() => void loadMore()} />
            </div>
          ) : undefined
        }
      />
    </div>
  )
}

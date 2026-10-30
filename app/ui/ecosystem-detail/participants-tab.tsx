'use client'

import { UsersIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { translate } from '@/i18n/dataview'
import { serviceIdenticonUrl } from '@/lib/resolverClient'
import { cn } from '@/lib/utils'
import { BlockHeader } from '@/ui/common/block-card'
import { DataTable, type DataTableColumn, dataTableColumns } from '@/ui/common/data-table/data-table'
import { DataTableToolbar } from '@/ui/common/data-table/data-table-toolbar'
import LogoImage from '@/ui/common/logo-image'
import { type Tone, ToneTag } from '@/ui/common/tone-tag'
import TrustBadge from '@/ui/common/trust-badge'
import type { CredentialSchemaListItem } from '@/ui/datatable/columnslist/cs'
import type { Participant, ParticipantRole, ParticipantState } from '@/ui/dataview/datasections/participant'
import {
  ECOSYSTEM_PARTICIPANTS_PER_SCHEMA,
  useEcosystemParticipants,
} from '@/ui/ecosystem-detail/use-ecosystem-participants'
import { participantCardHref, roleBadgeClass, shortenMiddle } from '@/util/util'

type Row = Participant & { schemaTitle: string }

const ROLES: ParticipantRole[] = ['ECOSYSTEM', 'ISSUER_GRANTOR', 'VERIFIER_GRANTOR', 'ISSUER', 'VERIFIER', 'HOLDER']

const STATE_TONE: Record<ParticipantState, Tone> = {
  ACTIVE: 'success',
  FUTURE: 'info',
  EXPIRED: 'neutral',
  INACTIVE: 'neutral',
  REPAID: 'warning',
  REVOKED: 'destructive',
  SLASHED: 'destructive',
}

function roleLabel(role: ParticipantRole): string {
  return translate(`participantcard.role.singular.${role.toLowerCase().replace('_', '')}`)
}

function participantName(row: Row): string | undefined {
  return row.trustData?.serviceName ?? row.trustData?.organizationName ?? undefined
}

function ParticipantCell({ row }: { row: Row }) {
  const name = participantName(row)
  return (
    <div className="flex min-w-0 items-center gap-3">
      <LogoImage
        src={row.trustData?.serviceLogoUrl}
        fallbackSrc={serviceIdenticonUrl(row.did ?? row.id)}
        className="size-8 shrink-0 rounded-lg bg-background object-contain ring-1 ring-border"
      />
      <div className="grid min-w-0 gap-0.5">
        <span className="flex min-w-0 items-center gap-1.5">
          <span
            className={name ? 'truncate font-medium text-foreground' : 'truncate font-mono text-[13px] text-foreground'}
            title={row.did ?? undefined}
          >
            {name ?? (row.did ? shortenMiddle(row.did, 32) : `#${row.id}`)}
          </span>
          <TrustBadge state={row.trustData?.trustStatus} size="sm" />
        </span>
        {name && row.did ? (
          <span className="truncate font-mono text-xs text-muted-foreground" title={row.did}>
            {shortenMiddle(row.did, 40)}
          </span>
        ) : null}
      </div>
    </div>
  )
}

const col = dataTableColumns<Row>()

function buildColumns(): DataTableColumn<Row>[] {
  return col.columns([
    col.accessor((row) => participantName(row) ?? row.did ?? row.id, {
      id: 'participant',
      header: translate('corporation.page.agents.participant'),
      sortFn: 'text',
      meta: { mobile: 'primary', className: 'w-full max-w-0 min-w-56' },
      cell: ({ row }) => <ParticipantCell row={row.original} />,
    }),
    col.accessor((row) => roleLabel(row.role), {
      id: 'role',
      header: translate('dataview.participant.fields.role'),
      sortFn: 'text',
      meta: { mobile: 'field', className: 'whitespace-nowrap' },
      cell: ({ row }) => (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
            roleBadgeClass(row.original.role)
          )}
        >
          {roleLabel(row.original.role)}
        </span>
      ),
    }),
    col.accessor('schemaTitle', {
      header: translate('agents.card.schema'),
      sortFn: 'text',
      meta: { mobile: 'field' },
      cell: ({ row }) => (
        <span className="block max-w-56 truncate" title={row.original.schemaTitle}>
          {row.original.schemaTitle}
        </span>
      ),
    }),
    col.accessor('participant_state', {
      header: translate('datalist.egf.header.status'),
      sortFn: 'text',
      meta: { mobile: 'end' },
      cell: ({ row }) => (
        <span className="flex flex-wrap items-center gap-1">
          <ToneTag tone={STATE_TONE[row.original.participant_state] ?? 'neutral'} dot className="lowercase">
            {translate(`participant.labelstate.${String(row.original.participant_state ?? '').toLowerCase()}`)}
          </ToneTag>
          {row.original.op_state === 'PENDING' ? (
            <ToneTag tone="warning">{translate('participant.labelopstate.pending')}</ToneTag>
          ) : null}
        </span>
      ),
    }),
  ])
}

export function EcosystemParticipantsTab({
  schemas,
  schemasPartial,
  schemasLoading,
  active,
}: {
  schemas: CredentialSchemaListItem[]
  schemasPartial: boolean
  schemasLoading: boolean
  active: boolean
}) {
  const schemaIds = useMemo(() => schemas.map((schema) => schema.id), [schemas])
  const titles = useMemo(
    () => new Map(schemas.map((schema) => [schema.id, schema.title || `#${schema.id}`])),
    [schemas]
  )
  const { participants, partial, error, refetch } = useEcosystemParticipants(schemaIds, active && !schemasLoading)
  const [search, setSearch] = useState('')
  const [roles, setRoles] = useState<string[]>([])
  const columns = useMemo(buildColumns, [])

  const rows = useMemo<Row[] | null>(
    () =>
      participants
        ? participants.map((participant) => ({
            ...participant,
            schemaTitle: titles.get(participant.schema_id) ?? `#${participant.schema_id}`,
          }))
        : null,
    [participants, titles]
  )
  const visible = rows && roles.length > 0 ? rows.filter((row) => roles.includes(row.role)) : rows
  const roleOptions = ROLES.map((role) => ({
    value: role,
    label: roleLabel(role),
    count: rows?.filter((row) => row.role === role).length ?? 0,
  })).filter((option) => option.count > 0 || roles.includes(option.value))

  return (
    <section className="flex flex-col gap-4">
      <BlockHeader
        icon={<UsersIcon />}
        title={translate('participants.title')}
        caption={translate('ecosystem.participants.description')}
      />
      <DataTableToolbar
        search={{
          value: search,
          onChange: setSearch,
          label: translate('datatable.search'),
          placeholder: translate('datatable.search'),
        }}
        filters={
          roleOptions.length > 0
            ? [
                {
                  id: 'role',
                  label: translate('dataview.participant.fields.role'),
                  options: roleOptions,
                  selected: roles,
                  onChange: setRoles,
                },
              ]
            : undefined
        }
      />
      <DataTable
        columns={columns}
        data={schemasLoading ? null : schemaIds.length === 0 ? [] : visible}
        label={translate('participants.title')}
        getRowId={(row) => row.id}
        rowHref={(row) => participantCardHref(row.schema_id)}
        search={search}
        pageSize={10}
        error={error ? { message: translate('participants.tree.error'), onRetry: refetch } : null}
        empty={translate('participants.tree.empty')}
      />
      {partial || schemasPartial ? (
        <p className="text-xs text-muted-foreground">
          {partial
            ? translate('ecosystem.participants.partial', { count: ECOSYSTEM_PARTICIPANTS_PER_SCHEMA })
            : translate('ecosystem.participants.schemasPartial')}
        </p>
      ) : null}
    </section>
  )
}

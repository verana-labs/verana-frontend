import { translate } from '@/i18n/dataview'
import type { ParticipantRole } from '@/ui/dataview/datasections/participant'
import { roleBadgeClass } from '@/util/util'

const ROLE_PILL_CLASS =
  'inline-flex h-5 min-w-0 max-w-[8.5rem] items-center rounded-full px-2 text-[11px] font-medium tracking-wide'
const CONTROLLED_PILL_CLASS = 'bg-tint-accent text-primary'
const VISIBLE_PILLS = 2

type Pill = { key: string; label: string; className: string }

export function RolePills({ roles, controlled = false }: { roles: ParticipantRole[]; controlled?: boolean }) {
  const pills: Pill[] = [
    ...(controlled
      ? [{ key: 'controlled', label: translate('roles.controlled'), className: CONTROLLED_PILL_CLASS }]
      : []),
    ...roles.map((role) => ({ key: role, label: role, className: roleBadgeClass(role) })),
  ]
  const visible = pills.slice(0, VISIBLE_PILLS)
  const hidden = pills.slice(VISIBLE_PILLS)

  if (pills.length === 0) return <span className="sr-only">{translate('datatable.ecosystem.card.noRoles')}</span>
  return (
    <>
      {visible.map((pill) => (
        <span key={pill.key} className={`${ROLE_PILL_CLASS} ${pill.className}`} title={pill.label}>
          <span className="truncate">{pill.label}</span>
        </span>
      ))}
      {hidden.length > 0 ? (
        <span
          className="inline-flex h-5 shrink-0 items-center rounded-full bg-muted px-2 text-[11px] font-medium tracking-wide text-muted-foreground"
          title={hidden.map((pill) => pill.label).join(', ')}
        >
          +{hidden.length}
        </span>
      ) : null}
    </>
  )
}

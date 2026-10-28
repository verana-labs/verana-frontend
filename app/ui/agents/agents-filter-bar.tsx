'use client'

import { translate } from '@/i18n/dataview'

export type AgentsFilterState = {
  includeInactive: boolean
  showUnverifiable: boolean
}

export const INITIAL_AGENTS_FILTER: AgentsFilterState = { includeInactive: false, showUnverifiable: false }

function FilterSwitch({
  id,
  checked,
  onChange,
  label,
}: {
  id: string
  checked: boolean
  onChange: (next: boolean) => void
  label: string
}) {
  return (
    <label
      htmlFor={id}
      className="flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors duration-(--duration-base) ease-standard hover:bg-muted/50 has-checked:border-primary/30 has-checked:bg-primary/5 has-focus-visible:ring-3 has-focus-visible:ring-ring/50 dark:has-checked:bg-primary/10"
    >
      <span className="relative inline-flex h-5 w-9 shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer absolute inset-0 size-full cursor-pointer appearance-none rounded-full border-0 bg-neutral-300 bg-none p-0 shadow-none outline-none checked:bg-none transition-colors duration-(--duration-base) ease-standard checked:bg-primary dark:bg-input dark:checked:bg-primary"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none relative ms-0.5 size-4 rounded-full bg-white shadow-sm transition-transform duration-(--duration-base) ease-emphasized peer-checked:translate-x-4 rtl:peer-checked:-translate-x-4"
        />
      </span>
      <span className="min-w-0">{label}</span>
    </label>
  )
}

export default function AgentsFilterBar({
  value,
  onChange,
}: {
  value: AgentsFilterState
  onChange: (next: AgentsFilterState) => void
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <FilterSwitch
        id="agents-include-inactive"
        checked={value.includeInactive}
        onChange={(includeInactive) => onChange({ ...value, includeInactive })}
        label={translate('agents.filter.includeInactive')}
      />
      <FilterSwitch
        id="agents-show-unverifiable"
        checked={value.showUnverifiable}
        onChange={(showUnverifiable) => onChange({ ...value, showUnverifiable })}
        label={translate('agents.filter.showUnverifiable')}
      />
    </div>
  )
}

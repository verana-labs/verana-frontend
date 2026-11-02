'use client'

import { translate } from '@/i18n/dataview'
import { Checkbox } from '@/ui/common/ecosystems-filter-bar'

export type AgentsFilterState = {
  includeInactive: boolean
  showUnverifiable: boolean
}

export const INITIAL_AGENTS_FILTER: AgentsFilterState = { includeInactive: false, showUnverifiable: false }

export default function AgentsFilterBar({
  value,
  onChange,
}: {
  value: AgentsFilterState
  onChange: (next: AgentsFilterState) => void
}) {
  return (
    <section className="mb-6">
      <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Checkbox
            id="agents-include-inactive"
            checked={value.includeInactive}
            onChange={(includeInactive) => onChange({ ...value, includeInactive })}
            label={translate('agents.filter.includeInactive')}
          />
          <Checkbox
            id="agents-show-unverifiable"
            checked={value.showUnverifiable}
            onChange={(showUnverifiable) => onChange({ ...value, showUnverifiable })}
            label={translate('agents.filter.showUnverifiable')}
          />
        </div>
      </div>
    </section>
  )
}

'use client'

import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { translate } from '@/i18n/dataview'

export type EcosystemMembershipFilter = 'all' | 'controlled' | 'joined'

const MEMBERSHIP_FILTERS: EcosystemMembershipFilter[] = ['all', 'controlled', 'joined']

export type EcosystemsFilterState = {
  search: string
  showArchived: boolean
  membership: EcosystemMembershipFilter
}

export const INITIAL_ECOSYSTEMS_FILTER: EcosystemsFilterState = {
  search: '',
  showArchived: false,
  membership: 'all',
}

function isMembershipFilter(value: string): value is EcosystemMembershipFilter {
  return MEMBERSHIP_FILTERS.some((filter) => filter === value)
}

type Props = {
  value: EcosystemsFilterState
  onChange: (next: EcosystemsFilterState) => void
}

export default function EcosystemsFilterBar({ value, onChange }: Props) {
  const set = <K extends keyof EcosystemsFilterState>(key: K, next: EcosystemsFilterState[K]) =>
    onChange({ ...value, [key]: next })

  return (
    <section className="mb-6">
      <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 sm:p-6">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="ecosystem-search"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {translate('datatable.ecosystem.filter.search.label')}
            </label>
            <div className="relative">
              <input
                id="ecosystem-search"
                type="text"
                value={value.search}
                onChange={(e) => set('search', e.target.value)}
                placeholder={translate('datatable.ecosystem.filter.search.placeholder')}
                className="w-full px-4 py-2.5 pr-10 border border-neutral-20 dark:border-neutral-70 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-surface text-gray-900 dark:text-white"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <FontAwesomeIcon icon={faMagnifyingGlass} className="text-neutral-70 dark:text-neutral-70" />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <label
              className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
              htmlFor="ecosystem-membership"
            >
              <span>{translate('datatable.ecosystem.filter.membership.label')}</span>
              <select
                id="ecosystem-membership"
                value={value.membership}
                onChange={(e) => {
                  if (isMembershipFilter(e.target.value)) set('membership', e.target.value)
                }}
                className="px-3 py-1.5 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-surface text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {MEMBERSHIP_FILTERS.map((filter) => (
                  <option key={filter} value={filter}>
                    {translate(`datatable.ecosystem.filter.membership.${filter}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer" htmlFor="show-archived">
              <input
                id="show-archived"
                type="checkbox"
                checked={value.showArchived}
                onChange={(e) => set('showArchived', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-neutral-20 dark:border-neutral-70 rounded focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {translate('datatable.ecosystem.filter.showArchived')}
              </span>
            </label>
          </div>
        </div>
      </div>
    </section>
  )
}

'use client'

import { ArrowDownWideNarrowIcon, InfoIcon, SearchIcon, XIcon } from 'lucide-react'
import type { DiscoverFilters as DiscoverFilterState, EcosystemOrder } from '@/lib/discover-list'
import { cn } from '@/lib/utils'
import { NativeSelect, NativeSelectOption } from '@/ui/discover/native-select'
import { discoverText as t } from '@/ui/discover/text'
import { Checkbox } from '@/ui/shadcn/checkbox'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/ui/shadcn/input-group'

type BooleanFilter = 'showArchived' | 'hideOwned' | 'hideParticipant' | 'showUntrusted'

type DiscoverFiltersProps = {
  value: DiscoverFilterState
  onChange: (next: DiscoverFilterState) => void
  corporationFilters: boolean
  loadedOnly: boolean
}

const CHIPS: Array<{ id: string; key: BooleanFilter; label: string; corporation?: boolean }> = [
  { id: 'show-archived', key: 'showArchived', label: 'datatable.ecosystem.filter.showArchived' },
  { id: 'hide-owned', key: 'hideOwned', label: 'datatable.ecosystem.filter.hideOwned', corporation: true },
  {
    id: 'hide-participant',
    key: 'hideParticipant',
    label: 'datatable.ecosystem.filter.hideParticipant',
    corporation: true,
  },
  { id: 'show-untrusted', key: 'showUntrusted', label: 'datatable.ecosystem.filter.showUntrusted' },
]

function FilterChip({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (next: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm whitespace-nowrap select-none sm:h-8 sm:px-3',
        'transition-[color,background-color,border-color] duration-(--duration-base) ease-standard',
        'has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50',
        checked
          ? 'border-primary/40 bg-primary/10 text-primary'
          : 'border-border bg-background text-muted-foreground hover:border-ring/60 hover:text-foreground dark:bg-input/30'
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(next) => onCheckedChange(next === true)}
        className="size-3.5 rounded-[4px] focus-visible:ring-0 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground [&_svg]:size-3"
      />
      {label}
    </label>
  )
}

export function DiscoverFilters({ value, onChange, corporationFilters, loadedOnly }: DiscoverFiltersProps) {
  const set = (next: Partial<DiscoverFilterState>) => onChange({ ...value, ...next })
  const chips = CHIPS.filter((chip) => corporationFilters || !chip.corporation)

  return (
    <section className="mb-6 rounded-xl bg-card p-4 text-card-foreground shadow-card sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="ecosystem-search" className="mb-2 block text-sm font-medium text-foreground">
            {t('datatable.ecosystem.filter.search.label')}
          </label>
          <InputGroup className="h-10 rounded-lg bg-background dark:bg-input/30">
            <InputGroupAddon className="pl-3">
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              id="ecosystem-search"
              type="search"
              autoComplete="off"
              value={value.search}
              onChange={(event) => set({ search: event.target.value })}
              placeholder={t('datatable.ecosystem.filter.search.placeholder')}
              className="text-base sm:text-sm [&::-webkit-search-cancel-button]:hidden"
            />
            {value.search ? (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  aria-label={t('discover.search.clear')}
                  onClick={() => set({ search: '' })}
                >
                  <XIcon aria-hidden="true" />
                </InputGroupButton>
              </InputGroupAddon>
            ) : null}
          </InputGroup>
        </div>
        <div className="sm:w-52">
          <label
            htmlFor="discover-order"
            className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground"
          >
            <ArrowDownWideNarrowIcon aria-hidden="true" className="size-4 text-muted-foreground" />
            {t('discover.order.label')}
          </label>
          <NativeSelect
            id="discover-order"
            value={value.order}
            className="h-10"
            onChange={(event) =>
              set({ order: (event.target.value === 'trustValue' ? 'trustValue' : 'newest') satisfies EcosystemOrder })
            }
          >
            <NativeSelectOption value="newest">{t('discover.order.newest')}</NativeSelectOption>
            <NativeSelectOption value="trustValue">{t('discover.order.trustValue')}</NativeSelectOption>
          </NativeSelect>
        </div>
      </div>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 py-1 [mask-image:linear-gradient(to_right,transparent,black_1rem,black_calc(100%-1rem),transparent)] [scrollbar-width:none] sm:mx-0 sm:mt-4 sm:flex-wrap sm:overflow-visible sm:px-0 sm:[mask-image:none]">
        {chips.map((chip) => (
          <FilterChip
            key={chip.id}
            id={chip.id}
            label={t(chip.label)}
            checked={value[chip.key]}
            onCheckedChange={(next) => set({ [chip.key]: next })}
          />
        ))}
      </div>

      {loadedOnly ? (
        <p className="mt-4 flex items-center gap-1.5 border-t pt-3 text-xs text-muted-foreground">
          <InfoIcon aria-hidden="true" className="size-3.5 shrink-0" />
          {t('pagination.loadedOnly')}
        </p>
      ) : null}
    </section>
  )
}

'use client'

import { CheckIcon, SearchIcon, XIcon } from 'lucide-react'
import { type ReactNode, useEffect, useRef } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { tr as t } from '@/ui/ecosystems/i18n'
import { Button } from '@/ui/shadcn/button'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/ui/shadcn/input-group'
import { Kbd } from '@/ui/shadcn/kbd'

export type EcosystemsFilterState = {
  search: string
  showArchived: boolean
  hideOwned: boolean
  hideParticipant: boolean
  showUntrusted: boolean
}

export const INITIAL_ECOSYSTEMS_FILTER: EcosystemsFilterState = {
  search: '',
  showArchived: false,
  hideOwned: false,
  hideParticipant: false,
  showUntrusted: false,
}

type Props = {
  value: EcosystemsFilterState
  onChange: (next: EcosystemsFilterState) => void
  corporationFilters?: boolean
  actions?: ReactNode
  children?: ReactNode
}

export function hasActiveEcosystemFilters(value: EcosystemsFilterState): boolean {
  return (Object.keys(INITIAL_ECOSYSTEMS_FILTER) as (keyof EcosystemsFilterState)[]).some(
    (key) => value[key] !== INITIAL_ECOSYSTEMS_FILTER[key]
  )
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

export default function EcosystemsFilterBar({ value, onChange, corporationFilters = true, actions, children }: Props) {
  const searchRef = useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()

  const set = <K extends keyof EcosystemsFilterState>(key: K, next: EcosystemsFilterState[K]) =>
    onChange({ ...value, [key]: next })

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return
      if (document.querySelector('[data-modal-action]:not(.hidden), [role="dialog"]')) return
      event.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <section className="mb-6 space-y-3">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1 sm:max-w-lg">
          <label htmlFor="ecosystem-search" className="sr-only">
            {t('datatable.ecosystem.filter.search.label', 'Search Ecosystems')}
          </label>
          <InputGroup className="h-9 bg-card shadow-xs dark:bg-input/30">
            <InputGroupAddon>
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              ref={searchRef}
              id="ecosystem-search"
              type="text"
              value={value.search}
              onChange={(e) => set('search', e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && value.search) {
                  e.preventDefault()
                  set('search', '')
                }
              }}
              placeholder={
                isMobile
                  ? t('ecosystems.search.placeholderShort', 'Search ecosystems…')
                  : t(
                      'datatable.ecosystem.filter.search.placeholder',
                      'Search by organization name, ecosystem, or other attributes...'
                    )
              }
              className="text-sm text-ellipsis"
            />
            <InputGroupAddon align="inline-end">
              {value.search ? (
                <InputGroupButton
                  size="icon-xs"
                  aria-label={t('ecosystems.search.clear', 'Clear search')}
                  onClick={() => {
                    set('search', '')
                    searchRef.current?.focus()
                  }}
                >
                  <XIcon />
                </InputGroupButton>
              ) : (
                <Kbd aria-hidden="true" className="hidden sm:inline-flex">
                  /
                </Kbd>
              )}
            </InputGroupAddon>
          </InputGroup>
        </div>
        {actions ? <div className="ms-auto flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>

      <div className="-mx-4 -my-1 flex min-w-0 snap-x scroll-px-4 items-center gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] max-sm:pe-10 max-sm:[mask-image:linear-gradient(to_right,black_calc(100%-2.5rem),transparent)] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
        <FilterChip
          id="show-archived"
          checked={value.showArchived}
          onChange={(v) => set('showArchived', v)}
          label={t('datatable.ecosystem.filter.showArchived', 'Show archived')}
        />
        {corporationFilters ? (
          <>
            <FilterChip
              id="hide-owned"
              checked={value.hideOwned}
              onChange={(v) => set('hideOwned', v)}
              label={t('datatable.ecosystem.filter.hideOwned', 'Hide owned ecosystems')}
            />
            <FilterChip
              id="hide-participant"
              checked={value.hideParticipant}
              onChange={(v) => set('hideParticipant', v)}
              label={t('datatable.ecosystem.filter.hideParticipant', 'Hide participant ecosystems')}
            />
          </>
        ) : null}
        <FilterChip
          id="show-untrusted"
          checked={value.showUntrusted}
          onChange={(v) => set('showUntrusted', v)}
          label={t('datatable.ecosystem.filter.showUntrusted', 'Show untrusted ecosystems')}
        />
        {hasActiveEcosystemFilters(value) ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 text-muted-foreground"
            onClick={() => onChange({ ...INITIAL_ECOSYSTEMS_FILTER })}
          >
            {t('ecosystems.filter.clear', 'Clear filters')}
            <XIcon data-icon="inline-end" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      {children ? <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">{children}</div> : null}
    </section>
  )
}

const CHECK_INPUT_CLASS =
  'peer size-4 shrink-0 cursor-pointer appearance-none rounded-[4px] border border-input bg-background shadow-xs transition-colors duration-(--duration-fast) checked:border-primary checked:bg-primary checked:bg-none focus:ring-0 focus:ring-offset-0 focus:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30 dark:checked:bg-primary'

export function CheckboxMark({
  id,
  checked,
  onChange,
  className,
}: {
  id: string
  checked: boolean
  onChange: (next: boolean) => void
  className?: string
}) {
  return (
    <span className={cn('relative inline-flex size-4 shrink-0 items-center justify-center', className)}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={CHECK_INPUT_CLASS}
      />
      <CheckIcon
        aria-hidden="true"
        strokeWidth={3}
        className="pointer-events-none absolute size-3 text-primary-foreground opacity-0 transition-opacity duration-(--duration-fast) peer-checked:opacity-100"
      />
    </span>
  )
}

export function FilterChip({
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
      className="inline-flex h-8 shrink-0 cursor-pointer snap-start items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-[13px] font-medium text-muted-foreground shadow-xs transition-[color,background-color,border-color] duration-(--duration-base) ease-standard select-none hover:border-foreground/20 hover:text-foreground has-checked:border-primary/30 hover:has-checked:border-primary/40 has-checked:bg-primary/10 has-checked:text-primary has-focus-visible:ring-[3px] has-focus-visible:ring-ring/50 dark:bg-input/30 dark:has-checked:bg-primary/20"
    >
      <CheckboxMark id={id} checked={checked} onChange={onChange} className="[&_input]:shadow-none" />
      <span className="whitespace-nowrap">{label}</span>
    </label>
  )
}

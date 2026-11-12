'use client'

import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { CheckIcon, ChevronsUpDownIcon, LoaderCircleIcon, SearchIcon } from 'lucide-react'
import { Fragment, type ReactNode, useState } from 'react'
import { canonicalizeLanguageTag, type LanguageOption, useLanguageData } from '@/lib/language'
import { cn } from '@/lib/utils'

type LanguageComboboxProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

const VISIBLE_LIMIT = 50

export function LanguageCombobox({ value, onChange, disabled = false, className = '' }: LanguageComboboxProps) {
  const [query, setQuery] = useState('')
  const { options, loadFailed, retry } = useLanguageData()

  const matches =
    query === '' ? options : options.filter((opt) => opt.label.toLowerCase().includes(query.toLowerCase()))
  const visible = matches.slice(0, VISIBLE_LIMIT)
  const hiddenCount = matches.length - visible.length

  const canonicalValue = canonicalizeLanguageTag(value)
  const selected = options.find((o) => o.value === value || o.value === canonicalValue) ?? null

  let content: ReactNode
  if (loadFailed) {
    content = (
      <div className="px-2.5 py-2 text-sm text-destructive">
        Could not load languages.{' '}
        <button
          type="button"
          onClick={retry}
          className="rounded-sm font-medium underline underline-offset-4 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Retry
        </button>
      </div>
    )
  } else if (options.length === 0) {
    content = (
      <div className="flex items-center gap-2 px-2.5 py-2 text-sm text-muted-foreground">
        <LoaderCircleIcon aria-hidden="true" className="size-3.5 animate-spin" />
        Loading languages…
      </div>
    )
  } else if (visible.length === 0) {
    content = <div className="px-2.5 py-6 text-center text-sm text-muted-foreground">No languages found.</div>
  } else {
    content = (
      <>
        {visible.map((opt, i) => (
          <Fragment key={opt.value}>
            {!query && i > 0 && visible[i - 1]?.pinned && !opt.pinned && (
              <div aria-hidden="true" className="-mx-1 my-1 h-px bg-border" />
            )}
            <ComboboxOption
              value={opt}
              className="group relative flex cursor-pointer items-center gap-2 rounded-sm py-1.5 ps-2.5 pe-8 text-sm text-foreground outline-none select-none data-focus:bg-accent data-focus:text-accent-foreground"
            >
              <span className="block truncate group-data-[selected]:font-medium">{opt.label}</span>
              <CheckIcon
                className="absolute end-2.5 hidden size-4 text-primary group-data-[selected]:block"
                aria-hidden="true"
              />
            </ComboboxOption>
          </Fragment>
        ))}
        {hiddenCount > 0 && (
          <div className="-mx-1 mt-1 border-t border-border px-3.5 pt-2 pb-1 text-xs text-muted-foreground">
            {hiddenCount} more, type to narrow your search
          </div>
        )}
      </>
    )
  }

  return (
    <Combobox
      value={selected}
      onChange={(opt: LanguageOption | null) => onChange(opt?.value ?? '')}
      disabled={disabled}
      immediate
    >
      <div className="relative">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-muted-foreground"
        />
        <ComboboxInput
          className={cn('input ps-9 pe-10', className)}
          displayValue={(opt: LanguageOption | null) => opt?.label ?? value}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search languages…"
        />
        <ComboboxButton className="absolute inset-y-0 end-0 flex items-center rounded-e-lg pe-3 ps-2 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground">
          <ChevronsUpDownIcon className="size-4" aria-hidden="true" />
        </ComboboxButton>

        <ComboboxOptions
          anchor="bottom"
          transition
          className="z-50 max-h-60! w-[var(--input-width)] origin-top overflow-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-overlay [--anchor-gap:--spacing(1)] transition duration-(--duration-fast) ease-standard focus:outline-hidden data-closed:scale-95 data-closed:opacity-0"
        >
          {content}
        </ComboboxOptions>
      </div>
    </Combobox>
  )
}

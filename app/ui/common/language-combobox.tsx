'use client'

import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'
import { Fragment, type ReactNode, useState } from 'react'
import { canonicalizeLanguageTag, type LanguageOption, useLanguageData } from '@/lib/language'

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
      <div className="px-4 py-2 text-sm text-red-500">
        Could not load languages.{' '}
        <button type="button" onClick={retry} className="underline">
          Retry
        </button>
      </div>
    )
  } else if (options.length === 0) {
    content = <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">Loading languages…</div>
  } else if (visible.length === 0) {
    content = <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No languages found.</div>
  } else {
    content = (
      <>
        {visible.map((opt, i) => (
          <Fragment key={opt.value}>
            {!query && i > 0 && visible[i - 1]?.pinned && !opt.pinned && (
              <div className="border-t border-neutral-20 dark:border-neutral-70 my-1" />
            )}
            <ComboboxOption
              value={opt}
              className="group relative cursor-pointer select-none py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-white data-[focus]:bg-primary-500 data-[focus]:text-white"
            >
              <span className="block truncate group-data-[selected]:font-semibold">{opt.label}</span>
              <span className="absolute inset-y-0 left-0 hidden items-center pl-3 text-primary-600 group-data-[focus]:text-white group-data-[selected]:flex">
                <CheckIcon className="h-5 w-5" aria-hidden="true" />
              </span>
            </ComboboxOption>
          </Fragment>
        ))}
        {hiddenCount > 0 && (
          <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-neutral-20 dark:border-neutral-70">
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
        <ComboboxInput
          className={`input pr-10 ${className}`}
          displayValue={(opt: LanguageOption | null) => opt?.label ?? value}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search languages…"
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </ComboboxButton>

        <ComboboxOptions
          anchor="bottom"
          className="z-50 max-h-60 w-[var(--input-width)] overflow-auto rounded-lg border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-surface py-1 shadow-lg focus:outline-none"
        >
          {content}
        </ComboboxOptions>
      </div>
    </Combobox>
  )
}

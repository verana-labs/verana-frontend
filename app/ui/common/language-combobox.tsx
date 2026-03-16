'use client';

import { useState } from 'react';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { languageOptions, LanguageOption } from '@/ui/dataview/datasections/gfd';

type LanguageComboboxProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

export function LanguageCombobox({ value, onChange, disabled = false, className = '' }: LanguageComboboxProps) {
  const [query, setQuery] = useState('');

  const filtered = query === ''
    ? languageOptions
    : languageOptions.filter((opt) =>
        opt.label.toLowerCase().includes(query.toLowerCase())
      );

  const selected = languageOptions.find((o) => o.value === value) ?? null;

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
          displayValue={(opt: LanguageOption | null) => opt?.label ?? ''}
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
          {filtered.length === 0 ? (
            <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
              No languages found.
            </div>
          ) : (
            filtered.map((opt, i) => (
              <span key={opt.value}>
                {/* Divider between pinned and rest (only when not searching) */}
                {!query && i > 0 && filtered[i - 1]?.pinned && !opt.pinned && (
                  <div className="border-t border-neutral-20 dark:border-neutral-70 my-1" />
                )}
                <ComboboxOption
                  value={opt}
                  className="group relative cursor-pointer select-none py-2 pl-10 pr-4 text-sm text-gray-900 dark:text-white data-[focus]:bg-primary-500 data-[focus]:text-white"
                >
                  <span className="block truncate group-data-[selected]:font-semibold">
                    {opt.label}
                  </span>
                  <span className="absolute inset-y-0 left-0 hidden items-center pl-3 text-primary-600 group-data-[focus]:text-white group-data-[selected]:flex">
                    <CheckIcon className="h-5 w-5" aria-hidden="true" />
                  </span>
                </ComboboxOption>
              </span>
            ))
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}

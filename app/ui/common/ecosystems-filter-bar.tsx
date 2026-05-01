'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { translate } from '@/i18n/dataview';
import { resolveTranslatable } from '@/ui/dataview/types';

export type EcosystemsFilterState = {
  search: string;
  showArchived: boolean;
  hideOwned: boolean;
  hideParticipant: boolean;
  showUntrusted: boolean;
};

export const INITIAL_ECOSYSTEMS_FILTER: EcosystemsFilterState = {
  search: '',
  showArchived: false,
  hideOwned: false,
  hideParticipant: false,
  showUntrusted: false,
};

type Props = {
  value: EcosystemsFilterState;
  onChange: (next: EcosystemsFilterState) => void;
};

export default function EcosystemsFilterBar({ value, onChange }: Props) {
  const t = (key: string, fallback: string) =>
    resolveTranslatable({ key }, translate) ?? fallback;

  const set = <K extends keyof EcosystemsFilterState>(
    key: K,
    next: EcosystemsFilterState[K],
  ) => onChange({ ...value, [key]: next });

  return (
    <section className="mb-6">
      <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-4 sm:p-6">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="ecosystem-search"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {t('datatable.tr.filter.search.label', 'Search Ecosystems')}
            </label>
            <div className="relative">
              <input
                id="ecosystem-search"
                type="text"
                value={value.search}
                onChange={(e) => set('search', e.target.value)}
                placeholder={t(
                  'datatable.tr.filter.search.placeholder',
                  'Search by organization name, trust registry, or other attributes...',
                )}
                className="w-full px-4 py-2.5 pr-10 border border-neutral-20 dark:border-neutral-70 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-surface text-gray-900 dark:text-white"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="text-neutral-70 dark:text-neutral-70"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Checkbox
              id="show-archived"
              checked={value.showArchived}
              onChange={(v) => set('showArchived', v)}
              label={t('datatable.tr.filter.showArchived', 'Show archived')}
            />
            <Checkbox
              id="hide-owned"
              checked={value.hideOwned}
              onChange={(v) => set('hideOwned', v)}
              label={t('datatable.tr.filter.hideOwned', 'Hide owned ecosystems')}
            />
            <Checkbox
              id="hide-participant"
              checked={value.hideParticipant}
              onChange={(v) => set('hideParticipant', v)}
              label={t(
                'datatable.tr.filter.hideParticipant',
                'Hide participant ecosystems',
              )}
            />
            <Checkbox
              id="show-untrusted"
              checked={value.showUntrusted}
              onChange={(v) => set('showUntrusted', v)}
              label={t(
                'datatable.tr.filter.showUntrusted',
                'Show untrusted ecosystems',
              )}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Checkbox({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center space-x-2 cursor-pointer" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-primary-600 border-neutral-20 dark:border-neutral-70 rounded focus:ring-2 focus:ring-primary-500"
      />
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    </label>
  );
}

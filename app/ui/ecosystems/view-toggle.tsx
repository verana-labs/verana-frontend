'use client'

import { LayoutGridIcon, ListIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { SegmentedControl } from '@/ui/common/segmented-control'
import { tr } from '@/ui/ecosystems/i18n'

export type EcosystemsView = 'grid' | 'list'

const STORAGE_KEY = 'verana.ecosystems.view'

function isView(value: unknown): value is EcosystemsView {
  return value === 'grid' || value === 'list'
}

export function useEcosystemsView(): [EcosystemsView, (view: EcosystemsView) => void] {
  const [view, setViewState] = useState<EcosystemsView>('grid')

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (isView(stored)) setViewState(stored)
    } catch {}
  }, [])

  const setView = useCallback((next: EcosystemsView) => {
    setViewState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {}
  }, [])

  return [view, setView]
}

export function ViewToggle({ value, onChange }: { value: EcosystemsView; onChange: (view: EcosystemsView) => void }) {
  return (
    <SegmentedControl<EcosystemsView>
      label={tr('ecosystems.view.label', 'View')}
      value={value}
      onValueChange={onChange}
      size="md"
      className="shadow-xs"
      items={[
        {
          value: 'grid',
          label: null,
          ariaLabel: tr('ecosystems.view.grid', 'Grid view'),
          icon: <LayoutGridIcon aria-hidden="true" />,
        },
        {
          value: 'list',
          label: null,
          ariaLabel: tr('ecosystems.view.list', 'List view'),
          icon: <ListIcon aria-hidden="true" />,
        },
      ]}
    />
  )
}

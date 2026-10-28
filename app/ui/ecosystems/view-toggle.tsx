'use client'

import { LayoutGridIcon, ListIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { tr } from '@/ui/ecosystems/i18n'
import { ToggleGroup, ToggleGroupItem } from '@/ui/shadcn/toggle-group'

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
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={0}
      value={value}
      onValueChange={(next) => {
        if (isView(next)) onChange(next)
      }}
      aria-label={tr('ecosystems.view.label', 'View')}
      className="bg-card shadow-xs dark:bg-input/30"
    >
      <ToggleGroupItem value="grid" aria-label={tr('ecosystems.view.grid', 'Grid view')} className="h-8 w-9">
        <LayoutGridIcon aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="list" aria-label={tr('ecosystems.view.list', 'List view')} className="h-8 w-9">
        <ListIcon aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

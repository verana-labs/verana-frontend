'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import type { ParticipantView } from '@/ui/common/participant-tree'

export const SCHEMA_TABS = ['overview', 'participants', 'activity'] as const

export type SchemaTab = (typeof SCHEMA_TABS)[number]

const PARTICIPANT_PARAMS = ['participant', 'view']

function isTab(value: string | null): value is SchemaTab {
  return value !== null && (SCHEMA_TABS as readonly string[]).includes(value)
}

export function useSchemaTab() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const tabParam = searchParams.get('tab')
  const tab: SchemaTab = isTab(tabParam) ? tabParam : 'overview'
  const view: ParticipantView = searchParams.get('view') === 'table' ? 'table' : 'tree'

  const write = useCallback(
    (patch: (params: URLSearchParams) => void, mode: 'push' | 'replace') => {
      const params = new URLSearchParams(searchParams.toString())
      patch(params)
      const query = params.toString()
      const url = `${pathname}${query ? `?${query}` : ''}`
      if (mode === 'push') window.history.pushState(null, '', url)
      else window.history.replaceState(null, '', url)
    },
    [pathname, searchParams]
  )

  const setTab = useCallback(
    (next: string) => {
      if (!isTab(next)) return
      write((params) => {
        if (next === 'overview') params.delete('tab')
        else params.set('tab', next)
        if (next !== 'participants') for (const name of PARTICIPANT_PARAMS) params.delete(name)
      }, 'push')
    },
    [write]
  )

  const setView = useCallback(
    (next: ParticipantView) => {
      write((params) => {
        params.set('tab', 'participants')
        if (next === 'tree') params.delete('view')
        else params.set('view', next)
      }, 'replace')
    },
    [write]
  )

  return { tab, setTab, view, setView }
}

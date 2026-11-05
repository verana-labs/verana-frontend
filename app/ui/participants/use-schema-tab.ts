'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export const SCHEMA_TABS = ['overview', 'activity'] as const

export type SchemaTab = (typeof SCHEMA_TABS)[number]

function isTab(value: string | null): value is SchemaTab {
  return value !== null && (SCHEMA_TABS as readonly string[]).includes(value)
}

export function useSchemaTab() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const tabParam = searchParams.get('tab')
  const tab: SchemaTab = isTab(tabParam)
    ? tabParam
    : typeof window !== 'undefined' && window.location.hash === '#activity'
      ? 'activity'
      : 'overview'

  const setTab = useCallback(
    (next: string) => {
      if (!isTab(next)) return
      const params = new URLSearchParams(searchParams.toString())
      if (next === 'overview') params.delete('tab')
      else params.set('tab', next)
      const query = params.toString()
      window.history.replaceState(null, '', `${pathname}${query ? `?${query}` : ''}`)
    },
    [pathname, searchParams]
  )

  return { tab, setTab }
}

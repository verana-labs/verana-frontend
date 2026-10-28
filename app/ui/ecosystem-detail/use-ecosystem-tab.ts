'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect } from 'react'

export const ECOSYSTEM_TABS = ['overview', 'governance', 'schemas', 'activity', 'json'] as const

export type EcosystemTab = (typeof ECOSYSTEM_TABS)[number]

const HASH_TABS: Record<string, EcosystemTab> = { '#activity': 'activity' }

function isTab(value: string | null): value is EcosystemTab {
  return value !== null && (ECOSYSTEM_TABS as readonly string[]).includes(value)
}

function initialTab(param: string | null): EcosystemTab {
  if (isTab(param)) return param
  if (typeof window !== 'undefined') return HASH_TABS[window.location.hash] ?? 'overview'
  return 'overview'
}

export function revealTabTrigger(trigger: HTMLElement | null) {
  const list = trigger?.parentElement
  if (!trigger || !list || list.scrollWidth <= list.clientWidth) return
  const triggerBox = trigger.getBoundingClientRect()
  const listBox = list.getBoundingClientRect()
  const edge = 40
  if (triggerBox.right > listBox.right - edge) list.scrollLeft += triggerBox.right - listBox.right + edge
  else if (triggerBox.left < listBox.left) list.scrollLeft -= listBox.left - triggerBox.left
}

export function useEcosystemTab() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const tab = initialTab(searchParams.get('tab'))

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

  useEffect(() => {
    function onHashChange() {
      const target = HASH_TABS[window.location.hash]
      if (target) setTab(target)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [setTab])

  return [tab, setTab] as const
}

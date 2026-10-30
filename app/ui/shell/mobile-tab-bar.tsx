'use client'

import { EllipsisIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type * as React from 'react'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/ui/shadcn/sidebar'
import { type NavItem, useNavItems } from '@/ui/shell/nav-items'

const TASK_FIRST_TABS = [['/dashboard'], ['/pendingtasks'], ['/ecosystems', '/discover'], ['/account']]
const FALLBACK_TABS = ['/discover', '/settings']
const TAB_LIMIT = 4
const ACTIONABLE_TABS = new Set(['/pendingtasks'])
const SHORT_LABEL_KEYS: Record<string, string> = {
  '/dashboard': 'shell.tabs.home',
  '/pendingtasks': 'shell.tabs.tasks',
  '/discover': 'shell.tabs.discover',
}

const TAB_CLASS =
  'group/tab flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50'

function pickTabs(items: NavItem[]) {
  const byUrl = new Map(items.map((item) => [item.url, item]))
  const picked: NavItem[] = []
  for (const choices of TASK_FIRST_TABS) {
    const item = choices.map((url) => byUrl.get(url)).find((candidate) => candidate !== undefined)
    if (item) picked.push(item)
  }
  for (const url of FALLBACK_TABS) {
    const item = byUrl.get(url)
    if (picked.length < TAB_LIMIT && item && !picked.includes(item)) picked.push(item)
  }
  return picked.slice(0, TAB_LIMIT)
}

function isActive(pathname: string | null, url: string) {
  return pathname === url || (pathname?.startsWith(`${url}/`) ?? false)
}

function TabContent({
  active,
  icon,
  label,
  count,
  dot,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  count?: string
  dot: boolean
}) {
  return (
    <>
      <span
        className={cn(
          'relative flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-(--duration-base) ease-standard [&_svg]:size-5',
          active ? 'bg-primary/12 text-primary' : 'text-muted-foreground group-hover/tab:text-foreground'
        )}
      >
        {icon}
        {count ? (
          <span
            aria-hidden="true"
            className="absolute -top-1 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-semibold text-primary-foreground tabular-nums ring-2 ring-background"
          >
            {count}
          </span>
        ) : dot ? (
          <span
            aria-hidden="true"
            className="absolute top-0.5 right-2.5 size-2 rounded-full bg-destructive ring-2 ring-background"
          />
        ) : null}
      </span>
      <span
        className={cn(
          'max-w-full truncate text-[11px] leading-none',
          active ? 'font-semibold text-primary' : 'text-muted-foreground'
        )}
      >
        {label}
      </span>
    </>
  )
}

export function MobileTabBar() {
  const pathname = usePathname()
  const items = useNavItems()
  const { openMobile, setOpenMobile } = useSidebar()
  const tabs = pickTabs(items)
  const tabUrls = new Set(tabs.map((tab) => tab.url))
  const moreItems = items.filter((item) => !tabUrls.has(item.url))
  const moreActive = openMobile || moreItems.some((item) => isActive(pathname, item.url))

  return (
    <nav
      aria-label={translate('shell.tabs.label')}
      data-shell="tab-bar"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch gap-1 px-2 py-1">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.url)
          const label = SHORT_LABEL_KEYS[tab.url] ? translate(SHORT_LABEL_KEYS[tab.url]) : tab.title
          const actionable = ACTIONABLE_TABS.has(tab.url) && Boolean(tab.badge)
          return (
            <li key={tab.url} className="flex min-w-0 flex-1">
              <Link
                href={tab.url}
                data-tab={tab.url}
                aria-current={active ? 'page' : undefined}
                aria-label={tab.badge ? `${label} (${tab.badge})` : undefined}
                className={TAB_CLASS}
              >
                <TabContent
                  active={active}
                  icon={tab.icon}
                  label={label}
                  count={actionable ? tab.badge : undefined}
                  dot={Boolean(tab.badge) && !actionable}
                />
              </Link>
            </li>
          )
        })}
        <li className="flex min-w-0 flex-1">
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={openMobile}
            onClick={() => setOpenMobile(true)}
            className={TAB_CLASS}
          >
            <TabContent
              active={moreActive}
              icon={<EllipsisIcon />}
              label={translate('shell.more')}
              dot={moreItems.some((item) => Boolean(item.badge))}
            />
          </button>
        </li>
      </ul>
    </nav>
  )
}

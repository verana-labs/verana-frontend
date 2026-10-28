'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { BlocksIcon, DatabaseIcon, MonitorIcon, NetworkIcon } from 'lucide-react'
import type * as React from 'react'
import { VERANA_GRAPH_URL } from '@/config/env'
import { translate } from '@/i18n/dataview'
import type { ChainHealth, GraphHealth, IndexerHealth } from '@/lib/component-health'
import { communityLinks } from '@/lib/dashlinks'
import { useComponentsVersion } from '@/providers/components-version-provider'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/ui/shadcn/sidebar'

type Health = ChainHealth | GraphHealth | IndexerHealth['state']

const HEALTH_DOT: Record<Health, string> = {
  synced: 'bg-success',
  crawling: 'bg-success',
  syncing: 'bg-warning',
  stalled: 'bg-warning',
  down: 'bg-destructive',
  unreachable: 'bg-destructive',
}

const HEALTH_TEXT: Record<Health, string> = {
  synced: 'text-success',
  crawling: 'text-success',
  syncing: 'text-warning',
  stalled: 'text-warning',
  down: 'text-destructive',
  unreachable: 'text-destructive',
}

const HEALTHY: ReadonlySet<Health> = new Set(['synced', 'crawling'])

function StatusRow({
  id,
  icon,
  label,
  version,
  health,
  reason,
}: {
  id: string
  icon: React.ReactNode
  label: string
  version: string | null
  health?: Health | null
  reason?: string | null
}) {
  const healthLabel = health ? [translate(`footer.health.${health}`), reason].filter(Boolean).join(': ') : undefined
  const shownVersion = version ?? translate('footer.version')
  const tooltip = [label, shownVersion, healthLabel].filter(Boolean).join(' · ')
  return (
    <SidebarMenuItem data-status-row={id}>
      <SidebarMenuButton size="sm" tooltip={tooltip} className="cursor-default">
        <span className="relative flex">
          {icon}
          {health ? (
            <span
              aria-hidden="true"
              className={`absolute -right-0.5 -bottom-0.5 hidden size-1.5 rounded-full ring-2 ring-sidebar group-data-[collapsible=icon]:block ${HEALTH_DOT[health]}`}
            />
          ) : null}
        </span>
        <span className="capitalize">{label}</span>
      </SidebarMenuButton>
      <SidebarMenuBadge className="gap-1.5 font-mono text-[11px] text-muted-foreground">
        {shownVersion}
        {health && !HEALTHY.has(health) ? (
          <span title={reason ?? undefined} className={`pointer-events-auto font-sans ${HEALTH_TEXT[health]}`}>
            {translate(`footer.health.${health}`)}
          </span>
        ) : null}
        {health ? <span aria-hidden="true" className={`size-1.5 rounded-full ${HEALTH_DOT[health]}`} /> : null}
        {health && HEALTHY.has(health) ? <span className="sr-only">{healthLabel}</span> : null}
      </SidebarMenuBadge>
    </SidebarMenuItem>
  )
}

export function NavStatus(props: React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { state } = useComponentsVersion()

  return (
    <SidebarGroup {...props}>
      <SidebarGroupLabel>{translate('shell.status.title')}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <StatusRow
            id="network"
            icon={<NetworkIcon />}
            label={translate('footer.network')}
            version={state.ledger.version}
            health={state.ledger.health}
          />
          <StatusRow
            id="indexer"
            icon={<DatabaseIcon />}
            label={translate('footer.indexer')}
            version={state.indexer.version}
            health={state.indexer.health?.state}
            reason={state.indexer.health?.reason}
          />
          {VERANA_GRAPH_URL ? (
            <StatusRow
              id="graph"
              icon={<BlocksIcon />}
              label={translate('footer.graph')}
              version={state.graph.version}
              health={state.graph.health}
            />
          ) : null}
          <StatusRow
            id="frontend"
            icon={<MonitorIcon />}
            label={translate('footer.frontend')}
            version={state.frontend.version}
          />
        </SidebarMenu>
        <SidebarMenu className="flex-row gap-0.5 group-data-[collapsible=icon]:flex-col">
          {communityLinks.map((link) =>
            link.icon ? (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton asChild size="sm" tooltip={new URL(link.href).hostname}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={new URL(link.href).hostname}
                  >
                    <FontAwesomeIcon icon={link.icon} />
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ) : null
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

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
  synced: 'bg-emerald-500',
  crawling: 'bg-emerald-500',
  syncing: 'bg-amber-500',
  stalled: 'bg-amber-500',
  down: 'bg-red-500',
  unreachable: 'bg-red-500',
}

function StatusRow({
  icon,
  label,
  version,
  health,
  reason,
}: {
  icon: React.ReactNode
  label: string
  version: string | null
  health?: Health | null
  reason?: string | null
}) {
  const healthLabel = health ? [translate(`footer.health.${health}`), reason].filter(Boolean).join(': ') : undefined
  return (
    <SidebarMenuItem>
      <SidebarMenuButton size="sm" tooltip={healthLabel}>
        {icon}
        <span className="capitalize">{label}</span>
      </SidebarMenuButton>
      <SidebarMenuBadge className="gap-1.5 font-mono text-[11px] text-muted-foreground">
        {version ?? translate('footer.version')}
        {health ? <span aria-hidden="true" className={`size-1.5 rounded-full ${HEALTH_DOT[health]}`} /> : null}
      </SidebarMenuBadge>
    </SidebarMenuItem>
  )
}

export function NavStatus(props: React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { state } = useComponentsVersion()

  return (
    <SidebarGroup {...props}>
      <SidebarGroupLabel>Status</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <StatusRow
            icon={<NetworkIcon />}
            label={translate('footer.network')}
            version={state.ledger.version}
            health={state.ledger.health}
          />
          <StatusRow
            icon={<DatabaseIcon />}
            label={translate('footer.indexer')}
            version={state.indexer.version}
            health={state.indexer.health?.state}
            reason={state.indexer.health?.reason}
          />
          {VERANA_GRAPH_URL ? (
            <StatusRow
              icon={<BlocksIcon />}
              label={translate('footer.graph')}
              version={state.graph.version}
              health={state.graph.health}
            />
          ) : null}
          <StatusRow icon={<MonitorIcon />} label={translate('footer.frontend')} version={state.frontend.version} />
        </SidebarMenu>
        <SidebarMenu className="flex-row gap-0.5">
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

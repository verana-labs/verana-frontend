'use client'

import { BadgeCheckIcon, FileJson2Icon, LandmarkIcon, UsersIcon } from 'lucide-react'
import { useMemo } from 'react'
import { StatTile } from '@/ui/common/stat-tile'
import type { EcosystemListItem } from '@/ui/datatable/columnslist/ecosystem'
import { discoverText as t } from '@/ui/discover/text'
import { Shimmer } from '@/ui/motion/shimmer'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'
import { formatNumber, formatVNAFromUVNA } from '@/util/util'

const INTEGER = /^\d+$/

function sumUvna(values: string[]): string {
  return values.reduce((total, value) => (INTEGER.test(value) ? total + BigInt(value) : total), BigInt(0)).toString()
}

export type DiscoverStatsScope = 'matching' | 'page' | 'loaded'

export function DiscoverStats({
  ecosystems,
  loading,
  scope,
}: {
  ecosystems: EcosystemListItem[]
  loading: boolean
  scope: DiscoverStatsScope
}) {
  const totals = useMemo(
    () => ({
      ecosystems: ecosystems.length,
      schemas: ecosystems.reduce((total, ecosystem) => total + (ecosystem.activeSchemas ?? 0), 0),
      participants: ecosystems.reduce((total, ecosystem) => total + (ecosystem.participants ?? 0), 0),
      trust: sumUvna(ecosystems.map((ecosystem) => ecosystem.weight ?? '0')),
      trusted: ecosystems.filter((ecosystem) => ecosystem.trustData?.trustStatus === 'TRUSTED').length,
    }),
    [ecosystems]
  )
  const suffix = scope === 'matching' ? '' : '+'
  const value = (text: string) => (loading ? <Shimmer className="h-8 w-16" /> : text)
  const hint = t(`discover.stats.${scope}`)

  return (
    <Stagger className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StaggerItem>
        <StatTile
          icon={<LandmarkIcon />}
          label={t('discover.stats.ecosystems')}
          value={value(`${formatNumber(totals.ecosystems, true, true)}${suffix}`)}
          hint={loading ? hint : t('discover.stats.trusted', { n: totals.trusted })}
        />
      </StaggerItem>
      <StaggerItem>
        <StatTile
          icon={<FileJson2Icon />}
          label={t('discover.stats.schemas')}
          value={value(formatNumber(totals.schemas, true, true))}
          hint={hint}
        />
      </StaggerItem>
      <StaggerItem>
        <StatTile
          icon={<UsersIcon />}
          label={t('discover.stats.participants')}
          value={value(formatNumber(totals.participants, true, true))}
          hint={hint}
        />
      </StaggerItem>
      <StaggerItem>
        <StatTile
          icon={<BadgeCheckIcon />}
          label={t('discover.stats.trustValue')}
          value={value(formatVNAFromUVNA(totals.trust) || '0 VNA')}
          hint={hint}
        />
      </StaggerItem>
    </Stagger>
  )
}

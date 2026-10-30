'use client'

import { BadgeCheckIcon, FileJson2Icon, type LucideIcon, ScrollTextIcon, UsersIcon } from 'lucide-react'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { ScoreGauge } from '@/ui/common/score-gauge'
import { StatTile } from '@/ui/common/stat-tile'
import type { EcosystemData } from '@/ui/dataview/datasections/ecosystem'
import { NumberTicker } from '@/ui/motion/number-ticker'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'

type Tile = { key: string; label: string; value: number; Icon: LucideIcon; hint?: string; percent?: number }

function ratio(numerator: number, denominator: number, allowZero = false): string | undefined {
  if (!denominator || (!numerator && !allowZero)) return undefined
  return (numerator / denominator).toLocaleString(undefined, { maximumFractionDigits: 1 })
}

function hintFor(key: string, count: string | undefined): string | undefined {
  return count === undefined ? undefined : translate(`ecosystem.stat.${key}.hint`, { count })
}

export function EcosystemStatTiles({ ecosystem, className }: { ecosystem: EcosystemData; className?: string }) {
  const tiles: Tile[] = [
    {
      key: 'participants',
      hint: hintFor('participants', ecosystem.activeSchemas ? ecosystem.activeSchemas.toLocaleString() : undefined),
      label: translate('datatable.cs.card.participants'),
      value: ecosystem.participants,
      Icon: UsersIcon,
    },
    {
      key: 'schemas',
      hint: hintFor('schemas', ratio(ecosystem.participants, ecosystem.activeSchemas)),
      label: translate('dataview.ecosystem.fields.schemas'),
      value: ecosystem.activeSchemas,
      Icon: FileJson2Icon,
    },
    {
      key: 'issued',
      hint: hintFor('issued', ratio(ecosystem.issued, ecosystem.participants)),
      label: translate('datatable.cs.card.issuedCredentials'),
      value: ecosystem.issued,
      Icon: ScrollTextIcon,
    },
    {
      key: 'verified',
      hint: hintFor('verified', ratio(ecosystem.verified, ecosystem.issued, true)),
      label: translate('datatable.cs.card.verifiedCredentials'),
      value: ecosystem.verified,
      Icon: BadgeCheckIcon,
      percent: ecosystem.issued ? (ecosystem.verified / ecosystem.issued) * 100 : undefined,
    },
  ]

  return (
    <Stagger as="ul" className={cn('grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4', className)}>
      {tiles.map(({ key, label, value, Icon, hint, percent }) => (
        <StaggerItem as="li" key={key} className="min-w-0">
          <StatTile
            stat={key}
            statValue={String(value)}
            label={label}
            icon={<Icon />}
            value={<NumberTicker value={value} />}
            hint={hint}
            meter={
              percent === undefined ? undefined : <ScoreGauge percent={percent} label={label} tone="brand" size="sm" />
            }
            className="sm:min-h-0"
          />
        </StaggerItem>
      ))}
    </Stagger>
  )
}

'use client'

import { BadgeCheckIcon, FileJson2Icon, type LucideIcon, ScrollTextIcon, UsersIcon } from 'lucide-react'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { DotPattern } from '@/ui/dashboard/dot-pattern'
import type { EcosystemData } from '@/ui/dataview/datasections/ecosystem'
import { NumberTicker } from '@/ui/motion/number-ticker'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'

type Tile = { key: string; label: string; value: number; Icon: LucideIcon }

export function EcosystemStatTiles({ ecosystem, className }: { ecosystem: EcosystemData; className?: string }) {
  const tiles: Tile[] = [
    {
      key: 'participants',
      label: translate('datatable.cs.card.participants'),
      value: ecosystem.participants,
      Icon: UsersIcon,
    },
    {
      key: 'schemas',
      label: translate('dataview.ecosystem.fields.schemas'),
      value: ecosystem.activeSchemas,
      Icon: FileJson2Icon,
    },
    {
      key: 'issued',
      label: translate('datatable.cs.card.issuedCredentials'),
      value: ecosystem.issued,
      Icon: ScrollTextIcon,
    },
    {
      key: 'verified',
      label: translate('datatable.cs.card.verifiedCredentials'),
      value: ecosystem.verified,
      Icon: BadgeCheckIcon,
    },
  ]

  return (
    <Stagger as="ul" className={cn('grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4', className)}>
      {tiles.map(({ key, label, value, Icon }) => (
        <StaggerItem as="li" key={key} className="relative overflow-hidden rounded-xl bg-card p-4 shadow-card sm:p-5">
          <DotPattern
            width={14}
            height={14}
            className="text-primary/25 [mask-image:radial-gradient(160px_circle_at_top_right,white,transparent)]"
          />
          <div className="relative flex items-center gap-2 text-muted-foreground">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
            <span className="text-xs leading-snug font-medium sm:text-sm">{label}</span>
          </div>
          <NumberTicker
            value={value}
            className="relative mt-3 text-2xl leading-none font-semibold tracking-tight sm:text-3xl"
          />
        </StaggerItem>
      ))}
    </Stagger>
  )
}

'use client'

import { ArrowRightIcon, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { DeltaPill, type DeltaPillProps } from '@/ui/common/delta-pill'
import { DotPattern } from '@/ui/dashboard/dot-pattern'
import { StatNumber } from '@/ui/dashboard/stat-number'
import { Shimmer } from '@/ui/motion/shimmer'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'

export type CountTile = {
  stat: string
  name: string
  description: string
  Icon: LucideIcon
  value: number | null
  display: string | null
  format?: (value: number) => string
  href?: string
  cta?: string
  delta?: DeltaPillProps | null
  error?: boolean
}

function Tile({ stat, name, description, Icon, value, display, format, href, cta, delta, error }: CountTile) {
  return (
    <div
      data-stat={stat}
      data-stat-value={display ?? undefined}
      className="group relative isolate flex h-full min-w-0 flex-col overflow-hidden rounded-xl bg-card p-4 shadow-card transition-shadow duration-(--duration-base) ease-standard hover:shadow-raised @md/page:min-h-48 @md/page:p-5"
    >
      <DotPattern
        width={18}
        height={18}
        className="-z-10 text-primary/25 [mask-image:radial-gradient(200px_circle_at_top_right,white,transparent)]"
      />
      <div className="flex min-w-0 items-start justify-between gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-tint-accent text-primary transition-transform duration-(--duration-slow) ease-emphasized group-hover:scale-110 motion-reduce:transition-none [&_svg]:size-4.5"
        >
          <Icon />
        </span>
        {delta ? <DeltaPill {...delta} /> : null}
      </div>
      <div
        className="mt-4 min-w-0 truncate text-3xl leading-tight font-semibold tracking-[-0.03em] text-foreground tabular-nums @5xl/page:text-4xl"
        title={display ?? undefined}
      >
        {value !== null ? (
          <StatNumber value={value} format={format} />
        ) : error ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <Shimmer className="h-9 w-16 @5xl/page:h-10" />
        )}
      </div>
      <h3 className="mt-1 truncate text-sm font-medium text-foreground" title={name}>
        {name}
      </h3>
      <p className="mt-1 hidden text-sm text-muted-foreground @md/page:line-clamp-2">{description}</p>
      {href && cta ? (
        <Link
          href={href}
          className="mt-auto inline-flex items-center gap-1.5 self-start rounded-sm pt-3 text-sm font-medium text-primary underline-offset-4 after:absolute after:inset-0 after:rounded-xl group-hover:underline focus-visible:outline-none focus-visible:after:ring-[3px] focus-visible:after:ring-ring/50"
        >
          <span className="truncate">{cta}</span>
          <ArrowRightIcon
            aria-hidden="true"
            className="size-4 shrink-0 transition-transform duration-(--duration-slow) ease-emphasized group-hover:translate-x-0.5 motion-reduce:transition-none rtl:rotate-180"
          />
        </Link>
      ) : null}
    </div>
  )
}

export function CountTiles({ tiles, className }: { tiles: CountTile[]; className?: string }) {
  return (
    <Stagger
      as="ul"
      delay={0.15}
      className={cn('grid grid-cols-2 gap-3 @md/page:gap-4 @5xl/page:grid-cols-4 @5xl/page:gap-5', className)}
    >
      {tiles.map((tile) => (
        <StaggerItem as="li" key={tile.stat} className="min-w-0">
          <Tile {...tile} />
        </StaggerItem>
      ))}
    </Stagger>
  )
}

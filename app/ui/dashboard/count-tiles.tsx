'use client'

import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DotPattern } from '@/ui/dashboard/dot-pattern'
import { Stagger, StaggerItem } from '@/ui/motion/stagger'

export type CountTile = {
  stat: string
  name: string
  Icon: LucideIcon
  display: string
}

function Tile({ stat, name, Icon, display }: CountTile) {
  return (
    <div
      data-stat={stat}
      data-stat-value={display}
      className="group relative isolate flex h-full min-w-0 flex-col overflow-hidden rounded-xl bg-card p-4 shadow-card transition-shadow duration-(--duration-base) ease-standard hover:shadow-raised @md/page:p-5"
    >
      <DotPattern
        width={18}
        height={18}
        className="-z-10 text-primary/25 [mask-image:radial-gradient(200px_circle_at_top_right,white,transparent)]"
      />
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-tint-accent text-primary transition-transform duration-(--duration-slow) ease-emphasized group-hover:scale-110 motion-reduce:transition-none [&_svg]:size-4.5"
      >
        <Icon />
      </span>
      <div className="mt-4 min-w-0 text-2xl leading-tight font-semibold tracking-[-0.03em] [overflow-wrap:anywhere] text-foreground tabular-nums">
        {display}
      </div>
      <h3 className="mt-1 text-sm leading-5 font-medium text-pretty text-foreground [overflow-wrap:anywhere]">
        {name}
      </h3>
    </div>
  )
}

export function CountTiles({ tiles, className }: { tiles: CountTile[]; className?: string }) {
  return (
    <Stagger
      as="ul"
      delay={0.05}
      className={cn(
        'grid grid-cols-1 gap-3 @md/page:grid-cols-2 @md/page:gap-4 @3xl/page:grid-cols-3 @5xl/page:grid-cols-4 @5xl/page:gap-5',
        className
      )}
    >
      {tiles.map((tile) => (
        <StaggerItem as="li" key={tile.stat} className="min-w-0">
          <Tile {...tile} />
        </StaggerItem>
      ))}
    </Stagger>
  )
}

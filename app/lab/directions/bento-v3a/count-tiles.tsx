'use client'

import type { LucideIcon } from 'lucide-react'
import { BentoCard } from '@/lab/directions/bento-v3a/ui/bento-grid'
import { DotPattern } from '@/lab/directions/bento-v3a/ui/dot-pattern'
import { NumberTicker } from '@/lab/directions/bento-v3a/ui/number-ticker'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/ui/shadcn/skeleton'

export type CountTile = {
  name: string
  description: string
  href: string
  cta: string
  Icon: LucideIcon
  value: number | null
  decimals?: number
}

function CountBackground({ value, decimals }: Pick<CountTile, 'value' | 'decimals'>) {
  return (
    <>
      <DotPattern
        width={18}
        height={18}
        className="text-primary/30 [mask-image:radial-gradient(220px_circle_at_top_right,white,transparent)]"
      />
      <div className="absolute top-4 right-4 text-6xl leading-none font-semibold tracking-tight">
        {value === null ? (
          <Skeleton className="h-14 w-16" />
        ) : (
          <NumberTicker
            value={value}
            decimalPlaces={decimals ?? 0}
            className="tracking-tight text-foreground dark:text-foreground"
          />
        )}
      </div>
    </>
  )
}

export function CountTiles({ tiles, className }: { tiles: CountTile[]; className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 @md/page:grid-cols-2 @5xl/page:grid-cols-4', className)}>
      {tiles.map(({ value, decimals, ...tile }) => (
        <BentoCard
          key={tile.name}
          {...tile}
          className="col-span-1 min-h-52"
          background={<CountBackground value={value} decimals={decimals} />}
        />
      ))}
    </div>
  )
}

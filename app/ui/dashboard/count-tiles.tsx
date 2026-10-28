'use client'

import { ArrowRightIcon, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
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
  error?: boolean
}

function TileCta({ href, cta, className }: { href: string; cta: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        className
      )}
    >
      {cta}
      <ArrowRightIcon aria-hidden="true" className="size-4 rtl:rotate-180" />
    </Link>
  )
}

function Tile({ stat, name, description, Icon, value, display, format, href, cta, error }: CountTile) {
  const action = href && cta ? { href, cta } : null
  return (
    <div
      data-stat={stat}
      data-stat-value={display ?? undefined}
      className="group relative flex h-full flex-col justify-between gap-3 overflow-hidden rounded-xl bg-card p-3 shadow-card @md/page:min-h-52 @md/page:p-0"
    >
      <DotPattern
        width={18}
        height={18}
        className="text-primary/30 [mask-image:radial-gradient(220px_circle_at_top_right,white,transparent)]"
      />
      <div className="relative text-3xl leading-none font-semibold tracking-tight @md/page:absolute @md/page:top-4 @md/page:right-4 @md/page:text-5xl @5xl/page:text-6xl">
        {value !== null ? (
          <StatNumber value={value} format={format} className="tracking-tight text-foreground" />
        ) : error ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <Shimmer className="h-8 w-12 @md/page:h-14 @md/page:w-16" />
        )}
      </div>
      <div className="relative @md/page:p-4">
        <div
          className={cn(
            'flex transform-gpu flex-col gap-1 transition-transform duration-(--duration-slow) ease-emphasized motion-reduce:transition-none',
            action && 'lg:group-focus-within:-translate-y-8 lg:group-hover:-translate-y-8'
          )}
        >
          <Icon
            aria-hidden="true"
            className={cn(
              'hidden size-12 origin-left transform-gpu text-foreground/80 transition-transform duration-(--duration-slow) ease-emphasized @md/page:block',
              action && 'group-hover:scale-75'
            )}
          />
          <h3 className="flex items-start gap-1.5 text-sm font-medium text-muted-foreground @md/page:text-xl @md/page:font-semibold @md/page:text-foreground @5xl/page:text-base @7xl/page:text-lg">
            <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 @md/page:hidden" />
            <span className="line-clamp-2 @md/page:line-clamp-1 @md/page:text-balance" title={name}>
              {name}
            </span>
          </h3>
          <p className="hidden min-h-[2lh] max-w-lg text-sm text-muted-foreground @md/page:line-clamp-2">
            {description}
          </p>
        </div>
        {action ? <TileCta {...action} className="mt-2 hidden @md/page:inline-flex lg:hidden" /> : null}
      </div>
      {action ? (
        <div className="absolute bottom-0 hidden w-full translate-y-8 p-4 opacity-0 transition-[translate,opacity] duration-(--duration-slow) ease-emphasized group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 lg:flex">
          <TileCta {...action} />
        </div>
      ) : null}
      {action ? (
        <Link
          href={action.href}
          aria-label={action.cta}
          className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 @md/page:hidden"
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 transition-colors duration-(--duration-slow) group-hover:bg-foreground/[0.02]" />
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

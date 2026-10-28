'use client'

import { BadgeCheckIcon, FileCheck2Icon, FileJson2Icon, type LucideIcon, UserPlusIcon } from 'lucide-react'
import type { NetworkPoint } from '@/lab/dashboard/data'
import type { SchemaSummary } from '@/lab/directions/bento-v3a/network-extras'
import { AnimatedList } from '@/lab/directions/bento-v3a/ui/animated-list'
import { cn } from '@/lib/utils'

interface Item {
  id: string
  at: number
  name: string
  description: string
  Icon: LucideIcon
  color: string
  time: string
}

const RELATIVE = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'short' })

function ago(timestamp: string): string {
  const minutes = Math.round((new Date(timestamp).getTime() - Date.now()) / 60_000)
  if (Math.abs(minutes) < 60) return RELATIVE.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return RELATIVE.format(hours, 'hour')
  return RELATIVE.format(Math.round(hours / 24), 'day')
}

function plural(count: number, word: string): string {
  return `${count.toLocaleString('en-US')} ${word}${count === 1 ? '' : 's'}`
}

export function activityFrom(points: NetworkPoint[], schemas: SchemaSummary[], limit = 10): Item[] {
  const items: Item[] = []
  for (const schema of schemas) {
    items.push({
      id: `schema-${schema.id}`,
      at: new Date(schema.created).getTime(),
      name: `${schema.title} published`,
      description: `New credential schema in ecosystem #${schema.ecosystem_id}`,
      Icon: FileJson2Icon,
      color: '#0ea5e9',
      time: ago(schema.created),
    })
  }
  for (const point of points.slice(1)) {
    const time = ago(point.timestamp)
    const at = new Date(point.timestamp).getTime()
    if (point.issuedDelta > 0)
      items.push({
        id: `${point.timestamp}-i`,
        at,
        name: `${plural(point.issuedDelta, 'credential')} issued`,
        description: 'Issuers signed new credentials',
        Icon: FileCheck2Icon,
        color: '#763ef0',
        time,
      })
    if (point.verifiedDelta > 0)
      items.push({
        id: `${point.timestamp}-v`,
        at,
        name: `${plural(point.verifiedDelta, 'credential')} verified`,
        description: 'Verifiers checked presented credentials',
        Icon: BadgeCheckIcon,
        color: '#10b981',
        time,
      })
    if (point.participantsDelta > 0)
      items.push({
        id: `${point.timestamp}-p`,
        at,
        name: `${plural(point.participantsDelta, 'participant')} joined`,
        description: 'New issuers, verifiers or holders',
        Icon: UserPlusIcon,
        color: '#f59e0b',
        time,
      })
  }
  return items.sort((a, b) => a.at - b.at).slice(-limit)
}

const Notification = ({ name, description, Icon, color, time }: Item) => {
  return (
    <figure
      className={cn(
        'relative mx-auto min-h-fit w-full max-w-[400px] cursor-pointer overflow-hidden rounded-2xl p-4',
        'transition-all duration-200 ease-in-out hover:scale-[103%]',
        'bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]',
        'transform-gpu dark:bg-transparent dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] dark:backdrop-blur-md dark:[border:1px_solid_rgba(255,255,255,.1)]'
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: color }}
        >
          <Icon className="size-5 text-white" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center text-lg font-medium whitespace-pre dark:text-white">
            <span className="truncate text-sm">{name}</span>
            <span className="mx-1">·</span>
            <span className="text-xs text-gray-500">{time}</span>
          </figcaption>
          <p className="truncate text-sm font-normal text-muted-foreground dark:text-white/60">{description}</p>
        </div>
      </div>
    </figure>
  )
}

export function AnimatedListDemo({ items, className }: { items: Item[]; className?: string }) {
  return (
    <div className={cn('relative flex h-[500px] w-full flex-col overflow-hidden p-2', className)}>
      <AnimatedList delay={2200} visible={5}>
        {items.map((item) => (
          <Notification {...item} key={item.id} />
        ))}
      </AnimatedList>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background" />
    </div>
  )
}

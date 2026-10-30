'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  ActivityIcon,
  Building2Icon,
  CoinsIcon,
  FileJson2Icon,
  KeyRoundIcon,
  type LucideIcon,
  NetworkIcon,
  PauseIcon,
  PlayIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
  UserCheckIcon,
  VoteIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { getDictionary, getLocale, translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { BlockHeader } from '@/ui/common/block-card'
import { GhostEmpty } from '@/ui/common/ghost-empty'
import { TONE_CLASSES, type Tone, ToneTag } from '@/ui/common/tone-tag'
import { formatCount, relativeTime } from '@/ui/dashboard/format'
import { GhostRows } from '@/ui/dashboard/ghost-visuals'
import { type NetworkEvent, useNetworkEvents } from '@/ui/dashboard/use-network-events'
import { Shimmer } from '@/ui/motion/shimmer'
import { DURATION, EASE } from '@/ui/motion/tokens'
import { Button } from '@/ui/shadcn/button'
import { Card, CardHeader } from '@/ui/shadcn/card'

const MODULE_ICONS: Record<string, LucideIcon> = {
  co: Building2Icon,
  group: VoteIcon,
  de: KeyRoundIcon,
  pp: UserCheckIcon,
  perm: ShieldCheckIcon,
  cs: FileJson2Icon,
  tr: NetworkIcon,
  td: CoinsIcon,
}

const MODULE_TONES: Record<string, Tone> = {
  co: 'accent',
  group: 'info',
  de: 'warning',
  pp: 'success',
  perm: 'success',
  cs: 'info',
  tr: 'accent',
  td: 'warning',
}

function sentence(identifier: string): string {
  const words = identifier
    .replace(/^Msg/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(' ')
  return words.map((word, i) => (i === 0 || /^[A-Z0-9]+$/.test(word) ? word : word.toLowerCase())).join(' ')
}

export function eventTitle(eventType: string): string {
  const key = `dashboard.activity.event.${eventType}`
  return getDictionary(getLocale())[key] ? translate(key) : sentence(eventType)
}

function entityLine(event: NetworkEvent): string | null {
  if (!event.entityType) return null
  const entity = sentence(event.entityType)
  return event.entityId ? `${entity} #${event.entityId}` : entity
}

function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}

function EventRow({ event, now }: { event: NetworkEvent; now: number }) {
  const Icon = MODULE_ICONS[event.module] ?? ActivityIcon
  const entity = entityLine(event)
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-card transition-shadow duration-(--duration-base) hover:shadow-raised">
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          TONE_CLASSES[MODULE_TONES[event.module] ?? 'accent']
        )}
      >
        <Icon aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" title={event.eventType}>
          {eventTitle(event.eventType)}
        </p>
        <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          {entity ? <span className="truncate">{entity}</span> : null}
          {entity ? <span aria-hidden="true">·</span> : null}
          {event.timestamp ? (
            <time
              dateTime={event.timestamp}
              title={`${new Date(event.timestamp).toLocaleString()} · ${translate('dashboard.activity.block', { height: formatCount(event.blockHeight) })}`}
              className="shrink-0 tabular-nums"
            >
              {relativeTime(event.timestamp, now)}
            </time>
          ) : (
            <span className="shrink-0 font-mono tabular-nums">
              {translate('dashboard.activity.block', { height: formatCount(event.blockHeight) })}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

export function LiveActivity({ className }: { className?: string }) {
  const feed = useNetworkEvents(6)
  const now = useNow()
  const pauseLabel = translate(feed.paused ? 'dashboard.activity.resume' : 'dashboard.activity.pause')

  return (
    <Card data-dashboard="live-activity" className={cn('gap-0', className)}>
      <CardHeader>
        <BlockHeader
          icon={<ActivityIcon />}
          title={translate('dashboard.activity.title')}
          caption={translate('dashboard.activity.desc')}
          actions={
            <>
              {feed.paused ? (
                <ToneTag dot>{translate('dashboard.activity.paused')}</ToneTag>
              ) : feed.events !== null && !feed.error ? (
                <ToneTag tone="success" dot pulse>
                  {translate('dashboard.activity.live')}
                </ToneTag>
              ) : null}
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={feed.togglePaused}
                aria-pressed={feed.paused}
                aria-label={pauseLabel}
                title={pauseLabel}
                disabled={feed.events === null}
              >
                {feed.paused ? <PlayIcon /> : <PauseIcon />}
              </Button>
            </>
          }
        />
      </CardHeader>
      <div aria-live="polite" className="sr-only">
        {feed.announced
          ? translate('dashboard.activity.announce', {
              count: feed.announced.count,
              title: eventTitle(feed.announced.newest.eventType),
              height: formatCount(feed.announced.newest.blockHeight),
            })
          : ''}
      </div>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-4 pb-4 @5xl/page:[mask-image:linear-gradient(to_bottom,black_calc(100%-3rem),transparent)]">
        {feed.pendingCount > 0 ? (
          <Button variant="secondary" size="sm" className="mb-3 self-center rounded-full" onClick={feed.togglePaused}>
            {translate('dashboard.activity.pending', { count: feed.pendingCount })}
          </Button>
        ) : null}
        {feed.loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Shimmer key={`activity-skeleton-${i}`} className="h-[62px] w-full rounded-xl" />
            ))}
          </div>
        ) : feed.error ? (
          <GhostEmpty
            icon={<TriangleAlertIcon />}
            title={translate('dashboard.activity.error')}
            action={
              <Button variant="outline" size="sm" onClick={feed.retry}>
                {translate('dashboard.retry')}
              </Button>
            }
          >
            <GhostRows rows={4} />
          </GhostEmpty>
        ) : feed.events && feed.events.length === 0 ? (
          <GhostEmpty
            icon={<ActivityIcon />}
            title={translate('dashboard.activity.empty')}
            description={translate('dashboard.activity.emptyDesc')}
          >
            <GhostRows rows={4} />
          </GhostEmpty>
        ) : (
          <ol className="relative flex flex-col gap-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {(feed.events ?? []).map((event) => (
                <motion.li
                  key={event.key}
                  layout
                  initial={{ opacity: 0, scale: 0.92, y: -12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: DURATION.slow, ease: EASE.emphasized }}
                >
                  <EventRow event={event} now={now} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        )}
      </div>
    </Card>
  )
}

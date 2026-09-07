'use client'

import type { ReactNode } from 'react'
import { useChainStatus } from '@/hooks/useChainStatus'
import { useIndexerHealth } from '@/hooks/useIndexerHealth'
import { translate } from '@/i18n/dataview'
import { useComponentsVersion } from '@/providers/components-version-provider'
import { useIndexerEvents } from '@/providers/indexer-events-provider'
import { Card, Fact, formatDate, SectionTitle } from '@/ui/corporation/shared'
import { formatNumber } from '@/util/util'

type Tone = 'ok' | 'warn' | 'unknown'

const TONE_CLASS: Record<Tone, string> = {
  ok: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-200',
  warn: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  unknown: 'bg-neutral-20 text-gray-700 dark:bg-neutral-70 dark:text-gray-200',
}

function StatusPill({ tone, label }: { tone: Tone; label: string }) {
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded ${TONE_CLASS[tone]}`}>{label}</span>
}

function ComponentCard({
  id,
  title,
  pill,
  children,
}: {
  id: string
  title: string
  pill: ReactNode
  children: ReactNode
}) {
  return (
    <Card id={id}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <SectionTitle>{title}</SectionTitle>
        {pill}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </Card>
  )
}

export function ComponentHealth() {
  const { state } = useComponentsVersion()
  const { status: chain } = useChainStatus()
  const { health: indexer } = useIndexerHealth()
  const { latestProcessedHeight, latestProcessedTimestamp } = useIndexerEvents()

  const unknown = translate('dashboard.health.unknown')
  const indexerTone: Tone = indexer === null ? 'unknown' : indexer.crawling ? 'ok' : 'warn'
  const indexerLabel =
    indexer === null ? unknown : translate(indexer.crawling ? 'dashboard.health.running' : 'dashboard.health.stalled')
  const chainTone: Tone = chain === null ? 'unknown' : chain.catchingUp ? 'warn' : 'ok'
  const chainLabel =
    chain === null ? unknown : translate(chain.catchingUp ? 'dashboard.health.catchingup' : 'dashboard.health.synced')

  return (
    <section id="component-health" className="mb-8">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">
        {translate('dashboard.health.title')}
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ComponentCard
          id="health-chain"
          title={translate('dashboard.health.chain')}
          pill={<StatusPill tone={chainTone} label={chainLabel} />}
        >
          <Fact label={translate('dashboard.health.version')} value={state.ledger.version ?? unknown} />
          <Fact label={translate('dashboard.health.node')} value={chain?.nodeVersion ?? unknown} />
          <Fact
            label={translate('dashboard.health.height')}
            value={chain ? formatNumber(chain.latestBlockHeight, true, true) : unknown}
          />
          <Fact label={translate('dashboard.health.network')} value={chain?.network ?? unknown} />
        </ComponentCard>

        <ComponentCard
          id="health-indexer"
          title={translate('dashboard.health.indexer')}
          pill={<StatusPill tone={indexerTone} label={indexerLabel} />}
        >
          <Fact label={translate('dashboard.health.version')} value={state.indexer.version ?? unknown} />
          <Fact
            label={translate('dashboard.health.indexed')}
            value={latestProcessedHeight > 0 ? formatNumber(latestProcessedHeight, true, true) : unknown}
          />
          <Fact
            label={translate('dashboard.health.indexedat')}
            value={latestProcessedTimestamp ? formatDate(latestProcessedTimestamp) : unknown}
          />
          {indexer && !indexer.crawling ? (
            <Fact
              label={translate('dashboard.health.stoppedat')}
              value={indexer.stoppedReason ?? formatDate(indexer.stoppedAt)}
            />
          ) : null}
        </ComponentCard>

        <ComponentCard
          id="health-frontend"
          title={translate('dashboard.health.frontend')}
          pill={<StatusPill tone="ok" label={translate('dashboard.health.running')} />}
        >
          <Fact label={translate('dashboard.health.version')} value={state.frontend.version ?? unknown} />
        </ComponentCard>
      </div>
    </section>
  )
}

'use client'

import { CheckIcon, CopyIcon, ExternalLinkIcon, EyeIcon, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { VERANA_VISUALIZER_URL } from '@/config/env'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/shadcn/button'
import { copyToClipboard } from '@/util/util'
import type { ParticipantAction } from '../dataview/datasections/participant'
import { resolveTranslatable } from '../dataview/types'

type ParticipantAttributeProps = {
  label: string
  value: string
  mono?: boolean
  actions?: ParticipantAction[]
}

const ACTION_ICON: Record<string, LucideIcon> = {
  copy: CopyIcon,
  visualizer: EyeIcon,
  explorer: ExternalLinkIcon,
  service: ExternalLinkIcon,
}

function service(did: string): string | undefined {
  if (!did) return undefined
  const isWeb = did.startsWith('did:web:')
  const isWebvh = did.startsWith('did:webvh:')
  if (!isWeb && !isWebvh) return undefined
  const domain = did.split(':').pop()
  if (!domain) return undefined
  return `https://${domain}`
}

function visualizerUrl(value: string, action: ParticipantAction): string | undefined {
  const visualizerBaseUrl = VERANA_VISUALIZER_URL || 'https://vis.testnet.verana.network'
  const base = visualizerBaseUrl.replace(/\/+$/, '')
  const params = new URLSearchParams()

  switch (action.visualizerTarget) {
    case 'account':
      params.set('controller', value)
      return `${base}/did-directory?${params.toString()}`
    case 'did':
      params.set('did', value)
      return `${base}/did-directory?${params.toString()}`
    case 'participant':
      params.set('permission', value)
      return `${base}/permissions?${params.toString()}`
    default:
      return undefined
  }
}

export default function ParticipantAttribute({ label, value, mono, actions }: ParticipantAttributeProps) {
  const veranaChain = useVeranaChain()
  const [changeLabel, setChangeLabel] = useState(false)
  useEffect(() => {
    if (!changeLabel) return
    const timeout = window.setTimeout(() => setChangeLabel(false), 2000)
    return () => window.clearTimeout(timeout)
  }, [changeLabel])

  const makeOnClick = (action: ParticipantAction) => () => {
    switch (action.value) {
      case 'copy':
        copyToClipboard(value)
        setChangeLabel(true)
        break
      case 'service':
        window.open(service(value), '_blank')
        break
      case 'explorer': {
        const explorerUrl = veranaChain.explorers?.[0]?.url
        if (explorerUrl) window.open(`${explorerUrl}/account/${value}`, '_blank')
        break
      }
      case 'visualizer': {
        const url = visualizerUrl(value, action)
        if (url) window.open(url, '_blank')
        break
      }
      default:
        logger.error('ParticipantAction', action)
    }
  }

  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className={cn('mt-1 text-sm text-foreground break-all', mono && 'font-mono text-[13px]')}>{value}</dd>
      {actions?.length ? (
        <dd className="mt-1.5 flex flex-wrap items-center gap-1">
          {actions
            .filter((a) => a.value !== 'service' || service(value))
            .map((a) => {
              const copied = changeLabel && a.value === 'copy'
              const Icon = copied ? CheckIcon : (ACTION_ICON[a.value ?? ''] ?? ExternalLinkIcon)
              return (
                <Button
                  key={`${label}-${a.label}`}
                  onClick={makeOnClick(a)}
                  variant="ghost"
                  size="xs"
                  className={cn(
                    'first:-ms-2 text-primary hover:text-primary',
                    copied && 'text-success hover:text-success'
                  )}
                  type="button"
                >
                  <Icon aria-hidden="true" />
                  {copied ? resolveTranslatable({ key: 'participantcard.action.copied' }, translate) : a.label}
                </Button>
              )
            })}
        </dd>
      ) : null}
    </div>
  )
}

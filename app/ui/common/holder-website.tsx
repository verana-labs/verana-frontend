'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  CircleAlertIcon,
  ExternalLinkIcon,
  GlobeIcon,
  type LucideIcon,
  MailIcon,
  UserRoundSearchIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { translate } from '@/i18n/dataview'
import { logger } from '@/lib/logger'
import { fetchAgentResolution } from '@/lib/resolverClient'
import { cn } from '@/lib/utils'
import { DURATION, EASE } from '@/ui/motion/tokens'
import { Button } from '@/ui/shadcn/button'
import { Spinner } from '@/ui/shadcn/spinner'

const MAILTO = 'mailto:'

type HolderWebsiteProps = {
  issuerDid: string
  onCancel: () => void
}

type IssuerLink = { kind: 'loading' } | { kind: 'failed' } | { kind: 'none' } | { kind: 'link'; href: string }

function issuerLinkTexts(link: IssuerLink): { message: string; button?: string } {
  switch (link.kind) {
    case 'loading':
      return { message: translate('join.holder.loading') }
    case 'failed':
      return { message: translate('join.holder.failed') }
    case 'none':
      return { message: translate('join.holder.contact') }
    case 'link':
      return link.href.startsWith(MAILTO)
        ? {
            message: translate('join.holder.email.message', { email: new URL(link.href).pathname }),
            button: translate('join.holder.email.button'),
          }
        : {
            message: translate('join.holder.website.message', { host: new URL(link.href).host }),
            button: translate('join.holder.website.button'),
          }
  }
}

function linkIcon(link: IssuerLink): LucideIcon {
  if (link.kind === 'failed') return CircleAlertIcon
  if (link.kind !== 'link') return UserRoundSearchIcon
  return link.href.startsWith(MAILTO) ? MailIcon : GlobeIcon
}

export function HolderWebsite({ issuerDid, onCancel }: HolderWebsiteProps) {
  const [link, setLink] = useState<IssuerLink>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetchAgentResolution(issuerDid, ['ACTIVE'])
      .then(({ linkedDomain }) => {
        if (!cancelled) setLink(linkedDomain ? { kind: 'link', href: linkedDomain } : { kind: 'none' })
      })
      .catch((cause) => {
        logger.error(`holder website resolve ${issuerDid}`, cause)
        if (!cancelled) setLink({ kind: 'failed' })
      })
    return () => {
      cancelled = true
    }
  }, [issuerDid])

  const { message, button } = issuerLinkTexts(link)
  const external = link.kind === 'link' && !link.href.startsWith(MAILTO)
  const Icon = linkIcon(link)

  return (
    <section className="flex flex-col gap-5">
      <p className="rounded-lg bg-muted/60 px-4 py-3 text-sm text-muted-foreground dark:bg-muted/40">
        {translate('join.holder.permissionless')}
      </p>

      <div aria-live="polite" className="rounded-xl p-4 ring-1 ring-foreground/10 sm:p-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={link.kind}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.base, ease: EASE.emphasized }}
            className="flex items-start gap-3"
          >
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-xl',
                link.kind === 'failed' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
              )}
            >
              {link.kind === 'loading' ? (
                <Spinner aria-hidden="true" className="size-4.5" />
              ) : (
                <Icon aria-hidden="true" className="size-5" />
              )}
            </span>
            <p
              className={cn(
                'min-w-0 pt-2 text-sm break-words',
                link.kind === 'failed' ? 'text-destructive' : 'text-foreground'
              )}
            >
              {message}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" size="lg" className="px-4" onClick={onCancel}>
          {translate('join.btn.cancel')}
        </Button>
        {link.kind === 'link' ? (
          <Button asChild size="lg" className="px-4">
            <a
              href={link.href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
            >
              {external ? <GlobeIcon aria-hidden="true" /> : <MailIcon aria-hidden="true" />}
              {button}
              {external ? <ExternalLinkIcon aria-hidden="true" data-icon="inline-end" /> : null}
            </a>
          </Button>
        ) : null}
      </div>
    </section>
  )
}

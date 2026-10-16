'use client'

import { useEffect, useState } from 'react'
import { translate } from '@/i18n/dataview'
import { logger } from '@/lib/logger'
import { fetchAgentResolution } from '@/lib/resolverClient'

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

  return (
    <section>
      <p className="text-sm text-neutral-70 dark:text-neutral-70 mb-4">{message}</p>
      <div className="flex justify-between">
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          type="button"
        >
          {translate('join.btn.cancel')}
        </button>
        {link.kind === 'link' ? (
          <a
            href={link.href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className="px-6 py-3 rounded-lg font-medium transition-colors bg-primary-600 text-white hover:bg-primary-700"
          >
            {button}
          </a>
        ) : null}
      </div>
    </section>
  )
}

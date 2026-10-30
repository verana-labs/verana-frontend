'use client'

import { useChain } from '@cosmos-kit/react'
import { CheckIcon, CopyIcon, ExternalLinkIcon, FingerprintIcon, QrCodeIcon } from 'lucide-react'
import { useState } from 'react'
import { useCopyFeedback } from '@/hooks/useCopyFeedback'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { cn } from '@/lib/utils'
import { DotGrid } from '@/ui/account/dot-grid'
import { AddressQrModal } from '@/ui/common/address-qr-modal'
import { BlockCard } from '@/ui/common/block-card'
import { ToneTag } from '@/ui/common/tone-tag'
import { Button } from '@/ui/shadcn/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/ui/shadcn/tooltip'

const ICON_BUTTON = 'bg-card/80 backdrop-blur-sm focus-visible:ring-ring dark:bg-card/60'

export function AccountAddress() {
  const veranaChain = useVeranaChain()
  const { address } = useChain(veranaChain.chain_name)
  const explorerUrl = veranaChain.explorers?.[0]?.url
  const network = veranaChain.chain_id
  const [qrOpen, setQrOpen] = useState(false)
  const { copied, copy } = useCopyFeedback(address)

  if (!address) return null

  const copyLabel = copied ? translate('copied.label') : translate('navbar.addresscopy.title')
  const qrLabel = translate('navbar.qr.title')
  const explorerLabel = translate('navbar.mintscan.title')

  return (
    <BlockCard
      icon={<FingerprintIcon />}
      title={translate('dataview.account.sections.accountInformation')}
      caption={translate('account.info.desc')}
      className="h-full bg-linear-to-br from-primary/10 via-card to-card"
      contentClassName="gap-5 pt-6"
    >
      <DotGrid className="-z-10" />
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">{translate('dataview.account.fields.address')}</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <p className="min-w-0 flex-1 rounded-lg bg-card/80 px-3 py-2 font-mono text-sm leading-6 font-medium break-all text-foreground shadow-hairline select-all backdrop-blur-sm dark:bg-card/60">
            {address}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size={copied ? 'sm' : 'icon'}
                  aria-label={copyLabel}
                  onClick={() => void copy()}
                  className={cn(ICON_BUTTON, copied && 'h-8 px-2.5 text-success hover:text-success')}
                >
                  {copied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
                  {copied ? <span>{copyLabel}</span> : null}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{copyLabel}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={qrLabel}
                  onClick={() => setQrOpen(true)}
                  className={ICON_BUTTON}
                >
                  <QrCodeIcon aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{qrLabel}</TooltipContent>
            </Tooltip>
            {explorerUrl ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" asChild className={ICON_BUTTON}>
                    <a
                      href={`${explorerUrl}/account/${address}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={explorerLabel}
                    >
                      <ExternalLinkIcon aria-hidden="true" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{explorerLabel}</TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        </div>
      </div>
      {network ? (
        <dl className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <dt className="text-xs font-medium text-muted-foreground">{translate('dataview.account.fields.network')}</dt>
          <dd>
            <ToneTag tone="success" dot pulse className="font-mono">
              {network}
            </ToneTag>
          </dd>
        </dl>
      ) : null}
      {qrOpen ? <AddressQrModal address={address} onClose={() => setQrOpen(false)} /> : null}
    </BlockCard>
  )
}

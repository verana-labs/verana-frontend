'use client'

import { useChain } from '@cosmos-kit/react'
import { faCheck, faCopy, faQrcode, faUpRightFromSquare, faWallet } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import { useVeranaChain } from '@/hooks/useVeranaChain'
import { translate } from '@/i18n/dataview'
import { AddressQrModal } from '@/ui/common/address-qr-modal'
import IconLabelButton from '@/ui/common/icon-label-button'

export function AccountAddress() {
  const veranaChain = useVeranaChain()
  const { address } = useChain(veranaChain.chain_name)
  const explorerUrl = veranaChain.explorers?.[0]?.url
  const [copiedAt, setCopiedAt] = useState(0)
  const [qrOpen, setQrOpen] = useState(false)

  const copied = copiedAt > 0

  useEffect(() => {
    if (!copiedAt) return
    const timeout = window.setTimeout(() => setCopiedAt(0), 2000)
    return () => window.clearTimeout(timeout)
  }, [copiedAt])

  async function copyAddress() {
    if (!address || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAt(Date.now())
    } catch {
      setCopiedAt(0)
    }
  }

  if (!address) return null

  return (
    <div className="bg-white dark:bg-surface rounded-xl border border-neutral-20 dark:border-neutral-70 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary-500 to-accent-500">
          <FontAwesomeIcon icon={faWallet} className="text-white text-xl" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-neutral-70">{translate('dataview.account.fields.address')}</p>
          <p className="font-mono text-base font-semibold text-gray-900 dark:text-white break-all">{address}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <IconLabelButton
            icon={copied ? faCheck : faCopy}
            label={copied ? <span className="ml-1.5 text-xs font-medium">{translate('copied.label')}</span> : undefined}
            title={translate('navbar.addresscopy.title')}
            className={`navbar-icon flex items-center ${copied ? 'text-success-600 dark:text-success-400' : ''}`}
            onClick={() => void copyAddress()}
          />
          <IconLabelButton
            icon={faQrcode}
            title={translate('navbar.qr.title')}
            className="navbar-icon"
            onClick={() => setQrOpen(true)}
          />
          {explorerUrl ? (
            <a
              href={`${explorerUrl}/account/${address}`}
              target="_blank"
              rel="noreferrer"
              title={translate('navbar.mintscan.title')}
              className="navbar-icon inline-flex items-center"
            >
              <FontAwesomeIcon icon={faUpRightFromSquare} />
            </a>
          ) : null}
        </div>
      </div>
      {qrOpen ? <AddressQrModal address={address} onClose={() => setQrOpen(false)} /> : null}
    </div>
  )
}

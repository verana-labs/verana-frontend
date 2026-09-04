'use client'

import { faBuilding, faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { type ReactNode, useState } from 'react'
import type { CorporationProfile } from '@/hooks/useCorporationDetails'
import type { DidEnrichment } from '@/lib/resolverClient'
import type { CorporationSigningMode } from '@/msg/actions_hooks/actionCorporationManage'
import { SigningModeIcon } from '@/ui/common/signing-mode-icon'
import { countryCodeToFlag, shortenMiddle } from '@/util/util'
import { t } from './shared'

const TRUST_DOT: Record<string, string> = {
  TRUSTED: 'bg-success-500',
  UNTRUSTED: 'bg-red-500',
  UNRESOLVED: 'bg-neutral-70',
}

const OUTLINE_BUTTON =
  'px-3 py-1.5 border border-neutral-20 dark:border-neutral-70 rounded-lg text-sm font-medium flex items-center gap-2'

export function RotateDidForm({ mode, onSubmit }: { mode: CorporationSigningMode; onSubmit: (did: string) => void }) {
  const [draft, setDraft] = useState('')
  return (
    <form
      className="mt-4 flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        if (draft.trim()) {
          onSubmit(draft.trim())
          setDraft('')
        }
      }}
    >
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="did:method:identifier"
        className="grow max-w-xl px-4 py-2 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-surface"
      />
      <button
        type="submit"
        disabled={!draft.trim()}
        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-60 flex items-center gap-2"
      >
        <SigningModeIcon mode={mode} />
        {t('corporation.page.rotatedid.submit')}
      </button>
    </form>
  )
}

export function CorporationHeader({
  profile,
  enrichment,
  updateMode,
  rotating,
  onToggleRotate,
  onCreate,
  rotateForm,
  nav,
}: {
  profile: CorporationProfile
  enrichment: DidEnrichment | null
  updateMode: CorporationSigningMode | null
  rotating: boolean
  onToggleRotate: () => void
  onCreate: () => void
  rotateForm?: ReactNode
  nav?: ReactNode
}) {
  const displayName = enrichment?.organizationName ?? enrichment?.serviceName
  const trust = enrichment?.trustStatus ?? 'UNRESOLVED'

  return (
    <section className="mb-6 rounded-xl border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <span className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xl">
            <FontAwesomeIcon icon={faBuilding} />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
              {enrichment?.countryCode ? (
                <span aria-hidden="true">{countryCodeToFlag(enrichment.countryCode)}</span>
              ) : null}
              <span className="truncate">{displayName ?? shortenMiddle(profile.did, 40)}</span>
              <span title={trust} className={`inline-block w-2.5 h-2.5 rounded-full ${TRUST_DOT[trust]}`} />
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 break-all">
              {displayName ? `${profile.did} · ` : ''}#{profile.id} · {shortenMiddle(profile.policyAddress, 26)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {updateMode ? (
            <button type="button" onClick={onToggleRotate} className={OUTLINE_BUTTON}>
              {t('corporation.page.rotatedid')}
            </button>
          ) : null}
          <button type="button" onClick={onCreate} className={OUTLINE_BUTTON}>
            <FontAwesomeIcon icon={faPlus} />
            {t('corporation.page.new')}
          </button>
        </div>
      </div>
      {rotating && updateMode ? rotateForm : null}
      {nav}
    </section>
  )
}

'use client'

import { ShieldCheckIcon } from 'lucide-react'
import { useCallback, useState } from 'react'
import { translate } from '@/i18n/dataview'
import { displayedVersion } from '@/lib/gf-document'
import GfDocumentViewer, { VerificationBadge, type ViewerState } from '@/ui/common/gf-document-viewer'
import { formatLongDateUserLocale } from '@/util/util'
import type { EcosystemData } from '../dataview/datasections/ecosystem'
import { resolveTranslatable } from '../dataview/types'

export type EgfCardProps = {
  ecosystem: EcosystemData
  accepted: boolean
  onAcceptedChange: (next: boolean) => void
}

export default function EgfCard({ ecosystem, accepted, onAcceptedChange }: EgfCardProps) {
  const [state, setState] = useState<ViewerState>('verifying')
  const blocked = state === 'mismatch'
  const locked = blocked || state === 'verifying'
  const onViewerState = useCallback(
    (next: ViewerState) => {
      setState(next)
      if (next === 'mismatch' || next === 'verifying') onAcceptedChange(false)
    },
    [onAcceptedChange]
  )
  const version = displayedVersion(ecosystem.versions, ecosystem.activeVersion)
  return (
    <div className="mb-6 rounded-xl bg-card p-5 shadow-card sm:p-6">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheckIcon className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 break-all">
          <h3 className="text-base font-semibold tracking-tight">{ecosystem.did}</h3>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{ecosystem.did}</p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-border bg-background p-4 sm:p-5">
        <h3 className="mb-1 text-center text-base font-semibold tracking-tight">
          {resolveTranslatable({ key: 'join.egf.title' }, translate)}
        </h3>
        <p className="mb-4 text-center text-sm text-muted-foreground">
          {[
            `${resolveTranslatable({ key: 'join.egf.version.label' }, translate)} ${version?.version ?? ecosystem.activeVersion}`,
            version?.activeSince
              ? `${resolveTranslatable({ key: 'join.egf.lastupdate.label' }, translate)} ${formatLongDateUserLocale(version.activeSince)}`
              : null,
          ]
            .filter(Boolean)
            .join(' • ')}
        </p>
        <GfDocumentViewer documents={version?.documents ?? []} onStateChange={onViewerState} />
      </div>

      <div className="flex items-start gap-3">
        <input
          id="egf-accept"
          type="checkbox"
          checked={accepted}
          disabled={locked}
          onChange={(e) => onAcceptedChange(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 rounded border-input accent-primary focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
        />
        <label
          htmlFor="egf-accept"
          className={`text-sm leading-snug ${locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          {resolveTranslatable({ key: 'join.egf.acceptancemessage' }, translate)}
        </label>
        {state === 'unverified' ? <VerificationBadge state="unverified" /> : null}
      </div>
      {blocked ? (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {resolveTranslatable({ key: 'join.egf.accept.blocked' }, translate)}
        </p>
      ) : null}
    </div>
  )
}

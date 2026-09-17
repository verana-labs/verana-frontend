'use client'

import { faShieldHalved } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
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
  const onViewerState = useCallback(
    (next: ViewerState) => {
      setState(next)
      if (next === 'mismatch') onAcceptedChange(false)
    },
    [onAcceptedChange]
  )
  const version = displayedVersion(ecosystem.versions, ecosystem.activeVersion)
  return (
    <div className="border border-neutral-20 dark:border-neutral-70 rounded-xl p-6 mb-6">
      <div className="flex items-start space-x-4 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
          <FontAwesomeIcon icon={faShieldHalved} className="text-white text-2xl" />
        </div>
        <div className="flex-1 min-w-0 break-all">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{ecosystem.did}</h3>
          <p className="text-xs font-mono text-neutral-70 dark:text-neutral-70 mt-2">{ecosystem.did}</p>
        </div>
      </div>

      <div className="border border-neutral-20 dark:border-neutral-70 rounded-lg p-4 sm:p-6 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
          {resolveTranslatable({ key: 'join.egf.title' }, translate)}
        </h3>
        <p className="text-sm text-neutral-70 dark:text-neutral-70 mb-4 text-center">
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

      <div className="flex items-start space-x-3">
        <input
          id="egf-accept"
          type="checkbox"
          checked={accepted}
          disabled={blocked}
          onChange={(e) => onAcceptedChange(e.target.checked)}
          className="mt-1 w-4 h-4 text-primary-600 bg-white dark:bg-surface border-neutral-20 dark:border-neutral-70 rounded focus:ring-primary-500 disabled:opacity-50"
        />
        <label
          htmlFor="egf-accept"
          className={`text-sm text-gray-700 dark:text-gray-300 ${blocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
          {resolveTranslatable({ key: 'join.egf.acceptancemessage' }, translate)}
        </label>
        {state === 'unverified' ? <VerificationBadge state="unverified" /> : null}
      </div>
      {blocked ? (
        <p className="mt-2 text-sm text-red-700 dark:text-red-300">
          {resolveTranslatable({ key: 'join.egf.accept.blocked' }, translate)}
        </p>
      ) : null}
    </div>
  )
}

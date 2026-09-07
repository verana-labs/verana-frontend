'use client'

import { faShieldHalved } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import { translate } from '@/i18n/dataview'
import { displayedVersion } from '@/lib/gf-document'
import GfDocumentViewer, { type ViewerState } from '@/ui/common/gf-document-viewer'
import { formatLongDateUserLocale } from '@/util/util'
import type { EcosystemData } from '../dataview/datasections/ecosystem'
import { resolveTranslatable } from '../dataview/types'

export type EgfCardProps = {
  ecosystem: EcosystemData
  accepted: boolean
  onAcceptedChange: (next: boolean) => void
}

const BANNER_CLASS: Record<ViewerState, string> = {
  verifying: 'bg-gray-50 dark:bg-gray-800/50 border-neutral-20 dark:border-neutral-70 text-gray-700 dark:text-gray-300',
  verified:
    'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
  mismatch: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
  unverified:
    'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
}

export default function EgfCard({ ecosystem, accepted, onAcceptedChange }: EgfCardProps) {
  const [state, setState] = useState<ViewerState>('verifying')
  const keyPoints = (resolveTranslatable({ key: 'join.egf.keypoints' }, translate) as string)
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
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

      <div className={`border rounded-lg p-4 mb-6 ${BANNER_CLASS[state]}`}>
        <p className="text-sm font-medium">{resolveTranslatable({ key: `gfdoc.${state}.text` }, translate)}</p>
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
        <GfDocumentViewer documents={version?.documents ?? []} onStateChange={setState} />
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          {resolveTranslatable({ key: 'join.egf.keypoints.label' }, translate)}
        </h4>

        <ul className="space-y-2">
          {keyPoints.map((t) => (
            <li key={t} className="flex items-start">
              <span className="text-primary-500 mr-2 mt-0.5 text-sm">✔</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-start space-x-3">
        <input
          id="egf-accept"
          type="checkbox"
          checked={accepted}
          onChange={(e) => onAcceptedChange(e.target.checked)}
          className="mt-1 w-4 h-4 text-primary-600 bg-white dark:bg-surface border-neutral-20 dark:border-neutral-70 rounded focus:ring-primary-500"
        />
        <label htmlFor="egf-accept" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          {resolveTranslatable({ key: 'join.egf.acceptancemessage' }, translate)}
        </label>
      </div>
    </div>
  )
}

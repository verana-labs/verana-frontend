'use client'

import { faScaleBalanced } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { type ReactNode, useState } from 'react'
import { translate } from '@/i18n/dataview'
import { displayedVersion, type GfVersion } from '@/lib/gf-document'
import GfDocumentViewer from '@/ui/common/gf-document-viewer'
import { resolveTranslatable } from '@/ui/dataview/types'

type EgfViewerToggleProps = {
  versions: GfVersion[]
  activeVersion: number
  children?: ReactNode
}

export function EgfViewerToggle({ versions, activeVersion, children }: EgfViewerToggleProps) {
  const [open, setOpen] = useState(false)
  const version = displayedVersion(versions, activeVersion)
  const documents = version?.documents ?? []
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {documents.length > 0 ? (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex items-center px-4 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors text-sm font-medium"
          >
            <FontAwesomeIcon className="mr-2" aria-hidden="true" icon={faScaleBalanced} />
            {resolveTranslatable({ key: 'discover.btn.egf' }, translate) ?? 'EGF'}
          </button>
        ) : null}
        {children}
      </div>
      {open && documents.length > 0 ? <GfDocumentViewer documents={documents} /> : null}
    </div>
  )
}

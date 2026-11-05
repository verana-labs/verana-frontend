'use client'

import { ChevronDownIcon, ScaleIcon } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { translate } from '@/i18n/dataview'
import { displayedVersion, type GfVersion } from '@/lib/gf-document'
import { cn } from '@/lib/utils'
import GfDocumentViewer from '@/ui/common/gf-document-viewer'
import { resolveTranslatable } from '@/ui/dataview/types'
import { BlurFade } from '@/ui/motion/blur-fade'
import { Button } from '@/ui/shadcn/button'

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
      <div className="flex flex-wrap gap-2">
        {documents.length > 0 ? (
          <Button type="button" variant="outline" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            <ScaleIcon aria-hidden="true" className="text-primary" />
            {resolveTranslatable({ key: 'discover.btn.egf' }, translate) ?? 'EGF'}
            <ChevronDownIcon
              aria-hidden="true"
              className={cn('transition-transform duration-(--duration-base) ease-standard', open && 'rotate-180')}
            />
          </Button>
        ) : null}
        {children}
      </div>
      {open && documents.length > 0 ? (
        <BlurFade offset={4} className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <GfDocumentViewer documents={documents} />
        </BlurFade>
      ) : null}
    </div>
  )
}

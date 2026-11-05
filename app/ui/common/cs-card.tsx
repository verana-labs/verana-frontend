'use client'

import { Code2Icon, LogInIcon, XIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { translate } from '@/i18n/dataview'
import { type CredentialSchemaListItem, getModePillClass } from '../datatable/columnslist/cs'
import { resolveTranslatable } from '../dataview/types'
import { Button } from '../shadcn/button'
import JsonCodeBlock from './json-code-block'

const LABEL_CLASS = 'text-xs font-medium text-muted-foreground'
const PILL_CLASS = 'mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide'

export type CsCardProps = {
  credentialSchema: CredentialSchemaListItem
  joinHref?: string
}

export default function CsCard({ credentialSchema, joinHref }: CsCardProps) {
  const [showJsonSchemaModal, setShowJsonSchemaModal] = useState<boolean>(false)

  return (
    <>
      <div className="cursor-default rounded-xl border border-border bg-muted/40 p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="min-w-0 truncate text-base font-semibold tracking-tight">{credentialSchema.title}</h3>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">
                {resolveTranslatable({ key: 'dataview.cs.fields.id' }, translate)}: {credentialSchema.id}
              </span>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div>
                <label className={LABEL_CLASS}>
                  {resolveTranslatable({ key: 'dataview.cs.fields.issuerValidationValidityPeriod' }, translate)}
                </label>
                <p className="mt-1 text-sm font-medium tabular-nums">
                  {credentialSchema.issuerValidationValidityPeriod} days
                </p>
              </div>

              <div>
                <label className={LABEL_CLASS}>
                  {resolveTranslatable({ key: 'dataview.cs.fields.verifierValidationValidityPeriod' }, translate)}
                </label>
                <p className="mt-1 text-sm font-medium tabular-nums">
                  {credentialSchema.verifierValidationValidityPeriod} days
                </p>
              </div>

              <div>
                <label className={LABEL_CLASS}>
                  {resolveTranslatable({ key: 'dataview.cs.fields.issuerOnboardingMode' }, translate)}
                </label>
                <p>
                  <span
                    className={`${PILL_CLASS} ${getModePillClass(credentialSchema.issuerOnboardingMode, '_ISSUER')}`}
                  >
                    {credentialSchema.issuerOnboardingMode}
                  </span>
                </p>
              </div>

              <div>
                <label className={LABEL_CLASS}>
                  {resolveTranslatable({ key: 'dataview.cs.fields.verifierOnboardingMode' }, translate)}
                </label>
                <p>
                  <span
                    className={`${PILL_CLASS} ${getModePillClass(
                      credentialSchema.verifierOnboardingMode,
                      '_VERIFIER'
                    )}`}
                  >
                    {credentialSchema.verifierOnboardingMode}
                  </span>
                </p>
              </div>

              {credentialSchema.holderOnboardingMode ? (
                <div>
                  <label className={LABEL_CLASS}>
                    {resolveTranslatable({ key: 'dataview.cs.fields.holderOnboardingMode' }, translate)}
                  </label>
                  <p>
                    <span
                      className={`${PILL_CLASS} ${getModePillClass(credentialSchema.holderOnboardingMode, '_HOLDER')}`}
                    >
                      {credentialSchema.holderOnboardingMode}
                    </span>
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2"
                onClick={() => setShowJsonSchemaModal(true)}
              >
                <Code2Icon aria-hidden="true" />
                {resolveTranslatable({ key: 'dataview.cs.viewJsonSchema' }, translate)}
              </Button>
              {joinHref ? (
                <Button asChild size="sm">
                  <Link href={joinHref}>
                    <LogInIcon aria-hidden="true" />
                    {resolveTranslatable({ key: 'discover.btn.join' }, translate)}
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {showJsonSchemaModal && credentialSchema.jsonSchema && (
        <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-black/40 px-4">
          <div className="relative top-10 mx-auto w-full max-w-4xl rounded-xl bg-popover p-5 shadow-overlay">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-sm font-semibold">{credentialSchema.title}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowJsonSchemaModal(false)}
                aria-label="Close"
              >
                <XIcon />
              </Button>
            </div>
            <JsonCodeBlock value={credentialSchema.jsonSchema} />
          </div>
        </div>
      )}
    </>
  )
}

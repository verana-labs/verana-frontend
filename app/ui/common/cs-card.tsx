'use client'

import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import { translate } from '@/i18n/dataview'
import { type CredentialSchemaListItem, getModePillClass } from '../datatable/columnslist/cs'
import { resolveTranslatable } from '../dataview/types'
import JsonCodeBlock from './json-code-block'

export type CsCardProps = {
  credentialSchema: CredentialSchemaListItem
}

export default function CsCard({ credentialSchema }: CsCardProps) {
  const [showJsonSchemaModal, setShowJsonSchemaModal] = useState<boolean>(false)

  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-neutral-20 dark:border-neutral-70 rounded-lg p-4 cursor-default">
        <div className="flex items-start space-x-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{credentialSchema.title}</h3>
              <span className="text-sm font-mono text-neutral-70 dark:text-neutral-70">
                {resolveTranslatable({ key: 'dataview.cs.fields.id' }, translate)}: {credentialSchema.id}
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">
                  {resolveTranslatable({ key: 'dataview.cs.fields.issuerValidationValidityPeriod' }, translate)}
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {credentialSchema.issuerValidationValidityPeriod} days
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">
                  {resolveTranslatable({ key: 'dataview.cs.fields.verifierValidationValidityPeriod' }, translate)}
                </label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {credentialSchema.verifierValidationValidityPeriod} days
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">
                  {resolveTranslatable({ key: 'dataview.cs.fields.issuerOnboardingMode' }, translate)}
                </label>
                <p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getModePillClass(
                      credentialSchema.issuerOnboardingMode,
                      '_ISSUER'
                    )}`}
                  >
                    {credentialSchema.issuerOnboardingMode}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-neutral-70 dark:text-neutral-70">
                  {resolveTranslatable({ key: 'dataview.cs.fields.verifierOnboardingMode' }, translate)}
                </label>
                <p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getModePillClass(
                      credentialSchema.verifierOnboardingMode,
                      '_VERIFIER'
                    )}`}
                  >
                    {credentialSchema.verifierOnboardingMode}
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowJsonSchemaModal(true)}
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
              type="button"
            >
              {'</>'} View JSON Schema
            </button>
          </div>
        </div>
      </div>

      {showJsonSchemaModal && credentialSchema.jsonSchema && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-xl bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setShowJsonSchemaModal(false)}
                className="absolute top-4 right-4 text-neutral-70 hover:text-gray-500 dark:hover:text-gray-300"
                aria-label="Close"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <JsonCodeBlock value={credentialSchema.jsonSchema} />
          </div>
        </div>
      )}
    </>
  )
}

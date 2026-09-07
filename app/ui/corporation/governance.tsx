'use client'

import { useState } from 'react'
import type { CorporationGovernance } from '@/hooks/useCorporationDetails'
import { translate } from '@/i18n/dataview'
import { governanceVersionTargets } from '@/lib/governance-versions'
import type { CorporationSigningMode, GovernanceDocumentDraft } from '@/msg/actions_hooks/actionCorporationManage'
import EgfDocumentsTable from '@/ui/common/egf-documents-table'
import { LanguageCombobox } from '@/ui/common/language-combobox'
import { SigningModeIcon } from '@/ui/common/signing-mode-icon'
import { isValidHttpUrl } from '@/util/validations'
import { Card, SectionTitle } from './shared'

const INPUT_CLASS =
  'mt-2 w-full px-4 py-2 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-surface'
const LABEL_CLASS = 'block text-sm font-medium text-gray-700 dark:text-gray-300'

function AddDocumentForm({
  mode,
  drafts,
  next,
  onSubmit,
}: {
  mode: CorporationSigningMode
  drafts: number[]
  next: number
  onSubmit: (draft: GovernanceDocumentDraft) => void
}) {
  const [version, setVersion] = useState(drafts[0] ?? next)
  const [language, setLanguage] = useState('')
  const [url, setUrl] = useState('')
  const valid = language.trim().length > 0 && isValidHttpUrl(url.trim())

  return (
    <form
      className="mt-6 space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (!valid) return
        onSubmit({ version, language: language.trim(), url: url.trim() })
        setUrl('')
      }}
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
        {translate('corporation.page.governance.add')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className={LABEL_CLASS}>
          {translate('corporation.page.governance.version')}
          <select value={version} onChange={(event) => setVersion(Number(event.target.value))} className={INPUT_CLASS}>
            {drafts.map((draft) => (
              <option key={draft} value={draft}>
                {translate('corporation.page.governance.version.draft', { version: draft })}
              </option>
            ))}
            <option value={next}>{translate('corporation.page.governance.version.new', { version: next })}</option>
          </select>
        </label>
        <label className={LABEL_CLASS}>
          {translate('corporation.page.governance.language')}
          <div className="mt-2">
            <LanguageCombobox value={language} onChange={setLanguage} />
          </div>
        </label>
      </div>
      <label className={LABEL_CLASS}>
        {translate('corporation.page.governance.url')}
        <input
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://"
          className={INPUT_CLASS}
        />
      </label>
      <button
        type="submit"
        disabled={!valid}
        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-60 flex items-center gap-2"
      >
        <SigningModeIcon mode={mode} />
        {translate('corporation.page.governance.add.submit')}
      </button>
    </form>
  )
}

export function GovernanceSection({
  governance,
  addMode,
  increaseMode,
  onAddDocument,
  onIncreaseVersion,
}: {
  governance: CorporationGovernance
  addMode: CorporationSigningMode | null
  increaseMode: CorporationSigningMode | null
  onAddDocument: (draft: GovernanceDocumentDraft) => void
  onIncreaseVersion: (version: number) => void
}) {
  const { drafts, next, activatable } = governanceVersionTargets(governance.versions, governance.activeVersion)
  return (
    <Card id="governance">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <SectionTitle>{translate('corporation.page.governance')}</SectionTitle>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {translate('corporation.page.governance.active', { version: governance.activeVersion })}
        </span>
      </div>
      {governance.versions.length > 0 ? (
        <EgfDocumentsTable versions={governance.versions} activeVersion={governance.activeVersion} />
      ) : (
        <p className="text-sm text-gray-500">{translate('corporation.page.governance.empty')}</p>
      )}
      {increaseMode && activatable !== null ? (
        <button
          type="button"
          onClick={() => onIncreaseVersion(activatable)}
          className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2"
        >
          <SigningModeIcon mode={increaseMode} />
          {translate('corporation.page.governance.activate', { version: activatable })}
        </button>
      ) : null}
      {addMode ? (
        <AddDocumentForm key={next} mode={addMode} drafts={drafts} next={next} onSubmit={onAddDocument} />
      ) : null}
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{translate('corporation.page.governance.note')}</p>
    </Card>
  )
}

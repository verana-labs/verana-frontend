'use client'

import { useState } from 'react'
import type { UserCorporation } from '@/hooks/useUserCorporation'
import { translate } from '@/i18n/dataview'
import { type BootstrapCorporationParams, useActionCorporation } from '@/msg/actions_hooks/actionCorporation'
import { resolveTranslatable } from '@/ui/dataview/types'

interface CorporationSetupCardProps {
  corporation: UserCorporation | null
  hasOperatorGrant: boolean
  loading: boolean
  error: string | null
  onDone: () => void
}

function t(key: string): string {
  return resolveTranslatable({ key }, translate) ?? key
}

export function CorporationSetupCard({
  corporation,
  hasOperatorGrant,
  loading,
  error,
  onDone,
}: CorporationSetupCardProps) {
  const [form, setForm] = useState<BootstrapCorporationParams>({
    did: '',
    language: 'en',
    docUrl: '',
    fundingUvna: '0',
  })
  const [submitting, setSubmitting] = useState(false)
  const bootstrapCorporation = useActionCorporation(onDone)

  if (loading || (corporation && hasOperatorGrant)) return null

  const needsCorporation = corporation === null
  const fundingIsValid = /^\d+$/.test(form.fundingUvna)
  const disabled =
    submitting ||
    error !== null ||
    !fundingIsValid ||
    (needsCorporation && (!form.did.trim() || !form.language.trim() || !form.docUrl.trim()))

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    try {
      await bootstrapCorporation({
        ...form,
        did: form.did.trim(),
        language: form.language.trim(),
        docUrl: form.docUrl.trim(),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mb-8 rounded-xl border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-surface p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('corporation.setup.title')}</h2>
      <p className="text-sm text-neutral-70 mb-6">
        {t(needsCorporation ? 'corporation.setup.desc' : 'corporation.setup.desc.grantonly')}
      </p>
      {error ? <div className="error-pane mb-4">{error}</div> : null}
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {needsCorporation ? (
          <>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('corporation.setup.did')}
              <input
                value={form.did}
                onChange={(event) => setForm({ ...form, did: event.target.value })}
                required
                placeholder="did:method:identifier"
                className="mt-2 w-full px-4 py-2 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-surface"
              />
            </label>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('corporation.setup.language')}
              <input
                value={form.language}
                onChange={(event) => setForm({ ...form, language: event.target.value })}
                required
                className="mt-2 w-full px-4 py-2 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-surface"
              />
            </label>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 md:col-span-2">
              {t('corporation.setup.docurl')}
              <input
                type="url"
                value={form.docUrl}
                onChange={(event) => setForm({ ...form, docUrl: event.target.value })}
                required
                className="mt-2 w-full px-4 py-2 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-surface"
              />
            </label>
          </>
        ) : null}
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('corporation.setup.funding')}
          <input
            type="number"
            min="0"
            step="1"
            value={form.fundingUvna}
            onChange={(event) => setForm({ ...form, fundingUvna: event.target.value })}
            required
            className="mt-2 w-full px-4 py-2 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-surface"
          />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={disabled}
            className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-60"
          >
            {t(submitting ? 'corporation.setup.submitting' : 'corporation.setup.submit')}
          </button>
        </div>
      </form>
    </section>
  )
}

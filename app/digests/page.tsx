'use client'

import { faFingerprint, faMagnifyingGlass, faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import { useDigestData } from '@/hooks/useDigestData'
import { useActionDigest } from '@/msg/actions_hooks/actionDigest'
import { formatLongDateUserLocale } from '@/util/util'

const SRI_DIGEST = /^sha(256|384|512)-.+$/

export default function DigestsPage() {
  const [digest, setDigest] = useState('')
  const { digestData, status, errorDigest, lookup } = useDigestData()
  const [storing, setStoring] = useState(false)
  const storeDigest = useActionDigest((storedDigest) => {
    setStoring(false)
    void lookup(storedDigest)
  })
  const valid = SRI_DIGEST.test(digest)

  async function onStore() {
    if (!valid) return
    setStoring(true)
    try {
      await storeDigest(digest)
    } finally {
      setStoring(false)
    }
  }

  return (
    <>
      <section className="mb-8">
        <h1 className="page-title">Digest Registry</h1>
        <p className="page-description">Look up or store an SRI digest through Verana's V4 DI module.</p>
      </section>

      <section className="rounded-xl border border-neutral-20 dark:border-neutral-70 bg-white dark:bg-surface p-6 mb-8">
        <label htmlFor="digest" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          SRI digest
        </label>
        <div className="relative mb-4">
          <FontAwesomeIcon icon={faFingerprint} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-70" />
          <input
            id="digest"
            value={digest}
            onChange={(event) => setDigest(event.target.value.trim())}
            placeholder="sha384-…"
            className={`w-full pl-11 pr-4 py-3 border rounded-lg bg-white dark:bg-surface font-mono text-sm ${
              digest === '' || valid ? 'border-neutral-20 dark:border-neutral-70' : 'border-red-500'
            }`}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            disabled={!valid || status === 'loading'}
            onClick={() => void lookup(digest)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-800 text-white font-medium disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} />
            Look up digest
          </button>
          <button
            type="button"
            disabled={!valid || storing}
            onClick={() => void onStore()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faPlus} />
            Store digest
          </button>
        </div>
      </section>

      {status === 'found' && digestData ? (
        <section className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-6">
          <h2 className="text-lg font-bold text-green-900 dark:text-green-200 mb-4">Digest found</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-green-800 dark:text-green-300">Digest</dt>
              <dd className="font-mono text-sm break-all text-gray-900 dark:text-white">{digestData.digest}</dd>
            </div>
            <div>
              <dt className="text-sm text-green-800 dark:text-green-300">Created</dt>
              <dd className="text-gray-900 dark:text-white">{formatLongDateUserLocale(digestData.created)}</dd>
            </div>
          </dl>
        </section>
      ) : null}
      {status === 'not-found' ? <div className="error-pane">Digest not found.</div> : null}
      {status === 'error' ? <div className="error-pane">{errorDigest}</div> : null}
    </>
  )
}

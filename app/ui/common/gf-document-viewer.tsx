'use client'

import { faDownload, faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { translate } from '@/i18n/dataview'
import { type DocumentVerification, verifyDocument } from '@/lib/document-verification'
import {
  documentFileName,
  type GfDocument,
  type GfDocumentKind,
  kindFromContentType,
  kindFromUrl,
} from '@/lib/gf-document'
import { getLanguageLabel, useLanguageData } from '@/lib/language'
import { resolveTranslatable } from '@/ui/dataview/types'

export type ViewerState = DocumentVerification['state'] | 'verifying'

export type GfDocumentViewerProps = {
  documents: GfDocument[]
  initialDocumentId?: string
  onStateChange?: (state: ViewerState) => void
}

const MARKDOWN_WRAPPER_CLASS = [
  'max-h-[28rem] overflow-y-auto rounded-lg border border-neutral-20 dark:border-neutral-70',
  'bg-white dark:bg-surface p-4 sm:p-6 text-left text-sm text-gray-800 dark:text-gray-200',
  '[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2',
  '[&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2',
  '[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-2',
  '[&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-1',
  '[&_p]:my-2 [&_p]:leading-relaxed',
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:my-1',
  '[&_blockquote]:border-l-4 [&_blockquote]:border-neutral-20 dark:[&_blockquote]:border-neutral-70 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-2',
  '[&_code]:font-mono [&_code]:text-xs [&_code]:bg-gray-100 dark:[&_code]:bg-gray-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded',
  '[&_pre]:bg-gray-100 dark:[&_pre]:bg-gray-800 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2',
  '[&_table]:my-2 [&_table]:w-full [&_th]:border [&_th]:border-neutral-20 dark:[&_th]:border-neutral-70 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left',
  '[&_td]:border [&_td]:border-neutral-20 dark:[&_td]:border-neutral-70 [&_td]:px-2 [&_td]:py-1',
  '[&_hr]:my-4 [&_hr]:border-neutral-20 dark:[&_hr]:border-neutral-70',
  '[&_img]:max-w-full',
].join(' ')

const FRAME_CLASS = 'w-full h-[28rem] rounded-lg border border-neutral-20 dark:border-neutral-70 bg-white'

const BADGE_CLASS: Record<ViewerState, string> = {
  verifying: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  verified: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  mismatch: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  unverified: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
}

const NOTICE_CLASS: Record<Exclude<ViewerState, 'verifying' | 'verified'>, string> = {
  mismatch: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300',
  unverified:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300',
}

const MEDIA_TYPES: Record<GfDocumentKind, string> = {
  pdf: 'application/pdf',
  markdown: 'text/markdown',
  html: 'text/html',
}

function t(key: string): string {
  return resolveTranslatable({ key }, translate) ?? key
}

export function VerificationBadge({ state }: { state: ViewerState }) {
  return (
    <span
      role="status"
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${BADGE_CLASS[state]}`}
    >
      {t(`gfdoc.state.${state}`)}
    </span>
  )
}

function useVerification(url: string | undefined, digest: string | undefined): DocumentVerification | null {
  const [result, setResult] = useState<DocumentVerification | null>(null)
  useEffect(() => {
    setResult(null)
    if (!url) return
    let cancelled = false
    void verifyDocument(url, digest).then((value) => {
      if (!cancelled) setResult(value)
    })
    return () => {
      cancelled = true
    }
  }, [url, digest])
  return result
}

function useObjectUrl(bytes: Uint8Array | undefined, type: string): string | undefined {
  const [objectUrl, setObjectUrl] = useState<string>()
  useEffect(() => {
    if (!bytes) {
      setObjectUrl(undefined)
      return
    }
    const url = URL.createObjectURL(new Blob([bytes], { type }))
    setObjectUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [bytes, type])
  return objectUrl
}

function saveBytes(bytes: Uint8Array, type: string, name: string) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([bytes], { type }))
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(link.href)
}

function VerifiedContent({
  kind,
  text,
  pdfUrl,
  title,
}: {
  kind: GfDocumentKind | undefined
  text: string | undefined
  pdfUrl: string | undefined
  title: string
}) {
  if (kind === 'pdf' && pdfUrl) return <iframe src={pdfUrl} title={title} className={FRAME_CLASS} />
  if (kind === 'html' && text !== undefined) {
    return <iframe sandbox="" srcDoc={text} referrerPolicy="no-referrer" title={title} className={FRAME_CLASS} />
  }
  if (kind === 'markdown' && text !== undefined) {
    return (
      <div className={MARKDOWN_WRAPPER_CLASS}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ children, href }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 dark:text-primary-400 underline"
              >
                {children}
              </a>
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    )
  }
  return (
    <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
      <p className="text-sm text-neutral-70 dark:text-neutral-70">{t('gfdoc.downloadonly')}</p>
    </div>
  )
}

export default function GfDocumentViewer({ documents, initialDocumentId, onStateChange }: GfDocumentViewerProps) {
  const languages = useLanguageData()
  const [selectedId, setSelectedId] = useState(initialDocumentId ?? documents[0]?.id)
  const selected = documents.find((doc) => doc.id === selectedId) ?? documents[0]
  const result = useVerification(selected?.url, selected?.digestSri)
  const state: ViewerState = !selected ? 'unverified' : (result?.state ?? 'verifying')
  const verifiedBytes = result?.state === 'verified' ? result.bytes : undefined
  const mediaType = result?.state === 'verified' ? result.mediaType : null
  const kind = selected ? (kindFromUrl(selected.url) ?? kindFromContentType(mediaType)) : undefined
  const pdfUrl = useObjectUrl(kind === 'pdf' ? verifiedBytes : undefined, MEDIA_TYPES.pdf)
  const text = useMemo(
    () =>
      verifiedBytes && (kind === 'markdown' || kind === 'html') ? new TextDecoder().decode(verifiedBytes) : undefined,
    [verifiedBytes, kind]
  )

  useEffect(() => {
    onStateChange?.(state)
  }, [state, onStateChange])

  if (!selected) return <p className="text-sm text-neutral-70 dark:text-neutral-70">{t('gfdoc.empty')}</p>

  const languageLabel = (doc: GfDocument) => getLanguageLabel(languages, doc.language) || doc.language
  const title = `${t('gfdoc.title')} (${languageLabel(selected)})`
  const download = () => {
    if (!verifiedBytes) return
    const type = kind ? MEDIA_TYPES[kind] : (mediaType ?? 'application/octet-stream')
    saveBytes(verifiedBytes, type, documentFileName(selected.url, kind))
  }

  return (
    <div className="text-left">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <span>{t('gfdoc.language.label')}</span>
          <select
            value={selected.id}
            onChange={(event) => setSelectedId(event.target.value)}
            className="px-3 py-1.5 border border-neutral-20 dark:border-neutral-70 rounded-lg bg-white dark:bg-surface text-sm"
          >
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {languageLabel(doc)}
              </option>
            ))}
          </select>
        </label>
        <VerificationBadge state={state} />
      </div>

      <p className="mb-3 text-xs font-mono text-neutral-70 dark:text-neutral-70 break-all">
        {t('gfdoc.digest.label')}: {selected.digestSri ?? t('gfdoc.digest.none')}
      </p>

      {state === 'verifying' ? (
        <div className="flex items-center justify-center h-40 rounded-lg border border-neutral-20 dark:border-neutral-70 animate-pulse">
          <p className="text-sm text-neutral-70 dark:text-neutral-70">{t('gfdoc.verifying.text')}</p>
        </div>
      ) : null}

      {result?.state === 'verified' ? <VerifiedContent kind={kind} text={text} pdfUrl={pdfUrl} title={title} /> : null}

      {result?.state === 'mismatch' || result?.state === 'unverified' ? (
        <div className={`rounded-lg border p-4 ${NOTICE_CLASS[result.state]}`}>
          <p className="text-sm font-medium">{t(`gfdoc.${result.state}.text`)}</p>
          <p className="mt-1 text-xs opacity-80 break-all">{result.reason}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap justify-center gap-3 mt-4">
        <a
          href={selected.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
        >
          <FontAwesomeIcon icon={faUpRightFromSquare} className="text-xs" />
          {t('gfdoc.open')}
        </a>
        {verifiedBytes ? (
          <button
            type="button"
            onClick={download}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            <FontAwesomeIcon icon={faDownload} className="text-xs" />
            {t('gfdoc.download')}
          </button>
        ) : null}
      </div>
    </div>
  )
}

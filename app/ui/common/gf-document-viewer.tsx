'use client'

import { faDownload, faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { translate } from '@/i18n/dataview'
import { documentFileName, fetchableDocumentUrl, kindFromContentType, kindFromUrl } from '@/lib/gf-document'
import { resolveTranslatable } from '@/ui/dataview/types'

type ViewerState =
  | { status: 'loading' }
  | { status: 'pdf'; objectUrl: string; blob: Blob }
  | { status: 'markdown'; text: string; blob: Blob }
  | { status: 'unavailable' }

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

export type GfDocumentViewerProps = {
  /** URL of the governance framework document, as registered on-chain. */
  url: string
}

/**
 * Inline viewer for a governance framework document. PDF and Markdown
 * documents are rendered directly in the component; other formats fall back
 * to a placeholder. The document can always be opened in a new tab or
 * downloaded.
 *
 * The document is fetched (CORS) rather than iframed from its origin: hosts
 * such as raw.githubusercontent.com send `X-Frame-Options: deny` but allow
 * cross-origin reads, so a blob URL is the only way to display them inline.
 */
export default function GfDocumentViewer({ url }: GfDocumentViewerProps) {
  const [state, setState] = useState<ViewerState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | undefined
    setState({ status: 'loading' })

    const load = async () => {
      const response = await fetch(fetchableDocumentUrl(url))
      if (!response.ok) throw new Error(`Failed to load document: ${response.status}`)
      const kind = kindFromUrl(url) ?? kindFromContentType(response.headers.get('content-type'))
      if (kind === 'pdf') {
        const raw = await response.blob()
        // Re-type: hosts like raw.githubusercontent.com serve PDFs as
        // application/octet-stream, which an iframe downloads instead of
        // displaying.
        const blob = raw.type === 'application/pdf' ? raw : new Blob([raw], { type: 'application/pdf' })
        objectUrl = URL.createObjectURL(blob)
        if (!cancelled) setState({ status: 'pdf', objectUrl, blob })
      } else if (kind === 'markdown') {
        const text = await response.text()
        if (!cancelled) setState({ status: 'markdown', text, blob: new Blob([text], { type: 'text/markdown' }) })
      } else if (!cancelled) {
        setState({ status: 'unavailable' })
      }
    }

    load().catch(() => {
      if (!cancelled) setState({ status: 'unavailable' })
    })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url])

  const title = resolveTranslatable({ key: 'join.egf.title' }, translate) ?? 'Ecosystem Governance Framework'

  const download = () => {
    const saveBlob = (blob: Blob) => {
      const kind = state.status === 'markdown' ? 'markdown' : 'pdf'
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = documentFileName(url, kind)
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(link.href)
    }
    if (state.status === 'pdf' || state.status === 'markdown') {
      saveBlob(state.blob)
      return
    }
    fetch(fetchableDocumentUrl(url))
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to download document: ${response.status}`)
        return response.blob()
      })
      .then(saveBlob)
      .catch(() => {
        window.open(url, '_blank', 'noopener,noreferrer')
      })
  }

  return (
    <div>
      {state.status === 'loading' ? (
        <div className="flex items-center justify-center h-40 rounded-lg border border-neutral-20 dark:border-neutral-70 animate-pulse">
          <p className="text-sm text-neutral-70 dark:text-neutral-70">
            {resolveTranslatable({ key: 'join.egf.doc.loading' }, translate) ?? 'Loading document…'}
          </p>
        </div>
      ) : null}

      {state.status === 'pdf' ? (
        <iframe
          src={state.objectUrl}
          title={title}
          className="w-full h-[28rem] rounded-lg border border-neutral-20 dark:border-neutral-70 bg-white"
        />
      ) : null}

      {state.status === 'markdown' ? (
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
            {state.text}
          </ReactMarkdown>
        </div>
      ) : null}

      {state.status === 'unavailable' ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
          <div className="text-6xl text-gray-400 dark:text-gray-500 mb-4">📄</div>
          <p className="text-sm text-neutral-70 dark:text-neutral-70">
            {resolveTranslatable({ key: 'join.egf.doc.previewunavailable' }, translate) ??
              'Preview is not available for this document. Use the buttons below to open or download it.'}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap justify-center gap-3 mt-4">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
        >
          <FontAwesomeIcon icon={faUpRightFromSquare} className="text-xs" />
          {resolveTranslatable({ key: 'join.egf.doc.open' }, translate) ?? 'Open in new tab'}
        </a>
        <button
          type="button"
          onClick={download}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          <FontAwesomeIcon icon={faDownload} className="text-xs" />
          {resolveTranslatable({ key: 'join.egf.doc.download' }, translate) ?? 'Download'}
        </button>
      </div>
    </div>
  )
}

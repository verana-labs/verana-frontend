'use client'

import {
  DownloadIcon,
  ExternalLinkIcon,
  FileDownIcon,
  Loader2Icon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  ShieldQuestionIcon,
} from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { resolveTranslatable } from '@/ui/dataview/types'
import { Shimmer } from '@/ui/motion/shimmer'
import { Button } from '@/ui/shadcn/button'

export type ViewerState = DocumentVerification['state'] | 'verifying'

export type GfDocumentViewerProps = {
  documents: GfDocument[]
  initialDocumentId?: string
  onStateChange?: (state: ViewerState) => void
}

const MARKDOWN_WRAPPER_CLASS = [
  'max-h-[28rem] overflow-y-auto rounded-lg border border-border',
  'bg-background p-4 sm:p-6 text-left text-sm text-foreground/90',
  '[&_h1]:text-xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h1]:mt-2 [&_h1]:mb-3',
  '[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-6 [&_h2]:mb-2',
  '[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-2',
  '[&_h4]:text-sm [&_h4]:font-semibold [&_h4]:mt-3 [&_h4]:mb-1',
  '[&_p]:my-2 [&_p]:leading-relaxed',
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_li]:my-1',
  '[&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-2',
  '[&_code]:font-mono [&_code]:text-xs [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded',
  '[&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2',
  '[&_table]:my-2 [&_table]:w-full [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:text-left',
  '[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1',
  '[&_hr]:my-4 [&_hr]:border-border',
  '[&_img]:max-w-full',
].join(' ')

const FRAME_CLASS = 'w-full h-[28rem] rounded-lg border border-border bg-white'

const BADGE_CLASS: Record<ViewerState, string> = {
  verifying: 'bg-muted text-muted-foreground',
  verified: 'bg-success/10 text-success dark:bg-success/20',
  mismatch: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
  unverified: 'bg-warning/10 text-warning dark:bg-warning/20',
}

const BADGE_ICON: Record<ViewerState, typeof ShieldCheckIcon> = {
  verifying: Loader2Icon,
  verified: ShieldCheckIcon,
  mismatch: ShieldAlertIcon,
  unverified: ShieldQuestionIcon,
}

const NOTICE_CLASS: Record<Exclude<ViewerState, 'verifying' | 'verified'>, string> = {
  mismatch: 'border-destructive/30 bg-destructive/5 text-destructive dark:border-destructive/40 dark:bg-destructive/10',
  unverified: 'border-warning/30 bg-warning/5 text-warning dark:border-warning/40 dark:bg-warning/10',
}

const SELECT_CLASS =
  'h-8 rounded-lg border border-input bg-transparent py-1 pr-8 pl-2.5 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

const MEDIA_TYPES: Record<GfDocumentKind, string> = {
  pdf: 'application/pdf',
  markdown: 'text/markdown',
  html: 'text/html',
}

function t(key: string): string {
  return resolveTranslatable({ key }, translate) ?? key
}

export function VerificationBadge({ state }: { state: ViewerState }) {
  const Icon = BADGE_ICON[state]
  return (
    <span
      role="status"
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium',
        BADGE_CLASS[state]
      )}
    >
      <Icon aria-hidden="true" className={cn('size-3.5', state === 'verifying' && 'animate-spin')} />
      {t(`gfdoc.state.${state}`)}
    </span>
  )
}

function useVerification(url: string | undefined, digest: string | undefined): DocumentVerification | null {
  const [result, setResult] = useState<{ url: string; digest?: string; value: DocumentVerification } | null>(null)
  useEffect(() => {
    if (!url) return
    let cancelled = false
    void verifyDocument(url, digest).then((value) => {
      if (!cancelled) setResult({ url, digest, value })
    })
    return () => {
      cancelled = true
    }
  }, [url, digest])
  return result && result.url === url && result.digest === digest ? result.value : null
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

function VerifyingNotice() {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-4 sm:p-6">
      <p className="text-sm text-muted-foreground">{t('gfdoc.verifying.text')}</p>
      <Shimmer className="h-5 w-2/5" />
      <Shimmer className="h-3 w-full" />
      <Shimmer className="h-3 w-11/12" />
      <Shimmer className="h-3 w-3/4" />
    </div>
  )
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
  if (kind === 'pdf') {
    return pdfUrl ? <iframe src={pdfUrl} title={title} className={FRAME_CLASS} /> : <VerifyingNotice />
  }
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
                className="text-primary underline underline-offset-4"
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
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
      <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <FileDownIcon className="size-4" aria-hidden="true" />
      </span>
      <p className="max-w-sm text-sm text-muted-foreground">{t('gfdoc.downloadonly')}</p>
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

  if (!selected) return <p className="text-sm text-muted-foreground">{t('gfdoc.empty')}</p>

  const languageLabel = (doc: GfDocument) => getLanguageLabel(languages, doc.language) || doc.language
  const title = `${t('gfdoc.title')} (${languageLabel(selected)})`
  const download = () => {
    if (!verifiedBytes) return
    const type = kind ? MEDIA_TYPES[kind] : (mediaType ?? 'application/octet-stream')
    saveBytes(verifiedBytes, type, documentFileName(selected.url, kind))
  }

  return (
    <div className="text-left">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{t('gfdoc.language.label')}</span>
          <select value={selected.id} onChange={(event) => setSelectedId(event.target.value)} className={SELECT_CLASS}>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {languageLabel(doc)}
              </option>
            ))}
          </select>
        </label>
        <VerificationBadge state={state} />
      </div>

      <p className="mb-4 rounded-md bg-muted/60 px-2.5 py-1.5 font-mono text-xs break-all text-muted-foreground">
        {t('gfdoc.digest.label')}: {selected.digestSri ?? t('gfdoc.digest.none')}
      </p>

      {state === 'verifying' ? <VerifyingNotice /> : null}

      {result?.state === 'verified' ? <VerifiedContent kind={kind} text={text} pdfUrl={pdfUrl} title={title} /> : null}

      {result?.state === 'mismatch' || result?.state === 'unverified' ? (
        <div role="alert" className={cn('flex gap-3 rounded-lg border p-4', NOTICE_CLASS[result.state])}>
          {result.state === 'mismatch' ? (
            <ShieldAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          ) : (
            <ShieldQuestionIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {resolveTranslatable(
                { key: `gfdoc.${result.state}.text`, values: { language: languageLabel(selected) } },
                translate
              )}
            </p>
            <p className="mt-1 text-xs break-all opacity-80">{result.reason}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {state === 'mismatch' ? null : (
          <Button asChild variant="outline">
            <a href={selected.url} target="_blank" rel="noopener noreferrer">
              <ExternalLinkIcon aria-hidden="true" />
              {t('gfdoc.open')}
            </a>
          </Button>
        )}
        {verifiedBytes ? (
          <Button type="button" onClick={download}>
            <DownloadIcon aria-hidden="true" />
            {t('gfdoc.download')}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

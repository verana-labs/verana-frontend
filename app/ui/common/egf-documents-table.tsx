'use client'

import { ExternalLinkIcon, EyeIcon, FileTextIcon, XIcon } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { translate } from '@/i18n/dataview'
import type { GfVersion } from '@/lib/gf-document'
import { getLanguageLabel, useLanguageData } from '@/lib/language'
import { cn } from '@/lib/utils'
import GfDocumentViewer from '@/ui/common/gf-document-viewer'
import { resolveTranslatable } from '@/ui/dataview/types'
import { BlurFade } from '@/ui/motion/blur-fade'
import { Badge } from '@/ui/shadcn/badge'
import { Button } from '@/ui/shadcn/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/shadcn/table'
import { formatDate } from '@/util/util'

function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <TableHead
      className={cn(
        'h-10 px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase first:pl-5 last:pr-5',
        className
      )}
    >
      {children}
    </TableHead>
  )
}

export type EgfDocumentsTableProps = {
  versions: GfVersion[]
  activeVersion: number
}

type RowState = 'active' | 'draft' | 'inactive'

type Row = {
  key: string
  versionId: string
  documentId: string
  version: number
  url: string
  language: string
  state: RowState
  statusText: string
}

const STATUS_CLASS: Record<RowState, string> = {
  active: 'bg-success/10 text-success dark:bg-success/20',
  draft: 'bg-warning/10 text-warning dark:bg-warning/20',
  inactive: 'bg-muted text-muted-foreground',
}

const STATUS_DOT: Record<RowState, string> = {
  active: 'bg-success',
  draft: 'bg-warning',
  inactive: 'bg-muted-foreground/60',
}

function buildRows(versions: GfVersion[], activeVersion: number, resolveLabel: (value: string) => string): Row[] {
  const sorted = [...versions].sort((a, b) => a.version - b.version)

  const rows: Row[] = []
  sorted.forEach((version, index) => {
    const documents = version.documents ?? []
    documents.forEach((doc) => {
      let state: RowState
      let statusText: string

      if (version.version === activeVersion) {
        if (version.activeSince === null) {
          throw new Error(`Governance framework version ${version.version} is active without an activation date`)
        }
        state = 'active'
        statusText =
          resolveTranslatable(
            { key: 'datalist.egf.status.activeSince', values: { date: formatDate(version.activeSince) } },
            translate
          ) ?? `Active since ${formatDate(version.activeSince)}`
      } else if (version.version > activeVersion) {
        state = 'draft'
        statusText = resolveTranslatable({ key: 'datalist.egf.status.draft' }, translate) ?? 'Draft'
      } else {
        if (version.activeSince === null) {
          throw new Error(`Governance framework version ${version.version} is inactive without an activation date`)
        }
        state = 'inactive'
        const next = sorted[index + 1]
        const fromDate = formatDate(version.activeSince)
        if (next?.activeSince) {
          statusText =
            resolveTranslatable(
              { key: 'datalist.egf.status.range', values: { from: fromDate, to: formatDate(next.activeSince) } },
              translate
            ) ?? `${fromDate} to ${formatDate(next.activeSince)}`
        } else {
          statusText =
            resolveTranslatable({ key: 'datalist.egf.status.from', values: { from: fromDate } }, translate) ??
            `From ${fromDate}`
        }
      }

      rows.push({
        key: `${version.id}-${doc.id}`,
        versionId: version.id,
        documentId: doc.id,
        version: version.version,
        url: doc.url,
        language: resolveLabel(doc.language),
        state,
        statusText,
      })
    })
  })

  const order: Record<RowState, number> = { active: 0, inactive: 1, draft: 2 }
  return rows.sort((a, b) => {
    if (order[a.state] !== order[b.state]) return order[a.state] - order[b.state]
    return b.version - a.version
  })
}

export default function EgfDocumentsTable({ versions, activeVersion }: EgfDocumentsTableProps) {
  const state = useLanguageData()
  const rows = buildRows(versions, activeVersion, (value) => getLanguageLabel(state, value))
  const [viewing, setViewing] = useState<{ versionId: string; documentId: string } | null>(null)
  const viewingVersion = viewing ? versions.find((version) => version.id === viewing.versionId) : undefined

  const versionHeader = resolveTranslatable({ key: 'datalist.egf.header.version' }, translate) ?? 'Version'
  const uriHeader = resolveTranslatable({ key: 'datalist.egf.header.uri' }, translate) ?? 'URI'
  const languageHeader = resolveTranslatable({ key: 'datalist.egf.header.language' }, translate) ?? 'Language'
  const statusHeader = resolveTranslatable({ key: 'datalist.egf.header.status' }, translate) ?? 'Status'
  const actionsHeader = resolveTranslatable({ key: 'datalist.egf.header.actions' }, translate) ?? 'Actions'
  const viewLabel = resolveTranslatable({ key: 'datalist.egf.view' }, translate) ?? 'View'

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <Th>{versionHeader}</Th>
              <Th>{uriHeader}</Th>
              <Th>{languageHeader}</Th>
              <Th>{statusHeader}</Th>
              <Th className="text-right">{actionsHeader}</Th>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const selected = viewing?.versionId === row.versionId && viewing.documentId === row.documentId
              return (
                <TableRow key={row.key} data-state={selected ? 'selected' : undefined}>
                  <TableCell className="py-3 pr-4 pl-5 whitespace-nowrap">
                    <span className="flex items-center gap-2.5 font-medium">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileTextIcon className="size-3.5" aria-hidden="true" />
                      </span>
                      {versionHeader} {row.version}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Button asChild variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-primary">
                      <a href={row.url} target="_blank" rel="noopener noreferrer" title={row.url} aria-label={row.url}>
                        <ExternalLinkIcon />
                      </a>
                    </Button>
                  </TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">{row.language}</TableCell>
                  <TableCell className="px-4 py-3 whitespace-nowrap">
                    <Badge className={cn('h-6 gap-1.5 px-2.5', STATUS_CLASS[row.state])}>
                      <span aria-hidden="true" className={cn('size-1.5 rounded-full', STATUS_DOT[row.state])} />
                      {row.statusText}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3 pr-5 pl-4 text-right whitespace-nowrap">
                    <Button
                      type="button"
                      variant={selected ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => setViewing({ versionId: row.versionId, documentId: row.documentId })}
                    >
                      <EyeIcon aria-hidden="true" />
                      {viewLabel}
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {resolveTranslatable({ key: 'datalist.egf.empty' }, translate)}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
      {viewing && viewingVersion ? (
        <BlurFade
          key={`${viewing.versionId}-${viewing.documentId}`}
          className="rounded-xl border border-border bg-card p-4 sm:p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <FileTextIcon className="size-4 text-primary" aria-hidden="true" />
              {versionHeader} {viewingVersion.version}
            </h3>
            <Button type="button" variant="ghost" size="sm" onClick={() => setViewing(null)}>
              <XIcon aria-hidden="true" />
              {resolveTranslatable({ key: 'datalist.egf.viewer.close' }, translate) ?? 'Close'}
            </Button>
          </div>
          <GfDocumentViewer documents={viewingVersion.documents} initialDocumentId={viewing.documentId} />
        </BlurFade>
      ) : null}
    </div>
  )
}

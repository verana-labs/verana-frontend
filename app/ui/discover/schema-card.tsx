'use client'

import { Code2Icon, FileJson2Icon, LogInIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import JsonCodeBlock from '@/ui/common/json-code-block'
import { type CredentialSchemaListItem, getModePillClass } from '@/ui/datatable/columnslist/cs'
import { discoverText as t } from '@/ui/discover/text'
import { Button } from '@/ui/shadcn/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/shadcn/dialog'

type SchemaCardProps = {
  credentialSchema: CredentialSchemaListItem
  joinHref?: string
}

function ModePill({ mode, suffix }: { mode: string; suffix: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide',
        getModePillClass(mode, suffix)
      )}
    >
      {mode}
    </span>
  )
}

export function SchemaCard({ credentialSchema: schema, joinHref }: SchemaCardProps) {
  const facts = [
    {
      key: 'dataview.cs.fields.issuerValidationValidityPeriod',
      value: t('dataview.cs.value.days', { n: schema.issuerValidationValidityPeriod }),
    },
    {
      key: 'dataview.cs.fields.verifierValidationValidityPeriod',
      value: t('dataview.cs.value.days', { n: schema.verifierValidationValidityPeriod }),
    },
    {
      key: 'dataview.cs.fields.issuerOnboardingMode',
      value: <ModePill mode={schema.issuerOnboardingMode} suffix="_ISSUER" />,
    },
    {
      key: 'dataview.cs.fields.verifierOnboardingMode',
      value: <ModePill mode={schema.verifierOnboardingMode} suffix="_VERIFIER" />,
    },
    ...(schema.holderOnboardingMode
      ? [
          {
            key: 'dataview.cs.fields.holderOnboardingMode',
            value: <ModePill mode={schema.holderOnboardingMode} suffix="_HOLDER" />,
          },
        ]
      : []),
  ]

  return (
    <div className="rounded-lg border bg-muted/40 p-3.5 transition-colors duration-(--duration-base) ease-standard hover:bg-muted/70 sm:p-4 dark:bg-muted/30 dark:hover:bg-muted/50">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileJson2Icon aria-hidden="true" className="size-4.5" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground" title={schema.title}>
              {schema.title}
            </h3>
            <p className="font-mono text-xs text-muted-foreground">
              {t('dataview.cs.fields.id')}: {schema.id}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {schema.jsonSchema ? (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                  <Code2Icon aria-hidden="true" />
                  {t('dataview.cs.viewJsonSchema')}
                </Button>
              </DialogTrigger>
              <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="pr-8">{schema.title}</DialogTitle>
                  <DialogDescription className="font-mono text-xs">
                    {t('dataview.cs.fields.id')}: {schema.id}
                  </DialogDescription>
                </DialogHeader>
                <div className="min-h-0 overflow-auto rounded-lg">
                  <JsonCodeBlock value={schema.jsonSchema} />
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button variant="ghost" size="sm" disabled className="text-muted-foreground">
              <Code2Icon aria-hidden="true" />
              {t('dataview.cs.viewJsonSchema')}
            </Button>
          )}
          {joinHref ? (
            <Button asChild size="sm" className="px-3">
              <Link href={joinHref}>
                <LogInIcon aria-hidden="true" />
                {t('discover.btn.join')}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-y-2 border-t pt-3 @sm/eco:grid-cols-2 @sm/eco:gap-x-4 @sm/eco:gap-y-3 @2xl/eco:grid-cols-5">
        {facts.map(({ key, value }) => (
          <div key={key} className="flex min-w-0 items-center justify-between gap-3 @sm/eco:block">
            <dt className="text-xs text-pretty text-muted-foreground">{t(key)}</dt>
            <dd className="shrink-0 text-sm font-medium text-foreground tabular-nums @sm/eco:mt-1">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

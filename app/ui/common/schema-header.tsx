'use client'

import { ReactNode } from 'react'
import { translate } from '@/i18n/dataview'
import { getModePillClass } from '@/ui/datatable/columnslist/cs'
import { resolveTranslatable } from '@/ui/dataview/types'

export type SchemaStatus = 'ACTIVE' | 'ARCHIVED'

export type SchemaHeaderProps = {
  title: string
  description?: string
  id: string | number
  status?: SchemaStatus
  issuerOnboardingMode?: string | number
  verifierOnboardingMode?: string | number
  holderOnboardingMode?: string | number
  action?: ReactNode
}

function statusPillClass(status: SchemaStatus) {
  return status === 'ARCHIVED'
    ? 'bg-destructive/10 text-destructive dark:bg-destructive/20'
    : 'bg-success/10 text-success dark:bg-success/20'
}

function ModePill({ value, suffix }: { value?: string | number; suffix: string }) {
  const raw = value !== undefined && value !== null ? String(value) : ''
  if (!raw.trim()) return null
  const klass = getModePillClass(raw, suffix)
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide ${klass}`}
    >
      {raw}
    </span>
  )
}

function HeaderRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}:</span>
      {children}
    </div>
  )
}

function OnboardingModeRow({ value, label, suffix }: { value?: string | number; label: string; suffix: string }) {
  if (value === undefined || value === '') return null
  return (
    <HeaderRow label={label}>
      <ModePill value={value} suffix={suffix} />
    </HeaderRow>
  )
}

export default function SchemaHeader({
  title,
  description,
  id,
  status,
  issuerOnboardingMode,
  verifierOnboardingMode,
  holderOnboardingMode,
  action,
}: SchemaHeaderProps) {
  return (
    <section className="mb-8">
      <div className="rounded-xl bg-card p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <h1 className="min-w-0 text-2xl font-semibold tracking-tight break-words sm:text-3xl">{title}</h1>
              {status ? (
                <span
                  className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium tracking-wide ${statusPillClass(status)}`}
                >
                  {status}
                </span>
              ) : null}
            </div>

            {description ? (
              <p className="mb-5 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">{description}</p>
            ) : null}

            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {resolveTranslatable({ key: 'dataview.cs.fields.id' }, translate) ?? 'ID'}:
                </span>
                <span className="font-mono text-sm">{id}</span>
              </div>

              <OnboardingModeRow
                value={issuerOnboardingMode}
                label={
                  resolveTranslatable({ key: 'dataview.cs.fields.issuerOnboardingMode' }, translate) ??
                  'Issuer Onboarding Mode'
                }
                suffix="_ISSUER"
              />
              <OnboardingModeRow
                value={verifierOnboardingMode}
                label={
                  resolveTranslatable({ key: 'dataview.cs.fields.verifierOnboardingMode' }, translate) ??
                  'Verifier Onboarding Mode'
                }
                suffix="_VERIFIER"
              />
              <OnboardingModeRow
                value={holderOnboardingMode}
                label={
                  resolveTranslatable({ key: 'dataview.cs.fields.holderOnboardingMode' }, translate) ??
                  'Holder Onboarding Mode'
                }
                suffix="_HOLDER"
              />
            </div>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>
    </section>
  )
}
